# Motion audit , THE SHARED LAYER (primitives + layout + motion.ts + globals.css)

Read-only audit, 2026-07-25. Graded against exactly two authorities: `_design-system/MOTION.md`
(THE SPEED LAW, THE ENTER RECIPE, Motion sheet 22, the §4 easing set) and
`_design-system/research/TASTE_MOTION.md`. Where neither covers a case, the row says
**NO RULE COVERS THIS** rather than proposing a number.

**Summary.** 117 graded rows (plus 2 pointer rows) across 30 primitives, 11 layout components,
`primitives/motion.ts`, `tailwind.config.js` and `app/globals.css`. Verdict tokens: **47 OK ·
47 WRONG-TIER · 15 MISSING · 11 NO RULE · 7 WCAG-2.2.2** (127 tokens over 117 rows , some rows
carry two, e.g. "OK on tier, MISSING press"; 9 rows also carry a `+RULE-2` tag and 3 a `+RECIPE`
tag). The single dominant finding is that this layer has almost no **press tier**: of the 18
presses that declare a duration, **10 run at 150-200ms**, i.e. the snap tier, against the law's
80-100ms , and press is the one tier in the whole ladder with a named primary source behind it
(Miller 1968, TASTE_MOTION finding 1). A further 9 interactive controls ship **no press feedback
at all**. The second finding is that **200ms is this codebase's de-facto fourth tier**: 19 rows
sit at 200ms or 220ms, in the gap the law explicitly forbids ("three, and nothing between them").
Third,
**four durations are over the 300ms ceiling without being full-screen**: Sheet entry 600ms,
BellIcon hover-swing 700ms, RatingStars star-pop 450ms, CookieConsent banner 400ms , plus the
already-known 420ms ENTER RECIPE. Fourth, **7 WCAG 2.2.2 (Level A) exposures**, all of them
auto-starting infinite loops with no pause/stop mechanism, of which the shimmer skeleton is the
one that ships on every list, grid and picker in the product. Fifth, the curve inventory confirms
the research's claim exactly: **`thud` has one call site in the entire repo** and it is a press,
not an exit , every exit in the shared layer runs on `snap` or on `glide`, and `glide` is the
*decelerate* curve, i.e. the shared layer's exits are on an entrance curve. Sixth, `globals.css`
and `tailwind.config.js` define **36 animation utilities / keyframes with zero call sites**
against 22 that are alive, which is why the file reads
as a motion system while the shipped surfaces reach for hand-rolled numbers instead , including
**three of the fourteen locked Motion-sheet-22 micro-moments** (toast tilt-settle, money-value
roll, stamp slam), whose utilities exist and have no consumer.

## Legend

| token | meaning |
|---|---|
| **OK** | duration matches the tier the law assigns for that job |
| **WRONG-TIER** | duration is in a different tier than the job calls for, or in the forbidden gap between tiers |
| **MISSING** | the law names a motion for this moment and the element ships none |
| **WCAG-2.2.2** | auto-starting looping motion, >5s possible, beside other content, no pause/stop mechanism |
| **NO RULE** | neither MOTION.md nor TASTE_MOTION.md covers this case , recorded, not invented |
| `+RULE-2` | appended where SPEED LAW hard rule 2 is also broken (animates something other than transform / opacity / filter) |
| `+RECIPE` | appended where the locked ENTER RECIPE is hand-rolled per surface instead of imported from `motion.ts` |

Tier reference (MOTION.md, THE SPEED LAW): **press 80-100ms** · **snap 150ms** · **reveal
250-300ms** · **above 300ms = full-screen only**. Tier follows the JOB, never the surface.

---

