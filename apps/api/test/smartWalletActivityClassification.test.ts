import assert from "node:assert/strict";
import { test } from "node:test";
import { AAVE_V3_BASE_POOL } from "../src/services/aaveAddresses.js";
import {
  classifySmartWalletActivityKind,
  createMemoryConfirmedGrowHashLookup,
  toCustomerActivityType,
} from "../src/services/smartWalletActivityClassification.js";
import {
  getIndexedSmartWalletActivity,
} from "../src/services/smartWalletActivityIndexer.js";
import {
  createMemorySmartWalletActivityStore,
  type NewSmartWalletActivityEvent,
} from "../src/services/smartWalletActivityStore.js";

const SMART = "0x545803dDb0eE8eB96A531628cB8d3E0306d7e4CA";
const OTHER = "0x6168Bd45eFb539483756d0Ed6b7f8a1502c81B50";
const USER_ID = "11111111-1111-1111-1111-111111111111";
const DEPOSIT_HASH =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const WITHDRAW_HASH =
  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const SEND_HASH =
  "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc";
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

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

function event(
  overrides: Partial<NewSmartWalletActivityEvent> = {},
): NewSmartWalletActivityEvent {
  return {
    userId: USER_ID,
    smartWalletAddress: SMART,
    transactionHash: DEPOSIT_HASH,
    logIndex: 0,
    blockNumber: 20n,
    blockTimestamp: new Date("2026-09-01T00:00:00.000Z"),
    direction: "out",
    rawAmount: "1500000",
    counterpartyAddress: AAVE_V3_BASE_POOL,
    kind: "sent",
    ...overrides,
  };
}

test("inbound is received and outbound is sent unless a confirmed Grow hash matches", () => {
  const confirmed = {
    depositHashes: new Set([DEPOSIT_HASH]),
    withdrawalHashes: new Set([WITHDRAW_HASH]),
  };

  assert.equal(
    classifySmartWalletActivityKind(
      { transactionHash: SEND_HASH, direction: "in" },
      confirmed,
    ),
    "received",
  );
  assert.equal(
    classifySmartWalletActivityKind(
      { transactionHash: SEND_HASH, direction: "out" },
      confirmed,
    ),
    "sent",
  );
  assert.equal(
    classifySmartWalletActivityKind(
      { transactionHash: DEPOSIT_HASH, direction: "out" },
      confirmed,
    ),
    "grow_deposit",
  );
  assert.equal(
    classifySmartWalletActivityKind(
      { transactionHash: WITHDRAW_HASH, direction: "in" },
      confirmed,
    ),
    "grow_withdraw",
  );
});

test("multi-log transactions only relabel the Grow USDC Transfer", () => {
  const confirmed = {
    depositHashes: new Set([DEPOSIT_HASH]),
    withdrawalHashes: new Set([DEPOSIT_HASH]),
  };

  assert.equal(
    classifySmartWalletActivityKind(
      { transactionHash: DEPOSIT_HASH, direction: "out" },
      confirmed,
    ),
    "grow_deposit",
  );
  assert.equal(
    classifySmartWalletActivityKind(
      { transactionHash: DEPOSIT_HASH, direction: "in" },
      confirmed,
    ),
    "grow_withdraw",
  );
});

test("a deposit hash does not relabel an inbound log in the same transaction", () => {
  const confirmed = {
    depositHashes: new Set([DEPOSIT_HASH]),
    withdrawalHashes: new Set<string>(),
  };

  assert.equal(
    classifySmartWalletActivityKind(
      { transactionHash: DEPOSIT_HASH, direction: "in" },
      confirmed,
    ),
    "received",
  );
});

test("a withdrawal hash does not relabel an outbound log in the same transaction", () => {
  const confirmed = {
    depositHashes: new Set<string>(),
    withdrawalHashes: new Set([WITHDRAW_HASH]),
  };

  assert.equal(
    classifySmartWalletActivityKind(
      { transactionHash: WITHDRAW_HASH, direction: "out" },
      confirmed,
    ),
    "sent",
  );
});

test("Aave Pool counterparties stay received/sent without a confirmed Olimpia hash", () => {
  const empty = { depositHashes: new Set<string>(), withdrawalHashes: new Set<string>() };

  assert.equal(
    classifySmartWalletActivityKind(
      { transactionHash: SEND_HASH, direction: "out" },
      empty,
    ),
    "sent",
  );
  assert.equal(
    classifySmartWalletActivityKind(
      { transactionHash: SEND_HASH, direction: "in" },
      empty,
    ),
    "received",
  );
});

