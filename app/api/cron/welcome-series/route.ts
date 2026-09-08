export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { welcomeDay0, welcomeDay3, welcomeDay7 } from "@/lib/email-templates/welcome-series";
import type { EmailLocale, EmailPayload } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";
import { runWithConcurrency } from "@/lib/concurrency";

// RING 3a: caps a per-item errors[] array so a bad batch never floods cron_runs.
function capErrors(errs: string[], max = 20): string[] {
  if (errs.length <= max) return errs;
  return [...errs.slice(0, max), `...and ${errs.length - max} more`];
}

function dayKey(daysAgo: 0 | 3 | 7): "day0" | "day3" | "day7" {
  return daysAgo === 0 ? "day0" : daysAgo === 3 ? "day3" : "day7";
}

// POST /api/cron/welcome-series
// Daily cron: sends welcome emails to users created 0, 3, or 7 days ago.
export async function GET(request: NextRequest) {
  // Verify cron secret
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = request.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("welcome-series", async () => {
  const admin = createAdminSupabaseClient();
  const now = new Date();

  const results = { day0: 0, day3: 0, day7: 0 };
  const errorMsgs: string[] = [];

  type Task = { profileId: string; daysAgo: 0 | 3 | 7; notifType: string; payload: EmailPayload };
  const tasks: Task[] = [];

  for (const daysAgo of [0, 3, 7] as const) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const dateStr = targetDate.toISOString().split("T")[0];

    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name, locale, email, banned_at, is_suspended")
      .gte("created_at", `${dateStr}T00:00:00Z`)
      .lt("created_at", `${dateStr}T23:59:59Z`)
      .eq("role", "customer");

    if (!profiles?.length) continue;

    const profileIds = profiles.map((p) => p.id);
    const notifType = `welcome_series_day${daysAgo}`;

    // RING 3a: batch the per-profile preference check + sent-once guard into
    // ONE IN-list query each per day-group, instead of one query per profile.
    const [{ data: prefRows }, { data: alreadySentRows }] = await Promise.all([
      admin.from("notification_preferences").select("user_id, deals_enabled").in("user_id", profileIds),
      admin.from("notifications").select("user_id").eq("type", notifType).in("user_id", profileIds),
    ]);
    const prefsByUser = new Map((prefRows ?? []).map((p) => [p.user_id, p.deals_enabled]));
    const alreadySent = new Set((alreadySentRows ?? []).map((r) => r.user_id));

    for (const profile of profiles) {
      if (profile.banned_at || profile.is_suspended) continue;
      // seo-comms-11 (defect-1 fix, 2026-09-04): day 3 and day 7 are promotional nudges
      // (discover salons / book your first appointment), so they require an explicit
      // OPT-IN on notification_preferences.deals_enabled, mirrored from the same
      // opt-in pattern app/api/off-peak/route.ts already uses (`.eq("deals_enabled", true)`).
      // This was previously an opt-out check (`=== false`), which sent promo email to
      // every profile since nothing in the codebase ever writes that column to false. Day 0
      // is the transactional welcome email tied directly to account creation (same class as
      // a booking confirmation) and is sent unconditionally, same as before.
      if (daysAgo !== 0 && prefsByUser.get(profile.id) !== true) continue;

      const email = profile.email;
      if (!email) continue;

      // Idempotency guard: mirrors the notifications-table sent-log pattern used by
      // cron/rebooking-nudge (query before send, insert after send) so a re-run/overlapping
      // tick doesn't re-send this stage to the same profile.
      if (alreadySent.has(profile.id)) continue;

      const locale: EmailLocale = (profile.locale as EmailLocale) ?? "de";
      const name = profile.display_name || "dort";
      const payload =
        daysAgo === 0
          ? welcomeDay0(email, { name }, locale)
          : daysAgo === 3
            ? welcomeDay3(email, { name }, locale)
            : welcomeDay7(email, { name }, locale);

      tasks.push({ profileId: profile.id, daysAgo, notifType, payload });
    }
  }

  // Concurrency-capped sends (cap 5): one recipient's failure never blocks the rest,
  // never one unbounded Promise.all over emails, never fully serial.
  const sendResults = await runWithConcurrency(tasks, 5, async (task) => {
    await sendEmail(task.payload);
    return task;
  });

  const notifRows: { user_id: string; type: string; title: string; body: string; data: Record<string, never> }[] = [];
  sendResults.forEach((res, i) => {
    const task = tasks[i];
    if (res.status === "fulfilled") {
      results[dayKey(task.daysAgo)]++;
      notifRows.push({
        user_id: task.profileId,
        type: task.notifType,
        title: "Welcome series email sent",
        body: `Welcome series day ${task.daysAgo} email sent`,
        data: {},
      });
    } else {
      const msg = res.reason instanceof Error ? res.reason.message : String(res.reason);
      errorMsgs.push(`profile ${task.profileId} (${task.notifType}): ${msg}`);
      console.error(`[cron/welcome-series] send failed for profile ${task.profileId} (${task.notifType}):`, res.reason);
    }
  });

  // Record the sends so the guard above suppresses a repeat of this stage.
  if (notifRows.length > 0) {
    const { error: insErr } = await admin.from("notifications").insert(notifRows);
    if (insErr) console.error("[cron/welcome-series] notifications insert failed:", insErr.message);
  }

  return { ...results, errors: capErrors(errorMsgs), processed: results.day0 + results.day3 + results.day7 };
  });
}
