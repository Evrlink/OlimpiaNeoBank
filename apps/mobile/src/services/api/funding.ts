import { apiBaseUrl } from "@/config/api";

export type DepositStatus = "pending" | "processing" | "completed" | "failed";

export type Deposit = {
  id: string;
  amountUsd: string;
  status: DepositStatus;
  hostedUrl?: string;
};

export type CreateDepositInput = {
  accessToken: string;
  amountUsd: string;
  /** Development-only: force the mock deposit to end in `failed`. */
  forceFail?: boolean;
  idempotencyKey?: string;
  agreementAcceptedAt?: string;
  smsVerificationId?: string;
  emailVerificationId?: string;
  paymentMethod?: string;
};

export type FundingVerificationChannel = "sms" | "email";

export type StartVerificationInput = {
  accessToken: string;
  channel: FundingVerificationChannel;
  destination?: string;
};

export type FundingVerification = {
  verificationId: string;
  otpExpiresAt?: string;
  channel: FundingVerificationChannel;
  destination: string;
};

export type SubmitVerificationInput = {
  accessToken: string;
  verificationId: string;
  otpCode: string;
  channel?: FundingVerificationChannel;
  destination?: string;
};

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class FundingApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "FundingApiError";
    this.code = code;
    this.status = status;
  }
}

const POLL_MS = 500;

function getSafeErrorMessage(body: ApiErrorBody, fallback: string): string {
  const message = body.error?.message?.trim();
  return message || fallback;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function assertDeposit(body: unknown, status: number): Deposit {
  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as Deposit).id !== "string" ||
    typeof (body as Deposit).amountUsd !== "string" ||
    typeof (body as Deposit).status !== "string"
  ) {
    throw new FundingApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      status,
    );
  }

  return body as Deposit;
}

