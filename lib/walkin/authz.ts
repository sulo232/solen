// lib/walkin/authz.ts
//
// Guest authorization for the walk-in queue, in ONE place.
//
// `barber_walkin_queue` intentionally has NO anonymous RLS policy — a walk-in
// customer is a guest (no auth.uid()). Their ONLY proof of identity is the
// `tracking_token`: the unguessable nanoid in their ticket URL (`/queue/[token]`).
// Guest-facing routes therefore run as the service-role client (RLS bypassed) and
// gate on this token. Centralizing the lookup here means the token check is
// consistent and can never be silently forgotten by a future route (the council's
// #1 risk: one hand-rolled `.eq("tracking_token", …)` left off = whole-queue leak).
//
// NOTE on Realtime: because there is no token-based RLS, a GUEST cannot subscribe
// to Realtime directly (Supabase authorizes channels via RLS, and a guest has no
// matching policy). The customer ticket page therefore POLLS `/queue/status`
// (which runs through this helper). Realtime is for the OPERATOR board, which is
// owner-authenticated and covered by the existing owner RLS policy.

import type { SupabaseClient } from "@supabase/supabase-js";

/** Minimum plausible token length (tokens are nanoid(12)). Rejects junk early. */
const MIN_TOKEN_LEN = 8;

/**
 * Resolve a walk-in queue entry from its tracking token — the single gate for any
 * guest read/write. Returns the row, or null (caller responds 404/401). Never
 * throws. Pass the exact `columns` the caller needs (default all).
 */
export async function findQueueEntryByToken<T = Record<string, any>>(
  admin: SupabaseClient,
  token: string | null | undefined,
  columns = "*",
): Promise<T | null> {
  if (!token || typeof token !== "string" || token.length < MIN_TOKEN_LEN) return null;
  const { data, error } = await admin
    .from("barber_walkin_queue")
    .select(columns)
    .eq("tracking_token", token)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[walkin/authz] token lookup failed:", error.message);
    return null;
  }
  return data as T;
}
