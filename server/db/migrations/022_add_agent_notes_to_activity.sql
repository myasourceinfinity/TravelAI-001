-- Alter recent_package_activity to support agent notes
ALTER TABLE recent_package_activity 
ADD COLUMN agent_notes TEXT DEFAULT NULL;
