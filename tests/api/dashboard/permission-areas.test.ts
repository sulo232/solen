// tests/api/dashboard/permission-areas.test.ts
//
// P9-2 sweep (coder R2a): every app/api/dashboard/** route (except today/route.ts
// and clients/route.ts, done earlier) is now gated through requireSalonAccess or
// the getActiveSalon area fallback instead of an inline owner-or-admin compare.
// This file proves the discrimination on two of those routes, using the same
// stub pattern as tests/api/staff/permission-gate.test.ts (that file is the
// general-purpose proof for the gate helpers themselves and is not extended
// here, per the brief: a new file, not new cases bolted onto the shared one).

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeQueryBuilder, type StubResult } from "../../helpers/supabase-stub";

vi.mock("@/lib/feature-flags", () => ({
  checkUserBanned: vi.fn(() => Promise.resolve(null)),
  checkFeatureEnabled: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/ratelimit", () => ({
  applyRateLimit: vi.fn(() => Promise.resolve(null)),
  generalLimiter: {},
  getClientIp: vi.fn(() => "127.0.0.1"),
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
  };
}

let serverStub: any;
let cookieValue: string | null = null;

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve(serverStub)),
  createAdminSupabaseClient: vi.fn(() => serverStub),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: (_name: string) => (cookieValue ? { value: cookieValue } : undefined),
    })
  ),
}));

function withUser(userId: string, fromResults: StubResult[]) {
  return {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: userId } } }) },
    ...makeFromStub(fromResults),
  };
}

beforeEach(() => {
  cookieValue = null;
});

describe("GET /api/dashboard/clients/[id]/notes (clients, requireSalonAccess-composed)", () => {
  it("refuses a staff member with clients:false, 403", async () => {
    serverStub = withUser("staff-1", [
      ok({ id: "salon-1", owner_id: "owner-1" }), // salon lookup: not the owner
      ok({ id: "staff-row-1", permissions: { clients: false } }), // staff_members
      ok({ role: "customer" }),
    ]);
    const { GET } = await import("@/app/api/dashboard/clients/[id]/notes/route");
    const req = new NextRequest("http://localhost/api/dashboard/clients/client-1/notes?salon_id=salon-1");
    const res = await GET(req, { params: Promise.resolve({ id: "client-1" }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("NOT_AUTHORIZED_FOR_AREA");
  });

  it("allows the owner, 200 with the notes list", async () => {
    serverStub = withUser("owner-1", [
      ok({ id: "salon-1", owner_id: "owner-1" }), // salon lookup: owner match, no staff query needed
      ok([{ id: "note-1", note: "Allergic to ammonia", note_type: "permanent", created_by: "owner-1", created_at: "2026-01-01T00:00:00Z" }]), // client_notes select
    ]);
    const { GET } = await import("@/app/api/dashboard/clients/[id]/notes/route");
    const req = new NextRequest("http://localhost/api/dashboard/clients/client-1/notes?salon_id=salon-1");
    const res = await GET(req, { params: Promise.resolve({ id: "client-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notes).toHaveLength(1);
  });
});

describe("GET /api/dashboard/clients/[id]/tags (clients, requireSalonAccess-composed)", () => {
  it("refuses a staff member with clients:false, 403", async () => {
    serverStub = withUser("staff-1", [
      ok({ id: "salon-1", owner_id: "owner-1" }),
      ok({ id: "staff-row-1", permissions: { clients: false } }),
      ok({ role: "customer" }),
    ]);
    const { GET } = await import("@/app/api/dashboard/clients/[id]/tags/route");
    const req = new NextRequest("http://localhost/api/dashboard/clients/client-1/tags?salon_id=salon-1");
    const res = await GET(req, { params: Promise.resolve({ id: "client-1" }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("NOT_AUTHORIZED_FOR_AREA");
  });

  it("allows the owner, 200 with the tags list", async () => {
    serverStub = withUser("owner-1", [
      ok({ id: "salon-1", owner_id: "owner-1" }),
      ok([{ id: "tag-1", tag: "VIP", color: "gold", created_at: "2026-01-01T00:00:00Z" }]),
    ]);
    const { GET } = await import("@/app/api/dashboard/clients/[id]/tags/route");
    const req = new NextRequest("http://localhost/api/dashboard/clients/client-1/tags?salon_id=salon-1");
    const res = await GET(req, { params: Promise.resolve({ id: "client-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags).toHaveLength(1);
  });
});


describe("GET /api/dashboard/today (calendar area gate, no role short-circuit)", () => {
  it("admits a staff caller granted calendar:true, same shape as an owner", async () => {
    const salonId = "22222222-2222-4222-8222-222222222222";
    serverStub = withUser("staff-1", [
      ok(null), // getActiveSalonId: oldest-owned salons lookup, staff-1 owns none
      ok({ salon_id: salonId, permissions: { calendar: true } }), // staff_members fallback
      ok({ id: salonId, average_rating: 4.6 }), // getActiveSalon's own salon row read
      ok({ id: salonId, owner_id: "owner-1" }), // finance access: target Store
      ok({ id: "staff-row-1", permissions: { calendar: true } }),
      ok({ role: "customer" }),
      ok([]), // todayBookings
      ok(null), // walk_in_count (count query)
    ]);
    const { GET } = await import("@/app/api/dashboard/today/route");
    const req = new NextRequest("http://localhost/api/dashboard/today");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.avg_rating).toBe(4.6);
    expect(body.today_count).toBe(0);
  });

  it("refuses a plain customer (owns no salon, no staff row) with the zero-state, not a role check", async () => {
    serverStub = withUser("customer-1", [
      ok(null), // oldest-owned salons lookup
      ok(null), // staff_members lookup, not staff anywhere
    ]);
    const { GET } = await import("@/app/api/dashboard/today/route");
    const req = new NextRequest("http://localhost/api/dashboard/today");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.avg_rating).toBe(0);
    expect(body.today_count).toBe(0);
  });
});

describe("POST /api/dashboard/batch (calendar whole-call gate + per-key finance check)", () => {
  it("a calendar-only staff member (the 'staff' preset) is refused revenue_month but a calendar key still succeeds", async () => {
    const salonId = "11111111-1111-4111-8111-111111111111";
    // bookings_today and walkin_queue call .gte()/.lte()/.in(), which the
    // shared makeQueryBuilder stub doesn't implement (see its header); "
    // reviews_pending" only uses .select()/.eq(), so it stands in as the
    // non-money, calendar-gated key here.
    serverStub = withUser("staff-1", [
      ok({ id: salonId, owner_id: "owner-1" }), // requireSalonAccess: salon lookup, not the owner
      ok({ id: "staff-row-1", permissions: { calendar: true } }), // requireSalonAccess: staff_members, calendar:true grants the whole-call gate
      ok({ role: "customer" }),
      ok({ permissions: { calendar: true } }), // batch route's own finance re-check: staff_members by id, no finance grant
      ok(null), // reviews_pending's admin.from("reviews") count query
      ok(null), // reviews_pending's admin.from("review_replies") count query
    ]);
    const { POST } = await import("@/app/api/dashboard/batch/route");
    const req = new NextRequest("http://localhost/api/dashboard/batch", {
      method: "POST",
      body: JSON.stringify({ salonId, requests: ["reviews_pending", "revenue_month"] }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results.revenue_month).toEqual({ error: "NOT_AUTHORIZED_FOR_AREA" });
    expect(body.results.reviews_pending).toEqual({ count: 0 });
  });
});
