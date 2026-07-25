# Motion audit: home + search + inspo (discovery surfaces)

Read-only audit, 2026-07-25. Scope: `app/[locale]/page.tsx` + `_components/homepage/**`,
`_components/search/**`, `app/[locale]/[city]/**`, `app/[locale]/inspo/**`, and the
`components-legacy/discovery/**` components those routes actually mount.

**199 interactive elements / motion sites audited: 48 clean OK, 67 WRONG-TIER, 64 MISSING,
10 WCAG-2.2.2, 7 HARD-RULE-2 (animating width / height / left), 9 NO RULE COVERS THIS.** (A row can
carry two verdicts, e.g. "OK for the flip / MISSING press", so the categories sum above 199; 128
rows carry at least one defect.) The single largest pattern is not missing motion, it is OFF-LADDER
duration: across the mounted files `duration-200` occurs **25** times and `duration-300` /
`duration-[250ms]` / `duration-[300ms]` **16** times, mostly on in-place hovers and disclosures,
and THE SPEED LAW says there are "three [tiers], and nothing between them" (press 80-100 / snap 150
/ reveal 250-300). The second pattern is press feedback that never reaches the press tier: of **43**
`active:scale-*` declarations in the mounted scope, only **15** pair with `active:duration-[80ms]`,
so 28 presses inherit 150ms or 200ms from their container, and 35 further pressable controls have no
press feedback at all. The third is 10 auto-starting infinite loops (shimmer, pulse, spin, an
`Infinity`-repeat dot loader) that become a WCAG 2.2.2 Level A failure the moment an endpoint takes
more than five seconds, which is a real defect and not a style question. Seven sites animate `width`,
`height` or `left`, which THE SPEED LAW hard rule 2 forbids outright. Where the law genuinely says
nothing (easing assignment by direction, programmatic smooth-scroll, view transitions, one-shot
celebratory keyframes over 300ms, input focus), the row says NO RULE COVERS THIS rather than
inventing one.

## Authorities and how the verdicts are derived

Every verdict traces to one of these. Nothing else was used.

- **THE SPEED LAW** (`_design-system/MOTION.md` lines 119-164, owner-approved 2026-07-25).
  Tiers: **press 80-100ms** (input acknowledgement), **snap 150ms** (in-place state flip: tab, chip,
  filter, toggle, selection, and by extension any in-place hover/colour change), **reveal 250-300ms**
  (something that travels or is revealed: sheet, card enter, image reveal). Above 300ms is
  **full-screen transitions only**. Hard rules: (1) tier follows the JOB not the surface,
  (2) **never animate width, height or top**, (3) reduced-motion applies the end state,
  (4) interruptible, (5) repeated actions get the fastest tier that still reads.
- **Motion sheet 22** (`MOTION.md` lines 89-112): "Any press | CTA/card 0.97 · row 0.98 · icon 0.94".
  A pressable control with no `active:scale` is MISSING against this row, not against a taste call.
- **`_design-system/research/TASTE_MOTION.md`**: finding 14 (WCAG 2.2.2 Level A, and
  `prefers-reduced-motion` does NOT discharge it), finding 8 (looping motion beside a task spends
  attention on the non-task), finding 13 (animation as a substitute for a scannable set costs up to
  2.8x), finding 25 + mapping row 25 (never transition `box-shadow` on hover-heavy surfaces, the
  salon card grid is named), finding 17 (enter `glide` / in-place `snap` / exit `thud`, recorded as
  a RECOMMENDATION that MOTION.md has not adopted), NOT-SUPPORTED item 3 (the 420ms ENTER RECIPE).

Two mechanical facts that the rows depend on, read from the config, not assumed:

- `tailwind.config.js` defines no `transitionDuration` override, so a bare `transition-colors` /
  `transition-transform` with no `duration-*` resolves to Tailwind's default **150ms**, i.e. it
  lands ON the snap tier by accident. Those rows are marked OK for the flip and MISSING for the
  press, not marked as undeclared.
- `tailwind.config.js:340` defines `animate-shimmer` as `shimmer 1.5s ease-in-out infinite`.
  Tailwind's stock `animate-pulse`, `animate-ping` and `animate-spin` are also `infinite`. Every use
  of those four is an auto-starting loop with no stop mechanism. `app/globals.css:822-830` kills all
  of them under `prefers-reduced-motion`, which satisfies hard rule 3 but, per TASTE_MOTION finding
  14, does NOT satisfy WCAG 2.2.2.

**Not-mounted components were checked and excluded from the counts**, because dormant code is not
shipped taste. `app/[locale]/page.tsx` imports Hero, MobileCategoriesRow, SalonOfMonth,
ForYouSalonRows, RecentlyViewed, Nearby, WalkInBand, Entdecken, Reviews, BusinessTeaser (plus
SectionHeader/SalonCard/HeartButton/NearbyMap transitively). BentoBusiness, CategoryPromos,
CategoryStack, CategoryTabs, FeatureBento, FeaturedStylists, ForYouGreeting, HeroDuo, HeroHeadline,
HeroSpotlight, AtmosphereBlobs, AtmosphereGrain, ArtistOfTheMonth, SolenStory and WhySolen are
imported nowhere on this route; `Hero.tsx:246-340` is inside `_DeprecatedSearchBar`, dead. In
`components-legacy/discovery/`, the inspo routes mount MasonryGrid, ItemCard, VideoCard, LikeButton,
CardSignals, SearchBar, SearchAutocomplete, RecentSearches, AISuggestionPills, DiscoveryGridSkeleton,
DiscoveryEmptyState, DiscoveryErrorState, FilterDrawer, InlinePrefsPanel, ProfileSetupModal,
PostFromDiscover, ToSCheckbox, DetailPage and TikTokPlayer; SaveButton, ReportButton, StaffPortfolio,
ProgressiveFilter, DiscoveryAdmin, ImportProgressBar, UserPostsSection, CategoryTabBar (the
component; only its `DISCOVERY_CATEGORIES` const is imported) and AIProcessingIndicator are not
reachable from `/inspo`. The not-mounted findings are listed at the end, uncounted.

---

## A. Homepage `/[locale]`

