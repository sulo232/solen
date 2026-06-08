-- Smart Search Phase 1c: ranking + suggest RPCs (the frozen brain).
-- Applied via apply_migration 2026-06-06; mirrored here (repo = source of truth).
-- SECURITY DEFINER + pinned search_path (public, extensions: word_similarity/trigram
-- live in extensions). Visibility gates (active ∧ listed ∧ NOT test) are hard-coded
-- inside the functions so a caller can never omit them.

create or replace function public.search_salons_ranked(p_q text, p_limit int default 30)
returns table(salon_id uuid, score real)
language sql stable security definer set search_path = public, extensions
as $func$
  with qx as (select nullif(lower(public.f_unaccent(btrim(coalesce(p_q,'')))),'') as norm),
  syn as (select string_agg(distinct s.canonical,' ') as exp from public.search_synonyms s, qx
          where s.is_active and lower(public.f_unaccent(s.term)) = qx.norm),
  tsq as (select websearch_to_tsquery('german',
            public.f_unaccent(coalesce((select norm from qx),'')||' '||coalesce((select exp from syn),''))) as tq),
  svc as (
    select s.salon_id,
           max(ts_rank(s.search_doc,(select tq from tsq))) as fts,
           max(word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de)))) as wsim
    from public.services s
    where s.is_active and (
         s.search_doc @@ (select tq from tsq)
      or word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de))) > 0.3
      or s.name_de ilike '%'||(select norm from qx)||'%'
      or s.name_en ilike '%'||(select norm from qx)||'%')
    group by s.salon_id
  ),
  sal as (
    select sa.id as salon_id,
           ts_rank(sa.search_doc,(select tq from tsq)) as fts,
           word_similarity((select norm from qx), lower(public.f_unaccent(sa.name))) as wsim
    from public.salons sa
    where sa.search_doc @@ (select tq from tsq)
      or word_similarity((select norm from qx), lower(public.f_unaccent(sa.name))) > 0.3
      or sa.name ilike '%'||(select norm from qx)||'%'
  ),
  stf as (select st.salon_id, 0.15::real as fts, 0::real as wsim
          from public.staff_members st
          where st.is_active and st.name ilike '%'||(select norm from qx)||'%'),
  u as (select * from svc union all select * from sal union all select * from stf),
  agg as (select salon_id, max(fts) as fts, max(wsim) as wsim from u group by salon_id)
  select a.salon_id,
    (1.0*coalesce(a.fts,0) + 0.6*coalesce(a.wsim,0) + 0.2*(coalesce(sa.average_rating,0)/5.0))::real as score
  from agg a
  join public.salons sa on sa.id = a.salon_id
  where sa.is_active and sa.listed_on_marketplace and coalesce(sa.is_test,false) = false
  order by score desc, sa.average_rating desc nulls last, sa.id
  limit greatest(coalesce(p_limit,30),1);
$func$;

create or replace function public.search_suggest(p_q text, p_city_id uuid default null, p_category text default null)
returns jsonb
language sql stable security definer set search_path = public, extensions
as $func$
  with qx as (select nullif(lower(public.f_unaccent(btrim(coalesce(p_q,'')))),'') as norm),
  syn as (select string_agg(distinct s.canonical,' ') as exp from public.search_synonyms s, qx
          where s.is_active and lower(public.f_unaccent(s.term)) = qx.norm),
  tsq as (select websearch_to_tsquery('german',
            public.f_unaccent(coalesce((select norm from qx),'')||' '||coalesce((select exp from syn),''))) as tq),
  svc as (
    select s.id, s.name_de, s.name_en, s.category, s.price
    from public.services s
    where s.is_active
      and (s.search_doc @@ (select tq from tsq)
        or word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de))) > 0.3
        or s.name_de ilike '%'||(select norm from qx)||'%'
        or s.name_en ilike '%'||(select norm from qx)||'%')
      and (p_category is null or s.category = p_category)
      and (p_city_id is null or exists (
            select 1 from public.salons sa where sa.id = s.salon_id
              and sa.city_id = p_city_id and sa.is_active and sa.listed_on_marketplace
              and coalesce(sa.is_test,false)=false))
    order by ts_rank(s.search_doc,(select tq from tsq)) desc,
             word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de))) desc
    limit 5
  ),
  sal as (
    select sa.id, sa.name, sa.slug, sa.average_rating, sa.cover_photo_url
    from public.salons sa
    where sa.is_active and sa.listed_on_marketplace and coalesce(sa.is_test,false)=false
      and (sa.search_doc @@ (select tq from tsq)
        or word_similarity((select norm from qx), lower(public.f_unaccent(sa.name))) > 0.3
        or sa.name ilike '%'||(select norm from qx)||'%')
      and (p_city_id is null or sa.city_id = p_city_id)
      and (p_category is null or sa.categories @> array[p_category])
    order by ts_rank(sa.search_doc,(select tq from tsq)) desc, sa.average_rating desc nulls last
    limit 3
  )
  select jsonb_build_object(
    'services', coalesce((select jsonb_agg(to_jsonb(s)) from svc s),'[]'::jsonb),
    'salons',   coalesce((select jsonb_agg(jsonb_build_object(
                  'id',sa.id,'name',sa.name,'slug',sa.slug,'average_rating',sa.average_rating,
                  'cover_photo_url',sa.cover_photo_url,'cover_image',sa.cover_photo_url)) from sal sa),'[]'::jsonb)
  );
$func$;

grant execute on function public.search_salons_ranked(text,int) to anon, authenticated, service_role;
grant execute on function public.search_suggest(text,uuid,text)   to anon, authenticated, service_role;

-- Teardown:
--   drop function if exists public.search_salons_ranked(text,int);
--   drop function if exists public.search_suggest(text,uuid,text);
