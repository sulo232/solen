import { createAdminSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

// This route is public, non-personalized aggregate data (no auth/session read anywhere
// below), so it uses createAdminSupabaseClient instead of createServerSupabaseClient.
// createServerSupabaseClient calls cookies(), which forces the route dynamic and silently
// DEFEATS `export const revalidate` below; createAdminSupabaseClient reads no cookies, so
// ISR actually works. Precedent: app/api/metrics/global/route.ts (revalidate=86400, same
// pattern). Selected columns (id, name, slug, cover_photo_url, city_id, average_rating,
// review_count, is_top_pick) contain none of the sensitive salon columns (stripe_account_id,
// owner_id, frozen_reason, search_doc, score_details), so no allowlist trim was needed.
export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // Fetch top 10 salons (assuming by internal sorting like created_at or random)
    // We fetch a bit more fields to ensure rendering works client-side
    const { data, error } = await supabase
      .from("salons")
      .select("id, name, slug, cover_photo_url, city_id, average_rating, review_count, is_top_pick")
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
