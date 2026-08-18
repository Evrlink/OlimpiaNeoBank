import { getPrivyClient } from "../auth/privy.js";
import type { BalanceSummary } from "../lib/responses.js";

export type PrivyUsdcBalance = {
  rawValue: string;
  decimals: number;
  displayUsd: string | null;
  chain: string;
  asset: string;
};

/**
 * Fetch USDC balance on Base for a Privy embedded wallet.
 * Prep helper for wiring Home balance off ledger-only state.
 */
export async function getPrivyUsdcBalanceOnBase(
  privyWalletId: string,
): Promise<PrivyUsdcBalance | null> {
  const client = getPrivyClient();
  const response = await client.wallets().balance.get(privyWalletId, {
    asset: "usdc",
    chain: "base",
    include_currency: "usd",
  });

  const match = response.balances.find(
    (entry) => entry.asset === "usdc" && entry.chain === "base",
  );

  if (!match) {
    return null;
  }

  return {
    rawValue: match.raw_value,
    decimals: match.raw_value_decimals,
    displayUsd: match.display_values?.usd ?? match.display_values?.USD ?? null,
    chain: match.chain,
    asset: match.asset,
  };
}

function formatUsd(value: number): string {
  return value.toFixed(2);
}

/** Map Privy Base USDC into the Home balance shape. Growth/goals stay 0 until wired. */
export function toHomeBalanceSummaryFromPrivy(
  balance: PrivyUsdcBalance | null,
): BalanceSummary {
  let available = 0;

  if (balance) {
    if (balance.displayUsd != null && balance.displayUsd.trim() !== "") {
      const fromDisplay = Number(balance.displayUsd);
      if (Number.isFinite(fromDisplay)) {
        available = fromDisplay;
      }
    } else {
      const raw = Number(balance.rawValue);
      if (Number.isFinite(raw) && balance.decimals >= 0) {
        available = raw / 10 ** balance.decimals;
      }
    }
  }

  const availableUsd = formatUsd(available);

  return {
    availableUsd,
    goalsAllocatedUsd: "0.00",
    growthAllocatedUsd: "0.00",
    totalDisplayUsd: availableUsd,
  };
}

/** V1 Home balance: Privy USDC on Base only (not the Olimpia ledger). */
export async function getHomeBalanceForPrivyWallet(
  privyWalletId: string,
): Promise<BalanceSummary> {
  const usdc = await getPrivyUsdcBalanceOnBase(privyWalletId);
  return toHomeBalanceSummaryFromPrivy(usdc);
}
