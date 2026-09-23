// tests/api/bookings/decline.test.ts
//
// POST /api/bookings/[id]/decline (salon owner declines a manual-approval request) and the
// shared releasePendingApproval helper the 24h pending-timeout cron also uses. Drives the real
// route and helper; the actor resolver, rate limit, Supabase, Stripe, refund chokepoint and
// email sender are stubbed.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { makeQueryBuilder } from "../../helpers/supabase-stub";

const sendEmailMock = vi.fn((_p: unknown) => Promise.resolve());
vi.mock("@/lib/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/email")>();
  return { ...actual, sendEmail: (p: unknown) => sendEmailMock(p) };
});
vi.mock("@/lib/ratelimit", () => ({ applyRateLimit: vi.fn(() => Promise.resolve(null)), bookingLimiter: {} }));
vi.mock("@/lib/bookings/authorize", () => ({ resolveBookingActor: vi.fn() }));

const refundMock = vi.fn((_a: unknown): Promise<unknown> => Promise.resolve({}));
vi.mock("@/lib/bookings/issue-refund", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/bookings/issue-refund")>();
  return { ...actual, issueRefund: (a: unknown) => refundMock(a) };
});
const alertMock = vi.fn((_s: string, _d: unknown) => Promise.resolve());
vi.mock("@/lib/alert-admin", () => ({ alertAdmin: (s: string, d: unknown) => alertMock(s, d) }));

const piRetrieve = vi.fn();
const piCancel = vi.fn(() => Promise.resolve({}));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ paymentIntents: { retrieve: piRetrieve, cancel: piCancel } }),
}));

// Table-aware admin stub: records every bookings update and whether the CAS matched.
let casMatches = true;
let updates: { table: string; values: unknown; eqs: [string, unknown][] }[] = [];
const FULL = {
  id: "b1",
  slot_id: "slot1",
  starts_at: "2026-10-01T10:00:00Z",
  payment_intent_id: "pi_1" as string | null,
  paid_amount: 12000,
  refunded_amount: 0,
  salons: { name: "Salon A" },
  services: { name_de: "Schnitt", name_en: "Cut" },
  profiles: { email: "c@example.ch", locale: "de" },
};
vi.mock("@/lib/supabase", () => ({
  createAdminSupabaseClient: () => ({
    from: (table: string) => {
      if (table === "bookings") {
        const b = makeQueryBuilder({ data: FULL, error: null });
        b.update = vi.fn((values: unknown) => {
          const entry = { table, values, eqs: [] as [string, unknown][] };
          updates.push(entry);
          const u = makeQueryBuilder({ data: null, error: null });
          // The CAS only "matches" when the helper actually filters on status=pending_approval.
          u.eq = vi.fn((col: string, val: unknown) => { entry.eqs.push([col, val]); return u; });
          u.maybeSingle = vi.fn(() => Promise.resolve({
            data: casMatches && entry.eqs.some(([c, v]) => c === "status" && v === "pending_approval") ? { id: "b1" } : null,
            error: null,
          }));
          return u;
        });
        return b;
      }
      if (table === "availability_slots") {
        const b = makeQueryBuilder({ data: null, error: null });
        b.update = vi.fn((values: unknown) => { updates.push({ table, values, eqs: [] }); return makeQueryBuilder({ data: null, error: null }); });
        return b;
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

async function call(actor: string | null, status: string) {
  const authorize = await import("@/lib/bookings/authorize");
  (authorize.resolveBookingActor as ReturnType<typeof vi.fn>).mockResolvedValue({
    actor, booking: { id: "b1", status }, userId: actor ? "u1" : null,
  });
  const { POST } = await import("@/app/api/bookings/[id]/decline/route");
  return POST(new NextRequest("http://localhost/api/bookings/b1/decline", { method: "POST" }), { params: Promise.resolve({ id: "b1" }) });
}

describe("POST /api/bookings/[id]/decline", () => {
  beforeEach(() => {
    casMatches = true; updates = []; FULL.payment_intent_id = "pi_1";
    sendEmailMock.mockClear(); refundMock.mockReset(); refundMock.mockResolvedValue({}); alertMock.mockClear(); piRetrieve.mockReset(); piCancel.mockClear();
  });

  it("refuses a customer (403) and an unknown requester (404) without touching the booking", async () => {
    expect((await call("customer", "pending_approval")).status).toBe(403);
    expect((await call(null, "pending_approval")).status).toBe(404);
    expect(updates).toHaveLength(0);
  });

  it("refuses a booking that is not pending_approval", async () => {
    const res = await call("salon", "confirmed");
    expect(res.status).toBe(400);
    expect(updates).toHaveLength(0);
  });

  it("declines, frees the slot, emails the customer and voids an uncaptured hold", async () => {
    piRetrieve.mockResolvedValue({ status: "requires_capture" });
    const res = await call("salon", "pending_approval");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(updates[0]).toMatchObject({ table: "bookings", values: { status: "cancelled", cancellation_reason: "salon_declined" } });
    expect(updates[1]).toMatchObject({ table: "availability_slots", values: { status: "available" } });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(updates[0].eqs).toContainEqual(["status", "pending_approval"]);
    expect(piCancel).toHaveBeenCalledWith("pi_1");
    expect(refundMock).not.toHaveBeenCalled();
    expect(alertMock).not.toHaveBeenCalled();
  });

  it("retries a refund once when another refund held the claim", async () => {
    const { RefundError } = await import("@/lib/bookings/issue-refund");
    piRetrieve.mockResolvedValue({ status: "succeeded" });
    refundMock.mockRejectedValueOnce(new RefundError("CONCURRENT_RETRY"));
    const res = await call("salon", "pending_approval");
    expect(await res.json()).toEqual({ ok: true });
    expect(refundMock).toHaveBeenCalledTimes(2);
    expect(alertMock).not.toHaveBeenCalled();
  });

  it("alerts an admin when a captured payment cannot be refunded (cancelled but still charged)", async () => {
    const { RefundError } = await import("@/lib/bookings/issue-refund");
    piRetrieve.mockResolvedValue({ status: "succeeded" });
    refundMock.mockRejectedValue(new RefundError("NOT_CAPTURED"));
    const res = await call("salon", "pending_approval");
    expect(await res.json()).toEqual({ ok: true, paymentReleaseFailed: true });
    expect(refundMock).toHaveBeenCalledTimes(1);
    expect(alertMock).toHaveBeenCalledWith("Pending-request money release failed", expect.objectContaining({ bookingId: "b1", actor: "salon" }));
  });

  it("refunds the remainder through the chokepoint when the payment was already captured", async () => {
    piRetrieve.mockResolvedValue({ status: "succeeded" });
    await call("salon", "pending_approval");
    expect(piCancel).not.toHaveBeenCalled();
    expect(refundMock).toHaveBeenCalledWith(expect.objectContaining({ id: "b1", amountCents: 12000, actor: "salon" }));
  });

  it("returns 409 and releases nothing when the booking changed concurrently", async () => {
    casMatches = false;
    const res = await call("salon", "pending_approval");
    expect(res.status).toBe(409);
    expect(updates).toHaveLength(1); // only the failed CAS attempt
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(piRetrieve).not.toHaveBeenCalled();
  });

  it("reports a failed money release instead of silent success", async () => {
    piRetrieve.mockRejectedValue(new Error("stripe down"));
    const res = await call("salon", "pending_approval");
    expect(await res.json()).toEqual({ ok: true, paymentReleaseFailed: true });
    expect(alertMock).toHaveBeenCalledTimes(1);
  });
});
