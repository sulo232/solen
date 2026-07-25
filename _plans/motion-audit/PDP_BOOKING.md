# Motion audit: salon PDP + booking flow

Read-only audit, 2026-07-25. Scope: `app/[locale]/salon/[slug]/**`, `app/[locale]/_components/salon/**`,
`app/[locale]/booking/**`, `app/[locale]/confirmation/**`, `components-legacy/salon/**`,
`components-legacy/booking/**`. Every verdict below traces to a rule that already exists (THE SPEED LAW in
`_design-system/MOTION.md`, the LOCKED ENTER RECIPE, Motion sheet 22, LOCKFILE section 16.5, or a finding in
`_design-system/research/TASTE_MOTION.md`). Where no existing rule covers a case it says NO RULE COVERS THIS
instead of a recommendation.

## Summary

**192 interactive or animated elements audited**: 176 rows in the tier tables (sections A-K) plus 16 looping
animations in the WCAG register. Of the 176 tier rows, **42 are OK**, **56 are WRONG-TIER** (the motion
exists but runs at the wrong speed for its job), **68 are MISSING** (an interactive element the locked
vocabulary assigns motion to, that has none), **3 break SPEED LAW hard rule 2** by animating `width` or
`height`, **1 breaks hard rule 4** (interruptibility), **5 are NO RULE COVERS THIS**, and 1 could not be
verified without reading a file outside the named scope. Separately, **16 are WCAG 2.2.2 (Level A) flags**:
auto-starting looping motion that can run past five seconds beside other content with no pause/stop
mechanism.

Those 124 wrong-tier and missing rows are not 124 separate mistakes. **One hundred of them are the press
tier.** THE SPEED LAW puts press feedback at 80-100ms, and it is the one tier with a named primary source
(Miller 1968 on control activation, `TASTE_MOTION.md` finding 1). In this scope 36 elements animate a press
at 150ms, 180ms or 200ms because the `active:scale-*` inherits the duration of the colour or filter
transition it shares a class with; 47 more have no press feedback at all; and 17 rows graded OK on their
colour flip still carry no press tier. The codebase already contains the correct pattern in five places
(`active:duration-[80ms]` in `TabPill`, `HeartButton`, the hero share button and the team-page pills;
`duration-100` on the three booking-lookup CTAs), so this is drift from a solved problem, not an open
question. **Seven more rows are the 420ms ENTER RECIPE** on card entrances that are not full-screen, which
sits above the ceiling of every source `TASTE_MOTION.md` can cite. The remaining 13 wrong-tier rows are
in-place state flips (chevrons, filter pills, the sticky nav, the service toggle) running at 200-300ms
where the law says 150ms.

Two implementation facts that shape the whole audit. First, `tailwind.config.js` sets no
`transitionDuration` override, so Tailwind 3.4.19's default applies: a bare `transition-colors` with no
duration class is **150ms on `cubic-bezier(0.4, 0, 0.2, 1)`**, which is exactly the SPEED LAW's snap tier on
Solen's own `snap` token. Un-numbered transitions in this codebase are therefore correct by accident, not
wrong. Second, `app/globals.css:822` carries a universal `prefers-reduced-motion` block that forces
`animation-duration`, `animation-iteration-count` and `transition-duration` down for every element, so hard
rule 3's end-state half is satisfied globally for CSS motion, and the framer-motion half is satisfied inside
`app/[locale]/_components/primitives/motion.ts`. Rule 3's remaining exposure is the unguarded scroll
listener in `SalonStickyTabNav`.

---

## Legend

| token | meaning | rule it traces to |
|---|---|---|
| `OK` | tier and property match the job | THE SPEED LAW tiers |
| `WRONG-TIER` | motion exists, runs at the wrong tier for its job | THE SPEED LAW, hard rule 1 (tier follows the JOB) |
| `MISSING` | the locked vocabulary assigns motion here, there is none | Motion sheet 22 table; ENTER RECIPE |
| `WCAG-2.2.2` | auto-starting loop, can exceed 5s, beside other content, no stop | TASTE_MOTION finding 14 (Level A) |
| `RULE-2` | animates `width` / `height` / `top` | THE SPEED LAW, hard rule 2 |
| `RULE-3` | reduced-motion not honoured (incl. "attaches no scroll listener") | THE SPEED LAW, hard rule 3 |
| `RULE-4` | not interruptible | THE SPEED LAW, hard rule 4 |
| `RULE-5` | a repeated action does not get the fastest tier that reads | THE SPEED LAW, hard rule 5; TASTE_MOTION finding 4 |
| `NO RULE` | the law genuinely does not cover this case | (owner question, see the register at the end) |

Tier reference, verbatim from THE SPEED LAW: **press 80-100ms** (input acknowledgement, press-scale, tap
feedback) · **snap 150ms** (in-place state flip: tab, chip, filter, toggle, selection) · **reveal
250-300ms** (something that travels or is revealed: sheet, card enter, title slide, image) · **above 300ms
= full-screen transitions only**.

Rows carry the primary verdict first. Secondary flags follow it.

---

## A. Salon PDP shell, hero, header, sticky nav

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `SalonHero.tsx:75` | mobile carousel photo tile (opens gallery) | acknowledge a tap | press 80-100 | NONE | **MISSING** (sheet 22 "Any press") |
| `primitives/BackButton.tsx:29` (used `SalonHero.tsx:105`) | back button, glass | acknowledge a tap | press 80-100 | `transition-[transform,background-color] duration-150 active:scale-[0.94]` | **WRONG-TIER** press at 150 |
| `SalonHero.tsx:114`+`:120` | share icon, over photo | acknowledge a tap | press 80-100 | `transition-transform duration-200 ease-glide group-hover:scale-110 group-active:scale-[0.97] group-active:duration-[80ms]` | **OK** press 80 correct; hover 200 is off-ladder |
| `SalonHero.tsx:124` -> `HeartButton.tsx:183,207,211` | save heart | acknowledge + express an earned moment | press 80-100 + express | `group-active:duration-[80ms]`; `animate-heart-pop 350ms`; 6x `.heart-burst 0.55s` | **OK** (sheet 22 "Saving/favoriting -> pop + 6-particle burst") |
| `ReportButton.tsx:182` (used `SalonHero.tsx:134`) | report flag, frost | acknowledge a tap | press 80-100 | `transition-transform duration-200 ease-glide group-active:scale-[0.97]`, no 80ms override | **WRONG-TIER** press at 200 |
| `SalonHero.tsx:154-164` | carousel position dots | in-place flip driven by scroll | snap 150 | `transition-all duration-200 ease-glide`, active dot `w-[6px]` -> `w-[18px]` | **RULE-2** animates width; also WRONG-TIER at 200 |
| `SalonHero.tsx:201,215,231,238,245` | desktop gallery tiles (5 buttons) | acknowledge a tap | press 80-100 | NONE | **MISSING** |
| `SalonHero.tsx:253` | "Alle Fotos ansehen" pill | acknowledge a tap | press 80-100 | NONE | **MISSING** |
| `SalonHeader.tsx:109` | "(N)" review-count button | acknowledge + colour flip | press 80-100 | `transition-opacity hover:opacity-80` (inherits 150) | **MISSING** press; hover tier OK |
| `SalonHeader.tsx:120` | open/closed status button | acknowledge a tap | press 80-100 | `transition-opacity hover:opacity-80` (inherits 150) | **MISSING** press |
| `SalonHeader.tsx:130` | address button (scrolls to map) | acknowledge a tap | press 80-100 | `transition-colors hover:text-s-ink` (inherits 150) | **MISSING** press |
| `SalonHeader.tsx:148` | desktop share | acknowledge a tap | press 80-100 | `transition-transform hover:scale-105 active:scale-95` (inherits 150) | **WRONG-TIER** press at 150 |
| `ReportButton.tsx:49-56` header variant (used `SalonHeader.tsx:165`) | report flag | acknowledge a tap | press 80-100 | `transition-transform hover:scale-105 active:scale-95` (inherits 150) | **WRONG-TIER** press at 150 |
| `SalonStickyTabNav.tsx:150-172` | sticky nav bar show/hide on scroll | in-place opacity flip | snap 150 | `transition-opacity duration-200`; `window.addEventListener("scroll", ...)` at `:58` with no `prefers-reduced-motion` guard | **WRONG-TIER** 200; also RULE-3 (listener attached unconditionally; the CSS half is covered by `globals.css:822`) |
| `SalonStickyTabNav.tsx:179` | mobile back (mini header) | acknowledge a tap | press 80-100 | `transition-transform active:scale-95` (inherits 150) | **WRONG-TIER** press at 150 |
| `SalonStickyTabNav.tsx:196` | mobile share (mini header) | acknowledge a tap | press 80-100 | `transition-transform active:scale-95` (inherits 150) | **WRONG-TIER** press at 150 |
| `SalonStickyTabNav.tsx:208-227` | section tabs (Photos/Services/Team/...) | in-place flip, tapped repeatedly | snap 150 | `transition-colors` (inherits 150) | **OK** flip; MISSING press feedback |
| `SalonStickyTabNav.tsx:225` | active-tab underline | in-place flip | snap 150 | NONE, mounts/unmounts instantly | **MISSING** |

