<!-- exists-check: net-new vs airbnb--home-mobile.md, airbnb--home-search-chrome.md,
     airbnb--category-switch.md because none of them opens the actual STAYS LIST under a search
     (home-mobile covers the home feed's rails, home-search-chrome and category-switch cover the
     search input/pill chrome, not the result list body or its map button). This file adds the
     search-results card anatomy and the map-button recipe; it reuses no numbers from those files. -->

# Airbnb, mobile web search results (stays list)

REF: airbnb / web-mobile / search-results / live-DOM + screenshot

## Identity

- **Brand / platform / surface:** Airbnb, web in mobile view, the stays list under a location
  search (a card feed with a persistent bottom "map" button, not the home page's horizontal rails).
- **Source:** `https://www.airbnb.com/s/Zurich--Switzerland/homes`, logged out.
- **Viewport:** 390x844, deviceScaleFactor 3, iPhone Safari user agent, locale en-US.
- **Date:** 2026-09-05.
- **Method:** repo Playwright, `getComputedStyle` + `getBoundingClientRect` on live DOM. Stills at
  `public/_pixel-refs/airbnb/search-results/` (`search-results-390.png` viewport,
  `search-results-390-full.png` full scroll). Desktop-viewport Mobbin stills were also pulled for
  cross-reference on the map-button/filter chrome (cited inline, platform "web" but NOT mobile
  viewport, so used only to confirm the map-toggle EXISTS, not for any pixel value) at
  [list+map split](https://mobbin.com/screens/c91c2a78-6594-4778-93da-b02cc994f014) and
  [map-pin callout card](https://mobbin.com/screens/4f8dca21-ac00-4bd0-88df-5e1f0b1f9554). No login.

## Philosophy

At mobile width the list and the map are never shown together (that split-screen is a desktop-only
layout, confirmed by the Mobbin desktop stills above). Mobile gets a full-width vertical card feed
with a single floating pill labeled "Google map" pinned near the top, functioning as a mode
switch rather than a persistent chrome element. Cards carry no shadow at all, their entire
separation comes from a 20px corner radius plus vertical whitespace between cards; flatness here is
deliberate, matching the home feed's rails (already documented in `airbnb--home-mobile.md`).

## Measured

| element | value | tag |
|---|---|---|
| card container radius | **20px** | verified |
| card container shadow | **none** (flat, no elevation) | verified |
| card width | 342px (390 viewport minus 24px side margins x2, minus a `w=342` measured box, i.e. edge-to-edge minus the standard 24px gutter) | verified |
| card photo | 342 x 257px, ratio **1.331** (wider-than-tall, unlike the home feed's near-square 1.053 rail cards) | verified |
| card vertical span (photo + text stack) | 406px for a card with a subtitle line, 380px for a card without one (content-driven, not fixed) | verified |
| card text stack, first line ("Room in Zurich" / "Superhost") | 14px / 400, `rgb(34,34,34)` | verified |
| price line | 15px / 500 (one sample) and 15px / 400 (another sample, format "Fr. 3,176"), `rgb(34,34,34)`; weight appears to vary by whether the price is a per-night or a total-stay figure in this result set, not confirmed as a fixed rule | verified values, pattern assume |
| card-to-card gap (y-delta between successive card tops) | ~445px between the first two sampled cards' container tops (content-length-dependent like the review-row cadence in `airbnb--reviews.md`, not a fixed row height) | verified for this sample, not claimed as a fixed constant |
| "map" toggle button | pill, `background: rgb(239,239,239)` (a light warm-neutral grey, distinct from pure white), `padding: 1px 6px`, height 24px, text "Google map Showing 20 stays." (accessible label folded into visible text at this breakpoint) | verified |
| page background | white | verified |

## Not measured

- Exact card-to-card vertical gap as a fixed token: the two deltas observed (445px, ~450px) both
  include variable-height text content above and below, so no clean single gap number could be
  isolated without also subtracting text-block height per card, not attempted in this pass.
- Whether cards ever show a "Guest favorite" badge or heart/save icon at this mobile breakpoint:
  the specific listing sampled did not render one, and the desktop Mobbin stills (which do show a
  "Guest favorite" ribbon and a heart icon top-right of each card) were not used to backfill a
  mobile-web number, since that would be reading one platform's chrome onto another's measurement.
  Stated as a gap: mobile-web's badge/heart presence is unconfirmed either way.
- Filter bar / sort control specific to search results (distinct from the category pills already
  covered in `airbnb--category-switch.md`) was not captured this pass; it did not appear in the
  first-viewport DOM query used.

## Port map

| Airbnb value | Our token / value | inside our lock? |
|---|---|---|
| Card radius 20px | Our `SalonCard` uses `rounded-card` conceptually for entity cards (16px) though card imagery itself commonly runs a distinct radius; LOCKFILE's individual entity-card radius is locked at **16px** | Airbnb is 4px larger; a direct radius swap would break the locked 16px entity-card value. Owner call if closing the gap matters. |
| Card shadow: none, flat | Our SalonCard lock is `shadow-whisper` + no border (design contract "shadow / depth" row) | Direct conflict: Airbnb ships zero elevation on this exact card type, we ship a whisper lift. Named below. |
| Card photo ratio 1.331 (wider) | Our imagery floor targets ~1/3 photographic area at 390x844 but does not lock a single card ratio; `airbnb--home-mobile.md` already flagged home-feed cards at 1.053 against our 1.25 | A third data point (1.331) confirms Airbnb varies card ratio by SURFACE (near-square on the home rail, wider on the search list), not a single fixed ratio system-wide. Worth naming as the actual pattern rather than porting one ratio everywhere. |
| Map toggle pill: `rgb(239,239,239)` fill, compact height 24px | Our filter pill selected-state uses `bg-s-bg-sunken` (#F4F4F5); `rgb(239,239,239)` is close in the same light-grey neutral family | No conflict, same family, would not need a new token. |
| Price line 15px | Not one of our locked text sizes (name 14, meta 12, body 14, CTA 15) | 15px already exists in our scale as the CTA size, so a price-at-15 is not a new value, just an unusual reuse (price is normally styled at our 14px body/name size). Note, not a conflict. |

## Conflicts

- **CONFLICT [card elevation]: Airbnb's search-result cards carry zero shadow, pure flat +
  radius + whitespace. Solen's SalonCard lock is `shadow-whisper`, no border (design contract
  "shadow / depth" row, and the Edge-visibility floor requires SOME perceivable boundary: sunken
  bg, flush photo edge, hairline, or elevation step).** A flat white-on-white card with only a
  20px radius and no shadow, no border, and no sunken tray beneath it would fail our own
  Edge-visibility floor (FLOORS LAW 4) outright, since Airbnb's cards sit on plain white with
  nothing but generous gutter width separating them (confirmed adequate at their 390-wide layout,
  not proven adequate at ours without a render test). Copying "no shadow" alone, without also
  copying Airbnb's specific gutter width, risks a dead-grey/no-boundary failure our floors law was
  written to catch. Owner call, and if approved this needs a measured gutter-width match, not just
  a shadow removal.
- **CONFLICT [radius]: 20px against our locked 16px entity-card radius.** Same shape as the
  listing-page and checkout button conflicts already logged elsewhere in this capture: Airbnb
  consistently runs a few px larger than our locked family. A system-wide "Airbnb runs +4px on
  card radius" observation, not independent per surface.
