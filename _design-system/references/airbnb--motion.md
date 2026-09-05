<!-- exists-check: net-new vs every airbnb--*.md file (none of the other ten capture motion;
     airbnb--category-switch.md and airbnb--home-search-chrome.md are static-layout captures with
     no timing data), MOTION.md (Solen's own vocabulary, not a captured reference), and
     TASTE_LOG.md's 2026-09-05 entry which names this exact file as the planned motion capture
     alongside airbnb--look-recipe.md (look, already written) and 21st-dev--motion-kit.md (sibling
     file, same session). `npm run exists "airbnb motion"` / "airbnb--motion" returned 0 hits before
     this file was written. Nothing here lands in real code; mockup-first still binds per CLAUDE.md. -->

# Airbnb motion (mobile web, live captures)

REF: airbnb.com / web-mobile 390x844 / motion-only / fresh Playwright captures, 2026-09-05

## Scope note

This file captures MOTION only: what moves, for how long, on what curve, with what stagger.
It does not repeat `airbnb--look-recipe.md`'s color/type/radii numbers. Every row is tagged
**verified** (read from a recorded video's `document.getAnimations()` timing/keyframe dump or
from live `getComputedStyle` transition values, this session), **expect** (reasoned from a
verified number, not independently re-measured), or **assume** (not measured, stated as a gap).
No number here is invented; a gap is written down instead of guessed, per the owner's law that
"not measured" beats a guess.

## Method

Headless Chromium via Playwright (`scripts/capture/record-interaction.mjs`'s pattern, extended
with a text/role-locator variant because Airbnb's class names are build-hashed and do not survive
between page loads). Mobile Safari UA, 390x844, `isMobile`+`hasTouch` set. Cookie consent
declined via "Only necessary" (privacy-preserving default); a stacked "Translation on" dialog
closed first where present. Raw captures (video + `animations.json` + screenshots) saved under
`public/_pixel-refs/airbnb/motion/` (gitignored scratch, not committed). No credentials entered,
no account created, no destructive git operations, no server started or stopped.

## Sources captured this session

| folder | what it is |
|---|---|
| `c-search-expand/` | tap "Start your search" on the home page |
| `d-category-switch/` | tap the "Experiences" category pill |
| `b-gallery-open/` | tap the hero photo on a live listing page (opens Photo tour) |
| `e-reserve-sheet/` | tap "Check availability" on a listing page (opens the date-picker sheet) |
| `a-card-tap2/` | tap a home-feed listing card (navigates to the listing page) |
| `g-back-nav/` | tap the back arrow on a listing page (returns to home) |
| (inline, not a folder) | live `getComputedStyle` on ~20 buttons/links on a listing page |
| (inline, not a folder) | keyframe dump of the home page's post-tap animation set |

## Measured

### (c) Search sheet expand, home page top field

Tapping "Start your search" replaces the whole viewport with a full-screen "Where?" search flow
(destination list, then When/Who steps below, Homes/Experiences/Services tabs revealed at top).
This is a full takeover, not a bottom sheet.

- Two DIV mask/expand animations on the same container: **300ms** and **550ms**, both `linear`
  keyframe-sampled (see Curve note below), delay 0. **verified**
- Destination-list rows (Nearby, Paris, Barcelona, London, Rome) reveal staggered: **150ms** and
  **250ms** duration items, delay steps of **50ms** (0, 50, 100, 150, 200ms observed across the
  set). **verified** (duration/delay from WAAPI timing; the animated PROPERTY, i.e. whether it is
  opacity-only or opacity+transform, was not captured for these specific rows, see gap below)
- One SVG path animation on an icon (search icon morph), duration **300ms**. **verified** timing,
  **assume** which path property (d/stroke) actually tweens (not read from keyframes this pass)

### (d) Category pill switch (Homes -> Experiences)

Tapping the "Experiences" pill swaps the entire feed's content (a full server-driven refetch;
observed result changed from "Popular homes in Paris" to "Happening today in Basel", i.e.
location-based experiences content, not a client-side filter). The pill itself gets a solid
selected fill.

- `document.getAnimations()` returned the SAME 17 entries before and after a 1.5s settle window,
  meaning either the swap completes on a CSS transition already finished by then, or it is a full
  navigation whose entrance animations had already resolved. **assume** for the pill-swap's own
  motion (not independently captured this pass)
- Cross-reference: Solen's own prior live audit of airbnb.com (already in `MOTION.md`'s THE SPEED
  LAW table, captured 2026-07-25 over ~3000 elements) found the sitewide dominant durations
  **300ms x102, 250ms x90, 100ms x28, 200ms x25**, curve `cubic-bezier(0.2, ...)`. This session's
  own fresh `getComputedStyle` pass (below) confirms the exact curve as
  `cubic-bezier(0.2, 0, 0, 1)`, so the two captures agree independently. **verified** (curve),
  **expect** (that the pill-swap itself sits in this same family, not separately confirmed)

### (b) Photo gallery open, listing hero tap

Tapping the hero photo on a listing page replaces the viewport with a full-screen "Photo tour"
(a top horizontal thumbnail strip, then large images stacked per named room).

