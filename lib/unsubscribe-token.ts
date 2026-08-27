import { createHmac, timingSafeEqual } from "crypto";

// Mirrors lib/barber/loyalty-qr.ts's HMAC shape (createHmac sha256, hex digest, length
// check then timingSafeEqual). Used by /api/unsubscribe to prove the caller actually
// received the outreach email at this address, instead of accepting a bare `email` in
// the POST body (anyone could null out any of the 48 salon_directory rows' email column,
// which permanently blocks that salon from ever claiming its own listing again).
//
// UNSUBSCRIBE_SECRET is not a declared env var yet (no migration/env-provisioning tool
// available in this session to add one). Falling back to SUPABASE_SERVICE_ROLE_KEY keeps
// the route working today with no new deploy-time config: that key is already a real
// server-only secret never exposed to the client, so it is a safe HMAC key, just not a
// key dedicated to this one purpose. Set UNSUBSCRIBE_SECRET later to rotate independently
// of the service-role key without touching this file.
function getSecret(): string | undefined {
  return process.env.UNSUBSCRIBE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
}

/** HMAC of the lowercased, trimmed email. Appended to the outreach email's unsubscribe link. */
export function unsubscribeToken(email: string): string {
  const secret = getSecret();
  // No secret at all (both env vars unset): still return a deterministic hex string so
  // callers building a link don't crash, but it will never verify (see below, fail closed).
  const key = secret ?? "";
  return createHmac("sha256", key).update(email.trim().toLowerCase()).digest("hex");
}

/** Verifies `token` against `email`. Fails closed: no secret configured -> always false. */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const secret = getSecret();
  if (!secret) return false; // fail closed, never treat "no secret" as "valid".

  const expected = createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex");

  // Constant-time compare on equal-length buffers only (timingSafeEqual throws on a
  // length mismatch, e.g. an attacker-supplied token of the wrong length).
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
