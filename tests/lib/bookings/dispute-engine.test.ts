// tests/lib/bookings/dispute-engine.test.ts
//
// Ring 5 money-path test: lib/bookings/dispute-engine.ts. Two surfaces:
// 1. resolveEligibility / reasonAllowedOnConfirmed: pure functions, no
//    mocking needed.
// 2. chargeUpcharge: the money executor. Hand-stubbed db + mocked Stripe
//    boundary (chargeOffSession), no network. Covers the CUMULATIVE +50%
//    cap math (the part that loses money if wrong: without netting prior
//    charged upcharges, successive disputes could each pass a fresh 50%
//    cap and blow past it in total).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeDbStub } from "../../helpers/supabase-stub";

const chargeOffSessionMock = vi.fn();
vi.mock("@/lib/bookings/off-session-charge", () => ({
  chargeOffSession: (...args: unknown[]) => chargeOffSessionMock(...args),
}));

const alertAdminMock = vi.fn(() => Promise.resolve());
vi.mock("@/lib/alert-admin", () => ({
  alertAdmin: (...args: unknown[]) => alertAdminMock(...args),
}));

import {
  resolveEligibility,
  reasonAllowedOnConfirmed,
  chargeUpcharge,
  ChargeUpchargeError,
} from "@/lib/bookings/dispute-engine";

beforeEach(() => {
  chargeOffSessionMock.mockReset();
  alertAdminMock.mockClear();
});

describe("resolveEligibility (pure, Section 11 taxonomy)", () => {
  it("maps salon_cancelled to eligible + fast-track + no_show_by_salon", () => {
    expect(resolveEligibility("salon_cancelled")).toEqual({
      eligibility: "eligible", fastTrackRecommended: true, issueType: "no_show_by_salon",
    });
  });

  it("maps quality to discretionary, not fast-tracked", () => {
    expect(resolveEligibility("quality")).toEqual({
      eligibility: "discretionary", fastTrackRecommended: false, issueType: "quality",
    });
  });

  it("maps other (and any unrecognized code) to not_eligible", () => {
    expect(resolveEligibility("other")).toEqual({
      eligibility: "not_eligible", fastTrackRecommended: false, issueType: "other",
    });
  });

  it("maps double_charge to eligible + fast-track + overcharge", () => {
    expect(resolveEligibility("double_charge")).toEqual({
      eligibility: "eligible", fastTrackRecommended: true, issueType: "overcharge",
    });
  });
});

describe("reasonAllowedOnConfirmed (pure)", () => {
  it("allows wrong_amount and double_charge on a not-yet-completed booking", () => {
    expect(reasonAllowedOnConfirmed("wrong_amount")).toBe(true);
    expect(reasonAllowedOnConfirmed("double_charge")).toBe(true);
  });

  it("rejects every other reason on a not-yet-completed booking", () => {
    expect(reasonAllowedOnConfirmed("quality")).toBe(false);
    expect(reasonAllowedOnConfirmed("salon_cancelled")).toBe(false);
    expect(reasonAllowedOnConfirmed("other")).toBe(false);
  });
});

const DISPUTE_ID = "d-1";
const BOOKING_ID = "b-1";

function disputeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: DISPUTE_ID,
    booking_id: BOOKING_ID,
    direction: "upcharge",
    status: "salon_approved",
    requested_amount: 2000,
    idempotency_key: null,
    ...overrides,
  };
}

function bookingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    paid_amount: 10000, // 100.00 CHF
    refunded_amount: 0,
    stripe_customer_id: "cus_1",
    stripe_payment_method_id: "pm_1",
    salon_id: "s-1",
    salons: { stripe_account_id: "acct_1" },
    ...overrides,
  };
}

describe("chargeUpcharge guard branches", () => {
  it("throws DISPUTE_NOT_FOUND when the dispute row is missing", async () => {
    const db = makeDbStub([{ data: null, error: null }]);
    await expect(
      chargeUpcharge({ db, disputeId: DISPUTE_ID, actorRole: "customer" }),
    ).rejects.toMatchObject({ code: "DISPUTE_NOT_FOUND" });
  });

  it("throws NOT_UPCHARGE for a direction='refund' dispute", async () => {
    const db = makeDbStub([{ data: disputeRow({ direction: "refund" }), error: null }]);
    await expect(
      chargeUpcharge({ db, disputeId: DISPUTE_ID, actorRole: "customer" }),
    ).rejects.toMatchObject({ code: "NOT_UPCHARGE" });
  });

  it("throws WRONG_STATUS when the dispute isn't 'salon_approved'", async () => {
    const db = makeDbStub([{ data: disputeRow({ status: "open" }), error: null }]);
    await expect(
      chargeUpcharge({ db, disputeId: DISPUTE_ID, actorRole: "customer" }),
    ).rejects.toMatchObject({ code: "WRONG_STATUS" });
  });

  it("throws INVALID_AMOUNT when requested_amount is 0/missing", async () => {
    const db = makeDbStub([{ data: disputeRow({ requested_amount: 0 }), error: null }]);
    await expect(
      chargeUpcharge({ db, disputeId: DISPUTE_ID, actorRole: "customer" }),
    ).rejects.toMatchObject({ code: "INVALID_AMOUNT" });
  });

  it("throws NO_SAVED_CARD when the booking has no SP-G2 card", async () => {
    const db = makeDbStub([
      { data: disputeRow(), error: null },
      { data: bookingRow({ stripe_customer_id: null }), error: null },
      { data: [], error: null }, // prior-upcharges query (reached before the card check)
    ]);
    await expect(
      chargeUpcharge({ db, disputeId: DISPUTE_ID, actorRole: "customer" }),
    ).rejects.toMatchObject({ code: "NO_SAVED_CARD" });
  });
});

