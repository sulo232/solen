import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import fr from '@/messages/fr.json';
import it from '@/messages/it.json';
const h = vi.hoisted(() => ({ locale: 'fr', messages: {} as any, tip: null as any, fetch: vi.fn(), router: { push: vi.fn(), replace: vi.fn(), back: vi.fn() } }));
vi.mock('next-intl', async () => { const actual = await vi.importActual<any>('next-intl'); return { ...actual, useLocale: () => h.locale, useTranslations: (namespace: string) => actual.createTranslator({ locale: h.locale, messages: h.messages, namespace }) }; });
vi.mock('next/navigation', () => ({ useParams: () => ({ bookingId: 'booking', token: 'ticket' }), useRouter: () => h.router }));
vi.mock('next-view-transitions', () => ({ Link: ({ children, ...props }: any) => <a {...props}>{children}</a>, useTransitionRouter: () => h.router }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
vi.mock('motion/react', () => ({ motion: new Proxy({}, { get: (_, name) => name }), AnimatePresence: ({ children }: any) => children, useReducedMotion: () => true }));
vi.mock('@/app/[locale]/_components/tips/TipSheet', () => ({ default: (props: any) => { h.tip = props; return <div data-tip>{props.recipientName} {props.contextLine}</div>; } }));
vi.mock('@/app/[locale]/_components/primitives/Modal', () => ({ Modal: ({ open, children }: any) => open ? <div>{children}</div> : null, ModalHeader: () => null, ModalBody: ({ children }: any) => <div>{children}</div>, ModalFooter: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/app/[locale]/_components/tips/TipFlow', () => ({ default: () => null }));
vi.mock('@/components-legacy/ui/AddressAutocomplete', () => ({ default: () => null }));
vi.mock('@/components-legacy/ui/ImageUpload', () => ({ default: () => null }));
vi.mock('@/components-legacy/ui/interactive-hover-button', () => ({ default: ({ children, ...props }: any) => <button {...props}>{children}</button> }));
vi.mock('@/lib/supabase-browser', () => ({ createBrowserSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session: { user: { email: 'fixture@example.invalid' } } } }) } }) }));
vi.mock('@/app/[locale]/_components/primitives', () => ({
  FieldHelper: ({ children }: any) => <div>{children}</div>,
  PillToggle: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  PillGroup: ({ children }: any) => <div>{children}</div>,
}));
import TipPage from '@/app/[locale]/tip/[bookingId]/page';
import QueuePage from '@/app/[locale]/queue/[token]/page';
import Onboarding from '@/app/[locale]/onboarding/salon/page';
let tree: any;
const text = (node: any): string => typeof node === 'string' ? node : Array.isArray(node) ? node.map(text).join(' ') : node?.children ? text(node.children) : node?.props?.children ? text(node.props.children) : '';
const booking = { id: 'booking', services: { name_de: 'Schnitt', name_en: 'Cut', name_fr: 'Coupe', name_it: 'Taglio' }, salons: { name: 'Fixture Store' }, staff_members: { name: 'Fixture Stylist', avatar_url: '/fixture.jpg', average_rating: 4.8, review_count: 28 } };
beforeEach(() => {
  h.locale = 'fr'; h.messages = fr; h.tip = null; h.fetch.mockReset();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', h.fetch);
  vi.stubGlobal('window', { addEventListener() {}, removeEventListener() {}, matchMedia: () => ({ matches: true }), scrollTo() {} });
  vi.stubGlobal('sessionStorage', { getItem: () => null, setItem() {} });
  vi.stubGlobal('document', { body: { style: {} }, addEventListener() {}, removeEventListener() {} });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => { if (tree) await act(async () => tree.unmount()); tree = null; vi.restoreAllMocks(); });

test.each([['fr', fr, 'Coupe'], ['it', it, 'Taglio'], ['de', de, 'Schnitt']])('tip reads real %s booking envelope, recipient and unchanged createIntent', async (locale, messages, label) => {
  h.locale = locale as string; h.messages = messages;
  h.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: booking }) });
  await act(async () => { tree = create(<TipPage />); });
  expect(h.tip).toMatchObject({ recipientName: 'Fixture Stylist', recipientPhoto: '/fixture.jpg', recipientRating: 4.8, recipientReviewCount: 28, contextLine: `${label} Fixture Store` });
  h.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ clientSecret: 'mock-secret' }) });
  expect(await h.tip.createIntent(1200)).toEqual({ clientSecret: 'mock-secret' });
  expect(h.fetch).toHaveBeenLastCalledWith('/api/tips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ booking_id: 'booking', amount: 1200 }) });
});
test('tip falls back to German and omits optional recipient fields without an invented rating', async () => {
  h.fetch.mockResolvedValue({ ok: true, json: async () => ({ data: { id: 'booking', services: { name_de: 'Schnitt', name_fr: ' ' }, salons: { name: 'Fixture Store' } } }) });
  await act(async () => { tree = create(<TipPage />); });
  expect(h.tip).toMatchObject({ contextLine: 'Schnitt Fixture Store', recipientPhoto: null, recipientRating: null, recipientReviewCount: null });
});
test('tip keeps the existing identified legacy envelope and relation shape', async () => {
  h.fetch.mockResolvedValue({ ok: true, json: async () => ({ booking: { id: 'booking', service: { name_fr: 'Coupe' }, salon: { name: 'Fixture Store' }, staff: { name: 'Legacy Stylist' } } }) });
  await act(async () => { tree = create(<TipPage />); });
  expect(h.tip).toMatchObject({ recipientName: 'Legacy Stylist', contextLine: 'Coupe Fixture Store' });
});
test.each([401, 403, 404, 500])('tip %i is an error state and Retry loads a valid recipient', async status => {
  h.fetch.mockResolvedValueOnce({ ok: false, status, json: async () => ({ message: 'fixture error' }) });
  await act(async () => { tree = create(<TipPage />); });
  expect(h.tip).toBeNull(); expect(tree.root.findByProps({ role: 'alert' })).toBeTruthy();
  h.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ data: booking }) });
  await act(async () => tree.root.findAllByType('button').find((button: any) => text(button.toJSON?.()) || button.props.onClick).props.onClick());
  expect(h.tip.recipientName).toBe('Fixture Stylist');
});
test.each([{ message: 'bad payload' }, { data: null }, { data: { id: 'another-booking' } }])('tip rejects malformed or different booking identity %j', async payload => {
  h.fetch.mockResolvedValue({ ok: true, json: async () => payload });
  await act(async () => { tree = create(<TipPage />); });
  expect(h.tip).toBeNull(); expect(tree.root.findByProps({ role: 'alert' })).toBeTruthy();
});

