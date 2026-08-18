import { env } from "../../config/env.js";
import { FundingProviderError } from "../errors.js";
import { CDP_API_HOST, createCdpBearerToken } from "./auth.js";

export type CoinbaseOnrampOrderStatus =
  | "ONRAMP_ORDER_STATUS_PENDING_AUTH"
  | "ONRAMP_ORDER_STATUS_PENDING_PAYMENT"
  | "ONRAMP_ORDER_STATUS_PROCESSING"
  | "ONRAMP_ORDER_STATUS_COMPLETED"
  | "ONRAMP_ORDER_STATUS_FAILED"
  | string;

export type CoinbaseOnrampOrder = {
  orderId?: string;
  status?: CoinbaseOnrampOrderStatus;
  partnerUserRef?: string;
  destinationAddress?: string;
  destinationNetwork?: string;
  purchaseCurrency?: string;
  paymentMethod?: string;
  txHash?: string;
};

export type CoinbaseCreateOrderInput = {
  depositId: string;
  userId: string;
  amountUsd: string;
  walletAddress: string;
  email: string;
  phoneNumber: string;
  agreementAcceptedAt: string;
  smsVerificationId: string;
  emailVerificationId: string;
};

export type CoinbaseCreateOrderResult = {
  orderId: string;
  paymentLinkUrl: string;
  status: CoinbaseOnrampOrderStatus;
};

export type CoinbaseVerificationChannel = "sms" | "email";

type CoinbaseErrorBody = {
  errorType?: string;
  errorMessage?: string;
  message?: string;
};

function coinbaseErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === "object") {
    const error = body as CoinbaseErrorBody;
    const message = error.errorMessage?.trim() || error.message?.trim();
    if (message) {
      return message;
    }
  }

  if (status === 401) {
    return "Coinbase rejected the request. Check CDP API credentials and Onramp allowlisting.";
  }

  return "Unable to reach Coinbase Onramp. Please try again.";
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function coinbaseRequest<T>(input: {
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const token = await createCdpBearerToken({
    method: input.method,
    path: input.path,
  });

  let response: Response;

  try {
    response = await fetch(`https://${CDP_API_HOST}${input.path}`, {
      method: input.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: input.body ? JSON.stringify(input.body) : undefined,
    });
  } catch {
    throw new FundingProviderError("Unable to reach Coinbase Onramp. Please try again.");
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new FundingProviderError(coinbaseErrorMessage(response.status, payload));
  }

  return payload as T;
}

export function partnerUserRefForUser(userId: string): string {
  return env.coinbaseSandbox ? `sandbox-${userId}` : userId;
}

export function withApplePaySandbox(url: string): string {
  if (!env.coinbaseSandbox) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("useApplePaySandbox")) {
      parsed.searchParams.set("useApplePaySandbox", "true");
    }
    return parsed.toString();
  } catch {
    const separator = url.includes("?") ? "&" : "?";
    if (/[?&]useApplePaySandbox=/.test(url)) {
      return url;
    }
    return `${url}${separator}useApplePaySandbox=true`;
  }
}

export async function createOnrampOrder(
  input: CoinbaseCreateOrderInput,
): Promise<CoinbaseCreateOrderResult> {
  const payload = await coinbaseRequest<{
    order?: CoinbaseOnrampOrder;
    paymentLink?: { url?: string };
  }>({
    method: "POST",
    path: "/platform/v2/onramp/orders",
    body: {
      agreementAcceptedAt: input.agreementAcceptedAt,
      destinationAddress: input.walletAddress,
      destinationNetwork: "base",
      email: input.email,
      emailVerificationId: input.emailVerificationId,
      partnerOrderRef: input.depositId,
      partnerUserRef: partnerUserRefForUser(input.userId),
      paymentAmount: input.amountUsd,
      paymentCurrency: "USD",
      paymentMethod: "GUEST_CHECKOUT_APPLE_PAY",
      phoneNumber: input.phoneNumber,
      purchaseCurrency: "USDC",
      smsVerificationId: input.smsVerificationId,
    },
  });

  const orderId = payload.order?.orderId?.trim();
  const paymentLinkUrl = payload.paymentLink?.url?.trim();

  if (!orderId || !paymentLinkUrl) {
    throw new FundingProviderError(
      "Coinbase did not return a checkout link. Please try again.",
    );
  }

  return {
    orderId,
    paymentLinkUrl: withApplePaySandbox(paymentLinkUrl),
    status: payload.order?.status ?? "ONRAMP_ORDER_STATUS_PENDING_PAYMENT",
  };
}

export async function getOnrampOrder(orderId: string): Promise<CoinbaseOnrampOrder | null> {
  try {
    const payload = await coinbaseRequest<{ order?: CoinbaseOnrampOrder } | CoinbaseOnrampOrder>({
      method: "GET",
      path: `/platform/v2/onramp/orders/${encodeURIComponent(orderId)}`,
    });

    if (payload && typeof payload === "object" && "order" in payload) {
      return payload.order ?? null;
    }

    return (payload as CoinbaseOnrampOrder) ?? null;
  } catch {
    return null;
  }
}

export async function initiateOnrampVerification(input: {
  channel: CoinbaseVerificationChannel;
  destination: string;
}): Promise<{ verificationId: string; otpExpiresAt?: string }> {
  const payload = await coinbaseRequest<{
    verificationId?: string;
    otpExpiresAt?: string;
  }>({
    method: "POST",
    path: "/platform/v2/onramp/verifications",
    body: {
      channel: input.channel,
      destination: input.destination,
    },
  });

  const verificationId = payload.verificationId?.trim();

  if (!verificationId) {
    throw new FundingProviderError("Coinbase did not start verification. Please try again.");
  }

  return {
    verificationId,
    otpExpiresAt: payload.otpExpiresAt,
  };
}

export async function submitOnrampVerification(input: {
  verificationId: string;
  otpCode: string;
}): Promise<{ verificationId: string; verificationExpiresAt?: string }> {
  const verificationId = input.verificationId.trim();
  const payload = await coinbaseRequest<{
    verificationId?: string;
    verificationExpiresAt?: string;
  }>({
    method: "POST",
    path: `/platform/v2/onramp/verifications/${encodeURIComponent(verificationId)}/submit`,
    body: {
      otpCode: input.otpCode.trim(),
    },
  });

  return {
    verificationId: payload.verificationId?.trim() || verificationId,
    verificationExpiresAt: payload.verificationExpiresAt,
  };
}
