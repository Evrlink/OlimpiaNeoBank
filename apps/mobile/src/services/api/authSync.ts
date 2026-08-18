import { apiBaseUrl } from "@/config/api";

export type AuthSyncUser = {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  username: string | null;
  createdAt: string;
};

export type AuthSyncWallet = {
  id: string;
  chain: string;
  address: string;
  privyWalletId: string | null;
};

export type AuthSyncBalance = {
  availableUsd: string;
  goalsAllocatedUsd: string;
  growthAllocatedUsd: string;
  totalDisplayUsd: string;
};

export type AuthSyncResponse = {
  user: AuthSyncUser;
  wallet: AuthSyncWallet;
  balance: AuthSyncBalance;
  isNewUser: boolean;
};

export type AuthSyncErrorCode =
  | "UNAUTHORIZED"
  | "USER_NOT_FOUND"
  | "SYNC_FAILED"
  | "PRIVY_UNAVAILABLE"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class AuthSyncApiError extends Error {
  readonly code: AuthSyncErrorCode;
  readonly status: number;

  constructor(code: AuthSyncErrorCode, message: string, status: number) {
    super(message);
    this.name = "AuthSyncApiError";
    this.code = code;
    this.status = status;
  }
}

const AUTH_SYNC_ERROR_CODES = new Set<AuthSyncErrorCode>([
  "UNAUTHORIZED",
  "USER_NOT_FOUND",
  "SYNC_FAILED",
  "PRIVY_UNAVAILABLE",
  "INTERNAL_ERROR",
]);

function parseApiErrorCode(value: string | undefined): AuthSyncErrorCode {
  if (value && AUTH_SYNC_ERROR_CODES.has(value as AuthSyncErrorCode)) {
    return value as AuthSyncErrorCode;
  }

  return "SYNC_FAILED";
}

function getSafeErrorMessage(body: ApiErrorBody, fallback: string): string {
  const message = body.error?.message?.trim();
  return message || fallback;
}

export async function syncAccount(accessToken: string): Promise<AuthSyncResponse> {
  const token = accessToken.trim();

  if (!token) {
    throw new AuthSyncApiError(
      "UNAUTHORIZED",
      "Missing or invalid authorization header.",
      401,
    );
  }

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/api/v1/auth/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
  } catch {
    throw new AuthSyncApiError(
      "NETWORK_ERROR",
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    if (!response.ok) {
      throw new AuthSyncApiError(
        "SYNC_FAILED",
        "Something went wrong. Please try again.",
        response.status,
      );
    }

    throw new AuthSyncApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      response.status,
    );
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new AuthSyncApiError(
      parseApiErrorCode(errorBody.error?.code),
      getSafeErrorMessage(errorBody, "Something went wrong. Please try again."),
      response.status,
    );
  }

  const successBody = body as AuthSyncResponse;

  if (
    !successBody.user ||
    !successBody.wallet ||
    typeof successBody.wallet.address !== "string" ||
    !successBody.balance ||
    typeof successBody.isNewUser !== "boolean"
  ) {
    throw new AuthSyncApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      response.status,
    );
  }

  return successBody;
}
