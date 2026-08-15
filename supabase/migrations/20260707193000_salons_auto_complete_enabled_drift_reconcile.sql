-- exists-check: net-new file documenting a LIVE drift reconciliation (npm run exists
--   auto_complete_enabled = 0 non-migration hits). The column ORIGIN is migration 068
--   (068_megabuild_foundation.sql: ADD COLUMN IF NOT EXISTS auto_complete_enabled BOOLEAN
--   DEFAULT true). This file does NOT create a new structure; it re-asserts 068's DDL because
--   the live DB had drifted (the column was absent on production), which made the
--   app/api/cron/auto-complete cron a permanent no-op. Kept idempotent so it is a safe no-op
--   on any environment where 068 already applied.
--
-- Audit trail (council disclosure, 2026-07-07): applied live via the Supabase MCP on 2026-07-07
-- as two steps (add column, then default true + backfill existing salons to true). This file
-- captures the net effect so a fresh replay / other environment reproduces production exactly.
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS auto_complete_enabled boolean NOT NULL DEFAULT true;
-- Make sure the default matches 068 (true) even if an earlier partial apply set it false.
ALTER TABLE public.salons ALTER COLUMN auto_complete_enabled SET DEFAULT true;
COMMENT ON COLUMN public.salons.auto_complete_enabled IS 'When true, the auto-complete cron (app/api/cron/auto-complete) marks this salon''s confirmed bookings completed 48h after they end. Origin: migration 068; live drift reconciled 2026-07-07.';
