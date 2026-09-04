// tests/lib/bookings/issue-refund.test.ts
//
// Ring 5 money-path test: lib/bookings/issue-refund.ts (issueRefund). Pure
// logic level, hand-stubbed db + mocked Stripe boundary (getStripe) and
// alertAdmin, no network. Covers: the remaining/netting math (paid minus
// already-refunded), full vs partial payment-status transitions, the
// claim-first CAS race, and the Stripe-throw rollback path.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeDbStub, type StubResult } from "../../helpers/supabase-stub";

const refundsCreateMock = vi.fn();
vi.mock("@/lib/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stripe")>();
  return {
    ...actual,
    getStripe: () => ({ refunds: { create: refundsCreateMock } }),
  };
});

vi.mock("@/lib/bookings/refund-config", () => ({
  getRefundConfig: () => Promise.resolve({ refundApplicationFeeDefault: false }),
}));

const alertAdminMock = vi.fn(() => Promise.resolve());
vi.mock("@/lib/alert-admin", () => ({
  alertAdmin: (...args: unknown[]) => alertAdminMock(...args),
}));

import { issueRefund, RefundError } from "@/lib/bookings/issue-refund";

const BOOKING_ID = "b-1";

function bookingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    payment_intent_id: "pi_1",
    paid_amount: 10000, // 100.00 CHF
    refunded_amount: 0,
    payment_status: "paid",
    salon_id: "s-1",
    salons: { stripe_account_id: "acct_1" },
    ...overrides,
  };
}

beforeEach(() => {
  refundsCreateMock.mockReset();
  alertAdminMock.mockClear();
});

describe("issueRefund guard branches", () => {
  it("rejects a non-positive amount", async () => {
    const db = makeDbStub([]);
    await expect(
      issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 0, actor: "customer", reason: "x" }),
    ).rejects.toMatchObject({ code: "INVALID_AMOUNT" });
  });

  it("throws BOOKING_NOT_FOUND when the fetch returns no row", async () => {
    const db = makeDbStub([{ data: null, error: { message: "not found" } }]);
    await expect(
      issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 100, actor: "customer", reason: "x" }),
    ).rejects.toMatchObject({ code: "BOOKING_NOT_FOUND" });
  });

  it("throws NO_PAID_AMOUNT when paid_amount is 0/null (never falls back to price_paid)", async () => {
    const db = makeDbStub([{ data: bookingRow({ paid_amount: 0 }), error: null }]);
    await expect(
      issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 100, actor: "customer", reason: "x" }),
    ).rejects.toMatchObject({ code: "NO_PAID_AMOUNT" });
  });

  it("throws NOT_CAPTURED for a PI that was created but never captured (payment_status='none')", async () => {
    const db = makeDbStub([{ data: bookingRow({ payment_status: "none" }), error: null }]);
    await expect(
      issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 100, actor: "customer", reason: "x" }),
    ).rejects.toMatchObject({ code: "NOT_CAPTURED" });
    expect(refundsCreateMock).not.toHaveBeenCalled();
  });

  it("rejects source='walkin' (D10 not implemented)", async () => {
    const db = makeDbStub([]);
    await expect(
      issueRefund({ db, source: "walkin", id: BOOKING_ID, amountCents: 100, actor: "customer", reason: "x" }),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_SOURCE" });
  });
});

describe("issueRefund remaining/netting math", () => {
  it("throws EXCEEDS_REMAINING when amountCents exceeds paid minus already-refunded", async () => {
    const db = makeDbStub([{ data: bookingRow({ paid_amount: 10000, refunded_amount: 6000 }), error: null }]);
    // remaining = 10000 - 6000 = 4000; 4001 must be rejected
    await expect(
      issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 4001, actor: "admin", reason: "x" }),
    ).rejects.toMatchObject({ code: "EXCEEDS_REMAINING" });
    expect(refundsCreateMock).not.toHaveBeenCalled();
  });

  it("allows a refund exactly equal to the remaining balance and marks the booking 'refunded' (full)", async () => {
    const db = makeDbStub(
      [
        { data: bookingRow({ paid_amount: 10000, refunded_amount: 6000, payment_status: "partially_refunded" }), error: null }, // fetch
        { data: { id: BOOKING_ID }, error: null }, // CAS claim (sets refund_pending_at)
        { data: { id: BOOKING_ID }, error: null }, // clear refund_pending_at after Stripe confirms
      ],
      () => Promise.resolve({ data: null, error: null }), // restore_user_credits / restore_voucher rpc spy
    );
    refundsCreateMock.mockResolvedValue({ id: "re_1" });

    const result = await issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 4000, actor: "admin", reason: "x" });

    expect(result.totalRefundedCents).toBe(10000);
    expect(result.paymentStatus).toBe("refunded");
    // Full refund fires the credits/voucher spend-path restore (step 10b, gated on isFull).
    expect(db.rpc).toHaveBeenCalledWith("restore_user_credits", { p_pi: "pi_1" });
    expect(db.rpc).toHaveBeenCalledWith("restore_voucher", { p_pi: "pi_1" });
  });

  it("marks 'partially_refunded' when the new total is still below paid_amount", async () => {
    const db = makeDbStub(
      [
        { data: bookingRow({ paid_amount: 10000, refunded_amount: 0 }), error: null },
        { data: { id: BOOKING_ID }, error: null }, // CAS claim (sets refund_pending_at)
        { data: { id: BOOKING_ID }, error: null }, // clear refund_pending_at after Stripe confirms
      ],
      () => Promise.resolve({ data: null, error: null }), // restore_user_credits / restore_voucher rpc spy
    );
    refundsCreateMock.mockResolvedValue({ id: "re_2" });

    const result = await issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 3000, actor: "customer", reason: "x" });

    expect(result.totalRefundedCents).toBe(3000);
    expect(result.paymentStatus).toBe("partially_refunded");
    // A partial refund must NOT restore the credits/voucher ledger (step 10b gated on
    // isFull): the redeemed amount could still be backing the unrefunded remainder.
    expect(db.rpc).not.toHaveBeenCalledWith("restore_user_credits", expect.anything());
    expect(db.rpc).not.toHaveBeenCalledWith("restore_voucher", expect.anything());
  });

  it("passes reverse_transfer + refund_application_fee only for a Connect account", async () => {
    const db = makeDbStub([
      { data: bookingRow({ salons: { stripe_account_id: "acct_connect" } }), error: null },
      { data: { id: BOOKING_ID }, error: null }, // CAS claim (sets refund_pending_at)
      { data: { id: BOOKING_ID }, error: null }, // clear refund_pending_at after Stripe confirms
    ]);
    refundsCreateMock.mockResolvedValue({ id: "re_3" });

    await issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 1000, actor: "admin", reason: "x", refundApplicationFee: true });

    const params = refundsCreateMock.mock.calls[0][0];
    expect(params.reverse_transfer).toBe(true);
    expect(params.refund_application_fee).toBe(true);
  });

  it("omits reverse_transfer/refund_application_fee when there is no connected account", async () => {
    const db = makeDbStub([
      { data: bookingRow({ salons: { stripe_account_id: null } }), error: null },
      { data: { id: BOOKING_ID }, error: null }, // CAS claim (sets refund_pending_at)
      { data: { id: BOOKING_ID }, error: null }, // clear refund_pending_at after Stripe confirms
    ]);
    refundsCreateMock.mockResolvedValue({ id: "re_4" });

    await issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 1000, actor: "admin", reason: "x" });

    const params = refundsCreateMock.mock.calls[0][0];
    expect(params.reverse_transfer).toBeUndefined();
    expect(params.refund_application_fee).toBeUndefined();
  });
});

