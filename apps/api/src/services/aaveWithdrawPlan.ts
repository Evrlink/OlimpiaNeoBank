import {
  AAVE_V3_BASE_POOL,
  BASE_CHAIN_ID,
  BASE_USDC,
} from "./aaveAddresses.js";
import {
  formatBoundUsdcAmount,
  parseUsdcAmountToRaw,
} from "./aaveDepositPlan.js";

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const WITHDRAW_SELECTOR = "69328dec";
const UINT256_MAX = (1n << 256n) - 1n;

export class AaveWithdrawPlanError extends Error {
  readonly status: number;
  readonly code:
    | "VALIDATION_ERROR"
    | "USER_NOT_FOUND"
    | "WITHDRAWAL_NOT_FOUND"
    | "PRIVY_UNAVAILABLE"
    | "INTERNAL_ERROR";

  constructor(
    status: number,
    code: AaveWithdrawPlanError["code"],
    message: string,
  ) {
    super(message);
    this.name = "AaveWithdrawPlanError";
    this.status = status;
    this.code = code;
  }
}

export type AaveWithdrawCall = {
  to: string;
  data: string;
  value: "0x0";
};

export type PreparedAaveWithdrawPlan = {
  chain: "base";
  chainId: typeof BASE_CHAIN_ID;
  smartWalletAddress: string;
  amountUsdc: string;
  calls: [AaveWithdrawCall];
};

export type PreparedAaveWithdrawResponse = PreparedAaveWithdrawPlan & {
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

export function encodeAaveWithdraw(input: {
  asset: string;
  amount: bigint;
  to: string;
}): string {
  return `0x${WITHDRAW_SELECTOR}${padAddress(input.asset)}${padUint(input.amount)}${padAddress(input.to)}`;
}

/** Build Pool.withdraw calldata only. Does not send a transaction. */
export function buildAaveWithdrawPlan(input: {
  smartWalletAddress: string;
  amountUsdc: string;
  availableRawAusdc: bigint;
  decimals: number;
}): PreparedAaveWithdrawPlan {
  const smartWallet = input.smartWalletAddress.trim();
  if (!ADDRESS_PATTERN.test(smartWallet)) {
    throw new AaveWithdrawPlanError(
      500,
      "INTERNAL_ERROR",
      "Smart wallet address is invalid.",
    );
  }

  const rawAmount = parseUsdcAmountToRaw(input.amountUsdc, input.decimals);
  if (rawAmount > input.availableRawAusdc) {
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This amount is greater than your Grow balance.",
    );
  }

  const withdrawData = encodeAaveWithdraw({
    asset: BASE_USDC,
    amount: rawAmount,
    to: smartWallet,
  });

  return {
    chain: "base",
    chainId: BASE_CHAIN_ID,
    smartWalletAddress: smartWallet,
    amountUsdc: formatBoundUsdcAmount(rawAmount, input.decimals),
    calls: [{ to: AAVE_V3_BASE_POOL, data: withdrawData, value: "0x0" }],
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
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This withdrawal plan is invalid.",
    );
  }

  return BigInt(`0x${word}`);
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

/** Decode and refuse anything that is not exact-amount Pool.withdraw to this Smart Wallet. */
export function assertExecutableAaveWithdrawPlan(
  plan: PreparedAaveWithdrawPlan,
  expectedSmartWalletAddress: string,
): bigint {
  const expectedWallet = normalizeAddress(expectedSmartWalletAddress);
  if (!ADDRESS_PATTERN.test(expectedSmartWalletAddress.trim())) {
    throw new AaveWithdrawPlanError(
      500,
      "INTERNAL_ERROR",
      "Smart wallet address is invalid.",
    );
  }

  if (plan.chain !== "base" || plan.chainId !== BASE_CHAIN_ID) {
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This withdrawal must be on Base.",
    );
  }

  if (normalizeAddress(plan.smartWalletAddress) !== expectedWallet) {
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This withdrawal is not for your Smart Wallet.",
    );
  }

  if (!Array.isArray(plan.calls) || plan.calls.length !== 1) {
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This withdrawal must be one Aave withdraw call.",
    );
  }

  const withdraw = plan.calls[0];
  if (!withdraw) {
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This withdrawal must be one Aave withdraw call.",
    );
  }

  if (withdraw.value !== "0x0") {
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This withdrawal cannot send ETH.",
    );
  }

  if (normalizeAddress(withdraw.to) !== normalizeAddress(AAVE_V3_BASE_POOL)) {
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This withdrawal plan is invalid.",
    );
  }

  if (
    !withdraw.data.startsWith(`0x${WITHDRAW_SELECTOR}`) ||
    withdraw.data.length !== 202
  ) {
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This withdrawal plan is invalid.",
    );
  }

  const asset = wordToAddress(readHexWord(withdraw.data, 0));
  const amount = wordToUint(readHexWord(withdraw.data, 1));
  const destination = wordToAddress(readHexWord(withdraw.data, 2));

  if (asset !== normalizeAddress(BASE_USDC)) {
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This withdrawal plan is invalid.",
    );
  }

  if (destination !== expectedWallet) {
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This withdrawal must return USDC to your Smart Wallet.",
    );
  }

  if (amount <= 0n || amount === UINT256_MAX) {
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This withdrawal can only use an exact amount.",
    );
  }

  if (amount !== parseUsdcAmountToRaw(plan.amountUsdc, 6)) {
    throw new AaveWithdrawPlanError(
      400,
      "VALIDATION_ERROR",
      "This withdrawal amount is invalid.",
    );
  }

  return amount;
}

export function toWithdrawPlanFromStoredCalls(input: {
  smartWalletAddress: string;
  amountUsdc: string;
  calls: AaveWithdrawCall[];
}): PreparedAaveWithdrawPlan {
  if (input.calls.length !== 1 || !input.calls[0]) {
    throw new AaveWithdrawPlanError(
      500,
      "INTERNAL_ERROR",
      "Unable to prepare this withdrawal.",
    );
  }

  return {
    chain: "base",
    chainId: BASE_CHAIN_ID,
    smartWalletAddress: input.smartWalletAddress,
    amountUsdc: input.amountUsdc,
    calls: [input.calls[0]],
  };
}

export function assertWithdrawPlanHasNoSecrets(
  plan: PreparedAaveWithdrawPlan,
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
    throw new AaveWithdrawPlanError(
      500,
      "INTERNAL_ERROR",
      "Unable to prepare this withdrawal.",
    );
  }
}
