import {
  getHomeActivityForPrivyWallet,
  type PrivyActivityPage,
} from "./privyActivity.js";
import { getIndexedSmartWalletActivity } from "./smartWalletActivityIndexer.js";

export async function getHomeActivityForWallet(
  input: {
    userId?: string;
    walletCreatedAt?: Date;
    moneyAddressMode: string | null;
    privyWalletId: string;
    smartWalletAddress: string | null;
    limit: number;
    cursor?: string;
  },
  deps: {
    getIndexedSmartWalletActivity?: typeof getIndexedSmartWalletActivity;
    getHomeActivityForPrivyWallet?: typeof getHomeActivityForPrivyWallet;
  } = {},
): Promise<PrivyActivityPage> {
  const readSmartWalletActivity =
    deps.getIndexedSmartWalletActivity ?? getIndexedSmartWalletActivity;
  const readPrivyActivity =
    deps.getHomeActivityForPrivyWallet ?? getHomeActivityForPrivyWallet;

  if (
    input.moneyAddressMode === "smart_wallet" &&
    input.smartWalletAddress?.trim()
  ) {
    return readSmartWalletActivity({
      userId: input.userId ?? "",
      smartWalletAddress: input.smartWalletAddress,
      walletCreatedAt: input.walletCreatedAt ?? new Date(0),
      limit: input.limit,
      cursor: input.cursor,
    });
  }

  return readPrivyActivity(input.privyWalletId, input.limit, input.cursor);
}
