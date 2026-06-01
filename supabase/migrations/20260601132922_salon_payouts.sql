-- ============================================================
-- 20260601132922_salon_payouts
-- Creates the salon_payouts table that the Stripe webhook
-- (payment_intent.succeeded → INSERT, charge.refunded → UPDATE) and
-- lib/bookings/issue-refund.ts already write to, plus the salon
-- earnings / invoices / admin-revenue readers already SELECT from.
--
-- The table was authored in 055_platform_commission.sql but that
-- migration never landed on the live DB (verified 2026-06-01:
-- to_regclass('public.salon_payouts') IS NULL). This forward-only,
-- fully guarded, re-runnable migration carries that exact DDL so the
-- shipped code stops silently no-op'ing.
--
-- UNIT CONTRACT: the webhook writes these amounts in CHF
-- (gross_amount = pi.amount / 100, commission_percent as a percent
-- number e.g. 15). issue-refund.ts decrements in CHF. So gross/
-- commission/net are numeric CHF here — deliberately NOT integer
-- Rappen. (The Rappen lock is for bookings.paid_amount / refunded_amount;
-- this payout ledger mirrors Stripe's CHF reporting math.)
-- ============================================================

-- Salon payouts: gross / commission / net per booking payment (CHF).
CREATE TABLE IF NOT EXISTS public.salon_payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  gross_amount numeric(10, 2) NOT NULL DEFAULT 0,
  commission_percent numeric(5, 2) NOT NULL DEFAULT 15,
  commission_amount numeric(10, 2) NOT NULL DEFAULT 0,
  net_amount numeric(10, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'transferred', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.salon_payouts ENABLE ROW LEVEL SECURITY;

-- Salon owners see their own payouts.
DROP POLICY IF EXISTS "salon_payouts_owner_select" ON public.salon_payouts;
CREATE POLICY "salon_payouts_owner_select" ON public.salon_payouts
  FOR SELECT USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );

-- Admin sees all.
DROP POLICY IF EXISTS "salon_payouts_admin_select" ON public.salon_payouts;
CREATE POLICY "salon_payouts_admin_select" ON public.salon_payouts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
-- NOTE: no INSERT/UPDATE policy by design. The webhook + issueRefund write
-- via the service-role (admin) client, which bypasses RLS. Salons/admins only read.

-- Lookup indexes (match 055).
CREATE INDEX IF NOT EXISTS idx_salon_payouts_salon   ON public.salon_payouts(salon_id);
CREATE INDEX IF NOT EXISTS idx_salon_payouts_booking ON public.salon_payouts(booking_id);
CREATE INDEX IF NOT EXISTS idx_salon_payouts_created ON public.salon_payouts(created_at);

-- One payout row per PaymentIntent. The webhook's charge.refunded handler and
-- issue-refund.ts both look the row up by stripe_payment_intent_id via .single()/
-- .maybeSingle(); a unique index guarantees that lookup is unambiguous and stops
-- a double-delivered payment_intent.succeeded from inserting two ledger rows.
-- Partial (WHERE NOT NULL) so legacy/in-person rows without a PI don't collide.
CREATE UNIQUE INDEX IF NOT EXISTS salon_payouts_pi_key
  ON public.salon_payouts(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
