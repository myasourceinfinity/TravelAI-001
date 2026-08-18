-- ============================================================
-- Seed demo users
-- Login password for both accounts: Password123!
-- ============================================================

WITH demo_users AS (
  SELECT *
  FROM (
    VALUES
      (
        'Emerald',
        'Lwyn',
        'myathuzarlwyn@gmail.com',
        'traveler'
      ),
      (
        'Mya',
        'Source Infinity',
        'mya.sourceinfinity@gmail.com',
        'agent'
      )
  ) AS t(first_name, last_name, email, role_type)
),
upserted_users AS (
  INSERT INTO users (
    first_name,
    last_name,
    email,
    phone,
    password_hash,
    role_type,
    status,
    auth_provider,
    email_verified
  )
  SELECT
    first_name,
    last_name,
    email,
    NULL,
    '$2b$12$r.jURJzUcG8fRNXAbxl0z.TesLCNjElnsmKQksN3Eux2e.0MsCoBO',
    role_type::user_role,
    'active',
    'local',
    TRUE
  FROM demo_users
  ON CONFLICT (email) DO UPDATE
  SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role_type = EXCLUDED.role_type,
    status = 'active',
    auth_provider = 'local',
    email_verified = TRUE
  RETURNING id, email, role_type
)

-- Create user profiles if missing
INSERT INTO user_profiles (
  user_id,
  nationality
)
SELECT
  id,
  NULL
FROM upserted_users u
WHERE NOT EXISTS (
  SELECT 1
  FROM user_profiles p
  WHERE p.user_id = u.id
);

-- Create user preferences if missing
INSERT INTO user_preferences (
  user_id,
  budget_amount,
  currency,
  destination,
  location_types
)
SELECT
  u.id,
  NULL,
  'NZD',
  NULL,
  '[]'::jsonb
FROM users u
WHERE u.email IN (
  'myathuzarlwyn@gmail.com',
  'mya.sourceinfinity@gmail.com'
)
AND NOT EXISTS (
  SELECT 1
  FROM user_preferences pref
  WHERE pref.user_id = u.id
);