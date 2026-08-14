-- exists-check: net-new — mirrors prod migration perf_discovery_feed_for_you_join_promote (applied via apply_migration, version 20260624064701), absent from the repo. Extends the discovery_feed_for_you function first created in 067_discovery.sql / 20260623131500_discovery_boards_for_you.sql (this is the JOIN-rewrite perf pass over it).
-- Promote the proven-equivalent JOIN rewrite (0/16050 score mismatches vs the
-- correlated-subquery version). Adds a final `id` tiebreaker so tied items
-- paginate deterministically (fixes a latent skip/duplicate-across-pages bug).
create or replace function public.discovery_feed_for_you(p_user_id uuid, p_limit integer default 12, p_offset integer default 0)
returns table(id uuid, source text, content_type text, media_type text, image_url text, tiktok_url text, tiktok_thumbnail_url text, tiktok_embed_html text, author_name text, style_name text, alt_text text, tags text[], price_min integer, total_count bigint)
language sql stable set search_path to 'public' as $f$
  with ua as (
    select attr_type, attr_value, score from user_style_affinity where user_id = p_user_id
  ),
  scored as (
    select di.*, coalesce(sum(ua.score), 0) as match_score
    from discovery_items di
    left join ua on (
      (ua.attr_type = 'gender'   and ua.attr_value = di.gender) or
      (ua.attr_type = 'texture'  and ua.attr_value = di.texture) or
      (ua.attr_type = 'vibe'     and ua.attr_value = di.vibe) or
      (ua.attr_type = 'length'   and ua.attr_value = di.length_category) or
      (ua.attr_type = 'occasion' and ua.attr_value = di.occasion) or
      (ua.attr_type = 'tag'      and ua.attr_value = any(di.tags))
    )
    where di.status = 'published' and di.is_active
    group by di.id
  )
  select id, source, content_type, media_type, image_url, tiktok_url, tiktok_thumbnail_url, tiktok_embed_html,
    author_name, style_name, alt_text, tags, price_min, count(*) over () as total_count
  from scored
  order by match_score desc, sort_order asc nulls last, created_at desc, id desc
  limit greatest(p_limit, 0) offset greatest(p_offset, 0);
$f$;

drop function if exists public.discovery_feed_for_you_v2(uuid, integer, integer);
