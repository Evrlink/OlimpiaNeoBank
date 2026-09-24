import { apiBaseUrl } from "@/config/api";
import { AuthSyncApiError, type AuthSyncErrorCode } from "@/services/api/authSync";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type GrowthSummary = {
  liveApyPercent: string;
  currentRedeemableUsdc: string;
  totalDepositedUsdc: string;
  totalWithdrawnUsdc: string;
  earnedYieldUsdc: string;
  availableLiquidityUsd: string;
};

const GROWTH_ERROR_CODES = new Set<AuthSyncErrorCode>([
  "UNAUTHORIZED",
  "USER_NOT_FOUND",
  "PRIVY_UNAVAILABLE",
  "INTERNAL_ERROR",
]);

function parseGrowthErrorCode(value: string | undefined): AuthSyncErrorCode {
  if (value && GROWTH_ERROR_CODES.has(value as AuthSyncErrorCode)) {
    return value as AuthSyncErrorCode;
  }

  return "INTERNAL_ERROR";
}

function getSafeErrorMessage(body: ApiErrorBody, fallback: string): string {
  const message = body.error?.message?.trim();
  return message || fallback;
}

function isDecimalString(value: unknown, allowNegative = false): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const pattern = allowNegative ? /^-?\d+(?:\.\d+)?$/ : /^\d+(?:\.\d+)?$/;
  return pattern.test(value) && Number.isFinite(Number(value));
}

function isGrowthSummary(value: unknown): value is GrowthSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const growth = value as Record<string, unknown>;
  const expectedKeys: (keyof GrowthSummary)[] = [
    "liveApyPercent",
    "currentRedeemableUsdc",
    "totalDepositedUsdc",
    "totalWithdrawnUsdc",
    "earnedYieldUsdc",
    "availableLiquidityUsd",
  ];

  return (
    Object.keys(growth).length === expectedKeys.length &&
    expectedKeys.every((key) => Object.prototype.hasOwnProperty.call(growth, key)) &&
    isDecimalString(growth.liveApyPercent) &&
    isDecimalString(growth.currentRedeemableUsdc) &&
    isDecimalString(growth.totalDepositedUsdc) &&
    isDecimalString(growth.totalWithdrawnUsdc) &&
    isDecimalString(growth.earnedYieldUsdc, true) &&
    isDecimalString(growth.availableLiquidityUsd)
  );
}

export async function getGrowth(accessToken: string): Promise<GrowthSummary> {
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
    response = await fetch(`${apiBaseUrl}/api/v1/growth`, {
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
      parseGrowthErrorCode(errorBody.error?.code),
      getSafeErrorMessage(errorBody, "Unable to load Growth. Please try again."),
      response.status,
    );
  }

  if (!isGrowthSummary(body)) {
    throw new AuthSyncApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      response.status,
    );
  }

  return body;
}
