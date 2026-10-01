import {
  AAVE_V3_BASE_POOL,
  AAVE_V3_BASE_USDC_A_TOKEN,
  BASE_CHAIN_ID,
  BASE_USDC,
} from "@/services/aaveAddresses";
import type { PreparedUsdcSendPlan } from "@/services/api/sends";

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;
const TRANSFER_SELECTOR = "a9059cbb";
const TRANSFER_DATA_LENGTH = 138;
const UINT256_MAX = (1n << 256n) - 1n;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export class UsdcSendPlanGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsdcSendPlanGuardError";
  }
}

export type ExecutableUsdcSendCalls = [
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
    throw new UsdcSendPlanGuardError("This send plan is invalid.");
  }

  return BigInt(`0x${word}`);
}

function parseUsdcAmountToRaw(amountUsdc: string): bigint {
  const trimmed = amountUsdc.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) {
    throw new UsdcSendPlanGuardError("Enter a valid USDC amount.");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  const raw = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
  if (raw <= 0n) {
    throw new UsdcSendPlanGuardError("Enter a valid USDC amount.");
  }

  return raw;
}

function isForbiddenDestination(destination: string, smartWallet: string): boolean {
  const dest = normalizeAddress(destination);
  return (
    dest === normalizeAddress(smartWallet) ||
    dest === ZERO_ADDRESS ||
    dest === normalizeAddress(BASE_USDC) ||
    dest === normalizeAddress(AAVE_V3_BASE_USDC_A_TOKEN) ||
    dest === normalizeAddress(AAVE_V3_BASE_POOL)
  );
}

/** Client-side 3E.2 guards. Does not send a transaction. */
export function assertExecutableUsdcSendPlan(input: {
  plan: PreparedUsdcSendPlan;
  moneyAddressMode: "eoa" | "smart_wallet" | null | undefined;
  expectedSmartWalletAddress: string;
  embeddedEoaAddress: string | null;
  clientChainId: number | null;
  clientSmartWalletAddress: string | null;
}): { rawAmount: bigint; calls: ExecutableUsdcSendCalls } {
  const { plan } = input;
  const expectedWallet = normalizeAddress(input.expectedSmartWalletAddress);

  if (input.moneyAddressMode !== "smart_wallet") {
    throw new UsdcSendPlanGuardError("This send path is only for Smart Wallet accounts.");
  }

  if (!ADDRESS_PATTERN.test(input.expectedSmartWalletAddress.trim())) {
    throw new UsdcSendPlanGuardError("Smart wallet address is invalid.");
  }

  if (!plan.executionEnabled) {
    throw new UsdcSendPlanGuardError("Smart Wallet sends are not enabled.");
  }

  if (plan.chain !== "base" || plan.chainId !== BASE_CHAIN_ID) {
    throw new UsdcSendPlanGuardError("This send must be on Base.");
  }

  if (input.clientChainId !== BASE_CHAIN_ID) {
    throw new UsdcSendPlanGuardError("Refusing to send: smart wallet client is not Base.");
  }

  if (!input.clientSmartWalletAddress || !ADDRESS_PATTERN.test(input.clientSmartWalletAddress)) {
    throw new UsdcSendPlanGuardError("Refusing to send: a wallet address is missing.");
  }

  const clientWallet = normalizeAddress(input.clientSmartWalletAddress);
  if (
    clientWallet !== expectedWallet ||
    normalizeAddress(plan.smartWalletAddress) !== expectedWallet
  ) {
    throw new UsdcSendPlanGuardError("Refusing to send: Smart Wallet address does not match.");
  }

  if (
    input.embeddedEoaAddress &&
    normalizeAddress(input.embeddedEoaAddress) === clientWallet
  ) {
    throw new UsdcSendPlanGuardError(
      "Refusing to send: smart wallet address matches the embedded EOA.",
    );
  }

  if (isForbiddenDestination(plan.destinationAddress, expectedWallet)) {
    throw new UsdcSendPlanGuardError("This destination cannot receive this send.");
  }

  if (!Array.isArray(plan.calls) || plan.calls.length !== 1) {
    throw new UsdcSendPlanGuardError("This send must be one USDC transfer.");
  }

  const transfer = plan.calls[0];
  if (!transfer) {
    throw new UsdcSendPlanGuardError("This send must be one USDC transfer.");
  }

  if (transfer.value !== "0x0") {
    throw new UsdcSendPlanGuardError("This send cannot send ETH.");
  }

  if (normalizeAddress(transfer.to) !== normalizeAddress(BASE_USDC)) {
    throw new UsdcSendPlanGuardError("This send plan is invalid.");
  }

  if (
    !transfer.data.startsWith(`0x${TRANSFER_SELECTOR}`) ||
    transfer.data.length !== TRANSFER_DATA_LENGTH
  ) {
    throw new UsdcSendPlanGuardError("This send plan is invalid.");
  }

  const destination = wordToAddress(readHexWord(transfer.data, 0));
  const amount = wordToUint(readHexWord(transfer.data, 1));
  const reviewedRaw = parseUsdcAmountToRaw(plan.amountUsdc);

  if (destination !== normalizeAddress(plan.destinationAddress)) {
    throw new UsdcSendPlanGuardError("This send destination is invalid.");
  }

  if (amount <= 0n || amount === UINT256_MAX || amount !== reviewedRaw) {
    throw new UsdcSendPlanGuardError("This send can only use an exact amount.");
  }

  return {
    rawAmount: amount,
    calls: [
      {
        to: transfer.to as `0x${string}`,
        data: transfer.data as `0x${string}`,
        value: 0n,
      },
    ],
  };
}
