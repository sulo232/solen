import { createAdminSupabaseClient } from "@/lib/supabase";
import { estimateWaitMinutes } from "@/lib/barber/wait-time-calculator";
import { nanoid } from "nanoid";
import type Stripe from "stripe";

type Admin = ReturnType<typeof createAdminSupabaseClient>;

// "Visa ···· 4242" / "Apple Pay" — pulled from the authorized charge.
export function cardLabel(pi: Stripe.PaymentIntent): string | null {
  const charge = pi.latest_charge as Stripe.Charge | null;
  const card = charge?.payment_method_details?.card;
  if (!card) return null;
  const wallet = card.wallet?.type;
  if (wallet === "apple_pay") return "Apple Pay";
  if (wallet === "google_pay") return "Google Pay";
  const brand = card.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : "Karte";
  return card.last4 ? `${brand} ···· ${card.last4}` : brand;
}

// Adaptive pace: EWMA of the salon's recent actual service durations (started → completed),
// newest weighted most. Falls back to 30 min until there's enough signal (<3 visits).
export async function recentAvgServiceMinutes(admin: Admin, salonId: string, fallback = 30): Promise<number> {
  const { data } = await admin
    .from("barber_walkin_queue")
    .select("started_at, completed_at")
    .eq("salon_id", salonId)
    .eq("status", "completed")
    .not("started_at", "is", null)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(20);
  const durations = (data ?? [])
    .map((r) => (new Date(r.completed_at as string).getTime() - new Date(r.started_at as string).getTime()) / 60000)
    .filter((m) => m > 1 && m < 180); // drop bogus (negative / absurd outliers)
  if (durations.length < 3) return fallback;
  let weighted = 0, wsum = 0;
  durations.forEach((d, i) => {
    const w = Math.pow(0.85, i); // newest first → highest weight
    weighted += d * w;
    wsum += w;
  });
  return Math.round(weighted / wsum);
}

// peopleAhead + an ADAPTIVE ETA (uses the salon's recent measured pace, not a fixed average).
export async function liveCounts(admin: Admin, salonId: string, position: number) {
  const { count: ahead } = await admin
    .from("barber_walkin_queue")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .in("status", ["waiting", "in_chair"])
    .lt("position", position);
  const { data: activeStaff } = await admin
    .from("staff_members")
    .select("id")
    .eq("salon_id", salonId)
    .eq("is_active", true);
  const aheadCount = ahead ?? 0;
  const avg = await recentAvgServiceMinutes(admin, salonId);
  // `|| 1`, not `?? 1`: 0 active staff must still estimate against 1 chair, else wait shows 0.
  const wait = estimateWaitMinutes(aheadCount, avg, activeStaff?.length || 1);
  return { queue_ahead: aheadCount, wait_minutes: wait };
}

export interface WalkinTicketResult {
  ticket_number: string | null;
  queue_id: string;
  tracking_token: string | null;
  position: number;
  payment_method: string | null;
  queue_ahead: number;
  wait_minutes: number;
}

interface ExistingRow {
  id: string;
  ticket_code: string | null;
  position: number;
  tracking_token: string | null;
}

function toResult(row: ExistingRow, paymentMethod: string | null, counts: { queue_ahead: number; wait_minutes: number }): WalkinTicketResult {
  return {
    ticket_number: row.ticket_code,
    queue_id: row.id,
    tracking_token: row.tracking_token,
    position: row.position,
    payment_method: paymentMethod,
    ...counts,
  };
}

/**
 * Create the walk-in queue entry + issue the ticket for an authorized PaymentIntent.
 * Shared by BOTH the client confirm route and the Stripe webhook backstop, so a dropped
 * client request can't strand a paid hold without a ticket.
 *
 * Idempotent and race-safe: the unique index on payment_intent_id guarantees one ticket
 * per payment even if the client and webhook fire at the same instant — the loser re-reads
 * and returns the winner's ticket.
 */
export async function createWalkinTicket(
  admin: Admin,
  opts: {
    pi: Stripe.PaymentIntent;
    salonId: string;
    serviceId: string | null;
    preferredBarberId?: string | null;
    linkBookingId?: string | null;
  }
): Promise<WalkinTicketResult> {
  const { pi, salonId, serviceId, preferredBarberId = null, linkBookingId = null } = opts;
  const paymentMethod = cardLabel(pi);

  // Fast path: this PI already issued a ticket.
  const existing = await admin
    .from("barber_walkin_queue")
    .select("id, ticket_code, position, tracking_token")
    .eq("payment_intent_id", pi.id)
    .maybeSingle();
  if (existing.data) {
    const counts = await liveCounts(admin, salonId, existing.data.position);
    return toResult(existing.data, paymentMethod, counts);
  }

  // Position = end of the active queue.
  const { data: lastEntry } = await admin
    .from("barber_walkin_queue")
    .select("position")
    .eq("salon_id", salonId)
    .in("status", ["waiting", "in_chair"])
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (lastEntry?.position ?? 0) + 1;

  // Daily per-salon sequence → "A01", "A47" … resets each day (date-scoped count, no cron).
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count: todayCount } = await admin
    .from("barber_walkin_queue")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .gte("joined_at", startOfDay.toISOString());

  const counts = await liveCounts(admin, salonId, position);

  // Insert with retry. Two unique indexes guard concurrency:
  //   (salon_id, ticket_code) → bump the code and retry
  //   (payment_intent_id)     → another process already created it → return that ticket
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const seq = (todayCount ?? 0) + 1 + attempt;
    const ticketCode = `A${String(seq).padStart(2, "0")}`;
    const { data, error } = await admin
      .from("barber_walkin_queue")
      .insert({
        salon_id: salonId,
        customer_id: null,
        customer_name: ticketCode, // pay-gated ticket: staff call the number, not a name
        service_id: serviceId,
        preferred_barber_id: preferredBarberId,
        status: "waiting",
        position,
        estimated_wait_minutes: counts.wait_minutes,
        tracking_token: nanoid(12),
        join_method: "remote",
        ticket_code: ticketCode,
        payment_intent_id: pi.id,
      })
      .select("id, ticket_code, position, tracking_token")
      .single();

    if (!error && data) {
      if (linkBookingId) {
        const { error: linkErr } = await admin
          .from("bookings")
          .update({ walkin_queue_id: data.id, payment_status: "deposit_held" })
          .eq("id", linkBookingId);
        if (linkErr) console.error("[createWalkinTicket] booking link failed:", linkErr);
      }
      return toResult(data, paymentMethod, counts);
    }

    lastErr = error;
    if (error?.code === "23505") {
      // A concurrent insert may have used this PI already → return the winner's ticket.
      const winner = await admin
        .from("barber_walkin_queue")
        .select("id, ticket_code, position, tracking_token")
        .eq("payment_intent_id", pi.id)
        .maybeSingle();
      if (winner.data) {
        const c = await liveCounts(admin, salonId, winner.data.position);
        return toResult(winner.data, paymentMethod, c);
      }
      continue; // otherwise it was just a ticket_code collision → try the next code
    }
    break; // non-unique error → stop
  }

  console.error("[createWalkinTicket] queue insert failed:", lastErr);
  throw new Error("Could not create queue entry");
}
