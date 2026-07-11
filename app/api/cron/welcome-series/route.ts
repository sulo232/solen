export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { welcomeDay0, welcomeDay3, welcomeDay7 } from "@/lib/email-templates/welcome-series";
import type { EmailLocale } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { withCronRun } from "@/lib/cron-run";

// POST /api/cron/welcome-series
// Daily cron: sends welcome emails to users created 0, 3, or 7 days ago.
export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("welcome-series", async () => {
  const admin = createAdminSupabaseClient();
  const now = new Date();

  const results = { day0: 0, day3: 0, day7: 0, errors: 0 };

  for (const daysAgo of [0, 3, 7] as const) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const dateStr = targetDate.toISOString().split("T")[0];

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name, locale")
      .gte("created_at", `${dateStr}T00:00:00Z`)
      .lt("created_at", `${dateStr}T23:59:59Z`)
      .eq("role", "customer");

    if (!profiles?.length) continue;

    for (const profile of profiles) {
      // Check notification preferences
      const { data: prefs } = await admin
        .from("notification_preferences")
        .select("deals_enabled")
        .eq("user_id", profile.id)
        .single();

      if (prefs && prefs.deals_enabled === false) continue;

      const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
      const email = authUser?.user?.email;
      if (!email) continue;

      const locale: EmailLocale = (profile.locale as EmailLocale) ?? "de";
      const name = profile.display_name || "dort";

      // Idempotency guard: mirrors the notifications-table sent-log pattern used by
      // cron/rebooking-nudge (query before send, insert after send) so a re-run/overlapping
      // tick doesn't re-send this stage to the same profile.
      const notifType = `welcome_series_day${daysAgo}`;
      const { data: alreadySent } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", profile.id)
        .eq("type", notifType)
        .maybeSingle();
      if (alreadySent) continue;

      try {
        if (daysAgo === 0) {
          await sendEmail(welcomeDay0(email, { name }, locale));
          results.day0++;
        } else if (daysAgo === 3) {
          await sendEmail(welcomeDay3(email, { name }, locale));
          results.day3++;
        } else {
          await sendEmail(welcomeDay7(email, { name }, locale));
          results.day7++;
        }
        // Record the send so the guard above suppresses a repeat of this stage.
        await admin.from("notifications").insert({
          user_id: profile.id,
          type: notifType,
          title: "Welcome series email sent",
          body: `Welcome series day ${daysAgo} email sent`,
          data: {},
        });
      } catch {
        results.errors++;
      }
    }
  }

  return { ok: true, ...results, processed: results.day0 + results.day3 + results.day7 };
  });
}
