# FilterSheet

**File:** `app/[locale]/_components/search/FilterSheet.tsx`
**Layer:** 1 (chrome) — B&W. Hosts no semantic color; pure search-result filter UI.
**Status:** wip (V3-D351, 2026-05-28) — verified via `tsc`; visual sign-off pending.

---

## Purpose

The full filter sheet behind the round `SlidersHorizontal` button in the search
chrome (`SearchTemplate`). Holds the filter controls that don't fit the inline
chip row: a segmented **Sortieren** control, **Verfuegbarkeit** chips, and
**Bewertung** chips, with a Zuruecksetzen + "{count} Salons anzeigen" footer.

It is a **controlled, stateless view over the URL params** — it owns no filter
state. Every control writes the SAME `searchParams` keys the inline chip row
writes, so the two are a single source of truth: tapping "Offen jetzt" in the
chip row and in the sheet flip the exact same `open_now` param. Open/close state
lives in `SearchTemplate` (`filterSheetOpen`) and arrives as `isOpen` / `onClose`.

## Layer

Layer 1 chrome (per §14.0 decision tree: it's a structural filter affordance, not
a semantic-state surface). No pastel, no accent fills. Active chips use the ink
fill (`bg-s-ink text-white`), inactive use white + `s-border` hairline — same B&W
contrast model as `TabPill` and the chip row.

## Public API

```ts
<FilterSheet
  isOpen={boolean}
  onClose={() => void}
  resultCount={number}              // live total for the apply button
  labels={FilterSheetLabels}        // all strings, resolved by caller via next-intl
  sortOptions={readonly {value,label}[]}  // reuse SearchTemplate SORT_OPTIONS
  sort={string}
  onSortChange={(value: string) => void}
  openNow={boolean}
  instantBookable={boolean}
  walkIn={boolean}
  deals={boolean}
  onToggleBoolean={(key: string, currentlyActive: boolean) => void}
  minRating={number | null}
  onMinRatingChange={(value: string | null) => void}
  onReset={() => void}              // clears all filter params
/>
```

All labels are injected by the caller (`SearchTemplate`) from next-intl
(`ui.searchChrome` + `ui.filterSheet`) so the component holds no hardcoded copy
and no locale array.

## Controls (only API-supported params are wired)

| Group | Control | Writes | API support |
|---|---|---|---|
| Sortieren | segmented control | `sort` | yes (rating/price/newest/distance) |
| Verfuegbarkeit | chips | `open_now` *, `instant_bookable`, `walk_in`, `deals` | instant/walk_in/deals = yes |
| Bewertung | chips 4.5+ / 4.0+ / Egal | `min_rating` | yes |

\* `open_now` is shown for parity with the chip row (same param, single source of
truth) but is **not filtered server-side yet** — the search API ignores it and
returns the full set until an hours-aware filter lands.

**Omitted on purpose:**
- **Preis** — `min_price`/`max_price` are read by `/api/salons` but never applied
  (route.ts: "we skip price filter on the salons level"). No working param → no
  control.
- **In deiner Naehe** — the API takes `lat`/`lng` (not a `distance` param) and
  there's no geolocation-capture UI in scope. Omitted.
- **Haartyp / Ausstattung** — no DB columns. Omitted per spec.

## Visual signature

- Mobile: bottom `Sheet` (auto height), grab handle, header (title + close X),
  scrollable body of grouped controls, sticky `SheetCTARow` (reset + apply).
- Desktop (≥768px): `Modal` (`size="md"`) via `useResponsiveOverlay()`, same
  groups, `ModalFooter layout="between"` (reset left, apply right).
- Group title = Section-H2 recipe (16px/600/ink, `tracking-[-0.01em]`).
- Chips = Secondary-CTA at rest → Primary-CTA ink fill + leading `Check` when on,
  36px min height, `rounded-pill`.
- Segmented control = `bg-s-bg-sunken` track, active segment = white pill +
  micro-shadow.
- Apply button = Primary-CTA (`bg-s-ink text-white`, 15px/500), shows live count.

## Motion

Inherited from the `Sheet` / `Modal` primitives: sheet slides up 600ms ease-glide
(exit 200ms ease-snap); modal scale+fade 250ms ease-snap. Both collapse to
opacity-only under `prefers-reduced-motion`. Chip/segment state swaps =
`duration-150 ease-glide` + `active:scale` press.

## Do / Don't

- **Do** keep it a stateless view — all state stays in the URL via the caller's
  param writers.
- **Do** add new groups only when the param is actually applied by the search API.
- **Don't** add a control whose param the API ignores (Preis, distance) — it
  silently does nothing and lies to the user.
- **Don't** introduce sheet-local filter state — it would desync from the chip
  row.
- **Don't** add accent color — Layer 1 B&W only.

## Edge cases

- Reset clears `open_now`, `instant_bookable`, `walk_in`, `deals`, `min_rating`,
  `sort` and drops `page`. The sheet stays open after reset (the count updates).
- Apply just closes the sheet — params write on every tap, so filtering is already
  live; "apply" is a confirmation affordance, not a commit.
- `resultCount` reflects the current fetched `total`; while the list is refetching
  it shows the last known total (no flicker to 0).

## Provenance

- V3-D351 (2026-05-28): created during the Uber-style search-chrome rework.
  STRUCTURE from `public/solen-search-filters-variants.html` ("The shared Filter
  sheet"); AESTHETIC from LOCKFILE §1 tokens + §2.5 type roles. Reuses the `Sheet`
  primitive (+ `Modal` on desktop) rather than a bespoke overlay.

## Related

- `Sheet` / `Modal` / `useResponsiveOverlay` (primitives) — the overlay shells.
- `SearchTemplate` — the sole consumer; owns open state + param writers + the
  inline chip row that shares the same params.
- `TabPill` — the same active-ink / inactive-hairline chip grammar.
