export type DepositStatus = "pending" | "processing" | "completed" | "failed";

export type DepositRecord = {
  id: string;
  userId: string;
  amountUsd: string;
  status: DepositStatus;
  providerTransactionId: string | null;
  paymentMethod: string | null;
  idempotencyKey: string | null;
  failureReason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type DepositResponse = {
  id: string;
  amountUsd: string;
  status: DepositStatus;
  hostedUrl?: string;
};

export type CreateOnRampInput = {
  depositId: string;
  userId: string;
  amountUsd: string;
  paymentMethod: string;
  walletAddress: string;
  idempotencyKey: string;
  forceFail?: boolean;
};

export type CreateOnRampResult = {
  providerRef: string;
  hostedUrl?: string;
  initialStatus: Extract<DepositStatus, "pending" | "processing">;
};

export type DbDepositRow = {
  id: string;
  user_id: string;
  amount_usd: string;
  status: DepositStatus;
  provider_transaction_id: string | null;
  payment_method: string | null;
  idempotency_key: string | null;
  failure_reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  updated_at: Date;
};

/** Shared SELECT / RETURNING column list for deposits. */
export const DEPOSIT_ROW_COLUMNS = `
  id, user_id, amount_usd, status, provider_transaction_id, payment_method,
  idempotency_key, failure_reason, metadata, created_at, updated_at
`.trim();
