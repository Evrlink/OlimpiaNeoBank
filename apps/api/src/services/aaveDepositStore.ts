import { getPool } from "../db/pool.js";
import {
  AaveDepositPlanError,
  type AaveDepositCall,
} from "./aaveDepositPlan.js";

export type SmartWalletDepositStatus =
  | "prepared"
  | "submitted"
  | "confirmed"
  | "failed";

export type StoredSmartWalletDeposit = {
  id: string;
  userId: string;
  privyUserId: string;
  smartWalletAddress: string;
  amountUsdc: string;
  rawAmount: string;
  calls: [AaveDepositCall, AaveDepositCall];
  status: SmartWalletDepositStatus;
  transactionHash: string | null;
  failureReason: string | null;
  expiresAt: Date;
  submittedAt: Date | null;
  confirmedAt: Date | null;
  createdAt: Date;
};

export type SmartWalletDepositStore = {
  replacePrepared(row: StoredSmartWalletDeposit): Promise<StoredSmartWalletDeposit>;
  getByIdForUser(
    id: string,
    privyUserId: string,
  ): Promise<StoredSmartWalletDeposit | null>;
  markSubmitted(input: {
    id: string;
    privyUserId: string;
    submittedAt: Date;
  }): Promise<StoredSmartWalletDeposit | null>;
  attachTransactionHash(input: {
    id: string;
    privyUserId: string;
    transactionHash: string;
    attachedAt: Date;
  }): Promise<StoredSmartWalletDeposit | null>;
  noteVerification(input: {
    id: string;
    privyUserId: string;
    failureReason: string;
    notedAt: Date;
  }): Promise<StoredSmartWalletDeposit | null>;
  markConfirmed(input: {
    id: string;
    privyUserId: string;
    transactionHash: string;
    confirmedAt: Date;
  }): Promise<StoredSmartWalletDeposit | null>;
  markFailed(input: {
    id: string;
    privyUserId: string;
    failureReason: string;
    failedAt: Date;
  }): Promise<StoredSmartWalletDeposit | null>;
};

type DepositRow = {
  id: string;
  user_id: string;
  privy_user_id: string;
  smart_wallet_address: string;
  amount_usdc: string;
  raw_amount: string;
  calls: [AaveDepositCall, AaveDepositCall];
  status: SmartWalletDepositStatus;
  transaction_hash: string | null;
  failure_reason: string | null;
  expires_at: Date;
  submitted_at: Date | null;
  confirmed_at: Date | null;
  created_at: Date;
};

const SELECT_COLUMNS = `
  id,
  user_id,
  privy_user_id,
  smart_wallet_address,
  amount_usdc::text,
  raw_amount,
  calls,
  status,
  transaction_hash,
  failure_reason,
  expires_at,
  submitted_at,
  confirmed_at,
  created_at
`;

function mapRow(row: DepositRow): StoredSmartWalletDeposit {
  return {
    id: row.id,
    userId: row.user_id,
    privyUserId: row.privy_user_id,
    smartWalletAddress: row.smart_wallet_address,
    amountUsdc: row.amount_usdc,
    rawAmount: row.raw_amount,
    calls: row.calls,
    status: row.status,
    transactionHash: row.transaction_hash,
    failureReason: row.failure_reason,
    expiresAt: row.expires_at,
    submittedAt: row.submitted_at,
    confirmedAt: row.confirmed_at,
    createdAt: row.created_at,
  };
}

function cloneDeposit(row: StoredSmartWalletDeposit): StoredSmartWalletDeposit {
  return {
    ...row,
    calls: [row.calls[0], row.calls[1]],
  };
}

