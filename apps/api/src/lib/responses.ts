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

type DbBalanceRow = {
  available_usd: string;
  goals_allocated_usd: string;
  growth_allocated_usd: string;
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

function formatUsd(value: string | number): string {
  return Number(value).toFixed(2);
}

export function toBalanceSummary(row: DbBalanceRow): BalanceSummary {
  const availableUsd = formatUsd(row.available_usd);
  const goalsAllocatedUsd = formatUsd(row.goals_allocated_usd);
  const growthAllocatedUsd = formatUsd(row.growth_allocated_usd);
  const totalDisplayUsd = formatUsd(
    Number(row.available_usd) +
      Number(row.goals_allocated_usd) +
      Number(row.growth_allocated_usd),
  );

  return {
    availableUsd,
    goalsAllocatedUsd,
    growthAllocatedUsd,
    totalDisplayUsd,
  };
}

export const phase2Eligibility: EligibilityFlags = {
  card: { available: false, reason: "not_available_phase_2" },
  onRamp: { available: false, reason: "not_available_phase_2" },
  offRamp: { available: false, reason: "not_available_phase_2" },
  growth: { available: false, reason: "not_available_phase_2" },
};
