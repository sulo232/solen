-- exists-check: net-new vs supabase/migrations/040_client_notes.sql (which created the
-- table + original note_type check). Migrations are append-only/immutable, so this is a
-- separate additive constraint change, NOT an edit of 040.
--
-- Allow the 'infill_reminder' note_type on client_notes.
--
-- The nail-infill-reminders cron writes client_notes with note_type='infill_reminder',
-- but the check constraint only allowed booking/permanent/cut_reminder/reminder_sent, so
-- every insert was silently rejected (the cron also passed an invalid created_by; fixed in
-- the route). This adds 'infill_reminder' so the nail retention loop can persist its notes,
-- mirroring the working barber 'cut_reminder' loop.
--
-- Additive + idempotent: a strict superset of the prior allowed set, so no existing row can
-- be invalidated. Applied to prod 2026-06-24 via apply_migration.

ALTER TABLE public.client_notes DROP CONSTRAINT IF EXISTS client_notes_note_type_check;
ALTER TABLE public.client_notes ADD CONSTRAINT client_notes_note_type_check
  CHECK (note_type = ANY (ARRAY['booking'::text, 'permanent'::text, 'cut_reminder'::text, 'reminder_sent'::text, 'infill_reminder'::text]));
