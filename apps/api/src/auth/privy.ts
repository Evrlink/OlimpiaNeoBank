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