export function createPostgresSmartWalletDepositStore(): SmartWalletDepositStore {
  return {
    async replacePrepared(row) {
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const open = await client.query<{ status: SmartWalletDepositStatus }>(
          `
            SELECT status
            FROM smart_wallet_deposits
            WHERE user_id = $1 AND status IN ('prepared', 'submitted')
            FOR UPDATE
          `,
          [row.userId],
        );

        if (open.rows.some((item) => item.status === "submitted")) {
          await client.query("ROLLBACK");
          throw new AaveDepositPlanError(
            409,
            "VALIDATION_ERROR",
            "A deposit is already in progress.",
          );
        }

        await client.query(
          `
            UPDATE smart_wallet_deposits
            SET
              status = 'failed',
              failure_reason = 'superseded',
              updated_at = $2
            WHERE user_id = $1 AND status = 'prepared'
          `,
          [row.userId, row.createdAt],
        );

        const inserted = await client.query<DepositRow>(
          `
            INSERT INTO smart_wallet_deposits (
              id,
              user_id,
              privy_user_id,
              smart_wallet_address,
              amount_usdc,
              raw_amount,
              calls,
              status,
              expires_at,
              created_at,
              updated_at
            )
            VALUES (
              $1, $2, $3, $4, $5, $6, $7::jsonb, 'prepared', $8, $9, $9
            )
            RETURNING ${SELECT_COLUMNS}
          `,
          [
            row.id,
            row.userId,
            row.privyUserId,
            row.smartWalletAddress,
            row.amountUsdc,
            row.rawAmount,
            JSON.stringify(row.calls),
            row.expiresAt,
            row.createdAt,
          ],
        );
        await client.query("COMMIT");
        return mapRow(inserted.rows[0]!);
      } catch (error) {
        try {
          await client.query("ROLLBACK");
        } catch {
          // The transaction may already be closed.
        }
        throw error;
      } finally {
        client.release();
      }
    },

    async getByIdForUser(id, privyUserId) {
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const result = await pool.query<DepositRow>(
        `
          SELECT ${SELECT_COLUMNS}
          FROM smart_wallet_deposits
          WHERE id = $1 AND privy_user_id = $2
        `,
        [id, privyUserId],
      );

      return result.rows[0] ? mapRow(result.rows[0]) : null;
    },

    async markSubmitted(input) {
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const result = await pool.query<DepositRow>(
        `
          UPDATE smart_wallet_deposits
          SET
            status = 'submitted',
            submitted_at = $3,
            updated_at = $3
          WHERE id = $1
            AND privy_user_id = $2
            AND status = 'prepared'
            AND expires_at > $3
          RETURNING ${SELECT_COLUMNS}
        `,
        [input.id, input.privyUserId, input.submittedAt],
      );

      return result.rows[0] ? mapRow(result.rows[0]) : null;
    },

    async attachTransactionHash(input) {
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const attached = await pool.query<DepositRow>(
        `
          UPDATE smart_wallet_deposits
          SET
            transaction_hash = $3,
            updated_at = $4
          WHERE id = $1
            AND privy_user_id = $2
            AND status = 'submitted'
            AND (transaction_hash IS NULL OR transaction_hash = $3)
          RETURNING ${SELECT_COLUMNS}
        `,
        [input.id, input.privyUserId, input.transactionHash, input.attachedAt],
      );

      return attached.rows[0] ? mapRow(attached.rows[0]) : null;
    },

    async noteVerification(input) {
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const noted = await pool.query<DepositRow>(
        `
          UPDATE smart_wallet_deposits
          SET
            failure_reason = $3,
            updated_at = $4
          WHERE id = $1
            AND privy_user_id = $2
            AND status = 'submitted'
          RETURNING ${SELECT_COLUMNS}
        `,
        [input.id, input.privyUserId, input.failureReason, input.notedAt],
      );

      return noted.rows[0] ? mapRow(noted.rows[0]) : null;
    },

    async markConfirmed(input) {
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const result = await pool.query<DepositRow>(
        `
          UPDATE smart_wallet_deposits
          SET
            status = 'confirmed',
            transaction_hash = $3,
            confirmed_at = $4,
            updated_at = $4,
            failure_reason = NULL
          WHERE id = $1
            AND privy_user_id = $2
            AND status = 'submitted'
            AND (transaction_hash IS NULL OR transaction_hash = $3)
          RETURNING ${SELECT_COLUMNS}
        `,
        [input.id, input.privyUserId, input.transactionHash, input.confirmedAt],
      );

      return result.rows[0] ? mapRow(result.rows[0]) : null;
    },

    async markFailed(input) {
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const result = await pool.query<DepositRow>(
        `
          UPDATE smart_wallet_deposits
          SET
            status = 'failed',
            failure_reason = $3,
            updated_at = $4
          WHERE id = $1
            AND privy_user_id = $2
            AND status IN ('prepared', 'submitted')
            AND transaction_hash IS NULL
          RETURNING ${SELECT_COLUMNS}
        `,
        [input.id, input.privyUserId, input.failureReason, input.failedAt],
      );

      return result.rows[0] ? mapRow(result.rows[0]) : null;
    },
  };
}

