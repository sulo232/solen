import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import BookingsList from '@/components-legacy/booking/BookingsList';

vi.mock('next-intl', () => ({ useTranslations: (ns: string) => (key: string) => `${ns}.${key}` }));
vi.mock('@/components-legacy/booking/BookingCard', () => ({ default: ({ booking }: any) => <span>{booking.id}</span> }));
vi.mock('@/components-legacy/booking/CancelBookingSheet', () => ({ default: () => null }));
vi.mock('@/components-legacy/booking/RescheduleSheet', () => ({ default: () => null }));
vi.mock('@/components-legacy/ui/EmptyState', () => ({ default: ({ title }: any) => <span>{title}</span> }));
vi.mock('@/app/[locale]/_components/primitives', () => ({ Skeleton: () => null }));
vi.mock('@/app/[locale]/_components/primitives/Toast', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('motion/react', () => ({ motion: { div: ({ children, initial, animate, transition, ...props }: any) => <div {...props}>{children}</div> }, useReducedMotion: () => true }));

const fetchMock = vi.fn();
let renderer: ReactTestRenderer;
const success = (bookings: unknown[] = []) => ({ ok: true, json: async () => ({ bookings }) });
const failed = () => ({ ok: false, statusText: 'Internal diagnostic' });
const text = () => JSON.stringify(renderer.toJSON());
const button = (label: string) => renderer.root.findAllByType('button').find(b => b.children.includes(label));
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
async function mount() { await act(async () => { renderer = create(<BookingsList userId="customer" />); }); }

it('retries a failed upcoming read and renders the returned booking', async () => {
  fetchMock.mockResolvedValueOnce(failed()).mockResolvedValueOnce(success([{ id: 'confirmed-booking' }]));
  await mount();
  expect(text()).toContain('common.errorLoading');
  expect(text()).not.toContain('Internal diagnostic');
  await act(async () => button('common.retry')!.props.onClick());
  expect(fetchMock.mock.calls.map(call => call[0])).toEqual(['/api/bookings/user?tab=upcoming', '/api/bookings/user?tab=upcoming']);
  expect(text()).toContain('confirmed-booking');
  expect(button('common.retry')).toBeUndefined();
});

it('retries the currently selected tab after its read fails', async () => {
  fetchMock.mockResolvedValueOnce(success()).mockResolvedValueOnce(failed()).mockResolvedValueOnce(success([{ id: 'past-booking' }]));
  await mount();
  await act(async () => button('bookingsList.past')!.props.onClick());
  await act(async () => button('common.retry')!.props.onClick());
  expect(fetchMock.mock.calls.map(call => call[0])).toEqual(['/api/bookings/user?tab=upcoming', '/api/bookings/user?tab=past', '/api/bookings/user?tab=past']);
  expect(text()).toContain('past-booking');
});

it('retains the existing true-empty state without an error or retry', async () => {
  fetchMock.mockResolvedValue(success());
  await mount();
  expect(text()).toContain('bookingsList.noBookings');
  expect(button('common.retry')).toBeUndefined();
  expect(renderer.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
});
