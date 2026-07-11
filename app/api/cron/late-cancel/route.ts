export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { withCronRun } from "@/lib/cron-run";

/**
 * RETIRED (SP-AC §B4, REFUND_APPEAL_PLAN.md).
 *
 * This cron is a no-op. It previously read four columns that DO NOT EXIST on the live
 * `salons`/`bookings` tables (`cancellation_hours`, `late_cancel_fee_percent`,
 * `payment_mode`, `late_fee_charged`) under an auth-and-hold capture model, so it was a
 * dead no-op already. The late-cancellation fee is now handled by the ON-CANCEL HOOK
 * inside app/api/bookings/[id]/cancel/route.ts (off-session charge of the SP-G2 saved
 * card via lib/bookings/charge-fee.ts), per the canonical cancellation_fee_type/value +
 * free_cancel_hours policy. Running this route alongside the on-cancel hook would risk a
 * DOUBLE-CHARGE, so it is intentionally inert.
 *
 * Kept as a 200 no-op (rather than deleted) so the existing cron-jobs.yml ping does not
 * 404; the orchestrator may drop /api/cron/late-cancel from the every-30-min `paths`
 * list and delete this file. The fee_charge_status CAS in chargeFee is the backstop even
 * if both ever run.
 */
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return withCronRun("late-cancel", async () => ({ processed: 0, retired: true }));
}
