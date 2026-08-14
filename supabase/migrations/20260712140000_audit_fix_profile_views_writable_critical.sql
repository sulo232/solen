-- exists-check: ALTER/REVOKE on existing live views (public_profiles, profile_summaries); net-new
-- file (never edit an already-applied migration). Apply live via MCP apply_migration (owner-gated).
--
-- CRITICAL (deep-audit Round 2, LIVE-VERIFIED 2026-07-12 via information_schema.role_table_grants):
-- public_profiles + profile_summaries are simple single-table projection views over public.profiles
-- with NO security_invoker (so they execute as the view OWNER, bypassing profiles' RLS) AND with
-- INSERT/UPDATE/DELETE granted to anon/authenticated. A simple projection view is updatable/deletable
-- in Postgres, so ANY signed-in user (profile_summaries: even anon) can run
--   DELETE FROM public.public_profiles WHERE id = '<any other user>';
-- and it deletes/defaces that user's underlying profiles row, bypassing RLS. That cascades to the
-- user's salon. This ALSO is the fix for the Supabase advisor 0010 SECURITY DEFINER VIEW error on
-- both views.
--
-- FIX (provably non-breaking , grep confirms the app ONLY reads these views, never writes; verified
-- 2026-07-12): (1) revoke all write privileges (they are read-only projections); (2) set
-- security_invoker = true so the view runs with the querying user's RLS, not the owner's. SELECT for
-- anon/authenticated is preserved (the public display + booking-name enrichment still work).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.public_profiles FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profile_summaries FROM anon, authenticated;

ALTER VIEW public.public_profiles SET (security_invoker = true);
ALTER VIEW public.profile_summaries SET (security_invoker = true);
