// tests/api/walkin/queue-youre-next-sms.test.ts
//
// cron-health SLICE walkin (c): barberYoureNextSMS existed in lib/email.ts
// with zero callers. app/api/walkin/queue/[id]/route.ts's PATCH handler now
// fires it, once, for whoever becomes the new front of the waiting line
// after a resequence, gated on the customer's notification_sms preference
// the same way app/api/cron/sms-reminders/route.ts does. This drives the
// REAL PATCH handler (not a re-implementation of its logic) with every
// Supabase `.from()` call scripted in the exact order the handler makes
// them (tests/helpers/supabase-stub.ts's makeFromSequence), so the assertion
// is on the actual imported function, not a mental model of it.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { makeQueryBuilder, type StubResult } from "../../helpers/supabase-stub";

vi.mock("@/lib/feature-flags", () => ({
  checkFeatureEnabled: vi.fn(() => Promise.resolve(null)),
  checkUserBanned: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/ratelimit", () => ({
  applyRateLimit: vi.fn(() => Promise.resolve(null)),
  generalLimiter: {},
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@/lib/validations", () => ({
  validateBody: vi.fn((_schema: unknown, body: unknown) => ({ data: body, error: null })),
  walkinUpdateSchema: {},
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(() => ({})),
}));

vi.mock("@/lib/cancellation-policy", () => ({
  calculateNoShowFee: vi.fn(() => ({ feeCents: 0 })),
}));

vi.mock("@/lib/bookings/notify-no-show-fee", () => ({
  notifyNoShowFee: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/walkin/authz", () => ({
  verifyTrackingToken: vi.fn(() => true),
}));

const sendSMSMock = vi.fn(() => Promise.resolve(true));
vi.mock("@/lib/sms", () => ({
  sendSMS: (...args: unknown[]) => sendSMSMock(...args),
}));

const barberYoureNextSMSMock = vi.fn((data: unknown, locale: unknown) => ({
  templateId: "barber-youre-next",
  data,
  locale,
}));
vi.mock("@/lib/email", () => ({
  barberYoureNextSMS: (...args: unknown[]) => (barberYoureNextSMSMock as any)(...args),
}));

// The queue entry every scenario starts from: "in_chair" so its own CAS
// re-asserts entry.status === "in_chair", per the audit fix, and it carries
// no payment_intent_id / assigned_barber_id so the Stripe capture branch and
// the chair-block branch both no-op cleanly and only the resequence + SMS
// path under test runs.
const ENTRY = {
  id: "queue-1",
  salon_id: "salon-1",
  status: "in_chair",
  payment_intent_id: null,
  assigned_barber_id: null,
  service_id: null,
  customer_id: null,
  customer_name: null,
  customer_phone: null,
};

function ok<T>(data: T): StubResult<T> {
  return { data, error: null };
}

// One .from(table) call, one scripted result, consumed strictly in the
// order the PATCH handler issues them for a "completed" transition with no
// linked payment and no assigned chair: entry, salon(owner), staffMember,
// CAS-update, prevFront, newFront, profile, salonRow(name).
function makeAdminStub(results: StubResult[]) {
  let i = 0;
  const from = vi.fn((table: string) => {
    if (i >= results.length) {
      throw new Error(`makeAdminStub: .from("${table}") called past the ${results.length} scripted results`);
    }
    return makeQueryBuilder(results[i++]);
  });
  return { from, rpc: vi.fn(() => Promise.resolve({ data: null, error: null })) } as any;
}

let adminStub: any;
vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({ auth: { getUser: () => Promise.resolve({ data: { user: { id: "owner-1" } } }) } })
  ),
  createAdminSupabaseClient: vi.fn(() => adminStub),
}));

function makeReq() {
  return new NextRequest("http://localhost/api/walkin/queue/queue-1", {
    method: "PATCH",
    body: JSON.stringify({ status: "completed" }),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  sendSMSMock.mockClear();
  barberYoureNextSMSMock.mockClear();
});

describe("walkin queue PATCH, you're-next SMS", () => {
  it("fires barberYoureNextSMS + sendSMS for the new front of the waiting line when SMS is allowed", async () => {
    adminStub = makeAdminStub([
      ok(ENTRY), // entry lookup
      ok({ owner_id: "owner-1" }), // salon (owner match, no staff-member lookup needed)
      ok(null), // staff_members (skipped by owner check, but the code still queries it)
      ok({ ...ENTRY, id: "queue-1", status: "completed" }), // CAS update result
      ok({ id: "prev-front-id" }), // prevFront (front of line before resequence)
      ok({ id: "next-front-id", customer_id: "cust-1", customer_name: "Maria Rossi", customer_phone: "+41791234567" }), // newFront
      ok({ notification_sms: true, locale: "it" }), // profiles
      ok({ name: "Barber Deluxe" }), // salons (name, for the SMS body)
    ]);

    const { PATCH } = await import("@/app/api/walkin/queue/[id]/route");
    const res = await PATCH(makeReq(), { params: Promise.resolve({ id: "queue-1" }) });
    expect(res.status).toBe(200);

    expect(barberYoureNextSMSMock).toHaveBeenCalledTimes(1);
    expect(barberYoureNextSMSMock).toHaveBeenCalledWith(
      { customerName: "Maria Rossi", salonName: "Barber Deluxe" },
      "it"
    );
    expect(sendSMSMock).toHaveBeenCalledTimes(1);
    expect(sendSMSMock).toHaveBeenCalledWith("+41791234567", {
      templateId: "barber-youre-next",
      data: { customerName: "Maria Rossi", salonName: "Barber Deluxe" },
      locale: "it",
    });
  });

  it("does not send when the customer's profile has notification_sms=false", async () => {
    adminStub = makeAdminStub([
      ok(ENTRY),
      ok({ owner_id: "owner-1" }),
      ok(null),
      ok({ ...ENTRY, id: "queue-1", status: "completed" }),
      ok({ id: "prev-front-id" }),
      ok({ id: "next-front-id", customer_id: "cust-1", customer_name: "Maria Rossi", customer_phone: "+41791234567" }),
      ok({ notification_sms: false, locale: "de" }), // opted out
      // no salons(name) lookup: the handler must short-circuit on smsAllowed=false
      // before reaching it, scripting nothing here means an extra .from() call
      // throws loudly instead of silently passing.
    ]);

    const { PATCH } = await import("@/app/api/walkin/queue/[id]/route");
    const res = await PATCH(makeReq(), { params: Promise.resolve({ id: "queue-1" }) });
    expect(res.status).toBe(200);

    expect(barberYoureNextSMSMock).not.toHaveBeenCalled();
    expect(sendSMSMock).not.toHaveBeenCalled();
  });
});
