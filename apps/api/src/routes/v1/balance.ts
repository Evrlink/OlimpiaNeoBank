import { Router } from "express";
import { getPool } from "../../db/pool.js";
import { sendError } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { getHomeBalanceForPrivyWallet } from "../../services/privyBalance.js";
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

    const walletResult = await pool.query<{ privy_wallet_id: string | null }>(
      `
        SELECT w.privy_wallet_id
        FROM users u
        JOIN wallets w ON w.user_id = u.id
        WHERE u.privy_user_id = $1
      `,
      [privyUserId],
    );

    const walletRow = walletResult.rows[0];

    if (!walletRow) {
      sendError(
        res,
        404,
        "USER_NOT_FOUND",
        "Account not found. Complete sign-in sync first.",
      );
      return;
    }

    if (!walletRow.privy_wallet_id) {
      sendError(
        res,
        502,
        "PRIVY_UNAVAILABLE",
        "Privy wallet id is missing. Complete sign-in sync again.",
      );
      return;
    }

    const balance = await getHomeBalanceForPrivyWallet(walletRow.privy_wallet_id);
    res.status(200).json(balance);
  } catch {
    sendError(res, 502, "PRIVY_UNAVAILABLE", "Unable to load wallet balance.");
  }
});
