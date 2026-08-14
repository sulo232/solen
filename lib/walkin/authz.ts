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

import crypto from "crypto";
import { nanoid } from "nanoid";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hashToken } from "@/lib/bookings/guest-access";

/** Minimum plausible token length (tokens are nanoid(12)). Rejects junk early. */
const MIN_TOKEN_LEN = 8;

/**
 * The tracking token is matched by its SHA-256 HASH, never by the plaintext.
 *
 * Landed 2026-08-14 from the 2026-07-17 backend re-audit, which was written, reviewed, and then
 * stranded on an unmerged branch for a month while its migration went live. The column
 * `tracking_token_hash` has existed on `barber_walkin_queue` since 17 July and every row carries
 * one (23 of 23, checked live), while the code kept reading the plaintext column, which the same
 * migration pass then nulled on 21 of those rows. So this half is not new work, it is the missing
 * half of something already deployed.
 *
 * Delegates to guest-access's hashToken, the one sha256-hex implementation in the codebase, rather
 * than adding a second. It also equals Postgres `encode(digest(token,'sha256'),'hex')`, so the
 * rows backfilled by the migration resolve the same raw token the customer is holding.
 */
export function hashTrackingToken(raw: string): string {
  return hashToken(raw);
}

/**
 * Constant-time check of a presented raw token against a stored hash.
 *
 * Replaces a plaintext `!==`, which leaks how many leading characters were right through how long
 * the comparison took. Both sides are normalized to a fixed 64-char hex string first so
 * timingSafeEqual always sees equal-length buffers and cannot throw. Returns false for a missing or
 * malformed stored hash; never throws.
 */
export function verifyTrackingToken(
  presented: string | null | undefined,
  storedHash: string | null | undefined,
): boolean {
  const ZERO = "0".repeat(64);
  const presentedHash = hashTrackingToken(presented ?? "");
  const usable = typeof storedHash === "string" && storedHash.length === 64;
  const a = Buffer.from(presentedHash, "utf8");
  const b = Buffer.from(usable ? storedHash! : ZERO, "utf8");
  const matches = a.length === b.length && crypto.timingSafeEqual(a, b);
  return usable && matches;
}

/**
 * Resolve a walk-in queue entry from its tracking token — the single gate for any
 * guest read/write. Returns the row, or null (caller responds 404/401). Never
 * throws. Pass the exact `columns` the caller needs (default all).
 */
export async function mintTrackingToken(
  admin: SupabaseClient,
  queueId: string,
): Promise<string | null> {
  // Issue a FRESH raw token for an existing entry and store only its hash.
  //
  // Needed because nothing can read a raw token back: the plaintext column is gone. Every path that
  // must hand a customer their ticket link without holding the raw token in memory (a reopened
  // booking link, a payment whose ticket a concurrent process already created) mints a new one
  // here. Rotating is not a downside: an older token, if it ever leaked, stops working the moment a
  // new one is issued, and only a caller who already proved they own the booking gets this far.
  //
  // Returns null when the write fails, so callers fail closed instead of handing out a token the
  // database does not recognise.
  const raw = nanoid(12);
  const { error } = await admin
    .from("barber_walkin_queue")
    .update({ tracking_token_hash: hashTrackingToken(raw) })
    .eq("id", queueId);
  if (error) {
    console.error("[walkin/authz] token mint failed:", error.message);
    return null;
  }
  return raw;
}

export async function findQueueEntryByToken<T = Record<string, any>>(
  admin: SupabaseClient,
  token: string | null | undefined,
  columns = "*",
): Promise<T | null> {
  if (!token || typeof token !== "string" || token.length < MIN_TOKEN_LEN) return null;
  // Look up by the HASH, so the customer's secret is never used as a plaintext predicate and a dump
  // of this column is not a usable credential. The lookup keeps working for the 21 live rows whose
  // plaintext column was nulled in July: their hash was backfilled by the same migration.
  const { data, error } = await admin
    .from("barber_walkin_queue")
    .select(columns)
    .eq("tracking_token_hash", hashTrackingToken(token))
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("[walkin/authz] token lookup failed:", error.message);
    return null;
  }
  return data as T;
}