async function authorizedJson(input: {
  accessToken: string;
  path: string;
  method: "GET" | "POST";
  body?: Record<string, unknown>;
  idempotencyKey?: string;
  fallbackError: string;
}): Promise<{ response: Response; body: unknown }> {
  const token = input.accessToken.trim();

  if (!token) {
    throw new FundingApiError(
      "UNAUTHORIZED",
      "Missing or invalid authorization header.",
      401,
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (input.body) {
    headers["Content-Type"] = "application/json";
  }

  if (input.idempotencyKey?.trim()) {
    headers["Idempotency-Key"] = input.idempotencyKey.trim();
  }

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${input.path}`, {
      method: input.method,
      headers,
      body: input.body ? JSON.stringify(input.body) : undefined,
    });
  } catch {
    throw new FundingApiError(
      "NETWORK_ERROR",
      "Unable to reach the server. Check your connection and try again.",
      0,
    );
  }

  const body = await parseJson(response);

  if (!response.ok) {
    const errorBody = (body ?? {}) as ApiErrorBody;
    throw new FundingApiError(
      errorBody.error?.code ?? "INTERNAL_ERROR",
      getSafeErrorMessage(errorBody, input.fallbackError),
      response.status,
    );
  }

  return { response, body };
}

/**
 * POST /api/v1/funding/verifications
 */
export async function startFundingVerification(
  input: StartVerificationInput,
): Promise<FundingVerification> {
  const { response, body } = await authorizedJson({
    accessToken: input.accessToken,
    path: "/api/v1/funding/verifications",
    method: "POST",
    body: {
      channel: input.channel,
      ...(input.destination?.trim() ? { destination: input.destination.trim() } : {}),
    },
    fallbackError: "Unable to start verification.",
  });

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as FundingVerification).verificationId !== "string" ||
    typeof (body as FundingVerification).channel !== "string" ||
    typeof (body as FundingVerification).destination !== "string"
  ) {
    throw new FundingApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      response.status,
    );
  }

  return body as FundingVerification;
}

/**
 * POST /api/v1/funding/verifications/:id/submit
 */
export async function submitFundingVerification(
  input: SubmitVerificationInput,
): Promise<{ verificationId: string; verificationExpiresAt?: string }> {
  const { response, body } = await authorizedJson({
    accessToken: input.accessToken,
    path: `/api/v1/funding/verifications/${encodeURIComponent(input.verificationId)}/submit`,
    method: "POST",
    body: {
      otpCode: input.otpCode,
      ...(input.channel ? { channel: input.channel } : {}),
      ...(input.destination?.trim() ? { destination: input.destination.trim() } : {}),
    },
    fallbackError: "Unable to verify that code.",
  });

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as { verificationId?: unknown }).verificationId !== "string"
  ) {
    throw new FundingApiError(
      "INVALID_RESPONSE",
      "Received an unexpected response from the server.",
      response.status,
    );
  }

  return body as { verificationId: string; verificationExpiresAt?: string };
}

/**
 * POST /api/v1/funding/deposits
 */
export async function createDeposit(input: CreateDepositInput): Promise<Deposit> {
  const { response, body } = await authorizedJson({
    accessToken: input.accessToken,
    path: "/api/v1/funding/deposits",
    method: "POST",
    idempotencyKey: input.idempotencyKey,
    body: {
      amountUsd: input.amountUsd,
      paymentMethod: input.paymentMethod ?? "apple_pay",
      ...(input.forceFail ? { forceFail: true } : {}),
      ...(input.agreementAcceptedAt ? { agreementAcceptedAt: input.agreementAcceptedAt } : {}),
      ...(input.smsVerificationId ? { smsVerificationId: input.smsVerificationId } : {}),
      ...(input.emailVerificationId ? { emailVerificationId: input.emailVerificationId } : {}),
    },
    fallbackError: "We couldn’t start this deposit.",
  });

  return assertDeposit(body, response.status);
}

/**
 * GET /api/v1/funding/deposits/:id
 */
export async function getDeposit(accessToken: string, id: string): Promise<Deposit> {
  const { response, body } = await authorizedJson({
    accessToken,
    path: `/api/v1/funding/deposits/${id}`,
    method: "GET",
    fallbackError: "Unable to load this deposit.",
  });

  return assertDeposit(body, response.status);
}

/**
 * POST /api/v1/funding/deposits/:id/cancel
 */
export async function cancelDeposit(accessToken: string, id: string): Promise<Deposit> {
  const { response, body } = await authorizedJson({
    accessToken,
    path: `/api/v1/funding/deposits/${id}/cancel`,
    method: "POST",
    fallbackError: "Unable to cancel this deposit.",
  });

  return assertDeposit(body, response.status);
}

/**
 * POST /api/v1/funding/deposits/:id/reconcile
 */
export async function reconcileDeposit(accessToken: string, id: string): Promise<Deposit> {
  const { response, body } = await authorizedJson({
    accessToken,
    path: `/api/v1/funding/deposits/${id}/reconcile`,
    method: "POST",
    fallbackError: "Unable to refresh this deposit.",
  });

  return assertDeposit(body, response.status);
}

export type DepositStatusListener = (deposit: Deposit) => void;

/**
 * Polls deposit status until terminal.
 * Returns an unsubscribe function.
 */
export function watchDepositStatus(
  accessToken: string,
  id: string,
  onUpdate: DepositStatusListener,
): () => void {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = async () => {
    if (cancelled) {
      return;
    }

    try {
      const deposit = await getDeposit(accessToken, id);
      if (cancelled) {
        return;
      }

      onUpdate(deposit);

      if (deposit.status === "completed" || deposit.status === "failed") {
        return;
      }

      timer = setTimeout(() => {
        void tick();
      }, POLL_MS);
    } catch {
      if (!cancelled) {
        onUpdate({
          id,
          amountUsd: "0.00",
          status: "failed",
        });
      }
    }
  };

  void tick();

  return () => {
    cancelled = true;
    if (timer) {
      clearTimeout(timer);
    }
  };
}
