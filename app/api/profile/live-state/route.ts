/**
 * /api/profile/live-state — Q58 (locked 2026-05-02) priority resolver.
 *
 * Returns the FIRST qualifying state for the LiveActivityCard on /profile.
 *
 * Priority order:
 *   1. upcoming  — appointment within 24h
 *   2. loyalty   — ≤2 stamps from reward at any salon
 *   3. deal      — favorited salon has off-peak deal today
 *   4. reply     — review reply from salon owner in last 7d
 *   5. rebook    — average booking-cycle reached for any past salon (e.g. 28d since last cut)
 *   6. empty     — fallback CTA to /entdecken
 *
 * Caller polls every 60s while page is visible + revalidates on focus +
 * on websocket events (booking-create / review-reply / loyalty-stamp).
 *
 * NOTE: this is a v1 implementation — the priority resolver runs sequential
 * Supabase queries. Future optimization: single SQL with CTEs once we know
 * the access pattern's hot path. For now, correctness > optimization.
 */

export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

const REBOOK_CYCLE_DAYS = 28; // average gap that triggers rebook nudge

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

  const userId = user.id;
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  /* ─── 1. UPCOMING — appointment within 24h ───────────────────── */
  try {
    const { data: upcomingBookings } = await supabase
      .from("bookings")
      .select("id, slot_at, services(name), salons(slug, name, neighborhood)")
      .eq("user_id", userId)
      .gte("slot_at", now.toISOString())
      .lte("slot_at", in24h.toISOString())
      .in("status", ["confirmed", "pending"])
      .order("slot_at", { ascending: true })
      .limit(1);

    if (upcomingBookings && upcomingBookings.length > 0) {
      const b: any = upcomingBookings[0];
      const slot = new Date(b.slot_at);
      const minsUntil = Math.round((slot.getTime() - now.getTime()) / 60000);
      const timeLabel = minsUntil < 60 ? `In ${minsUntil} min` : `In ${Math.round(minsUntil / 60)}h`;
      return NextResponse.json({
        kind: "upcoming",
        eyebrow: `${timeLabel} · Termin`,
        headline: b.salons?.name ?? "Termin",
        meta: `${b.services?.name ?? ""} · ${slot.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}`,
        href: `/booking/${b.id}`,
      });
    }
  } catch (err) {
    console.error("[live-state] upcoming fetch:", err);
  }

  /* ─── 2. LOYALTY — ≤2 stamps from reward ──────────────────────── */
  try {
    const { data: stampCards } = await supabase
      .from("loyalty_stamp_cards")
      .select("id, salon_id, stamps_collected, stamps_total, reward_text, salons(slug, name)")
      .eq("user_id", userId)
      .eq("is_redeemed", false)
      .order("stamps_collected", { ascending: false });

    const closeToReward = (stampCards ?? []).find(
      (c: any) => c.stamps_total - c.stamps_collected <= 2 && c.stamps_total - c.stamps_collected > 0
    ) as any;

    if (closeToReward) {
      const remaining = closeToReward.stamps_total - closeToReward.stamps_collected;
      return NextResponse.json({
        kind: "loyalty",
        eyebrow: `Loyalty · ${remaining} mehr`,
        headline: closeToReward.salons?.name ?? "Belohnung",
        meta: closeToReward.reward_text ?? "Stempel sammeln",
        href: `/profile/stamps`,
        filled: closeToReward.stamps_collected,
        total: closeToReward.stamps_total,
      });
    }
  } catch (err) {
    console.error("[live-state] loyalty fetch:", err);
  }

  /* ─── 3. DEAL — favorited salon has off-peak today ────────────── */
  try {
    const { data: favorites } = await supabase
      .from("favorites")
      .select("salon_id, salons(slug, name)")
      .eq("user_id", userId)
      .limit(20);

    if (favorites && favorites.length > 0) {
      const salonIds = favorites.map((f: any) => f.salon_id);
      const { data: deals } = await supabase
        .from("off_peak_deals")
        .select("salon_id, discount_percent, valid_date")
        .in("salon_id", salonIds)
        .eq("valid_date", now.toISOString().slice(0, 10))
        .limit(1);

      if (deals && deals.length > 0) {
        const deal: any = deals[0];
        const fav: any = favorites.find((f: any) => f.salon_id === deal.salon_id);
        return NextResponse.json({
          kind: "deal",
          eyebrow: `Last-Minute · Heute`,
          headline: `${deal.discount_percent}% bei ${fav?.salons?.name ?? "Favorit"}`,
          meta: "Tippe für freie Slots",
          href: `/salon/${fav?.salons?.slug ?? ""}`,
        });
      }
    }
  } catch (err) {
    console.error("[live-state] deal fetch:", err);
  }

  /* ─── 4. REPLY — review reply in last 7d ──────────────────────── */
  try {
    const { data: replies } = await supabase
      .from("reviews")
      .select("id, salon_id, reply_text, reply_at, salons(slug, name)")
      .eq("user_id", userId)
      .not("reply_text", "is", null)
      .gte("reply_at", last7d.toISOString())
      .order("reply_at", { ascending: false })
      .limit(1);

    if (replies && replies.length > 0) {
      const r: any = replies[0];
      return NextResponse.json({
        kind: "reply",
        eyebrow: "Neue Antwort",
        headline: r.salons?.name ?? "Salon",
        meta: r.reply_text.slice(0, 80) + (r.reply_text.length > 80 ? "…" : ""),
        href: `/salon/${r.salons?.slug ?? ""}/reviews`,
      });
    }
  } catch (err) {
    console.error("[live-state] reply fetch:", err);
  }

  /* ─── 5. REBOOK — N days since last visit at any salon ───────── */
  try {
    const cutoff = new Date(now.getTime() - REBOOK_CYCLE_DAYS * 24 * 60 * 60 * 1000);
    const { data: pastBookings } = await supabase
      .from("bookings")
      .select("id, slot_at, salon_id, salons(slug, name)")
      .eq("user_id", userId)
      .eq("status", "completed")
      .lte("slot_at", cutoff.toISOString())
      .order("slot_at", { ascending: false })
      .limit(5);

    if (pastBookings && pastBookings.length > 0) {
      // Pick the most recent past booking older than the cycle
      const b: any = pastBookings[0];
      const daysSince = Math.round((now.getTime() - new Date(b.slot_at).getTime()) / (24 * 60 * 60 * 1000));
      return NextResponse.json({
        kind: "rebook",
        eyebrow: "Bereit?",
        headline: b.salons?.name ?? "Wieder buchen",
        meta: `${daysSince} Tage seit deinem letzten Termin`,
        href: `/salon/${b.salons?.slug ?? ""}`,
      });
    }
  } catch (err) {
    console.error("[live-state] rebook fetch:", err);
  }

  /* ─── 6. EMPTY — fallback CTA ─────────────────────────────────── */
  return NextResponse.json({
    kind: "empty",
    headline: "Salon entdecken",
    href: `/entdecken`,
  });
}
