-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Voucher redemption (owner-greenlit 2026-07-03). Real, abuse-resistant server-side redemption for the
-- stored-value `vouchers` (gift voucher). Additive: a per-user/per-booking ledger, atomic redeem/restore
-- RPCs, and a bookings.voucher_code column. Mirrors the existing promo path.

CREATE TABLE IF NOT EXISTS public.voucher_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id uuid NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  booking_id uuid REFERENCES public.bookings(id),
  amount_redeemed numeric NOT NULL,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (voucher_id, booking_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS voucher_redemptions_user_uniq
  ON public.voucher_redemptions (voucher_id, user_id) WHERE user_id IS NOT NULL;
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY voucher_redemptions_select ON public.voucher_redemptions FOR SELECT USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role='admin'))
  OR user_id = (SELECT auth.uid())
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS voucher_code text;

CREATE OR REPLACE FUNCTION public.redeem_voucher(
  p_code text, p_salon_id uuid, p_amount numeric, p_user uuid, p_booking uuid, p_pi text
) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp' AS $$
DECLARE v_id uuid; v_remaining numeric; v_apply numeric;
BEGIN
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

CREATE OR REPLACE FUNCTION public.restore_voucher(p_pi text) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp' AS $$
DECLARE r record; v_total numeric := 0;
BEGIN
  FOR r IN SELECT * FROM voucher_redemptions WHERE stripe_payment_intent_id = p_pi LOOP
    UPDATE vouchers
       SET remaining_amount = coalesce(remaining_amount, 0) + r.amount_redeemed,
           redeemed_at = NULL, redeemed_by = NULL
     WHERE id = r.voucher_id;
    DELETE FROM voucher_redemptions WHERE id = r.id;
    v_total := v_total + r.amount_redeemed;
  END LOOP;
  RETURN v_total;
END $$;

REVOKE EXECUTE ON FUNCTION public.redeem_voucher(text, uuid, numeric, uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_voucher(text) FROM PUBLIC;