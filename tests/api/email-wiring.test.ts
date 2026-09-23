// tests/api/email-wiring.test.ts
//
// Four transactional emails wired into their primary actions (adapted from e438cbc68, barber
// reminder excluded). Each test drives the REAL route handler with a scripted db stub
// (tests/helpers/supabase-stub.ts). Only `sendEmail` is stubbed: the template builders are the
// real ones, so subjects/bodies below are real rendered copy. Per email: send, opt-out,
// send failure (primary action still succeeds, failure logged) and locale resolution.
// No network, no DB write, no real email.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { createTranslator } from "next-intl";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import itMessages from "@/messages/it.json";
import { makeDbStub, type StubResult } from "../helpers/supabase-stub";
import { onboardingWelcome } from "@/lib/email-templates/salon-onboarding";

const ok = <T,>(data: T): StubResult<T> => ({ data, error: null }) as StubResult<T>;
const fail = (message: string): StubResult => ({ data: null, error: { message } });

const sendEmailMock = vi.fn((_payload: unknown) => Promise.resolve());
vi.mock("@/lib/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/email")>();
  return { ...actual, sendEmail: (payload: unknown) => sendEmailMock(payload) };
});

vi.mock("next-intl/server", () => ({
  getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) =>
    createTranslator({ locale, messages: { de, en, fr, it: itMessages }[locale as "de"], namespace }),
}));

vi.mock("@/lib/ratelimit", () => ({
  applyRateLimit: vi.fn(() => Promise.resolve(null)),
  bookingLimiter: {},
  generalLimiter: {},
  authLimiter: {},
  getClientIp: vi.fn(() => "127.0.0.1"),
}));

vi.mock("@/lib/feature-flags", () => ({
  checkFeatureEnabled: vi.fn(() => Promise.resolve(null)),
  checkUserBanned: vi.fn(() => Promise.resolve(null)),
}));

const getServerEnvMock = vi.fn();
const getPublicEnvMock = vi.fn();
vi.mock("@/lib/env", () => ({
  getServerEnv: () => getServerEnvMock(),
  getPublicEnv: () => getPublicEnvMock(),
}));

vi.mock("@/lib/ai/translate", () => ({ autoTranslateDescription: vi.fn(() => Promise.resolve("")) }));
vi.mock("@/lib/search/embeddings", () => ({ generateEmbedding: vi.fn(() => Promise.resolve(null)) }));

let sessionDbStub: any;
let adminDbStub: any;
vi.mock("@/lib/supabase", () => ({
  getSessionUser: vi.fn(() => Promise.resolve({ supabase: sessionDbStub, user: null })),
  createServerSupabaseClient: vi.fn(() => Promise.resolve(sessionDbStub)),
  createAdminSupabaseClient: vi.fn(() => adminDbStub),
}));

vi.mock("@/lib/bookings/authorize", () => ({ resolveBookingActor: vi.fn() }));
vi.mock("@/lib/bookings/claim-slot", () => ({
  claimSlot: vi.fn(() => Promise.resolve({ claimed: true, error: null })),
}));

const LOYALTY_IDS = {
  salonId: "9bdcb5b0-974a-4d4f-abe8-ebb30b12e9e2",
  customerId: "1789e604-6cc3-4093-b9de-a79a663a5e17",
  cardId: "a1b2c3d4-0000-4000-8000-000000000001",
};
vi.mock("@/lib/barber/loyalty-qr", () => ({
  verifyLoyaltyQRToken: vi.fn(() => ({ valid: true, ...LOYALTY_IDS })),
}));

let partnerInsertResult: { error: { code?: string; message: string } | null } = { error: null };
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({ insert: vi.fn(() => Promise.resolve(partnerInsertResult)) })),
  })),
}));

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  sendEmailMock.mockReset().mockResolvedValue(undefined);
  getServerEnvMock.mockReset();
  getPublicEnvMock.mockReset();
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterEach(() => { vi.restoreAllMocks(); });

const withAuth = (stub: any, email: string | null) => {
  stub.auth = { admin: { getUserById: vi.fn(() => Promise.resolve({ data: { user: email ? { email } : null } })) } };
  return stub;
};
const loggedWith = (prefix: string) =>
  errorSpy.mock.calls.some((c: unknown[]) => typeof c[0] === "string" && c[0].startsWith(prefix));
