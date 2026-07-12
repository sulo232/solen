export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET /api/salons/recommendations — personalized salon recommendations
// Query params: ?user_id=X (optional)
// GET /api/salons/similar?salon_id=X — similar salons
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");

  const admin = createAdminSupabaseClient();

  // ── Similar salons mode ──
  if (salonId) {
    const { data: salon } = await admin
      .from("salons")
      .select("id, categories, quartier")
      .eq("id", salonId)
      .single();

    if (!salon) return NextResponse.json({ salons: [] });

    // Find salons with overlapping categories in similar quartier
    let query = admin
      .from("salons")
      .select("id, name, slug, categories, quartier, average_rating, review_count, cover_photo_url, explore_score, is_top_pick")
      .eq("is_active", true)
      .eq("listed_on_marketplace", true)
      .eq("is_test", false)
      .neq("id", salonId)
      .order("explore_score", { ascending: false })
      .limit(4);

    // Prefer same categories
    if (salon.categories?.length > 0) {
      query = query.overlaps("categories", salon.categories);
    }

    const { data: similar } = await query;
    return NextResponse.json({ salons: similar ?? [] });
  }

  // ── Personalized recommendations mode ──
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Try to get user preferences. user_preferences has no favorite_quartiers/favorite_services
    // columns (phantom, caught by strict typing); the real columns are favorite_quartier_ids and
    // favorite_service_slugs (same as app/api/profile/preferences/route.ts).
    const { data: prefs } = await admin
      .from("user_preferences")
      .select("favorite_quartier_ids, favorite_service_slugs")
      .eq("user_id", user.id)
      .maybeSingle();

    if (prefs?.favorite_quartier_ids?.length || prefs?.favorite_service_slugs?.length) {
      let query = admin
        .from("salons")
        .select("id, name, slug, categories, quartier, average_rating, review_count, cover_photo_url, explore_score, is_top_pick")
        .eq("is_active", true)
        .eq("listed_on_marketplace", true)
        .eq("is_test", false)
        .order("explore_score", { ascending: false })
        .limit(8);

      if ((prefs.favorite_quartier_ids?.length ?? 0) > 0) {
        query = query.in("quartier", prefs.favorite_quartier_ids ?? []);
      }

      const { data: personalized } = await query;
      if (personalized && personalized.length > 0) {
        return NextResponse.json({ salons: personalized, source: "personalized" });
      }
    }
  }

  // Fallback: highest explore_score
  const { data: popular } = await admin
    .from("salons")
    .select("id, name, slug, categories, quartier, average_rating, review_count, cover_photo_url, explore_score")
    .eq("is_active", true)
    .eq("listed_on_marketplace", true)
    .eq("is_test", false)
    .order("explore_score", { ascending: false })
    .limit(8);

  return NextResponse.json({ salons: popular ?? [], source: "popular" });
}
