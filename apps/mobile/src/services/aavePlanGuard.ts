import {
  AAVE_V3_BASE_POOL,
  BASE_CHAIN_ID,
  BASE_USDC,
} from "@/services/aaveAddresses";
import type { PreparedAaveDepositPlan } from "@/services/api/growth";

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;
const APPROVE_SELECTOR = "095ea7b3";
const SUPPLY_SELECTOR = "617ba037";
const UINT256_MAX = (1n << 256n) - 1n;

export class AavePlanGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AavePlanGuardError";
  }
}

export type ExecutableAaveCalls = [
  { to: `0x${string}`; data: `0x${string}`; value: 0n },
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
    throw new AavePlanGuardError("This deposit plan is invalid.");
  }

  return BigInt(`0x${word}`);
}

function parseUsdcAmountToRaw(amountUsdc: string): bigint {
  const trimmed = amountUsdc.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) {
    throw new AavePlanGuardError("Enter a valid USDC amount.");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  const raw = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
  if (raw <= 0n) {
    throw new AavePlanGuardError("Enter a valid USDC amount.");
  }

  return raw;
}

/** Client-side 3C.3 guards. Does not send a transaction. */
export function assertExecutableAavePlan(input: {
  plan: PreparedAaveDepositPlan;
  expectedSmartWalletAddress: string;
  embeddedEoaAddress: string | null;
  clientChainId: number | null;
  clientSmartWalletAddress: string | null;
}): { rawAmount: bigint; calls: ExecutableAaveCalls } {
  const { plan } = input;
  const expectedWallet = normalizeAddress(input.expectedSmartWalletAddress);

  if (!ADDRESS_PATTERN.test(input.expectedSmartWalletAddress.trim())) {
    throw new AavePlanGuardError("Smart wallet address is invalid.");
  }

  if (!plan.executionEnabled) {
    throw new AavePlanGuardError("Smart Wallet deposits are not enabled.");
  }

  if (plan.chain !== "base" || plan.chainId !== BASE_CHAIN_ID) {
    throw new AavePlanGuardError("This deposit must be on Base.");
  }

  if (input.clientChainId !== BASE_CHAIN_ID) {
    throw new AavePlanGuardError("Refusing to send: smart wallet client is not Base.");
  }

  if (!input.clientSmartWalletAddress || !ADDRESS_PATTERN.test(input.clientSmartWalletAddress)) {
    throw new AavePlanGuardError("Refusing to send: a wallet address is missing.");
  }

  const clientWallet = normalizeAddress(input.clientSmartWalletAddress);
  if (
    clientWallet !== expectedWallet ||
    normalizeAddress(plan.smartWalletAddress) !== expectedWallet
  ) {
    throw new AavePlanGuardError("Refusing to send: Smart Wallet address does not match.");
  }

  if (
    input.embeddedEoaAddress &&
    normalizeAddress(input.embeddedEoaAddress) === clientWallet
  ) {
    throw new AavePlanGuardError(
      "Refusing to send: smart wallet address matches the embedded EOA.",
    );
  }

  if (!Array.isArray(plan.calls) || plan.calls.length !== 2) {
    throw new AavePlanGuardError("This deposit must be one approve and one supply.");
  }

  const approve = plan.calls[0];
  const supply = plan.calls[1];
  if (!approve || !supply) {
    throw new AavePlanGuardError("This deposit must be one approve and one supply.");
  }

  if (approve.value !== "0x0" || supply.value !== "0x0") {
    throw new AavePlanGuardError("This deposit cannot send ETH.");
  }

  if (normalizeAddress(approve.to) !== normalizeAddress(BASE_USDC)) {
    throw new AavePlanGuardError("This deposit plan is invalid.");
  }

  if (normalizeAddress(supply.to) !== normalizeAddress(AAVE_V3_BASE_POOL)) {
    throw new AavePlanGuardError("This deposit plan is invalid.");
  }

  if (!approve.data.startsWith(`0x${APPROVE_SELECTOR}`) || approve.data.length !== 138) {
    throw new AavePlanGuardError("This deposit plan is invalid.");
  }

  if (!supply.data.startsWith(`0x${SUPPLY_SELECTOR}`) || supply.data.length !== 266) {
    throw new AavePlanGuardError("This deposit plan is invalid.");
  }

  const approveSpender = wordToAddress(readHexWord(approve.data, 0));
  const approveAmount = wordToUint(readHexWord(approve.data, 1));
  const supplyAsset = wordToAddress(readHexWord(supply.data, 0));
  const supplyAmount = wordToUint(readHexWord(supply.data, 1));
  const onBehalfOf = wordToAddress(readHexWord(supply.data, 2));
  const referral = wordToUint(readHexWord(supply.data, 3));
  const reviewedRaw = parseUsdcAmountToRaw(plan.amountUsdc);

  if (approveSpender !== normalizeAddress(AAVE_V3_BASE_POOL)) {
    throw new AavePlanGuardError("This deposit plan is invalid.");
  }

  if (supplyAsset !== normalizeAddress(BASE_USDC)) {
    throw new AavePlanGuardError("This deposit plan is invalid.");
  }

  if (onBehalfOf !== expectedWallet) {
    throw new AavePlanGuardError("This deposit must credit your Smart Wallet.");
  }

  if (referral !== 0n) {
    throw new AavePlanGuardError("This deposit plan is invalid.");
  }

  if (
    approveAmount !== supplyAmount ||
    approveAmount !== reviewedRaw ||
    approveAmount === UINT256_MAX
  ) {
    throw new AavePlanGuardError("This deposit can only approve the exact amount.");
  }

  return {
    rawAmount: approveAmount,
    calls: [
      {
        to: approve.to as `0x${string}`,
        data: approve.data as `0x${string}`,
        value: 0n,
      },
      {
        to: supply.to as `0x${string}`,
        data: supply.data as `0x${string}`,
        value: 0n,
      },
    ],
  };
}
