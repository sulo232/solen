-- exists-check: net-new. Fixes the booking_disputes_status_check constraint (owner-approved 2026-07-03).
-- Applied via MCP apply_migration; mirrored here. Owns no table.

-- The admin dismiss/resolve actions (app/api/admin/booking-disputes/[id]/action/route.ts) write
-- status 'resolved'/'dismissed', but the CHECK rejected them (Postgres 23514), so those actions
-- silently failed. Widen the CHECK to include both. Additive (superset of the prior values; no
-- existing row can violate). DROP+ADD is the only way to modify a CHECK expression.
ALTER TABLE public.booking_disputes DROP CONSTRAINT IF EXISTS booking_disputes_status_check;
ALTER TABLE public.booking_disputes ADD CONSTRAINT booking_disputes_status_check
  CHECK (status = ANY (ARRAY[
    'open','salon_reviewing','salon_approved','salon_rejected','escalated',
    'admin_approved','admin_rejected','refunded','charged','void','closed','resolved','dismissed'
  ]));
