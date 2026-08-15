-- Calendar polish brick 3: client-first booking.
-- Link a booked availability_slot to its CRM record (salon_clients) so walk-in /
-- new clients (no app profile) still show the right person on the board + panel.
-- Applied directly to the live DB via Supabase MCP on 2026-05-30 (recorded as
-- migration "calendar_slot_client_link"). Additive + idempotent.
-- ON DELETE SET NULL keeps the slot if the client record is later removed.

ALTER TABLE availability_slots
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES salon_clients(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_availability_slots_client ON availability_slots(client_id);
