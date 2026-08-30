export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";
import {
  escalateCase,
  SALON_RESPONSE_WINDOW_HOURS,
  type DisputeStatus,
} from "@/lib/bookings/dispute-engine";

// Cron: a refund-direction case the salon never responded to gets escalated
// to Solen for a human decision. dispute-engine.ts line 13 (review-first):
// nothing here refunds, approves, or moves money, it only flips
// status -> 'escalated' via the shared escalateCase() transition, the exact
// same one the admin "escalate" action uses (mediation_started_at /
// mediation_deadline_at, 30 days). A human still has to act on the case
// afterward through admin_approve / admin_reject / refund.
//
// Reuses SALON_RESPONSE_WINDOW_HOURS (48h, dispute-engine.ts) instead of a
// second timeout number: that constant already backs the "Salon responds by
// {date}" copy shown to the customer and the salon, so the date the cron acts
// on and the date shown on screen can never drift apart.
//
// Idempotent: escalateCase()'s CAS (`.eq("status", fromStatus)`) means a row
// already escalated by a prior tick, or by an admin in the meantime, fails
// the update with zero rows and is simply skipped, never double-escalated.
// withCronRun's cron_locks claim additionally blocks two overlapping runs of
// this cron by name (lib/cron-run.ts).
//
// Scope: direction='refund' only. An upcharge-direction dispute is also
// created with status='open', but that 'open' means "waiting on the
// CUSTOMER to approve/decline a salon's upcharge request", not "waiting on
// the salon", it already has its own lazy expiry (open -> void past
// expires_at, app/api/bookings/[id]/dispute/route.ts) and must never be
// touched here. 'salon_reviewing' is a legal status value (the live
// booking_disputes_status_check) that nothing in this codebase writes today
// (verified via grep); it is included below so a case that lands there in
// the future is still caught instead of silently skipped.

export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("dispute-timeout", async () => {
    const admin = createAdminSupabaseClient();
    const cutoffIso = new Date(Date.now() - SALON_RESPONSE_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    const { data: stale, error: fetchError } = await admin
      .from("booking_disputes")
      .select("id, status, created_at")
      .eq("direction", "refund")
      .in("status", ["open", "salon_reviewing"])
      .lt("created_at", cutoffIso)
      .limit(100);

    if (fetchError) {
      console.error("[cron/dispute-timeout] fetch failed:", fetchError.message);
      return { escalated: 0, processed: 0, errors: [fetchError.message] };
    }

    let escalated = 0;
    for (const row of stale ?? []) {
      const result = await escalateCase({
        db: admin,
        disputeId: row.id,
        fromStatus: row.status as DisputeStatus,
        actorRole: "system",
        note: `Auto-escalated: no salon response within ${SALON_RESPONSE_WINDOW_HOURS}h of the case being opened.`,
      });
      if (result.escalated) escalated++;
    }

    return { escalated, processed: escalated };
  });
}
