-- Allow the barber smart-reminder contract values for client_notes.note_type.
-- The cron (barber-smart-reminders) writes the due-cut reminder row, and the
-- manual /send route writes the cooldown marker. Both previously used an
-- illegal note_type ('system'), so every insert silently failed the CHECK and
-- the dashboard reminder list was always empty. Additive + idempotent.
ALTER TABLE public.client_notes
  DROP CONSTRAINT IF EXISTS client_notes_note_type_check;

ALTER TABLE public.client_notes
  ADD CONSTRAINT client_notes_note_type_check
  CHECK (note_type IN ('booking', 'permanent', 'cut_reminder', 'reminder_sent'));
