import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import type { User } from "@privy-io/node";
import {
  AuthSyncError,
  syncAuthenticatedUser,
  type AuthSyncPool,
} from "../src/services/authSync.js";
import type { BalanceSummary } from "../src/lib/responses.js";

const EOA = "0x6168Bd45eFb539483756d0Ed6b7f8a1502c81B50";
const SMART = "0xE326D719e60d2aE9D8e3b4763c31C8c6053D79D8";
const PRIVY_WALLET_ID = "wallet_embedded_test";

const emptyBalance: BalanceSummary = {
  availableUsd: "0.00",
  goalsAllocatedUsd: "0.00",
  growthAllocatedUsd: "0.00",
  totalDisplayUsd: "0.00",
};

type UserRow = {
  id: string;
  privy_user_id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  username: string | null;
  created_at: Date;
};

type WalletRow = {
  id: string;
  user_id: string;
  chain: string;
  address: string;
  privy_wallet_id: string | null;
  smart_wallet_address: string | null;
  smart_wallet_type: string | null;
  money_address_mode: string;
};

function compactSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim().toLowerCase();
}

function cloneUsers(source: Map<string, UserRow>): Map<string, UserRow> {
  return new Map([...source].map(([id, row]) => [id, { ...row }]));
}

function cloneWallets(source: Map<string, WalletRow>): Map<string, WalletRow> {
  return new Map([...source].map(([id, row]) => [id, { ...row }]));
}

