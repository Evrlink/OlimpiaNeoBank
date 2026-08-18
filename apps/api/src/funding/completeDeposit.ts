import { getPool } from "../db/pool.js";
import { creditAvailableForCompletedDeposit } from "../ledger/index.js";
import { sendDepositCompletedEmail } from "./email.js";
import { toDepositRecord } from "./mappers.js";
import {
  DEPOSIT_ROW_COLUMNS,
  type DbDepositRow,
  type DepositRecord,
  type DepositStatus,
} from "./types.js";

export class DepositTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DepositTransitionError";
  }
}

async function loadDepositForUpdate(
  client: import("pg").PoolClient,
  depositId: string,
): Promise<DbDepositRow | null> {
  const result = await client.query<DbDepositRow>(
    `
      SELECT ${DEPOSIT_ROW_COLUMNS}
      FROM deposits
      WHERE id = $1
      FOR UPDATE
    `,
    [depositId],
  );

  return result.rows[0] ?? null;
}

/**
 * Apply a normalized deposit status transition.
 * Credits ledger + writes activity only when moving to completed.
 * Email is sent after the DB transaction commits.
 */
export async function finalizeDepositStatus(input: {
  depositId: string;
  nextStatus: DepositStatus;
  failureReason?: string | null;
  providerTransactionId?: string | null;
}): Promise<DepositRecord | null> {
  const pool = getPool();

  if (!pool) {
    throw new DepositTransitionError("Database is not configured.");
  }

  const client = await pool.connect();
  let emailPayload: { toEmail: string | null; amountUsd: string } | null = null;

  try {
    await client.query("BEGIN");

    const row = await loadDepositForUpdate(client, input.depositId);

    if (!row) {
      await client.query("ROLLBACK");
      return null;
    }

    if (row.status === "completed" || row.status === "failed") {
      await client.query("COMMIT");
      return toDepositRecord(row);
    }

    if (input.nextStatus === "pending" || input.nextStatus === row.status) {
      if (input.providerTransactionId && !row.provider_transaction_id) {
        const updated = await client.query<DbDepositRow>(
          `
            UPDATE deposits
            SET provider_transaction_id = COALESCE(provider_transaction_id, $2),
                updated_at = now()
            WHERE id = $1
            RETURNING ${DEPOSIT_ROW_COLUMNS}
          `,
          [input.depositId, input.providerTransactionId],
        );
        await client.query("COMMIT");
        return toDepositRecord(updated.rows[0] ?? row);
      }

      await client.query("COMMIT");
      return toDepositRecord(row);
    }

    if (input.nextStatus === "processing") {
      const updated = await client.query<DbDepositRow>(
        `
          UPDATE deposits
          SET status = 'processing',
              provider_transaction_id = COALESCE($2, provider_transaction_id),
              updated_at = now()
          WHERE id = $1
          RETURNING ${DEPOSIT_ROW_COLUMNS}
        `,
        [input.depositId, input.providerTransactionId ?? null],
      );
      await client.query("COMMIT");
      return toDepositRecord(updated.rows[0] ?? row);
    }

    if (input.nextStatus === "failed") {
      const updated = await client.query<DbDepositRow>(
        `
          UPDATE deposits
          SET status = 'failed',
              failure_reason = $2,
              provider_transaction_id = COALESCE($3, provider_transaction_id),
              updated_at = now()
          WHERE id = $1
          RETURNING ${DEPOSIT_ROW_COLUMNS}
        `,
        [
          input.depositId,
          input.failureReason ?? "We couldn’t complete this deposit.",
          input.providerTransactionId ?? null,
        ],
      );
      await client.query("COMMIT");
      return toDepositRecord(updated.rows[0] ?? row);
    }

    await creditAvailableForCompletedDeposit(client, {
      userId: row.user_id,
      amountUsd: String(row.amount_usd),
      depositId: row.id,
      providerRef: input.providerTransactionId ?? row.provider_transaction_id,
    });

    const updated = await client.query<DbDepositRow>(
      `
        UPDATE deposits
        SET status = 'completed',
            provider_transaction_id = COALESCE($2, provider_transaction_id),
            failure_reason = NULL,
            updated_at = now()
        WHERE id = $1
        RETURNING ${DEPOSIT_ROW_COLUMNS}
      `,
      [input.depositId, input.providerTransactionId ?? null],
    );

    const userResult = await client.query<{ email: string | null }>(
      "SELECT email FROM users WHERE id = $1",
      [row.user_id],
    );

    const record = toDepositRecord(updated.rows[0] ?? row);
    emailPayload = {
      toEmail: userResult.rows[0]?.email ?? null,
      amountUsd: record.amountUsd,
    };

    await client.query("COMMIT");

    if (emailPayload) {
      await sendDepositCompletedEmail(emailPayload);
    }

    return record;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
