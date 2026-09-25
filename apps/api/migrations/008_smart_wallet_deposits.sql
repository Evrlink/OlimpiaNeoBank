-- 3C.3: track Smart Wallet Aave deposit plans. Rows never send a transaction.
CREATE TABLE IF NOT EXISTS smart_wallet_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  privy_user_id text NOT NULL,
  smart_wallet_address text NOT NULL,
  amount_usdc numeric(18, 6) NOT NULL CHECK (amount_usdc > 0),
  raw_amount text NOT NULL,
  calls jsonb NOT NULL,
  status text NOT NULL CHECK (status IN ('prepared', 'submitted', 'confirmed', 'failed')),
  transaction_hash text,
  failure_reason text,
  expires_at timestamptz NOT NULL,
  submitted_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT smart_wallet_deposits_hash_unique UNIQUE (transaction_hash)
);

CREATE UNIQUE INDEX IF NOT EXISTS smart_wallet_deposits_user_open_uidx
  ON smart_wallet_deposits (user_id)
  WHERE status IN ('prepared', 'submitted');

CREATE INDEX IF NOT EXISTS smart_wallet_deposits_user_created_idx
  ON smart_wallet_deposits (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS smart_wallet_deposits_privy_user_idx
  ON smart_wallet_deposits (privy_user_id, created_at DESC);
