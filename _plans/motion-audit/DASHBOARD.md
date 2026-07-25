<!-- D2: the owner/admin side of the motion map. Owner constraint, verbatim: "dont invent unnececary
     stuff like based on principle we made". Every row below traces to THE SPEED LAW (MOTION.md:119-164),
     Motion sheet 22 (MOTION.md:89-116), the ENTER RECIPE (MOTION.md:16-48), or a numbered finding in
     research/TASTE_MOTION.md. Where nothing covers a case the row says NO RULE COVERS THIS and it
     becomes an owner question, never a guess. "No motion needed here" is a CORRECT verdict. -->
# Motion audit , the dashboard (owner + admin side)

## Summary

The dashboard is the **least animated and most uniformly wrong** surface in the product, and the two facts
are connected. 221 of its 330 `transition` declarations carry no duration at all, which resolves to
Tailwind's 150ms `cubic-bezier(0.4,0,0.2,1)` , exactly THE SPEED LAW's snap tier , so the hover and
state-flip layer is broadly **OK by accident**, not by decision. Everything that was decided explicitly is
off: all **35** `active:scale-*` presses run at `duration-150` instead of the press tier's 80-100ms (zero
exceptions, a perfectly uniform instance of RANK 2), **328** of the 363 `<button>` elements ship no press
feedback at all, **44** auto-starting infinite loops have no cycle cap (RANK 1), and **14** sites animate
`width` / `height` / `left` / `grid-template-rows` or ride `transition-all`, breaking SPEED LAW hard rule 2.
The one genuinely new structural finding is `lib/animations.ts`: a **second, parallel motion vocabulary**
that 10 dashboard routes import, that no prior audit touched, and that contradicts both the ENTER RECIPE
and the SPEED LAW at the same time. Set against that, the dashboard also contains the audit's clearest
cases where the correct answer is to **delete motion, not add it** , the 60ms-staggered spring entrance
that replays across six KPI cards every time an owner opens `/dashboard/revenue`, and the 70ms-per-item
cascade inside a notification dropdown the same owner opens dozens of times a day. Both are named harms
under TASTE_MOTION findings 4 and 12, on a surface that is a tool, not a browse.

| metric | count |
|---|---|
| files in scope | **100** (51 under `app/[locale]/dashboard/**`, 49 under `components-legacy/dashboard/**`) |
| declared interactive elements enumerated | **583** (363 `<button>`, 146 `<input>`, 37 `<select>`, 24 `<textarea>`, 13 `<Link>`, plus map-generated nav links) |
| per-element rows in this document | **175** (sections 1-3; uniform patterns are one row that lists every call site by `file:line`. Sections 4, 5 and 9 re-aggregate those same rows by defect kind and add no new elements.) |
| **WCAG-2.2.2** exposures | **44** |
| **RULE-2** (animates something other than transform / opacity / filter) | **14** |
| **WRONG-TIER** | **62** |
| **MISSING** (a rule assigns motion, there is none) | **328 presses** (363 `<button>` minus the 35 carrying `active:scale-*`), **plus ~15 further rows**: 6 hand-rolled modals/sheets/backdrops that mount as a cut, 3 named Motion-22 rows, the command-palette entrance, the gallery upload wait, the `SalonSwitcher` scrim |
| **OK** | ~**240** (the undurated `transition-colors` layer, resolving to 150ms snap) |
| **NO RULE COVERS THIS** | **9** |
| framer-motion (`motion/react`) surfaces | 14 files |
| duration histogram (CSS) | `duration-150` x100 · `duration-200` x5 · `duration-[250ms]` x4 · `duration-[200ms]` x2 · **no duration x221** |

---

## Coverage , what was read exhaustively, what was sampled

**Exhaustive** (every interactive element read from the real class string, TIER A):
`dashboard/page.tsx` (home) · `calendar` · `bookings` · `clients` · `services` · `gallery` (+ `GalleryManager`,
`SalonAboutEditor`) · `earnings` · `revenue` · `reports` · `messages` · `products` · `analytics` ·
`components-legacy/dashboard/DashboardLayout.tsx` · `app/[locale]/_components/dashboard/DashboardUI.tsx` ·
`lib/animations.ts` · `dashboard/loading.tsx` · `dashboard/error.tsx`.

**Exhaustive by mechanical sweep, all files, no exceptions** , four greps were run over the *entire* scope
(all 100 files), so these classes of defect are complete for TIER A **and** TIER B:
1. every infinite/looping animation (`animate-spin|ping|pulse|bounce|shimmer|breathe`, `.skeleton-shimmer`,
   inline `animation:` strings),
2. every `active:scale-*`,
3. every `transition-[...]` / `transition-all` (the RULE-2 surface),
4. every `duration-*` literal, and every framer-motion `transition={{...}}` / variants import.
No looping animation, no press declaration and no rule-2 transition anywhere in the scope is missing below.

**Sampled** (TIER B: `*-admin` pages, analytics, approvals, editors , 27 routes). **Sampling rule:** for each
TIER B route, all lines matching `onClick|<button|<Link|<input|<select|cursor-pointer|animate-|transition|
active:` were extracted and read; rows were then written for each *distinct* control pattern, not for each
repetition of it. So a route with nine identical outline buttons contributes one row naming all nine
`file:line`s. No TIER B route was skipped, and no TIER B route contributed a defect class that TIER A did not
already contain , which is itself a finding: the failure modes are uniform across the surface.

**Out of scope, stated so it is not mistaken for coverage:** `dashboard/editor/page.tsx` is a 6-line
delegation to `components-legacy/editor/EditorPage`, which is outside the assigned tree and was not read.
`dashboard/messages/page.tsx` is a `redirect()` (messaging off, owner 2026-06-13) and has no UI.

---

## Verdict key

| verdict | meaning |
|---|---|
| **OK** | matches the tier the law assigns. A bare `transition-*` with no duration resolves to 150ms on `cubic-bezier(0.4,0,0.2,1)` = the snap tier, so it is OK, not MISSING. |
| **WRONG-TIER** | animates, but at a duration the law assigns to a different job |
| **MISSING** | a rule assigns motion here and there is none |
| **WCAG-2.2.2** | auto-starting loop, >5s possible, beside other content, no pause/stop mechanism |
| **RULE-2** | animates something other than transform / opacity / filter (SPEED LAW hard rule 2) |
| **NO RULE** | nothing in MOTION.md, Motion sheet 22, LOCKFILE §16.5 or TASTE_MOTION covers this case |
| **RECIPE** | contradicts the locked ENTER RECIPE (opacity animated without scale AND blur) |

---

# 1. The shared layer , where the dashboard's motion actually comes from

Three files decide most of what an owner sees. Fixing them fixes the majority of the rows further down.

## 1.1 `lib/animations.ts` , **NEW: a second motion vocabulary, never audited**

