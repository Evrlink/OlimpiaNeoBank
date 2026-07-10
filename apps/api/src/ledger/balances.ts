import type pg from "pg";
import type { BalanceSummary } from "../lib/responses.js";

export type DbBalanceRow = {
  available_usd: string;
  goals_allocated_usd: string;
  growth_allocated_usd: string;
};

type Queryable = pg.Pool | pg.PoolClient;

function parseUsdAmount(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatUsd(value: number): string {
  return value.toFixed(2);
}

export function toBalanceSummary(row: DbBalanceRow): BalanceSummary {
  const availableUsd = parseUsdAmount(row.available_usd);
  const goalsAllocatedUsd = parseUsdAmount(row.goals_allocated_usd);
  const growthAllocatedUsd = parseUsdAmount(row.growth_allocated_usd);

  return {
    availableUsd: formatUsd(availableUsd),
    goalsAllocatedUsd: formatUsd(goalsAllocatedUsd),
    growthAllocatedUsd: formatUsd(growthAllocatedUsd),
    totalDisplayUsd: formatUsd(availableUsd + goalsAllocatedUsd + growthAllocatedUsd),
  };
}

export async function getBalanceSummaryForUser(
  userId: string,
  db: Queryable,
): Promise<BalanceSummary | null> {
  const result = await db.query<DbBalanceRow>(
    `
      SELECT available_usd, goals_allocated_usd, growth_allocated_usd
      FROM user_balances
      WHERE user_id = $1
    `,
    [userId],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return toBalanceSummary(row);
}
