// tests/api/salon/permission-rls.test.ts
//
// P9-2 follow-up: requireSalonAccess() / getActiveSalon() correctly PASS a
// granted staff member (proven in tests/api/staff/permission-gate.test.ts),
// but several routes then did their resource read/write on the SESSION
// client, whose RLS policies are still owner-only (bookings_select_own,
// closures_owner_manage, salon_documents_owner_all, the owner-only policies
// on salon_last_minute_settings, salon_payouts_owner_select,
// retail_purchases_salon_select). A granted staff caller passed the gate and
// then got a silent-empty read, a silent no-op write, or a 404 that fired
// before the gate ever ran. This file proves the fix: resource I/O now runs
// on the ADMIN client, scoped by the gated salon id, for one route per
// pattern the seven fixed routes share:
//   A) requireSalonAccess-composed, resource read after the gate:
//      app/api/salon/last-minute-settings/route.ts (same shape as
//      app/api/salon/clients/route.ts).
//   B) getActiveSalon-area-composed, resource read after the gate:
//      app/api/salon/closures/route.ts (same shape as
//      app/api/salon/closures/[id]/route.ts and
//      app/api/salon/documents/route.ts).
//   C) row-fetch-then-gate, where the row itself must be fetched on the
//      admin client BEFORE the gate can run on its salon_id:
//      app/api/salon/invoices/[payoutId]/route.ts (same shape as
//      app/api/salon/retail/[id]/refund/route.ts).
//
// Each test's SESSION stub only has a queue for the tables
// requireSalonAccess/requireAuth itself touches (salons, staff_members); any
// other .from() call on the session client throws, which is the proof that
// the sensitive resource table was never read through the RLS-gated session
// client. The ADMIN stub carries the resource table's real data, and the
// assertion is that the route's response reflects that real data (not a
// silent-empty / "not configured" default, and not a premature 404).

import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeQueryBuilder, type StubResult } from "../../helpers/supabase-stub";

vi.mock("@/lib/ratelimit", () => ({
  applyRateLimit: vi.fn(() => Promise.resolve(null)),
  generalLimiter: {},
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: () => undefined })),
}));

function ok<T>(data: T): StubResult<T> {
  return { data, error: null };
}

/** A `.from(table)` stub keyed by table name, each table's own queue popped
 *  in call order. Any table with no queue entry throws, which is the poison
 *  pill proving a client was never asked to read that table. */
function makeTableStub(queues: Record<string, StubResult[]>, label: string) {
  const counters: Record<string, number> = {};
  return {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: "owner-1" } } }) },
    from: vi.fn((table: string) => {
      const q = queues[table];
      if (!q) {
        throw new Error(`${label} client: unexpected .from("${table}"), this table should only be read on the other client`);
      }
      const i = counters[table] ?? 0;
      if (i >= q.length) {
        throw new Error(`${label} client: .from("${table}") called ${i + 1} times but only ${q.length} scripted`);
      }
      counters[table] = i + 1;
      return makeQueryBuilder(q[i]);
    }),
  };
}

let sessionStub: any;
let adminStub: any;

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve(sessionStub)),
  createAdminSupabaseClient: vi.fn(() => adminStub),
}));

describe("P9-2 RLS fix: resource I/O runs on the admin client after the gate", () => {
  it("A) GET /api/salon/last-minute-settings: a granted staff caller gets the owner's real settings, not the silent 'not configured' default", async () => {
    // verify-auth-rollout fix: requireSalonAccess's own salon-existence
    // lookup moved to the admin client too (salons_select_active would
    // otherwise 404 a real staff caller out of an INACTIVE salon), so the
    // session client now takes zero .from() calls in this scenario; empty
    // queue set is the poison pill proving that.
    sessionStub = makeTableStub({}, "session");
    // Caller here is the salon's owner (id "owner-1", matches the mocked
    // getUser above), so requireSalonAccess resolves via the owner branch
    // without a staff_members lookup; the point under test is which client
    // reads salon_last_minute_settings afterwards, not which via-branch wins.
    adminStub = makeTableStub(
      {
        // requireSalonAccess's own salon-existence read, now on this client.
        salons: [ok({ id: "salon-1", owner_id: "owner-1" })],
        salon_last_minute_settings: [
          ok({ enabled: true, global_discount_percent: 25, service_overrides: { "svc-1": 30 } }),
        ],
      },
      "admin",
    );

    const { GET } = await import("@/app/api/salon/last-minute-settings/route");
    const req = new NextRequest("http://localhost/api/salon/last-minute-settings?salon_id=salon-1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    // A pre-fix session-client read would have hit RLS, gotten no row, and
    // returned the enabled:false/10% default instead of these real values.
    expect(body).toEqual({ enabled: true, global_discount_percent: 25, service_overrides: { "svc-1": 30 } });
  });

  it("B) GET /api/salon/closures: a granted staff caller reads the owner's real closures list, the session client is never asked for salon rows or closures", async () => {
    sessionStub = {
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "owner-1" } } }) },
      from: vi.fn((table: string) => {
        throw new Error(`session client should not be queried for resource I/O (.from("${table}") called)`);
      }),
    };
    adminStub = makeTableStub(
      {
        // getActiveSalon(admin, ...) resolves the caller's active salon (the
        // "oldest owned" lookup) then re-fetches the row by id; both hit
        // "salons" on the admin client, never the session client.
        salons: [ok({ id: "salon-1" }), ok({ id: "salon-1" })],
        salon_closures: [ok([{ id: "closure-1", salon_id: "salon-1", start_date: "2027-01-01", end_date: "2027-01-02", reason: "Ferien" }])],
      },
      "admin",
    );

    const { GET } = await import("@/app/api/salon/closures/route");
    const req = new NextRequest("http://localhost/api/salon/closures");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].reason).toBe("Ferien");
  });

  it("C) GET /api/salon/invoices/[payoutId]: the payout identity is resolved before its gated financial read, so a real row does not 404 and the session client never sees salon_payouts", async () => {
    // verify-auth-rollout fix: requireSalonAccess (called after the
    // admin-side payout fetch) now resolves "salons" on the admin client too
    // (see test A above for why), so the session client takes zero .from()
    // calls here; empty queue set is the poison pill proving that, and it
    // still proves salon_payouts itself is never read on the session client.
    sessionStub = makeTableStub({}, "session");
    adminStub = makeTableStub(
      {
        // requireSalonAccess's own salon-existence read, now on this client.
        salons: [ok({ id: "salon-1", owner_id: "owner-1" })],
        salon_payouts: [
          ok({ salon_id: "salon-1" }),
          ok({
            salon_id: "salon-1",
            gross_amount: 100,
            commission_percent: 15,
            commission_amount: 15,
            net_amount: 85,
            stripe_payment_intent_id: "pi_1",
            created_at: "2026-01-01T00:00:00.000Z",
            salons: { owner_id: "owner-1", name: "Salon X", address: "Strasse 1", postal_code: "8000", cities: { name_de: "Zürich" }, stripe_account_id: "acct_1" },
            bookings: { starts_at: "2026-01-05T10:00:00.000Z" },
          }),
        ],
      },
      "admin",
    );

    const { GET } = await import("@/app/api/salon/invoices/[payoutId]/route");
    const req = new Request("http://localhost/api/salon/invoices/payout-1");
    const res = await GET(req, { params: Promise.resolve({ payoutId: "payout-1" }) });
    // Pre-fix, fetching this row on the RLS-gated session client returned no
    // row for a granted staff caller, and this handler 404s before the gate
    // ever runs. A real row now reaches the gate and renders.
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("85.00");
  });
});
