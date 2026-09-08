// tests/api/staff/permission-gate.test.ts
//
// P9-2: the team screen lets an owner switch 8 permission areas per staff
// member (lib/staff-permissions.ts), but only "schedule" was ever checked.
// requireSalonAccess() (lib/auth/require.ts) is the general-purpose gate for
// the other 7 areas; this file proves it discriminates (refuses an area a
// staff row was not granted, allows one it was), that the owner path is
// unaffected, and that the same proof holds through the shared active-salon
// resolver (lib/active-salon.ts) and through one real route handler in each
// direction (a requireSalonAccess-composed route and a getActiveSalon-area
// composed route), not just the helper functions in isolation.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeQueryBuilder, type StubResult } from "../../helpers/supabase-stub";
import { PERMISSION_AREAS } from "@/lib/staff-permissions";

// app/api/salon/services/route.ts calls these two real modules before it ever
// reaches requireSalonAccess; both are mocked to no-op the same way
// tests/api/walkin/queue-youre-next-sms.test.ts mocks them, so they do not
// consume the scripted .from() sequence below or reach a real rate limiter.
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

describe("requireSalonAccess (lib/auth/require.ts)", () => {
  it("passes the owner on every one of the 8 permission areas", async () => {
    const { requireSalonAccess } = await import("@/lib/auth/require");
    for (const area of PERMISSION_AREAS.map((a) => a.key)) {
      serverStub = withUser("owner-1", [ok({ id: "salon-1", owner_id: "owner-1" })]);
      const result = await requireSalonAccess("salon-1", area);
      expect(result).not.toBeInstanceOf(Response);
      expect((result as any).via).toBe("owner");
    }
  });

  it("refuses a staff member on an area their permissions row has set to false", async () => {
    const { requireSalonAccess } = await import("@/lib/auth/require");
    serverStub = withUser("staff-1", [
      ok({ id: "salon-1", owner_id: "owner-1" }), // salon lookup: not the owner
      ok({ id: "staff-row-1", permissions: { calendar: true, finance: false } }), // staff_members
      ok({ role: "customer" }),
    ]);
    const result = await requireSalonAccess("salon-1", "finance");
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
    const body = await (result as Response).json();
    expect(body.code).toBe("NOT_AUTHORIZED_FOR_AREA");
  });

  it("allows the same staff member on an area their permissions row has set to true", async () => {
    const { requireSalonAccess } = await import("@/lib/auth/require");
    serverStub = withUser("staff-1", [
      ok({ id: "salon-1", owner_id: "owner-1" }),
      ok({ id: "staff-row-1", permissions: { calendar: true, finance: false } }),
      ok({ role: "customer" }),
    ]);
    const result = await requireSalonAccess("salon-1", "calendar");
    expect(result).not.toBeInstanceOf(Response);
    expect((result as any).via).toBe("staff");
    expect((result as any).staffId).toBe("staff-row-1");
  });

  it("refuses a staff row with no permissions at all, the same default the team screen shows", async () => {
    // app/[locale]/dashboard/staff/page.tsx's normalizePermissions(null) returns
    // {}, which renders every one of the 8 toggles OFF. hasPermission({}, area)
    // is false for every area, so the gate agrees with what the owner's own
    // screen displays: an absent permissions row grants nothing.
    const { requireSalonAccess } = await import("@/lib/auth/require");
    serverStub = withUser("staff-1", [
      ok({ id: "salon-1", owner_id: "owner-1" }),
      ok({ id: "staff-row-1", permissions: null }),
      ok({ role: "customer" }),
    ]);
    const result = await requireSalonAccess("salon-1", "clients");
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });

  it("passes a global admin on every area, when they are not the owner and have no staff row", async () => {
    const { requireSalonAccess } = await import("@/lib/auth/require");
    for (const area of PERMISSION_AREAS.map((a) => a.key)) {
      serverStub = withUser("admin-1", [
        ok({ id: "salon-1", owner_id: "owner-1" }), // salon lookup: not the owner
        ok(null), // staff_members: no row for this salon
        ok({ role: "admin" }), // profiles: global admin role
      ]);
      const result = await requireSalonAccess("salon-1", area);
      expect(result).not.toBeInstanceOf(Response);
      expect((result as any).via).toBe("admin");
    }
  });

  it("refuses a non-owner, non-staff caller whose profile role is not admin", async () => {
    const { requireSalonAccess } = await import("@/lib/auth/require");
    for (const role of ["salon_owner", null]) {
      serverStub = withUser("someone-1", [
        ok({ id: "salon-1", owner_id: "owner-1" }),
        ok(null), // staff_members: no row for this salon
        ok({ role }), // profiles: not admin
      ]);
      const result = await requireSalonAccess("salon-1", "finance");
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
      const body = await (result as Response).json();
      expect(body.code).toBe("NOT_AUTHORIZED_FOR_AREA");
    }
  });
});

