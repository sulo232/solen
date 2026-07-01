-- exists-check: net-new timestamped migration; reapplies public.search_suggest (extends
-- 20260701150000_search_suggest_prefix_synonym.sql, same signature). Append-only.
--
-- Contains-match synonym (owner: "classic buzz cut shows no stores"). The synonym match was
-- exact + prefix only, so a multi-word query that CONTAINS a known style term ("classic buzz
-- cut" contains "buzz cut") did not expand to its canonical. Added a third clause: the query
-- CONTAINS the term (term >= 4 chars, to avoid short-token noise) -> expand. So
-- "classic buzz cut" / "low skin fade cut" now surface barbershops. Applied to syn + psyn.
create or replace function public.search_suggest(p_q text, p_city_id uuid default null, p_category text default null)
returns jsonb
language sql stable security definer set search_path = public, extensions
as $function$
  with
  w as (select coalesce(w_affinity, 0.0) as w_affinity from public.search_ranking_weights where id = 1),
  qx as (select case when length(btrim(coalesce(p_q,''))) >= 2
                     then nullif(lower(public.f_unaccent(btrim(p_q))),'')
                     else null end as norm),
  syn as (select string_agg(distinct s.canonical,' ') as exp
          from public.search_synonyms s, qx
          where qx.norm is not null and s.is_active
            and (lower(public.f_unaccent(s.term)) = qx.norm
              or (length(qx.norm) >= 3 and lower(public.f_unaccent(s.term)) like qx.norm || '%')
              or (length(lower(public.f_unaccent(s.term))) >= 4 and qx.norm like '%' || lower(public.f_unaccent(s.term)) || '%'))),
  cano as (select case when (select exp from syn) is not null
                       then string_to_array(lower(public.f_unaccent((select exp from syn))),' ')
                       else array[]::text[] end as toks),
  psyn as (select string_agg(distinct coalesce(
                     s.price_canonical,
                     case when s.canonical in ('barbershop','coiffeur') then 'schnitt' else s.canonical end
                   ),' ') as exp
           from public.search_synonyms s, qx
           where qx.norm is not null and s.is_active
             and (lower(public.f_unaccent(s.term)) = qx.norm
               or (length(qx.norm) >= 3 and lower(public.f_unaccent(s.term)) like qx.norm || '%')
               or (length(lower(public.f_unaccent(s.term))) >= 4 and qx.norm like '%' || lower(public.f_unaccent(s.term)) || '%'))),
  pcano as (select case when (select exp from psyn) is not null
                        then string_to_array(lower(public.f_unaccent((select exp from psyn))),' ')
                        else array[]::text[] end as toks),
  tq   as (select websearch_to_tsquery('german', public.f_unaccent(coalesce((select norm from qx),''))) as q),
  synq as (select websearch_to_tsquery('german', public.f_unaccent(coalesce((select exp from syn),''))) as q),
  tqx  as (select case
             when (select q from synq)::text = '' then (select q from tq)
             when (select q from tq)::text   = '' then (select q from synq)
             else (select q from tq) || (select q from synq) end as q),
  svc as (
    select id, name_de, name_en, category, price from (
      select distinct on (lower(public.f_unaccent(s.name_de)))
             s.id, s.name_de, s.name_en, s.category, s.price,
             ts_rank(s.search_doc,(select q from tqx)) as r,
             word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de))) as ws
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
      order by lower(public.f_unaccent(s.name_de)),
               ts_rank(s.search_doc,(select q from tqx)) desc,
               word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de))) desc
    ) d
    order by d.r desc, d.ws desc
    limit 5
  ),
  uaff as (
    select sa.id as salon_id,
           sum(ua.score)::real as cat_score
    from public.salons sa
    join public.user_style_affinity ua
      on ua.user_id = auth.uid()
     and ua.attr_type = 'category'
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
           sa.address, sa.city_id, sa.latitude, sa.longitude,
           coalesce(
             (select min(sv.price) from public.services sv
                where sv.salon_id = sa.id and sv.is_active and sv.price is not null and sv.price > 0
                  and coalesce(sv.name_de,'') !~* 'kinder'
                  and (
                    ((select norm from qx) is not null and (
                        sv.name_de ilike '%'||(select norm from qx)||'%'
                     or coalesce(sv.name_en,'') ilike '%'||(select norm from qx)||'%'))
                    or exists (select 1 from unnest((select toks from pcano)) as pt(tok)
                               where length(pt.tok) >= 3
                                 and (sv.name_de ilike '%'||pt.tok||'%'
                                   or coalesce(sv.name_en,'') ilike '%'||pt.tok||'%'))
                  )),
             (select min(sv.price) from public.services sv
                where sv.salon_id = sa.id and sv.is_active and sv.price is not null and sv.price > 0)
           ) as from_price
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
                  'address',sa.address,'city_id',sa.city_id,'from_price',sa.from_price,
                  'latitude',sa.latitude,'longitude',sa.longitude)) from sal sa),'[]'::jsonb),
    'stylists', coalesce((select jsonb_agg(jsonb_build_object(
                  'id',st.id,'name',st.name,'avatar_url',st.avatar_url,'specialties',st.specialties,
                  'salon_id',st.salon_id,'salon_name',st.salon_name,'salon_slug',st.salon_slug)) from stf st),'[]'::jsonb)
  );
$function$;