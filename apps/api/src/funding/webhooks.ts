import { getPool } from "../db/pool.js";
import { finalizeDepositStatus } from "./completeDeposit.js";
import { getOnrampOrder } from "./coinbase/client.js";
import type { DepositStatus } from "./types.js";

export class WebhookError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = "WebhookError";
  }
}

export const COINBASE_ONRAMP_EVENT_TYPES = [
  "onramp.transaction.created",
  "onramp.transaction.updated",
  "onramp.transaction.success",
  "onramp.transaction.failed",
] as const;

export type CoinbaseOnrampEventType = (typeof COINBASE_ONRAMP_EVENT_TYPES)[number];

type CoinbaseWebhookPayload = {
  id?: unknown;
  type?: unknown;
  eventType?: unknown;
  data?: unknown;
  partnerOrderRef?: unknown;
  orderId?: unknown;
  transactionId?: unknown;
  status?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function headerString(
  headers: Record<string, unknown>,
  name: string,
): string | null {
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return asString(value[0]);
  }
  return asString(value);
}

function isOnrampEventType(value: string | null): value is CoinbaseOnrampEventType {
  return (
    value === "onramp.transaction.created" ||
    value === "onramp.transaction.updated" ||
    value === "onramp.transaction.success" ||
    value === "onramp.transaction.failed"
  );
}

function extractEventType(
  payload: CoinbaseWebhookPayload,
  headers: Record<string, unknown>,
): CoinbaseOnrampEventType | null {
  const data = asRecord(payload.data);
  const candidates = [
    headerString(headers, "x-event-type"),
    asString(payload.type),
    asString(payload.eventType),
    asString(data?.type),
    asString(data?.eventType),
  ];

  for (const candidate of candidates) {
    if (isOnrampEventType(candidate)) {
      return candidate;
    }
  }

  return null;
}

function extractEventId(payload: CoinbaseWebhookPayload, headers: Record<string, unknown>): string | null {
  const data = asRecord(payload.data);
  return (
    headerString(headers, "x-event-id") ||
    asString(payload.id) ||
    asString(data?.id) ||
    asString(data?.eventId)
  );
}

function extractPartnerOrderRef(payload: CoinbaseWebhookPayload): string | null {
  const data = asRecord(payload.data);
  return (
    asString(payload.partnerOrderRef) ||
    asString(data?.partnerOrderRef) ||
    asString(data?.partner_order_ref)
  );
}

/** Primary correlation key: Coinbase Headless `orderId` (guest samples may use `transactionId`). */
function extractOrderId(payload: CoinbaseWebhookPayload): string | null {
  const data = asRecord(payload.data);
  return (
    asString(payload.orderId) ||
    asString(data?.orderId) ||
    asString(payload.transactionId) ||
    asString(data?.transactionId)
  );
}

function extractFailureReason(payload: CoinbaseWebhookPayload): string {
  const data = asRecord(payload.data);
  return (
    asString(data?.errorMessage) ||
    asString(data?.failureReason) ||
    asString(data?.status) ||
    "We couldn’t complete this deposit."
  );
}

async function claimWebhookEvent(input: {
  eventId: string;
  payload: unknown;
}): Promise<"claimed" | "duplicate" | "retry"> {
  const pool = getPool();

  if (!pool) {
    throw new WebhookError("Database is not configured.", 500);
  }

  try {
    await pool.query(
      `
        INSERT INTO webhook_events (provider, event_id, payload)
        VALUES ('coinbase', $1, $2::jsonb)
      `,
      [input.eventId, JSON.stringify(input.payload)],
    );
    return "claimed";
  } catch (error) {
    if (error instanceof Error && /webhook_events_provider_event_id_key/i.test(error.message)) {
      const existing = await pool.query<{ processed_at: Date | null }>(
        `
          SELECT processed_at
          FROM webhook_events
          WHERE provider = 'coinbase' AND event_id = $1
        `,
        [input.eventId],
      );

      if (existing.rows[0]?.processed_at) {
        return "duplicate";
      }

      return "retry";
    }

    throw error;
  }
}

async function markWebhookProcessed(eventId: string): Promise<void> {
  const pool = getPool();

  if (!pool) {
    return;
  }

  await pool.query(
    `
      UPDATE webhook_events
      SET processed_at = now()
      WHERE provider = 'coinbase' AND event_id = $1
    `,
    [eventId],
  );
}

