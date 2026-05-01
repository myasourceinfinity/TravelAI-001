-- ============================================================
-- Migration 005: audit_logs table
-- Records all security-relevant events: failed logins,
-- successful logins, logouts, signup attempts, suspensions.
-- user_id is nullable to capture pre-auth failures.
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL     PRIMARY KEY,
  user_id     UUID          REFERENCES users(id) ON DELETE SET NULL, -- nullable: pre-auth failures
  event_type  VARCHAR(50)   NOT NULL,  -- 'login_failed' | 'login_success' | 'logout' | 'signup'
  ip_address  INET,
  user_agent  TEXT,
  metadata    JSONB         NOT NULL DEFAULT '{}',  -- e.g. {"reason":"bad_password","email":"x@x.com"}
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
