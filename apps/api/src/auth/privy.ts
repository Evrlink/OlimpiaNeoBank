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
      return {
        id: "id" in account && (typeof account.id === "string" || account.id === null)
          ? account.id
          : null,
        address: account.address,
      };
    }
  }

  return undefined;
}
