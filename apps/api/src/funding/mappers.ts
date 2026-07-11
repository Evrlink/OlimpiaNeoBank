import type { DbDepositRow, DepositRecord, DepositResponse, DepositStatus } from "./types.js";

export function formatUsd(value: number): string {
  return value.toFixed(2);
}

export function parseUsd(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toDepositRecord(row: DbDepositRow): DepositRecord {
  return {
    id: row.id,
    userId: row.user_id,
    amountUsd: formatUsd(parseUsd(row.amount_usd)),
    status: row.status,
    bridgeIntentId: row.bridge_intent_id,
    paymentMethod: row.payment_method,
    idempotencyKey: row.idempotency_key,
    failureReason: row.failure_reason,
    metadata: row.metadata ?? {},
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function toDepositResponse(
  record: DepositRecord,
  hostedUrl?: string | null,
): DepositResponse {
  const response: DepositResponse = {
    id: record.id,
    amountUsd: record.amountUsd,
    status: record.status,
  };

  const url =
    hostedUrl ??
    (typeof record.metadata.hostedUrl === "string" ? record.metadata.hostedUrl : undefined);

  if (url) {
    response.hostedUrl = url;
  }

  return response;
}

export function isTerminalDepositStatus(status: DepositStatus): boolean {
  return status === "completed" || status === "failed";
}

export function mapBridgeTransferState(state: string | undefined): DepositStatus | null {
  if (!state) {
    return null;
  }

  switch (state) {
    case "awaiting_funds":
    case "in_review":
      return "pending";
    case "funds_received":
    case "payment_submitted":
    case "in_progress":
      return "processing";
    case "payment_processed":
    case "completed":
      return "completed";
    case "canceled":
    case "cancelled":
    case "error":
    case "failed":
    case "returned":
    case "undeliverable":
      return "failed";
    default:
      return null;
  }
}
