import { getPool } from "../db/pool.js";
import { finalizeDepositStatus } from "./completeDeposit.js";
import { getOnrampOrder } from "./coinbase/client.js";
import { signedWebhookHeaderNames } from "./coinbase/signature.js";
import { formatUsd, parseUsd } from "./mappers.js";
import {
  confirmOrderBeforeLedgerCredit,
  type OrderCreditDecision,
} from "./orderVerification.js";
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

function signatureHeaderFrom(headers: Record<string, unknown>): string | undefined {
  return headerString(headers, "x-hook0-signature") ?? undefined;
}

function extractEventType(
  payload: CoinbaseWebhookPayload,
  headers: Record<string, unknown>,
  signedHeaders: Set<string>,
): CoinbaseOnrampEventType | null {
  const data = asRecord(payload.data);
  const signedEventType = signedHeaders.has("x-event-type")
    ? headerString(headers, "x-event-type")
    : null;
  const candidates = [
    signedEventType,
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

function extractEventId(
  payload: CoinbaseWebhookPayload,
  headers: Record<string, unknown>,
  signedHeaders: Set<string>,
): string | null {
  const data = asRecord(payload.data);
  const signedEventId = signedHeaders.has("x-event-id")
    ? headerString(headers, "x-event-id")
    : null;
  return (
    signedEventId ||
    asString(payload.id) ||
    asString(data?.id) ||
    asString(data?.eventId)
  );
}

/** Event type/id from the signed body, or from headers listed in the v1 `h` set. */
export function resolveSignedOnrampEvent(
  payload: unknown,
  headers: Record<string, unknown>,
): {
  eventType: CoinbaseOnrampEventType | null;
  eventId: string | null;
} {
  const record = asRecord(payload) as CoinbaseWebhookPayload | null;
  if (!record) {
    return { eventType: null, eventId: null };
  }

  const signedHeaders = signedWebhookHeaderNames(signatureHeaderFrom(headers));
  return {
    eventType: extractEventType(record, headers, signedHeaders),
    eventId: extractEventId(record, headers, signedHeaders),
  };
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

async function loadDepositSettlementContext(depositId: string): Promise<{
  amountUsd: string;
  walletAddress: string;
  providerTransactionId: string | null;
} | null> {
  const pool = getPool();

  if (!pool) {
    throw new WebhookError("Database is not configured.", 500);
  }

  const result = await pool.query<{
    amount_usd: string;
    address: string;
    provider_transaction_id: string | null;
  }>(
    `
      SELECT d.amount_usd, d.provider_transaction_id, w.address
      FROM deposits d
      INNER JOIN wallets w ON w.user_id = d.user_id
      WHERE d.id = $1
    `,
    [depositId],
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    amountUsd: formatUsd(parseUsd(row.amount_usd)),
    walletAddress: row.address,
    providerTransactionId: row.provider_transaction_id,
  };
}

async function applyOrderDecision(input: {
  depositId: string;
  fallbackOrderId: string | null;
  decision: OrderCreditDecision;
}): Promise<"applied" | "ignored"> {
  if (input.decision.decision === "retry") {
    throw new WebhookError(input.decision.reason, 500);
  }

  if (input.decision.decision === "credit") {
    await finalizeDepositStatus({
      depositId: input.depositId,
      nextStatus: "completed",
      providerTransactionId: input.decision.orderId || input.fallbackOrderId,
    });
    return "applied";
  }

  if (input.decision.decision === "fail") {
    await finalizeDepositStatus({
      depositId: input.depositId,
      nextStatus: "failed",
      providerTransactionId: input.decision.orderId || input.fallbackOrderId,
      failureReason: input.decision.reason,
    });
    return "applied";
  }

  return "ignored";
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

export function shouldFetchOrderBeforeCredit(
  eventType: CoinbaseOnrampEventType,
): boolean {
  return statusForEvent(eventType) === "completed";
}

export async function handleCoinbaseOnrampWebhook(input: {
  payload: unknown;
  headers: Record<string, unknown>;
  fetchOrder?: typeof getOnrampOrder;
}): Promise<{ accepted: true; ignored?: boolean }> {
  const payload = asRecord(input.payload) as CoinbaseWebhookPayload | null;

  if (!payload) {
    throw new WebhookError("Invalid Coinbase webhook payload.");
  }

  const signedEvent = resolveSignedOnrampEvent(payload, input.headers);
  const eventType = signedEvent.eventType;

  if (!eventType) {
    return { accepted: true, ignored: true };
  }

  const orderId = extractOrderId(payload);

  const eventId =
    signedEvent.eventId ??
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

  const nextStatus = statusForEvent(eventType);

  if (nextStatus === "completed") {
    const context = await loadDepositSettlementContext(depositId);
    const lookupOrderId = orderId ?? context?.providerTransactionId ?? null;

    if (!context || !lookupOrderId) {
      throw new WebhookError(
        "Coinbase order must be fetched before crediting a deposit.",
        500,
      );
    }

    const decision = await confirmOrderBeforeLedgerCredit(
      {
        orderId: lookupOrderId,
        depositAmountUsd: context.amountUsd,
        destinationAddress: context.walletAddress,
      },
      input.fetchOrder ?? getOnrampOrder,
    );

    const applied = await applyOrderDecision({
      depositId,
      fallbackOrderId: lookupOrderId,
      decision,
    });

    await markWebhookProcessed(eventId);
    return applied === "ignored" ? { accepted: true, ignored: true } : { accepted: true };
  }

  await finalizeDepositStatus({
    depositId,
    nextStatus,
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

  const context = await loadDepositSettlementContext(row.id);

  if (!context) {
    return;
  }

  const decision = await confirmOrderBeforeLedgerCredit({
    orderId: row.provider_transaction_id,
    depositAmountUsd: context.amountUsd,
    destinationAddress: context.walletAddress,
  });

  if (decision.decision === "retry") {
    return;
  }

  await applyOrderDecision({
    depositId: row.id,
    fallbackOrderId: row.provider_transaction_id,
    decision,
  });
}
