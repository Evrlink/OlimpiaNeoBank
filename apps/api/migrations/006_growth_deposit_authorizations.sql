-- Step 3B Stage 3A: unused/authorized Grow deposit authorizations only.
-- These rows never execute a deposit.

CREATE TABLE IF NOT EXISTS growth_deposit_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  privy_user_id text NOT NULL,
  privy_wallet_id text NOT NULL,
  wallet_address text NOT NULL,
  vault_id text NOT NULL,
  amount_usdc numeric(18, 6) NOT NULL CHECK (amount_usdc > 0),
  raw_amount text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  request_expiry timestamptz NOT NULL,
  request_url text NOT NULL,
  request_body jsonb NOT NULL,
  payload_hex text NOT NULL,
  status text NOT NULL CHECK (status IN ('unused', 'authorized')),
  signature text,
  authorized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS growth_deposit_authorizations_user_created_idx
  ON growth_deposit_authorizations (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS growth_deposit_authorizations_privy_user_idx
  ON growth_deposit_authorizations (privy_user_id, created_at DESC);
