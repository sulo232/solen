// Ring 5d kill test: error-envelope consistency ({ error, code }) on the top-consumed
// mutation/read routes (bookings create/cancel/reschedule/confirm, booking-pay-intent,
// walkin pay-intent + review, reviews POST, salons GET/[slug], availability,
// resend-access, referral validate, vouchers/validate).
//
// This ring's actual code change is ADDITIVE-ONLY: every existing `error` (or `message`)
// string is untouched; a `code: SCREAMING_SNAKE` field was added next to it on every
// non-2xx branch of the 12 touched route files that was missing one (audited via
// app/api/bookings/route.ts:497's { error, message, code: "STYLIST_FULLY_BOOKED" } as the
// reference shape from ring 7a). app/api/bookings/route.ts, app/api/bookings/[id]/cancel/
// route.ts and app/api/reviews/route.ts needed ZERO edits, every non-2xx branch already
// carried a code. The three pre-existing walkin/pay-intent codes ("walkins_paused",
// "counter_only", "payouts_not_connected") are left lowercase on purpose: they are read
// by app/[locale]/walk-in-pay/page.tsx's `d?.code === "..."` checks, so upper-casing the
// VALUE would be a silent breaking change to a real consumer, not an additive one.
//
// 6 representative routes below are driven at FUNCTION level (the real exported GET/POST
// imported directly, called with a synthetic NextRequest, against the LIVE dev DB, same
// pattern as scripts/ring5b-kill-test.ts / ring7a-kill-test.ts, the sandboxed shell blocks
// outbound localhost fetches). createServerSupabaseClient()'s cookies() call fails soft to
// an anonymous client outside a real Next.js request scope, so a request with no cookie
// header is a genuine "no session" call, exactly what the unauthorized branch needs.
// Categories covered across the 6: bad input (4), not-found (2), unauthorized (1):
//   1. GET  /api/availability/time-slots      - bad input (missing salon_id/date, missing service_ids)
//   2. GET  /api/referral/validate             - bad input (code too short)
//   3. POST /api/bookings/resend-access        - bad input (schema: missing code/contact)
//   4. POST /api/bookings/[id]/reschedule      - bad input (missing new_starts_at/new_ends_at) + not-found (random UUID)
//   5. POST /api/bookings/[id]/confirm         - not-found (random UUID)
//   6. POST /api/salons                        - unauthorized (no session cookie)
//
// Every response asserted here must be non-2xx JSON with BOTH a human string (error or
// message) AND a code matching /^[A-Z0-9_]+$/.
//
// Usage: npx tsx scripts/ring5d-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { NextRequest } from "next/server";

type Row = { scenario: string; pass: boolean; details: Record<string, unknown> };
const rows: Row[] = [];
let allPass = true;

function check(scenario: string, pass: boolean, details: Record<string, unknown>) {
  rows.push({ scenario, pass, details });
  if (!pass) allPass = false;
}

const CODE_RE = /^[A-Z0-9_]+$/;

/** Shared assertion: a non-2xx JSON body with a human string (error|message) + a
 *  SCREAMING_SNAKE code. Returns the parsed body for extra per-case checks. */
function assertErrorEnvelope(scenario: string, status: number, body: any) {
  const isNon2xx = status < 200 || status >= 300;
  const humanString = typeof body?.error === "string" ? body.error : typeof body?.message === "string" ? body.message : null;
  const code = typeof body?.code === "string" ? body.code : null;
  const codeIsScreamingSnake = !!code && CODE_RE.test(code);
  check(scenario, isNon2xx && !!humanString && codeIsScreamingSnake, {
    status, isNon2xx, humanString, code, codeIsScreamingSnake, body,
  });
  return body;
}

