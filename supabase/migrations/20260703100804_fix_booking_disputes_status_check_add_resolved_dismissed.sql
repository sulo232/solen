-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Owner-approved 2026-07-03. The admin dismiss/resolve actions write status 'resolved'/'dismissed'
-- (app/api/admin/booking-disputes/[id]/action/route.ts) but the CHECK rejected them (23514), so those
-- actions silently failed. Widen the CHECK to include them. Additive (superset of the old values, no
-- existing row can violate). DROP+ADD is the only way to modify a CHECK.
ALTER TABLE public.booking_disputes DROP CONSTRAINT IF EXISTS booking_disputes_status_check;
ALTER TABLE public.booking_disputes ADD CONSTRAINT booking_disputes_status_check
  CHECK (status = ANY (ARRAY[
    'open','salon_reviewing','salon_approved','salon_rejected','escalated',
    'admin_approved','admin_rejected','refunded','charged','void','closed','resolved','dismissed'
  ]));