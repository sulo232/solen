import { beforeEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';

const h = vi.hoisted(() => ({
  authEmail:null as string|null, dispute: {} as any, caseEvents: [] as any[], upchargeNotify: vi.fn(), issue: vi.fn(), knownProfiles: new Set<string>(), publicationError: false, ledgerError: false, row: {} as any, intents: new Map<string, any>(), queries: [] as any[],
  readGate: null as null | (() => Promise<void>), createGate: null as null | (() => Promise<void>),
  webhookEvents: new Set<string>(), payouts: new Map<string, any>(), bookingEmail: vi.fn(), offSessionError: false, audit: vi.fn(), notify: vi.fn(), alert: vi.fn(),
  stripe: { webhooks: { constructEvent: vi.fn() }, paymentIntents: { create: vi.fn(), retrieve: vi.fn(), cancel: vi.fn(), list: vi.fn(), confirm: vi.fn() }, refunds: { create: vi.fn() } },
  db: {} as any,
}));

vi.mock('@/lib/supabase', () => ({ createAdminSupabaseClient: () => h.db }));
vi.mock('@/lib/stripe', () => ({ stripe: h.stripe, getStripe: () => h.stripe, toRappen: (value: number) => Math.round(value * 100), isStripeCardDecline: (err: any) => err?.type === "StripeCardError" }));
vi.mock('@/lib/ratelimit', () => ({ applyRateLimit: async () => null, paymentLimiter: {}, bookingLimiter: {}, getClientIp: () => '192.0.2.1' }));
vi.mock('@/lib/env', () => ({ getServerEnv: () => ({ CRON_SECRET: 'dummy_cron', STRIPE_WEBHOOK_SECRET: 'dummy_webhook_secret', BOOKING_HMAC_SECRET: 'private_dummy_fee_diagnosis_secret_123456789' }), getAppUrl: () => 'https://fee.invalid' }));
vi.mock('@/lib/bookings/notify-no-show-fee', () => ({ notifyNoShowFee: (...args: any[]) => h.notify(...args) }));
vi.mock('@/lib/alert-admin', () => ({ alertAdmin: (...args: any[]) => h.alert(...args) }));

vi.mock('@/lib/email', () => ({ sendEmail: (...args: any[]) => h.bookingEmail(...args), bookingConfirmation: vi.fn(), sendFeePaymentIssueEmail: (...args:any[]) => h.issue(...args) }));
vi.mock('@/lib/feature-flags',()=>({checkFeatureEnabled:async()=>null,checkUserBanned:async()=>null}));
vi.mock('@/lib/bookings/notify-upcharge',()=>({notifyUpchargeCharged:(...args:any[])=>h.upchargeNotify(...args)}));
vi.mock('@/lib/posthog-server', () => ({ trackServerEvent: vi.fn() }));
vi.mock('@/lib/error-report', () => ({ reportError: vi.fn() }));
vi.mock('@/lib/bookings/authorize', () => ({ resolveBookingActor: async () => ({ actor: 'customer', booking: structuredClone(h.row), userId: '22222222-2222-4222-8222-222222222222' }) }));
vi.mock('@/lib/cron-auth', () => ({ verifyCronSecret: async () => true }));
vi.mock('@/lib/cron-run', () => ({ withCronRun: async (_name: string, run: any) => new Response(JSON.stringify(await run()), { status: 200 }), ALL_DECLINED_SYMPTOM_FLOOR: 5 }));
import { PATCH as disputeRoute } from '@/app/api/bookings/[id]/dispute/route';
import { POST as cancelRoute } from '@/app/api/bookings/[id]/cancel/route';
import { GET as preChargeCron } from '@/app/api/cron/pre-charge/route';
import { GET as noShowCron } from '@/app/api/cron/no-show/route';
import { POST as webhookRoute } from '@/app/api/stripe/webhook/route';
import { POST as intentRoute } from '@/app/api/bookings/[id]/fee-pay-intent/route';
import { POST as confirmRoute } from '@/app/api/bookings/[id]/fee-pay-confirm/route';
import { signFeePayToken } from '@/lib/bookings/fee-pay-link';
import { settleFeePayment } from '@/lib/bookings/settle-fee-payment';
import { chargeFee } from '@/lib/bookings/charge-fee';
import { logAuditEvent } from '@/lib/audit';

const bookingId = '11111111-1111-4111-8111-111111111111';
const copy = (value: any) => structuredClone(value);
function request(body: any) {
  return new NextRequest('https://fee.invalid/api/bookings/'+bookingId+'/fee', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}
function intent(token = signFeePayToken(bookingId, h.row.fee_charge_kind ?? 'no_show')) {
  return intentRoute(request({ token, locale: 'de' }), { params: Promise.resolve({ id: bookingId }) });
}
function confirm(pi: any) {
  return confirmRoute(request({ token: signFeePayToken(bookingId, h.row.fee_charge_kind ?? 'no_show'), payment_intent_id: pi.id }), { params: Promise.resolve({ id: bookingId }) });
}
function stored(status: string, type = 'fee_pay', id = 'pi_existing') {
  const pi = { id, amount: 2000, currency: 'chf', status, client_secret: id+'_secret_dummy',
    customer: 'cus_dummy', metadata: { type, booking_id: bookingId, kind: type === 'cancellation_fee' ? 'cancellation' : 'no_show' } };
  h.intents.set(id, pi);
  h.row.fee_charge_intent_id = id;
  return pi;
}

beforeEach(() => {
  vi.clearAllMocks();
  h.row = { id: bookingId, salon_id: "salon_test", starts_at: '2026-09-01T10:00:00Z', paid_amount: 10000, price_paid: 100,
    policy_snapshot: { no_show_fee_type: 'flat', no_show_fee_value: 20 }, fee_charge_status: 'failed',
    fee_charge_kind: 'no_show', fee_charge_intent_id: null, fee_charge_claimed_at: null,
    stripe_customer_id: 'cus_dummy', stripe_payment_method_id: 'pm_dummy', policy_accepted_at: '2026-08-01T00:00:00Z',
    salons: { stripe_account_id: null, name: 'Dummy salon' }, services: { name_de: 'Dummy service' },
    user_id: null, guest_email: null, profiles: { locale: 'de' } };
  h.authEmail=null;h.dispute={id:'44444444-4444-4444-8444-444444444444',booking_id:bookingId,direction:'upcharge',status:'open',requested_amount:2000,expires_at:null};h.caseEvents=[];h.upchargeNotify.mockResolvedValue(undefined);
  h.publicationError=false;h.ledgerError=false;h.issue.mockResolvedValue(undefined);
  h.knownProfiles.clear();h.knownProfiles.add('22222222-2222-4222-8222-222222222222');
  h.webhookEvents.clear(); h.payouts.clear(); h.stripe.webhooks.constructEvent.mockImplementation((body: string) => JSON.parse(body));
  h.intents.clear(); h.queries = []; h.readGate = null; h.createGate = null; h.offSessionError = false;
  h.audit.mockResolvedValue(undefined); h.notify.mockResolvedValue(undefined); h.alert.mockResolvedValue(undefined);
  h.stripe.paymentIntents.retrieve.mockImplementation(async (id: string) => {
    if (!h.intents.has(id)) throw new Error('Mock PI missing: '+id);
    return copy(h.intents.get(id));
  });
  const keys = new Map<string, any>();
  h.stripe.paymentIntents.list.mockImplementation(async () => ({ data: [...h.intents.values()].map(copy), has_more: false }));
  h.stripe.paymentIntents.cancel.mockImplementation(async (id: string) => { const pi=h.intents.get(id); pi.status='canceled'; return copy(pi); });
  h.stripe.paymentIntents.confirm.mockImplementation(async (id: string) => {
    const pi = h.intents.get(id);
    if (h.offSessionError) throw { code: 'authentication_required', raw: { payment_intent: copy(pi) } };
    pi.status='succeeded'; return copy(pi);
  });
  h.stripe.paymentIntents.create.mockImplementation(async (params: any, options: any) => {
    if (!options?.idempotencyKey) throw new Error('Missing idempotency key');
    if (keys.has(options.idempotencyKey)) return copy(keys.get(options.idempotencyKey));
    const id = 'pi_created_'+(h.intents.size+1);
    const pi = { ...copy(params), id, client_secret: id+'_secret_dummy', status: 'requires_payment_method' };
    h.intents.set(id, pi); keys.set(options.idempotencyKey, pi);
    if (h.createGate) await h.createGate();
    return copy(pi);
  });
  h.db = { auth: { admin: { getUserById: async () => ({data:{user:h.authEmail?{email:h.authEmail}:null}}) } }, from(table: string) {
    let patch: any = null;
    let deleting = false;
    const filters: any[] = [];
    let executed = false;
    async function execute(single = false) {
      if (executed) throw new Error('Mock query executed twice');
      executed = true;
      if (table === 'processed_webhook_events') {
        if (deleting) h.webhookEvents.delete(filters.find(([method,key]) => method==='eq' && key==='event_id')?.[2]);
        if (patch?.event_id) { if(h.webhookEvents.has(patch.event_id))return {data:null,error:{code:'23505'}}; h.webhookEvents.add(patch.event_id); }
        return {data:null,error:null};
      }
      if (table === 'case_events') {h.caseEvents.push(copy(patch));return {data:null,error:null};}
      if (table === 'booking_disputes') {
        const matches=filters.every(([method,key,value])=>method==='eq'?h.dispute[key]===value:method==='neq'?h.dispute[key]!==value:false);
        if(matches&&patch)Object.assign(h.dispute,patch);
        return {data:single?(matches?copy(h.dispute):null):(matches?[copy(h.dispute)]:[]),error:null};
      }
      if (table === 'audit_log') {
        if (patch.actor_id !== null && !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(patch.actor_id)) return {data:null,error:{code:'22P02',message:'actor_id must be uuid'}};
        if (patch.actor_id !== null && !h.knownProfiles.has(patch.actor_id)) return {data:null,error:{code:'23503',message:'actor_id must reference profiles'}};
        h.audit(copy(patch));return {data:null,error:null};
      }
      if (table === 'salon_payouts') { if (h.ledgerError) return {data:null,error:{message:'ledger unavailable'}}; if (patch && !h.payouts.has(patch.stripe_payment_intent_id)) h.payouts.set(patch.stripe_payment_intent_id, copy(patch)); return { data: null, error: null }; }
      if (table === 'availability_slots') return {data:{id:'slot_fixture'},error:null};
      if (table === 'waitlist') return {data:[],error:null};
      if (table === 'salons') return {data:{vat_registered:false},error:null};
      if (table === 'profiles') {const id=filters.find(([method,key])=>method==='eq'&&key==='id')?.[2];return {data:h.knownProfiles.has(id)?{id,locale:'en'}:null,error:null};}
      if (table === 'platform_settings') return { data: { value: { rate_percent: 15 } }, error: null };
      if (table !== 'bookings') throw new Error('Unexpected mocked table: '+table);
      if (!patch) {
        const snapshot = copy(h.row);
        h.queries.push({ operation: 'read', snapshot });
        if (h.readGate) await h.readGate();
        const preCharge=filters.some(([method,key,value])=>method==='eq'&&key==='payment_status'&&value==='card_saved');
        const listed=preCharge ? snapshot.status==='confirmed'&&snapshot.payment_status==='card_saved'&&snapshot.payment_intent_id===null : snapshot.status==='confirmed'&&snapshot.fee_charge_status===null;
        return {data:single?snapshot:(listed?[snapshot]:[]),error:null};
      }
      if(h.publicationError && patch.fee_charge_intent_id && patch.fee_charge_claimed_at === null) return {data:null,error:{message:'publication unavailable'}};
      const matches = filters.every(([method, key, value]) => {
        if (method === 'eq' || method === 'is') return h.row[key] === value;
        if (method === 'in') return value.includes(h.row[key]);
        if (method === 'or' && key.startsWith('fee_charge_claimed_at')) return h.row.fee_charge_claimed_at === null;
        if (method === 'or' && key.startsWith('fee_charge_status')) return h.row.fee_charge_status == null || h.row.fee_charge_status === 'failed' || (key.includes('requires_action') && h.row.fee_charge_status === 'requires_action');
        throw new Error('Unimplemented query predicate');
      });
      h.queries.push({ operation: 'update', patch: copy(patch), filters: copy(filters), matches });
      if (matches) Object.assign(h.row, patch);
      return { data: single ? (matches ? copy(h.row) : null) : (matches ? [copy(h.row)] : []), error: null };
    }
    const q: any = {
      select: () => q, delete: () => {deleting=true;return q;}, insert: (value: any) => { patch=value; return q; }, upsert: (value: any) => { patch=value; return q; }, update: (value: any) => { patch = value; return q; },
      eq: (key: string, value: any) => { filters.push(['eq', key, value]); return q; },
      neq: (key: string, value: any) => { filters.push(['neq', key, value]); return q; },
      is: (key: string, value: any) => { filters.push(['is', key, value]); return q; },
      in: (key: string, value: any) => { filters.push(['in', key, value]); return q; },
      lt: () => q, gt: () => q, limit: () => q, order: () => q, not: () => q,
      or: (value: string) => { filters.push(['or', value]); return q; },
      single: () => execute(true), maybeSingle: () => execute(true),
      then: (resolve: any, reject: any) => execute().then(resolve, reject),
    };
    return q;
  } };
});

test('invalid token and charged row stop before Stripe', async () => {
  const invalid=await intent('invalid'); h.row.fee_charge_status='charged'; const paid=await intent();
  expect([invalid.status,paid.status]).toEqual([403,409]); expect(h.stripe.paymentIntents.create).not.toHaveBeenCalled();
});
test('sequential reload reuses one payable intent',async()=>{
  const a=await intent(), b=await intent(); expect([a.status,b.status]).toEqual([200,200]);
  expect((await a.json()).client_secret).toBe((await b.json()).client_secret);
  expect(h.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
});
test('concurrent null-pointer requests expose at most one intent',async()=>{
  let reads=0;let release!:()=>void;const gate=new Promise<void>(r=>release=r);
  h.readGate=async()=>{if(++reads===2)release();await gate;};
  const responses=await Promise.all([intent(),intent()]);
  expect(responses.map(r=>r.status).sort()).toEqual([200,409]);
  expect(h.stripe.paymentIntents.create).toHaveBeenCalledTimes(1); expect(h.intents.size).toBe(1);
});
test.each(['requires_action','processing','succeeded'])('stored %s is never replaced',async status=>{
  const old=stored(status);const r=await intent(); const body=await r.json();
  expect(r.status).toBe(status==='requires_action'?200:409);
  if(status==='requires_action')expect(body.client_secret).toBe(old.client_secret);
  if(status==='succeeded')expect(h.row.fee_charge_status).toBe('charged');
  expect(h.row.fee_charge_intent_id).toBe(old.id);expect(h.stripe.paymentIntents.create).not.toHaveBeenCalled();
});
test('off-session authentication fallback uses the already-published intent and confirms through recovery',async()=>{
  h.row.fee_charge_status=null;h.offSessionError=true;
  const result=await chargeFee({db:h.db,source:'booking',id:bookingId,amountCents:2000,kind:'no_show',actor:'system',reason:'test'});
  expect(result.status).toBe('requires_action');const pi=h.intents.get(h.row.fee_charge_intent_id);
  expect(h.stripe.paymentIntents.confirm.mock.calls[0][0]).toBe(pi.id);
  const pay=await intent();expect((await pay.json()).client_secret).toBe(pi.client_secret);
  pi.status='succeeded';expect((await confirm(pi)).status).toBe(200);expect(h.row.fee_charge_status).toBe('charged');
});
test.each(['no_show_fee','cancellation_fee'])('legacy %s reuses and settles',async type=>{
  if(type==='cancellation_fee')Object.assign(h.row,{fee_charge_kind:'cancellation',cancelled_at:'2026-09-01T09:00:00Z',policy_snapshot:{cancellation_fee_type:'flat',cancellation_fee_value:20,free_cancel_hours:24}});
  const pi=stored('requires_confirmation',type);const r=await intent();expect(r.status).toBe(200);
  expect((await r.json()).client_secret).toBe(pi.client_secret);pi.status='succeeded';expect((await confirm(pi)).status).toBe(200);
  expect(h.stripe.paymentIntents.create).not.toHaveBeenCalled();
});
test('repeat settlement writes and notifies once',async()=>{
  const pi=stored('succeeded');expect((await confirm(pi)).status).toBe(200);expect((await confirm(pi)).status).toBe(200);
  expect(h.audit).toHaveBeenCalledTimes(1);expect(h.notify).toHaveBeenCalledTimes(1);
});
test('a different succeeded intent cannot acknowledge another pointer',async()=>{
  const a=stored('succeeded','fee_pay','pi_a');const b=stored('succeeded','fee_pay','pi_b');
  expect((await confirm(a)).status).toBe(409);expect((await confirm(b)).status).toBe(200);
  expect(h.row.fee_charge_intent_id).toBe(b.id);expect(h.audit).toHaveBeenCalledTimes(1);
});
test('late create cannot overwrite a settled winner or expose a second secret',async()=>{
  let entered!:()=>void;let release!:()=>void;const created=new Promise<void>(r=>entered=r);const gate=new Promise<void>(r=>release=r);
  h.createGate=async()=>{entered();await gate;};const pending=intent();await created;
  const winner=stored('succeeded','fee_pay','pi_winner');await settleFeePayment(h.db,request({}),winner);
  release();const r=await pending;expect(r.status).toBe(409);expect(h.row.fee_charge_intent_id).toBe(winner.id);
  expect([...h.intents.values()].filter(pi=>pi.status!=='canceled').map(pi=>pi.id)).toEqual([winner.id]);
});
test('off-session and pay-link concurrent creation share one obligation reservation',async()=>{
  let reads=0;let release!:()=>void;const gate=new Promise<void>(r=>release=r);h.offSessionError=true;
  h.readGate=async()=>{if(++reads===2)release();await gate;};
  const [charge,pay]=await Promise.all([chargeFee({db:h.db,source:'booking',id:bookingId,amountCents:2000,kind:'no_show',actor:'system',reason:'test'}),intent()]);
  expect(h.intents.size).toBe(1);expect(h.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
  expect(['failed','requires_action']).toContain(charge.status);expect([200,409]).toContain(pay.status);
  const reload=await intent();expect(reload.status).toBe(200);expect((await reload.json()).client_secret).toBe(h.intents.get(h.row.fee_charge_intent_id).client_secret);
});
test('missing legacy pointer is recovered by exact obligation',async()=>{
  const pi=stored('requires_payment_method','no_show_fee');h.row.fee_charge_intent_id=null;
  expect((await intent()).status).toBe(200);expect(h.row.fee_charge_intent_id).toBe(pi.id);expect(h.stripe.paymentIntents.create).not.toHaveBeenCalled();
});
test.each(['amount','currency','customer','destination','kind'])('legacy mismatch %s fails closed',async field=>{
  const pi=stored('requires_payment_method');h.row.fee_charge_intent_id=null;
  if(field==='amount')pi.amount=2100;if(field==='currency')pi.currency='eur';if(field==='customer')pi.customer='cus_other';
  if(field==='destination')pi.transfer_data={destination:'acct_other'};if(field==='kind')pi.metadata.kind='cancellation';
  expect((await intent()).status).toBe(409);expect(h.stripe.paymentIntents.create).not.toHaveBeenCalled();
});
test('other booking on same customer cannot be adopted',async()=>{
  const other=stored('requires_payment_method');other.metadata.booking_id='22222222-2222-4222-8222-222222222222';h.row.fee_charge_intent_id=null;
  expect((await intent()).status).toBe(200);expect(h.row.fee_charge_intent_id).not.toBe(other.id);
});
test('ambiguous create retries same identity within retention and does not create twice',async()=>{
  let first=true;h.createGate=async()=>{if(first){first=false;throw new Error('ambiguous network failure');}};
  expect((await intent()).status).toBe(503);expect(h.row.fee_charge_claimed_at).not.toBeNull();
  // Simulate list not yet returning the known create; the deterministic key must still collapse it.
  h.stripe.paymentIntents.list.mockResolvedValue({data:[],has_more:false});
  expect((await intent()).status).toBe(200);expect(h.intents.size).toBe(1);
  expect(h.stripe.paymentIntents.create.mock.calls[0][1]).toEqual(h.stripe.paymentIntents.create.mock.calls[1][1]);
});
test('expired unknown claim blocks creation; exact known intent remains recoverable',async()=>{
  h.row.fee_charge_claimed_at=new Date(Date.now()-25*60*60*1000).toISOString();
  expect((await intent()).status).toBe(409);expect(h.stripe.paymentIntents.create).not.toHaveBeenCalled();
  const pi=stored('requires_payment_method');h.row.fee_charge_intent_id=null;
  expect((await intent()).status).toBe(200);expect(h.row.fee_charge_intent_id).toBe(pi.id);
});
test.each([['2026-08-30T10:00:00Z',409],['2026-09-01T09:00:00Z',200]])('cancellation is evaluated at %s, not the later payment visit',async (cancelledAt,status)=>{
  Object.assign(h.row,{fee_charge_kind:'cancellation',cancelled_at:cancelledAt,policy_snapshot:{cancellation_fee_type:'flat',cancellation_fee_value:20,free_cancel_hours:24}});
  const r=await intent();expect(r.status).toBe(status);if(status===200)expect((await r.json()).amount_cents).toBe(2000);
});
test('Connect creation preserves commission, destination, CHF and customer',async()=>{
  h.row.salons.stripe_account_id='acct_test';const r=await intent();expect(r.status).toBe(200);
  expect(h.stripe.paymentIntents.create.mock.calls[0][0]).toMatchObject({amount:2000,currency:'chf',customer:'cus_dummy',application_fee_amount:300,transfer_data:{destination:'acct_test'}});
});

function webhook(pi: any, type = 'payment_intent.succeeded', eventId = 'evt_fee') {
  return webhookRoute(new NextRequest('https://fee.invalid/api/stripe/webhook', { method:'POST', headers:{'stripe-signature':'dummy'}, body:JSON.stringify({id:eventId,type,data:{object:pi}}) }));
}
test.each(['fee_pay','no_show_fee','cancellation_fee'])('actual webhook settles %s and skips booking confirmation',async type=>{
  if(type==='cancellation_fee')Object.assign(h.row,{fee_charge_kind:'cancellation',cancelled_at:'2026-09-01T09:00:00Z',policy_snapshot:{cancellation_fee_type:'flat',cancellation_fee_value:20}});
  const pi=stored('succeeded',type);
  const response=await webhook(pi);expect(response.status).toBe(200);expect(h.row.fee_charge_status).toBe('charged');
  expect(h.payouts.get(pi.id)).toMatchObject({gross_amount:20,net_amount:20,status:'recorded'});
  expect(h.bookingEmail).not.toHaveBeenCalled();expect(h.audit).toHaveBeenCalledTimes(1);
  expect((await webhook(pi)).status).toBe(200);expect((await confirm(pi)).status).toBe(200);expect(h.audit).toHaveBeenCalledTimes(1);
});
test('fee failed webhook cannot cancel or notify a booking failure',async()=>{
  const pi=stored('requires_payment_method','no_show_fee');h.row.status='no_show';
  expect((await webhook(pi,'payment_intent.payment_failed')).status).toBe(200);
  expect(h.row.status).toBe('no_show');expect(h.row.fee_charge_status).toBe('failed');expect(h.bookingEmail).not.toHaveBeenCalled();
});
test('webhook mismatched pointer returns a retryable failure without settlement',async()=>{
  const pi=stored('succeeded');h.row.fee_charge_intent_id='pi_other';
  expect((await webhook(pi)).status).toBe(500);expect(h.row.fee_charge_status).toBe('failed');expect(h.payouts.size).toBe(0);
});

test('stored pointer with an active sibling requires reconciliation before exposing either secret',async()=>{
  stored('requires_payment_method','fee_pay','pi_a');stored('requires_payment_method','fee_pay','pi_b');
  const r=await intent();expect(r.status).toBe(409);expect((await r.json()).client_secret).toBeUndefined();expect(h.stripe.paymentIntents.create).not.toHaveBeenCalled();
});

test('ordinary off-session decline preserves the payable pointer and retries through that same intent',async()=>{
  h.stripe.paymentIntents.confirm.mockRejectedValue({type:'StripeCardError',message:'declined'});
  const result=await chargeFee({db:h.db,source:'booking',id:bookingId,amountCents:2000,kind:'no_show',actor:'system',reason:'test'});
  expect(result.status).toBe('failed');expect(result.declined).toBe(true);const pointer=h.row.fee_charge_intent_id;
  expect(pointer).toBeTruthy();expect((await intent()).status).toBe(200);expect(h.row.fee_charge_intent_id).toBe(pointer);expect(h.intents.size).toBe(1);
});

test.each(['normal','response-loss','publication-failure'])('canceled pointer replacement: %s recovers one exact intent',async mode=>{
  const old=stored('canceled');
  if(mode==='response-loss')h.createGate=async()=>{throw new Error('response lost');};
  if(mode==='publication-failure')h.publicationError=true;
  const first=await intent();expect(first.status).toBe(mode==='normal'?200:503);
  h.createGate=null;h.publicationError=false;
  const retry=await intent();expect(retry.status).toBe(200);
  expect(h.row.fee_charge_intent_id).not.toBe(old.id);expect(h.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
  expect([...h.intents.values()].filter(pi=>pi.status!=='canceled')).toHaveLength(1);
});
test('canceled pointer still refuses two exact active replacements',async()=>{
  const old=stored('canceled');h.createGate=async()=>{throw new Error('response lost');};await intent();
  stored('requires_payment_method','fee_pay','pi_independent');h.row.fee_charge_intent_id=old.id;
  expect((await intent()).status).toBe(409);expect(h.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
});
test('canceled pointer refuses an independently payable sibling without a retained reservation',async()=>{
  const old=stored('canceled');stored('requires_payment_method','fee_pay','pi_independent');h.row.fee_charge_intent_id=old.id;
  expect((await intent()).status).toBe(409);expect(h.stripe.paymentIntents.create).not.toHaveBeenCalled();
});
test.each(['processing','requires_capture','requires_payment_method'])('off-session recovered %s dispatch preserves the real state',async status=>{
  const pi=stored(status);h.row.fee_charge_intent_id=null;
  const result=await chargeFee({db:h.db,source:'booking',id:bookingId,amountCents:2000,kind:'no_show',actor:'system',reason:'test'});
  expect(result.status).toBe(status==='requires_payment_method'?'charged':'pending');
  expect(h.stripe.paymentIntents.confirm).toHaveBeenCalledTimes(status==='requires_payment_method'?1:0);
  expect(h.row.fee_charge_status).toBe(status==='requires_payment_method'?'charged':'failed');
  expect(h.row.fee_charge_intent_id).toBe(pi.id);
});
test.each(['automated-first','webhook-first'])('one fee settlement winner: %s, then webhook and cron replays',async order=>{
  h.row.fee_charge_status=null;h.row.status='confirmed';
  const ordinaryConfirm=h.stripe.paymentIntents.confirm.getMockImplementation()!;
  if(order==='webhook-first')h.stripe.paymentIntents.confirm.mockImplementation(async(id:string)=>{
    const pi=await ordinaryConfirm(id);expect((await webhook(pi)).status).toBe(200);return pi;
  });
  const response=await noShowCron(new NextRequest('https://fee.invalid/api/cron/no-show',{headers:{authorization:'Bearer dummy_cron'}}));
  expect(response.status).toBe(200);const pi=h.intents.get(h.row.fee_charge_intent_id);
  expect((await webhook(pi)).status).toBe(200);expect((await webhook(pi,'payment_intent.succeeded','evt_other_delivery')).status).toBe(200);
  await noShowCron(new NextRequest('https://fee.invalid/api/cron/no-show',{headers:{authorization:'Bearer dummy_cron'}}));
  expect(h.intents.size).toBe(1);expect(h.payouts.size).toBe(1);expect(h.audit).toHaveBeenCalledTimes(1);expect(h.notify).toHaveBeenCalledTimes(1);
  expect(h.audit.mock.calls[0][0]).toMatchObject({actor_id:null,metadata:{actor:'system'}});expect(h.alert).not.toHaveBeenCalled();
});
test('failed webhook settlement releases the actual event claim and retry settles once',async()=>{
  const pi=stored('succeeded');h.ledgerError=true;
  expect((await webhook(pi)).status).toBe(500);expect(h.webhookEvents.has('evt_fee')).toBe(false);
  expect(h.row.fee_charge_status).toBe('failed');h.ledgerError=false;
  expect((await webhook(pi)).status).toBe(200);expect((await webhook(pi)).status).toBe(200);
  expect(h.payouts.size).toBe(1);expect(h.audit).toHaveBeenCalledTimes(1);expect(h.notify).toHaveBeenCalledTimes(1);
});
test.each(['confirm','webhook'])('cancellation timing is enforced by %s for early and late persisted cancellations',async route=>{
  Object.assign(h.row,{fee_charge_kind:'cancellation',cancelled_at:'2026-08-29T10:00:00Z',policy_snapshot:{cancellation_fee_type:'flat',cancellation_fee_value:20,free_cancel_hours:24}});
  const pi=stored('succeeded','cancellation_fee');const run=()=>route==='confirm'?confirm(pi):webhook(pi);
  expect((await run()).status).toBe(route==='confirm'?409:500);expect(h.payouts.size).toBe(0);expect(h.notify).not.toHaveBeenCalled();
  h.row.cancelled_at='2026-09-01T09:00:00Z';expect((await run()).status).toBe(200);
  expect(h.row.fee_charged_amount).toBe(2000);expect(h.payouts.size).toBe(1);expect(h.notify).toHaveBeenCalledTimes(1);
});

// Ordinary booking payments continue through the pre-existing non-fee owner.
test('ordinary booking succeeded webhook preserves booking payment and payout behavior',async()=>{
  h.row.status='pending';h.row.payment_intent_id='pi_booking';h.row.fee_charge_status=null;
  const pi={id:'pi_booking',amount:10000,currency:'chf',status:'succeeded',customer:'cus_dummy',payment_method:'pm_dummy',application_fee_amount:1500,metadata:{type:'booking',booking_id:bookingId,salon_id:'salon_test'}};
  expect((await webhook(pi)).status).toBe(200);
  expect(h.row).toMatchObject({status:'confirmed',payment_status:'paid',paid_amount:10000,platform_fee:1500,net_amount:10000,vat_amount:0,fee_charge_status:null});
  expect(h.payouts.get('pi_booking')).toMatchObject({gross_amount:100,commission_amount:15,net_amount:85});
  expect(h.audit).not.toHaveBeenCalled();expect(h.notify).not.toHaveBeenCalled();
  expect(h.stripe.paymentIntents.create).not.toHaveBeenCalled();expect(h.stripe.paymentIntents.confirm).not.toHaveBeenCalled();
});

test.each(['processing','requires_capture','requires_payment_method'])('actual cancellation consumer preserves %s through the shared money owner',async status=>{
  Object.assign(h.row,{status:'confirmed',slot_id:'slot_fixture',paid_amount:null,price_paid:100,payment_intent_id:null,payment_status:'none',starts_at:new Date(Date.now()+60*60*1000).toISOString(),fee_charge_kind:'cancellation',fee_charge_status:null,policy_snapshot:{cancellation_fee_type:'flat',cancellation_fee_value:20,free_cancel_hours:24}});
  const pi=stored(status,'cancellation_fee');
  // Missing pointer exercises actual legacy recovery and the valid saved-card confirm branch.
  h.row.fee_charge_intent_id=null;
  const response=await cancelRoute(request({reason:'fixture cancellation'}),{params:Promise.resolve({id:bookingId})});
  expect(response.status).toBe(200);const {data}=await response.json();const charged=status==='requires_payment_method';
  expect(data).toMatchObject({status:'cancelled',fee_charge_status:charged?'charged':'pending',fee_charged:charged?2000:0,cancellation_fee:2000,refund_amount:0});
  expect(h.row.status).toBe('cancelled');expect(h.row.fee_charge_intent_id).toBe(pi.id);
  expect(h.stripe.paymentIntents.confirm).toHaveBeenCalledTimes(charged?1:0);
  expect(h.audit).toHaveBeenCalledTimes(charged?1:0);expect(h.notify).toHaveBeenCalledTimes(charged?1:0);
  expect(h.payouts.size).toBe(charged?1:0);expect(h.bookingEmail).not.toHaveBeenCalled();
});

test.each(['processing','requires_capture','requires_action','succeeded'])('actual cron preserves Stripe post-confirm %s without a false issue email',async status=>{
  h.row.fee_charge_status=null;h.row.status='confirmed';
  h.stripe.paymentIntents.confirm.mockImplementation(async(id:string)=>{const pi=h.intents.get(id);pi.status=status;return copy(pi);});
  expect((await noShowCron(new NextRequest('https://fee.invalid/api/cron/no-show'))).status).toBe(200);
  expect(h.stripe.paymentIntents.confirm).toHaveBeenCalledTimes(1);
  expect(h.row.fee_charge_status).toBe(status==='succeeded'?'charged':status==='requires_action'?'requires_action':null);
  expect(h.issue).toHaveBeenCalledTimes(status==='requires_action'?1:0);
  expect(h.payouts.size).toBe(status==='succeeded'?1:0);expect(h.notify).toHaveBeenCalledTimes(status==='succeeded'?1:0);
});
test.each(['processing','requires_capture','requires_action','succeeded'])('actual cancellation consumer preserves Stripe post-confirm %s',async status=>{
  Object.assign(h.row,{status:'confirmed',slot_id:'slot_fixture',paid_amount:null,price_paid:100,payment_intent_id:null,payment_status:'none',starts_at:new Date(Date.now()+3600000).toISOString(),fee_charge_kind:'cancellation',fee_charge_status:null,policy_snapshot:{cancellation_fee_type:'flat',cancellation_fee_value:20,free_cancel_hours:24}});
  h.stripe.paymentIntents.confirm.mockImplementation(async(id:string)=>{const pi=h.intents.get(id);pi.status=status;return copy(pi);});
  const response=await cancelRoute(request({}),{params:Promise.resolve({id:bookingId})});
  expect(response.status).toBe(200);const {data}=await response.json();
  expect(data.fee_charge_status).toBe(status==='succeeded'?'charged':status==='requires_action'?'requires_action':'pending');
  expect(data.fee_charged).toBe(status==='succeeded'?2000:0);expect(h.issue).toHaveBeenCalledTimes(status==='requires_action'?1:0);
  expect(h.stripe.paymentIntents.confirm).toHaveBeenCalledTimes(1);
  expect(h.audit).toHaveBeenCalledTimes(status==='succeeded'?1:0);
  if(status==='succeeded')expect(h.audit.mock.calls[0][0]).toMatchObject({actor_id:'22222222-2222-4222-8222-222222222222',metadata:{actor:'customer'}});
});
test.each(['system','customer','salon'])('actual audit fixture rejects symbolic %s actor like the live UUID column',async actor=>{
  await logAuditEvent(null,actor,'fixture','booking',bookingId);
  expect(h.audit).not.toHaveBeenCalled();expect(h.alert).toHaveBeenCalledTimes(1);
});
test('actual audit fixture rejects an absent profile UUID and accepts a known profile UUID',async()=>{
  await logAuditEvent(null,'33333333-3333-4333-8333-333333333333','fixture','booking',bookingId);
  expect(h.audit).not.toHaveBeenCalled();expect(h.alert).toHaveBeenCalledTimes(1);
  await logAuditEvent(request({}),'22222222-2222-4222-8222-222222222222','fixture','booking',bookingId);
  expect(h.audit).toHaveBeenCalledTimes(1);expect(h.audit.mock.calls[0][0]).toMatchObject({actor_id:'22222222-2222-4222-8222-222222222222',ip_address:'192.0.2.1'});
});
test.each(['background','capability','verified-user','missing-profile'])('actual settlement stores schema-valid %s audit identity and replays once',async actor=>{
  const pi=stored('succeeded');
  const context=actor==='background'?{actor:'system',via:'off_session'}:actor==='verified-user'?{actor:'customer',actorUserId:'22222222-2222-4222-8222-222222222222',via:'off_session'}:actor==='missing-profile'?{actor:'customer',actorUserId:'33333333-3333-4333-8333-333333333333',via:'off_session'}:undefined;
  await settleFeePayment(h.db,actor==='background'?null:request({}),pi,context);
  await settleFeePayment(h.db,actor==='background'?null:request({}),pi,context);
  expect(h.audit).toHaveBeenCalledTimes(1);expect(h.alert).not.toHaveBeenCalled();
  expect(h.audit.mock.calls[0][0]).toMatchObject({actor_id:actor==='verified-user'?'22222222-2222-4222-8222-222222222222':null,metadata:{actor:actor==='background'?'system':'customer'},ip_address:actor==='background'?null:'192.0.2.1'});
});

test.each(['processing','requires_capture','requires_action','succeeded'])('actual dispute consumer preserves primitive %s through HTTP response',async status=>{
  h.stripe.paymentIntents.create.mockResolvedValue({id:'pi_upcharge',amount:2000,status,client_secret:'pi_upcharge_secret'});
  const response=await disputeRoute(request({action:'approve'}),{params:Promise.resolve({id:bookingId})});
  expect(response.status).toBe(200);const body=await response.json();
  if(status==='succeeded')expect(body).toEqual({status:'charged',charged:2000});
  else expect(body).toMatchObject({status:'salon_approved',charge_status:status==='requires_action'?'requires_action':'pending'});
  expect(h.dispute.status).toBe(status==='succeeded'?'charged':'salon_approved');
  expect(h.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
  expect(h.caseEvents.filter(event=>event.action==='charged')).toHaveLength(status==='succeeded'?1:0);
  expect(h.upchargeNotify).toHaveBeenCalledTimes(status==='succeeded'?1:0);
  if(status==='processing'||status==='requires_capture')expect(h.audit.mock.calls.map(([row])=>row.action)).toEqual(['booking_upcharge_approved']);
});

function preChargeFixture(){
  Object.assign(h.row,{status:'confirmed',payment_status:'card_saved',payment_intent_id:null,paid_amount:null,fee_charge_status:null,starts_at:new Date(Date.now()+86400000).toISOString(),user_id:'22222222-2222-4222-8222-222222222222'});
  h.authEmail='fixture@example.invalid';
}
test.each(['processing','requires_capture','requires_action','succeeded'])('actual pre-charge cron preserves %s and its existing controls',async status=>{
  preChargeFixture();
  const create=h.stripe.paymentIntents.create.getMockImplementation()!;
  h.stripe.paymentIntents.create.mockImplementation(async(params:any,options:any)=>{const pi=await create(params,options);h.intents.get(pi.id).status=status;return copy(h.intents.get(pi.id));});
  const response=await preChargeCron(new NextRequest('https://fee.invalid/api/cron/pre-charge'));expect(response.status).toBe(200);const body=await response.json();
  const pending=status==='processing'||status==='requires_capture';
  expect(body).toMatchObject({charged:status==='succeeded'?1:0,declined:status==='requires_action'?1:0,pending:pending?1:0,processed:1});
  expect(h.bookingEmail).toHaveBeenCalledTimes(status==='requires_action'?1:0);
  expect(h.row.payment_status).toBe(status==='succeeded'?'paid':'card_saved');
  expect(h.row.paid_amount).toBe(status==='succeeded'?10000:null);
  expect(h.row.payment_intent_id===null).toBe(status==='requires_action');
  if(pending){
    expect(h.alert).not.toHaveBeenCalled();
    await preChargeCron(new NextRequest('https://fee.invalid/api/cron/pre-charge'));
    expect(h.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
  }
});
test.each(['webhook-after-publication','webhook-before-publication'])('actual pending pre-charge finishes on %s without another payment',async order=>{
  preChargeFixture();h.row.user_id=null;h.authEmail=null;
  const create=h.stripe.paymentIntents.create.getMockImplementation()!;
  h.stripe.paymentIntents.create.mockImplementation(async(params:any,options:any)=>{
    const pi=await create(params,options);const current=h.intents.get(pi.id);current.status='processing';const pending=copy(current);
    if(order==='webhook-before-publication'){current.status='succeeded';expect((await webhook(copy(current))).status).toBe(200);}
    return pending;
  });
  const response=await preChargeCron(new NextRequest('https://fee.invalid/api/cron/pre-charge'));expect(response.status).toBe(200);
  const pi=h.intents.get(h.row.payment_intent_id);pi.status='succeeded';
  expect((await webhook(copy(pi),'payment_intent.succeeded','evt_precharge_final')).status).toBe(200);
  expect(h.row).toMatchObject({payment_status:'paid',paid_amount:10000,payment_intent_id:pi.id});
  await preChargeCron(new NextRequest('https://fee.invalid/api/cron/pre-charge'));
  expect(h.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);expect(h.payouts.size).toBe(1);
});

test('pending pre-charge refresh failure retains its pointer and does not send a decline email or recreate',async()=>{
  preChargeFixture();
  const create=h.stripe.paymentIntents.create.getMockImplementation()!;
  h.stripe.paymentIntents.create.mockImplementation(async(params:any,options:any)=>{const pi=await create(params,options);h.intents.get(pi.id).status='processing';return copy(h.intents.get(pi.id));});
  h.stripe.paymentIntents.retrieve.mockRejectedValue(new Error('refresh unavailable'));
  const response=await preChargeCron(new NextRequest('https://fee.invalid/api/cron/pre-charge'));
  expect(await response.json()).toMatchObject({charged:0,declined:0,pending:1});
  expect(h.row.payment_intent_id).not.toBeNull();expect(h.row.payment_status).toBe('card_saved');
  expect(h.bookingEmail).not.toHaveBeenCalled();
  await preChargeCron(new NextRequest('https://fee.invalid/api/cron/pre-charge'));
  expect(h.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
});
test.each(['cancelled','different-pointer'])('pre-charge success webhook preserves %s booking state',async state=>{
  preChargeFixture();h.row.user_id=null;h.authEmail=null;
  h.row.payment_intent_id=state==='different-pointer'?'pi_other':'pi_precharge';
  if(state==='cancelled')h.row.status='cancelled';
  const pi={id:'pi_precharge',status:'succeeded',amount:10000,application_fee_amount:0,metadata:{type:'pre_charge',booking_id:bookingId,salon_id:'salon_test'}};
  expect((await webhook(pi)).status).toBe(200);
  expect(h.row.payment_status).toBe('card_saved');expect(h.row.paid_amount).toBeNull();
  expect(h.row.payment_intent_id).toBe(state==='different-pointer'?'pi_other':'pi_precharge');
});


test.each(['different-pointer','refunded','partially_refunded','card_saved','webhook-paid'])('pending pre-charge refresh preserves competing %s transition',async state=>{
  preChargeFixture();h.row.user_id=null;h.authEmail=null;
  const create=h.stripe.paymentIntents.create.getMockImplementation()!;
  h.stripe.paymentIntents.create.mockImplementation(async(params:any,options:any)=>{const pi=await create(params,options);h.intents.get(pi.id).status='processing';return copy(h.intents.get(pi.id));});
  h.stripe.paymentIntents.retrieve.mockImplementation(async(id:string)=>{
    const pi=h.intents.get(id);pi.status='succeeded';
    expect(h.row.payment_intent_id).toBe(id);
    if(state==='different-pointer')h.row.payment_intent_id='pi_different';
    else if(state==='webhook-paid')expect((await webhook(copy(pi))).status).toBe(200);
    else h.row.payment_status=state;
    return copy(pi);
  });
  const response=await preChargeCron(new NextRequest('https://fee.invalid/api/cron/pre-charge'));
  const valid=state==='card_saved'||state==='webhook-paid';
  expect(await response.json()).toMatchObject({charged:valid?1:0,declined:0,pending:0});
  expect(h.row.payment_intent_id).toBe(state==='different-pointer'?'pi_different':'pi_created_1');
  expect(h.row.payment_status).toBe(valid?'paid':state==='different-pointer'?'card_saved':state);
  expect(h.row.paid_amount).toBe(valid?10000:null);
  expect(h.bookingEmail).not.toHaveBeenCalled();
  expect(h.stripe.paymentIntents.create).toHaveBeenCalledTimes(1);
});
test.each(['refunded','partially_refunded','card_saved','paid'])('pre-charge success webhook advances only eligible %s payment state',async state=>{
  preChargeFixture();h.row.user_id=null;h.authEmail=null;
  Object.assign(h.row,{payment_intent_id:'pi_precharge',payment_status:state,paid_amount:state==='card_saved'?null:9000});
  const pi={id:'pi_precharge',status:'succeeded',amount:10000,application_fee_amount:0,metadata:{type:'pre_charge',booking_id:bookingId,salon_id:'salon_test'}};
  expect((await webhook(pi)).status).toBe(200);
  expect(h.row.payment_status).toBe(state==='card_saved'?'paid':state);
  expect(h.row.paid_amount).toBe(state==='card_saved'?10000:9000);
  expect(h.row.payment_intent_id).toBe('pi_precharge');
});
