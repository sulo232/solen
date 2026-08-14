-- exists-check: extends supabase/migrations/040_client_notes.sql (widens its note_type CHECK constraint, no new table)
-- app/api/cron/barber-smart-reminders/route.ts + nail-infill-reminders/route.ts write client_notes
-- rows with note_type = 'system' (auto-generated reminder notes), and
-- app/api/dashboard/barber-reminders/route.ts (+ send) read them back by that same value. But the
-- LIVE constraint (verified 2026-07-12 via pg_get_constraintdef) allows
-- ('booking','permanent','cut_reminder','reminder_sent','infill_reminder') and NOT 'system', so
-- every reminder insert violated the constraint and failed silently (error only console.error'd,
-- withCronRun still reported ok). The whole barber/nail reminder feature is dead as a result.
--
-- FIX: ADD 'system' to the FULL existing live set. CRITICAL: preserve the existing values
-- (cut_reminder/reminder_sent/infill_reminder) , an earlier draft of this migration truncated the
-- set to ('booking','permanent','system'), which would have dropped 3 live-allowed values and
-- failed outright if any row already uses them. Additive, idempotent.
ALTER TABLE public.client_notes DROP CONSTRAINT IF EXISTS client_notes_note_type_check;
ALTER TABLE public.client_notes ADD CONSTRAINT client_notes_note_type_check
  CHECK (note_type IN ('booking', 'permanent', 'cut_reminder', 'reminder_sent', 'infill_reminder', 'system'));
