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

/**
 * POST /api/v1/funding/deposits
 */
export async function createDeposit(input: CreateDepositInput): Promise<Deposit> {
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
    "Content-Type": "application/json",
  };

  if (input.idempotencyKey?.trim()) {
    headers["Idempotency-Key"] = input.idempotencyKey.trim();
  }

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/api/v1/funding/deposits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        amountUsd: input.amountUsd,
        ...(input.forceFail ? { forceFail: true } : {}),
      }),
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
      getSafeErrorMessage(errorBody, "We couldn’t start this deposit."),
      response.status,
    );
  }

  return assertDeposit(body, response.status);
}

/**
 * GET /api/v1/funding/deposits/:id
 */
export async function getDeposit(accessToken: string, id: string): Promise<Deposit> {
  const token = accessToken.trim();

  if (!token) {
    throw new FundingApiError(
      "UNAUTHORIZED",
      "Missing or invalid authorization header.",
      401,
    );
  }

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/api/v1/funding/deposits/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
      getSafeErrorMessage(errorBody, "Unable to load this deposit."),
      response.status,
    );
  }

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
