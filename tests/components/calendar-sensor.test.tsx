import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import en from '@/messages/en.json';
const h=vi.hoisted(()=>({fetch:vi.fn(),status:'available',bookings:[] as any[]}));
vi.mock('next-intl',async()=>{const actual=await vi.importActual<any>('next-intl');return {...actual,useLocale:()=> 'en',useTranslations:(namespace:string)=>actual.createTranslator({locale:'en',messages:en,namespace})};});
vi.mock('@/components-legacy/dashboard/DashboardLayout',()=>({default:({children}:any)=><main>{children}</main>}));
vi.mock('motion/react',()=>({motion:new Proxy({},{get:(_,name)=>name}),useReducedMotion:()=>true}));
vi.mock('@/components-legacy/dashboard/WalkInModal',()=>({default:()=>null}));
vi.mock('@/app/[locale]/_components/primitives/Modal',()=>({Modal:({children,isOpen}:any)=>isOpen?<div role="dialog">{children}</div>:null,ModalHeader:({title,onClose,closeAriaLabel}:any)=><header><h2>{title}</h2><button onClick={onClose} aria-label={closeAriaLabel}>X</button></header>,ModalBody:({children}:any)=><div>{children}</div>,ModalFooter:({children}:any)=><div>{children}</div>}));
vi.mock('@/lib/supabase-browser',()=>({createBrowserSupabaseClient:()=>{const channel:any={on:()=>channel,subscribe:()=>channel};return {channel:()=>channel,removeChannel:()=>Promise.resolve()};}}));
// @hello-pangea/dnd is deliberately NOT mocked: real context, registry and keyboard sensor.
import CalendarPage from '@/app/[locale]/dashboard/calendar/page';
let root:Root|undefined;let host:HTMLDivElement;
const response=(body:unknown)=>({ok:true,status:200,json:async()=>body});
const writes=()=>h.fetch.mock.calls.filter(([,init])=>init?.method&&init.method!=='GET');
const handle=()=>host.querySelector('[data-calendar-desktop] [data-calendar-event]') as HTMLButtonElement;
async function mount(){host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root!.render(<CalendarPage/>));}
async function press(el:HTMLElement,key:string,keyCode:number){const event=new KeyboardEvent('keydown',{key,code:key===' '?'Space':key,keyCode,bubbles:true,cancelable:true});await act(async()=>{el.dispatchEvent(event);});return event;}
beforeEach(()=>{
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-09-08T10:00:00Z'));h.status='available';h.bookings=[];
 vi.stubGlobal('requestAnimationFrame',window.requestAnimationFrame.bind(window));vi.stubGlobal('cancelAnimationFrame',window.cancelAnimationFrame.bind(window));
 vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockImplementation(function(this:HTMLElement){return {x:20,y:100,top:100,left:20,bottom:188,right:220,width:200,height:88,toJSON:()=>({})} as DOMRect;});
 h.fetch.mockReset().mockImplementation((url:string,init?:RequestInit)=>{
  if(init?.method&&init.method!=='GET')throw new Error('Unexpected write in read-only sensor fixture');
  if(url==='/api/profile')return Promise.resolve(response({id:'operator',salon_id:'store'}));
  if(url.startsWith('/api/services'))return Promise.resolve(response({services:[{id:'service',name_de:'Schnitt',name_en:'Cut'}]}));
  if(url.startsWith('/api/staff'))return Promise.resolve(response({staff:[{id:'a',name:'Alex'}]}));
  if(url.startsWith('/api/slots'))return Promise.resolve(response({slots:[{id:'slot-a',salon_id:'store',staff_member_id:'a',service_id:'service',starts_at:'2026-09-08T09:00:00Z',ends_at:'2026-09-08T10:00:00Z',status:h.status,price_override:null}],total:1}));
  if(url.startsWith('/api/bookings'))return Promise.resolve(response({bookings:h.bookings,total:h.bookings.length}));
  throw new Error(`Unexpected URL ${url}`);
 });vi.stubGlobal('fetch',h.fetch);
});
afterEach(async()=>{if(root)await act(async()=>root!.unmount());root=undefined;host?.remove();vi.restoreAllMocks();vi.unstubAllGlobals();vi.useRealTimers();});
test('installed keyboard sensor lifts the available button; Escape cancels without details or database mutation',async()=>{
 await mount();const button=handle();expect(button.tagName).toBe('BUTTON');expect(button.getAttribute('data-rfd-drag-handle-draggable-id')).toBeTruthy();
 await act(async()=>button.focus());const lift=await press(button,' ',32);
 expect(lift.defaultPrevented).toBe(true);expect(button.style.position).toBe('fixed');expect(host.querySelector('[role="dialog"]')).toBeNull();
 const cancel=await press(button,'Escape',27);expect(cancel.defaultPrevented).toBe(true);expect(button.style.position).not.toBe('fixed');expect(writes()).toHaveLength(0);expect(host.querySelector('[role="dialog"]')).toBeNull();
});
test('ordinary click on the available button still opens its real detail path without writes',async()=>{await mount();await act(async()=>handle().click());expect(host.querySelector('[role="dialog"]')).not.toBeNull();expect(host.textContent).toContain(en.dashboard.calendarPage.detailsTitle);expect(writes()).toHaveLength(0);});
test.each(['booked','blocked'])('installed keyboard sensor cannot lift a %s slot button',async status=>{h.status=status;await mount();const button=handle();expect(button.getAttribute('data-rfd-drag-handle-draggable-id')).toBeNull();await act(async()=>button.focus());const event=await press(button,' ',32);expect(event.defaultPrevented).toBe(false);expect(button.style.position).not.toBe('fixed');expect(writes()).toHaveLength(0);});
