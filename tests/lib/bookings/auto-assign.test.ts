// tests/lib/bookings/auto-assign.test.ts
//
// testing-release-09: auto-assign.ts picks which stylist an "any staff"
// booking lands on and enforces the per-stylist daily cap. It mutates which
// slot gets claimed (money follows the slot via claim-slot.ts's CAS), so a
// wrong pick either over-books a capped stylist or silently ignores the
// salon's configured limit. Pure-logic level, hand-stubbed db, no network.

import { describe, it, expect, vi } from "vitest";
import { countStaffBookingsOnDay, pickSlotForAnyStaff } from "@/lib/bookings/auto-assign";

/** Chainable query-builder stub matching the calls auto-assign.ts makes
 *  (select/eq/gte/lte/in/order/limit), resolving to a scripted result. */
function makeQueryBuilder(result: { data?: unknown; count?: number; error?: unknown }) {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    lte: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => Promise.resolve(result)),
    then: (onFulfilled: any, onRejected: any) => Promise.resolve(result).then(onFulfilled, onRejected),
  };
  return builder;
}

function makeDb(results: Array<{ data?: unknown; count?: number; error?: unknown }>) {
  let i = 0;
  const from = vi.fn(() => {
    if (i >= results.length) throw new Error(`makeDb: .from() called more times than the ${results.length} scripted results`);
    return makeQueryBuilder(results[i++]);
  });
  return { from };
}

const slot = (id: string, staffId: string | null) => ({ id, staff_member_id: staffId, starts_at: "2026-08-01T09:00:00Z" });

describe("countStaffBookingsOnDay", () => {
  it("returns the count from a head:true query", async () => {
    const db = makeDb([{ count: 3 }]);
    const result = await countStaffBookingsOnDay(db as any, "salon-1", "staff-1", "2026-08-01");
    expect(result).toBe(3);
  });

  it("returns 0 when count is null (no matching rows)", async () => {
    const db = makeDb([{ count: undefined }]);
    const result = await countStaffBookingsOnDay(db as any, "salon-1", "staff-1", "2026-08-01");
    expect(result).toBe(0);
  });
});

describe("pickSlotForAnyStaff", () => {
  it("returns null immediately for an empty candidate list", async () => {
    const db = makeDb([]);
    const result = await pickSlotForAnyStaff(db as any, [], { method: "least_busy", dailyLimitOn: false, dailyLimit: 5, salonId: "s-1", day: "2026-08-01" });
    expect(result).toBeNull();
  });

  it("returns the first candidate when no slot carries a staff_member_id (unstaffed)", async () => {
    const db = makeDb([]);
    const candidates = [slot("slot-1", null), slot("slot-2", null)];
    const result = await pickSlotForAnyStaff(db as any, candidates, { method: "least_busy", dailyLimitOn: false, dailyLimit: 5, salonId: "s-1", day: "2026-08-01" });
    expect(result).toBe(candidates[0]);
  });

  it("least_busy: picks the stylist with the fewest active bookings that day", async () => {
    const db = makeDb([
      { data: [{ staff_member_id: "busy" }, { staff_member_id: "busy" }, { staff_member_id: "quiet" }] }, // day counts: busy=2, quiet=1
    ]);
    const candidates = [slot("slot-busy", "busy"), slot("slot-quiet", "quiet")];
    const result = await pickSlotForAnyStaff(db as any, candidates, { method: "least_busy", dailyLimitOn: false, dailyLimit: 5, salonId: "s-1", day: "2026-08-01" });
    expect(result?.staff_member_id).toBe("quiet");
  });

  it("daily limit: drops a capped stylist and picks the one still under the cap", async () => {
    const db = makeDb([
      { data: [{ staff_member_id: "capped" }, { staff_member_id: "capped" }] }, // capped has 2 bookings, limit=2 -> excluded
    ]);
    const candidates = [slot("slot-capped", "capped"), slot("slot-free", "free")];
    const result = await pickSlotForAnyStaff(db as any, candidates, { method: "manual", dailyLimitOn: true, dailyLimit: 2, salonId: "s-1", day: "2026-08-01" });
    expect(result?.staff_member_id).toBe("free");
  });

  it("daily limit: returns null when EVERY candidate stylist is capped (caller must reject the booking)", async () => {
    const db = makeDb([
      { data: [{ staff_member_id: "a" }, { staff_member_id: "a" }, { staff_member_id: "b" }, { staff_member_id: "b" }] },
    ]);
    const candidates = [slot("slot-a", "a"), slot("slot-b", "b")];
    const result = await pickSlotForAnyStaff(db as any, candidates, { method: "manual", dailyLimitOn: true, dailyLimit: 2, salonId: "s-1", day: "2026-08-01" });
    expect(result).toBeNull();
  });

  it("round_robin: picks the least-recently-assigned stylist (never-booked sorts first)", async () => {
    const db = makeDb([
      { data: [] }, // day counts (no daily limit configured, still queried)
      { data: [{ staff_member_id: "recent", starts_at: "2026-07-30T10:00:00Z" }] }, // "fresh" never appears -> sorts first
    ]);
    const candidates = [slot("slot-recent", "recent"), slot("slot-fresh", "fresh")];
    const result = await pickSlotForAnyStaff(db as any, candidates, { method: "round_robin", dailyLimitOn: false, dailyLimit: 5, salonId: "s-1", day: "2026-08-01" });
    expect(result?.staff_member_id).toBe("fresh");
  });

  it("falls back to the first candidate on a thrown/rejected query (never blocks an otherwise-valid booking)", async () => {
    const db = { from: vi.fn(() => { throw new Error("db exploded"); }) };
    const candidates = [slot("slot-1", "a"), slot("slot-2", "b")];
    const result = await pickSlotForAnyStaff(db as any, candidates, { method: "least_busy", dailyLimitOn: false, dailyLimit: 5, salonId: "s-1", day: "2026-08-01" });
    expect(result).toBe(candidates[0]);
  });
});
