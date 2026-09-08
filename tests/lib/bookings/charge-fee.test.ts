// tests/lib/bookings/charge-fee.test.ts
//
// Ring 5 money-path test: lib/bookings/charge-fee.ts (chargeFee). Pure-logic
// level, hand-stubbed db + mocked Stripe boundary (chargeOffSession) and
// alertAdmin, no network. Covers: guard branches (invalid amount, not found,
// already-settled short-circuit, no policy consent, no saved card), the
// charge-cap-to-paid-base money math, and the claim-first race outcome.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeDbStub, type StubResult } from "../../helpers/supabase-stub";

const stripeMock = vi.hoisted(() => ({ paymentIntents: {
  list: vi.fn(async () => ({ data: [], has_more: false })),
  retrieve: vi.fn(async () => ({ ...stripeMock.paymentIntents.create.mock.calls.at(-1)![0], id: "pi_new", status: "succeeded" })),
  create: vi.fn(async (params: any) => ({ ...params, id: "pi_new", status: "requires_payment_method", client_secret: "secret" })),
} }));
vi.mock("@/lib/stripe", () => ({ getStripe: () => stripeMock, toRappen: (value: number) => Math.round(value * 100) }));

vi.mock("@/lib/bookings/settle-fee-payment", () => ({ settleFeePayment: vi.fn(async () => ({status:"charged",alreadySettled:false})) }));

const chargeOffSessionMock = vi.fn();
vi.mock("@/lib/bookings/off-session-charge", () => ({
  chargeOffSession: (...args: unknown[]) => chargeOffSessionMock(...args),
}));

const alertAdminMock = vi.fn(() => Promise.resolve());
vi.mock("@/lib/alert-admin", () => ({
  alertAdmin: (...args: unknown[]) => alertAdminMock(...args),
}));

import { chargeFee, FeeError } from "@/lib/bookings/charge-fee";

const BOOKING_ID = "b-1";

function bookingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    payment_intent_id: "pi_1",
    paid_amount: 10000, // 100.00 CHF in Rappen
    price_paid: null,
    fee_charge_status: null,
    fee_charge_claimed_at: null,
    fee_charge_intent_id: null,
    fee_charge_kind: null,
    stripe_customer_id: "cus_1",
    stripe_payment_method_id: "pm_1",
    policy_accepted_at: "2026-01-01T00:00:00.000Z",
    salon_id: "s-1",
    salons: { stripe_account_id: "acct_1" },
    ...overrides,
  };
}

const SETTINGS_ROW: StubResult = { data: { value: { rate_percent: 15 } }, error: null };
const CLAIM_OK: StubResult = { data: { id: BOOKING_ID }, error: null };

beforeEach(() => {
  chargeOffSessionMock.mockReset();
  alertAdminMock.mockClear();
});

