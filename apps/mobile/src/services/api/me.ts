import { apiBaseUrl } from "@/config/api";
import {
  AuthSyncApiError,
  type AuthSyncBalance,
  type AuthSyncResponse,
  type AuthSyncUser,
} from "@/services/api/authSync";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type MeResponse = {
  user: AuthSyncUser;
  balance: AuthSyncBalance;
};

const ME_ERROR_CODES = new Set([
  "UNAUTHORIZED",
  "USER_NOT_FOUND",
  "SYNC_FAILED",
  "PRIVY_UNAVAILABLE",
  "INTERNAL_ERROR",
]);

function parseMeErrorCode(value: string | undefined): "UNAUTHORIZED" | "USER_NOT_FOUND" | "SYNC_FAILED" | "INTERNAL_ERROR" {
  if (value && ME_ERROR_CODES.has(value)) {
    return value as "UNAUTHORIZED" | "USER_NOT_FOUND" | "SYNC_FAILED" | "INTERNAL_ERROR";
  }

  return "SYNC_FAILED";
}

function getSafeErrorMessage(body: ApiErrorBody, fallback: string): string {
  const message = body.error?.message?.trim();
  return message || fallback;
}

export function meResponseToAuthSync(me: MeResponse): AuthSyncResponse {
  return {
    user: me.user,
    balance: me.balance,
    wallet: {
      id: "",
      chain: "",
    },
    isNewUser: false,
  };
}

export async function getMe(accessToken: string): Promise<MeResponse> {
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
    response = await fetch(`${apiBaseUrl}/api/v1/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
      parseMeErrorCode(errorBody.error?.code),
      getSafeErrorMessage(errorBody, "Something went wrong. Please try again."),
      response.status,
    );
  }

  const successBody = body as MeResponse;

  if (!successBody.user || !successBody.balance) {
    throw new AuthSyncApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      response.status,
    );
  }

  return successBody;
}
