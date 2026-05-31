import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * Recent searches for the dropdown (V3-D413). Reads the per-user history already logged to
 * discovery_search_events, deduped + newest-first, each with a resolved representative photo (or thumb null →
 * the UI shows a neutral search-tile). Logged-out → empty list (the dropdown falls back to Trending).
 *
 * GET    /api/discovery/recent-searches            → { terms: [{ term, thumb }] }
 * DELETE /api/discovery/recent-searches?term=foo    → remove one
 * DELETE /api/discovery/recent-searches?all=1        → clear all (the "Clear all" affordance)
 */
type Row = { term: string; item_id: string | null; tiktok_url: string | null; image_url: string | null; tiktok_thumbnail_url: string | null };
const toThumb = (r: Row): string | null =>
  r.tiktok_url && r.item_id ? `/api/discovery/thumb/${r.item_id}` : (r.image_url || r.tiktok_thumbnail_url || null);

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ terms: [] }); // logged-out → dropdown falls back to Trending

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc("discovery_recent_searches", { p_user_id: userId, p_limit: 6 });
    if (error) {
      console.error("[Discover] recent-searches RPC failed:", error);
      return NextResponse.json({ terms: [] });
    }
    const terms = ((data ?? []) as Row[])
      .map((r) => ({ term: r.term, thumb: toThumb(r) }))
      .filter((t) => !!t.term);
    return NextResponse.json({ terms });
  } catch (e) {
    console.error("[Discover] recent-searches endpoint error:", e);
    return NextResponse.json({ terms: [] });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: "auth required" }, { status: 401 });

    const admin = createAdminSupabaseClient();
    const all = req.nextUrl.searchParams.get("all");
    const term = req.nextUrl.searchParams.get("term");

    // Scoped to the caller's own rows only (user_id = session user) — can't touch anyone else's history.
    let query = admin.from("discovery_search_events").delete().eq("user_id", userId);
    if (all !== "1") {
      if (!term) return NextResponse.json({ error: "term required" }, { status: 400 });
      query = query.eq("normalized", term.trim().toLowerCase().slice(0, 80));
    }
    const { error } = await query;
    if (error) {
      console.error("[Discover] recent-searches delete failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[Discover] recent-searches delete error:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
