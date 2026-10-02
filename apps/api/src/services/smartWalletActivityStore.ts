import { getPool } from "../db/pool.js";

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const TX_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;
const RAW_AMOUNT_PATTERN = /^[0-9]+$/;

export const SMART_WALLET_ACTIVITY_KINDS = [
  "received",
  "sent",
  "grow_deposit",
  "grow_withdraw",
] as const;

export type SmartWalletActivityKind =
  (typeof SMART_WALLET_ACTIVITY_KINDS)[number];

export type SmartWalletActivityDirection = "in" | "out";

export type NewSmartWalletActivityEvent = {
  userId: string;
  smartWalletAddress: string;
  transactionHash: string;
  logIndex: number;
  blockNumber: bigint;
  blockTimestamp: Date;
  direction: SmartWalletActivityDirection;
  rawAmount: string;
  counterpartyAddress: string;
  kind: SmartWalletActivityKind;
};

export type StoredSmartWalletActivityEvent = NewSmartWalletActivityEvent & {
  id: string;
  createdAt: Date;
};

export type SmartWalletActivityCursor = {
  userId: string;
  smartWalletAddress: string;
  indexedThroughBlock: bigint;
  updatedAt: Date;
};

export type ListSmartWalletActivityEventsInput = {
  userId: string;
  limit: number;
  before?: {
    blockNumber: bigint;
    logIndex: number;
  };
};

export type AdvanceSmartWalletActivityCursorInput = {
  userId: string;
  smartWalletAddress: string;
  throughBlock: bigint;
  updatedAt: Date;
};

export type SmartWalletActivityStore = {
  insertEvents(
    events: NewSmartWalletActivityEvent[],
  ): Promise<StoredSmartWalletActivityEvent[]>;
  listEventsForUser(
    input: ListSmartWalletActivityEventsInput,
  ): Promise<StoredSmartWalletActivityEvent[]>;
  getCursor(input: {
    userId: string;
    smartWalletAddress: string;
  }): Promise<SmartWalletActivityCursor | null>;
  advanceCursor(
    input: AdvanceSmartWalletActivityCursorInput,
  ): Promise<SmartWalletActivityCursor>;
  applyGrowClassification(input: {
    userId: string;
    depositHashes: Iterable<string>;
    withdrawalHashes: Iterable<string>;
  }): Promise<void>;
};

export class SmartWalletActivityStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SmartWalletActivityStoreError";
  }
}

type EventRow = {
  id: string;
  user_id: string;
  smart_wallet_address: string;
  transaction_hash: string;
  log_index: number;
  block_number: string;
  block_timestamp: Date;
  direction: SmartWalletActivityDirection;
  raw_amount: string;
  counterparty_address: string;
  kind: SmartWalletActivityKind;
  created_at: Date;
};

type CursorRow = {
  user_id: string;
  smart_wallet_address: string;
  indexed_through_block: string;
  updated_at: Date;
};

const EVENT_SELECT_COLUMNS = `
  id,
  user_id,
  smart_wallet_address,
  transaction_hash,
  log_index,
  block_number::text,
  block_timestamp,
  direction,
  raw_amount,
  counterparty_address,
  kind,
  created_at
`;

function expectedDirection(
  kind: SmartWalletActivityKind,
): SmartWalletActivityDirection {
  return kind === "received" || kind === "grow_withdraw" ? "in" : "out";
}

function normalizeAddress(value: string, label: string): string {
  if (!ADDRESS_PATTERN.test(value)) {
    throw new SmartWalletActivityStoreError(`Invalid ${label}.`);
  }

  return value.toLowerCase();
}

function normalizeHash(value: string): string {
  if (!TX_HASH_PATTERN.test(value)) {
    throw new SmartWalletActivityStoreError("Invalid transaction hash.");
  }

  return value.toLowerCase();
}

function assertNonNegativeInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new SmartWalletActivityStoreError(`Invalid ${label}.`);
  }
}

