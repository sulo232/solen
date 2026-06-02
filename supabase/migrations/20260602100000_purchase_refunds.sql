-- ============================================================
-- 20260602100000_purchase_refunds
-- Makes PACKAGE + RETAIL purchases refundable through the new
-- Connect-aware chokepoint lib/purchases/issue-purchase-refund.ts
-- (mirrors lib/bookings/issue-refund.ts: reverse_transfer +
-- refund_application_fee + deterministic idempotency key + CAS on a
-- refunded_amount column).
--
-- Owner decision (2026-06-02): packages + retail are refundable;
-- gift-cards / vouchers / tips are FINAL-SALE and are NOT touched here.
--
-- UNIT CONTRACT: integer Rappen end-to-end, exactly like
-- bookings.paid_amount / bookings.refunded_amount. paid_amount =
-- pi.amount (Stripe's smallest CHF unit), refunded_amount = cumulative
-- Rappen refunded. Deliberately NOT the numeric-CHF convention used by
-- salon_payouts / voucher_purchases.amount_paid — the refund CAS math
-- must stay in the same integer unit Stripe charges in.
--
-- Forward-only, fully guarded, re-runnable.
-- ============================================================

-- ── PACKAGES ────────────────────────────────────────────────
-- package_purchases (migration 071) records sessions_total / sessions_used
-- + the PI, but no money columns. issuePurchaseRefund needs an integer-Rappen
-- paid_amount to cap the refund and a refunded_amount to CAS against. The
-- webhook (payment_intent.succeeded, type:'package_purchase') writes paid_amount
-- from pi.amount when the purchase settles.
ALTER TABLE public.package_purchases
  ADD COLUMN IF NOT EXISTS paid_amount     integer,            -- Rappen; set by webhook on settle.
  ADD COLUMN IF NOT EXISTS refunded_amount integer NOT NULL DEFAULT 0; -- Rappen; CAS target.

-- One purchase row per PaymentIntent — the webhook finalizer and the refund
-- helper both look the row up by stripe_payment_intent_id. Partial (WHERE NOT
-- NULL) so historical rows inserted before a PI existed don't collide.
CREATE UNIQUE INDEX IF NOT EXISTS package_purchases_pi_key
  ON public.package_purchases(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ── RETAIL ──────────────────────────────────────────────────
-- /api/salon/retail/purchase creates a Connect destination-charge PI but
-- (pre-this-migration) recorded NO row — so a retail charge could never be
-- refunded (nothing persisted the PI / amount / salon). The dashboard reader
-- /api/dashboard/nail/retail-sales references a `retail_sales` table that was
-- never created. This table is the canonical record of an online retail
-- purchase: the purchase route inserts a pending row, the webhook
-- (type:'retail_purchase') flips it to paid + writes paid_amount, and the
-- refund helper refunds against it.
CREATE TABLE IF NOT EXISTS public.retail_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_ids uuid[] NOT NULL DEFAULT '{}',
  stripe_payment_intent_id text,
  paid_amount integer,                            -- Rappen; set by webhook on settle.
  refunded_amount integer NOT NULL DEFAULT 0,     -- Rappen; CAS target.
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'refunded', 'partially_refunded', 'failed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.retail_purchases ENABLE ROW LEVEL SECURITY;

-- Buyer sees their own purchases.
DROP POLICY IF EXISTS "retail_purchases_own_select" ON public.retail_purchases;
CREATE POLICY "retail_purchases_own_select" ON public.retail_purchases
  FOR SELECT USING (user_id = auth.uid());

-- Salon owner sees purchases at their salon.
DROP POLICY IF EXISTS "retail_purchases_salon_select" ON public.retail_purchases;
CREATE POLICY "retail_purchases_salon_select" ON public.retail_purchases
  FOR SELECT USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );

-- Admin sees all.
DROP POLICY IF EXISTS "retail_purchases_admin_select" ON public.retail_purchases;
CREATE POLICY "retail_purchases_admin_select" ON public.retail_purchases
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
-- NOTE: no INSERT/UPDATE policy by design. The purchase route, the webhook
-- finalizer, and issuePurchaseRefund all write via the service-role (admin)
-- client, which bypasses RLS. Buyers / salons / admins only read.

CREATE INDEX IF NOT EXISTS idx_retail_purchases_salon   ON public.retail_purchases(salon_id);
CREATE INDEX IF NOT EXISTS idx_retail_purchases_user    ON public.retail_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_retail_purchases_created ON public.retail_purchases(created_at);

-- One purchase row per PaymentIntent (same rationale as package_purchases_pi_key).
CREATE UNIQUE INDEX IF NOT EXISTS retail_purchases_pi_key
  ON public.retail_purchases(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