test("API mapping uses customer Activity types without protocol names", () => {
  assert.equal(toCustomerActivityType("received"), "received");
  assert.equal(toCustomerActivityType("sent"), "sent");
  assert.equal(toCustomerActivityType("grow_deposit"), "Added to Grow");
  assert.equal(toCustomerActivityType("grow_withdraw"), "Moved to Available");
});

test("confirmed Grow hashes relabel stored events after indexing", async () => {
  const store = createMemorySmartWalletActivityStore();
  await store.insertEvents([
    event({
      transactionHash: DEPOSIT_HASH,
      logIndex: 4,
      direction: "out",
      kind: "sent",
      counterpartyAddress: AAVE_V3_BASE_POOL,
    }),
    event({
      transactionHash: DEPOSIT_HASH,
      logIndex: 5,
      direction: "in",
      kind: "received",
      rawAmount: "250000",
      counterpartyAddress: OTHER,
    }),
    event({
      transactionHash: WITHDRAW_HASH,
      logIndex: 1,
      blockNumber: 21n,
      direction: "in",
      kind: "received",
      counterpartyAddress: AAVE_V3_BASE_POOL,
    }),
    event({
      transactionHash: SEND_HASH,
      logIndex: 2,
      blockNumber: 22n,
      direction: "out",
      kind: "sent",
      counterpartyAddress: OTHER,
    }),
  ]);
  await store.advanceCursor({
    userId: USER_ID,
    smartWalletAddress: SMART,
    throughBlock: 22n,
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
  });

  const page = await getIndexedSmartWalletActivity(
    {
      userId: USER_ID,
      smartWalletAddress: SMART,
      walletCreatedAt: new Date("2026-08-01T00:00:00.000Z"),
      limit: 10,
    },
    {
      store,
      growHashes: createMemoryConfirmedGrowHashLookup({
        depositHashes: [DEPOSIT_HASH],
        withdrawalHashes: [WITHDRAW_HASH],
      }),
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(String(init?.body)) as { method?: string };
        if (body.method === "eth_blockNumber") {
          return jsonRpcResult("0x16");
        }
        if (body.method === "eth_getLogs") {
          return jsonRpcResult([]);
        }
        return jsonRpcResult({ timestamp: "0x1" });
      },
    },
  );

  assert.deepEqual(
    page.items.map((item) => `${item.id}:${item.type}`),
    [
      `${SEND_HASH}:2:sent`,
      `${WITHDRAW_HASH}:1:Moved to Available`,
      `${DEPOSIT_HASH}:5:received`,
      `${DEPOSIT_HASH}:4:Added to Grow`,
    ],
  );
});

test("indexing a multi-log Grow transaction classifies only the matching Transfer", async () => {
  const store = createMemorySmartWalletActivityStore();
  const logs = [
    transferLog({
      hash: DEPOSIT_HASH,
      blockNumber: 40n,
      logIndex: 1,
      from: SMART,
      to: AAVE_V3_BASE_POOL,
      amount: 2_000_000n,
    }),
    transferLog({
      hash: DEPOSIT_HASH,
      blockNumber: 40n,
      logIndex: 2,
      from: OTHER,
      to: SMART,
      amount: 100_000n,
    }),
  ];

  const page = await getIndexedSmartWalletActivity(
    {
      userId: USER_ID,
      smartWalletAddress: SMART,
      walletCreatedAt: new Date("2026-09-01T00:00:00.000Z"),
      limit: 10,
    },
    {
      store,
      growHashes: createMemoryConfirmedGrowHashLookup({
        depositHashes: [DEPOSIT_HASH],
      }),
      chunkBlocks: 50n,
      fetchImpl: async (_url, init) => {
        const body = JSON.parse(String(init?.body)) as {
          method?: string;
          params?: Array<{ topics?: Array<string | null> }>;
        };
        if (body.method === "eth_blockNumber") {
          return jsonRpcResult("0x32");
        }
        if (body.method === "eth_getLogs") {
          const inbound = Boolean(body.params?.[0]?.topics?.[2]);
          return jsonRpcResult(inbound ? [logs[1]] : [logs[0]]);
        }
        return jsonRpcResult({ timestamp: "0x6550a1b0" });
      },
    },
  );

  assert.deepEqual(
    page.items.map((item) => `${item.id}:${item.type}:${item.amountUsd}`),
    [
      `${DEPOSIT_HASH}:2:received:0.10`,
      `${DEPOSIT_HASH}:1:Added to Grow:2.00`,
    ],
  );
});
