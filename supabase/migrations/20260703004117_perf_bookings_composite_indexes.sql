-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Perf pass: composite indexes on bookings that were assumed to exist but don't (only single-column
-- FK indexes were present). Prerequisites for the analytics aggregation RPCs, and they also speed the
-- current salon-scoped + status-scoped time-range pulls (dashboard/clients, analytics/salon,
-- availability paths). Additive/safe; small table today so the build is instant.
CREATE INDEX IF NOT EXISTS idx_bookings_salon_starts ON public.bookings (salon_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_bookings_salon_status_starts ON public.bookings (salon_id, status, starts_at);