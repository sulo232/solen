import { createAdminSupabaseClient } from "@/lib/supabase";
import { SALON_PUBLIC_COLS } from "@/lib/salons/public-columns";
import { NextResponse } from "next/server";

// This route is public, non-personalized aggregate data (no auth/session read anywhere
// below), so it uses createAdminSupabaseClient instead of createServerSupabaseClient.
// createServerSupabaseClient calls cookies(), which forces the route dynamic and silently
// DEFEATS `export const revalidate` below; createAdminSupabaseClient reads no cookies, so
// ISR actually works. Precedent: app/api/metrics/global/route.ts (revalidate=86400, same
// pattern).
export const revalidate = 86400; // Cache for 24 hours

// Ring 2d: was a hand-typed inline column list, duplicating the sensitivity judgment
// SALON_PUBLIC_COLS already makes. Intersect this widget's small field set (unchanged
// response shape) against the shared allowlist (lib/salons/public-columns.ts) instead of
// hardcoding a second one that could silently drift and re-admit a sensitive column later
// without ever touching the shared list.
const TRENDING_FIELDS = ["id", "name", "slug", "cover_photo_url", "city_id", "average_rating", "review_count", "is_top_pick"];
const PUBLIC_COLS_SET = new Set(SALON_PUBLIC_COLS.split(",").map((c) => c.trim()));
const TRENDING_COLS = TRENDING_FIELDS.filter((f) => PUBLIC_COLS_SET.has(f)).join(", ");

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // Fetch top 10 salons (assuming by internal sorting like created_at or random)
    // We fetch a bit more fields to ensure rendering works client-side
    const { data, error } = await supabase
      .from("salons")
      .select(TRENDING_COLS)
      .eq("is_active", true)
      .eq("listed_on_marketplace", true)
      .eq("is_test", false)
      .limit(10);
      
    if (error) throw error;
    
    return NextResponse.json({ items: data }, { status: 200 });
  } catch (err) {
    console.error("Trending API Error:", err);
    return NextResponse.json({ error: "Internal Server Error", items: [] }, { status: 500 });
  }
}
