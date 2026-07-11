-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Reconcile to migration 068's documented intent (DEFAULT true): the column was lost to schema
-- drift and my first apply set it false. Restore default true and backfill existing salons.
ALTER TABLE public.salons ALTER COLUMN auto_complete_enabled SET DEFAULT true;
UPDATE public.salons SET auto_complete_enabled = true WHERE auto_complete_enabled = false;