import type pg from "pg";
import { AAVE_V3_BASE_USDC_A_TOKEN } from "./aaveAddresses.js";
import { getAusdcRawOnBase } from "./aaveGrowth.js";
import { catchUpSmartWalletActivity } from "./smartWalletActivityIndexer.js";

const RAW_PER_CENT = 10_000n;

export type GoalGrowFields = {
  growBalanceUsdc: string | null;
  remainingUsdc: string | null;
  yieldEarnedUsdc: string | null;
};

export const EMPTY_GOAL_GROW: GoalGrowFields = {
  growBalanceUsdc: null,
  remainingUsdc: null,
  yieldEarnedUsdc: null,
};

export const AUSDC_CASHFLOW_SQL = `
  SELECT
    COALESCE(SUM(CASE WHEN direction = 'out' THEN raw_amount::numeric ELSE 0 END), 0)::bigint::text AS deposited_raw,
    COALESCE(SUM(CASE WHEN direction = 'in' THEN raw_amount::numeric ELSE 0 END), 0)::bigint::text AS withdrawn_raw
  FROM smart_wallet_activity_events
  WHERE user_id = $1
    AND lower(smart_wallet_address) = lower($2)
    AND lower(counterparty_address) = lower($3)
`;

type Queryable = pg.Pool | pg.PoolClient;

type WalletRow = {
  user_id: string;
  smart_wallet_address: string | null;
  money_address_mode: string | null;
  created_at: Date | null;
};

export function rawUsdcToCents(raw: bigint): bigint {
  const negative = raw < 0n;
  const absolute = negative ? -raw : raw;
  const cents = (absolute + RAW_PER_CENT / 2n) / RAW_PER_CENT;
  return negative ? -cents : cents;
}

export function formatCents(cents: bigint): string {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const whole = absolute / 100n;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole.toString()}.${fraction}`;
}

export function targetUsdToCents(targetAmountUsd: string): bigint {
  const [whole = "0", fraction = "00"] = targetAmountUsd.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0").slice(0, 2));
}

/**
 * Progress uses the live Grow balance only.
 * Yield is balance + withdrawals - deposits, and is omitted when unreliable.
 */
export function toGoalGrowFields(input: {
  targetAmountUsd: string;
  growRaw: bigint;
  depositedRaw: bigint;
  withdrawnRaw: bigint;
  caughtUp: boolean;
}): GoalGrowFields {
  const growCents = rawUsdcToCents(input.growRaw);
  const targetCents = targetUsdToCents(input.targetAmountUsd);
  const remainingCents = targetCents > growCents ? targetCents - growCents : 0n;
  const yieldRaw = input.growRaw + input.withdrawnRaw - input.depositedRaw;

  return {
    growBalanceUsdc: formatCents(growCents),
    remainingUsdc: formatCents(remainingCents),
    yieldEarnedUsdc:
      input.caughtUp && yieldRaw >= 0n ? formatCents(rawUsdcToCents(yieldRaw)) : null,
  };
}

async function sumAusdcCashflows(
  db: Queryable,
  userId: string,
  smartWalletAddress: string,
): Promise<{ depositedRaw: bigint; withdrawnRaw: bigint }> {
  const result = await db.query<{ deposited_raw: string; withdrawn_raw: string }>(
    AUSDC_CASHFLOW_SQL,
    [userId, smartWalletAddress, AAVE_V3_BASE_USDC_A_TOKEN],
  );
  const row = result.rows[0];
  return {
    depositedRaw: BigInt(row?.deposited_raw ?? "0"),
    withdrawnRaw: BigInt(row?.withdrawn_raw ?? "0"),
  };
}

export async function readSmartWalletGoalGrow(
  privyUserId: string,
  targetAmountUsd: string,
  db: Queryable,
  deps: {
    getAusdcRaw?: typeof getAusdcRawOnBase;
    catchUp?: typeof catchUpSmartWalletActivity;
  } = {},
): Promise<GoalGrowFields> {
  const wallet = await db.query<WalletRow>(
    `
      SELECT u.id AS user_id, w.smart_wallet_address, w.money_address_mode, w.created_at
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      WHERE u.privy_user_id = $1
    `,
    [privyUserId],
  );
  const row = wallet.rows[0];
  const address = row?.smart_wallet_address?.trim() ?? "";

  if (
    !row ||
    row.money_address_mode !== "smart_wallet" ||
    !address ||
    !row.created_at
  ) {
    return EMPTY_GOAL_GROW;
  }

  const readBalance = deps.getAusdcRaw ?? getAusdcRawOnBase;
  let growRaw: bigint;
  try {
    growRaw = await readBalance(address);
  } catch {
    return EMPTY_GOAL_GROW;
  }

  let caughtUp = false;
  let depositedRaw = 0n;
  let withdrawnRaw = 0n;

  try {
    const catchUp = deps.catchUp ?? catchUpSmartWalletActivity;
    const indexed = await catchUp({
      userId: row.user_id,
      smartWalletAddress: address,
      walletCreatedAt: row.created_at,
    });
    caughtUp = indexed.caughtUp;
    if (caughtUp) {
      const cashflows = await sumAusdcCashflows(db, row.user_id, address);
      depositedRaw = cashflows.depositedRaw;
      withdrawnRaw = cashflows.withdrawnRaw;
    }
  } catch {
    caughtUp = false;
  }

  return toGoalGrowFields({
    targetAmountUsd,
    growRaw,
    depositedRaw,
    withdrawnRaw,
    caughtUp,
  });
}
