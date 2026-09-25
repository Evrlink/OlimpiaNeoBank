import type { BalanceSummary } from "../lib/responses.js";
import { getHomeBalanceForPrivyWallet } from "./privyBalance.js";
import { getUsdcBalanceUsdOnBase } from "./usdcBalance.js";

export async function getHomeBalanceForWallet(input: {
  moneyAddressMode: string | null;
  privyWalletId: string;
  smartWalletAddress: string | null;
}): Promise<BalanceSummary> {
  if (
    input.moneyAddressMode === "smart_wallet" &&
    input.smartWalletAddress?.trim()
  ) {
    return getUsdcBalanceUsdOnBase(input.smartWalletAddress);
  }

  return getHomeBalanceForPrivyWallet(input.privyWalletId);
}