- Mask/reveal DIV: **400ms**, `linear` keyframe-sampled, delay 0. **verified**
- A second animation on the same target family: **~584ms** (583.77ms exactly), delay 0.
  **verified**
- Per-section entrances ("Living room", "Dining area" headings + their photo): **300ms**
  duration, delay **200ms** then **300ms** (a 100ms stagger step between sections). **verified**

### (e) Reserve entry, "Check availability"

Tapping "Check availability" on a listing page replaces the viewport with a full-screen date
picker (calendar grid, "Select check-in date").

- Mask/reveal DIV: **400ms**, `linear` keyframe-sampled, delay 0, same signature as the gallery
  open. **verified**
- This is the closest analog to a Reserve/checkout entry point on this listing (the listing had
  no active dates, so "Reserve" itself was not reachable without picking dates first; the
  date-picker IS the first screen of that flow). **verified** for what was captured; the
  downstream Reserve/payment sheet itself was not reached this pass. **assume** for its motion.

### (a) Card tap to listing page

Tapping a home-feed listing card navigates to the listing page (full page load, not a modal).

- Same 400ms mask signature as (b) and (e), plus staggered image-load shimmer animations
  (**830-910ms**, delay 0/100ms) consistent with content/image placeholders resolving.
  **verified**
- No shared-element / hero-photo morph was confirmed or ruled out: I did not trace pixel
  continuity of the specific photo element across the navigation boundary. The timing profile
  matches a plain full-page load (same 400ms mask as every other full-screen entrance captured
  this session), which argues against a distinct "hero morph" transition, but this is **assume**,
  not a measured negative.

### (g) Back navigation

Tapping the back arrow on a listing page returns to the home feed. Confirmed via screenshot: the
returned feed shows DIFFERENT content ("Stay in Florence" section) than the original load, i.e.
this is a fresh client-side route render, not a cached bfcache restore.

- Card-grid stagger-in on the returned feed: **250ms** duration per card, delay steps of
  **50ms** (0, 50, 100ms observed), same family as (c)'s destination-list stagger. **verified**
- A **1050ms** `linear` animation recurs across every capture on a small SPAN element (present on
  home, search-expand, and post-back-nav dumps alike) with matching duration and easing every
  time. Its position in the layout and reappearance on every page strongly suggests a looping
  shimmer/skeleton placeholder rather than a one-shot entrance. **expect**, not confirmed via
  `animation-iteration-count`.

### (f) Button press / hover feedback (live `getComputedStyle`, listing page)

This is the one moment measured directly from CSS (not WAAPI), by reading every visible
button/link's `transitionProperty`/`transitionDuration`/`transitionTimingFunction`. **verified**,
n=23 elements sampled.

| property | duration | curve | example elements |
|---|---|---|---|
| `transform` (press-scale, smallest controls) | **100ms** | `cubic-bezier(0.2, 0, 0, 1)` | the icon buttons beside Share/Save |
| `box-shadow` (hover lift) | **200ms** | `cubic-bezier(0.2, 0, 0, 1)` | icon buttons, "Show map", "Cancellation policy" panel |
| `transform` (larger controls: Share, Save, calendar month-nav arrows) | **250ms** | `cubic-bezier(0.2, 0, 0, 1)` | Share, Save to wishlist, month prev/next |
| `background-color` / `border-color` / `color` (outline-to-filled swap) | **300ms** | `cubic-bezier(0.2, 0, 0, 1)` | "Show more", "Clear dates", "Check availability" |
| `text-decoration-thickness` (link underline) | **300ms** | `cubic-bezier(0.2, 0, 0, 1)` | "Show original", "Report this listing" |

**The finding that matters most in this table: every property on every element shares the exact
same curve, `cubic-bezier(0.2, 0, 0, 1)`.** Airbnb does not vary easing by direction or
mechanism; it varies only DURATION (100/200/250/300ms) by how much visual weight is moving. This
is a materially different philosophy from Solen's four-token system (snap/spring/glide/thud by
direction and mechanism, see Port map).

### Keyframe spot-check (what actually tweens, not just how long)

A direct keyframe read (`effect.getKeyframes()`) on the home page's post-tap animation set found
two distinct mechanisms, not one:

1. A `<video>` element (a background loop, not a UI control) scales from **0.4 to 1.0** on a CSS
   `linear()` sampled function whose intermediate values overshoot to **~1.044** before settling
   at 1.0, i.e. a genuine spring with a small bounce, encoded as a many-point linear() curve
   rather than a named easing keyword. Duration matches the 574ms/584ms figures seen elsewhere in
   this capture. **verified**
2. A `<button>` element's `color` keyframes go from `rgb(20,20,20)` to `rgb(34,34,34)`, a flat
   0-to-1 linear color shift with no other property, i.e. a plain hover/press color fade, not an
   entrance. **verified**

