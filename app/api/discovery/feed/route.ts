import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, discoveryFeedLimiter, getClientIp } from "@/lib/ratelimit";
import { validateQuery, discoveryFeedSchema } from "@/lib/validations";

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
    // (Supabase SSR auth cookie naming). Skip the auth.getSession() round-trip entirely
    // when it's absent (the hot anonymous path); userId stays null, identical to what
    // a null session yields today.
    const hasSbCookie = req.cookies.getAll().some((c) => c.name.startsWith('sb-'));
    let userId: string | null = null;
    let supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null;
    if (hasSbCookie) {
      supabase = await createServerSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
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
      const items = list.map(({ total_count, ...rest }) => rest);
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
      return NextResponse.json({ items, total, page: filters.page, limit, has_more: total > offset + limit });
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
        const fyItems = fyList.map(({ total_count, ...rest }) => rest);
        return NextResponse.json({ items: fyItems, total: fyTotal, page: filters.page, limit, has_more: fyTotal > offset + limit });
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
    const items = list.map(({ total_count, ...rest }) => rest);
    return NextResponse.json({ items, total, page: filters.page, limit, has_more: total > offset + limit });
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
