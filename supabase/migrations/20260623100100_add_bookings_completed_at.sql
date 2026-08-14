-- exists-check: `npm run exists completed_at` => exists on barber_loyalty_history /
-- barber_walkin_queue / data_deletion_log but NOT on bookings (stale snapshot + live drift).
-- 20260623: bookings.completed_at , SCHEMA DRIFT FIX. The code already writes bookings.completed_at
-- in multiple places (PATCH mark-completed app/api/bookings/[id]/route.ts, the POST auto-complete
-- in app/api/bookings/route.ts, the cron/auto-complete job, and the new cash-checkout endpoint),
-- but the live column was MISSING, so every booking-completion update silently failed (PGRST204:
-- "could not find the 'completed_at' column"). Additive + idempotent , restores what the code
-- already expects, fixing those latent completion failures plus the cash checkout.
-- Applied out-of-band to project tocfnsmxmdxkrcmjzzdw via migration add_bookings_completed_at.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at timestamptz;
COMMENT ON COLUMN bookings.completed_at IS 'When the booking was marked completed. Null = not completed.';
