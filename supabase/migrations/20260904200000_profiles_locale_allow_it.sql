-- 2026-09-04: profiles.locale may be Italian. APPLIED LIVE the same evening (Supabase MCP, migration
-- name profiles_locale_allow_it) on the owner's word ("number two yeah, the other languages be able to
-- select and save"), through the guard's owner-approved override, since a check constraint can only
-- be widened by drop + add. Checked after applying: pg_get_constraintdef shows de, en, fr, it, and
-- saving each of the four through PATCH /api/profile answered 200. No inventory change (no table or
-- column moved).
-- The live check constraint allowed de, en, fr only (014_new_schema.sql had de/en; fr was added later
-- outside these files). The app offers four languages, so an Italian customer saving Italian in
-- Profile > Settings > Language was refused by the database. Widen the check to the four locales in
-- lib/locale-constants.ts. No data changes.
alter table public.profiles drop constraint if exists profiles_locale_check;
alter table public.profiles
  add constraint profiles_locale_check check (locale = any (array['de'::text, 'en'::text, 'fr'::text, 'it'::text]));
