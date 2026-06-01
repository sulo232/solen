# SalonResultCard

**File:** `app/[locale]/_components/search/SalonResultCard.tsx`
**Layer:** 1 (chrome) + hosts Layer-3 children (HeartButton, star rating)
**Status:** wip (visual not yet user-confirmed)
**Added:** V3-D349 · **Rewritten:** V3-D350 · **Polished:** V3-D354 (dropped "Beliebt" badge + review-count) · **List variant:** V3-D355 (`?layout=list`), 2026-05-28

## What it is

The clean **Airbnb-style card** for the category / search results **2-column grid**
(`/coiffeur` etc. — now the DEFAULT render, no flag). Distinct from the homepage
`SalonCard` (which stays compact for horizontal feeds — confirmed via blast-radius
audit; do NOT merge them).

Anatomy (2-column grid, mobile-first):
rounded ~1:1 photo (`rounded-[22px]` + floating shadow + hover lift, Heart overlay
top-right) -> **name + ★rating** inline -> grey meta line (`city · distance`;
category dropped on category routes per V3-D370, kept on `/search`) -> `ab X CHF`
(calm — number not bold) -> **next-available slot pill** (Clock + ink, e.g.
"heute 16:00").

**"Booking-intent" card (V3-D371, user pick "B" 2026-05-29):** the grid card shows
the single next-available slot pill — the hook that makes a category page read
"book today" rather than "directory" (Solen's "Termin in 30 Sekunden" pitch, =
Fresha's service-results signal). `nextSlot` is computed in SearchTemplate
(`nextSlotLabel(services, locale)`) and the pill **graceful-hides** when a salon
has no upcoming slot. **NO inline service ROWS** (the full service list stays on
the salon PDP, a tap away) — just the one slot signal. This sits between the
V3-D349 dense Fresha booking card (dropped) and the V3-D350 bare minimal card
(too empty): minimal card + one booking signal.

## Variants (V3-D355)

`variant="card"` (**DEFAULT since V3-D372**, 2026-05-29) = full-width LANDSCAPE
card (photo-top `aspect-[3/2]`, then name + ★rating + meta + price + next-slot
pill), 1-col on mobile / 2-3 col desktop. This is the category/search "results
page" shape (Fresha/Airbnb pattern) — per user, the 2-col square grid read too
"browsey" for a category page. `variant="grid"` = the square 2-col Airbnb card,
now opt-in via `?layout=grid` (escape hatch). `variant="list"` = a Fresha-style
row (photo-left 104px `rounded-[16px]` + floating shadow, text-right: name +
★rating, meta, price, slot; Heart top-right of the ROW), opt-in behind
`?layout=list`, PAIRS WITH THE MAP split (one row per pin). Same card family,
only the shape changes. **Council doctrine (V3-D355):** consistency = ONE card
family with container/shape varied by surface intent, NOT identical layout
everywhere. (NB: the component's own prop default is still `"grid"`, but
SearchTemplate passes `"card"` explicitly unless `?layout=grid|list` is set.)

## Dual-axis

- **STRUCTURE = Airbnb** search card, per explicit user direction 2026-05-28 — a
  conscious §10.5 divergence from the Fresha-structure default, user-approved.
  (Mockup: `public/solen-airbnb-search-variants.html`, Column B = 2-col small grid.)
- **AESTHETIC = LOCKFILE.** Rule A13: the salon NAME is the ONE ink anchor
  (`<CardName>`); rating, meta, price all recede (`<CardMeta>`).
  **V3-D353 (2026-05-28): photo treatment matched to the homepage `SalonCard` so the
  two read as ONE card family — `rounded-[22px]` + floating shadow
  (`0_20px_40px_rgba(0,0,0,0.04)`) + hover lift/scale, `next/Image`, and monogram
  fallback. Supersedes the V3-D350 flat `rounded-card`
  look, per user "keep it consistent with the locked homepage." (§11 search-card
  rounding exception now reads 22px, same as the homepage card.)** Star `#FFC32B`.
  Heart `#FF3366` (inside HeartButton). B&W chrome, Inter Tight + Inter (NEVER Geist), no pastel, no eyebrow.

## API

`<SalonResultCard slug name locale rating? photoUrl? category? address? city? distanceMeters? priceFromCHF? isSaved? salonId? variant? />`

- `variant`: `"grid"` (default, square card) or `"list"` (Fresha-style row). See Variants above.

- Rating shows just the average (`★ 4.8`), NO review-count - matches the homepage
  `SalonCard` (V3-D354, per user "drop the (4)"). The "Beliebt" popularity badge was
  removed in the same pass (user is ditching badges).
- Per-locale `from` labels (`ab`/`from`/`des`/`da`) are an inline record mirrored
  in `messages/{de,en,fr,it}.json` under `ui.searchChrome`.

## Graceful degradation (sparse data)

- No rating -> rating row omitted. No `priceFromCHF` -> price line omitted.
- No `distanceMeters`/`city` -> those meta bits drop from the meta line.
- No `photoUrl` -> monogram fallback (salon initial, `font-display` black on
  `s-bg-sunken`). V3-D353 matches the homepage SalonCard's fallback (was a blank grey
  tile pre-D353).

## Use for / Don't reuse for

- **Use:** the category/search results 2-column grid (SearchTemplate, default).
- **Don't:** homepage feeds / horizontal scrollers (use `SalonCard`); the salon PDP.

## Universal-components (V3-D205)

One code path for every category; `category` is a prop. No `if category === 'X'`
branches.
