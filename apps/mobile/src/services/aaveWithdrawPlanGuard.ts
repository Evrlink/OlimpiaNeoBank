import {
  AAVE_V3_BASE_POOL,
  BASE_CHAIN_ID,
  BASE_USDC,
} from "@/services/aaveAddresses";
import type { PreparedAaveWithdrawPlan } from "@/services/api/growth";

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;
const WITHDRAW_SELECTOR = "69328dec";
const UINT256_MAX = (1n << 256n) - 1n;

export class AaveWithdrawPlanGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AaveWithdrawPlanGuardError";
  }
}

export type ExecutableAaveWithdrawCalls = [
  { to: `0x${string}`; data: `0x${string}`; value: 0n },
];

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
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
    throw new AaveWithdrawPlanGuardError("This withdrawal plan is invalid.");
  }

  return BigInt(`0x${word}`);
}

function parseUsdcAmountToRaw(amountUsdc: string): bigint {
  const trimmed = amountUsdc.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) {
    throw new AaveWithdrawPlanGuardError("Enter a valid USDC amount.");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  const raw = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
  if (raw <= 0n) {
    throw new AaveWithdrawPlanGuardError("Enter a valid USDC amount.");
  }

  return raw;
}

/** Client-side 3D.2 guards. Does not send a transaction. */
export function assertExecutableAaveWithdrawPlan(input: {
  plan: PreparedAaveWithdrawPlan;
  moneyAddressMode: "eoa" | "smart_wallet" | null | undefined;
  expectedSmartWalletAddress: string;
  embeddedEoaAddress: string | null;
  clientChainId: number | null;
  clientSmartWalletAddress: string | null;
}): { rawAmount: bigint; calls: ExecutableAaveWithdrawCalls } {
  const { plan } = input;
  const expectedWallet = normalizeAddress(input.expectedSmartWalletAddress);

  if (input.moneyAddressMode !== "smart_wallet") {
    throw new AaveWithdrawPlanGuardError(
      "This withdrawal path is only for Smart Wallet accounts.",
    );
  }

  if (!ADDRESS_PATTERN.test(input.expectedSmartWalletAddress.trim())) {
    throw new AaveWithdrawPlanGuardError("Smart wallet address is invalid.");
  }

  if (!plan.executionEnabled) {
    throw new AaveWithdrawPlanGuardError("Smart Wallet withdrawals are not enabled.");
  }

  if (plan.chain !== "base" || plan.chainId !== BASE_CHAIN_ID) {
    throw new AaveWithdrawPlanGuardError("This withdrawal must be on Base.");
  }

  if (input.clientChainId !== BASE_CHAIN_ID) {
    throw new AaveWithdrawPlanGuardError("Refusing to send: smart wallet client is not Base.");
  }

  if (!input.clientSmartWalletAddress || !ADDRESS_PATTERN.test(input.clientSmartWalletAddress)) {
    throw new AaveWithdrawPlanGuardError("Refusing to send: a wallet address is missing.");
  }

  const clientWallet = normalizeAddress(input.clientSmartWalletAddress);
  if (
    clientWallet !== expectedWallet ||
    normalizeAddress(plan.smartWalletAddress) !== expectedWallet
  ) {
    throw new AaveWithdrawPlanGuardError("Refusing to send: Smart Wallet address does not match.");
  }

  if (
    input.embeddedEoaAddress &&
    normalizeAddress(input.embeddedEoaAddress) === clientWallet
  ) {
    throw new AaveWithdrawPlanGuardError(
      "Refusing to send: smart wallet address matches the embedded EOA.",
    );
  }

  if (!Array.isArray(plan.calls) || plan.calls.length !== 1) {
    throw new AaveWithdrawPlanGuardError("This withdrawal must be one Aave withdraw call.");
  }

  const withdraw = plan.calls[0];
  if (!withdraw) {
    throw new AaveWithdrawPlanGuardError("This withdrawal must be one Aave withdraw call.");
  }

  if (withdraw.value !== "0x0") {
    throw new AaveWithdrawPlanGuardError("This withdrawal cannot send ETH.");
  }

  if (normalizeAddress(withdraw.to) !== normalizeAddress(AAVE_V3_BASE_POOL)) {
    throw new AaveWithdrawPlanGuardError("This withdrawal plan is invalid.");
  }

  if (
    !withdraw.data.startsWith(`0x${WITHDRAW_SELECTOR}`) ||
    withdraw.data.length !== 202
  ) {
    throw new AaveWithdrawPlanGuardError("This withdrawal plan is invalid.");
  }

  const asset = wordToAddress(readHexWord(withdraw.data, 0));
  const amount = wordToUint(readHexWord(withdraw.data, 1));
  const destination = wordToAddress(readHexWord(withdraw.data, 2));
  const reviewedRaw = parseUsdcAmountToRaw(plan.amountUsdc);

  if (asset !== normalizeAddress(BASE_USDC)) {
    throw new AaveWithdrawPlanGuardError("This withdrawal plan is invalid.");
  }

  if (destination !== expectedWallet) {
    throw new AaveWithdrawPlanGuardError(
      "This withdrawal must return USDC to your Smart Wallet.",
    );
  }

  if (amount <= 0n || amount === UINT256_MAX || amount !== reviewedRaw) {
    throw new AaveWithdrawPlanGuardError("This withdrawal can only use an exact amount.");
  }

  return {
    rawAmount: amount,
    calls: [
      {
        to: withdraw.to as `0x${string}`,
        data: withdraw.data as `0x${string}`,
        value: 0n,
      },
    ],
  };
}
