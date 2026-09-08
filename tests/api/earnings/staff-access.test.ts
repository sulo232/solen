import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/earnings/staff/route';
const STORE='00000000-0000-4000-8000-000000000001';
const h=vi.hoisted(()=>({user:'owner' as string|null,finance:false,active:true,staff:false,role:'customer',staffError:false,reads:[] as any[], events:[] as string[], banned:null as NextResponse|null, limited:null as NextResponse|null, ban:vi.fn(), limit:vi.fn(), limiter:{}}));
vi.mock('@/lib/feature-flags',()=>({checkUserBanned:h.ban}));
vi.mock('@/lib/ratelimit',()=>({applyRateLimit:h.limit,generalLimiter:h.limiter}));
vi.mock('@/lib/supabase',()=>({createServerSupabaseClient:async()=>({auth:{getUser:async()=>{h.events.push('auth');return {data:{user:h.user?{id:h.user}:null}};}}}),createAdminSupabaseClient:()=>({from(table:string){
 let fields=''; const filters:any[]=[];
 const result=()=>{
  h.events.push(`read:${table}`);h.reads.push({table,fields,filters});
  if(table==='salons')return {data:{id:STORE,owner_id:'owner'},error:null};
  if(table==='profiles')return {data:{role:h.role},error:null};
  if(table==='staff_members'&&fields==='id, permissions')return {data:h.staff&&h.active&&!h.staffError?{id:'staff',permissions:{finance:h.finance}}:null,error:h.staffError?{message:'unavailable'}:null};
  if(table==='staff_members')return {data:[{id:'staff',name:'Staff',avatar_url:null,commission_rate:30,is_active:true}],error:null,count:1};
  if(table==='bookings')return {data:[{id:'booking',staff_member_id:'staff',paid_amount:4500,price_paid:180,payment_status:'paid'}],error:null,count:1};
  throw new Error(`Unexpected table ${table}`);
 };
 const q:any={select:(s:string)=>{fields=s;return q;},eq:(k:string,v:any)=>{filters.push([k,v]);return q;},order:()=>q,range:()=>q,maybeSingle:()=>Promise.resolve(result()),then:(resolve:any,reject:any)=>Promise.resolve(result()).then(resolve,reject)};return q;
}})}));
beforeEach(()=>{h.user='owner';h.finance=false;h.staff=false;h.active=true;h.staffError=false;h.role='customer';h.reads=[];h.events=[];h.banned=null;h.limited=null;h.ban.mockReset().mockImplementation(async()=>{h.events.push('ban');return h.banned;});h.limit.mockReset().mockImplementation(async()=>{h.events.push('limit');return h.limited;});vi.spyOn(console,'error').mockImplementation(()=>{});});
afterEach(()=>vi.restoreAllMocks());
const get=(query=`salon_id=${STORE}`)=>GET(new NextRequest(`http://localhost/api/earnings/staff?${query}`));
it.each(['owner','finance-staff','platform-admin'])('actual gate permits %s and reads scoped complete earnings',async actor=>{h.user=actor;if(actor==='finance-staff'){h.staff=true;h.finance=true;}if(actor==='platform-admin')h.role='admin';const r=await get();expect(r.status).toBe(200);expect(h.events.slice(0,3)).toEqual(['auth','ban','limit']);expect(h.events.filter(e=>e==='auth')).toHaveLength(1);expect(h.ban).toHaveBeenCalledWith(actor);expect(h.limit).toHaveBeenCalledWith(h.limiter,{userId:actor});expect((await r.json()).staff[0].gross).toBe(45);const reads=h.reads.filter(x=>x.table==='bookings'||x.table==='staff_members'&&x.fields!=='id, permissions');expect(reads).toHaveLength(2);expect(reads.every(x=>x.filters.some(([k,v]:any)=>k==='salon_id'&&v===STORE))).toBe(true);});
it.each(['unauthenticated','stranger','denied-staff','inactive-staff','membership-error'])('actual gate refuses %s without earnings population I/O',async actor=>{h.user=actor==='unauthenticated'?null:actor;h.staff=actor.includes('staff')||actor==='membership-error';h.finance=actor==='inactive-staff'||actor==='membership-error';h.active=actor!=='inactive-staff';h.staffError=actor==='membership-error';const r=await get();expect(r.status).toBe(actor==='unauthenticated'?401:403);expect(h.reads.filter(x=>x.table==='bookings'||x.table==='staff_members'&&x.fields!=='id, permissions')).toHaveLength(0);if(h.staff)expect(h.reads.find(x=>x.fields==='id, permissions').filters).toEqual([['salon_id',STORE],['user_id',actor],['is_active',true]]);});

it.each(['salon_id=invalid', `salon_id=${STORE}`])('unauthenticated refusal precedes parsing and all other guards: %s',async query=>{h.user=null;const r=await get(query);expect(r.status).toBe(401);expect(await r.json()).toEqual({error:'Unauthorized',code:'UNAUTHENTICATED'});expect(h.events).toEqual(['auth']);expect(h.ban).not.toHaveBeenCalled();expect(h.limit).not.toHaveBeenCalled();expect(h.reads).toEqual([]);});
it.each([403,503])('returns exact ban refusal %i before limiter, validation or finance reads',async status=>{h.banned=NextResponse.json({error:'guard refusal',code:'BAN_FIXTURE'},{status,headers:{'x-guard':'ban'}});expect(await get('salon_id=invalid')).toBe(h.banned);expect(h.events).toEqual(['auth','ban']);expect(h.ban).toHaveBeenCalledWith('owner');expect(h.limit).not.toHaveBeenCalled();expect(h.reads).toEqual([]);});
it('returns exact rate-limit response before invalid query and finance reads',async()=>{h.limited=NextResponse.json({error:'rate limited'},{status:429,headers:{'retry-after':'17'}});expect(await get('salon_id=invalid')).toBe(h.limited);expect(h.events).toEqual(['auth','ban','limit']);expect(h.limit).toHaveBeenCalledWith(h.limiter,{userId:'owner'});expect(h.reads).toEqual([]);});
it('valid authenticated unbanned unlimited caller reaches validation before finance/database reads',async()=>{const r=await get('salon_id=invalid');expect(r.status).toBe(400);expect(h.events).toEqual(['auth','ban','limit']);expect(h.reads).toEqual([]);});
it('a banned owner with valid query cannot read any earnings',async()=>{h.banned=NextResponse.json({error:'banned'},{status:403});expect(await get()).toBe(h.banned);expect(h.reads).toEqual([]);expect(h.limit).not.toHaveBeenCalled();});
it('a limited finance-enabled staff member with valid query cannot read any earnings',async()=>{h.user='finance-staff';h.staff=true;h.finance=true;h.limited=NextResponse.json({error:'rate limited'},{status:429});expect(await get()).toBe(h.limited);expect(h.reads).toEqual([]);expect(h.limit).toHaveBeenCalledWith(h.limiter,{userId:'finance-staff'});});
