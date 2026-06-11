# OfflineBanner

**File:** `app/[locale]/_components/layout/OfflineBanner.tsx`
**Layer:** 3 (semantic connectivity status)
**Status:** shipped 2026-06-11 (mockup 10 "offline", implemented as a banner)

## API
No props. Mounted once in `app/[locale]/layout.tsx` next to `<Toaster />`.

## Behavior
- Listens to `window` online/offline events (+ initial `navigator.onLine`).
- Offline: fixed bottom ink bar, WifiOff icon, "Keine Verbindung. Wir verbinden automatisch neu." (×4 locales, inline COPY map like TipFlow).
- Reconnect: flips to `bg-s-success` "Wieder online." for 2.2s, then unmounts.
- `role="status" aria-live="polite"`, safe-area padded, z-90 (under modals at z-100).

## Use for / don't reuse for
- USE: nothing else — it is the single global connectivity surface.
- DON'T: per-request error states (those use FormFieldError / AlertBanner / §14.4 copy).

## Why a banner, not a page
A website cannot serve an offline ROUTE without a service worker + cache (complexity,
stale-content bugs). What users actually experience is a failed fetch mid-session; a
status banner explains it honestly at ~5% of the cost. Decision 2026-06-11.