## 1 · Primitives , `app/[locale]/_components/primitives/**`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `motion.ts:39` | `ENTER_DURATION` = 0.42 , the ENTER RECIPE | element entrance (card, block) | reveal 250-300ms | **420ms** `glide`, opacity+scale 0.96+blur 8px | **WRONG-TIER** , over the 300ms ceiling, not full-screen. Both sides owner-approved (recipe 2026-07-09, SPEED LAW 2026-07-25); the later dated decision wins the precedence chain. TASTE_MOTION NOT-SUPPORTED item 3 says surface it, do not edit it. |
| `motion.ts:125` | `butterPress()` , the shared button/row press | press acknowledgement | press 80-100ms | `transition-all duration-[180ms] ease-glide hover:-translate-y-[1px]` + `active:scale-*` | **WRONG-TIER +RULE-2** , 180ms is ~2x the press ceiling, and `transition-all` animates every changed property including `box-shadow` (TASTE_MOTION finding 25) and any width/height. This is the shared helper, so the error propagates to every caller. |
| `motion.ts:137` | `STEP_SWAP_DURATION` = 0.26 | full-screen step swap | reveal 250-300ms | 260ms `glide`, opacity + scale 0.99, no blur | **OK** |
| `motion.ts:80` | `STAGGER_STEP` = 0.05 (50ms between children) | list stagger interval | , | 50ms | **NO RULE COVERS THIS** , the SPEED LAW tiers single motions; no authority sets a stagger interval. |
| `motion.ts:57-71` | `useEnterMotion` reduced-motion branch | reduced-motion fallback | end state, no animation | `initial = animate`, `duration: 0` | **OK** , exactly hard rule 3. |
| `motion.ts:166-181` | `useStepSwapMotion` reduced-motion branch | reduced-motion fallback | end state, no animation | all three variants = final state, `duration: 0` | **OK** |
| `TabPill.tsx:48` | filter / segment pill, colour+bg+border+shadow | in-place state flip (chip select) | snap 150ms | `duration-200 ease-glide`, includes `box-shadow` | **WRONG-TIER** , 200ms sits in the forbidden gap. Rule 5 bites hardest here: a booking flow hits these pills many times. |
| `TabPill.tsx:49` | same pill, press | press | press 80-100ms | `active:scale-[0.97] active:duration-[80ms]` | **OK** , the one fully correct press in the shared layer. |
| `PillToggle.tsx:66` | multi/single-select pill | in-place state flip | snap 150ms | `transition-colors duration-150 ease-snap` | **OK** |
| `PillToggle.tsx:53-76` | same pill, press | press | press 80-100ms | none , no `active:` state at all | **MISSING** , Motion sheet 22 "Any press: CTA/card 0.97 · row 0.98 · icon 0.94". |
| `Checkbox.tsx:75` | box fill/border on check | in-place state flip | snap 150ms | `transition-colors duration-150 ease-snap` | **OK** |
| `Checkbox.tsx:78` | box press | press | press 80-100ms | `group-active:scale-[0.92] [&]:transition-transform` , no duration class, so Tailwind's default **150ms** | **WRONG-TIER** , and 0.92 is not one of the three locked press scales (0.97/0.98/0.94). |
| `Checkbox.tsx:88` | check glyph scale-in | in-place state flip | snap 150ms | `transition-transform duration-300 ease-spring` | **WRONG-TIER** , 300ms (reveal tier) on a 14px in-place glyph. |
| `Radio.tsx:57` | ring colour on select | in-place state flip | snap 150ms | `transition-colors duration-150 ease-snap` | **OK** |
| `Radio.tsx:60` | radio row press | press | press 80-100ms | `group-active:scale-[0.94] [&]:transition-transform` , default **150ms** | **WRONG-TIER** , and 0.94 is the icon tier applied to a row (locked row tier = 0.98). |
| `Radio.tsx:67` | inner dot scale-in | in-place state flip | snap 150ms | `transition-transform duration-150 ease-snap` | **OK** |
| `Switch.tsx:82` | track colour on toggle | in-place state flip (toggle is named in the law) | snap 150ms | `transition-colors duration-200 ease-snap` | **WRONG-TIER** |
| `Switch.tsx:95` | knob travel | in-place state flip | snap 150ms | `transition-[left,transform] duration-200 ease-snap`, `left-[2px] -> left-[22px]` | **WRONG-TIER +RULE-2** , animates `left`; hard rule 2 is "Transform, opacity and filter only, so nothing reflows mid-motion". |
| `Switch.tsx:98` | knob press | press | press 80-100ms | `active:scale-[0.92] active:duration-100 active:ease-thud` | **OK** on duration. Scale 0.92 is off the locked 3-tier vocabulary. Only `ease-thud` call site in the repo (see §A). |
| `Sheet.tsx:43` | bottom sheet entry | reveal (travels) | reveal 250-300ms | `transition-transform duration-[600ms] ease-glide` | **WRONG-TIER** , 2x the reveal ceiling and 600ms is not even in the "full-screen" carve-out; a 75dvh sheet is not full-screen. Largest single miss in the layer. |
| `Sheet.tsx:45` | bottom sheet exit | reveal (travels) | reveal 250-300ms | `data-[exiting]:duration-200 data-[exiting]:ease-snap` | **WRONG-TIER** on duration (200ms gap). Curve: TASTE_MOTION finding 17 says exits accelerate (`thud`); MOTION.md carries no enter/exit assignment rule, so the curve itself is **NO RULE** today. |
| `Sheet.tsx:178` | sheet backdrop fade-in | reveal | reveal 250-300ms | `transition-opacity duration-300 ease-snap` | **OK** |
| `Sheet.tsx:180` | sheet backdrop fade-out | reveal | reveal 250-300ms | `data-[exiting]:duration-200` | **WRONG-TIER** , 200ms gap. |
| `Sheet.tsx:47-49` | sheet reduced-motion | end state, no animation | end state | `motion-reduce:transition-opacity motion-reduce:duration-100` + collapse to opacity-only | **OK** , more conservative than required; TASTE_MOTION finding 15 says record that as a choice. |
| `Sheet.tsx:261` | sheet close X | press (Motion sheet 22 "Any close/X: press-collapse, icon tier") | press 80-100ms | `transition-[color,transform] duration-150 ease-snap active:scale-[0.94]` | **WRONG-TIER** , scale value correct, duration is the snap tier. |
| `Sheet.tsx:142-165` | drag-to-dismiss grabber | gesture-driven , LOCKFILE §16.5 via MOTION.md line 53 | spring seeded with finger velocity, dismiss by velocity sign + momentum projection, rubber-band, grabbable mid-settle | bare `dragDy > 90px` position threshold; on release `style.transition = ""` hands the sheet back to the **600ms** entry transition; no velocity, no rubber-band, not grabbable mid-settle | **WRONG-TIER** , and the §16.5 gesture contract is unimplemented on the one draggable primitive in the layer. |
| `Sheet.tsx:129-135` -> `globals.css:160-171` | page steps back behind the sheet (`.sheet-scale-back`) | full-screen transition | >300ms allowed | `transform, filter, border-radius 320ms cubic-bezier(0.16,1,0.3,1)` | **OK** on tier **+RULE-2** , `border-radius` is neither transform, opacity nor filter. |
| `Modal.tsx:39` | modal surface entry | reveal | reveal 250-300ms | `transition-[opacity,transform] duration-[250ms] ease-snap`, scale 0.95 | **OK** on tier. Curve: an entrance on `snap` rather than the decelerate `glide`; MOTION.md has no enter-curve assignment rule, so **NO RULE** today (finding 17 recommends one). |
| `Modal.tsx:41` | modal surface exit | reveal | reveal 250-300ms | `data-[exiting]:duration-150` | **WRONG-TIER** by the letter (tier follows the job, and the law gives exits no separate row). If exits are meant to be faster than enters, that is currently **NO RULE**. |
| `Modal.tsx:130` | modal backdrop fade-in | reveal | reveal 250-300ms | `transition-opacity duration-200 ease-snap` | **WRONG-TIER** , 200ms gap. |
| `Modal.tsx:132` | modal backdrop fade-out | reveal | reveal 250-300ms | `data-[exiting]:duration-150` | **WRONG-TIER** |
| `Modal.tsx:43-44` | modal reduced-motion | end state | end state | `motion-reduce:transition-opacity motion-reduce:duration-100`, scale collapsed | **OK** |
| `Modal.tsx:221` | modal close X | press | press 80-100ms | `duration-150 ease-snap active:scale-[0.94]` | **WRONG-TIER** |
| `Toast.tsx:328` | toast entry | reveal (travels 20px) | reveal 250-300ms | `opacity 200ms cubic-bezier(0.4,0,0.2,1)` **+** `transform 350ms cubic-bezier(0.34,1.56,0.64,1)` | **WRONG-TIER** , two different durations on one entrance, and the transform leg is 350ms, over the ceiling without being full-screen. |
| `Toast.tsx:327` | toast exit | reveal | reveal 250-300ms | `opacity 150ms cubic-bezier(0.16,1,0.3,1)` | **WRONG-TIER** on duration. Curve is `glide`, the **decelerate** curve, on an exit , exactly the inversion finding 17 names. |
| `Toast.tsx:292` | unmount timer | , | , | hardcoded `setTimeout(..., 150)` duplicating the exit duration | **NO RULE COVERS THIS** , recorded because the duration now lives in two places and will drift when one is retuned. |
| `Toast.tsx:256-264, 314-336` | toast entrance treatment | Motion sheet 22: "Toasts: tilt-settle enter, Toast primitive owns it" | `.animate-toast-tilt` | plain translateY + opacity; `.animate-toast-tilt` (`globals.css:1196`) has **0 call sites app-wide** | **MISSING** , the locked motion-22 row for toasts is unimplemented and its utility is dead code. |
| `Skeleton.tsx:83` | loading skeleton shimmer | loading feedback | , (looping) | `animate-shimmer` = `shimmer 1.5s ease-in-out infinite` (`tailwind.config.js:340`) | **WCAG-2.2.2** , auto-starts, loops forever, sits beside other content, no pause/stop. See §B. |
| `SkeletonCard.tsx:37-44` | composite card skeleton | loading feedback | , (looping) | five concurrent `<Skeleton>` = five infinite shimmers per card | **WCAG-2.2.2** (inherited, multiplied by grid size) |
| `DateTimePicker.tsx:526` | slot-grid loading skeleton | loading feedback | , (looping) | `bg-[length:200%_100%] animate-shimmer` inside `.slot-cascade` | **WCAG-2.2.2** , this one waits on a live availability endpoint, so >5s is the ordinary case, not the edge case. |
| `DateTimePicker.tsx:314,338,394,408,460,578,655,801` | date cell / slot chip / nav arrow select | in-place state flip | snap 150ms | `transition-colors duration-150 ease-snap` (all eight) | **OK** |
| `DateTimePicker.tsx` (same controls) | date + slot press | press | press 80-100ms | no `active:` state anywhere in the file | **MISSING** , the most-tapped control in the booking flow has no press acknowledgement. |
| `DateTimePicker.tsx:1153-1159` (`globals.css`) | `.slot-cascade` reveal after a date pick | Motion sheet 22: "Choice reveals a set: cascade in" | , | `slot-in 0.4s cubic-bezier(0.16,1,0.3,1) backwards`, stagger 0.03-0.43s | **WRONG-TIER** , the per-item 400ms is over the reveal ceiling; the stagger schedule itself is **NO RULE**. |
| `TextInput.tsx:27` | input border/bg/shadow on focus + tone | in-place state flip | snap 150ms | `transition-[border-color,background-color,box-shadow,color] duration-150 ease-snap` | **OK** |
| `TextInput.tsx:151` | inline "checking" spinner | loading feedback | , (looping) | `animate-spin` (Tailwind `spin 1s linear infinite`) | **WCAG-2.2.2**. Also off-vocabulary: Motion sheet 22 says "spinners only INSIDE buttons"; this one is inside an input. |
| `TextInput.tsx:168` | password reveal toggle | in-place state flip | snap 150ms | `transition-colors duration-150 ease-snap` | **OK** ; no press state , **MISSING** press. |
| `Textarea.tsx:21` | textarea focus/tone | in-place state flip | snap 150ms | `transition-[border-color,background-color,box-shadow,color] duration-150 ease-snap` | **OK** |
| `Select.tsx:21` | select focus/tone | in-place state flip | snap 150ms | same as above | **OK** |
| `RatingStars.tsx:78` | star pop on newly-filled | expressive moment on tap | , (see verdict) | `scale: [1,1.38,1]`, `duration: 0.45`, `ease [0.34,1.56,0.64,1]` (= `spring`), `delay: i*0.07` | **WRONG-TIER** , 450ms, over the 300ms ceiling, not full-screen. The law gives no tier to an "express" moment (TASTE_MOTION finding 9 names the role but not a duration), so the ceiling is the only rule that reaches it. |
| `RatingStars.tsx:92` | star press | press | press 80-100ms | `whileTap={{ scale: 0.85 }}` with **no transition declared**, so framer's default spring | **NO RULE COVERS THIS** for the duration (a spring has none , TASTE_MOTION finding 18), but 0.85 is outside the locked 3-tier press scale. |
| `SuccessMark.tsx` -> `globals.css:475-482` | success celebration (ring 0.75s / disc 0.55s spring / check draw 0.4s / rise 0.42s) | celebration peak | , | as listed, choreographed 0s -> 0.68s | **WRONG-TIER** by the letter of ">300ms is full-screen only". Honest conflict: MOTION.md's own SuccessMark section locks these exact numbers and the newer SPEED LAW never names the celebration case. Same shape as the 420ms question , owner call, not an edit. |
| `SuccessMark.tsx` -> `globals.css:483-487` | success reduced-motion | end state | end state | ring `display:none`, others `animation:none`, check `stroke-dashoffset:0` | **OK** |
| `BackButton.tsx:35` | back tap | press | press 80-100ms | `transition-[transform,background-color] duration-150 active:scale-[0.94]` (no ease token, Tailwind default) | **WRONG-TIER** |
| `SeeAllButton.tsx:62` | see-all pill hover | in-place state flip | snap 150ms | `transition-colors` , no duration, Tailwind default 150ms | **OK** |
| `SeeAllButton.tsx:57-91` | see-all pill press | press | press 80-100ms | none | **MISSING** |
| `SkipLink.tsx:59` | skip link appears on focus | in-place reveal of a small element | snap 150ms | `transition-opacity duration-150 ease-snap` | **OK** |
| `CookieConsent.tsx:252` | consent banner slide-in | reveal (travels) | reveal 250-300ms | `transition-transform duration-[400ms] ease-glide` | **WRONG-TIER** , 400ms, over ceiling, a bottom banner is not full-screen. |
| `CookieConsent.tsx:291-292` | banner secondary button | press + colour | press 80-100 / snap 150 | `transition-colors duration-150 ease-snap` + `active:scale-95 active:duration-[80ms]` | **OK** on both durations; 0.95 is off the locked press scale. |
| `CookieConsent.tsx:325-326, 339-340` | banner primary + tertiary buttons | press + colour | press 80-100 / snap 150 | `duration-150 ease-snap` + `active:scale-[0.97] active:duration-[80ms]` | **OK** |
| `CookieConsent.tsx:441, 453` | settings-panel buttons | press | press 80-100ms | `transition-colors` only, no `active:` | **MISSING** , the same two actions get a press in the banner and none in the panel. |
| `Avatar.tsx` (whole file) | photo/initials circle | not interactive | , | none | **OK** , no rule requires motion on a non-interactive element. |
| `CardText.tsx`, `FieldLabel.tsx`, `FieldHelper.tsx`, `PriceFrom.tsx`, `Logo.tsx` | static display primitives | not interactive | , | none | **OK** |
| `ComingSoon.tsx:75-85` | dead-click interception | , | , | fires a toast, no motion of its own; child keeps its own transitions under `opacity-50` | **NO RULE COVERS THIS** , the law says nothing about a suppressed-affordance press. Recorded, not invented. |
| `WelcomeToast.tsx:55-59` | post-login greeting | delegates to Toast | inherits Toast's row | , | see Toast rows |