## B. PDP sections

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `TabPill.tsx:47-48` (used `SalonServices.tsx:101`, `_components/SalonReviews.tsx:164`) | category / rating filter chips | in-place flip, tapped many times per session | snap 150 | `transition-[color,background-color,border-color,box-shadow] duration-200 ease-glide` + `active:scale-[0.97] active:duration-[80ms]` | **WRONG-TIER** flip at 200 (RULE-5: this is a repeated action); press 80 correct |
| `SalonServices.tsx:181` | "Buchen" link per service row | acknowledge a tap | press 80-100 | `transition-colors` (inherits 150) | **MISSING** press |
| `SeeAllButton.tsx:49` (used `SalonServices.tsx:129`, `_components/SalonReviews.tsx:200`, `SalonTeam.tsx:80`) | "Alle ansehen" | acknowledge a tap | press 80-100 | `transition-colors` (inherits 150) | **MISSING** press |
| `_components/SalonReviews.tsx:238` -> `ReportButton.tsx` row variant | report a review | in-place flip | snap 150 | `transition-colors duration-150 hover:bg-s-bg-sunken` | **OK** |
| `_components/SalonReviews.tsx:258` | "Mehr lesen" | acknowledge a tap | press 80-100 | `transition-opacity hover:opacity-80` (inherits 150) | **MISSING** press |
| `_components/SalonReviews.tsx:249` | review text clamp expand | reveal text in place | (see register) | NONE, instant clamp toggle | **NO RULE** COVERS THIS |
| `SalonImageGallery.tsx:158` | gallery close/back | acknowledge a tap; sheet 22 "Any close/X" = icon tier | press 80-100 at 0.94 | `transition-transform active:scale-95` (inherits 150) | **WRONG-TIER** press at 150; scale 0.95 off the 3-tier scale |
| `SalonImageGallery.tsx:267-291` | Pill tabs (Salon / Team / stylist / category) | in-place flip | snap 150 | `transition-colors` (inherits 150) | **OK** |
| `SalonImageGallery.tsx:225` | salon-tab photo tile | acknowledge a tap | press 80-100 | `transition-transform hover:scale-[0.99] active:scale-[0.98]` (inherits 150) | **WRONG-TIER** press at 150 |
| `SalonImageGallery.tsx:238` | team-tab photo (raw `<img onClick>`) | acknowledge a tap | press 80-100 | NONE | **MISSING**; inconsistent with the salon-tab tile on the same screen |
| `SalonLightbox.tsx:113` | lightbox modal container | an overlay being revealed | reveal 250-300 | NONE, appears and disappears instantly | **MISSING** |
| `SalonLightbox.tsx:122` | lightbox close X | sheet 22 "Any close/X" | press 80-100 at 0.94 | `transition-colors hover:bg-white/20` (inherits 150) | **MISSING** press |
| `SalonLightbox.tsx:142,162` | prev / next arrows | acknowledge a tap | press 80-100 | `transition-colors hover:bg-white/20` (inherits 150) | **MISSING** press |
| `SalonLightbox.tsx:136`+`:101-111` | photo swipe / arrow image change | a thing that travels; a finger-driven surface | reveal 250-300; LOCKFILE 16.5 for the gesture | NONE (instant swap); swipe is a `touchstart`/`touchend` distance threshold, not 1:1 finger-driven, no velocity spring | **MISSING**; also contradicts LOCKFILE 16.5 (gesture-driven elements release into a velocity-seeded spring and decide by velocity, not a bare position threshold) |
| `SalonPortfolio.tsx:116` | portfolio photo tile | acknowledge a tap | press 80-100 | `transition-transform hover:scale-[0.99] active:scale-[0.98]` (inherits 150) | **WRONG-TIER** press at 150 |
| `SalonTeam.tsx:88`+`:131` | stylist card | acknowledge a tap; hover lift | press 80-100 | avatar `transition-transform duration-200 group-hover:scale-[1.04]`, no `active:scale` | **WRONG-TIER** hover at 200; MISSING press |
| `SalonTeam.tsx:86-96` | stylist grid first load | sheet 22 "List first-load -> stagger rise-in" | `.salon-card-stagger` | NONE | **MISSING**. Note: `.team-wave` is GRAVEYARD (killed 2026-07-19), do not re-propose it |
| `SalonProducts.tsx:302` | product add / remove toggle | in-place flip; sheet 22 "Adding to a cart -> fly-dot" | snap 150 + `.cart-fly-dot` | `transition-colors` (inherits 150) | **MISSING** the cart fly-dot and press; the colour flip itself is OK |
| `SalonProducts.tsx:226` | products Checkout button | acknowledge a tap | press 80-100 at 0.97 | `transition-[filter] hover:brightness-[1.06]` (inherits 150) | **MISSING** press |
| `SalonBundles.tsx:181` | bundle "Buchen" link | acknowledge a tap | press 80-100 | `transition-colors` (inherits 150) | **MISSING** press |
| `SalonVenuesNearby.tsx:155,164` | rail scroll arrows | acknowledge a tap | press 80-100 | `transition-opacity hover:bg-s-bg-sunken disabled:opacity-30` (inherits 150) | **MISSING** press; also a property mismatch, it transitions `opacity` while the hover changes `background-color`, so the hover hard-cuts |
| `SalonVenuesNearby.tsx:184-198` | nearby-salon rail first load | sheet 22 "List first-load -> stagger rise-in" | `.salon-card-stagger` | NONE | **MISSING** |
| `SalonSidebar.tsx:130` | "(N)" review-count button | acknowledge a tap | press 80-100 | `transition-colors hover:text-s-accent-deep` (inherits 150) | **MISSING** press |
| `SalonSidebar.tsx:141` | "Termin buchen", the desktop primary commit | acknowledge the most important tap on the page | press 80-100 at 0.97 | `transition-colors hover:bg-black active:bg-black` (inherits 150), colour only | **MISSING** press |
| `SalonSidebar.tsx:153`+`:165` | hours disclosure row + chevron | in-place flip | snap 150 | button `transition-colors` (150); chevron `transition-transform duration-200` + `rotate-180` | **WRONG-TIER** chevron at 200; MISSING press |
| `SalonSidebar.tsx:172-191` | opening-hours list reveal | something being revealed | reveal 250-300 | NONE, instant show/hide | **MISSING** |
| `SalonSidebar.tsx:199` | "Route" directions link | acknowledge a tap | press 80-100 | `transition-opacity hover:opacity-80` (inherits 150) | **MISSING** press |
| `SalonMobileBookBar.tsx:74` | sticky book bar mount | (see register) | (see register) | NONE, appears instantly | **NO RULE** COVERS THIS |
| `SalonMobileBookBar.tsx:76` | "Termin buchen", the mobile primary commit | acknowledge the most important tap on mobile | press 80-100 at 0.97 | `transition-colors hover:bg-black active:bg-black` (inherits 150), colour only | **MISSING** press |
| `SalonLoyalty.tsx:68`+`:89` | loyalty accordion header + chevron | in-place flip | snap 150 | button `transition-shadow hover:shadow-elevation-2` (inherits 150); chevron `transition-transform duration-200` + `rotate-90` | **WRONG-TIER** chevron at 200; MISSING press; also TASTE_MOTION finding 25, never transition `box-shadow` |
| `SalonLoyalty.tsx:94` | loyalty accordion body | something being revealed | reveal 250-300 | NONE, instant show/hide | **MISSING** |
| `SalonBuy.tsx:46` | sidebar "Kaufen" | acknowledge a tap | press 80-100 | `transition-colors` (inherits 150) | **MISSING** press |
| `SalonBuy.tsx:60`+`:73` | gift-card promo card + chevron | hover affordance | snap 150 | `transition-shadow hover:shadow-elevation-3` (150); chevron `transition-transform group-hover:translate-x-1` (150) | **OK** tier; TASTE_MOTION finding 25 applies to the `box-shadow` transition |
| `SalonWalkInPanel.tsx:206` | "how walk-in works" info button | acknowledge a tap | press 80-100 at 0.94 | `transition hover:text-s-ink active:scale-90` (inherits 150) | **WRONG-TIER** press at 150; 0.90 is off the locked 3-tier scale |
| `SalonWalkInPanel.tsx:228,250` | barber-select cards | acknowledge a tap + selected flip | press 80-100 + snap 150 | NONE | **MISSING** |
| `SalonWalkInPanel.tsx:276` | service-category chips | in-place flip | snap 150 | `transition-colors` (inherits 150) | **OK** |
| `SalonWalkInPanel.tsx:298` | services expand toggle | in-place flip + reveal | snap 150 + reveal | `transition-colors hover:border-s-ink/25` (150); the expand itself has no reveal | **MISSING** the reveal; MISSING press |
| `SalonWalkInPanel.tsx:310-322` | walk-in info modal, backdrop, X | an overlay being revealed; close/X | reveal 250-300; press 0.94 | modal + backdrop NONE; X `transition active:scale-90` (150) | **MISSING** the overlay reveal; WRONG-TIER press; 0.90 off-scale |
| `SalonWalkInPanel.tsx:376` | "Join queue" link | acknowledge a tap | press 80-100 | `transition-colors hover:bg-s-border` (inherits 150) | **MISSING** press |
| `SalonModeToggle.tsx:36-48` | Termin / Walk-in segmented toggle | in-place flip | snap 150 | `transition-colors duration-150` (active also gains an untransitioned `shadow-[...]`) | **OK** flip; MISSING press |

