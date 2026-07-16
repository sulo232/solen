import { createAdminSupabaseClient } from "@/lib/supabase";

/**
 * Salon of the Month: shared server-query.
 *
 * Single source of truth for "what is the current salon-of-the-month, and
 * should anything show it right now". Used by BOTH the public reader route
 * (app/api/salon-of-month/route.ts) and the homepage section
 * (app/[locale]/_components/homepage/SalonOfMonth.tsx) so the two never
 * drift on the gating logic.
 *
 * Gated on the `salon_of_month` feature_flags row (seeded OFF by
 * 20260713140000_salon_of_month.sql, admin-toggled via the existing generic
 * /api/admin/feature-flags PATCH route, same table + route every other
 * kill-switch flag uses). lib/feature-flags.ts's checkFeatureEnabled() is
 * not reused directly here because that helper is built for gating a
 * mutation route with a 503 NextResponse; this is a plain read used by a
 * server component too, so it returns a value or null instead.
 */

export interface SalonOfMonthWinner {
  month: string;
  reason: string | null;
  salon: {
    id: string;
    slug: string;
    name: string;
    coverPhotoUrl: string | null;
    categories: string[];
    averageRating: number | null;
    reviewCount: number | null;
    quartier: string | null;
  };
}

/**
 * Returns the current salon-of-the-month, or null when the toggle is off,
 * no winner has ever been picked, or the picked salon is no longer active
 * (deactivated/deleted after being picked, never surface a stale/broken
 * link on a public marketing surface).
 */
export async function getCurrentSalonOfMonth(): Promise<SalonOfMonthWinner | null> {
  const admin = createAdminSupabaseClient();

  const { data: flag, error: flagError } = await admin
    .from("feature_flags")
    .select("enabled")
    .eq("key", "salon_of_month")
    .single();

  // Fail closed here (unlike checkFeatureEnabled's fail-open default): a
  // missing row or query error means we don't know the admin's intent, and
  // this is purely editorial content, not a feature customers depend on,
  // so it's safer to render nothing than to guess.
  if (flagError || !flag?.enabled) return null;

  const { data: winnerRow, error: winnerError } = await admin
    .from("salon_of_month_winners")
    .select("month, reason, salon_id")
    .eq("is_current", true)
    .order("selected_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (winnerError) {
    console.error("[getCurrentSalonOfMonth] failed to load current winner:", winnerError);
    return null;
  }
  if (!winnerRow) return null;

  const { data: salon, error: salonError } = await admin
    .from("salons")
    .select("id, slug, name, cover_photo_url, categories, average_rating, review_count, quartier, is_active")
    .eq("id", winnerRow.salon_id)
    .eq("is_active", true)
    .maybeSingle();

  if (salonError) {
    console.error("[getCurrentSalonOfMonth] failed to load winner's salon:", salonError);
    return null;
  }
  // Salon was deactivated/deleted after being picked, don't surface it.
  if (!salon) return null;

  return {
    month: winnerRow.month,
    reason: winnerRow.reason,
    salon: {
      id: salon.id,
      slug: salon.slug,
      name: salon.name,
      coverPhotoUrl: salon.cover_photo_url,
      categories: salon.categories ?? [],
      averageRating: salon.average_rating,
      reviewCount: salon.review_count,
      quartier: salon.quartier,
    },
  };
}
