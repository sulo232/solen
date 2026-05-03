/**
 * /api/dashboard/today — Q61 (locked 2026-05-02) salon-owner dashboard live state.
 *
 * Returns the current "now" booking + today's stats + up-next strip for
 * the TodayLiveCard (mobile) and DashboardHeaderStrip (desktop).
 *
 * Auth: requires a salon-owner session. Returns 401 otherwise.
 *
 * v1 implementation runs sequential queries against bookings + reviews +
 * messages tables. Phase 7 may consolidate into a single SQL CTE if hot path.
 */
export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  // Find the salon this user owns (or admin-preview salon)
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

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

  const { data: salon } = await supabase
    .from("salons")
    .select("id, average_rating")
    .eq("owner_id", user.id)
    .single();

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

  /* ─── Today's bookings (count + revenue) ──────────────────── */
  const { data: todayBookings } = await supabase
    .from("bookings")
    .select("id, starts_at, total_price, status, services(name_de), profiles!user_id(display_name)")
    .eq("salon_id", salon.id)
    .gte("starts_at", startOfDay.toISOString())
    .lte("starts_at", endOfDay.toISOString())
    .in("status", ["confirmed", "completed", "in_progress"])
    .order("starts_at", { ascending: true });

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

  /* ─── Walk-in queue count ──────────────────────────────────── */
  const { count: walk_in_count } = await supabase
    .from("barber_walkin_queue")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("status", "waiting");

  /* ─── Inbox unread count ───────────────────────────────────── */
  const { count: inbox_unread } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("is_read_by_salon", false);

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
