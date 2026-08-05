-- ============================================================
-- Migration: Agent Packages Marketplace
-- Run this in pgAdmin on TravelAI_DB
-- ============================================================

-- Drop dependent tables first to avoid dependency issues
DROP TABLE IF EXISTS agent_package_components CASCADE;
DROP TABLE IF EXISTS agent_packages CASCADE;

-- 1. Master packages table
CREATE TABLE agent_packages (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL,
    provider_type VARCHAR(20) NOT NULL,
    destination_name VARCHAR(255) NOT NULL,
    package_name VARCHAR(255) NOT NULL,
    package_type VARCHAR(20) NOT NULL,
    travel_mode VARCHAR(50),
    summary TEXT,
    description TEXT,
    duration_days INT,
    duration_nights INT,
    base_price DECIMAL(12, 2),
    currency_code CHAR(3) DEFAULT 'USD',
    platform_service_fee_type VARCHAR(20), -- flat/percentage
    platform_service_fee_value DECIMAL(12, 2),
    min_travelers INT DEFAULT 1,
    max_travelers INT,
    is_customizable BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'draft',
    is_active BOOLEAN NOT NULL DEFAULT true,
    featured_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Package components (hotel / flight / activity / transfer)
CREATE TABLE agent_package_components (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id       BIGINT      NOT NULL REFERENCES agent_packages(id) ON DELETE CASCADE,
  component_type   VARCHAR(20) NOT NULL CHECK (component_type IN ('hotel','flight','activity','transfer')),
  title            TEXT        NOT NULL,
  description      TEXT,
  provider         TEXT,                 -- e.g. "Air New Zealand", "Hilton Auckland"
  price_per_person DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_included      BOOLEAN     NOT NULL DEFAULT true,  -- true = in base price, false = add-on
  sort_order       INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_packages_destination
  ON agent_packages (LOWER(destination_name));

CREATE INDEX IF NOT EXISTS idx_agent_package_components_package
  ON agent_package_components (package_id);

-- ============================================================
-- SEED DATA — 3 demo packages
-- ============================================================

-- Package 1: Auckland 7-Day Explorer
INSERT INTO agent_packages (
  id, provider_id, provider_type, destination_name, package_name, package_type, travel_mode, summary, description, 
  duration_days, duration_nights, base_price, currency_code, platform_service_fee_type, platform_service_fee_value, 
  min_travelers, max_travelers, is_customizable, status, is_active, featured_until, created_at, updated_at
) VALUES (
  1,
  2,
  'Agent',
  'Auckland',
  'Auckland 7-Days Explorer Budget Plan',
  'Budget 7-Days',
  'Air',
  'A complete Auckland experience covering the city highlights, Waiheke Island wine trail, and the stunning Coromandel Peninsula. Flights, accommodation, and select activities included.',
  'Auckland 7-Day trip with Flights, accommodation, and select activities included.',
  7,
  6,
  1299.00,
  'NZD',
  'percentage',
  20.00,
  1,
  10,
  false,
  'active',
  true,
  '2026-09-30 23:59:59',
  NOW(),
  NOW()
);

INSERT INTO agent_package_components (package_id, component_type, title, description, provider, price_per_person, is_included, sort_order)
VALUES
  (1, 'flight',   'Auckland Return Flights',         'Return economy flights from Christchurch to Auckland',              'Air New Zealand',   320.00, true,  1),
  (1, 'hotel',    'Hilton Auckland (4 nights)',       'Superior room with harbour view, breakfast included',               'Hilton Auckland',   480.00, true,  2),
  (1, 'hotel',    'Waiheke Island Boutique Stay (2 nights)', 'Charming vineyard cottage, breakfast included',              'The Boatshed',      220.00, true,  3),
  (1, 'activity', 'Auckland Sky Tower Entry',         'Express entry to Sky Tower with glass floor experience',            'Sky Tower',          35.00, true,  4),
  (1, 'activity', 'Waiheke Wine Trail Tour',          'Full-day guided tour visiting 4 boutique wineries',                 'Waiheke Winery Co', 120.00, true,  5),
  (1, 'transfer', 'Airport Transfers (Return)',       'Private vehicle transfers between Auckland Airport and hotel',       'NZ Transfers',       80.00, true,  6),
  (1, 'activity', 'Auckland Harbour Sailing Cruise',  'Sunset sailing cruise on the Waitemata Harbour (optional add-on)',  'Sail Auckland',      95.00, false, 7);


-- Package 2: Rotorua Geothermal Weekend
INSERT INTO agent_packages (
  id, provider_id, provider_type, destination_name, package_name, package_type, travel_mode, summary, description, 
  duration_days, duration_nights, base_price, currency_code, platform_service_fee_type, platform_service_fee_value, 
  min_travelers, max_travelers, is_customizable, status, is_active, featured_until, created_at, updated_at
) VALUES (
  2,
  2,
  'Agent',
  'Rotorua',
  'Rotorua Geothermal Weekend Mid-Range Plan',
  'Mid-Range 3-Days',
  'Air',
  'Immerse yourself in Rotorua''s famous geothermal wonders, Maori culture, and lush redwood forests. Perfect long-weekend escape from Auckland.',
  'A complete Rotorua Geothermal Weekend trip covering geothermal wonders, culture and forest walk.',
  3,
  2,
  649.00,
  'NZD',
  'percentage',
  20.00,
  1,
  10,
  false,
  'active',
  true,
  '2026-10-30 23:59:59',
  NOW(),
  NOW()
);

INSERT INTO agent_package_components (package_id, component_type, title, description, provider, price_per_person, is_included, sort_order)
VALUES
  (2, 'transfer', 'Auckland to Rotorua Coach Transfer','Comfortable coach service with scenic stops',                       'InterCity',          55.00, true,  1),
  (2, 'hotel',    'Sudima Rotorua (2 nights)',         'Geothermal spa hotel, room with natural hot spring access',          'Sudima Hotels',     240.00, true,  2),
  (2, 'activity', 'Te Puia Geothermal & Maori Culture','Guided tour of Te Puia, geyser viewing, and hangi dinner',           'Te Puia',           145.00, true,  3),
  (2, 'activity', 'Redwoods Treewalk',                 'Illuminated night walk through the ancient Whakarewarewa forest',    'Redwoods',           45.00, true,  4),
  (2, 'activity', 'Wai-O-Tapu Thermal Wonderland',    'Self-guided tour of New Zealand''s most colourful geothermal park',  'Wai-O-Tapu',         40.00, false, 5),
  (2, 'activity', 'White Water Rafting — Kaituna River','Grade 5 rafting over the highest commercially rafted waterfall',    'Kaituna Cascades',   99.00, false, 6);


-- Package 3: NZ North Island Grand Tour
INSERT INTO agent_packages (
  id, provider_id, provider_type, destination_name, package_name, package_type, travel_mode, summary, description, 
  duration_days, duration_nights, base_price, currency_code, platform_service_fee_type, platform_service_fee_value, 
  min_travelers, max_travelers, is_customizable, status, is_active, featured_until, created_at, updated_at
) VALUES (
  3,
  2,
  'Agent',
  'Wellington',
  'NZ North Island Grand Tour Mid-Range Plan',
  'Mid-Range 10-Days',
  'Air',
  'The ultimate North Island experience: Auckland city, Rotorua geothermals, Tongariro Alpine Crossing, Tauranga beaches, and Wellington''s vibrant arts scene. All-inclusive.',
  'The ultimate 10-day North Island experience with hotels, transport, and premium activities.',
  10,
  9,
  2499.00,
  'NZD',
  'percentage',
  20.00,
  1,
  10,
  false,
  'active',
  true,
  '2026-11-30 23:59:59',
  NOW(),
  NOW()
);

INSERT INTO agent_package_components (package_id, component_type, title, description, provider, price_per_person, is_included, sort_order)
VALUES
  (3, 'flight',   'International Return Flights',          'Return economy flights ex-Sydney to Auckland, Wellington to Sydney','Air New Zealand',   850.00, true,  1),
  (3, 'hotel',    'Auckland — Cordis Hotel (2 nights)',     '5-star luxury in central Auckland, breakfast included',             'Cordis Auckland',   380.00, true,  2),
  (3, 'hotel',    'Rotorua — Pullman Hotel (2 nights)',     'Contemporary hotel near geothermal attractions',                    'Pullman Rotorua',   280.00, true,  3),
  (3, 'hotel',    'Taupo — Huka Lodge (1 night)',           'New Zealand''s most iconic luxury lodge on the Waikato River',     'Huka Lodge',        420.00, true,  4),
  (3, 'hotel',    'Wellington — InterContinental (2 nights)','Harbourside luxury with stunning views',                           'InterContinental',  360.00, true,  5),
  (3, 'activity', 'Tongariro Alpine Crossing — Guided',     'New Zealand''s best 1-day hike with certified mountain guide',      'Adventure HQ',      180.00, true,  6),
  (3, 'activity', 'Hobbiton Movie Set Tour',                'Guided tour of the original Hobbiton film set in Matamata',         'Hobbiton Tours',    120.00, true,  7),
  (3, 'transfer', 'All Inter-City Transfers',               'Private vehicle between all destinations throughout the tour',      'NZ Transfers',      220.00, true,  8),
  (3, 'activity', 'Wellington Food & Culture Tour',         'Half-day guided walking tour of Wellington''s best eateries',       'Taste Wellington',   85.00, false, 9),
  (3, 'activity', 'Skydive over Lake Taupo',                'Tandem skydive from 15,000ft with panoramic volcanic views',         'Skydive Taupo',     299.00, false,10);

-- Adjust the sequence value to prevent auto-increment conflicts later
SELECT setval('agent_packages_id_seq', (SELECT MAX(id) FROM agent_packages));
