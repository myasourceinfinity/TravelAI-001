-- ============================================================
-- Seed 001: Bootstrap superadmin account
--
-- BEFORE RUNNING:
--   Replace '$2b$12$REPLACE_WITH_BCRYPT_HASH' with a real bcrypt
--   hash. Generate one with:
--     cd "server" && node -e "const b=require('bcrypt'); b.hash('TravelAIPassword123!',12).then(h => console.log(h))"
--
-- This seed is idempotent — safe to re-run.
-- ============================================================

INSERT INTO users (
  first_name, last_name, email, password_hash,
  role_type, status, auth_provider, email_verified
)
SELECT
  'Mia', 'Super Admin',
  'mia.superadmin@travelai.co.nz',
  '$2b$12$A1Iwr30seuM.F4Z6l2daLOAIP.QIxrpQWZNo5i03.IEzZ1JOWfGiO',
  'superadmin', 'active', 'local', TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'mia.superadmin@travelai.co.nz'
);

-- Ensure companion rows exist in 1-to-1 tables
INSERT INTO user_profiles (user_id)
  SELECT id FROM users WHERE email = 'mia.superadmin@travelai.co.nz'
  ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_preferences (user_id)
  SELECT id FROM users WHERE email = 'mia.superadmin@travelai.co.nz'
  ON CONFLICT (user_id) DO NOTHING;
