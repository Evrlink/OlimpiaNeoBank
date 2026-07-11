/**
 * Local E2E smoke for Add Money (mock funding provider).
 * Usage: npx tsx src/scripts/smoke-add-money.ts
 */
import { randomUUID } from "node:crypto";
import pg from "pg";
import { env } from "../config/env.js";
import { createDepositForUser, getDepositForUser } from "../funding/deposits.js";
import { getBalanceSummaryForUser } from "../ledger/index.js";

const { Pool } = pg;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const pool = new Pool({ connectionString: env.databaseUrl });
  const privyUserId = `smoke_privy_${randomUUID()}`;
  const walletAddress = `0x${randomUUID().replace(/-/g, "").slice(0, 40)}`;

  try {
    const user = await pool.query<{ id: string }>(
      `
        INSERT INTO users (privy_user_id, email, display_name)
        VALUES ($1, $2, 'Smoke User')
        RETURNING id
      `,
      [privyUserId, "smoke@example.com"],
    );
    const userId = user.rows[0].id;

    await pool.query(
      `
        INSERT INTO wallets (user_id, address, chain)
        VALUES ($1, $2, 'base')
      `,
      [userId, walletAddress],
    );

    await pool.query(
      `
        INSERT INTO user_balances (user_id, available_usd)
        VALUES ($1, 0)
      `,
      [userId],
    );

    const before = await getBalanceSummaryForUser(userId, pool);
    console.log("balance before", before);

    const created = await createDepositForUser({
      privyUserId,
      body: { amountUsd: "25.00", paymentMethod: "bank" },
      idempotencyKey: `smoke-${randomUUID()}`,
      allowForceFail: true,
    });
    console.log("deposit created", created);

    let latest = created;
    for (let i = 0; i < 20; i += 1) {
      await sleep(250);
      latest = await getDepositForUser({
        privyUserId,
        depositId: created.id,
      });
      console.log("poll", latest.status);
      if (latest.status === "completed" || latest.status === "failed") {
        break;
      }
    }

    if (latest.status !== "completed") {
      throw new Error(`Expected completed deposit, got ${latest.status}`);
    }

    const after = await getBalanceSummaryForUser(userId, pool);
    console.log("balance after", after);

    if (after?.availableUsd !== "25.00") {
      throw new Error(`Expected available 25.00, got ${after?.availableUsd}`);
    }

    const activity = await pool.query<{ type: string; amount_usd: string; status: string }>(
      `
        SELECT type, amount_usd::text, status
        FROM transactions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [userId],
    );

    console.log("activity", activity.rows[0]);

    if (
      activity.rows[0]?.type !== "deposit" ||
      activity.rows[0]?.status !== "completed"
    ) {
      throw new Error("Expected completed deposit activity row");
    }

    const failed = await createDepositForUser({
      privyUserId,
      body: { amountUsd: "10.00", forceFail: true },
      idempotencyKey: `smoke-fail-${randomUUID()}`,
      allowForceFail: true,
    });

    let failedLatest = failed;
    for (let i = 0; i < 20; i += 1) {
      await sleep(250);
      failedLatest = await getDepositForUser({
        privyUserId,
        depositId: failed.id,
      });
      if (failedLatest.status === "completed" || failedLatest.status === "failed") {
        break;
      }
    }

    if (failedLatest.status !== "failed") {
      throw new Error(`Expected failed deposit, got ${failedLatest.status}`);
    }

    const afterFail = await getBalanceSummaryForUser(userId, pool);
    if (afterFail?.availableUsd !== "25.00") {
      throw new Error("Failed deposit incorrectly changed balance");
    }

    console.log("Add Money smoke passed.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
