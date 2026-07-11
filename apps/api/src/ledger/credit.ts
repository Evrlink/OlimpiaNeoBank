import type pg from "pg";

type Queryable = pg.Pool | pg.PoolClient;

function formatUsd(value: number): string {
  return value.toFixed(2);
}

function parseUsd(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Credits available balance and records a completed deposit transaction.
 * Caller must run inside a transaction and hold a lock on the deposit row.
 */
export async function creditAvailableForCompletedDeposit(
  client: pg.PoolClient,
  input: {
    userId: string;
    amountUsd: string;
    depositId: string;
    providerRef: string | null;
  },
): Promise<void> {
  const amount = parseUsd(input.amountUsd);

  await client.query(
    `
      INSERT INTO user_balances (user_id, available_usd, goals_allocated_usd, growth_allocated_usd)
      VALUES ($1, $2, 0, 0)
      ON CONFLICT (user_id) DO UPDATE SET
        available_usd = user_balances.available_usd + EXCLUDED.available_usd,
        updated_at = now()
    `,
    [input.userId, formatUsd(amount)],
  );

  await client.query(
    `
      INSERT INTO transactions (
        user_id,
        type,
        amount_usd,
        status,
        provider_ref,
        metadata
      )
      VALUES ($1, 'deposit', $2, 'completed', $3, $4::jsonb)
    `,
    [
      input.userId,
      formatUsd(amount),
      input.providerRef,
      JSON.stringify({ depositId: input.depositId }),
    ],
  );
}

export async function ensureUserBalanceRow(
  db: Queryable,
  userId: string,
): Promise<void> {
  await db.query(
    `
      INSERT INTO user_balances (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
    `,
    [userId],
  );
}
