export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { calculateVisitCycle } from "@/lib/barber/visit-cycle-algorithm";
import { sendSMS } from "@/lib/sms";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";
import { checkFeatureEnabled } from "@/lib/feature-flags";

// Cron: Daily smart visit-cycle reminders for barbershop clients
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("barber-smart-reminders", async () => {
  const flagDisabled = await checkFeatureEnabled("barber_features");
  if (flagDisabled) {
    console.log("[barber-smart-reminders] Skipped: barber_features feature flag is off");
    return { ok: true, skipped: true, processed: 0 };
  }

  const admin = createAdminSupabaseClient();
  let remindersCreated = 0;
  let smsSent = 0;

  // Get all active barbershops
  const { data: salons } = await admin
    .from("salons")
    .select("id, name")
    .eq("is_active", true)
    .contains("categories", ["barbershop"]);

  for (const salon of salons ?? []) {
    // Get unique customers with 3+ cuts
    const { data: customers } = await admin
      .from("barber_cut_history")
      .select("customer_id")
      .eq("salon_id", salon.id)
      .not("customer_id", "is", null);

    // Deduplicate customer IDs
    const uniqueCustomerIds = [...new Set((customers ?? []).map((c) => c.customer_id))].filter(
      (id): id is string => !!id
    );
    if (uniqueCustomerIds.length === 0) continue;

    // RING 3a: batch the 3 previously per-customer reads (cut history, future
    // bookings, existing reminder note) into ONE IN-list query each per salon,
    // instead of one query per customer. Phone lookup has no bulk Admin-API
    // equivalent (auth.users, not profiles), so it stays per-customer below,
    // unchanged, and only runs for customers who already passed every
    // eligibility check (same order as before batching).
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [{ data: allCuts }, { data: futureBookingRows }, { data: existingNotes }, { data: profileRows }] =
      await Promise.all([
        admin
          .from("barber_cut_history")
          .select("customer_id, created_at")
          .eq("salon_id", salon.id)
          .in("customer_id", uniqueCustomerIds)
          .order("created_at", { ascending: false }),
        admin
          .from("bookings")
          .select("user_id")
          .eq("salon_id", salon.id)
          .in("user_id", uniqueCustomerIds)
          .in("status", ["confirmed", "pending"])
          .gt("starts_at", new Date().toISOString()),
        admin
          .from("client_notes")
          .select("customer_id, note")
          .eq("salon_id", salon.id)
          .in("customer_id", uniqueCustomerIds)
          .eq("note_type", "system")
          .gte("created_at", sevenDaysAgo),
        admin.from("profiles").select("id, display_name, notification_sms").in("id", uniqueCustomerIds),
      ]);

    const cutsByCustomer = new Map<string, Date[]>();
    for (const row of allCuts ?? []) {
      if (!row.customer_id || !row.created_at) continue;
      const list = cutsByCustomer.get(row.customer_id) ?? [];
      if (list.length < 20) list.push(new Date(row.created_at)); // rows already sorted desc, mirrors the old .limit(20)
      cutsByCustomer.set(row.customer_id, list);
    }
    const futureBookingCounts = new Map<string, number>();
    for (const row of futureBookingRows ?? []) {
      if (!row.user_id) continue;
      futureBookingCounts.set(row.user_id, (futureBookingCounts.get(row.user_id) ?? 0) + 1);
    }
    const hasExistingReminder = new Set(
      (existingNotes ?? []).filter((n) => (n.note ?? "").includes("cut_reminder")).map((n) => n.customer_id)
    );
    const profileByCustomer = new Map((profileRows ?? []).map((p) => [p.id, p]));

    const noteRows: { salon_id: string; customer_id: string; note: string; note_type: string; created_by: string }[] = [];

    for (const customerId of uniqueCustomerIds) {
      // Get visit dates (most recent first)
      const cuts = cutsByCustomer.get(customerId);
      if (!cuts || cuts.length < 3) continue;

      const cycle = calculateVisitCycle(cuts);

      if (cycle.confidence === "insufficient") continue;
      // Remind 2 days before due or when overdue
      if (cycle.daysOverdue < -2) continue;

      // Skip if client already has a future booking at this salon
      if ((futureBookingCounts.get(customerId) ?? 0) > 0) continue;

      // Skip if reminder already exists for this cycle
      if (hasExistingReminder.has(customerId)) continue;

      // Get customer name
      const profile = profileByCustomer.get(customerId);

      // Queue reminder note
      const noteData = {
        type: "cut_reminder",
        avgCycleDays: cycle.avgCycleDays,
        daysOverdue: cycle.daysOverdue,
        confidence: cycle.confidence,
        customerName: profile?.display_name ?? "Kunde",
        customerId,
        salonName: salon.name,
      };
      noteRows.push({
        salon_id: salon.id,
        customer_id: customerId,
        note: JSON.stringify(noteData),
        note_type: "system",
        created_by: "system",
      });
      remindersCreated++;

      // Send SMS if customer has a phone number AND has not turned off SMS
      // notifications (ethics-psychology-02: a consent toggle that renders
      // and saves but is never read by the send path is a false consent
      // claim, not a cosmetic bug).
      if (profile?.notification_sms === false) continue;
      const { data: authUser } = await admin.auth.admin.getUserById(customerId);
      const phone = authUser?.user?.phone;
      if (phone) {
        const weeks = cycle.avgCycleDays ? Math.round(cycle.avgCycleDays / 7) : 3;
        const ok = await sendSMS(
          phone,
          `Hey ${profile?.display_name ?? ""}, Ihr letzter Besuch bei ${salon.name} war vor ${weeks} Wochen. Buchen Sie Ihren nächsten Termin: https://www.solen.ch/de/barbershop`
        );
        if (ok) smsSent++;
      }
    }

    // Batch the reminder-note inserts for this salon into one call.
    if (noteRows.length > 0) {
      const { error: noteInsertErr } = await admin.from("client_notes").insert(noteRows);
      if (noteInsertErr) console.error("[cron/barber-smart-reminders] client_notes batch insert failed:", noteInsertErr.message);
    }
  }

  return { remindersCreated, smsSent, processed: remindersCreated };
  });
}
