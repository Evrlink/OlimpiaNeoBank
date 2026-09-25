import {
  AAVE_V3_BASE_POOL,
  BASE_CHAIN_ID,
  BASE_USDC,
} from "./aaveAddresses.js";

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;
const APPROVE_SELECTOR = "095ea7b3";
const SUPPLY_SELECTOR = "617ba037";

const UINT256_MAX = (1n << 256n) - 1n;

export class AaveDepositPlanError extends Error {
  readonly status: number;
  readonly code:
    | "VALIDATION_ERROR"
    | "USER_NOT_FOUND"
    | "DEPOSIT_NOT_FOUND"
    | "PRIVY_UNAVAILABLE"
    | "INTERNAL_ERROR";

  constructor(
    status: number,
    code: AaveDepositPlanError["code"],
    message: string,
  ) {
    super(message);
    this.name = "AaveDepositPlanError";
    this.status = status;
    this.code = code;
  }
}

export type AaveDepositCall = {
  to: string;
  data: string;
  value: "0x0";
};

export type PreparedAaveDepositPlan = {
  chain: "base";
  chainId: typeof BASE_CHAIN_ID;
  smartWalletAddress: string;
  amountUsdc: string;
  calls: [AaveDepositCall, AaveDepositCall];
};

export type PreparedAaveDepositResponse = PreparedAaveDepositPlan & {
  id: string;
  executionEnabled: boolean;
};

function padUint(value: bigint): string {
  return value.toString(16).padStart(64, "0");
}

function padAddress(address: string): string {
  return address.slice(2).toLowerCase().padStart(64, "0");
}

export function parseUsdcAmountToRaw(amountUsdc: string, decimals: number): bigint {
  const trimmed = amountUsdc.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "Enter a valid USDC amount.",
    );
  }

  const [whole, fraction = ""] = trimmed.split(".");
  const raw =
    BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0"));

  if (raw <= 0n) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "Enter a valid USDC amount.",
    );
  }

  return raw;
}

export function formatBoundUsdcAmount(rawAmount: bigint, decimals: number): string {
  const padded = rawAmount.toString().padStart(decimals + 1, "0");
  const whole = decimals === 0 ? padded : padded.slice(0, -decimals);
  const fraction = decimals === 0 ? "" : padded.slice(-decimals);
  const trimmedFraction = fraction.replace(/0+$/, "");
  const displayedFraction = trimmedFraction.padEnd(2, "0");
  return `${whole}${displayedFraction ? `.${displayedFraction}` : ".00"}`;
}

export function encodeUsdcApprove(spender: string, amount: bigint): string {
  return `0x${APPROVE_SELECTOR}${padAddress(spender)}${padUint(amount)}`;
}

export function encodeAaveSupply(input: {
  asset: string;
  amount: bigint;
  onBehalfOf: string;
}): string {
  return `0x${SUPPLY_SELECTOR}${padAddress(input.asset)}${padUint(input.amount)}${padAddress(input.onBehalfOf)}${padUint(0n)}`;
}

/** Build approve + supply calldata only. Does not send a transaction. */
export function buildAaveDepositPlan(input: {
  smartWalletAddress: string;
  amountUsdc: string;
  availableRawUsdc: bigint;
  decimals: number;
}): PreparedAaveDepositPlan {
  const smartWallet = input.smartWalletAddress.trim();
  if (!ADDRESS_PATTERN.test(smartWallet)) {
    throw new AaveDepositPlanError(
      500,
      "INTERNAL_ERROR",
      "Smart wallet address is invalid.",
    );
  }

  const rawAmount = parseUsdcAmountToRaw(input.amountUsdc, input.decimals);
  if (rawAmount > input.availableRawUsdc) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This amount is greater than your available USDC.",
    );
  }

  const approveData = encodeUsdcApprove(AAVE_V3_BASE_POOL, rawAmount);
  const supplyData = encodeAaveSupply({
    asset: BASE_USDC,
    amount: rawAmount,
    onBehalfOf: smartWallet,
  });

  return {
    chain: "base",
    chainId: BASE_CHAIN_ID,
    smartWalletAddress: smartWallet,
    amountUsdc: formatBoundUsdcAmount(rawAmount, input.decimals),
    calls: [
      { to: BASE_USDC, data: approveData, value: "0x0" },
      { to: AAVE_V3_BASE_POOL, data: supplyData, value: "0x0" },
    ],
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
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit plan is invalid.",
    );
  }

  return BigInt(`0x${word}`);
}

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

