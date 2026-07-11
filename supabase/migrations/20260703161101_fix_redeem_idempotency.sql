-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
CREATE OR REPLACE FUNCTION public.redeem_voucher(
  p_code text, p_salon_id uuid, p_amount numeric, p_user uuid, p_booking uuid, p_pi text
) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp' AS $$
DECLARE v_id uuid; v_remaining numeric; v_apply numeric;
BEGIN
  IF EXISTS (SELECT 1 FROM voucher_redemptions WHERE booking_id = p_booking) THEN
    RETURN (SELECT COALESCE(SUM(amount_redeemed), 0) FROM voucher_redemptions WHERE booking_id = p_booking);
  END IF;
  SELECT id, remaining_amount INTO v_id, v_remaining
    FROM vouchers
   WHERE upper(code) = upper(p_code) AND salon_id = p_salon_id
     AND (expires_at IS NULL OR expires_at > now())
     AND coalesce(remaining_amount, 0) > 0
   FOR UPDATE;
  IF v_id IS NULL THEN RETURN 0; END IF;
  v_apply := least(coalesce(v_remaining, 0), p_amount);
  IF v_apply <= 0 THEN RETURN 0; END IF;
  UPDATE vouchers
     SET remaining_amount = remaining_amount - v_apply,
         redeemed_at = CASE WHEN remaining_amount - v_apply <= 0 THEN now() ELSE redeemed_at END,
         redeemed_by = CASE WHEN remaining_amount - v_apply <= 0 THEN p_user ELSE redeemed_by END
   WHERE id = v_id;
  INSERT INTO voucher_redemptions(voucher_id, user_id, booking_id, amount_redeemed, stripe_payment_intent_id)
    VALUES (v_id, p_user, p_booking, v_apply, p_pi)
    ON CONFLICT (voucher_id, booking_id) DO NOTHING;
  RETURN v_apply;
END $$;

CREATE OR REPLACE FUNCTION public.redeem_user_credits(
  p_user uuid, p_amount numeric, p_booking uuid, p_pi text
) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp' AS $$
DECLARE r record; v_left numeric; v_take numeric; v_applied numeric := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM credit_redemptions WHERE booking_id = p_booking) THEN
    RETURN (SELECT COALESCE(SUM(amount_redeemed), 0) FROM credit_redemptions WHERE booking_id = p_booking);
  END IF;
  v_left := p_amount;
  IF v_left IS NULL OR v_left <= 0 THEN RETURN 0; END IF;
  FOR r IN
    SELECT id, remaining FROM user_credits
     WHERE user_id = p_user AND remaining > 0
       AND (expires_at IS NULL OR expires_at > now())
     ORDER BY expires_at ASC NULLS LAST, created_at ASC
     FOR UPDATE
  LOOP
    EXIT WHEN v_left <= 0;
    v_take := least(r.remaining, v_left);
    UPDATE user_credits SET remaining = remaining - v_take WHERE id = r.id;
    INSERT INTO credit_redemptions(user_id, booking_id, credit_id, amount_redeemed, stripe_payment_intent_id)
      VALUES (p_user, p_booking, r.id, v_take, p_pi)
      ON CONFLICT (credit_id, booking_id) DO NOTHING;
    v_applied := v_applied + v_take;
    v_left := v_left - v_take;
  END LOOP;
  RETURN v_applied;
END $$;

REVOKE EXECUTE ON FUNCTION public.redeem_voucher(text, uuid, numeric, uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_user_credits(uuid, numeric, uuid, text) FROM PUBLIC;