---

## 2 · Layout , `app/[locale]/_components/layout/**`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `Header.tsx:509` | sticky header condense (padding, bg, blur, shadow) | in-place state flip on scroll | snap 150ms | `transition-all duration-300 ease-glide` | **WRONG-TIER +RULE-2** , 300ms on an in-place change ("a 420ms tab switch reads as the UI thinking" applies verbatim), and `transition-all` sweeps in `max-height` + `padding` (next row) plus `box-shadow`. |
| `Header.tsx:544-552` | mobile category-route header FOLD | in-place collapse | snap 150ms | `max-md:max-h-0` <-> `max-md:max-h-[140px]` + `!py-0`, riding the 300ms `transition-all` | **WRONG-TIER +RULE-2** , animates `max-height` and padding. Hard rule 2: "Never animate width, height or top." |
| `Header.tsx:442-467` | scroll listener driving all of the above | , | hard rule 3: reduced motion "attaches no scroll listener" | `window.addEventListener("scroll", onScroll, {passive:true})` unconditionally; no `prefers-reduced-motion` check anywhere in the file | **MISSING** , the reduced-motion half of hard rule 3 is unimplemented on the app's only global scroll-driven chrome. |
| `Header.tsx:531` | PDP deep-scroll header hide | reveal (a full-width bar travels off-screen) | reveal 250-300ms | `-translate-y-full` on the shared 300ms `transition-all` | **OK** on tier **+RULE-2** (rides `transition-all`). |
| `Header.tsx:171` | desktop nav item hover | in-place state flip, high-frequency | snap 150ms (rule 5) | `transition-colors duration-200 ease-glide` | **WRONG-TIER** |
| `Header.tsx:182` | nav chevron rotate | in-place state flip | snap 150ms | `transition-transform duration-200 ease-glide` | **WRONG-TIER** |
| `Header.tsx:191-195` | desktop dropdown panel | reveal (travels + is revealed) | reveal 250-300ms | `motion.div`, opacity + `y:-8` + `scale:0.98`, `duration: 0.18`, `ease [0.22,1,0.36,1]` | **WRONG-TIER +RECIPE** , 180ms; ease is the legacy `ease-out-strong` value, not one of the four §4 tokens; hand-rolled `initial/animate` instead of importing `motion.ts` (MOTION.md: "Never hand-roll `initial`/`animate` per surface"). |
| `Header.tsx:217` | dropdown menu item hover | in-place state flip | snap 150ms | `transition-colors duration-150 ease-glide` | **OK** |
| `Header.tsx:289, 299, 316` | MobileCityChip button, chevron, options | in-place state flip | snap 150ms | `duration-150 ease-glide` / bare `transition-colors` | **OK** |
| `Header.tsx:605, 629` | home tile / back tile | press | press 80-100ms | `transition-[opacity,border-color,background-color,transform] duration-200 ease-glide active:scale-[0.94]` | **WRONG-TIER** , the press scale inherits the 200ms. |
| `Header.tsx:735` | "Über uns" hover bloom | hover micro-interaction, high-frequency | snap 150ms (rule 5, and Atlassian's "<150ms if triggered dozens of times a day", finding 4) | `before:duration-[280ms] before:ease-[cubic-bezier(0.4,1.4,0.4,1)]` | **WRONG-TIER** , 280ms, plus an ad-hoc bezier that exists nowhere in the token set. |
| `Header.tsx:752` | account avatar hover | in-place state flip | snap 150ms | `transition-opacity duration-200 ease-glide` | **WRONG-TIER** |
| `Header.tsx:762` | "Anmelden" CTA | press + hover | press 80-100 / snap 150 | `transition-all duration-200 ease-glide ... active:scale-[0.97] active:duration-[80ms]` | **WRONG-TIER +RULE-2** on the hover leg (200ms, `transition-all` over a changing `box-shadow`); the `active:duration-[80ms]` press leg is **OK**. |
| `Header.tsx:802` | hamburger tile | press | press 80-100ms | `transition-[transform,background-color,border-color] duration-200 ease-glide active:scale-[0.94]` | **WRONG-TIER** |
| `Header.tsx:808, 818` | hamburger Menu <-> X crossfade | in-place state flip | snap 150ms | `transition-[opacity,transform] duration-[220ms] ease-glide` | **WRONG-TIER** , 220ms is in the forbidden gap. |
| `Header.tsx:866` | mobile category tab pill | in-place state flip | snap 150ms | `transition-colors duration-150 ease-glide` | **OK** on duration. Curve `glide` on an in-place change where the token comment assigns `snap`: **NO RULE** (MOTION.md carries no by-job curve assignment). |
| `Header.tsx:859-871` | same category tabs, press | press | press 80-100ms | none | **MISSING** |
| `MobileMenu.tsx:165-168` | full-screen menu enter/exit | full-screen transition | reveal 250-300ms, >300 permitted | `opacity` + `y:8`, `duration: 0.24`, `ease [0.22,1,0.36,1]` | **OK** on tier **+RECIPE** , opacity+y only (no scale, no blur), hand-rolled per surface instead of `useStepSwapMotion`; ease is off-token. |
| `MobileMenu.tsx:198, 354, 424` | menu row / chip hover | in-place state flip | snap 150ms | `transition-colors duration-150 ease-glide` | **OK** |
| `MobileMenu.tsx:227` | city option press | press | press 80-100ms | `transition-colors active:bg-s-bg-sunken` , a background flash, no scale | **MISSING** , a bg flash is not in the locked 3-tier press vocabulary. |
| `MobileMenu.tsx:210-236` | city dropdown open | reveal | reveal 250-300ms | no transition at all , appears instantly | **MISSING** |
| `MobileMenu.tsx:253-255, 375-377` | dashboard / account cards | hover shadow + press | snap 150 / press 80-100 | `transition-shadow duration-200 ease-glide` + `active:scale-[0.98] active:duration-[80ms]` | **WRONG-TIER** on the 200ms shadow leg (press leg **OK**); transitioning `box-shadow` on a hover surface is finding 25's named cost. |
| `MobileMenu.tsx:464-465` | list row card | hover + press | snap 150 / press 80-100 | `transition-[transform,box-shadow] duration-150 ease-glide` + `active:scale-[0.98] active:duration-[80ms]` | **OK** |
| `CityTopBar.tsx:185` | close X | press | press 80-100ms | `transition-colors` only, no `active:` | **MISSING** |
| `CityTopBar.tsx:205` | city chip hover-lift | in-place state flip | snap 150ms | `transition-[border-color,transform] duration-150 ease-glide hover:-translate-y-[1px]` | **OK** ; no press state , **MISSING** press. |
| `CityTopBar.tsx:217` | chevron rotate | in-place state flip | snap 150ms | `transition-transform duration-150` | **OK** |
| `CityTopBar.tsx:239` | city option hover | in-place state flip | snap 150ms | `transition-colors` (default 150ms) | **OK** |
| `CityTopBar.tsx:258` | ink CTA tile | hover lift + shadow | snap 150ms | `transition-[transform,box-shadow,background-color] duration-150 ease-glide` | **OK** ; transitions `box-shadow` (finding 25 note); no press , **MISSING** press. |
| `DesktopCitySelector.tsx:100, 111` | city button + chevron | in-place state flip | snap 150ms | `transition-colors duration-150 ease-glide` / `transition-transform duration-150 ease-glide` | **OK** |
| `DesktopCitySelector.tsx:117-127` | city dropdown open | reveal | reveal 250-300ms | no transition , appears instantly | **MISSING** |
| `DesktopCitySelector.tsx:139` | option hover | in-place state flip | snap 150ms | `transition-colors` (default 150ms) | **OK** |
| `Footer.tsx:134` | social icon tile hover | in-place state flip | snap 150ms | `transition-colors duration-200 ease-glide` | **WRONG-TIER** |
| `Footer.tsx:151, 173, 238` | footer links + newsletter input | in-place state flip | snap 150ms | `transition-colors duration-150` / bare `transition-colors` | **OK** |
| `Footer.tsx:247` | newsletter submit | press | press 80-100ms | `transition-transform duration-200 ease-glide active:scale-95` | **WRONG-TIER** , press runs at 200ms; 0.95 off the locked scale. |
| `NotificationBell.tsx:42` | bell hide/show with the menu | in-place state flip | snap 150ms | `transition-opacity duration-200` (no ease token) | **WRONG-TIER** |
| `BellIcon.tsx:29-35` | bell hover swing | hover micro-interaction, high-frequency | snap 150ms (rule 5 + finding 4's "<150ms") | `rotate: [0,-15,13,-9,6,-3,0]`, `duration: 0.7`, `ease: "easeOut"` | **WRONG-TIER** , 700ms, more than 2x the absolute ceiling, on a hover the user crosses constantly. Ease is a bare framer string, off-token. |
| `OfflineBanner.tsx:52-60` | connectivity banner | reveal (its own doc says "slides up from the bottom") | reveal 250-300ms | **no transition or animation class at all** , it mounts instantly | **MISSING** , documented motion that was never implemented. |
| `FooterGate.tsx`, `HideInBooking.tsx` | render gates | not interactive | , | none | **OK** |

---

## 3 · Shared CSS + config , `app/globals.css`, `tailwind.config.js`

| file:line | element | its JOB | tier the LAW assigns | what it does TODAY | verdict |
|---|---|---|---|---|---|
| `globals.css:136-144` | **global** `button:active` on hover-capable devices | press | press 80-100ms | `transform: scale(0.97); transition: transform 160ms var(--ease-out-strong)` | **WRONG-TIER** , this is the app-wide press default and it is 160ms. Curve is the legacy `ease-out-strong`, not a §4 token. |
| `globals.css:944-952` | **global** `a/button:active` on `pointer: coarse` | press | press 80-100ms | `opacity .78; transform: scale(.97); transition: opacity 80ms ease-out, transform 80ms ease-out` | **OK** , the only globally-correct press in the system. Note the same job now has two speeds (160ms pointer-fine, 80ms coarse). |
| `globals.css:182-188` | `.text-s-accent` link hover darken | in-place state flip | snap 150ms | `transition: color 150ms ease` | **OK** |
| `globals.css:336-353` | base `input/textarea/select` chrome | in-place state flip on focus | snap 150ms | `transition: border-color 200ms ease, background-color 200ms, box-shadow 200ms` | **WRONG-TIER** , 200ms. Only matters for bare fields: on `TextInput`/`Textarea`/`Select` the Tailwind `duration-150` utility out-specifies this base rule, so the same control has two speeds depending on whether it went through the primitive. |
| `globals.css:160-175` | `#main-content` sheet step-back | full-screen | >300ms permitted | `transform, filter, border-radius 320ms cubic-bezier(0.16,1,0.3,1)`; reduced-motion kills it | **OK** on tier **+RULE-2** (`border-radius`) |
| `globals.css:452-455` | `.animate-in` page/element entrance (16 call sites) | element entrance | reveal 250-300ms | `fadeSlideUp 500ms var(--ease-out-strong)` , opacity + translateY only | **WRONG-TIER +RECIPE** , 500ms, and opacity+y with no scale and no blur is the exact "raggedy" shape the ENTER RECIPE was locked to replace. |
| `globals.css:526-541` | `.salon-card-stagger` list first-load (3 call sites) | Motion sheet 22: "List first-load: stagger rise-in" | reveal 250-300ms per item | `card-stagger-in 350ms var(--ease-out-strong)`, 50ms stagger up to 350ms; reduced-motion handled | **WRONG-TIER** , 350ms per item, just over the ceiling. Stagger schedule itself: **NO RULE**. |
| `globals.css:467-470` | `.animate-heart-pop` (3 call sites) | Motion sheet 22: "Saving/favoriting: pop + 6-particle burst" | , (express) | `heart-pop 350ms var(--ease-out-strong)` | **WRONG-TIER** , 350ms over the ceiling; the law assigns no tier to "express". |
| `globals.css:1183-1192` | `.heart-burst` particles (2 call sites) | express | , | `hb-a..f 0.55s ease-out both` | **WRONG-TIER** , 550ms. |
| `globals.css:1142-1143` | `.animate-count-bump` (1 call site) | Motion sheet 22: "Count/badge changes: spring bump" | in-place state flip -> snap 150ms | `count-bump 0.4s cubic-bezier(0.34,1.56,0.64,1)` | **WRONG-TIER** , 400ms on an in-place badge change. |
| `globals.css:1162-1163` | `.animate-num-flip` (1 call site) | Motion sheet 22: "Live position/number updates: departure-board flip" | in-place state flip -> snap 150ms | `num-flip 0.45s cubic-bezier(0.34,1.56,0.64,1)` | **WRONG-TIER** , 450ms. |
| `globals.css:1180` | `.animate-breathe` (1 call site) | Motion sheet 22: "Empty-state icon: breathe" | , (looping) | `breathe 3.4s ease-in-out infinite` | **WCAG-2.2.2** , see §B. |
| `globals.css:920-931` | `.walkin-ring-pulse` (1 call site) | live status emphasis | , (looping) | `walkinRingPulse 2.1s cubic-bezier(0.16,1,0.3,1) infinite`, animates `box-shadow` | **WCAG-2.2.2 +RULE-2** , an infinite `box-shadow` animation is also finding 25's worst case (multi-pass paint every frame, on a `border-radius` element). |
| `globals.css:982-987` | `.skeleton-shimmer` (4 call sites) | loading feedback | , (looping) | `skeletonShimmer 1.5s ease-in-out infinite` | **WCAG-2.2.2**. Also: the keyframe's own comment at `globals.css:571` says *"(2 cycles, then stops)"* , the utility is `infinite`. The comment is false. |
| `globals.css:823-830` | universal `prefers-reduced-motion` block | reduced-motion fallback | end state, no animation | `animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important` | **OK** , lands on the end state for `forwards`/`both` fills and on the base state for loops, which is the correct static outcome for shimmer/spin/breathe. It does **not** discharge WCAG 2.2.2 (finding 14: the criterion asks for a mechanism for the user, and most users never set the flag). |
| `globals.css:780-783` | `html { transition: background-color 300ms ease, color 300ms ease }` | , | , | dead , dark mode was removed 2026-05-02, nothing changes html bg/color | **NO RULE COVERS THIS** , recorded as dead weight, not a tier problem. |
| `tailwind.config.js:337-343` | the `animation` map | , | , | `count-up`, `slide-in-up`, `fade-in`, `shimmer`, `v4-reveal`, `v4-scale-in` , **only `shimmer` has call sites** | see §C |

---

## A · THE CURVE INVENTORY

Every easing defined in `tailwind.config.js`, `globals.css` and `lib/motion.ts`, what it is
documented for, and what it is actually used for. Counts are `grep` over `app/ components/
components-legacy/ lib/ public/_mockups`.

### A.1 The four §4 tokens (`tailwind.config.js:326-329`)

| token | value | documented for (in-file comment) | ACTUALLY used for | uses |
|---|---|---|---|---|
| `snap` | `cubic-bezier(0.4, 0, 0.2, 1)` | "standard UI transitions (focus, color)" | form primitives' colour/focus flips, Modal enter **and** exit, Sheet exit, Sheet backdrop, close X buttons | **59** |
| `spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | "bouncy reveal (toggle, check)" | as a Tailwind class: 2 sites only (`Checkbox.tsx:88`, one legacy toggle). As a raw literal it is everywhere , SuccessMark disc, count-bump, num-flip, stamp-slam, team-wave, toast-tilt, RatingStars, Toast enter transform | **2** as a token, ~9 as an inlined literal |
| `glide` | `cubic-bezier(0.16, 1, 0.3, 1)` | "long-distance smooth (sheet open)" | the de-facto default for everything: hovers, colour changes, presses, the header, the ENTER RECIPE , **and Toast's exit** | **132** |
| `thud` | `cubic-bezier(0.7, 0, 0.84, 0)` | "press-down feel (button press scale)" | **`Switch.tsx:98` and nothing else in the repo** | **1** |

**Verdict on the research claim: CONFIRMED, from the code, with one correction.**
TASTE_MOTION finding 17 says *"`thud` (0.7, 0, 0.84, 0) is an accelerate [curve]... documented as
'press-down feel' only, when its shape is exactly the exit curve every system specifies. The gap
is naming, not tokens."* The code confirms both halves and sharpens it:

1. **The token is right.** `cubic-bezier(0.7, 0, 0.84, 0)` is a pure ease-in (accelerate), the
   shape Material (`0.4, 0, 1, 1`), Microsoft and Atlassian (`0.6, 0, 0.8, 0.6`) all specify for
   an element leaving. Nothing needs to be added.
2. **It is documented press-only** , the only description of it anywhere in the codebase is the
   inline comment "press-down feel (button press scale)".
3. **The correction: it is not merely under-documented, it is effectively unused.** One call site
   in the entire repository. A token with one consumer is a token that will be deleted by the next
   person doing a cleanup pass.
4. **And every exit is currently on the wrong shape.** Sheet exit -> `snap`. Modal exit -> `snap`.
   Sheet backdrop exit -> `snap`. Toast exit -> `cubic-bezier(0.16, 1, 0.3, 1)`, which is `glide`,
   the *decelerate* curve. An exit on a decelerate curve is the literal inversion of finding 17:
   the element leaves slowly at first and then hurries at the end, so it lingers in the user's way
   at exactly the moment it is supposed to be clearing out.

**The gap named precisely:** MOTION.md has **no by-direction curve-assignment rule at all**. It
locks `glide` for the ENTER RECIPE and `spring`/`glide` for SuccessMark, and stops. Every other
curve choice in the shared layer is a call-site decision, which is why `glide` has 132 uses and is
doing work no decelerate curve should do (presses, exits, colour flips). Writing "entrances
`glide`, in-place `snap`, exits `thud`, earned moments `spring`" costs zero new tokens and would
re-point 4 exits and give `thud` a real job. This is `_plans/MOTION_LAW.md` box **D4**.

### A.2 Legacy / duplicate curves still defined

| where | token | value | uses |
|---|---|---|---|
| `tailwind.config.js:316` | `ease-out-strong` | `cubic-bezier(0.22, 1, 0.36, 1)` | 8 (mostly via the `--ease-out-strong` CSS var) |
| `tailwind.config.js:317` | `ease-in-out-strong` | `cubic-bezier(0.77, 0, 0.175, 1)` | 1 |
| `tailwind.config.js:318` | `ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | 1 |
| `tailwind.config.js:320` | `ease-out-warm` | `cubic-bezier(0.22, 1, 0.36, 1)` , **duplicate of `ease-out-strong`** | **0** |
| `tailwind.config.js:321` | `ease-out-back` | `cubic-bezier(0.34, 1.56, 0.64, 1)` , **duplicate of `spring`** | **0** |
| `tailwind.config.js:322` | `ease-in-subtle` | `cubic-bezier(0.55, 0, 1, 0.45)` | **0** |
| `tailwind.config.js:323` | `spring-bounce` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` , a *third* spring shape | **0** |
| `globals.css:92-95` | `--ease-out-strong`, `--ease-in-out-strong`, `--ease-drawer`, `--ease-bounce` | same four values as CSS vars | drive `.animate-in`, `.salon-card-stagger`, `.animate-heart-pop`, the global `button:active` |
| `lib/motion.ts:5-13` | `EASE_SOLEN` `[0.23, 1, 0.32, 1]`, `EASE_SNAPPY` `[0.4, 0, 0.2, 1]`, `EASE_BOUNCE` (spring object), `EASE_IN_OUT_STRONG` | a **parallel** framer-side easing library predating the ENTER RECIPE; `EASE_SOLEN` is a fifth decelerate shape, distinct from `glide` **and** from `ease-out-strong` | still imported by non-booking surfaces (`motion.ts:6-11` records this) |

**Curve-inventory bottom line:** the system defines **five distinct decelerate shapes**
(`glide` 0.16/1/0.3/1, `ease-out-strong` 0.22/1/0.36/1, `EASE_SOLEN` 0.23/1/0.32/1, plus the
ad-hoc `[0.22,1,0.36,1]` inlined in Header/MobileMenu and the ad-hoc `cubic-bezier(0.4,1.4,0.4,1)`
at `Header.tsx:735`) and **three distinct spring shapes** (`spring`, `ease-out-back`,
`spring-bounce`), against **one** accelerate shape that is used once. That inverts the actual need.

### A.3 Durations declared vs. shipped

`globals.css:96-100` declares a duration ladder: `--dur-instant: 100ms · --dur-fast: 150ms ·
--dur-normal: 200ms · --dur-slow: 300ms · --dur-dramatic: 500ms`. Three observations:

- `--dur-instant` (100ms) and `--dur-fast` (150ms) map cleanly onto the law's press and snap tiers.
- `--dur-normal: 200ms` **is the fourth tier the SPEED LAW forbids**, and it is declared as
  "normal". 17 rows in this audit sit at 200ms. The variable is not the cause (no call site in the
  shared layer references it) but it is the same instinct written down.
- `--dur-dramatic: 500ms` has no job under the law , above 300ms is full-screen only, and no
  full-screen transition in the shared layer uses 500ms.

---

## B · THE LOOPING-ANIMATION INVENTORY , the WCAG 2.2.2 exposure list

**The criterion, verbatim** (TASTE_MOTION finding 14, W3C SC 2.2.2 Pause, Stop, Hide, **Level A**):
*"For any moving, blinking or scrolling information that (1) starts automatically, (2) lasts more
than five seconds, and (3) is presented in parallel with other content, there is a mechanism for
the user to pause, stop, or hide it unless the movement... is part of an activity where it is
essential."*

**None of the seven below has a pause, stop or hide mechanism.** The universal
`prefers-reduced-motion` block at `globals.css:823-830` does **not** discharge the criterion:
finding 14 states it explicitly , the criterion asks for a mechanism *for the user*, and most
users never set that flag. All seven start automatically and all seven render beside other
content. The only variable is condition (2), and for every one of them (2) is satisfied the moment
an endpoint is slow.

| # | animation | defined | renders at | loop spec | can it exceed 5s? | severity |
|---|---|---|---|---|---|---|
| **1** | **`animate-shimmer`** (skeleton) | `tailwind.config.js:340` + `:346-349` | `primitives/Skeleton.tsx:83` · `primitives/SkeletonCard.tsx` (x5 per card) · `primitives/DateTimePicker.tsx:526` · `salon/SalonBundles.tsx:97` · `salon/SalonProducts.tsx:106-109` · `components-legacy/ui/Skeleton.tsx:14` · `components-legacy/discovery/DiscoveryGridSkeleton.tsx:20` · `components-legacy/discovery/ImportProgressBar.tsx:52` | `shimmer 1.5s ease-in-out infinite` | **Yes, routinely.** It runs until the fetch resolves. Any slow API, any cold start, any bad connection turns it into a Level A failure with no code change. `DateTimePicker` waits on live availability, `DiscoveryGridSkeleton` on a remote feed. | **HIGHEST** , the most widely-rendered loop in the product, and `SkeletonCard` multiplies it by grid size (a 6-card grid = 30 concurrent infinite shimmers). |
| **2** | **`.skeleton-shimmer`** (the legacy twin) | `globals.css:982-987`, keyframe `:572-575` | `search/SearchTemplate.tsx:257, 262, 263, 264, 1442` | `skeletonShimmer 1.5s ease-in-out infinite` | **Yes** , same reason, on the search results grid. | **HIGH.** Extra finding: the keyframe's own comment at `globals.css:571` reads *"Category card skeleton shimmer (2 cycles, then stops)"*. The utility is `infinite`. The cap that comment describes was never implemented, or was removed and the comment left behind. |
| **3** | **`animate-spin`** | Tailwind default (`spin 1s linear infinite`) | `primitives/TextInput.tsx:151` (inline "Wird geprüft" spinner) , plus **62 occurrences across 36 files** app-wide | `1s linear infinite` | **Yes** , a spinner exists precisely because something is taking time. | **HIGH.** Also off the Motion sheet 22 vocabulary: "Anything loading: skeleton SHIMMER, content-shaped , spinners only INSIDE buttons". The `TextInput` one is inside an input. Additionally, finding 15 names **spinning** as a specific vestibular trigger class ("Effects that use spiraling or spinning movements"), which the other loops here are not. |
| **4** | **`animate-ping`** | Tailwind default (`ping 1s cubic-bezier(0,0,0.2,1) infinite`) | `homepage/BentoBusiness.tsx:96` · `queue/[token]/page.tsx:398` · `components-legacy/refund/RefundCaseView.tsx:520` | `1s infinite` | **Yes** , the queue tracker case is the worst: it pings for the entire time the user is waiting in a walk-in queue, which is minutes, on a screen whose whole job is to be watched. | **HIGH** for `queue/[token]`. Motion sheet 22 permits it ("Live status dot (REAL state only): ping") , the vocabulary blesses the pattern, it just carries no cap. |
| **5** | **`.walkin-ring-pulse`** | `globals.css:920-931` | `queue/[token]/page.tsx:446` (the active queue step) | `walkinRingPulse 2.1s cubic-bezier(0.16,1,0.3,1) infinite`, animating `box-shadow` | **Yes** , same screen and same duration as #4, and it renders **beside** it. That screen carries two independent infinite loops simultaneously. | **HIGH.** Also `+RULE-2` and finding 25's worst case: an infinite `box-shadow` animation on a `border-radius: 9999px` element repaints multi-pass every frame for minutes. |
| **6** | **`.animate-breathe`** | `globals.css:1179-1180` | `profile/EmptyStateDiscovery.tsx:90` | `breathe 3.4s ease-in-out infinite` | **Yes, always** , an empty state has no endpoint to resolve. It breathes for as long as the screen is open, forever. | **MEDIUM-HIGH.** Condition (2) is unconditionally true here, unlike the skeletons. Motion sheet 22 blesses the pattern ("Empty-state icon: breathe"); finding 8 is the counter-argument (NN/g: *"it's hard to stop attending to it, and, if irrelevant to the task at hand, it can substantially degrade the user experience"*). |
| **7** | **`animate-bounce`** | Tailwind default (`bounce 1s infinite`) | `components-legacy/dashboard/coiffeur/FormulaPhotoUpload.tsx:78` | `1s infinite` | **Yes** , it marks a drop zone and runs the whole time the panel is open. | **MEDIUM** , operator dashboard, one site. |

### Loops that are DEFINED but currently render nowhere (zero exposure today, live landmines)

| animation | defined | loop spec | call sites |
|---|---|---|---|
| `.animate-marquee` | `globals.css:502-515` | `marquee 12s linear infinite` | **0** (the 5 grep hits in `.tsx` are comments only). Finding 15 names *"Horizontal movement in the peripheral field of vision"* as a vestibular trigger. |
| `.testimonial-scroll` | `globals.css:990-999` | `testimonialScroll 40s linear infinite` | **0**. Notably this is the **only** looping animation in the entire codebase that ships a stop mechanism (`:hover { animation-play-state: paused }`) , and hover is not a mechanism on touch. |
| `.animate-coral-pulse` | `globals.css:253-260` | `coral-pulse 2s ... infinite`, animating `box-shadow` | **0** |
| `@keyframes atm-drift-1` / `atm-drift-2` | `globals.css:1118-1130` | `22s` / `28s` `ease-in-out infinite` | **0** , their `body::before`/`body::after` consumers are commented out at `:1079-1116`. |

**The operational fix finding 14 names is a cap, not a discussion:** *"stop the loop, or swap to a
static state, after a bounded number of cycles"*. Note that the codebase already believed it had
one (the false "2 cycles, then stops" comment at `globals.css:571`). This section is
`_plans/MOTION_LAW.md` box **D2**.

---

## C · Defined vs. used , the animate-* utility audit

Counted by grepping every animation utility / class / keyframe defined in `globals.css` and
`tailwind.config.js` against `app/ components/ components-legacy/ lib/`. **36 of them have zero
call sites**, against 23 that are alive. A motion system where more than half the vocabulary is
dead is why call sites hand-roll numbers instead of reaching for it.

**Alive** (call-site counts): `.celebrate-rise` 11 · `.animate-in` 16 · `.salon-card-stagger` 3 ·
`.animate-heart-pop` 3 · `.heart-burst` 2 · `.slot-cascade` 2 · `.sheet-scale-back` 3 ·
`animate-shimmer` 7 files · `.skeleton-shimmer` 4 · `.success-ring`/`.success-disc`/`.success-check`
1 (SuccessMark) · `.animate-count-bump` 1 · `.animate-num-flip` 1 · `.animate-breathe` 1 ·
`.walkin-ring-pulse` 1 · `.confetti` 1 · `.animate-photo-upload` 1 · `.animate-price-appear` 1 ·
`.gpu` 1 · `.scroll-fade-right` 1 · `.card-listing` 1 · `inspo-panel-in` 1 · `inspo-pillpop` 1.

**Dead (0 call sites):**

- **Motion sheet 22 rows that were never wired , three of the fourteen locked micro-moments:**
  `.animate-toast-tilt` (the locked toast enter, and `Toast.tsx` hand-rolls a different entrance
  instead), `.animate-value-roll` (the locked money-change roll), `.animate-stamp-slam` +
  `.stamp-slam-ring` (the locked earned-stamp moment , note the table row itself says "DO NOT fake
  on load... wire only behind a real 'just earned' signal", so zero uses means the signal was never
  wired, not that the rule was broken). Two further dead utilities are **correctly** dead:
  `.team-wave` (killed 2026-07-19, in REMOVED.md) and `.stamp-new` (pre-sheet-22).
- **V4/V5 era:** `.stagger-v4`, `.reveal-stagger`, `.card-v4`, `.reveal-on-scroll`,
  `.heading-reveal`, `.page-enter`, `.solen-press-effect`, `.animate-count-v4`, `.img-hover-zoom`,
  `.animate-fade-in-up`, `.heart-bounce`, `.card-tap`, `.pressable`.
- **Tailwind `animation` map:** `animate-count-up`, `animate-slide-in-up`, `animate-fade-in`,
  `animate-v4-reveal`, `animate-v4-scale-in` , 5 of the 6 entries; only `shimmer` is used.
- **`@starting-style` block:** `.css-enter-fade`, `.css-enter-scale` (`globals.css:798-820`).
- **Orphan keyframes:** `dotPop`, `discover-drop`, `v4RevealScale`, `v4SlideInLeft`,
  `atm-drift-1`, `atm-drift-2`, `fadeIn`.

---

## D · Where NO RULE COVERS THIS

Recorded so nobody fills these in from memory. Every one of them is a real decision the shared
layer makes many times a day with no authority behind it.

1. **Exit durations and exit curves.** The SPEED LAW assigns tiers by JOB and gives exits no row.
   TASTE_MOTION finding 17 recommends `thud` for exits and notes Material ships exits shorter than
   enters (195 vs 225ms), but MOTION.md has not adopted either. Today the shared layer's four
   exits run at 150 / 200 / 200 / 150ms on `snap` and `glide`. This is box **D4**.
2. **Curve assignment by job.** Nothing says which of the four §4 tokens an entrance, an in-place
   flip, or a press should use. Result: `glide` on 132 sites doing all three jobs.
3. **Stagger intervals.** `STAGGER_STEP` 50ms, `.salon-card-stagger` 50ms, `.slot-cascade` 50ms,
   `.stagger-v4` 40ms, `.reveal-stagger` 50ms, `.team-wave` 120ms, `RatingStars` 70ms. No
   authority sets any of these.
4. **A tier for "express".** TASTE_MOTION finding 9 names Material's three roles (inform / focus /
   express) and MOTION.md has a celebration vocabulary, but the three-tier ladder is press / snap /
   reveal , there is no row for a celebration. That is why SuccessMark (0.75s) and RatingStars
   (0.45s) can only be graded against the blanket ">300ms is full-screen only" ceiling, which is
   almost certainly not what that clause was written to catch.
5. **Springs.** `spring` is a §4 token and framer springs are used (`RatingStars` `whileTap`,
   `lib/motion.ts` `EASE_BOUNCE`), but a spring has no duration (finding 18), so a spring-driven
   motion cannot be graded against the ladder at all. The law is duration-shaped; part of the
   system is not.

---

## Feeds

This file is one of the three audits behind `_plans/MOTION_LAW.md` box **D1**. Section B is box
**D2** (Level A, leads the ranked list). The 420ms row in §1 is box **D3**. Section A is box
**D4**. Boxes are left unticked here on purpose , this audit is read-only and edits no file but
this one.
