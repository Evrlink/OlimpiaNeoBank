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
  AAVE_V3_BASE_POOL,
  AAVE_V3_BASE_USDC_A_TOKEN,
  BASE_USDC,
} from "../src/services/aaveAddresses.js";
import { createMemorySmartWalletDepositStore } from "../src/services/aaveDepositStore.js";
import { createMemorySmartWalletSendStore } from "../src/services/usdcSendStore.js";
import {
  AaveWithdrawReceiptPendingError,
  requireAaveSmartWalletWithdrawalsEnabled,
  verifyAaveWithdrawReceipt,
} from "../src/services/aaveWithdrawExecution.js";
import {
  AaveWithdrawPlanError,
  assertExecutableAaveWithdrawPlan,
  assertWithdrawPlanHasNoSecrets,
  buildAaveWithdrawPlan,
  encodeAaveWithdraw,
} from "../src/services/aaveWithdrawPlan.js";
import { createMemorySmartWalletWithdrawStore } from "../src/services/aaveWithdrawStore.js";

const SMART = "0x545803dDb0eE8eB96A531628cB8d3E0306d7e4CA";
const EOA = "0x6168Bd45eFb539483756d0Ed6b7f8a1502c81B50";
const UINT256_MAX = (1n << 256n) - 1n;
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const TX_HASH =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const OTHER_TX_HASH =
  "0x2222222222222222222222222222222222222222222222222222222222222222";
const WITHDRAW_ID = "55555555-5555-5555-5555-555555555555";
const DEPOSIT_ID = "44444444-4444-4444-4444-444444444444";

