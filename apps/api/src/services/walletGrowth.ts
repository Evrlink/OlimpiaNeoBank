import { getGrowthForSmartWallet } from "./aaveGrowth.js";
import {
  getAaveBaseUsdcVaultMetadata,
  getGrowthForPrivyWallet,
  type GrowthSummary,
} from "./privyGrowth.js";

export async function getHomeGrowthForWallet(
  input: {
    moneyAddressMode: string | null;
    privyWalletId: string;
    smartWalletAddress: string | null;
  },
  deps: {
    getGrowthForSmartWallet?: typeof getGrowthForSmartWallet;
    getGrowthForPrivyWallet?: typeof getGrowthForPrivyWallet;
    getAaveBaseUsdcVaultMetadata?: typeof getAaveBaseUsdcVaultMetadata;
  } = {},
): Promise<GrowthSummary> {
  const readSmartWallet = deps.getGrowthForSmartWallet ?? getGrowthForSmartWallet;
  const readPrivy = deps.getGrowthForPrivyWallet ?? getGrowthForPrivyWallet;
  const readMetadata =
    deps.getAaveBaseUsdcVaultMetadata ?? getAaveBaseUsdcVaultMetadata;

  if (
    input.moneyAddressMode === "smart_wallet" &&
    input.smartWalletAddress?.trim()
  ) {
    const metadata = await readMetadata();
    return readSmartWallet(input.smartWalletAddress, metadata);
  }

  return readPrivy(input.privyWalletId);
}
