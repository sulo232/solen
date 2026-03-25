-- Migration 083: Add is_top_pick column to salons table
-- Allows admins and salon owners to mark salons as "Solen Top Pick"
-- Part of roadmap-homepage-issues-4a-4h.md Phase 3

ALTER TABLE salons
ADD COLUMN IF NOT EXISTS is_top_pick BOOLEAN NOT NULL DEFAULT FALSE;

-- Add comment to document the column
COMMENT ON COLUMN salons.is_top_pick IS 'Whether this salon is featured as a Solen Top Pick (admin/owner controlled)';

-- Create index for efficient filtering of top pick salons
CREATE INDEX IF NOT EXISTS idx_salons_top_pick ON salons(is_top_pick) WHERE is_top_pick = TRUE;
