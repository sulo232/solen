-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Reserve-at-checkout for promo codes (fixes the non-atomic max_uses race in booking-pay-intent:
-- concurrent checkouts both passed the stale current_uses < max_uses pre-check, then both baked the
-- discount into their PaymentIntent). Move the use-consumption to an ATOMIC reserve at checkout, with
-- an idempotent release on abandonment. Two per-booking flags make reserve + release idempotent so a
-- double-submit or a double abandon-path (abandon-sweep AND payment_failed) can never over/under-count.
-- Additive columns + additive SECURITY DEFINER functions.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS promo_use_reserved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS promo_use_released boolean NOT NULL DEFAULT false;

-- Atomically consume one promo use for THIS booking, iff one is available. Idempotent per booking.
-- Returns true when the booking holds a reserved use (freshly reserved OR already reserved), false
-- when the promo is exhausted/inactive (caller must then NOT apply the discount).
CREATE OR REPLACE FUNCTION public.reserve_promo_use(p_booking uuid, p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_claimed boolean; v_reserved boolean;
BEGIN
  -- Claim the reservation slot on this booking exactly once (idempotency guard).
  UPDATE public.bookings SET promo_use_reserved = true
   WHERE id = p_booking AND promo_use_reserved = false
  RETURNING true INTO v_claimed;
  IF NOT COALESCE(v_claimed, false) THEN
    RETURN true;  -- already reserved for this booking => idempotent success
  END IF;
  -- Atomically consume a use iff one is available.
  UPDATE public.promo_codes SET current_uses = COALESCE(current_uses, 0) + 1
   WHERE upper(code) = upper(p_code) AND is_active = true
     AND (max_uses IS NULL OR COALESCE(current_uses, 0) < max_uses)
  RETURNING true INTO v_reserved;
  IF COALESCE(v_reserved, false) THEN
    RETURN true;
  END IF;
  -- Exhausted/inactive: roll back the booking claim so no release later over-decrements.
  UPDATE public.bookings SET promo_use_reserved = false WHERE id = p_booking;
  RETURN false;
END $$;

-- Release a previously-reserved promo use (booking abandoned/failed before paying). Idempotent:
-- only a booking that reserved and has not yet been released decrements, exactly once.
CREATE OR REPLACE FUNCTION public.release_promo_use(p_booking uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_code text;
BEGIN
  UPDATE public.bookings SET promo_use_released = true
   WHERE id = p_booking
     AND promo_use_reserved = true
     AND promo_use_released = false
     AND promo_code IS NOT NULL
  RETURNING promo_code INTO v_code;
  IF v_code IS NOT NULL THEN
    UPDATE public.promo_codes SET current_uses = GREATEST(COALESCE(current_uses, 0) - 1, 0)
     WHERE upper(code) = upper(v_code);
  END IF;
END $$;