export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("salons")
    .select("quartier, cover_photo_url")
    .eq("is_active", true)
    .not("cover_photo_url", "is", null);

  if (error || !data) return NextResponse.json({ images: {} });
  
  const images: Record<string, string> = {};
  for (const row of data) {
    if (row.quartier && !images[row.quartier] && row.cover_photo_url) {
      images[row.quartier] = row.cover_photo_url;
    }
  }

  return NextResponse.json({ images });
}
