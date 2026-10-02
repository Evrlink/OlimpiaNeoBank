import type { User } from "@privy-io/node";
import {
  extractEmail,
  extractEmbeddedEthereumWallet,
  extractPhone,
  extractSmartWalletIdentity,
  fetchPrivyUser,
  resolvePrivyWalletId,
} from "../auth/privy.js";
import { getPool } from "../db/pool.js";
import {
  toUserProfile,
  type BalanceSummary,
  type UserProfile,
  type WalletSummary,
} from "../lib/responses.js";
import { toPublicMoneyAddress } from "./moneyAddress.js";
import { getHomeBalanceForWallet } from "./walletBalance.js";

type QueryResult<T> = { rows: T[] };

type AuthSyncClient = {
  query<T = unknown>(sql: string, values?: unknown[]): Promise<QueryResult<T>>;
  release(): void;
};

export type AuthSyncPool = {
  connect(): Promise<AuthSyncClient>;
};

export type SyncAuthenticatedUserDeps = {
  getPool?: () => AuthSyncPool | null;
  fetchPrivyUser?: (privyUserId: string) => Promise<User>;
  resolvePrivyWalletId?: (input: {
    privyUserId: string;
    address: string;
  }) => Promise<string | null>;
  getHomeBalanceForWallet?: typeof getHomeBalanceForWallet;
};

type SyncResult = {
  user: UserProfile;
  wallet: WalletSummary;
  balance: BalanceSummary;
  isNewUser: boolean;
};

type DbUserRow = {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  username: string | null;
  created_at: Date;
};

type DbWalletRow = {
  id: string;
  chain: string;
  address: string;
  privy_wallet_id: string | null;
  smart_wallet_address: string | null;
  money_address_mode: string | null;
};

export class AuthSyncError extends Error {
  constructor(
    message: string,
    readonly code:
      | "PRIVY_UNAVAILABLE"
      | "SYNC_FAILED"
      | "SMART_WALLET_NOT_READY" = "SYNC_FAILED",
  ) {
    super(message);
    this.name = "AuthSyncError";
  }
}

function toWalletSummary(row: DbWalletRow): WalletSummary {
  return {
    id: row.id,
    chain: row.chain,
    address: toPublicMoneyAddress({
      moneyAddressMode: row.money_address_mode,
      eoaAddress: row.address,
      smartWalletAddress: row.smart_wallet_address,
    }),
    privyWalletId: row.privy_wallet_id,
    moneyAddressMode:
      row.money_address_mode === "smart_wallet" ? "smart_wallet" : "eoa",
  };
}

