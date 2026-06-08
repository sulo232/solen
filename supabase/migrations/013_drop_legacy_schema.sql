-- Migration 013: Drop legacy tables that are incompatible with the new spec schema
-- These tables WERE all empty (0 rows) when this was written. They are NOT now:
-- services / bookings / messages / reviews are the LIVE, populated production tables.
-- The recreate migrations that FOLLOW 013 are already applied on prod, but 013 itself
-- shows as un-applied due to migration-tracking drift — so a `supabase db push` would run
-- this file and DROP the live booking system (IF EXISTS does NOT protect populated tables).
-- The guard below ENFORCES the original "all empty" precondition: if ANY target table still
-- holds rows it ABORTS the whole migration (the transaction rolls back, nothing is dropped),
-- so push fails loudly instead of destroying data. A genuine fresh replay (empty legacy
-- tables) proceeds normally. Reconcile migration tracking (mark 013+ applied) before any
-- db push — see _rules/DB_SCHEMA.md. profiles is kept and altered in 014.
DO $$
DECLARE
  n bigint;
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'store_staff','staff','client_profiles','walk_in_queue','reminders','reports',
    'marketing_campaigns','addon_requests','waiting_list','error_logs','blocked_dates',
    'salon_reg_drafts','gallery_items','analytics_events','salon_schedule',
    'services','bookings','messages','reviews','stores'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n;
      IF n > 0 THEN
        RAISE EXCEPTION 'Migration 013 refused: public.% holds % row(s) — this is the live DB and dropping would destroy the booking system. Reconcile migration tracking (mark 013+ applied) before db push. See _rules/DB_SCHEMA.md.', t, n;
      END IF;
    END IF;
  END LOOP;
END $$;

DROP TABLE IF EXISTS public.store_staff CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;
DROP TABLE IF EXISTS public.client_profiles CASCADE;
DROP TABLE IF EXISTS public.walk_in_queue CASCADE;
DROP TABLE IF EXISTS public.reminders CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.marketing_campaigns CASCADE;
DROP TABLE IF EXISTS public.addon_requests CASCADE;
DROP TABLE IF EXISTS public.waiting_list CASCADE;
DROP TABLE IF EXISTS public.error_logs CASCADE;
DROP TABLE IF EXISTS public.blocked_dates CASCADE;
DROP TABLE IF EXISTS public.salon_reg_drafts CASCADE;
DROP TABLE IF EXISTS public.gallery_items CASCADE;
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.salon_schedule CASCADE;

-- Drop tables that will be recreated with new schema
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
