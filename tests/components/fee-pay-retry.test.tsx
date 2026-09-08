import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import messages from '@/messages/en.json';
const h = vi.hoisted(() => ({ token:'fixture_token', submit:vi.fn(), confirmPayment:vi.fn(), fetch:vi.fn() }));
vi.mock('next/navigation',()=>({useSearchParams:()=>new URLSearchParams(h.token?'token='+h.token:'')}));
vi.mock('next-intl',()=>({useLocale:()=> 'en',useTranslations:()=> (key:string,values?:Record<string,string>)=>{
  const template=(messages.feePay as Record<string,string>)[key] ?? key;
  return Object.entries(values??{}).reduce((text,[name,value])=>text.replace('{'+name+'}',value),template);
}}));
vi.mock('@stripe/stripe-js',()=>({loadStripe:()=>Promise.resolve({})}));
vi.mock('@stripe/react-stripe-js',()=>({
  Elements:({children}:any)=>children,
  PaymentElement:(props:any)=>React.createElement('div',{'data-testid':'payment-element',onChange:props.onChange}),
  useStripe:()=>({confirmPayment:h.confirmPayment}),useElements:()=>({submit:h.submit}),
}));
vi.mock('motion/react',()=>({motion:{div:'div'},useReducedMotion:()=>true}));
import FeePayClient from '@/app/[locale]/booking/[id]/fee/FeePayClient';
let renderer:ReactTestRenderer|undefined;
function text(node:any):string {return typeof node==='string'?node:(node.children??[]).map(text).join('');}
function button(label:string){const match=renderer!.root.findAllByType('button').find(node=>text(node).includes(label));if(!match)throw new Error('Missing button '+label);return match;}
beforeEach(()=>{
  vi.stubGlobal('React',React);vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.stubGlobal('fetch',h.fetch);
  h.token='fixture_token';h.fetch.mockReset();h.submit.mockReset();h.confirmPayment.mockReset();
  h.submit.mockResolvedValue({});h.confirmPayment.mockResolvedValue({paymentIntent:{id:'pi_paid',status:'succeeded'}});
});
afterEach(async()=>{if(renderer)await act(async()=>renderer!.unmount());renderer=undefined;vi.unstubAllGlobals();});
async function mountAndPay(failFirstConfirmation:boolean){
  let confirms=0;
  h.fetch.mockImplementation(async(url:string)=>{
    if(url.endsWith('fee-pay-intent'))return new Response(JSON.stringify({client_secret:'pi_paid_secret',amount_cents:2000,currency:'chf',salon_name:'Test Store',service_name:'Cut',starts_at:'2026-09-08T10:00:00Z',kind:'no_show'}),{status:200});
    confirms++;
    return new Response(JSON.stringify(confirms===1&&failFirstConfirmation?{error:'temporary'}:{status:'charged'}),{status:confirms===1&&failFirstConfirmation?503:200});
  });
  await act(async()=>{renderer=create(React.createElement(FeePayClient,{bookingId:'booking'}));});
  await act(async()=>renderer!.root.findByProps({'data-testid':'payment-element'}).props.onChange({complete:true}));
  await act(async()=>button('Pay').props.onClick());
}
test('mounted nonredirect success retains the paid intent for confirmation Retry without a second Stripe payment',async()=>{
  await mountAndPay(true);
  expect(text(renderer!.root)).toContain(messages.feePay.confirmErrorTitle);
  await act(async()=>button(messages.feePay.retryLabel).props.onClick());
  const confirmations=h.fetch.mock.calls.filter(([url])=>url.endsWith('fee-pay-confirm'));
  expect(confirmations).toHaveLength(2);
  expect(confirmations.map(([,options])=>JSON.parse(options.body).payment_intent_id)).toEqual(['pi_paid','pi_paid']);
  expect(h.confirmPayment).toHaveBeenCalledTimes(1);expect(h.submit).toHaveBeenCalledTimes(1);
  expect(text(renderer!.root)).toContain(messages.feePay.successTitle);
});
test('mounted success states the settled fee without promising email delivery',async()=>{
  await mountAndPay(false);
  expect(text(renderer!.root)).toContain('This fee has been paid.');
  expect(text(renderer!.root)).not.toMatch(/email|receipt/i);
  expect(h.confirmPayment).toHaveBeenCalledTimes(1);
});

test('mounted missing-token Retry keeps its visible treatment and expands its invisible target',async()=>{
  h.token='';
  await act(async()=>{renderer=create(React.createElement(FeePayClient,{bookingId:'booking'}));});
  const retry=button(messages.feePay.retryLabel);
  expect(retry.props.className.split(' ')).toEqual(expect.arrayContaining(['relative','before:absolute','before:-inset-y-0.5','before:inset-x-0','focus-visible:outline','focus-visible:outline-2','focus-visible:outline-s-ink','focus-visible:outline-offset-2','px-5','py-2.5','rounded-pill']));
  await act(async()=>retry.props.onClick());
  expect(h.fetch).not.toHaveBeenCalled();
});
