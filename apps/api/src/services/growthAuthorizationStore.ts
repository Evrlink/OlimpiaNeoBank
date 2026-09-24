import { getPool } from "../db/pool.js";

export type StoredGrowthDepositAuthorization = {
  id: string;
  userId: string;
  privyUserId: string;
  privyWalletId: string;
  walletAddress: string;
  vaultId: string;
  amountUsdc: string;
  rawAmount: string;
  idempotencyKey: string;
  requestExpiry: Date;
  requestUrl: string;
  requestBody: {
    vault_id: string;
    amount: string;
  };
  payloadHex: string;
  status: "unused" | "authorized";
  signature: string | null;
  authorizedAt: Date | null;
  createdAt: Date;
};

export type GrowthAuthorizationStore = {
  create(row: StoredGrowthDepositAuthorization): Promise<void>;
  getByIdForUser(
    id: string,
    privyUserId: string,
  ): Promise<StoredGrowthDepositAuthorization | null>;
  markAuthorized(input: {
    id: string;
    privyUserId: string;
    signature: string;
    authorizedAt: Date;
  }): Promise<StoredGrowthDepositAuthorization | null>;
};

type AuthorizationRow = {
  id: string;
  user_id: string;
  privy_user_id: string;
  privy_wallet_id: string;
  wallet_address: string;
  vault_id: string;
  amount_usdc: string;
  raw_amount: string;
  idempotency_key: string;
  request_expiry: Date;
  request_url: string;
  request_body: {
    vault_id: string;
    amount: string;
  };
  payload_hex: string;
  status: "unused" | "authorized";
  signature: string | null;
  authorized_at: Date | null;
  created_at: Date;
};

function mapRow(row: AuthorizationRow): StoredGrowthDepositAuthorization {
  return {
    id: row.id,
    userId: row.user_id,
    privyUserId: row.privy_user_id,
    privyWalletId: row.privy_wallet_id,
    walletAddress: row.wallet_address,
    vaultId: row.vault_id,
    amountUsdc: row.amount_usdc,
    rawAmount: row.raw_amount,
    idempotencyKey: row.idempotency_key,
    requestExpiry: row.request_expiry,
    requestUrl: row.request_url,
    requestBody: row.request_body,
    payloadHex: row.payload_hex,
    status: row.status,
    signature: row.signature,
    authorizedAt: row.authorized_at,
    createdAt: row.created_at,
  };
}

const SELECT_COLUMNS = `
  id,
  user_id,
  privy_user_id,
  privy_wallet_id,
  wallet_address,
  vault_id,
  amount_usdc::text,
  raw_amount,
  idempotency_key,
  request_expiry,
  request_url,
  request_body,
  payload_hex,
  status,
  signature,
  authorized_at,
  created_at
`;

export function createPostgresGrowthAuthorizationStore(): GrowthAuthorizationStore {
  return {
    async create(row) {
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      await pool.query(
        `
          INSERT INTO growth_deposit_authorizations (
            id,
            user_id,
            privy_user_id,
            privy_wallet_id,
            wallet_address,
            vault_id,
            amount_usdc,
            raw_amount,
            idempotency_key,
            request_expiry,
            request_url,
            request_body,
            payload_hex,
            status,
            created_at,
            updated_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, 'unused', $14, $14
          )
        `,
        [
          row.id,
          row.userId,
          row.privyUserId,
          row.privyWalletId,
          row.walletAddress,
          row.vaultId,
          row.amountUsdc,
          row.rawAmount,
          row.idempotencyKey,
          row.requestExpiry,
          row.requestUrl,
          JSON.stringify(row.requestBody),
          row.payloadHex,
          row.createdAt,
        ],
      );
    },

    async getByIdForUser(id, privyUserId) {
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const result = await pool.query<AuthorizationRow>(
        `
          SELECT ${SELECT_COLUMNS}
          FROM growth_deposit_authorizations
          WHERE id = $1 AND privy_user_id = $2
        `,
        [id, privyUserId],
      );

      return result.rows[0] ? mapRow(result.rows[0]) : null;
    },

    async markAuthorized(input) {
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const result = await pool.query<AuthorizationRow>(
        `
          UPDATE growth_deposit_authorizations
          SET
            status = 'authorized',
            signature = $3,
            authorized_at = $4,
            updated_at = $4
          WHERE id = $1
            AND privy_user_id = $2
            AND status = 'unused'
            AND request_expiry > $4
          RETURNING ${SELECT_COLUMNS}
        `,
        [input.id, input.privyUserId, input.signature, input.authorizedAt],
      );

      return result.rows[0] ? mapRow(result.rows[0]) : null;
    },
  };
}

export function createMemoryGrowthAuthorizationStore(): GrowthAuthorizationStore {
  const rows = new Map<string, StoredGrowthDepositAuthorization>();

  return {
    async create(row) {
      rows.set(row.id, { ...row, requestBody: { ...row.requestBody } });
    },

    async getByIdForUser(id, privyUserId) {
      const row = rows.get(id);
      if (!row || row.privyUserId !== privyUserId) {
        return null;
      }

      return { ...row, requestBody: { ...row.requestBody } };
    },

    async markAuthorized(input) {
      const row = rows.get(input.id);
      if (
        !row ||
        row.privyUserId !== input.privyUserId ||
        row.status !== "unused" ||
        row.requestExpiry.getTime() <= input.authorizedAt.getTime()
      ) {
        return null;
      }

      const updated: StoredGrowthDepositAuthorization = {
        ...row,
        requestBody: { ...row.requestBody },
        status: "authorized",
        signature: input.signature,
        authorizedAt: input.authorizedAt,
      };
      rows.set(input.id, updated);
      return { ...updated, requestBody: { ...updated.requestBody } };
    },
  };
}
