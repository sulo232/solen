<!-- exists-check: searched all eight existing airbnb--*.md files (home-mobile, profile-list,
     home-search-chrome, category-switch, icons-vs-ours, animated-icons, fonts-vs-ours,
     profile-1to1-diff) plus AIRBNB_SYSTEM_VS_OURS.md and chrome-per-solen-page.md, and ran
     `git log --all` across this worktree. None of them captures the REVIEWS screen: profile-list
     and profile-1to1-diff cover the account/profile surface, home-mobile covers the home feed,
     category-switch and home-search-chrome cover search chrome, icons/animated-icons/fonts cover
     the token layer. That gap is why one row of the comparison this file feeds says
     "not captured", and this file closes it. Nothing here duplicates an existing capture. -->

# Airbnb, mobile web reviews

REF: airbnb / web-mobile / reviews / live-DOM

## Identity

- **Brand / platform / surface:** Airbnb, web in mobile view, a single listing's full reviews screen
  (reached via "Show all N reviews" on the listing page).
- **Source:** `https://www.airbnb.com/rooms/40508822/reviews` ("Cosy room with balcony & view",
  Paris, 5th arrondissement; 4.94 rating, 141 reviews, Guest favorite). Reached by loading
  `https://www.airbnb.com`, dismissing the cookie banner via "Only necessary", opening the first
  "Popular homes in Paris" result, and clicking "Show all 141 reviews".
- **Viewport:** 390x844, device-pixel-ratio 2, no page zoom (`getComputedStyle` zoom = 1 on both
  `html` and `body`).
- **Date:** 2026-08-15.
- **Method:** the in-app Browser MCP pane (`mcp__Claude_Browser__*`), live DOM measured with
  `getBoundingClientRect` and `getComputedStyle` via `javascript_tool`, cross-checked against
  `document.elementFromPoint` spot-checks and three screenshots. No training-memory numbers. No
  login, no account created, no personal data entered. The cookie banner's "Only necessary" option
  was chosen (not "Accept all").
- **Why this file:** direct request to close the "reviews screen not captured" gap for a Solen
  salon-reviews comparison.

## A DOM anomaly, named rather than smoothed over

At `scrollTop 0`, a hit-test at the exact screen coordinates of the visible "Guest reviews mention"
topic chips returns a *different*, fully-opaque DOM node (`opacity:1`, `pointer-events:auto`, no
`clip`/`clip-path`, no transform) whose text begins "Rated 4.94 out of 5 from 141 reviews...Keelan
California...". That node's own `overflow-x:auto` container reports a `scrollWidth` of 5820px
holding 20 review-shaped children at `top:178, left: 24, 339, 628...` (i.e. laid out side by side,
one per named reviewer). Nothing this wide or side-by-side appears in any screenshot: the render is
a plain vertical list. I could not determine the exact CSS mechanism that keeps it out of paint
while it still wins hit-testing (it is not `display:none`, `visibility:hidden`, `opacity:0`, or
clipped by any ancestor I walked). I am naming this rather than either (a) reporting its numbers as
real screen content, which the screenshots contradict, or (b) silently dropping it with no note. I
excluded its descendants from every census below by container reference (a reproducible exclusion,
not a guess), and separately confirmed that excluding it changes only raw counts, never the *set* of
distinct sizes/weights/radii found, so the distinct-value claims in this file hold either way.

## Measured

### Sort control

Present: yes, a pill labelled "Most relevant" with a chevron-down, directly left of a circular search
icon button, both inline with the "141 reviews" count heading.

| property | value |
|---|---|
| painted height | 48px |
| tap height | 48px (same box, clears the 44px floor) |
| font-size / weight | 12px / 500 |
| border-radius | 9999px (full capsule) |
| horizontal padding | 16px left, 16px right (8px top/bottom) |
| border | `0px none` on the `border` property itself; the visible edge is an inset `box-shadow: rgb(221,221,221) 0px 0px 0px 1px inset` (a 1px hairline simulated via shadow, not a real border) |
| background | `rgb(255,255,255)` |
| width | 128.86px (content-driven, not fixed) |

