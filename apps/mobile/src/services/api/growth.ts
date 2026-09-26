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

export type PreparedGrowthAuthorization = {
  id: string;
  status: "unused";
  amountUsdc: string;
  walletAddress: string;
  chain: "base";
  asset: "usdc";
  expiresAt: string;
  payload: string;
};

export type ConfirmedGrowthAuthorization = {
  id: string;
  status: "authorized";
  amountUsdc: string;
  walletAddress: string;
  chain: "base";
  asset: "usdc";
  expiresAt: string;
};

export type PreparedAaveDepositCall = {
  to: string;
  data: string;
  value: "0x0";
};

export type PreparedAaveDepositPlan = {
  id: string;
  chain: "base";
  chainId: 8453;
  smartWalletAddress: string;
  amountUsdc: string;
  calls: PreparedAaveDepositCall[];
  executionEnabled: boolean;
};

export type ConfirmedAaveDeposit = {
  id: string;
  status: "confirmed";
  amountUsdc: string;
  transactionHash: string;
};

export type GrowthAuthorizationErrorCode =
  | AuthSyncErrorCode
  | "VALIDATION_ERROR"
  | "AUTHORIZATION_NOT_FOUND";

export class GrowthAuthorizationApiError extends Error {
  readonly code: GrowthAuthorizationErrorCode;
  readonly status: number;

  constructor(code: GrowthAuthorizationErrorCode, message: string, status: number) {
    super(message);
    this.name = "GrowthAuthorizationApiError";
    this.code = code;
    this.status = status;
  }
}

const GROWTH_ERROR_CODES = new Set<AuthSyncErrorCode>([
  "UNAUTHORIZED",
  "USER_NOT_FOUND",
  "PRIVY_UNAVAILABLE",
  "INTERNAL_ERROR",
]);

const AUTHORIZATION_ERROR_CODES = new Set<GrowthAuthorizationErrorCode>([
  ...GROWTH_ERROR_CODES,
  "VALIDATION_ERROR",
  "AUTHORIZATION_NOT_FOUND",
  "NETWORK_ERROR",
  "INVALID_RESPONSE",
]);

function parseGrowthErrorCode(value: string | undefined): AuthSyncErrorCode {
  if (value && GROWTH_ERROR_CODES.has(value as AuthSyncErrorCode)) {
    return value as AuthSyncErrorCode;
  }

  return "INTERNAL_ERROR";
}

