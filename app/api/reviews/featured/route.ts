export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET /api/reviews/featured — Top reviews for homepage carousel
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  // Admin client: this is a public read of PUBLISHED reviews. The anon client cannot read
  // profiles.display_name (RLS = auth.uid()=id), so reviewer_name was always "Anonym". The
  // select is restricted to display_name only, so no broader profile data is exposed.
  const supabase = createAdminSupabaseClient();
  const limit = Math.min(20, Math.max(1, Number(new URL(req.url).searchParams.get("limit")) || 6));

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, profiles!reviews_user_id_fkey(display_name), salons!reviews_salon_id_fkey(name, slug, is_test, is_active, listed_on_marketplace)")
    .gte("rating", 4)
    .not("comment", "is", null)
    .eq("is_flagged", false)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  const items = (reviews ?? [])
    // Only reviews for CUSTOMER-VISIBLE salons: same gate as /api/salons
    // (is_active AND listed_on_marketplace AND NOT is_test) + a real slug/name/comment.
    // Stops inactive/test-salon reviews + blank cards + dead PDP links on the homepage.
    .filter((r: any) =>
      r.salons?.name && r.salons?.slug && r.comment &&
      r.salons?.is_active && r.salons?.listed_on_marketplace && !r.salons?.is_test,
    )
    .map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: (r.comment ?? "").slice(0, 120),
      reviewer_name: r.profiles?.display_name ?? "Anonym",
      salon_name: r.salons?.name ?? "",
      salon_slug: r.salons?.slug ?? "",
      created_at: r.created_at ?? null,
    }));

  return NextResponse.json({ items });
}
