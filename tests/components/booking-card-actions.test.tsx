import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BookingCard from '@/components-legacy/booking/BookingCard';
import en from '@/messages/en.json';
import de from '@/messages/de.json';
import fr from '@/messages/fr.json';
import itMessages from '@/messages/it.json';
const state = vi.hoisted(() => ({ locale: 'en' }));
const messages = { en, de, fr, it: itMessages };
vi.mock('next-intl', () => ({ useLocale: () => state.locale, useTranslations: () => (key: string) => key.split('.').reduce((value: any, key) => value[key], messages[state.locale as keyof typeof messages].bookingCard) }));
vi.mock('next/link', () => ({ default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
let renderer: ReactTestRenderer;
let doc: EventTarget;
let menuNodes: any[];
let triggerNodes: any[];
beforeEach(() => { doc = new EventTarget(); menuNodes = []; triggerNodes = []; vi.stubGlobal('document', doc); });
function createNodeMock(element: any) {
  if (element.type === 'div') {
    const node: any = { contains: (target: any) => target === node || target?.menu === node };
    menuNodes.push(node); return node;
  }
  const node = { focus: vi.fn() }; triggerNodes.push(node); return node;
}
function dispatch(type: string, target: unknown, key?: string) {
  const e = new Event(type, { cancelable: true });
  Object.defineProperty(e, 'target', { value: target });
  if (key) Object.defineProperty(e, 'key', { value: key });
  doc.dispatchEvent(e); return e;
}
function textOf(node: any): string { return node.children.map((child: any) => typeof child === 'string' ? child : textOf(child)).join(''); }
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); vi.unstubAllGlobals(); });
const booking: any = { id: '00000000-0000-4000-8000-000000000001', starts_at: '2099-01-01T10:00:00Z', ends_at: '2099-01-01T10:45:00Z', status: 'confirmed', price_paid: 45, has_receipt: true, salon: { name: 'Test & Store', slug: 'test-store', address: 'Teststrasse 1, Basel' }, service: { name_de: 'Schnitt', name_en: 'Haircut', name_fr: 'Coupe', name_it: 'Taglio' } };
const event = () => ({ preventDefault: vi.fn(), stopPropagation: vi.fn() });
async function mount(overrides = {}, callbacks = {}) { await act(async () => { renderer = create(<BookingCard booking={{ ...booking, ...overrides }} {...callbacks} />, { createNodeMock }); }); }
async function open() { await act(async () => renderer.root.findByProps({ 'aria-label': messages[state.locale as keyof typeof messages].bookingCard.actions }).props.onClick(event())); }
const links = () => renderer.root.findAllByType('a');
describe('actual BookingCard approved actions', () => {
  for (const locale of ['de', 'en', 'fr', 'it']) it(`connects ${locale} Directions/calendar/receipt and avoids nested anchors`, async () => {
    state.locale = locale; await mount(); await open();
    expect(links().some(link => link.props.href === `/api/bookings/${booking.id}/ics?locale=${locale}` && link.props.download)).toBe(true);
    expect(links().some(link => link.props.href === `/api/bookings/${booking.id}/receipt`)).toBe(true);
    const directions = links().find(link => link.props.href.startsWith('https://www.google.com/maps/dir/'))!;
    expect(new URL(directions.props.href).searchParams.get('destination')).toBe('Test & Store, Teststrasse 1, Basel');
    expect(directions.props.rel).toBe('noopener noreferrer');
    for (const link of links()) expect(link.findAllByType('a')).toHaveLength(1);
    const click = event(); directions.props.onClick(click); expect(click.stopPropagation).toHaveBeenCalled(); expect(click.preventDefault).not.toHaveBeenCalled();
    expect(JSON.stringify(renderer.toJSON())).toContain(messages[locale as keyof typeof messages].bookingCard.receipt);
  });
  it('keeps the card destination and controls in the same transforming stacking context', async () => {
    state.locale = 'en'; await mount(); await open();
    const body = renderer.root.findAllByType('div').find(node => node.props.className?.includes('hover:-translate-y-[2px]'))!;
    const cardLink = links().find(link => link.props.href === '/en/salon/test-store')!;
    const controls = renderer.root.findAllByType('div').find(node => node.props.className === 'relative z-20 flex items-center gap-2')!;
    // A sibling overlay wins against controls trapped by hover/active transforms.
    expect(body.props.className.split(' ')).toContain('relative');
    expect(body.props.className.split(' ')).toContain('z-30');
    expect(body.findAllByType('a')).toContain(cardLink);
    expect(body.findAllByType('div')).toContain(controls);
    expect(cardLink.props.className).toContain('z-10');
    expect(controls.findAllByType('a').some(link => link.props.href.includes('/ics'))).toBe(true);
    for (const link of links()) expect(link.findAllByType('a')).toHaveLength(1);
  });
  it('preserves all three existing callbacks and menu toggle', async () => {
    state.locale = 'en'; const callbacks = { onReschedule: vi.fn(), onCancel: vi.fn(), onRebook: vi.fn() }; await mount({}, callbacks);
    for (const [label, callback] of [[en.bookingCard.reschedule, callbacks.onReschedule], [en.bookingCard.cancel, callbacks.onCancel]] as const) { await open(); const button = renderer.root.findAllByType('button').find(node => textOf(node) === label)!; await act(async () => button.props.onClick(event())); expect(callback).toHaveBeenCalledWith(booking); }
    await act(async () => renderer.root.findAllByType('button').find(node => textOf(node) === en.bookingCard.rebook)!.props.onClick(event())); expect(callbacks.onRebook).toHaveBeenCalledWith(booking);
  });
  it('completed booking keeps receipt/calendar, without reschedule or cancel', async () => { state.locale = 'en'; await mount({ status: 'completed', starts_at: '2020-01-01T10:00:00Z' }); await open(); expect(links().filter(link => link.props.href.includes('/receipt'))).toHaveLength(1); expect(renderer.root.findAllByType('button').map(node => textOf(node))).not.toContain(en.bookingCard.cancel); });
  it('cancelled booking keeps a paid receipt, without a confirmed calendar download', async () => { await mount({ status: 'cancelled' }); await open(); expect(links().filter(link => link.props.href.includes('/receipt'))).toHaveLength(1); expect(links().filter(link => link.props.href.includes('/ics'))).toHaveLength(0); });
  it('unpaid and missing address omit unavailable actions', async () => { await mount({ has_receipt: false, salon: { ...booking.salon, address: '' } }); await open(); expect(links().filter(link => link.props.href.includes('/receipt') || link.props.href.startsWith('https:'))).toHaveLength(0); });
  it('closes the first of two adjacent menus before pointer or keyboard opens the second', async () => {
    state.locale = 'en';
    await act(async () => { renderer = create(<><BookingCard booking={booking}/><BookingCard booking={{...booking,id:'second-booking'}}/></>, {createNodeMock}); });
    const actions = () => renderer.root.findAllByProps({'aria-label':en.bookingCard.actions});
    await act(async () => actions()[0].props.onClick(event()));
    expect(actions().map(n=>n.props['aria-expanded'])).toEqual([true,false]);
    // A pointer inside the first popup leaves its links usable.
    await act(async () => dispatch('pointerdown', {menu:menuNodes[0]}));
    expect(actions()[0].props['aria-expanded']).toBe(true);
    await act(async () => dispatch('pointerdown', {menu:menuNodes[1]}));
    await act(async () => actions()[1].props.onClick(event()));
    expect(actions().map(n=>n.props['aria-expanded'])).toEqual([false,true]);
    expect(links().filter(n=>n.props.href.includes('/ics'))).toHaveLength(1);
    await act(async () => dispatch('focusin', {menu:menuNodes[0]}));
    await act(async () => actions()[0].props.onClick(event()));
    expect(actions().map(n=>n.props['aria-expanded'])).toEqual([true,false]);
    expect(links().filter(n=>n.props.href.includes('/ics'))[0].props.href).toContain(booking.id);
  });
  it('dismisses outside without blocking navigation and restores the trigger on Escape', async () => {
    state.locale='en'; await mount(); await open();
    let e: Event;
    await act(async () => { e=dispatch('pointerdown', {}); });
    expect(e!.defaultPrevented).toBe(false);
    expect(renderer.root.findByProps({'aria-label':en.bookingCard.actions}).props['aria-expanded']).toBe(false);
    await open();
    await act(async () => { e=dispatch('keydown', {menu:menuNodes[0]}, 'Escape'); });
    expect(e!.defaultPrevented).toBe(true);
    expect(triggerNodes[0].focus).toHaveBeenCalledOnce();
    expect(renderer.root.findByProps({'aria-label':en.bookingCard.actions}).props['aria-expanded']).toBe(false);
  });
  it('gives Rebook an invisible 44px host while retaining its visible pill and callback', async () => {
    state.locale='en'; const onRebook=vi.fn(); await mount({}, {onRebook});
    const rebook=renderer.root.findAllByType('button').find(n=>textOf(n)===en.bookingCard.rebook)!;
    expect(rebook.props.className).toContain('min-h-11');
    expect(rebook.props.className).not.toContain('bg-s-ink');
    expect(rebook.findByType('span').props.className).toContain('bg-s-ink px-4 py-2 text-[13px]');
    await act(async()=>rebook.props.onClick(event())); expect(onRebook).toHaveBeenCalledWith(booking);
  });

});
