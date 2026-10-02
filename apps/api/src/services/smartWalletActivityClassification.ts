import { getPool } from "../db/pool.js";
import type { SmartWalletActivityKind } from "./smartWalletActivityStore.js";

const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

export type ConfirmedGrowHashes = {
  depositHashes: Set<string>;
  withdrawalHashes: Set<string>;
};

export type ConfirmedGrowHashLookup = {
  listForUser(userId: string): Promise<ConfirmedGrowHashes>;
};

export function normalizeConfirmedHash(value: string): string | null {
  const hash = value.trim().toLowerCase();
  return TX_HASH_PATTERN.test(hash) ? hash : null;
}

function toHashSet(values: Iterable<string>): Set<string> {
  const hashes = new Set<string>();
  for (const value of values) {
    const hash = normalizeConfirmedHash(value);
    if (hash) {
      hashes.add(hash);
    }
  }
  return hashes;
}

/**
 * Classify one indexed USDC Transfer using confirmed Olimpia Grow rows.
 * Direction decides which log in a multi-transfer transaction is labeled.
 */
export function classifySmartWalletActivityKind(
  input: { transactionHash: string; direction: "in" | "out" },
  confirmed: ConfirmedGrowHashes,
): SmartWalletActivityKind {
  const hash = normalizeConfirmedHash(input.transactionHash);

  if (hash && input.direction === "out" && confirmed.depositHashes.has(hash)) {
    return "grow_deposit";
  }

  if (hash && input.direction === "in" && confirmed.withdrawalHashes.has(hash)) {
    return "grow_withdraw";
  }

  return input.direction === "in" ? "received" : "sent";
}

export function toCustomerActivityType(kind: SmartWalletActivityKind): string {
  if (kind === "grow_deposit") {
    return "Added to Grow";
  }

  if (kind === "grow_withdraw") {
    return "Moved to Available";
  }

  return kind;
}

export function createPostgresConfirmedGrowHashLookup(): ConfirmedGrowHashLookup {
  return {
    async listForUser(userId) {
      const empty: ConfirmedGrowHashes = {
        depositHashes: new Set(),
        withdrawalHashes: new Set(),
      };
      const pool = getPool();
      if (!pool || !userId.trim()) {
        return empty;
      }

      const [deposits, withdrawals] = await Promise.all([
        pool.query<{ transaction_hash: string }>(
          `
            SELECT transaction_hash
            FROM smart_wallet_deposits
            WHERE user_id = $1
              AND status = 'confirmed'
              AND transaction_hash IS NOT NULL
          `,
          [userId],
        ),
        pool.query<{ transaction_hash: string }>(
          `
            SELECT transaction_hash
            FROM smart_wallet_withdrawals
            WHERE user_id = $1
              AND status = 'confirmed'
              AND transaction_hash IS NOT NULL
          `,
          [userId],
        ),
      ]);

      return {
        depositHashes: toHashSet(deposits.rows.map((row) => row.transaction_hash)),
        withdrawalHashes: toHashSet(
          withdrawals.rows.map((row) => row.transaction_hash),
        ),
      };
    },
  };
}

export function createMemoryConfirmedGrowHashLookup(
  confirmed: {
    depositHashes?: Iterable<string>;
    withdrawalHashes?: Iterable<string>;
  } = {},
): ConfirmedGrowHashLookup {
  const snapshot: ConfirmedGrowHashes = {
    depositHashes: toHashSet(confirmed.depositHashes ?? []),
    withdrawalHashes: toHashSet(confirmed.withdrawalHashes ?? []),
  };

  return {
    async listForUser() {
      return {
        depositHashes: new Set(snapshot.depositHashes),
        withdrawalHashes: new Set(snapshot.withdrawalHashes),
      };
    },
  };
}
