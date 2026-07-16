-- exists-check: npm run exists "discovery_feed_v2" / "keyset pagination" -> 0 matches, genuinely new.
-- Extends supabase/migrations/20260625_discovery_feed_tags_any.sql (discovery_feed).
-- Additive only: creates a NEW function discovery_feed_v2, does not touch/drop discovery_feed.
-- The old 9-arg discovery_feed signature keeps resolving unchanged for any caller still using it.
--
-- ig3 (2026-07-16): app/api/discovery/feed/route.ts computed offset=(page-1)*limit for the
-- general browse branch. A 30-minute ingest cron inserts new discovery_items rows, so a
-- mid-scroll insert shifts every OFFSET after it and the next /inspo auto-load repeats the
-- last card (page N+1 now starts one row earlier than it should).
--
-- discovery_feed_v2 fixes that by paging with a KEYSET (a WHERE boundary on the same order-by
-- columns discovery_feed already uses: gender rank, sort_order, created_at, id) instead of an
-- OFFSET, while remaining a strict superset of the old behaviour:
--   - p_cursor_id IS NULL (the default) -> identical where/order/limit/offset to discovery_feed,
--     via p_offset (defaulted 0), so a plain first-page call behaves exactly as before.
--   - p_cursor_id IS NOT NULL -> p_offset is ignored; rows are filtered to strictly AFTER the
--     cursor boundary in the same composite order, so concurrent inserts elsewhere in the table
--     can no longer shift which rows page N+1 starts from.
--
-- The composite order (rank ASC, sort_order ASC NULLS LAST, created_at DESC, id ASC) mixes
-- directions, so the boundary check is expressed as a ROW(...) comparison over the SAME
-- direction-normalised keys used in the ORDER BY: sort_order NULLS-last -> coalesced to a
-- sentinel max int (ASC-comparable), created_at DESC -> negated microsecond epoch (ASC-comparable).
-- The three extra rank_key/sort_order_key/created_at_key output columns are only ever consumed
-- by the API route (to build the next cursor from the last row) and are stripped before the
-- item payload reaches the client.
--
-- Applied on 2026-07-16 via apply_migration (name: discovery_feed_keyset_cursor).
-- Live proof recorded the same day: page 1 (limit 6, p_user_gender female) returned
-- f7024145,4b8a4f02,3a601c11,71744dbd,ac0c2226,e5ba878b; chaining its cursor returned
-- 22e36b64,48818344,bb179edd,8b6fee55,3b0723f1,079239a7 with 0 overlapping ids, and the
-- same chain through the live route (/api/discovery/feed?limit=6 then &cursor=...) returned
-- the identical two pages. A plain first-page call (no cursor) still returns 200 with
-- total=1070, i.e. the old behaviour is unchanged.
--
-- No explicit GRANT ships here: EXECUTE on a new function is granted to PUBLIC by Postgres
-- default, and that was verified live (has_function_privilege for anon and authenticated =
-- true on discovery_feed_v2, matching discovery_feed). An explicit "grant ... to anon" is also
-- refused by this repo's catastrophic-op guard, so the redundant line was dropped rather than
-- worked around.

create or replace function discovery_feed_v2(
  p_category    text default null,
  p_gender      text default null,
  p_texture     text default null,
  p_style       text default null,
  p_creator     text default null,
  p_user_gender text default null,
  p_limit       int  default 12,
  p_offset      int  default 0,
  p_tags_any    text[] default null,
  p_cursor_rank int default null,
  p_cursor_sort_order int default null,
  p_cursor_created_at timestamptz default null,
  p_cursor_id uuid default null
)
returns table (
  id uuid, source text, content_type text, media_type text,
  image_url text, tiktok_url text, tiktok_thumbnail_url text, tiktok_embed_html text,
  author_name text, style_name text, alt_text text, tags text[], price_min integer,
  total_count bigint,
  rank_key int, sort_order_key int, created_at_key timestamptz
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
    count(*) over () as total_count,
    case
      when p_user_gender is null then 0
      when di.gender = p_user_gender or di.gender = 'unisex' or di.gender is null then 0
      else 1
    end as rank_key,
    coalesce(di.sort_order, 2147483647) as sort_order_key,
    di.created_at as created_at_key
  from discovery_items di
  where di.status = 'published' and di.is_active
    and (p_category is null or di.category   = p_category)
    and (p_gender   is null or di.gender     = p_gender)
    and (p_texture  is null or di.texture    = p_texture)
    and (p_style    is null or di.style_name = p_style)
    and (p_creator  is null or di.owner_user_id = p_creator::uuid)
    and (p_tags_any is null or cardinality(p_tags_any) = 0 or di.tags && p_tags_any)
    and (
      p_cursor_id is null
      or ROW(
           case
             when p_user_gender is null then 0
             when di.gender = p_user_gender or di.gender = 'unisex' or di.gender is null then 0
             else 1
           end,
           coalesce(di.sort_order, 2147483647),
           -round(extract(epoch from di.created_at) * 1000000)::bigint,
           di.id
         ) > ROW(
           p_cursor_rank,
           p_cursor_sort_order,
           -round(extract(epoch from p_cursor_created_at) * 1000000)::bigint,
           p_cursor_id
         )
    )
  order by
    case
      when p_user_gender is null then 0
      when di.gender = p_user_gender or di.gender = 'unisex' or di.gender is null then 0
      else 1
    end asc,
    coalesce(di.sort_order, 2147483647) asc,
    di.created_at desc,
    di.id asc
  limit greatest(p_limit, 0)
  offset case when p_cursor_id is null then greatest(p_offset, 0) else 0 end;
$$;

-- (no explicit grant: EXECUTE defaults to PUBLIC, verified live for anon + authenticated)
