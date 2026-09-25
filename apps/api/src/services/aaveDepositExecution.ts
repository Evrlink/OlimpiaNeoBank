import { env } from "../config/env.js";
import {
  AAVE_V3_BASE_POOL,
  AAVE_V3_BASE_USDC_A_TOKEN,
  BASE_USDC,
} from "./aaveAddresses.js";
import { AaveDepositPlanError } from "./aaveDepositPlan.js";

const DEFAULT_BASE_RPC_URL = "https://mainnet.base.org";
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

type Fetch = typeof fetch;

type ReceiptLog = {
  address?: unknown;
  topics?: unknown;
  data?: unknown;
};

type TransactionReceipt = {
  status?: unknown;
  logs?: ReceiptLog[];
};

export class AaveDepositReceiptPendingError extends Error {
  constructor() {
    super("This deposit is still confirming.");
    this.name = "AaveDepositReceiptPendingError";
  }
}

export function requireAaveSmartWalletDepositsEnabled(
  enabled = env.aaveSmartWalletDepositsEnabled,
): void {
  if (!enabled) {
    throw new AaveDepositPlanError(
      403,
      "VALIDATION_ERROR",
      "Smart Wallet deposits are not enabled.",
    );
  }
}

export function parseTransactionHash(value: unknown): string {
  if (typeof value !== "string" || !TX_HASH_PATTERN.test(value)) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "Enter a valid transaction hash.",
    );
  }

  return value;
}

function padTopicAddress(address: string): string {
  return `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;
}

function normalizeAddress(value: unknown): string | null {
  if (typeof value !== "string" || !ADDRESS_PATTERN.test(value)) {
    return null;
  }

  return value.toLowerCase();
}

function parseLogAmount(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}

function hasUsdcTransferToPool(
  logs: ReceiptLog[],
  smartWalletAddress: string,
  rawAmount: bigint,
): boolean {
  const fromTopic = padTopicAddress(smartWalletAddress);
  const toTopic = padTopicAddress(AAVE_V3_BASE_POOL);

  return logs.some((log) => {
    const address = normalizeAddress(log.address);
    const topics = Array.isArray(log.topics) ? log.topics : [];
    const amount = parseLogAmount(log.data);
    return (
      address === BASE_USDC.toLowerCase() &&
      topics[0] === TRANSFER_TOPIC &&
      topics[1] === fromTopic &&
      topics[2] === toTopic &&
      amount === rawAmount
    );
  });
}

function hasAusdcCredit(
  logs: ReceiptLog[],
  smartWalletAddress: string,
): boolean {
  const toTopic = padTopicAddress(smartWalletAddress);

  return logs.some((log) => {
    const address = normalizeAddress(log.address);
    const topics = Array.isArray(log.topics) ? log.topics : [];
    return (
      address === AAVE_V3_BASE_USDC_A_TOKEN.toLowerCase() &&
      topics[0] === TRANSFER_TOPIC &&
      topics[2] === toTopic
    );
  });
}

/** Read-only receipt check. Does not send a transaction. */
export async function verifyAaveDepositReceipt(
  input: {
    transactionHash: string;
    smartWalletAddress: string;
    rawAmount: bigint;
  },
  fetchImpl: Fetch = fetch,
): Promise<void> {
  const hash = parseTransactionHash(input.transactionHash);
  const rpcUrl = env.baseRpcUrl.trim() || DEFAULT_BASE_RPC_URL;
  const response = await fetchImpl(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getTransactionReceipt",
      params: [hash],
    }),
  });

  if (!response.ok) {
    throw new AaveDepositPlanError(
      502,
      "PRIVY_UNAVAILABLE",
      "Unable to confirm this deposit.",
    );
  }

  const body = (await response.json()) as {
    result?: TransactionReceipt | null;
    error?: unknown;
  };

  if (body.error) {
    throw new AaveDepositPlanError(
      502,
      "PRIVY_UNAVAILABLE",
      "Unable to confirm this deposit.",
    );
  }

  if (!body.result) {
    throw new AaveDepositReceiptPendingError();
  }

  if (body.result.status !== "0x1") {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit did not succeed.",
    );
  }

  const logs = Array.isArray(body.result.logs) ? body.result.logs : [];
  if (
    !hasUsdcTransferToPool(logs, input.smartWalletAddress, input.rawAmount) ||
    !hasAusdcCredit(logs, input.smartWalletAddress)
  ) {
    throw new AaveDepositPlanError(
      400,
      "VALIDATION_ERROR",
      "This deposit receipt does not match the prepared amount.",
    );
  }
}
