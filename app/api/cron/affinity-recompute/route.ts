// exists-check: net-new cron route. Mirrors app/api/cron/loyalty-recompute/route.ts (same CRON_SECRET
// + admin.rpc pattern) for a DIFFERENT RPC (recompute_user_salon_affinity). Not a dup of lib/supabase.ts
// / lib/posthog-server.ts / etc. (those are clients, this is a scheduled endpoint).
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";

// Cron: recompute per-(user, salon) affinity for personalization. Daily.
// Calls the security-definer SQL function that re-sums weighted, time-decayed engagement
// (search clicks/books + kept bookings + favorites + reviews) into user_salon_affinity.
// DERIVED, not an incrementing wallet. Spec: _tasks/SEARCH_BOOK_POINTS_SPEC.md.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("recompute_user_salon_affinity");
  if (error) {
    console.error("[cron/affinity-recompute] rpc failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, rowsWritten: data ?? 0 });
}
