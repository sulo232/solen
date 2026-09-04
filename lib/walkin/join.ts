// lib/walkin/join.ts
//
// The single source of truth for the PUBLIC walk-in join (in-person + remote QR), race-safe.
//
// Two partial UNIQUE indexes on barber_walkin_queue guard a concurrent join:
//   (salon_id, position) WHERE status IN ('waiting','in_chair')  — no shared position
//   (salon_id, ticket_code)                                       — no shared A-number
// On a 23505 collision (either index) we recompute max(position)+1 and bump the daily
// ticket sequence, then retry — instead of silently duplicating or 500-ing. The pay-first
// path uses createWalkinTicket() in lib/barber/walkin-ticket.ts; this is its free-join twin.

import type { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { estimateWaitMinutes } from "@/lib/barber/wait-time-calculator";
import { nextWalkinTicketCode } from "@/lib/barber/walkin-ticket";
import { hashTrackingToken } from "@/lib/walkin/authz";

export interface JoinQueueParams {
  salonId: string;
  customerId?: string | null;
  // No name captured (e.g. the ExpressMenu one-tap flow) falls back to the ticket code at
  // insert time below, mirroring lib/barber/walkin-ticket.ts's `fields.customer_name ?? ticketCode`.
  customerName?: string | null;
  customerPhone?: string | null;
  serviceId?: string | null;
  preferredBarberId?: string | null;
  joinMethod: string; // 'in_person' | 'remote' | 'kiosk'
}

export interface JoinQueueResult {
  entry: Record<string, any>;
  trackingToken: string;
  position: number;
  estimatedWait: number;
  ticketCode: string;
}

/**
 * Insert a counter-pay (free) walk-in queue entry with a daily ticket code + atomic-retry
 * position. Returns the created entry, or null on exhausted retries (caller responds 503).
 */
export async function joinWalkinQueue(
  admin: SupabaseClient,
  params: JoinQueueParams,
): Promise<JoinQueueResult | null> {
  // Wait estimate from the CURRENT waiting depth + active chairs (computed once; the status
  // route recomputes the live adaptive ETA on each poll). `|| 1` so 0 staff still estimates > 0.
  const { count: waitingCount } = await admin
    .from("barber_walkin_queue")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", params.salonId)
    .eq("status", "waiting");
  const { data: activeStaff } = await admin
    .from("staff_members").select("id").eq("salon_id", params.salonId).eq("is_active", true);
  const estimatedWait = estimateWaitMinutes(waitingCount ?? 0, 30, activeStaff?.length || 1);

  // Pre-issue a unique ticket code from the atomic per-salon counter (no reset, no race, no TZ math).
  const ticketCode = await nextWalkinTicketCode(admin, params.salonId);

  const MAX_TRIES = 6;
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const { data: lastEntry } = await admin
      .from("barber_walkin_queue")
      .select("position")
      .eq("salon_id", params.salonId)
      .in("status", ["waiting", "in_chair"])
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    const position = (lastEntry?.position ?? 0) + 1;
    const trackingToken = nanoid(12);

    const { data: entry, error } = await admin
      .from("barber_walkin_queue")
      .insert({
        salon_id: params.salonId,
        customer_id: params.customerId ?? null,
        // ticketCode is already issued above (line 56), before this insert, so a missing name
        // falls back to it directly, never a placeholder string, and never null (the status
        // route's hasCapturedName check treats "name === ticket_code" as no captured name).
        customer_name: params.customerName?.trim() || ticketCode,
        customer_phone: params.customerPhone ?? null,
        service_id: params.serviceId ?? null,
        preferred_barber_id: params.preferredBarberId ?? null,
        status: "waiting",
        position,
        estimated_wait_minutes: estimatedWait,
        // Only the HASH is stored. The raw token is returned to the caller and lives in the
        // customer's ticket URL, never at rest, so a dump of this table is not a set of working
        // ticket links. Landed 2026-08-14 with the rest of the July re-audit's code half; the
        // column it writes has been live since 17 July.
        tracking_token_hash: hashTrackingToken(trackingToken),
        join_method: params.joinMethod,
        ticket_code: ticketCode,
      })
      .select()
      .single();
    if (!error && entry) return { entry, trackingToken, position, estimatedWait, ticketCode };
    // 23505 = position collision under a concurrent join (ticketCode is pre-issued unique) → retry.
    if ((error as any)?.code === "23505" && attempt < MAX_TRIES - 1) continue;
    console.error("[walkin/join] insert failed:", error?.message ?? "no row returned");
    return null;
  }
  return null;
}
