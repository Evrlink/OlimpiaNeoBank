import { randomUUID } from "node:crypto";
import { Router, type RequestHandler } from "express";
import { env } from "../../config/env.js";
import { getPool } from "../../db/pool.js";
import { sendError } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { AaveDepositPlanError } from "../../services/aaveDepositPlan.js";
import {
  createPostgresSmartWalletDepositStore,
  type SmartWalletDepositStore,
} from "../../services/aaveDepositStore.js";
import {
  createPostgresSmartWalletWithdrawStore,
  type SmartWalletWithdrawStore,
} from "../../services/aaveWithdrawStore.js";
import { getUsdcRawOnBase } from "../../services/usdcBalance.js";
import {
  parseSendTransactionHash,
  requireSmartWalletSendsEnabled,
  UsdcSendReceiptPendingError,
  verifyUsdcSendReceipt,
} from "../../services/usdcSendExecution.js";
import {
  assertExecutableUsdcSendPlan,
  assertSendPlanHasNoSecrets,
  buildUsdcSendPlan,
  toSendPlanFromStoredCalls,
  USDC_SEND_DECIMALS,
  UsdcSendPlanError,
  type PreparedUsdcSendResponse,
} from "../../services/usdcSendPlan.js";
import {
  createPostgresSmartWalletSendStore,
  type SmartWalletSendStore,
  type StoredSmartWalletSend,
} from "../../services/usdcSendStore.js";
import type { AuthenticatedRequest } from "../../types/express.js";

const PREPARE_TTL_MS = 5 * 60 * 1000;

type WalletLookup = {
  userExists: boolean;
  userId?: string | null;
  privyWalletId: string | null;
  smartWalletAddress?: string | null;
  moneyAddressMode?: string | null;
};

type SmartWalletSendDependencies = {
  isExecutionEnabled: () => boolean;
  store: SmartWalletSendStore;
  depositStore: SmartWalletDepositStore;
  withdrawStore: SmartWalletWithdrawStore;
  getAvailableRawUsdc: (address: string) => Promise<bigint>;
  verifyReceipt: typeof verifyUsdcSendReceipt;
  createId: () => string;
  now: () => Date;
};

type SendsRouterDependencies = {
  auth: RequestHandler;
  lookupWallet: (privyUserId: string) => Promise<WalletLookup>;
  smartWalletSends: SmartWalletSendDependencies;
};

function usesSmartWallet(wallet: WalletLookup): boolean {
  return (
    wallet.moneyAddressMode === "smart_wallet" &&
    Boolean(wallet.smartWalletAddress?.trim())
  );
}

