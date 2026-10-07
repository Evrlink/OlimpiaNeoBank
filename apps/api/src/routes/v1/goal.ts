import { Router } from "express";
import { getPool } from "../../db/pool.js";
import { sendError } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  getSavingsGoalForPrivyUser,
  parseSavingsGoalWrite,
  saveSavingsGoalForPrivyUser,
  SavingsGoalValidationError,
} from "../../services/userGoal.js";
import type { AuthenticatedRequest } from "../../types/express.js";

export const goalRouter = Router();

goalRouter.get("/", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;

  try {
    const pool = getPool();

    if (!pool) {
      sendError(res, 500, "INTERNAL_ERROR", "Unable to load your goal.");
      return;
    }

    const result = await getSavingsGoalForPrivyUser(privyUserId, pool);

    if (!result.userFound) {
      sendError(
        res,
        404,
        "USER_NOT_FOUND",
        "Account not found. Complete sign-in sync first.",
      );
      return;
    }

    res.status(200).json({ goal: result.goal });
  } catch {
    sendError(res, 500, "INTERNAL_ERROR", "Unable to load your goal.");
  }
});

goalRouter.put("/", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;

  try {
    const goal = parseSavingsGoalWrite(req.body);
    const pool = getPool();

    if (!pool) {
      sendError(res, 500, "INTERNAL_ERROR", "Unable to save your goal.");
      return;
    }

    const result = await saveSavingsGoalForPrivyUser(privyUserId, goal, pool);

    if (!result.userFound || !result.goal) {
      sendError(
        res,
        404,
        "USER_NOT_FOUND",
        "Account not found. Complete sign-in sync first.",
      );
      return;
    }

    res.status(200).json({ goal: result.goal });
  } catch (error) {
    if (error instanceof SavingsGoalValidationError) {
      sendError(res, 400, "VALIDATION_ERROR", error.message);
      return;
    }

    sendError(res, 500, "INTERNAL_ERROR", "Unable to save your goal.");
  }
});
