-- exists-check: `npm run exists arrived_at` => 0 hits (column missing from the live DB).
-- Net-new additive column on bookings; not a duplicate of any salon_* migration the guard listed.
-- 20260623: bookings.arrived_at , in-salon check-in for the dashboard live-day state.
-- A booking with arrived_at != null is "angekommen" (confirmed -> arrived -> completed/no_show),
-- tracked WITHOUT expanding the status enum (status stays confirmed). Additive + idempotent.
-- Applied out-of-band to project tocfnsmxmdxkrcmjzzdw via migration add_bookings_arrived_at.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS arrived_at timestamptz;
COMMENT ON COLUMN bookings.arrived_at IS 'When the customer checked in at the salon (live-day state). Null = not yet arrived.';