export async function syncAuthenticatedUser(
  privyUserId: string,
  deps: SyncAuthenticatedUserDeps = {},
): Promise<SyncResult> {
  const pool = deps.getPool ? deps.getPool() : getPool();

  if (!pool) {
    throw new AuthSyncError("Database is not configured.");
  }

  const loadPrivyUser = deps.fetchPrivyUser ?? fetchPrivyUser;
  const loadPrivyWalletId = deps.resolvePrivyWalletId ?? resolvePrivyWalletId;
  const loadHomeBalance = deps.getHomeBalanceForWallet ?? getHomeBalanceForWallet;

  let privyUser;

  try {
    privyUser = await loadPrivyUser(privyUserId);
  } catch {
    throw new AuthSyncError("Unable to fetch user from Privy.", "PRIVY_UNAVAILABLE");
  }

  const embeddedWallet = extractEmbeddedEthereumWallet(privyUser);

  if (!embeddedWallet || !embeddedWallet.address) {
    throw new AuthSyncError("Embedded Ethereum wallet not found for user.", "PRIVY_UNAVAILABLE");
  }

  const email = extractEmail(privyUser);
  const phone = extractPhone(privyUser);
  const walletAddress = embeddedWallet.address;
  const smartWallet = extractSmartWalletIdentity(privyUser, walletAddress);
  let privyWalletId = embeddedWallet.id;

  if (!privyWalletId) {
    try {
      privyWalletId = await loadPrivyWalletId({
        privyUserId,
        address: walletAddress,
      });
    } catch {
      privyWalletId = null;
    }
  }

  const client = (await pool.connect()) as AuthSyncClient;

  let isNewUser = false;
  let userRow: DbUserRow;
  let walletRow: DbWalletRow;

  try {
    await client.query("BEGIN");

    const existingUser = await client.query<{ id: string }>(
      "SELECT id FROM users WHERE privy_user_id = $1",
      [privyUserId],
    );
    isNewUser = existingUser.rows.length === 0;

    const userResult = await client.query<DbUserRow>(
      `
        INSERT INTO users (privy_user_id, email, phone)
        VALUES ($1, $2, $3)
        ON CONFLICT (privy_user_id) DO UPDATE SET
          email = COALESCE(EXCLUDED.email, users.email),
          phone = COALESCE(EXCLUDED.phone, users.phone)
        RETURNING id, email, phone, display_name, username, created_at
      `,
      [privyUserId, email, phone],
    );

    userRow = userResult.rows[0];

    const existingWallet = await client.query<{
      id: string;
      money_address_mode: string | null;
    }>(
      "SELECT id, money_address_mode FROM wallets WHERE user_id = $1",
      [userRow.id],
    );
    const hasWalletRow = existingWallet.rows.length > 0;

    if (!hasWalletRow && !smartWallet) {
      throw new AuthSyncError(
        "Smart Wallet is still being created. Please try again.",
        "SMART_WALLET_NOT_READY",
      );
    }

    const walletResult = await client.query<DbWalletRow>(
      `
        INSERT INTO wallets (
          user_id,
          address,
          chain,
          privy_wallet_id,
          smart_wallet_address,
          smart_wallet_type,
          money_address_mode
        )
        VALUES ($1, $2, 'base', $3, $4, $5, $6)
        ON CONFLICT (user_id) DO UPDATE SET
          address = EXCLUDED.address,
          privy_wallet_id = COALESCE(EXCLUDED.privy_wallet_id, wallets.privy_wallet_id),
          smart_wallet_address = COALESCE(
            EXCLUDED.smart_wallet_address,
            wallets.smart_wallet_address
          ),
          smart_wallet_type = COALESCE(EXCLUDED.smart_wallet_type, wallets.smart_wallet_type)
        RETURNING
          id,
          chain,
          address,
          privy_wallet_id,
          smart_wallet_address,
          money_address_mode
      `,
      [
        userRow.id,
        walletAddress,
        privyWalletId,
        smartWallet?.address ?? null,
        smartWallet?.type ?? null,
        hasWalletRow
          ? (existingWallet.rows[0]?.money_address_mode ?? "eoa")
          : "smart_wallet",
      ],
    );

    await client.query(
      `
        INSERT INTO user_balances (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
      `,
      [userRow.id],
    );

    await client.query("COMMIT");

    walletRow = walletResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");

    if (error instanceof AuthSyncError) {
      throw error;
    }

    throw new AuthSyncError("Failed to sync user account.");
  } finally {
    client.release();
  }

  if (!walletRow) {
    throw new AuthSyncError("Failed to load wallet after sync.");
  }

  if (!walletRow.privy_wallet_id) {
    throw new AuthSyncError(
      "Privy wallet id missing after sync.",
      "PRIVY_UNAVAILABLE",
    );
  }

  let balance: BalanceSummary;

  try {
    balance = await loadHomeBalance({
      moneyAddressMode: walletRow.money_address_mode,
      privyWalletId: walletRow.privy_wallet_id,
      smartWalletAddress: walletRow.smart_wallet_address,
    });
  } catch {
    throw new AuthSyncError(
      "Unable to fetch wallet balance from Privy.",
      "PRIVY_UNAVAILABLE",
    );
  }

  return {
    user: toUserProfile(userRow),
    wallet: toWalletSummary(walletRow),
    balance,
    isNewUser,
  };
}

type ProfileQueryRow = DbUserRow & {
  wallet_id: string | null;
  chain: string | null;
  address: string | null;
  privy_wallet_id: string | null;
  smart_wallet_address: string | null;
  money_address_mode: string | null;
};

export async function getAuthenticatedUserProfile(
  privyUserId: string,
): Promise<{ user: UserProfile; wallet: WalletSummary; balance: BalanceSummary } | null> {
  const pool = getPool();

  if (!pool) {
    throw new Error("Database is not configured.");
  }

  const result = await pool.query<ProfileQueryRow>(
    `
      SELECT
        u.id,
        u.email,
        u.phone,
        u.display_name,
        u.username,
        u.created_at,
        w.id AS wallet_id,
        w.chain,
        w.address,
        w.privy_wallet_id,
        w.smart_wallet_address,
        w.money_address_mode
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      WHERE u.privy_user_id = $1
    `,
    [privyUserId],
  );

  const row = result.rows[0];

  if (!row || !row.wallet_id || !row.address || !row.chain) {
    return null;
  }

  if (!row.privy_wallet_id) {
    return null;
  }

  let balance: BalanceSummary;

  try {
    balance = await getHomeBalanceForWallet({
      moneyAddressMode: row.money_address_mode,
      privyWalletId: row.privy_wallet_id,
      smartWalletAddress: row.smart_wallet_address,
    });
  } catch {
    throw new AuthSyncError(
      "Unable to fetch wallet balance from Privy.",
      "PRIVY_UNAVAILABLE",
    );
  }

  return {
    user: toUserProfile(row),
    wallet: {
      id: row.wallet_id,
      chain: row.chain,
      address: toPublicMoneyAddress({
        moneyAddressMode: row.money_address_mode,
        eoaAddress: row.address,
        smartWalletAddress: row.smart_wallet_address,
      }),
      privyWalletId: row.privy_wallet_id,
      moneyAddressMode:
        row.money_address_mode === "smart_wallet" ? "smart_wallet" : "eoa",
    },
    balance,
  };
}
