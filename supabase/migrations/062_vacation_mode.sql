-- Migration 062: Vacation mode
-- Salon owners can set vacation dates to block all slots in that range.

ALTER TABLE salons ADD COLUMN IF NOT EXISTS vacation_start date;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS vacation_end date;

COMMENT ON COLUMN salons.vacation_start IS 'Start date of vacation mode (inclusive)';
COMMENT ON COLUMN salons.vacation_end IS 'End date of vacation mode (inclusive)';
