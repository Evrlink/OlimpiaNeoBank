import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { getPool } from "../db/pool.js";
import { finalizeDepositStatus } from "./completeDeposit.js";
import { mapBridgeTransferState } from "./mappers.js";

export class WebhookError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
  ) {
    super(message);
    this.name = "WebhookError";
  }
}

type BridgeWebhookPayload = {
  event_id?: string;
  event_category?: string;
  event_type?: string;
  event_object_id?: string;
  event_object_status?: string;
  event_object?: {
    id?: string;
    state?: string;
    client_reference_id?: string | null;
  };
};

function parseSignatureHeader(header: string | undefined): {
  timestamp: string;
  signature: string;
} | null {
  if (!header) {
    return null;
  }

  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    }),
  );

  if (!parts.t || !parts.v0) {
    return null;
  }

  return { timestamp: parts.t, signature: parts.v0 };
}

export function verifyBridgeWebhookSignature(input: {
  rawBody: string;
  signatureHeader: string | undefined;
}): void {
  // Local mock / unsigned testing when secret is unset.
  if (!env.bridgeWebhookSecret.trim()) {
    if (env.fundingProvider === "mock" || env.nodeEnv !== "production") {
      return;
    }

    throw new WebhookError("Webhook secret is not configured.", 500);
  }

  const parsed = parseSignatureHeader(input.signatureHeader);

  if (!parsed) {
    throw new WebhookError("Missing or invalid webhook signature.", 401);
  }

  const signedPayload = `${parsed.timestamp}.${input.rawBody}`;
  const expected = createHmac("sha256", env.bridgeWebhookSecret)
    .update(signedPayload)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(parsed.signature, "utf8");

  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    throw new WebhookError("Invalid webhook signature.", 401);
  }
}

async function markWebhookProcessed(
  eventId: string,
  payload: BridgeWebhookPayload,
): Promise<void> {
  const pool = getPool();

  if (!pool) {
    throw new WebhookError("Database is not configured.", 500);
  }

  await pool.query(
    `
      INSERT INTO webhook_events (provider, event_id, payload, processed_at)
      VALUES ('bridge', $1, $2::jsonb, now())
      ON CONFLICT (provider, event_id) DO UPDATE
      SET
        payload = EXCLUDED.payload,
        processed_at = now()
      WHERE webhook_events.processed_at IS NULL
    `,
    [eventId, JSON.stringify(payload)],
  );
}

export async function processBridgeWebhook(payload: BridgeWebhookPayload): Promise<{
  duplicate: boolean;
  depositId: string | null;
}> {
  const eventId = payload.event_id?.trim();

  if (!eventId) {
    throw new WebhookError("Missing event_id.");
  }

  const pool = getPool();

  if (!pool) {
    throw new WebhookError("Database is not configured.", 500);
  }

  // Only skip retries after a successful prior processing (processed_at set).
  const existing = await pool.query<{ processed_at: Date | null }>(
    `
      SELECT processed_at
      FROM webhook_events
      WHERE provider = 'bridge' AND event_id = $1
    `,
    [eventId],
  );

  if (existing.rows[0]?.processed_at) {
    return { duplicate: true, depositId: null };
  }

  const providerRef =
    payload.event_object?.id?.trim() || payload.event_object_id?.trim() || null;
  const clientReferenceId = payload.event_object?.client_reference_id?.trim() || null;
  const bridgeState =
    payload.event_object?.state?.trim() || payload.event_object_status?.trim();
  const nextStatus = mapBridgeTransferState(bridgeState);

  if (!nextStatus || (!providerRef && !clientReferenceId)) {
    // Nothing actionable — record as processed so Bridge does not retry forever.
    await markWebhookProcessed(eventId, payload);
    return { duplicate: false, depositId: null };
  }

  const depositResult = await pool.query<{ id: string }>(
    clientReferenceId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        clientReferenceId,
      )
      ? `
          SELECT id
          FROM deposits
          WHERE ($1::text IS NOT NULL AND bridge_intent_id = $1)
             OR id = $2::uuid
          LIMIT 1
        `
      : `
          SELECT id
          FROM deposits
          WHERE bridge_intent_id = $1
          LIMIT 1
        `,
    clientReferenceId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        clientReferenceId,
      )
      ? [providerRef, clientReferenceId]
      : [providerRef],
  );

  const depositId = depositResult.rows[0]?.id ?? null;

  if (depositId) {
    // Finalize first. If this throws, processed_at stays unset and Bridge can retry.
    await finalizeDepositStatus({
      depositId,
      nextStatus,
      bridgeIntentId: providerRef,
      failureReason:
        nextStatus === "failed" ? "We couldn’t complete this deposit." : null,
    });
  }

  await markWebhookProcessed(eventId, payload);

  return { duplicate: false, depositId };
}
