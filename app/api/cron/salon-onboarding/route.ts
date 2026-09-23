export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import {
  onboardingCompleteProfile,
  onboardingAddServices,
  onboardingAddPhoto,
  onboardingReady,
} from "@/lib/email-templates/salon-onboarding";
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

// GET /api/cron/salon-onboarding
// Daily cron: adaptive 5-email drip for new salon owners.
export async function GET(request: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = request.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("salon-onboarding", async () => {
  const admin = createAdminSupabaseClient();
  const now = new Date();
  let sent = 0;
  let skipped = 0;
  const errorMsgs: string[] = [];

  type Task = { ownerId: string; salonId: string; notifType: string; payload: EmailPayload };
  const tasks: Task[] = [];

  // Process each day offset: 2, 4, 6, 8. The day-0 welcome is sent by POST /api/salons at
  // creation (owner locale, notification_email gate), so the cron no longer repeats it.
  for (const daysAgo of [2, 4, 6, 8]) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - daysAgo);
    const dateStr = targetDate.toISOString().split("T")[0];

    // Find salons created on that day (already a single query, unchanged).
    const { data: salons } = await admin
      .from("salons")
      .select("id, owner_id, name, cover_photo_url, description_de")
      .gte("created_at", `${dateStr}T00:00:00Z`)
      .lt("created_at", `${dateStr}T23:59:59Z`);

    if (!salons?.length) continue;

    const ownerIds = Array.from(new Set(salons.map((s) => s.owner_id)));
    const salonIds = salons.map((s) => s.id);
    const notifType = `salon_onboarding_day${daysAgo}`;

    // RING 3a: batch the per-salon reads (owner email+locale, sent-once guard,
    // and, day 4/8 only, the active-services count) into ONE IN-list query
    // each for the whole day-group instead of one query per salon.
    const [{ data: profiles }, { data: alreadySentRows }] = await Promise.all([
      admin.from("profiles").select("id, email, locale, notification_email").in("id", ownerIds),
      admin.from("notifications").select("user_id, data").eq("type", notifType).in("user_id", ownerIds),
    ]);

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const alreadySent = new Set(
      (alreadySentRows ?? []).map((r) => `${r.user_id}:${(r.data as { salon_id?: string } | null)?.salon_id}`)
    );

    let serviceCountBySalon: Map<string, number> | null = null;
    if (daysAgo === 4 || daysAgo === 8) {
      const { data: activeServices } = await admin
        .from("services")
        .select("salon_id")
        .in("salon_id", salonIds)
        .eq("is_active", true);
      serviceCountBySalon = new Map();
      for (const row of activeServices ?? []) {
        serviceCountBySalon.set(row.salon_id, (serviceCountBySalon.get(row.salon_id) ?? 0) + 1);
      }
    }

    for (const salon of salons) {
      const profile = profileById.get(salon.owner_id);
      const email = profile?.email;
      if (!email) { skipped++; continue; }
      // Owner opted out of email notifications (profiles.notification_email, same gate as the welcome).
      if (profile?.notification_email === false) { skipped++; continue; }

      // Idempotency guard: mirrors the notifications-table sent-log pattern (query
      // before send, insert after send) so a re-run/overlapping tick doesn't
      // re-send this drip stage to the same salon owner.
      if (alreadySent.has(`${salon.owner_id}:${salon.id}`)) { skipped++; continue; }

      const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
      let payload: EmailPayload | null = null;

      if (daysAgo === 2) {
        // Day 2: Complete profile (only if profile < 80%, check description)
        if (!salon.description_de) payload = onboardingCompleteProfile(email, { salonName: salon.name }, locale);
        else skipped++;
      } else if (daysAgo === 4) {
        // Day 4: Add services (only if 0 services)
        const count = serviceCountBySalon?.get(salon.id) ?? 0;
        if (count === 0) payload = onboardingAddServices(email, { salonName: salon.name }, locale);
        else skipped++;
      } else if (daysAgo === 6) {
        // Day 6: Add cover photo (only if no cover photo)
        if (!salon.cover_photo_url) payload = onboardingAddPhoto(email, { salonName: salon.name }, locale);
        else skipped++;
      } else if (daysAgo === 8) {
        // Day 8: Ready! (only if profile is complete)
        const hasDescription = !!salon.description_de;
        const hasCover = !!salon.cover_photo_url;
        const count = serviceCountBySalon?.get(salon.id) ?? 0;
        if (hasDescription && hasCover && count > 0) payload = onboardingReady(email, { salonName: salon.name }, locale);
        else skipped++;
      }

      if (payload) tasks.push({ ownerId: salon.owner_id, salonId: salon.id, notifType, payload });
    }
  }

  // Concurrency-capped sends (cap 5): one recipient's failure never blocks the rest,
  // never one unbounded Promise.all over emails, never fully serial.
  const sendResults = await runWithConcurrency(tasks, 5, async (task) => {
    await sendEmail(task.payload);
    return task;
  });

  const notifRows: { user_id: string; type: string; title: string; body: string; data: { salon_id: string } }[] = [];
  sendResults.forEach((res, i) => {
    const task = tasks[i];
    if (res.status === "fulfilled") {
      sent++;
      notifRows.push({
        user_id: task.ownerId,
        type: task.notifType,
        title: "Salon onboarding drip sent",
        body: `Onboarding email sent (${task.notifType})`,
        data: { salon_id: task.salonId },
      });
    } else {
      const msg = res.reason instanceof Error ? res.reason.message : String(res.reason);
      errorMsgs.push(`salon-onboarding ${task.notifType} owner ${task.ownerId}: ${msg}`);
      console.error(`[cron/salon-onboarding] send failed for owner ${task.ownerId} (${task.notifType}):`, res.reason);
    }
  });

  // Record all successful sends so the guard above suppresses a repeat of this stage.
  if (notifRows.length > 0) {
    const { error: insErr } = await admin.from("notifications").insert(notifRows);
    if (insErr) console.error("[cron/salon-onboarding] notifications insert failed:", insErr.message);
  }

  return { sent, skipped, errors: capErrors(errorMsgs), processed: sent };
  });
}
