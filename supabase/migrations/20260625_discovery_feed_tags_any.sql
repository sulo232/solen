-- exists-check: extends supabase/migrations/20260531_discovery_feed_personalized.sql (the discovery_feed RPC).
-- net-new only adds the 9th param p_tags_any; everything else is the prior body verbatim.
--
-- Progressive drill-down (Inspo HAIR filter): add the 9th param p_tags_any to discovery_feed.
--
-- The L2 cut chips select real discovery_items.tags values; the feed filters by tag OVERLAP
-- (di.tags && p_tags_any). It is a NO-OP when p_tags_any is null or empty, so every existing caller
-- (8-arg) keeps the exact prior behaviour. Param appended LAST + defaulted so named-arg RPC calls that
-- omit it still resolve.
--
-- Applied to the live project via Supabase migration tooling on 2026-06-25 (backend ready + verified per
-- the task brief); committed here for the record so the repo signature matches the live DB.

create or replace function discovery_feed(
  p_category    text default null,
  p_gender      text default null,
  p_texture     text default null,
  p_style       text default null,
  p_creator     text default null,
  p_user_gender text default null,
  p_limit       int  default 12,
  p_offset      int  default 0,
  p_tags_any    text[] default null
)
returns table (
  id uuid, source text, content_type text, media_type text,
  image_url text, tiktok_url text, tiktok_thumbnail_url text, tiktok_embed_html text,
  author_name text, style_name text, alt_text text, tags text[], price_min integer,
  total_count bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    di.id, di.source, di.content_type, di.media_type,
    di.image_url, di.tiktok_url, di.tiktok_thumbnail_url, di.tiktok_embed_html,
    di.author_name, di.style_name, di.alt_text, di.tags, di.price_min,
    count(*) over () as total_count
  from discovery_items di
  where di.status = 'published' and di.is_active
    and (p_category is null or di.category   = p_category)
    and (p_gender   is null or di.gender     = p_gender)
    and (p_texture  is null or di.texture    = p_texture)
    and (p_style    is null or di.style_name = p_style)
    and (p_creator  is null or di.owner_user_id = p_creator::uuid)
    and (p_tags_any is null or array_length(p_tags_any, 1) is null or di.tags && p_tags_any)
  order by
    case
      when p_user_gender is null then 0
      when di.gender = p_user_gender or di.gender = 'unisex' or di.gender is null then 0
      else 1
    end asc,
    di.sort_order asc nulls last,
    di.created_at desc
  limit greatest(p_limit, 0) offset greatest(p_offset, 0);
$$;

grant execute on function discovery_feed(text,text,text,text,text,text,int,int,text[]) to anon, authenticated, service_role;
