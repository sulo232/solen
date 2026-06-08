-- Smart Search Phase 1a: weighted FTS docs + GIN + trigram indexes.
-- Applied via apply_migration 2026-06-06; mirrored here (repo = source of truth).
-- Mirrors discovery_fts_doc (IMMUTABLE, hardcoded regconfig) + adds f_unaccent
-- folding and German/English weighting. name=A, category=B, description=C.

create or replace function public.service_search_doc(
  p_name_de text, p_name_en text, p_category text, p_subcategory text,
  p_desc_de text, p_desc_en text)
returns tsvector language sql immutable set search_path = pg_catalog
as $func$
  select
    setweight(to_tsvector('german',  public.f_unaccent(coalesce(p_name_de,''))),'A') ||
    setweight(to_tsvector('english', public.f_unaccent(coalesce(p_name_en,''))),'A') ||
    setweight(to_tsvector('simple',  public.f_unaccent(coalesce(p_category,'')||' '||coalesce(p_subcategory,''))),'B') ||
    setweight(to_tsvector('german',  public.f_unaccent(coalesce(p_desc_de,''))),'C') ||
    setweight(to_tsvector('english', public.f_unaccent(coalesce(p_desc_en,''))),'C')
$func$;

create or replace function public.salon_search_doc(p_name text, p_desc_de text, p_desc_en text)
returns tsvector language sql immutable set search_path = pg_catalog
as $func$
  select
    setweight(to_tsvector('simple',  public.f_unaccent(coalesce(p_name,''))),'A') ||
    setweight(to_tsvector('german',  public.f_unaccent(coalesce(p_desc_de,''))),'C') ||
    setweight(to_tsvector('english', public.f_unaccent(coalesce(p_desc_en,''))),'C')
$func$;

alter table public.services add column if not exists search_doc tsvector
  generated always as (public.service_search_doc(name_de,name_en,category,subcategory,description_de,description_en)) stored;
alter table public.salons add column if not exists search_doc tsvector
  generated always as (public.salon_search_doc(name,description_de,description_en)) stored;

create index if not exists idx_services_search_doc on public.services using gin(search_doc);
create index if not exists idx_salons_search_doc   on public.salons   using gin(search_doc);

create index if not exists idx_services_name_de_trgm on public.services using gin (lower(public.f_unaccent(name_de)) gin_trgm_ops);
create index if not exists idx_services_name_en_trgm on public.services using gin (lower(public.f_unaccent(name_en)) gin_trgm_ops);
create index if not exists idx_salons_name_trgm      on public.salons   using gin (lower(public.f_unaccent(name)) gin_trgm_ops);

-- Teardown:
--   drop index if exists idx_services_search_doc, idx_salons_search_doc,
--     idx_services_name_de_trgm, idx_services_name_en_trgm, idx_salons_name_trgm;
--   alter table public.services drop column if exists search_doc;
--   alter table public.salons   drop column if exists search_doc;
--   drop function if exists public.service_search_doc(text,text,text,text,text,text);
--   drop function if exists public.salon_search_doc(text,text,text);
