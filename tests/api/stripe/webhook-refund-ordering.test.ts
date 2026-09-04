// tests/api/stripe/webhook-refund-ordering.test.ts
//
// cron-health SLICE stripe-refunds (a): app/api/stripe/webhook/route.ts's
// charge.refunded handler recomputes salon_payouts.gross_amount from the
// CHARGE's own cumulative amount_refunded on every delivery. Stripe does not
// guarantee delivery order, so an older event (smaller amount_refunded, i.e.
// a HIGHER remaining gross) can arrive AFTER a newer one already lowered
// gross_amount. This proves the ordering guard (a gte("gross_amount", ...)
// watermark on the UPDATE's WHERE clause) actually blocks that revert, using
// a small in-memory fake that applies filter predicates for real (the
// project's generic scripted-response stub in tests/helpers/supabase-stub.ts
// can't express "this write is rejected because the row no longer matches",
// it always resolves to whatever result was scripted regardless of the
// filters called), not just asserting on mock call arguments.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const constructEventMock = vi.fn();
vi.mock("@/lib/stripe", () => ({
  stripe: { webhooks: { constructEvent: (...args: unknown[]) => constructEventMock(...args) } },
  getStripe: () => ({ webhooks: { constructEvent: (...args: unknown[]) => constructEventMock(...args) } }),
}));

type PayoutRow = {
  id: string;
  gross_amount: number;
  commission_percent: number;
  commission_amount: number;
  net_amount: number;
  stripe_payment_intent_id: string;
};

// One in-memory salon_payouts row, filtered for real: .eq()/.gte() narrow a
// working set the same way Postgres's WHERE clause would; .update() only
// commits if the row survived every filter, so a guard failure is a genuine
// no-op, not just an unchecked call.
let payoutRow: PayoutRow;

function makeSalonPayoutsBuilder() {
  let working: PayoutRow[] = [payoutRow];
  let pendingUpdate: Partial<PayoutRow> | null = null;
  const builder: any = {
    select: vi.fn(() => builder),
    update: vi.fn((patch: Partial<PayoutRow>) => {
      pendingUpdate = patch;
      return builder;
    }),
    eq: vi.fn((col: keyof PayoutRow, val: unknown) => {
      working = working.filter((r) => r[col] === val);
      return builder;
    }),
    gte: vi.fn((col: keyof PayoutRow, val: number) => {
      working = working.filter((r) => (r[col] as number) >= val);
      return builder;
    }),
    maybeSingle: vi.fn(() => {
      if (pendingUpdate) {
        const matched = working.length > 0;
        if (matched) Object.assign(payoutRow, pendingUpdate);
        return Promise.resolve({ data: matched ? { id: payoutRow.id } : null, error: null });
      }
      return Promise.resolve({ data: working[0] ?? null, error: null });
    }),
  };
  return builder;
}

let dbStub: any;
vi.mock("@/lib/supabase", () => ({
  createAdminSupabaseClient: () => dbStub,
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ STRIPE_WEBHOOK_SECRET: "whsec_test", ADMIN_EMAIL: undefined }),
}));

vi.mock("@/lib/error-report", () => ({
  reportError: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(() => Promise.resolve()),
  bookingConfirmation: vi.fn(),
}));

vi.mock("@/lib/posthog-server", () => ({
  trackServerEvent: vi.fn(),
}));

import { POST } from "@/app/api/stripe/webhook/route";

function makeRequest(body: string) {
  return new NextRequest("https://solen.ch/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": "t=1,v1=fake" },
    body,
  });
}

function refundedEvent(id: string, amount: number, amountRefunded: number, paymentIntent: string) {
  return {
    id,
    type: "charge.refunded",
    data: { object: { payment_intent: paymentIntent, amount, amount_refunded: amountRefunded } },
  };
}

beforeEach(() => {
  constructEventMock.mockReset();
  payoutRow = {
    id: "payout-1",
    gross_amount: 100,
    commission_percent: 15,
    commission_amount: 15,
    net_amount: 85,
    stripe_payment_intent_id: "pi_1",
  };
  dbStub = {
    from: vi.fn((table: string) => {
      if (table === "salon_payouts") return makeSalonPayoutsBuilder();
      if (table === "processed_webhook_events") {
        return { insert: vi.fn(() => Promise.resolve({ data: null, error: null })) };
      }
      throw new Error(`unexpected table in charge.refunded ordering test: ${table}`);
    }),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  };
});

describe("charge.refunded ordering guard", () => {
  it("applies a newer (larger cumulative refund) delivery, then rejects a stale out-of-order older one", async () => {
    // Event 2 (chronologically LATER): 40 Rappen cumulative refunded of a
    // 100 Rappen charge -> remaining gross 60 CHF-equivalent. Delivered FIRST.
    constructEventMock.mockReturnValueOnce(refundedEvent("evt_2", 100, 40, "pi_1"));
    let res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    expect(payoutRow.gross_amount).toBe(0.6); // (100-40)/100

    // Event 1 (chronologically EARLIER, stale): only 20 Rappen cumulative
    // refunded -> would compute remaining gross 0.8, HIGHER than the 0.6
    // already stored. Delivered SECOND (out of order).
    constructEventMock.mockReturnValueOnce(refundedEvent("evt_1", 100, 20, "pi_1"));
    res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);

    // MUST stay at 0.6: the stale event's higher computed gross must NOT
    // overwrite the newer, lower, correct value.
    expect(payoutRow.gross_amount).toBe(0.6);
    expect(payoutRow.commission_amount).toBe(0.09); // 0.6 * 15%, unchanged by the stale event
  });

  it("still applies a genuine duplicate redelivery of the SAME event as a no-op (idempotent, not blocked)", async () => {
    constructEventMock.mockReturnValueOnce(refundedEvent("evt_1", 100, 40, "pi_1"));
    await POST(makeRequest("{}"));
    expect(payoutRow.gross_amount).toBe(0.6);

    constructEventMock.mockReturnValueOnce(refundedEvent("evt_1_retry", 100, 40, "pi_1"));
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);
    expect(payoutRow.gross_amount).toBe(0.6); // unchanged, same value re-applied
  });
});
