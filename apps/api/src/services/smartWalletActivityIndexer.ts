import { env } from "../config/env.js";
import type { ActivityItem } from "../lib/responses.js";
import type { PrivyActivityPage } from "./privyActivity.js";
import {
  encodeActivityCursor,
  InvalidUsdcActivityCursorError,
  parseActivityCursor,
  UsdcActivityLookupError,
} from "./usdcActivity.js";
import {
  classifySmartWalletActivityKind,
  createPostgresConfirmedGrowHashLookup,
  toCustomerActivityType,
  type ConfirmedGrowHashLookup,
} from "./smartWalletActivityClassification.js";
import {
  createPostgresSmartWalletActivityStore,
  type NewSmartWalletActivityEvent,
  type SmartWalletActivityStore,
  type StoredSmartWalletActivityEvent,
} from "./smartWalletActivityStore.js";

const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const DEFAULT_BASE_RPC_URL = "https://mainnet.base.org";
/** Inclusive chunk length. Public Base allows toBlock - fromBlock <= 500. */
export const INDEXER_CHUNK_BLOCKS = 501n;
export const INDEXER_MAX_RPC_CALLS = 64;
/** Base targets ~2s blocks. Used only to convert wallets.created_at → a start block. */
export const BASE_BLOCK_SECONDS = 2n;
/** ~1 hour of extra lookback so clock skew cannot skip the first Receive. */
export const START_BLOCK_SAFETY_BUFFER = 1_800n;

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

export type IndexedUsdcTransfer = {
  transactionHash: string;
  logIndex: number;
  blockNumber: bigint;
  direction: "in" | "out";
  kind: "received" | "sent";
  rawAmount: string;
  counterpartyAddress: string;
};

export type SmartWalletActivityIndexerDeps = {
  store?: SmartWalletActivityStore;
  growHashes?: ConfirmedGrowHashLookup;
  fetchImpl?: Fetch;
  now?: Date;
  maxRpcCalls?: number;
  chunkBlocks?: bigint;
};

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

function formatUsd(raw: string): string {
  return (Number(BigInt(raw)) / 1_000_000).toFixed(2);
}

function rpcUrl(): string {
  return env.baseRpcUrl.trim() || DEFAULT_BASE_RPC_URL;
}

/**
 * First-run start block: wallets.created_at (Smart Wallet registration),
 * converted from the current head timestamp using ~2s Base blocks, minus a
 * 1-hour safety buffer. This is the earliest reliable Olimpia record for the
 * Smart Wallet and avoids a genesis scan.
 */
export function estimateStartBlockFromWalletCreatedAt(input: {
  walletCreatedAt: Date;
  headBlock: bigint;
  headTimestampSeconds: bigint;
}): bigint {
  if (Number.isNaN(input.walletCreatedAt.getTime()) || input.headBlock < 0n) {
    throw new UsdcActivityLookupError("Invalid Smart Wallet start block.");
  }

  const createdSeconds = BigInt(
    Math.floor(input.walletCreatedAt.getTime() / 1000),
  );
  const bufferedHead =
    input.headBlock > START_BLOCK_SAFETY_BUFFER
      ? input.headBlock - START_BLOCK_SAFETY_BUFFER
      : 0n;

  if (input.headTimestampSeconds <= createdSeconds) {
    return bufferedHead;
  }

  const elapsed = input.headTimestampSeconds - createdSeconds;
  const ageBlocks =
    (elapsed + BASE_BLOCK_SECONDS - 1n) / BASE_BLOCK_SECONDS;
  const raw = input.headBlock - ageBlocks - START_BLOCK_SAFETY_BUFFER;
  if (raw <= 0n) {
    return 0n;
  }

  return raw > input.headBlock ? input.headBlock : raw;
}

