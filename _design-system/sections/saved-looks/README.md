# /{locale}/inspo/saved section docs

Per-section specs for the saved-LOOKS screen, `/de/inspo/saved`, captured at 390x844, signed in,
2026-08-27. Source: `_design-system/sections/_measured/saved-looks.json`. Each file follows the
`salon-detail` shape: Reference, Component, Layer, Layout with an ASCII sketch, Measured, Tokens,
Interaction, Intentional deviations, Empty state, Against the floors, Provenance.

## This folder supersedes `_design-system/sections/saved/`

The old one measured a page that does not exist. `_measured/saved.json` was captured at
`/de/profile/saved`, which is not a route, so the run followed the localized 404 and filed it as the
saved screen. That folder's `05-saved-looks.md` covered this route from source only, and what it
settled is carried across here and cited rather than re-derived.

## READ THIS FIRST: the capture is the loading skeleton, not the saved looks

`saved-looks.json` did not measure this screen's content. It measured
`components-legacy/discovery/DiscoveryGridSkeleton.tsx`, the shimmer placeholder that renders while
`GET /api/discovery/saves?limit=60` is in flight (`inspo/saved/page.tsx:76-77`). Four independent
checks, any one of which would be weak alone:

1. **Tile count.** The JSON reports 12 cards with one shared anatomy key. `DiscoveryGridSkeleton`
   has exactly 12 entries in its `RATIOS` array (lines 13 to 17). A real saved grid returns whatever
   the account has saved, capped at 60.
2. **Tile width, and this is the decisive one.** The JSON reports 196px. The skeleton is wrapped in
   `-mx-4 px-1.5` inside the page's own `px-1.5`, so at a 390 viewport its columns are
   (390 - 12 + 32 - 12 - 6) / 2 = **196**. The real grid is wrapped in `-mx-0 px-1.5`
   (`page.tsx:98`), which gives (390 - 12 - 6) / 2 = **186**. The measurement matches the skeleton's
   arithmetic and not the grid's.
3. **Tile height.** 196 x 4/3 = 261.33, and the JSON reports 261. `RATIOS[0]` is `"3 / 4"`, and
   `cardAnatomy` keys on style rather than size, so its `exampleSize` is the first tile it meets.
4. **Background and images.** The JSON reports a transparent card background and zero images. A
   skeleton tile is `bg-gradient-to-r`, which sets `background-image` and leaves `backgroundColor`
   at `rgba(0, 0, 0, 0)`, and a CSS gradient contains no `url(` so the extractor's image branch
   never counts it. A real `ItemCard` photo box is `bg-s-bg-sunken`, `rgb(244, 244, 245)`, and
   contains an `<img>`.

A fifth check falls out of the band count. The screen reports **one band** even though the header
row (`page.tsx:65`) has an `h1` as a direct child and should have been promoted. The walker drops a
candidate contained in another candidate with identical `innerText`, keeping the outer one. The
skeleton is `aria-hidden` and carries no text, so `main.innerText` and the header row's `innerText`
are both exactly "Gespeichert" and `main` wins. With real cards, `main` would also carry creator
names and the two would differ, so the header row would have survived as its own band.

**Known-answer control, run before trusting the width arithmetic.** The same method applied to
`/de/profile/favorites` predicts 358 (`max-w-2xl mx-auto px-4` at a 390 viewport), and
`saved-salons.json` measures 358. The instrument gives the right answer on a case whose answer is
already known.

**What is NOT established: why the fetch had not resolved.** `settled: true` is true and beside the
point, because the settle sampler's signature is text count, largest font and image area, all three
of which are constant while a shimmer animates, so a stable skeleton reads as a settled page. Two
candidates remain and this capture cannot separate them: a slow `/api/discovery/saves` on a cold dev
server, or a request that never resolved. The test that settles it is a rerun with the server warm
plus the response time of that one endpoint. The symptom is reported here with no cause attached.

**Consequence for this folder.** Only `04-loading-skeleton.md` is backed by a measurement. Files 01
to 03 carry source literals, marked as such in every Measured block. Nothing here is presented as a
render measurement of a screen that was not rendered.

