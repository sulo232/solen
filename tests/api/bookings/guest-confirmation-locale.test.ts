// tests/api/bookings/guest-confirmation-locale.test.ts
//
// B7-guestlocale: POST /api/bookings resolved the confirmation email/SMS locale as
// `profile?.locale ?? "de"`. A guest has no profiles row, so profile is always null and
// every guest confirmation went out in German regardless of which locale-prefixed page
// they booked on. Fixed by threading an optional `locale` field through
// createBookingSchema (lib/validations.ts, mirrors bookingCancelSchema's existing guest
// field) and reading it as `profile?.locale ?? body.locale ?? "de"` at the point the
// route builds the confirmation email/SMS (app/api/bookings/route.ts).
//
// Drives the REAL POST handler end to end for a guest, in-person, single-service
// booking (no bundle, no extras, no promo, no online payment), scripting the exact
// `.from()` sequence that path issues on the admin (guest) client:
//   availability_slots select -> bookings duplicate-check select -> bookings insert
//   -> salons select (cancellation_window_hours).
// Every other DB-touching helper the handler imports (reference code, slot claim,
// auto-assign, bundle pricing, referral completion, search attribution) is mocked out
// at the module boundary, either because this path never reaches it or because its own
// internals are out of scope here (each already has its own unit tests elsewhere).
// lib/email is the one exception: only `sendEmail` is stubbed (via importOriginal), so
// `bookingConfirmation` is the REAL template function and its French subject is real
// French copy, not a fixture standing in for it.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { makeDbStub, type StubResult } from "../../helpers/supabase-stub";

vi.mock("@/lib/feature-flags", () => ({
  checkFeatureEnabled: vi.fn(() => Promise.resolve(null)),
  checkUserBanned: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/ratelimit", () => ({
  applyRateLimit: vi.fn(() => Promise.resolve(null)),
  bookingLimiter: {},
  bearerVerifyLimiter: {},
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@/lib/salon-detail", () => ({
  isSalonHidden: vi.fn(() => false),
  isViewerAdmin: vi.fn(() => Promise.resolve(false)),
}));

// Guest caller: no session, no Bearer token. The route only ever calls
// createAdminSupabaseClient() itself for the guest write path (`db`), never the
// `supabase` this helper would otherwise return, so a bare null stands in for it.
vi.mock("@/lib/auth/request-user", () => ({
  resolveRequestUser: vi.fn(() => Promise.resolve({ user: null, supabase: null })),
}));

const createAdminClientMock = vi.hoisted(() => vi.fn());
let dbStub: ReturnType<typeof makeDbStub>;
vi.mock("@/lib/supabase", () => ({
  createServerSupabaseClient: vi.fn(() => Promise.resolve(dbStub)),
  createAdminSupabaseClient: createAdminClientMock,
}));

// Out of scope for this fix: each already has its own coverage, and this booking
// (no bundle, no extras, single available slot, manual assignment, no referral, no
// search-attribution cookie) never reaches any of them.
vi.mock("@/lib/bookings/reference", () => ({
  assignReferenceCode: vi.fn(() => Promise.resolve("REF-TEST-1")),
}));
vi.mock("@/lib/bookings/claim-slot", () => ({
  claimSlot: vi.fn(() => Promise.resolve({ claimed: true, error: null })),
}));
vi.mock("@/lib/bookings/auto-assign", () => ({
  pickSlotForAnyStaff: vi.fn(),
  countStaffBookingsOnDay: vi.fn(() => Promise.resolve(0)),
}));
vi.mock("@/lib/pricing/bundle", () => ({
  loadPricedBundle: vi.fn(),
}));
vi.mock("@/lib/referral/complete-referral", () => ({
  completeReferralForFirstBooking: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/error-report", () => ({
  reportError: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/points/attribution", () => ({
  attributeBookingToSearch: vi.fn(() => Promise.resolve()),
}));

// lib/email's own getServerEnv() call is INSIDE sendEmail(), not at module top level, so
// importOriginal here is safe: bookingConfirmation stays the real template function (the
// thing under test), only the actual Resend network call is stubbed out.
const sendEmailMock = vi.fn(() => Promise.resolve());
vi.mock("@/lib/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/email")>();
  return { ...actual, sendEmail: sendEmailMock };
});

function ok<T>(data: T): StubResult<T> {
  return { data, error: null } as StubResult<T>;
}

const SALON_ROW = {
  id: "9bdcb5b0-974a-4d4f-abe8-ebb30b12e9e2",
  owner_id: null, // skips the step-8 owner-notify branch entirely
  name: "Salon Coiffure",
  address: "Rue de Test 1",
  is_active: true,
  listed_on_marketplace: true,
  is_test: false,
  auto_assign_method: "manual",
  daily_limit_enabled: false,
  daily_limit: null,
  online_booking_enabled: true,
  vacation_start: null,
  vacation_end: null,
  payment_mode: null,
  payment_mode_admin: null,
  payment_mode_enforced: false,
  booking_confirmation_mode: "instant",
  cancellation_fee_type: null,
  cancellation_fee_value: null,
  free_cancel_hours: 24,
  no_show_fee_type: null,
  no_show_fee_value: null,
  vat_registered: false,
  vat_rate: null,
  vat_number: null,
};

const SERVICE_ROW = {
  price: 60,
  name_de: "Herrenschnitt",
  name_en: "Men's Haircut",
  name_fr: "Coupe Homme",
  name_it: "Taglio Uomo",
};

