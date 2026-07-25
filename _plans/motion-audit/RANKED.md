<!-- D1: SIX audits merged into ONE ranked list. Owner asked for "every button... a big list, idc if its
     100 or 200", then "find me tons", with the constraint "dont invent unnececary stuff like based on
     principle we made or if u didnt make it its a loop". Every row below traces to THE SPEED LAW
     (MOTION.md), a numbered finding in research/TASTE_MOTION.md, or a locked row of the CLAUDE.md
     design contract. Where no rule reaches a case, the verdict is NO RULE COVERS THIS, never a guess. -->
# Motion: the ranked list (1,386 elements audited, ~870 defect rows, 112 WCAG exposures)

| audit | elements | defect rows | WCAG 2.2.2 | RULE-2 |
|---|---|---|---|---|
| PDP + booking | 192 | 124 | 16 | 3 |
| home + search + inspo | 199 | 128 | 10 | 0 |
| primitives + shared | 117 | 70 | 7 | 0 |
| marketing + content + legal + auth | 133 | 86 | 9 | 4 |
| profile + loyalty + walk-in queue | 162 | ~121 | 26 | 6 |
| dashboard (owner side) | 583 | ~343 | 44 | 14 |
| **total** | **1,386** | **~870** | **112** | **27** |

Sources, each row carrying file:line, the job, the tier the law assigns, what the code does today, and a
verdict: `PDP_BOOKING.md`, `HOME_SEARCH_INSPO.md`, `PRIMITIVES_SHARED.md`, `MARKETING_CONTENT.md`,
`PROFILE_LOYALTY_QUEUE.md`, `DASHBOARD.md`.

**Coverage is now effectively the whole estate.** Five components remain reached-but-unaudited by any of
the six: `_components/profile/ProfileTabs.tsx` (the /profile tab switch, filter and sort toggle, three of
the highest-frequency in-place flips on a customer screen), `FavoritesList`, `components-legacy/booking/
BookingsList`, `components-legacy/auth/SignIn`, `_components/tips/TipFlow`.

---

## RANK 1 , WCAG 2.2.2, Level A. 112 exposures. Not taste, a conformance failure.
Auto-starting looping motion that runs past 5s beside other content needs a pause/stop mechanism.
`prefers-reduced-motion` does NOT discharge it (the criterion asks for a user-facing mechanism).

**FIXED AND VERIFIED SO FAR** (commits `3a873ae06`, `29a556ba4`):
  - `SalonWalkInPanel.tsx:188` ping bounded to 1 cycle; `resend-link:569` spinner deleted outright (it was
    fabricated feedback on a disabled button, signalling work that was not happening).
  - `animate-shimmer` bounded at the utility (`1.5s ease-in-out 3 forwards`), which discharges 9+ call
    sites at once including the 30-concurrent-shimmer case in a 6-card grid. `.skeleton-shimmer` bounded
    to the 2 cycles its own comment had been claiming falsely.
  - The queue tracker's `.walkin-ring-pulse` rebuilt off `box-shadow` onto transform+opacity, bounded.
  - BentoBusiness's five simultaneous loops on `/business` and `/fuer-salons`, verified live: zero infinite
    animations remain on that route after 7.5s.

**THE DETECTION LESSON, and it changes the gate.** Two of BentoBusiness's five loops would have survived a
fix built from RANK 1's own offender list, and two independent audits reached this separately:
  - `animate-pulse` was never in the offender vocabulary. It is Tailwind's default `pulse 2s infinite`,
    unoverridden, and it ships as a page loader at `walk-in-pay:369`, `:384`, `loyalty/stamp:66` and as
    three dots in BentoBusiness. A gate built from the current list passes it silently. Vocabulary fix.
  - The `<Typewriter>` loop has **no class name and no keyframe at all** , it is a raw `setTimeout` chain
    that ran ~13.5s. No static scan of any kind can see it. A gate for this class needs a **runtime probe**:
    load the route, snapshot the DOM every ~1s for 6-7s with no interaction, flag anything still changing
    past 5s. That leg does not exist yet and is the single most valuable thing to build next.

**STILL OPEN**, by blast radius:
  - `animate-spin` , 62 occurrences across 36 files. Spinning is also a named vestibular trigger class.
  - Dashboard: 44 exposures, incl. `dashboard/loading.tsx` rendering 18 concurrent shimmers.
  - Profile/loyalty/queue: 21 of 26 remain after the concurrent fixes above.
  - `.animate-breathe` (globals.css:1180) , EmptyStateDiscovery:90. The only one where "runs past five
    seconds" is unconditionally true, since an empty state has no endpoint to resolve.
  - `animate-bounce` , FormulaPhotoUpload:78. `animate-ping` , RefundCaseView.
FIX SHAPE: bound the loop to a finite cycle count that ends inside 5s and holds a legible final frame, or
provide a real stop control.