function createMemoryAuthSyncPool() {
  const users = new Map<string, UserRow>();
  const wallets = new Map<string, WalletRow>();
  const balances = new Set<string>();
  let snapshot: {
    users: Map<string, UserRow>;
    wallets: Map<string, WalletRow>;
    balances: Set<string>;
  } | null = null;

  function replaceMap<T>(target: Map<string, T>, source: Map<string, T>) {
    target.clear();
    for (const [id, row] of source) {
      target.set(id, { ...row });
    }
  }

  const pool: AuthSyncPool = {
    async connect() {
      return {
        async query<T = unknown>(sql: string, values: unknown[] = []) {
          const normalized = compactSql(sql);

          if (normalized === "begin") {
            snapshot = {
              users: cloneUsers(users),
              wallets: cloneWallets(wallets),
              balances: new Set(balances),
            };
            return { rows: [] as T[] };
          }

          if (normalized === "commit") {
            snapshot = null;
            return { rows: [] as T[] };
          }

          if (normalized === "rollback") {
            if (snapshot) {
              replaceMap(users, snapshot.users);
              replaceMap(wallets, snapshot.wallets);
              balances.clear();
              for (const id of snapshot.balances) {
                balances.add(id);
              }
              snapshot = null;
            }
            return { rows: [] as T[] };
          }

          if (normalized === "select id from users where privy_user_id = $1") {
            const match = [...users.values()].find(
              (row) => row.privy_user_id === values[0],
            );
            return { rows: (match ? [{ id: match.id }] : []) as T[] };
          }

          if (normalized === "select id, money_address_mode from wallets where user_id = $1") {
            const match = [...wallets.values()].find(
              (row) => row.user_id === values[0],
            );
            return {
              rows: (match
                ? [{ id: match.id, money_address_mode: match.money_address_mode }]
                : []) as T[],
            };
          }

          if (normalized.startsWith("insert into users")) {
            const privyUserId = String(values[0]);
            const existing = [...users.values()].find(
              (row) => row.privy_user_id === privyUserId,
            );

            if (existing) {
              existing.email =
                (values[1] as string | null) ?? existing.email;
              existing.phone =
                (values[2] as string | null) ?? existing.phone;
              return { rows: [existing] as T[] };
            }

            const row: UserRow = {
              id: randomUUID(),
              privy_user_id: privyUserId,
              email: (values[1] as string | null) ?? null,
              phone: (values[2] as string | null) ?? null,
              display_name: null,
              username: null,
              created_at: new Date("2026-10-01T19:00:00.000Z"),
            };
            users.set(row.id, row);
            return { rows: [row] as T[] };
          }

          if (normalized.startsWith("insert into wallets")) {
            const incoming: WalletRow = {
              id: randomUUID(),
              user_id: String(values[0]),
              address: String(values[1]),
              chain: "base",
              privy_wallet_id: (values[2] as string | null) ?? null,
              smart_wallet_address: (values[3] as string | null) ?? null,
              smart_wallet_type: (values[4] as string | null) ?? null,
              money_address_mode: String(values[5]),
            };

            const existing = [...wallets.values()].find(
              (row) => row.user_id === incoming.user_id,
            );

            if (!existing) {
              wallets.set(incoming.id, incoming);
              return {
                rows: [
                  {
                    id: incoming.id,
                    chain: incoming.chain,
                    address: incoming.address,
                    privy_wallet_id: incoming.privy_wallet_id,
                    smart_wallet_address: incoming.smart_wallet_address,
                    money_address_mode: incoming.money_address_mode,
                  },
                ] as T[],
              };
            }

            // Mirror authSync ON CONFLICT: update identity fields, never mode.
            existing.address = incoming.address;
            existing.privy_wallet_id =
              incoming.privy_wallet_id ?? existing.privy_wallet_id;
            existing.smart_wallet_address =
              incoming.smart_wallet_address ?? existing.smart_wallet_address;
            existing.smart_wallet_type =
              incoming.smart_wallet_type ?? existing.smart_wallet_type;

            return {
              rows: [
                {
                  id: existing.id,
                  chain: existing.chain,
                  address: existing.address,
                  privy_wallet_id: existing.privy_wallet_id,
                  smart_wallet_address: existing.smart_wallet_address,
                  money_address_mode: existing.money_address_mode,
                },
              ] as T[],
            };
          }

          if (normalized.startsWith("insert into user_balances")) {
            balances.add(String(values[0]));
            return { rows: [] as T[] };
          }

          throw new Error(`Unexpected auth-sync SQL: ${sql}`);
        },
        release() {},
      };
    },
  };

  return {
    pool,
    seedLegacyEoaUser(input: {
      privyUserId: string;
      eoaAddress: string;
      privyWalletId: string;
    }) {
      const user: UserRow = {
        id: randomUUID(),
        privy_user_id: input.privyUserId,
        email: "legacy@example.com",
        phone: null,
        display_name: null,
        username: null,
        created_at: new Date("2026-08-01T00:00:00.000Z"),
      };
      users.set(user.id, user);
      const wallet: WalletRow = {
        id: randomUUID(),
        user_id: user.id,
        chain: "base",
        address: input.eoaAddress,
        privy_wallet_id: input.privyWalletId,
        smart_wallet_address: null,
        smart_wallet_type: null,
        money_address_mode: "eoa",
      };
      wallets.set(wallet.id, wallet);
      balances.add(user.id);
      return { user, wallet };
    },
    storedWallet() {
      return [...wallets.values()][0] ?? null;
    },
    storedUser() {
      return [...users.values()][0] ?? null;
    },
    seedUserWithoutWallet(input: { privyUserId: string; email?: string }) {
      const user: UserRow = {
        id: randomUUID(),
        privy_user_id: input.privyUserId,
        email: input.email ?? "partial@example.com",
        phone: null,
        display_name: null,
        username: null,
        created_at: new Date("2026-09-01T00:00:00.000Z"),
      };
      users.set(user.id, user);
      return user;
    },
    seedSmartWalletUser(input: {
      privyUserId: string;
      eoaAddress: string;
      smartWalletAddress: string;
      privyWalletId: string;
    }) {
      const user: UserRow = {
        id: randomUUID(),
        privy_user_id: input.privyUserId,
        email: "sw@example.com",
        phone: null,
        display_name: null,
        username: null,
        created_at: new Date("2026-09-15T00:00:00.000Z"),
      };
      users.set(user.id, user);
      const wallet: WalletRow = {
        id: randomUUID(),
        user_id: user.id,
        chain: "base",
        address: input.eoaAddress,
        privy_wallet_id: input.privyWalletId,
        smart_wallet_address: input.smartWalletAddress,
        smart_wallet_type: "coinbase_smart_wallet",
        money_address_mode: "smart_wallet",
      };
      wallets.set(wallet.id, wallet);
      balances.add(user.id);
      return { user, wallet };
    },
  };
}

function privyUser(input: {
  eoa: string;
  smartWallet?: string;
  email?: string;
}): User {
  return {
    linked_accounts: [
      {
        type: "wallet",
        chain_type: "ethereum",
        wallet_client_type: "privy",
        address: input.eoa,
        id: PRIVY_WALLET_ID,
      },
      ...(input.smartWallet
        ? [
            {
              type: "smart_wallet",
              smart_wallet_type: "coinbase_smart_wallet",
              address: input.smartWallet,
            },
          ]
        : []),
      {
        type: "email",
        address: input.email ?? "new-user@example.com",
      },
    ],
  } as User;
}

function syncDeps(
  pool: AuthSyncPool,
  user: User,
): Parameters<typeof syncAuthenticatedUser>[1] {
  return {
    getPool: () => pool,
    fetchPrivyUser: async () => user,
    getHomeBalanceForWallet: async () => emptyBalance,
  };
}