## C. PDP sub-routes (reviews, team)

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `team/page.tsx:70` | back arrow | acknowledge a tap | press 80-100 | `transition-colors hover:bg-s-bg-sunken` (inherits 150) | **MISSING** press |
| `team/page.tsx:91-96` | "Egal / Anyone" quick-pick pill | acknowledge a tap + flip | press 80-100 + snap 150 | `transition-colors active:scale-[0.97] active:duration-[80ms]` | **OK** both tiers correct |
| `team/page.tsx:175-180` | per-card "Choose" pill | acknowledge a tap + flip | press 80-100 + snap 150 | `transition-colors active:scale-[0.97] active:duration-[80ms]` | **OK** |
| `team/page.tsx:167-172` | "View profile" link | hover affordance | snap 150 | `hover:opacity-80` with **no** `transition` property at all, so the opacity hard-cuts | **MISSING** |
| `team/page.tsx:99-109` | TeamCard list first load | sheet 22 "List first-load -> stagger rise-in" | `.salon-card-stagger` | NONE | **MISSING** |
| `legacy/SalonReviews.tsx:240` | reviews-page back arrow | acknowledge a tap | press 80-100 | `transition-colors` (inherits 150) | **MISSING** press |
| `legacy/SalonReviews.tsx:282,289` | rating filter chips (TabPill) | in-place flip, repeated | snap 150 | `duration-200 ease-glide` + `active:duration-[80ms]` | **WRONG-TIER** flip at 200 (RULE-5) |
| `legacy/SalonReviews.tsx:304-311` | "Write a review" `motion.button` | acknowledge a tap | press 80-100 at 0.97 | `whileHover={{scale:1.02}} whileTap={{scale:0.97}}` with **no** `transition` prop (framer default spring) + `transition-colors duration-150` | **NO RULE** for the undeclared spring duration; the 0.97 press value is correct, the hover-scale is not in any locked vocabulary |
| `legacy/SalonReviews.tsx:322-329` | sort trigger pill | acknowledge a tap | press 80-100 | `transition active:scale-[0.98]` (inherits 150; `transition` = every property) | **WRONG-TIER** press at 150 |
| `legacy/SalonReviews.tsx:379-386` | flag-review icon button | in-place flip | snap 150 | `transition-colors duration-150` | **OK** flip; MISSING press |
| `legacy/SalonReviews.tsx:402-408` | "Read more / less" | reveal text in place | (see register) | NONE | **NO RULE** COVERS THIS; MISSING press |
| `legacy/SalonReviews.tsx:433-437` | flag-form Cancel | acknowledge a tap | press 80-100 | `transition-colors duration-150` | **MISSING** press |
| `legacy/SalonReviews.tsx:440-446` | flag-form Submit | acknowledge a tap | press 80-100 | `transition-[transform,filter] duration-150 hover:brightness-[1.06]` | **WRONG-TIER** press at 150 |
| `legacy/SalonReviews.tsx:461-469` | review-photo thumbnail | acknowledge a tap | press 80-100 | `active:scale-[0.97] transition-[transform,background-color] duration-150` | **WRONG-TIER** press at 150 |
| `legacy/SalonReviews.tsx:500-506` | "Mehr laden" | acknowledge a tap | press 80-100 | `active:scale-[0.97] transition-[border-color,color,transform] duration-150` | **WRONG-TIER** press at 150 |
| `legacy/SalonReviews.tsx:513-529` | `AnimatePresence` around `ReviewForm` | reveal a form | reveal 250-300 | `AnimatePresence` wrapper with **no** `initial`/`animate`/`exit` at the call site; the child's own variants live in `ReviewForm.tsx`, outside this audit's scope | **UNVERIFIED**, not counted |
| `legacy/SalonReviews.tsx:539-553` | sort-sheet option rows + selected dot | in-place flip | snap 150 | NONE on either the row or the selection indicator | **MISSING** |

