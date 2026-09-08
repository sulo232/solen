import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/search/suggest/route';
const mock = vi.hoisted(() => ({ client: vi.fn(), from: vi.fn(), rpc: vi.fn(), limit: vi.fn(), labels: [{ id: 'service-2', name_fr: 'Coupe', name_it: 'Taglio' }] as any[], error: null as any }));
vi.mock('@/lib/supabase', () => ({ createServerSupabaseClient: mock.client }));
vi.mock('@/lib/ratelimit', () => ({ applyRateLimit: mock.limit, generalLimiter: 'general', getClientIp: () => '192.0.2.1' }));
const payload = { services: [{ id: 'service-2', name_de: 'Schnitt', name_en: 'Haircut', price: 45 }, { id: 'service-1', name_de: 'Bart', name_en: 'Beard', price: 20 }], salons: [{ id: 'personalized-first' }, { id: 'second' }], stylists: [{ id: 'stylist' }] };
beforeEach(() => {
  vi.clearAllMocks(); mock.error = null; mock.labels = [{ id: 'service-2', name_fr: 'Coupe', name_it: 'Taglio' }];
  mock.limit.mockResolvedValue(null);
  mock.rpc.mockImplementation(async () => ({ data: structuredClone(payload), error: mock.error }));
  mock.from.mockImplementation((table: string) => ({ select: vi.fn(() => table === 'cities' ? { eq: vi.fn(() => ({ single: async () => ({ data: { id: 'city-id' } }) })) } : { in: vi.fn(async () => ({ data: mock.labels })) }) }));
  mock.client.mockResolvedValue({ from: mock.from, rpc: mock.rpc });
});
function request(locale?: string, q = '  hair  ') { const url = new URL('https://solen.test/api/search/suggest'); url.searchParams.set('q', q); url.searchParams.set('city', 'basel'); url.searchParams.set('category', 'coiffeur'); if (locale !== undefined) url.searchParams.set('locale', locale); return new NextRequest(url); }
function unchangedCache(response: Response) { expect(response.headers.get('Cache-Control')).toBeNull(); expect(response.headers.get('Netlify-CDN-Cache-Control')).toBeNull(); }
describe('suggest locale lookup with unchanged personalized response policy', () => {
  for (const locale of ['de', 'en', 'fr', 'it', undefined, 'unknown', '']) it(`locale ${String(locale)}`, async () => {
    const response = await GET(request(locale)); const data = await response.json();
    expect(mock.limit).toHaveBeenCalledWith('general', { ip: '192.0.2.1' });
    expect(mock.rpc).toHaveBeenCalledWith('search_suggest', { p_q: 'hair', p_city_id: 'city-id', p_category: 'coiffeur' });
    const skipped = locale === 'de' || locale === 'en';
    expect(mock.from.mock.calls.filter(([table]) => table === 'services')).toHaveLength(skipped ? 0 : 1);
    expect(data.services).toEqual(payload.services.map((service, index) => ({ ...service, name_fr: !skipped && index === 0 ? 'Coupe' : null, name_it: !skipped && index === 0 ? 'Taglio' : null })));
    expect(data.salons).toEqual(payload.salons); expect(data.stylists).toEqual(payload.stylists); unchangedCache(response);
  });
  it('retains missing label fallback', async () => { mock.labels = []; const response = await GET(request('fr')); expect((await response.json()).services[0].name_fr).toBeNull(); unchangedCache(response); });
  it('retains short-query fallback without resource reads', async () => { const response = await GET(request('de', 'x')); expect(await response.json()).toEqual({ services: [], salons: [] }); expect(mock.client).not.toHaveBeenCalled(); unchangedCache(response); });
  it('retains RPC failure fallback', async () => { const log = vi.spyOn(console, 'error').mockImplementation(() => {}); mock.error = { message: 'test failure' }; const response = await GET(request('it')); expect(await response.json()).toEqual({ services: [], salons: [] }); expect(mock.from.mock.calls.filter(([table]) => table === 'services')).toHaveLength(0); unchangedCache(response); log.mockRestore(); });
  it('returns rate-limit refusal unchanged before DB work', async () => { const refusal = NextResponse.json({ error: 'limit' }, { status: 429 }); mock.limit.mockResolvedValue(refusal); expect(await GET(request('en'))).toBe(refusal); expect(mock.client).not.toHaveBeenCalled(); });
  it('keeps query cap and optional scopes', async () => { const response = await GET(new NextRequest('https://solen.test/api/search/suggest?q=' + 'x'.repeat(120))); expect(mock.rpc).toHaveBeenCalledWith('search_suggest', { p_q: 'x'.repeat(100), p_city_id: undefined, p_category: undefined }); unchangedCache(response); });
});
