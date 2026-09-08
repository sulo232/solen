import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { PERMISSION_AREAS } from "@/lib/staff-permissions";

// Execute the production guards/handlers against a filtered in-memory database.
// This models query predicates and effects, not live Postgres constraints or RLS.
let actor: string | null;
let selected: string | null;
let rows: Record<string, any[]>;
let calls: { table: string; op: string; filters: [string, string, unknown][] }[];
let failure: { table: string; op: string } | null;
function from(table: string, session = false) {
  let op = "read", patch: any, one = false, max = Infinity;
  const filters: [string, string, any][] = [];
  let orderKey: string | undefined;
  const query: any = {
    select: () => query,
    eq: (key: string, value: any) => { filters.push(["eq", key, value]); return query; },
    in: (key: string, value: any[]) => { filters.push(["in", key, value]); return query; },
    gte: (key: string, value: any) => { filters.push(["gte", key, value]); return query; },
    lte: (key: string, value: any) => { filters.push(["lte", key, value]); return query; },
    order: (key: string) => { orderKey = key; return query; },
    limit: (n: number) => { max = n; return query; },
    range: (_from: number, to: number) => { max = to + 1; return query; },
    insert: (value: any) => { op = "insert"; patch = value; return query; },
    update: (value: any) => { op = "update"; patch = value; return query; },
    delete: () => { op = "delete"; return query; },
    single: () => { one = true; return query; },
    maybeSingle: () => { one = true; return query; },
    then: (resolve: any, reject: any) => {
      calls.push({ table, op, filters });
      if (failure?.table === table && failure.op === op) return Promise.resolve({ data: null, error: { message: "mock database failure" } }).then(resolve, reject);
      const inserted = op === "insert" ? [{ id: "new-row", ...patch }] : [];
      if (op === "insert") (rows[table] ??= []).push(...inserted);
      let found = (op === "insert" ? inserted : rows[table] ?? []).filter(row => (!session || table !== "services" || row.is_active === true || rows.salons.some(store => store.id === row.salon_id && store.owner_id === actor)) && filters.every(([operator, key, value]) => operator === "eq" ? row[key] === value : operator === "in" ? value.includes(row[key]) : operator === "gte" ? row[key] >= value : row[key] <= value));
      if (orderKey) found.sort((a, b) => String(a[orderKey!]).localeCompare(String(b[orderKey!])));
      found = found.slice(0, max);
      if (op === "update") found.forEach(row => Object.assign(row, patch));
      if (op === "delete") rows[table] = rows[table].filter(row => !found.includes(row));
      return Promise.resolve({ data: one ? found.length === 1 ? found[0] : null : found, error: one && found.length > 1 ? { message: "multiple rows" } : null, count: found.length }).then(resolve, reject);
    },
  };
  return query;
}
const db = { from, auth: { getUser: vi.fn(async () => ({ data: { user: actor ? { id: actor } : null } })) } };
const sessionDb = { ...db, from: (table: string) => from(table, true) };
vi.mock("@/lib/supabase", () => ({ createServerSupabaseClient: async () => sessionDb, createAdminSupabaseClient: () => db }));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => db }));
vi.mock("@/lib/env", () => ({ getPublicEnv: () => ({ NEXT_PUBLIC_SUPABASE_URL: "https://mock.invalid", NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock-public-key" }) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => selected ? { value: selected } : undefined }) }));
vi.mock("@/lib/ratelimit", () => ({ applyRateLimit: vi.fn(async () => null), generalLimiter: {}, bookingLimiter: {}, bearerVerifyLimiter: {}, getClientIp: () => "127.0.0.1" }));
vi.mock("@/lib/feature-flags", () => ({ checkUserBanned: vi.fn(async () => null) }));
vi.mock("@/lib/salon-detail", () => ({ isSalonHidden: vi.fn(), isViewerAdmin: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(() => { throw new Error("No email in permissions tests"); }), bookingConfirmation: vi.fn(), salonNewBooking: vi.fn() }));
vi.mock("@/lib/salon/stripe-ready", () => ({ isStripeReady: vi.fn(async () => true) }));
const request = (path: string, method = "GET", body?: object) => new NextRequest(`http://localhost${path}`, { method, ...(body ? { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } } : {}) });
const targetParams = { params: Promise.resolve({ id: "target" }) };
beforeEach(() => {
  actor = "worker"; selected = null; failure = null; calls = [];
  rows = {
    profiles: [{ id: "worker", role: "customer" }, { id: "owner", role: "salon_owner" }, { id: "admin", role: "admin" }],
    salons: [{ id: "a", owner_id: "owner", name: "Store A", created_at: "1", average_rating: 4.7 }, { id: "b", owner_id: "other", name: "Store B", created_at: "2" }],
    staff_members: [{ id: "self", user_id: "worker", salon_id: "a", permissions: { calendar: true }, is_active: true, created_at: "1" }, { id: "target", user_id: "colleague", salon_id: "a", is_active: true, created_at: "2" }, { id: "foreign", user_id: "outsider", salon_id: "b", is_active: true, created_at: "3" }],
    staff_time_off: [{ id: "self-off", staff_member_id: "self", salon_id: "a" }, { id: "colleague-off", staff_member_id: "target", salon_id: "a" }, { id: "foreign-off", staff_member_id: "foreign", salon_id: "b" }],
    staff_services: [{ id: "self-service", staff_member_id: "self" }, { id: "colleague-service", staff_member_id: "target" }, { id: "foreign-service", staff_member_id: "foreign" }],
    availability_slots: [
      { id: "close", staff_member_id: "target", salon_id: "a", status: "available", starts_at: "2099-01-01" },
      { id: "booked", staff_member_id: "target", salon_id: "a", status: "booked", starts_at: "2099-01-01" },
      { id: "past", staff_member_id: "target", salon_id: "a", status: "available", starts_at: "2000-01-01" },
      { id: "colleague", staff_member_id: "self", salon_id: "a", status: "available", starts_at: "2099-01-01" },
      { id: "other-store", staff_member_id: "target", salon_id: "b", status: "available", starts_at: "2099-01-01" },
    ],
  };
});
afterEach(() => vi.clearAllTimers());

describe("current permission and Store contract", () => {
  it.each(PERMISSION_AREAS.map(area => area.key))("enforces %s independently and denies another Store", async area => {
    const { requireSalonAccess } = await import("@/lib/auth/require");
    expect((await requireSalonAccess("b", area) as Response).status).toBe(403);
    rows.staff_members[0].permissions = { [area]: true };
    expect((await requireSalonAccess("a", area) as any).via).toBe("staff");
    rows.staff_members[0].permissions = { [area]: false };
    expect((await requireSalonAccess("a", area) as Response).status).toBe(403);
    actor = "owner";
    expect((await requireSalonAccess("a", area) as any).via).toBe("owner");
    actor = "admin";
    rows.staff_members[0].user_id = "admin";
    expect((await requireSalonAccess("a", area) as any).via).toBe("admin");
  });
  it("keeps admins administrative even with a granted staff row", async () => {
    actor = "admin"; rows.staff_members[0].user_id = actor;
    const { requireSalonAccess } = await import("@/lib/auth/require");
    expect((await requireSalonAccess("a", "calendar") as any).via).toBe("admin");
  });
  it("fails closed before privileged lookup on anonymous staff update", async () => {
    actor = null;
    const { PATCH } = await import("@/app/api/staff/[id]/route");
    expect((await PATCH(request("/api/staff/target", "PATCH", { name: "Edited" }), targetParams)).status).toBe(401);
    expect(calls).toEqual([]);
  });
  it("selects the active staff Store, refuses its missing grant, and never silently switches", async () => {
    rows.staff_members.push({ id: "self-b", user_id: "worker", salon_id: "b", permissions: { finance: true }, is_active: true, created_at: "4" });
    const { getActiveSalonId } = await import("@/lib/active-salon");
    selected = "b";
    expect(await getActiveSalonId(db as any, "worker", "finance")).toBe("b");
    expect(await getActiveSalonId(db as any, "worker", "calendar")).toBeNull();
    selected = "foreign-cookie";
    expect(await getActiveSalonId(db as any, "worker", "calendar")).toBe("a");
  });
  it("profile resolves modern staff membership and only the selected Store permissions", async () => {
    rows.staff_members.push({ id: "self-b", user_id: "worker", salon_id: "b", permissions: { finance: true }, is_active: true, created_at: "4" });
    selected = "b";
    const { GET } = await import("@/app/api/profile/route");
    const result = await GET(request("/api/profile"));
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({ id: "worker", salon_id: "b", staff_permissions: { finance: true } });
    expect(calls.at(-1)?.filters).toEqual(expect.arrayContaining([["eq", "salon_id", "b"], ["eq", "user_id", "worker"], ["eq", "is_active", true]]));
  });
  it("dashboard middleware admits modern staff in multiple Stores without owner role repair", async () => {
    rows.staff_members.push({ id: "self-b", user_id: "worker", salon_id: "b", is_active: true });
    const { middleware } = await import("@/middleware");
    const result = await middleware(request("/en/dashboard/calendar"));
    expect(result.headers.get("location")).toBeNull();
    expect(result.headers.get("x-middleware-next")).toBe("1");
    expect(calls.some(call => call.op === "update")).toBe(false);
  });
  it("dashboard middleware refuses a customer without membership", async () => {
    rows.staff_members = [];
    const { middleware } = await import("@/middleware");
    expect((await middleware(request("/en/dashboard"))).headers.get("location")).toBe("http://localhost/en");
  });
  it("self schedule fallback cannot read a colleague or another Store", async () => {
    const { GET } = await import("@/app/api/staff/time-off/route");
    expect(await (await GET(request("/api/staff/time-off"))).json()).toEqual({ items: [rows.staff_time_off[0]] });
    expect((await GET(request("/api/staff/time-off?staff_member_id=target"))).status).toBe(403);
    expect((await GET(request("/api/staff/time-off?staff_member_id=foreign"))).status).toBe(403);
    rows.staff_members[0].permissions.schedule = true;
    expect((await (await GET(request("/api/staff/time-off"))).json()).items.map((row: any) => row.id)).toEqual(["self-off", "colleague-off"]);
  });
  it("catalog denial permits only self assignments; catalog grant permits only this Store", async () => {
    const { GET } = await import("@/app/api/staff/services/route");
    expect((await (await GET(request("/api/staff/services?salon_id=a"))).json()).items.map((row: any) => row.id)).toEqual(["self-service"]);
    expect((await GET(request("/api/staff/services?salon_id=a&staff_member_id=target"))).status).toBe(403);
    expect((await GET(request("/api/staff/services?salon_id=b"))).status).toBe(403);
    rows.staff_members[0].permissions.catalog = true;
    expect((await (await GET(request("/api/staff/services?salon_id=a"))).json()).items.map((row: any) => row.id)).toEqual(["self-service", "colleague-service"]);
    expect((await GET(request("/api/staff/services?salon_id=a&staff_member_id=foreign"))).status).toBe(403);
  });
  it.each(["PATCH", "DELETE"])("%s closes only the owned staff's future available slots", async method => {
    actor = "owner";
    const handlers = await import("@/app/api/staff/[id]/route");
    const result = await handlers[method as "PATCH" | "DELETE"](request("/api/staff/target", method, method === "PATCH" ? { is_active: false } : undefined), targetParams);
    expect(result.status).toBe(200);
    expect(rows.availability_slots.filter(row => row.status === "blocked").map(row => row.id)).toEqual(["close"]);
    expect(rows.staff_members.some(row => row.id === "target")).toBe(method !== "DELETE");
  });
  it.each(["PATCH", "DELETE"])("%s refuses cross-Store staff mutation before any write", async method => {
    rows.staff_members[0].permissions.team = true;
    const handlers = await import("@/app/api/staff/[id]/route");
    const result = await handlers[method as "PATCH" | "DELETE"](request("/api/staff/foreign", method, method === "PATCH" ? { is_active: false } : undefined), { params: Promise.resolve({ id: "foreign" }) });
    expect(result.status).toBe(403);
    expect(calls.every(call => call.op === "read")).toBe(true);
  });
  it.each(["PATCH", "DELETE"])("%s refuses self permission changes", async method => {
    rows.staff_members[0].permissions.team = true;
    const handlers = await import("@/app/api/staff/[id]/route");
    expect((await handlers[method as "PATCH" | "DELETE"](request("/api/staff/self", method, method === "PATCH" ? { permissions: { finance: true } } : undefined), { params: Promise.resolve({ id: "self" }) })).status).toBe(403);
  });
  it("deactivation reports slot-close failure and DELETE retains the staff row on the same failure", async () => {
    actor = "owner"; failure = { table: "availability_slots", op: "update" };
    const { PATCH, DELETE } = await import("@/app/api/staff/[id]/route");
    const result = await PATCH(request("/api/staff/target", "PATCH", { is_active: false }), targetParams);
    expect(result.status).toBe(500);
    expect(await result.json()).toMatchObject({ code: "SLOT_CLOSE_FAILED" });
    expect((await DELETE(request("/api/staff/target", "DELETE"), targetParams)).status).toBe(500);
    expect(rows.staff_members.some(row => row.id === "target")).toBe(true);
  });
  it("calendar summary keeps booking counts but withholds the finance aggregate", async () => {
    rows.bookings = [{ id: "today", salon_id: "a", starts_at: new Date().toISOString(), status: "confirmed", total_price: 90 }];
    const { GET } = await import("@/app/api/dashboard/today/route");
    expect(await (await GET(request("/api/dashboard/today"))).json()).toMatchObject({ today_count: 1, today_revenue: null });
    rows.staff_members[0].permissions.finance = true;
    expect(await (await GET(request("/api/dashboard/today"))).json()).toMatchObject({ today_count: 1, today_revenue: 90 });
  });
  it("actual bookings GET retains verified Bearer auth and scopes calendar data before enrichment", async () => {
    db.auth.getUser.mockClear();
    rows.bookings = [{ id: "owned-booking", salon_id: "a", user_id: "client", starts_at: "2099-01-01" }, { id: "other-booking", salon_id: "b", user_id: "private-client", starts_at: "2099-01-01" }];
    rows.public_profiles = [{ id: "client", display_name: "Client A" }, { id: "private-client", display_name: "Private B" }];
    const { GET } = await import("@/app/api/bookings/route");
    const result = await GET(new NextRequest("http://localhost/api/bookings?salon_id=a", { headers: { Authorization: "Bearer mock-token" } }));
    expect(result.status).toBe(200);
    expect((await result.json()).bookings.map((booking: any) => booking.id)).toEqual(["owned-booking"]);
    expect(db.auth.getUser).toHaveBeenCalledTimes(1);
    expect(db.auth.getUser).toHaveBeenCalledWith("mock-token");
    expect(calls.find(call => call.table === "public_profiles")?.filters).toContainEqual(["in", "id", ["client"]]);
    expect((await GET(request("/api/bookings?salon_id=b"))).status).toBe(403);
  });

  it("finance-granted invoice HTML treats Store-authored content as text", async () => {
    rows.staff_members[0].permissions.finance = true;
    rows.salon_payouts = [{ id: "invoice", salon_id: "a", gross_amount: 100, commission_percent: 10, commission_amount: 10, net_amount: 90, created_at: "2026-01-01", salons: { name: '<img src=x onerror="alert(1)">', address: "A&B", postal_code: "4000", cities: { name_de: "Basel" } } }];
    const { GET } = await import("@/app/api/salon/invoices/[payoutId]/route");
    const response = await GET(request("/api/salon/invoices/invoice"), { params: Promise.resolve({ payoutId: "invoice" }) });
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("A&amp;B");
    expect(html).not.toContain("<img src=x");
    rows.salon_payouts[0].salon_id = "b";
    expect((await GET(request("/api/salon/invoices/invoice"), { params: Promise.resolve({ payoutId: "invoice" }) })).status).toBe(403);
  });
  it("settings-granted setup progress counts only the active Store resources", async () => {
    rows.staff_members[0].permissions.settings = true;
    rows.services = [{ id: "service", salon_id: "a", is_active: true }];
    rows.staff_schedules = [{ id: "schedule", salon_id: "a" }, { id: "foreign", salon_id: "b" }];
    const { GET } = await import("@/app/api/salon/setup-progress/route");
    const result = await GET(request("/api/salon/setup-progress"));
    expect(result.status).toBe(200);
    expect((await result.json()).steps).toEqual(expect.arrayContaining([{ key: "services", complete: true }, { key: "staff", complete: true }, { key: "schedule", complete: true }]));
    expect(calls.find(call => call.table === "staff_schedules")?.filters).toContainEqual(["eq", "salon_id", "a"]);
    rows.staff_members[0].permissions.settings = false;
    expect((await GET(request("/api/salon/setup-progress"))).status).toBe(403);
  });

  it.each(["time-off", "breaks", "services"])("%s self fallback uses selected B across two memberships, and denies its colleague", async route => {
    selected = "b";
    rows.staff_members.push({ id: "self-b", user_id: "worker", salon_id: "b", is_active: true, created_at: "4", permissions: {} });
    rows.staff_time_off.push({ id: "self-b-off", staff_member_id: "self-b", salon_id: "b" });
    rows.staff_breaks = [{ id: "a-break", staff_member_id: "self", salon_id: "a" }, { id: "self-b-break", staff_member_id: "self-b", salon_id: "b" }, { id: "b-colleague", staff_member_id: "foreign", salon_id: "b" }];
    rows.staff_services.push({ id: "self-b-service", staff_member_id: "self-b" });
    const { GET } = route === "time-off" ? await import("@/app/api/staff/time-off/route") : route === "breaks" ? await import("@/app/api/staff/breaks/route") : await import("@/app/api/staff/services/route");
    const response = await GET(request(`/api/staff/${route}`));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].staff_member_id).toBe("self-b");
    expect((await GET(request(`/api/staff/${route}?staff_member_id=foreign`))).status).toBe(403);
    expect((await GET(request(`/api/staff/${route}?staff_member_id=self-b`))).status).toBe(200);
  });
  it("inactive self cannot bypass schedule permission; active self and owner/admin retain access", async () => {
    rows.staff_schedules = [{ id: "hours", staff_member_id: "self", salon_id: "a", is_active: true }];
    rows.staff_members[0].is_active = false;
    const { GET } = await import("@/app/api/staff/[id]/availability/route");
    const params = { params: Promise.resolve({ id: "self" }) };
    expect((await GET(request("/api/staff/self/availability"), params)).status).toBe(403);
    expect(calls.some(call => call.table === "staff_schedules")).toBe(false);
    rows.staff_members[0].is_active = true;
    expect((await GET(request("/api/staff/self/availability"), params)).status).toBe(200);
    rows.staff_members[0].is_active = false;
    for (const allowed of ["owner", "admin"]) {
      actor = allowed;
      expect((await GET(request("/api/staff/self/availability"), params)).status).toBe(200);
    }
  });
  it.each(["POST", "PUT", "DELETE"])("retail %s rejects catalog staff before writes and retains owner behavior", async method => {
    rows.staff_members[0].permissions.catalog = true;
    rows.nail_retail_products = [{ id: "product", salon_id: "a", name: "Oil", price: 1000, category: "care", is_active: true }];
    const handlers = await import("@/app/api/salon/retail/route");
    const body = method === "POST" ? { name: "Oil", price: 1000, category: "care" } : method === "PUT" ? { id: "product", name: "Updated Oil" } : undefined;
    const execute = () => handlers[method as "POST" | "PUT" | "DELETE"](request("/api/salon/retail?id=product", method, body));
    expect((await execute()).status).toBe(403);
    expect(calls.some(call => call.op !== "read")).toBe(false);
    actor = "owner";
    expect((await execute()).status).toBe(method === "POST" ? 201 : 200);
    expect(calls.some(call => call.table === "nail_retail_products" && call.op !== "read")).toBe(true);
  });
  it("catalog management returns active and inactive A services, while default/private and public lists retain their subsets", async () => {
    rows.staff_members[0].permissions.catalog = true;
    rows.services = [{ id: "active-a", salon_id: "a", is_active: true, name_de: "Active", sort_order: 1 }, { id: "inactive-a", salon_id: "a", is_active: false, name_de: "Inactive", sort_order: 2 }, { id: "active-b", salon_id: "b", is_active: true, name_de: "Other", sort_order: 3 }];
    const { GET } = await import("@/app/api/salon/services/route");
    const ids = async (path: string) => (await (await GET(request(path))).json()).services.map((service: any) => service.id);
    expect(await ids("/api/salon/services?salon_id=a&mode=management")).toEqual(["active-a", "inactive-a"]);
    expect(await ids("/api/salon/services?salon_id=a")).toEqual(["active-a"]);
    expect((await GET(request("/api/salon/services?salon_id=b&mode=management"))).status).toBe(403);
    rows.staff_members[0].permissions.catalog = false;
    expect((await GET(request("/api/salon/services?salon_id=a&mode=management"))).status).toBe(403);
    const publicHandler = await import("@/app/api/services/route");
    expect((await (await publicHandler.GET(request("/api/services?salon_id=a"))).json()).services.map((service: any) => service.id)).toEqual(["active-a"]);
    actor = null;
    expect((await (await publicHandler.GET(request("/api/services?salon_id=a"))).json()).services.map((service: any) => service.id)).toEqual(["active-a"]);
  });

  it("the actual catalog page loads inactive services through the private management handler", async () => {
    rows.staff_members[0].permissions.catalog = true;
    rows.services = [{ id: "active-a", salon_id: "a", is_active: true }, { id: "inactive-a", salon_id: "a", is_active: false }, { id: "foreign-b", salon_id: "b", is_active: false }];
    const { GET } = await import("@/app/api/salon/services/route");
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const { transpileModule, ModuleKind, JsxEmit } = await import("typescript");
    const jsxRuntime = await import("react/jsx-runtime");
    const values: any[] = [];
    let index = 0;
    const fakeReact = {
      useState: (initial: any) => { const slot = index++; values[slot] = typeof initial === "function" ? initial() : initial; return [values[slot], (next: any) => { values[slot] = typeof next === "function" ? next(values[slot]) : next; }]; },
      useMemo: (compute: () => any) => compute(), useCallback: (fn: any) => fn,
      useEffect: (effect: () => any) => effect(),
    };
    const modules: Record<string, any> = {
      react: fakeReact, "react/jsx-runtime": jsxRuntime, "next/image": { default: () => null, __esModule: true },
      "next-intl": { useLocale: () => "en", useTranslations: () => (key: string) => key },
      "lucide-react": await import("lucide-react"),
      "@hello-pangea/dnd": { DragDropContext: () => null, Droppable: () => null, Draggable: () => null },
      "@/components-legacy/dashboard/DashboardLayout": { default: () => null, __esModule: true },
      "@/components-legacy/ui/Spinner": { default: () => null, __esModule: true },
      "@/lib/format-currency": { formatCurrency: String }, "@/lib/service-templates": { serviceTemplates: {} },
    };
    const source = readFileSync(resolve("app/[locale]/dashboard/services/page.tsx"), "utf8");
    const compiled = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    const target = { exports: {} as any };
    new Function("require", "module", "exports", compiled)((id: string) => { if (!(id in modules)) throw new Error(`Unmocked catalog boundary: ${id}`); return modules[id]; }, target, target.exports);
    const fetchBoundary = vi.fn(async (path: string) => {
      if (path === "/api/profile") return { json: async () => ({ salon_id: "a", salon_categories: ["coiffeur"] }) };
      if (path.startsWith("/api/salon/services?")) return GET(request(path));
      throw new Error(`Unexpected catalog request: ${path}`);
    });
    vi.stubGlobal("fetch", fetchBoundary);
    try {
      target.exports.default();
      await new Promise(resolve => setImmediate(resolve));
      expect(fetchBoundary).toHaveBeenCalledWith("/api/salon/services?salon_id=a&mode=management");
      expect(values[0].map((service: any) => service.id)).toEqual(["active-a", "inactive-a"]);
    } finally { vi.unstubAllGlobals(); }
  });

});
