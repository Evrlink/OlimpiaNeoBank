import { env } from "../config/env.js";
import { finalizeDepositStatus } from "./completeDeposit.js";
import type { CreateOnRampInput, CreateOnRampResult } from "./types.js";

const MOCK_SETTLE_MS = 1600;

export class FundingProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FundingProviderError";
  }
}

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

/**
 * Coinbase Headless Onramp — session creation lands in the next sprint task.
 * Fails closed so production never silently uses another provider.
 */
async function createCoinbaseOnRamp(
  _input: CreateOnRampInput,
): Promise<CreateOnRampResult> {
  if (!env.coinbaseOnrampApiKey.trim()) {
    throw new FundingProviderError(
      "Coinbase Headless is not configured. Set COINBASE_ONRAMP_API_KEY (and related secrets) on the API.",
    );
  }

  throw new FundingProviderError(
    "Coinbase Headless Onramp integration is not implemented yet.",
  );
}

export async function createOnRampIntent(
  input: CreateOnRampInput,
): Promise<CreateOnRampResult> {
  if (env.fundingProvider === "coinbase") {
    return createCoinbaseOnRamp(input);
  }

  return createMockOnRamp(input);
}
