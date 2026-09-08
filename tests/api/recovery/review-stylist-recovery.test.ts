import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { publicReviewStylist } from '@/app/[locale]/_components/salon/_shared';
const storeId = '10000000-0000-4000-8000-000000000001';
const staffId = '20000000-0000-4000-8000-000000000001';
const state = vi.hoisted(() => ({ calls: [] as any[], reviews: [] as any[], attribution: [] as any[], limited: null as Response|null, error: false, attributionError: false, visible: true }));
function client(admin = false) { return {
  auth: {getUser: async()=>({data:{user:null}})},
  from(table: string) {
    const call = {admin,table,select:'',filters:[] as any[],range:[] as number[]}; state.calls.push(call);
    const run = async (single = false) => {
      let data: any = table === 'salons' ? {id:storeId,owner_id:'store-owner',name:'Test Store',slug:'test-store',is_active:state.visible,listed_on_marketplace:true,is_test:false,vat_registered:true,vat_rate:2.625} : table === 'reviews' ? admin ? state.attribution : state.reviews : [];
      if (Array.isArray(data)) data = data.filter(row => call.filters.every(([key,value]:any)=>row[key] === undefined || (Array.isArray(value) ? value.includes(row[key]) : row[key] === value)));
      // Respect the actual explicit projection's public/private boundary in this stub.
      if (table === 'reviews' && call.select.includes('profiles')) data = data.map((row:any)=>{
        const result:any={id:row.id,rating:row.rating,comment:row.comment,created_at:row.created_at,profiles:row.profiles,review_replies:row.review_replies};
        if(call.select.includes('booking_id')) result.booking_id=row.booking_id;
        if(call.select.includes('staff_member_id')) Object.assign(result,{staff_member_id:row.staff_member_id,bookings:row.bookings,staff_members:row.staff_members});
        return result;
      });
      return {data: single && Array.isArray(data) ? data[0] ?? null : data,count:state.reviews.length,error:table==='reviews' && (admin?state.attributionError:state.error)?{message:'private DB diagnostic'}:null};
    };
    const q:any={select:(s:string)=>{call.select=s;return q;},eq:(k:string,v:any)=>{call.filters.push([k,v]);return q;},in:(k:string,v:any)=>{call.filters.push([k,v]);return q;},order:()=>q,limit:()=>q,range:(a:number,b:number)=>{call.range=[a,b];return q;},single:()=>run(true),maybeSingle:()=>run(true),then:(a:any,b:any)=>run().then(a,b)}; return q;
  }
};}
vi.mock('@/lib/supabase',()=>({createServerSupabaseClient:async()=>client(),createAdminSupabaseClient:()=>client(true)}));
vi.mock('@/lib/ratelimit',()=>({generalLimiter:{},getClientIp:()=> 'test-ip',applyRateLimit:async()=>state.limited}));
vi.mock('next/headers',()=>({cookies:async()=>({getAll:()=>[]})}));
vi.mock('next-intl/server',()=>({getTranslations:async()=>()=>''}));
vi.mock('next/navigation',()=>({notFound:()=>{throw Error('NEXT_NOT_FOUND');}}));
vi.mock('@/components-legacy/salon/SalonReviews',()=>({default:()=>null}));
import { GET } from '@/app/api/reviews/salon/[salon_id]/route';
import { loadSalonDetailWithAccess } from '@/lib/salon-detail';
import FullReviewsPage from '@/app/[locale]/salon/[slug]/reviews/page';
const matched=()=>({id:'review-1',salon_id:storeId,is_hidden:false,rating:5,comment:'Public comment',created_at:'2026-09-08',booking_id:'private-booking',staff_member_id:staffId,bookings:{salon_id:storeId,staff_member_id:staffId},staff_members:{id:staffId,name:'Actual Stylist',salon_id:storeId,is_active:true},review_replies:{reply_text:'PRIVATE DRAFT',is_public:false,created_at:'2026-09-08'}});
beforeEach(()=>{state.calls=[];state.reviews=[matched()];state.attribution=[matched()];state.limited=null;state.error=false;state.attributionError=false;state.visible=true;});
const request=(id=storeId,query='')=>GET(new NextRequest(`https://test.local/api/reviews/salon/${id}${query}`),{params:Promise.resolve({salon_id:id})});
const cases: [string,(row:any)=>void][] = [
 ['no booking',r=>{r.bookings=null;}],['no assigned stylist',r=>{r.staff_member_id=null;}],['different booked stylist',r=>{r.bookings.staff_member_id='other';}],['foreign booking',r=>{r.bookings.salon_id='other';}],['moved/foreign stylist',r=>{r.staff_members.salon_id='other';}],['different joined ID',r=>{r.staff_members.id='other';}],['inactive stylist',r=>{r.staff_members.is_active=false;}],['missing stylist',r=>{r.staff_members=null;}],['blank name',r=>{r.staff_members.name=' ';}],
];
describe('booking-backed review attribution',()=>{
 it('returns only public id/name for the matching active stylist',()=>{expect(publicReviewStylist(matched(),storeId)).toEqual({staff_member_id:staffId,staff_members:{id:staffId,name:'Actual Stylist'}});});
 it.each(cases)('omits %s without reassigning',(_,change)=>{const r=matched();change(r);expect(publicReviewStylist(r,storeId)).toEqual({staff_member_id:null,staff_members:null});});
 it('applies limiter before any DB access',async()=>{state.limited=NextResponse.json({limited:true},{status:429});expect((await request()).status).toBe(429);expect(state.calls).toEqual([]);});
 it.each(['bad','%','1-2'])('rejects malformed UUID %s without DB',async(id)=>{expect((await request(id)).status).toBe(400);expect(state.calls).toEqual([]);});
 it.each(['0','NaN','2x','1.5','9007199254740991'])('rejects malformed page %s without DB',async(page)=>{expect((await request(storeId,`?page=${page}`)).status).toBe(400);expect(state.calls).toEqual([]);});
 it('actual GET scopes attribution to the RLS-visible IDs, preserves paging and strips private fields',async()=>{
  const response=await request(storeId,'?page=2&sort=highest');const body=await response.json();expect(response.status).toBe(200);
  expect(body).toMatchObject({page:2,limit:20,total:1,items:[{staff_member_id:staffId,staff_members:{id:staffId,name:'Actual Stylist'},is_verified:true,review_replies:null}]});
  expect(JSON.stringify(body)).not.toMatch(/private-booking|PRIVATE DRAFT|bookings|salon_id|is_active/);
  const privileged=state.calls.find(c=>c.admin);expect(privileged.filters).toEqual([['salon_id',storeId],['is_hidden',false],['id',['review-1']]]);expect(state.calls[0].range).toEqual([20,39]);
  expect(privileged.select).not.toMatch(/user_id|guest_|payment|stripe|\*/);
 });
 it.each(cases)('actual GET does not expose attribution for %s',async(_,change)=>{change(state.attribution[0]);const body=await(await request()).json();expect(body.items[0]).toMatchObject({staff_member_id:null,staff_members:null});});
 it('keeps a review but omits failed attribution',async()=>{state.attributionError=true;const body=await(await request()).json();expect(body.items[0]).toMatchObject({comment:'Public comment',staff_members:null});});
 it('returns generic primary error and never performs privileged lookup',async()=>{state.error=true;const res=await request();expect(res.status).toBe(500);expect(JSON.stringify(await res.json())).not.toContain('private DB diagnostic');expect(state.calls.some(c=>c.admin)).toBe(false);});
 it('empty primary results do not trigger privileged lookup',async()=>{state.reviews=[];expect((await(await request()).json()).items).toEqual([]);expect(state.calls.some(c=>c.admin)).toBe(false);});
 it('actual detail loader keeps VAT, sanitizes stylist and removes nested booking/private reply',async()=>{
  const result=await loadSalonDetailWithAccess('test-store');expect(result?.salon).toMatchObject({vat_registered:true,vat_rate:2.625,reviews:[{staff_member_id:staffId,staff_members:{id:staffId,name:'Actual Stylist'},review_replies:null}]});
  expect(JSON.stringify(result?.salon.reviews)).not.toMatch(/PRIVATE DRAFT|bookings|salon_id|is_active/);
 });
 it.each(cases)('actual detail loader omits %s',async(_,change)=>{change(state.attribution[0]);expect((await loadSalonDetailWithAccess('test-store'))?.salon.reviews[0]).toMatchObject({staff_member_id:null,staff_members:null});});
 it('hidden Store blocks privileged review fetch in loader',async()=>{state.visible=false;expect(await loadSalonDetailWithAccess('test-store')).toBeNull();expect(state.calls.some(c=>c.admin)).toBe(false);});
 it.each(['de','en','fr','it'])('actual full page %s forwards matched public stylist only',async(locale)=>{const page:any=await FullReviewsPage({params:Promise.resolve({locale,slug:'test-store'})});const props=page.props.children.props.children.props;expect(props.locale).toBe(locale);expect(props.reviews[0]).toMatchObject({staff_member_id:staffId,staff_members:{id:staffId,name:'Actual Stylist'}});expect(JSON.stringify(props.reviews)).not.toMatch(/PRIVATE DRAFT|bookings|salon_id|is_active/);});
 it('actual full page omits a foreign stylist',async()=>{state.attribution[0].staff_members.salon_id='other';const page:any=await FullReviewsPage({params:Promise.resolve({locale:'en',slug:'test-store'})});expect(page.props.children.props.children.props.reviews[0]).toMatchObject({staff_member_id:null,staff_members:null});});
});
