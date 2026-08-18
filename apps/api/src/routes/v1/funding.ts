import { Router } from "express";
import { env } from "../../config/env.js";
import { sendError } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  createDepositForUser,
  FundingServiceError,
  getDepositForUser,
} from "../../funding/deposits.js";
import {
  completeFundingVerification,
  FundingVerificationError,
  startFundingVerification,
} from "../../funding/verification.js";
import {
  cancelDepositForUser,
  reconcileDepositFromCoinbase,
  WebhookError,
} from "../../funding/webhooks.js";
import type { AuthenticatedRequest } from "../../types/express.js";

export const fundingRouter = Router();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

fundingRouter.post("/verifications", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;

  try {
    const verification = await startFundingVerification({
      privyUserId,
      channel: req.body?.channel,
      destination: req.body?.destination,
    });

    res.status(201).json(verification);
  } catch (error) {
    if (error instanceof FundingVerificationError) {
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

    sendError(res, 500, "INTERNAL_ERROR", "Unable to start verification.");
  }
});

fundingRouter.post("/verifications/:id/submit", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;
  const verificationId = req.params.id?.trim() ?? "";

  try {
    const verification = await completeFundingVerification({
      privyUserId,
      verificationId,
      otpCode: req.body?.otpCode,
      channel: req.body?.channel,
      destination: req.body?.destination,
    });

    res.status(200).json(verification);
  } catch (error) {
    if (error instanceof FundingVerificationError) {
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

    sendError(res, 500, "INTERNAL_ERROR", "Unable to complete verification.");
  }
});

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

fundingRouter.post("/deposits/:id/cancel", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;
  const depositId = req.params.id?.trim() ?? "";

  if (!UUID_RE.test(depositId)) {
    sendError(res, 404, "DEPOSIT_NOT_FOUND", "Deposit not found.");
    return;
  }

  try {
    await cancelDepositForUser({
      privyUserId,
      depositId,
      reason: "This deposit was cancelled.",
    });
    const deposit = await getDepositForUser({ privyUserId, depositId });
    res.status(200).json(deposit);
  } catch (error) {
    if (error instanceof WebhookError) {
      sendError(
        res,
        error.status === 404 ? 404 : 500,
        error.status === 404 ? "DEPOSIT_NOT_FOUND" : "INTERNAL_ERROR",
        error.message,
      );
      return;
    }

    sendError(res, 500, "INTERNAL_ERROR", "Unable to cancel this deposit.");
  }
});

fundingRouter.post("/deposits/:id/reconcile", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;
  const depositId = req.params.id?.trim() ?? "";

  if (!UUID_RE.test(depositId)) {
    sendError(res, 404, "DEPOSIT_NOT_FOUND", "Deposit not found.");
    return;
  }

  try {
    await reconcileDepositFromCoinbase({ privyUserId, depositId });
    const deposit = await getDepositForUser({ privyUserId, depositId });
    res.status(200).json(deposit);
  } catch (error) {
    if (error instanceof WebhookError) {
      sendError(
        res,
        error.status === 404 ? 404 : 500,
        error.status === 404 ? "DEPOSIT_NOT_FOUND" : "INTERNAL_ERROR",
        error.message,
      );
      return;
    }

    sendError(res, 500, "INTERNAL_ERROR", "Unable to refresh this deposit.");
  }
});
