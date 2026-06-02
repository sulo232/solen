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

// Position = end of the active queue (waiting + in_chair).
async function nextQueuePosition(admin: Admin, salonId: string): Promise<number> {
  const { data: lastEntry } = await admin
    .from("barber_walkin_queue")
    .select("position")
    .eq("salon_id", salonId)
    .in("status", ["waiting", "in_chair"])
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (lastEntry?.position ?? 0) + 1;
}

// Daily per-salon ticket sequence base → "A01", "A47" … resets each day (date-scoped count, no cron).
// Returns today's entry count; callers add (1 + attempt) to derive the next code. The day boundary
// is the SALON's local midnight (not server-UTC): a Zürich shop resets at 00:00 CET, not 01:00/02:00.
// Offset technique — DST-tolerant for the common case; a ticket reset needs no sub-hour precision.
export async function todayTicketCount(admin: Admin, salonId: string, timezone = "Europe/Zurich"): Promise<number> {
  const now = new Date();
  let startUtcIso: string;
  try {
    const tzNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const offsetMs = now.getTime() - tzNow.getTime();
    const tzMidnight = new Date(tzNow);
    tzMidnight.setHours(0, 0, 0, 0);
    startUtcIso = new Date(tzMidnight.getTime() + offsetMs).toISOString();
  } catch {
    // Bad/unknown tz → fall back to server-local midnight (prev behaviour).
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    startUtcIso = d.toISOString();
  }
  const { count } = await admin
    .from("barber_walkin_queue")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .gte("joined_at", startUtcIso);
  return count ?? 0;
}

// Shared race-safe insert. The caller supplies the per-row fields that differ between the
// paid (PI) path and the cash path; the daily ticket_code + position + 23505-retry loop are
// identical for both. `onTicketCodeCollision` lets the paid path short-circuit when the dup
// was on the payment_intent_id index (a concurrent process already issued the ticket) rather
// than the (salon_id, ticket_code) index — for the cash path there is no PI, so it's omitted
// and every 23505 is treated as a ticket_code collision (bump the code, retry).
async function insertWalkinEntry(
  admin: Admin,
  opts: {
    salonId: string;
    baseSeq: number; // todayTicketCount() result
    counts: { queue_ahead: number; wait_minutes: number };
    fields: {
      customer_id: string | null;
      customer_name: string | null; // null → fall back to the issued ticket_code
      customer_phone?: string | null;
      service_id: string | null;
      preferred_barber_id: string | null;
      join_method: "in_person" | "remote" | "kiosk";
      payment_intent_id: string | null;
    };
    onTicketCodeCollision?: () => Promise<ExistingRow | null>;
    errorLabel: string;
  }
): Promise<{ row: ExistingRow; recovered: boolean }> {
  const { salonId, baseSeq, counts, fields, onTicketCodeCollision, errorLabel } = opts;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    // Recompute position EACH attempt: the (salon_id, position) partial UNIQUE index means a
    // concurrent join can 23505 on position too (not just ticket_code) — re-read max+1 to resolve.
    const position = await nextQueuePosition(admin, salonId);
    const seq = baseSeq + 1 + attempt;
    const ticketCode = `A${String(seq).padStart(2, "0")}`;
    const { data, error } = await admin
      .from("barber_walkin_queue")
      .insert({
        salon_id: salonId,
        customer_id: fields.customer_id,
        customer_name: fields.customer_name ?? ticketCode, // no name → staff call the number
        customer_phone: fields.customer_phone ?? null,
        service_id: fields.service_id,
        preferred_barber_id: fields.preferred_barber_id,
        status: "waiting",
        position,
        estimated_wait_minutes: counts.wait_minutes,
        tracking_token: nanoid(12),
        join_method: fields.join_method,
        ticket_code: ticketCode,
        payment_intent_id: fields.payment_intent_id,
      })
      .select("id, ticket_code, position, tracking_token")
      .single();

    if (!error && data) return { row: data, recovered: false };

    lastErr = error;
    if (error?.code === "23505") {
      // Resolve which unique index tripped (the paid path guards payment_intent_id).
      if (onTicketCodeCollision) {
        const winner = await onTicketCodeCollision();
        if (winner) return { row: winner, recovered: true };
      }
      continue; // otherwise it was just a ticket_code collision → try the next code
    }
    break; // non-unique error → stop
  }

  console.error(`[${errorLabel}] queue insert failed:`, lastErr);
  throw new Error("Could not create queue entry");
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

  const position = await nextQueuePosition(admin, salonId);
  const baseSeq = await todayTicketCount(admin, salonId);
  const counts = await liveCounts(admin, salonId, position);

  // Insert with retry. Two unique indexes guard concurrency:
  //   (salon_id, ticket_code) → bump the code and retry
  //   (payment_intent_id)     → another process already created it → return that ticket
  const { row, recovered } = await insertWalkinEntry(admin, {
    salonId,
    baseSeq,
    counts,
    fields: {
      customer_id: null,
      customer_name: null, // pay-gated ticket: staff call the number, not a name (→ ticket_code)
      service_id: serviceId,
      preferred_barber_id: preferredBarberId,
      join_method: "remote",
      payment_intent_id: pi.id,
    },
    // A concurrent insert may have used this PI already → return the winner's ticket.
    onTicketCodeCollision: async () => {
      const winner = await admin
        .from("barber_walkin_queue")
        .select("id, ticket_code, position, tracking_token")
        .eq("payment_intent_id", pi.id)
        .maybeSingle();
      return winner.data ?? null;
    },
    errorLabel: "createWalkinTicket",
  });

  // Concurrent winner → return its ticket with counts for ITS position (don't re-link the
  // booking — the winning process already did). Fresh insert → link the booking as before.
  if (recovered) {
    const c = await liveCounts(admin, salonId, row.position);
    return toResult(row, paymentMethod, c);
  }
  if (linkBookingId) {
    const { error: linkErr } = await admin
      .from("bookings")
      .update({ walkin_queue_id: row.id, payment_status: "deposit_held" })
      .eq("id", linkBookingId);
    if (linkErr) console.error("[createWalkinTicket] booking link failed:", linkErr);
  }
  return toResult(row, paymentMethod, counts);
}