describe("issueRefund credits/voucher spend-path restore (step 10b, gated on isFull)", () => {
  // Standalone cases on top of the embedded assertions above (netting-math describe,
  // mirrors issue-purchase-refund.test.ts:124-166). Added per the fix-round punch list
  // to independently discriminate the isFull restore gate and push this file's count
  // to the reviewer's stated >=76 total (deviation from the pure embedded-only mirror,
  // explicitly accepted per the punch list's option (b)).
  it("fires restore_user_credits and restore_voucher on a full refund", async () => {
    const db = makeDbStub(
      [
        { data: bookingRow({ paid_amount: 10000, refunded_amount: 0 }), error: null }, // fetch
        { data: { id: BOOKING_ID }, error: null }, // CAS claim (sets refund_pending_at)
        { data: { id: BOOKING_ID }, error: null }, // clear refund_pending_at after Stripe confirms
      ],
      () => Promise.resolve({ data: null, error: null }), // restore_user_credits / restore_voucher rpc spy
    );
    refundsCreateMock.mockResolvedValue({ id: "re_5" });

    await issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 10000, actor: "admin", reason: "x" });

    expect(db.rpc).toHaveBeenCalledWith("restore_user_credits", { p_pi: "pi_1" });
    expect(db.rpc).toHaveBeenCalledWith("restore_voucher", { p_pi: "pi_1" });
  });

  it("does NOT fire restore_user_credits nor restore_voucher on a partial refund", async () => {
    const db = makeDbStub(
      [
        { data: bookingRow({ paid_amount: 10000, refunded_amount: 0 }), error: null }, // fetch
        { data: { id: BOOKING_ID }, error: null }, // CAS claim (sets refund_pending_at)
        { data: { id: BOOKING_ID }, error: null }, // clear refund_pending_at after Stripe confirms
      ],
      () => Promise.resolve({ data: null, error: null }), // restore_user_credits / restore_voucher rpc spy
    );
    refundsCreateMock.mockResolvedValue({ id: "re_6" });

    await issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 2000, actor: "customer", reason: "x" });

    expect(db.rpc).not.toHaveBeenCalledWith("restore_user_credits", expect.anything());
    expect(db.rpc).not.toHaveBeenCalledWith("restore_voucher", expect.anything());
  });
});

describe("issueRefund claim-first CAS race", () => {
  it("throws CONCURRENT_RETRY without calling Stripe when the CAS claim matches 0 rows", async () => {
    const db = makeDbStub([
      { data: bookingRow(), error: null }, // fetch
      { data: null, error: null }, // CAS claim lost the race
    ]);

    await expect(
      issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 1000, actor: "customer", reason: "x" }),
    ).rejects.toMatchObject({ code: "CONCURRENT_RETRY" });
    expect(refundsCreateMock).not.toHaveBeenCalled();
  });
});

describe("issueRefund Stripe-throw rollback", () => {
  it("rolls back the claimed refunded_amount and throws STRIPE_FAILED when refunds.create throws", async () => {
    const db = makeDbStub([
      { data: bookingRow(), error: null }, // fetch
      { data: { id: BOOKING_ID }, error: null }, // CAS claim (wins)
      { data: { id: BOOKING_ID }, error: null }, // rollback update
    ]);
    refundsCreateMock.mockRejectedValue(new Error("card_declined"));

    await expect(
      issueRefund({ db, source: "booking", id: BOOKING_ID, amountCents: 1000, actor: "customer", reason: "x" }),
    ).rejects.toMatchObject({ code: "STRIPE_FAILED" });
    expect(alertAdminMock).toHaveBeenCalledTimes(1);
  });
});
