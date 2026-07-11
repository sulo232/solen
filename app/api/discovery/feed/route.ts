import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, discoveryFeedLimiter, getClientIp } from "@/lib/ratelimit";
import { validateQuery, discoveryFeedSchema } from "@/lib/validations";

// Ring 5b: CDN response caching. netlify.toml's "/api/*" block (lines 31-35) is a
// static/CDN header-injection rule and does NOT apply to this route's own function
// response (identical Netlify precedence note as app/api/salons/route.ts); the headers
// set below are what actually ships.
//
// This endpoint personalizes on the SAME url for a logged-in visitor: the pure-browse
// "for you" ranking (discovery_feed_for_you) below, and the disc_gender soft-bias
// applied inside the general discovery_feed branch, both change the RESPONSE for an
// otherwise-identical URL depending on whether a session cookie is present. Netlify's
// CDN cache key is the URL alone (no cookie in the key by default), so caching one of
// those personalized responses would risk it being replayed to a different visitor
// hitting the identical URL within the TTL window ("cache poisoning"). The
// `filters.search` branch is the one proven exception: it never reads userId/
// disc_gender for its results (userId is only used for the fire-and-forget search-event
// log), so its response is identical for every caller regardless of auth state and is
// always safe to cache.
//
// We deliberately do NOT ship a Netlify-Vary(cookie=...) split for the two ambiguous
// branches: the Supabase SSR auth cookie name is project-ref-specific and can be
// chunked (sb-<ref>-auth-token / .0 / .1), and this ring has no live-docs access to
// verify Netlify-Vary's exact cookie-name-matching semantics against the CURRENT
// Netlify platform behavior (rule 15: don't ship an unverified header rule that could
// silently no-op, this codebase's #1 failure mode is a control that looks wired but
// does nothing). Per the task's own tie-break ("correctness beats caching"), the
// for-you and general-feed branches are only marked cacheable when `userId` is
// positively null (no auth cookie was even present, so the response could not have
// been personalized); any request that resolved a session always gets an explicit
// no-store, so a personalized payload can never be written into the shared cache slot.
export const FEED_CACHE_HEADERS = {
  "Netlify-CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  "Cache-Control": "public, max-age=0, must-revalidate",
};
export const FEED_NO_STORE_HEADERS = {
  "Netlify-CDN-Cache-Control": "private, no-store",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

/**
 * Pure branch decision extracted so ring5b-kill-test.ts can exercise it directly: the
 * real userId resolution below routes through next/headers' cookies(), which only
 * works inside a live Next.js request and can't be simulated from a standalone script
 * (see the identical constraint noted in lib/salon-detail.ts), so the personalized
 * variant is tested by calling this exact function with a synthetic userId instead of
 * faking a browser session.
 */
export function feedCacheHeaders(opts: { isSearchBranch: boolean; userId: string | null }) {
  if (opts.isSearchBranch) return FEED_CACHE_HEADERS;
  return opts.userId ? FEED_NO_STORE_HEADERS : FEED_CACHE_HEADERS;
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
    const pTagsAny = tagsAny.length ? tagsAny : null;

    // V3-D405 (#20): when there's a search term, route through the relevance-ranked FTS RPC (search_discovery)
    // instead of a flat ILIKE. It ranks by ts_rank over name/author/style/tags/description, applies the same
    // category/gender/texture/style filters, and returns the light grid column set + a window count(*) for has_more.
    // (Old ILIKE matched raw substrings with no ranking — "fade" surfaced arbitrary rows in arbitrary order.)
    if (filters.search) {
      const { data: rows, error: rpcErr } = await admin.rpc("search_discovery", {
        q: filters.search,
        p_category: filters.category && filters.category !== "all" ? filters.category : null,
        p_gender: filters.gender && filters.gender !== "all" ? filters.gender : null,
        p_texture: filters.texture || null,
        p_style: filters.style || null,
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
    let userGender: string | null = null;
    if (userId && supabase && (!filters.gender || filters.gender === "all")) {
      const { data: profile } = await supabase.from("profiles").select("disc_gender").eq("id", userId).single();
      userGender = (profile?.disc_gender as string | undefined) ?? null;
    }

    const { data: rows, error: feedErr } = await admin.rpc("discovery_feed", {
      p_category: filters.category && filters.category !== "all" ? filters.category : null,
      p_gender: filters.gender && filters.gender !== "all" ? filters.gender : null,
      p_texture: filters.texture || null,
      p_style: filters.style || null,
      p_creator: filters.creator || null,
      p_user_gender: userGender,
      p_limit: limit,
      p_offset: offset,
      // Progressive drill-down cut tags (di.tags && p_tags_any). 9th arg, live-applied + verified; no-op when null.
      p_tags_any: pTagsAny,
    });
    if (feedErr) {
      console.error("[Discover] discovery_feed RPC failed:", feedErr);
      return NextResponse.json({ error: feedErr.message }, { status: 500 });
    }
    const list = (rows ?? []) as Array<Record<string, any>>;
    const total = list.length > 0 ? Number(list[0].total_count) : 0;
    // Ring 2d: same tiktok_embed_html trim as the search_discovery branch above.
    const items = list.map(({ total_count, tiktok_embed_html, ...rest }) => rest);
    return NextResponse.json(
      { items, total, page: filters.page, limit, has_more: total > offset + limit },
      { headers: feedCacheHeaders({ isSearchBranch: false, userId }) },
    );
  } catch (e: any) {
    // Graceful fallback when Supabase admin client can't be created
    return NextResponse.json({
      items: [],
      total: 0,
      page: 1,
      limit: 30,
      has_more: false,
    });
  }
}
