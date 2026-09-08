-- Alter agent_packages table to support promo_price
ALTER TABLE agent_packages
ADD COLUMN promo_price DECIMAL(12, 2) DEFAULT NULL;
