// tests/api/stripe/webhook.test.ts
//
// testing-release-11: app/api/stripe/webhook/route.ts is the highest-consequence
// untested route in the app (Stripe calls it async, no human in the loop to
// notice a wrong response). This is NOT full coverage of all ~14 event types,
// it targets the narrow, stated bar: (a) an invalid/missing signature is
// rejected before any DB write, and (b) the idempotency claim short-circuits a
// duplicate delivery before business logic runs, and (c) one event type (the
// simplest full state-transition case, payment_intent.canceled/tip) drives the
// DB to the correct terminal state. Pure-logic level, hand-stubbed db + mocked
// Stripe/env boundary, no network, mirrors tests/lib/bookings/issue-refund.test.ts.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { makeDbStub } from "../../helpers/supabase-stub";

const constructEventMock = vi.fn();
vi.mock("@/lib/stripe", () => ({
  stripe: { webhooks: { constructEvent: (...args: unknown[]) => constructEventMock(...args) } },
  getStripe: () => ({ webhooks: { constructEvent: (...args: unknown[]) => constructEventMock(...args) } }),
}));

let dbStub: ReturnType<typeof makeDbStub>;
vi.mock("@/lib/supabase", () => ({
  createAdminSupabaseClient: () => dbStub,
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ STRIPE_WEBHOOK_SECRET: "whsec_test", ADMIN_EMAIL: undefined }),
}));

const reportErrorMock = vi.fn(() => Promise.resolve());
vi.mock("@/lib/error-report", () => ({
  reportError: (...args: unknown[]) => reportErrorMock(...args),
}));

const sendEmailMock = vi.fn(() => Promise.resolve());
vi.mock("@/lib/email", () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
  bookingConfirmation: vi.fn(),
}));

vi.mock("@/lib/posthog-server", () => ({
  trackServerEvent: vi.fn(),
}));

import { POST } from "@/app/api/stripe/webhook/route";

function makeRequest(body: string, sig: string | null = "t=1,v1=fake") {
  return new NextRequest("https://solen.ch/api/stripe/webhook", {
    method: "POST",
    headers: sig ? { "stripe-signature": sig } : {},
    body,
  });
}

beforeEach(() => {
  constructEventMock.mockReset();
  reportErrorMock.mockClear();
  sendEmailMock.mockClear();
  dbStub = makeDbStub([]);
});

describe("webhook signature verification", () => {
  it("rejects a missing stripe-signature header with 400, before any DB client is touched", async () => {
    const res = await POST(makeRequest("{}", null));
    expect(res.status).toBe(400);
    expect(constructEventMock).not.toHaveBeenCalled();
    expect(dbStub.from).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature with 400 and never claims/writes to the DB", async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature for payload");
    });
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(400);
    expect(dbStub.from).not.toHaveBeenCalled();
    expect(reportErrorMock).toHaveBeenCalledWith(
      "stripe-webhook-signature",
      expect.any(Error),
      expect.objectContaining({ requestId: expect.any(String) }),
    );
  });
});

describe("webhook idempotency claim", () => {
  it("short-circuits a duplicate delivery (23505 unique_violation) to { received: true } without running the event's business logic", async () => {
    dbStub = makeDbStub([{ data: null, error: { message: "duplicate key", code: "23505" } }]);
    constructEventMock.mockReturnValue({
      id: "evt_dup_1",
      type: "payment_intent.canceled",
      data: { object: { id: "pi_dup", metadata: { type: "tip" } } },
    });

    const res = await POST(makeRequest("{}"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ received: true });
    // Exactly one .from() call: the idempotency claim insert. The tip-status
    // update branch (a second .from("tips") call) must never fire.
    expect(dbStub.from).toHaveBeenCalledTimes(1);
    expect(dbStub.from).toHaveBeenCalledWith("processed_webhook_events");
  });
});

describe("payment_intent.canceled (tip) drives the correct terminal state", () => {
  it("flips a canceled tip PI's row to status='failed', scoped to that PI and not already-paid", async () => {
    dbStub = makeDbStub([
      { data: null, error: null }, // idempotency claim succeeds
      { data: null, error: null }, // tips update
    ]);
    constructEventMock.mockReturnValue({
      id: "evt_pi_canceled_1",
      type: "payment_intent.canceled",
      data: { object: { id: "pi_tip_1", metadata: { type: "tip" } } },
    });

    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(200);

    expect(dbStub.from).toHaveBeenNthCalledWith(1, "processed_webhook_events");
    expect(dbStub.from).toHaveBeenNthCalledWith(2, "tips");

    const tipsBuilder = dbStub.from.mock.results[1].value;
    expect(tipsBuilder.update).toHaveBeenCalledWith({ status: "failed" });
    expect(tipsBuilder.eq).toHaveBeenCalledWith("stripe_payment_intent_id", "pi_tip_1");
    expect(tipsBuilder.neq).toHaveBeenCalledWith("status", "paid");
  });
});
