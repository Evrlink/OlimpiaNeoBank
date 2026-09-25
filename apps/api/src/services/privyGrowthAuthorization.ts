import { randomUUID } from "node:crypto";
import { formatRequestForAuthorizationSignature } from "@privy-io/node";
import { getPrivyClient } from "../auth/privy.js";
import { env, requirePrivyConfig } from "../config/env.js";
import type { ApiErrorCode } from "../lib/errors.js";
import {
  lookupAuthorizationAccount,
  type GrowthAuthorizationAccount,
} from "./growthAuthorizationAccount.js";
import {
  createPostgresGrowthAuthorizationStore,
  type GrowthAuthorizationStore,
  type StoredGrowthDepositAuthorization,
} from "./growthAuthorizationStore.js";
import { getPrivyUsdcBalanceOnBase } from "./privyBalance.js";
import {
  getRequiredAaveBaseUsdcVault,
  GrowthConfigurationError,
  InvalidGrowthVaultError,
} from "./privyGrowth.js";

const PRIVY_DEPOSIT_URL_PREFIX = "https://api.privy.io/v1/wallets/";
const PRIVY_DEPOSIT_URL_SUFFIX = "/earn/ethereum/deposit";
const AUTHORIZATION_TTL_MS = 5 * 60 * 1000;
const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;
const SIGNATURE_PATTERN = /^[A-Za-z0-9+/=_-]{16,2048}$/;

export type { GrowthAuthorizationAccount };

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

export class GrowthAuthorizationError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;

  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message);
    this.name = "GrowthAuthorizationError";
    this.status = status;
    this.code = code;
  }
}

export class GrowthWalletOwnershipError extends Error {
  constructor() {
    super("Wallet ownership could not be verified.");
    this.name = "GrowthWalletOwnershipError";
  }
}

export type GrowthAuthorizationDependencies = {
  lookupAccount: (privyUserId: string) => Promise<GrowthAuthorizationAccount>;
  verifyOwnership: (input: {
    privyUserId: string;
    privyWalletId: string;
    expectedAddress: string;
  }) => Promise<void>;
  getVault: () => Promise<{ decimals: number }>;
  getAvailableRawUsdc: (privyWalletId: string) => Promise<bigint>;
  store: GrowthAuthorizationStore;
  now: () => Date;
  createId: () => string;
  createIdempotencyKey: () => string;
};

function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

function formatBoundAmount(rawAmount: bigint, decimals: number): string {
  const padded = rawAmount.toString().padStart(decimals + 1, "0");
  const whole = decimals === 0 ? padded : padded.slice(0, -decimals);
  const fraction = decimals === 0 ? "" : padded.slice(-decimals);
  const trimmedFraction = fraction.replace(/0+$/, "");
  const displayedFraction = trimmedFraction.padEnd(2, "0");
  return `${whole}${displayedFraction ? `.${displayedFraction}` : ".00"}`;
}

function parseAmountToRaw(amountUsdc: string, decimals: number): bigint {
  const trimmed = amountUsdc.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) {
    throw new GrowthAuthorizationError(
      400,
      "VALIDATION_ERROR",
      "Enter a valid USDC amount.",
    );
  }

  const [whole, fraction = ""] = trimmed.split(".");
  const raw =
    BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0"));

  if (raw <= 0n) {
    throw new GrowthAuthorizationError(
      400,
      "VALIDATION_ERROR",
      "Enter a valid USDC amount.",
    );
  }

  return raw;
}

function toPublicPrepared(
  row: StoredGrowthDepositAuthorization,
): PreparedGrowthAuthorization {
  return {
    id: row.id,
    status: "unused",
    amountUsdc: row.amountUsdc,
    walletAddress: row.walletAddress,
    chain: "base",
    asset: "usdc",
    expiresAt: row.requestExpiry.toISOString(),
    payload: row.payloadHex,
  };
}

function toPublicConfirmed(
  row: StoredGrowthDepositAuthorization,
): ConfirmedGrowthAuthorization {
  return {
    id: row.id,
    status: "authorized",
    amountUsdc: row.amountUsdc,
    walletAddress: row.walletAddress,
    chain: "base",
    asset: "usdc",
    expiresAt: row.requestExpiry.toISOString(),
  };
}

function assertNoSecrets(value: unknown, vaultId: string): void {
  const serialized = JSON.stringify(value);
  if (
    serialized.includes(vaultId) ||
    serialized.includes("vault_id") ||
    serialized.includes("vaultId") ||
    serialized.includes(env.privyAppSecret)
  ) {
    throw new GrowthAuthorizationError(
      500,
      "INTERNAL_ERROR",
      "Unable to prepare this authorization.",
    );
  }
}

