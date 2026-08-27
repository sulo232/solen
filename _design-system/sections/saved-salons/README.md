# /{locale}/profile/favorites section docs

Per-section specs for the saved-SALONS screen, measured on `/de/profile/favorites` at 390x844,
signed in, on 2026-08-27. Source of every number below:
`_design-system/sections/_measured/saved-salons.json`. Each file follows the `salon-detail` shape:

- **Reference:** where the numbers came from
- **Component:** file path of the React component
- **Layer:** 1 chrome / 2 interaction / 3 semantic
- **Layout:** the structural target with an ASCII sketch, numbers measured rather than eyeballed
- **Measured:** the band's box, surface, text roles and card anatomy, verbatim from the JSON
- **Tokens:** colour, font and spacing tokens
- **Interaction:** what each tap does
- **Intentional deviations:** places the shipped code differs from a locked row, with the reason
- **Empty state:** what renders with no data
- **Against the floors:** which floors this band passes and fails, with the number
- **Provenance:** the locks and dated owner decisions behind the section

## This folder supersedes `_design-system/sections/saved/`

The old one measured a page that does not exist. `_measured/saved.json` was captured at
`/de/profile/saved`, which is not a route, so the run followed the localized 404 and filed it as
the saved screen. That folder's own README caught it and marked every number "not measured", so
its files are source readings rather than wrong measurements. What it settled from source is
carried across here and cited rather than re-derived. Do not read the two folders as alternatives:
this one has the render, that one does not.

`scripts/measure-sections.mjs` has since been corrected. `SPECLESS_SCREENS` now carries
`{ folder: "saved-salons", route: "/de/profile/favorites", auth: true }` and
`{ folder: "saved-looks", route: "/de/inspo/saved", auth: true }`, so a later run cannot re-measure
the 404.

## The screen's job

One sentence, because FLOORS LAW 10 asks for it: **let a returning customer find a salon they
already chose, and get to its page.** Everything on the screen is measured against that sentence.
Nothing here fails it: there is no search bar, no filter, no sort and no tab row. This screen is
thin on purpose, and `saved/CORPUS.md` is the evidence (zero of 131 saved screens surveyed grouped
their saves by anything, and chronological newest-first is the only ordering it could observe).

## Sections (top to bottom on mobile, 390x844)

| # | File | Section | Component | JSON band |
|---|---|---|---|---|
| 1 | `01-header-title.md` | Global sticky header, "Favoriten" title | `layout/Header.tsx:472,804` | 0 |
| 2 | `02-count-line.md` | The count line, "2 Salons" | `profile/FavoritesList.tsx:98-100` | none, see below |
| 3 | `03-saved-grid.md` | The saved-salon grid and its card | `FavoritesList.tsx:101-107` + `components-legacy/SalonCard.tsx` | 2, plus 3 and 5 |
| 4 | `04-bottom-nav.md` | Floating bottom nav, fixed chrome | `layout/BottomNav.tsx` | 4 |
| 5 | `05-empty-state.md` | Zero state, banner + hint + top-rated rail | `profile/EmptyStateDiscovery.tsx` | none, not rendered in this capture |

## Six JSON bands, five files

**Band 1 is `main`.** It is the all-containing element from `app/[locale]/layout.tsx:115`, so its
text roles and card list are the union of everything inside it. A file for it would restate the
screen. Its numbers are used in two places where no child band carries them: the count line's
geometry in `02` and the screen-wide totals in this README.

**Bands 3 and 5 are the same element twice**, once per card:
`div.flex items-start justify-between gap-2`, the name-plus-rating row inside `SalonCard`
(`components-legacy/SalonCard.tsx:301`). They were promoted only because each leads with an `h3`.
Both fold into `03-saved-grid.md`, which reads them as the two instances of one card rather than as
two sections.

**Two files carry no band.** The count line is a bare `<p>` with no heading and no landmark tag, so
the band walker cannot promote it; its measured role lives inside band 1 and its box is derived in
`02`. The empty state did not render at all in this capture, because the signed-in test account has
two favourites; `05` is a source spec, and it says so in its Measured block.

## Screen totals, and one correction to them

Verbatim from `saved-salons.json`:

| axis | measured |
|---|---|
| document height | 1024 at a 844 viewport, so 180px of scroll |
| distinct font sizes | 6: 18, 16, 15, 14, 13, 12 |
| distinct weights | 3: 400, 600, 700 |
| text elements | 21 |
| weight >= 600 | 7, so 33.33% |
| photographic area | 205,056 px across 2 images, both inside the first viewport |

**Five of those 21 text elements are not this screen.** The bands account for 16 elements
(header 1, main 11, nav 4) and 4 of the bold ones. The residue is 5 elements, 3 of them at weight
>= 600, and the only size unique to it is 16. Both come from `app/[locale]/layout.tsx`:

- the `sr-only` skip link (`layout.tsx:70-75`) inherits the 16px body size and has a 1x1 rect, and
  the extractor drops only `display:none`, `visibility:hidden` and `opacity:0`, so it counts
- the cookie-consent banner (`primitives/CookieConsent.tsx:265+`) renders on mobile as a 15/600
  title, a 13/400 body line and two 14/600 buttons, the third button being `hidden md:inline-flex`

