-- V3-D413 (2026-05-31): search dropdown — recent searches + typed style suggestions, both with a resolved
-- representative thumbnail (or NULL → the UI shows a neutral search-tile, never a wrong/random photo).
-- Models the exact term→photo resolution already used by discovery_chip_terms / discovery_trending_terms,
-- and the same FTS predicate used by search_discovery (discovery_fts_doc @@ websearch_to_tsquery).

-- ── resolver: best published item for an arbitrary search term, or no row (→ thumb NULL) ──────────────
-- Confidence guard: only returns a photo when the term actually matches content via FTS. A typo / "near me"
-- / a salon name → no FTS match → 0 rows → caller renders a neutral tile. Kills the "random thumbnail" risk.
create or replace function public.discovery_resolve_thumb(p_term text)
returns table(item_id uuid, tiktok_url text, image_url text, tiktok_thumbnail_url text)
language sql stable set search_path to 'public' as $$
  with tsq as (select websearch_to_tsquery('english', coalesce(p_term,'')) as query)
  select di.id, di.tiktok_url, di.image_url, di.tiktok_thumbnail_url
  from discovery_items di, tsq
  where di.status = 'published' and di.is_active
    and discovery_fts_doc(di.name, di.author_name, di.style_name, di.description, di.tags) @@ tsq.query
  order by ts_rank(discovery_fts_doc(di.name, di.author_name, di.style_name, di.description, di.tags), tsq.query) desc,
           di.sort_order asc nulls last, di.created_at desc
  limit 1;
$$;

-- ── recent searches for a user (newest-first, deduped by normalized term) + a resolved thumb each ─────
-- SECURITY DEFINER: the route passes the authed user id (service-role call); definer lets it read regardless.
create or replace function public.discovery_recent_searches(p_user_id uuid, p_limit int default 6)
returns table(term text, item_id uuid, tiktok_url text, image_url text, tiktok_thumbnail_url text)
language sql stable security definer set search_path to 'public' as $$
  with recent as (
    select normalized as term, max(created_at) as last_at
    from discovery_search_events
    where user_id = p_user_id and coalesce(btrim(normalized), '') <> ''
    group by normalized
    order by max(created_at) desc
    limit greatest(coalesce(p_limit, 6), 0)
  )
  select r.term, t.item_id, t.tiktok_url, t.image_url, t.tiktok_thumbnail_url
  from recent r
  left join lateral public.discovery_resolve_thumb(r.term) t on true
  order by r.last_at desc;
$$;

-- ── typed-query style suggestions: distinct tag/style terms CONTAINING the typed string + a thumb each ─
-- Substring match (typeahead feel, prefix-friendly) rather than FTS, ranked by frequency. Each carries a
-- representative photo of that style (or NULL → neutral tile). Powers the "Styles" section of the dropdown.
create or replace function public.discovery_style_suggest(q text, p_limit int default 6)
returns table(term text, item_id uuid, tiktok_url text, image_url text, tiktok_thumbnail_url text)
language sql stable set search_path to 'public' as $$
  with ql as (select lower(btrim(coalesce(q, ''))) as s),
  cand as (
    select t as term, count(*) as n
    from discovery_items di
    cross join ql
    cross join lateral unnest(
      case when di.style_name is not null and btrim(di.style_name) <> ''
           then array_append(coalesce(di.tags, array[]::text[]), di.style_name)
           else coalesce(di.tags, array[]::text[]) end
    ) as t
    where di.status = 'published' and di.is_active
      and ql.s <> '' and lower(t) like '%' || ql.s || '%'
      and length(btrim(t)) between 2 and 28
    group by t
    order by count(*) desc, t asc
    limit greatest(coalesce(p_limit, 6), 0)
  )
  select c.term, rep.id, rep.tiktok_url, rep.image_url, rep.tiktok_thumbnail_url
  from cand c
  left join lateral (
    select di.id, di.tiktok_url, di.image_url, di.tiktok_thumbnail_url
    from discovery_items di
    where di.status = 'published' and di.is_active
      and (c.term = any(di.tags) or di.style_name = c.term)
    order by di.sort_order asc nulls last, di.created_at desc
    limit 1
  ) rep on true
  order by c.n desc, c.term asc;
$$;

grant execute on function public.discovery_resolve_thumb(text)             to anon, authenticated, service_role;
grant execute on function public.discovery_recent_searches(uuid, int)      to anon, authenticated, service_role;
grant execute on function public.discovery_style_suggest(text, int)        to anon, authenticated, service_role;
