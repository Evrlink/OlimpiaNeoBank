import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { env } from "../src/config/env.js";
import {
  createMemorySmartWalletActivityStore,
  SmartWalletActivityStoreError,
  type NewSmartWalletActivityEvent,
} from "../src/services/smartWalletActivityStore.js";

const USER_A = "11111111-1111-1111-1111-111111111111";
const USER_B = "22222222-2222-2222-2222-222222222222";
const SMART = "0x545803dDb0eE8eB96A531628cB8d3E0306d7e4CA";
const OTHER = "0x6168Bd45eFb539483756d0Ed6b7f8a1502c81B50";
const HASH_A =
  "0x1111111111111111111111111111111111111111111111111111111111111111";
const HASH_B =
  "0x2222222222222222222222222222222222222222222222222222222222222222";
const HASH_C =
  "0x3333333333333333333333333333333333333333333333333333333333333333";

function event(
  overrides: Partial<NewSmartWalletActivityEvent> = {},
): NewSmartWalletActivityEvent {
  return {
    userId: USER_A,
    smartWalletAddress: SMART,
    transactionHash: HASH_A,
    logIndex: 1,
    blockNumber: 100n,
    blockTimestamp: new Date("2026-10-01T18:00:00.000Z"),
    direction: "in",
    rawAmount: "2000000",
    counterpartyAddress: OTHER,
    kind: "received",
    ...overrides,
  };
}

test("migration stores events and a separate monotonic cursor", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const sql = await readFile(
    path.join(apiRoot, "migrations/012_smart_wallet_activity_events.sql"),
    "utf8",
  );

  assert.match(sql, /CREATE TABLE IF NOT EXISTS smart_wallet_activity_events/);
  assert.match(sql, /UNIQUE \(transaction_hash, log_index\)/);
  assert.match(
    sql,
    /kind IN \('received', 'sent', 'grow_deposit', 'grow_withdraw'\)/,
  );
  assert.match(
    sql,
    /smart_wallet_activity_events_user_newest_idx[\s\S]*user_id, block_number DESC, log_index DESC/,
  );
  assert.match(sql, /CREATE TABLE IF NOT EXISTS smart_wallet_activity_cursors/);
  assert.match(sql, /indexed_through_block/);
  assert.match(sql, /UNIQUE \(smart_wallet_address\)/);
  assert.doesNotMatch(
    sql,
    /INSERT INTO smart_wallet_activity_events/,
  );
});

test("inserts are idempotent and do not overwrite the first write", async () => {
  const store = createMemorySmartWalletActivityStore();
  const first = await store.insertEvents([
    event({ kind: "received", direction: "in", rawAmount: "1500000" }),
  ]);
  const second = await store.insertEvents([
    event({
      kind: "sent",
      direction: "out",
      rawAmount: "9999999",
      transactionHash: `0x${HASH_A.slice(2).toUpperCase()}`,
    }),
  ]);

  assert.equal(first.length, 1);
  assert.equal(second.length, 1);
  assert.equal(first[0]?.id, second[0]?.id);
  assert.equal(second[0]?.kind, "received");
  assert.equal(second[0]?.rawAmount, "1500000");
  assert.equal(second[0]?.transactionHash, HASH_A);

  const listed = await store.listEventsForUser({ userId: USER_A, limit: 10 });
  assert.equal(listed.length, 1);
});

test("lists one user's events newest-first without touching the cursor", async () => {
  const store = createMemorySmartWalletActivityStore();
  await store.insertEvents([
    event({
      transactionHash: HASH_A,
      blockNumber: 10n,
      logIndex: 1,
      kind: "received",
      direction: "in",
    }),
    event({
      transactionHash: HASH_B,
      blockNumber: 12n,
      logIndex: 0,
      kind: "sent",
      direction: "out",
    }),
    event({
      transactionHash: HASH_C,
      blockNumber: 12n,
      logIndex: 4,
      kind: "grow_deposit",
      direction: "out",
    }),
    event({
      userId: USER_B,
      transactionHash:
        "0x4444444444444444444444444444444444444444444444444444444444444444",
      blockNumber: 99n,
      kind: "received",
      direction: "in",
    }),
  ]);

  const page = await store.listEventsForUser({ userId: USER_A, limit: 2 });
  assert.deepEqual(
    page.map((item) => `${item.blockNumber}:${item.logIndex}:${item.kind}`),
    ["12:4:grow_deposit", "12:0:sent"],
  );

  const older = await store.listEventsForUser({
    userId: USER_A,
    limit: 10,
    before: { blockNumber: 12n, logIndex: 0 },
  });
  assert.deepEqual(
    older.map((item) => `${item.blockNumber}:${item.logIndex}:${item.kind}`),
    ["10:1:received"],
  );

  assert.equal(
    await store.getCursor({
      userId: USER_A,
      smartWalletAddress: SMART,
    }),
    null,
  );
});

