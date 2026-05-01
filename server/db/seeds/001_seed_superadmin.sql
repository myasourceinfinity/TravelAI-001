-- ============================================================
-- Seed 001: Bootstrap superadmin account
--
-- BEFORE RUNNING:
--   Replace '$2b$12$REPLACE_WITH_BCRYPT_HASH' with a real bcrypt
--   hash. Generate one with:
--     node -e "const b=require('bcrypt'); b.hash('YourPassword123!',12).then(console.log)"
--
-- This seed is idempotent — safe to re-run.
-- ============================================================

INSERT INTO users (
  first_name, last_name, email, password_hash,
  role_type, status, auth_provider, email_verified
)
SELECT
  'Super', 'Admin',
  'superadmin@miatravelai.com',
  '$2b$12$REPLACE_WITH_BCRYPT_HASH',
  'superadmin', 'active', 'local', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'superadmin@miatravelai.com'
);

-- Ensure companion rows exist in 1-to-1 tables
INSERT INTO user_profiles (user_id)
  SELECT id FROM users WHERE email = 'superadmin@miatravelai.com'
  ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_preferences (user_id)
  SELECT id FROM users WHERE email = 'superadmin@miatravelai.com'
  ON CONFLICT (user_id) DO NOTHING;
