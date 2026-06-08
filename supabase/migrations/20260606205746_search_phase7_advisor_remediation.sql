-- Smart Search Phase 7 (ops): remediate security advisors from the search DDL.
-- Applied via apply_migration 2026-06-06 (version 20260606205746); mirrored here.

-- 1. search_zero_results: run as INVOKER so it respects search_events RLS
--    (anon/authenticated see nothing; admin/service-role mine zero-results).
alter view public.search_zero_results set (security_invoker = true);

-- 2. search_popularity is an internal ranking signal, not a public API surface.
--    The SECURITY DEFINER ranker reads it as owner, so revoking public select is safe.
revoke select on public.search_popularity from anon, authenticated;

-- 3. Pin search_path on the pre-existing semantic RPC (plan §8: don't inherit the bug).
alter function public.match_search_embeddings(vector, text, uuid, double precision, integer)
  set search_path = public, extensions;

-- Intentional (NOT remediated): search_salons_ranked + search_suggest are SECURITY
-- DEFINER executable by anon/authenticated BY DESIGN (public search RPCs; they must
-- run as owner to read the locked-down weights + embeddings and enforce gates). They
-- are hardened (pinned search_path, parameterized, gates baked in).
