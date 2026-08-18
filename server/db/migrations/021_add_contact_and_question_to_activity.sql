-- Alter recent_package_activity to support preferred contact method and enquiry questions
ALTER TABLE recent_package_activity 
ADD COLUMN preferred_contact_method VARCHAR(20) DEFAULT NULL,
ADD COLUMN enquiry_question TEXT DEFAULT NULL,
ADD CONSTRAINT chk_preferred_contact_method CHECK (preferred_contact_method IN ('email', 'phone'));
