import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/admin/solen-score/recalculate
 * Recalculates Solen Score for all active salons.
 * Auth: CRON_SECRET header (Vercel cron) or admin user.
 */
export async function POST(req: NextRequest) {
  // Auth: cron secret or admin
  const cronSecret = req.headers.get("authorization")?.replace("Bearer ", "");
  const isCron = cronSecret === process.env.CRON_SECRET;

  if (!isCron) {
    // Check admin auth
    const { createServerSupabaseClient } = await import("@/lib/supabase");
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = createAdminSupabaseClient();
    const { data: profile } = await admin
      .from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const admin = createAdminSupabaseClient();

  // Fetch all active salons
  const { data: salons, error: salonsErr } = await admin
    .from("salons")
    .select("id, average_rating, review_count, image_url:cover_photo_url, description:description_de, phone, opening_hours, categories, owner_id")
    .eq("is_active", true);

  if (salonsErr || !salons) {
    return NextResponse.json({ error: "Failed to fetch salons", details: salonsErr?.message }, { status: 500 });
  }

  const CHUNK_SIZE = 20;
  let updated = 0;

  for (let i = 0; i < salons.length; i += CHUNK_SIZE) {
    const chunk = salons.slice(i, i + CHUNK_SIZE);

    const updates = await Promise.all(
      chunk.map(async (salon) => {
        // 1. Rating score (max 30)
        const ratingScore = Math.round((salon.average_rating || 0) / 5 * 30);

        // 2. Review score (max 15) — 20 reviews = full marks
        const reviewScore = Math.round(Math.min((salon.review_count || 0) / 20, 1) * 15);

        // 3. Response time score (max 15) — TODO: implement response time tracking
        const responseScore = 10;

        // 4. Profile completeness (max 15) — 5 fields
        const profileFields = [
          salon.image_url,
          salon.description,
          salon.phone,
          salon.opening_hours && Object.keys(salon.opening_hours).length > 0 ? salon.opening_hours : null,
          salon.categories && salon.categories.length > 0 ? salon.categories : null,
        ];
        const filledFields = profileFields.filter(Boolean).length;
        const profileScore = Math.round(filledFields / 5 * 15);

        // 5. Booking completion rate (max 15)
        const { count: totalBookings } = await admin
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("salon_id", salon.id);

        const { count: completedBookings } = await admin
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("salon_id", salon.id)
          .eq("status", "completed");

        const bookingScore = (totalBookings ?? 0) >= 5
          ? Math.round((completedBookings ?? 0) / (totalBookings ?? 1) * 15)
          : 0;

        // 6. Activity score (max 10) — based on owner's last sign-in
        const { data: ownerProfile } = await admin
          .from("profiles")
          .select("updated_at")
          .eq("id", salon.owner_id)
          .single();

        const daysSinceLogin = ownerProfile?.updated_at
          ? Math.floor((Date.now() - new Date(ownerProfile.updated_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        const activityScore = daysSinceLogin < 7 ? 10 : daysSinceLogin < 30 ? 5 : 0;

        const total = ratingScore + reviewScore + responseScore + profileScore + bookingScore + activityScore;
        const tier = total >= 80 ? "gold" : total >= 60 ? "teal" : total >= 40 ? "grey" : "dark";

        const scoreDetails = {
          rating: ratingScore,
          reviews: reviewScore,
          response: responseScore,
          profile: profileScore,
          bookings: bookingScore,
          activity: activityScore,
        };

        return {
          id: salon.id,
          solen_score: total,
          solen_tier: tier,
          score_details: scoreDetails,
        };
      })
    );

    // Batch update
    for (const u of updates) {
      await admin
        .from("salons")
        .update({
          solen_score: u.solen_score,
          solen_tier: u.solen_tier,
          score_details: u.score_details,
        })
        .eq("id", u.id);
      updated++;
    }
  }

  return NextResponse.json({ success: true, updated });
}
