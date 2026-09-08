import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET as ics } from '@/app/api/bookings/[id]/ics/route';
import { GET as receipt } from '@/app/api/bookings/[id]/receipt/route';
import { hashToken } from '@/lib/bookings/guest-access';
const mock = vi.hoisted(() => ({ user: '10000000-0000-4000-8000-000000000001' as string | null, role: 'customer', from: vi.fn(), retrieve: vi.fn(), banned: vi.fn(), limit: vi.fn(), booking: null as any, pi: null as any, errorTable: '', profileLocale: 'it' }));
vi.mock('@/lib/supabase', () => ({ createAdminSupabaseClient: () => ({ from: mock.from }) }));
vi.mock('@/lib/auth/request-user', () => ({ resolveRequestUser: async (request: NextRequest) => request.headers.has('Authorization') ? NextResponse.json({}, { status: 401 }) : ({ user: mock.user ? { id: mock.user } : null }) }));
vi.mock('@/lib/feature-flags', () => ({ checkUserBanned: mock.banned }));
vi.mock('@/lib/ratelimit', () => ({ generalLimiter: 'general', bearerVerifyLimiter: 'bearer', getClientIp: () => '192.0.2.1', applyRateLimit: mock.limit }));
vi.mock('@/lib/stripe', () => ({ getReadOnlyStripe: () => ({ paymentIntents: { retrieve: mock.retrieve } }) }));
const id = '00000000-0000-4000-8000-000000000001';
const otherId = '00000000-0000-4000-8000-000000000002';
const args = { params: Promise.resolve({ id }) };
const receiptUrl = 'https://pay.stripe.com/receipts/test';
function req(locale?: string, guestId?: string, token = 'guest-token') { return new NextRequest(`https://solen.test/api/bookings/${id}/download${locale ? '?locale=' + locale : ''}`, { headers: guestId ? { cookie: 'solen_guest_access=' + Buffer.from(JSON.stringify({ b: guestId, t: token })).toString('base64url') } : {} }); }
beforeEach(() => {
  vi.clearAllMocks(); mock.user = '10000000-0000-4000-8000-000000000001'; mock.role = 'customer'; mock.errorTable = ''; mock.profileLocale = 'it'; mock.banned.mockResolvedValue(null); mock.limit.mockResolvedValue(null);
  mock.booking = { id, user_id: '10000000-0000-4000-8000-000000000001', salon_id: '20000000-0000-4000-8000-000000000001', service_id: '30000000-0000-4000-8000-000000000001', status: 'confirmed', starts_at: '2026-10-25T00:30:00Z', ends_at: '2026-10-25T01:15:00Z', payment_intent_id: 'pi_booking', stripe_customer_id: 'cus_booking', access_token_hash: hashToken('guest-token'), access_token_expires_at: '2099-01-01T00:00:00Z' };
  mock.pi = { id: 'pi_booking', status: 'succeeded', customer: 'cus_booking', metadata: { type: 'booking', booking_id: id, salon_id: '20000000-0000-4000-8000-000000000001' }, latest_charge: { id: 'ch_booking', payment_intent: 'pi_booking', status: 'succeeded', paid: true, captured: true, amount_captured: 4500, amount_refunded: 0, currency: 'chf', receipt_url: receiptUrl } };
  mock.retrieve.mockImplementation(async () => mock.pi);
  mock.from.mockImplementation((table: string) => {
    const chain: any = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ error: mock.errorTable === table ? { message: 'read failed' } : null, data: mock.errorTable === table ? null : table === 'bookings' ? mock.booking : table === 'salons' ? { owner_id: '10000000-0000-4000-8000-000000000002', name: 'Test Store', address: 'Teststrasse 1' } : table === 'profiles' ? { role: mock.role, locale: mock.profileLocale } : { name_de: 'Schnitt', name_en: 'Haircut', name_fr: 'Coupe', name_it: 'Taglio' } }) }; return chain;
  });
});
for (const [name, handler] of [['ics', ics], ['receipt', receipt]] as const) describe(`${name}: actual route and actual booking actor resolver`, () => {
  for (const actor of ['customer', 'owner', 'admin', 'guest']) it(`allows ${actor}`, async () => { mock.user = actor === 'guest' ? null : actor === 'customer' ? '10000000-0000-4000-8000-000000000001' : actor === 'owner' ? '10000000-0000-4000-8000-000000000002' : '10000000-0000-4000-8000-000000000003'; mock.role = actor === 'admin' ? 'admin' : 'customer'; const response = await handler(req('en', actor === 'guest' ? id : undefined), args); expect(response.status).toBe(name === 'ics' ? 200 : 302); expect(response.headers.get('cache-control')).toBe('private, no-store'); });
  for (const mode of ['anonymous', 'foreign-user', 'foreign-cookie', 'wrong-token', 'expired', 'missing']) it(`refuses ${mode}`, async () => {
    mock.user = mode === 'foreign-user' ? '10000000-0000-4000-8000-000000000004' : null;
    if (mode === 'expired') mock.booking.access_token_expires_at = '2000-01-01T00:00:00Z'; if (mode === 'missing') mock.booking = null;
    const response = await handler(req('en', ['foreign-cookie', 'wrong-token', 'expired'].includes(mode) ? mode === 'foreign-cookie' ? otherId : id : undefined, mode === 'wrong-token' ? 'wrong' : 'guest-token'), args);
    expect(response.status).toBe(404); expect(await response.json()).toEqual({ error: 'Not found' }); expect(mock.retrieve).not.toHaveBeenCalled();
  });
  it('does not grant guest fallthrough to a foreign signed-in user', async () => { mock.user = '10000000-0000-4000-8000-000000000004'; expect((await handler(req('en', id), args)).status).toBe(404); expect(mock.retrieve).not.toHaveBeenCalled(); });
  it('invalid Bearer cannot fall through to a valid guest cookie', async () => { mock.user = null; const request = req('en', id); request.headers.set('Authorization', 'Bearer invalid'); expect((await handler(request, args)).status).toBe(404); expect(mock.retrieve).not.toHaveBeenCalled(); });
  it('retains the user-keyed limiter after actor resolution', async () => { const limited = NextResponse.json({}, { status: 429 }); mock.limit.mockImplementation(async (_limiter, identity) => identity.userId ? limited : null); expect(await handler(req(), args)).toBe(limited); expect(mock.retrieve).not.toHaveBeenCalled(); });
  it('refuses malformed UUID before booking reads', async () => { expect((await handler(req(), { params: Promise.resolve({ id: 'not-a-uuid' }) })).status).toBe(404); expect(mock.from).not.toHaveBeenCalled(); });
  it('retains IP limit and actor ban refusals', async () => { const limited = NextResponse.json({}, { status: 429 }); mock.limit.mockResolvedValueOnce(limited); expect(await handler(req(), args)).toBe(limited); expect(mock.from).not.toHaveBeenCalled(); mock.banned.mockResolvedValueOnce(NextResponse.json({}, { status: 403 })); expect((await handler(req(), args)).status).toBe(403); expect(mock.retrieve).not.toHaveBeenCalled(); });
});
describe('calendar payload', () => {
  for (const [locale, label] of [['de', 'Schnitt'], ['en', 'Haircut'], ['fr', 'Coupe'], ['it', 'Taglio']]) it(`preserves actual times and ${locale} label`, async () => { const response = await ics(req(locale), args); const body = await response.text(); expect(body).toContain(`UID:${id}@solen.ch`); expect(body).toContain('DTSTART:20261025T003000Z'); expect(body).toContain('DTEND:20261025T011500Z'); expect(body).toContain(`SUMMARY:${label} - Test Store`); expect(body).toContain('LOCATION:Test Store\\, Teststrasse 1'); expect(response.headers.get('content-disposition')).toContain('.ics'); });
  it('uses profile locale when omitted', async () => { expect(await (await ics(req(), args)).text()).toContain('SUMMARY:Taglio'); });
  for (const status of ['cancelled', 'pending', 'no_show']) it(`does not export ${status} as confirmed`, async () => { mock.booking.status = status; expect((await ics(req(), args)).status).toBe(404); });
  for (const end of [null, 'invalid', '2026-10-25T00:00:00Z']) it(`refuses invalid duration ${end}`, async () => { mock.booking.ends_at = end; expect((await ics(req(), args)).status).toBe(404); });
  it('refuses unavailable detail reads', async () => { const log = vi.spyOn(console, 'error').mockImplementation(() => {}); mock.errorTable = 'services'; expect((await ics(req(), args)).status).toBe(404); log.mockRestore(); });
});
describe('provider receipt identity and actual captured amounts', () => {
  for (const refunded of [0, 1000, 4500]) it(`returns existing receipt for captured 4500 and refund ${refunded}, regardless of list price`, async () => { mock.booking.price_paid = 180; mock.booking.paid_amount = 4500; mock.booking.refunded_amount = refunded; mock.pi.latest_charge.amount_refunded = refunded; const response = await receipt(req(), args); expect(response.status).toBe(302); expect(response.headers.get('location')).toBe(receiptUrl); expect(mock.retrieve).toHaveBeenCalledWith('pi_booking', { expand: ['latest_charge'] }); });
  const mutations: [string, () => void][] = [
    ['no pointer', () => mock.booking.payment_intent_id = null], ['other booking', () => mock.pi.metadata.booking_id = otherId], ['fee intent', () => mock.pi.metadata.type = 'fee_pay'], ['other Store', () => mock.pi.metadata.salon_id = 'other'], ['other customer', () => mock.pi.customer = 'cus_other'], ['pending', () => mock.pi.status = 'processing'], ['hold', () => mock.pi.latest_charge.captured = false], ['zero', () => mock.pi.latest_charge.amount_captured = 0], ['wrong currency', () => mock.pi.latest_charge.currency = 'eur'], ['wrong charge pointer', () => mock.pi.latest_charge.payment_intent = 'pi_other'], ['missing receipt', () => mock.pi.latest_charge.receipt_url = null], ['unsafe redirect', () => mock.pi.latest_charge.receipt_url = 'https://stripe.com.attacker.test/receipt'],
  ];
  for (const [name, mutate] of mutations) it(`refuses ${name}`, async () => { mutate(); expect((await receipt(req(), args)).status).toBe(404); });
  it('handles provider failure without exposing Stripe data', async () => { const log = vi.spyOn(console, 'error').mockImplementation(() => {}); mock.retrieve.mockRejectedValueOnce(new Error('test')); const response = await receipt(req(), args); expect(response.status).toBe(404); expect(await response.json()).toEqual({ error: 'Not found' }); log.mockRestore(); });
});
