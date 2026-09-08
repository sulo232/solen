import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ send: vi.fn(), insert: vi.fn(), profiles: [] as any[], prefs: [] as any[], day: 3, selects: [] as string[] }));
vi.mock("@/lib/supabase", () => ({ createAdminSupabaseClient: () => ({ from(table: string) {
  let date = "";
  const q: any = { select: (cols: string) => { state.selects.push(cols); return q; }, eq: () => q, in: () => q, gte: (_key: string, value: string) => { date = value; return q; }, lt: () => q, insert: state.insert, then: (resolve: any) => {
    const expected = new Date(); expected.setDate(expected.getDate() - state.day);
    const data = table === "profiles" ? (date.startsWith(expected.toISOString().slice(0, 10)) ? state.profiles : []) : table === "notification_preferences" ? state.prefs : [];
    return Promise.resolve({ data }).then(resolve);
  } }; return q;
} }) }));
vi.mock("@/lib/email", () => ({ sendEmail: state.send }));
vi.mock("@/lib/email-templates/welcome-series", () => ({ welcomeDay0: (to: string) => ({ to }), welcomeDay3: (to: string) => ({ to }), welcomeDay7: (to: string) => ({ to }) }));
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ CRON_SECRET: "fixture" }) }));
vi.mock("@/lib/cron-auth", () => ({ verifyCronSecret: async () => true }));
vi.mock("@/lib/cron-run", () => ({ withCronRun: async (_name: string, run: any) => run() }));
import { GET } from "@/app/api/cron/welcome-series/route";
beforeEach(() => { vi.clearAllMocks(); state.day = 3; state.selects = []; state.send.mockResolvedValue(undefined); state.insert.mockResolvedValue({ error: null }); });
it.each([0, 3, 7])("excludes banned and suspended at day %s while retaining transactional/opt-in policy", async (day) => {
  state.day = day;
  state.profiles = ["enabled", "opted-out", "missing", "banned", "suspended"].map((id) => ({ id, email: `${id}@example.test`, banned_at: id === "banned" ? "2026-01-01" : null, is_suspended: id === "suspended", locale: "en" }));
  state.prefs = ["enabled", "opted-out", "banned", "suspended"].map((user_id) => ({ user_id, deals_enabled: user_id !== "opted-out" }));
  const result = await GET(new NextRequest("http://localhost/api/cron/welcome-series"));
  expect(state.selects).toContain("id, display_name, locale, email, banned_at, is_suspended");
  expect(state.send.mock.calls.map(([payload]) => payload.to)).toEqual(day === 0 ? ["enabled@example.test", "opted-out@example.test", "missing@example.test"] : ["enabled@example.test"]);
  expect((result as any).processed).toBe(day === 0 ? 3 : 1);
  expect(state.insert.mock.calls[0][0].map((row: any) => row.user_id)).toEqual(day === 0 ? ["enabled", "opted-out", "missing"] : ["enabled"]);
});
