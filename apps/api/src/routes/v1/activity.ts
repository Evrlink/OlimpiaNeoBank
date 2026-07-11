import { Router } from "express";
import { getPool } from "../../db/pool.js";
import { sendError } from "../../lib/errors.js";
import { toActivityItem } from "../../lib/responses.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import type { AuthenticatedRequest } from "../../types/express.js";

export const activityRouter = Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DbTransactionRow = {
  id: string;
  type: string;
  amount_usd: string;
  status: string;
  counterparty_id: string | null;
  created_at: Date;
};

function parsePagination(query: {
  limit?: unknown;
  offset?: unknown;
}): { limit: number; offset: number } | null {
  const rawLimit = query.limit;
  const rawOffset = query.offset;

  const limit =
    rawLimit === undefined || rawLimit === ""
      ? DEFAULT_LIMIT
      : Number(rawLimit);
  const offset =
    rawOffset === undefined || rawOffset === "" ? 0 : Number(rawOffset);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return null;
  }

  if (!Number.isInteger(offset) || offset < 0) {
    return null;
  }

  return { limit, offset };
}

async function resolveUserId(
  privyUserId: string,
): Promise<{ userId: string } | { error: "no_pool" | "not_found" }> {
  const pool = getPool();

  if (!pool) {
    return { error: "no_pool" };
  }

  const userResult = await pool.query<{ id: string }>(
    "SELECT id FROM users WHERE privy_user_id = $1",
    [privyUserId],
  );

  const userRow = userResult.rows[0];

  if (!userRow) {
    return { error: "not_found" };
  }

  return { userId: userRow.id };
}

activityRouter.get("/", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;
  const pagination = parsePagination(req.query);

  if (!pagination) {
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Invalid pagination. Use limit (1–100) and offset (≥ 0).",
    );
    return;
  }

  try {
    const resolved = await resolveUserId(privyUserId);

    if ("error" in resolved) {
      if (resolved.error === "no_pool") {
        sendError(res, 500, "INTERNAL_ERROR", "Unable to load activity.");
        return;
      }

      sendError(
        res,
        404,
        "USER_NOT_FOUND",
        "Account not found. Complete sign-in sync first.",
      );
      return;
    }

    const pool = getPool();

    if (!pool) {
      sendError(res, 500, "INTERNAL_ERROR", "Unable to load activity.");
      return;
    }

    const { limit, offset } = pagination;
    const { userId } = resolved;

    const [countResult, itemsResult] = await Promise.all([
      pool.query<{ total: string }>(
        "SELECT COUNT(*)::text AS total FROM transactions WHERE user_id = $1",
        [userId],
      ),
      pool.query<DbTransactionRow>(
        `
          SELECT id, type, amount_usd, status, counterparty_id, created_at
          FROM transactions
          WHERE user_id = $1
          ORDER BY created_at DESC, id DESC
          LIMIT $2 OFFSET $3
        `,
        [userId, limit, offset],
      ),
    ]);

    const total = Number(countResult.rows[0]?.total ?? 0);

    res.status(200).json({
      limit,
      offset,
      total: Number.isFinite(total) ? total : 0,
      items: itemsResult.rows.map(toActivityItem),
    });
  } catch {
    sendError(res, 500, "INTERNAL_ERROR", "Unable to load activity.");
  }
});

activityRouter.get("/:id", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;
  const transactionId = req.params.id?.trim() ?? "";

  if (!UUID_RE.test(transactionId)) {
    sendError(
      res,
      404,
      "TRANSACTION_NOT_FOUND",
      "Transaction not found.",
    );
    return;
  }

  try {
    const resolved = await resolveUserId(privyUserId);

    if ("error" in resolved) {
      if (resolved.error === "no_pool") {
        sendError(res, 500, "INTERNAL_ERROR", "Unable to load activity.");
        return;
      }

      sendError(
        res,
        404,
        "USER_NOT_FOUND",
        "Account not found. Complete sign-in sync first.",
      );
      return;
    }

    const pool = getPool();

    if (!pool) {
      sendError(res, 500, "INTERNAL_ERROR", "Unable to load activity.");
      return;
    }

    const result = await pool.query<DbTransactionRow>(
      `
        SELECT id, type, amount_usd, status, counterparty_id, created_at
        FROM transactions
        WHERE id = $1 AND user_id = $2
      `,
      [transactionId, resolved.userId],
    );

    const row = result.rows[0];

    if (!row) {
      sendError(
        res,
        404,
        "TRANSACTION_NOT_FOUND",
        "Transaction not found.",
      );
      return;
    }

    res.status(200).json(toActivityItem(row));
  } catch {
    sendError(res, 500, "INTERNAL_ERROR", "Unable to load activity.");
  }
});
