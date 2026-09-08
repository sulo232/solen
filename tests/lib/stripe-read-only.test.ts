import { NextRequest } from 'next/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ construct: vi.fn(), retrieve: vi.fn() }));
vi.mock('stripe', () => ({ default: class Stripe { paymentIntents = { retrieve: mock.retrieve }; constructor(key: string, options: unknown) { mock.construct(key, options); } } }));
beforeEach(() => { vi.resetModules(); mock.construct.mockClear(); });
afterEach(() => vi.unstubAllEnvs());
it('uses only the restricted credential and preserves the pinned API', async () => {
  vi.stubEnv('STRIPE_RESTRICTED_KEY', 'rk_test_fixture'); vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_unused');
  const { getReadOnlyStripe } = await import('@/lib/stripe');
  const first = getReadOnlyStripe(); expect(getReadOnlyStripe()).toBe(first);
  expect(mock.construct).toHaveBeenCalledExactlyOnceWith('rk_test_fixture', { apiVersion: '2026-02-25.clover' });
});
it.each(['', 'sk_test_wrong_kind'])('refuses absent or full-scope read credential (%s) without fallback', async key => {
  vi.stubEnv('STRIPE_RESTRICTED_KEY', key); vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_must_not_use');
  const { getReadOnlyStripe } = await import('@/lib/stripe'); expect(() => getReadOnlyStripe()).toThrow('STRIPE_RESTRICTED_KEY is not configured'); expect(mock.construct).not.toHaveBeenCalled();
});
it('leaves existing payment client on its original key and API', async () => {
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_existing'); vi.stubEnv('STRIPE_RESTRICTED_KEY', 'rk_test_fixture');
  const { getStripe } = await import('@/lib/stripe'); getStripe();
  expect(mock.construct).toHaveBeenCalledExactlyOnceWith('sk_test_existing', { apiVersion: '2026-02-25.clover' });
});

vi.mock('@/lib/bookings/authorize', () => ({ resolveBookingActor: async () => ({ actor: 'customer', userId: '10000000-0000-4000-8000-000000000001', booking: { payment_intent_id: 'pi_booking', salon_id: 'salon' } }) }));
vi.mock('@/lib/feature-flags', () => ({ checkUserBanned: async () => null }));
vi.mock('@/lib/ratelimit', () => ({ applyRateLimit: async () => null, generalLimiter: {}, getClientIp: () => '192.0.2.1' }));
it.each([false, true])('actual receipt handler restricted-key availability=%s', async available => {
  const id = '00000000-0000-4000-8000-000000000001';
  vi.stubEnv('STRIPE_RESTRICTED_KEY', available ? 'rk_test_fixture' : ''); vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_must_not_fallback');
  mock.retrieve.mockResolvedValue({ id: 'pi_booking', status: 'succeeded', metadata: { booking_id: id, type: 'booking' }, latest_charge: { payment_intent: 'pi_booking', paid: true, captured: true, status: 'succeeded', amount_captured: 4500, currency: 'chf', receipt_url: 'https://pay.stripe.com/receipts/test' } });
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { GET } = await import('@/app/api/bookings/[id]/receipt/route');
  const response = await GET(new NextRequest('https://solen.test/api/bookings/' + id + '/receipt'), { params: Promise.resolve({ id }) });
  expect(response.status).toBe(available ? 302 : 503);
  if (!available) { expect(await response.json()).toEqual({ error: 'RECEIPT_UNAVAILABLE' }); expect(mock.construct).not.toHaveBeenCalled(); }
  else expect(mock.construct).toHaveBeenCalledExactlyOnceWith('rk_test_fixture', { apiVersion: '2026-02-25.clover' });
  log.mockRestore();
});
