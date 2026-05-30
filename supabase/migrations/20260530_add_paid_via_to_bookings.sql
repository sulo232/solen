-- 20260530: Apply bookings.paid_via in the active migration stream.
-- The column was defined in 068_megabuild_foundation.sql but that migration was never
-- applied (schema drift), so paid_via was missing in the live DB and blocked the walk-in
-- pay/booking flow. This re-applies just that column, additive + idempotent (IF NOT EXISTS),
-- and was applied out-of-band to project tocfnsmxmdxkrcmjzzdw via migration add_paid_via_to_bookings.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_via TEXT DEFAULT 'stripe'
  CHECK (paid_via IN ('stripe','package','gift_card','walk_in'));
