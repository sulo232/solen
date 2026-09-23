export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";
import { releasePendingApproval } from "@/lib/bookings/release-pending-approval";

export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("pending-timeout", async () => {
  const admin = createAdminSupabaseClient();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Find bookings in pending_approval older than 24 hours
  const { data: pendingBookings } = await admin
    .from("bookings")
    .select("*, salons(*), services(*), profiles(*)")
    .eq("status", "pending_approval")
    .lt("created_at", twentyFourHoursAgo)
    .limit(50);

  let cancelled = 0;
  const errors: string[] = [];

  for (const booking of pendingBookings ?? []) {
    const result = await releasePendingApproval(admin, booking, {
      reason: "automatic_timeout_no_response",
      actor: "system",
      logTag: "cron/pending-timeout",
    });
    errors.push(...result.errors);
    if (result.released) cancelled++;
  }

  return { cancelled, processed: cancelled, errors };
  });
}
