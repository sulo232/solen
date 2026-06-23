-- exists-check: EXTENDS recompute_user_style_affinity() from 20260623124500_user_style_affinity.sql (not net-new).
-- Adds CATEGORY-level affinity (owner 2026-06-23: "if they look at a lot of hair, put hair first") so the Inspo
-- category pills can be ordered by what the viewer engages with most. Only change vs the original: `raw` also
-- selects i.category, and the attribute explode emits a ('category', category) row. Drives /api/discovery/category-order.
create or replace function public.recompute_user_style_affinity()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $func$
declare
  w_save   numeric := 0.5;
  w_like   numeric := 0.4;
  w_share  numeric := 0.5;
  w_click  numeric := 0.25;
  w_view   numeric := 0.15;
  w_search numeric := 0.35;
  decay_days numeric := 60;
  window_days int := 365;
  affected int;
begin
  with raw as (
    select s.user_id, i.category, i.gender, i.texture, i.vibe, i.length_category, i.occasion, i.tags, w_save as w, s.created_at
    from discovery_saves s join discovery_items i on i.id = s.item_id
    where s.user_id is not null and s.created_at >= now() - make_interval(days => window_days)
    union all
    select l.user_id, i.category, i.gender, i.texture, i.vibe, i.length_category, i.occasion, i.tags, w_like, l.created_at
    from discovery_likes l join discovery_items i on i.id = l.item_id
    where l.user_id is not null and l.created_at >= now() - make_interval(days => window_days)
    union all
    select x.user_id, i.category, i.gender, i.texture, i.vibe, i.length_category, i.occasion, i.tags,
           case x.action when 'view' then w_view when 'click' then w_click when 'share' then w_share else 0 end, x.created_at
    from discovery_interactions x join discovery_items i on i.id = x.item_id
    where x.user_id is not null and x.action in ('view','click','share')
      and x.created_at >= now() - make_interval(days => window_days)
  ),
  attr as (
    select user_id, a.attr_type, a.attr_value, w, created_at
    from raw
    cross join lateral (values
      ('category', category), ('gender', gender), ('texture', texture), ('vibe', vibe),
      ('length', length_category), ('occasion', occasion)
    ) as a(attr_type, attr_value)
    where a.attr_value is not null and a.attr_value <> ''
    union all
    select user_id, 'tag', t, w, created_at
    from raw cross join lateral unnest(coalesce(tags, '{}'::text[])) as t
    where t is not null and t <> ''
    union all
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
