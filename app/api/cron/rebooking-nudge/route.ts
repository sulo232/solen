export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, rebookingNudge } from "@/lib/email";
import type { EmailLocale, EmailPayload } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";
import { runWithConcurrency } from "@/lib/concurrency";
import { localizedField } from "@/lib/i18n/localized-field";

// RING 3a: caps a per-item errors[] array so a bad batch never floods cron_runs.
function capErrors(errs: string[], max = 20): string[] {
  if (errs.length <= max) return errs;
  return [...errs.slice(0, max), `...and ${errs.length - max} more`];
}

// GET /api/cron/rebooking-nudge
// Daily cron: users whose last booking was 28+ days ago get a nudge email.
export async function GET(request: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = request.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("rebooking-nudge", async () => {
  const admin = createAdminSupabaseClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);
  const cutoffStr = cutoff.toISOString();

  // Find users whose most recent completed booking ended 28+ days ago
  // and who haven't received a nudge in the last 28 days.
  // Phantom-RPC fix (typed-DB sprint): "get_rebooking_candidates" does not exist in the
  // live schema (confirmed against lib/database.types.ts's Functions list), so the RPC
  // branch this used to try always errored server-side and fell through to this manual
  // query every single run. Going straight to the manual query is the same runtime
  // behavior this route already had on every invocation, just without the dead RPC hop.
  const { data } = await admin
    .from("bookings")
    .select("user_id, salon_id, starts_at, services(name_de, name_en, name_fr, name_it), salons(name)")
    .eq("status", "completed")
    .lt("starts_at", cutoffStr)
    .order("starts_at", { ascending: false });

  // Deduplicate by user_id (keep most recent booking per user)
  const seen = new Set<string>();
  const users = (data ?? []).filter((b: any) => {
    if (seen.has(b.user_id)) return false;
    seen.add(b.user_id);
    return true;
  });

  const candidateList = users ?? [];
  const userIds = Array.from(new Set(candidateList.map((b: any) => b.user_id)));

  // RING 3a: batch the 3 previously per-candidate reads (preference check,
  // sent-once guard, email+locale lookup) into ONE IN-list query each,
  // instead of one query per candidate.
  const [{ data: prefRows }, { data: nudgedRows }, { data: profileRows }] = await Promise.all([
    admin.from("notification_preferences").select("user_id, deals_enabled, rebooking_enabled").in("user_id", userIds),
    admin.from("notifications").select("user_id").eq("type", "rebooking_nudge").gte("created_at", cutoffStr).in("user_id", userIds),
    admin.from("profiles").select("id, email, locale").in("id", userIds),
  ]);

  const prefsByUser = new Map(
    (prefRows ?? []).map((p) => [p.user_id, { deals: p.deals_enabled, rebooking: p.rebooking_enabled }])
  );
  const alreadyNudgedUsers = new Set((nudgedRows ?? []).map((r) => r.user_id));
  const profileByUser = new Map((profileRows ?? []).map((p) => [p.id, p]));

  type Task = { userId: string; salonId: string | null; daysSince: number; payload: EmailPayload };
  const tasks: Task[] = [];

  for (const booking of candidateList) {
    const userId = (booking as any).user_id;
    // seo-comms-11 (defect-2 fix, 2026-09-04): this nudge isn't tied to a booking the
    // user just made, so it's marketing, same class as welcome-series day3/day7, and the
    // customer has exactly one visible switch for that: notification_preferences.deals_enabled.
    // rebooking_enabled stays as a second, OFF-only gate (no screen sets it to true today,
    // so it can only suppress a send, never cause one that deals_enabled alone wouldn't).
    const prefs = prefsByUser.get(userId);
    if (prefs?.deals !== true || prefs?.rebooking === false) continue;
    if (alreadyNudgedUsers.has(userId)) continue;

    const profile = profileByUser.get(userId);
    const email = profile?.email;
    if (!email) continue;

    const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
    const daysSince = Math.floor(
      (Date.now() - new Date((booking as any).starts_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    tasks.push({
      userId,
      salonId: (booking as any).salon_id ?? null,
      daysSince,
      payload: rebookingNudge(
        email,
        {
          service: localizedField((booking as any).services, "name", locale) || "Service",
          salon: (booking as any).salons?.name ?? "Salon",
          daysSince,
        },
        locale
      ),
    });
  }

  // Concurrency-capped sends (cap 5): one recipient's failure never blocks the rest,
  // never one unbounded Promise.all over emails, never fully serial.
  const sendResults = await runWithConcurrency(tasks, 5, async (task) => {
    await sendEmail(task.payload);
    return task;
  });

  let sent = 0;
  const errorMsgs: string[] = [];
  const notifRows: { user_id: string; type: string; title: string; body: string; data: { salon_id: string | null; days_since: number } }[] = [];

  sendResults.forEach((res, i) => {
    const task = tasks[i];
    if (res.status === "fulfilled") {
      sent++;
      notifRows.push({
        user_id: task.userId,
        type: "rebooking_nudge",
        title: "Rebooking nudge sent",
        body: `Nudge email sent, ${task.daysSince} days since last visit`,
        data: { salon_id: task.salonId, days_since: task.daysSince },
      });
    } else {
      const msg = res.reason instanceof Error ? res.reason.message : String(res.reason);
      errorMsgs.push(`user ${task.userId}: ${msg}`);
      console.error(`[cron/rebooking-nudge] send failed for user ${task.userId}:`, res.reason);
    }
  });

  // Record the sends so the guard above can suppress a repeat within the cutoff window.
  if (notifRows.length > 0) {
    const { error: insErr } = await admin.from("notifications").insert(notifRows);
    if (insErr) console.error("[cron/rebooking-nudge] notifications insert failed:", insErr.message);
  }

  return { sent, errors: capErrors(errorMsgs), processed: sent };
  });
}
