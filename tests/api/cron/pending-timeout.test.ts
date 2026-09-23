// tests/api/cron/pending-timeout.test.ts
//
// The 24h pending-timeout cron after moving its release logic into releasePendingApproval:
// same reason string, system actor, and the lost-CAS row is not counted. Drives the real
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
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ CRON_SECRET: "secret" }) }));
vi.mock("@/lib/cron-auth", () => ({ verifyCronSecret: vi.fn(() => Promise.resolve(true)) }));
vi.mock("@/lib/cron-run", () => ({
  withCronRun: async (_name: string, fn: () => Promise<unknown>) => Response.json(await fn()),
}));

const refundMock = vi.fn((_a: unknown) => Promise.resolve({}));
vi.mock("@/lib/bookings/issue-refund", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/bookings/issue-refund")>();
  return { ...actual, issueRefund: (a: unknown) => refundMock(a) };
});
vi.mock("@/lib/alert-admin", () => ({ alertAdmin: vi.fn(() => Promise.resolve()) }));

const piRetrieve = vi.fn();
const piCancel = vi.fn(() => Promise.resolve({}));
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({ paymentIntents: { retrieve: piRetrieve, cancel: piCancel } }),
}));

// Table-aware admin stub: records every bookings update and whether the CAS matched.
let casMatches = true;
let updates: { table: string; values: unknown }[] = [];
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
        const b = makeQueryBuilder({ data: [FULL], error: null });
        b.update = vi.fn((values: unknown) => {
          updates.push({ table, values });
          return makeQueryBuilder({ data: casMatches ? { id: "b1" } : null, error: null });
        });
        return b;
      }
      if (table === "availability_slots") {
        const b = makeQueryBuilder({ data: null, error: null });
        b.update = vi.fn((values: unknown) => { updates.push({ table, values }); return makeQueryBuilder({ data: null, error: null }); });
        return b;
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

describe("GET /api/cron/pending-timeout", () => {
  beforeEach(() => { casMatches = true; updates = []; refundMock.mockClear(); piRetrieve.mockReset(); piCancel.mockClear(); });

  async function run() {
    const { GET } = await import("@/app/api/cron/pending-timeout/route");
    const res = await GET(new NextRequest("http://localhost/api/cron/pending-timeout", { headers: { authorization: "Bearer secret" } }));
    return res.json();
  }

  it("cancels a stale request with the timeout reason and refunds a captured payment as system", async () => {
    piRetrieve.mockResolvedValue({ status: "succeeded" });
    expect(await run()).toEqual({ cancelled: 1, processed: 1, errors: [] });
    expect(updates[0]).toMatchObject({ values: { status: "cancelled", cancellation_reason: "automatic_timeout_no_response" } });
    expect(refundMock).toHaveBeenCalledWith(expect.objectContaining({ actor: "system", reason: "automatic_timeout_no_response: PI already captured, refunding instead of cancel" }));
  });

  it("does not count a request the salon approved in the meantime", async () => {
    casMatches = false;
    expect(await run()).toEqual({ cancelled: 0, processed: 0, errors: [] });
    expect(piRetrieve).not.toHaveBeenCalled();
  });
});
