import type { Response } from "express";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "USER_NOT_FOUND"
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
