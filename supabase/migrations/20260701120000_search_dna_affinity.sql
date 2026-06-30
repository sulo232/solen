-- Exists-check: EXTENDS search_ranking_weights (existing), search_salons_ranked (existing),
-- search_suggest (existing). Adds DNA style-affinity personalization to search ranking.
-- Additive + idempotent. NON-destructive: keeps the existing 3-arg signatures so each
-- function is updated via CREATE OR REPLACE (no DROP, no re-GRANT , REPLACE preserves the
-- existing privileges). The signed-in user is read INSIDE the function via auth.uid(), so
-- there is no caller-supplied user-id param (closes the IDOR: a caller cannot personalize
-- for anyone but themselves) and the API routes need no change.
--
-- Summary of changes:
-- 1. w_affinity column added to search_ranking_weights (default 0.0 = inert until tuned)
-- 2. search_salons_ranked: category-affinity CTE (keyed on auth.uid()) nudges the score
-- 3. search_suggest: affinity nudges the salons-branch ORDER BY
-- Salon category match: salons.categories is text[], so ua.attr_value = any(sa.categories)
-- Behaviour is identical to today when auth.uid() is null (anon) OR w_affinity = 0.

-- a) add the live-tunable weight column (inert at 0.0)
alter table public.search_ranking_weights
  add column if not exists w_affinity real not null default 0.0;

-- b) search_salons_ranked , same 3-arg signature, affinity term added
create or replace function public.search_salons_ranked(
  p_q               text,
  p_limit           int     default 30,
  p_query_embedding text    default null
)
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
  qemb as (select nullif(p_query_embedding,'')::vector as v),
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
  lex as (select * from svc union all select * from sal union all select * from stf),
  lexagg as (
    select salon_id, max(fts_direct) as fts_direct, max(fts_exp) as fts_exp,
           max(wsim) as wsim, max(exact) as exact
    from lex group by salon_id
  ),
  vec as (
    select salon_id, vsim, row_number() over (order by vsim desc) as rn
    from (
      select x.sid as salon_id, max(x.vsim) as vsim
      from (
        select
          case se.entity_type
            when 'salon'   then se.entity_id
            when 'service' then (select s.salon_id from public.services s where s.id = se.entity_id)
          end as sid,
          1 - (se.embedding <=> (select v from qemb)) as vsim
        from public.search_embeddings se
        where (select v from qemb) is not null
          and se.entity_type in ('service','salon')
      ) x
      where x.sid is not null
      group by x.sid
      having max(x.vsim) > (select vec_threshold from w)
    ) g
  ),
  cand as (
    select salon_id from lexagg
    union
    select salon_id from vec where rn <= (select vec_topk from w)
  ),
  -- Per-salon category affinity for the SIGNED-IN caller (auth.uid()); null-safe:
  -- returns no rows for anon, so the boost term collapses to 0.
  uaff as (
    select sa.id as salon_id,
           sum(ua.score)::real as cat_score
    from public.salons sa
    join public.user_style_affinity ua
      on ua.user_id = auth.uid()
     and ua.attr_type = 'category'
     -- Bridge the discovery affinity taxonomy (hair/nails/lashes/brows/beard) to the salon
     -- category taxonomy (coiffeur/barbershop/nails/spa). Confident equivalences only; this
     -- product calls hair salons "coiffeur" and beard "barbershop". lashes/brows have no salon
     -- category counterpart yet (owner to confirm) so they simply do not boost , a graceful
     -- no-op, never a wrong match. nails maps to itself via the else branch.
     and (case ua.attr_value
            when 'hair'  then 'coiffeur'
            when 'beard' then 'barbershop'
            else ua.attr_value
          end) = any(sa.categories)
    where auth.uid() is not null
    group by sa.id
  )
  select c.salon_id,
    (   w.w_fts        * (coalesce(la.fts_direct,0) + 0.6 * greatest(coalesce(la.fts_exp,0) - coalesce(la.fts_direct,0), 0))
      + w.w_fuzzy      * coalesce(la.wsim,0)
      + w.w_exact      * coalesce(la.exact,0)
      + w.w_rating     * (( sa.review_count::real * coalesce(sa.average_rating,0) + w.bayes_prior_m * w.bayes_global_c)
                          / nullif(sa.review_count + w.bayes_prior_m, 0) / 5.0)
      + w.w_vector     * coalesce(v.vsim,0)
      + w.w_popularity * coalesce(pop.popularity,0)
      + w.w_affinity   * coalesce(ua.cat_score, 0)
    )::real as score
  from cand c
  join public.salons sa on sa.id = c.salon_id
  left join lexagg la  on la.salon_id  = c.salon_id
  left join vec v      on v.salon_id   = c.salon_id
  left join public.search_popularity pop on pop.salon_id = c.salon_id
  left join uaff ua    on ua.salon_id  = c.salon_id
  cross join w
  where sa.is_active and sa.listed_on_marketplace and coalesce(sa.is_test,false) = false
  order by score desc, sa.average_rating desc nulls last, sa.id
  limit greatest(coalesce(p_limit,30),1);
$func$;

-- c) search_suggest , same 3-arg signature, affinity nudges the salons branch
create or replace function public.search_suggest(
  p_q        text,
  p_city_id  uuid    default null,
  p_category text    default null
)
returns jsonb
language sql stable security definer set search_path = public, extensions
as $func$
  with
  w as (select coalesce(w_affinity, 0.0) as w_affinity from public.search_ranking_weights where id = 1),
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
  -- Per-salon category affinity for the SIGNED-IN caller (null-safe: no rows for anon)
  uaff as (
    select sa.id as salon_id,
           sum(ua.score)::real as cat_score
    from public.salons sa
    join public.user_style_affinity ua
      on ua.user_id = auth.uid()
     and ua.attr_type = 'category'
     -- Bridge the discovery affinity taxonomy (hair/nails/lashes/brows/beard) to the salon
     -- category taxonomy (coiffeur/barbershop/nails/spa). Confident equivalences only; this
     -- product calls hair salons "coiffeur" and beard "barbershop". lashes/brows have no salon
     -- category counterpart yet (owner to confirm) so they simply do not boost , a graceful
     -- no-op, never a wrong match. nails maps to itself via the else branch.
     and (case ua.attr_value
            when 'hair'  then 'coiffeur'
            when 'beard' then 'barbershop'
            else ua.attr_value
          end) = any(sa.categories)
    where auth.uid() is not null
    group by sa.id
  ),
  sal as (
    select sa.id, sa.name, sa.slug, sa.average_rating, sa.cover_photo_url,
           sa.address, sa.city_id, sa.latitude, sa.longitude
    from public.salons sa
    left join uaff u on u.salon_id = sa.id
    cross join w
    where sa.is_active and sa.listed_on_marketplace and coalesce(sa.is_test,false)=false
      and (sa.search_doc @@ (select q from tqx)
        or word_similarity((select norm from qx), lower(public.f_unaccent(sa.name))) > 0.3
        or sa.name ilike '%'||(select norm from qx)||'%')
      and (p_city_id is null or sa.city_id = p_city_id)
      and (p_category is null or sa.categories @> array[p_category])
    order by ts_rank(sa.search_doc,(select q from tqx))
           + w.w_affinity * coalesce(u.cat_score, 0) desc,
             sa.average_rating desc nulls last
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
