import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { env } from "../src/config/env.js";
import { getHomeActivityForWallet } from "../src/services/walletActivity.js";
import {
  encodeActivityCursor,
  InvalidUsdcActivityCursorError,
} from "../src/services/usdcActivity.js";
import {
  BASE_BLOCK_SECONDS,
  START_BLOCK_SAFETY_BUFFER,
  catchUpSmartWalletActivity,
  estimateStartBlockFromWalletCreatedAt,
  getIndexedSmartWalletActivity,
  INDEXER_CHUNK_BLOCKS,
  toIndexedUsdcTransfer,
} from "../src/services/smartWalletActivityIndexer.js";
import {
  createMemorySmartWalletActivityStore,
  type NewSmartWalletActivityEvent,
  type SmartWalletActivityStore,
} from "../src/services/smartWalletActivityStore.js";

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const SMART = "0x545803dDb0eE8eB96A531628cB8d3E0306d7e4CA";
const OTHER = "0x6168Bd45eFb539483756d0Ed6b7f8a1502c81B50";
const USER_ID = "11111111-1111-1111-1111-111111111111";
const FORMER_WINDOW = 24_000n;

function txHash(nibble: string): string {
  return `0x${nibble.repeat(64).slice(0, 64)}`;
}

function padTopic(address: string): string {
  return `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;
}

function transferLog(input: {
  hash: string;
  blockNumber: bigint;
  logIndex: number;
  from: string;
  to: string;
  amount: bigint;
}) {
  return {
    transactionHash: input.hash,
    blockNumber: `0x${input.blockNumber.toString(16)}`,
    logIndex: `0x${input.logIndex.toString(16)}`,
    topics: [TRANSFER_TOPIC, padTopic(input.from), padTopic(input.to)],
    data: `0x${input.amount.toString(16).padStart(64, "0")}`,
  };
}

function jsonRpcResult(result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function createdAtForStartBlock(input: {
  headBlock: bigint;
  headTimestampSeconds: bigint;
  startBlock: bigint;
}): Date {
  const ageBlocks =
    input.headBlock - input.startBlock - START_BLOCK_SAFETY_BUFFER;
  const createdSeconds =
    input.headTimestampSeconds - ageBlocks * BASE_BLOCK_SECONDS;
  return new Date(Number(createdSeconds) * 1000);
}

function seedEvent(
  overrides: Partial<NewSmartWalletActivityEvent> = {},
): NewSmartWalletActivityEvent {
  return {
    userId: USER_ID,
    smartWalletAddress: SMART,
    transactionHash: txHash("1"),
    logIndex: 1,
    blockNumber: 10n,
    blockTimestamp: new Date("2026-09-01T00:00:00.000Z"),
    direction: "in",
    rawAmount: "1000000",
    counterpartyAddress: OTHER,
    kind: "received",
    ...overrides,
  };
}

function createChainFetch(input: {
  head: bigint;
  headTimestamp?: bigint;
  logs: ReturnType<typeof transferLog>[];
  failOn?: "blockNumber" | "getLogs" | "getBlock";
  onGetLogs?: (range: {
    fromBlock: bigint;
    toBlock: bigint;
    inbound: boolean;
  }) => void;
  /** Reject eth_getLogs when toBlock - fromBlock is greater than this. */
  maxBlockDifference?: bigint;
}): typeof fetch {
  return async (_url, init) => {
    const body = JSON.parse(String(init?.body)) as {
      method?: string;
      params?: Array<{
        fromBlock?: string;
        toBlock?: string;
        topics?: Array<string | null>;
      }>;
    };

    if (body.method === "eth_blockNumber") {
      if (input.failOn === "blockNumber") {
        return new Response("nope", { status: 500 });
      }
      return jsonRpcResult(`0x${input.head.toString(16)}`);
    }

    if (body.method === "eth_getLogs") {
      if (input.failOn === "getLogs") {
        return new Response("nope", { status: 500 });
      }
      const fromBlock = BigInt(body.params?.[0]?.fromBlock ?? "0x0");
      const toBlock = BigInt(body.params?.[0]?.toBlock ?? "0x0");
      const topics = body.params?.[0]?.topics ?? [];
      const inbound = Boolean(topics[2]);
      input.onGetLogs?.({ fromBlock, toBlock, inbound });
      if (
        input.maxBlockDifference != null &&
        toBlock - fromBlock > input.maxBlockDifference
      ) {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            error: {
              code: -32614,
              message: "eth_getLogs is limited to a 500 range",
            },
          }),
          { status: 413, headers: { "content-type": "application/json" } },
        );
      }
      const matching = input.logs.filter((log) => {
        const block = BigInt(log.blockNumber);
        if (block < fromBlock || block > toBlock) {
          return false;
        }
        return inbound ? Boolean(topics[2]) === Boolean(log.topics[2]) : !topics[2];
      });
      return jsonRpcResult(
        inbound
          ? matching.filter((log) => log.topics[2] === padTopic(SMART))
          : matching.filter((log) => log.topics[1] === padTopic(SMART)),
      );
    }

    if (body.method === "eth_getBlockByNumber") {
      if (input.failOn === "getBlock") {
        return new Response("nope", { status: 500 });
      }
      const requested = BigInt(String(body.params?.[0] ?? "0x0"));
      const headTs = input.headTimestamp ?? 1_700_000_000n;
      const timestamp = headTs - (input.head - requested) * BASE_BLOCK_SECONDS;
      return jsonRpcResult({ timestamp: `0x${timestamp.toString(16)}` });
    }

    throw new Error(`unexpected ${body.method}`);
  };
}

test("start block comes from wallets.created_at, not genesis", () => {
  const headBlock = 1_000_000n;
  const headTimestampSeconds = 1_700_000_000n;
  const walletCreatedAt = new Date((Number(headTimestampSeconds) - 10_000) * 1000);
  const start = estimateStartBlockFromWalletCreatedAt({
    walletCreatedAt,
    headBlock,
    headTimestampSeconds,
  });

  assert.equal(start, headBlock - 5_000n - START_BLOCK_SAFETY_BUFFER);
  assert.ok(start > 0n);
  assert.ok(start < headBlock);
});

test("maps official USDC transfers to received/sent only", () => {
  const received = toIndexedUsdcTransfer(
    transferLog({
      hash: txHash("a"),
      blockNumber: 50n,
      logIndex: 3,
      from: OTHER,
      to: SMART,
      amount: 2_500_000n,
    }),
    SMART,
  );
  const sent = toIndexedUsdcTransfer(
    transferLog({
      hash: txHash("b"),
      blockNumber: 51n,
      logIndex: 1,
      from: SMART,
      to: OTHER,
      amount: 250_000n,
    }),
    SMART,
  );

  assert.deepEqual(received, {
    transactionHash: txHash("a"),
    logIndex: 3,
    blockNumber: 50n,
    direction: "in",
    kind: "received",
    rawAmount: "2500000",
    counterpartyAddress: OTHER.toLowerCase(),
  });
  assert.deepEqual(sent, {
    transactionHash: txHash("b"),
    logIndex: 1,
    blockNumber: 51n,
    direction: "out",
    kind: "sent",
    rawAmount: "250000",
    counterpartyAddress: OTHER.toLowerCase(),
  });
});

test("indexes history older than the former 24,000-block window", async () => {
  const head = 100_000n;
  const oldBlock = head - FORMER_WINDOW - 1_000n;
  const store = createMemorySmartWalletActivityStore();
  const walletCreatedAt = createdAtForStartBlock({
    headBlock: head,
    headTimestampSeconds: 1_700_000_000n,
    startBlock: oldBlock - 10n,
  });

  const page = await getIndexedSmartWalletActivity(
    {
      userId: USER_ID,
      smartWalletAddress: SMART,
      walletCreatedAt,
      limit: 5,
    },
    {
      store,
      chunkBlocks: 8_000n,
      fetchImpl: createChainFetch({
        head,
        logs: [
          transferLog({
            hash: txHash("c"),
            blockNumber: oldBlock,
            logIndex: 4,
            from: OTHER,
            to: SMART,
            amount: 3_000_000n,
          }),
        ],
      }),
    },
  );

  assert.equal(page.items.length, 1);
  assert.equal(page.items[0]?.id, `${txHash("c")}:4`);
  assert.equal(page.items[0]?.type, "received");
  assert.equal(page.items[0]?.amountUsd, "3.00");
  assert.ok(oldBlock < head - FORMER_WINDOW);

  const cursor = await store.getCursor({
    userId: USER_ID,
    smartWalletAddress: SMART,
  });
  assert.equal(cursor?.indexedThroughBlock, head);
});

test("catch-up is incremental and resumes from the durable checkpoint", async () => {
  const head = 5_000n;
  const startBlock = 3_000n;
  const store = createMemorySmartWalletActivityStore();
  const ranges: Array<{ fromBlock: bigint; toBlock: bigint }> = [];
  const walletCreatedAt = createdAtForStartBlock({
    headBlock: head,
    headTimestampSeconds: 1_700_000_000n,
    startBlock,
  });
  const logs = [
    transferLog({
      hash: txHash("1"),
      blockNumber: 3_050n,
      logIndex: 0,
      from: OTHER,
      to: SMART,
      amount: 1_000_000n,
    }),
    transferLog({
      hash: txHash("2"),
      blockNumber: 3_250n,
      logIndex: 1,
      from: SMART,
      to: OTHER,
      amount: 500_000n,
    }),
  ];

  const first = await catchUpSmartWalletActivity(
    { userId: USER_ID, smartWalletAddress: SMART, walletCreatedAt },
    {
      store,
      chunkBlocks: 200n,
      maxRpcCalls: 6,
      fetchImpl: createChainFetch({
        head,
        logs,
        onGetLogs: (range) => ranges.push(range),
      }),
    },
  );

  assert.equal(first.caughtUp, false);
  assert.equal(first.indexedThroughBlock, 3_199n);
  assert.equal(
    (await store.listEventsForUser({ userId: USER_ID, limit: 10 })).length,
    1,
  );

  const second = await catchUpSmartWalletActivity(
    { userId: USER_ID, smartWalletAddress: SMART, walletCreatedAt },
    {
      store,
      chunkBlocks: 200n,
      fetchImpl: createChainFetch({
        head,
        logs,
        onGetLogs: (range) => ranges.push(range),
      }),
    },
  );

  assert.equal(second.caughtUp, true);
  assert.equal(second.indexedThroughBlock, head);
  const items = await store.listEventsForUser({ userId: USER_ID, limit: 10 });
  assert.deepEqual(
    items.map((item) => `${item.blockNumber}:${item.kind}`),
    ["3250:sent", "3050:received"],
  );
  assert.ok(ranges.every((range) => range.fromBlock >= startBlock));
  assert.ok(ranges.some((range) => range.fromBlock >= 3_200n));
});

function assertContiguousRanges(
  ranges: Array<{ fromBlock: bigint; toBlock: bigint }>,
  startBlock: bigint,
  head: bigint,
): void {
  assert.ok(ranges.length > 1);
  assert.equal(ranges[0]?.fromBlock, startBlock);
  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index];
    assert.ok(range);
    assert.ok(range.toBlock - range.fromBlock <= 500n);
    if (index > 0) {
      assert.equal(range.fromBlock, ranges[index - 1]?.toBlock + 1n);
    }
  }
  assert.equal(ranges[ranges.length - 1]?.toBlock, head);
}

test("public Base eth_getLogs ranges stay within 500 blocks", async () => {
  assert.equal(INDEXER_CHUNK_BLOCKS, 501n);

  const startBlock = 10_000n;
  const head = startBlock + START_BLOCK_SAFETY_BUFFER + 1_200n;
  const store = createMemorySmartWalletActivityStore();
  const ranges: Array<{
    fromBlock: bigint;
    toBlock: bigint;
    inbound: boolean;
  }> = [];
  const walletCreatedAt = createdAtForStartBlock({
    headBlock: head,
    headTimestampSeconds: 1_700_000_000n,
    startBlock,
  });

  const page = await getIndexedSmartWalletActivity(
    {
      userId: USER_ID,
      smartWalletAddress: SMART,
      walletCreatedAt,
      limit: 5,
    },
    {
      store,
      fetchImpl: createChainFetch({
        head,
        headTimestamp: 1_700_000_000n,
        maxBlockDifference: 500n,
        logs: [
          transferLog({
            hash: txHash("f"),
            blockNumber: startBlock + 100n,
            logIndex: 2,
            from: OTHER,
            to: SMART,
            amount: 4_000_000n,
          }),
        ],
        onGetLogs: (range) => ranges.push(range),
      }),
    },
  );

  const inbound = ranges.filter((range) => range.inbound);
  const outbound = ranges.filter((range) => !range.inbound);
  assertContiguousRanges(inbound, startBlock, head);
  assertContiguousRanges(outbound, startBlock, head);
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0]?.id, `${txHash("f")}:2`);
  assert.equal(page.items[0]?.amountUsd, "4.00");

  const cursor = await store.getCursor({
    userId: USER_ID,
    smartWalletAddress: SMART,
  });
  assert.equal(cursor?.indexedThroughBlock, head);
});

test("chunk boundaries do not skip or duplicate transfers", async () => {
  const startBlock = 20_000n;
  const chunkEnd = startBlock + INDEXER_CHUNK_BLOCKS - 1n;
  const nextStart = startBlock + INDEXER_CHUNK_BLOCKS;
  const head = startBlock + START_BLOCK_SAFETY_BUFFER + INDEXER_CHUNK_BLOCKS + 10n;
  const store = createMemorySmartWalletActivityStore();
  const walletCreatedAt = createdAtForStartBlock({
    headBlock: head,
    headTimestampSeconds: 1_700_000_000n,
    startBlock,
  });

  const page = await getIndexedSmartWalletActivity(
    {
      userId: USER_ID,
      smartWalletAddress: SMART,
      walletCreatedAt,
      limit: 5,
    },
    {
      store,
      fetchImpl: createChainFetch({
        head,
        headTimestamp: 1_700_000_000n,
        maxBlockDifference: 500n,
        logs: [
          transferLog({
            hash: txHash("7"),
            blockNumber: chunkEnd,
            logIndex: 1,
            from: OTHER,
            to: SMART,
            amount: 1_000_000n,
          }),
          transferLog({
            hash: txHash("8"),
            blockNumber: nextStart,
            logIndex: 0,
            from: SMART,
            to: OTHER,
            amount: 2_000_000n,
          }),
        ],
      }),
    },
  );

  assert.deepEqual(
    page.items.map((item) => `${item.id}:${item.type}:${item.amountUsd}`),
    [
      `${txHash("8")}:0:sent:2.00`,
      `${txHash("7")}:1:received:1.00`,
    ],
  );
});

test("re-indexing is idempotent and never moves the checkpoint backwards", async () => {
  const head = 80n;
  const store = createMemorySmartWalletActivityStore();
  const walletCreatedAt = createdAtForStartBlock({
    headBlock: head,
    headTimestampSeconds: 1_700_000_000n,
    startBlock: 1n,
  });
  const logs = [
    transferLog({
      hash: txHash("d"),
      blockNumber: 25n,
      logIndex: 7,
      from: OTHER,
      to: SMART,
      amount: 1_000_000n,
    }),
  ];
  const deps = {
    store,
    chunkBlocks: 80n,
    fetchImpl: createChainFetch({ head, logs }),
  };

  await catchUpSmartWalletActivity(
    { userId: USER_ID, smartWalletAddress: SMART, walletCreatedAt },
    deps,
  );
  const first = await store.listEventsForUser({ userId: USER_ID, limit: 10 });
  await catchUpSmartWalletActivity(
    { userId: USER_ID, smartWalletAddress: SMART, walletCreatedAt },
    deps,
  );
  const second = await store.listEventsForUser({ userId: USER_ID, limit: 10 });
  const cursor = await store.getCursor({
    userId: USER_ID,
    smartWalletAddress: SMART,
  });

  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.equal(first[0]?.id, second[0]?.id);
  assert.equal(cursor?.indexedThroughBlock, head);
});

test("checkpoint advances only after events persist successfully", async () => {
  const head = 50n;
  const memory = createMemorySmartWalletActivityStore();
  let advanced = false;
  const store: SmartWalletActivityStore = {
    insertEvents: async () => {
      throw new Error("persist failed");
    },
    listEventsForUser: (input) => memory.listEventsForUser(input),
    getCursor: (input) => memory.getCursor(input),
    advanceCursor: async (input) => {
      advanced = true;
      return memory.advanceCursor(input);
    },
    applyGrowClassification: (input) => memory.applyGrowClassification(input),
  };

  await assert.rejects(
    () =>
      catchUpSmartWalletActivity(
        {
          userId: USER_ID,
          smartWalletAddress: SMART,
          walletCreatedAt: createdAtForStartBlock({
            headBlock: head,
            headTimestampSeconds: 1_700_000_000n,
            startBlock: 1n,
          }),
        },
        {
          store,
          chunkBlocks: 50n,
          fetchImpl: createChainFetch({
            head,
            logs: [
              transferLog({
                hash: txHash("e"),
                blockNumber: 10n,
                logIndex: 0,
                from: OTHER,
                to: SMART,
                amount: 1_000_000n,
              }),
            ],
          }),
        },
      ),
    /USDC activity/,
  );

  assert.equal(advanced, false);
  assert.equal(
    await memory.getCursor({ userId: USER_ID, smartWalletAddress: SMART }),
    null,
  );
});

test("failed RPC catch-up still serves previously indexed DB history", async () => {
  const store = createMemorySmartWalletActivityStore();
  await store.insertEvents([
    seedEvent({
      transactionHash: txHash("f"),
      blockNumber: 12n,
      rawAmount: "4000000",
    }),
  ]);
  await store.advanceCursor({
    userId: USER_ID,
    smartWalletAddress: SMART,
    throughBlock: 12n,
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
  });

  const page = await getIndexedSmartWalletActivity(
    {
      userId: USER_ID,
      smartWalletAddress: SMART,
      walletCreatedAt: new Date("2026-08-01T00:00:00.000Z"),
      limit: 5,
    },
    {
      store,
      fetchImpl: createChainFetch({
        head: 20n,
        logs: [],
        failOn: "blockNumber",
      }),
    },
  );

  assert.equal(page.items.length, 1);
  assert.equal(page.items[0]?.id, `${txHash("f")}:1`);
  assert.equal(page.items[0]?.amountUsd, "4.00");
  assert.equal(
    (await store.getCursor({ userId: USER_ID, smartWalletAddress: SMART }))
      ?.indexedThroughBlock,
    12n,
  );
});

test("pages newest-first beyond the old ~13-hour boundary", async () => {
  const head = 80_000n;
  const older = head - FORMER_WINDOW - 500n;
  const newer = head - 10n;
  const store = createMemorySmartWalletActivityStore();

  const page = await getIndexedSmartWalletActivity(
    {
      userId: USER_ID,
      smartWalletAddress: SMART,
      walletCreatedAt: createdAtForStartBlock({
        headBlock: head,
        headTimestampSeconds: 1_700_000_000n,
        startBlock: older - 20n,
      }),
      limit: 1,
    },
    {
      store,
      chunkBlocks: 20_000n,
      fetchImpl: createChainFetch({
        head,
        logs: [
          transferLog({
            hash: txHash("8"),
            blockNumber: newer,
            logIndex: 2,
            from: OTHER,
            to: SMART,
            amount: 1_000_000n,
          }),
          transferLog({
            hash: txHash("9"),
            blockNumber: older,
            logIndex: 1,
            from: SMART,
            to: OTHER,
            amount: 2_000_000n,
          }),
        ],
      }),
    },
  );

  assert.equal(page.items[0]?.id, `${txHash("8")}:2`);
  assert.equal(page.items[0]?.type, "received");
  assert.equal(page.nextCursor, encodeActivityCursor(newer, 2));

  const next = await getIndexedSmartWalletActivity(
    {
      userId: USER_ID,
      smartWalletAddress: SMART,
      walletCreatedAt: new Date("2026-08-01T00:00:00.000Z"),
      limit: 1,
      cursor: page.nextCursor ?? undefined,
    },
    {
      store,
      fetchImpl: createChainFetch({ head, logs: [] }),
    },
  );

  assert.equal(next.items[0]?.id, `${txHash("9")}:1`);
  assert.equal(next.items[0]?.type, "sent");
  assert.ok(older < head - FORMER_WINDOW);
});

test("failed first-time catch-up does not invent an empty Activity list", async () => {
  await assert.rejects(
    () =>
      getIndexedSmartWalletActivity(
        {
          userId: USER_ID,
          smartWalletAddress: SMART,
          walletCreatedAt: new Date("2026-09-01T00:00:00.000Z"),
          limit: 5,
        },
        {
          store: createMemorySmartWalletActivityStore(),
          fetchImpl: createChainFetch({
            head: 20n,
            logs: [],
            failOn: "blockNumber",
          }),
        },
      ),
    /USDC activity/,
  );
});

test("EOA Activity path is unchanged and does not index", async () => {
  const calls: string[] = [];

  await getHomeActivityForWallet(
    {
      moneyAddressMode: "eoa",
      privyWalletId: "eoa-wallet-id",
      smartWalletAddress: SMART,
      limit: 5,
    },
    {
      getIndexedSmartWalletActivity: async () => {
        calls.push("indexed");
        return { items: [], nextCursor: null };
      },
      getHomeActivityForPrivyWallet: async (walletId, limit, cursor) => {
        calls.push(`privy:${walletId}:${limit}:${cursor ?? ""}`);
        return { items: [], nextCursor: null };
      },
    },
  );

  assert.deepEqual(calls, ["privy:eoa-wallet-id:5:"]);
});

test("rejects a malformed pagination cursor before scanning", async () => {
  await assert.rejects(
    () =>
      getIndexedSmartWalletActivity(
        {
          userId: USER_ID,
          smartWalletAddress: SMART,
          walletCreatedAt: new Date("2026-09-01T00:00:00.000Z"),
          limit: 5,
          cursor: "not-a-cursor",
        },
        { store: createMemorySmartWalletActivityStore() },
      ),
    InvalidUsdcActivityCursorError,
  );
});

test("3F.2 does not enable money-movement flags or broadcast", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const indexer = await readFile(
    path.join(apiRoot, "src/services/smartWalletActivityIndexer.ts"),
    "utf8",
  );
  const example = await readFile(path.join(apiRoot, ".env.example"), "utf8");

  assert.match(example, /SMART_WALLET_SENDS_ENABLED=false/);
  assert.match(example, /AAVE_SMART_WALLET_DEPOSITS_ENABLED=false/);
  assert.match(example, /AAVE_SMART_WALLET_WITHDRAWALS_ENABLED=false/);
  assert.equal(env.smartWalletSendsEnabled, false);
  assert.equal(env.aaveSmartWalletDepositsEnabled, false);
  assert.equal(env.aaveSmartWalletWithdrawalsEnabled, false);
  assert.doesNotMatch(indexer, /eth_send/);
  assert.doesNotMatch(indexer, /sendTransaction/);
  assert.doesNotMatch(indexer, /paymaster/i);
  assert.doesNotMatch(indexer, /grow_deposit|grow_withdraw/);
});
