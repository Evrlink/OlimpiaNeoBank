-- Phase 2: user balance buckets initialized at auth sync

CREATE TABLE IF NOT EXISTS user_balances (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  available_usd numeric(18, 2) NOT NULL DEFAULT 0,
  goals_allocated_usd numeric(18, 2) NOT NULL DEFAULT 0,
  growth_allocated_usd numeric(18, 2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