describe("chargeFee guard branches", () => {
  it("rejects a non-positive amount before touching the db", async () => {
    const db = makeDbStub([]);
    await expect(
      chargeFee({ db, source: "booking", id: BOOKING_ID, amountCents: 0, kind: "cancellation", actor: "system", reason: "x" }),
    ).rejects.toThrow(FeeError);
  });

  it("rejects a non-integer amount", async () => {
    const db = makeDbStub([]);
    await expect(
      chargeFee({ db, source: "booking", id: BOOKING_ID, amountCents: 12.5, kind: "cancellation", actor: "system", reason: "x" }),
    ).rejects.toMatchObject({ code: "INVALID_AMOUNT" });
  });

  it("throws BOOKING_NOT_FOUND when the fetch returns no row", async () => {
    const db = makeDbStub([{ data: null, error: { message: "not found" } }]);
    await expect(
      chargeFee({ db, source: "booking", id: BOOKING_ID, amountCents: 100, kind: "cancellation", actor: "system", reason: "x" }),
    ).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND" });
  });

  it("short-circuits to 'charged' when fee_charge_status is already 'charged' (idempotency)", async () => {
    const db = makeDbStub([{ data: bookingRow({ fee_charge_status: "charged" }), error: null }]);
    const result = await chargeFee({
      db, source: "booking", id: BOOKING_ID, amountCents: 100, kind: "no_show", actor: "system", reason: "x",
    });
    expect(result).toEqual({ status: "charged", paymentIntentId: undefined });
    expect(chargeOffSessionMock).not.toHaveBeenCalled();
  });

  it("throws POLICY_NOT_ACCEPTED when the customer never consented (Lane A gate)", async () => {
    const db = makeDbStub([{ data: bookingRow({ policy_accepted_at: null }), error: null }]);
    await expect(
      chargeFee({ db, source: "booking", id: BOOKING_ID, amountCents: 100, kind: "cancellation", actor: "system", reason: "x" }),
    ).rejects.toMatchObject({ code: "POLICY_NOT_ACCEPTED" });
    expect(chargeOffSessionMock).not.toHaveBeenCalled();
  });

  it("throws NO_SAVED_CARD when the SP-G2 card is missing", async () => {
    const db = makeDbStub([{ data: bookingRow({ stripe_customer_id: null }), error: null }]);
    await expect(
      chargeFee({ db, source: "booking", id: BOOKING_ID, amountCents: 100, kind: "cancellation", actor: "system", reason: "x" }),
    ).rejects.toMatchObject({ code: "NO_SAVED_CARD" });
  });

  it("rejects source='walkin' (D10 not implemented)", async () => {
    const db = makeDbStub([]);
    await expect(
      chargeFee({ db, source: "walkin", id: BOOKING_ID, amountCents: 100, kind: "cancellation", actor: "system", reason: "x" }),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_SOURCE" });
  });
});

describe("chargeFee money math", () => {
  it("caps the charge at the paid base when amountCents exceeds it", async () => {
    const db = makeDbStub([
      { data: bookingRow({ paid_amount: 5000 }), error: null }, // fetch: paid 50.00 CHF
      CLAIM_OK,
      SETTINGS_ROW,
      CLAIM_OK,
      { data: { id: BOOKING_ID }, error: null }, // casUpdate write
    ]);
    chargeOffSessionMock.mockResolvedValue({ status: "charged", paymentIntentId: "pi_new", chargedCents: 5000 });

    const result = await chargeFee({
      db, source: "booking", id: BOOKING_ID, amountCents: 9999, kind: "no_show", actor: "system", reason: "x",
    });

    expect(result.status).toBe("charged");
    expect(result.chargedCents).toBe(5000); // capped, not 9999
    const call = chargeOffSessionMock.mock.calls[0][0];
    expect(call.amountCents).toBe(5000);
    expect(call.applicationFeeCents).toBe(750); // 15% of 5000
  });

  it("charges the full amountCents when it is under the paid base, at the resolved commission rate", async () => {
    const db = makeDbStub([
      { data: bookingRow({ paid_amount: 10000 }), error: null },
      CLAIM_OK,
      SETTINGS_ROW,
      CLAIM_OK,
      { data: { id: BOOKING_ID }, error: null }, // casUpdate write
    ]);
    chargeOffSessionMock.mockResolvedValue({ status: "charged", paymentIntentId: "pi_new", chargedCents: 3000 });

    const result = await chargeFee({
      db, source: "booking", id: BOOKING_ID, amountCents: 3000, kind: "cancellation", actor: "system", reason: "x",
    });

    expect(result.chargedCents).toBe(3000);
    const call = chargeOffSessionMock.mock.calls[0][0];
    expect(call.applicationFeeCents).toBe(450); // 15% of 3000
  });

  it("falls back to DEFAULT_COMMISSION_RATE_PERCENT (15) when platform_settings has no commission row", async () => {
    const db = makeDbStub([
      { data: bookingRow({ paid_amount: 10000 }), error: null },
      CLAIM_OK,
      { data: null, error: null }, // absent settings row uses the existing default
      CLAIM_OK,
      { data: { id: BOOKING_ID }, error: null }, // casUpdate write
    ]);
    chargeOffSessionMock.mockResolvedValue({ status: "charged", paymentIntentId: "pi_new", chargedCents: 1000 });

    await chargeFee({
      db, source: "booking", id: BOOKING_ID, amountCents: 1000, kind: "cancellation", actor: "system", reason: "x",
    });

    const call = chargeOffSessionMock.mock.calls[0][0];
    expect(call.applicationFeeCents).toBe(150); // 15% default
  });

  it("returns 'requires_action' on SCA without charging chargedCents", async () => {
    const db = makeDbStub([
      { data: bookingRow(), error: null },
      CLAIM_OK,
      SETTINGS_ROW,
      CLAIM_OK,
      { data: { id: BOOKING_ID }, error: null }, // casUpdate write
    ]);
    chargeOffSessionMock.mockResolvedValue({ status: "requires_action", paymentIntentId: "pi_park", clientSecret: "secret" });

    const result = await chargeFee({
      db, source: "booking", id: BOOKING_ID, amountCents: 1000, kind: "no_show", actor: "system", reason: "x",
    });

    expect(result.status).toBe("requires_action");
    expect(result.chargedCents).toBeUndefined();
    expect(result.clientSecret).toBe("secret");
  });
});

describe("chargeFee claim-first race guard", () => {
  it("reports a pending system outcome without confirming Stripe when the claim CAS matches 0 rows", async () => {
    const db = makeDbStub([
      { data: bookingRow(), error: null }, // fetch
      { data: null, error: null }, // claim UPDATE matched 0 rows (lost the race)
      { data: { fee_charge_status: "charged" }, error: null }, // refetch after losing
    ]);

    const result = await chargeFee({
      db, source: "booking", id: BOOKING_ID, amountCents: 1000, kind: "cancellation", actor: "system", reason: "x",
    });

    expect(result).toMatchObject({ status: "failed", declined: false });
    expect(chargeOffSessionMock).not.toHaveBeenCalled();
  });
});
