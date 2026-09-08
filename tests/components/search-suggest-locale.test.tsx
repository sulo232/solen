import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSearchSuggest, type SearchSuggestState } from '@/app/[locale]/_components/homepage/useSearchSuggest';
const locale = vi.hoisted(() => ({ value: 'en' }));
vi.mock('next-intl', () => ({ useLocale: () => locale.value }));
let renderer: ReactTestRenderer, result: SearchSuggestState;
const fetchMock = vi.fn();
function Probe({ query = 'hair', city = 'basel', category = 'coiffeur', debounceMs }: { query?: string; city?: string; category?: string; debounceMs?: number }) { result = useSearchSuggest(query, { city, category, debounceMs }); return null; }
async function mount(props = {}) { await act(async () => { renderer = create(<Probe {...props} />); }); }
async function tick(ms: number) { await act(async () => vi.advanceTimersByTimeAsync(ms)); }
beforeEach(() => { vi.useFakeTimers(); locale.value = 'en'; fetchMock.mockReset().mockResolvedValue({ ok: true, json: async () => ({ services: [] }) }); vi.stubGlobal('fetch', fetchMock); });
afterEach(async () => { if (renderer) await act(async () => renderer.unmount()); vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('actual suggest hook locale and retained request lifecycle', () => {
  it('sends current locale with trimmed query and scopes after the default debounce', async () => {
    locale.value = 'fr'; await mount({ query: '  hair  ' }); await tick(299); expect(fetchMock).not.toHaveBeenCalled(); await tick(1);
    const params = new URL(fetchMock.mock.calls[0][0], 'https://solen.test').searchParams;
    expect(Object.fromEntries(params)).toEqual({ q: 'hair', locale: 'fr', city: 'basel', category: 'coiffeur' });
    expect(result.results).toEqual({ services: [], salons: [], stylists: [] }); expect(result.loading).toBe(false);
  });
  it('locale-only change aborts in-flight request and reloads with the new locale', async () => {
    fetchMock.mockImplementationOnce((_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })))));
    await mount(); await tick(300); const firstSignal = fetchMock.mock.calls[0][1].signal;
    locale.value = 'it'; await act(async () => renderer.update(<Probe />)); expect(firstSignal.aborted).toBe(true); await tick(300);
    expect(fetchMock).toHaveBeenCalledTimes(2); expect(fetchMock.mock.calls[1][0]).toContain('locale=it'); expect(result.error).toBeNull();
  });
  it('city/category changes cancel the prior timer and use custom debounce', async () => {
    await mount({ debounceMs: 20 }); await tick(10);
    await act(async () => renderer.update(<Probe city="zurich" category="nails" debounceMs={20} />)); await tick(19); expect(fetchMock).not.toHaveBeenCalled(); await tick(1);
    const url = fetchMock.mock.calls[0][0]; expect(url).toContain('city=zurich'); expect(url).toContain('category=nails'); expect(fetchMock).toHaveBeenCalledOnce();
  });
  it('short query clears state and unmount cancels pending requests', async () => {
    await mount({ query: ' x ' }); await tick(300); expect(fetchMock).not.toHaveBeenCalled(); expect(result.loading).toBe(false);
    await act(async () => renderer.update(<Probe />)); await act(async () => renderer.unmount()); await tick(300); expect(fetchMock).not.toHaveBeenCalled();
  });
});
