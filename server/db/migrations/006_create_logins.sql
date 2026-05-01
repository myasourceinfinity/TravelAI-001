-- ============================================================
-- Migration 006: logins table
-- Active session tracking. One row is created per issued JWT.
-- session_token stores a SHA-256 hash of the raw token (never
-- store the raw JWT in the DB).
-- ============================================================

CREATE TABLE IF NOT EXISTS logins (
  id              BIGSERIAL     PRIMARY KEY,
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token   TEXT          NOT NULL UNIQUE,  -- SHA-256(raw_jwt)
  ip_address      INET,
  user_agent      TEXT,
  issued_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ   NOT NULL,
  revoked         BOOLEAN       NOT NULL DEFAULT FALSE,
  revoked_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_logins_user_id       ON logins(user_id);
CREATE INDEX IF NOT EXISTS idx_logins_session_token ON logins(session_token);
CREATE INDEX IF NOT EXISTS idx_logins_expires_at    ON logins(expires_at);

-- Partial index: only active (non-revoked) sessions
CREATE INDEX IF NOT EXISTS idx_logins_active
  ON logins(user_id, expires_at)
  WHERE revoked = FALSE;
