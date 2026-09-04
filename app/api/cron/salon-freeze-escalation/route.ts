// exists-check: net-new route vs lib/supabase.ts, lib/salon-detail.ts, lib/salon-hours.ts,
// lib/active-salon.ts, lib/alert-admin.ts, lib/error-report.ts, lib/request-id.ts, app/error.tsx
// (ran `npm run exists cron salon-freeze`, 0 hits) because none of those are a cron entry
// point; this is a new /api/cron/* GET handler that imports lib/supabase.ts and calls the new
// lib/salons/freeze-escalation.ts, following the exact shape of every other route under
// app/api/cron/*.
export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";
import { runFreezeEscalation } from "@/lib/salons/freeze-escalation";

// RING 3a: caps a per-item errors[] array so a bad batch never floods cron_runs.
function capErrors(errs: string[], max = 20): string[] {
  if (errs.length <= max) return errs;
  return [...errs.slice(0, max), `...and ${errs.length - max} more`];
}

// GET /api/cron/salon-freeze-escalation
// Monthly cron: escalates verification warnings and freezes salons unconfirmed for 6+
// months. Ported from the retired supabase/functions/salon-verification edge function; see
// lib/salons/freeze-escalation.ts for the git sha read and the two deliberate deviations.
export async function GET(request: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = request.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("salon-freeze-escalation", async () => {
    const admin = createAdminSupabaseClient();
    const result = await runFreezeEscalation(admin);
    return {
      processed: result.processed,
      warned: result.warned,
      frozen: result.frozen,
      errors: capErrors(result.errors),
    };
  });
}