## D. Booking flow, wizard shell and step swap

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `BookingWizard.tsx:179,189` | back arrow (both variants) | acknowledge a tap | press 80-100 | `transition-colors hover:bg-s-ink/5` (inherits 150) | **MISSING** press |
| `BookingWizard.tsx:213-225` | step swap (services -> staff -> time -> pay) | a full-screen transition | reveal 250-300, or above 300 as full-screen | `useStepSwapMotion()`: opacity 0->1, scale 0.99->1, **260ms** `glide`; `AnimatePresence mode="wait"` | **RULE-4**. The duration is correct and owner-tuned. `mode="wait"` makes it non-interruptible: the exiting step must fully finish before the next starts, roughly doubling wall time to ~520ms and blocking a user who taps again mid-swap. Hard rule 4 says a user acting again mid-motion must not be made to wait |
| `BookingExitButton.tsx:39-46` | exit X in the header | sheet 22 "Any close/X" | press 80-100 at 0.94 | `transition-colors hover:bg-s-bg-sunken` (inherits 150) | **MISSING** press |
| `BookingExitButton.tsx:48-99` | "leave booking?" full-screen confirm overlay | a full-screen overlay being revealed | reveal 250-300 | `initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.16, ease:[0.2,0.8,0.4,1]}}` | **WRONG-TIER** 160ms (snap speed on a full-screen reveal); the ease is ad-hoc, not one of the four locked tokens; and it animates opacity alone, which the ENTER RECIPE forbids (carries a `// mockup-ok` escape) |
| `BookingExitButton.tsx:64,80,87` | overlay X, Cancel, Exit | acknowledge a tap | press 80-100 | `transition-colors` / `transition-[filter]` (inherit 150) | **MISSING** press (3 buttons) |

## E. Booking step 1, services

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `ServicesStaffStep.tsx:513-526` | sticky category chips (tap + scroll-spy) | in-place flip, repeated | snap 150 | `transition-colors` (inherits 150) | **OK** |
| `ServicesStaffStep.tsx:540`+`:425` | service-row list stagger | a card entering | reveal 250-300 | `useStaggerVariants()`, `staggerChildren: 0.05`, item = ENTER RECIPE opacity 0->1 / scale 0.96->1 / `blur(8px)`->`blur(0)` at **420ms** `glide` | **WRONG-TIER** 420ms on a non-full-screen entrance, above every ceiling `TASTE_MOTION.md` can cite (Material v1 "transitions that exceed 400ms may feel too slow", Material v2 max 300ms). Also RULE-5: every booking passes this list |
| `ServicesStaffStep.tsx:435-478` | service row press | acknowledge a tap | press 80-100 at 0.98 | `butterPress('row')` = `transition-all duration-[180ms] ease-glide hover:-translate-y-[1px] active:scale-[0.98]` | **WRONG-TIER** press at 180; 180 is also off-ladder (between snap and reveal, and the law says three tiers "and nothing between them"); `transition-all` would animate `width`/`height` too if they ever changed (RULE-2 risk) |
| `ServicesStaffStep.tsx:445-451` | row expand chevron | in-place flip | snap 150 | `transition-transform duration-[260ms] ease-glide` + `rotate-180` | **WRONG-TIER** reveal-tier duration on an in-place flip |
| `ServicesStaffStep.tsx:458-474` | row description accordion | reveal in place | reveal 250-300 | `initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.18, ease:GLIDE_EASE}}` | **RULE-2** animates `height`, which hard rule 2 forbids by name; also off-ladder at 180ms |
| `ServicesStaffStep.tsx:479-498` | ToggleCircle select button wrapper | acknowledge a tap | press 80-100 at 0.94 | `butterPress('icon')` = `duration-[180ms]` + `active:scale-[0.94]` | **WRONG-TIER** press at 180 |
| `ToggleCircle.tsx:60-84` | the service select/deselect toggle itself | an in-place selection flip, the single most repeated control in the flow | snap 150 | outer `transition-colors duration-300`; pop `scale [1,1.18,1]` at **420ms** `spring` ease; Plus layer and Check layer each **420ms** `glide` with an 8px/6px blur | **WRONG-TIER** on all three. RULE-5 applies hardest here: TASTE_MOTION finding 4 quotes Atlassian, "if someone will trigger this motion dozens of times a day, keep it under 150ms" |
| `ServicesStaffStep.tsx:566-587` | floating "N selected" pill | a small element being revealed | reveal 250-300 | `useEnterMotion()` 420ms ENTER RECIPE inside `AnimatePresence` | **WRONG-TIER** 420 |
| `ServicesStaffStep.tsx:576-584` | pill scroll-to-top button | acknowledge a tap | press 80-100 at 0.97 | `transition-transform duration-200 ease-glide active:scale-[0.97]` | **WRONG-TIER** press at 200 |
| `ServicesStaffStep.tsx:582` | selected-count bump | sheet 22 "Count/badge changes -> spring bump" | `.animate-count-bump` | `.animate-count-bump` (0.4s, `cubic-bezier(0.34,1.56,0.64,1)`) | **OK** per sheet 22. The 400ms exceeds the SPEED LAW ceiling, and the two laws disagree about whether an express moment is bound by it (see register) |
| `ServicesStaffStep.tsx:599-619` | CHF total + duration count-up | sheet 22 "Money value changes -> roll/odometer tick" | `.animate-value-roll` | `CountUpNumber.tsx`, a rAF loop at **480ms** `easeOutCubic`, reduced-motion safe | **WRONG-TIER** 480ms, above every tier; also a vocabulary deviation, sheet 22 names `.animate-value-roll` for this exact case |
| `ServicesStaffStep.tsx:623-635` | Weiter CTA | acknowledge a tap | press 80-100 at 0.97 | `transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.97]` | **WRONG-TIER** press at 150 |
| `ServicesStaffStep.tsx:632-633` | CTA arrow stroke-draw + head slide | hover micro-interaction | press/snap, fast | `transition-[stroke-dashoffset] duration-300 ease-glide` and `transition-transform duration-300 ease-glide` | **WRONG-TIER** 300ms on a hover micro-interaction; Atlassian's stated split (TASTE_MOTION finding 3) puts hover states in the fast tier |
| `ServicesStaffStep.tsx:628` | Continue-CTA spinner | loading feedback inside a button | sheet 22 "spinners only INSIDE buttons" | `animate-[spin_0.7s_linear_infinite]`, `isChecking` is a synchronous check | **OK**, bounded and correctly placed |
| `ServiceDetailSheet.tsx:124-130` | service detail sheet | a sheet being revealed | reveal 250-300 | `{type:'spring', damping:34, stiffness:320}` (measured: zeta ~0.95, settle ~235ms). No `AnimatePresence`, so there is **no exit** | **OK** on enter; **MISSING** the exit. TASTE_MOTION finding 17: exits take an accelerate curve, and Solen already owns it (`thud`) but documents it as press-only |
| `ServiceDetailSheet.tsx:132-139` | sheet close X | sheet 22 "Any close/X" | press 80-100 at 0.94 | `transition-colors hover:bg-s-bg-sunken` (inherits 150) | **MISSING** press |
| `ServiceDetailSheet.tsx:163-186` | required-option radio | in-place flip | snap 150 | `transition-colors` (inherits 150) | **OK** flip; MISSING press |
| `ServiceDetailSheet.tsx:201-218` | add-on toggle | in-place flip | snap 150 | ToggleCircle `size="lg"` (see `ToggleCircle.tsx:60-84`) | **WRONG-TIER** |
| `ServiceDetailSheet.tsx:226-236` | price / duration morph | a value changing in place | snap 150; sheet 22 "Money value changes -> roll" | `initial={{y:6,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:0.22, ease:[0.2,0.8,0.4,1]}}` | **WRONG-TIER** 220ms off-ladder; ad-hoc ease (not one of the four tokens); vocabulary deviation from `.animate-value-roll` |
| `ServiceDetailSheet.tsx:245,253` | Remove + Done buttons | acknowledge a tap | press 80-100 | `transition-colors` / `transition-[filter,opacity]` (inherit 150) | **MISSING** press |
| `EmptyServicesState.tsx:85-91` | "view salon page" link | acknowledge a tap | press 80-100 at 0.97 | `transition-transform duration-150 active:scale-[0.98]` | **WRONG-TIER** press at 150 |
| `EmptyServicesState.tsx:92-99` | "call salon" tel: link | acknowledge a tap | press 80-100, a SCALE tier | `transition-opacity active:opacity-60` (inherits 150) | **WRONG-TIER** press at 150; also off-vocabulary, sheet 22's press tier is a scale, not an opacity fade |
| `EmptyServicesState.tsx` (icon) | empty-state icon | sheet 22 "Empty-state icon -> breathe" | `.animate-breathe` | NONE, and no `<EmptyState>` primitive is used | **MISSING** per sheet 22, but see the register: `.animate-breathe` is `3.4s ... infinite`, so adding it creates a fresh WCAG 2.2.2 exposure |

