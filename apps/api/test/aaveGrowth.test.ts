import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import express from "express";
import { env } from "../src/config/env.js";
import { createGrowthRouter } from "../src/routes/v1/growth.js";
import {
  getGrowthForSmartWallet,
  toGrowthSummaryFromAusdcRaw,
} from "../src/services/aaveGrowth.js";
import {
  AAVE_V3_BASE_POOL,
  AAVE_V3_BASE_USDC_A_TOKEN,
  BASE_USDC,
} from "../src/services/aaveAddresses.js";
import {
  AaveDepositReceiptPendingError,
  requireAaveSmartWalletDepositsEnabled,
  verifyAaveDepositReceipt,
} from "../src/services/aaveDepositExecution.js";
import {
  AaveDepositPlanError,
  assertExecutableAaveDepositPlan,
  assertPlanHasNoSecrets,
  buildAaveDepositPlan,
  encodeAaveSupply,
  encodeUsdcApprove,
} from "../src/services/aaveDepositPlan.js";
import { createMemorySmartWalletDepositStore } from "../src/services/aaveDepositStore.js";
import { getHomeGrowthForWallet } from "../src/services/walletGrowth.js";

const SMART = "0x545803dDb0eE8eB96A531628cB8d3E0306d7e4CA";
const EOA = "0x6168Bd45eFb539483756d0Ed6b7f8a1502c81B50";

const emptyGrowth = {
  liveApyPercent: "4.25",
  currentRedeemableUsdc: "0.00",
  totalDepositedUsdc: "0.00",
  totalWithdrawnUsdc: "0.00",
  earnedYieldUsdc: "0.00",
  availableLiquidityUsd: "1.00",
};

test("maps aUSDC units to the Grow summary without claiming earned yield", () => {
  assert.deepEqual(
    toGrowthSummaryFromAusdcRaw(2_000_000n, {
      decimals: 6,
      liveApyPercent: "4.25",
      availableLiquidityUsd: "10.00",
    }),
    {
      liveApyPercent: "4.25",
      currentRedeemableUsdc: "2.00",
      totalDepositedUsdc: "0.00",
      totalWithdrawnUsdc: "0.00",
      earnedYieldUsdc: "0.00",
      availableLiquidityUsd: "10.00",
    },
  );
});

