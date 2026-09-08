// lib/bookings/fee-pay-link.ts
//
// Sign/verify the public HMAC token for the fee-pay email link (2026-09-06,
// owner-approved variant B of public/_mockups/r2-fee-failed/index.html): when the
// automated no-show / late-cancel fee fails to charge or needs re-authentication, the
// customer gets an email with one button that opens /{locale}/booking/{id}/fee?token=...
// so they can pay the fee themselves.
//
// SAME base64url + HMAC-SHA256 shape as verifyActionToken in
// app/api/bookings/[id]/quick-action/route.ts (colon-joined payload, base64url-wrapped),
// so this repo keeps ONE public booking-scoped-action token recipe rather than a second
// divergent one. Not a copy-paste of that function: this module's token additionally
// carries a `kind` (no_show | cancellation) instead of an action verb, and a 30-day
// expiry (the fee stays owed far longer than a same-day confirm/cancel window).
//
// token-in-url-skip: a GET-clickable email link is the only transport an email client
// href supports; this is the identical shape quick-action already ships
// (?token=... on a booking-scoped one-click link), not a new pattern.

import crypto from "crypto";
import { getServerEnv, getAppUrl } from "@/lib/env";

export type FeePayKind = "no_show" | "cancellation";

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

export interface FeePayTokenResult {
  bookingId: string;
  kind: FeePayKind | "";
  valid: boolean;
}

/** Sign a fee-pay token for `bookingId` + `kind`, expiring 30 days from now. */
export function signFeePayToken(bookingId: string, kind: FeePayKind): string {
  const secret = getServerEnv().BOOKING_HMAC_SECRET;
  if (!secret) throw new Error("[fee-pay-link] BOOKING_HMAC_SECRET not configured");

  const expiry = Math.floor(Date.now() / 1000) + THIRTY_DAYS_SECONDS;
  const payload = `${bookingId}:${kind}:${expiry}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

/** Verify a fee-pay token. Rejects a tampered payload, an expired token, and (via the
 * caller comparing `bookingId` to the route's own `[id]` param) a token signed for a
 * different booking. Never throws. */
export function verifyFeePayToken(token: string): FeePayTokenResult {
  const secret = getServerEnv().BOOKING_HMAC_SECRET;
  if (!secret) return { bookingId: "", kind: "", valid: false };

  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 4) return { bookingId: "", kind: "", valid: false };

    const [bookingId, kind, expiryStr, providedHmac] = parts;
    const expiry = parseInt(expiryStr, 10);
    const typedKind = (kind === "no_show" || kind === "cancellation" ? kind : "") as FeePayKind | "";

    if (!typedKind || !Number.isFinite(expiry) || Date.now() / 1000 > expiry) {
      return { bookingId, kind: typedKind, valid: false };
    }

    const payload = `${bookingId}:${kind}:${expiryStr}`;
    const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    const providedBuf = Buffer.from(providedHmac);
    const expectedBuf = Buffer.from(expectedHmac);
    // Length check BEFORE timingSafeEqual: mismatched-length buffers throw there
    // rather than compare false, which would surface as a 500 on a tampered token
    // instead of the intended 403.
    if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
      return { bookingId, kind: typedKind, valid: false };
    }

    return { bookingId, kind: typedKind, valid: true };
  } catch {
    return { bookingId: "", kind: "", valid: false };
  }
}

/** Build the full fee-pay URL an email button links to. */
export function buildFeePayUrl(locale: string, bookingId: string, kind: FeePayKind): string {
  const token = signFeePayToken(bookingId, kind);
  return `${getAppUrl()}/${locale}/booking/${bookingId}/fee?token=${token}`;
}