## F. Booking step 2, staff

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `StaffStep.tsx:104-189` | stylist list stagger | a card entering | reveal 250-300 | `useStaggerVariants()` + ENTER RECIPE at **420ms** | **WRONG-TIER** 420 |
| `StaffStep.tsx:106,135` | stylist rows ("Egal" + each stylist) | acknowledge a tap | press 80-100 at 0.98 | `butterPress('row')` `duration-[180ms]` `active:scale-[0.98]` | **WRONG-TIER** press at 180 |
| `StaffStep.tsx:173-182` | "Profil ansehen" nested link | hover affordance | (text-decoration, not animatable meaningfully) | `hover:underline`, no transition | **OK**, no motion needed here |
| `StaffStep.tsx:230-236` | CheckBadge selected indicator | selection flip | snap 150 | NONE, with an explicit in-code decision: "No spring/pop, present or absent only (B4)" | **OK**, a documented owner decision. Do not re-propose |
| `StaffStep.tsx:203-214` | Weiter CTA | acknowledge a tap | press 80-100 at 0.97 | `butterPress('cta')` `duration-[180ms]` `active:scale-[0.97]` | **WRONG-TIER** press at 180 |
| `StaffStep.tsx:211-212` | CTA arrow stroke-draw + head slide | hover micro-interaction | fast tier | `duration-300 ease-glide` (both paths) | **WRONG-TIER** 300 on a hover |
| `StaffProfileSheet.tsx:133-139` | "Alle ansehen" reviews button | acknowledge a tap | press 80-100 | `transition-colors hover:border-s-ink/25` (inherits 150) | **MISSING** press |

## G. Booking step 3, date and time

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `DateTimeStep.tsx:160-227` | picker block entrance | a card entering | reveal 250-300 | `useEnterMotion()` ENTER RECIPE at **420ms** | **WRONG-TIER** 420 |
| `DateTimeStep.tsx:163-185` | stylist pill (jumps back to staff) | acknowledge a tap | press 80-100 | `transition-colors hover:border-s-ink/25` (inherits 150) | **MISSING** press |
| `DateTimePicker.tsx:314,338,394,408,460,578,655,801` | date strip, month nav, calendar cells, slot buttons | in-place flip | snap 150 | `transition-colors duration-150 ease-snap` throughout | **OK**, the cleanest implementation in the whole scope: exactly the snap tier on the standard curve. MISSING press feedback on the slot buttons |
| `DateTimePicker.tsx:519,565` | time-slot grid cascade | sheet 22 "Choice reveals a set -> cascade in" | `.slot-cascade` | `.slot-cascade` (`slot-in 0.4s cubic-bezier(0.16,1,0.3,1)`, delays 0.03s -> 0.43s) | **OK** per sheet 22. Per-item 400ms exceeds the SPEED LAW ceiling; see the register |
| `DateTimeStep.tsx:219-222` | empty-slot state (Clock icon + copy) | sheet 22 "Empty-state icon -> breathe" | `.animate-breathe` | NONE | **MISSING** per sheet 22; see the register for the 2.2.2 conflict |
| `DateTimeStep.tsx:241-247` | waitlist full-card CTA | acknowledge a tap | press 80-100 at 0.98 | `transition-[transform,filter] duration-150 active:scale-[0.98]` | **WRONG-TIER** press at 150 |
| `DateTimeStep.tsx:251-257` | waitlist quiet link | acknowledge a tap | press 80-100 | `transition-colors hover:text-s-ink` (inherits 150) | **MISSING** press |
| `DateTimeStep.tsx:268-275` | Weiter CTA | acknowledge a tap | press 80-100 at 0.97 | `transition-[transform,filter] duration-150 active:scale-[0.98]` | **WRONG-TIER** press at 150 |
| `WaitlistModal.tsx:89-96` | backdrop scrim | a scrim fading in | reveal 250-300 | `initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}` with **no** `transition` prop, so the framer default applies | **NO RULE** can grade an undeclared duration; the law only binds declared values |
| `WaitlistModal.tsx:97-103` | waitlist bottom sheet | a sheet being revealed | reveal 250-300 | `{type:'spring', damping:32, stiffness:320}` (measured: zeta ~0.89, settle ~250ms) | **OK** by effective duration |
| `WaitlistModal.tsx:126-128` | X close (form state) | sheet 22 "Any close/X" | press 80-100 at 0.94 | NONE | **MISSING** |
| `WaitlistModal.tsx:157-170` | time-range pills | in-place flip | snap 150 | `transition-colors` (inherits 150) | **OK** flip; MISSING press |
| `WaitlistModal.tsx:175-181` | join-waitlist submit | acknowledge a tap | press 80-100 at 0.97 | `transition-[transform,filter] duration-150 active:scale-[0.98]` | **WRONG-TIER** press at 150 |

