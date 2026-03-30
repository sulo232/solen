-- Add postal_code to salons table for Airbnb-style address display
ALTER TABLE salons ADD COLUMN IF NOT EXISTS postal_code text;

-- Optional: index for future filtering by postal zone
CREATE INDEX IF NOT EXISTS idx_salons_postal_code ON salons(postal_code) WHERE postal_code IS NOT NULL;