function normalizeEvent(
  event: NewSmartWalletActivityEvent,
): NewSmartWalletActivityEvent {
  if (!SMART_WALLET_ACTIVITY_KINDS.includes(event.kind)) {
    throw new SmartWalletActivityStoreError("Invalid activity kind.");
  }

  if (event.direction !== "in" && event.direction !== "out") {
    throw new SmartWalletActivityStoreError("Invalid activity direction.");
  }

  if (event.direction !== expectedDirection(event.kind)) {
    throw new SmartWalletActivityStoreError(
      "Activity kind and direction do not match.",
    );
  }

  if (!RAW_AMOUNT_PATTERN.test(event.rawAmount)) {
    throw new SmartWalletActivityStoreError("Invalid raw USDC amount.");
  }

  assertNonNegativeInteger(event.logIndex, "log index");

  if (event.blockNumber < 0n) {
    throw new SmartWalletActivityStoreError("Invalid block number.");
  }

  if (Number.isNaN(event.blockTimestamp.getTime())) {
    throw new SmartWalletActivityStoreError("Invalid block timestamp.");
  }

  return {
    userId: event.userId,
    smartWalletAddress: normalizeAddress(
      event.smartWalletAddress,
      "Smart Wallet address",
    ),
    transactionHash: normalizeHash(event.transactionHash),
    logIndex: event.logIndex,
    blockNumber: event.blockNumber,
    blockTimestamp: event.blockTimestamp,
    direction: event.direction,
    rawAmount: event.rawAmount,
    counterpartyAddress: normalizeAddress(
      event.counterpartyAddress,
      "counterparty address",
    ),
    kind: event.kind,
  };
}

function eventKey(event: Pick<NewSmartWalletActivityEvent, "transactionHash" | "logIndex">): string {
  return `${event.transactionHash}:${event.logIndex}`;
}

function cloneEvent(
  event: StoredSmartWalletActivityEvent,
): StoredSmartWalletActivityEvent {
  return {
    ...event,
    blockTimestamp: new Date(event.blockTimestamp),
    createdAt: new Date(event.createdAt),
  };
}

function mapEventRow(row: EventRow): StoredSmartWalletActivityEvent {
  return {
    id: row.id,
    userId: row.user_id,
    smartWalletAddress: row.smart_wallet_address,
    transactionHash: row.transaction_hash,
    logIndex: row.log_index,
    blockNumber: BigInt(row.block_number),
    blockTimestamp: row.block_timestamp,
    direction: row.direction,
    rawAmount: row.raw_amount,
    counterpartyAddress: row.counterparty_address,
    kind: row.kind,
    createdAt: row.created_at,
  };
}

function mapCursorRow(row: CursorRow): SmartWalletActivityCursor {
  return {
    userId: row.user_id,
    smartWalletAddress: row.smart_wallet_address,
    indexedThroughBlock: BigInt(row.indexed_through_block),
    updatedAt: row.updated_at,
  };
}

function compareNewestFirst(
  left: StoredSmartWalletActivityEvent,
  right: StoredSmartWalletActivityEvent,
): number {
  if (left.blockNumber !== right.blockNumber) {
    return left.blockNumber > right.blockNumber ? -1 : 1;
  }

  return right.logIndex - left.logIndex;
}

function isBeforeCursor(
  event: StoredSmartWalletActivityEvent,
  before: { blockNumber: bigint; logIndex: number },
): boolean {
  if (event.blockNumber !== before.blockNumber) {
    return event.blockNumber < before.blockNumber;
  }

  return event.logIndex < before.logIndex;
}