## RANK 2 , the press tier. ~460 rows. The single systemic failure, and it now has a documented cause.
THE SPEED LAW's press tier (80-100ms) is the only tier with a named primary source (Miller 1968: "response
to control activation... no more than 0.1 second"). It is almost nowhere.
  - Dashboard alone: **328 of 363 buttons have no press feedback at all**, and all 35 that do run at 150ms
    with zero exceptions , including the operator home's one primary CTA, the icon-rail nav, `DashButton`,
    `DashRow`, and the calendar arrows.
  - Marketing adds 31 press rows, and not one element in that entire scope presses at 80-100ms.
  - Profile settings: all ~17 navigation rows are bare `<Link>`s with no transition and no `active:`. The
    whole hub is a tap-list where nothing acknowledges a tap.
  - PDP/booking: 36 press at 150/180/200ms, 47 have none. Home/search: only 15 of 43 `active:scale-*` pair
    with `active:duration-[80ms]`. Primitives: 10 of 18 at 150-200ms, 9 controls with none.
  - Includes both PDP commit buttons and the single most important button in the product,
    `PayConfirmStep.tsx:713`, at 150ms. Worst single control: `ToggleCircle.tsx:60-84` , colour 300ms,
    pop 420ms, layer morph 420ms, on the toggle a booking hits most often.
  - **Mechanism, now understood at two levels.** Code level: `active:scale-*` silently inherits the
    duration of the colour transition it shares a class with. Doc level: see RANK 2b.

## RANK 2b , NEW: `lib/animations.ts` is a SECOND, undocumented motion vocabulary. The doc-level root cause.
Ten dashboard routes import it. It returns **zero hits in all five other audits** , nobody knew it was
there. It runs parallel to the sanctioned `lib/motion.ts` and contradicts both laws at once:
  - `DURATION_FAST = 0.15` is commented "Hover / **press** feedback" , ONE constant serving two tiers THE
    SPEED LAW separates. That single line is why the dashboard's press is uniformly 150ms with no exceptions.
  - `itemVariants` animates opacity+y with no scale and no blur , the exact shape `motion-recipe-gate.py`
    was built to block.
  - `slideSwitch()` ships a 400ms in-place swap plus advice to use `mode="wait"`, which hard rule 4 forbids.
This is not a row to fix; it is a file to reconcile or delete. Fixing the 328 presses without fixing this
guarantees the drift comes straight back through the next import.

## RANK 3 , NEW: staggered entrances on a tool surface are a measured harm. Delete, do not retime.
  - `/dashboard/revenue`: 10 elements on a 60ms stagger with 300ms items. `earnings`: 100ms.
  - `reports`: **replays the entire stagger on every "load more"**.
  - `NotificationCenter.tsx:112`: 70ms/item, last row lands at ~920ms, in a dropdown opened dozens of
    times a day.
Three cited findings bite at once: TASTE_MOTION finding 4 (Atlassian's "under 150ms if triggered dozens of
times a day", NN/g, Apple HIG), finding 12 (Tversky , the comprehension claims for staggered reveals are
unsupported), finding 13 (Brehmer , up to 2.8x slower, with the confidence inversion that makes it survive
user feedback, i.e. people report liking what measurably slows them). The recommendation is deletion.
CAVEAT: `NotificationCenter` carries an owner `motion-ok` from TASTE_LOG 2026-07-16, so that one is an
owner question, not drift.

## RANK 4 , NEW: the loyalty stamp fakes an earned moment, and the real celebration is dead code.
`StampCard.tsx:97-98` runs a 500ms overshoot keyed off `isNewest`, which is derived from the stamp COUNT,
not from a just-earned event. So it replays on every single visit to `/profile/stamps`. Motion sheet 22
forbids exactly this by name and uses the stamp as its example. Meanwhile the component's actual
celebration, `CelebrationRing`, is gated on a `celebrate` prop that `stamps/page.tsx:153` and `:177` never
pass , so the real reward-unlock peak has no celebration at all. The motion is on the wrong event twice.
Same family: the queue tracker renders its success peak (`:220`) as a fully static disc, against MOTION.md's
"never a static check".

## RANK 5 , hard rule 2: never animate width/height/top/left. 27 sites.
FIXED: BentoBusiness chart bars (height 700ms to scaleY 280ms), both password-strength meters (width 300ms
to scaleX at the snap tier, because a per-keystroke control gets the fastest tier that reads), the partner
FAQ (which declared `transition-[height]` while toggling `max-height`, so it broke the rule in intent and
did nothing in practice , now the grid-rows reveal).
STILL OPEN, worst first:
  - `queue/[token]:432` , `transition-[width] duration-700`. Breaks rule 2 AND is 2.3x the 300ms ceiling,
    the longest such duration in the whole audit, and it re-fires on every 8-25s poll on a screen built to
    be watched.
  - The dashboard's **7-site `transition-[width]` proportion-bar cluster** , a shape the customer estate
    does not contain at all.
  - `SalonHero.tsx:154` carousel dots, `ServicesStaffStep.tsx:458` accordion, `resend-link:554` countdown.

