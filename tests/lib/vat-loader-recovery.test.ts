import { beforeEach, expect, test, vi } from 'vitest';
const h=vi.hoisted(()=>({rate:8.1 as number|null,registered:true,calls:[] as any[]}));
vi.mock('next/headers',()=>({cookies:async()=>({getAll:()=>[]})}));
vi.mock('next-intl/server',()=>({getTranslations:async()=>()=>''}));
vi.mock('@/app/[locale]/_components/salon/_shared',()=>({computeOpenStatus:()=>({}),nowInTimezone:()=>new Date(),publicReply:()=>null}));
vi.mock('@/lib/supabase',()=>({createServerSupabaseClient:async()=>db(),createAdminSupabaseClient:()=>db()}));
function db(){return {from(table:string){const call={table,selection:''};h.calls.push(call);const run=async()=>({data:table==='salons'?Object.fromEntries(call.selection.split(', ').map(key=>[key,({id:'store',name:'Fixture Store',is_active:true,listed_on_marketplace:true,is_test:false,vat_registered:h.registered,vat_rate:h.rate,vat_number:'CHE-fixture'} as any)[key]])):[],error:null});const q:any={select:(s:string)=>{call.selection=s;return q;},eq:()=>q,order:()=>q,limit:()=>q,single:run,then:(a:any,b:any)=>run().then(a,b)};return q;}};}
import { loadSalonDetailWithAccess } from '@/lib/salon-detail';
beforeEach(()=>{h.calls=[];});
test.each([[false,8.1],[true,8.1],[true,0],[true,null]])('loader preserves stored registration %s/rate %s without defaults',async(registered,rate)=>{h.registered=registered as boolean;h.rate=rate as number|null;const result=await loadSalonDetailWithAccess('fixture-store');expect(result?.salon).toMatchObject({vat_registered:registered,vat_rate:rate,vat_number:'CHE-fixture'});expect(h.calls.find(c=>c.table==='salons').selection.split(', ')).toEqual(expect.arrayContaining(['vat_registered','vat_rate','vat_number']));});
