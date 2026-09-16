import type { NextFunction, Request, Response } from "express";
import { sendError } from "../lib/errors.js";
import { phase2Eligibility } from "../lib/responses.js";

export function isOnRampFundingEnabled(): boolean {
  return phase2Eligibility.onRamp.available === true;
}

/** Blocks funding HTTP routes while Add Money / eligibility.onRamp is gated. */
export function requireOnRampEligibility(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isOnRampFundingEnabled()) {
    sendError(res, 403, "NOT_AVAILABLE", "Add Money is not available yet.");
    return;
  }

  next();
}
