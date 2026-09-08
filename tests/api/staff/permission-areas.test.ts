// tests/api/staff/permission-areas.test.ts
//
// P9-2 follow-up: permission-gate.test.ts proves requireSalonAccess() itself
// discriminates by area. This file proves ONE more real route handler, the
// route that actually WRITES staff_members.permissions/access_role
// (PATCH /api/staff/[id]), does the same, plus the one thing that route adds
// on top of the gate: a staff member (not the owner, not admin) may not use
// this endpoint to edit their own row, even when their own "team" grant is
// true. Same stub pattern as permission-gate.test.ts (a scripted, in-order
// .from() queue shared by both the admin and session clients, since
// createAdminSupabaseClient and createServerSupabaseClient both resolve to
// the same stub in these tests).

import { describe, it, expect, beforeEach, vi } from "vitest";
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

function patchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/staff/staff-target", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  cookieValue = null;
});

describe("PATCH /api/staff/[id] (team area, requireSalonAccess-composed)", () => {
  it("refuses a staff member whose permissions row has team:false, 403", async () => {
    serverStub = withUser("staff-1", [
      ok({ id: "staff-target", salon_id: "salon-1", user_id: "someone-else" }), // target staff lookup
      ok({ id: "salon-1", owner_id: "owner-1" }), // salon lookup: not the owner
      ok({ id: "staff-row-1", permissions: { team: false } }), // caller's own staff_members row
      ok({ role: "customer" }),
    ]);
    const { PATCH } = await import("@/app/api/staff/[id]/route");
    const res = await PATCH(patchRequest({ name: "New Name" }), { params: Promise.resolve({ id: "staff-target" }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("NOT_AUTHORIZED_FOR_AREA");
  });

  it("lets the owner past the gate and applies the update", async () => {
    serverStub = withUser("owner-1", [
      ok({ id: "staff-target", salon_id: "salon-1", user_id: "someone-else" }), // target staff lookup
      ok({ id: "salon-1", owner_id: "owner-1" }), // salon lookup: this caller IS the owner
      ok([{ id: "staff-target" }]), // the update call itself
    ]);
    const { PATCH } = await import("@/app/api/staff/[id]/route");
    const res = await PATCH(patchRequest({ name: "New Name" }), { params: Promise.resolve({ id: "staff-target" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("refuses a staff member with team:true editing their OWN permissions row", async () => {
    serverStub = withUser("staff-1", [
      ok({ id: "staff-row-1", salon_id: "salon-1", user_id: "staff-1" }), // target staff lookup: this IS the caller's own row
      ok({ id: "salon-1", owner_id: "owner-1" }), // salon lookup: not the owner
      ok({ id: "staff-row-1", permissions: { team: true } }), // caller's own staff_members row: team granted
      ok({ role: "customer" }),
    ]);
    const { PATCH } = await import("@/app/api/staff/[id]/route");
    const res = await PATCH(patchRequest({ name: "New Name" }), { params: Promise.resolve({ id: "staff-row-1" }) });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe("CANNOT_EDIT_OWN_ACCESS");
  });
});
