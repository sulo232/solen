-- Migration 061: Service gender tags
-- Adds gender_tags array column to services for gender-based filtering.
-- Valid values: 'male', 'female', 'non_binary', 'all'

ALTER TABLE services ADD COLUMN IF NOT EXISTS gender_tags text[] DEFAULT '{all}';

COMMENT ON COLUMN services.gender_tags IS 'Gender tags for filtering: male, female, non_binary, all';
