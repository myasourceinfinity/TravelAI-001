-- Migration: bookings table — the final reservation confirmation step.
-- Run this in pgAdmin before deploying the booking engine.

CREATE TABLE IF NOT EXISTS bookings (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id),
  trip_id                UUID REFERENCES trips(id) ON DELETE SET NULL,

  confirmation_code      TEXT NOT NULL UNIQUE,
  status                 VARCHAR(20) NOT NULL DEFAULT 'pending_payment'
                           CHECK (status IN ('pending_payment', 'confirmed', 'cancelled')),

  -- Snapshot of the trip at the moment of booking — kept even if the
  -- underlying trip is later edited or deleted.
  destination            TEXT,
  origin_city            TEXT,
  depart_date            DATE,
  return_date            DATE,
  travelers              INT NOT NULL DEFAULT 1,

  selected_components    JSONB NOT NULL DEFAULT '[]',
  total_price_per_person DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price_all        DECIMAL(10,2) NOT NULL DEFAULT 0,

  traveler_name          TEXT,
  traveler_email         TEXT,
  traveler_phone         TEXT,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings (trip_id);
