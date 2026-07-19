-- Add to existing trips table
ALTER TABLE trips ADD COLUMN selected_components JSONB DEFAULT '[]';
ALTER TABLE trips ADD COLUMN total_price_per_person DECIMAL(10,2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN total_price_all DECIMAL(10,2) DEFAULT 0;
ALTER TABLE trips ADD COLUMN selected_package_ids JSONB DEFAULT '[]';

-- No new tables needed — components saved as JSONB snapshot
-- (agent package prices can change later, we preserve what user selected at booking time)