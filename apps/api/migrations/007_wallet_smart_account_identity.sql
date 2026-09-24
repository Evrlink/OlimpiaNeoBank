-- Stage 1: persist Coinbase/Privy smart-wallet identity alongside the EOA.
-- Do not overwrite wallets.address or privy_wallet_id.
-- money_address_mode defaults to eoa so the EOA remains the money address.

ALTER TABLE wallets
  ADD COLUMN IF NOT EXISTS smart_wallet_address text,
  ADD COLUMN IF NOT EXISTS smart_wallet_type text,
  ADD COLUMN IF NOT EXISTS money_address_mode text NOT NULL DEFAULT 'eoa';

ALTER TABLE wallets
  DROP CONSTRAINT IF EXISTS wallets_money_address_mode_check;

ALTER TABLE wallets
  ADD CONSTRAINT wallets_money_address_mode_check
  CHECK (money_address_mode IN ('eoa', 'smart_wallet'));
