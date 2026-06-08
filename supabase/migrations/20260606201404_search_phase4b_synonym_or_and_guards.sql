-- Smart Search Phase 4b: fix the synonym AND-bug + add RPC-level guards + recall.
-- Applied via apply_migration 2026-06-06 (version 20260606201404); mirrored here.
-- Root cause (caught by the golden-query harness): websearch_to_tsquery joins
-- terms with AND, so "norm || ' ' || synonyms" required the user's literal word
-- AND the canonical -> "maenner"/"taglio uomo" matched nothing. Fix: OR two
-- separate tsqueries with || (union). Also: RPC-level 2-char guard (was only in
-- the HTTP routes) and a canonical-token ILIKE branch so one-word German
-- compounds (Herrenhaarschnitt) are reachable via synonyms. Applies to BOTH RPCs.
-- Verified: _tasks/search-golden-queries.ts -> 13/13 pass, security invariant pass.

insert into public.search_synonyms (locale, term, canonical) values
  ('de','maenner','herren haarschnitt'),('de','maennerschnitt','herren haarschnitt'),
  ('de','faerben','färben'),('de','toenung','färben'),
  ('de','straehnen','strähnen balayage'),('de','naegel','nägel maniküre'),
  ('de','manikuere','nägel maniküre'),('de','pedikuere','pediküre'),
  ('de','wimpernverlaengerung','wimpern')
on conflict (lower(term), locale) do nothing;

create or replace function public.search_salons_ranked(p_q text, p_limit int default 30)
returns table(salon_id uuid, score real)
language sql stable security definer set search_path = public, extensions
as $func$
  with
  w as (select * from public.search_ranking_weights where id = 1),
  qx as (select case when length(btrim(coalesce(p_q,''))) >= 2
                     then nullif(lower(public.f_unaccent(btrim(p_q))),'')
                     else null end as norm),
  syn as (select string_agg(distinct s.canonical,' ') as exp
          from public.search_synonyms s, qx
          where qx.norm is not null and s.is_active
            and lower(public.f_unaccent(s.term)) = qx.norm),
  cano as (select case when (select exp from syn) is not null
                       then string_to_array(lower(public.f_unaccent((select exp from syn))),' ')
                       else array[]::text[] end as toks),
  tq   as (select websearch_to_tsquery('german', public.f_unaccent(coalesce((select norm from qx),''))) as q),
  synq as (select websearch_to_tsquery('german', public.f_unaccent(coalesce((select exp from syn),''))) as q),
  tqx  as (select case
             when (select q from synq)::text = '' then (select q from tq)
             when (select q from tq)::text   = '' then (select q from synq)
             else (select q from tq) || (select q from synq) end as q),
  svc as (
    select s.salon_id,
           ts_rank(s.search_doc,(select q from tq))  as fts_direct,
           ts_rank(s.search_doc,(select q from tqx)) as fts_exp,
           word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de))) as wsim,
           case when s.name_de ilike '%'||(select norm from qx)||'%'
                  or s.name_en ilike '%'||(select norm from qx)||'%' then 1 else 0 end as exact
    from public.services s
    where s.is_active and (
         s.search_doc @@ (select q from tqx)
      or word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de))) > 0.3
      or s.name_de ilike '%'||(select norm from qx)||'%'
      or s.name_en ilike '%'||(select norm from qx)||'%'
      or exists (select 1 from unnest((select toks from cano)) as t(tok)
                 where length(t.tok) >= 3 and s.name_de ilike '%'||t.tok||'%'))
  ),
  sal as (
    select sa.id as salon_id,
           ts_rank(sa.search_doc,(select q from tq))  as fts_direct,
           ts_rank(sa.search_doc,(select q from tqx)) as fts_exp,
           word_similarity((select norm from qx), lower(public.f_unaccent(sa.name))) as wsim,
           case when sa.name ilike '%'||(select norm from qx)||'%' then 1 else 0 end as exact
    from public.salons sa
    where sa.search_doc @@ (select q from tqx)
      or word_similarity((select norm from qx), lower(public.f_unaccent(sa.name))) > 0.3
      or sa.name ilike '%'||(select norm from qx)||'%'
  ),
  stf as (
    select st.salon_id,
           0::real as fts_direct, 0::real as fts_exp,
           word_similarity((select norm from qx), lower(public.f_unaccent(st.name))) as wsim,
           case when st.name ilike '%'||(select norm from qx)||'%' then 1 else 0 end as exact
    from public.staff_members st
    where st.is_active and (
         st.name ilike '%'||(select norm from qx)||'%'
      or word_similarity((select norm from qx), lower(public.f_unaccent(st.name))) > 0.3)
  ),
  u as (select * from svc union all select * from sal union all select * from stf),
  agg as (
    select salon_id, max(fts_direct) as fts_direct, max(fts_exp) as fts_exp,
           max(wsim) as wsim, max(exact) as exact
    from u group by salon_id
  )
  select a.salon_id,
    (   w.w_fts    * (a.fts_direct + 0.6 * greatest(a.fts_exp - a.fts_direct, 0))
      + w.w_fuzzy  * coalesce(a.wsim,0)
      + w.w_exact  * a.exact
      + w.w_rating * (
          ( sa.review_count::real * coalesce(sa.average_rating,0)
            + w.bayes_prior_m * w.bayes_global_c )
          / nullif(sa.review_count + w.bayes_prior_m, 0) / 5.0 )
    )::real as score
  from agg a
  join public.salons sa on sa.id = a.salon_id
  cross join w
  where sa.is_active and sa.listed_on_marketplace and coalesce(sa.is_test,false) = false
  order by score desc, sa.average_rating desc nulls last, sa.id
  limit greatest(coalesce(p_limit,30),1);
