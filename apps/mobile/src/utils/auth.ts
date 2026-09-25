import type { User } from "@privy-io/api-types";
import { AuthSyncApiError, type AuthSyncUser } from "@/services/api/authSync";

export function hasEmbeddedEthereumWallet(user: User): boolean {
  return Boolean(getEmbeddedEthereumAddress(user));
}

export function getEmbeddedEthereumAddress(user: User | null | undefined): string | null {
  if (!user) {
    return null;
  }

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
      typeof account.address === "string" &&
      account.address.trim()
    ) {
      return account.address.trim();
    }
  }

  return null;
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function getSyncErrorMessage(error: unknown): string {
  if (error instanceof AuthSyncApiError) {
    return error.message;
  }

  return "We couldn't finish setting up your account. Please try again.";
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function getGreetingName(user: Pick<AuthSyncUser, "displayName" | "email">): string {
  const displayName = user.displayName?.trim();

  if (displayName) {
    return displayName;
  }

  const email = user.email?.trim();

  if (email) {
    const localPart = email.split("@")[0]?.trim();

    if (localPart) {
      return localPart;
    }
  }

  return "there";
}
