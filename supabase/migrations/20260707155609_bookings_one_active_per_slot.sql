-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
CREATE UNIQUE INDEX IF NOT EXISTS bookings_one_active_per_slot
  ON public.bookings (slot_id)
  WHERE slot_id IS NOT NULL
    AND group_booking_id IS NULL
    AND status IN ('pending', 'pending_approval', 'confirmed');