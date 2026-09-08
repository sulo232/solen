import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const notify = vi.hoisted(() => vi.fn());
vi.mock('@/lib/env', () => ({ getServerEnv: () => ({ RESEND_API_KEY:'dummy_key' }) }));
vi.mock('@/lib/notifications', () => ({ sendNotification: (...args: any[]) => notify(...args) }));
import { bookingConfirmation, sendFeePaymentIssueEmail } from '@/lib/email';
import { feePaymentIssueEmail } from '@/lib/email-templates/audit-notifications';
const mockFetch=vi.fn(async()=>new Response('{}',{status:200}));
beforeEach(()=>{mockFetch.mockClear();notify.mockClear();notify.mockResolvedValue(undefined);vi.stubGlobal('fetch',mockFetch);});
afterEach(()=>vi.unstubAllGlobals());
test('confirmation HTML and ICS carry the supplied management URL and appointment times',()=>{
  const url='https://www.solen.ch/en/booking/lookup?token=opaque';
  const payload=bookingConfirmation('test@example.invalid',{service:'Cut',salon:'Test Store',date:'8 Sep',time:'10:00',manageUrl:url,bookingId:'test',icsStartsAt:'2026-09-08T08:00:00Z',icsEndsAt:'2026-09-08T09:00:00Z'},'en');
  expect(payload.html).toContain(url);const ics=Buffer.from(payload.attachments![0].content,'base64').toString();
  expect(ics).toContain('URL:'+url);expect(ics).toContain('DTSTART:20260908T080000Z');expect(ics).toContain('DTEND:20260908T090000Z');
  expect(mockFetch).not.toHaveBeenCalled();
});
test.each(['de','en','fr','it'] as const)('fee template escapes customer content and avoids a fabricated 24h policy in %s',locale=>{
  const payload=feePaymentIssueEmail('test@example.invalid',{service:'<img src=x onerror=alert(1)>',salonName:'A&B',date:'8 Sep',feeAmount:'CHF 20',payUrl:'https://solen.ch/pay?token=x&kind=cancellation',kind:'cancellation'},locale);
  expect(payload.html).not.toContain('<img');expect(payload.html).toContain('&lt;img');expect(payload.html).toContain('A&amp;B');expect(payload.html).toContain('token=x&amp;kind');expect(payload.html).not.toMatch(/24 (hours|Stunden|heures|ore)/);
});
test.each([true,false])('fee issue email follows notification_email=%s while retaining the in-app message',async enabled=>{
  const q:any={select:()=>q,eq:()=>q,single:async()=>({data:{locale:'en',notification_email:enabled},error:null})};
  const admin:any={from:()=>q,auth:{admin:{getUserById:async()=>({data:{user:{email:'test@example.invalid'}}})}}};
  await sendFeePaymentIssueEmail({admin,userId:'user',serviceName:'Cut',salonName:'Test',feeCents:2000,date:'2026-09-08',payUrl:'https://solen.ch/pay',kind:'no_show',logPrefix:'test'});
  expect(notify).toHaveBeenCalledTimes(1);expect(mockFetch).toHaveBeenCalledTimes(enabled?1:0);
});

test('fee preference lookup failure suppresses email while keeping in-app notification',async()=>{
  const q:any={select:()=>q,eq:()=>q,single:async()=>({data:null,error:{message:'profile unavailable'}})};
  const admin:any={from:()=>q,auth:{admin:{getUserById:async()=>({data:{user:{email:'test@example.invalid'}}})}}};
  await sendFeePaymentIssueEmail({admin,userId:'user',serviceName:'Cut',salonName:'Test',feeCents:2000,date:'2026-09-08',payUrl:'https://solen.ch/pay',kind:'no_show',logPrefix:'test'});
  expect(notify).toHaveBeenCalledTimes(1);expect(mockFetch).not.toHaveBeenCalled();
});
