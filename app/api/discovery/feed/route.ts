import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, discoveryFeedLimiter, getClientIp } from "@/lib/ratelimit";
import { validateQuery, discoveryFeedSchema } from "@/lib/validations";
import { feedCacheHeaders } from "@/lib/discovery/feed-cache-headers";

// Ring 5b: CDN response caching headers/decision moved to
// lib/discovery/feed-cache-headers.ts (Next.js's route-module type contract only
// allows HTTP-method + config exports from a route.ts; see that file for the full
// caching rationale, including why the search branch is always cacheable and the
// for-you/general branches are no-store whenever a session cookie was present).

// ig3 (2026-07-16): opaque keyset cursor for the general browse branch (discovery_feed_v2,
// supabase/migrations/20260716120000_discovery_feed_keyset_cursor.sql). Base64url JSON of the
// last row's boundary on the RPC's own order-by keys (gender rank, sort_order, created_at,
// id). No meaning outside this route, never parsed by the client.
type FeedCursor = { r: number; s: number; c: string; i: string };
function decodeFeedCursor(raw: string): FeedCursor | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      parsed && typeof parsed.r === "number" && typeof parsed.s === "number" &&
      typeof parsed.c === "string" && typeof parsed.i === "string"
    ) {
      return parsed as FeedCursor;
    }
  } catch {
    // fall through to null (invalid cursor)
  }
  return null;
}
function encodeFeedCursor(cursor: FeedCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export async function GET(req: NextRequest) {
  try {
    const disabled = await checkFeatureEnabled("discovery");
    if (disabled) return disabled;

    const rateLimited = await applyRateLimit(discoveryFeedLimiter, { ip: getClientIp(req) });
    if (rateLimited) return rateLimited;

    const { data: filters, error } = validateQuery(discoveryFeedSchema, req.nextUrl.searchParams);
    if (error) return NextResponse.json({ message: error.message }, { status: 400 });

    // Optional auth for personalization. Cheap cookie-presence guard (same pattern as
    // /api/bookings/user): a real session always carries an "sb-" prefixed cookie
    // (Supabase SSR auth cookie naming). Skip the auth.getUser() round-trip entirely
    // when it's absent (the hot anonymous path); userId stays null, identical to what
    // a null user yields today.
    const hasSbCookie = req.cookies.getAll().some((c) => c.name.startsWith('sb-'));
    let userId: string | null = null;
    let supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null;
    if (hasSbCookie) {
      supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }

    const admin = createAdminSupabaseClient();

    const limit = filters.limit;
    const offset = (filters.page - 1) * limit;

    // Progressive drill-down cut tags: comma-joined on the wire → a trimmed text[] for discovery_feed(p_tags_any).
    // Empty/absent → null (the RPC treats null as a no-op). The filter is a tag OVERLAP (di.tags && p_tags_any).
    const tagsAny = filters.tags
      ? filters.tags.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10)
      : [];
    const pTagsAny = tagsAny.length ? tagsAny : undefined;

    // V3-D405 (#20): when there's a search term, route through the relevance-ranked FTS RPC (search_discovery)
    // instead of a flat ILIKE. It ranks by ts_rank over name/author/style/tags/description, applies the same
    // category/gender/texture/style filters, and returns the light grid column set + a window count(*) for has_more.
    // (Old ILIKE matched raw substrings with no ranking — "fade" surfaced arbitrary rows in arbitrary order.)
    if (filters.search) {
      const { data: rows, error: rpcErr } = await admin.rpc("search_discovery", {
        q: filters.search,
        p_category: filters.category && filters.category !== "all" ? filters.category : undefined,
        p_gender: filters.gender && filters.gender !== "all" ? filters.gender : undefined,
        p_texture: filters.texture || undefined,
        p_style: filters.style || undefined,
        p_limit: limit,
        p_offset: offset,
      });
      if (rpcErr) {
        console.error("[Discover] search_discovery RPC failed:", rpcErr);
        return NextResponse.json({ error: rpcErr.message }, { status: 500 });
      }
      const list = (rows ?? []) as Array<Record<string, any>>;
      const total = list.length > 0 ? Number(list[0].total_count) : 0;
      // Ring 2d: drop tiktok_embed_html (the raw TikTok oEmbed HTML blob, ~54% of a 20-item
      // feed payload). The grid (ItemCard/VideoCard) never renders it, only truthy-checks it
      // for the isVideo flag, and that check is already covered by tiktok_url/media_type
      // (live-DB discriminate check: 0 of 935 rows with tiktok_embed_html set would flip
      // isVideo if it were absent). The detail page (/inspo/[id]) fetches its own item
      // separately and is unaffected.
      const items = list.map(({ total_count, tiktok_embed_html, ...rest }) => rest);
      // V3-D409: log the search (page 1 only → one event per search action, not per scroll page) to power
      // trending terms. Service role bypasses RLS; failures are non-fatal.
      if (filters.page === 1) {
        try {
          await admin.from("discovery_search_events").insert({
            term: filters.search,
            normalized: filters.search.trim().toLowerCase().slice(0, 80),
            user_id: userId,
          });
        } catch (e) { console.error("[Discover] search log failed:", e); }
      }
      return NextResponse.json(
        { items, total, page: filters.page, limit, has_more: total > offset + limit },
        { headers: feedCacheHeaders({ isSearchBranch: true, userId }) },
      );
    }

    // For-you DNA ranking (owner 2026-06-23): a logged-in viewer doing a PURE browse (no category/gender/texture/
    // style/creator filter) gets the whole feed RANKED by their derived style affinity (user_style_affinity,
    // recomputed from saves/likes/views/searches). Cold users score 0 across the board, so the order is identical
    // to neutral. Any explicit filter, or logged-out, falls through to discovery_feed below (graceful on error).
    const isPureBrowse =
      !filters.creator &&
      (!filters.category || filters.category === "all") &&
      (!filters.gender || filters.gender === "all") &&
      !filters.texture && !filters.style && !pTagsAny;
    if (userId && isPureBrowse) {
      const { data: fyRows, error: fyErr } = await admin.rpc("discovery_feed_for_you", {
        p_user_id: userId, p_limit: limit, p_offset: offset,
      });
      if (!fyErr) {
        const fyList = (fyRows ?? []) as Array<Record<string, any>>;
        const fyTotal = fyList.length > 0 ? Number(fyList[0].total_count) : 0;
        // Ring 2d: same tiktok_embed_html trim as the search_discovery branch above.
        const fyItems = fyList.map(({ total_count, tiktok_embed_html, ...rest }) => rest);
        return NextResponse.json(
          { items: fyItems, total: fyTotal, page: filters.page, limit, has_more: fyTotal > offset + limit },
          { headers: feedCacheHeaders({ isSearchBranch: false, userId }) },
        );
      }
      console.error("[Discover] discovery_feed_for_you failed, falling back to neutral feed:", fyErr);
    }

    // V3-D406 (#23): personalized browse via the discovery_feed RPC. The viewer's saved disc_gender soft-biases
    // their gender (+ unisex) to the TOP — never a hard filter, so they still see everything. Logged-out / no
    // profile → p_user_gender null → neutral order (identical to before). This supersedes the old binary
    // "suppress beard for female" rule. p_creator (owner_user_id) serves UserPostsSection (?creator=<userId>).
    // Returns the same light grid column set + a window count(*) for has_more.
    let userGender: string | undefined = undefined;
    if (userId && supabase && (!filters.gender || filters.gender === "all")) {
      const { data: profile } = await supabase.from("profiles").select("disc_gender").eq("id", userId).single();
      userGender = (profile?.disc_gender as string | undefined) ?? undefined;
    }

    // ig3 (2026-07-16): decode the opaque cursor, if any, BEFORE the RPC call so a malformed
    // one fails fast with a 400 instead of silently falling back to page 1.
    let cursor: FeedCursor | null = null;
    if (filters.cursor) {
      cursor = decodeFeedCursor(filters.cursor);
      if (!cursor) return NextResponse.json({ error: "invalid cursor" }, { status: 400 });
    }

    // discovery_feed_v2 (supabase/migrations/20260716120000_discovery_feed_keyset_cursor.sql)
    // is a strict superset of discovery_feed: p_cursor_id null means identical where/order/limit/
    // offset to the old 9-arg discovery_feed via p_offset, so a plain page/offset call (no
    // cursor) behaves exactly as before. p_cursor_id set means p_offset is ignored and rows are
    // keyset-filtered to strictly after the cursor boundary, so a mid-scroll cron insert can no
    // longer shift an OFFSET and repeat the last card.
    //
    // `as any` on the function name only: lib/database.types.ts is generated FROM the live DB
    // schema (supabase gen types) and this sub-agent has no DB/MCP access to apply the migration
    // and regenerate it, so discovery_feed_v2 isn't in the generated RPC name union yet. Narrow,
    // intentional, and removable in one line once the migration is applied + types regenerate.
    const { data: rows, error: feedErr } = await admin.rpc("discovery_feed_v2" as any, {
      p_category: filters.category && filters.category !== "all" ? filters.category : undefined,
      p_gender: filters.gender && filters.gender !== "all" ? filters.gender : undefined,
      p_texture: filters.texture || undefined,
      p_style: filters.style || undefined,
      p_creator: filters.creator || undefined,
      p_user_gender: userGender,
      p_limit: limit,
      p_offset: offset,
      // Progressive drill-down cut tags (di.tags && p_tags_any). 9th arg, live-applied + verified; no-op when null.
      p_tags_any: pTagsAny,
      p_cursor_rank: cursor?.r,
      p_cursor_sort_order: cursor?.s,
      p_cursor_created_at: cursor?.c,
      p_cursor_id: cursor?.i,
    }) as { data: Array<Record<string, any>> | null; error: { message: string } | null };
    if (feedErr) {
      console.error("[Discover] discovery_feed_v2 RPC failed:", feedErr);
      return NextResponse.json({ error: feedErr.message }, { status: 500 });
    }
    const list = (rows ?? []) as Array<Record<string, any>>;
    const total = list.length > 0 ? Number(list[0].total_count) : 0;
    // Ring 2d: same tiktok_embed_html trim as the search_discovery branch above.
    const itemsWithCursorKeys = list.map(({ total_count, tiktok_embed_html, ...rest }) => rest);
    // ig3: the last row's boundary becomes the NEXT cursor. Only meaningful (and only sent)
    // when there's actually another page, so the client has a clean "stop paginating" signal.
    const effectiveOffset = cursor ? 0 : offset;
    const hasMore = total > effectiveOffset + limit;
    const lastRow = itemsWithCursorKeys[itemsWithCursorKeys.length - 1];
    const nextCursor = hasMore && lastRow
      ? encodeFeedCursor({ r: lastRow.rank_key, s: lastRow.sort_order_key, c: lastRow.created_at_key, i: lastRow.id })
      : null;
    const items = itemsWithCursorKeys.map(({ rank_key, sort_order_key, created_at_key, ...pub }) => pub);
    return NextResponse.json(
      { items, total, page: filters.page, limit, has_more: hasMore, next_cursor: nextCursor },
      { headers: feedCacheHeaders({ isSearchBranch: false, userId }) },
    );
  } catch (e: any) {
    console.error("[discovery/feed] unhandled exception:", e);
    return NextResponse.json(
      { error: e?.message ?? "internal error", items: [], total: 0, page: 1, limit: 30, has_more: false },
      { status: 500 },
    );
  }
}
