import assert from "node:assert/strict";
import { test } from "node:test";
import { getHomeActivityForWallet } from "../src/services/walletActivity.js";
import {
  encodeActivityCursor,
  getUsdcActivityOnBase,
  isOlderThanCursor,
  mergeSortUsdcLogs,
  parseActivityCursor,
  toUsdcTransferLog,
} from "../src/services/usdcActivity.js";

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const SMART = "0x545803dDb0eE8eB96A531628cB8d3E0306d7e4CA";
const OTHER = "0x6168Bd45eFb539483756d0Ed6b7f8a1502c81B50";

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

function jsonRpcResult(result: unknown, id = 1): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id, result }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function jsonRpcError(message: string, code = -32005): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", id: 1, error: { code, message } }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
}

test("maps inbound and outbound USDC logs into the Activity item shape", () => {
  const received = toUsdcTransferLog(
    transferLog({
      hash: "0xaaa",
      blockNumber: 10n,
      logIndex: 1,
      from: OTHER,
      to: SMART,
      amount: 2_000_000n,
    }),
    SMART,
  );
  const sent = toUsdcTransferLog(
    transferLog({
      hash: "0xbbb",
      blockNumber: 11n,
      logIndex: 2,
      from: SMART,
      to: OTHER,
      amount: 500_000n,
    }),
    SMART,
  );

  assert.deepEqual(received, {
    id: "0xaaa:1",
    type: "received",
    amountUsd: "2.00",
    blockNumber: 10n,
    logIndex: 1,
  });
  assert.deepEqual(sent, {
    id: "0xbbb:2",
    type: "sent",
    amountUsd: "0.50",
    blockNumber: 11n,
    logIndex: 2,
  });
  assert.equal(
    toUsdcTransferLog(
      transferLog({
        hash: "0xccc",
        blockNumber: 12n,
        logIndex: 0,
        from: SMART,
        to: SMART,
        amount: 1_000_000n,
      }),
      SMART,
    ),
    null,
  );
});

test("cursor pagination is strictly older than the last returned item", () => {
  const cursor = parseActivityCursor(encodeActivityCursor(20n, 3));
  assert.deepEqual(cursor, { blockNumber: 20n, logIndex: 3 });
  assert.equal(
    isOlderThanCursor({ blockNumber: 20n, logIndex: 2 }, cursor!),
    true,
  );
  assert.equal(
    isOlderThanCursor({ blockNumber: 20n, logIndex: 3 }, cursor!),
    false,
  );
  assert.equal(
    isOlderThanCursor({ blockNumber: 21n, logIndex: 0 }, cursor!),
    false,
  );
  assert.equal(parseActivityCursor("privy-not-a-cursor"), null);
});

test("merged logs stay newest-first and never mix a second address", () => {
  const sorted = mergeSortUsdcLogs([
    {
      id: "0x1:0",
      type: "received",
      amountUsd: "1.00",
      blockNumber: 5n,
      logIndex: 0,
    },
    {
      id: "0x2:4",
      type: "sent",
      amountUsd: "2.00",
      blockNumber: 8n,
      logIndex: 4,
    },
    {
      id: "0x1:0",
      type: "received",
      amountUsd: "1.00",
      blockNumber: 5n,
      logIndex: 0,
    },
  ]);

  assert.deepEqual(
    sorted.map((item) => item.id),
    ["0x2:4", "0x1:0"],
  );
});