export function toIndexedUsdcTransfer(
  log: RpcLog,
  wallet: string,
): IndexedUsdcTransfer | null {
  const hash =
    typeof log.transactionHash === "string" ? log.transactionHash.trim() : "";
  const blockNumber = parseHexUint(log.blockNumber);
  const logIndex = parseLogIndex(log.logIndex);
  const topics = Array.isArray(log.topics) ? log.topics : [];
  const data = typeof log.data === "string" ? log.data : "";
  const amount = parseHexUint(data);

  if (
    !TX_HASH_PATTERN.test(hash) ||
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

  if (to === owner && from !== owner) {
    return {
      transactionHash: hash.toLowerCase(),
      logIndex,
      blockNumber,
      direction: "in",
      kind: "received",
      rawAmount: amount.toString(),
      counterpartyAddress: from,
    };
  }

  if (from === owner && to !== owner) {
    return {
      transactionHash: hash.toLowerCase(),
      logIndex,
      blockNumber,
      direction: "out",
      kind: "sent",
      rawAmount: amount.toString(),
      counterpartyAddress: to,
    };
  }

  return null;
}

async function rpcCall(
  fetchImpl: Fetch,
  method: string,
  params: unknown[],
  budget: RpcBudget,
): Promise<unknown> {
  budget.consume();

  const response = await fetchImpl(rpcUrl(), {
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
  fromBlock: bigint,
  toBlock: bigint,
  topics: Array<string | null>,
  budget: RpcBudget,
): Promise<unknown[]> {
  try {
    const result = await rpcCall(
      fetchImpl,
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

    if (rpcError && isLogRangeError(rpcError) && toBlock > fromBlock) {
      const mid = fromBlock + (toBlock - fromBlock) / 2n;
      const older = await getLogsInRange(
        fetchImpl,
        fromBlock,
        mid,
        topics,
        budget,
      );
      const newer = await getLogsInRange(
        fetchImpl,
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

async function readBlockTimestamp(
  fetchImpl: Fetch,
  blockNumber: bigint,
  budget: RpcBudget,
): Promise<Date> {
  const block = await rpcCall(
    fetchImpl,
    "eth_getBlockByNumber",
    [toHex(blockNumber), false],
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

  return new Date(Number(timestamp) * 1000);
}

function toActivityItem(event: StoredSmartWalletActivityEvent): ActivityItem {
  return {
    id: `${event.transactionHash}:${event.logIndex}`,
    type: toCustomerActivityType(event.kind),
    amountUsd: formatUsd(event.rawAmount),
    status: "completed",
    counterpartyId: null,
    createdAt: event.blockTimestamp.toISOString(),
  };
}

async function applyConfirmedGrowLabels(
  store: SmartWalletActivityStore,
  growHashes: ConfirmedGrowHashLookup,
  userId: string,
): Promise<void> {
  const confirmed = await growHashes.listForUser(userId);
  await store.applyGrowClassification({
    userId,
    depositHashes: confirmed.depositHashes,
    withdrawalHashes: confirmed.withdrawalHashes,
  });
}

async function pageFromStore(
  store: SmartWalletActivityStore,
  userId: string,
  limit: number,
  cursor?: { blockNumber: bigint; logIndex: number },
): Promise<PrivyActivityPage> {
  const rows = await store.listEventsForUser({
    userId,
    limit: limit + 1,
    before: cursor,
  });
  const items = rows.slice(0, limit);
  const last = items[items.length - 1];
  const nextCursor =
    rows.length > items.length && last
      ? encodeActivityCursor(last.blockNumber, last.logIndex)
      : null;

  return {
    items: items.map(toActivityItem),
    nextCursor,
  };
}

async function hasIndexedHistory(
  store: SmartWalletActivityStore,
  userId: string,
  smartWalletAddress: string,
): Promise<boolean> {
  const [cursor, existing] = await Promise.all([
    store.getCursor({ userId, smartWalletAddress }),
    store.listEventsForUser({ userId, limit: 1 }),
  ]);

  return Boolean(cursor) || existing.length > 0;
}

export async function catchUpSmartWalletActivity(
  input: {
    userId: string;
    smartWalletAddress: string;
    walletCreatedAt: Date;
  },
  deps: SmartWalletActivityIndexerDeps = {},
): Promise<{ indexedThroughBlock: bigint | null; caughtUp: boolean }> {
  const wallet = input.smartWalletAddress.trim();
  if (!ADDRESS_PATTERN.test(wallet) || !input.userId.trim()) {
    throw new UsdcActivityLookupError("Invalid Smart Wallet activity context.");
  }

  const store = deps.store ?? createPostgresSmartWalletActivityStore();
  const growHashes = deps.growHashes ?? createPostgresConfirmedGrowHashLookup();
  const fetchImpl = deps.fetchImpl ?? fetch;
  const chunkBlocks = deps.chunkBlocks ?? INDEXER_CHUNK_BLOCKS;
  const budget = new RpcBudget(deps.maxRpcCalls ?? INDEXER_MAX_RPC_CALLS);
  const now = deps.now ?? new Date();

  const latestHex = await rpcCall(fetchImpl, "eth_blockNumber", [], budget);
  const head = parseHexUint(latestHex);
  if (head == null) {
    throw new UsdcActivityLookupError("Invalid latest block response.");
  }

  const existingCursor = await store.getCursor({
    userId: input.userId,
    smartWalletAddress: wallet,
  });

  let fromBlock: bigint;
  if (existingCursor) {
    fromBlock = existingCursor.indexedThroughBlock + 1n;
  } else {
    const headTime = await readBlockTimestamp(fetchImpl, head, budget);
    fromBlock = estimateStartBlockFromWalletCreatedAt({
      walletCreatedAt: input.walletCreatedAt,
      headBlock: head,
      headTimestampSeconds: BigInt(Math.floor(headTime.getTime() / 1000)),
    });
  }

  if (fromBlock > head) {
    return {
      indexedThroughBlock: existingCursor?.indexedThroughBlock ?? head,
      caughtUp: true,
    };
  }

  const padded = padTopicAddress(wallet);
  let indexedThrough = existingCursor?.indexedThroughBlock ?? null;

  for (
    let rangeStart = fromBlock;
    rangeStart <= head;
    rangeStart += chunkBlocks
  ) {
    const rangeEnd =
      rangeStart + chunkBlocks - 1n > head ? head : rangeStart + chunkBlocks - 1n;

    try {
      const inbound = await getLogsInRange(
        fetchImpl,
        rangeStart,
        rangeEnd,
        [TRANSFER_TOPIC, null, padded],
        budget,
      );
      const outbound = await getLogsInRange(
        fetchImpl,
        rangeStart,
        rangeEnd,
        [TRANSFER_TOPIC, padded, null],
        budget,
      );

      const discovered = [...inbound, ...outbound]
        .map((log) => toIndexedUsdcTransfer(log as RpcLog, wallet))
        .filter((item): item is IndexedUsdcTransfer => item !== null);

      const timestamps = new Map<string, Date>();
      for (const item of discovered) {
        const key = item.blockNumber.toString();
        if (timestamps.has(key)) {
          continue;
        }
        timestamps.set(
          key,
          await readBlockTimestamp(fetchImpl, item.blockNumber, budget),
        );
      }

      const confirmed = await growHashes.listForUser(input.userId);
      const events: NewSmartWalletActivityEvent[] = discovered.map((item) => ({
        userId: input.userId,
        smartWalletAddress: wallet,
        transactionHash: item.transactionHash,
        logIndex: item.logIndex,
        blockNumber: item.blockNumber,
        blockTimestamp: timestamps.get(item.blockNumber.toString())!,
        direction: item.direction,
        rawAmount: item.rawAmount,
        counterpartyAddress: item.counterpartyAddress,
        kind: classifySmartWalletActivityKind(item, confirmed),
      }));

      if (events.length > 0) {
        await store.insertEvents(events);
      }

      const cursor = await store.advanceCursor({
        userId: input.userId,
        smartWalletAddress: wallet,
        throughBlock: rangeEnd,
        updatedAt: now,
      });
      indexedThrough = cursor.indexedThroughBlock;
    } catch (error) {
      if (
        error instanceof UsdcActivityLookupError &&
        error.message.includes("exceeded the RPC budget") &&
        indexedThrough != null
      ) {
        return { indexedThroughBlock: indexedThrough, caughtUp: false };
      }

      throw error instanceof UsdcActivityLookupError
        ? error
        : new UsdcActivityLookupError("USDC activity request failed.");
    }
  }

  return {
    indexedThroughBlock: indexedThrough ?? head,
    caughtUp: true,
  };
}

/** Catch up from the durable checkpoint, then page Smart Wallet Activity from Postgres. */
export async function getIndexedSmartWalletActivity(
  input: {
    userId: string;
    smartWalletAddress: string;
    walletCreatedAt: Date;
    limit: number;
    cursor?: string;
  },
  deps: SmartWalletActivityIndexerDeps = {},
): Promise<PrivyActivityPage> {
  let parsedCursor: { blockNumber: bigint; logIndex: number } | undefined;
  if (input.cursor) {
    const parsed = parseActivityCursor(input.cursor);
    if (!parsed) {
      throw new InvalidUsdcActivityCursorError();
    }
    parsedCursor = parsed;
  }

  const store = deps.store ?? createPostgresSmartWalletActivityStore();
  const growHashes = deps.growHashes ?? createPostgresConfirmedGrowHashLookup();
  const wallet = input.smartWalletAddress.trim();

  try {
    await catchUpSmartWalletActivity(
      {
        userId: input.userId,
        smartWalletAddress: wallet,
        walletCreatedAt: input.walletCreatedAt,
      },
      { ...deps, store, growHashes },
    );
  } catch (error) {
    if (await hasIndexedHistory(store, input.userId, wallet)) {
      await applyConfirmedGrowLabels(store, growHashes, input.userId);
      return pageFromStore(store, input.userId, input.limit, parsedCursor);
    }

    throw error;
  }

  await applyConfirmedGrowLabels(store, growHashes, input.userId);
  return pageFromStore(store, input.userId, input.limit, parsedCursor);
}
