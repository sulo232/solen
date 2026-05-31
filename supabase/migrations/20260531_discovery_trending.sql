-- V3-D409: trending search terms.
--
-- Logs every search (server-side, page-1 only) and aggregates a time window so terms people actually search
-- rise into the filter row on their own — including terms with NO content yet ("ghost hair" = pure demand
-- signal). RLS: service-role only (the API logs + reads via the SECURITY DEFINER RPC); no public table access.
--
-- Applied to the live project via Supabase migration tooling on 2026-05-31; committed here for the record.

create table if not exists discovery_search_events (
  id          bigint generated always as identity primary key,
  term        text not null,
  normalized  text not null,
  user_id     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_dse_norm_time on discovery_search_events (normalized, created_at desc);
create index if not exists idx_dse_time on discovery_search_events (created_at desc);
alter table discovery_search_events enable row level security;
-- (no policies → only the service-role API can write/read; trending is exposed via the RPC below)

create or replace function discovery_trending_terms(p_days int default 7, p_limit int default 6, p_min int default 3)
returns table (
  term text, n bigint,
  item_id uuid, tiktok_url text, image_url text, tiktok_thumbnail_url text
)
language sql
stable
security definer
set search_path = public
as $$
  with hot as (
    select normalized as term, count(*) as n
    from discovery_search_events
    where created_at >= now() - make_interval(days => greatest(p_days, 1))
    group by normalized
    having count(*) >= greatest(p_min, 1)
    order by count(*) desc, max(created_at) desc
    limit greatest(p_limit, 0)
  )
  select h.term, h.n, rep.id, rep.tiktok_url, rep.image_url, rep.tiktok_thumbnail_url
  from hot h
  left join lateral (
    select di.id, di.tiktok_url, di.image_url, di.tiktok_thumbnail_url
    from discovery_items di
    where di.status = 'published' and di.is_active
      and discovery_fts_doc(di.name, di.author_name, di.style_name, di.description, di.tags)
          @@ websearch_to_tsquery('english', h.term)
    order by di.sort_order asc nulls last, di.created_at desc
    limit 1
  ) rep on true
  order by h.n desc;
$$;

grant execute on function discovery_trending_terms(int,int,int) to anon, authenticated, service_role;
