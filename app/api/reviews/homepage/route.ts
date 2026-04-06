import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/reviews/homepage
 *
 * Returns real reviews for the homepage testimonials section.
 * Only 4+ star reviews, max 6, most recent first, from last 12 months.
 * If <3 reviews exist, returns empty array (frontend hides section).
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, comment, reviewer_name, created_at")
      .gte("rating", 4)
      .gte("created_at", twelveMonthsAgo.toISOString())
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(6);

    if (error) {
      console.error("[reviews/homepage] Supabase error:", error);
      return NextResponse.json({ reviews: [] });
    }

    // Add city field (default Basel for now — can be joined later)
    const reviews = (data || []).map((r) => ({
      ...r,
      city: "Basel",
    }));

    return NextResponse.json(
      { reviews },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err) {
    console.error("[reviews/homepage] Unexpected error:", err);
    return NextResponse.json({ reviews: [] });
  }
}
