import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const h = vi.hoisted(() => ({
  access: vi.fn(), admin: vi.fn(),
  rows: {} as Record<string, Record<string, any>[]>,
  calls: [] as { table: string; filters: [string, string, any][]; from: number; to: number; count: boolean }[],
  cap: 1000,
  failure: null as null | { table: string; page: number; kind: "error" | "empty" | "count" | "missing-count" | "duplicate" },
}));
vi.mock("@/lib/auth/require", () => ({ requireSalonAccess: h.access }));
vi.mock("@/lib/supabase", () => ({ createAdminSupabaseClient: h.admin }));
import { GET } from "@/app/api/salon/clients/route";

const NOW = new Date("2026-09-08T12:00:00.000Z");
const DAY = 86400000;
const at = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString();
let serial = 0;
function booking(user: string, days: number, extra: Record<string, any> = {}) {
  return { id: String(++serial).padStart(8, "0"), user_id: user, salon_id: "salon-a", starts_at: at(days), status: "completed", price_paid: 125, paid_amount: 12500, refunded_amount: 0, payment_status: "paid", ...extra };
}
function database() {
  return { from(table: string) {
    if (!(table in h.rows)) throw new Error(`Unexpected table ${table}`);
    const filters: [string, string, any][] = [];
    let from = 0, to = Infinity, count = false, order = "", asc = true;
    const q = {
      select(_fields: string, options?: { count?: string }) { count = options?.count === "exact"; return q; },
      eq(key: string, value: any) { filters.push(["eq", key, value]); return q; },
      not(key: string, op: string, value: any) { filters.push(["not", key, value]); return q; },
      in(key: string, values: any[]) { filters.push(["in", key, values]); return q; },
      order(key: string, options: { ascending?: boolean } = {}) { order = key; asc = options.ascending !== false; return q; },
      range(a: number, b: number) { from = a; to = b; return q; },
      then(resolve: (value: any) => any, reject: (error: any) => any) {
        h.calls.push({ table, filters, from, to, count });
        let rows = h.rows[table].filter(row => filters.every(([op, key, value]) => op === "eq" ? row[key] === value : op === "not" ? row[key] !== value : value.includes(row[key])));
        if (order) rows = [...rows].sort((a, b) => String(a[order]).localeCompare(String(b[order])) * (asc ? 1 : -1));
        const matched = rows.length;
        const page = h.calls.filter(c => c.table === table).length;
        const fail = h.failure?.table === table && h.failure.page === page ? h.failure.kind : null;
        return Promise.resolve({
          data: fail === "error" ? null : fail === "empty" ? [] : fail === "duplicate" ? rows.slice(0, h.cap) : rows.slice(from, Math.min(to + 1, from + h.cap)),
          error: fail === "error" ? { message: "fixture query failed" } : null,
          count: count && fail !== "missing-count" ? matched + (fail === "count" ? 1 : 0) : null,
        }).then(resolve, reject);
      },
    };
    return q;
  } };
}
async function get(salon = "salon-a") {
  return GET(new NextRequest(`http://localhost/api/salon/clients${salon ? `?salon_id=${salon}` : ""}`));
}
async function clients() {
  const response = await get();
  expect(response.status).toBe(200);
  return (await response.json()).clients;
}
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(NOW);
  serial = 0; h.cap = 1000; h.failure = null; h.calls = [];
  h.rows = { bookings: [], public_profiles: [], client_tags: [] };
  h.access.mockReset().mockResolvedValue({ user: { id: "granted-staff" } });
  h.admin.mockReset().mockImplementation(database);
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe("Store CRM segments through the actual handler", () => {
  it.each([
    [4, 12500, 10, "VIP"], [4, 12499, 10, "Regulär"], [3, 20000, 10, "Regulär"],
    [2, 1000, 90, "Regulär"], [2, 1000, 90.999, "Regulär"], [2, 1000, 91, "Gefährdet"],
    [1, 1000, 29.999, "Neu"], [1, 1000, 30, "Regulär"], [1, 1000, 31, "Regulär"],
    [4, 12500, 120, "VIP"],
  ])("%i visits, %i Rappen per visit, %s days gives %s", async (count, paid, days, expected) => {
    h.rows.bookings = Array.from({ length: count }, () => booking("u", days, { paid_amount: paid }));
    expect((await clients())[0].segment_tag).toBe(expected);
  });
  it("excludes canceled, no-show, confirmed and future completed visits from segments but preserves public counts/latest/spend", async () => {
    h.rows.bookings = [booking("u", 100), booking("u", 101), booking("u", 1, { status: "cancelled" }), booking("u", 0, { status: "no_show" }), booking("u", -1, { status: "confirmed" }), booking("u", -2)];
    expect((await clients())[0]).toMatchObject({ segment_tag: "Gefährdet", total_bookings: 6, last_visit: at(-2), total_spent: 375 });
  });
  it("zero completed past visits are regular even with upcoming rows", async () => {
    h.rows.bookings = [booking("u", -1), booking("u", 5, { status: "cancelled" })];
    expect((await clients())[0].segment_tag).toBe("Regulär");
  });
  it("uses net retained charged Rappen, not face price, without changing public total_spent", async () => {
    h.rows.bookings = Array.from({ length: 4 }, () => booking("u", 5, { price_paid: 999, paid_amount: 12500, refunded_amount: 1 }));
    expect((await clients())[0]).toMatchObject({ segment_tag: "Regulär", total_spent: 3996 });
  });
  it("partial refunds preserve completed visit frequency", async () => {
    h.rows.bookings = [booking("u", 100, { refunded_amount: 10000 }), booking("u", 101, { refunded_amount: 10000 })];
    expect((await clients())[0].segment_tag).toBe("Gefährdet");
  });
  it.each([null, 0])("retains legacy recorded-price proxy when amount %s is not settled", async paid_amount => {
    h.rows.bookings = Array.from({ length: 4 }, () => booking("u", 1, { paid_amount, payment_status: "none" }));
    expect((await clients())[0].segment_tag).toBe("VIP");
  });
  it("settled explicit zero does not fall back to a quoted price", async () => {
    h.rows.bookings = Array.from({ length: 4 }, () => booking("u", 1, { paid_amount: 0, price_paid: 500 }));
    expect((await clients())[0].segment_tag).toBe("Regulär");
  });
  it("settled missing amount stays unknown rather than becoming a paid quote", async () => {
    h.rows.bookings = Array.from({ length: 4 }, () => booking("u", 1, { paid_amount: null, price_paid: 500 }));
    expect((await clients())[0]).toMatchObject({ segment_tag: "Regulär", total_spent: 2000, total_bookings: 4 });
  });
  it("only a timestamp strictly in the past contributes a completed visit", async () => {
    h.rows.bookings = [booking("now", 0), booking("past", 1 / DAY)];
    const result = await clients();
    expect(result.find((c: any) => c.user_id === "now").segment_tag).toBe("Regulär");
    expect(result.find((c: any) => c.user_id === "past").segment_tag).toBe("Neu");
  });
  it("fully refunded spend is zero and cannot erase another customer's spend", async () => {
    h.rows.bookings = [...Array.from({ length: 4 }, () => booking("a", 1)), ...Array.from({ length: 4 }, () => booking("b", 1, { refunded_amount: 99999 }))];
    expect((await clients()).map((c: any) => [c.user_id, c.segment_tag])).toEqual([["a", "VIP"], ["b", "Regulär"]]);
  });
  it("fetches past the default cap and smaller caps for bookings, profiles and tags", async () => {
    h.cap = 37;
    h.rows.bookings = Array.from({ length: 1103 }, (_, i) => booking(`u${i}`, 10));
    h.rows.bookings.push(...Array.from({ length: 3 }, () => booking("u1102", 11)));
    h.rows.public_profiles = Array.from({ length: 1103 }, (_, i) => ({ id: `u${i}`, display_name: `Client ${i}`, avatar_url: null }));
    h.rows.client_tags = Array.from({ length: 203 }, (_, i) => ({ id: `tag${i}`, salon_id: "salon-a", customer_id: "u1102", tag: `Tag ${i}`, color: null }));
    const result = await clients();
    expect(result).toHaveLength(1103);
    expect(result.find((c: any) => c.user_id === "u1102")).toMatchObject({ display_name: "Client 1102", segment_tag: "VIP", total_bookings: 4, total_spent: 500 });
    expect(result.find((c: any) => c.user_id === "u1102").tags).toHaveLength(203);
    expect(h.calls.filter(c => c.table === "bookings").length).toBeGreaterThan(1);
    expect(h.calls.every(c => c.count)).toBe(true);
    console.log("[RFM capped population fixture]", Object.fromEntries(["bookings", "public_profiles", "client_tags"].map(table => [table, h.calls.filter(call => call.table === table).length])));
  });
  it.each(["error", "empty", "count", "missing-count", "duplicate"] as const)("refuses partial bookings when later page returns %s", async kind => {
    h.cap = 2; h.rows.bookings = Array.from({ length: 4 }, () => booking("u", 1));
    h.failure = { table: "bookings", page: 2, kind };
    const result = await get(); expect(result.status).toBe(500); expect(await result.json()).not.toHaveProperty("clients");
  });
  it.each(["public_profiles", "client_tags"])("refuses a failed %s read instead of fabricated enrichment", async table => {
    h.rows.bookings = [booking("u", 1)]; h.failure = { table, page: 1, kind: "error" };
    expect((await get()).status).toBe(500);
  });
  it("returns empty, excludes guests/other Store and restricts all privileged enrichment to gated customer IDs", async () => {
    expect(await clients()).toEqual([]); expect(h.calls).toHaveLength(1);
    h.calls = []; h.rows.bookings = [booking("u", 1), booking("other", 1, { salon_id: "salon-b" }), booking("guest", 1, { user_id: null })];
    h.rows.client_tags = [{ id: "a", salon_id: "salon-b", customer_id: "u", tag: "private" }];
    expect((await clients()).map((c: any) => [c.user_id, c.tags])).toEqual([["u", []]]);
    expect(h.access).toHaveBeenLastCalledWith("salon-a", "clients");
    expect(h.calls.filter(c => c.table !== "public_profiles").every(c => c.filters.some(f => f[0] === "eq" && f[1] === "salon_id" && f[2] === "salon-a"))).toBe(true);
    expect(h.calls.find(c => c.table === "public_profiles")?.filters).toContainEqual(["in", "id", ["u"]]);
  });
  it("denied access and missing Store ID perform no privileged read", async () => {
    expect((await get("")).status).toBe(400); expect(h.access).not.toHaveBeenCalled();
    h.access.mockResolvedValue(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
    expect((await get()).status).toBe(403); expect(h.admin).not.toHaveBeenCalled();
  });
});
