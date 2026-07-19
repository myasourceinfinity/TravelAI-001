-- Migration: add origin city + travel dates to trips table
-- Required for flight search (bookingController.js needs an origin airport)

ALTER TABLE trips ADD COLUMN IF NOT EXISTS origin_city TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS depart_date DATE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS return_date DATE;
