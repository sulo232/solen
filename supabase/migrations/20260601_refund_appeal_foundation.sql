-- ============================================================
-- 20260601_refund_appeal_foundation
-- Foundation for: guest booking, order numbers, refunds + upcharges,
-- cancellation/no-show auto-charge, and admin case tracking.
-- Forward-only, fully guarded, RE-RUNNABLE (every statement is idempotent).
--
-- MONEY UNIT: every *_amount column ADDED here for the new money flows is
-- INTEGER Rappen (centimes). Legacy CHF columns (salons.*_fee_value,
-- bookings.price_paid, platform_fee) are left as-is and converted at the
-- boundary via lib/stripe.ts toRappen(). (Council Section 10b#5.)
--
-- VERIFIED-SAFE PRECONDITIONS (project tocfnsmxmdxkrcmjzzdw, 2026-06-01):
--   - bookings has 0 rows         -> payment_status CHECK re-add cannot fail
--   - salons.cancellation_fee_type is all 'free' -> CHECK cannot fail
--   - prevent_double_booking constraint already exists -> NOT touched here
--   - public.update_updated_at() exists -> reused for triggers
--
-- DELIBERATELY DEFERRED (kept out so the foundation stays purely additive):
--   - bookings RLS rewrite + REVOKE INSERT FROM anon -> SP-1 (reads live policy first)
--   - bookings owner-or-guest CHECK                  -> SP-1 (touches the insert path)
--   - salon_payouts table                            -> SP-G2 (must match the webhook writer exactly)
-- ============================================================

-- ------------------------------------------------------------
-- 1. BOOKINGS: guest fields, order number, token, money, stripe, policy, fee-charge
-- ------------------------------------------------------------

-- 1a. Guest bookings have no auth user. DROP NOT NULL is idempotent.
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- 1b. Guest contact
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_name  text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_phone text;

-- 1c. Human order/confirmation number (generated in app, SP-2) + hashed guest access token
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reference_code          text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS access_token_hash       text;   -- SHA-256 hex, NEVER the raw token
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS access_token_expires_at timestamptz;

-- 1d. Money columns (068 never applied). INTEGER Rappen.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS paid_amount     integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refunded_amount integer NOT NULL DEFAULT 0;

-- 1e. Stripe full-prepay + saved card (SP-G2). Off-session reuse for SP-AC / upcharge.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_customer_id       text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_payment_method_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_setup_intent_id   text;

-- 1f. Policy disclosure/acceptance (SP-AC Lane A consent = the legal basis for auto-charge)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS policy_accepted_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS policy_snapshot    jsonb;

-- 1g. Auto-charge bookkeeping (SP-AC). fee_charged_amount is INTEGER Rappen.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fee_charge_status    text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fee_charged_amount   integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fee_charge_intent_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fee_charge_kind      text;

-- 1h. payment_status enum CHECK (safe: 0 rows). Guarded re-add.
DO $$ BEGIN
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IS NULL OR payment_status IN
    ('pending','card_saved','deposit_held','paid','none','refunded','partially_refunded','disputed'));

-- 1i. fee_charge_status enum. 'requires_action' = SCA on the off-session charge.
DO $$ BEGIN
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_fee_charge_status_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_fee_charge_status_check
  CHECK (fee_charge_status IS NULL OR fee_charge_status IN ('none','charged','requires_action','failed','waived'));

-- 1j. Indexes
CREATE UNIQUE INDEX IF NOT EXISTS bookings_reference_code_key
  ON public.bookings (reference_code) WHERE reference_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS bookings_access_token_hash_idx
  ON public.bookings (access_token_hash) WHERE access_token_hash IS NOT NULL;

-- ------------------------------------------------------------
-- 2. PROFILES: shared Stripe customer for logged-in users (SP-G2)
-- ------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- ------------------------------------------------------------
-- 3. SALONS: complete the cancellation/no-show policy set (SP-AC)
--    cancellation_* already exist live (all 'free'). Add a structured no-show fee + guard enums.
-- ------------------------------------------------------------
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS no_show_fee_type  text;            -- 'free' | 'flat' | 'percentage'
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS no_show_fee_value numeric DEFAULT 0; -- CHF at the settings boundary

