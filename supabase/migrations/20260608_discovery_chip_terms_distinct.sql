-- n3 fix (2026-06-08): de-duplicate the per-chip representative photo.
--
-- The prior discovery_chip_terms (20260531_discovery_chip_terms_thumb.sql) picked, for each style term, the
-- single top-sorted published item carrying that tag. Because one post often carries several style tags
-- (e.g. shag + layered + curtain-bangs), the SAME post became the representative for several terms — so the
-- Discover quick-chips showed only ~3 distinct photos across 10 labels.
--
-- This re-creates the function to assign a DISTINCT representative item per term, greedily in term-frequency
-- order: each term takes its best published item that no higher-ranked term has already taken; if every
-- candidate is already taken it falls back to its top item (a repeated photo beats a chip with no photo).
-- Same return signature, so the API route (app/api/discovery/chip-terms/route.ts) is unchanged. Fails soft.

drop function if exists discovery_chip_terms(int);

create or replace function discovery_chip_terms(p_limit int default 10)
returns table (
  term text, n bigint,
  item_id uuid, tiktok_url text, image_url text, tiktok_thumbnail_url text
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  deny text[] := array[
    'modern','casual','trendy','youthful','edgy','versatile','voluminous','volume','bouncy','clean','sharp',
    'low maintenance','low-maintenance','easy styling','easy-styling','natural-flow','natural flow','messy',
    'messy-look','messy-style','soft','glossy','sleek','effortless','chic','bold',
    'point-cutting','point cutting','face-framing','face framing','short-sides','short sides','long-top',
    'long top','medium length','medium-length','disconnect','disconnected','texturizing','clipper-work',
    'clipper work','clipper cut','scissor-cut','scissor cut','blunt','razor-cut','blow-dry',
    'mens-haircut','mens haircut','men''s-haircut','womens-haircut','haircut','hairstyle',
    'straight','wavy','wavy-hair','wavy hair','curly','curly-hair','curly hair','coily','coily-hair'
  ];
  used uuid[] := '{}';
  r record;
  rep record;
begin
  for r in
    select tag as term, count(*) as n
    from discovery_items di, unnest(di.tags) as tag
    where di.status = 'published' and di.is_active
      and lower(trim(tag)) <> all (select lower(trim(d)) from unnest(deny) d)
      and length(trim(tag)) between 3 and 22
    group by tag
    order by count(*) desc, tag asc
    limit greatest(p_limit, 0)
  loop
    -- best item for this term that no higher-ranked term has already claimed
    select di.id, di.tiktok_url, di.image_url, di.tiktok_thumbnail_url into rep
    from discovery_items di
    where di.status = 'published' and di.is_active and r.term = any(di.tags)
      and di.id <> all (used)
    order by di.sort_order asc nulls last, di.created_at desc
    limit 1;

    if rep.id is null then
      -- all candidates already taken: fall back to the top item (allow a repeat so the chip still has a photo)
      select di.id, di.tiktok_url, di.image_url, di.tiktok_thumbnail_url into rep
      from discovery_items di
      where di.status = 'published' and di.is_active and r.term = any(di.tags)
      order by di.sort_order asc nulls last, di.created_at desc
      limit 1;
    else
      used := used || rep.id;
    end if;

    term := r.term; n := r.n;
    item_id := rep.id; tiktok_url := rep.tiktok_url;
    image_url := rep.image_url; tiktok_thumbnail_url := rep.tiktok_thumbnail_url;
    return next;
  end loop;
end;
$$;

grant execute on function discovery_chip_terms(int) to anon, authenticated, service_role;
