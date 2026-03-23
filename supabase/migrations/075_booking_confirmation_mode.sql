-- Migration 075: T&S §3.1 — Booking confirmation mode
-- Allows salons to require manual approval before confirming bookings.
-- T&S §3.1: "Instant Confirmation" vs "Salon Approval" mode.

-- 1. Add booking_confirmation_mode to salons
ALTER TABLE salons ADD COLUMN IF NOT EXISTS booking_confirmation_mode text
  DEFAULT 'instant'
  CHECK (booking_confirmation_mode IN ('instant', 'manual_approval'));

COMMENT ON COLUMN salons.booking_confirmation_mode IS
  'T&S §3.1: instant = auto-confirm on payment, manual_approval = stays pending_approval until salon confirms';

-- 2. Safely extend bookings.status to include pending_approval
-- Find and drop the existing inline CHECK constraint on bookings.status
DO $$
DECLARE
  c_name text;
BEGIN
  SELECT con.conname INTO c_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'bookings'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%status%IN%';

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'pending_approval', 'confirmed', 'cancelled', 'completed', 'no_show'));
