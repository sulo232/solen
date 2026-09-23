import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { createTranslator } from "next-intl";
import de from "@/messages/de.json";
import en from "@/messages/en.json";
import fr from "@/messages/fr.json";
import itMessages from "@/messages/it.json";
import { makeQueryBuilder, type StubResult } from "../../helpers/supabase-stub";

const state = vi.hoisted(() => ({
  from: vi.fn(), sendSMS: vi.fn(), sendEmail: vi.fn(), authorized: true,
}));
vi.mock("@/lib/supabase", () => ({ createAdminSupabaseClient: () => ({ from: state.from }) }));
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ CRON_SECRET: "fixture", SEVEN_IO_API_KEY: "fixture" }) }));
vi.mock("@/lib/cron-auth", () => ({ verifyCronSecret: () => Promise.resolve(state.authorized) }));
vi.mock("@/lib/cron-run", () => ({
  withCronRun: async (_name: string, run: () => Promise<unknown>) => NextResponse.json(await run()),
}));
vi.mock("@/lib/sms", () => ({ sendSMS: (...args: unknown[]) => state.sendSMS(...args) }));
vi.mock("@/lib/email", () => ({
  sendEmail: (...args: unknown[]) => state.sendEmail(...args),
  bookingReminder: (to: string, vars: unknown, locale: string) => ({ to, vars, locale }),
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) =>
    createTranslator({ locale, messages: { de, en, fr, it: itMessages }[locale as "de"], namespace }),
}));

import { GET } from "@/app/api/cron/sms-reminders/route";

const ok = (data: unknown): StubResult => ({ data, error: null });
let queries: ReturnType<typeof makeQueryBuilder>[];
function script(results: StubResult[]) {
  queries = results.map(makeQueryBuilder);
  let index = 0;
  state.from.mockImplementation(() => {
    if (!queries[index]) throw new Error("Unexpected database operation");
    return queries[index++];
  });
}
function booking(locale: string | null, startsAt: string) {
  return {
    id: "booking-fixture", starts_at: startsAt,
    profiles: { phone_number: "+41790000000", notification_sms: true, notification_email: false, locale },
    salons: { name: "Atelier Rosé", address: "Rue du Lac 8, Genève", sms_reminder_24h: true, sms_reminder_1h: true },
    services: { name_de: "Schnitt", name_en: "Haircut", name_fr: "Coupe", name_it: "Taglio" },
  };
}
const request = () => new NextRequest("http://localhost/api/cron/sms-reminders", { headers: { authorization: "Bearer fixture" } });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-01T22:30:00Z"));
  state.authorized = true;
  state.from.mockReset();
  state.sendSMS.mockReset().mockResolvedValue(true);
  state.sendEmail.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("actual appointment reminder handler", () => {
  it.each(["de", "en", "fr", "it"])("sends both SMS windows in %s with the Swiss date and time", async (locale) => {
    script([ok([booking(locale, "2026-07-02T22:30:00Z")]), ok([{ id: "booking-fixture" }]),
      ok([booking(locale, "2026-07-01T23:30:00Z")]), ok([{ id: "booking-fixture" }])]);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(state.sendSMS).toHaveBeenCalledTimes(2);
    const messages = state.sendSMS.mock.calls.map((call) => call[1] as string);
    const prefix = { de: "Ihr Termin", en: "Your appointment", fr: "Votre rendez-vous", it: "Il Suo appuntamento" }[locale];
    expect(messages[0]).toContain(prefix);
    expect(messages[1]).toContain(prefix);
    expect(messages[0]).toContain("00:30");
    expect(messages[1]).toContain("01:30");
    expect(messages[0]).toContain(new Date("2026-07-02T22:30:00Z").toLocaleDateString(`${locale}-CH`, { timeZone: "Europe/Zurich" }));
    expect(messages[1]).toContain(new Date("2026-07-01T23:30:00Z").toLocaleDateString(`${locale}-CH`, { timeZone: "Europe/Zurich" }));
    expect(messages[0]).toContain("Rue du Lac 8, Genève");
    expect(messages[1]).not.toContain("Rue du Lac");
    expect(queries[0].eq).toHaveBeenCalledWith("status", "confirmed");
    expect(queries[0].gte).toHaveBeenCalledWith("starts_at", "2026-07-02T22:00:00.000Z");
    expect(queries[2].lte).toHaveBeenCalledWith("starts_at", "2026-07-02T00:00:00.000Z");
    expect(queries[1].eq).toHaveBeenCalledWith("sms_sent_24h", false);
    expect(queries[3].eq).toHaveBeenCalledWith("sms_sent_1h", false);
  });

  it.each([null, "unsupported"])("defaults %s locale to German and uses winter Swiss time", async (locale) => {
    script([ok([booking(locale, "2026-01-02T09:00:00Z")]), ok([{ id: "booking-fixture" }]), ok([])]);
    await GET(request());
    expect(state.sendSMS.mock.calls[0][1]).toContain("Ihr Termin");
    expect(state.sendSMS.mock.calls[0][1]).toContain("10:00");
  });

  it("preserves long real names and omits a missing address", async () => {
    const row = booking("fr", "2026-07-02T09:00:00Z");
    row.salons.name = "Atelier de coiffure et de soins de beauté du centre historique de Genève";
    row.salons.address = "";
    script([ok([row]), ok([{ id: row.id }]), ok([])]);
    await GET(request());
    const message = state.sendSMS.mock.calls[0][1];
    expect(message).toContain(row.salons.name);
    expect(message).not.toMatch(/Adresse|undefined|\{\w+\}/);
  });

  it("does not send if another run won the claim", async () => {
    script([ok([booking("en", "2026-07-02T09:00:00Z")]), ok([]), ok([])]);
    await GET(request());
    expect(state.sendSMS).not.toHaveBeenCalled();
  });

  it("releases the existing flag after a definite SMS rejection", async () => {
    state.sendSMS.mockResolvedValue(false);
    script([ok([booking("en", "2026-07-02T09:00:00Z")]), ok([{ id: "booking-fixture" }]), ok(null), ok([])]);
    const data = await (await GET(request())).json();
    expect(queries[2].update).toHaveBeenCalledWith({ sms_sent_24h: false });
    expect(data.sent24h).toBe(0);
    expect(data.errors).toHaveLength(1);
  });

  it("retains SMS opt-out and independent email delivery", async () => {
    const row = { ...booking("it", "2026-07-02T09:00:00Z"),
      profiles: { notification_sms: false, notification_email: true, email: "customer@example.com", locale: "it", phone_number: "+41790000000" } };
    script([ok([row]), ok([{ id: row.id }]), ok([])]);
    await GET(request());
    expect(state.sendSMS).not.toHaveBeenCalled();
    expect(state.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "customer@example.com", locale: "it" }));
  });

  it("rejects an unauthenticated run before database or provider access", async () => {
    state.authorized = false;
    expect((await GET(request())).status).toBe(401);
    expect(state.from).not.toHaveBeenCalled();
    expect(state.sendSMS).not.toHaveBeenCalled();
  });
});
