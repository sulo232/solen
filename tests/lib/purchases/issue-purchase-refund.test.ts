// tests/lib/purchases/issue-purchase-refund.test.ts
//
// Ring 5 money-path test: lib/purchases/issue-purchase-refund.ts. Sibling of
// issue-refund.ts for package/retail purchases. Pure-logic level: hand-stubbed
// db, mocked Stripe boundary (getStripe), mocked Redis lock (fails open, same
// as unconfigured Upstash in dev), mocked refund-config + alertAdmin, no
// network. Covers: the remaining/netting math, full-refund retail stock
// re-increment, the CAS race, the Stripe-throw rollback, and the pure
// resolvePackageRefundAmount pro-rata math (the part that loses money if the
// floor/cap is wrong).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeDbStub } from "../../helpers/supabase-stub";

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

// No Redis configured (matches this repo's dev default: unconfigured Upstash
// fails open). Mocking @/lib/env directly is simpler + more deterministic
// than relying on ambient process.env in the test runner.
vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ UPSTASH_REDIS_REST_URL: undefined, UPSTASH_REDIS_REST_TOKEN: undefined }),
}));

import { issuePurchaseRefund, PurchaseRefundError, resolvePackageRefundAmount } from "@/lib/purchases/issue-purchase-refund";

const PURCHASE_ID = "p-1";

function retailRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PURCHASE_ID,
    stripe_payment_intent_id: "pi_1",
    paid_amount: 10000,
    refunded_amount: 0,
    salon_id: "s-1",
    user_id: "u-1",
    product_ids: ["prod-1", "prod-2"],
    status: "paid",
    salons: { stripe_account_id: "acct_1" },
    ...overrides,
  };
}

function packageRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PURCHASE_ID,
    stripe_payment_intent_id: "pi_1",
    paid_amount: 10000,
    refunded_amount: 0,
    salon_id: "s-1",
    user_id: "u-1",
    salons: { stripe_account_id: null },
    ...overrides,
  };
}

beforeEach(() => {
  refundsCreateMock.mockReset();
  alertAdminMock.mockClear();
});

