// tests/api/staff/admin-client-scoping.test.ts
//
// R3b: requireSalonAccess/getActiveSalon-area gate the STAFF routes correctly
// (permission-gate.test.ts proves that), but the routes then read/wrote the
// gated tables through the SESSION-scoped Supabase client, and the RLS on
// those tables (staff_manage_owner, breaks_owner_manage, timeoff_owner_manage,
// staff_services_salon_write, bookings_select_own) is owner-only. A granted
// staff caller passed the gate and then hit empty lists (RLS silently filters
// rows) or a 500 (RLS blocks the write). Fix: the resource read/write itself
// now goes through the admin (service-role) client, still scoped by the
// gated salon id.
//
// This test proves the fix for one route in each direction (a getActiveSalon
// composed GET), asserting the SESSION client never reaches the resource
// table at all: only the admin client is queried for staff_time_off.

import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { makeQueryBuilder, type StubResult } from "../../helpers/supabase-stub";

vi.mock("@/lib/ratelimit", () => ({
  applyRateLimit: vi.fn(() => Promise.resolve(null)),
  generalLimiter: {},
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

function ok<T>(data: T): StubResult<T> {
  return { data, error: null };
}

// One .from(table) call, one scripted result, consumed strictly in call
// order; throws if called past the scripted sequence or if it's the wrong
// client (each client gets its own tracker below).
function makeFromStub(results: StubResult[], label: string) {
  let i = 0;
  return vi.fn((table: string) => {
    if (i >= results.length) {
      throw new Error(`${label}: .from("${table}") called past the ${results.length} scripted results`);
    }
    return makeQueryBuilder(results[i++]);
  });
}

let sessionFrom: ReturnType<typeof makeFromStub>;
let adminFrom: ReturnType<typeof makeFromStub>;

vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: () => Promise.resolve({ data: { user: { id: "staff-1" } } }) },
      from: (table: string) => sessionFrom(table),
    })
  ),
  createAdminSupabaseClient: vi.fn(() => ({
    from: (table: string) => adminFrom(table),
  })),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: () => undefined })),
}));

describe("GET /api/staff/time-off (getActiveSalon-area composed)", () => {
  it("a schedule:true, owner-less staff caller reads the salon's time-off rows through the admin client; the session client is only ever asked to resolve the salon, never the table", async () => {
    // verify-auth-rollout fix: getActiveSalon/getActiveSalonId's OWN salon
    // resolution moved onto an admin client created inside them too
    // (salons_select_active is owner-only, same RLS trap as the resource
    // read this test was originally written to prove), so the route's
    // `supabase` argument is no longer read at all for that resolution:
    //   1. salons: oldest owned salon lookup -> none (this caller owns no salon)
    //   2. staff_members: area fallback -> salon-1, permissions.schedule = true
    //   3. salons: fetch the resolved salon row by id
    //   4. staff_time_off: the route's own resource read
    // all four now run on the admin client; the route's selfStaff fallback
    // (session client) is skipped either way because `salon` resolves truthy.
    sessionFrom = makeFromStub([], "session");
    adminFrom = makeFromStub(
      [
        ok(null),
        ok({ salon_id: "salon-1", permissions: { schedule: true } }),
        ok({ id: "salon-1" }),
        ok([{ id: "timeoff-1", staff_member_id: "colleague-1", start_date: "2026-10-01", end_date: "2026-10-02" }]),
      ],
      "admin"
    );

    const { GET } = await import("@/app/api/staff/time-off/route");
    const req = new NextRequest("http://localhost/api/staff/time-off");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].id).toBe("timeoff-1");

    // Session client is never consulted at all now.
    expect(sessionFrom).toHaveBeenCalledTimes(0);

    // Admin client resolves the salon AND reads staff_time_off.
    expect(adminFrom).toHaveBeenCalledTimes(4);
    expect(adminFrom.mock.calls.map((c) => c[0])).toEqual(["salons", "staff_members", "salons", "staff_time_off"]);
  });
});
