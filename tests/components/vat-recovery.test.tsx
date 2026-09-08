import React from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, afterEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it from '@/messages/it.json';
const h = vi.hoisted(() => ({locale:'en',params:new URLSearchParams(),rows:{} as Record<string,any>,calls:[] as any[],adminCreated:vi.fn(),createIntent:vi.fn(),fetch:vi.fn(),router:{push:vi.fn(),replace:vi.fn()},limit:vi.fn(),feature:vi.fn(),mint:vi.fn()}));
vi.mock('next/navigation',()=>({useSearchParams:()=>h.params,useRouter:()=>h.router}));
vi.mock('next-intl',()=>({useLocale:()=>h.locale,useTranslations:(namespace:string)=>(key:string,values?:Record<string,any>)=>{
 const messages:any={de,en,fr,it}[h.locale as 'en'];let value=namespace.split('.').reduce((o,k)=>o?.[k],messages);value=key.split('.').reduce((o,k)=>o?.[k],value)??key;
 return Object.entries(values??{}).reduce((s,[k,v])=>s.replaceAll('{'+k+'}',String(v)),value);
}}));
vi.mock('motion/react',()=>({motion:{div:'div'},useReducedMotion:()=>true}));
vi.mock('next/image',()=>({default:'img'}));
vi.mock('@/components-legacy/barber/WalkInPaymentForm',()=>({default:(props:any)=><div data-testid="payment" amount={props.amount} onPaid={props.onPaid}/> }));
vi.mock('@/components-legacy/booking/BookingPaymentForm',()=>({default:()=>null}));
vi.mock('@/components-legacy/booking/GuestBookingForm',()=>({default:()=>null}));
vi.mock('@/app/[locale]/_components/primitives/Toast',()=>({toast:{error:vi.fn()}}));
vi.mock('@/app/[locale]/_components/primitives',()=>({Avatar:()=>null,useEnterMotion:()=>({})}));
vi.mock('@/app/[locale]/_components/primitives/DateTimePicker',()=>({DateTimePickerRange:()=>null}));
vi.mock('@/components-legacy/dashboard/DashboardLayout',()=>({default:({children}:any)=>children}));
vi.mock('@/components-legacy/dashboard/OffPeakManager',()=>({default:()=>null}));
vi.mock('@/components-legacy/SalonCard',()=>({default:()=>null}));
vi.mock('@/components-legacy/ui/ExpandableTabs',()=>({default:()=>null}));
vi.mock('@/lib/booking-context',()=>({useBooking:()=>({formData:{services:[{id:'service',name_de:'Schnitt',name_en:'Cut',price:45,duration_minutes:30}],totalPrice:45,selectedDate:new Date('2026-09-09T10:00:00Z'),selectedTime:'10:00'},goToStep:vi.fn(),resetForm:vi.fn()})}));
vi.mock('@/lib/supabase',()=>({createAdminSupabaseClient:()=>{h.adminCreated();return db();},createServerSupabaseClient:async()=>({auth:{getUser:async()=>({data:{user:null}})}})}));
vi.mock('@/lib/stripe',()=>({stripe:{paymentIntents:{create:h.createIntent}},toRappen:(n:number)=>Math.round(n*100)}));
vi.mock('@/lib/ratelimit',()=>({applyRateLimit:h.limit,paymentLimiter:{},generalLimiter:{},getClientIp:()=> '127.0.0.1'}));
vi.mock('@/lib/feature-flags',()=>({checkFeatureEnabled:h.feature}));
vi.mock('@/lib/env',()=>({getServerEnv:()=>({BOOKING_HMAC_SECRET:'isolated-vat-test-secret'})}));
vi.mock('@/lib/walkin/authz',()=>({mintTrackingToken:h.mint}));
import WalkInPayPage from '@/app/[locale]/walk-in-pay/page';
import PayConfirmStep from '@/components-legacy/booking/PayConfirmStep';
import SettingsPage from '@/app/[locale]/dashboard/settings/page';
import { generalLimiter } from '@/lib/ratelimit';
import { GET as salonInfo } from '@/app/api/walkin/salon-info/route';
import { POST as payIntent } from '@/app/api/walkin/pay-intent/route';
import { GET as verifyBooking } from '@/app/api/bookings/walk-in-verify/route';
const salonId='11111111-1111-4111-8111-111111111111', serviceId='22222222-2222-4222-8222-222222222222', bookingId='33333333-3333-4333-8333-333333333333';
function columns(s:string):string[]{return s.split(/,(?![^()]*\))/).map(s=>s.trim());}
function project(row:any,selection:string):any {if(row==null)return row;if(Array.isArray(row))return row.map(r=>project(r,selection));return Object.fromEntries(columns(selection).map(c=>{const m=c.match(/^(\w+)\((.*)\)$/);return m?[m[1],project(row[m[1]],m[2])]:[c,row[c]]}));}
function db(){return {from(table:string){const call={table,selection:'',filters:[] as any[]};h.calls.push(call);const run=async(single=false)=>{const source=h.rows[table];const rows=table==='services'?(single?(Array.isArray(source)?source[0]:source):(Array.isArray(source)?source:[source])):source;return {data:project(rows,call.selection),error:source===null?{message:'fixture unavailable'}:null};};const q:any={select:(s:string)=>{call.selection=s;return q;},eq:(...v:any[])=>{call.filters.push(v);return q;},or:()=>q,order:()=>q,single:()=>run(true),maybeSingle:()=>run(true),then:(a:any,b:any)=>run().then(a,b)};return q;}};}
let tree:any;
function visible(n:any):string{return typeof n==='string'?n:Array.isArray(n)?n.map(visible).join(' '):n?.children?visible(n.children):'';}
function token(){const p=bookingId+':'+Math.floor(Date.now()/1000+3600);return Buffer.from(p+':'+crypto.createHmac('sha256','isolated-vat-test-secret').update(p).digest('hex')).toString('base64url');}
function fixtures(registered:any,rate:any){h.rows={salons:{id:salonId,name:'Fixture Store',address:'Fixture address',vat_registered:registered,vat_rate:rate,walkin_enabled:true,accepts_online_payment:true,stripe_account_id:'acct_fixture'},services:{id:serviceId,salon_id:salonId,is_active:true,name_de:'Schnitt',name_en:'Cut',name_fr:'Coupe',name_it:'Taglio',description_fr:'Description',description_it:'Descrizione',price:45,duration_minutes:30},staff_members:[],platform_settings:{value:{rate_percent:1}},bookings:{id:bookingId,salon_id:salonId,service_id:serviceId,paid_via:'walk_in',payment_status:'pending',price_paid:45,starts_at:'2026-09-09T10:00:00Z'}};h.rows.bookings.salons=h.rows.salons;h.rows.bookings.services=h.rows.services;}
function request(body:any){return new NextRequest('http://localhost/api/walkin/pay-intent',{method:'POST',body:JSON.stringify(body)});}
beforeEach(()=>{h.locale='en';h.params=new URLSearchParams();h.calls=[];h.adminCreated.mockReset();fixtures(true,8.1);h.fetch.mockReset();h.limit.mockReset().mockResolvedValue(null);h.feature.mockReset().mockResolvedValue(null);h.createIntent.mockReset().mockResolvedValue({id:'pi_fixture',client_secret:'pi_fixture_secret'});h.mint.mockReset();vi.stubGlobal('fetch',h.fetch);vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.stubGlobal('React',React);vi.spyOn(console,'error').mockImplementation(()=>{});});
afterEach(async()=>{if(tree)await act(async()=>tree.unmount());tree=null;vi.unstubAllGlobals();vi.restoreAllMocks();});
const cases=[[false,8.1,false],[true,8.1,true],[true,0,true],[true,2.625,true],[true,null,false],[true,-1,false],[true,NaN,false],[undefined,8.1,false]] as const;
for(const locale of ['de','en','fr','it'])for(const variant of ['qr','token'])test.each(cases)(`${locale} ${variant} registered=%s rate=%s actual handlers feed mounted VAT and preserve amount`,async(registered,rate,show)=>{
 h.locale=locale;fixtures(registered,rate);const service=h.rows.services;
 h.params=new URLSearchParams(variant==='qr'?{salon_id:salonId,service_id:serviceId}:{token:token()});
 h.fetch.mockImplementation(async(url:string,options:any)=>{
  if(url.startsWith('/api/walkin/salon-info'))return salonInfo(new NextRequest('http://localhost'+url));
  if(url.startsWith('/api/bookings/walk-in-verify'))return verifyBooking(new NextRequest('http://localhost'+url));
  if(url==='/api/walkin/pay-intent')return payIntent(request(JSON.parse(options.body)));
  throw Error('Unexpected external call '+url);
 });
 await act(async()=>{tree=create(<WalkInPayPage/>);});
 const text=visible(tree.toJSON());const marker={de:'MwSt',en:'VAT',fr:'TVA',it:'IVA'}[locale]!;
 expect(text.includes(marker)).toBe(show);if(show)expect(text).toContain(new Intl.NumberFormat(locale+'-CH',{maximumFractionDigits:20}).format(rate as number)+'%');
 if(show){const expected=rate===8.1?3.37:rate===2.625?1.15:0;expect(text).toContain(new Intl.NumberFormat(locale+'-CH',{style:'currency',currency:'CHF',minimumFractionDigits:2,maximumFractionDigits:2}).format(expected));}
 expect(tree.root.findByProps({'data-testid':'payment'}).props.amount).toBe(45);
 expect(h.createIntent).toHaveBeenCalledTimes(1);expect(h.createIntent.mock.calls[0][0]).toMatchObject({amount:4500,application_fee_amount:45,capture_method:'manual',transfer_data:{destination:'acct_fixture'}});
 expect(h.fetch.mock.calls.filter(([u])=>u==='/api/walkin/pay-intent').map(([,o])=>JSON.parse(o.body))).toEqual([expect.objectContaining({locale,...variant==='token'?{booking_id:bookingId}:{}})]);
 expect(text).toContain(service['name_'+locale]);expect(h.mint).not.toHaveBeenCalled();
});
test.each(['de','en','fr','it',undefined])('pay-intent locale %s preserves legacy omitted contract',async locale=>{const res=await payIntent(request({salon_id:salonId,service_id:serviceId,locale}));expect(res.status).toBe(200);expect(await res.json()).toMatchObject({amount:45,service_name:h.rows.services['name_'+(locale??'de')],salon_vat_registered:true,salon_vat_rate:8.1});});
test('invalid locale stops before DB or Stripe',async()=>{expect((await payIntent(request({salon_id:salonId,service_id:serviceId,locale:'xx'}))).status).toBe(400);expect(h.calls).toHaveLength(0);expect(h.createIntent).not.toHaveBeenCalled();});
test.each(['','invalid'])('missing/invalid token %s never reads DB or calls Stripe',async value=>{expect((await verifyBooking(new NextRequest('http://localhost/api/bookings/walk-in-verify?token='+value))).status).toBe(value?403:400);expect(h.calls).toHaveLength(0);expect(h.createIntent).not.toHaveBeenCalled();});
test('missing store/error refuses payment before Stripe',async()=>{h.rows.salons=null;expect((await payIntent(request({salon_id:salonId,service_id:serviceId}))).status).toBe(404);expect((await salonInfo(new NextRequest('http://localhost/api/walkin/salon-info?salon_id='+salonId))).status).toBe(404);expect(h.createIntent).not.toHaveBeenCalled();});
for(const locale of ['de','en','fr','it'])test.each(cases)(`${locale} mounted booking registered=%s rate=%s preserves working VAT arithmetic`,async(registered,rate)=>{
 h.locale=locale;await act(async()=>{tree=create(<PayConfirmStep salon={{name:'Fixture Store',vat_registered:registered,vat_rate:rate,payment_mode:'at_salon'} as any} staff={null} isLoggedIn={false} salonHasRedeemableVoucher={false}/>);});
 const text=visible(tree.toJSON());const show=registered===true&&typeof rate==='number'&&Number.isFinite(rate)&&rate>0;expect(text.includes({de:'MwSt',en:'VAT',fr:'TVA',it:'IVA'}[locale]!)).toBe(show);
 if(show)expect(text).toContain(new Intl.NumberFormat(locale+'-CH',{maximumFractionDigits:20}).format(rate)+'%');expect(h.fetch).not.toHaveBeenCalled();expect(h.createIntent).not.toHaveBeenCalled();
});
for(const locale of ['de','en','fr','it'])test.each(cases)(`${locale} mounted settings registered=%s rate=%s reflects stored rate without a payment`,async(registered,rate)=>{
 h.locale=locale;h.params=new URLSearchParams('tab=vat');fixtures(registered,rate);
 h.fetch.mockImplementation(async(url:string)=>new Response(JSON.stringify(url==='/api/profile'?{salon_id:salonId}:h.rows.salons)));
 await act(async()=>{tree=create(<SettingsPage/>);});
 const text=visible(tree.toJSON());const valid=typeof rate==='number'&&Number.isFinite(rate)&&rate>=0;
 if(valid){expect(text).toContain(new Intl.NumberFormat(locale+'-CH',{maximumFractionDigits:20}).format(rate));}else expect(text).not.toContain('8.1');
 expect(text).not.toContain('{rate}');expect(h.createIntent).not.toHaveBeenCalled();expect(h.fetch.mock.calls.every(([,o])=>!o?.method||o.method==='GET')).toBe(true);
});

