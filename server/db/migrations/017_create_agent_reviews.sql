CREATE TABLE IF NOT EXISTS agent_reviews (
  id           BIGSERIAL PRIMARY KEY,
  agent_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_agent_reviews_agent_reviewer UNIQUE (agent_id, reviewer_id),
  CONSTRAINT chk_agent_reviews_not_self CHECK (agent_id <> reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent_id ON agent_reviews(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_reviewer_id ON agent_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_agent_reviews_rating ON agent_reviews(rating);