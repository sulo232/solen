-- exists-check: net-new vs supabase/migrations/027_rls_hardening.sql (which creates the
-- sibling view public.public_profiles) because that file only references/creates
-- public_profiles, never profile_summaries; grep -rln "profile_summaries"
-- supabase/migrations/ returns nothing and grep across app/, lib/, supabase/ for
-- "profile_summaries" outside the generated lib/database.types.ts also returns nothing.
-- This is the missing migration for that already-live view, not an extension of an
-- unrelated one.
--
-- Ring: public.profile_summaries is a LIVE view (lib/database.types.ts:8480-8496, Row
-- shape avatar_url/display_name/id, identical to public_profiles) with no migration file
-- anywhere, so its schema was not reproducible from source (audit finding, low severity).
-- It has no code caller outside the generated types file, so it is dormant duplication of
-- public_profiles rather than something to drop unilaterally: dropping a live schema
-- object needs an explicit owner decision (it could still be read by the Supabase
-- dashboard, an ad hoc query, or an as-yet-unshipped caller), so this migration documents
-- the view instead of dropping it.
--
-- CREATE OR REPLACE VIEW is a no-op against the already-existing live view (same
-- definition as public_profiles per 027_rls_hardening.sql); this migration exists purely
-- so the schema is versioned going forward, not to change any live behavior. GRANT SELECT
-- mirrors the sibling public_profiles grant and is idempotent if already granted live.
CREATE OR REPLACE VIEW public.profile_summaries AS
  SELECT id, display_name, avatar_url
  FROM public.profiles;

GRANT SELECT ON public.profile_summaries TO anon, authenticated;
