import { Router } from "express";
import { getPool } from "../../db/pool.js";
import { sendError } from "../../lib/errors.js";
import { toActivityItem } from "../../lib/responses.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { getHomeActivityForWallet } from "../../services/walletActivity.js";
import { InvalidUsdcActivityCursorError } from "../../services/usdcActivity.js";
import type { AuthenticatedRequest } from "../../types/express.js";

export const activityRouter = Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type DbTransactionRow = {
  id: string;
  type: string;
  amount_usd: string;
  status: string;
  counterparty_id: string | null;
  created_at: Date;
};

function parseCursor(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const cursor = value.trim();
  return cursor.length > 0 ? cursor : undefined;
}

function parsePagination(query: {
  limit?: unknown;
  cursor?: unknown;
}): { limit: number; cursor?: string } | null {
  const rawLimit = query.limit;

  const limit =
    rawLimit === undefined || rawLimit === ""
      ? DEFAULT_LIMIT
      : Number(rawLimit);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return null;
  }

  return { limit, cursor: parseCursor(query.cursor) };
}

async function resolveUserId(
  privyUserId: string,
): Promise<{ userId: string } | { error: "no_pool" | "not_found" }> {
  const pool = getPool();

  if (!pool) {
    return { error: "no_pool" };
  }

  const userResult = await pool.query<{ id: string }>(
    "SELECT id FROM users WHERE privy_user_id = $1",
    [privyUserId],
  );

  const userRow = userResult.rows[0];

  if (!userRow) {
    return { error: "not_found" };
  }

  return { userId: userRow.id };
}

activityRouter.get("/", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;
  const pagination = parsePagination(req.query);

  if (!pagination) {
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Invalid pagination. Use limit (1–100) and an optional cursor.",
    );
    return;
  }

  try {
    const pool = getPool();

    if (!pool) {
      sendError(res, 500, "INTERNAL_ERROR", "Unable to load activity.");
      return;
    }

    const walletResult = await pool.query<{
      privy_wallet_id: string | null;
      smart_wallet_address: string | null;
      money_address_mode: string | null;
    }>(
      `
        SELECT w.privy_wallet_id, w.smart_wallet_address, w.money_address_mode
        FROM users u
        JOIN wallets w ON w.user_id = u.id
        WHERE u.privy_user_id = $1
      `,
      [privyUserId],
    );

    const walletRow = walletResult.rows[0];

    if (!walletRow) {
      sendError(
        res,
        404,
        "USER_NOT_FOUND",
        "Account not found. Complete sign-in sync first.",
      );
      return;
    }

    const usesSmartWallet =
      walletRow.money_address_mode === "smart_wallet" &&
      Boolean(walletRow.smart_wallet_address?.trim());

    if (!usesSmartWallet && !walletRow.privy_wallet_id) {
      sendError(
        res,
        502,
        "PRIVY_UNAVAILABLE",
        "Privy wallet id is missing. Complete sign-in sync again.",
      );
      return;
    }

    const { limit, cursor } = pagination;
    const page = await getHomeActivityForWallet({
      moneyAddressMode: walletRow.money_address_mode,
      privyWalletId: walletRow.privy_wallet_id ?? "",
      smartWalletAddress: walletRow.smart_wallet_address,
      limit,
      cursor,
    });

    res.status(200).json({
      limit,
      items: page.items,
      next_cursor: page.nextCursor,
    });
  } catch (error) {
    if (error instanceof InvalidUsdcActivityCursorError) {
      sendError(
        res,
        400,
        "VALIDATION_ERROR",
        "Invalid pagination. Use limit (1–100) and an optional cursor.",
      );
      return;
    }

    sendError(res, 502, "PRIVY_UNAVAILABLE", "Unable to load wallet activity.");
  }
});

activityRouter.get("/:id", requireAuth, async (req, res) => {
  const { privyUserId } = req as AuthenticatedRequest;
  const transactionId = req.params.id?.trim() ?? "";

  if (!UUID_RE.test(transactionId)) {
    sendError(
      res,
      404,
      "TRANSACTION_NOT_FOUND",
      "Transaction not found.",
    );
    return;
  }

  try {
    const resolved = await resolveUserId(privyUserId);

    if ("error" in resolved) {
      if (resolved.error === "no_pool") {
        sendError(res, 500, "INTERNAL_ERROR", "Unable to load activity.");
        return;
      }

      sendError(
        res,
        404,
        "USER_NOT_FOUND",
        "Account not found. Complete sign-in sync first.",
      );
      return;
    }

    const pool = getPool();

    if (!pool) {
      sendError(res, 500, "INTERNAL_ERROR", "Unable to load activity.");
      return;
    }

    const result = await pool.query<DbTransactionRow>(
      `
        SELECT id, type, amount_usd, status, counterparty_id, created_at
        FROM transactions
        WHERE id = $1 AND user_id = $2
      `,
      [transactionId, resolved.userId],
    );

    const row = result.rows[0];

    if (!row) {
      sendError(
        res,
        404,
        "TRANSACTION_NOT_FOUND",
        "Transaction not found.",
      );
      return;
    }

    res.status(200).json(toActivityItem(row));
  } catch {
    sendError(res, 500, "INTERNAL_ERROR", "Unable to load activity.");
  }
});
