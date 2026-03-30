import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("salons")
      .select(
        "id, name, slug, cover_photo_url, average_rating, review_count, categories, quartier, address"
      )
      .eq("slug", params.slug)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }
    return NextResponse.json({ salon: data });
  } catch (err) {
    console.error("GET /api/salons/by-slug error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
