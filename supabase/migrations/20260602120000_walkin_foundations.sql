-- ============================================================
-- 20260602120000_walkin_foundations  (Walk-in system — Phase 0)
--
-- Foundations + the council's silent-landmine fixes:
--   1. Enable Realtime on the live queue (it was NOT in the publication →
--      the operator board's postgres_changes subscription never pushed).
--   2. Position integrity — a partial UNIQUE index so two simultaneous joins
--      can't share a position (the read-max-then-insert race).
--   3. Per-shop feature toggles + walk-in settings (walk_in/booking/marketplace
--      modules, walkin_mode, pause, timezone for the daily ticket reset).
--   4. salon_pace — adaptive-ETA EWMA store (used in Phase 5; created now).
--
-- Idempotent + additive. All target tables already exist (salons,
-- barber_walkin_queue). Standalone — does NOT depend on any unapplied migration.
-- ============================================================

-- 1. Realtime on the live queue ------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'barber_walkin_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.barber_walkin_queue;
  END IF;
END $$;
-- FULL replica identity so UPDATE/DELETE events carry the whole row to subscribers.
ALTER TABLE public.barber_walkin_queue REPLICA IDENTITY FULL;

-- 2. Position integrity --------------------------------------------------------
-- No two ACTIVE (waiting/in_chair) entries at a salon may hold the same position.
-- NULL positions are allowed (don't collide). Table is currently empty → safe.
CREATE UNIQUE INDEX IF NOT EXISTS uq_walkin_queue_salon_position
  ON public.barber_walkin_queue (salon_id, position)
  WHERE status IN ('waiting', 'in_chair');

-- 3. Per-shop feature toggles + walk-in settings -------------------------------
-- Defaults preserve TODAY's behaviour for existing salons (booking + listed on).
-- walkin_enabled defaults OFF (opt-in) and is backfilled true for barbershops so
-- the existing category-gated walk-in keeps working once Phase 2 gates on it.
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS walkin_enabled         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS online_booking_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS listed_on_marketplace  boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS walkin_mode            text    DEFAULT 'pay_at_counter',
  ADD COLUMN IF NOT EXISTS walkin_paused          boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS timezone               text    DEFAULT 'Europe/Zurich';

-- walkin_mode allowed values.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'salons_walkin_mode_chk') THEN
    ALTER TABLE public.salons ADD CONSTRAINT salons_walkin_mode_chk
      CHECK (walkin_mode IN ('pay_at_counter', 'pay_first')) NOT VALID;
    ALTER TABLE public.salons VALIDATE CONSTRAINT salons_walkin_mode_chk;
  END IF;
END $$;

-- "Listed on marketplace" requires at least one customer-facing module to be on.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'salons_listed_requires_module_chk') THEN
    ALTER TABLE public.salons ADD CONSTRAINT salons_listed_requires_module_chk
      CHECK (NOT listed_on_marketplace OR online_booking_enabled OR walkin_enabled) NOT VALID;
    ALTER TABLE public.salons VALIDATE CONSTRAINT salons_listed_requires_module_chk;
  END IF;
END $$;

-- Backfill: existing barbershops keep walk-in on (Phase 2 gates joins on this flag).
UPDATE public.salons SET walkin_enabled = true
  WHERE 'barbershop' = ANY(categories) AND walkin_enabled IS NOT TRUE;

-- 4. salon_pace (adaptive ETA, Phase 5) ----------------------------------------
CREATE TABLE IF NOT EXISTS public.salon_pace (
  salon_id     uuid PRIMARY KEY REFERENCES public.salons(id) ON DELETE CASCADE,
  pace_minutes numeric,
  sample_count integer NOT NULL DEFAULT 0,
  updated_at   timestamptz DEFAULT now()
);
ALTER TABLE public.salon_pace ENABLE ROW LEVEL SECURITY;
-- Owner may read their pace; the walk-in routes read/write via the service-role
-- client (RLS bypassed), so no public/insert policy is needed.
DROP POLICY IF EXISTS "salon_pace_owner_select" ON public.salon_pace;
CREATE POLICY "salon_pace_owner_select" ON public.salon_pace
  FOR SELECT USING (salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid()));
