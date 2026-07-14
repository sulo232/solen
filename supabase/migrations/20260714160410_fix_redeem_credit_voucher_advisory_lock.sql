-- applied live via MCP apply_migration 2026-07-14; file backfilled for fresh-env reproducibility.
-- exists-check: net-new fix migration (CREATE OR REPLACE of two existing RPCs to add a lock).
-- Fix the TOCTOU double-debit race in redeem_user_credits / redeem_voucher. The idempotency
-- EXISTS-check ran before any lock, so two concurrent calls for the same booking both passed it
-- and each debited the balance while the second ledger INSERT was silently dropped by ON CONFLICT
-- DO NOTHING (permanent stored-value loss). Serialize per booking with a transaction-scoped
-- advisory lock as the first statement (mirrors reserve_member_discount), so the second call
-- waits for the first to commit, then the EXISTS-check sees the committed row and returns early.
CREATE OR REPLACE FUNCTION public.redeem_user_credits(p_user uuid, p_amount numeric, p_booking uuid, p_pi text)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE r record; v_left numeric; v_take numeric; v_applied numeric := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('credit-redeem:' || p_booking::text));
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
END $function$;

CREATE OR REPLACE FUNCTION public.redeem_voucher(p_code text, p_salon_id uuid, p_amount numeric, p_user uuid, p_booking uuid, p_pi text)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_id uuid; v_remaining numeric; v_apply numeric;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('voucher-redeem:' || p_booking::text));
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
END $function$;
