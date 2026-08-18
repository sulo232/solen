/**
 * /api/profile/live-state - Q58 (locked 2026-05-02) priority resolver.
 *
 * Returns the FIRST qualifying state for the LiveActivityCard on /profile.
 *
 * Priority order:
 *   1. upcoming  - appointment within 24h
 *   2. loyalty   - 2 stamps from reward at any salon
 *   3. deal      - favorited salon has off-peak deal today
 *   4. reply     - review reply from salon owner in last 7d
 *   5. rebook    - average booking-cycle reached for any past salon (e.g. 28d since last cut)
 *   6. empty     - fallback CTA to /inspo
 *
 * Caller polls every 60s while page is visible + revalidates on focus +
 * on websocket events (booking-create / review-reply / loyalty-stamp).
 *
 * Perf: priorities 1, 2, and the favorites sub-query for priority 3 run
 * concurrently via Promise.allSettled. The off_peak_deals lookup for priority
 * 3 still runs sequentially (depends on favorites ids, so it cannot join that
 * first wave). Priorities 4 and 5 only run when 1-3 all miss (short-circuit),
 * so parallelizing them adds no wasted work on the common path; their queries
 * have no data dependency on each other, so they also run via Promise.allSettled.
 */

export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

const REBOOK_CYCLE_DAYS = 28; // average gap that triggers rebook nudge

