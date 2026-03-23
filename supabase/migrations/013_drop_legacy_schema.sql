-- Migration 013: Drop legacy tables that are incompatible with the new spec schema
-- These tables are all empty (0 rows) so no data loss.
-- profiles table (5 rows) is kept and altered in 014.

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
