-- ============================================================
-- 20260602090000_seed_platform_settings_and_warnings
--
-- Creates + seeds the two tables CONFIRMED ABSENT from the live DB
-- (verified 2026-06-02 against the codebase: no migration ever creates
-- either one). Their absence silently breaks two admin surfaces:
--
--   1. public.platform_settings — the key/value config store. ~11 code
--      paths read the 'commission' row for the booking-fee percentage
--      (e.g. app/api/stripe/webhook/route.ts, lib/bookings/dispute-engine.ts,
--      lib/bookings/charge-fee.ts, app/api/stripe/booking-pay-intent/route.ts,
--      app/api/walkin/pay-intent/route.ts, app/api/stripe/create-payment-intent,
--      app/api/cron/pre-charge, app/api/packages/purchase). With the table
--      gone every read returns null and falls back to
--      DEFAULT_COMMISSION_RATE_PERCENT = 15 (lib/constants/billing.ts), so
--      commission is UN-configurable and the admin commission UI
--      (GET/PUT app/api/admin/commission/route.ts) errors on read/write.
--      The same table also backs key='homepage_sections'
--      (app/api/admin/homepage-sections/route.ts + app/api/homepage-sections).
--
--   2. public.warnings — INSERTed by the admin warn_customer / warn_salon
--      dispute actions (app/api/admin/booking-disputes/[id]/action/route.ts
--      ~line 294). The table does not exist anywhere, so those two actions
--      throw. NOTE: the code comment there says "migration 063", but
--      063_warnings.sql only adds salons.warning_count/frozen_at/frozen_reason
--      columns — it never creates a `warnings` table. (Migration
--      075_strikes_warnings.sql creates a DIFFERENT table, `account_warnings`,
--      with a different shape — salon_id / severity / metadata — used by
--      lib/strikes.ts. That one is also still absent on live; it is
--      re-created at the bottom of this file from 075's exact definition so
--      the penalty engine works too, but it is NOT the table the dispute
--      warn actions insert into.)
--
-- Forward-only, fully guarded (IF NOT EXISTS + DROP POLICY IF EXISTS),
-- re-runnable, NO data deletion. Mirrors the pattern of
-- 20260601132922_salon_payouts.sql (another "migration never landed" carry).
--
-- Service-role note: every read above goes through createAdminSupabaseClient()
-- (the service-role key), which BYPASSES RLS. So RLS here can be strict —
-- reads/writes by the platform happen as service-role; the explicit policies
-- below only govern any direct end-user (anon/authenticated) access.
-- ============================================================


-- ------------------------------------------------------------
-- 1. platform_settings (key/value config store)
-- ------------------------------------------------------------
-- Column shape matched EXACTLY to the code's reads + writes:
--   reads : .from("platform_settings").select("value, updated_at").eq("key", <k>)
--           then setting.value.rate_percent  (value is jsonb, read as an object)
--   writes: .upsert({ key, value, updated_at, updated_by })
--           (app/api/admin/commission/route.ts:70 and
--            app/api/admin/homepage-sections/route.ts:63)
-- Therefore the table MUST carry an `updated_by` column too — without it the
-- PostgREST upsert would reject the unknown column and the admin PUT would
-- 500. (The original task brief listed only key/value/updated_at; adding
-- updated_by is required to match the live write shape.)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Backfill `updated_by` if an earlier partial apply created the table without it.
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON TABLE  public.platform_settings IS 'Key/value platform config. value is jsonb. Read/written by the service-role client (RLS bypassed).';
COMMENT ON COLUMN public.platform_settings.key   IS 'Config key. Known keys: ''commission'' ({rate_percent:int}), ''homepage_sections'' ({sectionKey:bool}).';
COMMENT ON COLUMN public.platform_settings.value IS 'jsonb config payload. For ''commission'': {"rate_percent": 15}.';

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Admins may read/write directly (service-role bypasses RLS regardless; this
-- only matters for a logged-in admin hitting the table via the anon/auth key).
DROP POLICY IF EXISTS "platform_settings_admin_all" ON public.platform_settings;
CREATE POLICY "platform_settings_admin_all" ON public.platform_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
-- NOTE: no public/anon read policy by design. The commission rate is read
-- server-side via the service-role client, never from the browser.

