export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { verifyCronSecret } from "@/lib/cron-auth";
import { withCronRun } from "@/lib/cron-run";

// Cron: Auto-complete bookings. Every 15min.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (!(await verifyCronSecret(authHeader, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("auto-complete", async () => {
  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();

  // No open-case exclusion needed: in the canonical booking_disputes system both
  // money directions (refund AND upcharge) can only be opened on a booking that is
  // ALREADY 'completed' (the POST gates in /report and /dispute both reject a
  // non-completed booking). This cron only acts on 'confirmed' bookings, which can
  // therefore never carry an open dispute — so there is nothing to exclude. (The old
  // guard read the now-absent `price_disputes` table, which silently no-op'd and
  // excluded nothing anyway.)
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // Find bookings to auto-complete
  let query = admin
    .from("bookings")
    .select("id, salon_id")
    .eq("status", "confirmed")
    .neq("payment_status", "pending")
    .neq("paid_via", "walk_in")
    .lt("ends_at", fortyEightHoursAgo);

  // Filter to salons with auto_complete_enabled
  // We need a subquery approach — fetch eligible salons first
  const { data: autoSalons } = await admin
    .from("salons")
    .select("id")
    .eq("auto_complete_enabled", true);

  const autoSalonIds = (autoSalons ?? []).map((s) => s.id);
  if (autoSalonIds.length === 0) {
    return { completed: 0, processed: 0, reason: "no_auto_complete_salons" };
  }

  query = query.in("salon_id", autoSalonIds);

  const { data: bookings } = await query.limit(100);

  let completed = 0;
  const errors: string[] = [];
  for (const booking of bookings ?? []) {
    try {
      // Re-assert status="confirmed" in the WHERE (the state the SELECT above filtered
      // on), select the changed row back, and skip if it did not match, so a booking
      // that moved between the SELECT and this UPDATE (cancelled, disputed, already
      // completed by the salon) is never force-flipped to completed under it.
      const { data: updatedRow, error } = await admin
        .from("bookings")
        .update({ status: "completed", completed_at: now })
        .eq("id", booking.id)
        .eq("status", "confirmed")
        .select("id")
        .maybeSingle();

      if (error) {
        console.error(`[cron/auto-complete] update failed for booking ${booking.id}:`, error.message);
        errors.push(`booking ${booking.id}: update failed: ${error.message}`);
        continue;
      }

      if (!updatedRow) {
        console.error(`[cron/auto-complete] booking ${booking.id} no longer confirmed (changed between select and update), skipping`);
        continue;
      }

      completed++;
    } catch (err) {
      console.error(`[cron/auto-complete] threw for booking ${booking.id}:`, err);
      errors.push(`booking ${booking.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { completed, processed: completed, errors };
  });
}
