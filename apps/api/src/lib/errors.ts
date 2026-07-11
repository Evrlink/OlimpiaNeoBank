import type { Response } from "express";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "USER_NOT_FOUND"
  | "TRANSACTION_NOT_FOUND"
  | "DEPOSIT_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "PROVIDER_ERROR"
  | "SYNC_FAILED"
  | "PRIVY_UNAVAILABLE"
  | "INTERNAL_ERROR";

export function sendError(
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
): Response {
  return res.status(status).json({
    error: {
      code,
      message,
    },
  });
}
