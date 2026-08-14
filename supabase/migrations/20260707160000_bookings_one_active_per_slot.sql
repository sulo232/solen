-- Migration: 20260707160000_bookings_one_active_per_slot.sql
-- exists-check: no existing unique constraint/index on bookings.slot_id (pg_constraint checked live);
--   new. `npm run exists "one active per slot"` = 0 matches.
--
-- Phase-2 audit critical #1 DB-level backstop. The app-level compare-and-swap (lib/bookings/claim-slot)
-- already prevents two concurrent requests from booking the same slot, but there was no constraint in
-- the database itself, and a real double-booking had occurred (same customer double-submitted; cleaned
-- up 2026-07-07). This partial unique index makes it PHYSICALLY impossible for two NORMAL active bookings
-- to share a slot, even if a future code path forgets the guard.
--
-- Scope, deliberately:
--   - slot_id IS NOT NULL        -> walk-ins (no slot) are exempt.
--   - group_booking_id IS NULL   -> group bookings (create_group_booking, currently dormant/0 rows) are
--                                   exempt, in case that feature intentionally puts several people on one
--                                   slot; revisit if group bookings ever share slots by design.
--   - status IN (active set)     -> only pending/pending_approval/confirmed compete for a slot; a
--                                   cancelled/completed/no_show row never blocks a fresh booking.
--
-- Verified live before apply: zero slots currently hold >1 active non-group booking, so this creates cleanly.

CREATE UNIQUE INDEX IF NOT EXISTS bookings_one_active_per_slot
  ON public.bookings (slot_id)
  WHERE slot_id IS NOT NULL
    AND group_booking_id IS NULL
    AND status IN ('pending', 'pending_approval', 'confirmed');
