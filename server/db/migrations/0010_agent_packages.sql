-- ============================================================
-- Migration: Agent Packages Marketplace
-- Run this in pgAdmin on TravelAI_DB
-- ============================================================

-- 1. Master packages table
CREATE TABLE IF NOT EXISTS agent_packages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name     TEXT        NOT NULL,
  destination_name TEXT        NOT NULL,  -- matched against trip destinations (case-insensitive)
  country          TEXT,
  duration_days    INT,
  price_per_person DECIMAL(10,2),
  currency         VARCHAR(3)  NOT NULL DEFAULT 'NZD',
  description      TEXT,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Package components (hotel / flight / activity / transfer)
CREATE TABLE IF NOT EXISTS agent_package_components (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id       UUID        NOT NULL REFERENCES agent_packages(id) ON DELETE CASCADE,
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
INSERT INTO agent_packages (id, package_name, destination_name, country, duration_days, price_per_person, description)
VALUES (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'Auckland 7-Day Explorer',
  'Auckland',
  'New Zealand',
  7,
  1299.00,
  'A complete Auckland experience covering the city highlights, Waiheke Island wine trail, and the stunning Coromandel Peninsula. Flights, accommodation, and select activities included.'
);

INSERT INTO agent_package_components (package_id, component_type, title, description, provider, price_per_person, is_included, sort_order)
VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001','flight',   'Auckland Return Flights',         'Return economy flights from Christchurch to Auckland',              'Air New Zealand',   320.00, true,  1),
  ('aaaaaaaa-0001-0001-0001-000000000001','hotel',    'Hilton Auckland (4 nights)',       'Superior room with harbour view, breakfast included',               'Hilton Auckland',   480.00, true,  2),
  ('aaaaaaaa-0001-0001-0001-000000000001','hotel',    'Waiheke Island Boutique Stay (2 nights)', 'Charming vineyard cottage, breakfast included',              'The Boatshed',      220.00, true,  3),
  ('aaaaaaaa-0001-0001-0001-000000000001','activity', 'Auckland Sky Tower Entry',         'Express entry to Sky Tower with glass floor experience',            'Sky Tower',          35.00, true,  4),
  ('aaaaaaaa-0001-0001-0001-000000000001','activity', 'Waiheke Wine Trail Tour',          'Full-day guided tour visiting 4 boutique wineries',                 'Waiheke Winery Co', 120.00, true,  5),
  ('aaaaaaaa-0001-0001-0001-000000000001','transfer', 'Airport Transfers (Return)',       'Private vehicle transfers between Auckland Airport and hotel',       'NZ Transfers',       80.00, true,  6),
  ('aaaaaaaa-0001-0001-0001-000000000001','activity', 'Auckland Harbour Sailing Cruise',  'Sunset sailing cruise on the Waitemata Harbour (optional add-on)',  'Sail Auckland',      95.00, false, 7);


-- Package 2: Rotorua Geothermal Weekend
INSERT INTO agent_packages (id, package_name, destination_name, country, duration_days, price_per_person, description)
VALUES (
  'bbbbbbbb-0002-0002-0002-000000000002',
  'Rotorua Geothermal Weekend',
  'Rotorua',
  'New Zealand',
  3,
  649.00,
  'Immerse yourself in Rotorua''s famous geothermal wonders, Maori culture, and lush redwood forests. Perfect long-weekend escape from Auckland.'
);

INSERT INTO agent_package_components (package_id, component_type, title, description, provider, price_per_person, is_included, sort_order)
VALUES
  ('bbbbbbbb-0002-0002-0002-000000000002','transfer', 'Auckland to Rotorua Coach Transfer','Comfortable coach service with scenic stops',                       'InterCity',          55.00, true,  1),
  ('bbbbbbbb-0002-0002-0002-000000000002','hotel',    'Sudima Rotorua (2 nights)',         'Geothermal spa hotel, room with natural hot spring access',          'Sudima Hotels',     240.00, true,  2),
  ('bbbbbbbb-0002-0002-0002-000000000002','activity', 'Te Puia Geothermal & Maori Culture','Guided tour of Te Puia, geyser viewing, and hangi dinner',           'Te Puia',           145.00, true,  3),
  ('bbbbbbbb-0002-0002-0002-000000000002','activity', 'Redwoods Treewalk',                 'Illuminated night walk through the ancient Whakarewarewa forest',    'Redwoods',           45.00, true,  4),
  ('bbbbbbbb-0002-0002-0002-000000000002','activity', 'Wai-O-Tapu Thermal Wonderland',    'Self-guided tour of New Zealand''s most colourful geothermal park',  'Wai-O-Tapu',         40.00, false, 5),
  ('bbbbbbbb-0002-0002-0002-000000000002','activity', 'White Water Rafting — Kaituna River','Grade 5 rafting over the highest commercially rafted waterfall',    'Kaituna Cascades',   99.00, false, 6);


-- Package 3: NZ North Island Grand Tour
INSERT INTO agent_packages (id, package_name, destination_name, country, duration_days, price_per_person, description)
VALUES (
  'cccccccc-0003-0003-0003-000000000003',
  'NZ North Island Grand Tour',
  'Wellington',
  'New Zealand',
  10,
  2499.00,
  'The ultimate North Island experience: Auckland city, Rotorua geothermals, Tongariro Alpine Crossing, Tauranga beaches, and Wellington''s vibrant arts scene. All-inclusive.'
);

INSERT INTO agent_package_components (package_id, component_type, title, description, provider, price_per_person, is_included, sort_order)
VALUES
  ('cccccccc-0003-0003-0003-000000000003','flight',   'International Return Flights',          'Return economy flights ex-Sydney to Auckland, Wellington to Sydney','Air New Zealand',   850.00, true,  1),
  ('cccccccc-0003-0003-0003-000000000003','hotel',    'Auckland — Cordis Hotel (2 nights)',     '5-star luxury in central Auckland, breakfast included',             'Cordis Auckland',   380.00, true,  2),
  ('cccccccc-0003-0003-0003-000000000003','hotel',    'Rotorua — Pullman Hotel (2 nights)',     'Contemporary hotel near geothermal attractions',                    'Pullman Rotorua',   280.00, true,  3),
  ('cccccccc-0003-0003-0003-000000000003','hotel',    'Taupo — Huka Lodge (1 night)',           'New Zealand''s most iconic luxury lodge on the Waikato River',     'Huka Lodge',        420.00, true,  4),
  ('cccccccc-0003-0003-0003-000000000003','hotel',    'Wellington — InterContinental (2 nights)','Harbourside luxury with stunning views',                           'InterContinental',  360.00, true,  5),
  ('cccccccc-0003-0003-0003-000000000003','activity', 'Tongariro Alpine Crossing — Guided',     'New Zealand''s best 1-day hike with certified mountain guide',      'Adventure HQ',      180.00, true,  6),
  ('cccccccc-0003-0003-0003-000000000003','activity', 'Hobbiton Movie Set Tour',                'Guided tour of the original Hobbiton film set in Matamata',         'Hobbiton Tours',    120.00, true,  7),
  ('cccccccc-0003-0003-0003-000000000003','transfer', 'All Inter-City Transfers',               'Private vehicle between all destinations throughout the tour',      'NZ Transfers',      220.00, true,  8),
  ('cccccccc-0003-0003-0003-000000000003','activity', 'Wellington Food & Culture Tour',         'Half-day guided walking tour of Wellington''s best eateries',       'Taste Wellington',   85.00, false, 9),
  ('cccccccc-0003-0003-0003-000000000003','activity', 'Skydive over Lake Taupo',                'Tandem skydive from 15,000ft with panoramic volcanic views',         'Skydive Taupo',     299.00, false,10);
commit;
