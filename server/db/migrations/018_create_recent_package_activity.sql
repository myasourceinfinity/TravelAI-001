CREATE TABLE IF NOT EXISTS recent_package_activity (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id BIGINT NOT NULL REFERENCES agent_packages(id) ON DELETE CASCADE,
  activity_type VARCHAR(30) NOT NULL DEFAULT 'enquire',
  interaction_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_interacted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_recent_package_activity_user_package UNIQUE (user_id, package_id),
  CONSTRAINT chk_recent_package_activity_type CHECK (
    activity_type IN ('view', 'enquire')
  )
);

CREATE INDEX IF NOT EXISTS idx_recent_package_activity_user
  ON recent_package_activity(user_id, last_interacted_at DESC);

CREATE INDEX IF NOT EXISTS idx_recent_package_activity_package
  ON recent_package_activity(package_id);