import { Router, type RequestHandler } from "express";
import { getPool } from "../../db/pool.js";
import { sendError } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  createDefaultGrowthAuthorizationService,
  GrowthAuthorizationError,
} from "../../services/privyGrowthAuthorization.js";
import {
  getGrowthForPrivyWallet,
  GrowthConfigurationError,
  type GrowthSummary,
} from "../../services/privyGrowth.js";
import type { AuthenticatedRequest } from "../../types/express.js";

type WalletLookup = {
  userExists: boolean;
  privyWalletId: string | null;
};

type GrowthAuthorizationService = ReturnType<
  typeof createDefaultGrowthAuthorizationService
>;

type GrowthRouterDependencies = {
  auth: RequestHandler;
  lookupWallet: (privyUserId: string) => Promise<WalletLookup>;
  getGrowth: (privyWalletId: string) => Promise<GrowthSummary>;
  authorization: GrowthAuthorizationService;
};

async function lookupCurrentUserWallet(
  privyUserId: string,
): Promise<WalletLookup> {
  const pool = getPool();
  if (!pool) {
    throw new Error("Database is not configured.");
  }

  const result = await pool.query<{ privy_wallet_id: string | null }>(
    `
      SELECT w.privy_wallet_id
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      WHERE u.privy_user_id = $1
    `,
    [privyUserId],
  );
  const row = result.rows[0];

  return row
    ? { userExists: true, privyWalletId: row.privy_wallet_id }
    : { userExists: false, privyWalletId: null };
}

function sendAuthorizationError(res: Parameters<typeof sendError>[0], error: unknown) {
  if (error instanceof GrowthAuthorizationError) {
    sendError(res, error.status, error.code, error.message);
    return;
  }

  sendError(res, 502, "PRIVY_UNAVAILABLE", "Unable to prepare this authorization.");
}

export function createGrowthRouter(
  dependencies: Partial<GrowthRouterDependencies> = {},
): Router {
  const auth = dependencies.auth ?? requireAuth;
  const lookupWallet = dependencies.lookupWallet ?? lookupCurrentUserWallet;
  const getGrowth = dependencies.getGrowth ?? getGrowthForPrivyWallet;
  const authorization =
    dependencies.authorization ?? createDefaultGrowthAuthorizationService();
  const router = Router();

  router.get("/", auth, async (req, res) => {
    const { privyUserId } = req as AuthenticatedRequest;

    try {
      const wallet = await lookupWallet(privyUserId);

      if (!wallet.userExists) {
        sendError(
          res,
          404,
          "USER_NOT_FOUND",
          "Account not found. Complete sign-in sync first.",
        );
        return;
      }

      if (!wallet.privyWalletId) {
        sendError(
          res,
          502,
          "PRIVY_UNAVAILABLE",
          "Privy wallet id is missing. Complete sign-in sync again.",
        );
        return;
      }

      const growth = await getGrowth(wallet.privyWalletId);
      res.status(200).json(growth);
    } catch (error) {
      if (error instanceof GrowthConfigurationError) {
        sendError(res, 500, "INTERNAL_ERROR", "Growth is not configured.");
        return;
      }

      sendError(res, 502, "PRIVY_UNAVAILABLE", "Unable to load growth.");
    }
  });

  router.post("/deposit-authorizations", auth, async (req, res) => {
    const { privyUserId } = req as AuthenticatedRequest;

    try {
      const prepared = await authorization.prepareDepositAuthorization({
        privyUserId,
        amountUsdc: req.body?.amountUsdc,
      });
      res.status(201).json(prepared);
    } catch (error) {
      sendAuthorizationError(res, error);
    }
  });

  router.post("/deposit-authorizations/:id/confirm", auth, async (req, res) => {
    const { privyUserId } = req as AuthenticatedRequest;
    const authorizationId = req.params.id?.trim() ?? "";

    if (!authorizationId) {
      sendError(res, 404, "AUTHORIZATION_NOT_FOUND", "Authorization not found.");
      return;
    }

    try {
      const confirmed = await authorization.confirmDepositAuthorization({
        privyUserId,
        authorizationId,
        signature: req.body?.signature,
      });
      res.status(200).json(confirmed);
    } catch (error) {
      sendAuthorizationError(res, error);
    }
  });

  return router;
}

export const growthRouter = createGrowthRouter();
