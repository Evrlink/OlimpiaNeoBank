import { env } from "../config/env.js";
import { finalizeDepositStatus } from "./completeDeposit.js";
import { createOnrampOrder } from "./coinbase/client.js";
import { FundingProviderError } from "./errors.js";
import type { CreateOnRampInput, CreateOnRampResult } from "./types.js";

const MOCK_SETTLE_MS = 1600;

export { FundingProviderError };

function scheduleMockSettlement(input: {
  depositId: string;
  providerRef: string;
  forceFail: boolean;
}): void {
  setTimeout(() => {
    void finalizeDepositStatus({
      depositId: input.depositId,
      providerTransactionId: input.providerRef,
      nextStatus: input.forceFail ? "failed" : "completed",
      failureReason: input.forceFail
        ? "We couldn’t complete this deposit."
        : null,
    }).catch(() => {
      // Mock settlement is best-effort; GET will still reflect DB state.
    });
  }, MOCK_SETTLE_MS);
}

async function createMockOnRamp(input: CreateOnRampInput): Promise<CreateOnRampResult> {
  if (env.nodeEnv === "production") {
    throw new FundingProviderError(
      "Mock funding is not available in production.",
    );
  }

  const providerRef = `mock_${input.depositId}`;

  scheduleMockSettlement({
    depositId: input.depositId,
    providerRef,
    forceFail: input.forceFail === true,
  });

  return {
    providerRef,
    initialStatus: "processing",
  };
}

function requireVerifiedContact(value: string | null | undefined, label: string): string {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    throw new FundingProviderError(
      `A verified ${label} is required before adding money with Coinbase.`,
    );
  }

  return trimmed;
}

async function createCoinbaseOnRamp(
  input: CreateOnRampInput,
): Promise<CreateOnRampResult> {
  if (!env.coinbaseOnrampApiKey.trim() || !env.coinbaseOnrampApiSecret.trim()) {
    throw new FundingProviderError(
      "Coinbase Headless is not configured. Set COINBASE_ONRAMP_API_KEY and COINBASE_ONRAMP_API_SECRET on the API.",
    );
  }

  const email = requireVerifiedContact(input.email, "email");
  const phoneNumber = requireVerifiedContact(input.phone, "US phone number");
  const agreementAcceptedAt = requireVerifiedContact(
    input.agreementAcceptedAt,
    "Coinbase Guest Checkout agreement",
  );
  const smsVerificationId = requireVerifiedContact(
    input.smsVerificationId,
    "phone verification",
  );
  const emailVerificationId = requireVerifiedContact(
    input.emailVerificationId,
    "email verification",
  );

  const order = await createOnrampOrder({
    depositId: input.depositId,
    userId: input.userId,
    amountUsd: input.amountUsd,
    walletAddress: input.walletAddress,
    email,
    phoneNumber,
    agreementAcceptedAt,
    smsVerificationId,
    emailVerificationId,
  });

  return {
    providerRef: order.orderId,
    hostedUrl: order.paymentLinkUrl,
    initialStatus: "processing",
  };
}

export async function createOnRampIntent(
  input: CreateOnRampInput,
): Promise<CreateOnRampResult> {
  if (env.fundingProvider === "coinbase") {
    return createCoinbaseOnRamp(input);
  }

  return createMockOnRamp(input);
}
