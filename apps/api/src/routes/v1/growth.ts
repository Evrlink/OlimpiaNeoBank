import { Router, type RequestHandler } from "express";
import { env } from "../../config/env.js";
import { getPool } from "../../db/pool.js";
import { sendError } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  AaveDepositPlanError,
  assertPlanHasNoSecrets,
  buildAaveDepositPlan,
} from "../../services/aaveDepositPlan.js";
import { getUsdcRawOnBase } from "../../services/usdcBalance.js";
import {
  createDefaultGrowthAuthorizationService,
  GrowthAuthorizationError,
} from "../../services/privyGrowthAuthorization.js";
import {
  getRequiredAaveBaseUsdcVault,
  GrowthConfigurationError,
  type GrowthSummary,
} from "../../services/privyGrowth.js";
import { getHomeGrowthForWallet } from "../../services/walletGrowth.js";
import type { AuthenticatedRequest } from "../../types/express.js";

type WalletLookup = {
  userExists: boolean;
  privyWalletId: string | null;
  smartWalletAddress?: string | null;
  moneyAddressMode?: string | null;
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

function usesSmartWallet(wallet: WalletLookup): boolean {
  return (
    wallet.moneyAddressMode === "smart_wallet" &&
    Boolean(wallet.smartWalletAddress?.trim())
  );
}

async function lookupCurrentUserWallet(
  privyUserId: string,
): Promise<WalletLookup> {
  const pool = getPool();
  if (!pool) {
    throw new Error("Database is not configured.");
  }

  const result = await pool.query<{
    privy_wallet_id: string | null;
    smart_wallet_address: string | null;
    money_address_mode: string | null;
  }>(
    `
      SELECT w.privy_wallet_id, w.smart_wallet_address, w.money_address_mode
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      WHERE u.privy_user_id = $1
    `,
    [privyUserId],
  );
  const row = result.rows[0];

  return row
    ? {
        userExists: true,
        privyWalletId: row.privy_wallet_id,
        smartWalletAddress: row.smart_wallet_address,
        moneyAddressMode: row.money_address_mode,
      }
    : {
        userExists: false,
        privyWalletId: null,
        smartWalletAddress: null,
        moneyAddressMode: null,
      };
}

function sendAuthorizationError(res: Parameters<typeof sendError>[0], error: unknown) {
  if (error instanceof GrowthAuthorizationError) {
    sendError(res, error.status, error.code, error.message);
    return;
  }

  sendError(res, 502, "PRIVY_UNAVAILABLE", "Unable to prepare this authorization.");
}

function sendPlanError(res: Parameters<typeof sendError>[0], error: unknown) {
  if (error instanceof AaveDepositPlanError) {
    sendError(res, error.status, error.code, error.message);
    return;
  }

  if (error instanceof GrowthConfigurationError) {
    sendError(res, 500, "INTERNAL_ERROR", "Growth is not configured.");
    return;
  }

  sendError(res, 502, "PRIVY_UNAVAILABLE", "Unable to prepare this deposit.");
}

export function createGrowthRouter(
  dependencies: Partial<GrowthRouterDependencies> = {},
): Router {
  const auth = dependencies.auth ?? requireAuth;
  const lookupWallet = dependencies.lookupWallet ?? lookupCurrentUserWallet;
  const getGrowth = dependencies.getGrowth;
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

      if (!usesSmartWallet(wallet) && !wallet.privyWalletId) {
        sendError(
          res,
          502,
          "PRIVY_UNAVAILABLE",
          "Privy wallet id is missing. Complete sign-in sync again.",
        );
        return;
      }

      const growth = getGrowth
        ? await getGrowth(wallet.privyWalletId ?? "")
        : await getHomeGrowthForWallet({
            moneyAddressMode: wallet.moneyAddressMode ?? null,
            privyWalletId: wallet.privyWalletId ?? "",
            smartWalletAddress: wallet.smartWalletAddress ?? null,
          });
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

  /** 3C.2: prepare approve+supply calldata only. Does not execute. */
  router.post("/smart-wallet-deposits/prepare", auth, async (req, res) => {
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

      if (!usesSmartWallet(wallet) || !wallet.smartWalletAddress) {
        sendError(
          res,
          409,
          "VALIDATION_ERROR",
          "This deposit path is only for Smart Wallet accounts.",
        );
        return;
      }

      const vault = await getRequiredAaveBaseUsdcVault();
      const availableRawUsdc = await getUsdcRawOnBase(wallet.smartWalletAddress);
      const plan = buildAaveDepositPlan({
        smartWalletAddress: wallet.smartWalletAddress,
        amountUsdc:
          typeof req.body?.amountUsdc === "string" ? req.body.amountUsdc : "",
        availableRawUsdc,
        decimals: vault.decimals,
      });
      assertPlanHasNoSecrets(
        plan,
        env.privyEarnAaveBaseUsdcVaultId,
        env.privyAppSecret,
      );
      res.status(201).json(plan);
    } catch (error) {
      sendPlanError(res, error);
    }
  });

  return router;
}

export const growthRouter = createGrowthRouter();