const jsonReq = (url: string, body: unknown) =>
  new NextRequest(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

// ---------------------------------------------------------------------------
// (1) Booking reschedule -> customer, gated on profiles.notification_email
// ---------------------------------------------------------------------------

const BOOKING = {
  id: "9650eefb-74e9-4015-8dff-ac04e0a6345d",
  user_id: "1789e604-6cc3-4093-b9de-a79a663a5e17",
  salon_id: "9bdcb5b0-974a-4d4f-abe8-ebb30b12e9e2",
  service_id: "e57bfd7a-0551-46d5-adcd-f7e7350f78a2",
  staff_member_id: null,
  slot_id: "de03e0ea-b683-40b7-80d4-e09af04b5728",
  starts_at: "2027-01-15T09:00:00.000Z",
  ends_at: "2027-01-15T09:30:00.000Z",
  status: "confirmed",
  guest_email: null as string | null,
};
const NEW_START = "2027-01-20T10:00:00.000Z";
const NEW_END = "2027-01-20T10:30:00.000Z";
const SERVICE = { name_de: "Damen-Haarschnitt", name_en: "Women Cut", name_fr: "Coupe Dame", name_it: "Taglio donna" };

async function runReschedule(opts: {
  booking?: typeof BOOKING;
  actor?: "customer" | "guest";
  profile?: StubResult;
  casWins?: boolean;
  authEmail?: string | null;
}) {
  const booking = opts.booking ?? BOOKING;
  const authorize = await import("@/lib/bookings/authorize");
  (authorize.resolveBookingActor as ReturnType<typeof vi.fn>).mockResolvedValue({
    actor: opts.actor ?? "customer", booking, userId: booking.user_id,
  });
  sessionDbStub = makeDbStub([ok({ id: "new-slot-1" })]);
  const updated = { ...booking, slot_id: "new-slot-1", starts_at: NEW_START, ends_at: NEW_END };
  const script: StubResult[] = opts.casWins === false
    ? [ok(null), ok(null)] // CAS lost -> release claimed slot
    : [
        ok(updated), // bookings CAS update
        ok(null), // free old slot
        ...(booking.user_id ? [opts.profile ?? ok({ locale: "fr", notification_email: true })] : []),
        ok(SERVICE), // services
        ok({ name: "Salon Coiffure" }), // salons
      ];
  adminDbStub = withAuth(makeDbStub(script), opts.authEmail === undefined ? "cust@example.com" : opts.authEmail);
  const { POST } = await import("@/app/api/bookings/[id]/reschedule/route");
  const res = await POST(
    jsonReq("http://localhost/api/bookings/x/reschedule", { new_starts_at: NEW_START, new_ends_at: NEW_END }),
    { params: Promise.resolve({ id: booking.id }) }
  );
  return { res, body: await res.json(), updated };
}

describe("POST /api/bookings/[id]/reschedule email", () => {
  it("sends one reschedule email in the customer's stored locale, Swiss wall-clock time", async () => {
    const { res, body, updated } = await runReschedule({});
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, booking: updated });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const p = sendEmailMock.mock.calls[0][0] as { to: string; subject: string; html: string };
    expect(p.to).toBe("cust@example.com");
    expect(p.subject).toBe("Réservation reprogrammée: Coupe Dame chez Salon Coiffure");
    // 10:00Z in January is 11:00 in Zurich; 09:00Z is 10:00.
    expect(p.html).toContain("11:00");
    expect(p.html).toContain("10:00");
    expect(p.html).not.toContain(" 09:00");
  });

  it("sends nothing when the customer opted out (notification_email = false)", async () => {
    const { res, body } = await runReschedule({ profile: ok({ locale: "fr", notification_email: false }) });
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("fails closed when the preference cannot be read", async () => {
    const { res } = await runReschedule({ profile: fail("boom") });
    expect(res.status).toBe(200);
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(loggedWith("[Reschedule] notification preference lookup failed")).toBe(true);
  });

  it("keeps the 200 success response and logs when the send fails", async () => {
    sendEmailMock.mockRejectedValueOnce(new Error("Resend down"));
    const { res, body, updated } = await runReschedule({});
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, booking: updated });
    expect(loggedWith("[Reschedule] customer reschedule email failed")).toBe(true);
  });

  it("falls back to German for a missing or unsupported stored locale", async () => {
    await runReschedule({ profile: ok({ locale: "xx", notification_email: null }) });
    const p = sendEmailMock.mock.calls[0][0] as { subject: string };
    expect(p.subject).toBe("Buchung verschoben: Damen-Haarschnitt bei Salon Coiffure");
  });

  it("emails a guest booking's guest_email (no profile, German)", async () => {
    const guest = { ...BOOKING, user_id: null as unknown as string, guest_email: "guest@example.com" };
    const { res } = await runReschedule({ booking: guest, actor: "guest" });
    expect(res.status).toBe(200);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const p = sendEmailMock.mock.calls[0][0] as { to: string; subject: string };
    expect(p.to).toBe("guest@example.com");
    expect(p.subject).toMatch(/^Buchung verschoben:/);
  });

  it("sends nothing when the CAS write loses (booking not moved)", async () => {
    const { res } = await runReschedule({ casWins: false });
    expect(res.status).toBe(409);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// (2) Loyalty stamp -> customer on card completion, gated on profiles.notification_email
// ---------------------------------------------------------------------------

async function runStamp(opts: {
  stamps?: number;
  program?: Record<string, unknown>;
  updateRows?: unknown[];
  profile?: StubResult;
}) {
  getServerEnvMock.mockReturnValue({ LOYALTY_HMAC_SECRET: "test-secret" });
  sessionDbStub = { auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "owner-1" } } })) } };
  const stamps = opts.stamps ?? 9;
  const script: StubResult[] = [
    ok({ id: LOYALTY_IDS.salonId, name: "Salon Coiffure" }),
    ok({ id: LOYALTY_IDS.cardId, stamps, barber_loyalty_programs: opts.program ?? { stamps_required: 10, reward_type: "chf_discount", reward_value: 20 } }),
    ok(opts.updateRows ?? [{ id: LOYALTY_IDS.cardId }]),
    opts.profile ?? ok({ locale: "fr", notification_email: true, display_name: "Marie" }),
  ];
  adminDbStub = withAuth(makeDbStub(script), "cust@example.com");
  const { POST } = await import("@/app/api/loyalty/stamp/route");
  const res = await POST(jsonReq("http://localhost/api/loyalty/stamp", { token: "test-loyalty-token-1234567" }));
  return { res, body: await res.json() };
}

