import { getPool } from "../db/pool.js";

export type GrowthAuthorizationAccount = {
  userExists: boolean;
  userId: string | null;
  privyWalletId: string | null;
  walletAddress: string | null;
  chain: string | null;
  smartWalletAddress: string | null;
  moneyAddressMode: string | null;
};

export async function lookupAuthorizationAccount(
  privyUserId: string,
): Promise<GrowthAuthorizationAccount> {
  const pool = getPool();
  if (!pool) {
    throw new Error("Database is not configured.");
  }

  const result = await pool.query<{
    user_id: string;
    privy_wallet_id: string | null;
    address: string | null;
    chain: string | null;
    smart_wallet_address: string | null;
    money_address_mode: string | null;
  }>(
    `
      SELECT
        u.id AS user_id,
        w.privy_wallet_id,
        w.address,
        w.chain,
        w.smart_wallet_address,
        w.money_address_mode
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      WHERE u.privy_user_id = $1
    `,
    [privyUserId],
  );
  const row = result.rows[0];

  if (!row) {
    return {
      userExists: false,
      userId: null,
      privyWalletId: null,
      walletAddress: null,
      chain: null,
      smartWalletAddress: null,
      moneyAddressMode: null,
    };
  }

  return {
    userExists: true,
    userId: row.user_id,
    privyWalletId: row.privy_wallet_id,
    walletAddress: row.address,
    chain: row.chain,
    smartWalletAddress: row.smart_wallet_address,
    moneyAddressMode: row.money_address_mode,
  };
}
