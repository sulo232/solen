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

## Carry into the HELD code build (not this turn)
- [ ] Real bottom-bar MINUTES gets `animate-count-bump` on change (price already has `animate-value-roll` at ServicesStaffStep.tsx:553; the pill count has `animate-count-bump` at :540; ToggleCircle already ENTER_RECIPE). So the only real-code motion gap is the bottom-bar duration.
- [ ] Full layered-loop build of the tier display (grouping + filter pills + tap-expand + +-select + ServiceDetailSheet reconciliation + de/en/fr/it) , HELD until the owner confirms the layout is final.

## Notes
- Real component already carries the motion vocab (motion-22): value-roll, count-bump, ToggleCircle crossfade. The MOCKUP lacked it, and `motion-recipe-gate.py` only scans .tsx/.jsx framer props, so the static HTML slipped through. Gate hardened for mockups.
