# ErrorState

**File:** `components-legacy/ui/ErrorState.tsx`
**Layer:** 3 (semantic UI, red is the message: error == something broke)
**Status:** locked

## What it is

An inline "a fetch failed" panel with a Retry button. It is the failure-mode
companion to `EmptyState` (genuinely-no-data). Together they guarantee a data
panel never sits on an indefinite spinner: while loading show a Spinner, on
empty show `EmptyState`, on failure show `ErrorState`.

Introduced for V3 H2 (graceful empty + error states across the salon dashboard
calendar / reviews / marketing, which previously spun forever when a salon
fetch returned nothing or threw).

## API

```ts
interface ErrorStateProps {
  title: string;        // short, reassuring headline
  message?: string;     // optional one-line subtext
  onRetry: () => void;  // wired to the page's re-fetch
  retryLabel: string;   // i18n'd button label
  icon?: LucideIcon;    // default AlertTriangle (e.g. CalendarX for calendar)
  className?: string;
}
```

## Anatomy (matches approved mockup `public/solen-qa-fixes.html` §2)

- Red icon chip: `w-12 h-12 rounded-[14px] bg-s-error-bg`, icon `text-s-error` 24px.
- Headline: `font-heading text-lg text-s-ink`.
- Subtext: `text-sm text-s-ink/50` (optional).
- Retry: ink pill `bg-s-ink text-white rounded-pill` + `RotateCcw` 14px, the
  one commit action (CONTROL_ELEVATION "C": ink fill).
- Motion mirrors `EmptyState` (scale 0.97→1, 0.25s; respects reduced-motion).
- `role="alert"` for a11y.

## Use for / Don't reuse for

- **Use:** any dashboard panel whose data fetch can fail and which should offer
  a retry instead of an endless loader.
- **Don't:** route-level error boundaries. That's `ErrorFallback`
  (`components-legacy/ui/ErrorFallback.tsx`), which takes the React boundary
  `{ error, reset }` signature and lives full-viewport. `ErrorState` is a plain
  inline panel you render from a page's own `error` state.

## Tokens

`s-error` (#DC2626) / `s-error-bg` (#FEE2E2) / `s-ink` / `rounded-pill` /
`rounded-[14px]` / `shadow-warm-sm`. No hardcoded hex.