DO $$ BEGIN
  ALTER TABLE public.salons DROP CONSTRAINT IF EXISTS salons_cancellation_fee_type_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE public.salons ADD CONSTRAINT salons_cancellation_fee_type_check
  CHECK (cancellation_fee_type IS NULL OR cancellation_fee_type IN ('free','flat','percentage'));

DO $$ BEGIN
  ALTER TABLE public.salons DROP CONSTRAINT IF EXISTS salons_no_show_fee_type_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE public.salons ADD CONSTRAINT salons_no_show_fee_type_check
  CHECK (no_show_fee_type IS NULL OR no_show_fee_type IN ('free','flat','percentage'));

-- ------------------------------------------------------------
-- 4. BOOKING_DISPUTES: the customer complaint + refund/upcharge spine.
--    ABSENT live (075 never applied). Create with the full merged schema, then guard-extend.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.booking_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,   -- NULLABLE for guests
  reported_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,   -- NULLABLE
  issue_type text NOT NULL DEFAULT 'other'
    CHECK (issue_type IN ('quality','no_show_by_salon','wrong_service','overcharge','other')),
  description text,
  status text NOT NULL DEFAULT 'open',
  -- two-direction + review-first extensions (SP-3)
  direction text NOT NULL DEFAULT 'refund' CHECK (direction IN ('refund','upcharge')),
  reason_code text,
  requested_amount integer CHECK (requested_amount IS NULL OR requested_amount >= 0),  -- Rappen
  resolved_amount  integer CHECK (resolved_amount  IS NULL OR resolved_amount  >= 0),  -- Rappen
  eligibility text CHECK (eligibility IS NULL OR eligibility IN ('eligible','discretionary','not_eligible')),
  fast_track_recommended boolean NOT NULL DEFAULT false,
  requested_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL = guest
  guest_name text, guest_email text, guest_phone text,
  customer_response text, customer_responded_at timestamptz, escalated_at timestamptz,
  salon_response text, salon_responded_at timestamptz,
  admin_response text, admin_responded_at timestamptz,
  resolution text, resolved_by uuid REFERENCES auth.users(id), resolved_at timestamptz,
  mediation_started_at timestamptz, mediation_deadline_at timestamptz,
  stripe_refund_id text,
  idempotency_key text,
  expires_at timestamptz,   -- upcharge no-response window (void on expiry, D8). NULL for refunds.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4a. Guard-extend (covers the case where a base 075 table somehow pre-exists)
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'refund';
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS reason_code text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS requested_amount integer;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS resolved_amount integer;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS eligibility text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS fast_track_recommended boolean NOT NULL DEFAULT false;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS requested_by_user_id uuid;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS guest_phone text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS customer_response text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS customer_responded_at timestamptz;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS escalated_at timestamptz;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS admin_response text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS admin_responded_at timestamptz;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS stripe_refund_id text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 4b. reporter_id / reported_id NULLABLE for guest cases (075 had NOT NULL)
DO $$ BEGIN ALTER TABLE public.booking_disputes ALTER COLUMN reporter_id DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.booking_disputes ALTER COLUMN reported_id DROP NOT NULL; EXCEPTION WHEN others THEN NULL; END $$;

-- 4c. status enum: full review-first closure (SP-3). No auto_approve_at anywhere (D8: void on silence).
DO $$ BEGIN
  ALTER TABLE public.booking_disputes DROP CONSTRAINT IF EXISTS booking_disputes_status_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE public.booking_disputes ADD CONSTRAINT booking_disputes_status_check
  CHECK (status IN (
    'open','salon_reviewing','salon_approved','salon_rejected',
    'escalated','admin_approved','admin_rejected',
    'refunded','charged','void','closed'
  ));