export async function verifyEmbeddedWalletOwnership(input: {
  privyUserId: string;
  privyWalletId: string;
  expectedAddress: string;
}): Promise<void> {
  const expected = input.expectedAddress.trim().toLowerCase();
  if (!expected || !input.privyWalletId.trim()) {
    throw new GrowthWalletOwnershipError();
  }

  try {
    const client = getPrivyClient();
    const wallet = await client.wallets().get(input.privyWalletId);
    const actual = wallet.address?.trim().toLowerCase() ?? "";

    if (
      wallet.id !== input.privyWalletId ||
      actual !== expected ||
      !wallet.owner_id?.trim()
    ) {
      throw new GrowthWalletOwnershipError();
    }

    const listed = await client.wallets().list({
      user_id: input.privyUserId,
      chain_type: "ethereum",
    });

    for await (const candidate of listed) {
      if (
        candidate.id === input.privyWalletId &&
        candidate.address?.trim().toLowerCase() === expected &&
        Boolean(candidate.owner_id?.trim())
      ) {
        return;
      }
    }
  } catch (error) {
    if (error instanceof GrowthWalletOwnershipError) {
      throw error;
    }

    throw new GrowthAuthorizationError(
      502,
      "PRIVY_UNAVAILABLE",
      "Unable to verify wallet ownership.",
    );
  }

  throw new GrowthWalletOwnershipError();
}

export async function getAvailableRawUsdcOnBase(privyWalletId: string): Promise<bigint> {
  const balance = await getPrivyUsdcBalanceOnBase(privyWalletId);
  if (!balance || balance.asset !== "usdc" || balance.chain !== "base") {
    return 0n;
  }

  if (!/^\d+$/.test(balance.rawValue)) {
    return 0n;
  }

  return BigInt(balance.rawValue);
}

