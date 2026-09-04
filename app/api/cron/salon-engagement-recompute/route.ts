// exists-check: net-new cron route. Mirrors app/api/cron/affinity-recompute (CRON_SECRET + admin.rpc)
// for a DIFFERENT RPC (recompute_salon_engagement, phase 4). Not a dup of lib/supabase.ts etc.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";

// Cron: recompute per-salon engagement (the popularity ranking signal). Daily.
// Sums weighted, time-decayed kept bookings + favorites + reviews per salon. Spec:
// _tasks/SEARCH_BOOK_POINTS_SPEC.md.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("recompute_salon_engagement");
  if (error) {
    console.error("[cron/salon-engagement-recompute] rpc failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, rowsWritten: data ?? 0 });
}
