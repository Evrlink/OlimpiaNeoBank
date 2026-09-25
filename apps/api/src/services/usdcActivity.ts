import { env } from "../config/env.js";
import type { ActivityItem } from "../lib/responses.js";
import type { PrivyActivityPage } from "./privyActivity.js";

const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const DEFAULT_BASE_RPC_URL = "https://mainnet.base.org";
const LOOKBACK_BLOCKS = 24_000n;
const CHUNK_BLOCKS = 8_000n;
const MAX_RPC_CALLS = 64;

type Fetch = typeof fetch;

type JsonRpcResponse = {
  result?: unknown;
  error?: { code?: number; message?: string };
};

type RpcLog = {
  transactionHash?: unknown;
  blockNumber?: unknown;
  logIndex?: unknown;
  topics?: unknown;
  data?: unknown;
};

export type UsdcTransferLog = {
  id: string;
  type: "received" | "sent";
  amountUsd: string;
  blockNumber: bigint;
  logIndex: number;
};

export class InvalidUsdcActivityCursorError extends Error {
  constructor() {
    super("Invalid activity cursor.");
    this.name = "InvalidUsdcActivityCursorError";
  }
}

export class UsdcActivityLookupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsdcActivityLookupError";
  }
}

function formatUsd(raw: bigint): string {
  return (Number(raw) / 1_000_000).toFixed(2);
}

