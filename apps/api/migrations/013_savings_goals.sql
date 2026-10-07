-- V1 My Goal: one informational target per user.
-- This is not a balance, allocation, or yield position.

CREATE TABLE IF NOT EXISTS savings_goals (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  target_amount_usd numeric(18, 2) NOT NULL CHECK (target_amount_usd > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
