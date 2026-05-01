-- ============================================================
-- Migration 003: user_profiles table
-- 1-to-1 extension of users. Stores personal/demographic data.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id          BIGSERIAL     PRIMARY KEY,
  user_id     UUID          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  dob         DATE,
  nationality VARCHAR(100),
  avatar_url  TEXT,
  bio         TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
