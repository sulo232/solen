<!-- D1: the three audits merged into ONE ranked list. Owner asked for "every button... a big list,
     idc if its 100 or 200", with the constraint "dont invent unnececary stuff, based on principle we
     made". Every row below traces to THE SPEED LAW or a cited finding in research/TASTE_MOTION.md. -->
# Motion: the ranked list (508 elements audited, ~330 defect rows)

| audit | elements | defect rows | WCAG 2.2.2 |
|---|---|---|---|
| PDP + booking | 192 | 124 | 16 |
| home + search + inspo | 199 | 128 | 10 |
| primitives + shared | 117 | 70 | 7 |
| **total** | **508** | **~330** | **33** |

Sources: `PDP_BOOKING.md`, `HOME_SEARCH_INSPO.md`, `PRIMITIVES_SHARED.md` (each row carries file:line,
the job, the tier the law assigns, what the code does today, and a verdict).

---

## RANK 1 , WCAG 2.2.2, Level A. 33 exposures. Not taste, a conformance failure.
Auto-starting looping motion that runs past 5s beside other content needs a pause/stop mechanism.
`prefers-reduced-motion` does NOT discharge it (the criterion asks for a user-facing mechanism).
TWO ARE UNCONDITIONAL , they do not depend on a slow endpoint, so they fail today, every time:
  - `SalonWalkInPanel.tsx:188` , `ping 2.6s infinite` runs for as long as the salon reads open, gated on
    no fetch at all, beside the whole PDP.
  - `resend-link/page.tsx:569` , spins for the entire rate-limit lockout (minutes) on a DISABLED button
    while nothing is in flight. That is also fabricated feedback: it signals work that is not happening.
THE REST, by blast radius:
  - `animate-shimmer` (tailwind.config.js:340) , 9+ call sites incl. Skeleton, SkeletonCard (x5 per card),
    DateTimePicker, SalonBundles, SalonProducts, DiscoveryGridSkeleton. A 6-card grid renders **30
    concurrent infinite shimmers** until the fetch resolves. Highest blast radius in the codebase.
  - `.skeleton-shimmer` (globals.css:982) , 5 sites in SearchTemplate. Its own comment claims
    "(2 cycles, then stops)" while the utility is `infinite`. The comment is wrong, not the code.
  - `animate-spin` , 62 occurrences across 36 files. Spinning is also a named vestibular trigger class.
  - `animate-ping` , BentoBusiness, queue/[token]:398, RefundCaseView. The queue tracker pings for
    minutes on a screen built to be watched.
  - `.walkin-ring-pulse` (globals.css:920) , infinite `box-shadow` animation, the worst paint case, and it
    renders beside the ping above, so that screen carries two independent infinite loops.
  - `.animate-breathe` (globals.css:1180) , EmptyStateDiscovery:90. The only one where "runs past five
    seconds" is unconditionally true, since an empty state has no endpoint to resolve.
  - `animate-bounce` , FormulaPhotoUpload:78.
FIX SHAPE: bound the loop to a finite cycle count that ends inside 5s and hold the final frame, or provide
a real stop control. The search overlay's three-dot loader was fixed this way already (repeat:2, ends 3.9s).

## RANK 2 , the press tier, the single systemic failure. ~100 rows.
THE SPEED LAW's press tier (80-100ms) is the only tier with a named primary source (Miller 1968:
"response to control activation... no more than 0.1 second"). It is almost nowhere.
  - PDP/booking: 36 elements press at 150/180/200ms, 47 have NO press feedback at all.
  - home/search: of 43 `active:scale-*`, only 15 pair with `active:duration-[80ms]`; 35 pressables have none.
  - primitives: 10 of 18 presses run at 150-200ms; 9 controls ship no press feedback.
  - Includes BOTH PDP commit buttons (`SalonSidebar.tsx:141`, `SalonMobileBookBar.tsx:76`) and the single
    most important button in the product, `PayConfirmStep.tsx:713`, at 150ms.
  - The mechanism: `active:scale-*` silently INHERITS the duration of the colour transition it shares a
    class with. This is drift from a solved problem , the correct pattern already ships in 5 places.
  - Worst single control: `ToggleCircle.tsx:60-84`, the service select toggle a booking hits most often ,
    colour 300ms, pop 420ms, layer morph 420ms.