describe("chargeUpcharge cumulative +50% cap math (the money-losing branch)", () => {
  it("allows an upcharge exactly at the fresh 50%-of-net cap with no prior charges", async () => {
    // netRetained = 10000, cap = round(10000*0.5) - 0 = 5000
    const db = makeDbStub([
      { data: disputeRow({ requested_amount: 5000 }), error: null },
      { data: bookingRow({ paid_amount: 10000, refunded_amount: 0 }), error: null },
      { data: [], error: null }, // no prior charged upcharges
      { data: { value: { rate_percent: 15 } }, error: null }, // commission
      { data: { id: DISPUTE_ID }, error: null }, // CAS success
      { data: { id: "ce-1" }, error: null }, // writeCaseEvent insert
    ]);
    chargeOffSessionMock.mockResolvedValue({ status: "charged", paymentIntentId: "pi_1", chargedCents: 5000 });

    const result = await chargeUpcharge({ db, disputeId: DISPUTE_ID, actorRole: "customer" });
    expect(result.status).toBe("charged");
    expect(chargeOffSessionMock.mock.calls[0][0].amountCents).toBe(5000);
  });

  it("rejects 1 Rappen over the fresh 50% cap", async () => {
    const db = makeDbStub([
      { data: disputeRow({ requested_amount: 5001 }), error: null },
      { data: bookingRow({ paid_amount: 10000, refunded_amount: 0 }), error: null },
      { data: [], error: null },
    ]);
    await expect(
      chargeUpcharge({ db, disputeId: DISPUTE_ID, actorRole: "customer" }),
    ).rejects.toMatchObject({ code: "EXCEEDS_CAP" });
    expect(chargeOffSessionMock).not.toHaveBeenCalled();
  });

  it("nets prior CHARGED upcharges out of the cap (cumulative, not per-dispute)", async () => {
    // netRetained = 10000, base cap = 5000. A prior dispute already charged 3000,
    // so this dispute's remaining cap is only 2000 -- requesting 2001 must fail
    // even though 2001 alone would pass a naive fresh-50% check.
    const db = makeDbStub([
      { data: disputeRow({ requested_amount: 2001 }), error: null },
      { data: bookingRow({ paid_amount: 10000, refunded_amount: 0 }), error: null },
      { data: [{ resolved_amount: 3000 }], error: null }, // one prior charged upcharge
    ]);
    await expect(
      chargeUpcharge({ db, disputeId: DISPUTE_ID, actorRole: "customer" }),
    ).rejects.toMatchObject({ code: "EXCEEDS_CAP" });
  });

  it("allows exactly the remaining cap after netting a prior charged upcharge", async () => {
    const db = makeDbStub([
      { data: disputeRow({ requested_amount: 2000 }), error: null },
      { data: bookingRow({ paid_amount: 10000, refunded_amount: 0 }), error: null },
      { data: [{ resolved_amount: 3000 }], error: null }, // remaining cap = 5000 - 3000 = 2000
      { data: { value: { rate_percent: 15 } }, error: null },
      { data: { id: DISPUTE_ID }, error: null },
      { data: { id: "ce-2" }, error: null }, // writeCaseEvent insert
    ]);
    chargeOffSessionMock.mockResolvedValue({ status: "charged", paymentIntentId: "pi_2", chargedCents: 2000 });

    const result = await chargeUpcharge({ db, disputeId: DISPUTE_ID, actorRole: "customer" });
    expect(result.status).toBe("charged");
  });

  it("nets a REFUND out of the cap base too (netRetained = paid - refunded)", async () => {
    // paid 10000, refunded 4000 -> netRetained 6000, cap = round(6000*0.5) = 3000
    const db = makeDbStub([
      { data: disputeRow({ requested_amount: 3001 }), error: null },
      { data: bookingRow({ paid_amount: 10000, refunded_amount: 4000 }), error: null },
      { data: [], error: null },
    ]);
    await expect(
      chargeUpcharge({ db, disputeId: DISPUTE_ID, actorRole: "customer" }),
    ).rejects.toMatchObject({ code: "EXCEEDS_CAP" });
  });

  it("fails CLOSED (never treats an unreadable cap as 0) when the prior-upcharges query errors", async () => {
    const db = makeDbStub([
      { data: disputeRow({ requested_amount: 1 }), error: null },
      { data: bookingRow(), error: null },
      { data: null, error: { message: "db down" } }, // prior-upcharges query fails
    ]);
    await expect(
      chargeUpcharge({ db, disputeId: DISPUTE_ID, actorRole: "customer" }),
    ).rejects.toMatchObject({ code: "EXCEEDS_CAP" });
    expect(chargeOffSessionMock).not.toHaveBeenCalled();
  });
});
