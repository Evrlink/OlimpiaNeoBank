export type UserProfile = {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  username: string | null;
  createdAt: string;
};

export type BalanceSummary = {
  availableUsd: string;
  goalsAllocatedUsd: string;
  growthAllocatedUsd: string;
  totalDisplayUsd: string;
};

export type ActivityStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type ActivityItem = {
  id: string;
  type: string;
  amountUsd: string;
  status: ActivityStatus;
  counterpartyId: string | null;
  createdAt: string;
};

type DbTransactionRow = {
  id: string;
  type: string;
  amount_usd: string;
  status: string;
  counterparty_id: string | null;
  created_at: Date;
};

function parseUsdAmount(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export class InvalidActivityStatusError extends Error {
  readonly status: string;

  constructor(status: string) {
    super(`Invalid activity status: ${status}`);
    this.name = "InvalidActivityStatusError";
    this.status = status;
  }
}

function parseActivityStatus(value: string): ActivityStatus {
  if (
    value === "pending" ||
    value === "processing" ||
    value === "completed" ||
    value === "failed"
  ) {
    return value;
  }

  throw new InvalidActivityStatusError(value);
}

export function toActivityItem(row: DbTransactionRow): ActivityItem {
  return {
    id: row.id,
    type: row.type,
    amountUsd: parseUsdAmount(row.amount_usd).toFixed(2),
    status: parseActivityStatus(row.status),
    counterpartyId: row.counterparty_id,
    createdAt: row.created_at.toISOString(),
  };
}

export type WalletSummary = {
  id: string;
  chain: string;
};

export type EligibilityFlags = {
  card: { available: boolean; reason?: string };
  onRamp: { available: boolean; reason?: string };
  offRamp: { available: boolean; reason?: string };
  growth: { available: boolean; reason?: string };
};

type DbUserRow = {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  username: string | null;
  created_at: Date;
};

export function toUserProfile(row: DbUserRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    displayName: row.display_name,
    username: row.username,
    createdAt: row.created_at.toISOString(),
  };
}

export const phase2Eligibility: EligibilityFlags = {
  card: { available: false, reason: "not_available_phase_2" },
  onRamp: { available: true },
  offRamp: { available: false, reason: "not_available_phase_2" },
  growth: { available: false, reason: "not_available_phase_2" },
};
