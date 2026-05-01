-- ============================================================
-- Migration 001: Custom ENUM types
-- These must be created before any tables that reference them.
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'traveler',
    'agent',
    'admin',
    'useradmin',
    'superadmin',
    'support'
  );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'user_role already exists, skipping.';
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM (
    'active',
    'suspended',
    'pending',
    'deleted'
  );
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'user_status already exists, skipping.';
END $$;
