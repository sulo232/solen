export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { withCronRun } from "@/lib/cron-run";

// Cron: recompute Solen Status (loyalty rank) for all customers. Monthly (1st).
// Calls the security-definer SQL function that aggregates qualifying completed
// bookings in the rolling window, derives tier (soft-drop), and sets valid_through.
// Spec: _design-system/LOYALTY_STRUCTURE.md.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("loyalty-recompute", async () => {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("recompute_loyalty_status");
  if (error) {
    console.error("[cron/loyalty-recompute] rpc failed:", error.message);
    return { error: error.message, errors: [error.message] };
  }
  return { ok: true, rowsWritten: data ?? 0, processed: data ?? 0 };
  });
}
