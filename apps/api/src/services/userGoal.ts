import type pg from "pg";

const NAME_MAX_LENGTH = 80;
const TARGET_MAX = 99_999_999_999_999.99;

export type SavingsGoal = {
  name: string;
  targetAmountUsd: string;
};

export class SavingsGoalValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SavingsGoalValidationError";
  }
}

type Queryable = pg.Pool | pg.PoolClient;

type GoalRow = {
  id: string;
  name: string | null;
  target_amount_usd: string | null;
};

function formatTarget(value: number): string {
  return value.toFixed(2);
}

export function parseSavingsGoalWrite(body: unknown): SavingsGoal {
  if (!body || typeof body !== "object") {
    throw new SavingsGoalValidationError("Enter a goal name and target amount.");
  }

  const record = body as { name?: unknown; targetAmountUsd?: unknown };
  const name = typeof record.name === "string" ? record.name.trim() : "";

  if (!name || name.length > NAME_MAX_LENGTH || /[\u0000-\u001F]/.test(name)) {
    throw new SavingsGoalValidationError("Enter a goal name up to 80 characters.");
  }

  const rawTarget =
    typeof record.targetAmountUsd === "number"
      ? String(record.targetAmountUsd)
      : typeof record.targetAmountUsd === "string"
        ? record.targetAmountUsd.trim().replace(/[$,\s]/g, "")
        : "";

  if (!/^\d+(\.\d{1,2})?$/.test(rawTarget)) {
    throw new SavingsGoalValidationError("Enter a target amount greater than $0.00.");
  }

  const target = Number(rawTarget);

  if (!Number.isFinite(target) || target <= 0 || target > TARGET_MAX) {
    throw new SavingsGoalValidationError("Enter a target amount greater than $0.00.");
  }

  return {
    name,
    targetAmountUsd: formatTarget(target),
  };
}

export async function getSavingsGoalForPrivyUser(
  privyUserId: string,
  db: Queryable,
): Promise<{ userFound: boolean; goal: SavingsGoal | null }> {
  const result = await db.query<GoalRow>(
    `
      SELECT u.id, g.name, g.target_amount_usd
      FROM users u
      LEFT JOIN savings_goals g ON g.user_id = u.id
      WHERE u.privy_user_id = $1
    `,
    [privyUserId],
  );

  const row = result.rows[0];

  if (!row) {
    return { userFound: false, goal: null };
  }

  if (!row.name || row.target_amount_usd == null) {
    return { userFound: true, goal: null };
  }

  return {
    userFound: true,
    goal: {
      name: row.name,
      targetAmountUsd: formatTarget(Number(row.target_amount_usd)),
    },
  };
}

export async function saveSavingsGoalForPrivyUser(
  privyUserId: string,
  goal: SavingsGoal,
  db: Queryable,
): Promise<{ userFound: boolean; goal: SavingsGoal | null }> {
  const result = await db.query<GoalRow>(
    `
      INSERT INTO savings_goals (user_id, name, target_amount_usd)
      SELECT u.id, $2, $3
      FROM users u
      WHERE u.privy_user_id = $1
      ON CONFLICT (user_id) DO UPDATE SET
        name = EXCLUDED.name,
        target_amount_usd = EXCLUDED.target_amount_usd,
        updated_at = now()
      RETURNING user_id AS id, name, target_amount_usd
    `,
    [privyUserId, goal.name, goal.targetAmountUsd],
  );

  const row = result.rows[0];

  if (!row?.name || row.target_amount_usd == null) {
    return { userFound: false, goal: null };
  }

  return {
    userFound: true,
    goal: {
      name: row.name,
      targetAmountUsd: formatTarget(Number(row.target_amount_usd)),
    },
  };
}
