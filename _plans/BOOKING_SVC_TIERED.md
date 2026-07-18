<!-- batch: booking services step -> salon-page tier-card display + motion (owner 2026-07-18) -->
# Booking services , salon-page tier-card display + motion

Mockup: `public/_mockups/liftup-booking-services-tiered/index.html`
(APPROVED look; refined: chevron inline by name, price under desc on expand, + centered).

## Owner asks this turn (2026-07-18, motion + gate)
- [x] CORRECTION , Motion on the plus->check toggle in the mockup (opacity+scale+blur crossfade, glide, per ToggleCircle ENTER_RECIPE) + a small circle pop on select
- [x] Motion , the price total ROLLS up (value-roll) when it changes / when 2+ services
- [x] Motion , the minutes bump (count-bump) when the duration changes
- [x] Harden the gate , mockup preflight now blocks a mockup that has a select-toggle OR a live-updating total/count with NO keyframe/animation motion (tested block + pass)

## Owner correction 2026-07-18 (motion recipe + Continue arrow)
- [x] CORRECTION , keep the plus->check toggle crossfade (owner likes it)
- [x] CORRECTION , price total: remove the slide-up value-roll ("jumping"); use the locked opacity+scale+blur ENTER_RECIPE instead
- [x] CORRECTION , minutes: remove the scale count-bump ("giant mini"); use the same opacity+scale+blur ENTER_RECIPE
- [x] CORRECTION , harden the mockup-motion gate: require the BLUR recipe (non-zero blur in the motion), not just "has @keyframes", so a slide/roll/bump without blur is blocked (tested block + pass)
- [x] Continue button arrow: default = chevron/arrowhead only (no shaft); on hover/press the shaft draws in to a full arrow

> SUPERSEDE NOTE: value-roll + count-bump are the shipped motion-22 vocab (globals.css). The owner is
> replacing them, for value changes, with the locked opacity+scale+blur ENTER_RECIPE (the one the toggle
> uses). For the REAL app this means the bottom-bar price + minutes should use the enter recipe, not
> value-roll/count-bump , folded into the held build note below.

## Motion feel (owner 2026-07-18: "it looks soo ass i want more of the morphing")
- [x] The plain blur fade landed flat. Built a MOTION LAB (`liftup-services-motion/`) with 4 replayable value-change motions to pick from instead of guessing again: Blur fade / Count up / Zoom morph / Count + pop (recommended). All 4 verified live. AWAITING the owner's pick, then apply the chosen one to the tiered mockup + the real bottom bar.

## Implement the counter (owner 2026-07-18: "implement the counter ... implement it already ... let me see the end result")
- [x] Build a CountUpNumber client component: animates the number from the PREVIOUS value to the new one over a CONSTANT ~480ms (ease-out), NOT scaled by the delta, so 0->200 takes the same time as 65->93 (the owner's fear: a big price should not take long to climb). Renders ONLY the number; reduced-motion jumps. Also takes an optional `format` prop so the Swiss thousands separator survives the count (verified live: "CHF 1'210" at de-CH, "1 210 CHF" at fr-CH).
- [x] Wire into ServicesStaffStep.tsx bottom bar: total = "CHF " static + CountUpNumber(totalPrice) (remove animate-value-roll); minutes = CountUpNumber(totalDuration) + " min" static. No pop/bump. Meta line carries `tabular-nums` so the digit width doesn't jitter while it counts.
- [x] Verify live on the real booking route + show the owner the end result (clickable tunnel link).

## Polish round (owner 2026-07-18, live on the real page)
- [x] Details expand is too SLOW , ServicesStaffStep.tsx ~line 424 uses `duration: ENTER_DURATION` (~0.42s); drop to ~0.18s (keep GLIDE_EASE).
- [x] Background not WHITE , the booking body is `min-h-screen bg-s-bg-sunken` (booking/page.tsx:234) + the sticky filter strip is `bg-s-bg-sunken` (ServicesStaffStep ~467). Make both WHITE (strip keeps a bottom hairline + blur for the sticky separation). NOTE: overrides the "sunken body" lock (mockup 20 / project_booking_flow_canonical); owner's live ask + the approved white mockup win. Affects ALL booking steps.
- [x] "N ausgewählt" pill not design-system-like , ServicesStaffStep ~535 is `bg-s-ink text-white` + a heavy `shadow-[0_8px_24px_-8px_rgba(10,10,10,.45)]` (banned black fill + heavy shadow). Make it DS-compliant: white + `border-s-border` + `text-s-ink` + soft `shadow-elevation-2` (keep the count-bump + ArrowUp).
- [x] The little black dot flying to the bottom-left on click , owner dislikes it. Remove flyToCart (ServicesStaffStep ~177 + its 2 calls) + the `.cart-fly-dot` CSS (globals.css ~1195).

## Polish round 2 (owner 2026-07-19)
- [ ] The + -> check MORPH on click isn't satisfying + doesn't match the mockup. Real ToggleCircle.tsx uses the ENTER_RECIPE crossfade (scale 0.96, no pop); the approved liftup-booking-services-tiered mockup had a POP (circle scale 1->1.18->1, cubic-bezier(0.34,1.56,0.64,1)) + a more pronounced check-in (scale ~0.6 + blur). Add the pop-on-select + the sharper crossfade to match the mockup. (ToggleCircle is shared , the pop is a nice select feedback everywhere.)
- [ ] The "ausgewählt" pill is ALWAYS there (fires at 120px scroll). Owner wants it only when you've selected AND scrolled down so far you can't see your selection anymore (long lists), NOT always/eagerly, and NOT on short lists where the selection stays visible. Change from hasScrolled@120px to: show only when hasSelectedServices AND no selected service row is visible in the viewport (scrolled past all selections).
- [ ] (BIG, NEEDS SCOPE, owner 2026-07-19) Roll out the dropdown/tap-to-expand pattern to more surfaces: the DASHBOARD, the SALON page, and BACKEND SETTINGS. Vague + multi-surface = needs per-surface investigation + mockups + owner confirm (mockup-first). PARKED pending scope: which sections exactly, and a mockup per surface. Do NOT build blind.

## Carry into the HELD code build (not this turn)
- [ ] Real bottom-bar MINUTES gets `animate-count-bump` on change (price already has `animate-value-roll` at ServicesStaffStep.tsx:553; the pill count has `animate-count-bump` at :540; ToggleCircle already ENTER_RECIPE). So the only real-code motion gap is the bottom-bar duration.
- [ ] Full layered-loop build of the tier display (grouping + filter pills + tap-expand + +-select + ServiceDetailSheet reconciliation + de/en/fr/it) , HELD until the owner confirms the layout is final.

## Notes
- Real component already carries the motion vocab (motion-22): value-roll, count-bump, ToggleCircle crossfade. The MOCKUP lacked it, and `motion-recipe-gate.py` only scans .tsx/.jsx framer props, so the static HTML slipped through. Gate hardened for mockups.
