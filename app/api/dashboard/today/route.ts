/**
 * /api/dashboard/today — Q61 (locked 2026-05-02) salon-owner dashboard live state.
 *
 * Returns the current "now" booking + today's stats + up-next strip for
 * the TodayLiveCard (mobile) and DashboardHeaderStrip (desktop).
 *
 * Auth: requires a salon-owner session. Returns 401 otherwise.
 *
 * Ring 2a (2026-07-11): profile + active-salon lookup run in parallel
 * (stage 1, both only need user.id), then todayBookings + walk_in_count run
 * in parallel (stage 2, both only need salon.id). Was 4 serial awaits.
 * Phase 7 may consolidate further into a single SQL CTE if still hot.
 */
export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getActiveSalon } from "@/lib/active-salon";

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // Find the salon this user owns (or admin-preview salon). `profile` and
  // `salon` each only need user.id, so run them together (stage 1) instead
  // of the old serial profile -> getActiveSalon awaits.
  const [{ data: profile }, salon] = await Promise.all([
    supabase.from("profiles").select("id, role").eq("id", user.id).single(),
    getActiveSalon<{ id: string; average_rating: number | null }>(supabase, user.id, "id, average_rating"),
  ]);

  if (!profile || (profile.role !== "salon_owner" && profile.role !== "admin")) {
    // Non-salon users see empty payload (TodayLiveCard renders fallback)
    return NextResponse.json({
      now: null,
      today_count: 0,
      today_revenue: 0,
      walk_in_count: 0,
      inbox_unread: 0,
      avg_rating: 0,
      up_next: [],
    });
  }

  if (!salon) {
    return NextResponse.json({
      now: null,
      today_count: 0,
      today_revenue: 0,
      walk_in_count: 0,
      inbox_unread: 0,
      avg_rating: 0,
      up_next: [],
    });
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  /* ─── Today's bookings (count + revenue) + walk-in queue ─────
   * walk_in_count doesn't depend on todayBookings (both only need salon.id),
   * so run stage 2 together instead of the old serial awaits. */
  const [{ data: todayBookings }, { count: walk_in_count }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, starts_at, total_price:price_paid, status, services(name_de), profiles!user_id(display_name)")
      .eq("salon_id", salon.id)
      .gte("starts_at", startOfDay.toISOString())
      .lte("starts_at", endOfDay.toISOString())
      .in("status", ["confirmed", "completed", "in_progress"])
      .order("starts_at", { ascending: true }),
    supabase
      .from("barber_walkin_queue")
      .select("id", { count: "exact", head: true })
      .eq("salon_id", salon.id)
      .eq("status", "waiting"),
  ]);

  const today_count = todayBookings?.length ?? 0;
  const today_revenue = (todayBookings ?? []).reduce(
    (sum, b: any) => sum + (Number(b.total_price) || 0),
    0
  );

  /* ─── Find current/next booking ─────────────────────────────── */
  let nowBooking: any = null;
  const upNextRows: any[] = [];

  for (const b of todayBookings ?? []) {
    const slotTime = new Date((b as any).starts_at);
    const minsFromNow = (slotTime.getTime() - now.getTime()) / 60000;
    if (minsFromNow >= -30 && minsFromNow <= 0 && !nowBooking) {
      // Active right now (within last 30 min window)
      nowBooking = b;
    } else if (minsFromNow > 0 && upNextRows.length < 3) {
      const offsetLabel = minsFromNow < 60 ? `${Math.round(minsFromNow)}min` : `${(minsFromNow / 60).toFixed(1)}h`;
      upNextRows.push({
        time: slotTime.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }),
        client: (b as any).profiles?.display_name ?? "Kunde",
        service: (b as any).services?.name_de ?? "",
        offset_label: `in ${offsetLabel}`,
      });
    }
  }

  /* ─── Inbox unread count ───────────────────────────────────── */
  // Messaging is a disabled feature; messages has no salon linkage
  // (no salon_id / is_read_by_salon columns), so this always resolves to 0.
  const inbox_unread = 0;

  return NextResponse.json({
    now: nowBooking
      ? {
          client: nowBooking.profiles?.display_name ?? "Kunde",
          time: new Date(nowBooking.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }),
          service: nowBooking.services?.name_de ?? "",
          price: Number(nowBooking.total_price) || undefined,
        }
      : null,
    today_count,
    today_revenue: Math.round(today_revenue),
    walk_in_count: walk_in_count ?? 0,
    inbox_unread: inbox_unread ?? 0,
    avg_rating: salon.average_rating ?? 0,
    up_next: upNextRows,
  });
}