**Gap, stated plainly:** I did not capture the keyframe property list for the staggered
destination-row / gallery-section entrances themselves (only their duration/delay via
`effect.getTiming()`). I cannot say from this session's data whether those specific rows animate
opacity alone, opacity+transform, or something else. This is the single most important unresolved
question for the ENTER RECIPE comparison below, and it is left as **assume**, not guessed.

## Port map onto Motion-22

Solen's four locked easing tokens (`_design-system/LOCKFILE.md` §4):
`snap` `cubic-bezier(0.4,0,0.2,1)` / `spring` `cubic-bezier(0.34,1.56,0.64,1)` /
`glide` `cubic-bezier(0.16,1,0.3,1)` / `thud` `cubic-bezier(0.7,0,0.84,0)`.

| Airbnb pattern | duration | Airbnb curve | closest Solen token | fit |
|---|---|---|---|---|
| Full-screen reveal (search sheet, gallery, date picker) | 400-550ms | `linear()` spring-sampled or unspecified | `glide` (decelerate, no overshoot) | **Partial.** Airbnb's full-screen entrances run longer than Solen's 300ms full-screen ceiling would suggest if treated as a plain reveal, but LOCKFILE's own SPEED LAW explicitly reserves ">300ms for a FULL-SCREEN transition only", so 400-550ms is IN BOUNDS, not a conflict. The curve shape (decelerate, occasionally with a slight spring overshoot on scale) is closer to `glide` than to a snap. |
| Staggered list/card entrance | 150-300ms per item, 50-100ms stagger step | `linear()` | `glide` + Solen's existing `.salon-card-stagger` (motion-03, capped at item 8) | **Good fit.** Numerically inside Solen's own reveal tier (250-300ms) and stagger convention already exists; Airbnb's 50ms step is tighter than typical Solen staggers but not a conflict. |
| Press feedback (button/icon transform) | 100ms | `cubic-bezier(0.2,0,0,1)` (decelerate) | Solen's THE SPEED LAW "press" tier is 80-100ms, duration matches; curve is where they diverge, see Conflicts | **Duration matches, curve differs.** |
| Hover lift (box-shadow) | 200ms | `cubic-bezier(0.2,0,0,1)` | `glide`, and matches LOCKFILE's own table row "Hover lift (cards): 200ms glide" exactly on duration | **Good fit.** |
| Color/background swap (outline-to-filled) | 300ms | `cubic-bezier(0.2,0,0,1)` | `glide` or `snap` depending on whether it is read as a reveal or an in-place flip | **Reasonable fit**, sits at the top of Solen's in-place-flip range. |

**Does the ENTER RECIPE hold?** Solen's locked ENTER RECIPE requires every entrance to animate
opacity + scale (0.96->1) + blur (8px->0) together. This session's data can confirm only ONE
Airbnb entrance's actual keyframe properties (the background video's scale-only spring, no
opacity or blur involved because it is a decorative loop, not a UI entrance) plus one hover color
fade (no opacity/scale/blur at all). **I cannot confirm or deny, from what I measured, whether
Airbnb's staggered content entrances use Solen's 3-property combination.** Treat this as an open
question, not evidence for or against the recipe: the recipe is Solen's own locked design
decision (owner-approved 2026-07-09) and does not need Airbnb's agreement to stay in force.

## Conflicts

- **CONFLICT [motion]: press-feedback curve.** Airbnb decelerates on press (`cubic-bezier(0.2,0,0,1)`,
  the same curve as everything else) at 100ms. Solen's LOCKFILE table locks press at
  "150ms `thud`" (`cubic-bezier(0.7,0,0.84,0)`, an ACCELERATE curve, deliberately chosen per
  motion-06/07's curve-by-direction rule: "press-down feel"). These are opposite curve shapes for
  the same interaction. This is not a new discovery so much as a confirmed, already-decided
  divergence: Solen's curve-by-direction law was written specifically because a single universal
  curve (which is what Airbnb runs) was judged wrong for a press-down feel. Owner call already
  made; recorded here only so a mockup builder does not "fix" Solen's press curve toward Airbnb's
  by mistake.
- **CONFLICT [motion]: one curve vs four tokens.** Airbnb's entire button/hover/link vocabulary
  runs on exactly one bezier, varying only duration. Solen's system is four tokens split by
  direction/mechanism (§4, plus the curve-by-direction rule added 2026-07-25). Porting "the
  Airbnb feel" literally would mean collapsing Solen's four-curve system to one, which is a bigger
  change than a timing port and was not asked for. Not applying it; flagged for the owner if a
  simplification is ever on the table.
- **No graveyard hits.** `_design-system/REMOVED.md` grep for "motion|bounce|wave|jump" found two
  entries, both about SPECIFIC Solen components, not general Airbnb-style entrances: (1) the
  SalonTeam avatar "bounce hello" wave-on-scroll was killed 2026-07-19 ("staff jumps when u
  scroll"), and (2) the sticky book-bar's fixed-to-absolute snap-jump was killed 2026-07-24 (the
  owner wants the bar to "STAY put and never move"). Nothing captured this session resembles
  either pattern (no scroll-triggered bounce, no sticky-bar position snap was tested), so no
  re-proposal risk from this file.
