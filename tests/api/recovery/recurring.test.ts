import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ session: null as any, admin: null as any, send: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ createServerSupabaseClient: async () => state.session, createAdminSupabaseClient: () => state.admin }));
vi.mock("@/lib/feature-flags", () => ({ checkFeatureEnabled: async () => null, checkUserBanned: async () => null }));
vi.mock("@/lib/ratelimit", () => ({ applyRateLimit: async () => null, bookingLimiter: {} }));
vi.mock("@/lib/email", () => ({ sendEmail: state.send, recurringConfirmation: (...args: any[]) => args }));
import { POST } from "@/app/api/bookings/recurring/route";
const salon = "11111111-1111-4111-8111-111111111111";
const service = "22222222-2222-4222-8222-222222222222";
const slot = { id: "slot-new", starts_at: "2026-09-09T22:30:00Z", ends_at: "2026-09-09T23:00:00Z", staff_member_id: "staff", price_override: null };
function client(results: Record<string, any[]>) {
  const calls: any[] = [];
  return { calls, auth: { getUser: async () => ({ data: { user: { id: "customer", email: "fixture@example.test" } } }) }, from(table: string) {
    const call = { table, ops: [] as any[] }; calls.push(call);
    const result = results[table]?.shift();
    if (!result) throw new Error(`Unexpected query ${table}`);
    const q: any = { then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject) };
    for (const op of ["select", "eq", "gte", "order", "limit", "insert", "single", "update", "delete"]) q[op] = (...args: any[]) => { call.ops.push([op, ...args]); return q; };
    return q;
  } };
}
const ok = (data: any) => ({ data, error: null });
function setup(overrides: Record<string, any> = {}) {
  state.session = client({ services: [overrides.service ?? ok({ price: 55, name_de: "Cut" })], recurring_booking_rules: [overrides.rule ?? ok({ id: "rule-new" })], profiles: [overrides.profile ?? ok({ locale: "fr", is_first_visit_default: false })], bookings: [overrides.booking ?? ok({ id: "booking-new" })], salons: [ok({ name: "Store" })], staff_members: [overrides.staff ?? ok({ id: "staff" })] });
  state.admin = client({ availability_slots: [overrides.lookup ?? ok([slot]), overrides.claim ?? ok([{ id: slot.id }])], bookings: [overrides.deleted ?? ok([{ id: "booking-new" }])], recurring_booking_rules: [overrides.deactivated ?? ok([{ id: "rule-new" }])] });
}
function run(extra: Record<string, unknown> = {}) { return POST(new NextRequest("http://localhost/api/bookings/recurring", { method: "POST", body: JSON.stringify({ salon_id: salon, service_id: service, frequency: "weekly", ...extra }) })); }
beforeEach(() => { vi.clearAllMocks(); setup(); });
describe("recurring creation through the real handler and claimSlot", () => {
  it("creates via session, claims via admin CAS and keeps Zurich date and locale", async () => {
    const res = await run(); expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ data: { rule: { id: "rule-new" }, first_booking: { id: "booking-new" } } });
    expect(state.session.calls[0].ops).toContainEqual(["eq", "salon_id", salon]);
    const insertedRule = state.session.calls.find((c: any) => c.table === "recurring_booking_rules");
    expect(insertedRule.ops.find((o: any) => o[0] === "insert")[1].next_booking_date).toBe("2026-09-10");
    expect(state.admin.calls[0].ops).toContainEqual(["eq", "service_id", service]);
    expect(state.admin.calls[0].ops).toContainEqual(["eq", "salon_id", salon]);
    expect(state.admin.calls[1].ops).toContainEqual(["eq", "status", "available"]);
    expect(state.admin.calls[1].ops).toContainEqual(["update", { status: "booked", booked_by: "customer", booking_id: "booking-new" }]);
    expect(state.send.mock.calls[0][0][2]).toBe("fr");
  });
  it.each(["lookup", "service", "rule"])("surfaces %s errors before booking/claim", async (key) => {
    setup({ [key]: { data: null, error: { message: "failed" } } });
    expect((await run()).status).toBe(500);
    expect(state.session.calls.some((c: any) => c.table === "bookings")).toBe(false);
    expect(state.send).not.toHaveBeenCalled();
  });
  it.each([null, "23P01", "23505", "XX000"])("compensates a lost/error claim (%s), limited to the new rows", async (code) => {
    setup({ claim: { data: [], error: code ? { code, message: "failed" } : null } });
    expect((await run()).status).toBe(code === "XX000" ? 500 : 409);
    const deletion = state.admin.calls.find((c: any) => c.table === "bookings");
    expect(deletion.ops).toContainEqual(["eq", "id", "booking-new"]);
    expect(deletion.ops).toContainEqual(["eq", "user_id", "customer"]);
    expect(deletion.ops).toContainEqual(["eq", "recurring_group_id", "rule-new"]);
    expect(state.admin.calls.find((c: any) => c.table === "recurring_booking_rules").ops).toContainEqual(["update", { is_active: false }]);
    expect(state.send).not.toHaveBeenCalled();
  });
  it.each(["XX000", "23P01"])("deactivates new rule on booking write failure %s without deleting other bookings", async (code) => {
    setup({ booking: { data: null, error: { code, message: "insert failed" } } });
    expect((await run()).status).toBe(code === "23P01" ? 409 : 500);
    expect(state.admin.calls.map((c: any) => c.table)).toEqual(["availability_slots", "recurring_booking_rules"]);
    expect(state.send).not.toHaveBeenCalled();
  });
  it.each(["deleted", "deactivated"])("surfaces zero-row %s rollback and still attempts both compensations", async (key) => {
    setup({ claim: ok([]), [key]: ok([]) });
    const res = await run(); expect(res.status).toBe(500); expect((await res.json()).code).toBe("ROLLBACK_FAILED");
    expect(state.admin.calls.map((c: any) => c.table)).toEqual(["availability_slots", "availability_slots", "bookings", "recurring_booking_rules"]);
  });
  it("scopes optional staff lookup before privileged reads and rejects mismatches", async () => {
    setup({ staff: { data: null, error: { message: "not found" } } });
    expect((await run({ staff_member_id: service })).status).toBe(500);
    expect(state.session.calls.find((c: any) => c.table === "staff_members").ops).toContainEqual(["eq", "salon_id", salon]);
    expect(state.admin.calls).toHaveLength(0);
  });
  it("deactivates the new rule when profile lookup fails", async () => {
    setup({ profile: { data: null, error: { message: "lookup failure" } } });
    expect((await run()).status).toBe(500);
    expect(state.admin.calls.map((c: any) => c.table)).toEqual(["availability_slots", "recurring_booking_rules"]);
    expect(state.send).not.toHaveBeenCalled();
  });
  it.each(["deleted", "deactivated"])("surfaces %s rollback DB errors", async (key) => {
    setup({ claim: ok([]), [key]: { data: null, error: { message: "rollback failure" } } });
    const res = await run(); expect(res.status).toBe(500); expect((await res.json()).code).toBe("ROLLBACK_FAILED");
    expect(state.admin.calls.at(-1).table).toBe("recurring_booking_rules");
  });
  it("retains a valid rule with no first slot", async () => {
    setup({ lookup: ok([]) });
    const res = await run(); expect(res.status).toBe(201); expect((await res.json()).data.first_booking).toBeNull(); expect(state.send).not.toHaveBeenCalled();
  });
});


it.each([['fr','Coupe'],['it','Taglio'],[null,'Schnitt']])('recurring confirmation uses profile locale %s and preserves booking price',async(locale,label)=>{
  setup({service:ok({price:55,name_de:'Schnitt',name_en:'Cut',name_fr:'Coupe',name_it:'Taglio'}),profile:ok({locale,is_first_visit_default:false})});
  expect((await run()).status).toBe(201);
  expect(state.send.mock.calls[0][0][1].service).toBe(label);
  expect(state.send.mock.calls[0][0][2]).toBe(locale??'de');
  expect(state.session.calls.find((c:any)=>c.table==='bookings').ops.find((o:any)=>o[0]==='insert')[1].price_paid).toBe(55);
  expect(state.session.calls.find((c:any)=>c.table==='services').ops).toContainEqual(['select','price, name_de, name_en, name_fr, name_it']);
});
