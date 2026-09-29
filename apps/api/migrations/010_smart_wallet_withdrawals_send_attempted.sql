-- 3D send-attempt lock. Additive only. Does not alter deposits, users, or wallets.
ALTER TABLE smart_wallet_withdrawals
  ADD COLUMN IF NOT EXISTS send_attempted_at timestamptz;
