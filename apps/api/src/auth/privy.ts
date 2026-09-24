import { PrivyClient, type User } from "@privy-io/node";
import { env, requirePrivyConfig } from "../config/env.js";

type EmbeddedEthereumWalletAccount = {
  id: string | null;
  address: string;
};

let privyClient: PrivyClient | null = null;

export function getPrivyClient(): PrivyClient {
  requirePrivyConfig();

  if (!privyClient) {
    privyClient = new PrivyClient({
      appId: env.privyAppId,
      appSecret: env.privyAppSecret,
    });
  }

  return privyClient;
}

export async function verifyPrivyAccessToken(accessToken: string) {
  const client = getPrivyClient();
  return client.utils().auth().verifyAccessToken(accessToken);
}

export async function fetchPrivyUser(privyUserId: string): Promise<User> {
  const client = getPrivyClient();
  return client.users()._get(privyUserId);
}

export function extractEmail(user: User): string | null {
  for (const account of user.linked_accounts) {
    if (account.type === "email") {
      return account.address;
    }
  }

  return null;
}

export function extractPhone(user: User): string | null {
  for (const account of user.linked_accounts) {
    if (account.type === "phone") {
      return account.phoneNumber ?? account.number ?? null;
    }
  }

  return null;
}

export type SmartWalletIdentity = {
  address: string;
  type: string;
};

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

function readAddress(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const address = value.trim();
  return ADDRESS_PATTERN.test(address) ? address : null;
}

function readSmartWalletType(account: Record<string, unknown>): string | null {
  const candidates = [account.smart_wallet_type, account.type];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const normalized = candidate.trim().toLowerCase();
    if (SMART_WALLET_TYPES.has(normalized) && normalized !== "smart_wallet") {
      return normalized;
    }
  }

  if (account.type === "smart_wallet") {
    return "smart_wallet";
  }

  return null;
}

/**
 * Read a Privy-linked smart wallet without treating it as the embedded EOA.
 * Returns null when missing, malformed, or equal to the EOA money address.
 */
export function extractSmartWalletIdentity(
  user: { linked_accounts: readonly unknown[] },
  embeddedAddress: string,
): SmartWalletIdentity | null {
  const embedded = embeddedAddress.trim().toLowerCase();

  for (const account of user.linked_accounts) {
    if (!isRecord(account) || typeof account.type !== "string") {
      continue;
    }

    const accountType = account.type.trim().toLowerCase();
    if (!SMART_WALLET_TYPES.has(accountType) && accountType !== "smart_wallet") {
      continue;
    }

    if (accountType === "wallet") {
      continue;
    }

    const address = readAddress(account.address);
    if (!address) {
      continue;
    }

    if (address.toLowerCase() === embedded) {
      continue;
    }

    const type = readSmartWalletType(account);
    if (!type) {
      continue;
    }

    return { address, type };
  }

  return null;
}

export function extractEmbeddedEthereumWallet(
  user: User,
): EmbeddedEthereumWalletAccount | undefined {
  for (const account of user.linked_accounts) {
    if (account.type !== "wallet") {
      continue;
    }

    if (
      "chain_type" in account &&
      account.chain_type === "ethereum" &&
      "wallet_client_type" in account &&
      account.wallet_client_type === "privy" &&
      "address" in account &&
      typeof account.address === "string"
    ) {
      const rawId =
        "id" in account && typeof account.id === "string" ? account.id.trim() : "";

      return {
        id: rawId.length > 0 ? rawId : null,
        address: account.address,
      };
    }
  }

  return undefined;
}

/**
 * When linked_accounts omit wallet id, resolve it from Privy's wallets API.
 * Prefer address match; fall back to user_id filter.
 */
export async function resolvePrivyWalletId(input: {
  privyUserId: string;
  address: string;
}): Promise<string | null> {
  const client = getPrivyClient();
  const normalizedAddress = input.address.trim().toLowerCase();

  try {
    const byAddress = await client.wallets().list({
      address: input.address,
      chain_type: "ethereum",
    });

    for await (const wallet of byAddress) {
      if (wallet.address?.trim().toLowerCase() === normalizedAddress) {
        return wallet.id;
      }
    }
  } catch {
    // Fall through to user_id lookup.
  }

  try {
    const byUser = await client.wallets().list({
      user_id: input.privyUserId,
      chain_type: "ethereum",
    });

    for await (const wallet of byUser) {
      if (wallet.address?.trim().toLowerCase() === normalizedAddress) {
        return wallet.id;
      }
    }
  } catch {
    return null;
  }

  return null;
}
