CREATE TABLE IF NOT EXISTS package_reviews (
  id           BIGSERIAL PRIMARY KEY,
  package_id   BIGINT NOT NULL REFERENCES agent_packages(id) ON DELETE CASCADE,
  reviewer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_package_reviews_package_reviewer UNIQUE (package_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_package_reviews_package_id ON package_reviews(package_id);
CREATE INDEX IF NOT EXISTS idx_package_reviews_reviewer_id ON package_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_package_reviews_rating ON package_reviews(rating);