test("1. new user + Smart Wallet inserts smart_wallet and publishes that address", async () => {
  const db = createMemoryAuthSyncPool();
  const privyUserId = "did:privy:new-sw";

  const result = await syncAuthenticatedUser(
    privyUserId,
    syncDeps(db.pool, privyUser({ eoa: EOA, smartWallet: SMART })),
  );

  assert.equal(result.isNewUser, true);
  assert.equal(result.wallet.moneyAddressMode, "smart_wallet");
  assert.equal(result.wallet.address, SMART);
  assert.equal(db.storedWallet()?.money_address_mode, "smart_wallet");
  assert.equal(db.storedWallet()?.smart_wallet_address, SMART);
  assert.equal(db.storedWallet()?.address, EOA);
});

test("2. first wallet insert without Smart Wallet is retryable and creates no wallet", async () => {
  const db = createMemoryAuthSyncPool();
  const privyUserId = "did:privy:pending-sw";

  await assert.rejects(
    () => syncAuthenticatedUser(privyUserId, syncDeps(db.pool, privyUser({ eoa: EOA }))),
    (error: unknown) => {
      assert.ok(error instanceof AuthSyncError);
      assert.equal(error.code, "SMART_WALLET_NOT_READY");
      return true;
    },
  );

  assert.equal(db.storedWallet(), null);
  assert.equal(db.storedUser(), null);
});

test("3. retry after #2 with Smart Wallet present creates smart_wallet", async () => {
  const db = createMemoryAuthSyncPool();
  const privyUserId = "did:privy:retry-sw";

  await assert.rejects(
    () => syncAuthenticatedUser(privyUserId, syncDeps(db.pool, privyUser({ eoa: EOA }))),
    (error: unknown) =>
      error instanceof AuthSyncError && error.code === "SMART_WALLET_NOT_READY",
  );

  const result = await syncAuthenticatedUser(
    privyUserId,
    syncDeps(db.pool, privyUser({ eoa: EOA, smartWallet: SMART })),
  );

  assert.equal(result.isNewUser, true);
  assert.equal(result.wallet.moneyAddressMode, "smart_wallet");
  assert.equal(result.wallet.address, SMART);
  assert.equal(db.storedWallet()?.money_address_mode, "smart_wallet");
  assert.equal(db.storedWallet()?.smart_wallet_address, SMART);
});

test("4. leftover user without a wallet cannot become eoa on retry", async () => {
  const db = createMemoryAuthSyncPool();
  const privyUserId = "did:privy:partial-user";

  db.seedUserWithoutWallet({ privyUserId });

  const result = await syncAuthenticatedUser(
    privyUserId,
    syncDeps(db.pool, privyUser({ eoa: EOA, smartWallet: SMART })),
  );

  assert.equal(result.isNewUser, false);
  assert.equal(result.wallet.moneyAddressMode, "smart_wallet");
  assert.equal(result.wallet.address, SMART);
  assert.equal(db.storedWallet()?.money_address_mode, "smart_wallet");
});

test("5. existing legacy eoa user remains eoa", async () => {
  const db = createMemoryAuthSyncPool();
  const privyUserId = "did:privy:legacy";

  db.seedLegacyEoaUser({
    privyUserId,
    eoaAddress: EOA,
    privyWalletId: PRIVY_WALLET_ID,
  });

  const result = await syncAuthenticatedUser(
    privyUserId,
    syncDeps(db.pool, privyUser({ eoa: EOA, smartWallet: SMART })),
  );

  const stored = db.storedWallet();

  assert.equal(result.isNewUser, false);
  assert.equal(result.wallet.moneyAddressMode, "eoa");
  assert.equal(result.wallet.address, EOA);
  assert.equal(stored?.money_address_mode, "eoa");
  assert.equal(stored?.smart_wallet_address, SMART);
});

test("6. existing smart_wallet user remains smart_wallet", async () => {
  const db = createMemoryAuthSyncPool();
  const privyUserId = "did:privy:existing-sw";

  db.seedSmartWalletUser({
    privyUserId,
    eoaAddress: EOA,
    smartWalletAddress: SMART,
    privyWalletId: PRIVY_WALLET_ID,
  });

  const result = await syncAuthenticatedUser(
    privyUserId,
    syncDeps(db.pool, privyUser({ eoa: EOA, smartWallet: SMART })),
  );

  assert.equal(result.isNewUser, false);
  assert.equal(result.wallet.moneyAddressMode, "smart_wallet");
  assert.equal(result.wallet.address, SMART);
  assert.equal(db.storedWallet()?.money_address_mode, "smart_wallet");
});
