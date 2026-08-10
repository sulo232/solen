// tests/lib/bookings/claim-slot.test.ts
//
// testing-release-09: claim-slot.ts is the single CAS chokepoint every
// booking-write path (create, reschedule, express-rebook, recurring) shares
// to guard against double-booking a slot. It mutates booking/slot state, so
// it belongs in the same money-path tier as the already-tested lib/bookings
// files even though it doesn't move money directly (losing the race means a
// customer pays for a slot someone else already has).

import { describe, it, expect, vi } from "vitest";
import { claimSlot } from "@/lib/bookings/claim-slot";

function makeAdminStub(result: { data: unknown; error: unknown }) {
  const builder: any = {
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    select: vi.fn(() => Promise.resolve(result)),
  };
  return { admin: { from: vi.fn(() => builder) }, builder };
}

describe("claimSlot", () => {
  it("reports claimed=true and applies status:'booked' plus extra fields when the row updates (won the race)", async () => {
    const { admin, builder } = makeAdminStub({ data: [{ id: "slot-1" }], error: null });

    const result = await claimSlot(admin as any, "slot-1", { booking_id: "b-1" });

    expect(result).toEqual({ claimed: true, error: null });
    expect(builder.update).toHaveBeenCalledWith({ status: "booked", booking_id: "b-1" });
    expect(builder.eq).toHaveBeenNthCalledWith(1, "id", "slot-1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "status", "available");
  });

  it("reports claimed=false when 0 rows match (already claimed by a concurrent request)", async () => {
    const { admin } = makeAdminStub({ data: [], error: null });

    const result = await claimSlot(admin as any, "slot-1");

    expect(result.claimed).toBe(false);
    expect(result.error).toBeNull();
  });

  it("reports claimed=false and surfaces the Postgrest error on a GIST exclusion violation (widened bundle window)", async () => {
    const pgError = { code: "23P01", message: "conflicting key value violates exclusion constraint" };
    const { admin } = makeAdminStub({ data: null, error: pgError });

    const result = await claimSlot(admin as any, "slot-1", { ends_at: "2026-08-01T10:00:00Z" });

    expect(result.claimed).toBe(false);
    expect(result.error).toEqual(pgError);
  });
});
