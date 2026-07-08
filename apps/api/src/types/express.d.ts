import type { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      privyUserId?: string;
    }
  }
}

export type AuthenticatedRequest = Request & {
  privyUserId: string;
};