### A1. Search island, `_components/homepage/SearchBar.tsx` (rendered by `Hero.tsx:227`)

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 1 | SearchBar.tsx:262-268 (const at :51-55) | the island container, collapsed to expanded morph | it is revealed and resizes in place, not a full-screen route change | reveal 250-300 | tween `[0.22,1,0.36,1]`, **duration 0.5s** | WRONG-TIER (500ms; above 300 is full-screen only) |
| 2 | SearchBar.tsx:240-252 | backdrop scrim fade-in | a scrim is revealed | reveal 250-300 | same 500ms `islandTransition` | WRONG-TIER |
| 3 | SearchBar.tsx:291-297 | collapsed-layer crossfade out (delay 0.1) | hand-off crossfade inside the morph | reveal 250-300 | 500ms + 0.1s delay | WRONG-TIER |
| 4 | SearchBar.tsx:383-389 | expanded-layer crossfade in (delay 0.1) | same | reveal 250-300 | 500ms + 0.1s delay | WRONG-TIER |
| 5 | SearchBar.tsx:429-436 | step swap, service panel | in-place panel swap that is revealed | reveal 250-300 | `duration 0.25, ease [0.22,1,0.36,1]` | OK |
| 6 | SearchBar.tsx:479-484 | step swap, stadt panel | same | reveal 250-300 | 0.25s | OK |
| 7 | SearchBar.tsx:534-539 | step swap, zeit panel | same | reveal 250-300 | 0.25s | OK |
| 8 | SearchBar.tsx:668-693 (`SegmentButton`, used :315/:322/:329) | WAS / WO / WANN segment tap, opens the overlay | press + in-place bg flip | press 80-100 **and** snap 150 | `transition-[background,border-color] duration-150 ease-glide`, **no `active:scale`** | MISSING (press; motion-22 "any press" row) |
| 9 | SearchBar.tsx:371 | "Termine finden" primary commit CTA | press | press 80-100 | `transition-[colors,transform] duration-200 ease-glide` + `active:scale-[0.97] active:duration-[80ms]` | OK (press 80ms) / WRONG-TIER (its 200ms hover colour is off-ladder, snap is 150) |
| 10 | SearchBar.tsx:417-421 | close X, `h-9 w-9` icon button | press, icon tier 0.94 | press 80-100 | `transition-colors` (150 default), no `active:scale` | MISSING |
| 11 | SearchBar.tsx:451-462 | service suggestion chip | in-place chip select | snap 150 | `transition-colors` = 150 default | OK for the flip / MISSING press |
| 12 | SearchBar.tsx:499-505 | "use my location" row | press, row tier 0.98 | press 80-100 | `transition-colors` 150 | MISSING |
| 13 | SearchBar.tsx:517-524 | recent-city chip | in-place chip select | snap 150 | `transition-colors` 150 | OK for the flip / MISSING press |
| 14 | SearchBar.tsx:567-577 | period-of-day chip | in-place chip select | snap 150 | `transition-colors` 150 | OK for the flip / MISSING press |
| 15 | SearchBar.tsx:598-608 | "reset" text button | a text control, repeated rarely | snap 150 for the colour; no press motion needed | `transition-colors` 150 | OK |
| 16 | SearchBar.tsx:612-623 | footer submit button | press | press 80-100 | `transition-colors hover:bg-black`, no `active:scale` | MISSING |
| 17 | SearchBar.tsx:728-740 (`SegmentChip`, used :400/:406/:412) | expanded-header segment chip | in-place select | snap 150 | `transition-colors` 150 | OK for the flip / MISSING press |
| 18 | SearchBar.tsx:183 | reduced-motion handling for all of the above | hard rule 3 | end state, no animation | `useReducedMotion()` swaps in `{ duration: 0 }` | OK |

`SearchBar.tsx:553` renders the shared `DateTimePicker` primitive; its internals are outside this
scope and are not counted here.

### A2. Section chrome, `_components/homepage/SectionHeader.tsx`

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 19 | SectionHeader.tsx:150-162 | section-title "see all" arrow link | in-place colour change on hover | snap 150 | `transition-colors duration-150 ease-glide` | OK |
| 20 | SectionHeader.tsx:183 | arrow glyph nudge on hover | in-place hover nudge | snap 150 | `transition-transform duration-200 ease-glide` | WRONG-TIER (200 is off-ladder) |
| 21 | SectionHeader.tsx:187 | arrow stem "draws in" on hover (stroke-dashoffset) | in-place hover reveal of a 20px glyph | snap 150 | `transition-[stroke-dashoffset] duration-200 ease-glide` | WRONG-TIER |
| 22 | SectionHeader.tsx:243-253 (`ScrollCircleButton`) | desktop rail scroll button | press, icon tier 0.94 | press 80-100 + snap 150 hover | `transition-[colors,transform,opacity] duration-200 ease-glide` + `active:scale-[0.94] active:duration-[80ms]` | OK (press) / WRONG-TIER (200ms hover) |
| 23 | SectionHeader.tsx:120-124 | `scrollByPercent`, the actual rail scroll | programmatic scroll of a rail | not on the ladder | `el.scrollBy({ behavior: "smooth" })`, UA-controlled duration | NO RULE COVERS THIS (the law has no tier for programmatic scroll; the UA picks the duration) |
| 24 | SectionHeader.tsx:215-217 | fallback "see all" text link (no rail) | in-place colour | snap 150 | `transition-colors` 150 default, and `hover:text-s-ink` equals the rest state so nothing changes | MISSING (dead transition: the hover target is the same colour as the rest state) |

### A3. Cards and tiles

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 25 | MobileCategoriesRow.tsx:86-101 | "Für dich" category tile link | press | press 80-100 | `group-active:scale-[0.97] group-active:duration-[80ms]` | OK |
| 26 | MobileCategoriesRow.tsx:99-100 | the same tile's hover lift | in-place hover lift | snap 150 | `transition-[transform,box-shadow] duration-200 ease-glide` | WRONG-TIER |
| 27 | SalonCard.tsx:370-399 | the whole salon card | press, card tier 0.97 | press 80-100 | `active:scale-[0.97] active:duration-[80ms] active:ease-glide` | OK |
| 28 | SalonCard.tsx:414-416 | card photo hover lift + 1.015 scale + shadow step | in-place hover | snap 150 | `transition-[transform,box-shadow] duration-200 ease-glide` | WRONG-TIER |
| 29 | SalonCard.tsx:414-416 | the same, but transitioning `box-shadow` | paint cost on a hover-heavy grid | TASTE_MOTION mapping row 25 says animate a shadow layer's opacity + `translateY`, never `box-shadow`, and names the salon card grid | still transitions `box-shadow` | WRONG (named in TASTE_MOTION row 25; not covered by MOTION.md, which only bans width/height/top) |
| 30 | SalonCard.tsx:3, :370 | card to PDP navigation (`next-view-transitions`) | a full-screen transition | above 300ms is permitted for full-screen only | no duration declared in code; the browser's view-transition default applies | NO RULE COVERS THIS (the law has no number for a view transition, and none is declared here) |
| 31 | HeartButton.tsx:171-192 | save/favourite icon button, press | press, icon tier 0.94 | press 80-100 | `group-active:scale-[0.97] group-active:duration-[80ms]` | OK (note: 0.97 is the card tier; motion-22 puts an icon-only control at 0.94) |
| 32 | HeartButton.tsx:191-192 | the same button's `group-hover:scale-110` | in-place hover | snap 150 | `transition-transform duration-200 ease-glide` | WRONG-TIER |
| 33 | HeartButton.tsx:207 (`globals.css:462-469`) | `animate-heart-pop` on save | the earned save moment, motion-22 "Saving/favoriting" row | motion-22 locks the HeartButton pattern by name; the tier ladder covers transitions, not a one-shot celebratory keyframe | `heart-pop 350ms cubic-bezier(0.23,1,0.32,1)`, keyed so it runs once | NO RULE COVERS THIS (350ms exceeds the reveal ceiling, but the ceiling is written for transitions and motion-22 locks this pattern by name; needs an owner call, not an edit) |
| 34 | NearbyMap.tsx:178 | map teaser card link | press, card tier | press 80-100 | `transition-transform duration-200 ease-glide active:scale-[0.97]`, **no `active:duration`** so the press inherits 200ms | WRONG-TIER |
| 35 | Reviews.tsx:153-159 | review card full-card overlay button | press, card tier | press 80-100 | `active:scale-[0.98] active:duration-[80ms] transition-transform` | OK |
| 36 | Reviews.tsx:147-149 | review card hover lift + shadow step | in-place hover | snap 150 | `transition-[transform,box-shadow] duration-200 ease-glide` | WRONG-TIER (+ the row-25 `box-shadow` note applies) |
| 37 | Reviews.tsx:180-187 | salon link inside a review card | in-place colour | snap 150 | `transition-colors duration-150 ease-glide` | OK |
| 38 | Entdecken.tsx:190-203 | look card link (desktop hover bump) | in-place hover | snap 150 | `transition-transform duration-[250ms] ease-glide` | WRONG-TIER (250 is the reveal tier applied to an in-place hover; hard rule 1, the tier follows the JOB) |
| 39 | Entdecken.tsx:190-203 | look card, mobile press | press, card tier | press 80-100 | **no `active:scale` at all** | MISSING |
| 40 | Entdecken.tsx:296-300 | style-name pill, desktop hover reveal | in-place opacity flip | snap 150 | `transition-opacity duration-200` | WRONG-TIER |
| 41 | Entdecken.tsx:389-399 | "Alle entdecken" CTA card | in-place hover + press | snap 150 + press 80-100 | `transition-[transform,border-color] duration-[250ms] ease-glide`, no `active:scale` | WRONG-TIER (hover) + MISSING (press) |
| 42 | Entdecken.tsx:405-406 | the CTA card's inner arrow disc scale on hover | in-place hover | snap 150 | `transition-transform duration-[250ms] ease-glide` | WRONG-TIER |
| 43 | WalkInBand.tsx:119 | walk-in salon mini-card | press, card tier | press 80-100 | `transition-transform duration-200 ease-glide active:scale-[0.98]`, no `active:duration` so the press runs 200ms | WRONG-TIER |
| 44 | WalkInBand.tsx:156 | "alle Walk-ins" button | press | press 80-100 | `transition-[background-color,transform] duration-200 ease-glide ... active:scale-[0.97]`, no `active:duration` | WRONG-TIER |
| 45 | BusinessTeaser.tsx:75-77 | B2B CTA link | press + hover lift | press 80-100 + snap 150 | `transition-all duration-200 ease-glide hover:-translate-y-[1px] ... active:scale-[0.97]`, no `active:duration` | WRONG-TIER (both halves land on 200ms) |

