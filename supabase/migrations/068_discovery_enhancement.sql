-- 068: Discovery Enhancement — new AI-generated columns
ALTER TABLE discovery_items ADD COLUMN IF NOT EXISTS products_needed TEXT[] DEFAULT '{}';
ALTER TABLE discovery_items ADD COLUMN IF NOT EXISTS hair_type_match TEXT[] DEFAULT '{}';
