import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/bookings/user/route';
const mock = vi.hoisted(() => ({ from: vi.fn(), query: null as any, rows: [] as any[], banned: vi.fn(), limit: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ createServerSupabaseClient: async () => ({ from: mock.from, auth: { getUser: async () => ({ data: { user: { id: '00000000-0000-4000-8000-000000000001' } } }) } }) }));
vi.mock('@/lib/feature-flags', () => ({ checkUserBanned: mock.banned }));
vi.mock('@/lib/ratelimit', () => ({ applyRateLimit: mock.limit, generalLimiter: 'general' }));
beforeEach(() => { vi.clearAllMocks(); mock.banned.mockResolvedValue(null); mock.limit.mockResolvedValue(null); mock.rows = []; const q: any = { then: (resolve: any) => Promise.resolve({ data: mock.rows, error: null }).then(resolve) }; for (const method of ['select', 'eq', 'in', 'lt', 'gte', 'order', 'range']) q[method] = vi.fn(() => q); mock.query = q; mock.from.mockReturnValue(q); });
const req = () => new NextRequest('https://solen.test/api/bookings/user?tab=past', { headers: { cookie: 'sb-test=present' } });
it('projects eligibility only and preserves explicit user scope/fields', async () => {
 mock.rows = ['paid', 'refunded', 'partially_refunded', 'card_saved', 'none', 'failed'].map(payment_status => ({ id: payment_status, price_paid: 180, payment_intent_id: 'pi_private', paid_amount: 4500, payment_status }));
 mock.rows.push({ id: 'zero', payment_status: 'paid', payment_intent_id: 'pi_zero', paid_amount: 0 });
 mock.rows.push({ id: 'legacy-null', payment_status: 'paid', payment_intent_id: 'pi_legacy', paid_amount: null });
 const body = await (await GET(req())).json(); expect(body.bookings.map((b: any) => b.has_receipt)).toEqual([true, true, true, false, false, false, false, true]); expect(JSON.stringify(body)).not.toContain('pi_private'); expect(JSON.stringify(body)).not.toContain('payment_intent_id'); expect(body.bookings[0].price_paid).toBe(180); expect(mock.query.eq).toHaveBeenCalledWith('user_id', '00000000-0000-4000-8000-000000000001'); expect(mock.query.select.mock.calls[0][0]).not.toContain('access_token');
});
it('ban and user limit refuse before booking reads', async () => { const banned = NextResponse.json({}, { status: 403 }); mock.banned.mockResolvedValueOnce(banned); expect(await GET(req())).toBe(banned); expect(mock.from).not.toHaveBeenCalled(); const limited = NextResponse.json({}, { status: 429 }); mock.limit.mockResolvedValueOnce(limited); expect(await GET(req())).toBe(limited); expect(mock.from).not.toHaveBeenCalled(); });
it('keeps missing-session fast refusal', async () => { expect((await GET(new NextRequest('https://solen.test/api/bookings/user'))).status).toBe(401); expect(mock.from).not.toHaveBeenCalled(); });
