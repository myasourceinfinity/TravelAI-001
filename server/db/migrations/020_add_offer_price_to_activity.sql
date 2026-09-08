-- Alter recent_package_activity to support traveller bids/offers
ALTER TABLE recent_package_activity 
ADD COLUMN offer_price DECIMAL(12, 2) DEFAULT NULL;
