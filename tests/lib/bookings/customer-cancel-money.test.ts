// tests/lib/bookings/customer-cancel-money.test.ts
//
// Ring 5 money-path test: lib/bookings/customer-cancel-money.ts
// (applyCustomerCancelMoney). This is the ORCHESTRATION unit, not the money
// primitives themselves, so chargeFee + issueRefund are mocked at the module
// boundary (their own math is covered by their own test files) and
// calculateCancellationFee runs for REAL (pure, from lib/cancellation-policy).
// Covers: the netted refund = remaining - fee math, the double-refund guard
// (netting against already-refunded), free-cancel (outside window) no-op,
// and the not-prepaid fee-charge branch.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeDbStub } from "../../helpers/supabase-stub";

const chargeFeeMock = vi.fn();
vi.mock("@/lib/bookings/charge-fee", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/bookings/charge-fee")>();
  return {
    ...actual,
    chargeFee: (...args: unknown[]) => chargeFeeMock(...args),
  };
});

const issueRefundMock = vi.fn();
vi.mock("@/lib/bookings/issue-refund", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/bookings/issue-refund")>();
  return {
    ...actual,
    issueRefund: (...args: unknown[]) => issueRefundMock(...args),
  };
});

// Hold-release tests (deposit_held branch) call getStripe().paymentIntents.cancel
// directly, no wrapping chokepoint module to intercept, mocked at the boundary same
// as tests/lib/bookings/issue-refund.test.ts does.
const paymentIntentsCancelMock = vi.fn();
vi.mock("@/lib/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stripe")>();
  return {
    ...actual,
    getStripe: () => ({ paymentIntents: { cancel: paymentIntentsCancelMock } }),
  };
});

import { applyCustomerCancelMoney, resolveCustomerCancelPolicy, type CustomerCancelBookingRow } from "@/lib/bookings/customer-cancel-money";

const admin = {} as any; // never touched directly; only threaded through to the mocked calls.

// starts_at 1 hour from now -> inside any free_cancel_hours >= 1 (fee applies).
const SOON = new Date(Date.now() + 60 * 60 * 1000).toISOString();
// starts_at 1 week from now -> outside a 24h window (free cancel, no fee).
const FAR = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

function booking(overrides: Partial<CustomerCancelBookingRow> = {}): CustomerCancelBookingRow {
  return {
    id: "b-1",
    starts_at: SOON,
    paid_amount: 10000,
    price_paid: null,
    payment_intent_id: "pi_1",
    payment_status: "paid",
    refunded_amount: 0,
    stripe_customer_id: "cus_1",
    stripe_payment_method_id: "pm_1",
    ...overrides,
  };
}

const FLAT_POLICY = { cancellation_fee_type: "flat", cancellation_fee_value: 20, free_cancel_hours: 24 }; // CHF 20 = 2000 Rappen

beforeEach(() => {
  chargeFeeMock.mockReset();
  issueRefundMock.mockReset();
  paymentIntentsCancelMock.mockReset();
});

describe("applyCustomerCancelMoney: prepaid path (fee netted out of the refund)", () => {
  it("refunds paid_amount minus the policy fee, never charges a separate off-session fee", async () => {
    issueRefundMock.mockResolvedValue({ refundId: "re_1", totalRefundedCents: 8000, paymentStatus: "refunded" });

    const result = await applyCustomerCancelMoney(admin, booking(), FLAT_POLICY, "customer cancel");

    expect(result.feeCents).toBe(2000);
    expect(result.isWithinWindow).toBe(true);
    expect(result.refundAmount).toBe(8000); // 10000 - 2000
    expect(issueRefundMock).toHaveBeenCalledTimes(1);
    expect(issueRefundMock.mock.calls[0][0].amountCents).toBe(8000);
    expect(chargeFeeMock).not.toHaveBeenCalled();
  });

  it("nets the refund against an ALREADY-refunded balance (double-refund guard)", async () => {
    // paid 10000, already refunded 5000 (a prior dispute resolution) -> remaining 5000,
    // fee 2000 -> refund should be 3000, NOT 8000 (which would double-refund the prior 5000).
    issueRefundMock.mockResolvedValue({ refundId: "re_2", totalRefundedCents: 8000, paymentStatus: "partially_refunded" });

    const result = await applyCustomerCancelMoney(admin, booking({ refunded_amount: 5000 }), FLAT_POLICY, "customer cancel");

    expect(result.refundAmount).toBe(3000);
    expect(issueRefundMock.mock.calls[0][0].amountCents).toBe(3000);
  });

  it("refunds nothing (no issueRefund call) when the fee fully absorbs the remaining balance", async () => {
    const bigFeePolicy = { cancellation_fee_type: "flat", cancellation_fee_value: 999, free_cancel_hours: 24 }; // 99900 Rappen, way over paid_amount
    const result = await applyCustomerCancelMoney(admin, booking({ paid_amount: 1000 }), bigFeePolicy, "customer cancel");

    // computePolicyFeeCents caps the fee at baseCents (1000), so fee = 1000 = remaining -> refund 0.
    expect(result.feeCents).toBe(1000);
    expect(result.refundAmount).toBe(0);
    expect(issueRefundMock).not.toHaveBeenCalled();
    expect(chargeFeeMock).not.toHaveBeenCalled();
  });

  it("does not throw and leaves refundAmount at 0 when issueRefund itself throws", async () => {
    issueRefundMock.mockRejectedValue(new Error("stripe down"));

    const result = await applyCustomerCancelMoney(admin, booking(), FLAT_POLICY, "customer cancel");

    expect(result.refundAmount).toBe(0); // the assignment only happens after a successful call
  });
});

