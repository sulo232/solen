# Zero state, one line and one ink pill

**Reference:** `_measured/de-inspo-saved.json`, band 0, `/de/inspo/saved` at 390x844, signed in as
`kunde@solen.ch`, 2026-08-27 re-take. Plus a live `getBoundingClientRect` run on the same route the
same day for the rects the JSON does not carry.
**This is the state the capture proves**, and it is the only file in this folder whose numbers are
render measurements of this route.
**Component:** `app/[locale]/inspo/saved/page.tsx:86-96`, hand-written inline in the page file.
**Layer:** 1 chrome plus the one commit action.

## CORRECTION, 2026-08-27

This file previously opened with "**Not measured**: the page was still loading, so this band never
rendered and it is unknown whether the account has zero saves." Both halves are now settled and the
file is rewritten around measurement instead of source literals. The account has zero saves, which
is why the screen renders this block, and every literal the old file listed came back correct when
measured. Nothing was wrong here; it was unproven, and now it is proven.

## Layout

```
   0  +------------------------------------------------+
  16  |  (<-)  Gespeichert                             |  header row, 01-header-row.md
  68  +------------------------------------------------+
  84  |  Tippe bei einem Look auf das Herz, um ihn      |  14/400 s-ink-2, 320x46, two lines
      |  hier zu speichern.                            |
      |            (20px)                              |
 150  |  +----------+                                  |
      |  |  Inspo   |                                  |  86x44 ink pill, 15/700 white
 194  |  +----------+                                  |
      |                                                |
      |          651px of empty viewport               |  77.1% of 844
 844  +------------------------------------------------+
 900  (document ends, the extra 56 is the layout main's bottom pad)
```

`mt-4 px-4`, left aligned, top aligned. Everything sits at x = 16.

## Measured

Every row below is a render measurement at 390x844. Source for each: `json` is the re-taken capture
`_measured/de-inspo-saved.json`; `live` is a `getBoundingClientRect` and `getComputedStyle` run on
the same route on 2026-08-27.

| element | x | y | w | h | type | colour | source |
|---|---|---|---|---|---|---|---|
| subline | 16 | 84 | 320 | 46 | 14/400 Inter, line-height 22.75 | `rgb(107, 107, 107)` | json + live |
| CTA pill | 16 | 150 | 86 | 44 | 15/700 Inter Tight, line-height 22.5 | `rgb(255, 255, 255)` on `rgb(10, 10, 10)` | json + live |

CTA surface, verbatim from the capture's `cards` array: radius `9999`, box-shadow `none`, border
`none`, background `rgb(10, 10, 10)`, padding `0px 24px`, count 1, example size `86x44`. It is the
only card-shaped box the screen renders in this state.

Derived from those two rects, not separately measured:

- message to CTA gap **20px** (CTA top 150 minus subline bottom 130), which is `mt-5`
- viewport left empty below the CTA **651px**, **77.1%** of 844
- anchor ratio **22 / 14 = 1.57x**, the header row's title over this block's body text

Source literals, re-verified line by line for this file and all matching the render:

| element | literal | line |
|---|---|---|
| wrapper | `mt-4 px-4` | 86 |
| line | `max-w-xs text-[14px] leading-relaxed text-s-ink-2` | 87 |
| copy | "Tippe bei einem Look auf das Herz, um ihn hier zu speichern." | 88 |
| button | `mt-5 inline-flex h-11 items-center rounded-full bg-s-ink px-6 font-heading text-[15px] font-bold text-white transition-transform duration-150 active:scale-[0.98]` | 92 |
| button copy | "Inspo" | 94 |

`max-w-xs` is 320px and the subline measures 320 wide. `h-11` is 44 and the pill measures 44 tall.
`px-6` is 24 and the computed padding is `0px 24px`. Source and render agree on every one.

**The empty state is the truthful state, not a failed fetch.** `page.tsx:27-28` sets `items` to `[]`
when the response is not ok as well as when it is empty, so an empty screen alone does not separate
"nothing saved" from "the fetch failed". Measured on the live route: `GET
/api/discovery/saves?limit=60` returns **200** with body `{"items": []}`, item count **0**. The
screen is showing zero saves because there are zero saves.

## Tokens

- Line `s-ink-2` `#6B6B6B`, measured `rgb(107, 107, 107)`, 5.33:1 on white, AA
- Button `bg-s-ink` `#0A0A0A`, measured `rgb(10, 10, 10)`, the one commit action on the screen
- Button height 44, clearing the touch-target floor that the screen's own back tile misses at 40
- Sizes 22, 15 and 14 are all on the locked scale (checked against `ALLOWED_PX` in
  `scripts/lib/type-scale-allowed.mjs`, which cites LOCKFILE section 2 for each)

## Interaction

