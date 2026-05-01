-- ============================================================
-- Migration 004: user_preferences table
-- 1-to-1 extension of users. Stores Phase 1 signup data +
-- future AI-generated travel preference blobs.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id              BIGSERIAL       PRIMARY KEY,
  user_id         UUID            NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  budget_amount   NUMERIC(12, 2),
  currency        VARCHAR(10)     DEFAULT 'USD',
  destination     VARCHAR(255),
  location_types  JSONB           NOT NULL DEFAULT '[]', -- e.g. ["Beach","Mountain","City"]
  travel_style    JSONB           NOT NULL DEFAULT '{}', -- extensible AI preference blob
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- GIN index for fast JSONB queries on location_types
CREATE INDEX IF NOT EXISTS idx_user_preferences_location_types
  ON user_preferences USING GIN (location_types);