describe("applyCustomerCancelMoney: free cancel (outside the window)", () => {
  it("charges no fee and refunds the full amount when cancelling outside free_cancel_hours", async () => {
    issueRefundMock.mockResolvedValue({ refundId: "re_3", totalRefundedCents: 10000, paymentStatus: "refunded" });

    const result = await applyCustomerCancelMoney(admin, booking({ starts_at: FAR }), FLAT_POLICY, "customer cancel");

    expect(result.feeCents).toBe(0);
    expect(result.isWithinWindow).toBe(false);
    expect(result.refundAmount).toBe(10000);
    expect(issueRefundMock.mock.calls[0][0].amountCents).toBe(10000);
  });
});

describe("applyCustomerCancelMoney: not-prepaid path (off-session fee charge)", () => {
  it("charges the policy fee off-session when there was no prior payment", async () => {
    chargeFeeMock.mockResolvedValue({ status: "charged", chargedCents: 2000, paymentIntentId: "pi_fee" });

    const notPrepaid = booking({ paid_amount: null, payment_intent_id: null, price_paid: 100 }); // CHF 100 pay-at-salon
    const result = await applyCustomerCancelMoney(admin, notPrepaid, FLAT_POLICY, "customer cancel");

    expect(chargeFeeMock).toHaveBeenCalledTimes(1);
    expect(chargeFeeMock.mock.calls[0][0]).toMatchObject({ id: "b-1", amountCents: 2000, kind: "cancellation" });
    expect(issueRefundMock).not.toHaveBeenCalled();
    expect(result.feeChargeStatus).toBe("charged");
    expect(result.feeChargedCents).toBe(2000);
  });

  it("skips the charge entirely when fee is 0 (outside window) even if not prepaid", async () => {
    const notPrepaid = booking({ paid_amount: null, payment_intent_id: null, starts_at: FAR });
    const result = await applyCustomerCancelMoney(admin, notPrepaid, FLAT_POLICY, "customer cancel");

    expect(chargeFeeMock).not.toHaveBeenCalled();
    expect(result.feeChargeStatus).toBe("none");
  });

  it("skips the charge when there is no saved card, even if a fee applies", async () => {
    const notPrepaidNoCard = booking({ paid_amount: null, payment_intent_id: null, price_paid: 100, stripe_customer_id: null });
    const result = await applyCustomerCancelMoney(admin, notPrepaidNoCard, FLAT_POLICY, "customer cancel");

    expect(chargeFeeMock).not.toHaveBeenCalled();
    expect(result.feeChargeStatus).toBe("none");
  });

  it("does not throw when chargeFee itself throws, and reports feeChargeStatus 'none'", async () => {
    chargeFeeMock.mockRejectedValue(new Error("no saved card"));

    const notPrepaid = booking({ paid_amount: null, payment_intent_id: null, price_paid: 100 });
    const result = await applyCustomerCancelMoney(admin, notPrepaid, FLAT_POLICY, "customer cancel");

    expect(chargeFeeMock).toHaveBeenCalledTimes(1); // the call DID happen and threw
    expect(result.feeChargeStatus).toBe("none");
    expect(result.feeChargedCents).toBe(0);
  });
});

