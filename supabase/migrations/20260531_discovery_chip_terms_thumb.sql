-- V3-D408 (#22 follow-up): per-chip representative image.
--
-- Now that chips are data-driven (every term maps to real items — see 20260531_discovery_chip_terms.sql),
-- each chip can show an actual photo OF that style instead of a generic feed thumbnail. This re-creates
-- discovery_chip_terms to also return a representative item (the top-sorted published item carrying that tag)
-- so the API can build its thumbnail URL. Drop the prior 2-column form first (return signature changes).
--
-- Applied to the live project via Supabase migration tooling on 2026-05-31; committed here for the record.

drop function if exists discovery_chip_terms(int);

create or replace function discovery_chip_terms(p_limit int default 10)
returns table (
  term text, n bigint,
  item_id uuid, tiktok_url text, image_url text, tiktok_thumbnail_url text
)
language sql
stable
security invoker
set search_path = public
as $$
  with deny(term) as (
    select unnest(array[
      'modern','casual','trendy','youthful','edgy','versatile','voluminous','volume','bouncy','clean','sharp',
      'low maintenance','low-maintenance','easy styling','easy-styling','natural-flow','natural flow','messy',
      'messy-look','messy-style','soft','glossy','sleek','effortless','chic','bold',
      'point-cutting','point cutting','face-framing','face framing','short-sides','short sides','long-top',
      'long top','medium length','medium-length','disconnect','disconnected','texturizing','clipper-work',
      'clipper work','clipper cut','scissor-cut','scissor cut','blunt','razor-cut','blow-dry',
      'mens-haircut','mens haircut','men''s-haircut','womens-haircut','haircut','hairstyle',
      'straight','wavy','wavy-hair','wavy hair','curly','curly-hair','curly hair','coily','coily-hair'
    ])
  ),
  ranked as (
    select tag as term, count(*) as n
    from discovery_items di, unnest(di.tags) as tag
    where di.status = 'published' and di.is_active
      and lower(trim(tag)) not in (select lower(trim(term)) from deny)
      and length(trim(tag)) between 3 and 22
    group by tag
    order by count(*) desc, tag asc
    limit greatest(p_limit, 0)
  )
  select r.term, r.n, rep.id, rep.tiktok_url, rep.image_url, rep.tiktok_thumbnail_url
  from ranked r
  left join lateral (
    select di.id, di.tiktok_url, di.image_url, di.tiktok_thumbnail_url
    from discovery_items di
    where di.status = 'published' and di.is_active and r.term = any(di.tags)
    order by di.sort_order asc nulls last, di.created_at desc
    limit 1
  ) rep on true
  order by r.n desc, r.term asc;
$$;

grant execute on function discovery_chip_terms(int) to anon, authenticated, service_role;