## RANK 3 , the 420ms ENTER RECIPE contradicts the law. OWNER DECISION, not a fix.
7 rows / 9 code locations, every booking step, on entrances that are not full-screen. ENTER RECIPE is
owner-approved 2026-07-09; THE SPEED LAW is 2026-07-25 and says it supersedes the slower spread without
naming the recipe. The honest question, per TASTE_MOTION: 420ms was approved to fix an entrance the owner
could not perceive, but finding 10 (Chang & Ungar, UIST '93) says the BLUR is what buys perceptibility at
speed. So: does 420 buy anything that 250-300 with the blur kept does not? That is a side-by-side at
`/de/dev/motion`, never a prose argument. DO NOT edit the recipe before the owner picks.

## RANK 4 , the easing vocabulary. Zero new tokens needed.
`thud` = cubic-bezier(0.7,0,0.84,0) is a pure accelerate, exactly the exit shape Material, Microsoft and
Atlassian all specify. It has **ONE call site in the entire repo** (`Switch.tsx:98`, a press), and is
documented press-only. Meanwhile every exit in the shared layer is on the wrong shape: Sheet exit, Modal
exit and Sheet-backdrop exit use `snap`; Toast exit uses `glide`, the DECELERATE curve.
Root cause: MOTION.md has no by-direction curve rule at all, which is why `glide` has **132** uses doing
entrances, presses, colour flips and exits alike. The system also defines five decelerate shapes and three
spring shapes against ONE accelerate.
FIX: add "entrances decelerate (`glide`), exits accelerate (`thud`)" to MOTION.md and repoint the exits.

## RANK 5 , tier drift and dead vocabulary.
  - **200ms is a de-facto fourth tier**: 19 rows, and `globals.css:98` even names it `--dur-normal`.
    The law has no 200 tier. Either it becomes one or those rows move to snap 150.
  - **Over 300ms without being full-screen**: Sheet entry **600ms**, BellIcon hover-swing 700ms,
    RatingStars star-pop 450ms, CookieConsent banner 400ms, `.animate-in` 500ms.
  - **36 animation utilities/keyframes defined with ZERO call sites** against 22 alive. Three locked
    Motion-22 micro-moments were never wired (toast tilt-settle, value-roll, stamp-slam), and `Toast.tsx`
    hand-rolls a different entrance than the sheet locks.
  - `BookingWizard.tsx:213` uses `AnimatePresence mode="wait"`, making the step swap non-interruptible and
    roughly doubling wall time to ~520ms , against hard rule 4.
  - 3 more RULE-2 sites in the PDP scope: `SalonHero.tsx:154` carousel dots, `ServicesStaffStep.tsx:458`
    accordion, `resend-link:554` countdown bar.

## RANK 6 , NO RULE COVERS THIS (owner questions, deliberately not guessed). ~25 rows.
  - express-tier moments (`.celebrate-rise`, `.slot-cascade`, `.animate-count-bump`, all 400-480ms) have
    no ceiling in any rule.
  - non-gesture springs have no assigned tier (LOCKFILE 16.5 covers gesture-driven only).
  - text-clamp expansion has no vocabulary row.
  - Motion sheet 22 CONTRADICTS itself: it mandates `.animate-breathe` (3.4s infinite) on empty-state icons,
    which finding 14 makes a Level A exposure.

---
## Contradictions found in our own docs (stated, not silently fixed)
1. `globals.css:571` comments the skeleton shimmer "(2 cycles, then stops)"; the utility is `infinite`.
2. `OfflineBanner.tsx` documents "slides up from the bottom" and carries no transition class at all.
3. Motion sheet 22 mandates an infinite breathe that WCAG 2.2.2 makes a conformance failure.