describe("applyCustomerCancelMoney: uncaptured-hold release (deposit_held)", () => {
  // deposit_held bookings never carry paid_amount (see the write-site trail in the
  // isUncapturedHold comment in customer-cancel-money.ts), so paid_amount stays null
  // here same as a real row would have it.
  function heldBooking(overrides: Partial<CustomerCancelBookingRow> = {}): CustomerCancelBookingRow {
    return booking({
      paid_amount: null,
      payment_status: "deposit_held",
      payment_intent_id: "pi_hold_1",
      refunded_amount: null,
      ...overrides,
    });
  }

  it("cancels the PaymentIntent and releases the hold, no refund issued", async () => {
    paymentIntentsCancelMock.mockResolvedValue({ id: "pi_hold_1", status: "canceled" });
    const db = makeDbStub([{ data: { id: "b-1" }, error: null }]); // the CAS release update

    const result = await applyCustomerCancelMoney(db, heldBooking(), FLAT_POLICY, "customer cancel");

    expect(paymentIntentsCancelMock).toHaveBeenCalledTimes(1);
    expect(paymentIntentsCancelMock).toHaveBeenCalledWith("pi_hold_1", { cancellation_reason: "requested_by_customer" });
    expect(issueRefundMock).not.toHaveBeenCalled();
    expect(chargeFeeMock).not.toHaveBeenCalled();
    expect(result.refundAmount).toBe(0);
  });

  it("paid + paid_amount > 0 takes the refund path, never calls paymentIntents.cancel", async () => {
    issueRefundMock.mockResolvedValue({ refundId: "re_paid", totalRefundedCents: 8000, paymentStatus: "refunded" });

    const result = await applyCustomerCancelMoney(admin, booking(), FLAT_POLICY, "customer cancel"); // booking() default: paid_amount 10000, payment_status 'paid'

    expect(issueRefundMock).toHaveBeenCalledTimes(1);
    expect(paymentIntentsCancelMock).not.toHaveBeenCalled();
    expect(result.refundAmount).toBe(8000);
  });

  it("deposit_held without a payment_intent_id: neither cancel nor refund fires, no throw", async () => {
    const result = await applyCustomerCancelMoney(admin, heldBooking({ payment_intent_id: null }), FLAT_POLICY, "customer cancel");

    expect(paymentIntentsCancelMock).not.toHaveBeenCalled();
    expect(issueRefundMock).not.toHaveBeenCalled();
    expect(chargeFeeMock).not.toHaveBeenCalled();
    expect(result.refundAmount).toBe(0);
  });

  it("treats an already-canceled PaymentIntent as success (idempotent retry / cron race) and still releases the hold", async () => {
    paymentIntentsCancelMock.mockRejectedValue({
      code: "payment_intent_unexpected_state",
      message: "You cannot cancel this PaymentIntent because it has a status of canceled.",
    });
    const db = makeDbStub([{ data: { id: "b-1" }, error: null }]);

    await applyCustomerCancelMoney(db, heldBooking(), FLAT_POLICY, "customer cancel");

    // release still attempted (not a hard failure) even though the cancel() call itself threw.
    expect(paymentIntentsCancelMock).toHaveBeenCalledTimes(1);
  });

  it("does not throw when paymentIntents.cancel fails for a real reason, and leaves the hold in place", async () => {
    paymentIntentsCancelMock.mockRejectedValue({ code: "api_connection_error", message: "network error" });
    const db = makeDbStub([]); // release path never reached: no .from() call expected

    const result = await applyCustomerCancelMoney(db, heldBooking(), FLAT_POLICY, "customer cancel");

    expect(result.refundAmount).toBe(0);
  });
});

describe("resolveCustomerCancelPolicy: snapshot vs live-salon policy resolution", () => {
  const LIVE_SALON = { cancellation_fee_type: "percentage", cancellation_fee_value: 50, free_cancel_hours: 48 };

  it("uses every field from a complete snapshot, ignoring a different live salon policy", () => {
    const snapshot = { cancellation_fee_type: "flat", cancellation_fee_value: 20, free_cancel_hours: 24 };

    const result = resolveCustomerCancelPolicy("b-1", snapshot, LIVE_SALON);

    expect(result).toEqual(snapshot);
  });

  it("falls back to every field from the live salon and warns once (booking id + policy_snapshot) when snapshot is null", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = resolveCustomerCancelPolicy("b-42", null, LIVE_SALON);

    expect(result).toEqual(LIVE_SALON);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain("b-42");
    expect(warnSpy.mock.calls[0][0]).toContain("policy_snapshot");

    warnSpy.mockRestore();
  });

  it("falls back only the missing field (cancellation_fee_type) to the live salon, keeps the other snapshot fields, and does NOT warn (the function only warns when the snapshot object itself is missing/malformed, not per missing field)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const partialSnapshot = { cancellation_fee_value: 20, free_cancel_hours: 24 }; // no cancellation_fee_type

    const result = resolveCustomerCancelPolicy("b-2", partialSnapshot, LIVE_SALON);

    expect(result).toEqual({
      cancellation_fee_type: LIVE_SALON.cancellation_fee_type, // fell back
      cancellation_fee_value: 20, // stayed from snapshot
      free_cancel_hours: 24, // stayed from snapshot
    });
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("treats a non-object snapshot (a string or a number) as missing: live salon wins on every field, and warns", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const stringResult = resolveCustomerCancelPolicy("b-3", "not-an-object" as any, LIVE_SALON);
    const numberResult = resolveCustomerCancelPolicy("b-4", 42 as any, LIVE_SALON);

    expect(stringResult).toEqual(LIVE_SALON);
    expect(numberResult).toEqual(LIVE_SALON);
    expect(warnSpy).toHaveBeenCalledTimes(2);

    warnSpy.mockRestore();
  });

  it("returns calculateCancellationFee's own defaults when both snapshot and live salon are null: null fee type, null fee value, 24 free_cancel_hours", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = resolveCustomerCancelPolicy("b-5", null, null);

    expect(result).toEqual({
      cancellation_fee_type: null,
      cancellation_fee_value: null,
      free_cancel_hours: 24,
    });

    warnSpy.mockRestore();
  });
});
