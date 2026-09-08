import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET } from "@/app/api/earnings/staff/route";
const STORE = "00000000-0000-4000-8000-000000000001";
const h = vi.hoisted(() => ({ auth: vi.fn(), access: vi.fn(), admin: vi.fn(), rows: {} as Record<string, any[]>, calls: [] as any[], cap: 1000, fail: null as null | { table: string; offset: number; kind: string } }));
vi.mock("@/lib/auth/require", () => ({ requireSalonAccess: h.access, requireAuth: h.auth }));
vi.mock("@/lib/supabase", () => ({ createAdminSupabaseClient: h.admin }));
vi.mock("@/lib/feature-flags", () => ({ checkUserBanned: async () => null }));
vi.mock("@/lib/ratelimit", () => ({ applyRateLimit: async () => null, generalLimiter: {} }));
function db() { return { from(table: string) {
 const filters: any[] = []; let start = 0; let end = 999; let counted = false; let ordered = false;
 const q: any = {
 select: (fields: string, opts?: any) => { counted = opts?.count === "exact"; h.calls.push({ table, fields }); return q; },
 eq: (key: string, value: any) => { filters.push([key, "eq", value]); return q; },
 gte: (key: string, value: any) => { filters.push([key, "gte", value]); return q; },
 lte: (key: string, value: any) => { filters.push([key, "lte", value]); return q; },
 lt: (key: string, value: any) => { filters.push([key, "lt", value]); return q; },
 order: (key: string) => { expect(key).toBe("id"); ordered = true; return q; },
 range: (a: number, b: number) => { start = a; end = b; return q; },
 then(resolve: any, reject: any) {
  h.calls.push({ table, start, end, counted, filters });
  let rows = (h.rows[table] ?? []).filter(r => filters.every(([key, op, value]) => op === "eq" ? r[key] === value : op === "gte" ? Date.parse(r[key]) >= Date.parse(value) : op === "lt" ? Date.parse(r[key]) < Date.parse(value) : Date.parse(r[key]) <= Date.parse(value)));
  if (ordered) rows = [...rows].sort((a,b) => a.id.localeCompare(b.id));
  const kind = h.fail?.table === table && h.fail.offset === start ? h.fail.kind : null;
  let data = rows.slice(start, Math.min(end + 1, start + h.cap));
  if (kind === "empty") data = [];
  if (kind === "duplicate") data = [rows[0]];
  return Promise.resolve({ data, count: counted && kind !== "missing-count" ? rows.length + (kind === "count" ? 1 : 0) : null, error: kind === "error" ? { message: "fixture database error" } : null }).then(resolve,reject);
 }
 }; return q;
} }; }
function member(id = "staff-a", patch: any = {}) { return { id, salon_id: STORE, name: id, avatar_url: null, commission_rate: 30, is_active: true, ...patch }; }
function booking(patch: any = {}) { return { id: "booking-a", salon_id: STORE, staff_member_id: "staff-a", status: "completed", starts_at: "2026-09-07T10:00:00Z", paid_amount: 4500, price_paid: 80, payment_status: "paid", refunded_amount: 0, services: { price: 180 }, ...patch }; }
function request(params = `salon_id=${STORE}`) { return GET(new NextRequest(`http://localhost/api/earnings/staff?${params}`)); }
async function staff(params?: string) { const r = await request(params); expect(r.status).toBe(200); return (await r.json()).staff; }
beforeEach(() => { h.rows = { staff_members: [member()], bookings: [booking()] }; h.calls = []; h.cap = 1000; h.fail = null; h.auth.mockReset().mockResolvedValue({ user: { id: "finance-staff" }, supabase: {} }); h.access.mockReset().mockResolvedValue({ user: { id: "finance-staff" } }); h.admin.mockReset().mockImplementation(db); vi.spyOn(console,"error").mockImplementation(() => {}); });
afterEach(() => vi.restoreAllMocks());
describe("staff earnings actual GET", () => {
 it("returns the exact auth refusal object without entering finance/resource reads",async()=>{const denied=NextResponse.json({error:"Unauthorized",code:"UNAUTHENTICATED"},{status:401});h.auth.mockResolvedValue(denied);expect(await request()).toBe(denied);expect(h.access).not.toHaveBeenCalled();expect(h.admin).not.toHaveBeenCalled();});
 it("uses captured 4500 Rappen, not list CHF180 or quoted CHF80", async () => { expect((await staff())[0]).toMatchObject({ gross: 45, staff_share: 13.5, house_share: 31.5, is_active: true }); });
 it("keeps legitimate zero instead of replacing it with a price", async () => { h.rows.bookings = [booking({ paid_amount: 0 })]; expect((await staff())[0].gross).toBe(0); });
 it("retains stored legacy pay-at-Store price when capture is absent", async () => { h.rows.bookings = [booking({ paid_amount: null, payment_status: "none", price_paid: 80 })]; expect((await staff())[0].gross).toBe(80); });
 it("preserves gross-before-refund semantics without inventing staff clawbacks", async () => { h.rows.bookings = [booking({ payment_status: "partially_refunded", refunded_amount: 1500 })]; expect((await staff())[0]).toMatchObject({ gross: 45, staff_share: 13.5 }); });
 it.each(["paid", "refunded", "partially_refunded", "disputed"])("refuses absent captured money in %s state", async payment_status => { h.rows.bookings = [booking({ paid_amount: null, payment_status })]; expect((await request()).status).toBe(500); });
 it.each([-1, 2.5, "", "bad", Infinity, NaN])("refuses invalid paid amount %s", async paid_amount => { h.rows.bookings = [booking({ paid_amount })]; expect((await request()).status).toBe(500); });
 it.each([null, "", "bad", -1, Infinity])("refuses absent/invalid legacy price %s without live-list fallback", async price_paid => { h.rows.bookings = [booking({ paid_amount: null, payment_status: "none", price_paid })]; expect((await request()).status).toBe(500); });
 it("supports a numeric stored quote and aggregates in cents before rate rounding", async () => { h.rows.bookings = [booking({ id:"a", paid_amount:null,payment_status:"none",price_paid:"0.10" }),booking({id:"b",paid_amount:20})]; expect((await staff())[0]).toMatchObject({gross:0.3,staff_share:0.09,house_share:0.21}); });
 it("keeps inactive completed work including zero and excludes inactive without work", async () => { h.rows.staff_members = [member("staff-a",{is_active:false}),member("no-work",{is_active:false}),member("active-empty")]; h.rows.bookings=[booking({paid_amount:0})]; expect((await staff()).map((s:any)=>[s.id,s.is_active,s.gross])).toEqual([["active-empty",true,0],["staff-a",false,0]]); });
 it("excludes another Store and non-completed bookings, preserving explicit finance gate", async () => { h.rows.staff_members.push(member("other",{salon_id:"other"})); h.rows.bookings.push(booking({id:"b",salon_id:"other",paid_amount:99000}),booking({id:"c",status:"cancelled",paid_amount:99000})); expect((await staff())[0].gross).toBe(45); expect(h.access).toHaveBeenCalledWith(STORE,"finance",expect.objectContaining({user:{id:"finance-staff"}})); expect(h.calls.filter(c=>c.filters).every(c=>c.filters.some((f:any)=>f[0]==="salon_id" && f[2]===STORE))).toBe(true); });
 it.each([401,403,503])("preserves access refusal %i before privileged I/O", async status => { h.access.mockResolvedValue(NextResponse.json({error:"denied"},{status})); expect((await request()).status).toBe(status); expect(h.admin).not.toHaveBeenCalled(); });
 it("returns actual empty staff population", async () => { h.rows.staff_members=[]; h.rows.bookings=[]; expect(await staff()).toEqual([]); });
 it.each(["", "salon_id=invalid", `salon_id=${STORE}&from=2026-02-30`, `salon_id=${STORE}&from=2026-09-10&to=2026-09-01`])("refuses invalid query %s", async params => { expect((await request(params)).status).toBe(400); expect(h.admin).not.toHaveBeenCalled(); });
 it("uses complete inclusive Zurich civil date boundaries including subseconds", async () => { h.rows.bookings=[booking({id:"first",starts_at:"2026-09-06T22:00:00Z"}),booking({id:"last",starts_at:"2026-09-07T21:59:59.999Z"}),booking({id:"after",starts_at:"2026-09-07T22:00:00Z"}),booking({id:"before",starts_at:"2026-09-06T21:59:59.999Z"})]; expect((await staff(`salon_id=${STORE}&from=2026-09-07&to=2026-09-07`))[0].gross).toBe(90); });
 it("reads beyond 1000 and lower server caps for both populations", async () => { h.cap=37; h.rows.staff_members=Array.from({length:1103},(_,i)=>member(`s${i}`)); h.rows.bookings=Array.from({length:1103},(_,i)=>booking({id:`b${i}`,staff_member_id:`s${i}`})); const result=await staff(); expect(result).toHaveLength(1103); expect(result.reduce((sum:number,s:any)=>sum+s.gross,0)).toBe(49635); expect(h.calls.filter(c=>c.start!==undefined)).toHaveLength(60); });
 it.each(["staff_members","bookings"])("refuses %s query error", async table => { h.fail={table,offset:0,kind:"error"}; expect((await request()).status).toBe(500); });
 it.each(["error","empty","duplicate","count","missing-count"])("refuses partial population: %s", async kind => { h.cap=1; h.rows.bookings.push(booking({id:"b"})); h.fail={table:"bookings",offset:1,kind}; expect((await request()).status).toBe(500); });
 it.each([-1,101,NaN])("refuses invalid commission %s",async commission_rate=>{h.rows.staff_members=[member("staff-a",{commission_rate})];expect((await request()).status).toBe(500);});
 it("captured zero stays zero even with legacy payment state and invalid quote",async()=>{h.rows.bookings=[booking({paid_amount:0,payment_status:"none",price_paid:null})];expect((await staff())[0].gross).toBe(0);});
 it("fully refunded completed work keeps gross before refunds",async()=>{h.rows.bookings=[booking({payment_status:"refunded",refunded_amount:4500})];expect((await staff())[0].gross).toBe(45);});
 it("a missing staff identity refuses an incomplete earnings table",async()=>{h.rows.bookings=[booking({staff_member_id:"missing"})];expect((await request()).status).toBe(500);});
 it("unassigned bookings do not become another staff member's earnings",async()=>{h.rows.bookings=[booking({staff_member_id:null})];expect((await staff())[0].gross).toBe(0);});
 it("later staff page failure refuses partial staff population",async()=>{h.cap=1;h.rows.staff_members.push(member("second"));h.fail={table:"staff_members",offset:1,kind:"error"};expect((await request()).status).toBe(500);});
 it("retains zero share for a missing commission setting",async()=>{h.rows.staff_members=[member("staff-a",{commission_rate:null})];expect((await staff())[0]).toMatchObject({commission_rate:0,staff_share:0,house_share:45});});
});
