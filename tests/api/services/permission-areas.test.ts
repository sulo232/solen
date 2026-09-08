// tests/api/services/permission-areas.test.ts
//
// G22-permissions round 1: proves the catalog and finance staff switches
// reach every route they describe, not just schedule and salon-total
// earnings (fixed earlier, see lib/active-salon.ts's getActiveSalon area
// param). Covers the three routes named in the brief:
//   - POST /api/services (catalog): was owner-or-admin only
//   - GET /api/analytics/salon/[id] (finance, backs the "reports" nav item,
//     see components-legacy/dashboard/DashboardLayout.tsx's
//     `{ key: "reports", href: "/dashboard/analytics", ... area: "finance" }`)
//   - GET /api/earnings/staff (finance, the per-staff earnings breakdown)
// Same stub pattern as tests/api/dashboard/permission-areas.test.ts and
// tests/api/staff/permission-gate.test.ts: a scripted, in-order .from()
// queue shared by both the admin and session clients, since
// createAdminSupabaseClient and createServerSupabaseClient both resolve to
// the same stub in these tests.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeQueryBuilder, type StubResult } from "../../helpers/supabase-stub";

vi.mock("@/lib/ratelimit", () => ({
  applyRateLimit: vi.fn(() => Promise.resolve(null)),
  generalLimiter: {},
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@/lib/ai/translate", () => ({
  translateToLocales: vi.fn(() => Promise.resolve({})),
}));

vi.mock("@/lib/posthog-api", () => ({
  fetchPostHogProfileViews: vi.fn(() => Promise.resolve(0)),
}));

function ok<T>(data: T): StubResult<T> {
  return { data, error: null };
}

// One .from(table) call, one scripted result, consumed strictly in call order.
function makeFromStub(results: StubResult[]) {
  let i = 0;
  return {
    from: (table: string) => {
      if (i >= results.length) {
        throw new Error(`makeFromStub: .from("${table}") called past the ${results.length} scripted results`);
      }
      return makeQueryBuilder(results[i++]);
    },
    storage: { from: () => ({ upload: vi.fn(), getPublicUrl: vi.fn() }) },
  };
}

let serverStub: any;

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve(serverStub)),
  createAdminSupabaseClient: vi.fn(() => serverStub),
}));

function withUser(userId: string, fromResults: StubResult[]) {
  return {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: userId } } }) },
    ...makeFromStub(fromResults),
  };
}

const SALON_ID = "550e8400-e29b-41d4-a716-446655440000";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/services (catalog area, requireSalonAccess-composed)", () => {
  function serviceBody() {
    return {
      salon_id: SALON_ID,
      name_de: "Herrenschnitt",
      duration_minutes: 30,
      price: 45,
    };
  }

  function postRequest(body: unknown) {
    return new NextRequest("http://localhost/api/services", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  it("refuses a staff member with catalog:false, 403", async () => {
    serverStub = withUser("staff-1", [
      ok({ id: SALON_ID, owner_id: "owner-1" }), // salon lookup: not the owner
      ok({ id: "staff-row-1", permissions: { catalog: false } }), // caller's own staff_members row
      ok({ role: "customer" }),
    ]);
    const { POST } = await import("@/app/api/services/route");
    const res = await POST(postRequest(serviceBody()));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("NOT_AUTHORIZED_FOR_AREA");
  });

  it("allows a staff member with catalog:true to create a service", async () => {
    serverStub = withUser("staff-1", [
      ok({ id: SALON_ID, owner_id: "owner-1" }), // salon lookup: not the owner
      ok({ id: "staff-row-1", permissions: { catalog: true } }), // caller's own staff_members row
      ok({ role: "customer" }),
      ok({ id: "service-1", salon_id: SALON_ID, name_de: "Herrenschnitt" }), // insert().select().single()
    ]);
    const { POST } = await import("@/app/api/services/route");
    const res = await POST(postRequest(serviceBody()));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.service.id).toBe("service-1");
  });
});

describe("GET /api/analytics/salon/[id] (finance area, backs the reports nav item)", () => {
  function reportsRequest() {
    return new NextRequest(`http://localhost/api/analytics/salon/${SALON_ID}?period=month`);
  }

  it("refuses a staff member with finance:false, 403", async () => {
    serverStub = withUser("staff-1", [
      ok({ id: SALON_ID, owner_id: "owner-1" }), // salon lookup: not the owner
      ok({ id: "staff-row-1", permissions: { finance: false } }), // caller's own staff_members row
      ok({ role: "customer" }),
    ]);
    const { GET } = await import("@/app/api/analytics/salon/[id]/route");
    const res = await GET(reportsRequest(), { params: Promise.resolve({ id: SALON_ID }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("NOT_AUTHORIZED_FOR_AREA");
  });

  it("allows the owner, 200 with the analytics payload", async () => {
    serverStub = withUser("owner-1", [
      ok({ id: SALON_ID, owner_id: "owner-1" }), // salon lookup: this caller IS the owner
      ok({ opening_hours: null }), // opening_hours fetch for the advice block
      ok(null), // salon_analytics pre-aggregated maybeSingle
      ok([]), // bookings (main period)
      ok([]), // reviews
      ok([]), // priorBookings
    ]);
    const { GET } = await import("@/app/api/analytics/salon/[id]/route");
    const res = await GET(reportsRequest(), { params: Promise.resolve({ id: SALON_ID }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.salon_id).toBe(SALON_ID);
  });
});

describe("GET /api/earnings/staff (finance area, per-staff earnings breakdown)", () => {
  function earningsRequest() {
    return new NextRequest(`http://localhost/api/earnings/staff?salon_id=${SALON_ID}`);
  }

  it("refuses a staff member with finance:false, 403", async () => {
    serverStub = withUser("staff-1", [
      ok({ id: SALON_ID, owner_id: "owner-1" }), // salon lookup: not the owner
      ok({ id: "staff-row-1", permissions: { finance: false } }), // caller's own staff_members row
      ok({ role: "customer" }),
    ]);
    const { GET } = await import("@/app/api/earnings/staff/route");
    const res = await GET(earningsRequest());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("NOT_AUTHORIZED_FOR_AREA");
  });

  it("allows the owner, 200 with the staff earnings list", async () => {
    serverStub = withUser("owner-1", [
      ok({ id: SALON_ID, owner_id: "owner-1" }), // salon lookup: this caller IS the owner
      ok([]), // staff_members select: empty roster, short-circuits before any bookings query
    ]);
    const { GET } = await import("@/app/api/earnings/staff/route");
    const res = await GET(earningsRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.staff).toEqual([]);
  });
});