export function createMemorySmartWalletDepositStore(): SmartWalletDepositStore {
  const rows = new Map<string, StoredSmartWalletDeposit>();

  return {
    async replacePrepared(row) {
      for (const existing of rows.values()) {
        if (existing.userId !== row.userId) {
          continue;
        }

        if (existing.status === "submitted") {
          throw new AaveDepositPlanError(
            409,
            "VALIDATION_ERROR",
            "A deposit is already in progress.",
          );
        }

        if (existing.status === "prepared") {
          rows.set(existing.id, {
            ...cloneDeposit(existing),
            status: "failed",
            failureReason: "superseded",
          });
        }
      }

      const stored = cloneDeposit({ ...row, status: "prepared" });
      rows.set(stored.id, stored);
      return cloneDeposit(stored);
    },

    async getByIdForUser(id, privyUserId) {
      const row = rows.get(id);
      if (!row || row.privyUserId !== privyUserId) {
        return null;
      }

      return cloneDeposit(row);
    },

    async markSubmitted(input) {
      const row = rows.get(input.id);
      if (
        !row ||
        row.privyUserId !== input.privyUserId ||
        row.status !== "prepared" ||
        row.expiresAt.getTime() <= input.submittedAt.getTime()
      ) {
        return null;
      }

      const updated = cloneDeposit({
        ...row,
        status: "submitted",
        submittedAt: input.submittedAt,
      });
      rows.set(updated.id, updated);
      return cloneDeposit(updated);
    },

    async attachTransactionHash(input) {
      const row = rows.get(input.id);
      if (!row || row.privyUserId !== input.privyUserId || row.status !== "submitted") {
        return null;
      }

      if (row.transactionHash && row.transactionHash !== input.transactionHash) {
        return null;
      }

      const updated = cloneDeposit({
        ...row,
        transactionHash: input.transactionHash,
      });
      rows.set(updated.id, updated);
      return cloneDeposit(updated);
    },

    async noteVerification(input) {
      const row = rows.get(input.id);
      if (!row || row.privyUserId !== input.privyUserId || row.status !== "submitted") {
        return null;
      }

      const updated = cloneDeposit({
        ...row,
        failureReason: input.failureReason,
      });
      rows.set(updated.id, updated);
      return cloneDeposit(updated);
    },

    async markConfirmed(input) {
      const row = rows.get(input.id);
      if (
        !row ||
        row.privyUserId !== input.privyUserId ||
        row.status !== "submitted" ||
        (row.transactionHash && row.transactionHash !== input.transactionHash)
      ) {
        return null;
      }

      const updated = cloneDeposit({
        ...row,
        status: "confirmed",
        transactionHash: input.transactionHash,
        confirmedAt: input.confirmedAt,
        failureReason: null,
      });
      rows.set(updated.id, updated);
      return cloneDeposit(updated);
    },

    async markFailed(input) {
      const row = rows.get(input.id);
      if (
        !row ||
        row.privyUserId !== input.privyUserId ||
        (row.status !== "prepared" && row.status !== "submitted") ||
        row.transactionHash
      ) {
        return null;
      }

      const updated = cloneDeposit({
        ...row,
        status: "failed",
        failureReason: input.failureReason,
      });
      rows.set(updated.id, updated);
      return cloneDeposit(updated);
    },
  };
}