-- Seed the 'commission' row at the canonical default (15%). ON CONFLICT DO
-- NOTHING so re-runs (and a later admin-set rate) are never clobbered.
INSERT INTO public.platform_settings (key, value)
VALUES ('commission', '{"rate_percent": 15}'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ------------------------------------------------------------
-- 2. warnings (admin dispute warn_customer / warn_salon target)
-- ------------------------------------------------------------
-- Column shape matched EXACTLY to the only INSERT against it
-- (app/api/admin/booking-disputes/[id]/action/route.ts, warn_customer /
--  warn_salon branch):
--     .from("warnings").insert({ user_id, issued_by, reason, dispute_id })
-- user_id  = the warned party (reporter_id or reported_id of the dispute)
-- issued_by = the acting admin
-- reason    = resolution note (falls back to a generated string)
-- dispute_id = the dispute the warning came from
--
-- dispute_id is a plain uuid (NOT a hard FK to booking_disputes): under this
-- project's schema drift booking_disputes is created by two different
-- IF-NOT-EXISTS migrations and isn't guaranteed present at apply time, so a
-- hard FK could make THIS migration fail to apply. The value is still the
-- dispute's id; we just don't enforce referential integrity here.
CREATE TABLE IF NOT EXISTS public.warnings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  issued_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason     text NOT NULL,
  dispute_id uuid,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.warnings IS 'Admin-issued warnings to a user, raised from the dispute warn_customer/warn_salon actions. Written by the service-role client (RLS bypassed).';

ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;

-- A user can see warnings issued to them.
DROP POLICY IF EXISTS "warnings_select_own" ON public.warnings;
CREATE POLICY "warnings_select_own" ON public.warnings
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read + write directly (service-role bypasses RLS regardless).
DROP POLICY IF EXISTS "warnings_admin_all" ON public.warnings;
CREATE POLICY "warnings_admin_all" ON public.warnings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Lookup indexes.
CREATE INDEX IF NOT EXISTS idx_warnings_user_id    ON public.warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_warnings_dispute_id ON public.warnings(dispute_id);


-- ------------------------------------------------------------
-- 3. account_warnings (penalty engine — lib/strikes.ts)
-- ------------------------------------------------------------
-- Carried VERBATIM from 075_strikes_warnings.sql (which never landed on live).
-- This is a SEPARATE table from `warnings` above: lib/strikes.ts inserts
-- here for the cancellation/no-show strike system (ToS §3.3, §4.4, §6.6),
-- using columns salon_id / severity / metadata. Re-created here, guarded, so
-- the strike engine also stops silently failing. All DDL below is 075's
-- exact definition, made idempotent (DROP POLICY IF EXISTS before CREATE).
CREATE TABLE IF NOT EXISTS public.account_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('warning', 'strike', 'suspension')),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.account_warnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_warnings_select_admin" ON public.account_warnings;
CREATE POLICY "account_warnings_select_admin" ON public.account_warnings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "account_warnings_select_salon" ON public.account_warnings;
CREATE POLICY "account_warnings_select_salon" ON public.account_warnings
  FOR SELECT USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "account_warnings_select_user" ON public.account_warnings;
CREATE POLICY "account_warnings_select_user" ON public.account_warnings
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Admins can insert/update
DROP POLICY IF EXISTS "account_warnings_all_admin" ON public.account_warnings;
CREATE POLICY "account_warnings_all_admin" ON public.account_warnings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_account_warnings_salon_id ON public.account_warnings(salon_id);
CREATE INDEX IF NOT EXISTS idx_account_warnings_user_id ON public.account_warnings(user_id);
