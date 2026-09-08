// tests/api/staff/close-slots-on-deactivate.test.ts
//
// Reviewer-found bug (pre-existing): deactivating a staff member (PATCH /api/staff/[id] with
// is_active:false, or DELETE) never touched the availability_slots the generator had already
// written for them, so a customer with a stale link (or a slot list already loaded) could still
// book a stylist who no longer takes appointments. The nightly generator already skips
// is_active:false staff (app/api/cron/generate-slots/route.ts:34,78); the gap was only the
// already-generated future rows. Fix reuses the existing status:'blocked' mechanism (the nightly
// capacity limiter and the walk-in chair block both already use it) with block_reason:'system',
// the codebase's existing "we did this, not the owner, nothing auto-reverts it" bucket.
//
// Same stub pattern as permission-areas.test.ts: a scripted, in-order .from() queue shared by
// both the admin and session clients (createAdminSupabaseClient and createServerSupabaseClient
// both resolve to the same stub here).

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

// Same shape as permission-areas.test.ts's makeFromStub, plus it records every builder it
// hands out (in call order) so a test can inspect the exact .eq()/.gte()/.update() calls made
// on a specific one (e.g. the availability_slots call).
function makeFromStub(results: StubResult[]) {
  let i = 0;
  const builders: ReturnType<typeof makeQueryBuilder>[] = [];
  const tables: string[] = [];
  return {
    builders,
    tables,
    from: (table: string) => {
      if (i >= results.length) {
        throw new Error(`makeFromStub: .from("${table}") called past the ${results.length} scripted results`);
      }
      tables.push(table);
      const builder = makeQueryBuilder(results[i++]);
      builders.push(builder);
      return builder;
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
  const stub = makeFromStub(fromResults);
  return {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: userId } } }) },
    ...stub,
  };
}

function patchRequest(body: unknown) {
  return new NextRequest("http://localhost/api/staff/staff-target", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function deleteRequest() {
  return new NextRequest("http://localhost/api/staff/staff-target", { method: "DELETE" });
}

beforeEach(() => {
  cookieValue = null;
});

describe("PATCH /api/staff/[id] closes future slots on is_active:false", () => {
  it("(a) is_active:false updates the staff row then closes its future available slots, scoped by staff_member_id + salon_id, status:blocked/block_reason:system", async () => {
    serverStub = withUser("owner-1", [
      ok({ id: "staff-target", salon_id: "salon-1", user_id: "someone-else" }), // target staff lookup
      ok({ id: "salon-1", owner_id: "owner-1" }), // salon lookup: caller IS the owner
      ok([{ id: "staff-target" }]), // the staff_members update call itself
      ok(null), // the new availability_slots bulk close
    ]);
    const { PATCH } = await import("@/app/api/staff/[id]/route");
    const res = await PATCH(patchRequest({ is_active: false }), { params: Promise.resolve({ id: "staff-target" }) });
    expect(res.status).toBe(200);

    expect(serverStub.tables).toEqual(["staff_members", "salons", "staff_members", "availability_slots"]);

    const slotsBuilder = serverStub.builders[3];
    expect(slotsBuilder.update).toHaveBeenCalledWith({ status: "blocked", block_reason: "system" });
    expect(slotsBuilder.eq).toHaveBeenCalledWith("staff_member_id", "staff-target");
    expect(slotsBuilder.eq).toHaveBeenCalledWith("salon_id", "salon-1");
    expect(slotsBuilder.eq).toHaveBeenCalledWith("status", "available");
    expect(slotsBuilder.gte).toHaveBeenCalledWith("starts_at", expect.any(String));
  });

  it("(b) a PATCH that does not touch is_active never queries availability_slots", async () => {
    serverStub = withUser("owner-1", [
      ok({ id: "staff-target", salon_id: "salon-1", user_id: "someone-else" }), // target staff lookup
      ok({ id: "salon-1", owner_id: "owner-1" }), // salon lookup: caller IS the owner
      ok([{ id: "staff-target" }]), // the staff_members update call itself
    ]);
    const { PATCH } = await import("@/app/api/staff/[id]/route");
    const res = await PATCH(patchRequest({ name: "New Name" }), { params: Promise.resolve({ id: "staff-target" }) });
    expect(res.status).toBe(200);

    expect(serverStub.tables).toEqual(["staff_members", "salons", "staff_members"]);
    expect(serverStub.tables).not.toContain("availability_slots");
  });

  it("(b2) is_active:true (re-activation) never queries availability_slots", async () => {
    serverStub = withUser("owner-1", [
      ok({ id: "staff-target", salon_id: "salon-1", user_id: "someone-else" }),
      ok({ id: "salon-1", owner_id: "owner-1" }),
      ok([{ id: "staff-target" }]),
    ]);
    const { PATCH } = await import("@/app/api/staff/[id]/route");
    const res = await PATCH(patchRequest({ is_active: true }), { params: Promise.resolve({ id: "staff-target" }) });
    expect(res.status).toBe(200);
    expect(serverStub.tables).not.toContain("availability_slots");
  });
});

describe("DELETE /api/staff/[id] closes future slots before the hard delete", () => {
  it("closes future available slots (staff_member_id + salon_id scoped) before deleting the staff row", async () => {
    serverStub = withUser("owner-1", [
      ok({ id: "staff-target", salon_id: "salon-1", user_id: "someone-else" }), // target staff lookup
      ok({ id: "salon-1", owner_id: "owner-1" }), // salon lookup: caller IS the owner
      ok(null), // the new availability_slots bulk close
      ok([{ id: "staff-target" }]), // the staff_members delete call itself
    ]);
    const { DELETE } = await import("@/app/api/staff/[id]/route");
    const res = await DELETE(deleteRequest(), { params: Promise.resolve({ id: "staff-target" }) });
    expect(res.status).toBe(200);

    expect(serverStub.tables).toEqual(["staff_members", "salons", "availability_slots", "staff_members"]);

    const slotsBuilder = serverStub.builders[2];
    expect(slotsBuilder.update).toHaveBeenCalledWith({ status: "blocked", block_reason: "system" });
    expect(slotsBuilder.eq).toHaveBeenCalledWith("staff_member_id", "staff-target");
    expect(slotsBuilder.eq).toHaveBeenCalledWith("salon_id", "salon-1");
    expect(slotsBuilder.eq).toHaveBeenCalledWith("status", "available");
  });

  it("a slot-close failure returns 500 and never runs the staff_members delete (ON DELETE SET NULL would otherwise orphan the still-available slots)", async () => {
    serverStub = withUser("owner-1", [
      ok({ id: "staff-target", salon_id: "salon-1", user_id: "someone-else" }), // target staff lookup
      ok({ id: "salon-1", owner_id: "owner-1" }), // salon lookup: caller IS the owner
      { data: null, error: { message: "db unavailable" } }, // the availability_slots close FAILS
    ]);
    const { DELETE } = await import("@/app/api/staff/[id]/route");
    const res = await DELETE(deleteRequest(), { params: Promise.resolve({ id: "staff-target" }) });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("db unavailable");

    // Only the staff lookup, the salon lookup and the failed slot close ran; the
    // staff_members delete must never be reached on this path.
    expect(serverStub.tables).toEqual(["staff_members", "salons", "availability_slots"]);
    const deleteCalls = serverStub.builders
      .filter((b: any, idx: number) => serverStub.tables[idx] === "staff_members")
      .map((b: any) => b.delete.mock.calls.length)
      .reduce((a: number, b: number) => a + b, 0);
    expect(deleteCalls).toBe(0);
  });
});
