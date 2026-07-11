import { Router } from "express";
import { env } from "../../config/env.js";
import { sendError } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  createDepositForUser,
  FundingServiceError,
  getDepositForUser,
} from "../../funding/deposits.js";
import type { AuthenticatedRequest } from "../../types/express.js";

export const fundingRouter = Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

fundingRouter.post("/deposits", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;
  const idempotencyKeyHeader = req.header("Idempotency-Key");

  try {
    const deposit = await createDepositForUser({
      privyUserId,
      body: req.body ?? {},
      idempotencyKey: idempotencyKeyHeader,
      allowForceFail: env.nodeEnv !== "production",
    });

    res.status(201).json(deposit);
  } catch (error) {
    if (error instanceof FundingServiceError) {
      const status =
        error.code === "VALIDATION_ERROR"
          ? 400
          : error.code === "USER_NOT_FOUND"
            ? 404
            : error.code === "PROVIDER_ERROR"
              ? 502
              : 500;

      sendError(res, status, error.code, error.message);
      return;
    }

    sendError(res, 500, "INTERNAL_ERROR", "Unable to start this deposit.");
  }
});

fundingRouter.get("/deposits/:id", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;
  const depositId = req.params.id?.trim() ?? "";

  if (!UUID_RE.test(depositId)) {
    sendError(res, 404, "DEPOSIT_NOT_FOUND", "Deposit not found.");
    return;
  }

  try {
    const deposit = await getDepositForUser({
      privyUserId,
      depositId,
    });

    res.status(200).json(deposit);
  } catch (error) {
    if (error instanceof FundingServiceError) {
      const status =
        error.code === "DEPOSIT_NOT_FOUND"
          ? 404
          : error.code === "USER_NOT_FOUND"
            ? 404
            : 500;

      sendError(res, status, error.code, error.message);
      return;
    }

    sendError(res, 500, "INTERNAL_ERROR", "Unable to load this deposit.");
  }
});
