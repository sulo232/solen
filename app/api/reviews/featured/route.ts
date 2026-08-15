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

  // The salon-visibility gate runs in SQL (`!inner` + embedded filters) so it is applied
  // BEFORE .limit(). It used to run only in JS below, which dropped rows AFTER the cap and
  // silently under-filled the homepage carousel (?limit=10 rendered 6 cards, measured
  // 2026-08-15: 4 of the 10 newest eligible reviews belonged to one inactive salon).
  // Predicates are the exact equivalents of the JS checks kept below, so nothing new is
  // eligible: `is_test` uses `not.is.true` (not `eq.false`) to keep matching `!is_test`,
  // which passes NULL as well as false.
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at, profiles!reviews_user_id_fkey(display_name), salons!reviews_salon_id_fkey!inner(name, slug, is_test, is_active, listed_on_marketplace)")
    .gte("rating", 4)
    .not("comment", "is", null)
    .eq("is_flagged", false)
    .eq("is_hidden", false)
    .eq("salons.is_active", true)
    .eq("salons.listed_on_marketplace", true)
    .not("salons.is_test", "is", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  const items = (reviews ?? [])
    // Defensive net, NOT the primary gate: the salon-visibility half (same gate as
    // /api/salons: is_active AND listed_on_marketplace AND NOT is_test) is now enforced in
    // the query above, so it can no longer eat into the limit. What only this filter still
    // covers is empty-string name/slug/comment, which SQL `not.is.null` lets through.
    // Stops blank cards + dead PDP links on the homepage.
    .filter((r: any) =>
      r.salons?.name && r.salons?.slug && r.comment &&
      r.salons?.is_active && r.salons?.listed_on_marketplace && !r.salons?.is_test,
    )
    .map((r: any) => ({
      id: r.id,
      rating: r.rating,
      // Full comment: the card clamps visually (line-clamp-3 in Reviews.tsx) and renders a
      // real ellipsis. The old .slice(0, 120) cut mid-word with no ellipsis and destroyed
      // text the UI could otherwise reveal (and that assistive tech could otherwise read).
      comment: r.comment ?? "",
      reviewer_name: r.profiles?.display_name ?? "Anonym",
      salon_name: r.salons?.name ?? "",
      salon_slug: r.salons?.slug ?? "",
      created_at: r.created_at ?? null,
    }));

  return NextResponse.json({ items });
}
