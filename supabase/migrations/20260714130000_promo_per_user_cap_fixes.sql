-- Applied live via MCP apply_migration 2026-07-14 (name: promo_per_user_cap_fixes); kept for reproducibility.
-- Amendment to 20260714120000 (council-security findings):
-- (2) fix the reserve/release retry LATCH , a released reservation must be re-reservable so a
--     PaymentIntent-create failure + client retry re-counts (previously promo_use_reserved never reset);
-- (1) strengthen the guest redeemer key , prefer the validated phone over the swappable email;
-- (4) guard per_user_limit > 0 (a direct PostgREST insert could zero it and DoS the owner's own code);
-- (5) backfill the ledger from already-paid promo bookings so pre-migration redemptions count.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='promo_codes_per_user_limit_pos') THEN
    ALTER TABLE public.promo_codes
      ADD CONSTRAINT promo_codes_per_user_limit_pos CHECK (per_user_limit IS NULL OR per_user_limit > 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.reserve_promo_use(p_booking uuid, p_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_claimed boolean; v_reserved boolean; v_key text; v_limit int; v_used int;
BEGIN
  UPDATE public.bookings SET promo_use_reserved = true, promo_use_released = false
   WHERE id = p_booking AND promo_use_reserved = false
  RETURNING true INTO v_claimed;
  IF NOT COALESCE(v_claimed, false) THEN
    RETURN true;
  END IF;
  PERFORM 1 FROM public.promo_codes WHERE upper(code) = upper(p_code) AND is_active = true FOR UPDATE;
  SELECT lower(COALESCE(user_id::text, guest_phone, guest_email)) INTO v_key
    FROM public.bookings WHERE id = p_booking;
  SELECT per_user_limit INTO v_limit FROM public.promo_codes WHERE upper(code) = upper(p_code);
  IF v_limit IS NOT NULL AND v_key IS NOT NULL THEN
    SELECT count(*) INTO v_used FROM public.promo_redemptions
      WHERE upper(code) = upper(p_code) AND redeemer_key = v_key AND booking_id <> p_booking;
    IF v_used >= v_limit THEN
      UPDATE public.bookings SET promo_use_reserved = false WHERE id = p_booking;
      RETURN false;
    END IF;
  END IF;
  UPDATE public.promo_codes SET current_uses = COALESCE(current_uses, 0) + 1
   WHERE upper(code) = upper(p_code) AND is_active = true
     AND (max_uses IS NULL OR COALESCE(current_uses, 0) < max_uses)
  RETURNING true INTO v_reserved;
  IF NOT COALESCE(v_reserved, false) THEN
    UPDATE public.bookings SET promo_use_reserved = false WHERE id = p_booking;
    RETURN false;
  END IF;
  IF v_key IS NOT NULL THEN
    INSERT INTO public.promo_redemptions (code, redeemer_key, booking_id)
    VALUES (upper(p_code), v_key, p_booking) ON CONFLICT (booking_id) DO NOTHING;
  END IF;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.release_promo_use(p_booking uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_code text;
BEGIN
  UPDATE public.bookings SET promo_use_reserved = false, promo_use_released = true
   WHERE id = p_booking AND promo_use_reserved = true AND promo_code IS NOT NULL
  RETURNING promo_code INTO v_code;
  IF v_code IS NOT NULL THEN
    UPDATE public.promo_codes SET current_uses = GREATEST(COALESCE(current_uses, 0) - 1, 0) WHERE upper(code) = upper(v_code);
    DELETE FROM public.promo_redemptions WHERE booking_id = p_booking;
  END IF;
END $$;

INSERT INTO public.promo_redemptions (code, redeemer_key, booking_id)
SELECT upper(b.promo_code), lower(COALESCE(b.user_id::text, b.guest_phone, b.guest_email)), b.id
  FROM public.bookings b
 WHERE b.promo_code IS NOT NULL AND b.payment_status = 'paid'
   AND COALESCE(b.user_id::text, b.guest_phone, b.guest_email) IS NOT NULL
ON CONFLICT (booking_id) DO NOTHING;

REVOKE EXECUTE ON FUNCTION public.reserve_promo_use(uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_promo_use(uuid) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_promo_use(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_promo_use(uuid) TO service_role;
