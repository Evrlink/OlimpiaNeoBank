-- Phase 4: Add money — deposits + webhook idempotency
-- See docs/DatabaseSchema.md, docs/architecture/Architecture.md §6

CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_usd numeric(18, 2) NOT NULL CHECK (amount_usd > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  bridge_intent_id text,
  payment_method text,
  idempotency_key text,
  failure_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS deposits_user_idempotency_key_uidx
  ON deposits (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS deposits_bridge_intent_id_uidx
  ON deposits (bridge_intent_id)
  WHERE bridge_intent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS deposits_user_id_created_at_idx
  ON deposits (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT webhook_events_provider_event_id_key UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS webhook_events_provider_created_at_idx
  ON webhook_events (provider, created_at DESC);
