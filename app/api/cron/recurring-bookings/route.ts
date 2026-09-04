// exists-check: net-new route (ran `npm run exists cron recurring-bookings`, 0 hits).
// app/api/bookings/recurring/route.ts already exists but owns RULE CREATION (a separate
// slice, left untouched); this is the daily cron entry point that calls the new
// lib/bookings/recurring-generate.ts to advance already-created rules, following the exact
// shape of every other route under app/api/cron/*.
export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";
import { generateRecurringBookings } from "@/lib/bookings/recurring-generate";

// RING 3a: caps a per-item errors[] array so a bad batch never floods cron_runs.
function capErrors(errs: string[], max = 20): string[] {
  if (errs.length <= max) return errs;
  return [...errs.slice(0, max), `...and ${errs.length - max} more`];
}

// GET /api/cron/recurring-bookings
// Daily cron: auto-creates the next booking for each active recurring rule due within 7
// days. Ported from the retired supabase/functions/recurring-booking-processor edge
// function; see lib/bookings/recurring-generate.ts for the git sha read and the one
// deliberate improvement (CAS slot claim via the shared claimSlot helper).
export async function GET(request: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = request.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("recurring-bookings", async () => {
    const admin = createAdminSupabaseClient();
    const result = await generateRecurringBookings(admin);
    return {
      processed: result.processed,
      booked: result.booked,
      failed: result.failed,
      errors: capErrors(result.errors),
    };
  });
}
