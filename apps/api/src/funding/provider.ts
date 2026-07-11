import { randomUUID } from "node:crypto";
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
      bridgeIntentId: input.providerRef,
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

async function createBridgeOnRamp(input: CreateOnRampInput): Promise<CreateOnRampResult> {
  if (!env.bridgeApiKey.trim()) {
    throw new FundingProviderError("Funding provider is not configured.");
  }

  const response = await fetch(`${env.bridgeApiBaseUrl}/transfers`, {
    method: "POST",
    headers: {
      "Api-Key": env.bridgeApiKey,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey || randomUUID(),
    },
    body: JSON.stringify({
      amount: input.amountUsd,
      on_behalf_of: input.userId,
      source: {
        payment_rail: input.paymentMethod === "card" ? "card" : "ach_push",
        currency: "usd",
      },
      destination: {
        payment_rail: "base",
        currency: "usdc",
        to_address: input.walletAddress,
      },
      client_reference_id: input.depositId,
    }),
  });

  if (!response.ok) {
    throw new FundingProviderError("Unable to start this deposit. Please try again.");
  }

  const body = (await response.json()) as {
    id?: string;
    state?: string;
    source_deposit_instructions?: { url?: string };
  };

  if (!body.id) {
    throw new FundingProviderError("Unable to start this deposit. Please try again.");
  }

  return {
    providerRef: body.id,
    hostedUrl: body.source_deposit_instructions?.url,
    initialStatus: body.state === "awaiting_funds" ? "pending" : "processing",
  };
}

export async function createOnRampIntent(
  input: CreateOnRampInput,
): Promise<CreateOnRampResult> {
  if (env.fundingProvider === "bridge") {
    return createBridgeOnRamp(input);
  }

  return createMockOnRamp(input);
}