test("a failed insert cannot advance the indexing cursor", async () => {
  const store = createMemorySmartWalletActivityStore();

  await assert.rejects(
    () =>
      store.insertEvents([
        event(),
        event({
          transactionHash: HASH_B,
          kind: "grow_deposit",
          direction: "in",
        }),
      ]),
    SmartWalletActivityStoreError,
  );

  assert.deepEqual(await store.listEventsForUser({ userId: USER_A, limit: 10 }), []);
  assert.equal(
    await store.getCursor({
      userId: USER_A,
      smartWalletAddress: SMART,
    }),
    null,
  );
});

test("cursor advances only through an explicit monotonic checkpoint", async () => {
  const store = createMemorySmartWalletActivityStore();
  const firstAt = new Date("2026-10-01T18:00:00.000Z");
  const laterAt = new Date("2026-10-01T19:00:00.000Z");

  const created = await store.advanceCursor({
    userId: USER_A,
    smartWalletAddress: SMART,
    throughBlock: 50n,
    updatedAt: firstAt,
  });
  assert.equal(created.indexedThroughBlock, 50n);

  const unchanged = await store.advanceCursor({
    userId: USER_A,
    smartWalletAddress: SMART,
    throughBlock: 40n,
    updatedAt: laterAt,
  });
  assert.equal(unchanged.indexedThroughBlock, 50n);
  assert.equal(unchanged.updatedAt.toISOString(), firstAt.toISOString());

  const advanced = await store.advanceCursor({
    userId: USER_A,
    smartWalletAddress: SMART,
    throughBlock: 80n,
    updatedAt: laterAt,
  });
  assert.equal(advanced.indexedThroughBlock, 80n);
  assert.equal(advanced.updatedAt.toISOString(), laterAt.toISOString());

  const loaded = await store.getCursor({
    userId: USER_A,
    smartWalletAddress: `0x${SMART.slice(2).toUpperCase()}`,
  });
  assert.equal(loaded?.indexedThroughBlock, 80n);
});

test("EOA Activity still uses Privy; Smart Wallet Activity uses the indexed store", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const activityRoute = await readFile(
    path.join(apiRoot, "src/routes/v1/activity.ts"),
    "utf8",
  );
  const walletActivity = await readFile(
    path.join(apiRoot, "src/services/walletActivity.ts"),
    "utf8",
  );

  assert.match(activityRoute, /getHomeActivityForWallet/);
  assert.match(activityRoute, /w\.created_at/);
  assert.match(walletActivity, /getIndexedSmartWalletActivity/);
  assert.match(walletActivity, /getHomeActivityForPrivyWallet/);
  assert.doesNotMatch(walletActivity, /getUsdcActivityOnBase/);
});

test("3F.1 does not enable money-movement flags", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const example = await readFile(path.join(apiRoot, ".env.example"), "utf8");

  assert.match(example, /SMART_WALLET_SENDS_ENABLED=false/);
  assert.match(example, /AAVE_SMART_WALLET_DEPOSITS_ENABLED=false/);
  assert.match(example, /AAVE_SMART_WALLET_WITHDRAWALS_ENABLED=false/);
  assert.equal(env.smartWalletSendsEnabled, false);
  assert.equal(env.aaveSmartWalletDepositsEnabled, false);
  assert.equal(env.aaveSmartWalletWithdrawalsEnabled, false);
});
