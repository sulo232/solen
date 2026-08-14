-- exists-check: CREATE OR REPLACE of existing live functions (reserve_member_discount,
-- release_member_discount); net-new file, no schema object created. Corrects an already-applied
-- migration WITHOUT editing the historical file 20260710103441 (an in-place edit never reaches live
-- and diverges a fresh rebuild). Apply live via MCP apply_migration.
--
-- FIX (deep-audit db): these SECURITY DEFINER money RPCs are EXECUTE-able by the authenticated role
-- (Supabase advisor 0029) and took p_user / p_booking as trusted args. A directly-authenticated
-- caller (not the in-app service-role client) could reserve/release a member-discount use against
-- ANOTHER user's account. Add a caller-match guard: auth.uid() is NULL for the service-role admin
-- client (the only in-app caller, unaffected), so the guard only bites a direct cross-user call.
-- The companion revoke migration removes anon EXECUTE; this closes the authenticated-role hole.
CREATE OR REPLACE FUNCTION public.reserve_member_discount(
  p_user uuid, p_booking uuid, p_tier text, p_window_months integer
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_max integer; v_used integer; v_window_start timestamptz;
BEGIN
  IF p_user IS NULL OR p_booking IS NULL OR p_tier IS NULL OR p_tier = 'base' THEN
    RETURN false;
  END IF;
  -- Caller-match guard (auth.uid() is NULL for the service-role admin client, the only in-app caller).
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user THEN
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

CREATE OR REPLACE FUNCTION public.release_member_discount(p_booking uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Caller-match guard: only release the reservation for a booking the caller owns (or service-role).
  UPDATE public.bookings SET member_discount_reserved = false
   WHERE id = p_booking
     AND (auth.uid() IS NULL OR auth.uid() = user_id);
END $$;
