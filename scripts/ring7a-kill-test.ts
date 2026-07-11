// Ring 7a kill test: the 5 zod schemas added/fixed this ring
// (walkinPayIntentSchema, bookingRescheduleSchema, adminSalonActionReasonSchema,
// walkinReviewSchema x1 shared by freeze+warn) + the staff_daily_limit_reached -> 409
// CAS mapping in app/api/bookings/route.ts.
//
// Zod part: exercises the REAL exported schemas via the REAL validateBody() helper
// (lib/validations.ts), no reimplementation. For each schema: a VALID body must parse,
// a body with an EXTRA unknown field must parse with that field stripped (zod's default
// z.object() behavior), and a MALICIOUS body (wrong types / out-of-range / oversized
// strings) must be rejected.
//
// 409 mapping part: the check lives inline in app/api/bookings/route.ts's POST handler
// (not a standalone export the DB-free sandbox can invoke: it needs a live slot,
// candidate booking rows, rate limiter, etc.). Two independent checks instead of one
// reimplementation: (a) a source-grep proves the REAL file contains the exact mapping
// (message.includes("staff_daily_limit_reached") -> 409 STYLIST_FULLY_BOOKED), so this
// test cannot silently drift from the real code; (b) a logic-replica of that ONE-line
// predicate proves the substring match itself behaves correctly (matches a Postgres-
// wrapped RAISE message, not just an exact string).
//
// Usage: npx tsx scripts/ring7a-kill-test.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { readFileSync } from "node:fs";
import { join } from "node:path";

