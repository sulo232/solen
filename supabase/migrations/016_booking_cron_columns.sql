-- Migration 016: Add cron-job tracking columns to bookings
-- Required by Edge Functions:
--   supabase/functions/booking-reminder/index.ts  → uses reminder_sent
--   supabase/functions/slot-auto-release/index.ts → uses auto_completed

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS reminder_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_completed  BOOLEAN NOT NULL DEFAULT FALSE;

-- Index so the cron queries stay fast even with many bookings
CREATE INDEX IF NOT EXISTS bookings_reminder_pending_idx
  ON bookings (starts_at)
  WHERE reminder_sent = FALSE AND status = 'confirmed';

CREATE INDEX IF NOT EXISTS bookings_auto_complete_idx
  ON bookings (starts_at)
  WHERE auto_completed = FALSE AND status = 'confirmed';