## The screen's job

**Show the looks a customer hearted in the Inspo feed, and get back to one.** FLOORS LAW 10 asks
every element to justify itself against that sentence, and everything on the screen passes it: a
back control, a title, a grid. Nothing else renders, including the global chrome, which is removed
by route.

## Sections (top to bottom on mobile, 390x844)

| # | File | Section | Component | JSON band |
|---|---|---|---|---|
| 1 | `01-header-row.md` | Back tile + "Gespeichert" title | `app/[locale]/inspo/saved/page.tsx:65-74` | folded into band 0, see below |
| 2 | `02-saved-grid.md` | The masonry grid of looks | `MasonryGrid` + `ItemCard` / `VideoCard` | none, never rendered in this capture |
| 3 | `03-empty-state.md` | Zero state, one line + one ink pill | `page.tsx:86-96` | none |
| 4 | `04-loading-skeleton.md` | The shimmer placeholder, and what the JSON actually measured | `DiscoveryGridSkeleton.tsx` | 0 |

## One JSON band, four files

The single band is `main` (`app/[locale]/layout.tsx:115`), the all-containing element, holding the
header row and the skeleton. It is not folded away as a wrapper the way `main` is on the other
screens, because on this screen it is the only band there is: its box, its surface and its one text
role are the entire measurement, and they are split between `01` (the text role) and `04` (the card
anatomy and the geometry).

Three files carry no band, and each says why in its own Measured block: the grid did not render, the
empty state did not render, and the header row was deduped into `main` by the walker for the reason
given above.

## Screen totals, and the correction to them

Verbatim from `saved-looks.json`:

| axis | measured |
|---|---|
| document height | 2019 at a 844 viewport |
| distinct font sizes | 5: 22, 16, 15, 14, 13 |
| distinct weights | 3: 400, 600, 700 |
| text elements | 6 |
| weight >= 600 | 4, so 66.67% |
| photographic area | 0 |

**Five of those six text elements are not this screen, and neither are four of the five sizes.** The
only band accounts for one element, the 22/700 title. The residue is 5 elements, 3 of them at weight
>= 600, at sizes 16, 15, 14 and 13, none of which the screen itself authors anywhere. Both come from
`app/[locale]/layout.tsx`:

- the `sr-only` skip link (`layout.tsx:70-75`) inherits the 16px body size and has a 1x1 rect, which
  the extractor counts because it drops only `display:none`, `visibility:hidden` and `opacity:0`
- the cookie-consent banner (`primitives/CookieConsent.tsx:265+`), which on mobile renders a 15/600
  title, a 13/400 body line and two 14/600 buttons, the third being `hidden md:inline-flex`

That is 5 elements and exactly 3 at weight >= 600. `saved-salons.json` leaves the identical residue,
5 elements and 3 bold, with 16 as its own unexplained size, on a screen with completely different
content. Two screens, one residue, one source.

**So the brief's headline number for this screen needs restating.** The brief said 4 of 6 text
elements bold, 67%, against a 30% ceiling. That is exactly what the JSON says and it is correct as
captured. What it measures is a cookie banner and a skip link, plus one heading. **This screen's own
text, in the state captured, is one element: its 22px title at weight 700. A bold share over n = 1
is not a grade of anything.** Both readings appear in `Against the floors` below.

## Against the floors

Ladder target, from `_plans/DESIGN_CONSISTENCY_2026-08-27.md` lines 231 to 243, read off
`/de/salon/cuts-and-culture`: anchor 30px, body 14px, ratio 2.14x, 5 distinct sizes, weight >= 600
at 30%, at least 2 distinct shadows, photographic share 34.66%.