function parseAuthorizationErrorCode(
  value: string | undefined,
): GrowthAuthorizationErrorCode {
  if (value && AUTHORIZATION_ERROR_CODES.has(value as GrowthAuthorizationErrorCode)) {
    return value as GrowthAuthorizationErrorCode;
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

function isIsoDateString(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isPayloadHex(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0;
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

function isPreparedGrowthAuthorization(
  value: unknown,
): value is PreparedGrowthAuthorization {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prepared = value as Record<string, unknown>;
  return (
    typeof prepared.id === "string" &&
    prepared.id.trim().length > 0 &&
    prepared.status === "unused" &&
    isDecimalString(prepared.amountUsdc) &&
    Number(prepared.amountUsdc) > 0 &&
    typeof prepared.walletAddress === "string" &&
    prepared.chain === "base" &&
    prepared.asset === "usdc" &&
    isIsoDateString(prepared.expiresAt) &&
    isPayloadHex(prepared.payload)
  );
}

function isConfirmedGrowthAuthorization(
  value: unknown,
): value is ConfirmedGrowthAuthorization {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const confirmed = value as Record<string, unknown>;
  return (
    typeof confirmed.id === "string" &&
    confirmed.id.trim().length > 0 &&
    confirmed.status === "authorized" &&
    isDecimalString(confirmed.amountUsdc) &&
    Number(confirmed.amountUsdc) > 0 &&
    typeof confirmed.walletAddress === "string" &&
    confirmed.chain === "base" &&
    confirmed.asset === "usdc" &&
    isIsoDateString(confirmed.expiresAt) &&
    !Object.prototype.hasOwnProperty.call(confirmed, "payload")
  );
}

function requireAccessToken(
  accessToken: string,
  asAuthorizationError = false,
): string {
  const token = accessToken.trim();

  if (!token) {
    if (asAuthorizationError) {
      throw new GrowthAuthorizationApiError(
        "UNAUTHORIZED",
        "Missing or invalid authorization header.",
        401,
      );
    }

    throw new AuthSyncApiError(
      "UNAUTHORIZED",
      "Missing or invalid authorization header.",
      401,
    );
  }

  return token;
}

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
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
}

export function payloadHexToBytes(payloadHex: string): Uint8Array {
  if (!isPayloadHex(payloadHex)) {
    throw new GrowthAuthorizationApiError(
      "INVALID_RESPONSE",
      "Unable to authorize this amount. Please try again.",
      0,
    );
  }

  const bytes = new Uint8Array(payloadHex.length / 2);

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(payloadHex.slice(index * 2, index * 2 + 2), 16);
  }

  return bytes;
}

export async function getGrowth(accessToken: string): Promise<GrowthSummary> {
  const token = requireAccessToken(accessToken);
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

  const body = await readJsonBody(response);

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

export async function prepareGrowthAuthorization(
  accessToken: string,
  amountUsdc: string,
): Promise<PreparedGrowthAuthorization> {
  const token = requireAccessToken(accessToken, true);
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/api/v1/growth/deposit-authorizations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amountUsdc }),
    });
  } catch {
    throw new GrowthAuthorizationApiError(
      "NETWORK_ERROR",
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    throw new GrowthAuthorizationApiError(
      response.ok ? "INVALID_RESPONSE" : "INTERNAL_ERROR",
      response.ok
        ? "Received an unexpected response from the server."
        : "We couldn’t prepare this authorization.",
      response.status,
    );
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new GrowthAuthorizationApiError(
      parseAuthorizationErrorCode(errorBody.error?.code),
      getSafeErrorMessage(errorBody, "We couldn’t prepare this authorization."),
      response.status,
    );
  }

  if (!isPreparedGrowthAuthorization(body)) {
    throw new GrowthAuthorizationApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      response.status,
    );
  }

  return body;
}

