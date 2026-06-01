export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, guestLookupLimiter, getClientIp } from "@/lib/ratelimit";
import { normalizeReferenceCode } from "@/lib/bookings/reference";
import { setGuestCookie, verifyAccessToken } from "@/lib/bookings/guest-access";

/**
 * GET /api/bookings/guest-lookup?code={REF}&t={rawToken}
 *
 * How an account-less guest authenticates to their booking (master plan §10b.7). The
 * raw token arrives ONCE as a query param, is verified against the stored SHA-256 hash,
 * and is immediately exchanged for an httpOnly cookie. The response carries NO token and
 * does not echo the param.
 *
 * Anti-enumeration: bad-code, bad-token, and missing-param ALL return a byte-identical
 * uniform 404. Never 400/401/403 here — distinct statuses would leak which state failed.
 * The token is never logged (we never console.log the query string).
 */

// One sentinel response object so every failure branch is byte-identical (no enumeration).
const NOT_FOUND_BODY = { error: "Not found" } as const;
function notFound() {
  return NextResponse.json(NOT_FOUND_BODY, { status: 404 });
}

// A 64-char hex sentinel for the no-row branch so a missing code does the SAME crypto
// work as a wrong token (equalizes the timing oracle — see verifyAccessToken docs).
const SENTINEL_HASH = "0".repeat(64);

export async function GET(req: NextRequest) {
  // 1. Dedicated tight limiter (NOT generalLimiter), keyed by IP.
  const rateLimited = await applyRateLimit(guestLookupLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const token = url.searchParams.get("t");

  // 2. Missing either param → uniform 404 (NOT 400; 400-vs-404 itself leaks state).
  if (!code || !token) return notFound();

  // 3. Service-role fetch by normalized reference_code.
  const admin = createAdminSupabaseClient();
  const norm = normalizeReferenceCode(code);
  const { data: row } = await admin
    .from("bookings")
    .select("id, access_token_hash, access_token_expires_at")
    .eq("reference_code", norm)
    .maybeSingle();

  // 4. Verify token. Run verifyAccessToken on BOTH the row and the no-row branch (with a
  //    sentinel hash) so code-absent and token-wrong cost equal crypto work + identical
  //    control flow → no timing oracle. A no-row always fails (sentinel can't match).
  const valid = row
    ? verifyAccessToken(token, row.access_token_hash, row.access_token_expires_at)
    : (verifyAccessToken(token, SENTINEL_HASH, null), false);

  if (!row || !valid) return notFound();

  // 5. Success: set the booking-bound httpOnly cookie, return 200 with the booking id only.
  //    The URL param is consumed and not echoed; no token in the body or headers.
  const res = NextResponse.json({ booking_id: row.id }, { status: 200 });
  setGuestCookie(res, row.id, token);
  return res;
}