async function resolveDepositId(input: {
  orderId: string | null;
  partnerOrderRef: string | null;
}): Promise<string | null> {
  const pool = getPool();

  if (!pool) {
    throw new WebhookError("Database is not configured.", 500);
  }

  if (input.orderId) {
    const byOrderId = await pool.query<{ id: string }>(
      `SELECT id FROM deposits WHERE provider_transaction_id = $1`,
      [input.orderId],
    );
    if (byOrderId.rows[0]) {
      return byOrderId.rows[0].id;
    }
  }

  if (input.partnerOrderRef) {
    const byId = await pool.query<{ id: string }>(
      `SELECT id FROM deposits WHERE id = $1`,
      [input.partnerOrderRef],
    );
    if (byId.rows[0]) {
      return byId.rows[0].id;
    }
  }

  return null;
}

function statusForEvent(eventType: CoinbaseOnrampEventType): DepositStatus {
  switch (eventType) {
    case "onramp.transaction.success":
      return "completed";
    case "onramp.transaction.failed":
      return "failed";
    case "onramp.transaction.created":
    case "onramp.transaction.updated":
      return "processing";
  }
}

export async function handleCoinbaseOnrampWebhook(input: {
  payload: unknown;
  headers: Record<string, unknown>;
}): Promise<{ accepted: true; ignored?: boolean }> {
  const payload = asRecord(input.payload) as CoinbaseWebhookPayload | null;

  if (!payload) {
    throw new WebhookError("Invalid Coinbase webhook payload.");
  }

  const eventType = extractEventType(payload, input.headers);

  if (!eventType) {
    return { accepted: true, ignored: true };
  }

  const orderId = extractOrderId(payload);

  const eventId =
    extractEventId(payload, input.headers) ??
    `${eventType}:${orderId ?? extractPartnerOrderRef(payload) ?? "unknown"}`;

  const claim = await claimWebhookEvent({
    eventId,
    payload,
  });

  if (claim === "duplicate") {
    return { accepted: true };
  }

  const depositId = await resolveDepositId({
    orderId,
    partnerOrderRef: extractPartnerOrderRef(payload),
  });

  if (!depositId) {
    await markWebhookProcessed(eventId);
    return { accepted: true, ignored: true };
  }

  await finalizeDepositStatus({
    depositId,
    nextStatus: statusForEvent(eventType),
    providerTransactionId: orderId,
    failureReason:
      eventType === "onramp.transaction.failed" ? extractFailureReason(payload) : null,
  });

  await markWebhookProcessed(eventId);
  return { accepted: true };
}

export async function cancelDepositForUser(input: {
  privyUserId: string;
  depositId: string;
  reason?: string;
}): Promise<void> {
  const pool = getPool();

  if (!pool) {
    throw new WebhookError("Database is not configured.", 500);
  }

  const result = await pool.query<{ id: string }>(
    `
      SELECT d.id
      FROM deposits d
      INNER JOIN users u ON u.id = d.user_id
      WHERE d.id = $1 AND u.privy_user_id = $2
    `,
    [input.depositId, input.privyUserId],
  );

  if (!result.rows[0]) {
    throw new WebhookError("Deposit not found.", 404);
  }

  await finalizeDepositStatus({
    depositId: input.depositId,
    nextStatus: "failed",
    failureReason: input.reason ?? "This deposit was cancelled.",
  });
}

export async function reconcileDepositFromCoinbase(input: {
  privyUserId: string;
  depositId: string;
}): Promise<void> {
  const pool = getPool();

  if (!pool) {
    throw new WebhookError("Database is not configured.", 500);
  }

  const result = await pool.query<{
    id: string;
    provider_transaction_id: string | null;
    status: DepositStatus;
  }>(
    `
      SELECT d.id, d.provider_transaction_id, d.status
      FROM deposits d
      INNER JOIN users u ON u.id = d.user_id
      WHERE d.id = $1 AND u.privy_user_id = $2
    `,
    [input.depositId, input.privyUserId],
  );

  const row = result.rows[0];

  if (!row) {
    throw new WebhookError("Deposit not found.", 404);
  }

  if (row.status === "completed" || row.status === "failed" || !row.provider_transaction_id) {
    return;
  }

  const order = await getOnrampOrder(row.provider_transaction_id);

  if (!order?.status) {
    return;
  }

  const orderId = asString(order.orderId) ?? row.provider_transaction_id;

  if (order.status === "ONRAMP_ORDER_STATUS_COMPLETED") {
    await finalizeDepositStatus({
      depositId: row.id,
      nextStatus: "completed",
      providerTransactionId: orderId,
    });
    return;
  }

  if (order.status === "ONRAMP_ORDER_STATUS_FAILED") {
    await finalizeDepositStatus({
      depositId: row.id,
      nextStatus: "failed",
      providerTransactionId: orderId,
      failureReason: "We couldn’t complete this deposit.",
    });
  }
}