/**
 * Create a CASH / in-person walk-in queue entry — no payment, no Stripe PI.
 * Staff (the salon owner) drop a walk-in straight into the SAME live queue the paid path
 * feeds. Reuses the identical ticket_code sequence + position + race-safe insert as
 * createWalkinTicket; the only differences are join_method:'in_person', payment_intent_id:null,
 * and an optional staff-entered name/phone (no name → the ticket_code becomes the name, mirroring
 * the paid path so staff call the number).
 */
export async function createCashWalkinTicket(
  admin: Admin,
  opts: {
    salonId: string;
    serviceId: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
    preferredBarberId?: string | null;
  }
): Promise<WalkinTicketResult> {
  const { salonId, serviceId, customerName = null, customerPhone = null, preferredBarberId = null } = opts;

  const position = await nextQueuePosition(admin, salonId);
  const baseSeq = await todayTicketCount(admin, salonId);
  const counts = await liveCounts(admin, salonId, position);

  const trimmedName = customerName?.trim() || null;
  const { row } = await insertWalkinEntry(admin, {
    salonId,
    baseSeq,
    counts,
    fields: {
      customer_id: null,
      customer_name: trimmedName, // null → falls back to ticket_code inside the helper
      customer_phone: customerPhone?.trim() || null,
      service_id: serviceId,
      preferred_barber_id: preferredBarberId,
      join_method: "in_person",
      payment_intent_id: null, // cash: pay at the counter
    },
    // No PI → every 23505 is a ticket_code collision; no winner short-circuit.
    errorLabel: "createCashWalkinTicket",
  });

  return toResult(row, null, counts);
}
