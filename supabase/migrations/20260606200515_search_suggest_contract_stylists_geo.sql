-- Smart Search: complete the suggest contract the V2-D51 hook already expects.
-- Applied via apply_migration 2026-06-06 (version 20260606200515); mirrored here
-- (repo = source of truth).
--
-- (1) staff_members.is_publicly_listed gate (default false: no real person is
--     exposed in search until they opt in; the consent UX is a separate, pending
--     step. Do NOT blanket-flag existing staff true in a committed migration).
-- (2) search_suggest now returns salon geo/address (address, city_id, latitude,
--     longitude) + a stylists group, matching app/[locale]/_components/homepage/
--     useSearchSuggest.ts (SalonResult + StylistResult types).
-- (3) Closes a visibility leak: the services group only salon-gated when a city
--     filter was passed, so a test/unlisted salon's service could surface in
--     suggestions with no city set. The gate is now unconditional (city optional).

alter table public.staff_members
  add column if not exists is_publicly_listed boolean not null default false;

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
      -- unconditional visibility gate (closes the no-city leak), city optional:
      and exists (
            select 1 from public.salons sa
            where sa.id = s.salon_id
              and sa.is_active and sa.listed_on_marketplace and coalesce(sa.is_test,false)=false
              and (p_city_id is null or sa.city_id = p_city_id))
    order by ts_rank(s.search_doc,(select tq from tsq)) desc,
             word_similarity((select norm from qx), lower(public.f_unaccent(s.name_de))) desc
    limit 5
  ),
  sal as (
    select sa.id, sa.name, sa.slug, sa.average_rating, sa.cover_photo_url,
           sa.address, sa.city_id, sa.latitude, sa.longitude
    from public.salons sa
    where sa.is_active and sa.listed_on_marketplace and coalesce(sa.is_test,false)=false
      and (sa.search_doc @@ (select tq from tsq)
        or word_similarity((select norm from qx), lower(public.f_unaccent(sa.name))) > 0.3
        or sa.name ilike '%'||(select norm from qx)||'%')
      and (p_city_id is null or sa.city_id = p_city_id)
      and (p_category is null or sa.categories @> array[p_category])
    order by ts_rank(sa.search_doc,(select tq from tsq)) desc, sa.average_rating desc nulls last
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

grant execute on function public.search_suggest(text,uuid,text) to anon, authenticated, service_role;

-- Teardown:
--   alter table public.staff_members drop column if exists is_publicly_listed;
--   (search_suggest reverts to the 20260606190706 definition)
