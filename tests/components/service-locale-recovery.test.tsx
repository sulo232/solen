import React, { useState } from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, expect, test, vi } from 'vitest';
import fr from '@/messages/fr.json';
import it from '@/messages/it.json';
const h=vi.hoisted(()=>({locale:'fr',messages:{} as any,form:{} as any,update:(_patch:any)=>{},controls:{start:()=>{}},navigate:vi.fn()}));
vi.mock('next-intl',async()=>{const actual=await vi.importActual<any>('next-intl');return {...actual,useLocale:()=>h.locale,useTranslations:(namespace:string)=>actual.createTranslator({locale:h.locale,messages:h.messages,namespace})};});
vi.mock('motion/react',()=>({motion:new Proxy({},{get:(_,name)=>name}),AnimatePresence:({children}:any)=>children,useReducedMotion:()=>true,useAnimationControls:()=>h.controls}));
vi.mock('@/lib/booking-context',()=>({useBooking:()=>({formData:h.form,updateFormData:h.update,goToStep:h.navigate})}));
vi.mock('@/components-legacy/booking/CountUpNumber',()=>({default:({value}:any)=><span>{value}</span>}));
vi.mock('next/link',()=>({default:({children,...props}:any)=><a {...props}>{children}</a>}));
vi.mock('react-dom',()=>({createPortal:(children:any)=>children}));
import ServicesStaffStep from '@/components-legacy/booking/ServicesStaffStep';
import { SalonServices } from '@/app/[locale]/_components/salon/SalonServices';
const service={id:'service',name_de:'Schnitt',name_en:'Cut',name_fr:'Coupe',name_it:'Taglio',description_de:'Beschreibung',description_en:'Description',description_fr:'Description française',description_it:'Descrizione italiana',price:45,duration_minutes:30,category:'coiffeur',subcategory:null,is_active:true,suitable_gender:null};
function Harness(){
 const [form,setForm]=useState({services:[] as any[],totalPrice:0,totalDuration:0,selectedStaffId:'any'});h.form=form;h.update=(patch:any)=>setForm(old=>({...old,...patch}));
 return <ServicesStaffStep services={[service,{...service,id:'second',price:20,duration_minutes:15}]} staffList={[]} salonId="salon" salonSlug="fixture" staffServices={[]} serviceAddons={[]} serviceOptions={[]} nextStep="datetime"/>;
}
beforeEach(()=>{
 h.locale='fr';h.messages=fr;vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);
 vi.stubGlobal('window',{addEventListener:()=>{},removeEventListener:()=>{},matchMedia:()=>({matches:true})});
 vi.stubGlobal('document',{getElementById:()=>null,body:{style:{}}});
 vi.stubGlobal('IntersectionObserver',class{observe(){}unobserve(){}disconnect(){}});
});
test.each([['fr',fr,'Coupe'],['it',it,'Taglio']])('actual %s booking selection preserves locale fields, totals, plural count and deselection',async(locale,messages,label)=>{
 h.locale=locale as string;h.messages=messages;let tree:any;await act(async()=>{tree=create(<Harness/>);});
 expect(JSON.stringify(tree.toJSON())).toContain(label);
 const select=(id:string)=>tree.root.findAll(n=>n.type==='div'&&n.props['data-service-id']===id)[0].findAllByType('button').at(-1);
 await act(async()=>select('service').props.onClick({stopPropagation(){}}));
 expect(h.form.services[0]).toMatchObject({name_fr:'Coupe',name_it:'Taglio',price:45,duration_minutes:30});
 expect(h.form).toMatchObject({totalPrice:45,totalDuration:30});
 expect(JSON.stringify(tree.toJSON())).toContain(locale==='fr'?'1 article':'1 articolo');
 await act(async()=>select('second').props.onClick({stopPropagation(){}}));
 expect(h.form).toMatchObject({totalPrice:65,totalDuration:45});
 expect(JSON.stringify(tree.toJSON())).toContain(locale==='fr'?'2 articles':'2 articoli');
 await act(async()=>select('service').props.onClick({stopPropagation(){}}));
 expect(h.form.services).toHaveLength(1);expect(h.form).toMatchObject({totalPrice:20,totalDuration:15});
 await act(async()=>tree.unmount());
});
test.each([['fr',fr,'Coupe','Description française'],['it',it,'Taglio','Descrizione italiana']])('actual %s PDP service disclosure renders localized name and expanded description',async(locale,messages,label,description)=>{
 h.locale=locale as string;h.messages=messages;let tree:any;await act(async()=>{tree=create(<SalonServices services={[service] as any} locale={h.locale} slug="fixture" salon={{id:'salon',name:'Fixture'} as any}/>);});
 expect(JSON.stringify(tree.toJSON())).toContain(label);
 const disclosure=tree.root.findAllByType('button').find((b:any)=>b.props['aria-expanded']===false);
 await act(async()=>disclosure.props.onClick());
 expect(JSON.stringify(tree.toJSON())).toContain(description);
 await act(async()=>tree.unmount());
});