That is 5 elements and exactly 3 at weight >= 600. **Control, run before trusting it:** the same
arithmetic on `saved-looks.json`, a screen with completely different content, leaves the same
residue of 5 elements and 3 bold, and the same otherwise-absent sizes 16, 15, 14 and 13. Two
screens, one residue, one source.

So the screen has two honest readings and both are given in every `Against the floors` block:

| axis | as captured | this screen's own |
|---|---|---|
| distinct sizes | 6 | 5 (18, 15, 14, 13, 12) |
| weight >= 600 share | 7/21 = 33.33% | 4/16 = 25.00% |
| distinct weights | 3 | 3 |

**The brief for this job said six sizes against a ceiling of four. That is the captured reading and
it is correct as written. The screen's own count is five.** Five still fails the ceiling, so the
verdict does not move, but the number does.

## Against the floors, whole screen

Ladder target, from `_plans/DESIGN_CONSISTENCY_2026-08-27.md` lines 231 to 243, read off
`/de/salon/cuts-and-culture` the same day: anchor 30px, body 14px, ratio 2.14x, 5 distinct sizes,
weight >= 600 at 30%, at least 2 distinct shadows (the salon page has 3), photographic share 34.66%.

| axis | floor / ladder | measured here | verdict |
|---|---|---|---|
| display anchor | >= 28px, house value 30 | **18px** (the header title, the largest text on the screen) | FAIL |
| anchor ratio | >= 1.8x, ladder 2.14x | **18/14 = 1.29x** | FAIL |
| distinct sizes | <= 4 (CLAUDE.md, LOCKFILE 12) | 6 captured, 5 own | FAIL both readings |
| distinct sizes | <= 5 (the ladder's own wording) | 5 own | PASS on the ladder, FAIL on the ceiling |
| distinct weights | <= 2 | 3 | FAIL |
| weight >= 600 share | <= 30% | 33.33% captured, 25.00% own | FAIL captured, PASS own |
| photographic share | >= 33%, ladder 34.66% | **62.30%** (205,056 of 329,160) | PASS |
| distinct shadows | >= 2, ladder 3 | 1 | FAIL |
| density, units in the first viewport | >= 4 plus a cropped next item | 1 whole card, 1 cropped | FAIL on count, PASS on the scroll promise |
| sticky commit action | required only on a commit-bearing screen | none, and none is wanted here | not applicable |

**The ceiling and the ladder disagree at exactly five sizes**, and this screen sits on the seam.
CLAUDE.md NEVER-AGAIN floor 2 and LOCKFILE 12 say at most 4 distinct sizes; the ladder table says
"at most 5, and at most 4 inside any 8px window" and the benchmark screen measures 5. Both are
quoted above rather than reconciled, because reconciling them is the owner's call, not this
folder's. Under either rule the screen fails on the anchor, which is the finding that matters.

**Density is thin because the account is thin, not because the design omits.** The signed-in test
account has two favourites, so two cards is every card there is. `hierarchy-density-04`
(sparse-but-real, SOURCE.md 10.0a) waives the count floors for a real thin list that does not
fabricate, and this list does not fabricate. What is NOT waived and is still worth naming: the card
pitch is 404px (388 card plus a 16px gap), so four units need 1,616px and no account of any size
ever shows four in the first viewport at one column. That is a property of the card height, not of the
seed data.

## Cross-screen, FLOORS LAW 8

**The same salon renders through two different card files, and all three numbers below were
measured by the same tool on the same day.**

| route | file | photo box | radius | JSON |
|---|---|---|---|---|
| `/de/profile/favorites` | `components-legacy/SalonCard.tsx` | 358x286, 5/4 | **16** | `saved-salons.json` |
| `/de/basel/coiffeur` | `app/[locale]/_components/homepage/SalonCard.tsx` | 231x185, 5/4 | **22** | `search-results.json` |
| `/de` | `app/[locale]/_components/homepage/SalonCard.tsx` | 231x185, 5/4 | **22** | `home-feed.json` |

The aspect ratio agrees and the radius does not. `_design-system/COMPONENT_REGISTRY.md:137` lists
**SalonCard** at `homepage/SalonCard.tsx` and names "/favoriten" among its call sites, which this
screen does not use: `FavoritesList.tsx:12` imports `@/components-legacy/SalonCard`, a separate
21KB file. The registry row is describing a call site it does not have. Recorded, not fixed, and
detailed in `03-saved-grid.md`.

Two more relationships, both against the saved-LOOKS screen and both detailed in
`../saved-looks/README.md`: the two saved screens carry their titles in different places at
different sizes, and one of them removes the bottom nav on arrival.

## Not measured

- The empty state. It needs an account with zero favourites.
- The scrolled state of the header, which is `bg-transparent` with `transition-all duration-300` at
  scroll 0 and presumably changes; the capture is at scroll 0 only, so what it becomes is unknown.
- The condensed bottom nav. `BottomNav` condenses on downward scroll past 80px; the capture is at
  scroll 0, where the bar is always full by its own rule.
- Any locale other than `de`, and the card name is `truncate`, so a longer French or German salon
  name is exactly the worst-case-content check FLOORS LAW 1f asks for and it has not been run here.
