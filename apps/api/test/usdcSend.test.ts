import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import express from "express";
import { env } from "../src/config/env.js";
import { createGrowthRouter } from "../src/routes/v1/growth.js";
import { createSendsRouter } from "../src/routes/v1/sends.js";
import {
  AAVE_V3_BASE_POOL,
  AAVE_V3_BASE_USDC_A_TOKEN,
  BASE_USDC,
} from "../src/services/aaveAddresses.js";
import { createMemorySmartWalletDepositStore } from "../src/services/aaveDepositStore.js";
import { createMemorySmartWalletWithdrawStore } from "../src/services/aaveWithdrawStore.js";
import {
  requireSmartWalletSendsEnabled,
  UsdcSendReceiptPendingError,
  verifyUsdcSendReceipt,
} from "../src/services/usdcSendExecution.js";
import {
  assertExecutableUsdcSendPlan,
  encodeUsdcTransfer,
  UsdcSendPlanError,
  buildUsdcSendPlan,
} from "../src/services/usdcSendPlan.js";
import { createMemorySmartWalletSendStore } from "../src/services/usdcSendStore.js";

const SMART = "0x545803dDb0eE8eB96A531628cB8d3E0306d7e4CA";
const EOA = "0x6168Bd45eFb539483756d0Ed6b7f8a1502c81B50";
const DEST = "0x2222222222222222222222222222222222222222";
const UINT256_MAX = (1n << 256n) - 1n;
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const TX_HASH =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const OTHER_TX_HASH =
  "0x2222222222222222222222222222222222222222222222222222222222222222";
const SEND_ID = "66666666-6666-6666-6666-666666666666";
const DEPOSIT_ID = "44444444-4444-4444-4444-444444444444";
const WITHDRAW_ID = "55555555-5555-5555-5555-555555555555";
const ZERO = "0x0000000000000000000000000000000000000000";

function padTopic(address: string): string {
  return `0x${address.slice(2).toLowerCase().padStart(64, "0")}`;
}

function validPlan() {
  return buildUsdcSendPlan({
    smartWalletAddress: SMART,
    destinationAddress: DEST,
    amountUsdc: "1.50",
    availableRawUsdc: 2_000_000n,
    decimals: 6,
  });
}

function createSendApp(input: {
  sendsEnabled: boolean;
  depositsEnabled?: boolean;
  withdrawalsEnabled?: boolean;
  moneyAddressMode?: "eoa" | "smart_wallet";
  verifyReceipt?: typeof verifyUsdcSendReceipt;
  availableRawUsdc?: bigint;
}) {
  const sendStore = createMemorySmartWalletSendStore();
  const depositStore = createMemorySmartWalletDepositStore();
  const withdrawStore = createMemorySmartWalletWithdrawStore();
  const lookupWallet = async () =>
    input.moneyAddressMode === "eoa"
      ? {
          userExists: true,
          userId: "11111111-1111-1111-1111-111111111111",
          privyWalletId: "wallet-current-user",
          moneyAddressMode: "eoa" as const,
          smartWalletAddress: null,
        }
      : {
          userExists: true,
          userId: "11111111-1111-1111-1111-111111111111",
          privyWalletId: "wallet-current-user",
          moneyAddressMode: "smart_wallet" as const,
          smartWalletAddress: SMART,
        };

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
      lookupWallet,
      getGrowth: async () => {
        throw new Error("GET growth should not run.");
      },
      smartWalletDeposits: {
        isExecutionEnabled: () => input.depositsEnabled === true,
        store: depositStore,
        getAvailableRawUsdc: async () => input.availableRawUsdc ?? 2_000_000n,
        getVault: async () => ({ decimals: 6 }),
        verifyReceipt: async () => undefined,
        createId: () => DEPOSIT_ID,
        now: () => new Date("2026-09-25T21:00:00.000Z"),
      },
      smartWalletWithdrawals: {
        isExecutionEnabled: () => input.withdrawalsEnabled === true,
        store: withdrawStore,
        getAvailableRawAusdc: async () => 2_000_000n,
        getVault: async () => ({ decimals: 6 }),
        verifyReceipt: async () => undefined,
        createId: () => WITHDRAW_ID,
        now: () => new Date("2026-09-25T21:00:00.000Z"),
      },
      smartWalletSends: {
        store: sendStore,
      },
    }),
  );
  app.use(
    "/sends",
    createSendsRouter({
      auth: (req, _res, next) => {
        (req as express.Request & { privyUserId?: string }).privyUserId =
          "did:privy:current-user";
        next();
      },
      lookupWallet,
      smartWalletSends: {
        isExecutionEnabled: () => input.sendsEnabled,
        store: sendStore,
        depositStore,
        withdrawStore,
        getAvailableRawUsdc: async () => input.availableRawUsdc ?? 2_000_000n,
        verifyReceipt: input.verifyReceipt ?? (async () => undefined),
        createId: () => SEND_ID,
        now: () => new Date("2026-09-25T21:00:00.000Z"),
      },
    }),
  );

  return { app, sendStore, depositStore, withdrawStore };
}