describe("POST /api/loyalty/stamp reward email", () => {
  it("sends one reward email in the customer's locale when the card completes", async () => {
    const { res, body } = await runStamp({});
    expect(res.status).toBe(200);
    expect(body).toEqual({ stamped: true, stamps_collected: 10, stamps_required: 10, is_complete: true });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const p = sendEmailMock.mock.calls[0][0] as { to: string; subject: string; html: string };
    expect(p.to).toBe("cust@example.com");
    expect(p.subject).toBe("Votre carte fidélité chez Salon Coiffure est complète !");
    expect(p.html).toContain("Remise de CHF 20");
    expect(p.html).toContain("https://solen.ch/fr/profile");
  });

  it("does not send for a stamp that does not complete the card", async () => {
    const { body } = await runStamp({ stamps: 3 });
    expect(body.is_complete).toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("does not send when a concurrent scan already completed the card (0 rows updated)", async () => {
    const { res } = await runStamp({ updateRows: [] });
    expect(res.status).toBe(200);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("sends nothing when the customer opted out", async () => {
    const { res } = await runStamp({ profile: ok({ locale: "fr", notification_email: false, display_name: "Marie" }) });
    expect(res.status).toBe(200);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("keeps the stamp response and logs when the send fails", async () => {
    sendEmailMock.mockRejectedValueOnce(new Error("Resend down"));
    const { res, body } = await runStamp({});
    expect(res.status).toBe(200);
    expect(body.is_complete).toBe(true);
    expect(loggedWith("[loyalty/stamp] reward email failed")).toBe(true);
  });

  it("uses German for a null locale and the real reward wording per type", async () => {
    await runStamp({ profile: ok({ locale: null, notification_email: true, display_name: "Mia" }), program: { stamps_required: 10, reward_type: "free_service", reward_value: null } });
    const p = sendEmailMock.mock.calls[0][0] as { subject: string; html: string };
    expect(p.subject).toBe("Ihre Treuekarte bei Salon Coiffure ist voll!");
    expect(p.html).toContain("Gratis Service");
  });

  it("renders a percentage reward in Italian", async () => {
    await runStamp({ profile: ok({ locale: "it", notification_email: true, display_name: "Gia" }), program: { stamps_required: 10, reward_type: "percentage_discount", reward_value: 15 } });
    const p = sendEmailMock.mock.calls[0][0] as { html: string };
    expect(p.html).toContain("Sconto del 15%");
  });
});

// ---------------------------------------------------------------------------
// (3) Partner lead -> internal ADMIN_EMAIL alert (no end-user preference applies)
// ---------------------------------------------------------------------------

async function runLead(adminEmail: string | undefined) {
  getPublicEnvMock.mockReturnValue({ NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co" });
  getServerEnvMock.mockReturnValue({ SUPABASE_SERVICE_ROLE_KEY: "test-key", ADMIN_EMAIL: adminEmail });
  const { POST } = await import("@/app/api/partner/leads/route");
  const res = await POST(jsonReq("http://localhost/api/partner/leads", { email: "owner@example.com", salon_name: "Nouveau <Salon>" }));
  return { res, body: await res.json() };
}

describe("POST /api/partner/leads admin alert", () => {
  beforeEach(() => { partnerInsertResult = { error: null }; });

  it("sends one alert to ADMIN_EMAIL (never the lead) after the insert, HTML-escaped", async () => {
    const { res, body } = await runLead("admin@solen.ch");
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    const p = sendEmailMock.mock.calls[0][0] as { to: string; subject: string; html: string };
    expect(p.to).toBe("admin@solen.ch");
    expect(p.subject).toBe("Neuer Partner-Lead: Nouveau <Salon>");
    expect(p.html).toContain("Nouveau &lt;Salon&gt;");
    expect(p.html).toContain("owner@example.com");
  });

  it("does not send when ADMIN_EMAIL is unset", async () => {
    const { res } = await runLead(undefined);
    expect(res.status).toBe(200);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("does not send when the insert fails (500 unchanged)", async () => {
    partnerInsertResult = { error: { code: "23505", message: "dup" } };
    const { res } = await runLead("admin@solen.ch");
    expect(res.status).toBe(500);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("does not send on the missing-table fallthrough (nothing stored)", async () => {
    partnerInsertResult = { error: { code: "42P01", message: "undefined_table" } };
    const { res } = await runLead("admin@solen.ch");
    expect(res.status).toBe(200);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("keeps the 200 success response and logs when the send fails", async () => {
    sendEmailMock.mockRejectedValueOnce(new Error("Resend down"));
    const { res, body } = await runLead("admin@solen.ch");
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(loggedWith("[partner/leads] admin lead alert email failed")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// (4) Salon creation -> owner welcome, owner locale, gated on profiles.notification_email
// ---------------------------------------------------------------------------

const SALON_ID = "5c1e7d2a-1111-4222-8333-444455556666";
async function runCreateSalon(profile: StubResult) {
  sessionDbStub = { auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: "owner-1", email: "owner@example.com" } } })) } };
  // cities select, salons insert, profiles select, profiles update
  adminDbStub = makeDbStub([ok({ id: "city-1" }), ok({ id: SALON_ID }), profile, ok(null)]);
  const { POST } = await import("@/app/api/salons/route");
  const res = await POST(jsonReq("http://localhost/api/salons", {
    name: "Atelier Nord", email: "contact@atelier.example", categories: ["coiffeur"], city: "basel", address: "Hauptstrasse 1",
  }));
  return { res, body: await res.json() };
}

describe("POST /api/salons owner welcome email", () => {
  it("sends one welcome email in the owner's stored locale", async () => {
    const { res, body } = await runCreateSalon(ok({ role: "customer", locale: "it", notification_email: true }));
    expect(res.status).toBe(200);
    expect(Object.keys(body).sort()).toEqual(["id", "slug"]);
    expect(body.id).toBe(SALON_ID);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock.mock.calls[0][0]).toEqual(onboardingWelcome("contact@atelier.example", { salonName: "Atelier Nord" }, "it"));
  });

  it("sends nothing when the owner opted out", async () => {
    const { res } = await runCreateSalon(ok({ role: "customer", locale: "it", notification_email: false }));
    expect(res.status).toBe(200);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("fails closed when the owner profile cannot be read", async () => {
    const { res } = await runCreateSalon(fail("boom"));
    expect(res.status).toBe(200);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("keeps the created-salon response and logs when the send fails", async () => {
    sendEmailMock.mockRejectedValueOnce(new Error("Resend down"));
    const { res, body } = await runCreateSalon(ok({ role: "salon_owner", locale: "en", notification_email: true }));
    expect(res.status).toBe(200);
    expect(body.id).toBe(SALON_ID);
    expect(loggedWith("[SalonsRoute] failed to send onboarding welcome email")).toBe(true);
  });

  it("falls back to German for an unsupported stored locale", async () => {
    await runCreateSalon(ok({ role: "customer", locale: "es", notification_email: null }));
    expect(sendEmailMock.mock.calls[0][0]).toEqual(onboardingWelcome("contact@atelier.example", { salonName: "Atelier Nord" }, "de"));
  });
});
