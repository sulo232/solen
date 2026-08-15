-- exists-check: net-new. Drops the leftover public.test_table (owner-approved 2026-07-03). Applied via
-- MCP apply_migration; mirrored here.

-- Scratch table: 0 rows, single id column, no primary key, RLS-enabled with no policy (advisor-flagged
-- no_primary_key + rls_enabled_no_policy). Not referenced by any app code.
DROP TABLE IF EXISTS public.test_table;
