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
  onRamp: { available: false, reason: "not_available_phase_2" },
  offRamp: { available: false, reason: "not_available_phase_2" },
  growth: { available: false, reason: "not_available_phase_2" },
};