async function main() {
  const randomBookingId = crypto.randomUUID();

  // ─── 1. GET /api/availability/time-slots (bad input) ──────────────────────────────
  {
    const { GET } = await import("@/app/api/availability/time-slots/route");

    const req1 = new NextRequest("http://localhost:3000/api/availability/time-slots?salon_id=" + crypto.randomUUID());
    const res1 = await GET(req1);
    const body1 = await res1.json();
    assertErrorEnvelope(
      "GET /api/availability/time-slots (missing date): 400 VALIDATION_ERROR with error+code",
      res1.status, body1,
    );
    check(
      "GET /api/availability/time-slots (missing date): code is exactly VALIDATION_ERROR",
      res1.status === 400 && body1.code === "VALIDATION_ERROR",
      { status: res1.status, code: body1.code },
    );

    const req2 = new NextRequest(
      `http://localhost:3000/api/availability/time-slots?salon_id=${crypto.randomUUID()}&date=2027-01-01`,
    );
    const res2 = await GET(req2);
    const body2 = await res2.json();
    assertErrorEnvelope(
      "GET /api/availability/time-slots (missing service_ids): 400 VALIDATION_ERROR with error+code",
      res2.status, body2,
    );
    check(
      "GET /api/availability/time-slots (missing service_ids): code is exactly VALIDATION_ERROR",
      res2.status === 400 && body2.code === "VALIDATION_ERROR",
      { status: res2.status, code: body2.code },
    );
  }

  // ─── 2. GET /api/referral/validate (bad input) ─────────────────────────────────────
  {
    const { GET } = await import("@/app/api/referral/validate/route");
    const req = new NextRequest("http://localhost:3000/api/referral/validate?code=ab");
    const res = await GET(req);
    const body = await res.json();
    assertErrorEnvelope(
      "GET /api/referral/validate?code=ab (code too short): 400 VALIDATION_ERROR with error+code",
      res.status, body,
    );
    check(
      "GET /api/referral/validate?code=ab: code is exactly VALIDATION_ERROR",
      res.status === 400 && body.code === "VALIDATION_ERROR",
      { status: res.status, code: body.code },
    );
  }

  // ─── 3. POST /api/bookings/resend-access (bad input) ───────────────────────────────
  {
    const { POST } = await import("@/app/api/bookings/resend-access/route");
    const req = new NextRequest("http://localhost:3000/api/bookings/resend-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // missing required `code` + exactly-one-of email/phone
    });
    const res = await POST(req);
    const body = await res.json();
    assertErrorEnvelope(
      "POST /api/bookings/resend-access ({}): 400 VALIDATION_ERROR with error+code",
      res.status, body,
    );
    check(
      "POST /api/bookings/resend-access ({}): code is exactly VALIDATION_ERROR",
      res.status === 400 && body.code === "VALIDATION_ERROR",
      { status: res.status, code: body.code },
    );
  }

  // ─── 4. POST /api/bookings/[id]/reschedule (bad input + not-found) ─────────────────
  {
    const { POST } = await import("@/app/api/bookings/[id]/reschedule/route");

    // 4a. Bad input: validated BEFORE the booking lookup, so the id in the URL is
    //     irrelevant to this branch (a bogus id is fine here).
    const reqBad = new NextRequest(`http://localhost:3000/api/bookings/${randomBookingId}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // missing new_starts_at / new_ends_at
    });
    const resBad = await POST(reqBad, { params: Promise.resolve({ id: randomBookingId }) });
    const bodyBad = await resBad.json();
    assertErrorEnvelope(
      "POST /api/bookings/[id]/reschedule ({}): 400 VALIDATION_ERROR with error+code",
      resBad.status, bodyBad,
    );
    check(
      "POST /api/bookings/[id]/reschedule ({}): code is exactly VALIDATION_ERROR",
      resBad.status === 400 && bodyBad.code === "VALIDATION_ERROR",
      { status: resBad.status, code: bodyBad.code },
    );

    // 4b. Not-found: a valid body shape, but a booking id that does not exist.
    const notFoundId = crypto.randomUUID();
    const reqNf = new NextRequest(`http://localhost:3000/api/bookings/${notFoundId}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        new_starts_at: "2027-08-01T10:00:00.000Z",
        new_ends_at: "2027-08-01T10:30:00.000Z",
      }),
    });
    const resNf = await POST(reqNf, { params: Promise.resolve({ id: notFoundId }) });
    const bodyNf = await resNf.json();
    assertErrorEnvelope(
      "POST /api/bookings/[id]/reschedule (random UUID, no such booking): 404 NOT_FOUND with error+code",
      resNf.status, bodyNf,
    );
    check(
      "POST /api/bookings/[id]/reschedule (random UUID): code is exactly NOT_FOUND",
      resNf.status === 404 && bodyNf.code === "NOT_FOUND",
      { status: resNf.status, code: bodyNf.code },
    );
  }

  // ─── 5. POST /api/bookings/[id]/confirm (not-found) ────────────────────────────────
  {
    const { POST } = await import("@/app/api/bookings/[id]/confirm/route");
    const notFoundId = crypto.randomUUID();
    const req = new NextRequest(`http://localhost:3000/api/bookings/${notFoundId}/confirm`, { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ id: notFoundId }) });
    const body = await res.json();
    assertErrorEnvelope(
      "POST /api/bookings/[id]/confirm (random UUID, no such booking): 404 NOT_FOUND with error+code",
      res.status, body,
    );
    check(
      "POST /api/bookings/[id]/confirm (random UUID): code is exactly NOT_FOUND",
      res.status === 404 && body.code === "NOT_FOUND",
      { status: res.status, code: body.code },
    );
  }

  // ─── 6. POST /api/salons (unauthorized: no session cookie) ─────────────────────────
  {
    const { POST } = await import("@/app/api/salons/route");
    // No Cookie header at all -> createServerSupabaseClient()'s cookies() call fails
    // soft to an anonymous client (see lib/supabase.ts) -> auth.getUser() resolves null
    // -> the route's very first post-feature-flag check is the 401 branch.
    const req = new NextRequest("http://localhost:3000/api/salons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const body = await res.json();
    // The route checks the `registration` feature flag before auth; either branch
    // (503 FEATURE_DISABLED or 401 UNAUTHORIZED) is a valid, already-coded envelope,
    // so the shared assertion covers both without over-fitting to live flag state.
    assertErrorEnvelope(
      "POST /api/salons (no session, empty body): non-2xx with error+code (401 UNAUTHORIZED expected, or 503 if registration flag is off)",
      res.status, body,
    );
    check(
      "POST /api/salons (no session): if 401, code is exactly UNAUTHORIZED",
      res.status !== 401 || body.code === "UNAUTHORIZED",
      { status: res.status, code: body.code },
    );
  }

  console.log("Ring 5d kill test: error-envelope { error, code } consistency on top-consumed routes\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(`${rows.filter((r) => r.pass).length}/${rows.length} scenarios passed.`);
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[ring5d-kill-test] threw:", err);
  process.exit(1);
});
