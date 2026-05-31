-- V3-D407 (#22): data-driven quick-chip terms.
--
-- Ranks discovery tags by frequency, minus a denylist of non-style descriptors / techniques / textures
-- (textures live in the Textur dropdown). The feed row's quick chips are sourced from this, so they always
-- lead to populated results and self-update as content grows — fixing the shipped hardcoded chips
-- (Skin Fade / Buzz Cut / Bob) that returned ZERO matches against the current content.
--
-- Applied to the live project via Supabase migration tooling on 2026-05-31; committed here for the record.

create or replace function discovery_chip_terms(p_limit int default 10)
returns table (term text, n bigint)
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
  )
  select tag as term, count(*) as n
  from discovery_items di, unnest(di.tags) as tag
  where di.status = 'published' and di.is_active
    and lower(trim(tag)) not in (select lower(trim(term)) from deny)
    and length(trim(tag)) between 3 and 22
  group by tag
  order by count(*) desc, tag asc
  limit greatest(p_limit, 0);
$$;

grant execute on function discovery_chip_terms(int) to anon, authenticated, service_role;
