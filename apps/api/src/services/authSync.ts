import {
  extractEmail,
  extractEmbeddedEthereumWallet,
  extractPhone,
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
import { getHomeBalanceForPrivyWallet } from "./privyBalance.js";

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

function toWalletSummary(row: DbWalletRow): WalletSummary {
  return {
    id: row.id,
    chain: row.chain,
    address: row.address,
    privyWalletId: row.privy_wallet_id,
  };
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
  let privyWalletId = embeddedWallet.id;

  if (!privyWalletId) {
    try {
      privyWalletId = await resolvePrivyWalletId({
        privyUserId,
        address: walletAddress,
      });
    } catch {
      privyWalletId = null;
    }
  }

  const client = await pool.connect();

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

    const walletResult = await client.query<DbWalletRow>(
      `
        INSERT INTO wallets (user_id, address, chain, privy_wallet_id)
        VALUES ($1, $2, 'base', $3)
        ON CONFLICT (user_id) DO UPDATE SET
          address = EXCLUDED.address,
          privy_wallet_id = COALESCE(EXCLUDED.privy_wallet_id, wallets.privy_wallet_id)
        RETURNING id, chain, address, privy_wallet_id
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
    balance = await getHomeBalanceForPrivyWallet(walletRow.privy_wallet_id);
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
        w.privy_wallet_id
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
    balance = await getHomeBalanceForPrivyWallet(row.privy_wallet_id);
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
      address: row.address,
      privyWalletId: row.privy_wallet_id,
    },
    balance,
  };
}