### A4. Homepage loading motion

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 46 | WalkInBand.tsx:107-110 | 4 skeleton lines while the walk-in fetch is pending | loading placeholder, motion-22 "anything loading" row | motion-22 says shimmer; WCAG 2.2.2 caps auto-starting loops beside content at 5s | `animate-pulse` x4, Tailwind default `pulse 2s ... infinite`, no cycle cap | **WCAG-2.2.2** (auto-starts, loops forever, sits beside the rest of the homepage; a slow walk-in endpoint makes this a Level A failure with no code change) |

---

## B. Search: `/[locale]/[city]` and `/[locale]/[city]/[category]`

`app/[locale]/[city]/page.tsx` and `app/[locale]/[city]/[category]/page.tsx` contain **zero**
interactive elements and zero motion of their own; both are server shells that render
`SearchTemplate`. Nothing to audit at those two paths, which is correct and not a gap.

### B1. `_components/search/SearchTemplate.tsx`

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 47 | SearchTemplate.tsx:789-820 | scroll-linked chrome morph (band padding + pill shadow) | continuous, driven 1:1 by scroll position | LOCKFILE 16.5 gesture rule: driven 1:1, no fixed duration | `useMotionValue` + `useTransform` over `window.scrollY / 60`, no duration | OK |
| 48 | SearchTemplate.tsx:804-810 | the same under reduced motion | hard rule 3, end state, no listener | it still attaches the scroll listener but snaps to the two end-states (0 or 1) instead of ramping | OK for the end state / partial: hard rule 3 also says "attaches no scroll listener", and the listener is still attached at :812 |
| 49 | SearchTemplate.tsx:1218-1222 | the pinned search pill, opens the overlay | press, card tier | press 80-100 | no `active:scale`, no press transition | MISSING |
| 50 | SearchTemplate.tsx:1255-1262 | inline city text that was meant to collapse on scroll | it never changes state (the classes are unconditional per the V3-D421d comment) | not applicable | `transition-all duration-300 ease-glide` on a static `w-0 overflow-hidden opacity-0` | MISSING (dead transition; and `transition-all` over `w-0` would animate WIDTH, hard rule 2, if the collapse were ever re-enabled) |
| 51 | SearchTemplate.tsx:1265-1268 | line 2 (date + city + period), same story | never changes state | not applicable | `transition-all duration-300 ease-glide` on a static `max-h-5 opacity-100` | MISSING (dead transition; `transition-all` over `max-h` would animate HEIGHT, hard rule 2) |
| 51b | SearchTemplate.tsx:1283-1304 | map icon inside the pinned pill | in-place hover bg | snap 150 | `transition-all duration-300 ease-glide hover:bg-s-bg-sunken`, no press | WRONG-TIER + MISSING press |
| 52 | SearchTemplate.tsx:1330-1345 | filter button (opens the sheet / clears filters) | press + in-place bg flip | press 80-100 + snap 150 | `transition-[background-color,border-color,color,transform] duration-150 ease-glide` + `active:scale-[0.94] active:duration-[80ms]` | OK |
| 53 | SearchTemplate.tsx:1352-1370 | the filter icon crossfade (sliders to X when the count crosses 0) | in-place state flip | snap 150 | two stacked icons on `transition-all duration-300 ease-glide` | WRONG-TIER (300 is the reveal tier on an in-place flip; hard rule 1) |
| 54 | SearchTemplate.tsx:1385-1402 | filter pills row (each pill toggles or opens a section) | in-place chip select, and by hard rule 5 the most-repeated control on the screen | snap 150, and rule 5 says the fastest tier that still reads | `transition-[...] duration-150 ease-glide` + `active:scale-[0.97] active:duration-[80ms]` | OK |
| 55 | SearchTemplate.tsx:1455-1475 | sort segment button | press + in-place flip | press 80-100 + snap 150 | `transition-[border-color,transform] duration-150 ease-glide` + `active:scale-[0.97] active:duration-[80ms]` | OK |
| 56 | SearchTemplate.tsx:1489-1504 | sort dropdown menu rows | in-place row highlight | snap 150 | `transition-colors duration-150` | OK for the flip / MISSING press (row tier 0.98) |
| 57 | SearchTemplate.tsx:1489 | the sort dropdown opening | an overlay being revealed | reveal 250-300 | no enter/exit animation at all, the menu appears instantly | MISSING |
| 58 | SearchTemplate.tsx:1683-1697 | "Mehr laden" button | press | press 80-100 | `transition-[background-color,transform,opacity] duration-150 ease-glide` + `active:scale-[0.97] active:duration-[80ms]` | OK |
| 59 | SearchTemplate.tsx:1699 | `Loader2 animate-spin` inside that button | busy indicator, motion-22 "spinners only INSIDE buttons" | motion-22 sanctions it; WCAG 2.2.2 has an "essential to the activity" carve-out a busy indicator can claim | infinite spin, no cap | WCAG-2.2.2 (lower confidence: the carve-out plausibly applies to a button-local busy indicator; listed so the call is made deliberately, not by omission) |
| 60 | SearchTemplate.tsx:102 | map placeholder tile while the map chunk loads | loading placeholder | motion-22 shimmer; WCAG 2.2.2 5s cap | `animate-pulse`, infinite, no cap | **WCAG-2.2.2** |
| 61 | SearchTemplate.tsx:1822-1826 | close / back-to-list icon button in the map header | press, icon tier 0.94 | press 80-100 | `transition-transform active:scale-95` with no duration, so the press runs at Tailwind's 150ms default | WRONG-TIER |
| 62 | SearchTemplate.tsx:1830-1832 | search-open button in the map header | press | press 80-100 | no transition, no `active:scale` | MISSING |
| 63 | SearchTemplate.tsx:1857-1861 | the map bottom sheet settling to a detent | a sheet that TRAVELS | reveal 250-300; LOCKFILE 16.5 for the drag itself | `{ duration: 0 }` while dragging, then `tween ease [0.32,0.72,0,1] duration 0.32` on release | WRONG-TIER (320ms is above the 300 reveal ceiling and a sheet is not a full-screen transition) |
| 64 | SearchTemplate.tsx:645-700 | sheet content-region drag handoff (6px commit, drag vs scroll) | a finger-driven gesture | LOCKFILE 16.5: 1:1 tracking, velocity-seeded release | tracks 1:1 (`duration: 0` while `sheetDragging`), releases into the tween above | OK for the tracking / the release is a fixed tween, not velocity-seeded (LOCKFILE 16.5, outside THE SPEED LAW's scope) |
| 65 | SearchTemplate.tsx:1893-1906 | filter pills repeated inside the sheet | in-place chip select | snap 150 | `duration-150 ease-glide active:scale-[0.97] active:duration-[80ms]` | OK |
| 66 | SearchTemplate.tsx:1929-1982 | the ONE sheet morphing between LIST and SALON | content being revealed in place | reveal 250-300 | `AnimatePresence mode="wait"`, `duration 0.24, ease [0.32,0.72,0,1]` | OK |
| 67 | SearchTemplate.tsx:2007-2022 | map/list FAB | press + the FAB's own show/hide travel | press 80-100 + reveal 250-300 | `transition-[opacity,transform] duration-200 ease-glide` + `active:scale-[0.97] active:duration-[80ms]` | OK (press) / WRONG-TIER (the show/hide translate+fade at 200ms is between snap and reveal) |
| 68 | SearchTemplate.tsx:2193-2196 | empty-state primary CTA | press | press 80-100 | `transition-colors duration-150 hover:bg-black`, no `active:scale` | MISSING |
| 69 | SearchTemplate.tsx:2202-2205 | empty-state secondary text button | text control | snap 150 for the colour, no press motion needed | `hover:underline` only | OK |
| 70 | SearchTemplate.tsx:2348-2354 | error-state retry button | press | press 80-100 | `transition-colors duration-150 hover:bg-black`, no `active:scale` | MISSING |
| 71 | SearchTemplate.tsx:1115 | 350ms `setTimeout` gating a state change | not motion; a debounce | not applicable | timer only | OK (listed so it is not mistaken for a duration) |

### B2. `_components/search/SearchOverlay.tsx`

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 72 | SearchOverlay.tsx:767-768 | scrim fade-in / out | a scrim being revealed | reveal 250-300 | `duration 0.3, ease [0.32,0.72,0,1]`, `0` under reduced motion | OK |
| 73 | SearchOverlay.tsx:776-777 (`OPEN_T` at :62) | the overlay sheet sliding up from `y:100%` | it TRAVELS the full height; this is the closest thing on these surfaces to a full-screen transition | reveal 250-300, or above 300 only if judged full-screen | `duration 0.4` | WRONG-TIER (400ms; if the owner judges this full-screen the row flips to OK, that is a judgement the law leaves open) |
| 74 | SearchOverlay.tsx:785 | the service step entering | content revealed in place | reveal 250-300 | `duration 0.24, y 8 to 0` | OK |
| 75 | SearchOverlay.tsx:786-804 | **the scroll-driven expand: `height`, `marginLeft`, `marginRight`, `borderRadius` all animated** | continuous scroll-linked morph | hard rule 2: never animate width, height or top | `motion.div style={{ height: headingH }}` and `style={{ marginLeft: cardMx, ... }}`, driven by `expand` over `EXPAND_DIST = 120` | **HARD-RULE-2** (animating `height` and margins reflows every frame) |
| 76 | SearchOverlay.tsx:805-811 | the steps + footer regions of the same morph | same | hard rule 2 | `style={{ height: stepsH }}`, `style={{ height: footerH }}` | **HARD-RULE-2** |
| 77 | SearchOverlay.tsx:814-815 | step swap (stadt / zeit panels) | in-place panel swap, revealed | reveal 250-300 | `duration 0.26, y 16 to 0` | OK |
| 78 | SearchOverlay.tsx:842-843 | the sliding pill behind the daten/flexibel tabs | a small indicator travelling under two tabs | snap 150 (a tab switch is the law's own named snap example) | `layout` transition, `duration 0.28` | WRONG-TIER |
| 79 | SearchOverlay.tsx:845-850 | daten / flexibel tab labels | in-place tab switch | snap 150 | `transition-colors` = 150 default | OK |
| 80 | SearchOverlay.tsx:857 / :905 | daten / flexibel content crossfade | in-place content swap | snap 150 (in place) or reveal 250-300 (revealed) | `duration 0.18` | WRONG-TIER (180ms sits between the press and snap tiers) |
| 81 | SearchOverlay.tsx:885-886 | **the Uhrzeit section expanding, `height: 0` to `"auto"`** | a section being revealed | hard rule 2 forbids animating height regardless of tier | `height { duration 0.34 }`, `opacity { duration 0.24 }` | **HARD-RULE-2** (and 340ms exceeds the reveal ceiling) |
| 82 | SearchOverlay.tsx:893-894 | period-of-day chip | in-place chip select | snap 150 | `transition-colors` 150 | OK for the flip / MISSING press |
| 83 | SearchOverlay.tsx:909-910 | flexible-date chip | in-place chip select | snap 150 | `transition-colors` 150 | OK for the flip / MISSING press |
| 84 | SearchOverlay.tsx:863-868 | month prev / next arrows | press, icon tier 0.94 | press 80-100 | `hover:bg-s-bg-sunken` with no transition and no `active:scale` | MISSING |
| 85 | SearchOverlay.tsx:1059-1062 | calendar date cell | in-place selection | snap 150 | `transition-colors` 150 | OK for the flip / MISSING press |
| 86 | SearchOverlay.tsx:507 | step chip in the collapsed header | in-place select | snap 150 | no transition class | MISSING |
| 87 | SearchOverlay.tsx:519 | back button | press, icon tier | press 80-100 | no transition, no `active:scale` | MISSING |
| 88 | SearchOverlay.tsx:536-544 | the service `<input>` and its clear button | focus edge is set globally in `globals.css` | the design contract puts input focus in `globals.css`; the tier ladder does not assign one | no local transition | NO RULE COVERS THIS (focus treatment is owned by the global rule, not by THE SPEED LAW) |
| 89 | SearchOverlay.tsx:636-638 | "search anyway" full-width button | press | press 80-100 | `active:scale-[0.98]` with **no transition class**, so the scale is instantaneous (0ms) | MISSING (0ms is not the 80-100ms press tier) |
| 90 | SearchOverlay.tsx:755 | reset text button | text control | no press motion needed | `hover:underline` | OK |
| 91 | SearchOverlay.tsx:756 | primary commit CTA | press | press 80-100 | `active:scale-[0.98]`, no transition class, 0ms | MISSING |
| 92 | SearchOverlay.tsx:770-774 | the floating close X | press, icon tier | press 80-100 | animates in with the sheet, no press feedback | MISSING |
| 93 | SearchOverlay.tsx:990-996 | category chip row | in-place chip select, the most-repeated control here | snap 150 (hard rule 5) | `transition-colors duration-150 ease-glide` | OK for the flip / MISSING press |
| 94 | SearchOverlay.tsx:1013-1015 | `LookCard` tile | press, card tier | press 80-100 | `active:scale-[0.99]`, no transition class, 0ms | MISSING |
| 95 | SearchOverlay.tsx:1026-1028 | `AutocompleteRow` | press, row tier 0.98 | press 80-100 | no transition, no `active:scale` | MISSING |
| 96 | SearchOverlay.tsx:1076-1096 | `SuggestRow` + its remove button | press, row + icon tiers | press 80-100 | `hover:bg-s-bg-sunken` with no transition, no `active:scale` | MISSING |
| 97 | SearchOverlay.tsx:945-949 | **the three-dot loader** | busy indicator beside the overlay's content | WCAG 2.2.2 5s cap | `motion.span`, `duration 1.2, repeat: Infinity`, staggered `delay: i * 0.15`, no cap | **WCAG-2.2.2** (an explicit `repeat: Infinity`, the clearest instance on these surfaces) |
| 98 | SearchOverlay.tsx:600 | `Loader2 animate-spin` beside the geo-suggest list | busy indicator | WCAG 2.2.2 5s cap | infinite spin, no cap | **WCAG-2.2.2** |
| 99 | SearchOverlay.tsx:258 | `window.scrollTo(0, scrollY)` on close | scroll restoration | not motion | instant, no `behavior: smooth` | OK |

### B3. `_components/search/FilterSheet.tsx`

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 100 | FilterSheet.tsx:231-234 | **rating-slider fill** | a slider settling after release | hard rule 2: never animate width | `motion.div animate={{ width: "N%" }}`, `duration 0.22` on release | **HARD-RULE-2** (animating `width`; a `scaleX` transform does the same visual with no reflow) |
| 101 | FilterSheet.tsx:236-239 | **rating-slider thumb** | same | hard rule 2 (`left` is the same class of layout property as `top`) | `motion.div animate={{ left: "N%" }}`, `duration 0.22` | **HARD-RULE-2** |
| 102 | FilterSheet.tsx:217-229 | the slider drag itself | finger-driven | LOCKFILE 16.5: 1:1 tracking | `dragging.current ? { duration: 0 }` so it tracks 1:1 | OK |
| 103 | FilterSheet.tsx:366-383 (`SheetChip`) | every gender / amenity / deals chip | in-place chip select | snap 150 | `transition-[background-color,border-color,color,transform] duration-150 ease-glide` + `active:scale-[0.97] active:duration-[80ms]` | OK |
| 104 | FilterSheet.tsx:446-461 | sort option row | in-place selection | snap 150 | `transition-colors duration-150 ease-glide` | OK |
| 105 | FilterSheet.tsx:465-467 | the sort selection indicator | a small indicator moving between rows | snap 150 (an in-place selection change) | `duration 0.26` | WRONG-TIER |
| 106 | FilterSheet.tsx:578-583 | reset text button | text control | no press motion needed | `transition-colors duration-150` | OK |
| 107 | FilterSheet.tsx:598-605 | sheet close button | press | press 80-100 | `transition-colors duration-150 ease-glide` + `active:scale-[0.98] active:duration-[80ms]` | OK |
| 108 | FilterSheet.tsx (sheet container) | the sheet's own enter/exit | a sheet that travels | reveal 250-300 | the sheet primitive owns it; nothing declared in this file | NO RULE COVERS THIS at this file:line (the primitive is outside the audited scope) |

### B4. `_components/search/SalonResultCard.tsx`

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 109 | SalonResultCard.tsx:261 | compact list card | press, card tier | press 80-100 | `active:scale-[0.99]` with no transition class, 0ms | MISSING |
| 110 | SalonResultCard.tsx:316-320 | row-mode card, thumbnail shadow step on hover | in-place hover | snap 150 | `transition-[box-shadow] duration-200 ease-glide` | WRONG-TIER (+ TASTE_MOTION row 25: this is a `box-shadow` transition on the result grid) |
| 111 | SalonResultCard.tsx:384-388 | grid-mode card, hover lift + shadow | in-place hover | snap 150 | `transition-[transform,box-shadow] duration-200 ease-glide` | WRONG-TIER (+ row 25) |
| 112 | SalonResultCard.tsx:593-595 | map-mode select button (focuses the salon instead of navigating) | press, card tier | press 80-100 | no transition, no `active:scale` | MISSING |
| 113 | SalonResultCard.tsx:601 | map-mode card link | press | press 80-100 | `active:opacity-90` with no transition, 0ms, and opacity is not the motion-22 press vocabulary (scale is) | MISSING |
| 114 | SalonResultCard.tsx:616-626 | default card, hover lift + 1.015 scale + shadow | in-place hover | snap 150 | `transition-[transform,box-shadow] duration-200 ease-glide` | WRONG-TIER (+ row 25) |

### B5. `_components/search/CategoryHeroCarousel.tsx` and `CategoryBrowseRails.tsx`

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 115 | CategoryHeroCarousel.tsx:75-107 | **does it auto-advance?** | TASTE_MOTION finding 13 + mapping row 13: no auto-rotating carousel; substituting a timed sequence for a scannable set costs up to 2.8x | not applicable | it does NOT auto-advance. `onScroll` reads the index, `scrollToIndex` only fires from a dot tap at :187. No `setInterval`, no timer | OK (checked precisely because carousels are the prime WCAG 2.2.2 and finding-13 candidate; this one is clean) |
| 116 | CategoryHeroCarousel.tsx:85-87 | dot tap scrolls to a slide | programmatic scroll | not on the ladder | `scrollIntoView({ behavior: "smooth" })`, UA duration | NO RULE COVERS THIS |
| 117 | CategoryHeroCarousel.tsx:184-196 | the dot indicators themselves | in-place state flip between dot and pill | snap 150 | `transition-all duration-300 ease-glide`, and `transition-all` over `h-[7px] w-[22px]` vs `w-[7px]` animates WIDTH | WRONG-TIER + **HARD-RULE-2** (animating `width`) |
| 118 | CategoryHeroCarousel.tsx:115-125 | slide image hover zoom | in-place hover | snap 150 | `transition-transform duration-300 ease-glide group-hover:scale-[1.03]` | WRONG-TIER |
| 119 | CategoryBrowseRails.tsx (whole file) | category rail links | press, card tier | press 80-100 | no transition, no `active:scale`, no hover treatment anywhere in the file | MISSING |
| 120 | MapSalonDetail.tsx:123-126 | back button | press | press 80-100 | `active:scale-95` with no transition class, 0ms | MISSING |
| 121 | MapSalonDetail.tsx:181 / :197 | service links and the "alle Leistungen" link | text controls | no press motion needed | none | OK |

---

## C. Inspo `/[locale]/inspo/**`

### C1. `app/[locale]/inspo/page.tsx`

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 122 | inspo/page.tsx:445 | **the saved-heart wrapper collapsing when search takes focus** | an in-place control getting out of the way | snap 150; and hard rule 2 forbids animating width | `transition-all duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]` toggling `w-0 overflow-hidden opacity-0`, so `transition-all` animates **WIDTH** | **HARD-RULE-2** + WRONG-TIER (300ms on an in-place flip) |
| 123 | inspo/page.tsx:446-450 | the saved-heart button itself | press, icon tier | press 80-100 | `transition-colors duration-150 hover:text-s-ink`, no `active:scale` | MISSING |
| 124 | inspo/page.tsx:457 (`globals.css:600-604`) | the search-suggestions panel dropping in | an overlay being revealed | reveal 250-300 | `animate-[inspo-panel-in_.34s_cubic-bezier(.34,1.56,.64,1)]`, translateY(-8px) + scale(.98) | WRONG-TIER (340ms) |
| 125 | inspo/page.tsx:503-512 | category tile + label pill | in-place category select, the primary repeated control on this screen | snap 150 (hard rule 5) | `transition-colors duration-150` on the label; the 66px tile itself has no press or hover treatment | OK for the label flip / MISSING press on the tile |
| 126 | inspo/page.tsx:572-581 (`globals.css:605-610`) | sub-style / cut chip | in-place chip select | snap 150 | `transition-colors duration-150` plus `animate-[inspo-pillpop_.24s_cubic-bezier(.34,1.56,.64,1)]` on select | OK (150 flip; the 240ms pop is a one-shot select confirmation inside the reveal band) |
| 127 | inspo/page.tsx:628 / :638 | feed item tap (`ItemCard` / `VideoCard`) | press, card tier | press 80-100 | see rows 137-139 | MISSING |
| 128 | inspo/page.tsx:302-310 | infinite-scroll `IntersectionObserver` | load trigger, not motion | not applicable | observer only | OK |
| 129 | inspo/page.tsx:654-658 | **the three loading dots under the feed** | busy indicator beside the whole feed | WCAG 2.2.2 5s cap | `animate-pulse` x3 with `animationDelay` 0 / 0.2 / 0.4s, Tailwind `pulse 2s ... infinite`, no cap. On a slow page this runs for as long as the fetch takes | **WCAG-2.2.2** |
| 130 | inspo/page.tsx:679-681 | the Suspense fallback for the whole page | loading placeholder | motion-22 shimmer + WCAG 2.2.2 | `DiscoveryGridSkeleton`, see row 141 | **WCAG-2.2.2** |

### C2. `inspo/saved`, `inspo/saved/[id]`, `inspo/board/[id]`, `inspo/loading.tsx`, `inspo/error.tsx`

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 131 | inspo/saved/page.tsx:64-67 | back button | press, icon tier 0.94 | press 80-100 | `transition-transform duration-150 active:scale-95` | WRONG-TIER (150 is the snap tier; press is 80-100) |
| 132 | inspo/saved/[id]/page.tsx:53-56 | back button | press | press 80-100 | `transition-transform duration-150 active:scale-95` | WRONG-TIER |
| 133 | inspo/board/[id]/page.tsx:66-69 | back button over the board cover | press | press 80-100 | `transition-transform duration-150 active:scale-95` | WRONG-TIER |
| 134 | inspo/loading.tsx:1, :8-23 | the route-level skeleton (7 pills + 5 pills + 12 tiles) | loading placeholder | motion-22 shimmer + WCAG 2.2.2 | `<Skeleton>` primitive, which is `animate-shimmer` at `Skeleton.tsx:83` = `shimmer 1.5s ease-in-out infinite`, no cap, 24 elements looping at once | **WCAG-2.2.2** |
| 135 | inspo/error.tsx:3 | the route error fallback | static | not applicable | `ErrorFallback`, no motion | OK |
| 136 | inspo/[id]/page.tsx | the look detail route | server shell | not applicable | zero interactive elements of its own; renders `DetailPage` | OK |

### C3. Feed primitives: `MasonryGrid`, `ItemCard`, `VideoCard`, `LikeButton`, `CardSignals`

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 137 | MasonryGrid.tsx:24 | every grid item's entrance | a card entering a list, motion-22 "list first-load" row | reveal 250-300 | `animate-in fade-in duration-300` | OK on duration / it is an opacity-only fade, which the ENTER RECIPE (`MOTION.md` lines 16-48) forbids: opacity must travel with scale AND blur |
| 138 | ItemCard.tsx:53 | the whole look card tap target | press, card tier 0.97 | press 80-100 | `cursor-pointer` only. No `active:scale`, no transition, on the single most-tapped element of the Inspo feed | MISSING |
| 139 | VideoCard.tsx:75 | the video look card tap target | press, card tier | press 80-100 | same, `cursor-pointer` only | MISSING |
| 140 | LikeButton.tsx:104 | the inline like/save glyph | press, icon tier 0.94 | press 80-100 | `transition-transform duration-200 ease-glide group-hover:scale-110 group-active:scale-[0.95]`, no `active:duration` so the press runs 200ms | WRONG-TIER |
| 141 | LikeButton.tsx:117 | the circled variant of the same button | press, icon tier | press 80-100 | `duration-200` hover + `group-active:scale-[0.97] group-active:duration-[80ms]` | OK (press) / WRONG-TIER (200ms hover) |
| 142 | LikeButton.tsx:83-90 (`globals.css:462-469`) | `animate-heart-pop` on save | the earned save moment | motion-22 "Saving/favoriting" row locks this pattern | `heart-pop 350ms`, keyed so it runs once | NO RULE COVERS THIS (same 350ms-vs-300ms question as row 33) |
| 143 | CardSignals.tsx | the signal chips on a card | static metadata | no motion needed | none | OK (correctly no motion: a chip that never changes state has nothing to animate) |
| 144 | DiscoveryGridSkeleton.tsx:20 | **the feed skeleton** | loading placeholder | motion-22 shimmer + WCAG 2.2.2 | `animate-shimmer`, `shimmer 1.5s ease-in-out infinite`, no cap, rendered as the Suspense fallback for the entire Inspo feed | **WCAG-2.2.2** |

### C4. Inspo search + filter + panels

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 145 | discovery/SearchBar.tsx:55 | the search input | focus treatment is globally owned | not assigned by the tier ladder | `transition-colors` 150 default, focus overrides forced with `!` | NO RULE COVERS THIS (input focus lives in `globals.css` by the design contract) |
| 146 | discovery/SearchBar.tsx:59-62 | the clear (X) button | press, icon tier | press 80-100 | `transition-colors duration-150`, no `active:scale` | MISSING |
| 147 | SearchAutocomplete.tsx:61-66 / :86-91 / :118-122 | suggestion rows (term, salon, raw query) | press, row tier 0.98 | press 80-100 | `transition-colors duration-150 hover:bg-s-bg-sunken`, no `active:scale` | OK for the hover / MISSING press (x3 rows) |
| 148 | RecentSearches.tsx:110-114 | "clear all" text button | text control | no press motion needed | `transition-colors duration-150` | OK |
| 149 | RecentSearches.tsx:122-126 | a recent-term row | press, row tier | press 80-100 | `transition-colors duration-150`, no `active:scale` | MISSING |
| 150 | RecentSearches.tsx:139-144 | the per-row remove button | press, icon tier | press 80-100 | `transition-colors duration-150`, no `active:scale` | MISSING |
| 151 | AISuggestionPills.tsx:77-88 | a trending / AI suggestion pill | in-place chip select | snap 150 | `transition-[background-color,color,border-color] duration-150` | OK for the flip / MISSING press |
| 152 | FilterDrawer.tsx:59-62 | the filter open button | press, icon tier | press 80-100 | `transition-colors duration-150`, no `active:scale` | MISSING |
| 153 | FilterDrawer.tsx:69 | the drawer scrim | a scrim revealed | reveal 250-300 | `animate-in fade-in duration-200` | WRONG-TIER (200 is off-ladder between snap and reveal) |
| 154 | FilterDrawer.tsx:70 | the drawer itself sliding up | a sheet that TRAVELS | reveal 250-300 | `animate-in slide-in-from-bottom duration-300` | OK |
| 155 | FilterDrawer.tsx:77 | the drawer close X | press, icon tier | press 80-100 | `transition-colors duration-150`, no `active:scale` | MISSING |
| 156 | FilterDrawer.tsx:106-110 | the reset button | press, icon tier | press 80-100 | `transition-colors duration-150`, no `active:scale` | MISSING |
| 157 | FilterDrawer.tsx:115-117 | the apply / commit button | press | press 80-100 | `transition-transform duration-150 active:scale-[0.97]` | WRONG-TIER (the press runs at 150ms) |
| 158 | InlinePrefsPanel.tsx:66-69 | a preference pill (gender / texture / length) | in-place chip select | snap 150 | `transition-[background-color,color,box-shadow] duration-150` | OK for the flip / MISSING press |
| 159 | InlinePrefsPanel.tsx:103-123 | the expand/collapse header + its chevron | in-place disclosure flip | snap 150 | chevron `transition-transform duration-200`, header has no press feedback | WRONG-TIER + MISSING press |
| 160 | InlinePrefsPanel.tsx:129-135 | the panel body expanding | content revealed | reveal 250-300 | `duration: 0.2` | WRONG-TIER (200 is off-ladder) |
| 161 | InlinePrefsPanel.tsx:85-88 | the saved-confirmation flash | an earned moment, motion-22 says a success peak is `SuccessMark`, never a bare fade | reveal 250-300 for the entrance | `duration: 0.4, delay: 0.3`, and it is a plain fade with no `SuccessMark` | WRONG-TIER (400ms) |
| 162 | InlinePrefsPanel.tsx:190-198 | dismiss + save buttons | press | press 80-100 | save has `active:scale-[0.97] transition-[transform,filter] duration-150`; dismiss has `transition-colors` and no press | WRONG-TIER (save at 150ms) + MISSING (dismiss) |
| 163 | ProfileSetupModal.tsx:117-122 | the modal scrim | a scrim revealed | reveal 250-300 | `duration: 0.2` | WRONG-TIER |
| 164 | ProfileSetupModal.tsx:125-131 | the modal card entering | a card being revealed | reveal 250-300, and the ENTER RECIPE requires opacity + scale + blur together | inherits the parent's 0.2s; no blur | WRONG-TIER (+ ENTER RECIPE gap) |
| 165 | ProfileSetupModal.tsx:113 | the four pill groups (gender/texture/length/face) | in-place chip select | snap 150 | `transition-[color,background-color,border-color] duration-150` | OK for the flip / MISSING press |
| 166 | ProfileSetupModal.tsx:146 / :201 / :204-205 | close, cancel, save | press | press 80-100 | close and cancel have `hover:` only, save has `active:scale-[0.97] ... duration-150` | MISSING (close, cancel) + WRONG-TIER (save at 150ms) |
| 167 | PostFromDiscover.tsx:150-153 | the floating post FAB | press | press 80-100 | `active:scale-[0.97] transition-[transform,filter] duration-150` | WRONG-TIER |
| 168 | PostFromDiscover.tsx:163-168 | the composer scrim | a scrim revealed | reveal 250-300 | `duration: 0.2` | WRONG-TIER |
| 169 | PostFromDiscover.tsx:171-181 | the composer sheet entering | a sheet that travels | reveal 250-300 | inherits the 0.2s block | WRONG-TIER |
| 170 | PostFromDiscover.tsx:196-206 | photo / TikTok mode tabs | in-place tab switch, the law's own named snap example | snap 150 | `transition-colors duration-150` | OK for the flip / MISSING press |
| 171 | PostFromDiscover.tsx:239-258 | category + gender chips | in-place chip select | snap 150 | `transition-colors` 150 default | OK for the flip / MISSING press |
| 172 | PostFromDiscover.tsx:225-227 | the upload dropzone | press, card tier | press 80-100 | `transition-colors` only, no `active:scale` | MISSING |
| 173 | PostFromDiscover.tsx:294-299 | the post/commit button + its `Loader2 animate-spin` | press; the spinner is a button-local busy indicator | press 80-100; motion-22 sanctions in-button spinners | `transition-[transform,filter] duration-150`, no `active:scale`; the spinner is infinite with no cap | MISSING (press) + WCAG-2.2.2 (lower confidence, same carve-out as row 59) |
| 174 | PostFromDiscover.tsx:183 | the composer close X | press, icon tier | press 80-100 | no transition, no `active:scale` | MISSING |
| 175 | ToSCheckbox.tsx:30-33 | the terms checkbox | in-place toggle, the law's own named snap example | snap 150 | native `<input type="checkbox">`, no transition declared | MISSING |

### C5. `DetailPage` (`/inspo/[id]`) and `TikTokPlayer`

| # | file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|---|
| 176 | DetailPage.tsx:211 | the hero image resolving | an image being revealed, the law's own named reveal example | reveal 250-300 | `animate-in fade-in duration-500` | WRONG-TIER (500ms) |
| 177 | DetailPage.tsx:233-239 | the play button over the hero | press, icon tier | press 80-100 | `transition-transform duration-150 active:scale-95` | WRONG-TIER (press at 150ms) |
| 178 | DetailPage.tsx:247-255 | the back button | press, icon tier | press 80-100 | `transition-transform duration-150 active:scale-95` | WRONG-TIER |
| 179 | DetailPage.tsx:259-265 | the save (heart) button | press, icon tier | press 80-100 | `transition-transform duration-150 active:scale-95` | WRONG-TIER |
| 180 | DetailPage.tsx:272 | `animate-heart-pop` on that save | the earned save moment | motion-22 locks this pattern | 350ms one-shot | NO RULE COVERS THIS (same as rows 33 and 142) |
| 181 | DetailPage.tsx:283 | the player scrim | a scrim revealed | reveal 250-300 | `animate-in fade-in duration-200` | WRONG-TIER |
| 182 | DetailPage.tsx:284 | the player sheet sliding up | a sheet that travels | reveal 250-300 | `animate-in slide-in-from-bottom duration-300` | OK |
| 183 | DetailPage.tsx:285 / :298 | the two player close buttons | press, icon tier | press 80-100 | `transition-transform duration-150 active:scale-95` | WRONG-TIER (x2) |
| 184 | DetailPage.tsx:297 | the fullscreen TikTok backdrop | revealed | reveal 250-300 | `animate-in fade-in duration-200` | WRONG-TIER |
| 185 | DetailPage.tsx:306 | the whole content panel entering | a page-content entrance | reveal 250-300; the ENTER RECIPE requires opacity + scale + blur | `animate-in fade-in slide-in-from-bottom-4 duration-500` | WRONG-TIER (500ms) + ENTER RECIPE gap (no scale, no blur) |
| 186 | DetailPage.tsx:313 | the creator handle chip link | in-place colour | snap 150 | `transition-colors` 150 default | OK |
| 187 | DetailPage.tsx:332-335 | tag chips | in-place colour | snap 150 | `transition-colors duration-150` | OK |
| 188 | DetailPage.tsx:347-353 | the description "more" disclosure + chevron | in-place disclosure flip | snap 150 | chevron `transition-transform duration-200`; the text itself pops open with no transition | WRONG-TIER + MISSING (the disclosed text has no reveal) |
| 189 | DetailPage.tsx:361-368 | the details accordion + chevron | in-place disclosure flip | snap 150 | chevron `transition-transform duration-200`; body has no transition | WRONG-TIER + MISSING |
| 190 | DetailPage.tsx:392 / :416 / :432 | salon links and the "alle ansehen" link | text controls | no press motion needed | none | OK |
| 191 | DetailPage.tsx:442 | "more like this" items entering | cards entering a list | reveal 250-300 | `animate-in fade-in duration-300` | OK on duration / opacity-only, against the ENTER RECIPE |
| 192 | TikTokPlayer.tsx:131 | the seek bar (`role="slider"`) | finger-driven scrub | LOCKFILE 16.5: 1:1 | direct `seek` on click, no animation | OK |
| 193 | TikTokPlayer.tsx:141-146 | play / pause | press, icon tier | press 80-100 | `transition-transform duration-150 active:scale-95` | WRONG-TIER |
| 194 | TikTokPlayer.tsx:155-158 | the timestamp button | press | press 80-100 | `transition-transform duration-150 active:scale-95` | WRONG-TIER |
| 195 | TikTokPlayer.tsx:165-170 | mute / unmute | press, icon tier | press 80-100 | `transition-transform duration-150 active:scale-95` | WRONG-TIER |
| 196 | DiscoveryEmptyState.tsx:17-19 | the empty-state reset button | press | press 80-100 | `active:scale-[0.97] transition-[transform,border-color,color] duration-150` | WRONG-TIER (press at 150ms) |
| 197 | DiscoveryEmptyState.tsx (whole file) | the empty-state icon | motion-22 "Empty-state icon: breathe" | motion-22 assigns `.animate-breathe` | there is **no** `.animate-breathe` anywhere in this scope (checked: zero hits across homepage, search, inspo and discovery) | OK, and deliberately so: motion-22 assigns the breathe, but WCAG 2.2.2 and TASTE_MOTION finding 8 both argue against an infinite loop beside content. Not adding it is the safer read; flagging the rule conflict rather than resolving it |
| 198 | DiscoveryErrorState.tsx | the error state | static | no motion needed | none | OK |

---

## Where the law genuinely says nothing (NO RULE COVERS THIS)

These five are listed so they are not silently filled in with an invented number.

1. **Easing by direction.** TASTE_MOTION finding 17 and mapping row 17 recommend "entrances `glide`,
   in-place `snap`, exits `thud`, earned moments `spring`", and note `thud` already has the exit
   shape but is documented press-only. MOTION.md has NOT adopted that assignment. Across this scope,
   `ease-glide` is used on in-place colour flips (SectionHeader.tsx:162, SearchTemplate.tsx:1339)
   where the recommendation would say `snap`, and **`ease-thud` appears zero times**. Every exit
   animation here (scrim fade-out, sheet exit, `AnimatePresence` exit) reuses the enter curve. This
   is a real inconsistency, but no adopted rule covers it, so no row is marked WRONG.
2. **Programmatic smooth-scroll** (SectionHeader.tsx:123, CategoryHeroCarousel.tsx:87). The tier
   ladder has no entry for a rail scroll whose duration the user agent chooses.
3. **View transitions** (SalonCard.tsx:3, :370). "Above 300ms is reserved for a FULL-SCREEN
   transition only" permits it but names no value, and none is declared in code.
4. **One-shot celebratory keyframes over 300ms** (`animate-heart-pop`, 350ms, rows 33 / 142 / 180).
   The ceiling is written for transitions; motion-22 locks the HeartButton pattern by name. This is
   an owner call, not an edit.
5. **Input focus treatment** (SearchOverlay.tsx:536, discovery/SearchBar.tsx:55). The design
   contract puts input focus in `globals.css` as a global ink edge; THE SPEED LAW assigns it no tier.

One further conflict worth surfacing rather than resolving: **motion-22 assigns `.animate-breathe`
to empty-state icons and `animate-ping` to live status dots, and both are infinite loops that
TASTE_MOTION finding 14 makes a WCAG 2.2.2 Level A exposure.** Neither appears in this scope (row
197), which is lucky rather than designed. The vocabulary and the accessibility finding disagree,
and that disagreement is upstream of this audit.

## Not mounted, so not counted

Findings in files that no audited route reaches. Listed for completeness; none is a live defect.

- `BentoBusiness.tsx:96` `animate-ping` and `:160-168` three `animate-pulse` dots would both be
  WCAG 2.2.2 exposures if the component were re-mounted (`page.tsx:91` has the import commented out).
- `BentoBusiness.tsx:409` a 0.2s chart crossfade and `:482` a 0.4s spring; `:379` a 200ms tab chip.
- `Hero.tsx:285-333` sit inside `_DeprecatedSearchBar` (`Hero.tsx:246`), dead since SearchBar moved
  to its own file. The live hero renders `<SearchBar />` at `Hero.tsx:227`.
- `ImportProgressBar.tsx:46` `transition-[width] duration-200` is a hard-rule-2 shape, and `:52`
  `animate-shimmer` is a 2.2.2 shape (its 2500ms stall timer resets on every progress event, so a
  long import keeps it looping past five seconds). Not imported by any inspo route.
- `ProgressiveFilter.tsx:93` a 360ms `cubic-bezier(.34,1.4,.5,1)` indicator and `:161` a 340ms
  `max-height` transition (another hard-rule-2 shape). Not imported by `/inspo`.
- `StaffPortfolio.tsx:90` `animate-pulse`; `ReportButton.tsx:52/:182` 150ms and 200ms presses;
  `SaveButton.tsx:71` a 150ms fill transition; `DiscoveryAdmin.tsx` several spinners;
  `UserPostsSection.tsx:52` a duration-less hover overlay; `CategoryTabBar.tsx:42` a 150ms tab chip.
- `HeroDuo.tsx`, `CategoryPromos.tsx` (500ms image zoom), `FeaturedStylists.tsx`, `SolenStory.tsx`,
  `WhySolen.tsx`, `FeatureBento.tsx`, `CategoryStack.tsx`, `CategoryTabs.tsx`: all unmounted.

## The three most serious findings

1. **Ten auto-starting infinite loops with no cap, WCAG 2.2.2 Level A.** Rows 46, 60, 97, 98, 129,
   130, 134, 144, plus the two lower-confidence in-button spinners (59, 173). The worst two are
   `DiscoveryGridSkeleton.tsx:20` and `inspo/loading.tsx` via `Skeleton.tsx:83`, both
   `shimmer 1.5s ease-in-out infinite` covering the entire Inspo feed, and
   `SearchOverlay.tsx:945-949`, which states `repeat: Infinity` outright. A slow endpoint turns each
   of these into a Level A failure with nobody changing a line of code, and per TASTE_MOTION finding
   14, `globals.css:822-830`'s `prefers-reduced-motion` block does not discharge the criterion,
   because 2.2.2 asks for a mechanism the user can reach and most users never set that flag. The
   fix named by the research is a cycle cap or a degrade-to-static, not a discussion.

2. **Six sites animate `width`, `height` or `left`, which THE SPEED LAW hard rule 2 forbids
   outright.** `SearchOverlay.tsx:786-811` animates `height` and horizontal margins continuously as
   the user scrolls the overlay, so the layout reflows every frame of the gesture the owner is most
   likely to feel. `SearchOverlay.tsx:885-886` animates `height: 0` to `"auto"` over 340ms.
   `FilterSheet.tsx:231-239` animates the rating slider's `width` and the thumb's `left` on every
   release. `CategoryHeroCarousel.tsx:184-196` animates dot `width`, and `inspo/page.tsx:445`
   animates the saved-heart wrapper's `width` via `transition-all` on `w-0`. Each has a
   transform-only equivalent, so this is a mechanical defect, not a design tradeoff.

3. **Press feedback almost never lands on the press tier.** Miller 1968 puts input acknowledgement
   at 0.1s and it is the one row of the ladder with a primary source. Counted across the mounted
   files: 43 `active:scale-*` declarations, only 15 of which pair with `active:duration-[80ms]`, so
   28 presses run at their container's 150ms or 200ms. A further 35 pressable controls have no press
   feedback at all, including `ItemCard.tsx:53` and `VideoCard.tsx:75`, the single most-tapped
   elements of the Inspo feed, which offer the finger nothing. Compounding it, `duration-200` occurs
   25 times and the 250-300 band 16 times, mostly on in-place hovers, values that sit between the
   tiers the law says there is nothing between. The fix is one value per job, not a new tier.
