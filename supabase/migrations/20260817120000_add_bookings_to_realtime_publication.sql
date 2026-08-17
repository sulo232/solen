-- exists-check: net-new vs 004_salon_photos.sql, 080_salon_drafts.sql, 053_salon_groups.sql,
-- 042_off_peak_slots.sql, 033_guest_checkout.sql, 017_salon_analytics.sql, 077_salon_documents.sql,
-- 001_booking_reviews.sql (all unrelated migrations the filename-similarity gate flagged; every
-- migration file is always net-new by convention, never edited after merge). The actual closest
-- match is supabase/migrations/20260602120000_walkin_foundations.sql, whose realtime-publication
-- DO block (lines 17-25) this file copies verbatim for a different table.
--
-- Ring 12 (R12-2, _plans/MERCHANT_TERMINAL_2026-08-15.md): add `bookings` to the
-- `supabase_realtime` publication so the salon terminal's live subscription
-- (ActivityFeed's postgres_changes listener on `bookings`) actually fires. Before
-- this, the publication carried `availability_slots, barber_walkin_queue,
-- conversations, messages, notifications` and NOT `bookings`, so a new booking
-- never pushed to any open salon screen.
--
-- Idempotent: wrapped in a DO block that checks pg_publication_tables first,
-- copying the exact pattern already used for `barber_walkin_queue`
-- (supabase/migrations/20260602120000_walkin_foundations.sql:17-25).
--
-- Note (2026-08-17): this exact change was already applied directly to the live
-- project and verified via pg_publication_tables (see MERCHANT_TERMINAL_2026-08-15.md
-- R12-2). This migration file makes that change reproducible from a fresh DB / a
-- future reset; running it again is a safe no-op because of the existence check.

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  END IF;
END $$;

-- FULL replica identity so UPDATE/DELETE events carry the whole row to subscribers,
-- matching the walk-in queue's own replica identity setting.
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
