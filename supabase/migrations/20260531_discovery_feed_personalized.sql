-- V3-D406 (#23): personalized browse feed RPC.
--
-- Soft gender bias — items matching the viewer's saved disc_gender (or unisex / unspecified) sort to the
-- TOP, but nothing is hard-filtered, so a logged-out viewer (p_user_gender null) gets the exact prior order.
-- Supersedes the old binary "suppress beard for female" rule. p_creator (owner_user_id) serves
-- UserPostsSection (?creator=<userId>) and fixes a latent bug where the route filtered author_name
-- ILIKE %uuid% (a display name vs a UUID → never matched). Returns the light grid column set + a window
-- count(*) so the API derives has_more without a second query. The behavioral layer (bookings / view
-- history) slots in later as additional ORDER BY terms — no signature change needed for callers.
--
-- Applied to the live project via Supabase migration tooling on 2026-05-31; committed here for the record.

create or replace function discovery_feed(
  p_category    text default null,
  p_gender      text default null,
  p_texture     text default null,
  p_style       text default null,
  p_creator     text default null,
  p_user_gender text default null,
  p_limit       int  default 12,
  p_offset      int  default 0
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

grant execute on function discovery_feed(text,text,text,text,text,text,int,int) to anon, authenticated, service_role;
