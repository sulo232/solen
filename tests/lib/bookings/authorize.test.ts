// tests/lib/bookings/authorize.test.ts
//
// testing-release-09: resolveBookingActor (lib/bookings/authorize.ts) is THE
// single authorization resolver every booking sub-route (refund, cancel,
// report, guest lookup) is supposed to call. It doesn't move money directly,
// but a wrong actor resolution here is exactly what lets a wrong party issue
// a refund or read another customer's booking, so it belongs in the same
// money-path test tier. Pure-logic level, hand-stubbed db + mocked auth
// boundary, no network.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeFromSequence, type StubResult } from "../../helpers/supabase-stub";

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ UPSTASH_REDIS_REST_URL: undefined, UPSTASH_REDIS_REST_TOKEN: undefined }),
}));

const getUserMock = vi.fn();
vi.mock("@/lib/supabase", () => ({
  createAdminSupabaseClient: () => adminStub,
  createServerSupabaseClient: async () => ({ auth: { getUser: getUserMock } }),
}));

const readGuestCookieMock = vi.fn();
const verifyAccessTokenMock = vi.fn();
vi.mock("@/lib/bookings/guest-access", () => ({
  readGuestCookie: (...args: unknown[]) => readGuestCookieMock(...args),
  verifyAccessToken: (...args: unknown[]) => verifyAccessTokenMock(...args),
}));

import { resolveBookingActor } from "@/lib/bookings/authorize";

let adminStub: { from: ReturnType<typeof makeFromSequence> };

function setAdminSequence(results: StubResult[]) {
  adminStub = { from: makeFromSequence(results) };
}

const fakeReq = { headers: { get: () => null } } as any;
const BOOKING_ID = "bk-1";

function bookingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    user_id: "cust-1",
    salon_id: "salon-1",
    access_token_hash: "hash",
    access_token_expires_at: "2099-01-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  getUserMock.mockReset();
  readGuestCookieMock.mockReset();
  verifyAccessTokenMock.mockReset();
});

describe("resolveBookingActor", () => {
  it("returns { actor: null, booking: null } for an unknown booking id, without even checking auth", async () => {
    setAdminSequence([{ data: null, error: null }]);

    const result = await resolveBookingActor(fakeReq, "does-not-exist");

    expect(result).toEqual({ actor: null, booking: null, userId: null });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("resolves 'customer' when the verified user owns the booking (booking.user_id match)", async () => {
    setAdminSequence([{ data: bookingRow({ user_id: "cust-1" }), error: null }]);
    getUserMock.mockResolvedValue({ data: { user: { id: "cust-1" } } });

    const result = await resolveBookingActor(fakeReq, BOOKING_ID);

    expect(result.actor).toBe("customer");
    expect(result.userId).toBe("cust-1");
  });

  it("resolves 'admin' when the user isn't the owner but has profiles.role='admin'", async () => {
    setAdminSequence([
      { data: bookingRow({ user_id: "cust-1" }), error: null }, // bookings fetch
      { data: { role: "admin" }, error: null }, // profiles fetch
    ]);
    getUserMock.mockResolvedValue({ data: { user: { id: "admin-1" } } });

    const result = await resolveBookingActor(fakeReq, BOOKING_ID);

    expect(result.actor).toBe("admin");
    expect(result.userId).toBe("admin-1");
  });

  it("resolves 'salon' when the user isn't owner/admin but owns the booking's salon", async () => {
    setAdminSequence([
      { data: bookingRow({ user_id: "cust-1", salon_id: "salon-1" }), error: null },
      { data: { role: "customer" }, error: null },
      { data: { owner_id: "salon-owner-1" }, error: null },
    ]);
    getUserMock.mockResolvedValue({ data: { user: { id: "salon-owner-1" } } });

    const result = await resolveBookingActor(fakeReq, BOOKING_ID);

    expect(result.actor).toBe("salon");
    expect(result.userId).toBe("salon-owner-1");
  });

  it("resolves actor:null for an authenticated user with no entitlement (no guest fallthrough for a logged-in user)", async () => {
    setAdminSequence([
      { data: bookingRow({ user_id: "cust-1", salon_id: "salon-1" }), error: null },
      { data: { role: "customer" }, error: null },
      { data: { owner_id: "some-other-owner" }, error: null },
    ]);
    getUserMock.mockResolvedValue({ data: { user: { id: "stranger-1" } } });

    const result = await resolveBookingActor(fakeReq, BOOKING_ID);

    expect(result.actor).toBeNull();
    expect(result.userId).toBeNull();
    // Booking row is still returned so the caller can tell "exists but not
    // entitled" (403) apart from "doesn't exist" (404).
    expect(result.booking).not.toBeNull();
  });

  it("resolves 'guest' when no verified user is present and the guest cookie's token verifies against this booking", async () => {
    setAdminSequence([{ data: bookingRow(), error: null }]);
    getUserMock.mockResolvedValue({ data: { user: null } });
    readGuestCookieMock.mockReturnValue({ bookingId: BOOKING_ID, raw: "raw-token" });
    verifyAccessTokenMock.mockReturnValue(true);

    const result = await resolveBookingActor(fakeReq, BOOKING_ID);

    expect(result.actor).toBe("guest");
    expect(result.userId).toBeNull();
    expect(verifyAccessTokenMock).toHaveBeenCalledWith("raw-token", "hash", "2099-01-01T00:00:00Z");
  });

  it("rejects a guest cookie minted for a DIFFERENT booking (no cross-booking replay)", async () => {
    setAdminSequence([{ data: bookingRow(), error: null }]);
    getUserMock.mockResolvedValue({ data: { user: null } });
    readGuestCookieMock.mockReturnValue({ bookingId: "some-other-booking", raw: "raw-token" });

    const result = await resolveBookingActor(fakeReq, BOOKING_ID);

    expect(result.actor).toBeNull();
    expect(verifyAccessTokenMock).not.toHaveBeenCalled();
  });

  it("resolves actor:null when there's no user and no valid guest cookie", async () => {
    setAdminSequence([{ data: bookingRow(), error: null }]);
    getUserMock.mockResolvedValue({ data: { user: null } });
    readGuestCookieMock.mockReturnValue(null);

    const result = await resolveBookingActor(fakeReq, BOOKING_ID);

    expect(result).toEqual({ actor: null, booking: bookingRow(), userId: null });
  });
});
