-- ============================================================
-- Migration 014: add specialties to user_profiles
-- Stores an agent's specialty tags as a JSONB array.
-- e.g. ["Luxury", "Adventure", "Cultural"]
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS specialties JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_user_profiles_specialties
  ON user_profiles USING gin(specialties);
