import { apiBaseUrl } from "@/config/api";
import { AuthSyncApiError, type AuthSyncErrorCode } from "@/services/api/authSync";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type SavingsGoalWrite = {
  name: string;
  targetAmountUsd: string;
};

export type SavingsGoal = SavingsGoalWrite & {
  growBalanceUsdc: string | null;
  remainingUsdc: string | null;
  yieldEarnedUsdc: string | null;
};

type GoalResponse = {
  goal: SavingsGoal | null;
};

function parseGoalErrorCode(value: string | undefined): AuthSyncErrorCode {
  if (
    value === "UNAUTHORIZED" ||
    value === "USER_NOT_FOUND" ||
    value === "INTERNAL_ERROR"
  ) {
    return value;
  }

  return "INTERNAL_ERROR";
}

function getSafeErrorMessage(body: ApiErrorBody, fallback: string): string {
  const message = body.error?.message?.trim();
  return message || fallback;
}

function decimalOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d+\.\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

function isSavingsGoal(value: unknown): value is SavingsGoal {
  if (!value || typeof value !== "object") {
    return false;
  }

  const goal = value as Partial<SavingsGoal>;
  if (typeof goal.name !== "string" || typeof goal.targetAmountUsd !== "string") {
    return false;
  }

  goal.growBalanceUsdc = decimalOrNull(goal.growBalanceUsdc);
  goal.remainingUsdc = decimalOrNull(goal.remainingUsdc);
  goal.yieldEarnedUsdc = decimalOrNull(goal.yieldEarnedUsdc);
  return true;
}

function isGoalResponse(value: unknown): value is GoalResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const body = value as GoalResponse;
  return body.goal === null || isSavingsGoal(body.goal);
}

async function requestGoal(
  accessToken: string,
  method: "GET" | "PUT",
  body?: SavingsGoalWrite,
): Promise<SavingsGoal | null> {
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
    response = await fetch(`${apiBaseUrl}/api/v1/goal`, {
      method,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
        ...(method === "PUT" ? { "Content-Type": "application/json" } : {}),
      },
      body: method === "PUT" ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new AuthSyncApiError(
      "NETWORK_ERROR",
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }

  let parsed: unknown = null;

  try {
    parsed = await response.json();
  } catch {
    throw new AuthSyncApiError(
      "INTERNAL_ERROR",
      method === "GET" ? "Unable to load your goal." : "Unable to save your goal.",
      response.status,
    );
  }

  if (!response.ok) {
    const errorBody = parsed as ApiErrorBody;
    throw new AuthSyncApiError(
      parseGoalErrorCode(errorBody.error?.code),
      getSafeErrorMessage(
        errorBody,
        method === "GET" ? "Unable to load your goal." : "Unable to save your goal.",
      ),
      response.status,
    );
  }

  if (!isGoalResponse(parsed)) {
    throw new AuthSyncApiError(
      "INTERNAL_ERROR",
      method === "GET" ? "Unable to load your goal." : "Unable to save your goal.",
      response.status,
    );
  }

  return parsed.goal;
}

export function getGoal(accessToken: string): Promise<SavingsGoal | null> {
  return requestGoal(accessToken, "GET");
}

export function saveGoal(
  accessToken: string,
  goal: SavingsGoalWrite,
): Promise<SavingsGoal | null> {
  return requestGoal(accessToken, "PUT", goal);
}
