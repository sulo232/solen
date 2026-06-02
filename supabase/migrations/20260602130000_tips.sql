-- ============================================================
-- 20260602130000_tips
-- The `tips` table — referenced by the existing booking-tip flow (app/api/tips)
-- but never created on live (schema drift), so tipping silently failed. Created
-- here + extended to support WALK-IN tips (walkin_queue_id) and guest tippers
-- (nullable user_id). Tips are 100% to the salon — NO Solen commission.
--
-- Money is integer Rappen. Idempotent + additive.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  staff_member_id uuid REFERENCES public.staff_members(id) ON DELETE SET NULL,
  booking_id uuid,                 -- set for a booking tip
  walkin_queue_id uuid,            -- set for a walk-in tip
  user_id uuid,                    -- nullable: a guest walk-in tipper has none
  amount integer NOT NULL,         -- Rappen; 100% to the salon (no application_fee)
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT tips_target_chk CHECK (booking_id IS NOT NULL OR walkin_queue_id IS NOT NULL)
);

-- Backfill columns if an earlier partial create made a slimmer table.
ALTER TABLE public.tips
  ADD COLUMN IF NOT EXISTS walkin_queue_id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_tips_salon   ON public.tips(salon_id);
CREATE INDEX IF NOT EXISTS idx_tips_booking ON public.tips(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tips_walkin  ON public.tips(walkin_queue_id) WHERE walkin_queue_id IS NOT NULL;
-- One tip row per PaymentIntent (idempotent webhook recording).
CREATE UNIQUE INDEX IF NOT EXISTS tips_pi_key ON public.tips(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

-- Salon owner reads their salon's tips; a logged-in customer reads their own.
-- All WRITES go through the service-role client (the tip routes validate ownership /
-- the walk-in tracking token first, then write), so no INSERT/UPDATE policy is granted.
DROP POLICY IF EXISTS "tips_owner_select" ON public.tips;
CREATE POLICY "tips_owner_select" ON public.tips
  FOR SELECT USING (salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "tips_user_select" ON public.tips;
CREATE POLICY "tips_user_select" ON public.tips
  FOR SELECT USING (user_id = auth.uid());
