import { apiBaseUrl } from "@/config/api";
import { AuthSyncApiError } from "@/services/api/authSync";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type ActivityStatus = "pending" | "processing" | "completed" | "failed";

export type ActivityItem = {
  id: string;
  type: string;
  amountUsd: string;
  status: ActivityStatus;
  counterpartyId: string | null;
  createdAt: string;
};

export type ActivityListResponse = {
  limit: number;
  offset: number;
  total: number;
  items: ActivityItem[];
};

const ACTIVITY_ERROR_CODES = new Set([
  "UNAUTHORIZED",
  "USER_NOT_FOUND",
  "PRIVY_UNAVAILABLE",
  "INTERNAL_ERROR",
]);

function parseActivityErrorCode(
  value: string | undefined,
): "UNAUTHORIZED" | "USER_NOT_FOUND" | "PRIVY_UNAVAILABLE" | "INTERNAL_ERROR" {
  if (value && ACTIVITY_ERROR_CODES.has(value)) {
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

function isActivityStatus(value: unknown): value is ActivityStatus {
  return (
    value === "pending" ||
    value === "processing" ||
    value === "completed" ||
    value === "failed"
  );
}

function isActivityItem(value: unknown): value is ActivityItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as ActivityItem;

  return (
    typeof item.id === "string" &&
    item.id.trim().length > 0 &&
    typeof item.type === "string" &&
    typeof item.amountUsd === "string" &&
    isActivityStatus(item.status) &&
    (item.counterpartyId === null || typeof item.counterpartyId === "string") &&
    typeof item.createdAt === "string"
  );
}

function isActivityListResponse(value: unknown): value is ActivityListResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as ActivityListResponse;

  return Array.isArray(body.items) && body.items.every(isActivityItem);
}

export async function getActivity(accessToken: string): Promise<ActivityListResponse> {
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
    response = await fetch(`${apiBaseUrl}/api/v1/activity`, {
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
      parseActivityErrorCode(errorBody.error?.code),
      getSafeErrorMessage(errorBody, "Something went wrong. Please try again."),
      response.status,
    );
  }

  if (!isActivityListResponse(body)) {
    throw new AuthSyncApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      response.status,
    );
  }

  return body;
}
