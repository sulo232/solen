-- Migration 057: Add inspiration photo URL to price offers
-- Links a customer-shared photo to a price offer created from it

ALTER TABLE price_offers
  ADD COLUMN IF NOT EXISTS inspiration_photo_url text;

COMMENT ON COLUMN price_offers.inspiration_photo_url IS 'URL to customer photo that inspired this price offer';
