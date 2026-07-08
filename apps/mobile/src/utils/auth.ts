import type { User } from "@privy-io/api-types";
import { AuthSyncApiError } from "@/services/api/authSync";

type LinkedAccount = User["linked_accounts"][number];

export function hasEmbeddedEthereumWallet(user: User): boolean {
  return user.linked_accounts.some((account: LinkedAccount) => {
    if (account.type !== "wallet") {
      return false;
    }

    return (
      "chain_type" in account &&
      account.chain_type === "ethereum" &&
      "wallet_client_type" in account &&
      account.wallet_client_type === "privy"
    );
  });
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