test.each([
  ['fr', fr, { serviceNameFr: 'Coupe' }, 'Coupe'], ['it', it, { serviceNameIt: 'Taglio' }, 'Taglio'],
  ['fr', fr, { serviceNameFr: null, serviceNameDe: 'Schnitt' }, 'Schnitt'],
  ['it', it, { serviceNameIt: '', serviceNameDe: 'Schnitt' }, 'Schnitt'],
  ['fr', fr, { serviceNameFr: '  ', serviceNameDe: 'Schnitt' }, 'Schnitt'],
  ['it', it, { serviceName: 'Legacy Cut' }, 'Legacy Cut'],
  ['fr', fr, {}, null], ['fr', fr, { serviceNameFr: ' ', serviceName: ' ' }, null],
])('queue %s renders the resolved service guard', async (locale, messages, fields, label) => {
  h.locale = locale as string; h.messages = messages;
  h.fetch.mockResolvedValue({ ok: true, json: async () => ({ id: 'ticket', customerName: 'A01', status: 'waiting', aheadCount: 2, position: 3, estimatedWaitMinutes: 20, joinedAt: '2026-09-08T10:00:00Z', servicePrice: 55, serviceDuration: 30, ...fields }) });
  await act(async () => { tree = create(<QueuePage />); });
  const output = text(tree.toJSON());
  if (label) { expect(output).toContain(label); expect(output).toContain('CHF'); }
  else expect(output).not.toContain('CHF');
});

test.each([['de', de, 'Stadt *'], ['en', en, 'City *'], ['fr', fr, 'Ville *'], ['it', it, 'Città *']])('registration %s labels the unchanged required city selector correctly', async (locale, messages, label) => {
  h.locale = locale as string; h.messages = messages;
  h.fetch.mockResolvedValue({ ok: true, json: async () => ({ draft: null }) });
  await act(async () => { tree = create(<Onboarding />); });
  expect(text(tree.toJSON())).toContain(label);
  const select = tree.root.findAllByType('select')[0];
  expect(select.findAllByType('option').map((o: any) => o.props.value)).toEqual(['', 'zuerich', 'basel', 'bern']);
  const next = tree.root.findAllByType('button').find((button: any) => text(button.props.children).includes((messages as any).salonRegistration.nav.next));
  await act(async () => next.props.onClick());
  expect(text(tree.toJSON())).toContain((messages as any).salonRegistration.step1.errors.city);
  await act(async () => select.props.onChange({ target: { value: 'basel' } }));
  expect(tree.root.findAllByType('select')[0].props.value).toBe('basel');
});
