-- Smart Search Phase 0: search extensions + immutable unaccent wrapper.
-- Applied via Supabase apply_migration on 2026-06-06; mirrored here so the repo
-- stays the source of truth (no schema drift).
--
-- Stock unaccent() is STABLE and cannot be used in generated columns / index
-- expressions (this exact trap silently broke a GIN index in migration 067).
-- The unaccent dictionary is fixed, so an IMMUTABLE wrapper is the standard,
-- safe fix. Mirrors the pattern the Discovery FTS already relies on.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = pg_catalog
as $func$ select extensions.unaccent('extensions.unaccent'::regdictionary, $1) $func$;

comment on function public.f_unaccent(text) is
  'Immutable accent-folding wrapper for Smart Search (Phase 0). Safe because the unaccent dictionary is fixed.';

-- Teardown (forward-only repo; manual rollback if ever needed):
--   drop function if exists public.f_unaccent(text);
--   -- extensions left in place (harmless, shared).
