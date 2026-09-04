export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, platformBirthdayEmail, type EmailLocale } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";
import { runWithConcurrency } from "@/lib/concurrency";

// RING 3a: caps a per-item errors[] array so a bad batch never floods cron_runs.
function capErrors(errs: string[], max = 20): string[] {
  if (errs.length <= max) return errs;
  return [...errs.slice(0, max), `...and ${errs.length - max} more`];
}

// Cron: Send birthday messages. Daily 8am CET.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("birthday-messages", async () => {
  const admin = createAdminSupabaseClient();

  // Get today's date in Swiss timezone
  const swissNow = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Zurich" });
  const [year, month, day] = swissNow.split("-").map(Number);
  const yearStart = `${year}-01-01T00:00:00Z`;

  // Find profiles with birthday today
  // date_of_birth column is DATE type, extract month and day
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, date_of_birth, staff_salon_id, email, locale")
    .not("date_of_birth", "is", null);

  const birthdayProfiles = (profiles ?? []).filter((p) => {
    if (!p.date_of_birth) return false;
    const bday = new Date(p.date_of_birth);
    return bday.getMonth() + 1 === month && bday.getDate() === day;
  });

  const errorMsgs: string[] = [];

  if (birthdayProfiles.length === 0) {
    return { sent: 0, total_birthdays: 0, errors: capErrors(errorMsgs), processed: 0 };
  }

  // RING 3a: batch the per-profile sent-once guard into ONE IN-list query,
  // instead of one query per birthday profile. Email now comes straight from
  // the profiles select above instead of a per-row auth.admin.getUserById call.
  const profileIds = birthdayProfiles.map((p) => p.id);
  // seo-comms-06 (2026-07-27, corrected 2026-09-04): a birthday message is MARKETING
  // (a celebratory, not-booking-triggered send), not TRANSACTIONAL, so it requires an
  // explicit OPT-IN on notification_preferences.deals_enabled, same as welcome-series'
  // day 3 / day 7 stages. This was previously an opt-out check (`!== false`), which sent
  // to every profile since nothing in the codebase ever writes that column to false.
  // Batched into the same IN-list query shape those crons use.
  const [{ data: alreadySentRows }, { data: prefRows }] = await Promise.all([
    admin.from("notifications").select("user_id").eq("type", "birthday_message").gte("created_at", yearStart).in("user_id", profileIds),
    admin.from("notification_preferences").select("user_id, deals_enabled").in("user_id", profileIds),
  ]);
  const alreadySent = new Set((alreadySentRows ?? []).map((r) => r.user_id));
  const prefsByUser = new Map((prefRows ?? []).map((p) => [p.user_id, p.deals_enabled]));

  const tasks = birthdayProfiles.filter((p) =>
    !!p.email && !alreadySent.has(p.id) && prefsByUser.get(p.id) === true
  );

  // Concurrency-capped sends (cap 5): one recipient's failure never blocks the rest,
  // never one unbounded Promise.all over emails, never fully serial.
  const sendResults = await runWithConcurrency(tasks, 5, async (profile) => {
    // A9-email-locale (2026-07-27): each recipient's own profile.locale, was hardcoded German.
    const profileLocale = (profile.locale as EmailLocale) ?? "de";
    await sendEmail(platformBirthdayEmail(
      profile.email as string,
      { customerName: profile.display_name ?? "" },
      profileLocale
    ));
    return profile;
  });

  let sent = 0;
  const notifRows: { user_id: string; type: string; title: string; body: string; data: { year: number } }[] = [];
  sendResults.forEach((res, i) => {
    const profile = tasks[i];
    if (res.status === "fulfilled") {
      sent++;
      // Record the send so the guard above suppresses a repeat within this calendar year.
      notifRows.push({
        user_id: profile.id,
        type: "birthday_message",
        title: "Birthday message sent",
        body: `Birthday email sent for ${swissNow}`,
        data: { year },
      });
    } else {
      const msg = res.reason instanceof Error ? res.reason.message : String(res.reason);
      errorMsgs.push(`profile ${profile.id}: ${msg}`);
      console.error(`[cron/birthday-messages] send failed for profile ${profile.id}:`, res.reason);
    }
  });

  if (notifRows.length > 0) {
    const { error: insErr } = await admin.from("notifications").insert(notifRows);
    if (insErr) console.error("[cron/birthday-messages] notifications insert failed:", insErr.message);
  }

  return { sent, total_birthdays: birthdayProfiles.length, errors: capErrors(errorMsgs), processed: sent };
  });
}
