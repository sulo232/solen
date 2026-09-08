import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
const h=vi.hoisted(()=>({db:{} as any,queries:[] as any[],active:true,hidden:false,ratingError:false,missing:false}));
vi.mock('@/lib/supabase',()=>({createServerSupabaseClient:async()=>h.db,createAdminSupabaseClient:()=>h.db}));
vi.mock('next/headers',()=>({cookies:async()=>({getAll:()=>[]})}));
vi.mock('next-intl/server',()=>({getTranslations:async()=>()=>''}));
import { GET } from '@/app/api/staff/[id]/profile/route';
import { loadSalonDetailWithAccess } from '@/lib/salon-detail';
import { localizedField } from '@/lib/i18n/localized-field';
const service={id:'service',name_de:'Schnitt',name_en:'Cut',name_fr:'Coupe',name_it:'Taglio'};
beforeEach(()=>{
 h.queries=[];h.active=true;h.hidden=false;h.ratingError=false;h.missing=false;
 h.db={from(table:string){
  const q={table,columns:'',filters:[] as any[],limit:undefined as number|undefined};
  const b:any={select:(columns:string)=>{q.columns=columns;return b;},eq:(...args:any[])=>{q.filters.push(args);return b;},in:(...args:any[])=>{q.filters.push(args);return b;},order:()=>b,limit:(limit:number)=>{q.limit=limit;return b;},single:()=>run(true),maybeSingle:()=>run(true),then:(resolve:any,reject:any)=>run(false).then(resolve,reject)};
  async function run(single:boolean){
   h.queries.push(q);
   const salon={id:'salon',owner_id:'owner_fixture',slug:'fixture',is_active:true,listed_on_marketplace:!h.hidden,is_test:false};
   let data:any=[];let error:any=null;
   if(table==='salons')data=salon;
   if(table==='staff_members')data=h.active?[{id:'staff',name:'Fixture',salons:salon}]:[];
   if(table==='services')data=[service];
   if(table==='staff_services')data=[{staff_member_id:'staff',service_id:'service',services:service}];
   if(table==='reviews')data=Array.from({length:100},(_,i)=>({id:String(i),rating:1}));
   if(table==='staff_ratings_view'){
    expect(h.queries.some(r=>r.table==='staff_members')).toBe(true);
    data=h.missing?[]:[{staff_id:'staff',average_rating:4.75,review_count:240}];
    if(h.ratingError){data=null;error={message:'fixture unavailable'};}
   }
   if(single&&Array.isArray(data))data=data[0]??null;
   return {data,error};
  }
  return b;
 }};
});
const profile=()=>GET(new NextRequest('https://fixture.invalid/api/staff/staff/profile'),{params:Promise.resolve({id:'staff'})});
test('actual profile reads uncapped visible aggregate separately from 100 displayed reviews and projects FR/IT',async()=>{
 const response=await profile();const body=await response.json();
 expect(response.status).toBe(200);expect(body.staff).toMatchObject({average_rating:4.75,review_count:240});expect(body.reviews).toHaveLength(100);
 expect(localizedField(body.services[0],'name','fr')).toBe('Coupe');expect(localizedField(body.services[0],'name','it')).toBe('Taglio');
 expect(h.queries.find(q=>q.table==='staff_ratings_view')).toMatchObject({filters:[['staff_id','staff']],limit:undefined});
 expect(h.queries.find(q=>q.table==='staff_services').columns).toContain('name_fr, name_it');
});
test.each(['error','missing'])('actual profile omits unavailable %s aggregate instead of stale or capped statistics',async state=>{
 h.ratingError=state==='error';h.missing=state==='missing';
 const body=await(await profile()).json();expect(body.staff).toMatchObject({average_rating:null,review_count:null});expect(body.reviews).toHaveLength(100);
});
test.each(['inactive','hidden'])('actual profile rejects %s before aggregate lookup',async state=>{
 h.active=state!=='inactive';h.hidden=state==='hidden';expect((await profile()).status).toBe(404);expect(h.queries.some(q=>q.table==='staff_ratings_view')).toBe(false);
});
test('actual PDP loader maps the aggregate by active staff ids and keeps locale fields',async()=>{
 const result=await loadSalonDetailWithAccess('fixture');expect(result?.salon.staff[0]).toMatchObject({staff_average_rating:4.75,staff_review_count:240});
 expect(h.queries.find(q=>q.table==='staff_ratings_view')).toMatchObject({filters:[['staff_id',['staff']]],limit:undefined});
 expect(h.queries.find(q=>q.table==='staff_members').filters).toContainEqual(['is_active',true]);
 expect(h.queries.find(q=>q.table==='services').columns).toContain('name_fr, name_it');
 expect(localizedField(result?.salon.services[0] as any,'name','it')).toBe('Taglio');
});
test.each(['error','missing','no-active-staff','hidden'])('actual PDP loader preserves %s aggregate boundary',async state=>{
 h.ratingError=state==='error';h.missing=state==='missing';h.active=state!=='no-active-staff';h.hidden=state==='hidden';
 const result=await loadSalonDetailWithAccess('fixture');
 if(state==='hidden')expect(result).toBeNull();
 else if(state==='no-active-staff')expect(result?.salon.staff).toEqual([]);
 else expect(result?.salon.staff[0]).toMatchObject({staff_average_rating:null,staff_review_count:null});
 if(state==='hidden'||state==='no-active-staff')expect(h.queries.some(q=>q.table==='staff_ratings_view')).toBe(false);
});
