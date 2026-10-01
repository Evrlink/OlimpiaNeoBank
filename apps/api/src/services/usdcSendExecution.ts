import { env } from "../config/env.js";
import { BASE_USDC } from "./aaveAddresses.js";
import { UsdcSendPlanError } from "./usdcSendPlan.js";

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

export class UsdcSendReceiptPendingError extends Error {
  constructor() {
    super("This send is still confirming.");
    this.name = "UsdcSendReceiptPendingError";
  }
}

export function requireSmartWalletSendsEnabled(
  enabled = env.smartWalletSendsEnabled,
): void {
  if (!enabled) {
    throw new UsdcSendPlanError(
      403,
      "VALIDATION_ERROR",
      "Smart Wallet sends are not enabled.",
    );
  }
}

export function parseSendTransactionHash(value: unknown): string {
  if (typeof value !== "string" || !TX_HASH_PATTERN.test(value)) {
    throw new UsdcSendPlanError(
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

function hasUsdcTransferFromSmartWallet(
  logs: ReceiptLog[],
  smartWalletAddress: string,
  destinationAddress: string,
  rawAmount: bigint,
): boolean {
  const fromTopic = padTopicAddress(smartWalletAddress);
  const toTopic = padTopicAddress(destinationAddress);

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

/** Read-only receipt check. Does not send a transaction. */
export async function verifyUsdcSendReceipt(
  input: {
    transactionHash: string;
    smartWalletAddress: string;
    destinationAddress: string;
    rawAmount: bigint;
  },
  fetchImpl: Fetch = fetch,
): Promise<void> {
  const hash = parseSendTransactionHash(input.transactionHash);
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
    throw new UsdcSendPlanError(
      502,
      "PRIVY_UNAVAILABLE",
      "Unable to confirm this send.",
    );
  }

  const body = (await response.json()) as {
    result?: TransactionReceipt | null;
    error?: unknown;
  };

  if (body.error) {
    throw new UsdcSendPlanError(
      502,
      "PRIVY_UNAVAILABLE",
      "Unable to confirm this send.",
    );
  }

  if (!body.result) {
    throw new UsdcSendReceiptPendingError();
  }

  if (body.result.status !== "0x1") {
    throw new UsdcSendReceiptPendingError();
  }

  const logs = Array.isArray(body.result.logs) ? body.result.logs : [];
  if (
    !hasUsdcTransferFromSmartWallet(
      logs,
      input.smartWalletAddress,
      input.destinationAddress,
      input.rawAmount,
    )
  ) {
    throw new UsdcSendReceiptPendingError();
  }
}