10 of its 17 importers are dashboard routes (`all-salons`, `all-users`, `badge-manager`, `content-editor`,
`platform-analytics`, `review-moderation`, `revenue`, `segments`, `reports`, `reviews`). It appears in **none**
of `PDP_BOOKING.md`, `HOME_SEARCH_INSPO.md` or `PRIMITIVES_SHARED.md` , grep returns zero hits. It is a
parallel authority to the sanctioned `lib/motion.ts` (`useEnterMotion` / `useStepSwapMotion`, graded OK in
`PRIMITIVES_SHARED.md:58-59`), and its numbers were set before both the ENTER RECIPE and THE SPEED LAW.

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `lib/animations.ts:56-63` | `itemVariants` , the entrance every staggered dashboard card/row uses | element entrance | ENTER RECIPE: opacity **+ scale + blur**, 420ms glide. SPEED LAW: a card entering = reveal 250-300 | `{opacity:0, y:16} -> {opacity:1, y:0}`, `duration: DURATION_SMOOTH = 0.3`, `ease [0.23,1,0.32,1]`. **No scale, no blur.** | **RECIPE** , opacity animated without scale AND blur is the exact shape `motion-recipe-gate.py` blocks for net-new code (MOTION.md:46-48). Tier itself (300ms) is legal. |
| `lib/animations.ts:43-53` | `containerVariants` , the stagger schedule | list first-load | Motion sheet 22 "List first-load: stagger rise-in"; hard rule 5 (repeated action, fastest tier that reads) | `staggerChildren: 0.06`, `delayChildren: 0.04` | **NO RULE** on the schedule itself (same gap `PRIMITIVES_SHARED.md:176` records for `.salon-card-stagger`), **plus a hard-rule-5 problem**: 6 KPI cards = last card lands at 40+5x60+300 = **640ms**. See §6.1. |
| `lib/animations.ts:16` | `DURATION_FAST = 0.15` , documented "Hover / press feedback" | press + hover | press 80-100, snap 150 | 150ms for both | **WRONG-TIER** for press. The comment merges two tiers the SPEED LAW separates; this constant is the doc-level root of RANK 2 on this surface. |
| `lib/animations.ts:17` | `DURATION_NORMAL = 0.2` , "Modals, dropdowns" | overlay reveal | reveal 250-300 | 200ms | **WRONG-TIER**. Also another instance of RANK 5's "200ms is a de-facto fourth tier". |
| `lib/animations.ts:19` | `DURATION_SLOW = 0.5` | , | >300ms is full-screen only | 500ms | **WRONG-TIER** unless a full-screen call site exists; none in the dashboard scope. Another instance of RANK 5. |
| `lib/animations.ts:64-78` | `popoverVariants` | dropdown reveal | reveal 250-300 | in 200ms `EASE_SNAPPY`, out 150ms | **WRONG-TIER** (in-leg). Exit curve is `EASE_SNAPPY` = a standard ease-in-out, not an accelerate , same shape as RANK 4. |
| `lib/animations.ts:79-93` | `modalVariants` | modal reveal | reveal 250-300 | in 200ms, out 150ms | **WRONG-TIER** (in-leg). Also RECIPE: opacity+scale, no blur. |
| `lib/animations.ts:94-105` | `sheetVariants` | sheet travelling from the bottom edge | reveal 250-300 | in `y:"100%" -> 0`, 300ms | **OK**. Transform-only, top of the reveal band. |
| `lib/animations.ts:112-127` | `slideSwitch()` | tab/step swap | in-place flip = snap 150; MOTION.md:36-40 step-swap = 260ms | in **400ms**, out 250ms | **WRONG-TIER** , 400ms on an in-place swap is the exact case the law names: "a 420ms tab switch reads as the UI thinking, not as the UI keeping up". Its doc comment tells callers to use `AnimatePresence mode="wait"`, which is the non-interruptibility defect RANKED already logs at `BookingWizard.tsx:213` (hard rule 4). No dashboard caller, so this is a latent trap, not a live defect. |
| `lib/animations.ts:137-144` | `cardPopIn` | grid item on load | reveal 250-300 | 350ms | **WRONG-TIER** (marginal). Same 350ms as `.salon-card-stagger` in `PRIMITIVES_SHARED.md:176`. |
| `lib/animations.ts:146-150` | `fadeInUp` | general entrance | reveal 250-300 + ENTER RECIPE | 400ms, opacity + y only | **WRONG-TIER + RECIPE** |
| `lib/animations.ts:158-161` | `pressAnimation` | press | press 80-100 | `whileTap: {scale:0.98}`, **`duration: 0.12`** | **WRONG-TIER**, but the closest thing in the repo to a correct press. 120ms is 20ms over. **Zero call sites in the dashboard** , the one right-shaped helper is unused. |
| `lib/animations.ts:170-174` | `toastVariants` | toast enter/exit | Motion sheet 22: "Toasts , tilt-settle enter, Toast primitive owns it" | in 220ms, out 150ms, no tilt | **WRONG-TIER** + another instance of RANK 5's "toast tilt-settle was never wired"; and a *third* toast entrance recipe alongside `Toast.tsx`'s hand-rolled one. |

**The structural finding:** this file and `lib/motion.ts` both claim to be the house entrance vocabulary. The
laws were written against one of them. Nothing points a dashboard author at the other.