test("send plan is one USDC.transfer from the Smart Wallet to the destination", () => {
  const plan = validPlan();

  assert.equal(plan.chain, "base");
  assert.equal(plan.chainId, 8453);
  assert.equal(plan.smartWalletAddress, SMART);
  assert.equal(plan.destinationAddress, DEST.toLowerCase());
  assert.equal(plan.amountUsdc, "1.50");
  assert.equal(plan.calls.length, 1);
  assert.equal(plan.calls[0]?.to, BASE_USDC);
  assert.equal(
    plan.calls[0]?.data,
    encodeUsdcTransfer({ to: DEST, amount: 1_500_000n }),
  );
  assert.match(plan.calls[0]?.data ?? "", /^0xa9059cbb/);
  assert.equal(plan.calls[0]?.data.includes(EOA.slice(2).toLowerCase()), false);
  assert.equal(plan.calls[0]?.value, "0x0");
  assert.equal(assertExecutableUsdcSendPlan(plan, SMART), 1_500_000n);
});

test("send plan rejects self, zero, protocol, max, and over-available amounts", () => {
  assert.throws(
    () =>
      buildUsdcSendPlan({
        smartWalletAddress: SMART,
        destinationAddress: SMART,
        amountUsdc: "1.00",
        availableRawUsdc: 2_000_000n,
      }),
    UsdcSendPlanError,
  );
  assert.throws(
    () =>
      buildUsdcSendPlan({
        smartWalletAddress: SMART,
        destinationAddress: ZERO,
        amountUsdc: "1.00",
        availableRawUsdc: 2_000_000n,
      }),
    UsdcSendPlanError,
  );
  assert.throws(
    () =>
      buildUsdcSendPlan({
        smartWalletAddress: SMART,
        destinationAddress: BASE_USDC,
        amountUsdc: "1.00",
        availableRawUsdc: 2_000_000n,
      }),
    UsdcSendPlanError,
  );
  assert.throws(
    () =>
      buildUsdcSendPlan({
        smartWalletAddress: SMART,
        destinationAddress: AAVE_V3_BASE_USDC_A_TOKEN,
        amountUsdc: "1.00",
        availableRawUsdc: 2_000_000n,
      }),
    UsdcSendPlanError,
  );
  assert.throws(
    () =>
      buildUsdcSendPlan({
        smartWalletAddress: SMART,
        destinationAddress: AAVE_V3_BASE_POOL,
        amountUsdc: "1.00",
        availableRawUsdc: 2_000_000n,
      }),
    UsdcSendPlanError,
  );
  assert.throws(
    () =>
      buildUsdcSendPlan({
        smartWalletAddress: SMART,
        destinationAddress: DEST,
        amountUsdc: "3.00",
        availableRawUsdc: 2_000_000n,
      }),
    UsdcSendPlanError,
  );

  const plan = validPlan();
  const maxTransfer = {
    ...plan,
    calls: [
      {
        ...plan.calls[0],
        data: encodeUsdcTransfer({ to: DEST, amount: UINT256_MAX }),
      },
    ] as typeof plan.calls,
  };
  assert.throws(
    () => assertExecutableUsdcSendPlan(maxTransfer, SMART),
    UsdcSendPlanError,
  );
  assert.throws(() => assertExecutableUsdcSendPlan(plan, EOA), UsdcSendPlanError);
});