describe("issuePurchaseRefund guard branches", () => {
  it("rejects an unsupported source", async () => {
    const db = makeDbStub([]);
    await expect(
      // @ts-expect-error deliberately invalid source for the guard test
      issuePurchaseRefund({ db, source: "gift_card", id: PURCHASE_ID, amountCents: 100, actor: "admin", reason: "x" }),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_SOURCE" });
  });

  it("rejects a non-positive amount", async () => {
    const db = makeDbStub([]);
    await expect(
      issuePurchaseRefund({ db, source: "retail", id: PURCHASE_ID, amountCents: -1, actor: "admin", reason: "x" }),
    ).rejects.toMatchObject({ code: "INVALID_AMOUNT" });
  });

  it("throws PURCHASE_NOT_FOUND when the resolver finds no row", async () => {
    const db = makeDbStub([{ data: null, error: { message: "not found" } }]);
    await expect(
      issuePurchaseRefund({ db, source: "retail", id: PURCHASE_ID, amountCents: 100, actor: "admin", reason: "x" }),
    ).rejects.toMatchObject({ code: "PURCHASE_NOT_FOUND" });
  });

  it("throws NO_PAID_AMOUNT when paid_amount is 0", async () => {
    const db = makeDbStub([{ data: retailRow({ paid_amount: 0 }), error: null }]);
    await expect(
      issuePurchaseRefund({ db, source: "retail", id: PURCHASE_ID, amountCents: 100, actor: "admin", reason: "x" }),
    ).rejects.toMatchObject({ code: "NO_PAID_AMOUNT" });
  });

  it("throws NO_PAYMENT when there is no Stripe payment_intent_id", async () => {
    const db = makeDbStub([{ data: retailRow({ stripe_payment_intent_id: null }), error: null }]);
    await expect(
      issuePurchaseRefund({ db, source: "retail", id: PURCHASE_ID, amountCents: 100, actor: "admin", reason: "x" }),
    ).rejects.toMatchObject({ code: "NO_PAYMENT" });
  });
});

describe("issuePurchaseRefund remaining/netting math", () => {
  it("throws EXCEEDS_REMAINING when amountCents exceeds paid minus already-refunded", async () => {
    const db = makeDbStub([{ data: retailRow({ paid_amount: 10000, refunded_amount: 7000 }), error: null }]);
    await expect(
      issuePurchaseRefund({ db, source: "retail", id: PURCHASE_ID, amountCents: 3001, actor: "admin", reason: "x" }),
    ).rejects.toMatchObject({ code: "EXCEEDS_REMAINING" });
    expect(refundsCreateMock).not.toHaveBeenCalled();
  });

  it("marks retail 'refunded' (full) and re-increments stock for every product id on a full refund", async () => {
    const db = makeDbStub(
      [
        { data: retailRow({ paid_amount: 10000, refunded_amount: 0, product_ids: ["prod-1", "prod-2"] }), error: null },
        { data: { id: PURCHASE_ID }, error: null }, // CAS claim
      ],
      () => Promise.resolve({ data: null, error: null }), // increment_retail_stock rpc
    );
    refundsCreateMock.mockResolvedValue({ id: "re_1" });

    const result = await issuePurchaseRefund({ db, source: "retail", id: PURCHASE_ID, amountCents: 10000, actor: "admin", reason: "x" });

    expect(result.status).toBe("refunded");
    expect(result.totalRefundedCents).toBe(10000);
    // 2 stock re-increments (one per product id) + 2 credits/voucher spend-path restore calls
    // (restore_user_credits, restore_voucher, added 2026-07-11, step 10b) that fire after every
    // successful refund, harmless no-op here since nothing was ever redeemed against this PI.
    expect(db.rpc).toHaveBeenCalledTimes(4);
    expect(db.rpc).toHaveBeenCalledWith("increment_retail_stock", { p_product_id: "prod-1" });
    expect(db.rpc).toHaveBeenCalledWith("increment_retail_stock", { p_product_id: "prod-2" });
    expect(db.rpc).toHaveBeenCalledWith("restore_user_credits", { p_pi: "pi_1" });
    expect(db.rpc).toHaveBeenCalledWith("restore_voucher", { p_pi: "pi_1" });
  });

  it("does NOT re-increment stock NOR restore credits/voucher on a partial refund (step 10b gated on isFull)", async () => {
    const db = makeDbStub([
      { data: retailRow({ paid_amount: 10000, refunded_amount: 0 }), error: null },
      { data: { id: PURCHASE_ID }, error: null },
    ]);
    refundsCreateMock.mockResolvedValue({ id: "re_2" });

    const result = await issuePurchaseRefund({ db, source: "retail", id: PURCHASE_ID, amountCents: 4000, actor: "admin", reason: "x" });

    expect(result.status).toBe("partially_refunded");
    // No stock re-increment on a partial refund. The credits/voucher spend-path restore
    // (added 2026-07-11) is gated on isFull (fixed 2026-07-11 punch list): a partial refund
    // must NOT restore an all-or-nothing per-PI ledger while the redeemed amount could still
    // be backing the unrefunded remainder.
    expect(db.rpc).not.toHaveBeenCalledWith("increment_retail_stock", expect.anything());
    expect(db.rpc).not.toHaveBeenCalledWith("restore_user_credits", expect.anything());
    expect(db.rpc).not.toHaveBeenCalledWith("restore_voucher", expect.anything());
    expect(db.rpc).toHaveBeenCalledTimes(0);
  });

  it("package purchases (no status column, no stock) refund the same amount math, restore still fires", async () => {
    const db = makeDbStub([
      { data: packageRow({ paid_amount: 10000, refunded_amount: 0 }), error: null },
      { data: { id: PURCHASE_ID }, error: null },
    ]);
    refundsCreateMock.mockResolvedValue({ id: "re_3" });

    const result = await issuePurchaseRefund({ db, source: "package", id: PURCHASE_ID, amountCents: 10000, actor: "admin", reason: "x" });

    expect(result.status).toBe("refunded");
    // Packages have no per-SKU stock, so no increment_retail_stock call either way; the
    // credits/voucher spend-path restore (added 2026-07-11) still fires, harmless no-op here.
    expect(db.rpc).not.toHaveBeenCalledWith("increment_retail_stock", expect.anything());
    expect(db.rpc).toHaveBeenCalledWith("restore_user_credits", { p_pi: "pi_1" });
    expect(db.rpc).toHaveBeenCalledWith("restore_voucher", { p_pi: "pi_1" });
    expect(db.rpc).toHaveBeenCalledTimes(2);
  });
});

describe("issuePurchaseRefund CAS race + Stripe-throw rollback", () => {
  it("throws CONCURRENT_RETRY without calling Stripe when the CAS claim matches 0 rows", async () => {
    const db = makeDbStub([
      { data: retailRow(), error: null },
      { data: null, error: null }, // CAS claim lost
    ]);
    await expect(
      issuePurchaseRefund({ db, source: "retail", id: PURCHASE_ID, amountCents: 1000, actor: "admin", reason: "x" }),
    ).rejects.toMatchObject({ code: "CONCURRENT_RETRY" });
    expect(refundsCreateMock).not.toHaveBeenCalled();
  });

  it("rolls back the claim and throws STRIPE_FAILED when refunds.create throws", async () => {
    const db = makeDbStub([
      { data: retailRow(), error: null }, // resolve
      { data: { id: PURCHASE_ID }, error: null }, // CAS claim wins
      { data: { id: PURCHASE_ID }, error: null }, // rollback update
    ]);
    refundsCreateMock.mockRejectedValue(new Error("insufficient_funds"));

    await expect(
      issuePurchaseRefund({ db, source: "retail", id: PURCHASE_ID, amountCents: 1000, actor: "admin", reason: "x" }),
    ).rejects.toMatchObject({ code: "STRIPE_FAILED" });
    expect(alertAdminMock).toHaveBeenCalledTimes(1);
  });
});

describe("resolvePackageRefundAmount (pure pro-rata math)", () => {
  it("returns the explicit amount for mode 'amount'", () => {
    const result = resolvePackageRefundAmount({
      mode: "amount", amount: 2500, paid: 10000, alreadyRefunded: 0, sessionsTotal: 5, sessionsUsed: 1,
    });
    expect(result).toEqual({ ok: true, amountCents: 2500 });
  });

  it("floors the pro-rata unused-session value (never over-refunds a fractional Rappen)", () => {
    // paid 10000, 3 unused of 7 total -> 10000*3/7 = 4285.71... -> floor 4285
    const result = resolvePackageRefundAmount({
      mode: "prorata", paid: 10000, alreadyRefunded: 0, sessionsTotal: 7, sessionsUsed: 4,
    });
    expect(result).toEqual({ ok: true, amountCents: 4285 });
  });

  it("caps the pro-rata amount at the remaining (paid minus already-refunded) balance", () => {
    // unused fraction would be 10000*4/5=8000, but only 3000 remains unrefunded
    const result = resolvePackageRefundAmount({
      mode: "prorata", paid: 10000, alreadyRefunded: 7000, sessionsTotal: 5, sessionsUsed: 1,
    });
    expect(result).toEqual({ ok: true, amountCents: 3000 });
  });

  it("rejects a package with no sessions to pro-rate", () => {
    const result = resolvePackageRefundAmount({
      mode: "prorata", paid: 10000, alreadyRefunded: 0, sessionsTotal: 0, sessionsUsed: 0,
    });
    expect(result).toEqual({ ok: false, code: "INVALID_AMOUNT", message: expect.any(String) });
  });

  it("rejects when every session is already used (0 unused, nothing to refund)", () => {
    const result = resolvePackageRefundAmount({
      mode: "prorata", paid: 10000, alreadyRefunded: 0, sessionsTotal: 5, sessionsUsed: 5,
    });
    expect(result.ok).toBe(false);
    expect((result as any).code).toBe("EXCEEDS_REMAINING");
  });

  it("rejects an unsettled purchase (paid <= 0) before touching mode-specific math", () => {
    const result = resolvePackageRefundAmount({
      mode: "amount", amount: 100, paid: 0, alreadyRefunded: 0, sessionsTotal: 5, sessionsUsed: 0,
    });
    expect(result).toEqual({ ok: false, code: "NO_PAID_AMOUNT", message: expect.any(String) });
  });
});
