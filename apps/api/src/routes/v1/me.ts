import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { sendError } from "../../lib/errors.js";
import { phase2Eligibility } from "../../lib/responses.js";
import { getAuthenticatedUserProfile } from "../../services/authSync.js";
import type { AuthenticatedRequest } from "../../types/express.js";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;

  try {
    const profile = await getAuthenticatedUserProfile(privyUserId);

    if (!profile) {
      sendError(
        res,
        404,
        "USER_NOT_FOUND",
        "Account not found. Complete sign-in sync first.",
      );
      return;
    }

    res.status(200).json({
      user: profile.user,
      balance: profile.balance,
      eligibility: phase2Eligibility,
    });
  } catch {
    sendError(res, 500, "INTERNAL_ERROR", "Unable to load account profile.");
  }
});