test("send kill switch stays off unless explicitly enabled", async () => {
  assert.throws(
    () => requireSmartWalletSendsEnabled(false),
    (error: unknown) =>
      error instanceof UsdcSendPlanError && error.status === 403,
  );
  requireSmartWalletSendsEnabled(true);
  const source = await readFile(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/config/env.ts"),
    "utf8",
  );
  assert.match(
    source,
    /parseBoolean\(\s*process\.env\.SMART_WALLET_SENDS_ENABLED,\s*false/,
  );
  assert.notEqual(process.env.SMART_WALLET_SENDS_ENABLED, "true");
  assert.equal(env.smartWalletSendsEnabled, false);
});

test("store replaces prepared sends and refuses a second submitted row", async () => {
  const store = createMemorySmartWalletSendStore();
  const plan = validPlan();
  const first = await store.replacePrepared({
    id: "prep-1",
    userId: "user-1",
    privyUserId: "did:privy:current-user",
    smartWalletAddress: SMART,
    destinationAddress: DEST,
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
      error instanceof UsdcSendPlanError && error.status === 409,
  );
});

test("send receipt verification is read-only and requires USDC from the Smart Wallet", async () => {
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
              topics: [TRANSFER_TOPIC, padTopic(SMART), padTopic(DEST)],
              data: `0x${(1_500_000n).toString(16).padStart(64, "0")}`,
            },
          ],
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  await verifyUsdcSendReceipt(
    {
      transactionHash: TX_HASH,
      smartWalletAddress: SMART,
      destinationAddress: DEST,
      rawAmount: 1_500_000n,
    },
    fetchMock,
  );
  assert.equal((calls[0] as { method?: string }).method, "eth_getTransactionReceipt");
  assert.equal(JSON.stringify(calls).includes("eth_send"), false);

  await assert.rejects(
    () =>
      verifyUsdcSendReceipt(
        {
          transactionHash: TX_HASH,
          smartWalletAddress: SMART,
          destinationAddress: DEST,
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
                    topics: [TRANSFER_TOPIC, padTopic(DEST), padTopic(SMART)],
                    data: `0x${(1_500_000n).toString(16).padStart(64, "0")}`,
                  },
                ],
              },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
      ),
    UsdcSendReceiptPendingError,
  );
});

