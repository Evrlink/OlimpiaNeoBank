import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { sendError } from "../../lib/errors.js";
import { AuthSyncError, syncAuthenticatedUser } from "../../services/authSync.js";
import type { AuthenticatedRequest } from "../../types/express.js";

export const authRouter = Router();

authRouter.post("/sync", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;

  try {
    const result = await syncAuthenticatedUser(privyUserId);

    res.status(200).json({
      user: result.user,
      wallet: result.wallet,
      balance: result.balance,
      isNewUser: result.isNewUser,
    });
  } catch (error) {
    if (error instanceof AuthSyncError) {
      if (error.code === "PRIVY_UNAVAILABLE") {
        sendError(res, 502, "PRIVY_UNAVAILABLE", error.message);
        return;
      }

      sendError(res, 500, "SYNC_FAILED", error.message);
      return;
    }

    sendError(res, 500, "SYNC_FAILED", "Failed to sync user account.");
  }
});
