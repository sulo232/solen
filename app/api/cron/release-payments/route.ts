export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getStripe, isStripeCardDecline } from "@/lib/stripe";
import { getServerEnv } from "@/lib/env";
import { withCronRun, ALL_DECLINED_SYMPTOM_FLOOR } from "@/lib/cron-run";

// Cron: Release (capture) payments 24h after booking completion. Every 6 hours
// (.github/workflows/cron-jobs.yml, the "0 */6 * * *" job shared with release-deposits).
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
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
  // Customer-side: the capture itself was declined (issuer declined completing an
  // already-authorized hold, e.g. the card was closed/blocked since booking). Data,
  // not a failure, never pushed to `errors` on its own (see the all-declined
  // symptom check at the end of the loop for the aggregate exception).
  let declined = 0;
  // System-side: the release machinery itself did not do its job (a non-decline
  // Stripe error, an expired authorization window, or Stripe captured the money but
  // the DB write no longer matched).
  let failed = 0;
  const errors: string[] = [];

  for (const booking of bookings ?? []) {
    // The query above already filters .not("payment_intent_id", "is", null), so this is
    // always present here; this narrows the type to match.
    if (!booking.payment_intent_id) continue;
    try {
      await getStripe().paymentIntents.capture(booking.payment_intent_id);

      // CAS: re-assert the exact precondition the SELECT above filtered on, so a
      // booking that changed status concurrently (e.g. a cancel/refund raced this
      // capture) does not get force-flipped to paid. A 0-row match means Stripe
      // already captured the money but the DB no longer agrees, that drift must
      // surface as a failure, not silently pass as "released".
      const { data: updatedRow } = await admin
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", booking.id)
        .eq("status", "completed")
        .eq("payment_status", "deposit_held")
        .select("id")
        .maybeSingle();

      if (!updatedRow) {
        console.error(`[release-payments] booking ${booking.id} captured at Stripe but DB update matched 0 rows (status changed concurrently)`);
        errors.push(`booking ${booking.id}: captured at Stripe but bookings row no longer matched deposit_held/completed (concurrent status change)`);
        failed++;
        continue;
      }

      // Audit log
      await admin.from("audit_log").insert({
        action: "payment_released",
        target_type: "booking",
        target_id: booking.id,
        metadata: { amount: booking.paid_amount, payment_intent_id: booking.payment_intent_id },
      });

      released++;
    } catch (err: any) {
      // A capture can fail for the same customer-side reasons a fresh charge can
      // (the issuer declines completing an already-authorized hold): reuse the
      // shared discriminator (lib/stripe.ts, lifted from off-session-charge.ts)
      // instead of re-deriving a second copy of the Stripe error classification.
      if (isStripeCardDecline(err)) {
        console.error(`[release-payments] Capture declined for booking ${booking.id}:`, err.message);
        declined++;
      } else {
        console.error(`[release-payments] Failed for booking ${booking.id}:`, err.message);
        failed++;
        errors.push(`booking ${booking.id}: ${err.message}`);
      }
    }
  }

  // Symptom, not per-item: every capture this run declined and NOTHING else went
  // wrong. That is not N unlucky customers, it is a broken Stripe/account config
  // wearing a customer-shaped costume (BACKEND_LAW.md #14). A run with any real
  // release or any system-side failure already reddens on its own, this only fires
  // for the case that would otherwise stay silently green: a pure decline sweep at
  // or above ALL_DECLINED_SYMPTOM_FLOOR (see lib/cron-run.ts for the reasoning).
  if (released === 0 && failed === 0 && declined >= ALL_DECLINED_SYMPTOM_FLOOR) {
    errors.push(
      `every one of ${declined} release-payments captures this run declined (0 released, 0 system errors): likely a broken Stripe/account config, not ${declined} unrelated bad cards`,
    );
  }

  return { released, declined, failed, processed: released + declined + failed, errors };
  });
}
