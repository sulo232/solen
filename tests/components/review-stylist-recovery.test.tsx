import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import itMessages from '@/messages/it.json';
const state=vi.hoisted(()=>({locale:'en'}));
const messages={de,en,fr,it:itMessages};
vi.mock('next-intl',()=>({useTranslations:(namespace:string)=>{
 const raw=(key:string)=>(messages[state.locale as keyof typeof messages] as any)[namespace][key];
 const t=(key:string,values:Record<string,unknown>={})=>String(raw(key)).replace(/\{(\w+)\}/g,(_,key)=>String(values[key]??''));
 t.raw=raw;return t;
}}));
vi.mock('next/link',()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
vi.mock('next/image',()=>({default:(props:any)=><img {...props}/>}));
vi.mock('motion/react',()=>({motion:{button:({whileHover,whileTap,...props}:any)=><button {...props}/>},AnimatePresence:({children}:any)=>children}));
vi.mock('@/app/[locale]/_components/primitives',()=>({Avatar:()=> <span/>,RatingStars:({value}:any)=><span data-rating={value}/>,SeeAllButton:({href,children}:any)=><a href={href}>{children}</a>}));
vi.mock('@/app/[locale]/_components/primitives/Sheet',()=>({Sheet:({isOpen,children}:any)=>isOpen?<section>{children}</section>:null}));
vi.mock('@/app/[locale]/_components/primitives/TabPill',()=>({TabPill:({active,size,children,...props}:any)=><button {...props}>{children}</button>}));
vi.mock('@/app/[locale]/_components/primitives/RatingStars',()=>({RatingStars:({value}:any)=><span data-rating={value}/>}));
vi.mock('@/components-legacy/ReviewForm',()=>({default:()=>null}));
vi.mock('@/components-legacy/ui/EmptyState',()=>({default:({title,message}:any)=><section>{title}{message}</section>}));
import { SalonReviews as ModernReviews } from '@/app/[locale]/_components/salon/SalonReviews';
import LegacyReviews from '@/components-legacy/salon/SalonReviews';
let renderer:ReactTestRenderer;
const staffId='20000000-0000-4000-8000-000000000001';
const base={id:'review-1',rating:5,comment:'Original review',created_at:'2026-09-08T12:00:00Z',profiles:{display_name:'Test Reviewer',avatar_url:null},staff_member_id:staffId,staff_members:{id:staffId,name:'Actual Stylist'}};
const body=()=>JSON.stringify(renderer.toJSON());
const links=()=>renderer.root.findAllByType('a').filter(n=>String(n.props.href).includes('/staff/'));
async function mount(kind:'modern'|'legacy',rows:any[]=[base],extra:Record<string,unknown>={}){
 await act(async()=>{renderer=create(kind==='modern'?<ModernReviews reviews={rows} average={5} count={1} salonId="10000000-0000-4000-8000-000000000001" salonSlug="test-store" locale={state.locale} {...extra}/>:<LegacyReviews reviews={rows as any} averageRating={5} reviewCount={1} salonId="10000000-0000-4000-8000-000000000001" salonSlug="test-store" locale={state.locale} unreviewedBookingId={null} {...extra}/>);});
}
beforeEach(()=>{state.locale='en';vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({translations:{'review-1':'Translated review'}})})));});
afterEach(async()=>{if(renderer)await act(async()=>renderer.unmount());vi.unstubAllGlobals();});
describe('mounted approved review anatomy',()=>{
 for(const kind of ['modern','legacy'] as const) for(const locale of ['de','en','fr','it'] as const){
  it(`${kind} ${locale} links only the real name to its scoped staff route`,async()=>{state.locale=locale;await mount(kind);expect(links()).toHaveLength(1);expect(links()[0].props.href).toBe(`/${locale}/salon/test-store/staff/${staffId}`);expect(links()[0].children.filter(child=>typeof child==='string').join('')).toBe('Actual Stylist');expect(body()).toContain(messages[locale].reviews.withStylist.split('{name}')[0]);expect(body()).not.toContain('data-report');});
 }
 for(const kind of ['modern','legacy'] as const) for(const [label,extra] of [['no stylist',{staff_member_id:null,staff_members:null}],['missing name',{staff_members:{id:staffId,name:''}}],['mismatched ID',{staff_members:{id:'other',name:'Wrong Stylist'}}]] as const){
  it(`${kind} omits ${label}`,async()=>{await mount(kind,[{...base,...extra}]);expect(links()).toHaveLength(0);expect(body()).not.toContain('Wrong Stylist');});
 }
 for(const locale of ['en','fr','it'] as const){
  it(`${locale}: one localized marker with Languages14, original and translation toggles`,async()=>{
   state.locale=locale;await mount('modern');expect(body()).toContain('Translated review');expect(body()).not.toContain('Original review');
   const icon=()=>renderer.root.findAllByType('svg').filter(n=>String(n.props.className).includes('lucide-languages'));
   expect(icon()).toHaveLength(1);expect(icon()[0].props.width).toBe(14);expect(icon()[0].props['aria-hidden']).toBe(true);
   const text=messages[locale].reviews.translatedFrom;expect(body().split(`"${text}"`).length-1).toBe(1);
   const toggle=(label:string)=>renderer.root.findAllByType('button').find(n=>n.children.join('')===label)!;
   await act(async()=>toggle(messages[locale].reviews.showOriginal).props.onClick());expect(body()).toContain('Original review');expect(body()).not.toContain('Translated review');expect(icon()).toHaveLength(0);
   await act(async()=>toggle(messages[locale].reviews.showTranslation).props.onClick());expect(body()).toContain('Translated review');expect(icon()).toHaveLength(1);
  });
 }
 it('German original never requests or claims translation',async()=>{state.locale='de';await mount('modern');expect(fetch).not.toHaveBeenCalled();expect(body()).toContain('Original review');expect(body()).not.toContain('lucide-languages');expect(body()).not.toContain(de.reviews.translatedFrom);});
 it('failed translation keeps original with no translated marker',async()=>{vi.mocked(fetch).mockResolvedValue({ok:false} as Response);await mount('modern');expect(body()).toContain('Original review');expect(body()).not.toContain('lucide-languages');});
 it('PDP fallback uses the protected existing API and renders its sanitized stylist',async()=>{state.locale='de';vi.mocked(fetch).mockResolvedValue({ok:true,json:async()=>({items:[base]})} as Response);await mount('modern',[]);expect(fetch).toHaveBeenCalledWith('/api/reviews/salon/10000000-0000-4000-8000-000000000001');expect(links()).toHaveLength(1);});
 it('legacy pagination preserves a returned stylist and existing load-more behavior',async()=>{
  state.locale='de';vi.mocked(fetch).mockResolvedValue({ok:true,json:async()=>({items:[{...base,id:'review-2'}]})} as Response);
  await mount('legacy',[{...base,staff_member_id:null,staff_members:null}],{reviewCount:2});
  expect(links()).toHaveLength(0);
  await act(async()=>renderer.root.findAllByType('button').find(n=>n.children.join('')===de.salonDetail.showMoreReviews)!.props.onClick());
  expect(fetch).toHaveBeenCalledWith('/api/reviews/salon/10000000-0000-4000-8000-000000000001?page=2&sort=newest');expect(links()).toHaveLength(1);
 });
 for(const kind of ['modern','legacy'] as const){
  it(`${kind} adds an invisible 44px hit extension without changing name typography or flow`,async()=>{
   state.locale='de';await mount(kind);
   const link=links()[0];expect(link.props.className).toBe('relative text-s-accent hover:underline');
   const target=link.findByType('span');expect(target.props['aria-hidden']).toBe(true);
   expect(target.props.className).toBe('absolute left-1 top-0 h-11 min-w-11 w-full');
   expect(target.children).toHaveLength(0);
   expect(link.children.filter(child=>typeof child==='string').join('')).toBe('Actual Stylist');
  });
 }

});
