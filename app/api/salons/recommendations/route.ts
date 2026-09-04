export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
// foryou-card-props: same data path every sibling rail already uses (TopCategoryRails.tsx via
// page.tsx) for priceFromCHF/priceFromServiceNames/city/postalCode, so the For-you card carries
// the same info stack as its neighbours (FLOORS LAW 8) instead of a second, thinner query.
import { getSalonCardDataMap } from "@/app/[locale]/_components/homepage/salonCardData";

/** Merges getSalonCardDataMap's price/city fields onto an already-ordered salon list without
 *  touching order or membership, so callers keep their own ranking untouched. */
async function withCardData<T extends { id: string }>(salons: T[]) {
  if (salons.length === 0) return [];
  const cardData = await getSalonCardDataMap(salons.map((s) => s.id));
  return salons.map((s) => {
    const d = cardData[s.id];
    return {
      ...s,
      priceFromCHF: d?.priceFromCHF ?? null,
      priceFromServiceNames: d?.priceFromServiceNames ?? null,
      postalCode: d?.postalCode ?? null,
      city: d?.city ?? null,
    };
  });
}

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
    // 1) Affinity-ranked (the points engine): the user's most-engaged salons first.
    //    user_salon_affinity is recomputed daily from kept bookings / favorites / reviews
    //    (+ the search funnel once its logging is wired). Highest score = strongest affinity.
    const { data: aff } = await admin
      .from("user_salon_affinity")
      .select("salon_id, score")
      .eq("user_id", user.id)
      .order("score", { ascending: false })
      .limit(12);
    if (aff && aff.length > 0) {
      const ids = aff.map((a) => a.salon_id as string);
      const { data: affSalons } = await admin
        .from("salons")
        .select("id, name, slug, categories, quartier, average_rating, review_count, cover_photo_url, explore_score, is_top_pick")
        .in("id", ids)
        .eq("is_active", true)
        .eq("listed_on_marketplace", true);
      if (affSalons && affSalons.length > 0) {
        const rank = new Map(aff.map((a, i) => [a.salon_id as string, i]));
        const ordered = affSalons.slice().sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
        return NextResponse.json({ salons: await withCardData(ordered), source: "affinity" });
      }
    }

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
        return NextResponse.json({ salons: await withCardData(personalized), source: "personalized" });
      }
    }
  }

  // Fallback A: rank by global engagement (salon_engagement, phase 4 — kept bookings + favorites
  // + reviews, decayed). The cold-start "popular for you" when there's no personal affinity yet.
  const { data: eng } = await admin
    .from("salon_engagement")
    .select("salon_id, score")
    .order("score", { ascending: false })
    .limit(20);
  if (eng && eng.length > 0) {
    const ids = eng.map((e) => e.salon_id as string);
    const { data: engSalons } = await admin
      .from("salons")
      .select("id, name, slug, categories, quartier, average_rating, review_count, cover_photo_url, explore_score, is_top_pick")
      .in("id", ids)
      .eq("is_active", true)
      .eq("listed_on_marketplace", true);
    if (engSalons && engSalons.length > 0) {
      const rank = new Map(eng.map((e, i) => [e.salon_id as string, i]));
      const ordered = engSalons.slice().sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999)).slice(0, 8);
      return NextResponse.json({ salons: await withCardData(ordered), source: "engagement" });
    }
  }

  // Fallback B: highest explore_score (when engagement hasn't been computed yet)
  const { data: popular } = await admin
    .from("salons")
    .select("id, name, slug, categories, quartier, average_rating, review_count, cover_photo_url, explore_score")
    .eq("is_active", true)
    .eq("listed_on_marketplace", true)
    .eq("is_test", false)
    .order("explore_score", { ascending: false })
    .limit(8);

  return NextResponse.json({ salons: await withCardData(popular ?? []), source: "popular" });
}
