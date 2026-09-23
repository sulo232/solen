// tests/api/cron/salon-onboarding-optout.test.ts
//
// The onboarding cron no longer sends the day-0 welcome (POST /api/salons sends it at creation)
// and skips owners with profiles.notification_email === false. Drives the real handler with a
// table-aware db stub; only sendEmail, cron auth and the cron-run wrapper are stubbed.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { makeQueryBuilder } from "../../helpers/supabase-stub";

const sendEmailMock = vi.fn((_payload: { to: string; subject: string }) => Promise.resolve());
vi.mock("@/lib/email", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/email")>();
  return { ...actual, sendEmail: (p: { to: string; subject: string }) => sendEmailMock(p) };
});
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ CRON_SECRET: "secret" }) }));
vi.mock("@/lib/cron-auth", () => ({ verifyCronSecret: vi.fn(() => Promise.resolve(true)) }));
vi.mock("@/lib/cron-run", () => ({
  withCronRun: async (_name: string, fn: () => Promise<unknown>) => Response.json(await fn()),
}));

const SALONS = [
  { id: "s-in", owner_id: "o-in", name: "Opted In", cover_photo_url: null, description_de: null },
  { id: "s-out", owner_id: "o-out", name: "Opted Out", cover_photo_url: null, description_de: null },
];
const PROFILES = [
  { id: "o-in", email: "in@example.ch", locale: "de", notification_email: true },
  { id: "o-out", email: "out@example.ch", locale: "de", notification_email: false },
];

let inserted: unknown[] = [];
vi.mock("@/lib/supabase", () => ({
  createAdminSupabaseClient: () => ({
    from: (table: string) => {
      if (table === "salons") return makeQueryBuilder({ data: SALONS, error: null });
      if (table === "profiles") return makeQueryBuilder({ data: PROFILES, error: null });
      if (table === "services") return makeQueryBuilder({ data: [], error: null });
      if (table === "notifications") {
        const b = makeQueryBuilder({ data: [], error: null });
        b.insert = vi.fn((rows: unknown[]) => { inserted.push(...rows); return makeQueryBuilder({ data: null, error: null }); });
        return b;
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

describe("GET /api/cron/salon-onboarding", () => {
  beforeEach(() => { sendEmailMock.mockClear(); inserted = []; });

  it("never sends the welcome and skips opted-out owners", async () => {
    const { GET } = await import("@/app/api/cron/salon-onboarding/route");
    const res = await GET(new NextRequest("http://localhost/api/cron/salon-onboarding", { headers: { authorization: "Bearer secret" } }));
    expect(res.status).toBe(200);

    const recipients = sendEmailMock.mock.calls.map(([p]) => p.to);
    const subjects = sendEmailMock.mock.calls.map(([p]) => p.subject);
    // Day 2 (no description), day 4 (no services), day 6 (no cover) apply to the opted-in owner only.
    expect(recipients).toEqual(["in@example.ch", "in@example.ch", "in@example.ch"]);
    expect(recipients).not.toContain("out@example.ch");
    expect(subjects.some((s) => s.startsWith("Willkommen"))).toBe(false);
    expect(inserted).toHaveLength(3);
  });
});
