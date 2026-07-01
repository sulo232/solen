-- exists-check: net-new timestamped migration; reapplies public.search_suggest (extends
-- 20260701130000_search_suggest_salon_from_price.sql, same signature) + adds one nullable
-- column search_synonyms.price_canonical. Append-only by design, not a duplicate.
--
-- TREATMENT-ACCURATE from_price (owner "proper fix", 2026-07-01).
-- Problem: from_price was the salon's OVERALL cheapest service (venue floor). On a style
-- query ("buzzcut") that reads misleadingly low , e.g. a barber's cheapest service is an
-- "Augenbrauen" (eyebrow, CHF 15) tagged category='barbershop', so the card showed "ab 15"
-- for a haircut that actually starts at 35.
--
-- Why not just remap the synonym: measured, remapping buzzcut->'herren haarschnitt' drops
-- SALON recall 2->0 (salon search_doc holds the category word "barbershop", not the phrase;
-- services are compounds like "Herrenschnitt" that don't tokenize to herren+haarschnitt).
-- So MATCHING and PRICING must use different signals.
--
-- Fix: keep the matching canonical untouched (recall unchanged). Add a nullable
-- price_canonical on search_synonyms (the treatment hint). Compute from_price by SUBSTRING-
-- matching the salon's own service names against the price-canonical / canonical / raw query
-- tokens (substring handles German compounds; tsquery does not), excluding kids cuts, and
-- coalescing to the venue floor when nothing treatment-matches (never NULL). Only the PRICE
-- changes; which salons match is identical to the prior version.

alter table public.search_synonyms add column if not exists price_canonical text;

-- The only synonyms whose canonical is a BROAD CATEGORY (can't isolate a treatment price):
-- 'barbershop' (buzzcut/fade/undercut/... , men's cuts) and 'coiffeur' (bob/pixie/lob/... ,
-- women's cuts). Point their pricing at cut services via the shared 'schnitt' stem
-- (Herrenschnitt/Damenschnitt/Maschinenschnitt/Haarschnitt all contain it). Every other
-- canonical is already a treatment term (haarschnitt, coloration, straehnen, ...) and needs
-- no hint , from_price falls back to coalesce(price_canonical, canonical).
update public.search_synonyms
  set price_canonical = 'schnitt'
  where is_active and canonical in ('barbershop', 'coiffeur');

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
            and lower(public.f_unaccent(s.term)) = qx.norm),
  cano as (select case when (select exp from syn) is not null
                       then string_to_array(lower(public.f_unaccent((select exp from syn))),' ')
                       else array[]::text[] end as toks),
  -- Pricing tokens: explicit price_canonical when set, else the broad-category canonicals
  -- (barbershop/coiffeur) map to the cut stem 'schnitt' INLINE, else the canonical itself.
  -- The inline CASE makes this self-correcting: a future synonym row with a category
  -- canonical and a NULL price_canonical still prices off cuts (not the misleading venue
  -- floor), so the fix cannot silently regress on new inserts. Used ONLY by from_price.
  psyn as (select string_agg(distinct coalesce(
                     s.price_canonical,
                     case when s.canonical in ('barbershop','coiffeur') then 'schnitt' else s.canonical end
                   ),' ') as exp
           from public.search_synonyms s, qx
           where qx.norm is not null and s.is_active
             and lower(public.f_unaccent(s.term)) = qx.norm),
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
           -- Treatment-matched entry price: min price of THIS salon's services whose name
           -- substring-matches the query or its pricing tokens (kids cuts excluded), else the
           -- venue floor. Substring (not tsquery) so German compounds like "Herrenschnitt"
           -- match the 'schnitt' token. coalesce -> never NULL when the salon has a service.
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