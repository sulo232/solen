-- exists-check: net-new (no credit spend path existed; mirrors the voucher pattern). Owner-greenlit
-- spendable referral credits (2026-07-03). Applied via MCP apply_migration; mirrored here. Additive.

-- Persisted referral code on the booking, so the COMPLETION path (not the POST) mints the reward
-- (mint-on-completed fixes the book-cancel-keep exploit).
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS referral_code text;

-- Per-credit-row + per-booking redemption ledger (idempotent redeem, restore-on-refund).
CREATE TABLE IF NOT EXISTS public.credit_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  booking_id uuid REFERENCES public.bookings(id),
  credit_id uuid NOT NULL REFERENCES public.user_credits(id),
  amount_redeemed numeric NOT NULL,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (credit_id, booking_id)
);
ALTER TABLE public.credit_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY credit_redemptions_select ON public.credit_redemptions FOR SELECT USING (
  (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = (SELECT auth.uid()) AND profiles.role='admin'))
  OR user_id = (SELECT auth.uid())
);

-- Atomic FIFO debit of a user's credits (soonest-to-expire first). Expiry enforced inside the debit.
CREATE OR REPLACE FUNCTION public.redeem_user_credits(
  p_user uuid, p_amount numeric, p_booking uuid, p_pi text
) RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp' AS $$
DECLARE r record; v_left numeric; v_take numeric; v_applied numeric := 0;
BEGIN
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

-- Inverse: restore credits on refund/dispute-lost, keyed on the PI. Idempotent.
CREATE OR REPLACE FUNCTION public.restore_user_credits(p_pi text) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp' AS $$
DECLARE r record; v_total numeric := 0;
BEGIN
  FOR r IN SELECT * FROM credit_redemptions WHERE stripe_payment_intent_id = p_pi LOOP
    UPDATE user_credits SET remaining = remaining + r.amount_redeemed WHERE id = r.credit_id;
    DELETE FROM credit_redemptions WHERE id = r.id;
    v_total := v_total + r.amount_redeemed;
  END LOOP;
  RETURN v_total;
END $$;

REVOKE EXECUTE ON FUNCTION public.redeem_user_credits(uuid, numeric, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_user_credits(text) FROM PUBLIC;

-- Spend kill-switch (money feature, off until owner enables). Minting stays governed by the referral flag.
INSERT INTO public.feature_flags (key, enabled, description)
VALUES ('credits', false, 'Spend referral credits at checkout')
ON CONFLICT (key) DO NOTHING;