## H. Booking step 4, hair

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `HairStep.tsx:38-53` | hair-type / length / thickness / beard pills | in-place flip | snap 150 | `transition-colors duration-150` | **OK** |
| `HairStep.tsx:152,169` | card 1 + card 2 entrance | a card entering | reveal 250-300 | `useEnterMotion()` and `useEnterMotion(0.05)`, ENTER RECIPE at **420ms** | **WRONG-TIER** 420 |
| `HairStep.tsx:197-206` | Notiz textarea | focus edge | snap 150 | NONE | **MISSING**; inconsistent with `GuestBookingForm`, which transitions the same focus edge at 150 `ease-snap` |
| `HairStep.tsx:217-219` | "hairChangeService" link | acknowledge a tap | press 80-100 | NONE | **MISSING** |
| `HairStep.tsx:227-234` | Weiter | acknowledge a tap | press 80-100 at 0.97 | `transition-transform duration-150 active:scale-[0.98]` | **WRONG-TIER** press at 150 |
| `HairStep.tsx:236-241` | Überspringen (skip) | acknowledge a tap | press 80-100 | NONE | **MISSING** |
| `HairStep.tsx:153-162` | "prefilled from profile" chip | appears after `/api/profile` resolves | reveal 250-300 | NONE, pops in | **MISSING** |

## I. Booking step 5, pay and confirm

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `PayConfirmStep.tsx:371,458` | summary card + price card entrance | a card entering | reveal 250-300 | `useEnterMotion()` / `useEnterMotion(0.05)` at **420ms** | **WRONG-TIER** 420 |
| `PayConfirmStep.tsx:416,433,450` | three "Ändern" buttons | acknowledge a tap | press 80-100 | NONE | **MISSING** (3 buttons) |
| `PayConfirmStep.tsx:522-529` | contact "Change" | acknowledge a tap | press 80-100 | `transition-opacity hover:opacity-80` (inherits 150) | **MISSING** press |
| `PayConfirmStep.tsx:539,548` | contact name + phone inputs | focus edge | snap 150 | NONE | **MISSING**; inconsistent with `GuestBookingForm` |
| `PayConfirmStep.tsx:513-561` | contact block, gated on `/api/profile` | sheet 22 "Anything loading -> skeleton, content-shaped" | skeleton | NONE, the block pops in when the fetch lands | **MISSING** |
| `PayConfirmStep.tsx:571-577` -> `GuestBookingForm.tsx:144,187,228` | three guest inputs | focus edge | snap 150 | `transition-[border-color,box-shadow] duration-150 ease-snap` | **OK**. Note: it transitions `box-shadow`, but the design contract killed the focus halo by name three times, so that half is dead code, and TASTE_MOTION finding 25 says never transition `box-shadow` |
| `PayConfirmStep.tsx:591,608` | pay-online / pay-in-person radios | in-place flip | snap 150 | `transition-colors` (inherits 150) | **OK** flip; MISSING press |
| `PayConfirmStep.tsx:672-679` | voucher code input | focus edge | snap 150 | NONE | **MISSING** |
| `PayConfirmStep.tsx:680-692` | voucher "Anwenden" | acknowledge a tap | press 80-100 | `transition-colors duration-150` | **OK** flip; MISSING press |
| `PayConfirmStep.tsx:713-718` | the main commit CTA (Buchen / Weiter zur Zahlung) | acknowledge the single most important tap in the product | press 80-100 at 0.97 | `transition-[transform,filter] duration-150 hover:brightness-[1.06] active:scale-[0.98]` | **WRONG-TIER** press at 150 |
| `BookingPaymentForm.tsx:181-189` | Stripe "Pay" button | acknowledge a tap | press 80-100 at 0.97 | `transition-[transform,filter] duration-150 active:scale-[0.98]` | **WRONG-TIER** press at 150 |
| `BookingPaymentForm.tsx:153-163` | form -> processing swap | a screen being replaced | reveal 250-300 | NONE, a bare conditional render | **MISSING** |
| `BookingPaymentForm.tsx:173-178` | declined error banner | something being revealed | reveal 250-300 | NONE | **MISSING** |
| `BookingPaymentForm.tsx:192-205` | "Andere Zahlungsart" | acknowledge a tap | press 80-100 | `transition-colors duration-150` | **OK** flip; MISSING press |

## J. Confirmation and post-booking

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `BookingConfirmation.tsx:432,442,513,557` | celebrate-rise stagger (h1 at 0.2s, details card, money card, CTA at 0.68s) | sheet 22 "Success peak"; Material's express role | `.celebrate-rise` | `.celebrate-rise` = `confirm-rise 0.42s cubic-bezier(0.16,1,0.3,1) both` (`globals.css:482`) | **OK** per MOTION.md's own choreography. 420ms exceeds the reveal ceiling; the two laws disagree, see the register. NOTE: `SuccessMark` is OWNER-KILLED on this surface (`BookingConfirmation.tsx:36-37`), do not re-propose it |
| `BookingConfirmation.tsx:395,402` | Help icon button (frosted + flat) | sheet 22 icon tier | press 80-100 at 0.94 | `transition active:scale-95` (inherits 150) | **WRONG-TIER** press at 150; 0.95 off the 3-tier scale |
| `BookingConfirmation.tsx:410-426` | salon name / address link | acknowledge a tap | press 80-100 | `focus-visible:` classes only, no transition | **MISSING** |
| `BookingConfirmation.tsx:444-461` | date row (opens RescheduleSheet) | acknowledge a tap | press 80-100 | no transition class | **MISSING** |
| `BookingConfirmation.tsx:554-562` | "Kalender hinzufügen" CTA | acknowledge a tap | press 80-100 at 0.97 | `transition-[filter,transform] duration-150 active:scale-[0.98]` | **WRONG-TIER** press at 150 |
| `BookingConfirmation.tsx:563-571` | "Directions" secondary CTA | acknowledge a tap | press 80-100 | NONE | **MISSING** |
| `BookingConfirmation.tsx:576-583` | "Cancel appointment" | acknowledge a tap | press 80-100 | `transition-opacity duration-150` | **OK** flip; MISSING press |
| `BookingConfirmation.tsx:596-607` | copy access-link (icon swaps for 1400ms) | in-place flip | snap 150 | `transition-colors duration-150` | **OK** flip; MISSING press |
| `BookingConfirmation.tsx:615-621` | "Manage booking" footer link | acknowledge a tap | press 80-100 | `transition-opacity duration-150` | **OK** flip; MISSING press |
| `RescheduleSheet.tsx:241` | reschedule confirm button | acknowledge a tap | press 80-100 at 0.97 | `transition active:scale-[0.98]` (inherits 150; `transition` = every property) | **WRONG-TIER** press at 150 |
| `CancelBookingSheet.tsx:93` | cancel-sheet X | sheet 22 "Any close/X" | press 80-100 at 0.94 | `transition active:scale-90` (inherits 150) | **WRONG-TIER** press at 150; 0.90 off the 3-tier scale |
| `CancelBookingSheet.tsx:159,168` | confirm-cancel + back buttons | acknowledge a tap | press 80-100 at 0.97 | `transition active:scale-[0.98]` (inherits 150) | **WRONG-TIER** press at 150 |
| `BookingCard.tsx:108` | booking card (hover lift + press) | acknowledge a tap; hover affordance | press 80-100 at 0.97 | `transition-[transform,box-shadow] duration-200 ease-glide hover:-translate-y-[2px] hover:shadow-elevation-2 active:scale-[0.98]` | **WRONG-TIER** press at 200; also TASTE_MOTION finding 25, this transitions `box-shadow` on a hover-heavy card |
| `BookingCard.tsx:152` | card primary pill | acknowledge a tap | press 80-100 at 0.97 | `transition-transform duration-150 active:scale-[0.97]` | **WRONG-TIER** press at 150 |
| `BookingCard.tsx:160` | card icon button | acknowledge a tap | press 80-100 at 0.94 | `transition-transform duration-150 active:scale-[0.97]` | **WRONG-TIER** press at 150; 0.97 on an icon-only control, the icon tier is 0.94 |
| `BookingsList.tsx:146,156,166` | three content tabs | in-place flip | snap 150 | `border-b-2 transition-colors` (inherits 150) | **OK** flip; MISSING press |