const SLOT_ROW = {
  id: "de03e0ea-b683-40b7-80d4-e09af04b5728",
  salon_id: "9bdcb5b0-974a-4d4f-abe8-ebb30b12e9e2",
  service_id: "e57bfd7a-0551-46d5-adcd-f7e7350f78a2",
  starts_at: "2026-09-10T09:00:00.000Z",
  ends_at: "2026-09-10T09:30:00.000Z",
  staff_member_id: "6c3426fd-4e0a-44c6-831e-138104e3f28a",
  price_override: null,
  status: "available",
  salons: SALON_ROW,
  services: SERVICE_ROW,
};

function bookingResultRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "9650eefb-74e9-4015-8dff-ac04e0a6345d",
    salon_id: "9bdcb5b0-974a-4d4f-abe8-ebb30b12e9e2",
    service_id: "e57bfd7a-0551-46d5-adcd-f7e7350f78a2",
    slot_id: "de03e0ea-b683-40b7-80d4-e09af04b5728",
    starts_at: SLOT_ROW.starts_at,
    ends_at: SLOT_ROW.ends_at,
    status: "confirmed",
    ...overrides,
  };
}

function makeReq(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// The exact .from() call order the guest / in-person / single-service / no-bundle path
// issues on the admin (guest) client: availability_slots -> bookings (dup check) ->
// bookings (insert) -> salons (cancellation_window_hours).
function scriptGuestDbCalls() {
  dbStub = makeDbStub([
    ok([SLOT_ROW]), // availability_slots select
    ok([]), // bookings duplicate-check select: none found
    ok(bookingResultRow()), // bookings insert
    ok({ cancellation_window_hours: 24 }), // salons select
  ]);
}

const GUEST_BODY = {
  slot_id: "de03e0ea-b683-40b7-80d4-e09af04b5728",
  service_id: "e57bfd7a-0551-46d5-adcd-f7e7350f78a2",
  guest_name: "Marie Dupont",
  guest_phone: "+41791234567",
  guest_email: "marie@example.com",
};

describe("POST /api/bookings guest confirmation locale (B7-guestlocale)", () => {
  beforeEach(() => {
    sendEmailMock.mockClear();
    createAdminClientMock.mockReset().mockImplementation(() => dbStub);
  });

  it.each([
    ["de", "Buchungsbestätigung: Herrenschnitt bei Salon Coiffure"],
    ["en", "Booking confirmed: Men's Haircut at Salon Coiffure"],
    ["fr", "Réservation confirmée: Coupe Homme chez Salon Coiffure"],
    ["it", "Prenotazione confermata: Taglio Uomo presso Salon Coiffure"],
  ] as const)("renders the %s confirmation for a guest who booked in that locale", async (locale, subject) => {
    scriptGuestDbCalls();
    const { POST } = await import("@/app/api/bookings/route");
    const res = await POST(makeReq({ ...GUEST_BODY, locale }));
    const body = await res.json();
    expect(res.status, JSON.stringify(body)).toBe(201);

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const emailPayload = sendEmailMock.mock.calls[0][0] as { subject: string };
    expect(emailPayload.subject).toBe(subject);
  });

  it("falls back to German when the guest sends no locale", async () => {
    scriptGuestDbCalls();
    const { POST } = await import("@/app/api/bookings/route");
    const res = await POST(makeReq(GUEST_BODY));
    const body = await res.json();
    expect(res.status, JSON.stringify(body)).toBe(201);

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const emailPayload = sendEmailMock.mock.calls[0][0] as { subject: string };
    expect(emailPayload.subject).toBe("Buchungsbestätigung: Herrenschnitt bei Salon Coiffure");
  });

  it("refuses an invalid locale without sending a notification", async () => {
    dbStub = makeDbStub([]);
    const { POST } = await import("@/app/api/bookings/route");
    const res = await POST(makeReq({ ...GUEST_BODY, locale: "es" }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("still prefers a signed-in customer's profile.locale over the body locale", async () => {
    // Logged-in path: resolveRequestUser returns a real user, so the route reads
    // `profiles.locale` (it -> Italian) instead of falling through to the guest field,
    // even though the request body also carries a (different) locale. dbStub is
    // (re)pointed FIRST: mockResolvedValueOnce evaluates its argument immediately, so
    // `supabase: dbStub` must already reference the new scripted sequence, not the
    // previous test's (now-exhausted) one.
    dbStub = makeDbStub([
      ok([SLOT_ROW]), // availability_slots select
      ok({ is_first_visit_default: true, locale: "it", notification_email: true }), // profiles select
      ok([]), // bookings duplicate-check select
      ok(bookingResultRow({ user_id: "1789e604-6cc3-4093-b9de-a79a663a5e17" })), // bookings insert
      ok({ cancellation_window_hours: 24 }), // salons select
    ]);
    const requestUser = await import("@/lib/auth/request-user");
    (requestUser.resolveRequestUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      user: { id: "1789e604-6cc3-4093-b9de-a79a663a5e17", email: "user@example.com" },
      supabase: dbStub,
    });
    const { POST } = await import("@/app/api/bookings/route");
    const res = await POST(makeReq({
      slot_id: "de03e0ea-b683-40b7-80d4-e09af04b5728",
      service_id: "e57bfd7a-0551-46d5-adcd-f7e7350f78a2",
      locale: "fr", // logged-in body still sends a locale; profile.locale must win anyway
    }));
    const body = await res.json();
    expect(res.status, JSON.stringify(body)).toBe(201);

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const emailPayload = sendEmailMock.mock.calls[0][0] as { subject: string };
    expect(emailPayload.subject).toBe("Prenotazione confermata: Taglio Uomo presso Salon Coiffure");
  });
});
