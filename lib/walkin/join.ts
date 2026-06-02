// lib/walkin/join.ts
//
// The single source of truth for inserting a walk-in queue entry, race-safe.
//
// The partial UNIQUE index (salon_id, position) WHERE status IN ('waiting','in_chair')
// (migration 20260602120000) guarantees no two ACTIVE entries share a position. Under a
// concurrent join the loser hits 23505; we recompute max(position)+1 (+ a fresh token) and
// retry, instead of silently duplicating. Every join path — in-person, remote, and the
// pay-first confirm — goes through here so the race fix + shape stay consistent.

import type { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { estimateWaitMinutes } from "@/lib/barber/wait-time-calculator";

export interface JoinQueueParams {
  salonId: string;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  serviceId?: string | null;
  preferredBarberId?: string | null;
  joinMethod: string; // 'in_person' | 'remote' | 'kiosk'
  paymentIntentId?: string | null; // pay-first sets this so the ticket is gated on payment
  ticketCode?: string | null;
}

export interface JoinQueueResult {
  entry: Record<string, any>;
  trackingToken: string;
  position: number;
  estimatedWait: number;
}

/**
 * Insert a walk-in queue entry with atomic-retry position assignment.
 * Returns the created entry, or null on exhausted retries (caller responds 503).
 */
export async function joinWalkinQueue(
  admin: SupabaseClient,
  params: JoinQueueParams,
): Promise<JoinQueueResult | null> {
  // Wait estimate from the CURRENT waiting depth + active chairs (computed once;
  // Phase 5 swaps the static avg for the adaptive salon_pace).
  const { count: waitingCount } = await admin
    .from("barber_walkin_queue")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", params.salonId)
    .eq("status", "waiting");
  const { data: activeStaff } = await admin
    .from("staff_members").select("id").eq("salon_id", params.salonId).eq("is_active", true);
  // `|| 1` not `?? 1`: 0 active chairs must still estimate against 1, else wait shows 0.
  const estimatedWait = estimateWaitMinutes(waitingCount ?? 0, 30, activeStaff?.length || 1);

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

    const insertRow: Record<string, any> = {
      salon_id: params.salonId,
      customer_id: params.customerId ?? null,
      customer_name: params.customerName,
      customer_phone: params.customerPhone ?? null,
      service_id: params.serviceId ?? null,
      preferred_barber_id: params.preferredBarberId ?? null,
      position,
      estimated_wait_minutes: estimatedWait,
      tracking_token: trackingToken,
      join_method: params.joinMethod,
    };
    if (params.paymentIntentId) insertRow.payment_intent_id = params.paymentIntentId;
    if (params.ticketCode) insertRow.ticket_code = params.ticketCode;

    const { data: entry, error } = await admin
      .from("barber_walkin_queue").insert(insertRow).select().single();
    if (!error && entry) return { entry, trackingToken, position, estimatedWait };
    // 23505 = unique violation (position collision under a concurrent join) → retry.
    if ((error as any)?.code === "23505" && attempt < MAX_TRIES - 1) continue;
    console.error("[walkin/join] insert failed:", error?.message ?? "no row returned");
    return null;
  }
  return null;
}
