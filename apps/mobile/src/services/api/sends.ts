import { apiBaseUrl } from "@/config/api";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type PreparedUsdcSendCall = {
  to: string;
  data: string;
  value: "0x0";
};

export type PreparedUsdcSendPlan = {
  id: string;
  chain: "base";
  chainId: 8453;
  smartWalletAddress: string;
  destinationAddress: string;
  amountUsdc: string;
  calls: PreparedUsdcSendCall[];
  executionEnabled: boolean;
  sendAttemptedAt: string | null;
};

export type ConfirmedUsdcSend = {
  id: string;
  status: "confirmed";
  amountUsdc: string;
  destinationAddress: string;
  transactionHash: string;
};

export type SendApiErrorCode =
  | "UNAUTHORIZED"
  | "USER_NOT_FOUND"
  | "PRIVY_UNAVAILABLE"
  | "INTERNAL_ERROR"
  | "VALIDATION_ERROR"
  | "SEND_NOT_FOUND"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE";

export class SendApiError extends Error {
  readonly code: SendApiErrorCode;
  readonly status: number;

  constructor(code: SendApiErrorCode, message: string, status: number) {
    super(message);
    this.name = "SendApiError";
    this.code = code;
    this.status = status;
  }
}

const SEND_ERROR_CODES = new Set<SendApiErrorCode>([
  "UNAUTHORIZED",
  "USER_NOT_FOUND",
  "PRIVY_UNAVAILABLE",
  "INTERNAL_ERROR",
  "VALIDATION_ERROR",
  "SEND_NOT_FOUND",
  "NETWORK_ERROR",
  "INVALID_RESPONSE",
]);

function requireAccessToken(accessToken: string): string {
  const token = accessToken.trim();
  if (!token) {
    throw new SendApiError("UNAUTHORIZED", "Please sign in again.", 401);
  }
  return token;
}

function parseSendErrorCode(value: string | undefined): SendApiErrorCode {
  if (value && SEND_ERROR_CODES.has(value as SendApiErrorCode)) {
    return value as SendApiErrorCode;
  }
  return "INTERNAL_ERROR";
}

function getSafeErrorMessage(body: ApiErrorBody, fallback: string): string {
  const message = body.error?.message?.trim();
  return message || fallback;
}

function isPreparedUsdcSendPlan(value: unknown): value is PreparedUsdcSendPlan {
  if (!value || typeof value !== "object") {
    return false;
  }

  const plan = value as PreparedUsdcSendPlan;
  return (
    typeof plan.id === "string" &&
    plan.id.length > 0 &&
    plan.chain === "base" &&
    plan.chainId === 8453 &&
    typeof plan.smartWalletAddress === "string" &&
    typeof plan.destinationAddress === "string" &&
    typeof plan.amountUsdc === "string" &&
    typeof plan.executionEnabled === "boolean" &&
    (plan.sendAttemptedAt === null || typeof plan.sendAttemptedAt === "string") &&
    Array.isArray(plan.calls) &&
    plan.calls.length === 1 &&
    plan.calls.every(
      (call) =>
        typeof call.to === "string" &&
        typeof call.data === "string" &&
        call.value === "0x0",
    )
  );
}

function isConfirmedUsdcSend(value: unknown): value is ConfirmedUsdcSend {
  if (!value || typeof value !== "object") {
    return false;
  }

  const send = value as ConfirmedUsdcSend;
  return (
    typeof send.id === "string" &&
    send.status === "confirmed" &&
    typeof send.amountUsdc === "string" &&
    typeof send.destinationAddress === "string" &&
    typeof send.transactionHash === "string"
  );
}

async function postSend(
  accessToken: string,
  path: string,
  bodyValue: unknown,
  fallback: string,
): Promise<unknown> {
  const token = requireAccessToken(accessToken);
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/api/v1/sends/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyValue ?? {}),
    });
  } catch {
    throw new SendApiError(
      "NETWORK_ERROR",
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    throw new SendApiError(
      response.ok ? "INVALID_RESPONSE" : "INTERNAL_ERROR",
      response.ok ? "Received an unexpected response from the server." : fallback,
      response.status,
    );
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new SendApiError(
      parseSendErrorCode(errorBody.error?.code),
      getSafeErrorMessage(errorBody, fallback),
      response.status,
    );
  }

  return body;
}

export async function prepareSmartWalletSend(
  accessToken: string,
  amountUsdc: string,
  destinationAddress: string,
): Promise<PreparedUsdcSendPlan> {
  const body = await postSend(
    accessToken,
    "prepare",
    { amountUsdc, destinationAddress },
    "We couldn’t prepare this send.",
  );

  if (!isPreparedUsdcSendPlan(body)) {
    throw new SendApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      200,
    );
  }

  return body;
}

export async function submitSmartWalletSend(
  accessToken: string,
  sendId: string,
): Promise<PreparedUsdcSendPlan> {
  const body = await postSend(
    accessToken,
    `${sendId}/submit`,
    {},
    "We couldn’t start this send.",
  );

  if (!isPreparedUsdcSendPlan(body)) {
    throw new SendApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      200,
    );
  }

  return body;
}

export async function markSmartWalletSendSending(
  accessToken: string,
  sendId: string,
): Promise<PreparedUsdcSendPlan> {
  const body = await postSend(
    accessToken,
    `${sendId}/sending`,
    {},
    "We couldn’t lock this send.",
  );

  if (!isPreparedUsdcSendPlan(body)) {
    throw new SendApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      200,
    );
  }

  return body;
}

export async function confirmSmartWalletSend(
  accessToken: string,
  sendId: string,
  transactionHash: string,
): Promise<ConfirmedUsdcSend> {
  const body = await postSend(
    accessToken,
    `${sendId}/confirm`,
    { transactionHash },
    "We couldn’t confirm this send.",
  );

  if (!isConfirmedUsdcSend(body)) {
    throw new SendApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      200,
    );
  }

  return body;
}
