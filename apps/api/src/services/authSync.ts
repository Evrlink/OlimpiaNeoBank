import {
  extractEmail,
  extractEmbeddedEthereumWallet,
  extractPhone,
  fetchPrivyUser,
} from "../auth/privy.js";
import { getPool } from "../db/pool.js";
import {
  toBalanceSummary,
  toUserProfile,
  type BalanceSummary,
  type UserProfile,
  type WalletSummary,
} from "../lib/responses.js";

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
};

type DbBalanceRow = {
  available_usd: string;
  goals_allocated_usd: string;
  growth_allocated_usd: string;
};

export class AuthSyncError extends Error {
  constructor(
    message: string,
    readonly code: "PRIVY_UNAVAILABLE" | "SYNC_FAILED" = "SYNC_FAILED",
  ) {
    super(message);
    this.name = "AuthSyncError";
  }
}

export async function syncAuthenticatedUser(privyUserId: string): Promise<SyncResult> {
  const pool = getPool();

  if (!pool) {
    throw new AuthSyncError("Database is not configured.");
  }

  let privyUser;

  try {
    privyUser = await fetchPrivyUser(privyUserId);
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
  const privyWalletId = embeddedWallet.id ?? null;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingUser = await client.query<{ id: string }>(
      "SELECT id FROM users WHERE privy_user_id = $1",
      [privyUserId],
    );
    const isNewUser = existingUser.rows.length === 0;

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

    const userRow = userResult.rows[0];

    const walletResult = await client.query<DbWalletRow>(
      `
        INSERT INTO wallets (user_id, address, chain, privy_wallet_id)
        VALUES ($1, $2, 'base', $3)
        ON CONFLICT (user_id) DO UPDATE SET
          address = EXCLUDED.address,
          privy_wallet_id = COALESCE(EXCLUDED.privy_wallet_id, wallets.privy_wallet_id)
        RETURNING id, chain
      `,
      [userRow.id, walletAddress, privyWalletId],
    );

    await client.query(
      `
        INSERT INTO user_balances (user_id)
        VALUES ($1)
        ON CONFLICT (user_id) DO NOTHING
      `,
      [userRow.id],
    );

    const balanceResult = await client.query<DbBalanceRow>(
      `
        SELECT available_usd, goals_allocated_usd, growth_allocated_usd
        FROM user_balances
        WHERE user_id = $1
      `,
      [userRow.id],
    );

    await client.query("COMMIT");

    const walletRow = walletResult.rows[0];
    const balanceRow = balanceResult.rows[0];

    if (!walletRow || !balanceRow) {
      throw new AuthSyncError("Failed to load wallet or balance after sync.");
    }

    return {
      user: toUserProfile(userRow),
      wallet: {
        id: walletRow.id,
        chain: walletRow.chain,
      },
      balance: toBalanceSummary(balanceRow),
      isNewUser,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    if (error instanceof AuthSyncError) {
      throw error;
    }

    throw new AuthSyncError("Failed to sync user account.");
  } finally {
    client.release();
  }
}

export async function getAuthenticatedUserProfile(
  privyUserId: string,
): Promise<{ user: UserProfile; balance: BalanceSummary } | null> {
  const pool = getPool();

  if (!pool) {
    throw new Error("Database is not configured.");
  }

  const result = await pool.query<
    DbUserRow & DbBalanceRow
  >(
    `
      SELECT
        u.id,
        u.email,
        u.phone,
        u.display_name,
        u.username,
        u.created_at,
        b.available_usd,
        b.goals_allocated_usd,
        b.growth_allocated_usd
      FROM users u
      LEFT JOIN user_balances b ON b.user_id = u.id
      WHERE u.privy_user_id = $1
    `,
    [privyUserId],
  );

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  if (
    row.available_usd === undefined ||
    row.goals_allocated_usd === undefined ||
    row.growth_allocated_usd === undefined
  ) {
    return null;
  }

  return {
    user: toUserProfile(row),
    balance: toBalanceSummary(row),
  };
}
