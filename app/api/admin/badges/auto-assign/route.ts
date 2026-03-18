import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

// POST /api/admin/badges/auto-assign — Auto-assign system badges based on auto_rules
// Can be called by cron or admin manually
export async function POST(req: NextRequest) {
  // Verify cron secret or admin auth
  const cronSecret = req.headers.get("x-cron-secret");
  const isValidCron = cronSecret === process.env.CRON_SECRET;

  if (!isValidCron) {
    // Fall back to admin auth check
    const { createServerSupabaseClient } = await import("@/lib/supabase");
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  let assigned = 0;

  // Get all system badges with auto_rules
  const { data: systemBadges } = await admin
    .from("salon_badges")
    .select("*")
    .eq("is_system", true)
    .not("auto_rule", "is", null);

  if (!systemBadges) return NextResponse.json({ assigned: 0 });

  for (const badge of systemBadges) {
    const rule = badge.auto_rule as { type: string; min_rating?: number; min_reviews?: number };

    if (rule.type === "rating_and_reviews") {
      // Find salons with avg rating >= min_rating AND review_count >= min_reviews
      const { data: qualifyingSalons } = await admin
        .from("salons")
        .select("id")
        .eq("is_active", true)
        .gte("average_rating", rule.min_rating ?? 4.5)
        .gte("review_count", rule.min_reviews ?? 10);

      if (qualifyingSalons) {
        for (const salon of qualifyingSalons) {
          // Upsert — skip if already assigned or override-removed
          const { data: existing } = await admin
            .from("salon_badge_assignments")
            .select("salon_id")
            .eq("salon_id", salon.id)
            .eq("badge_id", badge.id)
            .single();

          if (!existing) {
            await admin
              .from("salon_badge_assignments")
              .insert({ salon_id: salon.id, badge_id: badge.id });
            assigned++;
          }
        }
      }
    }
  }

  return NextResponse.json({ assigned, message: `Auto-assigned ${assigned} badge(s)` });
}
