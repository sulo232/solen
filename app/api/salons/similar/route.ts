import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const currentId = searchParams.get("current_id");
  const quartier = searchParams.get("quartier");
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "3", 10);

  if (!currentId || !quartier || !category) {
    return NextResponse.json(
      { error: "Missing parameters" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Explicit public column list, same shape as app/api/salons/route.ts (selectStr).
    // Replaces select('*') which shipped all ~98 salon columns to anonymous
    // clients, including owner/payment internals. Never select search_doc,
    // score_details, stripe_account_id, owner_id here.
    const { data, error } = await supabase
      .from("salons")
      .select(
        "id, slug, name, cover_photo_url, gallery_urls, categories, address, postal_code, quartier, latitude, longitude, opening_hours, average_rating, review_count, last_minute_discount_percent, walkin_enabled, accepts_online_payment, solen_score, created_at",
      )
      .eq("quartier", quartier)
      .contains("categories", [category])
      .neq("id", currentId)
      .eq("is_active", true)
      .eq("listed_on_marketplace", true)
      .eq("is_test", false)
      .order("solen_score", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ salons: data || [] });
  } catch (err) {
    console.error("Similar salons error:", err);
    return NextResponse.json(
      { error: "Failed to fetch similar salons" },
      { status: 500 }
    );
  }
}