test('actual draft restoration takes current locale fields and price from the live service list',async()=>{
 const {restoredDraftPatch}=await vi.importActual<any>('@/lib/booking-context');
 const patch=restoredDraftPatch({draft:{services:[{...service,name_fr:'stale',price:1}],selectedStaffId:'any',selectedDate:null},knownServices:[service],knownStaffIds:[],hasInitialServices:false,hasInitialStaff:false,hasInitialDate:false});
 expect(patch.services[0]).toMatchObject({name_fr:'Coupe',name_it:'Taglio',price:45});expect(patch.totalPrice).toBe(45);
});

vi.mock('next/navigation',()=>({useRouter:()=>({push:h.navigate,back:h.navigate})}));
vi.mock('next/image',()=>({default:({src,alt,...props}:any)=><img src={src} alt={alt} {...props}/> }));
vi.mock('next-view-transitions',()=>({Link:({children,...props}:any)=><a {...props}>{children}</a>}));
vi.mock('@/app/[locale]/_components/homepage/HeartButton',()=>({HeartButton:()=>null}));
import StaffProfilePage from '@/components-legacy/staff/StaffProfilePage';
import { SalonCard } from '@/app/[locale]/_components/homepage/SalonCard';
test.each([['fr',fr,'Ongles'],['it',it,'Unghie']])('actual %s card category uses existing navigation translation',async(locale,messages,label)=>{
 h.locale=locale as string;h.messages=messages;let tree:any;
 await act(async()=>{tree=create(<SalonCard slug="fixture" name="Fixture" category="nails" rating={null} reviewCount={null}/>);});
 expect(JSON.stringify(tree.toJSON())).toContain(label);expect(tree.root.findByType('a').props.href).toBe(`/${locale}/salon/fixture`);
 await act(async()=>tree.unmount());
});
test.each([null,4.75])('actual staff profile safely renders %s aggregate without inventing a missing summary',async rating=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({staff:{id:'staff',name:'Fixture',average_rating:rating,review_count:rating==null?null:240},reviews:[{id:'review',rating:5,comment:'Fixture review',created_at:'2026-08-05T12:00:00Z',profiles:{display_name:'Fixture customer'}}]})})));
 let tree:any;await act(async()=>{tree=create(<StaffProfilePage staffId="staff" salonSlug="fixture"/>);});
 const visibleText=(node:any):string=>typeof node==='string'?node:Array.isArray(node)?node.map(visibleText).join(' '):node?.children?visibleText(node.children):'';
 const output=visibleText(tree.toJSON());expect(output).toContain('Fixture review');
 if(rating==null){expect(output).not.toContain('0.0');expect(output).not.toContain('240');}
 else{expect(output).toContain('4.8');expect(output).toContain('240');}
 await act(async()=>tree.unmount());
});