test("reads aUSDC with a read-only eth_call and no send", async () => {
  const calls: unknown[] = [];
  const fetchMock: typeof fetch = async (_input, init) => {
    calls.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify({ result: "0x1e8480" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await getGrowthForSmartWallet(
    SMART,
    {
      decimals: 6,
      liveApyPercent: "4.25",
      availableLiquidityUsd: "10.00",
    },
    fetchMock,
  );

  assert.equal(result.currentRedeemableUsdc, "2.00");
  const body = calls[0] as {
    method?: string;
    params?: Array<{ to?: string; data?: string }>;
  };
  assert.equal(body.method, "eth_call");
  assert.equal(body.params?.[0]?.to, AAVE_V3_BASE_USDC_A_TOKEN);
  assert.match(String(body.params?.[0]?.data), /^0x70a08231/);
  assert.equal(
    JSON.stringify(calls).includes("eth_send"),
    false,
  );
});

test("smart_wallet Grow reads the smart wallet; eoa stays on Privy Earn", async () => {
  const calls: string[] = [];

  await getHomeGrowthForWallet(
    {
      moneyAddressMode: "smart_wallet",
      privyWalletId: "eoa-wallet-id",
      smartWalletAddress: SMART,
    },
    {
      getAaveBaseUsdcVaultMetadata: async () => ({
        decimals: 6,
        liveApyPercent: "4.25",
        availableLiquidityUsd: "1.00",
      }),
      getGrowthForSmartWallet: async (address) => {
        calls.push(`sw:${address}`);
        return emptyGrowth;
      },
      getGrowthForPrivyWallet: async (walletId) => {
        calls.push(`eoa:${walletId}`);
        return emptyGrowth;
      },
    },
  );

  await getHomeGrowthForWallet(
    {
      moneyAddressMode: "eoa",
      privyWalletId: "eoa-wallet-id",
      smartWalletAddress: SMART,
    },
    {
      getGrowthForSmartWallet: async (address) => {
        calls.push(`sw:${address}`);
        return emptyGrowth;
      },
      getGrowthForPrivyWallet: async (walletId) => {
        calls.push(`eoa:${walletId}`);
        return emptyGrowth;
      },
    },
  );

  assert.deepEqual(calls, [`sw:${SMART}`, "eoa:eoa-wallet-id"]);
});

test("deposit plan is approve + supply for the smart wallet only", () => {
  const plan = buildAaveDepositPlan({
    smartWalletAddress: SMART,
    amountUsdc: "1.50",
    availableRawUsdc: 2_000_000n,
    decimals: 6,
  });

  assert.equal(plan.chain, "base");
  assert.equal(plan.chainId, 8453);
  assert.equal(plan.smartWalletAddress, SMART);
  assert.equal(plan.amountUsdc, "1.50");
  assert.equal(plan.calls[0]?.to, BASE_USDC);
  assert.equal(plan.calls[1]?.to, AAVE_V3_BASE_POOL);
  assert.equal(plan.calls[0]?.data, encodeUsdcApprove(AAVE_V3_BASE_POOL, 1_500_000n));
  assert.equal(
    plan.calls[1]?.data,
    encodeAaveSupply({
      asset: BASE_USDC,
      amount: 1_500_000n,
      onBehalfOf: SMART,
    }),
  );
  assert.equal(plan.calls[1]?.data.includes(EOA.slice(2).toLowerCase()), false);
  assertPlanHasNoSecrets(plan, "secret-vault", "secret-app");
});

test("deposit plan rejects an amount greater than available USDC", () => {
  assert.throws(
    () =>
      buildAaveDepositPlan({
        smartWalletAddress: SMART,
        amountUsdc: "3.00",
        availableRawUsdc: 2_000_000n,
        decimals: 6,
      }),
    { name: "AaveDepositPlanError" },
  );
});

const UINT256_MAX = (1n << 256n) - 1n;
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const TX_HASH =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const OTHER_TX_HASH =
  "0x2222222222222222222222222222222222222222222222222222222222222222";

function validPlan() {
  return buildAaveDepositPlan({
    smartWalletAddress: SMART,
    amountUsdc: "1.50",
    availableRawUsdc: 2_000_000n,
    decimals: 6,
  });
}

function padTopic(address: string): string {
  return `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;
}

function createDepositApp(input: {
  executionEnabled: boolean;
  moneyAddressMode?: "eoa" | "smart_wallet";
  verifyReceipt?: typeof verifyAaveDepositReceipt;
}) {
  const store = createMemorySmartWalletDepositStore();
  const app = express();
  app.use(express.json());
  app.use(
    "/growth",
    createGrowthRouter({
      auth: (req, _res, next) => {
        (req as express.Request & { privyUserId?: string }).privyUserId =
          "did:privy:current-user";
        next();
      },
      lookupWallet: async () =>
        input.moneyAddressMode === "eoa"
          ? {
              userExists: true,
              userId: "11111111-1111-1111-1111-111111111111",
              privyWalletId: "wallet-current-user",
              moneyAddressMode: "eoa",
              smartWalletAddress: null,
            }
          : {
              userExists: true,
              userId: "11111111-1111-1111-1111-111111111111",
              privyWalletId: "wallet-current-user",
              moneyAddressMode: "smart_wallet",
              smartWalletAddress: SMART,
            },
      getGrowth: async () => {
        throw new Error("GET growth should not run.");
      },
      smartWalletDeposits: {
        isExecutionEnabled: () => input.executionEnabled,
        store,
        getAvailableRawUsdc: async () => 2_000_000n,
        getVault: async () => ({ decimals: 6 }),
        verifyReceipt: input.verifyReceipt ?? (async () => undefined),
        createId: () => "44444444-4444-4444-4444-444444444444",
        now: () => new Date("2026-09-25T21:00:00.000Z"),
      },
    }),
  );

  return { app, store };
}

test("executable plan rejects max approval, wrong chain, and the funded EOA", () => {
  const plan = validPlan();
  assert.equal(assertExecutableAaveDepositPlan(plan, SMART), 1_500_000n);

  const maxApproval = {
    ...plan,
    calls: [
      { ...plan.calls[0], data: encodeUsdcApprove(AAVE_V3_BASE_POOL, UINT256_MAX) },
      plan.calls[1],
    ] as typeof plan.calls,
  };
  assert.throws(
    () => assertExecutableAaveDepositPlan(maxApproval, SMART),
    AaveDepositPlanError,
  );

  assert.throws(
    () => assertExecutableAaveDepositPlan({ ...plan, chainId: 84532 as 8453 }, SMART),
    AaveDepositPlanError,
  );

  assert.throws(
    () => assertExecutableAaveDepositPlan(plan, EOA),
    AaveDepositPlanError,
  );

  assert.throws(
    () =>
      assertExecutableAaveDepositPlan(
        {
          ...plan,
          calls: [plan.calls[0]],
        } as typeof plan,
        SMART,
      ),
    AaveDepositPlanError,
  );
});

test("kill switch stays off unless explicitly enabled", async () => {
  assert.throws(
    () => requireAaveSmartWalletDepositsEnabled(false),
    (error: unknown) =>
      error instanceof AaveDepositPlanError && error.status === 403,
  );
  requireAaveSmartWalletDepositsEnabled(true);
  const source = await readFile(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/config/env.ts"),
    "utf8",
  );
  assert.match(
    source,
    /parseBoolean\(\s*process\.env\.AAVE_SMART_WALLET_DEPOSITS_ENABLED,\s*false/,
  );
  assert.notEqual(process.env.AAVE_SMART_WALLET_DEPOSITS_ENABLED, "true");
});

test("store replaces prepared deposits and refuses a second submitted row", async () => {
  const store = createMemorySmartWalletDepositStore();
  const plan = validPlan();
  const first = await store.replacePrepared({
    id: "prep-1",
    userId: "user-1",
    privyUserId: "did:privy:current-user",
    smartWalletAddress: SMART,
    amountUsdc: plan.amountUsdc,
    rawAmount: "1500000",
    calls: plan.calls,
    status: "prepared",
    transactionHash: null,
    failureReason: null,
    expiresAt: new Date("2026-09-25T21:05:00.000Z"),
    submittedAt: null,
    confirmedAt: null,
    createdAt: new Date("2026-09-25T21:00:00.000Z"),
  });
  const second = await store.replacePrepared({
    ...first,
    id: "prep-2",
    createdAt: new Date("2026-09-25T21:01:00.000Z"),
  });
  assert.equal(second.id, "prep-2");
  assert.equal((await store.getByIdForUser("prep-1", "did:privy:current-user"))?.status, "failed");

  const submitted = await store.markSubmitted({
    id: "prep-2",
    privyUserId: "did:privy:current-user",
    submittedAt: new Date("2026-09-25T21:02:00.000Z"),
  });
  assert.equal(submitted?.status, "submitted");

  await assert.rejects(
    () =>
      store.replacePrepared({
        ...first,
        id: "prep-3",
      }),
    (error: unknown) =>
      error instanceof AaveDepositPlanError && error.status === 409,
  );

  const confirmed = await store.markConfirmed({
    id: "prep-2",
    privyUserId: "did:privy:current-user",
    transactionHash: TX_HASH,
    confirmedAt: new Date("2026-09-25T21:03:00.000Z"),
  });
  assert.equal(confirmed?.status, "confirmed");
});

test("receipt verification is read-only and requires the Aave transfer pair", async () => {
  const calls: unknown[] = [];
  const fetchMock: typeof fetch = async (_input, init) => {
    calls.push(JSON.parse(String(init?.body)));
    return new Response(
      JSON.stringify({
        result: {
          status: "0x1",
          logs: [
            {
              address: BASE_USDC,
              topics: [
                TRANSFER_TOPIC,
                padTopic(SMART),
                padTopic(AAVE_V3_BASE_USDC_A_TOKEN),
              ],
              data: `0x${(1_500_000n).toString(16).padStart(64, "0")}`,
            },
            {
              address: AAVE_V3_BASE_USDC_A_TOKEN,
              topics: [
                TRANSFER_TOPIC,
                padTopic("0x0000000000000000000000000000000000000000"),
                padTopic(SMART),
              ],
              data: `0x${(1_500_000n).toString(16).padStart(64, "0")}`,
            },
          ],
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  await verifyAaveDepositReceipt(
    {
      transactionHash: TX_HASH,
      smartWalletAddress: SMART,
      rawAmount: 1_500_000n,
    },
    fetchMock,
  );
  assert.equal((calls[0] as { method?: string }).method, "eth_getTransactionReceipt");
  assert.equal(JSON.stringify(calls).includes("eth_send"), false);

  await assert.rejects(
    () =>
      verifyAaveDepositReceipt(
        {
          transactionHash: TX_HASH,
          smartWalletAddress: SMART,
          rawAmount: 1_500_000n,
        },
        async () =>
          new Response(
            JSON.stringify({
              result: {
                status: "0x1",
                logs: [
                  {
                    address: BASE_USDC,
                    topics: [TRANSFER_TOPIC, padTopic(SMART), padTopic(AAVE_V3_BASE_POOL)],
                    data: `0x${(1_500_000n).toString(16).padStart(64, "0")}`,
                  },
                  {
                    address: AAVE_V3_BASE_USDC_A_TOKEN,
                    topics: [
                      TRANSFER_TOPIC,
                      padTopic("0x0000000000000000000000000000000000000000"),
                      padTopic(SMART),
                    ],
                    data: `0x${(1_500_000n).toString(16).padStart(64, "0")}`,
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    AaveDepositReceiptPendingError,
  );

  await assert.rejects(
    () =>
      verifyAaveDepositReceipt(
        {
          transactionHash: TX_HASH,
          smartWalletAddress: SMART,
          rawAmount: 1_500_000n,
        },
        async () =>
          new Response(JSON.stringify({ result: null }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    AaveDepositReceiptPendingError,
  );
});

test("prepare stays available while submit and confirm stay kill-switched off", async () => {
  const { app } = createDepositApp({ executionEnabled: false });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const prepared = (await preparedResponse.json()) as {
      executionEnabled?: boolean;
      id?: string;
    };
    assert.equal(preparedResponse.status, 201);
    assert.equal(prepared.executionEnabled, false);
    assert.equal(prepared.id, "44444444-4444-4444-4444-444444444444");

    const submitResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${prepared.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(submitResponse.status, 403);

    const confirmResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${prepared.id}/confirm`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash: TX_HASH }),
      },
    );
    assert.equal(confirmResponse.status, 403);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("eoa users cannot submit a smart wallet deposit even if the flag is on", async () => {
  const { app } = createDepositApp({
    executionEnabled: true,
    moneyAddressMode: "eoa",
  });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/not-a-real-id/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(response.status, 409);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("confirm is idempotent for the same hash and never sends a transaction", async () => {
  const { app } = createDepositApp({ executionEnabled: true });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const prepared = (await preparedResponse.json()) as { id?: string };
    assert.equal(preparedResponse.status, 201);

    const submitResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${prepared.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(submitResponse.status, 200);

    const confirmResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${prepared.id}/confirm`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash: TX_HASH }),
      },
    );
    const confirmed = (await confirmResponse.json()) as { status?: string };
    assert.equal(confirmResponse.status, 200);
    assert.equal(confirmed.status, "confirmed");

    const again = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${prepared.id}/confirm`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash: TX_HASH }),
      },
    );
    assert.equal(again.status, 200);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("confirm persists the hash before verification and retry uses the same hash", async () => {
  let shouldMatch = false;
  const { app, store } = createDepositApp({
    executionEnabled: true,
    verifyReceipt: async () => {
      if (!shouldMatch) {
        throw new AaveDepositReceiptPendingError();
      }
    },
  });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const prepared = (await preparedResponse.json()) as { id?: string };
    assert.equal(preparedResponse.status, 201);

    const submitResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${prepared.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(submitResponse.status, 200);

    const pendingResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${prepared.id}/confirm`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash: TX_HASH }),
      },
    );
    assert.equal(pendingResponse.status, 409);

    const afterPending = await store.getByIdForUser(
      prepared.id ?? "",
      "did:privy:current-user",
    );
    assert.equal(afterPending?.status, "submitted");
    assert.equal(afterPending?.transactionHash, TX_HASH);

    const prepareAgain = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    assert.equal(prepareAgain.status, 409);

    const failResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${prepared.id}/fail`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(failResponse.status, 409);
    assert.equal(
      (await store.getByIdForUser(prepared.id ?? "", "did:privy:current-user"))?.status,
      "submitted",
    );

    const otherHash = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${prepared.id}/confirm`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash: OTHER_TX_HASH }),
      },
    );
    assert.equal(otherHash.status, 409);
    assert.equal(
      (await store.getByIdForUser(prepared.id ?? "", "did:privy:current-user"))
        ?.transactionHash,
      TX_HASH,
    );

    shouldMatch = true;
    const retry = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${prepared.id}/confirm`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash: TX_HASH }),
      },
    );
    const confirmed = (await retry.json()) as { status?: string };
    assert.equal(retry.status, 200);
    assert.equal(confirmed.status, "confirmed");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("fail without a hash still releases a submitted deposit", async () => {
  const { app, store } = createDepositApp({ executionEnabled: true });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const prepared = (await preparedResponse.json()) as { id?: string };
    assert.equal(preparedResponse.status, 201);

    const submitResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${prepared.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(submitResponse.status, 200);

    const failResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${prepared.id}/fail`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(failResponse.status, 200);
    assert.equal(
      (await store.getByIdForUser(prepared.id ?? "", "did:privy:current-user"))?.status,
      "failed",
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("default env keeps Smart Wallet Aave execution disabled", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const example = await readFile(path.join(apiRoot, ".env.example"), "utf8");
  assert.match(example, /AAVE_SMART_WALLET_DEPOSITS_ENABLED=false/);
  assert.doesNotMatch(example, /AAVE_SMART_WALLET_DEPOSITS_ENABLED=true/);
  assert.equal(env.aaveSmartWalletDepositsEnabled, false);
});