export function createPostgresSmartWalletActivityStore(): SmartWalletActivityStore {
  return {
    async insertEvents(events) {
      const normalized = events.map(normalizeEvent);
      if (normalized.length === 0) {
        return [];
      }

      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const stored: StoredSmartWalletActivityEvent[] = [];

        for (const event of normalized) {
          const inserted = await client.query<EventRow>(
            `
              INSERT INTO smart_wallet_activity_events (
                user_id,
                smart_wallet_address,
                transaction_hash,
                log_index,
                block_number,
                block_timestamp,
                direction,
                raw_amount,
                counterparty_address,
                kind
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              ON CONFLICT (transaction_hash, log_index) DO NOTHING
              RETURNING ${EVENT_SELECT_COLUMNS}
            `,
            [
              event.userId,
              event.smartWalletAddress,
              event.transactionHash,
              event.logIndex,
              event.blockNumber.toString(),
              event.blockTimestamp,
              event.direction,
              event.rawAmount,
              event.counterpartyAddress,
              event.kind,
            ],
          );

          if (inserted.rows[0]) {
            stored.push(mapEventRow(inserted.rows[0]));
            continue;
          }

          const existing = await client.query<EventRow>(
            `
              SELECT ${EVENT_SELECT_COLUMNS}
              FROM smart_wallet_activity_events
              WHERE transaction_hash = $1 AND log_index = $2
            `,
            [event.transactionHash, event.logIndex],
          );

          if (!existing.rows[0]) {
            throw new SmartWalletActivityStoreError(
              "Activity event conflict could not be loaded.",
            );
          }

          stored.push(mapEventRow(existing.rows[0]));
        }

        await client.query("COMMIT");
        return stored;
      } catch (error) {
        try {
          await client.query("ROLLBACK");
        } catch {
          // The transaction may already be closed.
        }
        throw error;
      } finally {
        client.release();
      }
    },

    async listEventsForUser(input) {
      if (!Number.isInteger(input.limit) || input.limit < 1) {
        throw new SmartWalletActivityStoreError("Invalid activity limit.");
      }

      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const result = input.before
        ? await pool.query<EventRow>(
            `
              SELECT ${EVENT_SELECT_COLUMNS}
              FROM smart_wallet_activity_events
              WHERE user_id = $1
                AND (block_number, log_index) < ($2::bigint, $3)
              ORDER BY block_number DESC, log_index DESC
              LIMIT $4
            `,
            [
              input.userId,
              input.before.blockNumber.toString(),
              input.before.logIndex,
              input.limit,
            ],
          )
        : await pool.query<EventRow>(
            `
              SELECT ${EVENT_SELECT_COLUMNS}
              FROM smart_wallet_activity_events
              WHERE user_id = $1
              ORDER BY block_number DESC, log_index DESC
              LIMIT $2
            `,
            [input.userId, input.limit],
          );

      return result.rows.map(mapEventRow);
    },

    async getCursor(input) {
      const smartWalletAddress = normalizeAddress(
        input.smartWalletAddress,
        "Smart Wallet address",
      );
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const result = await pool.query<CursorRow>(
        `
          SELECT
            user_id,
            smart_wallet_address,
            indexed_through_block::text,
            updated_at
          FROM smart_wallet_activity_cursors
          WHERE user_id = $1 AND smart_wallet_address = $2
        `,
        [input.userId, smartWalletAddress],
      );

      return result.rows[0] ? mapCursorRow(result.rows[0]) : null;
    },

    async advanceCursor(input) {
      if (input.throughBlock < 0n) {
        throw new SmartWalletActivityStoreError("Invalid indexed block.");
      }

      const smartWalletAddress = normalizeAddress(
        input.smartWalletAddress,
        "Smart Wallet address",
      );
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const result = await pool.query<CursorRow>(
        `
          INSERT INTO smart_wallet_activity_cursors (
            user_id,
            smart_wallet_address,
            indexed_through_block,
            updated_at
          )
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (smart_wallet_address) DO UPDATE
            SET
              indexed_through_block = GREATEST(
                smart_wallet_activity_cursors.indexed_through_block,
                EXCLUDED.indexed_through_block
              ),
              updated_at = CASE
                WHEN EXCLUDED.indexed_through_block >
                  smart_wallet_activity_cursors.indexed_through_block
                THEN EXCLUDED.updated_at
                ELSE smart_wallet_activity_cursors.updated_at
              END
          WHERE smart_wallet_activity_cursors.user_id = $1
          RETURNING
            user_id,
            smart_wallet_address,
            indexed_through_block::text,
            updated_at
        `,
        [
          input.userId,
          smartWalletAddress,
          input.throughBlock.toString(),
          input.updatedAt,
        ],
      );

      if (!result.rows[0]) {
        throw new SmartWalletActivityStoreError(
          "Activity cursor does not belong to this user.",
        );
      }

      return mapCursorRow(result.rows[0]);
    },

    async applyGrowClassification(input) {
      const pool = getPool();
      if (!pool) {
        throw new Error("Database is not configured.");
      }

      const depositHashes = [...new Set(
        [...input.depositHashes]
          .map((hash) => hash.trim().toLowerCase())
          .filter((hash) => TX_HASH_PATTERN.test(hash)),
      )];
      const withdrawalHashes = [...new Set(
        [...input.withdrawalHashes]
          .map((hash) => hash.trim().toLowerCase())
          .filter((hash) => TX_HASH_PATTERN.test(hash)),
      )];

      if (depositHashes.length > 0) {
        await pool.query(
          `
            UPDATE smart_wallet_activity_events
            SET kind = 'grow_deposit'
            WHERE user_id = $1
              AND direction = 'out'
              AND transaction_hash = ANY($2::text[])
          `,
          [input.userId, depositHashes],
        );
      }

      if (withdrawalHashes.length > 0) {
        await pool.query(
          `
            UPDATE smart_wallet_activity_events
            SET kind = 'grow_withdraw'
            WHERE user_id = $1
              AND direction = 'in'
              AND transaction_hash = ANY($2::text[])
          `,
          [input.userId, withdrawalHashes],
        );
      }
    },
  };
}