test.each(['info-first','intent-first'])('parallel %s keeps authoritative amount/VAT and creates only one intent',async order=>{
 h.params=new URLSearchParams({salon_id:salonId,service_id:serviceId});
 let releaseInfo!:(r:Response)=>void,releaseIntent!:(r:Response)=>void;
 const infoPromise=new Promise<Response>(resolve=>{releaseInfo=resolve;});const intentPromise=new Promise<Response>(resolve=>{releaseIntent=resolve;});
 h.fetch.mockImplementation((url:string)=>url.startsWith('/api/walkin/salon-info')?infoPromise:intentPromise);
 await act(async()=>{tree=create(<WalkInPayPage/>);});
 const info=()=>new Response(JSON.stringify({salon:{...h.rows.salons,vat_registered:false,vat_rate:8.1},services:[{id:serviceId,name:'Stale display service',price:40}],staff:[]}));
 const intent=()=>new Response(JSON.stringify({client_secret:'pi_fixture_secret',amount:45,salon_vat_registered:true,salon_vat_rate:2.625}));
 if(order==='info-first'){await act(async()=>{releaseInfo(info());});await act(async()=>{releaseIntent(intent());});}
 else {await act(async()=>{releaseIntent(intent());});await act(async()=>{releaseInfo(info());});}
 expect(tree.root.findByProps({'data-testid':'payment'}).props.amount).toBe(45);expect(visible(tree.toJSON())).toContain('2.625%');expect(visible(tree.toJSON()).replaceAll('\u00a0',' ')).toContain('CHF 1.15');
 expect(h.fetch.mock.calls.filter(([u])=>u==='/api/walkin/pay-intent')).toHaveLength(1);
});
test('demo combined with real parameters never auto-creates a PaymentIntent',async()=>{h.params=new URLSearchParams({demo:'1',salon_id:salonId,service_id:serviceId});await act(async()=>{tree=create(<WalkInPayPage/>);});expect(h.fetch).not.toHaveBeenCalled();expect(h.createIntent).not.toHaveBeenCalled();});
test('payment provider error keeps failure state without an invented VAT amount',async()=>{
 h.params=new URLSearchParams({salon_id:salonId,service_id:serviceId});h.rows.services=[h.rows.services];
 h.fetch.mockImplementation(async(url:string)=>url.startsWith('/api/walkin/salon-info')?salonInfo(new NextRequest('http://localhost'+url)):new Response(JSON.stringify({code:'PAYMENT_INIT_FAILED'}),{status:502}));
 await act(async()=>{tree=create(<WalkInPayPage/>);});expect(visible(tree.toJSON())).toContain('Could not load store / service');expect(tree.root.findAllByProps({'data-testid':'payment'})).toHaveLength(0);
});
test('settings save preserves registration and UID without making the display rate editable',async()=>{
 h.params=new URLSearchParams('tab=vat');h.fetch.mockImplementation(async(url:string)=>new Response(JSON.stringify(url==='/api/profile'?{salon_id:salonId}:h.rows.salons)));
 await act(async()=>{tree=create(<SettingsPage/>);});const button=tree.root.findAllByType('button').find((b:any)=>visible(b).trim()==='Save');expect(button).toBeTruthy();
 await act(async()=>{button.props.onClick();});const writes=h.fetch.mock.calls.filter(([,o])=>o?.method==='PATCH');expect(writes).toHaveLength(1);expect(JSON.parse(writes[0][1].body)).toEqual({vat_registered:true,vat_number:null});expect(h.createIntent).not.toHaveBeenCalled();
});
test('projection includes VAT only on Stores while preserving staff and all locale service columns',async()=>{
 h.rows.services=[h.rows.services];h.rows.staff_members=[{id:'staff-fixture',name:'Fixture Stylist',avatar_url:null,specialties:['Cut'],average_rating:4.5,review_count:2}];const response=await salonInfo(new NextRequest('http://localhost/api/walkin/salon-info?salon_id='+salonId));expect((await response.json()).staff).toEqual([{id:'staff-fixture',name:'Fixture Stylist',avatar_url:null,role:'Cut',rating:4.5,review_count:2}]);
 expect(h.calls.find(c=>c.table==='salons').selection.split(', ')).toEqual(expect.arrayContaining(['vat_registered','vat_rate']));expect(h.calls.find(c=>c.table==='staff_members').selection).not.toContain('vat_');expect(h.calls.find(c=>c.table==='services').selection.split(', ')).toEqual(expect.arrayContaining(['name_fr','name_it','description_fr','description_it']));
});

