# Booking flow polish + motion standard (owner walked the harness, 2026-07-09)

Owner walked `/de/dev/flows` -> Booking on their phone and gave live feedback. This is the fix + motion-standard batch.

## Atomic asks

### Motion standard (the headline)
- [ ] M1 [standard] Define ONE enter-animation recipe, reusable hook/variants: every animation = **blur + scale + opacity** together, on the locked "butter" glide ease, plus a smooth button transition. Grounded: booking currently animates opacity ONLY (`components-legacy/booking/*` initial opacity:0->1), which is why it reads "raggedy". Locked ease = `glide cubic-bezier(0.16,1,0.3,1)`; MOTION.md lesson: subtle = imperceptible = reverted, so make it PERCEPTIBLE.
- [x] M2 [mockup] DONE + committed (`8cece944e`): `/de/dev/motion-recipe`, before (opacity-only) vs after (blur+scale+opacity on glide) at 3 intensities (Subtle/Recommended/Strong), replayable. Verified 200 through the tunnel (306KB, real, Replay + intensity + blur). BLOCKED on owner picking an intensity before it is codified.

### Booking flow fixes (from walking it)
- [ ] B1 [motion] Service-row expand ("plus button goes down") feels bad -> new blur+scale+opacity recipe. (previewed by M2)
- [ ] B2 [motion] The "choose/select" indicator just pops up with no animation -> animate. (previewed by M2)
- [ ] B3 [motion/design] Arrows: animate the arrow itself, OR remove arrows. Owner leans REMOVE. Decide in the mockup.
- [ ] B4 [design] The selected indicator still pops up even when the item is already visible/selected on screen -> declutter, do not re-announce an already-visible selection.
- [ ] B5 [design] Focus ring appears on the stylist step (and Zeit). Contract: NO focus ring on a selected control. Remove.
- [ ] B6 [design/psych law 2] Staff pick button text never changes (always "Wählen/Choose"); make the label reflect state, AND pre-select "Egal/Anyone" as the default staff (defaults-as-recommendation).
- [ ] B7 [design] Separate the standalone stylist PROFILE page from the in-booking stylist picker: inside booking you must NOT be able to wander into the stylist's other services/profile. Scope the in-booking picker to selection only.
- [ ] B8 [data/bug] No dates available in the picker for the test salon. Root-cause first (curl the availability endpoint for muse-beauty-studio; check `opening_hours` SHORT-day-key convention mon..sun per LESSONS_LEARNED; check staff schedules) then fix so real availability shows. NOT a UI-only fix.
- [x] B11 [design] REVERSED 2026-07-09: owner said "no, YOU give me ideas, mockups for multiple directions." DELIVERED + committed (`8cece944e`): `/de/dev/stylist-directions`, 3 distinct directions (A photo grid / B rich tap-rows / C swipe carousel), each fixing every StaffStep complaint (gray-sunken selected not ink/ring, Egal pre-selected, rating+count, selection-only, sentence-case). Contract-clean on disk. Render 502'd once then dev server reaped before re-verify. BLOCKED on owner picking a direction. Recommendation: B (rich tap-rows).

## Sequencing
1. THIS TURN: M2 before/after motion mockup (approval-gated, mockup-first). Covers the motion complaints B1/B2/B3 as a preview.
2. On motion approval: codify M1 (shared enter hook + button transition) + apply to the booking flow.
3. B5/B8 are clear bugs (focus ring, availability) -> layered loop next, independent of motion approval.
4. B4/B6/B7 -> apply with the motion pass (design + state).
5. B11 -> waits on the owner's example.

## Deviation flagged (variations hook)
The variations hook wants 3+ distinct directions. The owner's motion ask is a SPECIFIC recipe (blur+scale+opacity+butter), not a "pick a direction" ask, so M2 shows the ONE recipe at 3 INTENSITIES (subtle/recommended/strong) instead of 3 different recipes, because intensity is the real variable for motion feel (owner's imperceptible-fade history). The genuine "give me options" ask is B11 (stylist page), which is blocked on the owner's example.

## Status
- 2026-07-09: readback + plan. Grounded #8 (picker takes async slots) and #9 (opacity-only current motion; glide is the butter ease). Building M2.
