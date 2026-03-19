export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import {
  onboardingWelcome,
  onboardingCompleteProfile,
  onboardingAddServices,
  onboardingAddPhoto,
  onboardingReady,
} from "@/lib/email-templates/salon-onboarding";
import type { EmailLocale } from "@/lib/email";

// GET /api/cron/salon-onboarding
// Daily cron: adaptive 5-email drip for new salon owners.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const now = new Date();
  const results = { sent: 0, skipped: 0, errors: 0 };

  // Process each day offset: 0, 2, 4, 6, 8
  for (const daysAgo of [0, 2, 4, 6, 8]) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const dateStr = targetDate.toISOString().split("T")[0];

    // Find salons created on that day
    const { data: salons } = await admin
      .from("salons")
      .select("id, owner_id, name, cover_photo_url, description_de")
      .gte("created_at", `${dateStr}T00:00:00Z`)
      .lt("created_at", `${dateStr}T23:59:59Z`);

    if (!salons?.length) continue;

    for (const salon of salons) {
      const { data: authUser } = await admin.auth.admin.getUserById(salon.owner_id);
      const email = authUser?.user?.email;
      if (!email) { results.skipped++; continue; }

      const { data: profile } = await admin
        .from("profiles")
        .select("locale")
        .eq("id", salon.owner_id)
        .single();

      const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";

      try {
        if (daysAgo === 0) {
          // Day 0: Welcome
          await sendEmail(onboardingWelcome(email, { salonName: salon.name }, locale));
          results.sent++;
        } else if (daysAgo === 2) {
          // Day 2: Complete profile (only if profile < 80% — check description)
          const hasDescription = !!salon.description_de;
          if (!hasDescription) {
            await sendEmail(onboardingCompleteProfile(email, { salonName: salon.name }, locale));
            results.sent++;
          } else { results.skipped++; }
        } else if (daysAgo === 4) {
          // Day 4: Add services (only if 0 services)
          const { count } = await admin
            .from("services")
            .select("id", { count: "exact", head: true })
            .eq("salon_id", salon.id)
            .eq("is_active", true);
          if (!count || count === 0) {
            await sendEmail(onboardingAddServices(email, { salonName: salon.name }, locale));
            results.sent++;
          } else { results.skipped++; }
        } else if (daysAgo === 6) {
          // Day 6: Add cover photo (only if no cover photo)
          if (!salon.cover_photo_url) {
            await sendEmail(onboardingAddPhoto(email, { salonName: salon.name }, locale));
            results.sent++;
          } else { results.skipped++; }
        } else if (daysAgo === 8) {
          // Day 8: Ready! (only if profile is complete)
          const hasDescription = !!salon.description_de;
          const hasCover = !!salon.cover_photo_url;
          const { count } = await admin
            .from("services")
            .select("id", { count: "exact", head: true })
            .eq("salon_id", salon.id)
            .eq("is_active", true);
          if (hasDescription && hasCover && (count ?? 0) > 0) {
            await sendEmail(onboardingReady(email, { salonName: salon.name }, locale));
            results.sent++;
          } else { results.skipped++; }
        }
      } catch {
        results.errors++;
      }
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