export async function confirmGrowthAuthorization(
  accessToken: string,
  authorizationId: string,
  signature: string,
): Promise<ConfirmedGrowthAuthorization> {
  const token = requireAccessToken(accessToken, true);
  const id = authorizationId.trim();

  if (!id) {
    throw new GrowthAuthorizationApiError(
      "AUTHORIZATION_NOT_FOUND",
      "Authorization not found.",
      404,
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiBaseUrl}/api/v1/growth/deposit-authorizations/${encodeURIComponent(id)}/confirm`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signature }),
      },
    );
  } catch {
    throw new GrowthAuthorizationApiError(
      "NETWORK_ERROR",
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    throw new GrowthAuthorizationApiError(
      response.ok ? "INVALID_RESPONSE" : "INTERNAL_ERROR",
      response.ok
        ? "Received an unexpected response from the server."
        : "We couldn’t confirm this authorization.",
      response.status,
    );
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new GrowthAuthorizationApiError(
      parseAuthorizationErrorCode(errorBody.error?.code),
      getSafeErrorMessage(
        errorBody,
        errorBody.error?.code === "VALIDATION_ERROR" &&
          errorBody.error?.message?.includes("expired")
          ? "This authorization expired. Enter the amount again."
          : "We couldn’t confirm this authorization.",
      ),
      response.status,
    );
  }

  if (!isConfirmedGrowthAuthorization(body)) {
    throw new GrowthAuthorizationApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      response.status,
    );
  }

  return body;
}

function isPreparedAaveDepositPlan(value: unknown): value is PreparedAaveDepositPlan {
  if (!value || typeof value !== "object") {
    return false;
  }

  const plan = value as PreparedAaveDepositPlan;
  return (
    typeof plan.id === "string" &&
    plan.id.length > 0 &&
    plan.chain === "base" &&
    plan.chainId === 8453 &&
    typeof plan.smartWalletAddress === "string" &&
    typeof plan.amountUsdc === "string" &&
    typeof plan.executionEnabled === "boolean" &&
    Array.isArray(plan.calls) &&
    plan.calls.length === 2 &&
    plan.calls.every(
      (call) =>
        typeof call.to === "string" &&
        typeof call.data === "string" &&
        call.value === "0x0",
    )
  );
}

function isConfirmedAaveDeposit(value: unknown): value is ConfirmedAaveDeposit {
  if (!value || typeof value !== "object") {
    return false;
  }

  const deposit = value as ConfirmedAaveDeposit;
  return (
    typeof deposit.id === "string" &&
    deposit.status === "confirmed" &&
    typeof deposit.amountUsdc === "string" &&
    typeof deposit.transactionHash === "string"
  );
}

/** 3C.2: fetch approve+supply calldata only. Does not send a transaction. */
export async function prepareSmartWalletDeposit(
  accessToken: string,
  amountUsdc: string,
): Promise<PreparedAaveDepositPlan> {
  const token = requireAccessToken(accessToken, true);
  let response: Response;

  try {
    response = await fetch(
      `${apiBaseUrl}/api/v1/growth/smart-wallet-deposits/prepare`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amountUsdc }),
      },
    );
  } catch {
    throw new GrowthAuthorizationApiError(
      "NETWORK_ERROR",
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    throw new GrowthAuthorizationApiError(
      response.ok ? "INVALID_RESPONSE" : "INTERNAL_ERROR",
      response.ok
        ? "Received an unexpected response from the server."
        : "We couldn’t prepare this deposit.",
      response.status,
    );
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new GrowthAuthorizationApiError(
      parseAuthorizationErrorCode(errorBody.error?.code),
      getSafeErrorMessage(errorBody, "We couldn’t prepare this deposit."),
      response.status,
    );
  }

  if (!isPreparedAaveDepositPlan(body)) {
    throw new GrowthAuthorizationApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      response.status,
    );
  }

  return body;
}

async function postSmartWalletDeposit(
  accessToken: string,
  path: string,
  bodyValue: unknown,
  fallback: string,
): Promise<unknown> {
  const token = requireAccessToken(accessToken, true);
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/api/v1/growth/smart-wallet-deposits/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyValue ?? {}),
    });
  } catch {
    throw new GrowthAuthorizationApiError(
      "NETWORK_ERROR",
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    throw new GrowthAuthorizationApiError(
      response.ok ? "INVALID_RESPONSE" : "INTERNAL_ERROR",
      response.ok
        ? "Received an unexpected response from the server."
        : fallback,
      response.status,
    );
  }

  if (!response.ok) {
    const errorBody = body as ApiErrorBody;
    throw new GrowthAuthorizationApiError(
      parseAuthorizationErrorCode(errorBody.error?.code),
      getSafeErrorMessage(errorBody, fallback),
      response.status,
    );
  }

  return body;
}

/** 3C.3: mark prepared deposit submitted. Does not send a transaction. */
export async function submitSmartWalletDeposit(
  accessToken: string,
  depositId: string,
): Promise<PreparedAaveDepositPlan> {
  const body = await postSmartWalletDeposit(
    accessToken,
    `${depositId}/submit`,
    {},
    "We couldn’t start this deposit.",
  );

  if (!isPreparedAaveDepositPlan(body)) {
    throw new GrowthAuthorizationApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      200,
    );
  }

  return body;
}

/** 3C.3: release a submitted deposit only when no transaction hash exists. */
export async function failSmartWalletDeposit(
  accessToken: string,
  depositId: string,
): Promise<void> {
  await postSmartWalletDeposit(
    accessToken,
    `${depositId}/fail`,
    {},
    "We couldn’t cancel this deposit.",
  );
}

/** 3C.3: record and verify a receipt. Does not send a transaction. */
export async function confirmSmartWalletDeposit(
  accessToken: string,
  depositId: string,
  transactionHash: string,
): Promise<ConfirmedAaveDeposit> {
  const body = await postSmartWalletDeposit(
    accessToken,
    `${depositId}/confirm`,
    { transactionHash },
    "We couldn’t confirm this deposit.",
  );

  if (!isConfirmedAaveDeposit(body)) {
    throw new GrowthAuthorizationApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      200,
    );
  }

  return body;
}
