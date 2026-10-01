import {
  AAVE_V3_BASE_POOL,
  AAVE_V3_BASE_USDC_A_TOKEN,
  BASE_CHAIN_ID,
  BASE_USDC,
} from "./aaveAddresses.js";
import { AaveDepositPlanError, formatBoundUsdcAmount, parseUsdcAmountToRaw } from "./aaveDepositPlan.js";

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const TRANSFER_SELECTOR = "a9059cbb";
const TRANSFER_DATA_LENGTH = 138;
const UINT256_MAX = (1n << 256n) - 1n;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const USDC_SEND_DECIMALS = 6;

export class UsdcSendPlanError extends Error {
  readonly status: number;
  readonly code:
    | "VALIDATION_ERROR"
    | "USER_NOT_FOUND"
    | "SEND_NOT_FOUND"
    | "PRIVY_UNAVAILABLE"
    | "INTERNAL_ERROR";

  constructor(
    status: number,
    code: UsdcSendPlanError["code"],
    message: string,
  ) {
    super(message);
    this.name = "UsdcSendPlanError";
    this.status = status;
    this.code = code;
  }
}

export type UsdcSendCall = {
  to: string;
  data: string;
  value: "0x0";
};

export type PreparedUsdcSendPlan = {
  chain: "base";
  chainId: typeof BASE_CHAIN_ID;
  smartWalletAddress: string;
  destinationAddress: string;
  amountUsdc: string;
  calls: [UsdcSendCall];
};

export type PreparedUsdcSendResponse = PreparedUsdcSendPlan & {
  id: string;
  executionEnabled: boolean;
  sendAttemptedAt: string | null;
};

function padUint(value: bigint): string {
  return value.toString(16).padStart(64, "0");
}

function padAddress(address: string): string {
  return address.slice(2).toLowerCase().padStart(64, "0");
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function encodeUsdcTransfer(input: {
  to: string;
  amount: bigint;
}): string {
  return `0x${TRANSFER_SELECTOR}${padAddress(input.to)}${padUint(input.amount)}`;
}

function isForbiddenDestination(
  destination: string,
  smartWallet: string,
): boolean {
  const dest = normalizeAddress(destination);
  return (
    dest === normalizeAddress(smartWallet) ||
    dest === ZERO_ADDRESS ||
    dest === normalizeAddress(BASE_USDC) ||
    dest === normalizeAddress(AAVE_V3_BASE_USDC_A_TOKEN) ||
    dest === normalizeAddress(AAVE_V3_BASE_POOL)
  );
}

/** Build USDC.transfer calldata only. Does not send a transaction. */
export function buildUsdcSendPlan(input: {
  smartWalletAddress: string;
  destinationAddress: string;
  amountUsdc: string;
  availableRawUsdc: bigint;
  decimals?: number;
}): PreparedUsdcSendPlan {
  const smartWallet = input.smartWalletAddress.trim();
  if (!ADDRESS_PATTERN.test(smartWallet)) {
    throw new UsdcSendPlanError(
      500,
      "INTERNAL_ERROR",
      "Smart wallet address is invalid.",
    );
  }

  const destination = input.destinationAddress.trim();
  if (!ADDRESS_PATTERN.test(destination)) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "Enter a valid Base wallet address.",
    );
  }

  if (isForbiddenDestination(destination, smartWallet)) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This destination cannot receive this send.",
    );
  }

  const decimals = input.decimals ?? USDC_SEND_DECIMALS;
  let rawAmount: bigint;
  try {
    rawAmount = parseUsdcAmountToRaw(input.amountUsdc, decimals);
  } catch (error) {
    if (error instanceof AaveDepositPlanError) {
      throw new UsdcSendPlanError(error.status, "VALIDATION_ERROR", error.message);
    }
    throw error;
  }
  if (rawAmount > input.availableRawUsdc) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This amount is greater than your available balance.",
    );
  }

  const transferData = encodeUsdcTransfer({
    to: destination,
    amount: rawAmount,
  });

  return {
    chain: "base",
    chainId: BASE_CHAIN_ID,
    smartWalletAddress: smartWallet,
    destinationAddress: `0x${destination.slice(2).toLowerCase()}`,
    amountUsdc: formatBoundUsdcAmount(rawAmount, decimals),
    calls: [{ to: BASE_USDC, data: transferData, value: "0x0" }],
  };
}