-- 4d. one OPEN case per booking per direction (replaces 075's blanket UNIQUE(booking_id))
DO $$ BEGIN
  ALTER TABLE public.booking_disputes DROP CONSTRAINT IF EXISTS one_complaint_per_booking;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS booking_disputes_one_open_per_dir
  ON public.booking_disputes (booking_id, direction)
  WHERE status NOT IN ('refunded','charged','void','closed','salon_rejected','admin_rejected');

-- 4e. partial-unique idempotency_key
CREATE UNIQUE INDEX IF NOT EXISTS booking_disputes_idempotency_key
  ON public.booking_disputes (idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 4f. helper indexes (SP-5 admin queue + salon list)
CREATE INDEX IF NOT EXISTS idx_booking_disputes_booking_id ON public.booking_disputes (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_disputes_status_created ON public.booking_disputes (status, created_at DESC);

-- 4g. updated_at trigger (reuse canonical fn)
DROP TRIGGER IF EXISTS booking_disputes_updated_at ON public.booking_disputes;
CREATE TRIGGER booking_disputes_updated_at
  BEFORE UPDATE ON public.booking_disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4h. RLS (guests are served via service-role token routes, NOT via RLS)
ALTER TABLE public.booking_disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS booking_disputes_select_reporter ON public.booking_disputes;
CREATE POLICY booking_disputes_select_reporter ON public.booking_disputes
  FOR SELECT USING (reporter_id = auth.uid());
DROP POLICY IF EXISTS booking_disputes_select_salon ON public.booking_disputes;
CREATE POLICY booking_disputes_select_salon ON public.booking_disputes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.bookings b JOIN public.salons s ON s.id = b.salon_id
    WHERE b.id = booking_disputes.booking_id AND s.owner_id = auth.uid()));
DROP POLICY IF EXISTS booking_disputes_update_salon ON public.booking_disputes;
CREATE POLICY booking_disputes_update_salon ON public.booking_disputes
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.bookings b JOIN public.salons s ON s.id = b.salon_id
    WHERE b.id = booking_disputes.booking_id AND s.owner_id = auth.uid()));
DROP POLICY IF EXISTS booking_disputes_admin_all ON public.booking_disputes;
CREATE POLICY booking_disputes_admin_all ON public.booking_disputes
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ------------------------------------------------------------
-- 5. CASE_EVENTS: the "what happened" timeline (single dispute_id FK, SP-3 shape)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.booking_disputes(id) ON DELETE CASCADE,
  actor_role text NOT NULL CHECK (actor_role IN ('customer','guest','salon','admin','system')),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL for guest/system
  action text NOT NULL,           -- 'created' | 'salon_approved' | 'salon_rejected' | 'escalated' | 'admin_approved' | 'admin_rejected' | 'refund_issued' | 'voided' | 'note'
  from_status text,
  to_status text,
  amount integer,                 -- Rappen, when the event moved money
  note text CHECK (note IS NULL OR char_length(note) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_events_dispute_created ON public.case_events (dispute_id, created_at);

ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS case_events_select_party ON public.case_events;
CREATE POLICY case_events_select_party ON public.case_events
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.booking_disputes d
    JOIN public.bookings b ON b.id = d.booking_id
    LEFT JOIN public.salons s ON s.id = b.salon_id
    WHERE d.id = case_events.dispute_id
      AND (d.reporter_id = auth.uid() OR s.owner_id = auth.uid())));
DROP POLICY IF EXISTS case_events_admin_all ON public.case_events;
CREATE POLICY case_events_admin_all ON public.case_events
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
-- INSERTs are service-role only (guest/system events); no public INSERT policy by design.

-- ------------------------------------------------------------
-- 6. FEATURE FLAGS: kill-switches per direction (feature_flags exists live)
-- ------------------------------------------------------------
DO $$ BEGIN
  INSERT INTO public.feature_flags (key, enabled, description)
  VALUES ('dispute_reporting', true, 'Customer-initiated dispute / refund-appeal (Lane B)')
  ON CONFLICT (key) DO NOTHING;
  INSERT INTO public.feature_flags (key, enabled, description)
  VALUES ('upcharge_requests', true, 'Salon upcharge requests (Lane A, customer-approved)')
  ON CONFLICT (key) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'feature_flags seed skipped (non-fatal): %', SQLERRM;
END $$;