test("send prepare stays available while submit and confirm stay kill-switched off", async () => {
  const { app } = createSendApp({ sendsEnabled: false });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${address.port}/sends/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50", destinationAddress: DEST }),
      },
    );
    const prepared = (await preparedResponse.json()) as {
      executionEnabled?: boolean;
      id?: string;
    };
    assert.equal(preparedResponse.status, 201);
    assert.equal(prepared.executionEnabled, false);
    assert.equal(prepared.id, SEND_ID);

    const submitResponse = await fetch(
      `http://127.0.0.1:${address.port}/sends/${prepared.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(submitResponse.status, 403);

    const confirmResponse = await fetch(
      `http://127.0.0.1:${address.port}/sends/${prepared.id}/confirm`,
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

test("eoa users cannot submit a smart wallet send even if the flag is on", async () => {
  const { app } = createSendApp({
    sendsEnabled: true,
    moneyAddressMode: "eoa",
  });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/sends/not-a-real-id/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(response.status, 409);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("send confirm persists the hash before verification and retry uses the same hash", async () => {
  let shouldMatch = false;
  const { app, sendStore } = createSendApp({
    sendsEnabled: true,
    verifyReceipt: async () => {
      if (!shouldMatch) {
        throw new UsdcSendReceiptPendingError();
      }
    },
  });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${address.port}/sends/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50", destinationAddress: DEST }),
      },
    );
    const prepared = (await preparedResponse.json()) as { id?: string };
    assert.equal(preparedResponse.status, 201);

    const submitResponse = await fetch(
      `http://127.0.0.1:${address.port}/sends/${prepared.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(submitResponse.status, 200);

    const pendingResponse = await fetch(
      `http://127.0.0.1:${address.port}/sends/${prepared.id}/confirm`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash: TX_HASH }),
      },
    );
    assert.equal(pendingResponse.status, 409);

    const afterPending = await sendStore.getByIdForUser(
      prepared.id ?? "",
      "did:privy:current-user",
    );
    assert.equal(afterPending?.status, "submitted");
    assert.equal(afterPending?.transactionHash, TX_HASH);

    const otherHash = await fetch(
      `http://127.0.0.1:${address.port}/sends/${prepared.id}/confirm`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transactionHash: OTHER_TX_HASH }),
      },
    );
    assert.equal(otherHash.status, 409);

    shouldMatch = true;
    const retry = await fetch(
      `http://127.0.0.1:${address.port}/sends/${prepared.id}/confirm`,
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

test("sending marker is persisted before send and makes /fail fail closed", async () => {
  const { app, sendStore } = createSendApp({ sendsEnabled: true });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${address.port}/sends/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50", destinationAddress: DEST }),
      },
    );
    const prepared = (await preparedResponse.json()) as {
      id?: string;
      sendAttemptedAt?: string | null;
    };
    assert.equal(preparedResponse.status, 201);
    assert.equal(prepared.sendAttemptedAt, null);

    const submitResponse = await fetch(
      `http://127.0.0.1:${address.port}/sends/${prepared.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(submitResponse.status, 200);

    const sendingResponse = await fetch(
      `http://127.0.0.1:${address.port}/sends/${prepared.id}/sending`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    const sending = (await sendingResponse.json()) as { sendAttemptedAt?: string | null };
    assert.equal(sendingResponse.status, 200);
    assert.equal(typeof sending.sendAttemptedAt, "string");
    assert.ok(
      (await sendStore.getByIdForUser(prepared.id ?? "", "did:privy:current-user"))
        ?.sendAttemptedAt,
    );

    const failResponse = await fetch(
      `http://127.0.0.1:${address.port}/sends/${prepared.id}/fail`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(failResponse.status, 409);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("submitted deposits and withdrawals block send prepare", async () => {
  const { app } = createSendApp({
    sendsEnabled: true,
    depositsEnabled: true,
    withdrawalsEnabled: true,
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

    const blockedSend = await fetch(
      `http://127.0.0.1:${address.port}/sends/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50", destinationAddress: DEST }),
      },
    );
    const blockedBody = (await blockedSend.json()) as { error?: { message?: string } };
    assert.equal(blockedSend.status, 409);
    assert.match(blockedBody.error?.message ?? "", /deposit is already in progress/i);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("submitted sends block deposit and withdrawal prepare", async () => {
  const { app } = createSendApp({
    sendsEnabled: true,
    depositsEnabled: true,
    withdrawalsEnabled: true,
  });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const prepared = await fetch(`http://127.0.0.1:${address.port}/sends/prepare`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountUsdc: "1.50", destinationAddress: DEST }),
    });
    const send = (await prepared.json()) as { id?: string };
    assert.equal(prepared.status, 201);
    const submit = await fetch(
      `http://127.0.0.1:${address.port}/sends/${send.id}/submit`,
      { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
    );
    assert.equal(submit.status, 200);

    const blockedDeposit = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const depositBody = (await blockedDeposit.json()) as { error?: { message?: string } };
    assert.equal(blockedDeposit.status, 409);
    assert.match(depositBody.error?.message ?? "", /send is already in progress/i);

    const blockedWithdraw = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-withdrawals/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.50" }),
      },
    );
    const withdrawBody = (await blockedWithdraw.json()) as {
      error?: { message?: string };
    };
    assert.equal(blockedWithdraw.status, 409);
    assert.match(withdrawBody.error?.message ?? "", /send is already in progress/i);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("default env keeps Smart Wallet sends disabled", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const example = await readFile(path.join(apiRoot, ".env.example"), "utf8");
  assert.match(example, /SMART_WALLET_SENDS_ENABLED=false/);
  assert.doesNotMatch(example, /SMART_WALLET_SENDS_ENABLED=true/);
  assert.equal(env.smartWalletSendsEnabled, false);
  assert.equal(env.aaveSmartWalletDepositsEnabled, false);
  assert.equal(env.aaveSmartWalletWithdrawalsEnabled, false);
});

test("send architecture never broadcasts a transaction or uses Privy Earn", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const files = [
    "src/routes/v1/sends.ts",
    "src/services/usdcSendPlan.ts",
    "src/services/usdcSendExecution.ts",
    "src/services/usdcSendStore.ts",
  ];

  for (const file of files) {
    const source = await readFile(path.join(apiRoot, file), "utf8");
    assert.doesNotMatch(source, /\._withdraw\s*\(/);
    assert.doesNotMatch(source, /\._deposit\s*\(/);
    assert.doesNotMatch(source, /\/earn\/ethereum\/withdraw/);
    assert.doesNotMatch(source, /sendTransaction/);
    assert.doesNotMatch(source, /paymaster/i);
  }
});

test("Aave deposit and withdraw calldata files are unchanged by send", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const depositPlan = await readFile(
    path.join(apiRoot, "src/services/aaveDepositPlan.ts"),
    "utf8",
  );
  const withdrawPlan = await readFile(
    path.join(apiRoot, "src/services/aaveWithdrawPlan.ts"),
    "utf8",
  );
  assert.match(depositPlan, /095ea7b3/);
  assert.match(depositPlan, /617ba037/);
  assert.doesNotMatch(depositPlan, /a9059cbb/);
  assert.match(withdrawPlan, /69328dec/);
  assert.doesNotMatch(withdrawPlan, /a9059cbb/);
});
