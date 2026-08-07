-- Rename Bridge-specific deposit reference to provider-neutral column.
-- See docs/MVPLaunchChecklist.md P0 — Remove legacy Bridge funding.

ALTER TABLE deposits
  RENAME COLUMN bridge_intent_id TO provider_transaction_id;

DROP INDEX IF EXISTS deposits_bridge_intent_id_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS deposits_provider_transaction_id_uidx
  ON deposits (provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;
