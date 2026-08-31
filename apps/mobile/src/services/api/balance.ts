import { apiBaseUrl } from "@/config/api";
import { AuthSyncApiError, type AuthSyncBalance } from "@/services/api/authSync";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

const BALANCE_ERROR_CODES = new Set([
  "UNAUTHORIZED",
  "USER_NOT_FOUND",
  "PRIVY_UNAVAILABLE",
  "INTERNAL_ERROR",
]);

function parseBalanceErrorCode(
  value: string | undefined,
): "UNAUTHORIZED" | "USER_NOT_FOUND" | "PRIVY_UNAVAILABLE" | "INTERNAL_ERROR" {
  if (value && BALANCE_ERROR_CODES.has(value)) {
    return value as
      | "UNAUTHORIZED"
      | "USER_NOT_FOUND"
      | "PRIVY_UNAVAILABLE"
      | "INTERNAL_ERROR";
  }

  return "INTERNAL_ERROR";
}

function getSafeErrorMessage(body: ApiErrorBody, fallback: string): string {
  const message = body.error?.message?.trim();
  return message || fallback;
}

function isBalanceSummary(value: unknown): value is AuthSyncBalance {
  if (!value || typeof value !== "object") {
    return false;
  }

  const balance = value as AuthSyncBalance;

  return (
    typeof balance.availableUsd === "string" &&
    typeof balance.goalsAllocatedUsd === "string" &&
    typeof balance.growthAllocatedUsd === "string" &&
    typeof balance.totalDisplayUsd === "string"
  );
}

export async function getBalance(accessToken: string): Promise<AuthSyncBalance> {
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
    response = await fetch(`${apiBaseUrl}/api/v1/balance`, {
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
        "INTERNAL_ERROR",
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
      parseBalanceErrorCode(errorBody.error?.code),
      getSafeErrorMessage(errorBody, "Something went wrong. Please try again."),
      response.status,
    );
  }

  if (!isBalanceSummary(body)) {
    throw new AuthSyncApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      response.status,
    );
  }

  return body;
}