## 1.2 `app/[locale]/_components/dashboard/DashboardUI.tsx` , the dashboard primitives

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `DashboardUI.tsx:74` | `DashStatusPill` `pulse` halo | live status emphasis | Motion sheet 22: "Live status dot (REAL state only) , ping". WCAG 2.2.2 caps auto-starting loops beside content at 5s | inline `animation: "ping 2.6s cubic-bezier(0,0,.2,1) infinite"`, `motion-reduce:hidden` | **WCAG-2.2.2** , another instance of RANK 1, and structurally identical to `SalonWalkInPanel.tsx:188` (one of RANK 1's two unconditional failures). Call sites: `cases/page.tsx:296`, `refunds/page.tsx:203`. Both are "awaiting decision" states that persist until a human acts, so >5s is the normal case, not the slow case. `motion-reduce:hidden` is more than most sites do but does not discharge 2.2.2 (finding 14). |
| `DashboardUI.tsx:106` | `DashPanel` header "view all" link | link hover | snap 150 | `transition-colors`, no duration = 150ms | **OK** |
| `DashboardUI.tsx:106` | same link, pressed | press acknowledgement | press 80-100 | none | **MISSING** (RANK 2) |
| `DashboardUI.tsx:173-174` | `DashRow` , every list row on the dashboard home, bookings, services, staff | row hover | snap 150 | `transition-colors` + `hover:bg-s-bg-sunken` | **OK** |
| `DashboardUI.tsx:173-177` | `DashRow` when it is a `<Link>`, pressed | press, row tier 0.98 | press 80-100 | none | **MISSING** , this is the single most-repeated interactive element on the surface. |
| `DashboardUI.tsx:195-197` | `DashQuickAction` tile hover (outer + icon chip, two coordinated `transition-colors`) | hover | snap 150 | both undurated = 150ms | **OK** |
| `DashboardUI.tsx:195` | `DashQuickAction`, pressed | press, card tier 0.97 | press 80-100 | none | **MISSING** |
| `DashboardUI.tsx:231` | `DashButton` (all three variants) | button hover | snap 150 | `transition-colors`, undurated | **OK** |
| `DashButton` same line | `DashButton`, pressed | press, CTA tier 0.97 | press 80-100 | none | **MISSING** , the dashboard's *primary button primitive* has no press feedback. |
| `DashboardUI.tsx:122-160` | `DashStatCard` , KPI value + delta | a number that can change | Motion sheet 22: "Money value changes , roll/odometer tick (`key={value}` + `.animate-value-roll`)"; "Count/badge changes , spring bump" | nothing; the value re-renders as a cut | **MISSING** by Motion sheet 22, but see §6.3 , this is a row I recommend the owner **decline**, not fix. |
| `DashboardUI.tsx:252-274` | `DashLineChart` | static SVG series | , | no motion | **OK / no motion needed.** TASTE_MOTION finding 7 (Heer & Robertson) supports animating a transition *between two related states* of a chart; this chart never transitions between states, it re-renders on a fetch. Nothing in the law asks for motion on a static chart. |
| `DashboardUI.tsx:277-312` | `DashBarChart` | same | , | no motion | **OK / no motion needed** |

## 1.3 `components-legacy/dashboard/DashboardLayout.tsx` , the shell every route renders inside

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `DashboardLayout.tsx:296` | desktop icon-rail nav link (14 items, `RAIL_NAV`) | nav hover / active flip | snap 150 | `transition-colors`, undurated | **OK** |
| `DashboardLayout.tsx:296` | same, pressed | press, icon tier 0.94 | press 80-100 | none | **MISSING** , the single most-clicked control on the whole surface. |
| `DashboardLayout.tsx:299` | rail tooltip fly-out | tooltip reveal | in-place fade = snap 150 | `opacity-0 group-hover:opacity-100 transition-opacity`, undurated | **OK** |
| `DashboardLayout.tsx:310`, `:312` | admin rail links + their tooltips (6 items) | same | same | same | **OK** on hover, **MISSING** press |
| `DashboardLayout.tsx:319`, `:321` | "back to site" rail link + tooltip | same | same | `transition-colors` undurated | **OK** / **MISSING** press |
| `DashboardLayout.tsx:333-339` | mobile sidebar **backdrop scrim** fade | a scrim being revealed | reveal 250-300 (cf. `HOME_SEARCH_INSPO.md:188`, the search scrim at 300ms graded OK) | `duration: 0.2` | **WRONG-TIER** , 200ms, the de-facto fourth tier again (RANK 5). |
| `DashboardLayout.tsx:342-346` | mobile sidebar **drawer**, `x: "-100%" -> 0` | a 300px panel TRAVELLING in from the edge | reveal **250-300** | `duration: 0.15` | **WRONG-TIER** , 150ms is the snap tier applied to the largest travelling object in the dashboard. Also the drawer moves *faster* than the scrim behind it (150 vs 200), which inverts the depth reading. Transform-only, so rule 2 is fine. |
| `DashboardLayout.tsx:353` | sidebar close X | press, icon tier 0.94 | press 80-100 | `transition-colors` only | **OK** hover / **MISSING** press |
| `DashboardLayout.tsx:363`, `:386`, `:405`, `:420` | mobile sidebar nav rows (4 render paths) | nav hover / active flip | snap 150 | `transition-colors`, undurated | **OK** / **MISSING** press |
| `DashboardLayout.tsx:434` | topbar salon-switcher chip hover | hover | snap 150 | `transition-colors`, undurated | **OK** |
| `DashboardLayout.tsx:438`, `:449` | topbar search (Ctrl+K) buttons, desktop + mobile | press, icon tier | press 80-100 | `transition-colors` only | **OK** hover / **MISSING** press |
| `DashboardLayout.tsx:445` | mobile hamburger | press, icon tier | press 80-100 | **no transition at all** | **MISSING** , opens the drawer and gives zero acknowledgement. |
| `DashboardLayout.tsx:465` | admin preview-banner "exit" | press | press 80-100 | `transition-colors` | **OK** hover / **MISSING** press |
| `DashboardLayout.tsx:261-276` | auth-gate skeleton , **12 concurrent `<Skeleton>`** | loading placeholder | Motion sheet 22 shimmer; WCAG 2.2.2 5s cap | `Skeleton.tsx:83` = `animate-shimmer`, `tailwind.config.js:340`, infinite, no cap | **WCAG-2.2.2** , another instance of RANK 1, and it gates **every dashboard route** behind `/api/profile`. 12 concurrent infinite shimmers before any page renders. |
| `DashboardLayout.tsx:331-428` | `AnimatePresence` around the drawer | , | hard rule 4, interruptible | no `mode="wait"` | **OK** |
| `app/[locale]/layout.tsx:57` -> `MotionProvider.tsx:7` | `<MotionConfig reducedMotion="user">` | reduced-motion for all framer motion | hard rule 3, end state, no animation | wraps the whole locale tree, so every dashboard `motion.*` inherits it | **OK** , this is the reason the framer rows below are not also reduced-motion failures. `globals.css:822-830` covers the CSS half (already graded OK at `PRIMITIVES_SHARED.md:184`). |

---

# 2. TIER A , audited exhaustively

## 2.1 `/dashboard` (home) , `app/[locale]/dashboard/page.tsx`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `page.tsx:149` | onboarding celebration banner enter | a banner revealed after the onboarding peak | Motion sheet 22: "Success peak , SuccessMark + `.celebrate-rise`, never a static check"; reveal 250-300 | `{opacity:0,y:-6} -> {opacity:1,y:0}`, `duration: 0.18`, exit opacity-only | **WRONG-TIER + RECIPE** , 180ms sits between press and snap (no tier owns it), and opacity+y with no scale and no blur is the shape the recipe gate blocks. Separately: this is the owner's *onboarding-complete peak* and it renders a static `CheckCircle2`, where Motion sheet 22 mandates `SuccessMark`. Auto-dismisses at 4s (`page.tsx:110`), so no WCAG issue. |
| `page.tsx:170` | "Termin erstellen" , the page's one primary CTA | press, CTA tier 0.97 | press 80-100 | `transition-colors hover:bg-black`, undurated | **OK** hover / **MISSING** press. The most important button on the operator home has no press acknowledgement. |
| `page.tsx:178` | loading placeholder, 2 panels | loading | Motion sheet 22 shimmer; WCAG 2.2.2 | `animate-pulse` (Tailwind `pulse 2s infinite`), no cap | **WCAG-2.2.2** , another instance of RANK 1. Also inconsistent with the `<Skeleton>` shimmer used 12 lines up in the shell. |
| `page.tsx:186-197` | 4 mobile `StatTile` KPIs | numbers that change between loads | Motion sheet 22 money/count rows | nothing | **MISSING** per Motion-22 , **recommend decline**, see §6.3 |
| `page.tsx:265-278` | `DashRow` today's-bookings rows (up to 6) | row hover + press | snap 150 / press 80-100 | inherits `DashboardUI.tsx:173` | **OK** hover / **MISSING** press |
| `page.tsx:283-321` | top-services + top-team `DashRow`s | same | same | same | **OK** / **MISSING** press |
| `page.tsx:206`, `:240`, `:251` | `DashBarChart` / `DashLineChart` renders | static charts | , | no motion | **OK / no motion needed** |
| `page.tsx:270-272` | empty state "keine Buchungen heute" (`Calendar` icon + copy) | empty-state icon | Motion sheet 22: "Empty-state icon , breathe (`.animate-breathe`)" | no animation | **OK , and deliberately so.** Motion sheet 22 mandates `.animate-breathe` here; RANKED's own contradiction list (line 99) and TASTE_MOTION finding 14 make that mandate a Level A exposure, since an empty state has no endpoint. This row is compliant with the law by breaking the vocabulary. Flagging as a doc contradiction, not a code defect. |
| `dashboard/loading.tsx:1-25` | route-level skeleton , **18 concurrent `<Skeleton>`** | loading | shimmer; WCAG 2.2.2 | `animate-shimmer`, infinite, no cap | **WCAG-2.2.2** , the single largest concurrent-loop count in the dashboard scope; another instance of RANK 1's highest-blast-radius item. |
| `components-legacy/dashboard/SetupBanner.tsx:60` | onboarding progress bar fill | a progress value changing | in-place change = snap 150; hard rule 2 | `transition-[width] duration-200` | **RULE-2 + WRONG-TIER** , "Never animate width". `scaleX` with `transform-origin: left` is the same picture with no reflow. 200ms is also the fourth tier. |
| `SetupBanner.tsx:90` | "Setup fortsetzen" link | press | press 80-100 | none | **MISSING** |
| `components-legacy/dashboard/ActivityFeed.tsx:88` | activity-feed loading rows | loading | shimmer; WCAG 2.2.2 | `animate-pulse`, infinite | **WCAG-2.2.2** |
| `ActivityFeed.tsx:148` | "mehr anzeigen" expander | press + hover | press 80-100 / snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `ActivityFeed.tsx:151` | chevron rotate on expand | in-place state flip | snap 150 | `transition-transform` undurated = 150ms | **OK** , transform-only, correct tier. One of the cleanest rows in the audit. |
| `ActivityFeed.tsx` (whole) | new activity arriving in the feed | Motion sheet 22 has no "new item arrives in a live feed" row | , | items just appear | **NO RULE COVERS THIS** |

## 2.2 `/dashboard/calendar` , the operator's highest-frequency screen (1154 lines)

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `calendar/page.tsx:742`, `:745` | prev / next period arrows | press, icon tier 0.94 | press 80-100 | **no transition, no press** | **MISSING** , pressed constantly while navigating weeks. |
| `calendar/page.tsx:744` | "Heute" | press | press 80-100 | none | **MISSING** |
| `calendar/page.tsx:752` | mobile view segment (Tag / Woche / Monat) | in-place tab flip | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `calendar/page.tsx:768` | mobile date-strip day chips | in-place selection flip | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `calendar/page.tsx:801` | month-grid day cells | selection flip | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `calendar/page.tsx:820-822` | mobile action bar: "+ Slot", "Walk-in", "Planen" | press, CTA tier | press 80-100 | **no transition at all** | **MISSING** x3 |
| `calendar/page.tsx:838`, `:842`, `:849` | desktop prev / today / next | press | press 80-100 | `transition-colors` (hover border only) | **OK** hover / **MISSING** press |
| `calendar/page.tsx:866` | desktop view-mode segment | tab flip | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `calendar/page.tsx:872`, `:876`, `:879` | Walk-in / Bulk / Create toolbar buttons | press | press 80-100 | `transition-colors`; `:879` has none | **OK** hover, **MISSING** press x3 |
| `calendar/page.tsx:903`, `:907` | day-header date link + block-day icon | press | press 80-100 | `transition-colors` | **OK** / **MISSING** press |
| `calendar/page.tsx:934`, `:1016`, `:1049` | **drop-target hour cells** , `isDraggingOver` fill | showing where a dragged slot will land | snap 150. TASTE_MOTION finding 6 (Bederson & Boltman) is the citation *for* this kind of motion: it helps reconstruct where things are | `transition-colors`, `bg-s-coral/10` when hovering, undurated = 150ms | **OK** , and one of the few places on this surface where motion is doing real work by the research's own standard. |
| `calendar/page.tsx:946`, `:1026`, `:1061` | **the dragged slot itself** | drag lift | LOCKFILE §16.5 covers gesture-driven motion, but is written for sheet-drag / SearchMorph, not a DnD library's lift-and-drop | `shadow-2xl z-50 scale-105` toggled with **no transition**, so the lift snaps instantly; the travel is `@hello-pangea/dnd`'s own transform | **NO RULE COVERS THIS** , two open questions for the owner: (a) does §16.5's velocity-seeded spring bind a library-driven drop, or does the library's default stand; (b) is an instantaneous `scale-105` lift acceptable, or does the lift need the press/snap tier. Not guessed. |
| `calendar/page.tsx:950`, `:1029` | per-slot delete X | press, icon tier | press 80-100 | none | **MISSING** |
| `calendar/page.tsx:1104` | month-view day cell | press / hover | snap 150 | `transition-colors hover:bg-s-coral/5` undurated | **OK** / **MISSING** press |
| `calendar/page.tsx:714` | mobile agenda row | press, row tier 0.98 | press 80-100 | none | **MISSING** |
| `calendar/page.tsx:108`, `:190`, `:300` | 3 modal close X buttons | press, icon tier | press 80-100 | **no transition at all** | **MISSING** x3 |
| `calendar/page.tsx:104-134`, `:186-252`, `:296-344` | the 3 modals themselves (create / bulk / detail) | modal reveal | reveal 250-300 | **no entrance animation at all** , they mount as a cut | **MISSING** x3. Note these are hand-rolled, not the locked `<Modal>` primitive (`PRIMITIVES_SHARED.md:85`), which is why they inherit nothing. |
| `calendar/page.tsx:217`, `:240` | bulk-modal day toggles + week-count pills | in-place selection | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `calendar/page.tsx:316`, `:318`, `:335`, `:340` | reschedule / delete action buttons | press | press 80-100 | `transition-colors` on 2 of 4 | **OK** hover / **MISSING** press x4 |
| `calendar/page.tsx:114-131`, `:195-250`, `:307-312` | 4 `<select>` + 4 `<input type=time/date>` | native controls | , | none | **OK / no motion needed** , the law has no row for a native picker, and finding 12's caveat means we should not invent one. |

## 2.3 `/dashboard/bookings`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `bookings/page.tsx:92` | cancel-modal close X | press, icon tier | press 80-100 | `transition-colors` undurated | **OK** / **MISSING** press |
| `bookings/page.tsx:97` | cancellation-reason radio rows | selection flip | snap 150 | `transition-colors` + `hover:border-s-ink` | **OK** / **MISSING** press |
| `bookings/page.tsx:105-107` | cancel / confirm modal buttons | press | press 80-100 | `transition-colors` | **OK** / **MISSING** press |
| `bookings/page.tsx:137` | action-sheet backdrop | scrim reveal | reveal 250-300 | `bg-s-ink/40`, **no transition** , appears as a cut | **MISSING** |
| `bookings/page.tsx:140-175` | the action sheet itself | a sheet travelling up | reveal 250-300 (`sheetVariants` at `lib/animations.ts:94` would be correct and is not used) | **no entrance animation** | **MISSING** , a hand-rolled sheet next to a correct sheet variant nobody imported. |
| `bookings/page.tsx:158` | "Abschliessen" (complete) | press, CTA tier | press 80-100 | `transition-opacity hover:opacity-90` undurated | **OK** hover / **MISSING** press |
| `bookings/page.tsx:164`, `:170` | "No-show" / "Stornieren" | press | press 80-100 | `transition-colors` | **OK** / **MISSING** press |
| `bookings/page.tsx:263` | status filter pills (the sort/filter row) | filter change, in-place | snap 150, **and hard rule 5** , this is fired repeatedly | `transition-colors` undurated = 150ms | **OK** , correct by the law's own words: "chip select, filter change" is named as the snap tier's job. |
| `bookings/page.tsx:285-286` | booking rows (conditionally clickable) | press, row tier | press 80-100 | `cursor-pointer` only, **no transition, no hover fill** | **MISSING** , and the row gives no hover affordance either, so a clickable row and an inert row look identical until pressed. |
| `bookings/page.tsx` (list) | **re-render when the status filter changes** | a list re-filtering in place | , | no animation | **OK / no motion needed , and this is the correct answer.** TASTE_MOTION finding 13 (Brehmer 2019, up to **2.8x longer**) and hard rule 5 both bite here. See §6.2. |

## 2.4 `/dashboard/clients`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `clients/page.tsx:133` | segment filter pills | filter change | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `clients/page.tsx:154` | client search input | typing | , | none | **OK / no motion needed** |
| `clients/page.tsx:173-175` | client list rows | press, row tier | press 80-100 | no transition | **MISSING** |
| `clients/page.tsx:328` | back link | press | press 80-100 | `transition-colors` | **OK** / **MISSING** press |
| `clients/page.tsx:362` | client-detail tab pills | tab flip | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `clients/page.tsx:403-407` | add-note input + save | press | press 80-100 | `transition-colors` | **OK** / **MISSING** press |
| `clients/page.tsx:431-440` | add-tag input + colour select + save | press | press 80-100 | `transition-colors` | **OK** / **MISSING** press |
| `clients/page.tsx` (tab body) | switching between client tabs | in-place content swap | snap 150 | no animation, hard cut | **OK / no motion needed.** `slideSwitch()` exists at `lib/animations.ts:112` and would be **WRONG-TIER** (400ms) if wired. Leaving it a cut is the better answer under hard rule 5. |

## 2.5 `/dashboard/services` (+ products, which mounts `RetailManager` unchanged)

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `services/page.tsx:593` | **active/inactive toggle knob** | knob travel | snap 150; hard rule 2 | `transition-[left]`, `left-[2.5px] <-> left-[17px]`, undurated | **RULE-2** , animates `left`. Identical defect to `Switch.tsx:95` (`PRIMITIVES_SHARED.md:71`), and *contradicted inside this repo* by `settings/page.tsx:260`, which does the same toggle with `transition-transform`. Two toggles, two implementations, one correct. |
| `services/page.tsx:592` | toggle track colour | state flip | snap 150 | `transition-colors` undurated | **OK** |
| `services/page.tsx:600` | **service row expand/collapse** | a section being revealed | reveal 250-300; hard rule 2 | `transition-[grid-template-rows,opacity] duration-200 ease-out`, `grid-rows-[0fr] <-> [1fr]` | **RULE-2 + WRONG-TIER** , `grid-template-rows` is a layout property; every frame reflows the rows below it. 200ms is also the fourth tier. Same class of defect as `SearchOverlay.tsx:885` (`HOME_SEARCH_INSPO.md:197`), different property. |
| `services/page.tsx:564`, `:295` | expand chevrons | in-place flip | snap 150 | `transition-transform` undurated | **OK** |
| `services/page.tsx:552` | service row while dragging (reorder) | drag lift | see §2.2 drag row | `bg-s-bg-sunken shadow-warm-md` on `transition-colors` | **NO RULE COVERS THIS** (same open question as the calendar drag) |
| `services/page.tsx:555` | drag handle | grab affordance | , | `cursor-grab active:cursor-grabbing` + `transition-colors` | **OK** , cursor change is not motion. |
| `services/page.tsx:513` | category filter pills | filter change | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `services/page.tsx:462`, `:466` | Import / Add service | press, CTA tier | press 80-100 | `:462` `transition-colors`; `:466` none | **OK**/**MISSING** press, **MISSING** x2 |
| `services/page.tsx:165` | photo-upload dropzone hover | drop affordance | snap 150 | `transition-colors hover:border-...` undurated | **OK** |
| `services/page.tsx:197`, `:210` | suitable-for / gender chips | multi-select flip | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `services/page.tsx:308` | service-template quick-add tiles | selection flip | snap 150 | `transition-[background-color,border-color]` undurated | **OK** , explicitly property-scoped, no rule-2 risk. |
| `services/page.tsx:89`, `:229`, `:234`, `:235`, `:449`, `:450`, `:633`, `:658` | modal close / delete / cancel / save / import buttons (8) | press | press 80-100 | `:230` `transition-colors`, the other 7 none | **MISSING** x8 |
| `services/page.tsx:95-146` | 9 form `<input>`s | focus | globals.css `input:focus-visible` ink edge (locked) | inherits global | **OK / no motion needed** |

## 2.6 `/dashboard/gallery` , `GalleryManager` + `SalonAboutEditor`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `GalleryManager.tsx:252-259` | **photo reorder drag** | drag lift + reflow | §16.5 is written for finger-driven sheets, not HTML5 `draggable` | dragged tile gets `opacity-40 scale-95` with **no transition**; the others carry `transition-[opacity,transform] duration-150` | **NO RULE COVERS THIS** on the drag physics; the sibling reflow at 150ms with an explicit transform+opacity property list is **OK**. |
| `GalleryManager.tsx:272` | hover overlay on a photo tile | hover reveal over an image | snap 150 | `opacity-0 group-hover:opacity-100 transition-opacity` undurated | **OK** |
| `GalleryManager.tsx:280` | delete button on the overlay | press, icon tier | press 80-100 | `transition-colors` | **OK** / **MISSING** press |
| `GalleryManager.tsx:295` | "cover photo" badge fading out on hover | hover | snap 150 | `group-hover:opacity-0 transition-opacity` undurated | **OK** |
| `GalleryManager.tsx` (upload) | photo upload in flight | TASTE_MOTION finding 11 (Harrison 2010, **-11% perceived duration**) supports motion on a wait the user cannot control | , | no progress motion found | **MISSING** , and one of the few *additive* rows in this audit I would actually argue for: an upload is a real wait on someone else's system, which is finding 11's exact scope. |
| `SalonAboutEditor.tsx:80` | save button | press, CTA tier | press **80-100** | `active:scale-[0.97] transition-[transform,filter] duration-150` | **WRONG-TIER** , another instance of RANK 2, and the exact mechanism RANKED names: the press scale inherits the colour transition's 150ms because they share one `duration-150`. |
| `SalonAboutEditor.tsx:82` | in-flight spinner inside that button | busy indicator | Motion sheet 22 permits spinners **inside buttons**; WCAG 2.2.2 5s cap | `animate-spin`, infinite, no cap | **WCAG-2.2.2** , another instance of RANK 1 (`animate-spin`, 62 repo-wide). Bounded by the request in practice, unbounded in code. |
| `SalonAboutEditor.tsx:126` | about-text textarea focus | focus | global ink edge | `transition-[border-color,box-shadow] duration-150` | **OK** on tier; the `box-shadow` leg is the halo the focus lock killed by name (CLAUDE.md focus row) , a design-lock issue, not a motion one. |

## 2.7 `/dashboard/earnings`, `/dashboard/revenue`, `/dashboard/reports`, `/dashboard/analytics`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `earnings/page.tsx:39-47` | **local** container+item variants (this file redefines them instead of importing `lib/animations`) | KPI card entrance | reveal 250-300 + ENTER RECIPE | `staggerChildren: 0.1` (**100ms**), item = `{opacity:0,y:20} -> spring stiffness 300 damping 24` | **RECIPE + NO RULE** , opacity+y, no scale, no blur; and a **non-gesture spring has no assigned tier** (RANK 6 names this gap; LOCKFILE §16.5 covers gesture-driven only). The 100ms stagger is also the slowest in the scope. |
| `earnings/page.tsx:105-237` | 4 staggered blocks riding the above | , | hard rule 5 | last block starts at ~300ms, spring settles later | **WRONG-TIER in effect** , see §6.1 |
| `earnings/page.tsx:150`, `:217` | payout + service table rows | row hover | snap 150 | `transition-colors` undurated | **OK** |
| `earnings/page.tsx:172` | invoice-download icon button | press, icon tier | press 80-100 | `transition-colors` | **OK** / **MISSING** press |
| `revenue/page.tsx:86,141-143,157,203,238,275,286` | 10 `itemVariants` children under one `containerVariants` | KPI + table entrance | reveal 250-300 + recipe | 60ms stagger, 300ms items, no scale/blur | **RECIPE**; **see §6.1 for the recommendation to remove** |
| `revenue/page.tsx:70` | period segment (Woche / Monat / Jahr) | in-place filter flip | snap 150 | `transition-colors` undurated | **OK** |
| `revenue/page.tsx:219` | revenue table rows | hover | snap 150 | `transition-colors` undurated | **OK** |
| `reports/page.tsx:216-296` | report cards on `containerVariants` | list entrance | reveal + recipe | 60ms stagger, 300ms | **RECIPE** + §6.1 |
| `reports/page.tsx:185`, `:200` | status + target filter pills | filter change | snap 150 | `transition-colors` undurated | **OK** |
| `reports/page.tsx:269`, `:277`, `:286` | reviewed / dismissed / hide moderation actions | press | press 80-100 | `transition-colors` | **OK** / **MISSING** press x3 |
| `reports/page.tsx:271`, `:304` | in-button spinners (2) | busy | spinner-in-button allowed; 5s cap | `animate-spin`, infinite | **WCAG-2.2.2** x2 |
| `reports/page.tsx:302` | "mehr laden" | press | press 80-100 | `transition-colors` | **OK** / **MISSING** press |
| `reports/page.tsx:216` | **newly loaded page-2 items** replaying the stagger | pagination append | hard rule 5 | the container re-runs its stagger on every "load more" | **WRONG-TIER in effect** , the user pays the entrance cost again for each page. See §6.1. |
| `analytics/page.tsx:154` | comparison toggle | in-place flip | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `analytics/page.tsx:167` | analytics tab pills | tab flip | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `analytics/page.tsx:225`, `:262`, `:317`, `:341`, `:361` | 5 CSV export buttons | press | press 80-100 | none | **MISSING** x5 |
| `analytics/page.tsx` (charts) | chart series changing when the period changes | TASTE_MOTION finding 7 blesses an animated transition **between two related states** of a chart | , | hard cut | **MISSING** by finding 7 , the one place in the dashboard where the research actually supports adding a chart animation. Recommend as a *candidate*, not a defect; finding 7's own caveat is that its task was reading quantities off statistical graphics. |

---

# 3. TIER B , interactive elements only, sampled per the rule above

The 27 `*-admin` / editor / approval routes contribute **no new defect class**. Every one of them is one or
more of: (a) `transition-colors` undurated = OK snap, (b) no press feedback, (c) an `animate-spin` loop, (d)
`transition-all`, (e) a `transition-[width]` bar. Rows below name the distinct patterns and every call site.

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `settings/page.tsx:138` | notification-channel pill | in-place flip + press | snap 150 / press 80-100 | `transition-colors active:scale-[0.97]` , **the press has no duration of its own**, so it inherits `transition-colors`' 150ms | **WRONG-TIER** (RANK 2, the shared-duration mechanism) |
| `settings/page.tsx:259-260` | opening-hours toggle | knob travel | snap 150 | track `transition-colors`, knob **`transition-transform`** | **OK** , the correct toggle implementation, and the counter-example that makes `services:593` and `settings:1195` indefensible. |
| `settings/page.tsx:1194-1195` | AI-limit toggle | knob travel | snap 150; hard rule 2 | track `transition-colors`; knob **`transition-all`** + `left-[2.5px] <-> left-[17px]` | **RULE-2** , `transition-all` over `left`, in the same file as the correct version 900 lines earlier. |
| `settings/page.tsx:54`, `:460`, `:581`, `:892`, `:953`, `:1144`, `:1166` | day-pills + 6 option-card rows | selection flip | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `settings/page.tsx:399`, `:762`, `:861`, `:1092`, `:1286` | save / disconnect / connect / remove buttons | press | press 80-100 | `transition-colors` | **OK** hover / **MISSING** press x5 |
| `settings/page.tsx:863`, `:1019`, `:1205` | in-button spinners | busy | 5s cap | `animate-spin` | **WCAG-2.2.2** x3 |
| `cases/page.tsx:207`, `refunds/page.tsx:234`, `:244`, `:252` | **armed** destructive-action buttons (the two-press confirm) | arming a destructive action , an in-place state change that must read clearly | snap 150; hard rule 2 | `transition-all` + a `ring-2 ring-offset-1` appearing | **RULE-2** x4 , `transition-all` sweeps `box-shadow`/ring, TASTE_MOTION finding 25's worst paint case. The tier is fine; the property list is not. |
| `cases/page.tsx:252`, `:258`, `refunds/page.tsx:173` | status filter + direction segments | filter change | snap 150 | `transition-colors` undurated | **OK** |
| `cases/page.tsx:320` | timeline expand chevron | in-place flip | snap 150 | `transition-transform` undurated | **OK** |
| `cases/page.tsx:381`, `refunds/page.tsx:267` | "mehr laden" | press | press 80-100 | `transition-colors` | **OK** / **MISSING** press |
| `cases/page.tsx:296`, `refunds/page.tsx:203` | `DashStatusPill pulse` on "awaiting decision" | live status | 5s cap | `ping 2.6s infinite` | **WCAG-2.2.2** x2 (see §1.2) |
| `admin-sandbox/page.tsx:226`, `:234`, `:269`, `:307` | seed / delete / create buttons | press, CTA tier | press **80-100** | `active:scale-[0.97] transition-[transform,filter] duration-150` | **WRONG-TIER** x4 (RANK 2) |
| `admin-sandbox/page.tsx:228`, `:236`, `:310`, `:380`, `:394`, `:434` | in-button spinners | busy | 5s cap | `animate-spin` | **WCAG-2.2.2** x6 , the densest cluster in one file, and sandbox seeding is a genuinely slow operation, so >5s is the *expected* case here. |
| `admin-sandbox/page.tsx:328` | sandbox list skeleton | loading | 5s cap | `animate-pulse` | **WCAG-2.2.2** |
| `discovery-admin/page.tsx:465`, `:643`, `:700` | reload buttons whose icon spins while loading | busy | 5s cap | `RefreshCw` + conditional `animate-spin` | **WCAG-2.2.2** x3. Note this is the *correct pattern shape* (a real signal, bound to `loading`) with no cycle cap. |
| `discovery-admin/page.tsx:52`, `:218`, `:492`, `:377`, `:561` | tab pills, selectable media tiles, dropzone, archive X | selection / hover / press | snap 150 / press 80-100 | `transition-colors` or `transition-[background-color,border-color,box-shadow]`, undurated | **OK** hover / **MISSING** press |
| `discovery-admin/page.tsx:537-540` | `useSortable` drag transform (dnd-kit) | drag | see §2.2 | library-supplied `transform` + `transition` | **NO RULE COVERS THIS** , a **third** drag-and-drop implementation in the dashboard (pangea-dnd in calendar + services, HTML5 in gallery, dnd-kit here), each with its own physics. |
| `homepage-admin:88`,`:132` · `commission-admin:101`,`:194` · `feature-flags-admin:134` · `ai-limits-admin:95`,`:170` · `cities-admin:94` · `discovery-posts:187` · `salon-of-month-admin:244` | page + button spinners | busy | 5s cap | `animate-spin` | **WCAG-2.2.2** x10 |
| `coiffeur-crm:105`,`:126` · `nail-admin:77` · `nail-clients:38` · `barber-clients:41` · `barber-ops:77` · `spa-admin:91` · `queue-display:58` | route skeletons | loading | 5s cap | `animate-pulse` | **WCAG-2.2.2** x8 |
| `coiffeur-crm/page.tsx:160` | mini bar-chart bar growing | a value rendering | hard rule 2 | **`transition-[height]`**, undurated | **RULE-2** , "Never animate width, **height** or top", named verbatim. |
| `commission-admin:182` · `ai-limits-admin:158` | save buttons | press | press 80-100 | `transition-[filter,background-color] duration-150` | **WRONG-TIER** x2 |
| `salon-of-month-admin:241` | pick-winner button | press | press 80-100 | `transition-[filter] duration-150` | **WRONG-TIER** |
| `badge-manager/page.tsx:152` | badge colour swatch | selection flip | snap 150 | `transition-[border-color,background-color] duration-150` | **OK** , explicit property list, correct tier. |
| `badge-manager:133`,`:368`,`:421`,`:429`,`:455`,`:463`,`:493` | icon grid, add, edit, delete, search, suggestion rows, chip X | selection / press | snap / press | `transition-colors` undurated | **OK** / **MISSING** press x7 |
| `badge-manager:385-439` · `all-salons:210-306` · `all-users:194-288` · `content-editor:65-195` · `platform-analytics:63-129` · `review-moderation:170-264` · `segments:84-155` · `reviews:180-327` | `containerVariants`/`itemVariants` list entrances (8 routes) | list entrance | reveal + ENTER RECIPE | 60ms stagger, 300ms opacity+y, no scale/blur | **RECIPE** x8 + §6.1 |
| `approvals:130`,`:138`,`:172`,`:179` · `verification:171` · `reviews:210`,`:233`,`:268`,`:275`,`:286`,`:310`,`:317` · `staff:532`,`:536`,`:602`,`:606`,`:610` · `upcharge:272` · `loyalty:114` · `segments:122` · `bundles:313` | approve / reject / reply / delete / activate action buttons (21) | press | press 80-100 | `transition-colors` or `transition-opacity`, undurated | **OK** hover / **MISSING** press x21 |
| `reviews/page.tsx:239` | delete-reply link | press | press 80-100 | `transition-[filter]` undurated | **OK** hover / **MISSING** press |
| `staff:211`,`:552` · `bundles:201`,`:246` · `marketing:57` · `refunds:173` · `upcharge:162`,`:208` · `verification:105` | filter pills, selectable rows, dropzone (9) | selection flip | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `staff:166`,`:284`,`:286`,`:338`,`:354`,`:356`,`:400`,`:402` | 8 modal close/cancel/save buttons | press | press 80-100 | `transition-colors` | **OK** / **MISSING** press x8 |
| `queue-display/page.tsx:36` | back link on the wall display | press | press 80-100 | `transition-colors` undurated | **OK** / **MISSING** press |
| `barber/LiveQueuePanel.tsx:192`,`:200`,`:211`,`:219` | queue status actions (complete / no-show / in-chair / cancel) | press | press 80-100 | `transition-opacity duration-150` / `transition-colors duration-150` | **WRONG-TIER** x4 on the press leg |
| `barber/LiveQueuePanel.tsx` (positions) | **a customer's queue position changing live** | Motion sheet 22: "Live position/number updates , departure-board flip (`key={n}` + `.animate-num-flip`)" | , | numbers cut | **MISSING** by Motion-22. Unlike the KPI rows, I would *keep* this one , see §6.3. |
| `NotificationCenter.tsx:73` | bell button | press, icon tier | press 80-100 | `transition-colors` undurated | **OK** / **MISSING** press |
| `NotificationCenter.tsx:87` | dropdown panel enter | dropdown reveal | reveal 250-300 | `{opacity:0,y:-6,scale:0.97}`, `duration: 0.15` | **WRONG-TIER** , 150ms on a revealed panel. (Opacity+scale without blur is flagged `motion-ok` at :81-82 as pre-existing chrome, so no RECIPE row.) |
| `NotificationCenter.tsx:112` | **per-notification row cascade** | items appearing in a dropdown the owner opens dozens of times a day | Motion sheet 22 "cascade in"; **hard rule 5** | `duration: 0.22`, `delay: i * 0.07` | **WRONG-TIER + hard-rule-5** , 10 events = last row lands at **920ms**. See §6.1. Carries a `motion-ok` note citing TASTE_LOG 2026-07-16, so it was an approved decision , flagging it as a *conflict with a later law*, not as drift. |
| `NotificationCenter.tsx:91` | dropdown loading rows | loading | 5s cap | `animate-pulse` | **WCAG-2.2.2** |
| `SalonSwitcher.tsx:129` | salon-switcher sheet enter | sheet reveal | reveal 250-300 | `spring damping:30 stiffness:300` | **NO RULE** , non-gesture spring has no assigned tier (RANK 6). Measured settle is ~350-400ms. |
| `SalonSwitcher.tsx:122` | switcher backdrop | scrim | reveal 250-300 | no transition class found on the scrim | **MISSING** |
| `SalonSwitcher.tsx:171` | salon option rows | selection | snap 150 | `transition-colors` undurated | **OK** / **MISSING** press |
| `CommandPalette.tsx:123`, `:157` | close X + command rows | press / hover | press 80-100 / snap 150 | `transition-colors duration-150` | **OK** hover / **WRONG-TIER** press (none declared, so MISSING press) |
| `CommandPalette.tsx:104` | the palette itself opening on Ctrl+K | overlay reveal | reveal 250-300 | **no entrance animation** | **MISSING** , and the one place where a reveal genuinely helps: finding 6 (Bederson & Boltman) is about reconstructing *where* things are, and a palette appears over the work. |
| `WalkInModal.tsx:79`, `:120`, `:122` | walk-in modal actions | press | press **80-100** | `active:scale-[0.97] transition-[transform,filter] duration-150` | **WRONG-TIER** x3 (RANK 2) |
| `WalkInModal.tsx:63-64` | modal + backdrop | modal reveal | reveal 250-300 | `backdrop-blur-[6px]`, **no entrance animation** | **MISSING** |
| `IntakeFormTab:186` · `PromoManager:117`,`:215` · `FormulaTab:125` · `SmartReminderConfig:177`,`:184` · `LoyaltyConfig:174` · `TreatmentOutcome:145` · `RoomManager:269` · `FadeBlueprint:361` · `WellnessJournal:316` · `ConsultationNotes:149`,`:153` · `FormulaBook:231`,`:235` · `StationManager:126` · `NailPreferencesForm:194` · `DynamicPricingConfig:112`,`:199`,`:203` · `AiArtGenerator:137` · `NailClientTab:157`,`:249` · `RetailManager:94`,`:148`,`:155` | **every category-dashboard action button** (27) | press, CTA/row tier | press **80-100** | uniformly `active:scale-[0.97]` + `transition-[transform,...] duration-150` | **WRONG-TIER** x27 , the RANK 2 pattern with **zero** exceptions across the entire category-dashboard tree. |
| `StaffComparison.tsx:46`, `:51` | table/chart view segment | in-place flip | snap 150 | `transition-colors duration-150` | **OK** |
| `StaffComparison.tsx:117` · `PLComparison.tsx:116`,`:120` · `AiArtGenerator.tsx:78` · `StationManager.tsx:105` | **comparison / budget / capacity bars** | a proportion rendering or changing | in-place = snap 150; hard rule 2 | `transition-[width] duration-200` / `duration-[250ms]` | **RULE-2** x5 (+ `SetupBanner:60`, `coiffeur-crm:160` = **7 total**). All seven do the same thing and all seven should be `scaleX` + `transform-origin`. |
| `PLComparison.tsx:77` · `WalkinHourlyChart.tsx:80` · `RetailSalesDashboard.tsx:71`,`:86` · `AiArtGallery.tsx:48` | chart/list skeletons | loading | 5s cap | `animate-pulse` | **WCAG-2.2.2** x5 |
| `coiffeur/FormulaPhotoUpload.tsx:78` | upload-dropzone arrow | affordance hint | Motion sheet 22 has no "hint the user to drop a file" row | `animate-bounce`, **infinite, unconditional** , it is not bound to any loading or drag state | **WCAG-2.2.2** , another instance of RANK 1's `animate-bounce`, and like `SalonWalkInPanel:188` it is **unconditional**: it loops for as long as the panel is open, which on a form is indefinitely. |
| `HeatmapChart.tsx:57` | heatmap cell | `cursor-default`, non-interactive | , | `transition-colors` undurated | **OK** , a transition on a cell that never changes state is inert, not wrong. |
| `MiniSparkline.tsx`, `ForecastWidget.tsx` | sparkline + forecast widgets | static data display | , | **no motion at all** | **OK / no motion needed** , correct. |
| `nail/NailClientTab.tsx:69-71` | tab indicator sliding between tabs | in-place tab flip | snap 150 | framer `layoutId` + `spring stiffness:350 damping:30` | **NO RULE** , non-gesture spring, no assigned tier (RANK 6). Transform-driven via the layout engine, so rule 2 is fine. The only shared-element transition in the dashboard. |
| `FormulaBook.tsx:166` · `NailClientTab.tsx:258` | formula chips + colour swatches | selection flip | snap 150 | explicit property lists, `duration-150` | **OK** |
| `dashboard/error.tsx` | route error boundary | error state | `ErrorFallback` locked in the registry | no motion | **OK / no motion needed** |

---

# 4. WCAG 2.2.2 register , all 44, by kind

Every one is an auto-starting loop with **no pause, stop or hide mechanism**. `globals.css:822-830` caps them
under `prefers-reduced-motion` but does not discharge the criterion (finding 14: the criterion asks for a
mechanism for the user, and most users never set the flag). This is **another instance of RANK 1**; no new
loop *shape* was found beyond the ones RANKED already lists, but two new facts are:

- **`animate-pulse` is the dashboard's dominant loader, not `animate-shimmer`** , 17 sites vs the shell's
  `<Skeleton>`. `animate-pulse` was noted in `HOME_SEARCH_INSPO.md:52` as also-infinite, but the dashboard is
  where it concentrates. The two loaders sit **on the same screen**: `DashboardLayout.tsx:261-276` renders 12
  shimmering skeletons, then `dashboard/page.tsx:178` renders 2 pulsing ones.
- **The worst concurrent count in the repo is a dashboard route file**: `dashboard/loading.tsx` renders **18**
  `<Skeleton>` at once, beating the 30-shimmer 6-card grid only on a per-file basis but on a route the owner
  opens first, every session.

| kind | count | sites |
|---|---|---|
| `animate-spin` (in-button + page spinners) | **25** | `settings:863,1019,1205` · `cities-admin:94` · `discovery-admin:465,643,700` · `homepage-admin:88,132` · `commission-admin:101,194` · `feature-flags-admin:134` · `admin-sandbox:228,236,310,380,394,434` · `discovery-posts:187` · `salon-of-month-admin:244` · `ai-limits-admin:95,170` · `reports:271,304` · `SalonAboutEditor:82` |
| `animate-pulse` (skeletons) | **17** | `dashboard/page:178` · `coiffeur-crm:105,126` · `nail-admin:77` · `nail-clients:38` · `barber-ops:77` · `queue-display:58` · `spa-admin:91` · `barber-clients:41` · `admin-sandbox:328` · `NotificationCenter:91` · `ActivityFeed:88` · `PLComparison:77` · `WalkinHourlyChart:80` · `RetailSalesDashboard:71,86` · `AiArtGallery:48` |
| `animate-shimmer` via `<Skeleton>` | **2 clusters (30 elements)** | `dashboard/loading.tsx` (18) · `DashboardLayout:261-276` (12) |
| inline `ping 2.6s infinite` | **1 component, 2 call sites** | `DashboardUI:74` -> `cases:296`, `refunds:203` |
| `animate-bounce`, unconditional | **1** | `coiffeur/FormulaPhotoUpload:78` |

**The three unconditional ones** (they do not depend on a slow endpoint, so they fail today, every time):
`FormulaPhotoUpload:78` (loops while a form is open), and both `DashStatusPill pulse` call sites (an
"awaiting decision" case sits unresolved until a human acts, so >5s is the normal case).

---

# 5. RULE-2 register , all 14

| shape | count | sites |
|---|---|---|
| `transition-[width]` on a proportion bar | **6** | `SetupBanner:60` · `StaffComparison:117` · `PLComparison:116,120` · `AiArtGenerator:78` · `StationManager:105` |
| `transition-[height]` on a chart bar | **1** | `coiffeur-crm:160` |
| `transition-[left]` on a toggle knob | **1** | `services:593` |
| `transition-[grid-template-rows]` on an accordion | **1** | `services:600` |
| `transition-all` | **5** | `settings:1195` (over `left`) · `cases:207` · `refunds:234,244,252` (all over a ring/`box-shadow`) |

All 14 are the same class of defect RANKED tracks under RANK 5's RULE-2 sites (and the 7 rule-2 rows in
`HOME_SEARCH_INSPO.md`). The **`transition-[width]` proportion-bar cluster is a shape the customer audits did
not contain**, because the customer estate has no capacity/budget/comparison bars. All six are one
`scaleX` + `transform-origin: left` away from being correct, and none needs a design decision.

---

# 6. DASHBOARD-SPECIFIC JUDGEMENT , where motion should be **REMOVED**, not added

A dashboard is a tool an owner uses all day, so the bar for adding motion is higher here than on any browse
surface, and it is the surface where "delete it" is most often the right answer. Three named sources agree
and one of them gives a number (TASTE_MOTION finding 4): Atlassian, "**if someone will trigger this motion
dozens of times a day, keep it under 150ms**"; NN/g, "**the more frequent the animation, the more subtle and
shorter you'll want it to be**"; Apple HIG, "**in apps, generally avoid adding motion to UI interactions that
occur frequently**". THE SPEED LAW hard rule 5 already says this. What follows is where it bites.

## 6.1 REMOVE: the staggered entrance on KPI cards and lists (10 routes)

**What it is.** `containerVariants` + `itemVariants` (`lib/animations.ts:43-63`), imported by `revenue`,
`reports`, `reviews`, `segments`, `review-moderation`, `platform-analytics`, `content-editor`, `badge-manager`,
`all-salons`, `all-users`, plus `earnings`'s local 100ms-stagger copy. Every card, table and list block on
those pages fades up 16px over 300ms, 60ms apart, **every time the route mounts**.

**The counted cost.** `revenue/page.tsx` puts **10** elements on `itemVariants` (5 KPI cards from a `.map()` at
`:141-143`, plus blocks at `:157, :203, :238, :275, :286`) under one `containerVariants` at `:86`. Framer
applies `staggerChildren` per nesting level, so the exact wall time depends on the tree; at 40ms
`delayChildren` + 60ms per child + a 300ms item, the tail lands somewhere in the **0.6-1.0s** band. `earnings`
uses its own **100ms** stagger over 4 blocks (`:105` container; `:107, :118, :130, :192` items) with a spring
that settles after its nominal duration, so it is slower again. `reports/page.tsx:216` re-runs the whole
stagger **on every "load more"**, so pagination pays the entrance cost repeatedly.

**Why remove rather than retime.**
1. **Hard rule 5, with a number.** An owner opens `/dashboard/revenue` many times a day. Atlassian's ceiling
   for that is 150ms; this is 300ms per item on a 760ms schedule.
2. **The one paper that blesses entrance motion does not cover this.** Finding 6 (Bederson & Boltman 1999) is
   the narrowest, best-supported pro-motion result , and its own framing is that animation helps *reconstruct
   an information space*. `PDP_BOOKING`/`HOME_SEARCH_INSPO` already record the boundary: "It is **NOT** a
   citation for entrance animations on a list, because nothing is travelling and nothing needs
   reconstructing." A KPI card fading up in place travels nowhere.
3. **Finding 12 forbids the usual justification.** Tversky, Morrison & Betrancourt (2002): the evidence for
   animation aiding comprehension is "**not encouraging**", and apparent wins traced to unfair comparisons.
   So "it helps the owner take in the page" is not an available argument.
4. **Finding 13 gives the cost shape.** Brehmer et al. (2019), 96 participants: an animated presentation took
   up to **2.8x longer** than showing things at once, *and the animated users were more confident while being
   slower* , the pattern that survives user feedback. A staggered reveal is a small dose of exactly that: it
   withholds state behind time.
5. **It also breaks the ENTER RECIPE** (opacity+y, no scale, no blur), so "keep it but fix it" means
   re-deriving the whole thing anyway.

**Recommendation:** delete the `motion.div` wrappers on these ten routes and render the populated state
immediately. If the owner wants *something*, the honest minimum is a single container-level 150ms opacity
fade with **no per-item stagger** , one snap-tier beat for the whole page, not 8 sequential ones.

## 6.2 KEEP-AS-IS: no motion on table sort, filter change, or list re-render

`bookings:263`, `clients:133`, `services:513`, `reports:185/200`, `cases:252/258`, `refunds:173`,
`revenue:70`, `analytics:167`, `staff:552`, `marketing:57` all change a list's contents with **no entrance
animation on the new rows**. That is **correct and should be protected**, not treated as a gap:

- Finding 13's failure mode is animation used as a **substitute for showing things at once**. A dashboard
  filter exists precisely to show the subset at once.
- Hard rule 5: filtering is the most-repeated action on a data screen.
- Finding 8 (Pratt et al. 2010 + NN/g Laubheimer): motion captures attention **involuntarily**; on a screen
  that also carries a task, that attention is spent on something that is not the task.

The pill itself flipping at 150ms is the whole correct answer, and the law names it: "an in-place state flip:
tab switch, **chip select, filter change**, toggle". **Explicitly do not add a staggered re-entrance to
filtered results.** `PRIMITIVES_SHARED`/`MOTION.md:79` already record the owner-facing version of this
lesson: "re-staggering search results on every filter change reads as annoying".

## 6.3 DECLINE (with one carve-out): Motion sheet 22's value-roll and count-bump on KPI numbers

Motion sheet 22 assigns "Money value changes , roll/odometer tick" and "Count/badge changes , spring bump".
By the letter, `DashStatCard`, `StatTile`, and every KPI on `revenue` / `earnings` / `analytics` are MISSING
it. I am recommending the owner **decline** it for KPI tiles, and the reason is not taste:

- These numbers change **on fetch, not on an action the owner took**. Motion sheet 22's own discipline for
  exactly this case is written into it: "Earned moment without a client event , **DO NOT fake on load**".
  A revenue figure animating because a request resolved is that fake.
- Finding 8: an odometer on six tiles at once is six involuntary attention grabs on a screen whose job is a
  five-second read (TASTE_DASHBOARDS diagnostic 1).
- TASTE_DASHBOARDS finding 15 is the closest dashboard-specific evidence: NN/g's own audit found that
  **removing a decorative element next to a KPI made the number itself read as more prominent**. Motion is a
  stronger competitor for attention than the icon they removed.

**The carve-out , `barber/LiveQueuePanel`.** The queue position *is* a live number changing without a client
event, but on a screen (`queue-display`) built to be watched rather than worked, where a position change is
the entire information payload and the "departure-board flip" is exactly the metaphor. This is the one place
in the dashboard where Motion-22's flip row should be honoured. It is currently MISSING.

## 6.4 REMOVE: the 70ms-per-item cascade in the notification dropdown

`NotificationCenter.tsx:112` , `duration: 0.22, delay: i * 0.07`. Ten events means the last row lands at
**920ms** after the panel opens, in a dropdown the owner opens dozens of times a day to answer one question:
what happened. Hard rule 5 and finding 4's 150ms ceiling both apply directly. **Honest caveat:** the line
carries `motion-ok: P12 approved row recipe ... TASTE_LOG 2026-07-16`, so this was an owner-approved
decision. It is therefore an **owner question** , the approval predates THE SPEED LAW (2026-07-25) , not
drift to be fixed unilaterally. The panel's own 150ms enter (`:87`) should be retimed to the reveal tier
regardless.

## 6.5 REMOVE: nothing else. What must be ADDED is small and boring.

The dashboard's real deficit is not missing choreography, it is **328 buttons with no press acknowledgement**,
which is the cheapest, fastest, most-repeated motion in the system (80-100ms, Miller 1968, the only tier with
a named primary source). Fixing press across the surface costs one shared class and buys feedback on every
click an owner makes all day. Everything else in §6 is a subtraction. The only genuinely additive rows I would
defend are: **gallery upload progress** (finding 11, a real wait on someone else's system, -11% perceived
duration), **the command palette's entrance** (finding 6, it appears over the work and the user must locate
it), and **the analytics chart transition on a period change** (finding 7, the one measured pro-motion result
for reading a change between two related chart states).

---

# 7. NO RULE COVERS THIS , owner questions, deliberately not guessed (9)

1. **Drag-and-drop lift and drop physics.** Three different DnD implementations ship in the dashboard,
   each with its own defaults: `@hello-pangea/dnd` (`calendar:652`, `services:552`), HTML5 `draggable`
   (`GalleryManager:252`), `@dnd-kit` (`discovery-admin:537`). LOCKFILE §16.5 covers finger-driven 1:1
   gestures (sheet drag, SearchMorph) and says they release into a velocity-seeded spring. **Does §16.5 bind
   a library-driven drop, or does the library's default stand?** Not guessed.
2. **The drag LIFT.** `calendar:946` applies `scale-105` + `shadow-2xl` with no transition , an instantaneous
   jump. No rule names a lift. Press tier? Snap? Instant on purpose?
3. **Non-gesture springs have no assigned tier.** `SalonSwitcher:129`, `earnings:46`, `NailClientTab:71`.
   Already RANK 6; three more instances here.
4. **Stagger schedules have no ceiling.** 40ms `delayChildren`, 60ms, 70ms and 100ms staggers all ship. Same
   gap `PRIMITIVES_SHARED:176` records.
5. **A new item arriving in a live feed** (`ActivityFeed`, `LiveQueuePanel`) has no Motion-22 row. Motion-22's
   nearest rows are "list first-load" and "live position update", neither of which is "one new row appeared".
6. **Accordion / expand-collapse has no vocabulary row.** `services:600`, `cases:320`, `ActivityFeed:151` each
   solve it differently. (The `grid-template-rows` technique is separately a rule-2 defect, but the *tier* for
   an expand is genuinely unassigned.)
7. **Native `<select>` / `<input type=date|time>`** (37 + 146 elements). The law says nothing about native
   control motion, and finding 12's caveat argues against inventing something.
8. **A two-press "armed" destructive confirm** (`cases:207`, `refunds:234-252`) has no motion row. The ring
   appearing is currently the whole signal, on `transition-all`.
9. **Tooltip reveal delay.** `DashboardLayout:299` fades a tooltip at 150ms with **no delay**. No rule covers
   hover-intent timing; 14 rail items means an owner sweeping the rail flashes 14 tooltips.

---

# 8. Contradictions found in our own docs and code (stated, not silently fixed)

1. **Two motion vocabularies claim the same job.** `lib/animations.ts` (10 dashboard routes) and
   `lib/motion.ts` (the ENTER RECIPE / step-swap module the laws were written against). Nothing tells a
   dashboard author which one is canonical, and the one that ships on the dashboard is the one no audit read.
2. **Three toggle implementations, one correct.** `settings:260` uses `transition-transform` (correct);
   `services:593` uses `transition-[left]`; `settings:1195` uses `transition-all` over `left`. Two of them are
   in the same file.
3. **Two loading vocabularies on the same screen.** `<Skeleton>`/`animate-shimmer` in the shell,
   `animate-pulse` in the page body, rendering simultaneously on `/dashboard`.
4. **Motion sheet 22 mandates `.animate-breathe` on empty-state icons**, which TASTE_MOTION finding 14 makes a
   Level A exposure. The dashboard's empty states (`dashboard/page:270`, `analytics`, `reports`) are compliant
   with the *law* by ignoring the *vocabulary*. Already on RANKED's contradiction list (line 99); this audit
   confirms the dashboard side silently resolved it in WCAG's favour.
5. **`lib/animations.ts:16` names 0.15 as "Hover / press feedback"** , one constant for two tiers the SPEED
   LAW separates. This single line is the doc-level cause of the dashboard's uniform 150ms press.
6. **`lib/animations.ts:112` tells callers to use `AnimatePresence mode="wait"`**, which hard rule 4 forbids
   (non-interruptible) and which RANKED already flags at `BookingWizard.tsx:213`. No dashboard caller yet.
7. **An owner-approved decision now conflicts with a later law.** `NotificationCenter:112`'s cascade carries
   `motion-ok ... TASTE_LOG 2026-07-16`; THE SPEED LAW is 2026-07-25 and its hard rule 5 contradicts it.

**Out of scope but noticed, stated once:** `dashboard/queue-display/page.tsx:29` renders `bg-[#0A0A0A]` with
white text , a dark surface on web, against the NEVER-AGAIN floor 1 ("WEB = ONE LIGHT THEME"). Not a motion
finding; flagged because I read the file.

---

# 9. Cross-reference , what is new vs. another instance of a known rank

| finding | status |
|---|---|
| `lib/animations.ts` as an unaudited parallel motion vocabulary (10 dashboard routes) | **NEW** |
| The staggered-entrance harm on a tool surface (760ms on `/revenue`, replayed on every "load more") | **NEW** |
| `transition-[width]` proportion-bar cluster (7 sites) | **NEW shape**, existing RULE-2 class |
| Mobile drawer travelling at 150ms while its scrim fades at 200ms | **NEW** |
| Three DnD libraries with three unspecified drop physics | **NEW** (extends RANK 6) |
| All 35 `active:scale` at 150ms, 328 buttons with no press | another instance of **RANK 2** (uniform, zero exceptions) |
| 44 uncapped auto-starting loops | another instance of **RANK 1** |
| 14 rule-2 sites | another instance of the RULE-2 class tracked under **RANK 5** |
| 200ms as a de-facto fourth tier (`lib/animations` `DURATION_NORMAL`, scrim, accordion, bars) | another instance of **RANK 5** |
| Non-gesture springs unassigned (3 more) | another instance of **RANK 6** |
| ENTER RECIPE contradiction (opacity without scale+blur) across `lib/animations.ts` | another instance of **RANK 3** |
