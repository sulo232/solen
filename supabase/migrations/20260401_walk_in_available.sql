-- Migration M1: Add walk_in_available column to salons
-- Used by the "Walk-in" quick filter chip on category pages

ALTER TABLE salons ADD COLUMN IF NOT EXISTS walk_in_available BOOLEAN DEFAULT false;

-- Pre-populate: barbershops default to walk-in (they typically accept walk-ins)
UPDATE salons SET walk_in_available = true WHERE 'barbershop' = ANY(categories);

COMMENT ON COLUMN salons.walk_in_available IS 'Whether this salon accepts walk-in customers without an appointment. Defaults to true for barbershops.';
