import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';
import InputModality from '@/app/_components/InputModality';
import { TextInput } from '@/app/[locale]/_components/primitives/TextInput';
import { Textarea } from '@/app/[locale]/_components/primitives/Textarea';
import { Select } from '@/app/[locale]/_components/primitives/Select';
let root: Root | undefined;
let host: HTMLDivElement;
async function mount(content: React.ReactNode = <InputModality />) {
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root!.render(content));
}
const key = async (value: string, target: EventTarget = document.body, extra = {}) => act(async () => { target.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, ...extra })); });
const pointer = async (target: EventTarget = document.body) => act(async () => { target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, buttons: 1, pointerType: 'mouse' })); });
afterEach(async () => { if (root) await act(async () => root!.unmount()); root = undefined; host?.remove(); document.documentElement.removeAttribute('data-input'); vi.restoreAllMocks(); });
test('actual shared tracker switches pointer, keyboard and back without rendering markup', async () => {
  await mount(); expect(host.innerHTML).toBe('');
  await pointer(); expect(document.documentElement.dataset.input).toBe('pointer');
  await key('Tab'); expect(document.documentElement.dataset.input).toBe('keyboard');
  await pointer(); expect(document.documentElement.dataset.input).toBe('pointer');
  await key('ArrowDown'); expect(document.documentElement.dataset.input).toBe('keyboard');
});
test('typing after pointer focus does not turn a text field into keyboard-navigation state', async () => {
  await mount(<><InputModality /><input /></>);
  const input = host.querySelector('input')!;
  await pointer(input); await act(async () => input.focus());
  await key('a', input); expect(document.documentElement.dataset.input).toBe('pointer');
  await key('Tab', input); expect(document.documentElement.dataset.input).toBe('keyboard');
});
test('modified shortcut does not replace pointer modality', async () => {
  await mount(); await pointer(); await key('k', document.body, { ctrlKey: true });
  expect(document.documentElement.dataset.input).toBe('pointer');
});
test('unmount restores prior page attribute and later events cannot rewrite it', async () => {
  document.documentElement.dataset.input = 'previous-owner';
  await mount(); await pointer(); await key('Tab');
  await act(async () => root!.unmount()); root = undefined;
  expect(document.documentElement.dataset.input).toBe('previous-owner');
  await pointer(); expect(document.documentElement.dataset.input).toBe('previous-owner');
});
test('StrictMode setup and cleanup retains one working bridge', async () => {
  await mount(<React.StrictMode><InputModality /></React.StrictMode>);
  await pointer(); await key('Tab'); expect(document.documentElement.dataset.input).toBe('keyboard');
  await act(async () => root!.unmount()); root = undefined;
  expect(document.documentElement.hasAttribute('data-input')).toBe(false);
});
test('server render emits no markup and does not mutate html', () => {
  document.documentElement.dataset.input = 'server-sentinel';
  expect(renderToString(<InputModality />)).toBe('');
  expect(document.documentElement.dataset.input).toBe('server-sentinel');
});
test('shared field defaults preserve colors while tone errors and reveal handlers remain', async () => {
  await mount(<><TextInput id="plain" /><TextInput id="error" tone="error" /><Textarea id="notes" /><Select id="choice"><option value="a">A</option></Select><TextInput id="password" type="password" revealable revealLabels={{show: 'Show password', hide: 'Hide password'}} /></>);
  for (const id of ['plain', 'notes', 'choice']) expect(host.querySelector(`#${id}`)!.className).not.toContain('focus-visible:border-s-ink');
  expect(host.querySelector('#plain')!.className).not.toContain('focus-visible:bg-s-bg-base');
  expect(host.querySelector('#error')!.getAttribute('aria-invalid')).toBe('true');
  expect(host.querySelector('#error')!.className).toContain('border-s-error');
  const button = host.querySelector('button')!;
  expect(button.getAttribute('aria-label')).toBe('Show password');
  await act(async () => button.click());
  expect(host.querySelector('#password')!.getAttribute('type')).toBe('text');
  expect(button.getAttribute('aria-label')).toBe('Hide password');
});
test('touch followed by an external keyboard uses events rather than device capabilities', async () => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: vi.fn(() => ({ matches: true })) });
  await mount();
  await act(async () => document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' })));
  expect(document.documentElement.dataset.input).toBe('pointer');
  await key('Tab'); expect(document.documentElement.dataset.input).toBe('keyboard');
  expect(window.matchMedia).not.toHaveBeenCalled();
});
test('a stopped bubbling keyboard event still reaches the existing capture tracker', async () => {
  await mount(<><InputModality /><button onKeyDown={event => event.stopPropagation()}>Control</button></>);
  await pointer(); await key('ArrowRight', host.querySelector('button')!);
  expect(document.documentElement.dataset.input).toBe('keyboard');
});
test('hydrating the null bridge preserves server markup without recoverable errors', async () => {
  const { hydrateRoot } = await import('react-dom/client');
  const content = <><InputModality /><button>Continue</button></>;
  host = document.createElement('div'); host.innerHTML = renderToString(content); document.body.append(host);
  const recover = vi.fn(); const before = host.innerHTML;
  await act(async () => { root = hydrateRoot(host, content, { onRecoverableError: recover }); });
  expect(host.innerHTML).toBe(before); expect(recover).not.toHaveBeenCalled();
});

test.each((['error', 'warning', 'success'] as const).flatMap(tone => ['semantic-input', 'semantic-area', 'semantic-select'].map(id => ({ tone, id }))))('$id $tone keeps resting tone through pointer focus and keyboard navigation', async ({ tone, id }) => {
  await mount(<><InputModality /><TextInput id="semantic-input" tone={tone} /><Textarea id="semantic-area" tone={tone} /><Select id="semantic-select" tone={tone}><option value="one">One</option><option value="two">Two</option></Select></>);
  const field = host.querySelector(`#${id}`) as HTMLElement;
  const resting = field.className;
  const tokens = resting.split(/\s+/);
  expect(tokens).toEqual(expect.arrayContaining([`border-s-${tone}`, 'ring-1', 'ring-inset', `ring-s-${tone}`]));
  expect(tokens.filter(token => /focus-visible:(border|bg|ring|outline)-(s-error|s-warning|s-success)/.test(token))).toEqual([]);
  expect(field.getAttribute('aria-invalid')).toBe(tone === 'error' ? 'true' : null);
  await pointer(field); await act(async () => field.focus());
  expect(document.documentElement.dataset.input).toBe('pointer');
  expect(field.className).toBe(resting);
  await key('Tab', field);
  expect(document.documentElement.dataset.input).toBe('keyboard');
  expect(field.className).toBe(resting);
});
