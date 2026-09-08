import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import fr from '@/messages/fr.json';
import it from '@/messages/it.json';
const h = vi.hoisted(() => ({ locale: 'fr', messages: {} as any, calls: [] as any[], allowed: true, user: { id: 'owner' } as any, mine: { id: 'salon' } as any, session: {} as any, admin: {} as any, auth: vi.fn(), active: vi.fn(), rows: {} as any }));
vi.mock('next-intl', async () => { const actual = await vi.importActual<any>('next-intl'); return { ...actual, useLocale: () => h.locale, useTranslations: (namespace: string) => actual.createTranslator({ locale: h.locale, messages: h.messages, namespace }) }; });
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
vi.mock('@/components-legacy/dashboard/DashboardLayout', () => ({ default: ({ children }: any) => <main>{children}</main> }));
vi.mock('@/lib/supabase', () => ({ createAdminSupabaseClient: () => h.admin, createServerSupabaseClient: async () => h.session }));
vi.mock('@/lib/auth/request-user', () => ({ resolveRequestUser: async () => ({ user: h.user, supabase: h.session }) }));
vi.mock('@/lib/auth/require', () => ({ requireSalonAccess: h.auth }));
vi.mock('@/lib/active-salon', () => ({ getActiveSalon: h.active }));
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn(), bookingConfirmation: vi.fn(), salonNewBooking: vi.fn() }));
vi.mock('@/lib/ratelimit', () => ({ applyRateLimit: async () => null, bookingLimiter: {}, bearerVerifyLimiter: {}, generalLimiter: {}, getClientIp: () => 'fixture' }));
vi.mock('@/lib/feature-flags', () => ({ checkFeatureEnabled: async () => null, checkUserBanned: async () => null }));
vi.mock('@/lib/bookings/auto-assign', () => ({ pickSlotForAnyStaff: vi.fn(), countStaffBookingsOnDay: vi.fn() }));
vi.mock('@/lib/referral/complete-referral', () => ({ completeReferralForFirstBooking: vi.fn() }));
vi.mock('@/lib/points/attribution', () => ({ attributeBookingToSearch: vi.fn() }));
vi.mock('@/lib/error-report', () => ({ reportError: vi.fn() }));
vi.mock('@/lib/salon-detail', () => ({ isSalonHidden: vi.fn(), isViewerAdmin: vi.fn() }));
import { GET as bookingGET } from '@/app/api/bookings/route';
import { GET as bundleGET } from '@/app/api/salon/bundles/route';
import Upcharge from '@/app/[locale]/dashboard/upcharge/page';
import { SalonBundles } from '@/app/[locale]/_components/salon/SalonBundles';
const service = { id: 'svc1', name_de: 'Schnitt', name_en: 'Cut', name_fr: 'Coupe', name_it: 'Taglio', price: 45, duration_minutes: 30 };
function db(kind: string) {
  return { auth: { getUser: async () => ({ data: { user: h.user } }) }, from(table: string) {
    const call = { kind, table, columns: '', filters: [] as any[], range: [] as number[] }; h.calls.push(call);
    const q: any = { select: (columns: string) => { call.columns = columns; return q; }, eq: (...args: any[]) => { call.filters.push(['eq', ...args]); return q; }, in: (...args: any[]) => { call.filters.push(['in', ...args]); return q; }, order: () => q, range: (...args: number[]) => { call.range = args; return q; }, gte: () => q, lte: () => q, then: (resolve: any, reject: any) => run().then(resolve, reject) };
    async function run() {
      if (!(table in h.rows)) throw new Error(`Unexpected ${table}`);
      let data = h.rows[table].filter((r: any) => call.filters.every(([op, key, value]) => op === 'eq' ? r[key] === value : value.includes(r[key])));
      const count = data.length;
      if (call.range.length) data = data.slice(call.range[0], call.range[1] + 1);
      // The fixture honors the actual selected columns, so omitted locale fields cannot leak through.
      const names = (row: any, columns: string) => Object.fromEntries(Object.entries(row).filter(([key]) => columns.includes(key)));
      if (table === 'bookings') data = data.map((b: any) => ({ ...b, services: names(b.services, call.columns.match(/services\(([^)]+)\)/)?.[1] ?? '') }));
      if (table === 'services') data = data.map((s: any) => names(s, call.columns));
      return { data, error: null, count };
    }
    return q;
  } };
}
let tree: any;
const visible = (n: any): string => typeof n === 'string' ? n : Array.isArray(n) ? n.map(visible).join(' ') : n?.children ? visible(n.children) : n?.props?.children ? visible(n.props.children) : '';
beforeEach(() => {
  h.locale = 'fr'; h.messages = fr; h.calls = []; h.user = { id: 'owner' }; h.allowed = true; h.mine = { id: 'salon' };
  h.auth.mockReset().mockImplementation(async () => h.allowed ? { user: h.user, supabase: h.session } : NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
  h.active.mockReset().mockImplementation(async () => h.mine);
  h.rows = {
    bookings: [{ id: 'booking', user_id: null, salon_id: 'salon', starts_at: '2026-09-08T10:00:00Z', status: 'completed', price_paid: 45, paid_amount: 4500, fee_charge_status: 'failed', guest_name: 'Fixture Customer', services: service, staff_members: { name: 'Fixture Stylist' } }],
    public_profiles: [],
    service_bundles: [{ id: 'bundle', salon_id: 'salon', name: 'Fixture Bundle', pricing_mode: 'percent', custom_price: null, percent_off: 20, is_active: true, sort_order: 0 }],
    service_bundle_items: [{ bundle_id: 'bundle', service_id: 'svc1', sort_order: 0 }, { bundle_id: 'bundle', service_id: 'svc2', sort_order: 1 }],
    services: [service, { ...service, id: 'svc2', name_fr: 'Soin', name_it: 'Trattamento', price: 55, duration_minutes: 60 }],
  };
  h.session = db('session'); h.admin = db('admin');
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => { if (tree) await act(async () => tree.unmount()); tree = null; vi.restoreAllMocks(); });

test.each([['fr', fr, 'Coupe'], ['it', it, 'Taglio']])('actual dashboard reader feeds %s upcharge picker without changing fee/price fields', async (locale, messages, name) => {
  h.locale = locale as string; h.messages = messages;
  const response = await bookingGET(new NextRequest('http://localhost/api/bookings?salon_id=salon&status=completed&limit=100'));
  const body = await response.json(); expect(response.status).toBe(200);
  expect(body.bookings[0]).toMatchObject({ services: { name_fr: 'Coupe', name_it: 'Taglio' }, price_paid: 45, paid_amount: 4500, fee_charge_status: 'failed' });
  expect(body).toMatchObject({ total: 1, page: 1, limit: 100 });
  expect(h.calls.find(c => c.table === 'bookings')).toMatchObject({ kind: 'admin', range: [0, 99], filters: [['eq', 'salon_id', 'salon'], ['eq', 'status', 'completed']] });
  expect(h.auth).toHaveBeenCalledWith('salon', 'calendar', { user: h.user, supabase: h.session });
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({ ok: true, json: async () => url === '/api/profile' ? { salon_id: 'salon' } : url.startsWith('/api/bookings?') ? body : { cases: [] } })));
  await act(async () => { tree = create(<Upcharge />); });
  const picker = tree.root.findAllByType('button').find((b: any) => visible(b.props.children).includes((messages as any).dashboard.upcharge.selectPlaceholder));
  await act(async () => picker.props.onClick());
  expect(visible(tree.toJSON())).toContain(name); expect(visible(tree.toJSON())).toContain('CHF 45.00');
});
test('dashboard denies calendar access before any privileged booking read', async () => {
  h.allowed = false;
  expect((await bookingGET(new NextRequest('http://localhost/api/bookings?salon_id=salon'))).status).toBe(403);
  expect(h.calls).toHaveLength(0);
});
test.each(['public', 'owner'])('actual %s bundle response retains raw names and computed amounts/duration', async mode => {
  const response = await bundleGET(new NextRequest(`http://localhost/api/salon/bundles?salon_id=salon${mode === 'owner' ? '&mine=true' : ''}`));
  const body = await response.json(); expect(response.status).toBe(200);
  expect(body.bundles[0]).toMatchObject({ sum_price: 100, bundle_price: 80, services: [{ name_fr: 'Coupe', name_it: 'Taglio', duration_minutes: 30, price: 45 }, { name_fr: 'Soin', name_it: 'Trattamento', duration_minutes: 60, price: 55 }] });
  expect(h.calls.every(c => c.kind === (mode === 'owner' ? 'admin' : 'session'))).toBe(true);
  if (mode === 'owner') expect(h.active).toHaveBeenCalledWith(h.admin, 'owner', 'id', 'catalog');
});
test.each([['fr', fr, 'Coupe', 'Soin'], ['it', it, 'Taglio', 'Trattamento']])('actual bundle reader feeds %s PDP service labels and existing booking destination', async (locale, messages, first, second) => {
  h.locale = locale as string; h.messages = messages;
  vi.stubGlobal('fetch', vi.fn(async () => bundleGET(new NextRequest('http://localhost/api/salon/bundles?salon_id=salon'))));
  await act(async () => { tree = create(<SalonBundles salonId="salon" slug="fixture" locale={h.locale} />); });
  expect(visible(tree.toJSON())).toContain(first); expect(visible(tree.toJSON())).toContain(second);
  expect(tree.root.findByType('a').props.href).toBe(`/${locale}/salon/fixture/booking?services=svc1,svc2&bundle=bundle`);
});
test('denied owner catalogue access keeps the established public-only fallback, including no inactive bundles', async () => {
  h.mine = null;
  h.rows.service_bundles.push({ ...h.rows.service_bundles[0], id: 'private', is_active: false });
  const result = await bundleGET(new NextRequest('http://localhost/api/salon/bundles?salon_id=salon&mine=true'));
  expect((await result.json()).bundles.map((b: any) => b.id)).toEqual(['bundle']);
  expect(h.calls.every(c => c.kind === 'session')).toBe(true);
  expect(h.calls[0].filters).toContainEqual(['eq', 'is_active', true]);
});
