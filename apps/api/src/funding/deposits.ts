import { randomUUID } from "node:crypto";
import { getPool } from "../db/pool.js";
import { createOnRampIntent, FundingProviderError } from "./provider.js";
import { toDepositRecord, toDepositResponse } from "./mappers.js";
import { finalizeDepositStatus } from "./completeDeposit.js";
import { DEPOSIT_ROW_COLUMNS, type DbDepositRow, type DepositResponse } from "./types.js";
import { parseDepositAmountUsd, parsePaymentMethod } from "./validation.js";

export class FundingServiceError extends Error {
  constructor(
    message: string,
    readonly code:
      | "VALIDATION_ERROR"
      | "USER_NOT_FOUND"
      | "DEPOSIT_NOT_FOUND"
      | "PROVIDER_ERROR"
      | "INTERNAL_ERROR" = "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "FundingServiceError";
  }
}

type CreateDepositBody = {
  amountUsd?: unknown;
  paymentMethod?: unknown;
  forceFail?: unknown;
};

async function resolveUserContext(privyUserId: string): Promise<{
  userId: string;
  walletAddress: string;
}> {
  const pool = getPool();

  if (!pool) {
    throw new FundingServiceError("Unable to start this deposit.", "INTERNAL_ERROR");
  }

  const result = await pool.query<{ id: string; address: string }>(
    `
      SELECT u.id, w.address
      FROM users u
      INNER JOIN wallets w ON w.user_id = u.id
      WHERE u.privy_user_id = $1
    `,
    [privyUserId],
  );

  const row = result.rows[0];

  if (!row) {
    throw new FundingServiceError(
      "Account not found. Complete sign-in sync first.",
      "USER_NOT_FOUND",
    );
  }

  return { userId: row.id, walletAddress: row.address };
}

export async function createDepositForUser(input: {
  privyUserId: string;
  body: CreateDepositBody;
  idempotencyKey?: string | null;
  allowForceFail: boolean;
}): Promise<DepositResponse> {
  const parsedAmount = parseDepositAmountUsd(input.body.amountUsd);

  if (!parsedAmount.ok) {
    throw new FundingServiceError(parsedAmount.message, "VALIDATION_ERROR");
  }

  const paymentMethod = parsePaymentMethod(input.body.paymentMethod);
  const forceFail = input.allowForceFail && input.body.forceFail === true;
  const idempotencyKey = input.idempotencyKey?.trim() || null;

  const { userId, walletAddress } = await resolveUserContext(input.privyUserId);
  const pool = getPool();

  if (!pool) {
    throw new FundingServiceError("Unable to start this deposit.", "INTERNAL_ERROR");
  }

  if (idempotencyKey) {
    const existing = await pool.query<DbDepositRow>(
      `
        SELECT ${DEPOSIT_ROW_COLUMNS}
        FROM deposits
        WHERE user_id = $1 AND idempotency_key = $2
      `,
      [userId, idempotencyKey],
    );

    if (existing.rows[0]) {
      return toDepositResponse(toDepositRecord(existing.rows[0]));
    }
  }

  const depositId = randomUUID();

  try {
    await pool.query(
      `
        INSERT INTO deposits (
          id,
          user_id,
          amount_usd,
          status,
          payment_method,
          idempotency_key,
          metadata
        )
        VALUES ($1, $2, $3, 'pending', $4, $5, $6::jsonb)
      `,
      [
        depositId,
        userId,
        parsedAmount.amountUsd,
        paymentMethod,
        idempotencyKey,
        JSON.stringify({ forceFail }),
      ],
    );
  } catch (error) {
    if (
      idempotencyKey &&
      error instanceof Error &&
      /deposits_user_idempotency_key/i.test(error.message)
    ) {
      const existing = await pool.query<DbDepositRow>(
        `
          SELECT ${DEPOSIT_ROW_COLUMNS}
          FROM deposits
          WHERE user_id = $1 AND idempotency_key = $2
        `,
        [userId, idempotencyKey],
      );

      if (existing.rows[0]) {
        return toDepositResponse(toDepositRecord(existing.rows[0]));
      }
    }

    throw new FundingServiceError(
      "Unable to start this deposit. Please try again.",
      "INTERNAL_ERROR",
    );
  }

  let onRamp;

  try {
    onRamp = await createOnRampIntent({
      depositId,
      userId,
      amountUsd: parsedAmount.amountUsd,
      paymentMethod,
      walletAddress,
      idempotencyKey: idempotencyKey ?? depositId,
      forceFail,
    });
  } catch (error) {
    await finalizeDepositStatus({
      depositId,
      nextStatus: "failed",
      failureReason: "Unable to start this deposit. Please try again.",
    }).catch(() => undefined);

    if (error instanceof FundingProviderError) {
      throw new FundingServiceError(error.message, "PROVIDER_ERROR");
    }

    throw new FundingServiceError(
      "Unable to start this deposit. Please try again.",
      "PROVIDER_ERROR",
    );
  }

  const metadata = {
    forceFail,
    ...(onRamp.hostedUrl ? { hostedUrl: onRamp.hostedUrl } : {}),
  };

  const updated = await pool.query<DbDepositRow>(
    `
      UPDATE deposits
      SET status = $2,
          provider_transaction_id = $3,
          metadata = $4::jsonb,
          updated_at = now()
      WHERE id = $1
      RETURNING ${DEPOSIT_ROW_COLUMNS}
    `,
    [depositId, onRamp.initialStatus, onRamp.providerRef, JSON.stringify(metadata)],
  );

  const row = updated.rows[0];

  if (!row) {
    throw new FundingServiceError(
      "Unable to start this deposit. Please try again.",
      "INTERNAL_ERROR",
    );
  }

  return toDepositResponse(toDepositRecord(row), onRamp.hostedUrl);
}

export async function getDepositForUser(input: {
  privyUserId: string;
  depositId: string;
}): Promise<DepositResponse> {
  const pool = getPool();

  if (!pool) {
    throw new FundingServiceError("Unable to load this deposit.", "INTERNAL_ERROR");
  }

  const result = await pool.query<DbDepositRow>(
    `
      SELECT
        d.id, d.user_id, d.amount_usd, d.status, d.provider_transaction_id, d.payment_method,
        d.idempotency_key, d.failure_reason, d.metadata, d.created_at, d.updated_at
      FROM deposits d
      INNER JOIN users u ON u.id = d.user_id
      WHERE d.id = $1 AND u.privy_user_id = $2
    `,
    [input.depositId, input.privyUserId],
  );

  const row = result.rows[0];

  if (!row) {
    throw new FundingServiceError("Deposit not found.", "DEPOSIT_NOT_FOUND");
  }

  return toDepositResponse(toDepositRecord(row));
}
