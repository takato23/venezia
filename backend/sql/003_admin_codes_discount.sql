-- Add discount fields to admin_codes
ALTER TABLE admin_codes ADD COLUMN discount_type TEXT NULL CHECK(discount_type IN ('percent','amount'));
ALTER TABLE admin_codes ADD COLUMN discount_value REAL NULL CHECK(discount_value >= 0);


