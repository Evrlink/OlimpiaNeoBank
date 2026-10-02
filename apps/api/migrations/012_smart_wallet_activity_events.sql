-- 3F.1: durable Smart Wallet USDC activity events + a separate indexing cursor.
-- This migration does not backfill or change GET /api/v1/activity.

CREATE TABLE IF NOT EXISTS smart_wallet_activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  smart_wallet_address text NOT NULL
    CHECK (smart_wallet_address ~ '^0x[0-9a-f]{40}$'),
  transaction_hash text NOT NULL
    CHECK (transaction_hash ~ '^0x[0-9a-f]{64}$'),
  log_index integer NOT NULL CHECK (log_index >= 0),
  block_number bigint NOT NULL CHECK (block_number >= 0),
  block_timestamp timestamptz NOT NULL,
  direction text NOT NULL CHECK (direction IN ('in', 'out')),
  raw_amount text NOT NULL CHECK (raw_amount ~ '^[0-9]+$'),
  counterparty_address text NOT NULL
    CHECK (counterparty_address ~ '^0x[0-9a-f]{40}$'),
  kind text NOT NULL CHECK (
    kind IN ('received', 'sent', 'grow_deposit', 'grow_withdraw')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT smart_wallet_activity_events_log_unique
    UNIQUE (transaction_hash, log_index),
  CONSTRAINT smart_wallet_activity_events_kind_direction_check
    CHECK (
      (kind IN ('received', 'grow_withdraw') AND direction = 'in')
      OR (kind IN ('sent', 'grow_deposit') AND direction = 'out')
    )
);

CREATE INDEX IF NOT EXISTS smart_wallet_activity_events_user_newest_idx
  ON smart_wallet_activity_events (user_id, block_number DESC, log_index DESC);

-- Checkpoint is a separate table so an event insert cannot advance indexing progress.
CREATE TABLE IF NOT EXISTS smart_wallet_activity_cursors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  smart_wallet_address text NOT NULL
    CHECK (smart_wallet_address ~ '^0x[0-9a-f]{40}$'),
  indexed_through_block bigint NOT NULL CHECK (indexed_through_block >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT smart_wallet_activity_cursors_wallet_unique
    UNIQUE (smart_wallet_address)
);

CREATE INDEX IF NOT EXISTS smart_wallet_activity_cursors_user_idx
  ON smart_wallet_activity_cursors (user_id);
