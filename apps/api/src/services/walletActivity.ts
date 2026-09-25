import {
  getHomeActivityForPrivyWallet,
  type PrivyActivityPage,
} from "./privyActivity.js";
import { getUsdcActivityOnBase } from "./usdcActivity.js";

export async function getHomeActivityForWallet(
  input: {
    moneyAddressMode: string | null;
    privyWalletId: string;
    smartWalletAddress: string | null;
    limit: number;
    cursor?: string;
  },
  deps: {
    getUsdcActivityOnBase?: typeof getUsdcActivityOnBase;
    getHomeActivityForPrivyWallet?: typeof getHomeActivityForPrivyWallet;
  } = {},
): Promise<PrivyActivityPage> {
  const readSmartWalletActivity =
    deps.getUsdcActivityOnBase ?? getUsdcActivityOnBase;
  const readPrivyActivity =
    deps.getHomeActivityForPrivyWallet ?? getHomeActivityForPrivyWallet;

  if (
    input.moneyAddressMode === "smart_wallet" &&
    input.smartWalletAddress?.trim()
  ) {
    return readSmartWalletActivity(
      input.smartWalletAddress,
      input.limit,
      input.cursor,
    );
  }

  return readPrivyActivity(input.privyWalletId, input.limit, input.cursor);
}