export async function GET(_request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

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
  const cutoff = new Date(now.getTime() - REBOOK_CYCLE_DAYS * 24 * 60 * 60 * 1000);

  /* Run independent priorities concurrently */
  // Priorities 1 (upcoming), 2 (loyalty), and the favorites sub-query for
  // priority 3 (deal) have no data dependency on each other. Fire them in
  // parallel and evaluate results in priority order below.
  const [upcomingResult, loyaltyResult, favoritesResult] = await Promise.allSettled([
    // 1. UPCOMING
    supabase
      .from("bookings")
      .select("id, starts_at, services(name_de, name_en), salons(slug, name, quartier)")
      .eq("user_id", userId)
      .gte("starts_at", now.toISOString())
      .lte("starts_at", in24h.toISOString())
      .in("status", ["confirmed", "pending"])
      .order("starts_at", { ascending: true })
      .limit(1),
    // 2. LOYALTY
    supabase
      .from("loyalty_cards")
      .select(`id, salon_id, stamps_needed, reward_text, salons(slug, name), loyalty_stamps!inner(id, customer_id)`)
      .eq("is_active", true)
      .eq("loyalty_stamps.customer_id", userId),
    // 3a. DEAL: favorites (the deal lookup depends on these ids and follows below)
    supabase
      .from("favorites")
      .select("salon_id, salons(slug, name)")
      .eq("user_id", userId)
      .limit(20),
  ]);

  /* 1. UPCOMING - appointment within 24h */
  try {
    if (upcomingResult.status === "rejected") {
      console.error("[live-state] upcoming fetch:", upcomingResult.reason);
    } else {
      const upcomingBookings = upcomingResult.value.data;
      if (upcomingBookings && upcomingBookings.length > 0) {
        const b: any = upcomingBookings[0];
        const slot = new Date(b.starts_at);
        const minsUntil = Math.round((slot.getTime() - now.getTime()) / 60000);
        const timeLabel = minsUntil < 60 ? `In ${minsUntil} min` : `In ${Math.round(minsUntil / 60)}h`;
        return NextResponse.json({
          kind: "upcoming",
          eyebrow: `${timeLabel} Termin`,
          headline: b.salons?.name ?? "Termin",
          meta: `${b.services?.name_de ?? b.services?.name_en ?? ""} ${slot.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}`,
          href: `/booking/${b.id}`,
        });
      }
    }
  } catch (err) {
    console.error("[live-state] upcoming resolve:", err);
  }

  /* 2. LOYALTY - 2 stamps from reward */
  // Schema: loyalty_cards (program defs) JOINed with loyalty_stamps (per-stamp events).
  // stamps_collected is COMPUTED (count of loyalty_stamps for this card+customer),
  // not a column. Pattern matches /api/loyalty/route.ts.
  try {
    if (loyaltyResult.status === "rejected") {
      console.error("[live-state] loyalty fetch:", loyaltyResult.reason);
    } else {
      const cards = loyaltyResult.value.data;
      const ranked = (cards ?? [])
        .map((c: any) => {
          const collected = (c.loyalty_stamps ?? []).length;
          return {
            ...c,
            stamps_collected: collected,
            remaining: Math.max(0, c.stamps_needed - collected),
          };
        })
        .filter((c: any) => c.remaining > 0 && c.remaining <= 2)
        .sort((a: any, b: any) => a.remaining - b.remaining);

      const closeToReward = ranked[0];
      if (closeToReward) {
        return NextResponse.json({
          kind: "loyalty",
          eyebrow: `Loyalty ${closeToReward.remaining} mehr`,
          headline: closeToReward.salons?.name ?? "Belohnung",
          meta: closeToReward.reward_text ?? "Stempel sammeln",
          href: `/profile/stamps`,
          filled: closeToReward.stamps_collected,
          total: closeToReward.stamps_needed,
        });
      }
    }
  } catch (err) {
    console.error("[live-state] loyalty resolve:", err);
  }

  /* 3. DEAL - favorited salon has off-peak today */
  try {
    if (favoritesResult.status === "rejected") {
      console.error("[live-state] favorites fetch:", favoritesResult.reason);
    } else {
      const favorites = favoritesResult.value.data;
      if (favorites && favorites.length > 0) {
        const salonIds = favorites.map((f: any) => f.salon_id);
        // off_peak_deals is a phantom table (caught by strict typing); the real off-peak table is
        // off_peak_slots (app/api/off-peak/route.ts), a recurring WEEKLY schedule (day_of_week,
        // not a specific valid_date), so "today" maps to today's day_of_week.
        const { data: deals } = await supabase
          .from("off_peak_slots")
          .select("salon_id, discount_percent, day_of_week")
          .in("salon_id", salonIds)
          .eq("day_of_week", now.getDay())
          .eq("is_active", true)
          .limit(1);

        if (deals && deals.length > 0) {
          const deal: any = deals[0];
          const fav: any = favorites.find((f: any) => f.salon_id === deal.salon_id);
          return NextResponse.json({
            kind: "deal",
            eyebrow: `Last-Minute Heute`,
            headline: `${deal.discount_percent}% bei ${fav?.salons?.name ?? "Favorit"}`,
            meta: "Tippe fur freie Slots",
            href: `/salon/${fav?.salons?.slug ?? ""}`,
          });
        }
      }
    }
  } catch (err) {
    console.error("[live-state] deal fetch:", err);
  }

  /* 4 (reply) + 5 (rebook): reached only when 1-3 all missed (the common early-return path never
     runs these), so parallelizing here adds no wasted work. Their queries share no data dependency
     (both key off userId/now-derived timestamps only), so fire them together and evaluate in
     priority order, same allSettled pattern as priorities 1/2/3a above. */
  const [replyResult, rebookResult] = await Promise.allSettled([
    // 4. REPLY - review reply in last 7d (reply_text/reply_at live on review_replies,
    // not on reviews, joined here the same way loyalty_stamps is joined above)
    supabase
      .from("reviews")
      .select("id, salon_id, salons(slug, name), review_replies!inner(reply_text, is_public, created_at)")
      .eq("user_id", userId)
      .gte("review_replies.created_at", last7d.toISOString())
      .order("created_at", { ascending: false, foreignTable: "review_replies" })
      .limit(1),
    // 5. REBOOK - N days since last visit at any salon
    supabase
      .from("bookings")
      .select("id, starts_at, salon_id, salons(slug, name)")
      .eq("user_id", userId)
      .eq("status", "completed")
      .lte("starts_at", cutoff.toISOString())
      .order("starts_at", { ascending: false })
      .limit(5),
  ]);

  /* 4. REPLY - review reply in last 7d */
  try {
    if (replyResult.status === "rejected") {
      console.error("[live-state] reply fetch:", replyResult.reason);
    } else {
      const replies = replyResult.value.data;
      if (replies && replies.length > 0) {
        const r: any = replies[0];
        // review_replies.review_id is UNIQUE, so this is a to-one embed (an object, not an array).
        const replyText: string = r.review_replies?.reply_text ?? "";
        return NextResponse.json({
          kind: "reply",
          eyebrow: "Neue Antwort",
          headline: r.salons?.name ?? "Salon",
          meta: replyText.slice(0, 80) + (replyText.length > 80 ? "..." : ""),
          href: `/salon/${r.salons?.slug ?? ""}/reviews`,
        });
      }
    }
  } catch (err) {
    console.error("[live-state] reply resolve:", err);
  }

  /* 5. REBOOK - N days since last visit at any salon */
  try {
    if (rebookResult.status === "rejected") {
      console.error("[live-state] rebook fetch:", rebookResult.reason);
    } else {
      const pastBookings = rebookResult.value.data;
      if (pastBookings && pastBookings.length > 0) {
        const b: any = pastBookings[0];
        const daysSince = Math.round((now.getTime() - new Date(b.starts_at).getTime()) / (24 * 60 * 60 * 1000));
        return NextResponse.json({
          kind: "rebook",
          eyebrow: "Bereit?",
          headline: b.salons?.name ?? "Wieder buchen",
          meta: `${daysSince} Tage seit Ihrem letzten Termin`,
          href: `/salon/${b.salons?.slug ?? ""}`,
        });
      }
    }
  } catch (err) {
    console.error("[live-state] rebook resolve:", err);
  }

  /* 6. EMPTY - fallback CTA */
  return NextResponse.json({
    kind: "empty",
    headline: "Salon entdecken",
    href: `/inspo`,
  });
}