Adjacent search icon button: 40x40px, `border-radius: 50%`, no visible border.

### Filter chips: topic/keyword, not star-rating

There is no star-rating filter (no "5 stars / 4 stars / ..." chip row) anywhere on this screen. The
only star-based UI is a static "Overall rating" distribution chart, five rows (5 down to 1) rendered
as `<td>` table cells with no click handler, i.e. a read-only bar chart, not a filter.

What Airbnb shows instead, under a "Guest reviews mention" heading, is a horizontally-scrollable row
of TOPIC chips. All ten present, confirmed by reading the full scroll container (not just the two
visible in the first viewport):

`Location 95` · `Hospitality 95` · `Indoor spaces 41` · `Nearby 35` · `View 44` · `Cleanliness 42` ·
`Getting around 23` · `Comfort 21` · `Walkability 16` · `Checkout 7`

**Every single chip carries a count next to its label**, verified across all ten, not assumed from
the first two.

| property | value |
|---|---|
| height | 48px |
| font-size / weight | 14px / 400 |
| border-radius | 16px (a rounded rectangle, NOT a capsule: half of 48px height is 24px, and 16 < 24) |
| border | `1px solid rgb(221,221,221)` |
| background | transparent |
| padding | 14px left, 18px right |
| icon | yes, one small icon per chip (pin for Location, gift for Hospitality, sofa for Indoor spaces, etc), left of the label |

### Border-radius census, first viewport (390x844, scrollTop 0)

Raw first-corner radius tally across all elements carrying nonzero radius, ghost subtree excluded
(28 elements; the unexcluded raw count is 30, same distinct set):

| radius | count |
|---|---|
| 50% (true circles: avatars, icon buttons) | 8 to 12 (excluded vs raw run) |
| 16px (topic chips) | 6 |
| 8px (photo thumbnails) | 4 |
| 2px (rating-bar fill tracks, 4px tall, so radius = half height = capsule by the stated rule) | 5 |
| 4px (small "Show more" links, misc) | 2 to 4 |
| 12px (a card thumbnail) | 1 |
| 999px | 1 |
| 9999px (the sort pill) | 1 |

