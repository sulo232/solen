import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import en from '@/messages/en.json';

const h = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('next-intl', async () => {
  const actual = await vi.importActual<any>('next-intl');
  return { ...actual, useLocale: () => 'en', useTranslations: (namespace: string) => actual.createTranslator({ locale: 'en', messages: en, namespace }) };
});
vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }));
vi.mock('motion/react', () => ({ motion: new Proxy({}, { get: (_, name) => name }), AnimatePresence: ({ children }: any) => children, useReducedMotion: () => true }));
vi.mock('@/components-legacy/dashboard/DashboardLayout', () => ({ default: ({ children }: any) => <main>{children}</main> }));
vi.mock('@/components-legacy/dashboard/FormulaTab', () => ({ default: () => null }));
vi.mock('@/components-legacy/dashboard/ClientPhotosTab', () => ({ default: () => null }));
vi.mock('@/components-legacy/dashboard/IntakeFormTab', () => ({ default: () => null }));

import ClientsPage from '@/app/[locale]/dashboard/clients/page';

let tree: any;
const response = (payload: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => payload });
const profile = (salon = 'store-a') => response({ id: 'operator', salon_id: salon });
const client = (name = 'Fixture Client', segment = 'VIP') => ({ user_id: name, display_name: name, avatar_url: null, last_visit: null, total_bookings: 4, tags: [], segment_tag: segment, total_spent: 500 });
const text = (node: any): string => typeof node === 'string' || typeof node === 'number' ? String(node) : Array.isArray(node) ? node.map(text).join(' ') : node?.children != null ? text(node.children) : node?.props?.children != null ? text(node.props.children) : '';
const buttons = () => tree.root.findAllByType('button');
const button = (label: string) => buttons().find((node: any) => text(node.props.children).includes(label));
const mount = async () => { await act(async () => { tree = create(<ClientsPage />); }); };
const retry = async () => { await act(async () => button(en.common.retry).props.onClick()); };
const assertFailed = () => {
  expect(tree.root.findAllByProps({ role: 'alert' })).toHaveLength(1);
  expect(text(tree.toJSON())).toContain(en.common.errorLoading);
  expect(text(tree.toJSON())).not.toContain(en.dashboard.clientsPage.noClientsYet);
  expect(buttons()).toHaveLength(1);
  expect(tree.root.findAllByType('input')).toHaveLength(0);
};
const deferred = () => {
  let resolve!: (value: ReturnType<typeof response>) => void;
  const promise = new Promise<ReturnType<typeof response>>(done => { resolve = done; });
  return { promise, resolve };
};