function padTopic(address: string): string {
  return `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;
}

function validPlan() {
  return buildAaveWithdrawPlan({
    smartWalletAddress: SMART,
    amountUsdc: "1.50",
    availableRawAusdc: 2_000_000n,
    decimals: 6,
  });
}

function createWithdrawApp(input: {
  withdrawalsEnabled: boolean;
  depositsEnabled?: boolean;
  moneyAddressMode?: "eoa" | "smart_wallet";
  verifyReceipt?: typeof verifyAaveWithdrawReceipt;
}) {
  const withdrawStore = createMemorySmartWalletWithdrawStore();
  const depositStore = createMemorySmartWalletDepositStore();
  const sendStore = createMemorySmartWalletSendStore();
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
        isExecutionEnabled: () => input.depositsEnabled === true,
        store: depositStore,
        getAvailableRawUsdc: async () => 2_000_000n,
        getVault: async () => ({ decimals: 6 }),
        verifyReceipt: async () => undefined,
        createId: () => DEPOSIT_ID,
        now: () => new Date("2026-09-25T21:00:00.000Z"),
      },
      smartWalletWithdrawals: {
        isExecutionEnabled: () => input.withdrawalsEnabled,
        store: withdrawStore,
        getAvailableRawAusdc: async () => 2_000_000n,
        getVault: async () => ({ decimals: 6 }),
        verifyReceipt: input.verifyReceipt ?? (async () => undefined),
        createId: () => WITHDRAW_ID,
        now: () => new Date("2026-09-25T21:00:00.000Z"),
      },
      smartWalletSends: {
        store: sendStore,
      },
    }),
  );

  return { app, withdrawStore, depositStore, sendStore };
}

test("withdraw plan is one Pool.withdraw to the same Smart Wallet", () => {
  const plan = validPlan();

  assert.equal(plan.chain, "base");
  assert.equal(plan.chainId, 8453);
  assert.equal(plan.smartWalletAddress, SMART);
  assert.equal(plan.amountUsdc, "1.50");
  assert.equal(plan.calls.length, 1);
  assert.equal(plan.calls[0]?.to, AAVE_V3_BASE_POOL);
  assert.equal(
    plan.calls[0]?.data,
    encodeAaveWithdraw({
      asset: BASE_USDC,
      amount: 1_500_000n,
      to: SMART,
    }),
  );
  assert.match(plan.calls[0]?.data ?? "", /^0x69328dec/);
  assert.equal(plan.calls[0]?.data.includes(EOA.slice(2).toLowerCase()), false);
  assertWithdrawPlanHasNoSecrets(plan, "secret-vault", "secret-app");
});

test("withdraw plan rejects an amount greater than available aUSDC", () => {
  assert.throws(
    () =>
      buildAaveWithdrawPlan({
        smartWalletAddress: SMART,
        amountUsdc: "3.00",
        availableRawAusdc: 2_000_000n,
        decimals: 6,
      }),
    { name: "AaveWithdrawPlanError" },
  );
});

test("executable withdraw plan rejects uint256.max, the funded EOA, and extra calls", () => {
  const plan = validPlan();
  assert.equal(assertExecutableAaveWithdrawPlan(plan, SMART), 1_500_000n);

  const maxWithdraw = {
    ...plan,
    calls: [
      {
        ...plan.calls[0],
        data: encodeAaveWithdraw({
          asset: BASE_USDC,
          amount: UINT256_MAX,
          to: SMART,
        }),
      },
    ] as typeof plan.calls,
  };
  assert.throws(
    () => assertExecutableAaveWithdrawPlan(maxWithdraw, SMART),
    AaveWithdrawPlanError,
  );

  const otherDestination = {
    ...plan,
    calls: [
      {
        ...plan.calls[0],
        data: encodeAaveWithdraw({
          asset: BASE_USDC,
          amount: 1_500_000n,
          to: EOA,
        }),
      },
    ] as typeof plan.calls,
  };
  assert.throws(
    () => assertExecutableAaveWithdrawPlan(otherDestination, SMART),
    AaveWithdrawPlanError,
  );

  assert.throws(
    () => assertExecutableAaveWithdrawPlan(plan, EOA),
    AaveWithdrawPlanError,
  );

  assert.throws(
    () =>
      assertExecutableAaveWithdrawPlan(
        {
          ...plan,
          calls: [plan.calls[0], plan.calls[0]],
        } as unknown as typeof plan,
        SMART,
      ),
    AaveWithdrawPlanError,
  );
});

test("withdrawal kill switch stays off unless explicitly enabled", async () => {
  assert.throws(
    () => requireAaveSmartWalletWithdrawalsEnabled(false),
    (error: unknown) =>
      error instanceof AaveWithdrawPlanError && error.status === 403,
  );
  requireAaveSmartWalletWithdrawalsEnabled(true);
  const source = await readFile(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/config/env.ts"),
    "utf8",
  );
  assert.match(
    source,
    /parseBoolean\(\s*process\.env\.AAVE_SMART_WALLET_WITHDRAWALS_ENABLED,\s*false/,
  );
  assert.match(
    source,
    /parseBoolean\(\s*process\.env\.AAVE_SMART_WALLET_DEPOSITS_ENABLED,\s*false/,
  );
  assert.notEqual(process.env.AAVE_SMART_WALLET_WITHDRAWALS_ENABLED, "true");
  assert.notEqual(process.env.AAVE_SMART_WALLET_DEPOSITS_ENABLED, "true");
});

test("store replaces prepared withdrawals and refuses a second submitted row", async () => {
  const store = createMemorySmartWalletWithdrawStore();
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
    sendAttemptedAt: null,
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
      error instanceof AaveWithdrawPlanError && error.status === 409,
  );

  const confirmed = await store.markConfirmed({
    id: "prep-2",
    privyUserId: "did:privy:current-user",
    transactionHash: TX_HASH,
    confirmedAt: new Date("2026-09-25T21:03:00.000Z"),
  });
  assert.equal(confirmed?.status, "confirmed");
});

test("withdraw receipt verification is read-only and requires USDC back to the Smart Wallet", async () => {
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
                padTopic(AAVE_V3_BASE_USDC_A_TOKEN),
                padTopic(SMART),
              ],
              data: `0x${(1_500_000n).toString(16).padStart(64, "0")}`,
            },
            {
              address: AAVE_V3_BASE_USDC_A_TOKEN,
              topics: [
                TRANSFER_TOPIC,
                padTopic(SMART),
                padTopic("0x0000000000000000000000000000000000000000"),
              ],
              data: `0x${(1_500_000n).toString(16).padStart(64, "0")}`,
            },
          ],
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  await verifyAaveWithdrawReceipt(
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
      verifyAaveWithdrawReceipt(
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
                    topics: [
                      TRANSFER_TOPIC,
                      padTopic(SMART),
                      padTopic(AAVE_V3_BASE_USDC_A_TOKEN),
                    ],
                    data: `0x${(1_500_000n).toString(16).padStart(64, "0")}`,
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    AaveWithdrawReceiptPendingError,
  );
});

test("withdraw prepare stays available while submit and confirm stay kill-switched off", async () => {
  const { app } = createWithdrawApp({ withdrawalsEnabled: false });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/prepare`,
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
    assert.equal(prepared.id, WITHDRAW_ID);

    const submitResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(submitResponse.status, 403);

    const confirmResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/confirm`,
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

test("eoa users cannot submit a smart wallet withdrawal even if the flag is on", async () => {
  const { app } = createWithdrawApp({
    withdrawalsEnabled: true,
    moneyAddressMode: "eoa",
  });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/not-a-real-id/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(response.status, 409);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("withdraw confirm persists the hash before verification and retry uses the same hash", async () => {
  let shouldMatch = false;
  const { app, withdrawStore } = createWithdrawApp({
    withdrawalsEnabled: true,
    verifyReceipt: async () => {
      if (!shouldMatch) {
        throw new AaveWithdrawReceiptPendingError();
      }
    },
  });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const prepared = (await preparedResponse.json()) as { id?: string };
    assert.equal(preparedResponse.status, 201);

    const submitResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(submitResponse.status, 200);

    const pendingResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/confirm`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash: TX_HASH }),
      },
    );
    assert.equal(pendingResponse.status, 409);

    const afterPending = await withdrawStore.getByIdForUser(
      prepared.id ?? "",
      "did:privy:current-user",
    );
    assert.equal(afterPending?.status, "submitted");
    assert.equal(afterPending?.transactionHash, TX_HASH);

    const prepareAgain = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    assert.equal(prepareAgain.status, 409);

    const failResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/fail`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(failResponse.status, 409);
    assert.equal(
      (await withdrawStore.getByIdForUser(prepared.id ?? "", "did:privy:current-user"))
        ?.status,
      "submitted",
    );

    const otherHash = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/confirm`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash: OTHER_TX_HASH }),
      },
    );
    assert.equal(otherHash.status, 409);
    assert.equal(
      (await withdrawStore.getByIdForUser(prepared.id ?? "", "did:privy:current-user"))
        ?.transactionHash,
      TX_HASH,
    );

    shouldMatch = true;
    const retry = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/confirm`,
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

test("fail without a hash still releases a submitted withdrawal", async () => {
  const { app, withdrawStore } = createWithdrawApp({ withdrawalsEnabled: true });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const prepared = (await preparedResponse.json()) as { id?: string };
    assert.equal(preparedResponse.status, 201);

    const submitResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(submitResponse.status, 200);

    const failResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/fail`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(failResponse.status, 200);
    assert.equal(
      (await withdrawStore.getByIdForUser(prepared.id ?? "", "did:privy:current-user"))
        ?.status,
      "failed",
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("sending marker is persisted before send and makes /fail fail closed", async () => {
  const { app, withdrawStore } = createWithdrawApp({ withdrawalsEnabled: true });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const prepared = (await preparedResponse.json()) as {
      id?: string;
      sendAttemptedAt?: string | null;
    };
    assert.equal(preparedResponse.status, 201);
    assert.equal(prepared.sendAttemptedAt, null);

    const submitResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(submitResponse.status, 200);

    const sendingResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/sending`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    const sending = (await sendingResponse.json()) as { sendAttemptedAt?: string | null };
    assert.equal(sendingResponse.status, 200);
    assert.equal(typeof sending.sendAttemptedAt, "string");

    const stored = await withdrawStore.getByIdForUser(
      prepared.id ?? "",
      "did:privy:current-user",
    );
    assert.equal(stored?.status, "submitted");
    assert.equal(stored?.transactionHash, null);
    assert.ok(stored?.sendAttemptedAt);

    const sendingAgain = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/sending`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    const sendingAgainBody = (await sendingAgain.json()) as {
      sendAttemptedAt?: string | null;
    };
    assert.equal(sendingAgain.status, 200);
    assert.equal(sendingAgainBody.sendAttemptedAt, sending.sendAttemptedAt);

    const failResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${prepared.id}/fail`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(failResponse.status, 409);
    assert.equal(
      (await withdrawStore.getByIdForUser(prepared.id ?? "", "did:privy:current-user"))
        ?.status,
      "submitted",
    );

    const prepareAgain = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    assert.equal(prepareAgain.status, 409);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("sending stays kill-switched off and eoa cannot mark sending", async () => {
  const offApp = createWithdrawApp({ withdrawalsEnabled: false });
  const offServer = createServer(offApp.app);
  await new Promise<void>((resolve) => offServer.listen(0, "127.0.0.1", resolve));
  const offAddress = offServer.address();
  assert.ok(offAddress && typeof offAddress === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${offAddress.port}/growth/smart-wallet-withdrawals/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const prepared = (await preparedResponse.json()) as { id?: string };
    assert.equal(preparedResponse.status, 201);

    const sendingOff = await fetch(
      `http://127.0.0.1:${offAddress.port}/growth/smart-wallet-withdrawals/${prepared.id}/sending`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(sendingOff.status, 403);
  } finally {
    await new Promise<void>((resolve, reject) => {
      offServer.close((error) => (error ? reject(error) : resolve()));
    });
  }

  const { app } = createWithdrawApp({
    withdrawalsEnabled: true,
    moneyAddressMode: "eoa",
  });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/not-a-real-id/sending`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(response.status, 409);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("submitted deposits and withdrawals cross-lock each other", async () => {
  const { app } = createWithdrawApp({
    withdrawalsEnabled: true,
    depositsEnabled: true,
  });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const depositPrepared = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const deposit = (await depositPrepared.json()) as { id?: string };
    assert.equal(depositPrepared.status, 201);

    const depositSubmit = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/${deposit.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(depositSubmit.status, 200);

    const blockedWithdraw = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const blockedWithdrawBody = (await blockedWithdraw.json()) as {
      error?: { message?: string };
    };
    assert.equal(blockedWithdraw.status, 409);
    assert.match(
      blockedWithdrawBody.error?.message ?? "",
      /deposit is already in progress/i,
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("submitted withdrawals block a new deposit prepare", async () => {
  const { app } = createWithdrawApp({
    withdrawalsEnabled: true,
    depositsEnabled: true,
  });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const withdrawPrepared = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const withdrawal = (await withdrawPrepared.json()) as { id?: string };
    assert.equal(withdrawPrepared.status, 201);

    const withdrawSubmit = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/${withdrawal.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(withdrawSubmit.status, 200);

    const blockedDeposit = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const blockedDepositBody = (await blockedDeposit.json()) as {
      error?: { message?: string };
    };
    assert.equal(blockedDeposit.status, 409);
    assert.match(
      blockedDepositBody.error?.message ?? "",
      /withdrawal is already in progress/i,
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("default env keeps Smart Wallet Aave deposits and withdrawals disabled", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const example = await readFile(path.join(apiRoot, ".env.example"), "utf8");
  assert.match(example, /AAVE_SMART_WALLET_DEPOSITS_ENABLED=false/);
  assert.match(example, /AAVE_SMART_WALLET_WITHDRAWALS_ENABLED=false/);
  assert.doesNotMatch(example, /AAVE_SMART_WALLET_DEPOSITS_ENABLED=true/);
  assert.doesNotMatch(example, /AAVE_SMART_WALLET_WITHDRAWALS_ENABLED=true/);
  assert.equal(env.aaveSmartWalletDepositsEnabled, false);
  assert.equal(env.aaveSmartWalletWithdrawalsEnabled, false);
});

test("deposit architecture is unchanged by the withdrawal send-attempt lock", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const depositStore = await readFile(
    path.join(apiRoot, "src/services/aaveDepositStore.ts"),
    "utf8",
  );
  const depositExecution = await readFile(
    path.join(apiRoot, "src/services/aaveDepositExecution.ts"),
    "utf8",
  );
  const growth = await readFile(path.join(apiRoot, "src/routes/v1/growth.ts"), "utf8");
  const mobileDepositGuard = await readFile(
    path.resolve(apiRoot, "../mobile/src/services/aavePlanGuard.ts"),
    "utf8",
  );
  const mobileScreen = await readFile(
    path.resolve(apiRoot, "../mobile/src/screens/ChooseYieldScreen.tsx"),
    "utf8",
  );

  assert.doesNotMatch(depositStore, /send_attempted_at/);
  assert.doesNotMatch(depositStore, /markSendAttempted/);
  assert.doesNotMatch(depositExecution, /send_attempted_at/);
  assert.match(growth, /smart-wallet-deposits\/:id\/fail/);
  assert.doesNotMatch(growth, /smart-wallet-deposits\/:id\/sending/);
  assert.doesNotMatch(mobileDepositGuard, /sendAttemptedAt/);
  assert.match(mobileScreen, /failSmartWalletDeposit/);
  assert.doesNotMatch(mobileScreen, /markSmartWalletWithdrawalSending/);
});

test("withdraw architecture never sends a transaction or uses Privy Earn withdraw", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const files = [
    "src/routes/v1/growth.ts",
    "src/services/aaveWithdrawPlan.ts",
    "src/services/aaveWithdrawExecution.ts",
    "src/services/aaveWithdrawStore.ts",
  ];

  for (const file of files) {
    const source = await readFile(path.join(apiRoot, file), "utf8");
    assert.doesNotMatch(source, /\._withdraw\s*\(/);
    assert.doesNotMatch(source, /\/earn\/ethereum\/withdraw/);
    assert.doesNotMatch(source, /sendTransaction/);
    assert.doesNotMatch(source, /paymaster/i);
  }
});

test("mobile withdrawal wiring uses a dedicated guard and hash-first retry", async () => {
  const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../mobile");
  const guard = await readFile(
    path.join(mobileRoot, "src/services/aaveWithdrawPlanGuard.ts"),
    "utf8",
  );
  const execution = await readFile(
    path.join(mobileRoot, "src/services/aaveWithdrawExecution.ts"),
    "utf8",
  );
  const client = await readFile(
    path.join(mobileRoot, "src/services/api/growth.ts"),
    "utf8",
  );
  const screen = await readFile(
    path.join(mobileRoot, "src/screens/ChooseYieldScreen.tsx"),
    "utf8",
  );

  assert.match(guard, /assertExecutableAaveWithdrawPlan/);
  assert.match(guard, /69328dec/);
  assert.match(guard, /moneyAddressMode !== "smart_wallet"/);
  assert.match(guard, /UINT256_MAX/);
  assert.doesNotMatch(guard, /aavePlanGuard/);
  assert.doesNotMatch(guard, /assertExecutableAavePlan/);
  assert.doesNotMatch(guard, /sendTransaction/);
  assert.doesNotMatch(guard, /paymaster/i);
  assert.doesNotMatch(guard, /\._withdraw\s*\(/);

  assert.match(client, /smart-wallet-withdrawals\/prepare/);
  assert.match(client, /markSmartWalletWithdrawalSending/);
  assert.match(client, /smart-wallet-withdrawals\/\$\{path\}/);
  assert.match(client, /prepareSmartWalletWithdrawal/);
  assert.match(client, /submitSmartWalletWithdrawal/);
  assert.match(client, /confirmSmartWalletWithdrawal/);
  assert.match(client, /failSmartWalletWithdrawal/);
  assert.doesNotMatch(client, /paymaster/i);
  assert.doesNotMatch(client, /\._withdraw\s*\(/);

  assert.match(
    execution,
    /if \(!plan\.executionEnabled\) \{\s*throw new AaveWithdrawPlanGuardError\([\s\S]*?\}\s*const client = await input\.getClientForChain/,
  );
  assert.match(
    execution,
    /await markSmartWalletWithdrawalSending\([\s\S]*?client\.sendTransaction/,
  );
  assert.match(
    execution,
    /sendHasBeenAttempted\(session\) && !existingHash/,
  );
  assert.doesNotMatch(execution, /failSmartWalletWithdrawal/);
  assert.match(execution, /session\.sentTransactionHash = hash/);
  assert.match(execution, /confirmSmartWalletWithdrawal/);
  assert.match(execution, /if \(existingHash && existingPlan\?\.id\)/);
  assert.doesNotMatch(execution, /aavePlanGuard/);
  assert.doesNotMatch(execution, /paymaster/i);
  assert.doesNotMatch(execution, /\._withdraw\s*\(/);

  assert.doesNotMatch(screen, /executeSmartWalletWithdrawal/);
  assert.doesNotMatch(screen, /prepareSmartWalletWithdrawal/);
  assert.doesNotMatch(screen, /aaveWithdrawPlanGuard/);

  const home = await readFile(
    path.join(mobileRoot, "src/screens/EmptyHomeScreen.tsx"),
    "utf8",
  );
  const sheet = await readFile(
    path.join(mobileRoot, "src/components/WithdrawSheet.tsx"),
    "utf8",
  );
  const shell = await readFile(
    path.join(mobileRoot, "src/components/AuthenticatedTabShell.tsx"),
    "utf8",
  );

  assert.doesNotMatch(home, /executeSmartWalletWithdrawal/);
  assert.doesNotMatch(home, /failSmartWalletWithdrawal/);
  assert.match(home, /Withdraw/);
  assert.match(home, /Receive USDC/);

  assert.match(sheet, /executeSmartWalletWithdrawal/);
  assert.match(sheet, /setAmountText\(growBalanceUsdc\.trim\(\)\)/);
  assert.match(sheet, /Withdraw up to/);
  assert.match(sheet, /Your money is now available to use\./);
  assert.match(sheet, /Available now:/);
  assert.match(sheet, /executionLockRef/);
  assert.doesNotMatch(sheet, /failSmartWalletWithdrawal/);
  assert.doesNotMatch(sheet, /UINT256_MAX/);
  assert.doesNotMatch(sheet, /1n << 256n/);
  assert.doesNotMatch(sheet, /paymaster/i);
  assert.doesNotMatch(sheet, /\._withdraw\s*\(/);

  assert.match(shell, /WithdrawSheet/);
  assert.doesNotMatch(shell, /failSmartWalletWithdrawal/);
});