// verify-auth-rollout fix: getActiveSalonId/getActiveSalon now run every
// lookup on an admin client CREATED INSIDE the function (same RLS trap as
// requireSalonAccess: salons_select_active would 404 a real staff caller out
// of an INACTIVE salon on the session client), so the first `supabase`
// argument is no longer read for these queries. The tests below now script
// the shared `serverStub` (this file's `createAdminSupabaseClient` mock
// resolves to it too) instead of building a standalone client and passing it
// in directly, since that client is no longer the one consulted.
describe("getActiveSalonId / getActiveSalon area fallback (lib/active-salon.ts)", () => {
  it("resolves the staff member's salon when the area is granted, for an owner-less caller", async () => {
    const { getActiveSalonId } = await import("@/lib/active-salon");
    serverStub = withUser("staff-1", [
      ok(null), // oldest owned salon: none, this caller is not an owner
      ok({ salon_id: "salon-1", permissions: { calendar: true, finance: false } }), // staff_members
    ]);
    const id = await getActiveSalonId(serverStub as any, "staff-1", "calendar");
    expect(id).toBe("salon-1");
  });

  it("resolves null when the area is not granted, for an owner-less caller", async () => {
    const { getActiveSalonId } = await import("@/lib/active-salon");
    serverStub = withUser("staff-1", [
      ok(null),
      ok({ salon_id: "salon-1", permissions: { calendar: true, finance: false } }),
    ]);
    const id = await getActiveSalonId(serverStub as any, "staff-1", "finance");
    expect(id).toBeNull();
  });

  it("never consults staff_members for an owner (owner path unchanged)", async () => {
    const { getActiveSalonId } = await import("@/lib/active-salon");
    // Only one scripted result: if the helper queried staff_members too, the
    // makeFromStub throw below would fire instead of returning cleanly.
    serverStub = withUser("owner-1", [ok({ id: "salon-1" })]);
    const id = await getActiveSalonId(serverStub as any, "owner-1", "finance");
    expect(id).toBe("salon-1");
  });

  it("never consults staff_members when area is omitted, for a non-owner caller", async () => {
    const { getActiveSalonId } = await import("@/lib/active-salon");
    serverStub = withUser("staff-1", [ok(null)]); // only the oldest-owned lookup is scripted; the stub throws on any further .from()
    const id = await getActiveSalonId(serverStub as any, "staff-1");
    expect(id).toBeNull();
  });

  // P9-2 follow-up (2026-09-05): area: "any" answers "which salon does this person belong to",
  // not "may they do X" (GET /api/profile needs the salon id itself for a granted staff member
  // regardless of which areas their row holds), so it must not gate on one specific permission.
  it('resolves the staff member\'s salon for area: "any" even when every permission is false', async () => {
    const { getActiveSalonId } = await import("@/lib/active-salon");
    serverStub = withUser("staff-1", [
      ok(null), // oldest owned salon: none, this caller is not an owner
      ok({ salon_id: "salon-1", permissions: { calendar: false, finance: false } }), // staff_members
    ]);
    const id = await getActiveSalonId(serverStub as any, "staff-1", "any");
    expect(id).toBe("salon-1");
  });

  it('resolves null for area: "any" when the caller has no active staff row anywhere', async () => {
    const { getActiveSalonId } = await import("@/lib/active-salon");
    serverStub = withUser("nobody-1", [
      ok(null), // oldest owned salon: none
      ok(null), // staff_members: no row at all
    ]);
    const id = await getActiveSalonId(serverStub as any, "nobody-1", "any");
    expect(id).toBeNull();
  });
});

describe("real route handlers discriminate by area", () => {
  it("GET /api/salon/services (catalog, requireSalonAccess-composed): refuses catalog:false, 403", async () => {
    serverStub = withUser("staff-1", [
      ok({ id: "salon-1", owner_id: "owner-1" }),
      ok({ id: "staff-row-1", permissions: { catalog: false } }),
      ok({ role: "customer" }),
    ]);
    const { GET } = await import("@/app/api/salon/services/route");
    const req = new NextRequest("http://localhost/api/salon/services?salon_id=salon-1");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("GET /api/salon/services (catalog, requireSalonAccess-composed): allows catalog:true, 200 with the services list", async () => {
    serverStub = withUser("staff-1", [
      ok({ id: "salon-1", owner_id: "owner-1" }),
      ok({ id: "staff-row-1", permissions: { catalog: true } }),
      ok({ role: "customer" }),
      ok([{ id: "svc-1", name_de: "Haarschnitt", name_en: "Haircut", duration_minutes: 30, price: 50, is_active: true }]),
    ]);
    const { GET } = await import("@/app/api/salon/services/route");
    const req = new NextRequest("http://localhost/api/salon/services?salon_id=salon-1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.services).toHaveLength(1);
  });

  it("GET /api/salon/earnings (finance, getActiveSalon-area-composed): a finance:false, owner-less staff member is refused the payout data", async () => {
    // This route resolves "the caller's active salon" (no salon_id param), so
    // there is no salon row to attach a 403 to when access is refused: refusal
    // and "this caller owns no salon" both fall through to the same
    // pre-existing 404 branch, exactly as they did for a non-owner before this
    // fix (the difference this fix makes is that a GRANTED staff member now
    // reaches the payout data at all, proven in the next test).
    serverStub = withUser("staff-1", [
      ok(null), // no owned salon
      ok({ salon_id: "salon-1", permissions: { finance: false } }), // staff_members
    ]);
    const { GET } = await import("@/app/api/salon/earnings/route");
    const req = new NextRequest("http://localhost/api/salon/earnings");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("GET /api/salon/earnings (finance, getActiveSalon-area-composed): a finance:true, owner-less staff member reaches the payout data", async () => {
    serverStub = withUser("staff-1", [
      ok(null),
      ok({ salon_id: "salon-1", permissions: { finance: true } }),
      ok({ id: "salon-1" }), // the salon row fetch inside getActiveSalon
      ok([]), // salon_payouts
    ]);
    const { GET } = await import("@/app/api/salon/earnings/route");
    const req = new NextRequest("http://localhost/api/salon/earnings");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
