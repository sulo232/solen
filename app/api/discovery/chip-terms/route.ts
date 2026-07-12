import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

/**
 * GET /api/discovery/chip-terms — data-driven quick-chip labels for the Discover filter row (V3-D407, #22).
 * Returns the top style tags by frequency (minus non-style noise), so the chips always lead to populated
 * results and self-update as content grows. Replaces the hardcoded chip list (Skin Fade / Buzz / Bob) that
 * matched zero items. Fails soft → empty list (the row simply shows just the Textur control).
 */
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  // Per-category chips (owner 2026-06-23): ?category=hair -> hair tags only; absent / 'all' -> global top tags.
  const categoryParam = req.nextUrl.searchParams.get("category");
  const pCategory = categoryParam && categoryParam !== "all" ? categoryParam : undefined;

  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc("discovery_chip_terms", { p_limit: 10, p_category: pCategory });
    if (error) {
      console.error("[Discover] chip-terms RPC failed:", error);
      return NextResponse.json({ terms: [] });
    }
    // V3-D408 (#22): each term carries a representative photo of that style (tiktok → the thumb refresh proxy,
    // else the stored image/thumbnail). So a chip shows an actual photo of its label, not a random feed thumb.
    type Row = { term: string; item_id: string | null; tiktok_url: string | null; image_url: string | null; tiktok_thumbnail_url: string | null };
    const terms = ((data ?? []) as Row[])
      .map((r) => ({
        term: r.term,
        thumb: r.tiktok_url && r.item_id
          ? `/api/discovery/thumb/${r.item_id}`
          : (r.image_url || r.tiktok_thumbnail_url || null),
      }))
      .filter((t): t is { term: string; thumb: string } => !!t.term && !!t.thumb);
    return NextResponse.json({ terms });
  } catch (e) {
    console.error("[Discover] chip-terms endpoint error:", e);
    return NextResponse.json({ terms: [] });
  }
}