Capsule share (radius >= 999px OR radius >= half the element's shorter side): **14 of 28 (45.8%)
with the ghost subtree excluded, 15 of 30 (50.0%) in the raw unfiltered pass.** Report as
approximately 46 to 50%, both numbers computed, neither guessed.

### Distinct font-sizes, first viewport

**7 distinct sizes: 10px, 12px, 14px, 16px, 22px, 26px, 72px.** This set is identical whether the
ghost subtree is included or excluded; only the per-bucket counts shift (e.g. 12px appears 39 times
raw vs 32 times excluded).

- 72px: the "4.94" rating digit, alone, by far the largest thing on the screen.
- 26px: "Guest favorite" heading, alone.
- 22px: two instances, unclear exact role beyond the rating-summary area.
- 16 / 14 / 12 / 10px: reviewer names and the "141 reviews" heading (16), review body text (14),
  chip labels / location / date text (12), and one smaller tier (10, category-score numerals).

Spread: 10/12/14/16 form a tight low cluster (each consecutive step is 2px, the whole cluster spans
6px). 22 and 26 sit 4px apart. 72 stands alone with a 46px gap below it. No single "5px band"
swallows more than that 10/12/14/16 cluster.

### Distinct font-weights, first viewport

**4 distinct: 400, 500, 600, 700.** Share of visible leaf text at weight >= 600: **4 of 78 leaves
(5.1%) raw, 4 of 66 leaves (6.1%) with the ghost subtree excluded.** Call it roughly 5 to 6%, both
computed.

### Distinct letter-spacing, first viewport

**4 distinct: `normal`, `-0.44px`, `-0.52px`, `-1px`.** The three negative values sit only on the
display-scale text (the "4.94" digit and the "Guest favorite" heading); every other visible string
measured `normal`.

### Review row anatomy

Measured on the first review (reviewer "Keelan", California, United States, 5 stars, "2 weeks ago",
"Stayed about a week") after scrolling the page's real inner scroll container
(`document.querySelector('.c12djd32')`, `scrollTop`) to 400px, past the rating-summary header, so
the row is fully in frame; then cross-checked with `elementFromPoint` at the exact coordinates
visible in a screenshot at that scroll position.

| element | value |
|---|---|
| avatar diameter | 48 x 48px, `border-radius: 50%` on a wrapping DIV/A with `overflow:hidden` (the raw `<img>` itself computes `border-radius: 0`, the circular mask lives one level up) |
| reviewer name | a real `<h2>` tag, 16px / weight 500, `rgb(34,34,34)` |
| location line (under name) | 12px / weight 400, `rgb(108,108,108)` (grey) |
| star row | 5 SVG icons, 9 x 9px each, `fill: rgb(34,34,34)`, i.e. **black stars, not yellow/gold** |
| date text ("2 weeks ago") | 12px / weight 400, `rgb(108,108,108)`, same grey as location, inline after the stars behind a "·" |
| stay-length text ("Stayed about a week") | same row, same style as date |
| body text | 14px / weight 400, `rgb(34,34,34)` (ink) |
| vertical gap, one row's content to the next row's avatar | **60px total**: 35px from the body text's bottom edge to the divider's top edge, plus the divider's own 1px, plus 24px from the divider's bottom edge to the next avatar's top edge |
| row-to-row cadence (avatar-top to avatar-top) | 281px for the Keelan-to-Linda pair, but this is content-length-dependent (a longer or shorter review body changes it), not a fixed row height |

### Divider between review rows

**Yes**, confirmed by reading computed style on the row containers, not by looking: a 1px-tall DIV,
342px wide, `border-bottom: 1px solid rgb(235,235,235)`, transparent background. Note this hairline
(`235,235,235`) is a slightly lighter grey than the topic-chip border (`221,221,221`), i.e. Airbnb
uses two different hairline weights for two different jobs on the same screen.

### Also measured, not requested but load-bearing for the comparison

- "141 reviews" count heading: 16px / weight 500, directly left of the sort pill.
- Search (magnifying glass) icon button beside the sort pill: 40 x 40px circle, no border.
- The topic-chip row sits under its own "Guest reviews mention" heading, itself in a section
  separated from the "141 reviews" + sort row by a 1px full-width hairline divider (same treatment
  family as the between-review dividers).

## NOT MEASURED, stated rather than guessed

- **A native mobile app view.** This was Airbnb's web site at a mobile viewport, per the task's own
  scope ("mobile web"), not the iOS/Android app.
- **Signed-in / personalized behavior.** No login, no account created (per policy and per this
  task's explicit instruction). Any change to review ordering, filtering, or the presence of the
  user's own review that only appears when authenticated is unverified.
- **The exact CSS mechanism behind the DOM anomaly** described above (a fully-opaque, pointer-events
  a duplicate/summary subtree that wins hit-testing but is absent from every screenshot). Excluded
  from census counts by container reference; its precise cause (an accessibility mirror, a stale
  hydration artifact, or something else) was not resolved.
- **Whether the topic-chip set or the black-star color is listing-specific or a global template
  choice.** Only one listing was sampled, per the task's "any real listing with plenty of reviews"
  instruction. Not cross-checked against a second listing.
- **A "reviews with photos" filter or any other second filter type.** None was found anywhere on
  this screen; naming its absence explicitly rather than leaving it unaddressed.
- **Sort menu contents.** The "Most relevant" control's geometry was measured; its dropdown was not
  opened, so the list of sort options it offers is not recorded here.
