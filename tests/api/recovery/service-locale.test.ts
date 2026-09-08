import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
const h=vi.hoisted(()=>({actor:'salon' as string|null,locale:'fr' as string|null,db:{} as any,calls:[] as any[],notify:vi.fn()}));
vi.mock('@/lib/supabase',()=>({createAdminSupabaseClient:()=>h.db}));
vi.mock('@/lib/bookings/authorize',()=>({resolveBookingActor:async()=>({actor:h.actor,userId:'owner',booking:{id:'booking',status:'pending',user_id:'customer'}})}));
vi.mock('@/lib/ratelimit',()=>({applyRateLimit:async()=>null,bookingLimiter:{}}));
vi.mock('@/lib/notifications',()=>({sendNotification:h.notify}));
vi.mock('@/lib/referral/complete-referral',()=>({completeReferralForFirstBooking:vi.fn()}));
import { POST } from '@/app/api/bookings/[id]/confirm/route';
beforeEach(()=>{
 h.actor='salon';h.locale='fr';h.calls=[];h.notify.mockReset();
 h.db={auth:{admin:{getUserById:async()=>({data:{user:{email:'fixture@example.invalid'}}})}},from(table:string){
  const call={table,patch:null as any,columns:'',filters:[] as any[]};h.calls.push(call);
  const b:any={select:(columns:string)=>{call.columns=columns;return b;},update:(patch:any)=>{call.patch=patch;return b;},eq:(...args:any[])=>{call.filters.push(args);return b;},single:()=>run(),maybeSingle:()=>run()};
  async function run(){return {data:table==='profiles'?{locale:h.locale}:call.patch?{id:'booking'}:{user_id:'customer',starts_at:'2026-09-10T12:00:00Z',services:{name_de:'Schnitt',name_en:'Cut',name_fr:'Coupe',name_it:'Taglio'},salons:{name:'Fixture'}},error:null};}
  return b;
 }};
});
const run=()=>POST(new NextRequest('https://fixture.invalid/api/bookings/booking/confirm',{method:'POST'}),{params:Promise.resolve({id:'booking'})});
test.each([['fr','Coupe'],['it','Taglio'],[null,'Schnitt']])('actual owner confirmation projects and notifies %s service name',async(locale,label)=>{
 h.locale=locale;expect((await run()).status).toBe(200);
 expect(h.notify).toHaveBeenCalledWith(expect.objectContaining({emailParams:expect.objectContaining({locale:locale??'de',vars:expect.objectContaining({service:label})})}));
 expect(h.calls[0]).toMatchObject({patch:{status:'confirmed'},filters:[['id','booking'],['status','pending']]});
 expect(h.calls.find(c=>c.columns.startsWith('user_id')).columns).toContain('name_fr, name_it');
});
test.each(['customer',null])('actual confirmation preserves unauthorized %s refusal without a sender',async actor=>{
 h.actor=actor;expect((await run()).status).toBe(actor?403:404);expect(h.calls).toHaveLength(0);expect(h.notify).not.toHaveBeenCalled();
});
