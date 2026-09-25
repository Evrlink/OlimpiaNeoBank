import { randomUUID } from "node:crypto";
import { Router, type RequestHandler } from "express";
import { env } from "../../config/env.js";
import { getPool } from "../../db/pool.js";
import { sendError } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  AaveDepositReceiptPendingError,
  parseTransactionHash,
  requireAaveSmartWalletDepositsEnabled,
  verifyAaveDepositReceipt,
} from "../../services/aaveDepositExecution.js";
import {
  AaveDepositPlanError,
  assertExecutableAaveDepositPlan,
  assertPlanHasNoSecrets,
  buildAaveDepositPlan,
  toPlanFromStoredCalls,
  type PreparedAaveDepositResponse,
} from "../../services/aaveDepositPlan.js";
import {
  createPostgresSmartWalletDepositStore,
  type SmartWalletDepositStore,
  type StoredSmartWalletDeposit,
} from "../../services/aaveDepositStore.js";
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

const PREPARE_TTL_MS = 5 * 60 * 1000;

type WalletLookup = {
  userExists: boolean;
  userId?: string | null;
  privyWalletId: string | null;
  smartWalletAddress?: string | null;
  moneyAddressMode?: string | null;
};

type GrowthAuthorizationService = ReturnType<
  typeof createDefaultGrowthAuthorizationService
>;

type SmartWalletDepositDependencies = {
  isExecutionEnabled: () => boolean;
  store: SmartWalletDepositStore;
  getAvailableRawUsdc: (address: string) => Promise<bigint>;
  getVault: () => Promise<{ decimals: number }>;
  verifyReceipt: typeof verifyAaveDepositReceipt;
  createId: () => string;
  now: () => Date;
};

type GrowthRouterDependencies = {
  auth: RequestHandler;
  lookupWallet: (privyUserId: string) => Promise<WalletLookup>;
  getGrowth: (privyWalletId: string) => Promise<GrowthSummary>;
  authorization: GrowthAuthorizationService;
  smartWalletDeposits: SmartWalletDepositDependencies;
};

function usesSmartWallet(wallet: WalletLookup): boolean {
  return (
    wallet.moneyAddressMode === "smart_wallet" &&
    Boolean(wallet.smartWalletAddress?.trim())
  );
}

function defaultSmartWalletDeposits(): SmartWalletDepositDependencies {
  return {
    isExecutionEnabled: () => env.aaveSmartWalletDepositsEnabled,
    store: createPostgresSmartWalletDepositStore(),
    getAvailableRawUsdc: getUsdcRawOnBase,
    getVault: getRequiredAaveBaseUsdcVault,
    verifyReceipt: verifyAaveDepositReceipt,
    createId: () => randomUUID(),
    now: () => new Date(),
  };
}

