-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Reserve-at-checkout for the Solen Plus member-discount per-window use cap (fixes the non-atomic race
-- in perks.resolveMemberDiscount: it counts only PAID bookings, so two concurrent in-flight checkouts by
-- the same user both pass the cap and both apply the discount). Add an atomic advisory-locked reserve
-- that counts IN-FLIGHT reservations too. A dedicated marker flag (member_discount_reserved) is what the
-- count sees; a cancelled booking is auto-excluded (status<>'cancelled'), so an abandoned reservation
-- auto-releases. release_member_discount handles the Stripe-idempotency-replay orphan (reserved this
-- request but an older no-discount PI got replayed). Additive column + additive SECURITY DEFINER fns.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS member_discount_reserved boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS bookings_member_discount_reserved_idx
  ON public.bookings (user_id, starts_at) WHERE member_discount_reserved = true;

-- Atomically reserve one member-discount use for this booking iff under the per-tier window cap.
-- Serializes concurrent reservations for the same user via a transaction advisory lock. Idempotent:
-- re-reserving a booking already marked is a no-op that still returns true.
CREATE OR REPLACE FUNCTION public.reserve_member_discount(
  p_user uuid, p_booking uuid, p_tier text, p_window_months integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_max integer; v_used integer; v_window_start timestamptz;
BEGIN
  IF p_user IS NULL OR p_booking IS NULL OR p_tier IS NULL OR p_tier = 'base' THEN
    RETURN false;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('mdisc:' || p_user::text));
  SELECT max_discount_uses_per_window INTO v_max FROM public.tier_perks WHERE tier = p_tier;
  IF v_max IS NULL THEN
    UPDATE public.bookings SET member_discount_reserved = true WHERE id = p_booking;
    RETURN true;  -- unlimited uses for this tier
  END IF;
  v_window_start := now() - make_interval(months => p_window_months);
  SELECT count(*) INTO v_used FROM public.bookings
   WHERE user_id = p_user AND member_discount_reserved = true
     AND status <> 'cancelled' AND COALESCE(refunded_amount, 0) <= 0
     AND starts_at >= v_window_start AND id <> p_booking;
  IF v_used >= v_max THEN
    RETURN false;
  END IF;
  UPDATE public.bookings SET member_discount_reserved = true WHERE id = p_booking;
  RETURN true;
END $$;

-- Release a member-discount reservation (orphaned replay, or explicit undo). Idempotent.
CREATE OR REPLACE FUNCTION public.release_member_discount(p_booking uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.bookings SET member_discount_reserved = false WHERE id = p_booking;
END $$;