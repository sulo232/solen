export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { withCronRun } from "@/lib/cron-run";

// RING 3a: caps a per-item errors[] array so a bad batch never floods cron_runs.
function capErrors(errs: string[], max = 20): string[] {
  if (errs.length <= max) return errs;
  return [...errs.slice(0, max), `...and ${errs.length - max} more`];
}

// GET /api/cron/release-deposits
// Daily cron: deposits held > 72h without booking confirmation → release back.
export async function GET(request: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("release-deposits", async () => {
  const admin = createAdminSupabaseClient();
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 72);
  const cutoffStr = cutoff.toISOString();

  // Find bookings with deposits held > 72h that are still pending
  const { data: staleDeposits, error: staleDepositsError } = await admin
    .from("bookings")
    .select("id, user_id, price_paid, salon_id, payment_intent_id")
    .eq("status", "pending")
    .lt("created_at", cutoffStr)
    .not("payment_intent_id", "is", null);

  if (staleDepositsError) console.error("[cron/release-deposits] stale deposits query error:", staleDepositsError.message);

  let released = 0;
  const errorMsgs: string[] = [];

  for (const booking of staleDeposits ?? []) {
    try {
      // Cancel the booking
      const { error: cancelErr } = await admin
        .from("bookings")
        .update({
          status: "cancelled",
          cancellation_reason: "Deposit auto-released after 72h without confirmation",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", booking.id);
      if (cancelErr) throw cancelErr;

      // Free the slot if any
      const { error: slotErr } = await admin
        .from("availability_slots")
        .update({ status: "available", booked_by: null, booking_id: null })
        .eq("booking_id", booking.id);
      if (slotErr) throw slotErr;

      // Log in audit_log
      const { error: auditErr } = await admin.from("audit_log").insert({
        actor_id: null,
        action: "deposit_auto_released",
        target_type: "booking",
        target_id: booking.id,
        metadata: {
          amount: booking.price_paid,
          reason: "72h timeout",
          payment_intent: booking.payment_intent_id,
        },
      });
      if (auditErr) throw auditErr;

      released++;
    } catch (err) {
      errorMsgs.push(`booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { ok: true, released, errors: capErrors(errorMsgs), processed: released };
  });
}
