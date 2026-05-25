-- ============================================================
-- Migration 008: trips and destinations tables
-- Store AI generated trips and their destinations
-- ============================================================

CREATE TABLE IF NOT EXISTS trips (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(255),
  summary         TEXT,
  start_city      VARCHAR(100),
  travelers       INT           DEFAULT 1,
  days            INT           DEFAULT 1,
  budget_level    VARCHAR(50),
  suggestions     JSONB,        -- Stores alternative destinations
  status          VARCHAR(50)   NOT NULL DEFAULT 'saved',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS destinations (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id         UUID          NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  destination_id  VARCHAR(100), -- String ID from AI like 'auckland'
  name            VARCHAR(255)  NOT NULL,
  country         VARCHAR(100),
  lat             DECIMAL(10,6),
  lng             DECIMAL(10,6),
  emoji           VARCHAR(10),
  highlights      JSONB,        -- Array of strings
  bookme_deals    JSONB,        -- Array of deal objects
  sort_order      INT           NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_destinations_trip_id ON destinations(trip_id);