## K. Booking lookup and resend-link

| file:line | element | job | tier the law assigns | today | verdict |
|---|---|---|---|---|---|
| `lookup/page.tsx:258-268` | AppBar back / close | acknowledge a tap | press 80-100 | `transition-colors duration-150 ease-snap hover:brightness-[0.97]` | **OK** flip; MISSING press |
| `lookup/page.tsx:343,390` | order-number + email inputs | focus edge | snap 150 | `transition-[border-color,box-shadow] duration-150 ease-snap` | **OK** (same dead `box-shadow` note as `GuestBookingForm`) |
| `lookup/page.tsx:427-434` | submit CTA | acknowledge a tap | press 80-100 at 0.97 | `transition-transform duration-100 ease-snap active:scale-[0.97]` | **OK**. This is the only press-tier-correct CTA in the whole scope |
| `lookup/page.tsx:435-440` | "Log in instead" link | acknowledge a tap | press 80-100 | NONE | **MISSING** |
| `lookup/page.tsx:483-490` | SentView Resend (ghost) | acknowledge a tap | press 80-100 | `transition-colors duration-150 ease-snap` | **OK** flip; MISSING press |
| `lookup/page.tsx:491-497` | "Try a different order" | acknowledge a tap | press 80-100 | NONE | **MISSING** |
| `lookup/page.tsx:544-548` | "Request new link" CTA | acknowledge a tap | press 80-100 at 0.97 | `duration-100 ease-snap active:scale-[0.97]` | **OK** |
| `lookup/page.tsx:602-616` | copy-order-number button | in-place flip | snap 150 | NONE (icon swap is instant) | **MISSING** |
| `lookup/page.tsx:629-638` | "Report or refund" CTA | acknowledge a tap | press 80-100 at 0.97 | `duration-100 ease-snap active:scale-[0.97]` | **OK** |
| `resend-link/page.tsx:163-171` | header back | acknowledge a tap | press 80-100 | `transition-colors duration-150 ease-snap` | **OK** flip; MISSING press |
| `resend-link/page.tsx:368-384` | email / phone channel tabs | in-place flip | snap 150 | `transition-colors duration-150 ease-snap`; the active state also gains an untransitioned `shadow-card` | **OK** flip; the shadow half hard-cuts; MISSING press |
| `resend-link/page.tsx:318,387,401` | order-number, email, phone inputs | focus edge | snap 150 | `transition-[border-color,box-shadow] duration-150 ease-snap` | **OK** |
| `resend-link/page.tsx:431-438` | submit CTA | acknowledge a tap | press 80-100 at 0.97 | `duration-100 ease-snap active:scale-[0.97]` | **OK** |
| `resend-link/page.tsx:442-444` | "Find booking instead" | acknowledge a tap | press 80-100 | NONE | **MISSING** |
| `resend-link/page.tsx:498-507` | SentView Resend | hover affordance | snap 150 | `hover:bg-s-bg-sunken` with **no** `transition` property, so it hard-cuts | **MISSING**; inconsistent with `lookup/page.tsx:483`, the same control, which does transition |
| `resend-link/page.tsx:554-560` | lockout countdown progress bar | a bounded countdown | (measured, ticking) | `transition-[width] duration-1000 ease-linear`, `style={{width: pct%}}` | **RULE-2** animates `width`, which hard rule 2 forbids by name (`transform: scaleX()` is the reflow-free equivalent). WCAG 2.2.2 does NOT bind here, the movement is essential to the countdown activity, which is the criterion's own exception |

---

## WCAG 2.2.2 register (Level A)

SC 2.2.2 Pause, Stop, Hide: any moving information that **(1)** starts automatically, **(2)** lasts more
than five seconds and **(3)** runs in parallel with other content needs a mechanism to pause, stop or hide
it, unless the movement is essential to the activity. TASTE_MOTION finding 14 makes the operative point: a
slow endpoint turns a compliant shimmer into a Level A failure with nobody changing a line of code, and
`prefers-reduced-motion` does **not** discharge the criterion, because the criterion asks for a mechanism
available to the user and most users never set that flag. The fix the research names is a **cycle cap**
(stop the loop or swap to a static state after a bounded number of cycles), not a discussion.

| # | file:line | what loops | rate | can it exceed 5s? |
|---|---|---|---|---|
| 1 | `components-legacy/salon/SalonWalkInPanel.tsx:188` | live-status "ping" halo, inline `style={{ animation: "ping 2.6s cubic-bezier(0,0,.2,1) infinite" }}` | 2.6s, infinite | **Always.** It is not gated on a fetch at all; it runs for as long as the salon reads open, beside the entire PDP. Clearest failure in the scope |
| 2 | `app/[locale]/booking/resend-link/page.tsx:569` | spinner on the **disabled** lockout CTA | 0.7s, infinite | **Always.** It spins for the full rate-limit lockout, which is minutes. Nothing is in flight, so it is also feedback for a request that does not exist |
| 3 | `app/[locale]/booking/lookup/page.tsx:510` | full-screen ExchangingView spinner | 0.7s, infinite | Yes, on a slow token exchange. Also a sheet 22 violation: "spinners only INSIDE buttons" |
| 4 | `components-legacy/booking/BookingPaymentForm.tsx:153-163` | `Spinner size="lg"` in the processing block | 0.7s, infinite | Yes. A Stripe card confirm routinely exceeds 5s, and a 3DS challenge always does. Also a sheet 22 violation, the spinner is not inside a button |
| 5 | `components-legacy/booking/StaffProfileSheet.tsx:104-106` | staff-reviews spinner | 0.7s, infinite | Yes, on a slow `/api/staff/[id]/profile`. Also outside a button |
| 6 | `components-legacy/booking/PayConfirmStep.tsx:719` | main-CTA spinner during `POST /api/bookings` + the Stripe intent | 0.7s, infinite | Yes. Placement is correct (inside the button) |
| 7 | `app/[locale]/booking/lookup/page.tsx:429` | submit-CTA spinner | 0.7s, infinite | Yes, on a slow lookup. Placement correct |
| 8 | `app/[locale]/booking/resend-link/page.tsx:433` | submit-CTA spinner | 0.7s, infinite | Yes. Placement correct |
| 9 | `app/[locale]/salon/[slug]/loading.tsx:6` | route skeleton, gallery block | `animate-pulse` 2s, infinite | Yes, on a slow salon fetch |
| 10 | `app/[locale]/salon/[slug]/loading.tsx:9` | route skeleton, title bar | 2s, infinite | Yes |
| 11 | `app/[locale]/salon/[slug]/loading.tsx:10` | route skeleton, subtitle bar | 2s, infinite | Yes |
| 12 | `app/[locale]/salon/[slug]/loading.tsx:11` | route skeleton, meta bar | 2s, infinite | Yes |
| 13 | `app/[locale]/salon/[slug]/loading.tsx:14` | route skeleton, desktop right panel | 2s, infinite | Yes |
| 14 | `app/[locale]/_components/salon/SalonProducts.tsx:106,108,109` | product-row skeletons | `animate-shimmer` 1.5s, infinite | Yes, waits on the products fetch |
| 15 | `app/[locale]/_components/salon/SalonBundles.tsx:97` | bundle-card skeleton | `animate-shimmer` 1.5s, infinite | Yes, waits on the bundles fetch |
| 16 | `app/[locale]/_components/salon/SalonVenuesNearby.tsx:133-139` | 3 nearby-salon skeletons | `animate-pulse` 2s, infinite | Yes, waits on `/api/salons/by-category` |