function defaultSmartWalletSends(): SmartWalletSendDependencies {
  return {
    isExecutionEnabled: () => env.smartWalletSendsEnabled,
    store: createPostgresSmartWalletSendStore(),
    depositStore: createPostgresSmartWalletDepositStore(),
    withdrawStore: createPostgresSmartWalletWithdrawStore(),
    getAvailableRawUsdc: getUsdcRawOnBase,
    verifyReceipt: verifyUsdcSendReceipt,
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

function sendPlanError(res: Parameters<typeof sendError>[0], error: unknown) {
  if (error instanceof UsdcSendPlanError || error instanceof AaveDepositPlanError) {
    sendError(res, error.status, error.code, error.message);
    return;
  }

  sendError(res, 502, "PRIVY_UNAVAILABLE", "Unable to prepare this send.");
}

function requireSmartWalletAccount(wallet: WalletLookup): {
  userId: string;
  smartWalletAddress: string;
} {
  if (!usesSmartWallet(wallet) || !wallet.smartWalletAddress) {
    throw new UsdcSendPlanError(
      409,
      "VALIDATION_ERROR",
      "This send path is only for Smart Wallet accounts.",
    );
  }

  if (!wallet.userId) {
    throw new UsdcSendPlanError(
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

function toSendPlanResponse(
  send: StoredSmartWalletSend,
  executionEnabled: boolean,
): PreparedUsdcSendResponse {
  const plan = toSendPlanFromStoredCalls({
    smartWalletAddress: send.smartWalletAddress,
    destinationAddress: send.destinationAddress,
    amountUsdc: send.amountUsdc,
    calls: send.calls,
  });
  return {
    id: send.id,
    ...plan,
    executionEnabled,
    sendAttemptedAt: send.sendAttemptedAt
      ? send.sendAttemptedAt.toISOString()
      : null,
  };
}

export function createSendsRouter(
  dependencies: Partial<SendsRouterDependencies> = {},
): Router {
  const auth = dependencies.auth ?? requireAuth;
  const lookupWallet = dependencies.lookupWallet ?? lookupCurrentUserWallet;
  const smartWalletSends =
    dependencies.smartWalletSends ?? defaultSmartWalletSends();
  const router = Router();

  router.post("/prepare", auth, async (req, res) => {
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
      if (await smartWalletSends.depositStore.hasSubmittedForUser(account.userId)) {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "A deposit is already in progress.",
        );
      }
      if (await smartWalletSends.withdrawStore.hasSubmittedForUser(account.userId)) {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "A withdrawal is already in progress.",
        );
      }

      const availableRawUsdc = await smartWalletSends.getAvailableRawUsdc(
        account.smartWalletAddress,
      );
      const plan = buildUsdcSendPlan({
        smartWalletAddress: account.smartWalletAddress,
        destinationAddress:
          typeof req.body?.destinationAddress === "string"
            ? req.body.destinationAddress
            : "",
        amountUsdc:
          typeof req.body?.amountUsdc === "string" ? req.body.amountUsdc : "",
        availableRawUsdc,
        decimals: USDC_SEND_DECIMALS,
      });
      const rawAmount = assertExecutableUsdcSendPlan(
        plan,
        account.smartWalletAddress,
      );
      assertSendPlanHasNoSecrets(
        plan,
        env.privyEarnAaveBaseUsdcVaultId,
        env.privyAppSecret,
      );
      const now = smartWalletSends.now();
      const stored = await smartWalletSends.store.replacePrepared({
        id: smartWalletSends.createId(),
        userId: account.userId,
        privyUserId,
        smartWalletAddress: account.smartWalletAddress,
        destinationAddress: plan.destinationAddress,
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
        sendAttemptedAt: null,
      });
      res.status(201).json(
        toSendPlanResponse(stored, smartWalletSends.isExecutionEnabled()),
      );
    } catch (error) {
      sendPlanError(res, error);
    }
  });

  router.post("/:id/submit", auth, async (req, res) => {
    const { privyUserId } = req as AuthenticatedRequest;
    const sendId = req.params.id?.trim() ?? "";

    try {
      requireSmartWalletSendsEnabled(smartWalletSends.isExecutionEnabled());
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
      const existing = await smartWalletSends.store.getByIdForUser(
        sendId,
        privyUserId,
      );
      if (!existing) {
        sendError(res, 404, "SEND_NOT_FOUND", "Send not found.");
        return;
      }

      const plan = toSendPlanFromStoredCalls(existing);
      assertExecutableUsdcSendPlan(plan, account.smartWalletAddress);
      const submitted = await smartWalletSends.store.markSubmitted({
        id: sendId,
        privyUserId,
        submittedAt: smartWalletSends.now(),
      });
      if (!submitted) {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send cannot be submitted.",
        );
      }

      res
        .status(200)
        .json(toSendPlanResponse(submitted, smartWalletSends.isExecutionEnabled()));
    } catch (error) {
      sendPlanError(res, error);
    }
  });

  router.post("/:id/sending", auth, async (req, res) => {
    const { privyUserId } = req as AuthenticatedRequest;
    const sendId = req.params.id?.trim() ?? "";

    try {
      requireSmartWalletSendsEnabled(smartWalletSends.isExecutionEnabled());
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
      const existing = await smartWalletSends.store.getByIdForUser(
        sendId,
        privyUserId,
      );
      if (!existing) {
        sendError(res, 404, "SEND_NOT_FOUND", "Send not found.");
        return;
      }

      if (existing.status !== "submitted") {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send cannot be marked as sending.",
        );
      }

      if (existing.transactionHash) {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send already has a transaction hash.",
        );
      }

      const plan = toSendPlanFromStoredCalls(existing);
      assertExecutableUsdcSendPlan(plan, account.smartWalletAddress);
      const marked = await smartWalletSends.store.markSendAttempted({
        id: sendId,
        privyUserId,
        attemptedAt: smartWalletSends.now(),
      });
      if (!marked) {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send cannot be marked as sending.",
        );
      }

      res
        .status(200)
        .json(toSendPlanResponse(marked, smartWalletSends.isExecutionEnabled()));
    } catch (error) {
      sendPlanError(res, error);
    }
  });

  router.post("/:id/fail", auth, async (req, res) => {
    const { privyUserId } = req as AuthenticatedRequest;
    const sendId = req.params.id?.trim() ?? "";

    try {
      requireSmartWalletSendsEnabled(smartWalletSends.isExecutionEnabled());
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
      const existing = await smartWalletSends.store.getByIdForUser(
        sendId,
        privyUserId,
      );
      if (!existing) {
        sendError(res, 404, "SEND_NOT_FOUND", "Send not found.");
        return;
      }

      if (existing.transactionHash) {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send already has a transaction hash.",
        );
      }

      if (existing.sendAttemptedAt) {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send has already been attempted.",
        );
      }

      const failed = await smartWalletSends.store.markFailed({
        id: sendId,
        privyUserId,
        failureReason: "send_failed",
        failedAt: smartWalletSends.now(),
      });
      if (!failed) {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send cannot be cancelled.",
        );
      }

      res.status(200).json({ id: failed.id, status: failed.status });
    } catch (error) {
      sendPlanError(res, error);
    }
  });

  router.post("/:id/confirm", auth, async (req, res) => {
    const { privyUserId } = req as AuthenticatedRequest;
    const sendId = req.params.id?.trim() ?? "";

    try {
      requireSmartWalletSendsEnabled(smartWalletSends.isExecutionEnabled());
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
      const existing = await smartWalletSends.store.getByIdForUser(
        sendId,
        privyUserId,
      );
      if (!existing) {
        sendError(res, 404, "SEND_NOT_FOUND", "Send not found.");
        return;
      }

      const transactionHash = parseSendTransactionHash(req.body?.transactionHash);
      if (
        existing.status === "confirmed" &&
        existing.transactionHash === transactionHash
      ) {
        res.status(200).json({
          id: existing.id,
          status: existing.status,
          amountUsdc: existing.amountUsdc,
          destinationAddress: existing.destinationAddress,
          transactionHash: existing.transactionHash,
        });
        return;
      }

      if (existing.status === "confirmed") {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send was already confirmed.",
        );
      }

      if (existing.status !== "submitted") {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send is not waiting for a receipt.",
        );
      }

      if (
        existing.transactionHash &&
        existing.transactionHash !== transactionHash
      ) {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send already has a different transaction hash.",
        );
      }

      const attached = await smartWalletSends.store.attachTransactionHash({
        id: sendId,
        privyUserId,
        transactionHash,
        attachedAt: smartWalletSends.now(),
      });
      if (!attached) {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send already has a different transaction hash.",
        );
      }

      const plan = toSendPlanFromStoredCalls(attached);
      const rawAmount = assertExecutableUsdcSendPlan(
        plan,
        account.smartWalletAddress,
      );

      try {
        await smartWalletSends.verifyReceipt({
          transactionHash,
          smartWalletAddress: account.smartWalletAddress,
          destinationAddress: attached.destinationAddress,
          rawAmount,
        });
      } catch (error) {
        const reason =
          error instanceof UsdcSendReceiptPendingError ||
          error instanceof UsdcSendPlanError
            ? error.message
            : "This send is still confirming.";
        await smartWalletSends.store.noteVerification({
          id: sendId,
          privyUserId,
          failureReason: reason,
          notedAt: smartWalletSends.now(),
        });
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send is still confirming.",
        );
      }

      const confirmed = await smartWalletSends.store.markConfirmed({
        id: sendId,
        privyUserId,
        transactionHash,
        confirmedAt: smartWalletSends.now(),
      });
      if (!confirmed) {
        throw new UsdcSendPlanError(
          409,
          "VALIDATION_ERROR",
          "This send cannot be confirmed.",
        );
      }

      res.status(200).json({
        id: confirmed.id,
        status: confirmed.status,
        amountUsdc: confirmed.amountUsdc,
        destinationAddress: confirmed.destinationAddress,
        transactionHash: confirmed.transactionHash,
      });
    } catch (error) {
      sendPlanError(res, error);
    }
  });

  return router;
}

export const sendsRouter = createSendsRouter();
