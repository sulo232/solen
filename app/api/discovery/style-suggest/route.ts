import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/discovery/style-suggest?q= — typed-query style suggestions for the search dropdown (V3-D413).
 * Distinct tag/style terms CONTAINING the typed string (typeahead feel), each with a representative photo OF
 * that style — or thumb null when there's no confident content (the UI renders a neutral search-tile, never a
 * wrong/random photo). Replaces the hardcoded static POOL in SearchAutocomplete. Fails soft → empty list.
 */
type Row = { term: string; item_id: string | null; tiktok_url: string | null; image_url: string | null; tiktok_thumbnail_url: string | null };
const toThumb = (r: Row): string | null =>
  r.tiktok_url && r.item_id ? `/api/discovery/thumb/${r.item_id}` : (r.image_url || r.tiktok_thumbnail_url || null);

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ terms: [] });

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc("discovery_style_suggest", { q: q.slice(0, 60), p_limit: 6 });
    if (error) {
      console.error("[Discover] style-suggest RPC failed:", error);
      return NextResponse.json({ terms: [] });
    }
    const terms = ((data ?? []) as Row[])
      .map((r) => ({ term: r.term, thumb: toThumb(r) }))
      .filter((t) => !!t.term);
    return NextResponse.json({ terms });
  } catch (e) {
    console.error("[Discover] style-suggest endpoint error:", e);
    return NextResponse.json({ terms: [] });
  }
}
