export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// GET /api/reviews/featured — Top reviews for homepage carousel
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, profiles!reviews_user_id_fkey(display_name), salons!reviews_salon_id_fkey(name)")
    .gte("rating", 4)
    .not("comment", "is", null)
    .order("created_at", { ascending: false })
    .limit(6);

  const items = (reviews ?? []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    comment: (r.comment ?? "").slice(0, 120),
    reviewer_name: r.profiles?.display_name ?? "Anonym",
    salon_name: r.salons?.name ?? "",
  }));

  return NextResponse.json({ items });
}
