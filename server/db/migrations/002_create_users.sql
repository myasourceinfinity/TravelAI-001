-- ============================================================
-- Migration 002: users table
-- Core identity table. password_hash is nullable for OAuth users.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name      VARCHAR(100)  NOT NULL,
  last_name       VARCHAR(100),
  email           VARCHAR(255)  NOT NULL UNIQUE,
  phone           VARCHAR(30),
  password_hash   TEXT,                               -- NULL for Google OAuth users
  role_type       user_role     NOT NULL DEFAULT 'traveler',
  status          user_status   NOT NULL DEFAULT 'pending',
  auth_provider   VARCHAR(30)   NOT NULL DEFAULT 'local', -- 'local' | 'google'
  provider_id     VARCHAR(255),                       -- Google sub claim
  email_verified  BOOLEAN       NOT NULL DEFAULT FALSE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id) WHERE provider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_status      ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role_type   ON users(role_type);
