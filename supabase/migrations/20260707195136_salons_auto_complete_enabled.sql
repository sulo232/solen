-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS auto_complete_enabled boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.salons.auto_complete_enabled IS 'When true, the auto-complete cron (app/api/cron/auto-complete) marks this salon''s confirmed bookings completed 48h after they end. Default false = opt-in per salon.';