function padTopicAddress(address: string): string {
  return `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;
}

function toHex(value: bigint): string {
  return `0x${value.toString(16)}`;
}

function parseHexUint(value: unknown): bigint | null {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}

function parseLogIndex(value: unknown): number | null {
  const parsed = parseHexUint(value);
  if (parsed == null || parsed > BigInt(Number.MAX_SAFE_INTEGER)) {
    return null;
  }

  return Number(parsed);
}

function isLogRangeError(error: { code?: number; message?: string }): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === -32005 ||
    message.includes("block range") ||
    message.includes("query exceeds") ||
    message.includes("range is too large") ||
    message.includes("too many results") ||
    message.includes("limited to")
  );
}

export function encodeActivityCursor(
  blockNumber: bigint,
  logIndex: number,
): string {
  return `${blockNumber.toString()}:${logIndex.toString()}`;
}

export function parseActivityCursor(
  cursor: string,
): { blockNumber: bigint; logIndex: number } | null {
  const match = cursor.trim().match(/^(\d+):(\d+)$/);
  if (!match) {
    return null;
  }

  const blockNumber = BigInt(match[1]);
  const logIndex = Number(match[2]);

  if (!Number.isInteger(logIndex) || logIndex < 0) {
    return null;
  }

  return { blockNumber, logIndex };
}

export function isOlderThanCursor(
  item: { blockNumber: bigint; logIndex: number },
  cursor: { blockNumber: bigint; logIndex: number },
): boolean {
  return (
    item.blockNumber < cursor.blockNumber ||
    (item.blockNumber === cursor.blockNumber && item.logIndex < cursor.logIndex)
  );
}

export function toUsdcTransferLog(
  log: RpcLog,
  wallet: string,
): UsdcTransferLog | null {
  const hash =
    typeof log.transactionHash === "string" ? log.transactionHash.trim() : "";
  const blockNumber = parseHexUint(log.blockNumber);
  const logIndex = parseLogIndex(log.logIndex);
  const topics = Array.isArray(log.topics) ? log.topics : [];
  const data = typeof log.data === "string" ? log.data : "";
  const amount = parseHexUint(data);

  if (
    !hash ||
    blockNumber == null ||
    logIndex == null ||
    topics[0]?.toString().toLowerCase() !== TRANSFER_TOPIC ||
    typeof topics[1] !== "string" ||
    typeof topics[2] !== "string" ||
    amount == null ||
    amount <= 0n
  ) {
    return null;
  }

  const from = `0x${topics[1].slice(-40)}`.toLowerCase();
  const to = `0x${topics[2].slice(-40)}`.toLowerCase();
  const owner = wallet.toLowerCase();

  let type: "received" | "sent" | null = null;

  if (to === owner && from !== owner) {
    type = "received";
  } else if (from === owner && to !== owner) {
    type = "sent";
  }

  if (!type) {
    return null;
  }

  return {
    id: `${hash}:${logIndex}`,
    type,
    amountUsd: formatUsd(amount),
    blockNumber,
    logIndex,
  };
}

export function mergeSortUsdcLogs(logs: UsdcTransferLog[]): UsdcTransferLog[] {
  const unique = new Map<string, UsdcTransferLog>();

  for (const log of logs) {
    unique.set(log.id, log);
  }

  return [...unique.values()].sort((left, right) => {
    if (left.blockNumber === right.blockNumber) {
      return right.logIndex - left.logIndex;
    }

    return left.blockNumber < right.blockNumber ? 1 : -1;
  });
}

function paginateUsdcLogs(
  logs: UsdcTransferLog[],
  limit: number,
  cursor?: { blockNumber: bigint; logIndex: number },
): { items: UsdcTransferLog[]; nextCursor: string | null } {
  const filtered = cursor
    ? logs.filter((item) => isOlderThanCursor(item, cursor))
    : logs;
  const items = filtered.slice(0, limit);
  const last = items[items.length - 1];
  const nextCursor =
    filtered.length > items.length && last
      ? encodeActivityCursor(last.blockNumber, last.logIndex)
      : null;

  return { items, nextCursor };
}

class RpcBudget {
  remaining: number;

  constructor(limit: number) {
    this.remaining = limit;
  }

  consume(): void {
    if (this.remaining <= 0) {
      throw new UsdcActivityLookupError(
        "USDC activity lookup exceeded the RPC budget.",
      );
    }

    this.remaining -= 1;
  }
}

async function rpcCall(
  fetchImpl: Fetch,
  rpcUrl: string,
  method: string,
  params: unknown[],
  budget: RpcBudget,
): Promise<unknown> {
  budget.consume();

  const response = await fetchImpl(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new UsdcActivityLookupError("USDC activity request failed.");
  }

  const body = (await response.json()) as JsonRpcResponse;

  if (body.error) {
    const error = new Error(body.error.message ?? "RPC error") as Error & {
      code?: number;
      rpcError?: { code?: number; message?: string };
    };
    error.code = body.error.code;
    error.rpcError = body.error;
    throw error;
  }

  return body.result;
}

async function getLogsInRange(
  fetchImpl: Fetch,
  rpcUrl: string,
  fromBlock: bigint,
  toBlock: bigint,
  topics: Array<string | null>,
  budget: RpcBudget,
): Promise<unknown[]> {
  try {
    const result = await rpcCall(
      fetchImpl,
      rpcUrl,
      "eth_getLogs",
      [
        {
          address: BASE_USDC,
          fromBlock: toHex(fromBlock),
          toBlock: toHex(toBlock),
          topics,
        },
      ],
      budget,
    );

    return Array.isArray(result) ? result : [];
  } catch (error) {
    const rpcError =
      error && typeof error === "object" && "rpcError" in error
        ? (error as { rpcError?: { code?: number; message?: string } }).rpcError
        : undefined;

    if (
      rpcError &&
      isLogRangeError(rpcError) &&
      toBlock > fromBlock
    ) {
      const mid = fromBlock + (toBlock - fromBlock) / 2n;
      const older = await getLogsInRange(
        fetchImpl,
        rpcUrl,
        fromBlock,
        mid,
        topics,
        budget,
      );
      const newer = await getLogsInRange(
        fetchImpl,
        rpcUrl,
        mid + 1n,
        toBlock,
        topics,
        budget,
      );
      return older.concat(newer);
    }

    throw error instanceof UsdcActivityLookupError
      ? error
      : new UsdcActivityLookupError("USDC activity request failed.");
  }
}

/** Read-only Base USDC Transfer logs for one address. No transactions. */
export async function getUsdcActivityOnBase(
  address: string,
  limit: number,
  cursor?: string,
  fetchImpl: Fetch = fetch,
): Promise<PrivyActivityPage> {
  const wallet = address.trim();
  if (!ADDRESS_PATTERN.test(wallet)) {
    throw new UsdcActivityLookupError("Invalid wallet address.");
  }

  let parsedCursor: { blockNumber: bigint; logIndex: number } | undefined;
  if (cursor) {
    const parsed = parseActivityCursor(cursor);
    if (!parsed) {
      throw new InvalidUsdcActivityCursorError();
    }
    parsedCursor = parsed;
  }

  const rpcUrl = env.baseRpcUrl.trim() || DEFAULT_BASE_RPC_URL;
  const budget = new RpcBudget(MAX_RPC_CALLS);
  const latestHex = await rpcCall(
    fetchImpl,
    rpcUrl,
    "eth_blockNumber",
    [],
    budget,
  );
  const latest = parseHexUint(latestHex);

  if (latest == null) {
    throw new UsdcActivityLookupError("Invalid latest block response.");
  }

  const windowStart =
    latest >= LOOKBACK_BLOCKS ? latest - LOOKBACK_BLOCKS + 1n : 0n;
  const padded = padTopicAddress(wallet);
  const collected: UsdcTransferLog[] = [];
  let rangeEnd = latest;
  let lookupFailed = false;

  while (rangeEnd >= windowStart) {
    const rangeStart =
      rangeEnd >= windowStart + CHUNK_BLOCKS - 1n
        ? rangeEnd - CHUNK_BLOCKS + 1n
        : windowStart;

    try {
      const inbound = await getLogsInRange(
        fetchImpl,
        rpcUrl,
        rangeStart,
        rangeEnd,
        [TRANSFER_TOPIC, null, padded],
        budget,
      );
      const outbound = await getLogsInRange(
        fetchImpl,
        rpcUrl,
        rangeStart,
        rangeEnd,
        [TRANSFER_TOPIC, padded, null],
        budget,
      );

      collected.push(
        ...[...inbound, ...outbound]
          .map((log) => toUsdcTransferLog(log as RpcLog, wallet))
          .filter((item): item is UsdcTransferLog => item !== null),
      );
    } catch {
      lookupFailed = true;
      break;
    }

    const pageSoFar = paginateUsdcLogs(
      mergeSortUsdcLogs(collected),
      limit,
      parsedCursor,
    );
    if (pageSoFar.items.length === limit && pageSoFar.nextCursor) {
      break;
    }

    if (rangeStart <= windowStart) {
      break;
    }

    rangeEnd = rangeStart - 1n;
  }

  const parsed = mergeSortUsdcLogs(collected);
  if (lookupFailed && parsed.filter((item) =>
    parsedCursor ? isOlderThanCursor(item, parsedCursor) : true,
  ).length === 0) {
    throw new UsdcActivityLookupError("USDC activity request failed.");
  }

  const page = paginateUsdcLogs(parsed, limit, parsedCursor);
  if (lookupFailed && page.items.length > 0 && page.nextCursor == null) {
    const last = page.items[page.items.length - 1];
    if (last) {
      page.nextCursor = encodeActivityCursor(last.blockNumber, last.logIndex);
    }
  }

  const timestamps = new Map<string, string>();

  for (const item of page.items) {
    const key = item.blockNumber.toString();
    if (timestamps.has(key)) {
      continue;
    }

    const block = await rpcCall(
      fetchImpl,
      rpcUrl,
      "eth_getBlockByNumber",
      [toHex(item.blockNumber), false],
      budget,
    );
    const timestamp = parseHexUint(
      block && typeof block === "object"
        ? (block as { timestamp?: unknown }).timestamp
        : undefined,
    );

    if (timestamp == null) {
      throw new UsdcActivityLookupError("Invalid block timestamp response.");
    }

    timestamps.set(key, new Date(Number(timestamp) * 1000).toISOString());
  }

  return {
    items: page.items.map((item) => ({
      id: item.id,
      type: item.type,
      amountUsd: item.amountUsd,
      status: "completed",
      counterpartyId: null,
      createdAt: timestamps.get(item.blockNumber.toString()) ?? "",
    })) satisfies ActivityItem[],
    nextCursor: page.nextCursor,
  };
}
