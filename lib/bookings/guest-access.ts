import crypto from "crypto";
import type { NextRequest, NextResponse } from "next/server";

/**
 * Guest access token — master plan §10b.7, encoded here so the spec lives in code.
 *
 * A guest with no account authenticates to their own booking via a high-entropy
 * bearer token. The token spec, verbatim from §10b.7:
 *   - `crypto.randomBytes(32).toString("base64url")` → 256-bit, issued ONCE.
 *   - Store ONLY the SHA-256 hash in `bookings.access_token_hash` (never the raw
 *     token — a DB dump must not expose a usable credential).
 *   - Look up by hash; compare with `crypto.timingSafeEqual` (NEVER `!==`).
 *   - TTL via `bookings.access_token_expires_at`; regenerate-on-resolution (SP-3
 *     nulls the hash when a case closes, killing a stale link).
 *   - Delivered as a query param exchanged ONCE for a short-lived httpOnly cookie;
 *     never in the URL path, never logged.
 *
 * What we deliberately do NOT copy from the walk-in `tracking_token`
 * (`lib/barber/walkin-ticket.ts` + `app/api/walkin/queue/[id]/route.ts`): that token
 * is stored AND compared in plaintext with `!==` (non-constant-time + secret at rest)
 * and is only ~71 bits. SP-2 fixes all three: hash-at-rest, `timingSafeEqual`, 256-bit.
 */

const TOKEN_BYTES = 32; // 256-bit
export const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
export const GUEST_COOKIE = "solen_guest_access"; // httpOnly cookie name
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days, matches the token TTL

/** sha256(raw) as lowercase hex. Pure; used both at mint time and on lookup. */
export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

/**
 * Mint a fresh token. Returns the RAW token (shown / linked exactly ONCE), the HASH
 * to persist in `bookings.access_token_hash`, and an ISO expiry for
 * `bookings.access_token_expires_at`. The raw token is never persisted.
 */
export function issueAccessToken(): { raw: string; hash: string; expiresAt: string } {
  const raw = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
  return {
    raw,
    hash: hashToken(raw),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  };
}

/**
 * Constant-time verify of a presented raw token against the stored hash, with expiry.
 *
 * Always hashes the presented token to a fixed-length 64-char hex string and compares
 * against the stored hash with `crypto.timingSafeEqual` on equal-length buffers — this
 * sidesteps the length-leak that bare `timingSafeEqual` on raw tokens has (it throws on
 * length mismatch). Returns false on null hash / expiry / mismatch; NEVER throws.
 *
 * IMPORTANT (timing oracle): callers MUST NOT early-return before calling this on a
 * missing row. The guest-lookup endpoint passes a sentinel 64-char hash for the no-row
 * branch so both "code absent" and "token wrong" do equal crypto work — see
 * `app/api/bookings/guest-lookup/route.ts`.
 */
export function verifyAccessToken(
  rawPresented: string,
  storedHash: string | null,
  expiresAt: string | null,
): boolean {
  // Hash the presented value first → always a 64-char hex string, even for "".
  const presentedHash = hashToken(rawPresented ?? "");

  // Normalize the stored side to a 64-char hex string so the compare is ALWAYS over
  // equal-length buffers (timingSafeEqual throws otherwise). A null/short stored hash
  // becomes an all-zero sentinel that the real hash can't equal.
  const ZERO = "0".repeat(64);
  const storedNorm = storedHash && storedHash.length === 64 ? storedHash : ZERO;

  const a = Buffer.from(presentedHash, "utf8");
  const b = Buffer.from(storedNorm, "utf8");

  // Equal length by construction (both 64 hex chars) — safe to compare directly.
  const hashMatches = a.length === b.length && crypto.timingSafeEqual(a, b);

  // Do the constant-time compare BEFORE the expiry short-circuit so a missing/expired
  // token still spends the same compare work (no code-existence timing oracle), then
  // gate on validity. Expired or null-hash → false regardless of the compare.
  if (!storedHash) return false;
  if (expiresAt && Date.now() > new Date(expiresAt).getTime()) return false;

  return hashMatches;
}

/**
 * Cookie value binds `bookingId:rawToken` so a single cookie can't be replayed against
 * a different booking. Encoded as base64url(JSON) to keep it opaque + cookie-safe.
 */
function encodeCookie(bookingId: string, rawToken: string): string {
  return Buffer.from(JSON.stringify({ b: bookingId, t: rawToken }), "utf8").toString("base64url");
}

function decodeCookie(value: string): { bookingId: string; raw: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (parsed && typeof parsed.b === "string" && typeof parsed.t === "string") {
      return { bookingId: parsed.b, raw: parsed.t };
    }
  } catch (err) {
    // Malformed cookie → treat as no cookie. Never throw on attacker-controlled input.
    console.error("[bookings/guest-access] cookie decode failed:", err);
  }
  return null;
}

/**
 * Set the httpOnly guest cookie after a successful one-time param exchange. Secure +
 * SameSite=Lax (Lax blocks cross-site POSTs; the link arrives via top-level GET so the
 * cookie is still set when the user clicks it). Secure is omitted in development so the
 * flow works over http://localhost.
 */
export function setGuestCookie(res: NextResponse, bookingId: string, rawToken: string): void {
  res.cookies.set(GUEST_COOKIE, encodeCookie(bookingId, rawToken), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_S,
  });
}

/** Read + decode the guest cookie from a request. Returns null when absent/malformed. */
export function readGuestCookie(req: NextRequest): { bookingId: string; raw: string } | null {
  const value = req.cookies.get(GUEST_COOKIE)?.value;
  if (!value) return null;
  return decodeCookie(value);
}
