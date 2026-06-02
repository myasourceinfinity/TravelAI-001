-- ============================================================
-- Migration 009: trips table additions for plan modification
-- ============================================================

-- Track whether user has modified the AI-generated plan
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS is_modified BOOLEAN NOT NULL DEFAULT FALSE;

-- Version counter — increments on every PUT /api/trips/:id
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Add budget_level constraint
ALTER TABLE trips
  DROP CONSTRAINT IF EXISTS chk_budget_level;
ALTER TABLE trips
  ADD CONSTRAINT chk_budget_level
  CHECK (budget_level IN ('budget', 'moderate', 'luxury'));

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trips_updated_at ON trips;
CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();