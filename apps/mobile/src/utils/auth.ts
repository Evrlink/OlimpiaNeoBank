import type { User } from "@privy-io/api-types";
import { getAllUserEmbeddedEthereumWallets } from "@privy-io/expo";
import { AuthSyncApiError, type AuthSyncUser } from "@/services/api/authSync";

export function hasEmbeddedEthereumWallet(user: User): boolean {
  return Boolean(getEmbeddedEthereumAddress(user));
}

export function hasPrivyEmbeddedEthereumWallet(user: unknown): boolean {
  if (!user || typeof user !== "object") {
    return false;
  }

  return getAllUserEmbeddedEthereumWallets(user as never).length > 0;
}

export function isAlreadyLoggedInError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  return (
    code === "attempted_login_with_email_while_already_logged_in" ||
    (/already logged in/i.test(message) && /useLinkWithEmail/i.test(message))
  );
}

export function isExistingEmbeddedWalletError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  return (
    /wallet already exists for this user/i.test(message) ||
    (code === "embedded_wallet_creation_error" && /already exists/i.test(message))
  );
}

export function getEmbeddedEthereumAddress(user: User | null | undefined): string | null {
  if (!user) {
    return null;
  }

  for (const account of user.linked_accounts ?? []) {
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

export function getLoginSetupErrorMessage(error: unknown): string {
  if (error instanceof AuthSyncApiError) {
    return getSyncErrorMessage(error);
  }

  return getAuthErrorMessage(error);
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
