-- ============================================================
-- Migration 007: password_resets table
-- Stores hashed reset tokens with 1-hour expiry.
-- Raw token is emailed to user; only SHA-256 hash is stored.
-- ============================================================

CREATE TABLE IF NOT EXISTS password_resets (
  id          BIGSERIAL    PRIMARY KEY,
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT         NOT NULL,
  expires_at  TIMESTAMPTZ  NOT NULL,
  used        BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_user  ON password_resets(user_id);