$func$;

create or replace function public.search_suggest(p_q text, p_city_id uuid default null, p_category text default null)
returns jsonb
language sql stable security definer set search_path = public, extensions
as $func$
  with
  qx as (select case when length(btrim(coalesce(p_q,''))) >= 2
                     then nullif(lower(public.f_unaccent(btrim(p_q))),'')
                     else null end as norm),
  syn as (select string_agg(distinct s.canonical,' ') as exp
          from public.search_synonyms s, qx
          where qx.norm is not null and s.is_active
            and lower(public.f_unaccent(s.term)) = qx.norm),
  cano as (select case when (select exp from syn) is not null
                       then string_to_array(lower(public.f_unaccent((select exp from syn))),' ')
                       else array[]::text[] end as toks),
  tq   as (select websearch_to_tsquery('german', public.f_unaccent(coalesce((select norm from qx),''))) as q),
  synq as (select websearch_to_tsquery('german', public.f_unaccent(coalesce((select exp from syn),''))) as q),
  tqx  as (select case
             when (select q from synq)::text = '' then (select q from tq)
             when (select q from tq)::text   = '' then (select q from synq)
             else (select q from tq) || (select q from synq) end as q),
  svc as (
    select s.id, s.name_de, s.name_en, s.category, s.price
    from public.services s
    where s.is_active
      and (s.search_doc @@ (select q from tqx)
        or word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de))) > 0.3
        or s.name_de ilike '%'||(select norm from qx)||'%'
        or s.name_en ilike '%'||(select norm from qx)||'%'
        or exists (select 1 from unnest((select toks from cano)) as t(tok)
                   where length(t.tok) >= 3 and s.name_de ilike '%'||t.tok||'%'))
      and (p_category is null or s.category = p_category)
      and exists (
            select 1 from public.salons sa
            where sa.id = s.salon_id
              and sa.is_active and sa.listed_on_marketplace and coalesce(sa.is_test,false)=false
              and (p_city_id is null or sa.city_id = p_city_id))
    order by ts_rank(s.search_doc,(select q from tqx)) desc,
             word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de))) desc
    limit 5
  ),
  sal as (
    select sa.id, sa.name, sa.slug, sa.average_rating, sa.cover_photo_url,
           sa.address, sa.city_id, sa.latitude, sa.longitude
    from public.salons sa
    where sa.is_active and sa.listed_on_marketplace and coalesce(sa.is_test,false)=false
      and (sa.search_doc @@ (select q from tqx)
        or word_similarity((select norm from qx), lower(public.f_unaccent(sa.name))) > 0.3
        or sa.name ilike '%'||(select norm from qx)||'%')
      and (p_city_id is null or sa.city_id = p_city_id)
      and (p_category is null or sa.categories @> array[p_category])
    order by ts_rank(sa.search_doc,(select q from tqx)) desc, sa.average_rating desc nulls last
    limit 3
  ),
  stf as (
    select st.id, st.name, st.avatar_url, st.specialties,
           st.salon_id, sa.name as salon_name, sa.slug as salon_slug,
           word_similarity((select norm from qx), lower(public.f_unaccent(st.name))) as wsim
    from public.staff_members st
    join public.salons sa on sa.id = st.salon_id
    where st.is_active and st.is_publicly_listed
      and sa.is_active and sa.listed_on_marketplace and coalesce(sa.is_test,false)=false
      and (
        st.name ilike '%'||(select norm from qx)||'%'
        or word_similarity((select norm from qx), lower(public.f_unaccent(st.name))) > 0.3
        or exists (select 1 from unnest(st.specialties) sp
                   where lower(public.f_unaccent(sp)) ilike '%'||(select norm from qx)||'%')
      )
      and (p_city_id is null or sa.city_id = p_city_id)
      and (p_category is null or sa.categories @> array[p_category])
    order by wsim desc nulls last, st.name
    limit 5
  )
  select jsonb_build_object(
    'services', coalesce((select jsonb_agg(to_jsonb(s)) from svc s),'[]'::jsonb),
    'salons',   coalesce((select jsonb_agg(jsonb_build_object(
                  'id',sa.id,'name',sa.name,'slug',sa.slug,'average_rating',sa.average_rating,
                  'cover_photo_url',sa.cover_photo_url,'cover_image',sa.cover_photo_url,
                  'address',sa.address,'city_id',sa.city_id,
                  'latitude',sa.latitude,'longitude',sa.longitude)) from sal sa),'[]'::jsonb),
    'stylists', coalesce((select jsonb_agg(jsonb_build_object(
                  'id',st.id,'name',st.name,'avatar_url',st.avatar_url,'specialties',st.specialties,
                  'salon_id',st.salon_id,'salon_name',st.salon_name,'salon_slug',st.salon_slug)) from stf st),'[]'::jsonb)
  );
$func$;

grant execute on function public.search_salons_ranked(text,int) to anon, authenticated, service_role;
grant execute on function public.search_suggest(text,uuid,text)  to anon, authenticated, service_role;

-- Teardown: reverts both functions to their 20260606201013 / 20260606200515 forms;
--   delete from public.search_synonyms where source='seed' and term in
--     ('maenner','maennerschnitt','faerben','toenung','straehnen','naegel',
--      'manikuere','pedikuere','wimpernverlaengerung');
