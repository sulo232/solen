-- exists-check: net-new. Only single-column FK indexes existed on bookings (idx_bookings_salon_id,
-- _user_id, _service_id, _staff_member_id); these two composites were missing. Perf pass; applied
-- 2026-07-03 via MCP apply_migration, mirrored here. Owns no table.

-- Composite indexes on bookings. Prerequisites for the analytics aggregation RPCs (GROUP BY salon,
-- status, time-range) and they also speed the current salon+status time-range pulls
-- (dashboard/clients, analytics/salon/[id], availability). Additive/safe.
CREATE INDEX IF NOT EXISTS idx_bookings_salon_starts ON public.bookings (salon_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_bookings_salon_status_starts ON public.bookings (salon_id, status, starts_at);
