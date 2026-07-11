// GET /api/health (RING 1c dependency probe).
//
// Runs on nodejs (not edge, the prior static liveness check), since it needs
// the service-role Supabase client and @upstash/redis. Probes DB, Redis (if
// configured), and prod-required env completeness via lib/health.ts (kept
// there so scripts/ring1c-kill-test.ts can exercise the probes directly).
// 200 when every probe is ok or unconfigured, 503 when any hard-fails.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { runHealthProbes } from "@/lib/health";

export async function GET() {
  const admin = createAdminSupabaseClient();
  const report = await runHealthProbes(admin);
  return NextResponse.json(report, { status: report.ok ? 200 : 503 });
}