beforeEach(() => {
  h.fetch.mockReset();
  vi.stubGlobal('fetch', h.fetch);
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => {
  if (tree) await act(async () => tree.unmount());
  tree = null;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test('HTTP 500 shows ErrorState without zero segment counts; Retry loads real segments for the current Store', async () => {
  h.fetch.mockResolvedValueOnce(profile()).mockResolvedValueOnce(response({ error: 'Could not load clients' }, 500));
  await mount();
  assertFailed();
  h.fetch.mockResolvedValueOnce(profile('store-b')).mockResolvedValueOnce(response({ clients: [client()] }));
  await retry();
  expect(tree.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
  expect(text(tree.toJSON())).toContain('Fixture Client');
  expect(text(button(en.dashboard.clientsPage.segmentAll).props.children)).toMatch(/1$/);
  expect(text(button(en.dashboard.clientsPage.segmentVip).props.children)).toMatch(/1$/);
  expect(h.fetch.mock.calls.map(([url]) => url)).toEqual(['/api/profile', '/api/salon/clients?salon_id=store-a', '/api/profile', '/api/salon/clients?salon_id=store-b']);
});

test('successful empty population retains all five zero counts and the existing empty message', async () => {
  h.fetch.mockResolvedValueOnce(profile()).mockResolvedValueOnce(response({ clients: [] }));
  await mount();
  expect(tree.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
  expect(text(tree.toJSON())).toContain(en.dashboard.clientsPage.noClientsYet);
  expect(buttons()).toHaveLength(5);
  for (const node of buttons()) expect(text(node.props.children)).toMatch(/0$/);
  expect(tree.root.findAllByType('input')).toHaveLength(1);
});

test('successful populated presentation keeps segment filters, search and the selected Store detail', async () => {
  h.fetch.mockResolvedValueOnce(profile('store-detail')).mockResolvedValueOnce(response({ clients: [client(), client('Regular Fixture', 'Regulär')] }));
  await mount();
  await act(async () => button(en.dashboard.clientsPage.segmentVip).props.onClick());
  expect(text(tree.toJSON())).toContain('Fixture Client');
  expect(text(tree.toJSON())).not.toContain('Regular Fixture');
  await act(async () => button(en.dashboard.clientsPage.segmentAll).props.onClick());
  await act(async () => tree.root.findByType('input').props.onChange({ target: { value: 'regular' } }));
  expect(text(tree.toJSON())).not.toContain('Fixture Client');
  expect(text(tree.toJSON())).toContain('Regular Fixture');
  h.fetch.mockResolvedValue(response({ bookings: [], notes: [] }));
  await act(async () => button('Regular Fixture').props.onClick());
  expect(h.fetch.mock.calls.slice(2).map(([url]) => url)).toEqual([
    '/api/bookings?user_id=Regular Fixture&salon_id=store-detail',
    '/api/client-notes?salon_id=store-detail&customer_id=Regular Fixture',
  ]);
  expect(text(tree.toJSON())).toContain('Regular Fixture');
});

test.each([401, 403, 500])('profile HTTP %i fails visibly without fetching a client population; Retry reloads profile', async status => {
  h.fetch.mockResolvedValueOnce(response({ error: 'Profile unavailable' }, status));
  await mount();
  assertFailed();
  expect(h.fetch).toHaveBeenCalledTimes(1);
  h.fetch.mockResolvedValueOnce(profile()).mockResolvedValueOnce(response({ clients: [] }));
  await retry();
  expect(text(tree.toJSON())).toContain(en.dashboard.clientsPage.noClientsYet);
  expect(tree.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
});

test.each([401, 403])('client HTTP %i refuses to show population even if the error body includes clients', async status => {
  h.fetch.mockResolvedValueOnce(profile()).mockResolvedValueOnce(response({ clients: [client('Forbidden Client')] }, status));
  await mount();
  assertFailed();
  expect(text(tree.toJSON())).not.toContain('Forbidden Client');
});

test.each([{ error: 'bad profile' }, { id: 'operator', salon_id: null }])('missing authenticated profile or active Store is not a successful empty population: %j', async payload => {
  h.fetch.mockResolvedValueOnce(response(payload));
  await mount();
  assertFailed();
  expect(h.fetch).toHaveBeenCalledTimes(1);
});

test('successful HTTP response with a missing population is an error, not fabricated empty', async () => {
  h.fetch.mockResolvedValueOnce(profile()).mockResolvedValueOnce(response({ error: 'Malformed response' }));
  await mount();
  assertFailed();
});

test('network rejection offers the same working Retry', async () => {
  h.fetch.mockRejectedValueOnce(new Error('fixture network failure'));
  await mount();
  assertFailed();
  h.fetch.mockResolvedValueOnce(profile()).mockResolvedValueOnce(response({ clients: [client()] }));
  await retry();
  expect(text(tree.toJSON())).toContain('Fixture Client');
});

test.each([200, 500])('a late previous Store response (%i) cannot replace the result of a newer Retry', async status => {
  h.fetch.mockResolvedValueOnce(profile()).mockResolvedValueOnce(response({ error: 'Failed' }, 500));
  await mount();
  const onRetry = button(en.common.retry).props.onClick;
  const oldRead = deferred();
  h.fetch.mockResolvedValueOnce(profile('store-old')).mockReturnValueOnce(oldRead.promise);
  await act(async () => onRetry());
  h.fetch.mockResolvedValueOnce(profile('store-new')).mockResolvedValueOnce(response({ clients: [client('Current Client')] }));
  await act(async () => onRetry());
  expect(text(tree.toJSON())).toContain('Current Client');
  await act(async () => oldRead.resolve(response({ clients: [client('Stale Client')] }, status)));
  expect(text(tree.toJSON())).toContain('Current Client');
  expect(text(tree.toJSON())).not.toContain('Stale Client');
  expect(tree.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
});

test('a stale profile response cannot start a client request after unmount', async () => {
  const oldProfile = deferred();
  h.fetch.mockReturnValueOnce(oldProfile.promise);
  await mount();
  await act(async () => tree.unmount());
  tree = null;
  await act(async () => oldProfile.resolve(profile('stale-store')));
  expect(h.fetch).toHaveBeenCalledTimes(1);
});
