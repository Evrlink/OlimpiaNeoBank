import { Router } from "express";
import { getPool } from "../../db/pool.js";
import { sendError } from "../../lib/errors.js";
import { getBalanceSummaryForUser } from "../../ledger/index.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import type { AuthenticatedRequest } from "../../types/express.js";

export const balanceRouter = Router();

balanceRouter.get("/", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;

  try {
    const pool = getPool();

    if (!pool) {
      sendError(res, 500, "INTERNAL_ERROR", "Unable to load balance.");
      return;
    }

    const userResult = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE privy_user_id = $1",
      [privyUserId],
    );

    const userRow = userResult.rows[0];

    if (!userRow) {
      sendError(
        res,
        404,
        "USER_NOT_FOUND",
        "Account not found. Complete sign-in sync first.",
      );
      return;
    }

    const balance = await getBalanceSummaryForUser(userRow.id, pool);

    if (!balance) {
      sendError(
        res,
        404,
        "USER_NOT_FOUND",
        "Account not found. Complete sign-in sync first.",
      );
      return;
    }

    res.status(200).json(balance);
  } catch {
    sendError(res, 500, "INTERNAL_ERROR", "Unable to load balance.");
  }
});