async function main() {
  const {
    validateBody,
    walkinPayIntentSchema,
    bookingRescheduleSchema,
    adminSalonActionReasonSchema,
    walkinReviewSchema,
  } = await import("@/lib/validations");

  let allPass = true;
  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];

  function check(scenario: string, pass: boolean, details: Record<string, unknown>) {
    rows.push({ scenario, pass, details });
    if (!pass) allPass = false;
  }

  const uuid = () => crypto.randomUUID();

  // ─── 1. walkinPayIntentSchema (app/api/walkin/pay-intent/route.ts, MONEY) ──────────
  {
    const salon_id = uuid();
    const service_id = uuid();
    const valid = {
      salon_id,
      service_id,
      customer_name: "Max Muster",
      customer_phone: "+41791234567",
      booking_id: uuid(),
      preferred_barber_id: uuid(),
    };
    const r1 = validateBody(walkinPayIntentSchema, valid);
    check("walkinPayIntentSchema: valid body parses", r1.error === null && r1.data?.salon_id === salon_id, { error: r1.error });

    const withExtra = { ...valid, admin_override_price: 0, __proto__: { polluted: true } };
    const r2 = validateBody(walkinPayIntentSchema, withExtra);
    const stripped = r2.data ? !("admin_override_price" in (r2.data as Record<string, unknown>)) : false;
    check("walkinPayIntentSchema: unknown field (admin_override_price) is stripped, not rejected", r2.error === null && stripped, { error: r2.error, data: r2.data });

    const malicious = {
      salon_id: 12345, // wrong type: number, not a uuid string
      service_id: "not-a-uuid",
      customer_name: "x".repeat(5000), // oversized
      customer_phone: true, // wrong type
    };
    const r3 = validateBody(walkinPayIntentSchema, malicious);
    check("walkinPayIntentSchema: malicious body (wrong types + oversized string) is rejected", r3.error !== null && r3.data === null, { error: r3.error });

    // Fix-round: preferred_barber_id must DEGRADE (parse through, not hard-reject) on a
    // malformed value, the route's own UUID_RE + staff-existence check (pay-intent/route.ts,
    // lines 92-107) already drops a spoofed/malformed value silently ("Egal"). A bad OPTIONAL
    // preference must never block the customer's payment.
    const nonUuidBarber = { salon_id, service_id, preferred_barber_id: "not-a-uuid; DROP TABLE bookings;--" };
    const r4 = validateBody(walkinPayIntentSchema, nonUuidBarber);
    check(
      "walkinPayIntentSchema: non-UUID preferred_barber_id still parses (degrades downstream, does not 400 the payment)",
      r4.error === null && r4.data?.salon_id === salon_id,
      { error: r4.error, data: r4.data },
    );

    const emptyBarber = { salon_id, service_id, preferred_barber_id: "" };
    const r5 = validateBody(walkinPayIntentSchema, emptyBarber);
    check(
      "walkinPayIntentSchema: empty-string preferred_barber_id still parses (degrades downstream, does not 400 the payment)",
      r5.error === null && r5.data?.salon_id === salon_id,
      { error: r5.error, data: r5.data },
    );

    // Fix-round punch list: a REAL 500-code-length string (36 chars is the exact old .max())
    // and a non-string TYPE both used to 400 the WHOLE payment, not just drop the preference.
    // .catch(undefined) on the field must degrade it silently instead, same as the malformed
    // UUID case above.
    const longBarber = { salon_id, service_id, preferred_barber_id: "x".repeat(40) };
    const r6 = validateBody(walkinPayIntentSchema, longBarber);
    check(
      "walkinPayIntentSchema: >36-char preferred_barber_id still parses (whole body, no 400)",
      r6.error === null && r6.data?.salon_id === salon_id,
      { error: r6.error, data: r6.data },
    );

    const numericBarber = { salon_id, service_id, preferred_barber_id: 12345 };
    const r7 = validateBody(walkinPayIntentSchema, numericBarber);
    check(
      "walkinPayIntentSchema: non-string (number) preferred_barber_id still parses (whole body, no 400)",
      r7.error === null && r7.data?.salon_id === salon_id,
      { error: r7.error, data: r7.data },
    );

    const objectBarber = { salon_id, service_id, preferred_barber_id: { spoofed: true } };
    const r8 = validateBody(walkinPayIntentSchema, objectBarber);
    check(
      "walkinPayIntentSchema: non-string (object) preferred_barber_id still parses (whole body, no 400)",
      r8.error === null && r8.data?.salon_id === salon_id,
      { error: r8.error, data: r8.data },
    );
  }

  // ─── 2. bookingRescheduleSchema (app/api/bookings/[id]/reschedule/route.ts, BOOKING) ─
  {
    const valid = { new_starts_at: "2026-08-01T10:00:00.000Z", new_ends_at: "2026-08-01T10:30:00.000Z" };
    const r1 = validateBody(bookingRescheduleSchema, valid);
    check("bookingRescheduleSchema: valid ISO datetimes parse", r1.error === null, { error: r1.error });

    // Extra field is the OLD dead-schema shape (new_slot_id) plus a made-up field, both unknown now.
    const withExtra = { ...valid, new_slot_id: uuid(), unexpected: "junk" };
    const r2 = validateBody(bookingRescheduleSchema, withExtra);
    const stripped = r2.data ? !("new_slot_id" in (r2.data as Record<string, unknown>)) && !("unexpected" in (r2.data as Record<string, unknown>)) : false;
    check("bookingRescheduleSchema: unknown fields (incl. the old dead new_slot_id shape) are stripped", r2.error === null && stripped, { error: r2.error, data: r2.data });

    const malicious = { new_starts_at: "not-a-date", new_ends_at: 12345 };
    const r3 = validateBody(bookingRescheduleSchema, malicious);
    check("bookingRescheduleSchema: malformed datetime + wrong type is rejected", r3.error !== null && r3.data === null, { error: r3.error });
  }

  // ─── 3. adminSalonActionReasonSchema (freeze + warn, ADMIN moderation) ─────────────
  {
    const valid = { reason: "Repeated no-shows reported by 4 customers" };
    const r1 = validateBody(adminSalonActionReasonSchema, valid);
    check("adminSalonActionReasonSchema: valid reason parses", r1.error === null, { error: r1.error });

    const withExtra = { ...valid, admin_id: uuid(), skip_refunds: true };
    const r2 = validateBody(adminSalonActionReasonSchema, withExtra);
    const stripped = r2.data ? !("skip_refunds" in (r2.data as Record<string, unknown>)) : false;
    check("adminSalonActionReasonSchema: unknown field (skip_refunds) is stripped", r2.error === null && stripped, { error: r2.error, data: r2.data });

    const malicious = { reason: "x".repeat(5000) }; // oversized (max 500)
    const r3 = validateBody(adminSalonActionReasonSchema, malicious);
    check("adminSalonActionReasonSchema: oversized reason is rejected", r3.error !== null && r3.data === null, { error: r3.error });

    const tooShort = { reason: "hi" }; // below min(3)
    const r4 = validateBody(adminSalonActionReasonSchema, tooShort);
    check("adminSalonActionReasonSchema: reason below min length is rejected", r4.error !== null && r4.data === null, { error: r4.error });
  }

  // ─── 4. walkinReviewSchema (app/api/walkin/review/route.ts, public write) ──────────
  {
    const valid = { token: "a".repeat(32), rating: 5, comment: "Great cut, thanks!" };
    const r1 = validateBody(walkinReviewSchema, valid);
    check("walkinReviewSchema: valid body parses", r1.error === null, { error: r1.error });

    const withExtra = { ...valid, staff_member_id_override: uuid() };
    const r2 = validateBody(walkinReviewSchema, withExtra);
    const stripped = r2.data ? !("staff_member_id_override" in (r2.data as Record<string, unknown>)) : false;
    check("walkinReviewSchema: unknown field (staff_member_id_override) is stripped", r2.error === null && stripped, { error: r2.error, data: r2.data });

    const malicious = { token: "a".repeat(32), rating: "5" }; // string, not number: no coercion allowed
    const r3 = validateBody(walkinReviewSchema, malicious);
    check("walkinReviewSchema: string rating (no Number() coercion) is rejected", r3.error !== null && r3.data === null, { error: r3.error });

    const outOfRange = { token: "a".repeat(32), rating: 6 };
    const r4 = validateBody(walkinReviewSchema, outOfRange);
    check("walkinReviewSchema: out-of-range rating (6) is rejected", r4.error !== null && r4.data === null, { error: r4.error });

    // Fix-round: an over-length comment must TRUNCATE, not be silently rejected with zero
    // signal (the route already truncated to 600 pre-validation, review/route.ts:33; the schema
    // must match that, not hard-.max() reject it).
    const oversizedComment = { token: "a".repeat(32), rating: 3, comment: "x".repeat(5000) };
    const r5 = validateBody(walkinReviewSchema, oversizedComment);
    check(
      "walkinReviewSchema: oversized comment (5000 chars) is truncated to 600, not rejected",
      r5.error === null && r5.data?.comment?.length === 600,
      { error: r5.error, commentLength: r5.data?.comment?.length },
    );
  }

  // ─── 5. staff_daily_limit_reached -> 409 STYLIST_FULLY_BOOKED (app/api/bookings/route.ts) ─
  {
    const routeSrc = readFileSync(join(process.cwd(), "app/api/bookings/route.ts"), "utf8");
    const hasSourceBranch =
      /bookingError\.message\?\.includes\(\s*["']staff_daily_limit_reached["']\s*\)/.test(routeSrc) &&
      /STYLIST_FULLY_BOOKED/.test(routeSrc) &&
      /status:\s*409/.test(routeSrc);
    check("app/api/bookings/route.ts source contains the staff_daily_limit_reached -> 409 STYLIST_FULLY_BOOKED branch", hasSourceBranch, {
      hasIncludesCheck: /bookingError\.message\?\.includes\(\s*["']staff_daily_limit_reached["']\s*\)/.test(routeSrc),
      hasCode: /STYLIST_FULLY_BOOKED/.test(routeSrc),
      has409: /status:\s*409/.test(routeSrc),
    });

    // Logic-replica of the ONE-line predicate the route uses, proving substring match
    // (not exact-equality) so a Postgres-wrapped RAISE message still triggers the 409.
    function mapsTo409(bookingError: { message?: string | null } | null): boolean {
      return Boolean(bookingError?.message?.includes("staff_daily_limit_reached"));
    }

    const triggerRaised = { message: "staff_daily_limit_reached" };
    check("synthetic exact-message trigger error maps to 409", mapsTo409(triggerRaised) === true, { input: triggerRaised });

    const triggerWrapped = { message: 'new row for relation "bookings" violates check: staff_daily_limit_reached (SQLSTATE P0001)' };
    check("synthetic Postgres-wrapped trigger error (extra text around the message) still maps to 409", mapsTo409(triggerWrapped) === true, { input: triggerWrapped });

    const unrelatedDbError = { message: 'duplicate key value violates unique constraint "bookings_pkey"' };
    check("synthetic UNRELATED db error does NOT map to 409 (falls through to the existing 500 DB_ERROR branch)", mapsTo409(unrelatedDbError) === false, { input: unrelatedDbError });

    const nullError = null;
    check("null bookingError does not map to 409 (no bookingError -> no branch taken at all)", mapsTo409(nullError) === false, { input: nullError });
  }

  console.log("Ring 7a kill test: zod schema census fixes + staff_daily_limit_reached -> 409 CAS mapping\n");
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
  console.error("[ring7a-kill-test] threw:", err);
  process.exit(1);
});
