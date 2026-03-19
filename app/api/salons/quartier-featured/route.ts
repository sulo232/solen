import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export const revalidate = 3600; // Cache 1 hour

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("salons")
      .select("quartier, cover_photo_url")
      .eq("is_active", true)
      .not("cover_photo_url", "is", null)
      .order("average_rating", { ascending: false })
      .limit(100);

    const images: Record<string, string | null> = {};
    for (const row of data ?? []) {
      if (row.quartier && !images[row.quartier] && row.cover_photo_url) {
        images[row.quartier] = row.cover_photo_url;
      }
    }

    return NextResponse.json({ images }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch {
    return NextResponse.json({ images: {} });
  }
}
