-- Phase 1: Add profile fields to staff_members
-- bio already exists (added in migration 032), only add instagram_url and years_experience

ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS years_experience INT;