export function createGrowthAuthorizationService(
  dependencies: GrowthAuthorizationDependencies,
) {
  async function prepareDepositAuthorization(input: {
    privyUserId: string;
    amountUsdc: unknown;
  }): Promise<PreparedGrowthAuthorization> {
    requirePrivyConfig();

    if (typeof input.amountUsdc !== "string") {
      throw new GrowthAuthorizationError(
        400,
        "VALIDATION_ERROR",
        "Enter a valid USDC amount.",
      );
    }

    const account = await dependencies.lookupAccount(input.privyUserId);
    if (!account.userExists || !account.userId) {
      throw new GrowthAuthorizationError(
        404,
        "USER_NOT_FOUND",
        "Account not found. Complete sign-in sync first.",
      );
    }

    if (
      account.moneyAddressMode === "smart_wallet" &&
      account.smartWalletAddress?.trim()
    ) {
      throw new GrowthAuthorizationError(
        409,
        "VALIDATION_ERROR",
        "Smart Wallet Grow uses a different deposit path.",
      );
    }

    if (
      !account.privyWalletId ||
      !account.walletAddress ||
      account.chain?.toLowerCase() !== "base"
    ) {
      throw new GrowthAuthorizationError(
        502,
        "PRIVY_UNAVAILABLE",
        "Privy wallet is missing. Complete sign-in sync again.",
      );
    }

    try {
      await dependencies.verifyOwnership({
        privyUserId: input.privyUserId,
        privyWalletId: account.privyWalletId,
        expectedAddress: account.walletAddress,
      });
    } catch (error) {
      if (error instanceof GrowthAuthorizationError) {
        throw error;
      }

      throw new GrowthAuthorizationError(
        403,
        "VALIDATION_ERROR",
        "Wallet ownership could not be verified.",
      );
    }

    let vault: { decimals: number };
    try {
      vault = await dependencies.getVault();
    } catch (error) {
      if (error instanceof GrowthConfigurationError) {
        throw new GrowthAuthorizationError(
          500,
          "INTERNAL_ERROR",
          "Growth is not configured.",
        );
      }

      if (error instanceof InvalidGrowthVaultError) {
        throw new GrowthAuthorizationError(
          502,
          "PRIVY_UNAVAILABLE",
          "Unable to prepare this authorization.",
        );
      }

      throw new GrowthAuthorizationError(
        502,
        "PRIVY_UNAVAILABLE",
        "Unable to prepare this authorization.",
      );
    }

    const vaultId = env.privyEarnAaveBaseUsdcVaultId.trim();
    if (!vaultId) {
      throw new GrowthAuthorizationError(
        500,
        "INTERNAL_ERROR",
        "Growth is not configured.",
      );
    }

    const rawAmount = parseAmountToRaw(input.amountUsdc, vault.decimals);
    const availableRaw = await dependencies.getAvailableRawUsdc(account.privyWalletId);
    if (rawAmount > availableRaw) {
      throw new GrowthAuthorizationError(
        400,
        "VALIDATION_ERROR",
        "This amount is greater than your available USDC.",
      );
    }

    const amountUsdc = formatBoundAmount(rawAmount, vault.decimals);
    const now = dependencies.now();
    const requestExpiry = new Date(now.getTime() + AUTHORIZATION_TTL_MS);
    const expiryMs = String(requestExpiry.getTime());
    const idempotencyKey = dependencies.createIdempotencyKey();
    const requestUrl = `${PRIVY_DEPOSIT_URL_PREFIX}${account.privyWalletId}${PRIVY_DEPOSIT_URL_SUFFIX}`;
    const requestBody = {
      vault_id: vaultId,
      amount: amountUsdc,
    };
    const payloadBytes = formatRequestForAuthorizationSignature({
      version: 1,
      method: "POST",
      url: requestUrl,
      body: { ...requestBody },
      headers: {
        "privy-app-id": env.privyAppId,
        "privy-idempotency-key": idempotencyKey,
        "privy-request-expiry": expiryMs,
      },
    });

    const row: StoredGrowthDepositAuthorization = {
      id: dependencies.createId(),
      userId: account.userId,
      privyUserId: input.privyUserId,
      privyWalletId: account.privyWalletId,
      walletAddress: account.walletAddress,
      vaultId,
      amountUsdc,
      rawAmount: rawAmount.toString(),
      idempotencyKey,
      requestExpiry,
      requestUrl,
      requestBody,
      payloadHex: toHex(payloadBytes),
      status: "unused",
      signature: null,
      authorizedAt: null,
      createdAt: now,
    };

    await dependencies.store.create(row);

    const prepared = toPublicPrepared(row);
    assertNoSecrets(prepared, vaultId);
    return prepared;
  }

  async function confirmDepositAuthorization(input: {
    privyUserId: string;
    authorizationId: string;
    signature: unknown;
  }): Promise<ConfirmedGrowthAuthorization> {
    if (typeof input.signature !== "string" || !SIGNATURE_PATTERN.test(input.signature)) {
      throw new GrowthAuthorizationError(
        400,
        "VALIDATION_ERROR",
        "A valid authorization signature is required.",
      );
    }

    const existing = await dependencies.store.getByIdForUser(
      input.authorizationId,
      input.privyUserId,
    );

    if (!existing) {
      throw new GrowthAuthorizationError(
        404,
        "AUTHORIZATION_NOT_FOUND",
        "Authorization not found.",
      );
    }

    if (existing.status === "authorized") {
      throw new GrowthAuthorizationError(
        409,
        "VALIDATION_ERROR",
        "This authorization has already been confirmed.",
      );
    }

    const now = dependencies.now();
    if (existing.requestExpiry.getTime() <= now.getTime()) {
      throw new GrowthAuthorizationError(
        400,
        "VALIDATION_ERROR",
        "This authorization has expired.",
      );
    }

    const updated = await dependencies.store.markAuthorized({
      id: existing.id,
      privyUserId: input.privyUserId,
      signature: input.signature,
      authorizedAt: now,
    });

    if (!updated) {
      const latest = await dependencies.store.getByIdForUser(
        input.authorizationId,
        input.privyUserId,
      );

      if (latest?.status === "authorized") {
        throw new GrowthAuthorizationError(
          409,
          "VALIDATION_ERROR",
          "This authorization has already been confirmed.",
        );
      }

      throw new GrowthAuthorizationError(
        400,
        "VALIDATION_ERROR",
        "This authorization has expired.",
      );
    }

    const confirmed = toPublicConfirmed(updated);
    assertNoSecrets(confirmed, updated.vaultId);
    return confirmed;
  }

  return {
    prepareDepositAuthorization,
    confirmDepositAuthorization,
  };
}

export function createDefaultGrowthAuthorizationService(): ReturnType<
  typeof createGrowthAuthorizationService
> {
  return createGrowthAuthorizationService({
    lookupAccount: lookupAuthorizationAccount,
    verifyOwnership: verifyEmbeddedWalletOwnership,
    getVault: getRequiredAaveBaseUsdcVault,
    getAvailableRawUsdc: getAvailableRawUsdcOnBase,
    store: createPostgresGrowthAuthorizationStore(),
    now: () => new Date(),
    createId: () => randomUUID(),
    createIdempotencyKey: () => randomUUID(),
  });
}
