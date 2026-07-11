-- backfilled 2026-07-11 from supabase_migrations.schema_migrations
-- (applied live via MCP apply_migration; file restored for fresh-env reproducibility)
-- exists-check: net-new file backfill of an already-applied live migration; no local file existed
-- Owner-approved 2026-07-03. Leftover scratch table: 0 rows, single id column, no PK, RLS-enabled with
-- no policy (advisor-flagged). Not referenced by any app code. Drop it.
DROP TABLE IF EXISTS public.test_table;