function readHexWord(data: string, wordIndex: number): string {
  const start = 10 + wordIndex * 64;
  return data.slice(start, start + 64);
}

function wordToAddress(word: string): string {
  return `0x${word.slice(24).toLowerCase()}`;
}

function wordToUint(word: string): bigint {
  if (!/^[0-9a-fA-F]{64}$/.test(word)) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This send plan is invalid.",
    );
  }

  return BigInt(`0x${word}`);
}

/** Decode and refuse anything that is not exact USDC.transfer from this Smart Wallet. */
export function assertExecutableUsdcSendPlan(
  plan: PreparedUsdcSendPlan,
  expectedSmartWalletAddress: string,
): bigint {
  const expectedWallet = normalizeAddress(expectedSmartWalletAddress);
  if (!ADDRESS_PATTERN.test(expectedSmartWalletAddress.trim())) {
    throw new UsdcSendPlanError(
      500,
      "INTERNAL_ERROR",
      "Smart wallet address is invalid.",
    );
  }

  if (plan.chain !== "base" || plan.chainId !== BASE_CHAIN_ID) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This send must be on Base.",
    );
  }

  if (normalizeAddress(plan.smartWalletAddress) !== expectedWallet) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This send is not for your Smart Wallet.",
    );
  }

  if (!ADDRESS_PATTERN.test(plan.destinationAddress.trim())) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This send plan is invalid.",
    );
  }

  if (isForbiddenDestination(plan.destinationAddress, expectedWallet)) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This destination cannot receive this send.",
    );
  }

  if (!Array.isArray(plan.calls) || plan.calls.length !== 1) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This send must be one USDC transfer.",
    );
  }

  const transfer = plan.calls[0];
  if (!transfer) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This send must be one USDC transfer.",
    );
  }

  if (transfer.value !== "0x0") {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This send cannot send ETH.",
    );
  }

  if (normalizeAddress(transfer.to) !== normalizeAddress(BASE_USDC)) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This send plan is invalid.",
    );
  }

  if (
    !transfer.data.startsWith(`0x${TRANSFER_SELECTOR}`) ||
    transfer.data.length !== TRANSFER_DATA_LENGTH
  ) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This send plan is invalid.",
    );
  }

  const destination = wordToAddress(readHexWord(transfer.data, 0));
  const amount = wordToUint(readHexWord(transfer.data, 1));

  if (destination !== normalizeAddress(plan.destinationAddress)) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This send destination is invalid.",
    );
  }

  if (amount <= 0n || amount === UINT256_MAX) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This send can only use an exact amount.",
    );
  }

  if (amount !== parseUsdcAmountToRaw(plan.amountUsdc, USDC_SEND_DECIMALS)) {
    throw new UsdcSendPlanError(
      400,
      "VALIDATION_ERROR",
      "This send amount is invalid.",
    );
  }

  return amount;
}

export function toSendPlanFromStoredCalls(input: {
  smartWalletAddress: string;
  destinationAddress: string;
  amountUsdc: string;
  calls: UsdcSendCall[];
}): PreparedUsdcSendPlan {
  if (input.calls.length !== 1 || !input.calls[0]) {
    throw new UsdcSendPlanError(
      500,
      "INTERNAL_ERROR",
      "Unable to prepare this send.",
    );
  }

  return {
    chain: "base",
    chainId: BASE_CHAIN_ID,
    smartWalletAddress: input.smartWalletAddress,
    destinationAddress: input.destinationAddress,
    amountUsdc: input.amountUsdc,
    calls: [input.calls[0]],
  };
}

export function assertSendPlanHasNoSecrets(
  plan: PreparedUsdcSendPlan,
  vaultId: string,
  appSecret: string,
): void {
  const serialized = JSON.stringify(plan);
  if (
    serialized.includes(vaultId) ||
    serialized.includes("vault_id") ||
    serialized.includes("vaultId") ||
    (appSecret && serialized.includes(appSecret)) ||
    serialized.toLowerCase().includes("pay" + "master")
  ) {
    throw new UsdcSendPlanError(
      500,
      "INTERNAL_ERROR",
      "Unable to prepare this send.",
    );
  }
}
