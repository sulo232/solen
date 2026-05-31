import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/discovery/trending — terms people are actually searching a lot lately (V3-D409), surfaced into the
 * filter row. Demand-driven (not content-driven like /chip-terms) — so an emerging term with no content yet
 * ("ghost hair") can still trend. Each carries a representative photo when content matches, else null (the UI
 * shows a text/flame chip). Fails soft → empty list.
 */
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc("discovery_trending_terms", { p_days: 7, p_limit: 6, p_min: 3 });
    if (error) {
      console.error("[Discover] trending RPC failed:", error);
      return NextResponse.json({ terms: [] });
    }
    type Row = { term: string; n: number; item_id: string | null; tiktok_url: string | null; image_url: string | null; tiktok_thumbnail_url: string | null };
    const terms = ((data ?? []) as Row[])
      .map((r) => ({
        term: r.term,
        count: Number(r.n),
        // representative photo OF the trend, or null for emerging demand we have no content for yet
        thumb: r.tiktok_url && r.item_id
          ? `/api/discovery/thumb/${r.item_id}`
          : (r.image_url || r.tiktok_thumbnail_url || null),
      }))
      .filter((t) => !!t.term);
    return NextResponse.json({ terms });
  } catch (e) {
    console.error("[Discover] trending endpoint error:", e);
    return NextResponse.json({ terms: [] });
  }
}
