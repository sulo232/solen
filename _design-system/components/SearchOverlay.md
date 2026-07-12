# SearchOverlay

**File:** [app/[locale]/_components/search/SearchOverlay.tsx](../../app/[locale]/_components/search/SearchOverlay.tsx)
**Layer:** 1 (chrome) — B&W surface. Hosts the few semantic colors the grammar allows: rating star (`s-star`), the date PICK (solid blue, the one allowed blue fill), open/closed badge (green/grey), and the "clear / Loeschen" link (blue).
**Status:** wip (V2-D51 / Path C, completed) — verified via `tsc` (no new type errors); visual sign-off pending.
**Design truth:** the locked mockups — [solen-search-screens.html](../../public/solen-search-screens.html) (full flow A), [solen-search-consistent.html](../../public/solen-search-consistent.html) (state grammar), [solen-search-council.html](../../public/solen-search-council.html) (selected-state treatment), [solen-search-states.html](../../public/solen-search-states.html) (loading / no-match / empty / error).

---

## Purpose

The app's single **full-page** search surface. Search is full-page everywhere
(like Fresha) — NOT a half-sheet. Opened by BOTH:

- the homepage `SearchBar` (tapping any resting row / the CTA), and
- the `SearchTemplate` sticky search bar (tapping the pill).

Both entry points render `<SearchOverlay>` and drive it via `open` / `onClose`.
This replaces the old in-place Dynamic-Island morph as the actual search target;
`SearchBar`'s island JSX is kept dormant so nothing that referenced it breaks.

## Layer

Layer 1 chrome (per §14.0 decision tree: a structural navigation/input surface).
Selected pills/tabs use the soft-grey sink (`bg-s-bg-sunken` + ink text), mirroring
`TabPill`. Input focus = a blue focus ring only (`s-accent`), never a persistent
blue fill. The primary submit is ink (`bg-s-ink`). The ONLY solid blue is the
date PICK (`SearchOverlay.tsx:840`, `bg-s-accent` on the selected day cell). No
invented hex, no arbitrary Tailwind colors.

**Correction 2026-07-12 (A3 registry audit finding 2e):** the date PICK is NOT
rendered via the shared `DateTimePicker` primitive, despite earlier text on this
page claiming so. `SearchOverlay.tsx` hand-builds its own calendar inline (local
`isoDate`/`dateLabel`/`zeitPeriod`/`dateTab` state + month-grid math at
`SearchOverlay.tsx:74-75`). This is a live violation of the locked design-contract
row "date / time: ONE `DateTimePicker` primitive... NO bespoke date UI (V3-D445)."
Flagged, not fixed here (doc-only change-set); code fix queued 2026-07-12.

## Public API

```ts
export interface SearchOverlayProps {
  open: boolean;            // controlled open state
  onClose: () => void;      // X / Escape / cancel
  locale: string;           // navigation + date formatting
  initialService?: string;  // seed (sticky bar passes the active category)
  initialCity?: string;     // seed (sticky bar passes the active city)
}
export function SearchOverlay(props: SearchOverlayProps): JSX.Element
```

## Anatomy (from the mockups)

- **Header** — `Suchen` title + close (X). When drilled into a focused picker,
  a back chevron + the picker's title (`Standort` / `Datum & Uhrzeit`).
- **Composer** — query text input (live) + Stadt (drill-in) + Zeit (drill-in).
- **Resting** (query < 2) — service quick-pick chips, recent searches, trending,
  featured salons, RESKINNED neutral category cards.
- **Typing** (query >= 2) — scope tabs (Alle / Services / Salons / Stylisten) +
  suggestion groups (services / salons / stylists).
- **Footer** — the single ink commit action (`Suchen`).
- **Data states** — loading shimmer rows / no-match ("Trotzdem suchen" + popular
  fallback, never a dead end) / error block.

## Reuse (built on existing pieces — nothing duplicated)

- `useSearchSuggest` — debounced as-you-type groups (services/salons/stylists).
- `useRecentSearches` + `recentLabel()` — recent pills; click = restore all
  fields + auto-submit (per the hook's docstring).
- ~~`DateTimePicker` (single-date variant) — the Zeit segment's day picker.~~
  **False (corrected 2026-07-12).** The Zeit segment's day picker is a bespoke
  inline calendar (`SearchOverlay.tsx:74-75,161-190,784-840`), NOT `DateTimePicker`.
  This is a V3-D445 violation (see "Layer" above) — flagged, code fix queued.
- `searchFeatured` (`FEATURED_SALONS`) + `searchTrending` (`TRENDING`) — resting content.
- Categories are **reskinned inline** (the legacy `searchCategories.ts` uses a
  dead pre-B&W terracotta/cream palette + fake counts; the mockup shows a neutral
  icon + label, no counts — so that file is intentionally NOT used here).

## URL contract (must not break)

Submit preserves the exact params the legacy `SearchBar` built:
`/{locale}/search?service=&city=&date=&period=`, plus free-text `q` when present
(>= 2 chars). Suggestion clicks: service → `/search?q=`, salon → `/salon/{slug}`,
stylist → its salon's PDP.

## i18n

All strings via `useTranslations("ui.searchOverlay")` — a sibling of
`ui.searchChrome` in `messages/{de,en,fr,it}.json` (41 keys, identical shape across
locales). EN lifts the locked-mockup copy; DE is the mockup German verbatim;
FR/IT translated to mirror nearby keys.

## A11y

`role="dialog"` + `aria-modal` + `aria-label`. Body scroll locked while open.
Escape closes the focused picker first, else the overlay. Every interactive has a
visible focus ring (`focus-visible:outline-s-accent`). Icons are lucide-react with
`aria-hidden`.

## Don't

- Don't render the results list here (that's `SearchTemplate` / `SearchResults`).
- Don't add a half-sheet variant — full-page is the locked decision.
- Don't reintroduce `searchCategories.ts`'s palette or counts.
