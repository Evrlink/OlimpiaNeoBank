import {
  AAVE_V3_BASE_POOL,
  BASE_CHAIN_ID,
  BASE_USDC,
} from "./aaveAddresses.js";

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;
const APPROVE_SELECTOR = "095ea7b3";
const SUPPLY_SELECTOR = "617ba037";

export class AaveDepositPlanError extends Error {
  readonly status: number;
  readonly code:
    | "VALIDATION_ERROR"
    | "USER_NOT_FOUND"
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