test("reads USDC activity with getLogs and block timestamps only", async () => {
  const methods: string[] = [];
  const inbound = transferLog({
    hash: "0xrec",
    blockNumber: 100n,
    logIndex: 4,
    from: OTHER,
    to: SMART,
    amount: 2_000_000n,
  });
  const outbound = transferLog({
    hash: "0xsent",
    blockNumber: 90n,
    logIndex: 1,
    from: SMART,
    to: OTHER,
    amount: 250_000n,
  });

  const fetchMock: typeof fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as {
      method?: string;
      params?: Array<{ topics?: Array<string | null> }>;
    };
    methods.push(String(body.method));

    if (body.method === "eth_blockNumber") {
      return jsonRpcResult("0x2000");
    }

    if (body.method === "eth_getLogs") {
      const toTopic = body.params?.[0]?.topics?.[2];
      return jsonRpcResult(toTopic ? [inbound] : [outbound]);
    }

    if (body.method === "eth_getBlockByNumber") {
      return jsonRpcResult({ timestamp: "0x6550a1b0" });
    }

    throw new Error(`unexpected ${body.method}`);
  };

  const page = await getUsdcActivityOnBase(SMART, 20, undefined, fetchMock);

  assert.deepEqual(page.items, [
    {
      id: "0xrec:4",
      type: "received",
      amountUsd: "2.00",
      status: "completed",
      counterpartyId: null,
      createdAt: new Date(0x6550a1b0 * 1000).toISOString(),
    },
    {
      id: "0xsent:1",
      type: "sent",
      amountUsd: "0.25",
      status: "completed",
      counterpartyId: null,
      createdAt: new Date(0x6550a1b0 * 1000).toISOString(),
    },
  ]);
  assert.equal(page.nextCursor, null);
  assert.ok(methods.includes("eth_blockNumber"));
  assert.ok(methods.includes("eth_getLogs"));
  assert.ok(methods.includes("eth_getBlockByNumber"));
  assert.equal(
    methods.some((method) => method.startsWith("eth_send")),
    false,
  );
});

test("paginates with an opaque cursor and does not repeat items", async () => {
  const logs = [
    transferLog({
      hash: "0xa",
      blockNumber: 30n,
      logIndex: 2,
      from: OTHER,
      to: SMART,
      amount: 1_000_000n,
    }),
    transferLog({
      hash: "0xb",
      blockNumber: 20n,
      logIndex: 1,
      from: OTHER,
      to: SMART,
      amount: 1_000_000n,
    }),
    transferLog({
      hash: "0xc",
      blockNumber: 10n,
      logIndex: 0,
      from: OTHER,
      to: SMART,
      amount: 1_000_000n,
    }),
  ];

  const fetchMock: typeof fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as { method?: string };
    if (body.method === "eth_blockNumber") {
      return jsonRpcResult("0x1000");
    }
    if (body.method === "eth_getLogs") {
      const topics = (
        JSON.parse(String(init?.body)) as {
          params: Array<{ topics: Array<string | null> }>;
        }
      ).params[0].topics;
      return jsonRpcResult(topics[2] ? logs : []);
    }
    return jsonRpcResult({ timestamp: "0x1" });
  };

  const first = await getUsdcActivityOnBase(SMART, 2, undefined, fetchMock);
  assert.deepEqual(
    first.items.map((item) => item.id),
    ["0xa:2", "0xb:1"],
  );
  assert.equal(first.nextCursor, encodeActivityCursor(20n, 1));

  const second = await getUsdcActivityOnBase(
    SMART,
    2,
    first.nextCursor ?? undefined,
    fetchMock,
  );
  assert.deepEqual(
    second.items.map((item) => item.id),
    ["0xc:0"],
  );
  assert.equal(second.nextCursor, null);
});

test("splits oversized log ranges instead of returning a partial page", async () => {
  const inbound = transferLog({
    hash: "0xok",
    blockNumber: 50n,
    logIndex: 0,
    from: OTHER,
    to: SMART,
    amount: 1_000_000n,
  });
  let oversized = 0;
  let splitSuccess = 0;

  const fetchMock: typeof fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as {
      method?: string;
      params?: Array<{ fromBlock?: string; toBlock?: string; topics?: unknown[] }>;
    };

    if (body.method === "eth_blockNumber") {
      return jsonRpcResult("0x3000");
    }

    if (body.method === "eth_getLogs") {
      const fromBlock = BigInt(body.params?.[0]?.fromBlock ?? "0x0");
      const toBlock = BigInt(body.params?.[0]?.toBlock ?? "0x0");
      const span = toBlock - fromBlock;
      if (span > 2_000n) {
        oversized += 1;
        return jsonRpcError("query exceeds max block range 2000");
      }

      splitSuccess += 1;
      const toTopic = body.params?.[0]?.topics?.[2];
      return jsonRpcResult(toTopic && fromBlock <= 50n && toBlock >= 50n ? [inbound] : []);
    }

    return jsonRpcResult({ timestamp: "0x2" });
  };

  const page = await getUsdcActivityOnBase(SMART, 5, undefined, fetchMock);
  assert.equal(page.items[0]?.id, "0xok:0");
  assert.ok(oversized > 0);
  assert.ok(splitSuccess > 0);
});