- Button: `router.push('/{locale}/inspo')`, the same destination as the back tile, so the empty
  screen offers two controls that do the same thing.

## Intentional deviations

- **It is hand-drawn, and the registry names this exact use case.** `COMPONENT_REGISTRY.md` line 70
  registers `EmptyStateDiscovery` and its Use column reads "profile list empties
  (favorites/stamps/looks)", naming looks. This screen composes neither that nor the `EmptyState`
  primitive (`components-legacy/ui/EmptyState.tsx`, which the CLAUDE.md states row names as locked
  and which has no registry row of its own; grep control: the same grep finds `EmptyStateDiscovery`
  at row 70 out of 112 registry rows). It writes a paragraph and a button in the page file. That is
  FLOORS LAW 9 in its exact form. Its sibling saved screen composes the registered component for the
  identical job (`app/[locale]/profile/favorites/page.tsx:82`), which makes it FLOORS LAW 8 as well.
- **The copy is informal.** "Tippe" is the du form. `COPY_LAW.md` sets formal Sie for German, and the
  sibling's lead reads "Tippen Sie auf das Herz bei einem Salon" (`favorites/page.tsx:85`). Two saved
  screens, two registers, one product.
- **The copy is hardcoded German**, not a translation key, so the other three locales render German.
  The one translated string on this screen is the back button's `aria-label`, which measured
  "Zurück" from `tBack("back")`.
- **The whole block is a deliberate minimum.** The comment at lines 79 to 85 records why: this screen
  used to be a heading and one line of text with no control at all, so the only way out was the
  bottom bar. E1 on 2026-08-11 added the button, and the comment is explicit that no new copy and no
  new value was introduced.

## Empty state

This IS the empty state. It has no sub-states: the button always renders and its destination is
fixed.

## Against the floors

Graded on measurements now, not on source reading.

| axis | floor | measured | verdict |
|---|---|---|---|
| empty-state anatomy | promise headline 18/600 + gesture subline + ink CTA + 3D icon or ghost preview, on a sunken tray | subline + CTA only | FAIL on 3 of 4 |
| dead space below the primary action | < 30% of the viewport | 651px, 77.1% | FAIL |
| message to CTA gap | <= 24px | 20px | PASS |
| one vertically centred unit | centred | top aligned at y = 84, left aligned at x = 16 | FAIL |
| imagery | >= 1/3 photographic | 0 images, 0 area | FAIL |
| display anchor | >= 28px | 22px (the header row's title) | FAIL |
| anchor ratio | >= 1.8x | 22 / 14 = 1.57x | FAIL |
| distinct sizes, this screen's own text | <= 4 | 3 (22, 15, 14) | PASS |
| distinct weights, this screen's own text | <= 2 | 2 (700, 400) | PASS |
| touch target | >= 44px | 44 | PASS |
| distinct shadows | >= 2 | 0, the pill's computed box-shadow is `none` | FAIL |

Three of those need spelling out.

**The anchor ratio is now gradeable, and it fails.** The previous version of this folder recorded the
ratio as "not gradeable, no body text exists to divide by". That was true of the skeleton capture and
of the populated grid, whose only text under the title is 12px metadata. It is not true of this
state: the empty state authors a real 14px body line, so the ratio is 22 / 14 = 1.57x against a 1.8x
floor. The fix is at the top of the screen rather than here, since 28 / 14 = 2.0x would clear it.

**The 0% imagery is real, not a measurement artefact.** The previous version wrote off the capture's
zero photographic area as the skeleton's, and for the populated grid that was correct. In this state
it is the screen: a customer with no saved looks sees no photograph at all on the product's most
photographic route. FLOORS LAW 2 exempts forms, checkout, legal and receipts by name, and an empty
state is not on that list. The sibling's zero state carries a 220px real photo and a six-tile rail
from live data, and `favorites/page.tsx:68-73` runs the query that feeds it only when the list is
empty, so the product already owns both the pattern and the query.

**One caveat on the dead-space number, stated rather than hidden.** In the measured session the
cookie-consent banner occupied y = 703 to 817, inside the region counted as empty. The banner is
transient chrome and not part of this screen, so it does not change the grade, and I did not dismiss
it to re-measure, because accepting a consent banner is not a decision I make. With consent already
given, that region renders empty.

## Provenance

- E1 2026-08-11, the empty state gained a way out; before that it had no control at all
- Owner 2026-06-23, boards ditched (`_design-system/REMOVED.md` line 33), which is why there is
  nothing to create here, only somewhere to go
- Design contract states row, the empty-state anatomy this block is graded against
- 12-app evidence behind that anatomy: `_design-system/research/TASTE_EMPTY_STATES.md`
- `_design-system/sections/saved/04-empty-state.md`, which verified the sibling's
  `EmptyStateDiscovery` literals line by line; cited here rather than duplicated
