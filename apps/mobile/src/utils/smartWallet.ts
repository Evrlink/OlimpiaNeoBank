const SMART_WALLET_TYPES = new Set([
  "smart_wallet",
  "coinbase_smart_wallet",
  "safe",
  "kernel",
  "light_account",
  "biconomy",
  "thirdweb",
]);

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function findLinkedSmartWalletAddress(
  linkedAccounts: readonly unknown[] | undefined,
  embeddedAddress: string,
): string | null {
  const embedded = embeddedAddress.trim().toLowerCase();

  for (const account of linkedAccounts ?? []) {
    if (!isRecord(account) || typeof account.type !== "string") {
      continue;
    }

    const accountType = account.type.trim().toLowerCase();
    if (!SMART_WALLET_TYPES.has(accountType)) {
      continue;
    }

    if (typeof account.address !== "string" || !ADDRESS_PATTERN.test(account.address.trim())) {
      continue;
    }

    const address = account.address.trim();
    if (address.toLowerCase() === embedded) {
      continue;
    }

    return address;
  }

  return null;
}

export async function waitForLinkedSmartWallet(input: {
  getLinkedAccounts: () => readonly unknown[] | undefined;
  embeddedAddress: string;
  timeoutMs?: number;
  intervalMs?: number;
}): Promise<string | null> {
  const timeoutMs = input.timeoutMs ?? 8000;
  const intervalMs = input.intervalMs ?? 300;
  const started = Date.now();

  while (Date.now() - started <= timeoutMs) {
    const address = findLinkedSmartWalletAddress(
      input.getLinkedAccounts(),
      input.embeddedAddress,
    );
    if (address) {
      return address;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return findLinkedSmartWalletAddress(input.getLinkedAccounts(), input.embeddedAddress);
}