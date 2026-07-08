import type { NextFunction, Request, Response } from "express";
import { verifyPrivyAccessToken } from "../auth/privy.js";
import { sendError } from "../lib/errors.js";
import type { AuthenticatedRequest } from "../types/express.js";

function isPrivyServiceError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("privy") ||
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("timeout")
  );
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    sendError(res, 401, "UNAUTHORIZED", "Missing or invalid authorization header.");
    return;
  }

  const accessToken = authorization.slice("Bearer ".length).trim();

  if (!accessToken) {
    sendError(res, 401, "UNAUTHORIZED", "Missing or invalid authorization header.");
    return;
  }

  try {
    const claims = await verifyPrivyAccessToken(accessToken);
    (req as AuthenticatedRequest).privyUserId = claims.user_id;
    next();
  } catch (error) {
    if (error instanceof Error && error.message.includes("Privy credentials are not configured")) {
      sendError(res, 500, "INTERNAL_ERROR", "Authentication is not configured.");
      return;
    }

    if (isPrivyServiceError(error)) {
      sendError(res, 502, "PRIVY_UNAVAILABLE", "Unable to verify access token.");
      return;
    }

    sendError(res, 401, "UNAUTHORIZED", "Invalid or expired access token.");
  }
}
