-- exists-check: net-new, ADDITIVE + idempotent (verified live 2026-06-23: only user_salon_affinity exists,
-- no user_style_affinity / discovery_feed_for_you). The "DNA point system" (owner 2026-06-23): a derived
-- per-user per-style-attribute affinity score that drives the Inspo for-you ranking. MIRRORS the existing
-- user_salon_affinity + recompute_user_salon_affinity() pattern (same exp recency decay, same upsert shape),
-- scored over discovery STYLE attributes (gender/texture/vibe/length/occasion/tags) instead of salons. Reads
-- ONLY existing tables (discovery_saves / discovery_likes / discovery_interactions / discovery_search_events +
-- discovery_items). Creates new objects only; does NOT touch user_salon_affinity or discovery_feed.

-- 1) the points table , row-per-attribute, mirrors user_salon_affinity's shape
create table if not exists public.user_style_affinity (
  user_id       uuid not null references auth.users(id) on delete cascade,
  attr_type     text not null,            -- gender | texture | vibe | length | occasion | tag
  attr_value    text not null,
  score         numeric not null default 0,
  events        integer not null default 0,
  last_event_at timestamptz,
  updated_at    timestamptz not null default now(),
  primary key (user_id, attr_type, attr_value)
);

alter table public.user_style_affinity enable row level security;

-- a user may read their OWN taste (e.g. to show it back); all writes are RPC-only (security definer)
drop policy if exists "own style affinity readable" on public.user_style_affinity;
create policy "own style affinity readable" on public.user_style_affinity
  for select using (auth.uid() = user_id);

-- 2) recompute: behaviour -> points with exp recency decay (clone of recompute_user_salon_affinity)
create or replace function public.recompute_user_style_affinity()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $func$
declare
  w_save   numeric := 0.5;   -- strongest discovery signal (deliberate keep)
  w_like   numeric := 0.4;
  w_share  numeric := 0.5;
  w_click  numeric := 0.25;
  w_view   numeric := 0.15;  -- scroll_past is intentionally ignored in v1 (no negative signal yet)
  w_search numeric := 0.35;
  decay_days numeric := 60;
  window_days int := 365;
  affected int;
begin
  with raw as (
    select s.user_id, i.gender, i.texture, i.vibe, i.length_category, i.occasion, i.tags, w_save as w, s.created_at
    from discovery_saves s join discovery_items i on i.id = s.item_id
    where s.user_id is not null and s.created_at >= now() - make_interval(days => window_days)
    union all
    select l.user_id, i.gender, i.texture, i.vibe, i.length_category, i.occasion, i.tags, w_like, l.created_at
    from discovery_likes l join discovery_items i on i.id = l.item_id
    where l.user_id is not null and l.created_at >= now() - make_interval(days => window_days)
    union all
    select x.user_id, i.gender, i.texture, i.vibe, i.length_category, i.occasion, i.tags,
           case x.action when 'view' then w_view when 'click' then w_click when 'share' then w_share else 0 end, x.created_at
    from discovery_interactions x join discovery_items i on i.id = x.item_id
    where x.user_id is not null and x.action in ('view','click','share')
      and x.created_at >= now() - make_interval(days => window_days)
  ),
  attr as (
    -- explode each interacted look into its single-valued attribute rows
    select user_id, a.attr_type, a.attr_value, w, created_at
    from raw
    cross join lateral (values
      ('gender', gender), ('texture', texture), ('vibe', vibe),
      ('length', length_category), ('occasion', occasion)
    ) as a(attr_type, attr_value)
    where a.attr_value is not null and a.attr_value <> ''
    union all
    -- ... and one row per tag
    select user_id, 'tag', t, w, created_at
    from raw cross join lateral unnest(coalesce(tags, '{}'::text[])) as t
    where t is not null and t <> ''
    union all
    -- searches are a style-intent signal: the normalized term as a tag affinity
    select se.user_id, 'tag', se.normalized, w_search, se.created_at
    from discovery_search_events se
    where se.user_id is not null and se.normalized is not null and se.normalized <> ''
      and se.created_at >= now() - make_interval(days => window_days)
  ),
  agg as (
    select user_id, attr_type, attr_value,
           round(sum(w * exp(- extract(epoch from (now() - created_at)) / 86400.0 / decay_days))::numeric, 4) as score,
           count(*)::int as events,
           max(created_at) as last_event_at
    from attr
    group by user_id, attr_type, attr_value
  )
  insert into public.user_style_affinity as ua (user_id, attr_type, attr_value, score, events, last_event_at, updated_at)
  select user_id, attr_type, attr_value, score, events, last_event_at, now()
  from agg
  on conflict (user_id, attr_type, attr_value) do update set
    score = excluded.score, events = excluded.events,
    last_event_at = excluded.last_event_at, updated_at = now();
  get diagnostics affected = row_count;
  return affected;
end;
$func$;

-- 3) the for-you feed , score each look by the user's affinity over its attributes, rank by it; cold users
--    (no affinity rows) get match_score 0 -> identical to the neutral order. Same RETURNS shape as
--    discovery_feed() so the route swaps it in for logged-in, no-filter browse.
create or replace function public.discovery_feed_for_you(
  p_user_id uuid, p_limit integer default 12, p_offset integer default 0
)
returns table(id uuid, source text, content_type text, media_type text, image_url text, tiktok_url text,
  tiktok_thumbnail_url text, tiktok_embed_html text, author_name text, style_name text, alt_text text,
  tags text[], price_min integer, total_count bigint)
language sql stable set search_path to 'public'
as $func$
  with scored as (
    select di.*,
      coalesce((
        select sum(ua.score) from user_style_affinity ua
        where ua.user_id = p_user_id and (
          (ua.attr_type = 'gender'   and ua.attr_value = di.gender) or
          (ua.attr_type = 'texture'  and ua.attr_value = di.texture) or
          (ua.attr_type = 'vibe'     and ua.attr_value = di.vibe) or
          (ua.attr_type = 'length'   and ua.attr_value = di.length_category) or
          (ua.attr_type = 'occasion' and ua.attr_value = di.occasion) or
          (ua.attr_type = 'tag'      and ua.attr_value = any(di.tags))
        )
      ), 0) as match_score
    from discovery_items di
    where di.status = 'published' and di.is_active
  )
  select id, source, content_type, media_type, image_url, tiktok_url, tiktok_thumbnail_url, tiktok_embed_html,
    author_name, style_name, alt_text, tags, price_min, count(*) over () as total_count
  from scored
  order by match_score desc, sort_order asc nulls last, created_at desc
  limit greatest(p_limit, 0) offset greatest(p_offset, 0);
$func$;

grant execute on function public.recompute_user_style_affinity() to service_role, authenticated;
grant execute on function public.discovery_feed_for_you(uuid, integer, integer) to service_role, authenticated, anon;
