// tests/lib/bookings/off-session-charge.test.ts
//
// Ring 5 money-path test: lib/bookings/off-session-charge.ts (chargeOffSession).
// The single Stripe paymentIntents.create primitive shared by charge-fee.ts and
// dispute-engine.ts's chargeUpcharge. No DB at all here, only the Stripe
// boundary (mocked) and alertAdmin (mocked). Covers: the Connect
// application_fee/transfer_data branch, the SCA requires_action mapping, the
// card-decline no-alert path, and the non-decline alert path.

import { describe, it, expect, vi, beforeEach } from "vitest";

const piCreateMock = vi.fn();
vi.mock("@/lib/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stripe")>();
  return {
    ...actual,
    getStripe: () => ({ paymentIntents: { create: piCreateMock } }),
  };
});

const alertAdminMock = vi.fn(() => Promise.resolve());
vi.mock("@/lib/alert-admin", () => ({
  alertAdmin: (...args: unknown[]) => alertAdminMock(...args),
}));

import { chargeOffSession } from "@/lib/bookings/off-session-charge";

const BASE_ARGS = {
  amountCents: 2500,
  stripeCustomerId: "cus_1",
  stripePaymentMethodId: "pm_1",
  applicationFeeCents: 375,
  idempotencyKey: "key-1",
  metadata: { type: "cancellation_fee", booking_id: "b-1", actor: "system" },
};

beforeEach(() => {
  piCreateMock.mockReset();
  alertAdminMock.mockClear();
});

describe("chargeOffSession Connect params", () => {
  it("sets application_fee_amount + transfer_data.destination for a connected account", async () => {
    piCreateMock.mockResolvedValue({ id: "pi_1", status: "succeeded" });
    await chargeOffSession({ ...BASE_ARGS, stripeAccountId: "acct_1" });

    const params = piCreateMock.mock.calls[0][0];
    expect(params.application_fee_amount).toBe(375);
    expect(params.transfer_data).toEqual({ destination: "acct_1" });
    expect(params.amount).toBe(2500);
    expect(params.off_session).toBe(true);
    expect(params.confirm).toBe(true);
  });

  it("omits application_fee_amount/transfer_data when there is no connected account", async () => {
    piCreateMock.mockResolvedValue({ id: "pi_2", status: "succeeded" });
    await chargeOffSession({ ...BASE_ARGS, stripeAccountId: null });

    const params = piCreateMock.mock.calls[0][0];
    expect(params.application_fee_amount).toBeUndefined();
    expect(params.transfer_data).toBeUndefined();
  });

  it("passes the caller's idempotency key through untouched", async () => {
    piCreateMock.mockResolvedValue({ id: "pi_3", status: "succeeded" });
    await chargeOffSession({ ...BASE_ARGS, stripeAccountId: null });

    expect(piCreateMock.mock.calls[0][1]).toEqual({ idempotencyKey: "key-1" });
  });
});

describe("chargeOffSession result mapping", () => {
  it("returns status:'charged' with the created PI id on success", async () => {
    piCreateMock.mockResolvedValue({ id: "pi_ok", status: "succeeded" });
    const result = await chargeOffSession({ ...BASE_ARGS, stripeAccountId: null });
    expect(result).toEqual({ status: "charged", paymentIntentId: "pi_ok", chargedCents: 2500 });
  });

  it("maps SCA authentication_required to status:'requires_action' with the parked PI + client secret", async () => {
    const err: any = new Error("Authentication required");
    err.code = "authentication_required";
    err.raw = { payment_intent: { id: "pi_park", client_secret: "secret_abc" } };
    piCreateMock.mockRejectedValue(err);

    const result = await chargeOffSession({ ...BASE_ARGS, stripeAccountId: null });
    expect(result).toEqual({ status: "requires_action", paymentIntentId: "pi_park", clientSecret: "secret_abc" });
    expect(alertAdminMock).not.toHaveBeenCalled();
  });

  it("returns status:'failed' on a normal card decline and does NOT alert admin", async () => {
    const err: any = new Error("Your card was declined.");
    err.type = "StripeCardError";
    err.code = "card_declined";
    piCreateMock.mockRejectedValue(err);

    const result = await chargeOffSession({ ...BASE_ARGS, stripeAccountId: null });
    expect(result.status).toBe("failed");
    expect(alertAdminMock).not.toHaveBeenCalled();
  });

  it("returns status:'failed' AND alerts admin on a non-decline Stripe error (infra failure)", async () => {
    const err: any = new Error("Stripe API is temporarily unavailable");
    err.type = "StripeAPIError";
    piCreateMock.mockRejectedValue(err);

    const result = await chargeOffSession({ ...BASE_ARGS, stripeAccountId: null });
    expect(result.status).toBe("failed");
    expect(alertAdminMock).toHaveBeenCalledTimes(1);
  });
});

describe('Stripe pending results',()=>{
  it.each(['processing','requires_capture'])('preserves %s instead of reporting authentication or success',async status=>{
    piCreateMock.mockResolvedValue({id:'pi_pending',status});
    expect(await chargeOffSession({...BASE_ARGS,stripeAccountId:null})).toEqual({status:'pending',paymentIntentId:'pi_pending'});
    expect(alertAdminMock).not.toHaveBeenCalled();
  });
});
