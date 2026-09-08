export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireSalonAccess } from "@/lib/auth/require";

// GET /api/dashboard/barber/pl-comparison?salon_id=...
//
// Scheduled vs walk-in revenue split. There is no `is_walkin` column on bookings — a walk-in
// is identified by its link to the live queue (bookings.walkin_queue_id) which is set when a
// paid walk-in issues its ticket. So:
//   • scheduled = completed bookings with walkin_queue_id IS NULL
//   • walk-in   = completed bookings with walkin_queue_id IS NOT NULL  (the paid walk-in's booking)
// Revenue is summed from bookings.price_paid (stored in CHF francs). The PLComparison component
// formats with `v / 100`, so we send Rappen (price_paid * 100) to render "CHF 45" correctly.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");

  if (!salonId) {
    return NextResponse.json({ error: "salon_id required" }, { status: 400 });
  }

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (finance) instead of the old owner-or-admin
  // compare. The owner path is unchanged.
  const accessResult = await requireSalonAccess(salonId, "finance");
  if (accessResult instanceof NextResponse) return accessResult;

  const admin = createAdminSupabaseClient();

  const now = new Date();
  const start = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString(); // last 8 weeks

  const { data: bookings } = await admin
    .from("bookings")
    .select("id, walkin_queue_id, price_paid, status, starts_at")
    .eq("salon_id", salonId)
    .gte("starts_at", start)
    .in("status", ["completed"]);

  const all = bookings ?? [];

  // CHF francs → Rappen for the component's `/100` formatter.
  const toRappen = (chf: number | null) => Math.round((chf ?? 0) * 100);

  const apptBookings = all.filter((b) => b.walkin_queue_id == null);
  const walkinBookings = all.filter((b) => b.walkin_queue_id != null);

  const apptRevenue = apptBookings.reduce((s, b) => s + toRappen(b.price_paid), 0);
  const walkinRevenue = walkinBookings.reduce((s, b) => s + toRappen(b.price_paid), 0);

  const stats = {
    appointment_revenue: apptRevenue,
    walkin_revenue: walkinRevenue,
    appointment_count: apptBookings.length,
    walkin_count: walkinBookings.length,
    appointment_avg: apptBookings.length > 0 ? Math.round(apptRevenue / apptBookings.length) : 0,
    walkin_avg: walkinBookings.length > 0 ? Math.round(walkinRevenue / walkinBookings.length) : 0,
  };

  // Weekly breakdown for stacked bar (last 8 weeks)
  const weeklyMap = new Map<string, { appointments: number; walkins: number }>();
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date(now.getTime() - (w + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const label = `KW${Math.ceil((weekStart.getDate() + (new Date(weekStart.getFullYear(), weekStart.getMonth(), 1).getDay())) / 7)}`;
    const weekBookings = all.filter((b) => {
      const d = new Date(b.starts_at);
      return d >= weekStart && d < weekEnd;
    });
    weeklyMap.set(label, {
      appointments: weekBookings.filter((b) => b.walkin_queue_id == null).reduce((s, b) => s + toRappen(b.price_paid), 0),
      walkins: weekBookings.filter((b) => b.walkin_queue_id != null).reduce((s, b) => s + toRappen(b.price_paid), 0),
    });
  }

  const weekly = [...weeklyMap.entries()].map(([week, v]) => ({ week, ...v }));

  return NextResponse.json({ stats, weekly });
}
