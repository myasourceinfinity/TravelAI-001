-- Store completed AI travel research, not just the text a traveller typed.
ALTER TABLE recent_searches
  ADD COLUMN IF NOT EXISTS destination VARCHAR(255),
  ADD COLUMN IF NOT EXISTS origin_city VARCHAR(255),
  ADD COLUMN IF NOT EXISTS duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS travelers INTEGER,
  ADD COLUMN IF NOT EXISTS budget_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS budget_level VARCHAR(50),
  ADD COLUMN IF NOT EXISTS depart_date DATE,
  ADD COLUMN IF NOT EXISTS return_date DATE,
  ADD COLUMN IF NOT EXISTS interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS response_summary TEXT,
  ADD COLUMN IF NOT EXISTS ai_response TEXT,
  ADD COLUMN IF NOT EXISTS analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_recent_searches_destination_completed_at
  ON recent_searches(destination, completed_at DESC)
  WHERE destination IS NOT NULL;
