-- 2026-09-04: profiles.locale may be Italian. NOT APPLIED LIVE YET: the apply guard refuses any
-- DROP, and a check constraint can only be widened by drop + add. Waiting for the owner's word;
-- then apply via apply_migration (name: profiles_locale_allow_it) and refresh _inventory.
-- The live check constraint allowed de, en, fr only (014_new_schema.sql had de/en; fr was added later
-- outside these files). The app offers four languages, so an Italian customer saving Italian in
-- Profile > Settings > Language was refused by the database. Widen the check to the four locales in
-- lib/locale-constants.ts. No data changes.
alter table public.profiles drop constraint if exists profiles_locale_check;
alter table public.profiles
  add constraint profiles_locale_check check (locale = any (array['de'::text, 'en'::text, 'fr'::text, 'it'::text]));