/** Decode and refuse anything that is not exact-amount approve + supply. Does not send. */
export function assertExecutableAaveDepositPlan(
  plan: PreparedAaveDepositPlan,
  expectedSmartWalletAddress: string,
): bigint {
  const expectedWallet = normalizeAddress(expectedSmartWalletAddress);
  if (!ADDRESS_PATTERN.test(expectedSmartWalletAddress.trim())) {
    throw new AaveDepositPlanError(
      500,
      "INTERNAL_ERROR",
      "Smart wallet address is invalid.",
    );
  }

  if (plan.chain !== "base" || plan.chainId !== BASE_CHAIN_ID) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit must be on Base.",
    );
  }

  if (normalizeAddress(plan.smartWalletAddress) !== expectedWallet) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit is not for your Smart Wallet.",
    );
  }

  if (!Array.isArray(plan.calls) || plan.calls.length !== 2) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit must be one approve and one supply.",
    );
  }

  const [approve, supply] = plan.calls;
  if (!approve || !supply) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit must be one approve and one supply.",
    );
  }

  if (approve.value !== "0x0" || supply.value !== "0x0") {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit cannot send ETH.",
    );
  }

  if (normalizeAddress(approve.to) !== normalizeAddress(BASE_USDC)) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit plan is invalid.",
    );
  }

  if (normalizeAddress(supply.to) !== normalizeAddress(AAVE_V3_BASE_POOL)) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit plan is invalid.",
    );
  }

  if (
    !approve.data.startsWith(`0x${APPROVE_SELECTOR}`) ||
    approve.data.length !== 138
  ) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit plan is invalid.",
    );
  }

  if (
    !supply.data.startsWith(`0x${SUPPLY_SELECTOR}`) ||
    supply.data.length !== 266
  ) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit plan is invalid.",
    );
  }

  const approveSpender = wordToAddress(readHexWord(approve.data, 0));
  const approveAmount = wordToUint(readHexWord(approve.data, 1));
  const supplyAsset = wordToAddress(readHexWord(supply.data, 0));
  const supplyAmount = wordToUint(readHexWord(supply.data, 1));
  const onBehalfOf = wordToAddress(readHexWord(supply.data, 2));
  const referral = wordToUint(readHexWord(supply.data, 3));

  if (approveSpender !== normalizeAddress(AAVE_V3_BASE_POOL)) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit plan is invalid.",
    );
  }

  if (supplyAsset !== normalizeAddress(BASE_USDC)) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit plan is invalid.",
    );
  }

  if (onBehalfOf !== expectedWallet) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit must credit your Smart Wallet.",
    );
  }

  if (referral !== 0n) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit plan is invalid.",
    );
  }

  if (approveAmount !== supplyAmount || approveAmount <= 0n) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit amount is invalid.",
    );
  }

  if (approveAmount === UINT256_MAX || approveAmount > parseUsdcAmountToRaw(plan.amountUsdc, 6)) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit can only approve the exact amount.",
    );
  }

  if (approveAmount !== parseUsdcAmountToRaw(plan.amountUsdc, 6)) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit amount is invalid.",
    );
  }

  return approveAmount;
}

export function toPlanFromStoredCalls(
  input: {
    smartWalletAddress: string;
    amountUsdc: string;
    calls: AaveDepositCall[];
  },
): PreparedAaveDepositPlan {
  if (input.calls.length !== 2 || !input.calls[0] || !input.calls[1]) {
    throw new AaveDepositPlanError(
      500,
      "INTERNAL_ERROR",
      "Unable to prepare this deposit.",
    );
  }

  return {
    chain: "base",
    chainId: BASE_CHAIN_ID,
    smartWalletAddress: input.smartWalletAddress,
    amountUsdc: input.amountUsdc,
    calls: [input.calls[0], input.calls[1]],
  };
}

export function assertPlanHasNoSecrets(
  plan: PreparedAaveDepositPlan,
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
    throw new AaveDepositPlanError(
      500,
      "INTERNAL_ERROR",
      "Unable to prepare this deposit.",
    );
  }
}
