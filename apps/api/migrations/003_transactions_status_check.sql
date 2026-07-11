-- Constrain transaction status to Architecture §21 canonical states.
ALTER TABLE transactions
  ADD CONSTRAINT transactions_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
