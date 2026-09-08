-- Clean up previous column
ALTER TABLE recent_package_activity DROP COLUMN IF EXISTS agent_notes;

-- Create enquiry follow ups table
CREATE TABLE enquiry_follow_ups (
  id SERIAL PRIMARY KEY,
  activity_id INT NOT NULL REFERENCES recent_package_activity(id) ON DELETE CASCADE,
  note_type VARCHAR(20) NOT NULL CHECK (note_type IN ('note', 'phone', 'email', 'meeting')),
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