## RANK 6 , the 420ms ENTER RECIPE contradicts the law. OWNER DECISION, not a fix.
7 rows / 9 code locations, every booking step, on entrances that are not full-screen. ENTER RECIPE is
owner-approved 2026-07-09; THE SPEED LAW is 2026-07-25 and supersedes the slower spread without naming the
recipe. The honest question, per TASTE_MOTION: 420ms was approved to fix an entrance the owner could not
perceive, but finding 10 (Chang & Ungar, UIST '93) says the BLUR is what buys perceptibility at speed. So
does 420 buy anything that 250-300 with the blur kept does not? That is a side-by-side at `/de/dev/motion`,
never a prose argument. DO NOT edit the recipe before the owner picks.

## RANK 7 , the easing vocabulary. Zero new tokens needed.
`thud` = cubic-bezier(0.7,0,0.84,0) is a pure accelerate, exactly the exit shape Material, Microsoft and
Atlassian all specify. It has ONE call site in the entire repo (`Switch.tsx:98`, a press), documented
press-only. Meanwhile every exit in the shared layer is on the wrong shape: Sheet exit, Modal exit and
Sheet-backdrop exit use `snap`; Toast exit uses `glide`, the DECELERATE curve.
Root cause: MOTION.md has no by-direction curve rule at all, which is why `glide` has 132 uses doing
entrances, presses, colour flips and exits alike. The system defines five decelerate shapes and three
spring shapes against ONE accelerate.
FIX: add "entrances decelerate (`glide`), exits accelerate (`thud`)" to MOTION.md and repoint the exits.

## RANK 8 , tier drift, dead vocabulary, interruptibility.
  - **200ms is a de-facto fourth tier**: 19 rows, and `globals.css:98` even names it `--dur-normal`. The
    law has no 200 tier. Either it becomes one or those rows move to snap 150.
  - **Over 300ms without being full-screen**: Sheet entry 600ms, BellIcon hover-swing 700ms, RatingStars
    star-pop 450ms, CookieConsent 400ms, `.animate-in` 500ms.
  - **36 animation utilities/keyframes with ZERO call sites** against 22 alive. Three locked Motion-22
    micro-moments were never wired (toast tilt-settle, value-roll, stamp-slam), and `Toast.tsx` hand-rolls
    a different entrance than the sheet locks.
  - **`AnimatePresence mode="wait"` , 3 sites**, not 1: `BookingWizard.tsx:213`, `auth/register:295`,
    and one in BentoBusiness. Each serialises to ~520-650ms and is non-interruptible, against hard rule 4.
  - `BentoCard.tsx` docstring line 17 claims "Scroll-triggered entrance" and does not implement one: it
    uses `initial`/`animate`, not `whileInView`, so all four cards animate on mount off-screen.

## RANK 9 , NO RULE COVERS THIS (owner questions, deliberately not guessed). ~28 rows.
  - express-tier moments (`.celebrate-rise`, `.slot-cascade`, `.animate-count-bump`, all 400-480ms) have
    no ceiling in any rule.
  - non-gesture springs have no assigned tier (LOCKFILE 16.5 covers gesture-driven only).
  - text-clamp expansion has no vocabulary row. A 3D hover tilt and a forced 2.5s redirect have none either.
  - Motion sheet 22 CONTRADICTS itself: it mandates `.animate-breathe` (3.4s infinite) on empty-state icons,
    which finding 14 makes a Level A exposure.

---
## What the audits found that is NOT motion (logged once, not acted on)
  - `dashboard/queue-display/page.tsx:29` renders `bg-[#0A0A0A]` on web, against NEVER-AGAIN floor 1
    (web is one light theme). Out of scope here; needs its own call.
  - Marketing carries **zero scroll-triggered reveals** across 11 routes. That is the correct answer for a
    reading surface (findings 8, 12, 13), so it is recorded as a pass, not a gap.
  - Ten dashboard filter rows correctly have no motion. They should be PROTECTED from a future sweep, not
    "fixed".

## Contradictions found in our own docs (stated, not silently fixed)
1. `globals.css:571` commented the skeleton shimmer "(2 cycles, then stops)" while the utility was
   `infinite`. FIXED , the code now matches what the comment always claimed.
2. `OfflineBanner.tsx` documents "slides up from the bottom" and carries no transition class at all.
3. Motion sheet 22 mandates an infinite breathe that WCAG 2.2.2 makes a conformance failure.
4. `lib/animations.ts` documents one constant as serving both hover and press, which THE SPEED LAW splits.
5. `BentoCard.tsx` documents a scroll-triggered entrance it does not implement.
6. Three toggle implementations exist in the dashboard; only `settings:260` is correct, and two of the
   three sit in the same file.
