-- V3-D405 (#20): relevance-ranked discovery search.
--
-- Root-causes the drift from migration 067: its GIN index built the tsvector inline with
-- to_tsvector(...), which Postgres rejects in an index expression ("functions in index expression
-- must be marked IMMUTABLE") — so 067's index silently never applied. Fix = an explicitly IMMUTABLE
-- doc-builder wrapper, a GIN index on that, and a ranked search RPC that reuses the same expression
-- (so the index is actually hit). The API calls search_discovery() whenever there's a query term.
--
-- Applied to the live project via Supabase migration tooling on 2026-05-31; committed here for the record.

create or replace function discovery_fts_doc(
  p_name text, p_author text, p_style text, p_description text, p_tags text[]
) returns tsvector
language sql immutable
set search_path = public
as $$
  select to_tsvector('english',
    coalesce(p_name,'') || ' ' || coalesce(p_author,'') || ' ' || coalesce(p_style,'') || ' ' ||
    coalesce(p_description,'') || ' ' || array_to_string(coalesce(p_tags, '{}'), ' '));
$$;

create index if not exists idx_discovery_fts on discovery_items
  using gin (discovery_fts_doc(name, author_name, style_name, description, tags));

create or replace function search_discovery(
  q          text,
  p_category text default null,
  p_gender   text default null,
  p_texture  text default null,
  p_style    text default null,
  p_limit    int  default 12,
  p_offset   int  default 0
)
returns table (
  id uuid, source text, content_type text, media_type text,
  image_url text, tiktok_url text, tiktok_thumbnail_url text, tiktok_embed_html text,
  author_name text, style_name text, alt_text text, tags text[], price_min integer,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with tsq as (select websearch_to_tsquery('english', q) as query)
  select
    di.id, di.source, di.content_type, di.media_type,
    di.image_url, di.tiktok_url, di.tiktok_thumbnail_url, di.tiktok_embed_html,
    di.author_name, di.style_name, di.alt_text, di.tags, di.price_min,
    count(*) over () as total_count
  from discovery_items di, tsq
  where di.status = 'published' and di.is_active
    and (p_category is null or di.category   = p_category)
    and (p_gender   is null or di.gender     = p_gender)
    and (p_texture  is null or di.texture    = p_texture)
    and (p_style    is null or di.style_name = p_style)
    and discovery_fts_doc(di.name, di.author_name, di.style_name, di.description, di.tags) @@ tsq.query
  order by
    ts_rank(discovery_fts_doc(di.name, di.author_name, di.style_name, di.description, di.tags), tsq.query) desc,
    di.sort_order asc, di.created_at desc
  limit greatest(p_limit, 0) offset greatest(p_offset, 0);
$$;

grant execute on function search_discovery(text,text,text,text,text,int,int) to anon, authenticated, service_role;