test("fails closed when activity logs cannot be loaded", async () => {
  const fetchMock: typeof fetch = async () =>
    new Response("nope", { status: 500 });

  await assert.rejects(
    () => getUsdcActivityOnBase(SMART, 5, undefined, fetchMock),
    /USDC activity/,
  );
});

test("fails closed instead of returning empty when a later log chunk fails", async () => {
  let logCalls = 0;
  const fetchMock: typeof fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as { method?: string };
    if (body.method === "eth_blockNumber") {
      return jsonRpcResult("0x6000");
    }
    if (body.method === "eth_getLogs") {
      logCalls += 1;
      if (logCalls > 2) {
        return new Response("nope", { status: 500 });
      }
      return jsonRpcResult([]);
    }
    return jsonRpcResult({ timestamp: "0x1" });
  };

  await assert.rejects(
    () => getUsdcActivityOnBase(SMART, 5, undefined, fetchMock),
    /USDC activity/,
  );
});

test("keeps a next cursor when a later chunk fails after valid recent logs", async () => {
  const recent = transferLog({
    hash: "0xrecent",
    blockNumber: 20_000n,
    logIndex: 1,
    from: OTHER,
    to: SMART,
    amount: 1_000_000n,
  });
  let logCalls = 0;

  const fetchMock: typeof fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as {
      method?: string;
      params?: Array<{ fromBlock?: string; toBlock?: string; topics?: unknown[] }>;
    };
    if (body.method === "eth_blockNumber") {
      return jsonRpcResult("0x6000");
    }
    if (body.method === "eth_getLogs") {
      logCalls += 1;
      if (logCalls > 2) {
        return new Response("nope", { status: 500 });
      }
      const toTopic = body.params?.[0]?.topics?.[2];
      return jsonRpcResult(toTopic ? [recent] : []);
    }
    return jsonRpcResult({ timestamp: "0x1" });
  };

  const page = await getUsdcActivityOnBase(SMART, 5, undefined, fetchMock);
  assert.equal(page.items[0]?.id, "0xrecent:1");
  assert.equal(page.nextCursor, encodeActivityCursor(20_000n, 1));
});

test("fails closed on a malformed smart-wallet cursor instead of repeating the first page", async () => {
  await assert.rejects(
    () =>
      getUsdcActivityOnBase(SMART, 5, "not-a-cursor", async () =>
        jsonRpcResult("0x1"),
      ),
    { name: "InvalidUsdcActivityCursorError" },
  );
});

test("smart_wallet mode reads the smart wallet only; eoa stays on Privy", async () => {
  const calls: string[] = [];

  await getHomeActivityForWallet(
    {
      moneyAddressMode: "smart_wallet",
      privyWalletId: "eoa-wallet-id",
      smartWalletAddress: SMART,
      limit: 5,
    },
    {
      getUsdcActivityOnBase: async (address) => {
        calls.push(`sw:${address}`);
        return { items: [], nextCursor: null };
      },
      getHomeActivityForPrivyWallet: async (walletId) => {
        calls.push(`eoa:${walletId}`);
        return { items: [], nextCursor: null };
      },
    },
  );

  await getHomeActivityForWallet(
    {
      moneyAddressMode: "eoa",
      privyWalletId: "eoa-wallet-id",
      smartWalletAddress: SMART,
      limit: 5,
    },
    {
      getUsdcActivityOnBase: async (address) => {
        calls.push(`sw:${address}`);
        return { items: [], nextCursor: null };
      },
      getHomeActivityForPrivyWallet: async (walletId) => {
        calls.push(`eoa:${walletId}`);
        return { items: [], nextCursor: null };
      },
    },
  );

  await getHomeActivityForWallet(
    {
      moneyAddressMode: "smart_wallet",
      privyWalletId: "eoa-wallet-id",
      smartWalletAddress: null,
      limit: 5,
    },
    {
      getUsdcActivityOnBase: async (address) => {
        calls.push(`sw:${address}`);
        return { items: [], nextCursor: null };
      },
      getHomeActivityForPrivyWallet: async (walletId) => {
        calls.push(`eoa:${walletId}`);
        return { items: [], nextCursor: null };
      },
    },
  );

  assert.deepEqual(calls, [
    `sw:${SMART}`,
    "eoa:eoa-wallet-id",
    "eoa:eoa-wallet-id",
  ]);
});