test('client amount/tax claims cannot change the server price or registration',async()=>{
 fixtures(false,8.1);const response=await payIntent(request({salon_id:salonId,service_id:serviceId,amount:0.5,salon_vat_registered:true,salon_vat_rate:99}));expect(await response.json()).toMatchObject({amount:45,salon_vat_registered:false,salon_vat_rate:8.1});expect(h.createIntent.mock.calls[0][0]).toMatchObject({amount:4500,application_fee_amount:45});
});
test.each(['feature','rate-limit'])('%s refusal stops before VAT reads or payment creation',async guard=>{
 if(guard==='feature')h.feature.mockResolvedValue(new Response('{}',{status:503}));else h.limit.mockResolvedValue(new Response('{}',{status:429}));
 expect((await payIntent(request({salon_id:salonId,service_id:serviceId}))).status).toBe(guard==='feature'?503:429);expect(h.calls).toHaveLength(0);expect(h.createIntent).not.toHaveBeenCalled();
});
test('signed expired token keeps refusal without reading the Store',async()=>{
 const payload=bookingId+':1';const expired=Buffer.from(payload+':'+crypto.createHmac('sha256','isolated-vat-test-secret').update(payload).digest('hex')).toString('base64url');
 expect((await verifyBooking(new NextRequest('http://localhost/api/bookings/walk-in-verify?token='+expired))).status).toBe(403);expect(h.calls).toHaveLength(0);expect(h.createIntent).not.toHaveBeenCalled();
});