async function lookupCurrentUserWallet(
  privyUserId: string,
): Promise<WalletLookup> {
  const pool = getPool();
  if (!pool) {
    throw new Error("Database is not configured.");
  }

  const result = await pool.query<{
    user_id: string;
    privy_wallet_id: string | null;
    smart_wallet_address: string | null;
    money_address_mode: string | null;
  }>(
    `
      SELECT u.id AS user_id, w.privy_wallet_id, w.smart_wallet_address, w.money_address_mode
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
        userId: row.user_id,
        privyWalletId: row.privy_wallet_id,
        smartWalletAddress: row.smart_wallet_address,
        moneyAddressMode: row.money_address_mode,
      }
    : {
        userExists: false,
        userId: null,
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

function toPlanResponse(
  deposit: StoredSmartWalletDeposit,
  executionEnabled: boolean,
): PreparedAaveDepositResponse {
  const plan = toPlanFromStoredCalls({
    smartWalletAddress: deposit.smartWalletAddress,
    amountUsdc: deposit.amountUsdc,
    calls: deposit.calls,
  });
  return {
    id: deposit.id,
    ...plan,
    executionEnabled,
  };
}

function requireSmartWalletAccount(wallet: WalletLookup): {
  userId: string;
  smartWalletAddress: string;
} {
  if (!usesSmartWallet(wallet) || !wallet.smartWalletAddress) {
    throw new AaveDepositPlanError(
      409,
      "VALIDATION_ERROR",
      "This deposit path is only for Smart Wallet accounts.",
    );
  }

  if (!wallet.userId) {
    throw new AaveDepositPlanError(
      500,
      "INTERNAL_ERROR",
      "Account not found. Complete sign-in sync first.",
    );
  }

  return {
    userId: wallet.userId,
    smartWalletAddress: wallet.smartWalletAddress,
  };
}

export function createGrowthRouter(
  dependencies: Partial<GrowthRouterDependencies> = {},
): Router {
  const auth = dependencies.auth ?? requireAuth;
  const lookupWallet = dependencies.lookupWallet ?? lookupCurrentUserWallet;
  const getGrowth = dependencies.getGrowth;
  const authorization =
    dependencies.authorization ?? createDefaultGrowthAuthorizationService();
  const smartWalletDeposits =
    dependencies.smartWalletDeposits ?? defaultSmartWalletDeposits();
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

  /** 3C.2/3C.3: persist approve+supply calldata only. Does not execute. */
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

      const account = requireSmartWalletAccount(wallet);
      const vault = await smartWalletDeposits.getVault();
      const availableRawUsdc = await smartWalletDeposits.getAvailableRawUsdc(
        account.smartWalletAddress,
      );
      const plan = buildAaveDepositPlan({
        smartWalletAddress: account.smartWalletAddress,
        amountUsdc:
          typeof req.body?.amountUsdc === "string" ? req.body.amountUsdc : "",
        availableRawUsdc,
        decimals: vault.decimals,
      });
      const rawAmount = assertExecutableAaveDepositPlan(
        plan,
        account.smartWalletAddress,
      );
      assertPlanHasNoSecrets(
        plan,
        env.privyEarnAaveBaseUsdcVaultId,
        env.privyAppSecret,
      );
      const now = smartWalletDeposits.now();
      const stored = await smartWalletDeposits.store.replacePrepared({
        id: smartWalletDeposits.createId(),
        userId: account.userId,
        privyUserId,
        smartWalletAddress: account.smartWalletAddress,
        amountUsdc: plan.amountUsdc,
        rawAmount: rawAmount.toString(),
        calls: plan.calls,
        status: "prepared",
        transactionHash: null,
        failureReason: null,
        expiresAt: new Date(now.getTime() + PREPARE_TTL_MS),
        submittedAt: null,
        confirmedAt: null,
        createdAt: now,
      });
      res.status(201).json(
        toPlanResponse(stored, smartWalletDeposits.isExecutionEnabled()),
      );
    } catch (error) {
      sendPlanError(res, error);
    }
  });

  router.post("/smart-wallet-deposits/:id/submit", auth, async (req, res) => {
    const { privyUserId } = req as AuthenticatedRequest;
    const depositId = req.params.id?.trim() ?? "";

    try {
      requireAaveSmartWalletDepositsEnabled(
        smartWalletDeposits.isExecutionEnabled(),
      );
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

      const account = requireSmartWalletAccount(wallet);
      const existing = await smartWalletDeposits.store.getByIdForUser(
        depositId,
        privyUserId,
      );
      if (!existing) {
        sendError(res, 404, "DEPOSIT_NOT_FOUND", "Deposit not found.");
        return;
      }

      const plan = toPlanFromStoredCalls(existing);
      assertExecutableAaveDepositPlan(plan, account.smartWalletAddress);
      const submitted = await smartWalletDeposits.store.markSubmitted({
        id: depositId,
        privyUserId,
        submittedAt: smartWalletDeposits.now(),
      });
      if (!submitted) {
        throw new AaveDepositPlanError(
          409,
          "VALIDATION_ERROR",
          "This deposit cannot be submitted.",
        );
      }

      res.status(200).json(
        toPlanResponse(submitted, smartWalletDeposits.isExecutionEnabled()),
      );
    } catch (error) {
      sendPlanError(res, error);
    }
  });

  router.post("/smart-wallet-deposits/:id/fail", auth, async (req, res) => {
    const { privyUserId } = req as AuthenticatedRequest;
    const depositId = req.params.id?.trim() ?? "";

    try {
      requireAaveSmartWalletDepositsEnabled(
        smartWalletDeposits.isExecutionEnabled(),
      );
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

      requireSmartWalletAccount(wallet);
      const failed = await smartWalletDeposits.store.markFailed({
        id: depositId,
        privyUserId,
        failureReason: "send_failed",
        failedAt: smartWalletDeposits.now(),
      });
      if (!failed) {
        sendError(res, 404, "DEPOSIT_NOT_FOUND", "Deposit not found.");
        return;
      }

      res.status(200).json({ id: failed.id, status: failed.status });
    } catch (error) {
      sendPlanError(res, error);
    }
  });

  router.post("/smart-wallet-deposits/:id/confirm", auth, async (req, res) => {
    const { privyUserId } = req as AuthenticatedRequest;
    const depositId = req.params.id?.trim() ?? "";

    try {
      requireAaveSmartWalletDepositsEnabled(
        smartWalletDeposits.isExecutionEnabled(),
      );
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

      const account = requireSmartWalletAccount(wallet);
      const existing = await smartWalletDeposits.store.getByIdForUser(
        depositId,
        privyUserId,
      );
      if (!existing) {
        sendError(res, 404, "DEPOSIT_NOT_FOUND", "Deposit not found.");
        return;
      }

      const transactionHash = parseTransactionHash(req.body?.transactionHash);
      if (
        existing.status === "confirmed" &&
        existing.transactionHash === transactionHash
      ) {
        res.status(200).json({
          id: existing.id,
          status: existing.status,
          amountUsdc: existing.amountUsdc,
          transactionHash: existing.transactionHash,
        });
        return;
      }

      if (existing.status === "confirmed") {
        throw new AaveDepositPlanError(
          409,
          "VALIDATION_ERROR",
          "This deposit was already confirmed.",
        );
      }

      if (existing.status !== "submitted") {
        throw new AaveDepositPlanError(
          409,
          "VALIDATION_ERROR",
          "This deposit is not waiting for a receipt.",
        );
      }

      const plan = toPlanFromStoredCalls(existing);
      const rawAmount = assertExecutableAaveDepositPlan(
        plan,
        account.smartWalletAddress,
      );

      try {
        await smartWalletDeposits.verifyReceipt({
          transactionHash,
          smartWalletAddress: account.smartWalletAddress,
          rawAmount,
        });
      } catch (error) {
        if (error instanceof AaveDepositReceiptPendingError) {
          sendError(
            res,
            409,
            "VALIDATION_ERROR",
            "This deposit is still confirming.",
          );
          return;
        }

        if (
          error instanceof AaveDepositPlanError &&
          error.status === 400
        ) {
          await smartWalletDeposits.store.markFailed({
            id: depositId,
            privyUserId,
            failureReason: error.message,
            failedAt: smartWalletDeposits.now(),
          });
        }

        throw error;
      }

      const confirmed = await smartWalletDeposits.store.markConfirmed({
        id: depositId,
        privyUserId,
        transactionHash,
        confirmedAt: smartWalletDeposits.now(),
      });
      if (!confirmed) {
        throw new AaveDepositPlanError(
          409,
          "VALIDATION_ERROR",
          "This deposit cannot be confirmed.",
        );
      }

      res.status(200).json({
        id: confirmed.id,
        status: confirmed.status,
        amountUsdc: confirmed.amountUsdc,
        transactionHash: confirmed.transactionHash,
      });
    } catch (error) {
      sendPlanError(res, error);
    }
  });

  return router;
}

export const growthRouter = createGrowthRouter();
