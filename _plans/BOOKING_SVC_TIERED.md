<!-- batch: booking services step -> salon-page tier-card display + motion (owner 2026-07-18) -->
# Booking services , salon-page tier-card display + motion

Mockup: `public/_mockups/liftup-booking-services-tiered/index.html`
(APPROVED look; refined: chevron inline by name, price under desc on expand, + centered).

## Owner asks this turn (2026-07-18, motion + gate)
- [x] CORRECTION , Motion on the plus->check toggle in the mockup (opacity+scale+blur crossfade, glide, per ToggleCircle ENTER_RECIPE) + a small circle pop on select
- [x] Motion , the price total ROLLS up (value-roll) when it changes / when 2+ services
- [x] Motion , the minutes bump (count-bump) when the duration changes
- [x] Harden the gate , mockup preflight now blocks a mockup that has a select-toggle OR a live-updating total/count with NO keyframe/animation motion (tested block + pass)

## Carry into the HELD code build (not this turn)
- [ ] Real bottom-bar MINUTES gets `animate-count-bump` on change (price already has `animate-value-roll` at ServicesStaffStep.tsx:553; the pill count has `animate-count-bump` at :540; ToggleCircle already ENTER_RECIPE). So the only real-code motion gap is the bottom-bar duration.
- [ ] Full layered-loop build of the tier display (grouping + filter pills + tap-expand + +-select + ServiceDetailSheet reconciliation + de/en/fr/it) , HELD until the owner confirms the layout is final.

## Notes
- Real component already carries the motion vocab (motion-22): value-roll, count-bump, ToggleCircle crossfade. The MOCKUP lacked it, and `motion-recipe-gate.py` only scans .tsx/.jsx framer props, so the static HTML slipped through. Gate hardened for mockups.
