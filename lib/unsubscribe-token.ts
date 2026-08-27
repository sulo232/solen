// Web Crypto (globalThis.crypto.subtle), NOT Node's "crypto" module. Node's crypto has no
// Edge-runtime equivalent, and this file is reachable from API routes that declare
// runtime = "edge" (directly, or via lib/email.ts / lib/ratelimit.ts), so a static Node
// "crypto" import here breaks `next build` for every one of those routes (found 2026-08-27).
// crypto.subtle.importKey + sign is the SAME algorithm Node's createHmac("sha256", ...) ran,
// just a different API surface, so a token minted by the old code still verifies here: same
// key material, same input (trimmed lowercased email), same HMAC-SHA256, same hex digest.
// Do not change this back to a static `import ... from "crypto"`.
//
// crypto.subtle is async, so unsubscribeToken() and verifyUnsubscribeToken() are now async
// too. Both call sites were followed and updated: lib/email.ts's salonOutreachInvitation
// (+ its preview entry in lib/email-preview-samples.ts and the /dev/emails page that renders
// it) for unsubscribeToken, and app/api/unsubscribe/route.ts (already an async handler) for
// verifyUnsubscribeToken.
//
// Mirrors lib/barber/loyalty-qr.ts's HMAC shape (HMAC sha256, hex digest, length check then
// constant-time compare). Used by /api/unsubscribe to prove the caller actually received the
// outreach email at this address, instead of accepting a bare `email` in the POST body
// (anyone could null out any of the 48 salon_directory rows' email column, which permanently
// blocks that salon from ever claiming its own listing again).
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

const encoder = new TextEncoder();

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return bytesToHex(signature);
}

/** HMAC of the lowercased, trimmed email. Appended to the outreach email's unsubscribe link. */
export async function unsubscribeToken(email: string): Promise<string> {
  const secret = getSecret();
  // No secret at all (both env vars unset): still return a deterministic hex string so
  // callers building a link don't crash, but it will never verify (see below, fail closed).
  const key = secret ?? "";
  return hmacSha256Hex(key, email.trim().toLowerCase());
}

/** Verifies `token` against `email`. Fails closed: no secret configured -> always false. */
export async function verifyUnsubscribeToken(email: string, token: string): Promise<boolean> {
  const secret = getSecret();
  if (!secret) return false; // fail closed, never treat "no secret" as "valid".

  const expected = await hmacSha256Hex(secret, email.trim().toLowerCase());

  // Constant-time compare, hand-rolled: Web Crypto has no timingSafeEqual equivalent. Same
  // length boundary the old Node timingSafeEqual enforced (it throws on a length mismatch,
  // e.g. an attacker-supplied token of the wrong length, so the old code checked length
  // first too). For equal-length strings: a fixed-length loop over every character, XOR
  // accumulate, no early return, so a mismatch anywhere in the string takes the same time
  // as a mismatch at the very end.
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
