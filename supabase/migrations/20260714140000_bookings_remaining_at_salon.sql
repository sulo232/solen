-- Applied live via MCP apply_migration 2026-07-14 (name: bookings_remaining_at_salon); kept for reproducibility.
-- Persist the discount-aware at-salon remainder for deposit bookings so the confirmation can show
-- "paid now / rest at the salon" with the promo discount correctly reflected (computed in
-- booking-pay-intent). Additive, nullable; NULL on prepay/full-pay bookings (no remainder to show).
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS remaining_at_salon numeric(10, 2);