test('salon-info returns the existing IP limiter response before validation or admin construction',async()=>{
 const limited=new Response(JSON.stringify({error:'Too many requests'}),{status:429,headers:{'Retry-After':'60'}});h.limit.mockResolvedValue(limited);
 const response=await salonInfo(new NextRequest('http://localhost/api/walkin/salon-info?salon_id=malformed'));
 expect(response).toBe(limited);expect(response.headers.get('Retry-After')).toBe('60');expect(h.limit).toHaveBeenCalledExactlyOnceWith(generalLimiter,{ip:'127.0.0.1'});expect(h.adminCreated).not.toHaveBeenCalled();expect(h.calls).toHaveLength(0);expect(h.createIntent).not.toHaveBeenCalled();
});
test.each([undefined,'','malformed',salonId.replaceAll('-',''),salonId+'extra',' '+salonId])('salon-info rejects noncanonical UUID %s before admin construction',async id=>{
 const query=id===undefined?'':'?salon_id='+encodeURIComponent(id);const response=await salonInfo(new NextRequest('http://localhost/api/walkin/salon-info'+query));
 expect(response.status).toBe(400);expect(await response.json()).toEqual({error:'salon_id required'});expect(h.limit).toHaveBeenCalledExactlyOnceWith(generalLimiter,{ip:'127.0.0.1'});expect(h.adminCreated).not.toHaveBeenCalled();expect(h.calls).toHaveLength(0);expect(h.createIntent).not.toHaveBeenCalled();
});