export function createMemorySmartWalletActivityStore(): SmartWalletActivityStore {
  const events = new Map<string, StoredSmartWalletActivityEvent>();
  const cursors = new Map<string, SmartWalletActivityCursor>();

  return {
    async insertEvents(input) {
      const normalized = input.map(normalizeEvent);
      const stored: StoredSmartWalletActivityEvent[] = [];

      for (const event of normalized) {
        const key = eventKey(event);
        const existing = events.get(key);
        if (existing) {
          stored.push(cloneEvent(existing));
          continue;
        }

        const created: StoredSmartWalletActivityEvent = {
          ...event,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };
        events.set(key, created);
        stored.push(cloneEvent(created));
      }

      return stored;
    },

    async listEventsForUser(input) {
      if (!Number.isInteger(input.limit) || input.limit < 1) {
        throw new SmartWalletActivityStoreError("Invalid activity limit.");
      }

      return [...events.values()]
        .filter((event) => event.userId === input.userId)
        .filter((event) => (input.before ? isBeforeCursor(event, input.before) : true))
        .sort(compareNewestFirst)
        .slice(0, input.limit)
        .map(cloneEvent);
    },

    async getCursor(input) {
      const smartWalletAddress = normalizeAddress(
        input.smartWalletAddress,
        "Smart Wallet address",
      );
      const cursor = cursors.get(smartWalletAddress);
      if (!cursor || cursor.userId !== input.userId) {
        return null;
      }

      return { ...cursor, updatedAt: new Date(cursor.updatedAt) };
    },

    async advanceCursor(input) {
      if (input.throughBlock < 0n) {
        throw new SmartWalletActivityStoreError("Invalid indexed block.");
      }

      const smartWalletAddress = normalizeAddress(
        input.smartWalletAddress,
        "Smart Wallet address",
      );
      const existing = cursors.get(smartWalletAddress);
      if (existing && existing.userId !== input.userId) {
        throw new SmartWalletActivityStoreError(
          "Activity cursor does not belong to this user.",
        );
      }

      if (existing && input.throughBlock <= existing.indexedThroughBlock) {
        return { ...existing, updatedAt: new Date(existing.updatedAt) };
      }

      const updated: SmartWalletActivityCursor = {
        userId: input.userId,
        smartWalletAddress,
        indexedThroughBlock: input.throughBlock,
        updatedAt: input.updatedAt,
      };
      cursors.set(smartWalletAddress, updated);
      return { ...updated, updatedAt: new Date(updated.updatedAt) };
    },

    async applyGrowClassification(input) {
      const depositHashes = new Set(
        [...input.depositHashes]
          .map((hash) => hash.trim().toLowerCase())
          .filter((hash) => TX_HASH_PATTERN.test(hash)),
      );
      const withdrawalHashes = new Set(
        [...input.withdrawalHashes]
          .map((hash) => hash.trim().toLowerCase())
          .filter((hash) => TX_HASH_PATTERN.test(hash)),
      );

      for (const [key, event] of events) {
        if (event.userId !== input.userId) {
          continue;
        }

        if (
          event.direction === "out" &&
          depositHashes.has(event.transactionHash)
        ) {
          events.set(key, { ...event, kind: "grow_deposit" });
          continue;
        }

        if (
          event.direction === "in" &&
          withdrawalHashes.has(event.transactionHash)
        ) {
          events.set(key, { ...event, kind: "grow_withdraw" });
        }
      }
    },
  };
}
