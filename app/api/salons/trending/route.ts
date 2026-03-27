import { createServerSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const revalidate = 86400; // Cache for 24 hours

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Fetch top 10 salons (assuming by internal sorting like created_at or random)
    // We fetch a bit more fields to ensure rendering works client-side
    const { data, error } = await supabase
      .from("salons")
      .select("id, name, slug, cover_photo_url, city, rating, review_count")
      .eq("status", "active")
      .limit(10);
      
    if (error) throw error;
    
    return NextResponse.json({ items: data }, { status: 200 });
  } catch (err) {
    console.error("Trending API Error:", err);
    return NextResponse.json({ error: "Internal Server Error", items: [] }, { status: 500 });
  }
}