| axis | floor / ladder | this screen | verdict |
|---|---|---|---|
| display anchor | >= 28px, house 30 | **22px** measured, and 22 is also the largest the source authors | FAIL |
| anchor ratio | >= 1.8x | no body text exists to divide by, see below | not gradeable |
| distinct sizes | <= 4 ceiling, 5 ladder | 5 captured, **2 own** (22 and 12) | PASS on count, and the count is the wrong question here |
| distinct weights | <= 2 | 3 captured, 2 own (700 and 400, plus 500 on one chip) | FAIL captured, PASS own |
| weight >= 600 share | <= 30% | 66.67% captured, 100% own over n = 1 | not gradeable either way |
| photographic share | >= 33% | **0% measured**, because the capture is the skeleton | FAIL as captured, and see below |
| distinct shadows | >= 2 | 0 in the capture | FAIL as captured |
| touch target | >= 44px | the back tile is `h-10 w-10`, **40px** | FAIL, source-read |

Three of those need their real reading spelled out rather than left as a table row.

**Imagery.** Populated, this screen is nothing but photographs: a two-column masonry of look images
with 6px gutters and no chrome, which is the highest photographic share of any screen in the
product. The 0% in the JSON is the skeleton, not the design. The floor is met by content, and
`ItemCard` takes its `src` from the item's own image, never a baked-in path, which is what FLOORS
LAW 2 requires. What is genuinely absent and not a measurement artefact: **the empty state carries
zero imagery**, and it is the weaker of the product's two saved zero states by a wide margin.

**Type range.** The screen authors 22px and 12px and nothing in between. There is no body text on
it at all: every string under the title is metadata (the style chip, the creator line, the card
signals), all at 12px. So the anchor ratio is not a failing number, it is an undefined one, and the
EMPHASIS BUDGET's clause (c), size variety is not range, is the relevant rule rather than the size
count. Two sizes 10px apart on a screen whose content is photographs is defensible; it is recorded
here so a later reader does not "fix" it by adding a middle size that has nothing to say.

**Touch target.** `page.tsx:69` gives the back tile `grid h-10 w-10`, 40px, against the design
contract's 44px floor (`h-11`) for interactive controls. The heart on each card is `h-11 w-11`
(`LikeButton.tsx:101`) and clears it. So the one control that is always on this screen is the one
that misses the floor, and it is hand-drawn rather than composed; see `01-header-row.md`.

## Cross-screen, FLOORS LAW 8

Both saved screens were measured the same day by the same tool. They agree on nothing structural.

| axis | `/de/profile/favorites` | `/de/inspo/saved` |
|---|---|---|
| title | global header slot, 18/700, `Header.tsx:472,804` | body `h1`, 22/700, `page.tsx:73` |
| title copy | hardcoded German literal in a route map | hardcoded German literal in the page |
| back control | the header's back tile, history back | own 40px tile, fixed destination `/inspo` |
| bottom nav | present, band 4, four 12px labels | **absent**, and see below |
| card | `components-legacy/SalonCard.tsx` | `ItemCard` / `VideoCard` |
| card registered | the registry names a different file for this call site | not in the registry at all |
| unsave | optimistic, plus an Undo toast | optimistic, no Undo |
| empty state | registered `EmptyStateDiscovery`, photo + hint + live rail | hand-drawn in the page, one line + one pill |

**The bottom nav's saved tab deletes the bottom nav.** `BottomNav.tsx:96` sends the heart to
`/inspo/saved`. `HideInBooking.tsx:54` returns null for `/\/inspo\/(board|saved)(\/|$)/` with no
prop guard, so every `HideInBooking` wrapper is null on this route, including the one that mounts
the nav (`layout.tsx:169-171`). Confirmed in the measurement: `saved-looks.json` has no `nav` band
and no 12px size anywhere, while `saved-salons.json` has both. So for a customer navigating by the
tab bar, the saved tab is the one destination that removes the tab bar, and the only way out is the
page's own 40px back tile, which goes to `/inspo` rather than back.

The two screens save different entities, so two card anatomies are legitimate. The label is not: one
word, "saved", points at one of the two screens, and the salon list has no tab at all.

## Not measured

- The populated grid. It needs a rerun with the saves endpoint warm.
- The empty state. It needs an account with zero saved looks.
- Every card-level number: real column width, real tile heights, the creator line, the style chip,
  `CardSignals`, and the photographic share.
- Any locale other than `de`. The title and the empty-state copy are hardcoded German, so the other
  three locales render German here no matter what.
