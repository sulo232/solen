export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";

// Cron: Auto-complete bookings. Every 15min.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();

  // Get pending disputes to exclude
  const { data: pendingDisputes } = await admin
    .from("price_disputes")
    .select("booking_id")
    .eq("status", "pending");

  const disputeBookingIds = (pendingDisputes ?? []).map((d) => d.booking_id);

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
    return NextResponse.json({ completed: 0, reason: "no_auto_complete_salons" });
  }

  query = query.in("salon_id", autoSalonIds);

  if (disputeBookingIds.length > 0) {
    query = query.not("id", "in", `(${disputeBookingIds.join(",")})`);
  }

  const { data: bookings } = await query.limit(100);

  let completed = 0;
  for (const booking of bookings ?? []) {
    await admin
      .from("bookings")
      .update({ status: "completed", completed_at: now })
      .eq("id", booking.id);
    completed++;
  }

  return NextResponse.json({ completed });
}