One more, listed for completeness and **not counted**: `primitives/DateTimePicker.tsx:526` runs
`animate-shimmer` on the time-slot skeleton while `/api/availability/time-slots` is in flight. It is the
same exposure, in a primitive just outside the named scope but rendered by `DateTimeStep`.

Secondary observation from the same set: the skeleton treatment is inconsistent. `SalonProducts`,
`SalonBundles` and `DateTimePicker` use `animate-shimmer`; `loading.tsx` and `SalonVenuesNearby` use
Tailwind's `animate-pulse`. Motion sheet 22 names one pattern for this row: "skeleton SHIMMER,
content-shaped".

---

## NO RULE COVERS THIS (owner questions, not guesses)

**1. The 420ms ENTER RECIPE versus THE SPEED LAW's 300ms ceiling.** Seven rows, covering nine code
locations, apply the LOCKED ENTER RECIPE (`motion.ts:39`, `ENTER_DURATION = 0.42`) to entrances that are
not full-screen:
`ServicesStaffStep.tsx:425` and `:566`, `StaffStep.tsx:104`, `DateTimeStep.tsx:160`, `HairStep.tsx:152` and
`:169`, `PayConfirmStep.tsx:371` and `:458`, plus `ToggleCircle.tsx` layer morphs. THE SPEED LAW
(owner-approved 2026-07-25) says above 300ms is "reserved for a FULL-SCREEN transition only". The ENTER
RECIPE is owner-approved 2026-07-09. By the precedence chain the later dated decision wins, and the SPEED
LAW's own heading says it "supersedes this file's slower spread", but it does not name the ENTER RECIPE.
`TASTE_MOTION.md` NOT-SUPPORTED item 3 states the correct move explicitly: **surface it, do not edit it**,
and it names the question worth asking, because 420ms was approved to fix an entrance the owner could not
perceive, while finding 10 says the blur is what buys perceptibility at speed. The question is whether
420ms buys anything the blur is not already buying at 250-300ms, and the research says that is a
side-by-side to feel at `/de/dev/motion`, not a question to answer in prose.

**2. Express-tier moments have no ceiling.** Three cases run at 400-480ms and are all sanctioned by Motion
sheet 22 rather than by the tier ladder: `.animate-count-bump` at 400ms (`ServicesStaffStep.tsx:582`),
`.slot-cascade` at 400ms per item (`DateTimePicker.tsx:519,565`), `.celebrate-rise` at 420ms
(`BookingConfirmation.tsx:432,442,513,557`), plus `CountUpNumber` at 480ms
(`ServicesStaffStep.tsx:599-619`). THE SPEED LAW's three tiers describe press, in-place flip, and travel.
It never says whether a celebratory or "express" moment (Material's third role, TASTE_MOTION finding 9) is
bound by the 300ms ceiling. Nothing in the law resolves this, so no verdict is issued on the four.

**3. Non-gesture springs have no assigned tier.** `ServiceDetailSheet.tsx:129` and `WaitlistModal.tsx:102`
use framer springs (`damping 34 / stiffness 320` and `damping 32 / stiffness 320`). LOCKFILE section 16.5
locks springs for **gesture-driven** elements, seeded with the finger's velocity. These sheets are not
finger-driven, they open from a tap. The SPEED LAW is expressed in durations and says nothing about a
spring's parameters. Both happen to settle at roughly 235ms and 250ms, inside the reveal band, so nothing
is visibly wrong, but the law provides no way to grade them. Related: `WaitlistModal.tsx:89` and
`legacy/SalonReviews.tsx:304` declare no transition at all and inherit framer's default, and the law cannot
grade a value that is not written down.

**4. Text-clamp expansion ("Mehr lesen") has no vocabulary row.** `_components/SalonReviews.tsx:249` and
`legacy/SalonReviews.tsx:402` expand a clamped review in place with no motion. The copy-economy rule locks
the *pattern* (an inline blue "Mehr lesen" that expands in place) but assigns it no motion, and Motion
sheet 22 has no row for it. An accordion pattern exists in the codebase (`ServicesStaffStep.tsx:458`), but
it animates `height`, which hard rule 2 forbids, so it is not a template to copy.

**5. Sticky-bar mount.** `SalonMobileBookBar.tsx:74` appears with no entrance. Motion sheet 22 has no row
for a sticky action bar, and reading the ENTER RECIPE's "every element entrance" as "every element must
have an entrance" would contradict Apple's restraint clause (TASTE_MOTION finding 5) and hard rule 5. No
rule requires motion here, so none is recommended.

**6. A conflict inside the locked vocabulary itself.** Motion sheet 22 says "Empty-state icon -> breathe",
and `.animate-breathe` is `breathe 3.4s ease-in-out infinite` (`globals.css:1180`). Adding it to
`DateTimeStep.tsx:219` and `EmptyServicesState.tsx` would satisfy sheet 22 and create two new WCAG 2.2.2
exposures at the same time, on screens that also carry an active booking task, which is exactly what
TASTE_MOTION finding 8 warns against ("any LOOPING or ambient animation on a screen that also carries a
task is spending the user's attention on something that is not the task"). Both rows are marked MISSING
against sheet 22, but no fix is proposed, because the two laws contradict each other here.

---

## Things deliberately NOT flagged

- **`SalonTeam` has no wave-hello.** Motion sheet 22 lists `.team-wave` for "People/avatars first in view",
  but `team-wave` is in the graveyard, killed 2026-07-19. It is not re-proposed.
- **`BookingConfirmation` has no `SuccessMark`.** Sheet 22 lists it for the success peak, but
  `BookingConfirmation.tsx:36-37` records it as owner-killed for this surface, for every state. Not
  re-proposed.
- **`StaffStep.tsx:230` CheckBadge has no pop.** The code carries the decision inline ("No spring/pop,
  present or absent only (B4)"). Marked OK.
- **`StaffStep.tsx:173` "Profil ansehen" has only `hover:underline`.** A text-decoration change is the
  locked link affordance and is not usefully animatable. Marked OK, no motion needed.
- **Un-numbered `transition-*` classes are not treated as errors.** With no `transitionDuration` override
  in `tailwind.config.js`, Tailwind 3.4.19's default is 150ms on `cubic-bezier(0.4, 0, 0.2, 1)`, which is
  the snap tier on Solen's own `snap` token. Roughly forty rows in this audit are correct for that reason.
- **The universal reduced-motion block satisfies hard rule 3 for CSS.** `globals.css:822` forces
  `animation-duration`, `animation-iteration-count` and `transition-duration` down globally, and
  `motion.ts` handles the framer half via `useReducedMotion()`. The only rule-3 exposure found is the
  unguarded scroll listener at `SalonStickyTabNav.tsx:58`.
- **`components-legacy/salon/ServiceCategoryFilter.tsx` was inventoried but has no importers** anywhere
  under `app/` or `components-legacy/` in this working tree, so its rows are excluded from the counts.
  It also imports `motion` from `motion/react` and never uses it.
