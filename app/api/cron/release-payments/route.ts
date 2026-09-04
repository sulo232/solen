export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";

// Cron: Release (capture) payments 24h after booking completion. Every 6 hours
// (.github/workflows/cron-jobs.yml, the "0 */6 * * *" job shared with release-deposits).
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("release-payments", async () => {
  const admin = createAdminSupabaseClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Find completed bookings with uncaptured payments
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, payment_intent_id, paid_amount, salon_id")
    .eq("status", "completed")
    .eq("payment_status", "deposit_held")
    .not("payment_intent_id", "is", null)
    .lt("completed_at", twentyFourHoursAgo)
    .neq("paid_via", "walk_in")
    .limit(50);

  let released = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const booking of bookings ?? []) {
    // The query above already filters .not("payment_intent_id", "is", null), so this is
    // always present here; this narrows the type to match.
    if (!booking.payment_intent_id) continue;
    try {
      await getStripe().paymentIntents.capture(booking.payment_intent_id);

      const { data: claimRow, error: updateErr } = await admin
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", booking.id)
        .eq("payment_status", "deposit_held") // CAS guard: only release a booking still awaiting capture.
        .select("id")
        .maybeSingle();
      if (updateErr) throw new Error(updateErr.message);
      if (!claimRow) throw new Error("payment_status changed before release (concurrent update)");

      // Audit log
      const { error: auditErr } = await admin.from("audit_log").insert({
        action: "payment_released",
        target_type: "booking",
        target_id: booking.id,
        metadata: { amount: booking.paid_amount, payment_intent_id: booking.payment_intent_id },
      });
      if (auditErr) throw new Error(auditErr.message);

      released++;
    } catch (err: any) {
      console.error(`[release-payments] Failed for booking ${booking.id}:`, err.message);
      failed++;
      errors.push(`booking ${booking.id}: ${err.message}`);
    }
  }

  return { released, failed, processed: released + failed, errors };
  });
}
