export type MoneyAddressMode = "eoa" | "smart_wallet";

export function resolveInsertMoneyAddressMode(
  isNewUser: boolean,
  hasSmartWallet: boolean,
): MoneyAddressMode {
  return isNewUser && hasSmartWallet ? "smart_wallet" : "eoa";
}

export function toPublicMoneyAddress(input: {
  moneyAddressMode: string | null;
  eoaAddress: string;
  smartWalletAddress: string | null;
}): string {
  const eoa = input.eoaAddress.trim();
  const smartWallet = input.smartWalletAddress?.trim() ?? "";

  if (
    input.moneyAddressMode === "smart_wallet" &&
    smartWallet &&
    smartWallet.toLowerCase() !== eoa.toLowerCase()
  ) {
    return smartWallet;
  }

  return eoa;
}
