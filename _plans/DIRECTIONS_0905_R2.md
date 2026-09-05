# Directions, round 2 (owner 2026-09-05 22:08, dictated, after reading the round-1 index)

Round 1: `DIRECTIONS_0905.md` (30 directions, index at /en/dev/directions-0905). He read it and picked per screen. His verdict on the execution, verbatim: *"all of them, like, still as. You know? The direction is good, but, like, the... itself, it looks as."* So round 2 keeps his structural picks and varies the LOOK, under one system.

## His words, verbatim (dictated)

> booking vonfirmation i like direction c but we have to improve on design   click n press a  salon page  keep current but we can match the servies button w the aftr book button yk search resault  A n home keep current  none make new ones What I like about the direction a, like, about the get directions and manage thing. Yeah. I like that button. But I think for everyone, every each one is kinda assy. Like, maybe, like, for the newest neighbor can utilize the direction season next up here, but it's kinda too big on how you did it, but that's a good sign already. Maybe we can have that more a bit compact. And... yeah. And I like the confirmed badge thingy. Like, make it so we actually use the badge, like, design system that we already have on other places. Okay. And on the reviewing pay stub, I like the a, but we have the improvement design, like, a lot. And on the profile hub? We can probably... yeah. I like the I like the thing that you did on see, like, the what's next thingy, but we have to, like, improve the design on there too. Like, you know? Like, this just mug up, like, all of those is just mug up because all of them, like, still as. You know? The direction is good, but, like, the... itself, it looks as. And, yeah, I believe we can, like, mix up a and b maybe a little bit. Because on the b, I love how, like, it's a little more, like, separated. But also, like, a, how it's, like, you know, simple. On the empty states, I believe we can, like, make it... yeah. But if there's, like, for an empty state, if, like, I like how you made the c, but it's still not correct. You know? I mean, probably the b, probably a lot of the b, but Not this pink thing because that's not how... I don't how we do it. But I believe it's gonna be... there's gonna be, like, a lot of design difference. Right? because, yeah, we have to, like, actually concise because there should... there's gonna be now multiple pill shades, pill contrast or, like, typography, all of those. So so maybe we, like, look into that and actually fix up. Like, I told you, like, search out what we're missing, right, on the back end. I'm like, no. On the front end. like, you know, like, maybe we're missing principals. Maybe we're seeing a fire. Maybe we're missing missing design files, those stuff. That's what

## Decoded asks, one box each (readback sent 22:08; a wrong decode costs him one word)

- [ ] 1. Confirmation: direction C kept (what happens next leads), design improved
  - [ ] 1a. C's structure fixed as the base
  - [ ] 1b. three LOOK directions built on it (one per look system, see 10a)
- [ ] 2. Click and press kit: direction A is the press recipe for round 2
  - [ ] 2a. every round-2 mockup uses A's press motion (scale to 1 with no overshoot, 300ms swaps), B's spring is out
- [ ] 3. Salon page: keep the live page; match the Services button with the Book button (read "aftr book" as the book button)
  - [ ] 3a. identify the two buttons he means on the live page at 390 (service-row Buchen vs the main Book CTA vs the section-nav Services tab), measured
  - [ ] 3b. section mockup of the match, the one element at real size, variants stacked (no whole-page mockup for a one-element decision, owner 2026-08-15)
- [ ] 4. Search results: direction A
  - [ ] 4a. A's look improved under the shared look system (three looks)
  - [ ] 4b. the density-floor conflict he overruled (A fits one card in the fold) gets one line in the report, not a re-argument
- [ ] 5. Home: keep the live page; none of the three; three NEW structural directions
  - [ ] 5a. Fresha and Airbnb home captured again live for placement and look before building
  - [ ] 5b. three directions that differ in structure, none of them round 1's A, B or C
- [ ] 6. Bookings list: direction A's Get directions and Manage buttons kept
  - [ ] 6a. only on the next appointment, not on every booking
  - [ ] 6b. more compact than round 1's
  - [ ] 6c. the Confirmed badge is the badge component the design system already uses elsewhere (find it: StatusPill was deleted 2026-06-30, StatusInline survives; what the live bookings list actually renders is measured first)
  - [ ] 6d. three look directions with 6a to 6c fixed
- [ ] 7. Review and pay: direction A's structure, design improved a lot (three looks)
- [ ] 8. Profile hub: C's what's-next block, mixed with B's separation and A's simplicity, design improved (three looks)
- [ ] 9. Empty states: mostly B, without the pink pills; C's real-content idea folded in where it does not contradict the state (three looks)
- [ ] 10. Every pick looks ass in execution: round 2 varies the LOOK on a fixed structure
  - [ ] 10a. three LOOK SYSTEMS, each applied across all eight picked screens (3 systems x 8 screens), so he picks a system once, not a look per screen
  - [ ] 10b. each system captured from a real source (Airbnb live for the look, Fresha live for placement, his 2026-09-05 rule), not invented
  - [ ] 10c. a critic per screen grades compliance and sameness across the eight screens of one system; one arbiter across the three systems
- [ ] 11. Consistency: one system for pill shades, pill contrast and typography across the picks
  - [ ] 11a. measure round 1's picks first: every pill fill and text colour, every font size and weight, every button radius, per screen, in one table
  - [ ] 11b. the one system written down, extending an existing file (LOCKFILE or PRINCIPLES), not a new law file
  - [ ] 11c. every round-2 mockup measured against it before it ships (page-level type budget and colour provenance)
- [ ] 12. CORRECTION: front-end research, what principles and design files are missing. Asked 2026-09-04 ("mainly design, what principle is actually missing"), answered in `_design-system/research/WHAT_IS_MISSING_2026-09-04.md` (no floor missing; three formulas missing: one type ramp, a cross-screen sameness check, a skeleton time floor). He asked again today, so that answer either never reached him or does not explain why 30 rule-following mockups still look ass. Re-run with round 1 as the evidence.
  - [ ] 12a. web research first: how Airbnb, Fresha and Treatwell define the look-level pieces we lack (pill, badge, button, type ladder, spacing rhythm), captured live, not recalled
  - [ ] 12b. the gap list, each gap named with the number that proves it and the file it belongs in
  - [ ] 12c. the missing files written, or the existing ones extended, this round
  - [ ] 12d. the answer stated in the closing report itself, not only in a file (why the 09-04 answer did not land)
- [ ] 13. Decisions that are his, each with what Fresha, Treatwell and Airbnb do (looked up) and the TASTE_AUTHORITY verdict; DECIDEs done, not listed
- [ ] 14. Round-2 index page, links through both tunnels, verified on a cold load

## Harden (he flagged a repeat: "I told you, search out what we're missing")

Pick: option 4, not mechanically decidable. The 09-04 research was delivered to a file and its answer was not in the closing report he read; whether he opened the file cannot be checked. What is done instead: box 12d puts the answer in the reply, and the ACTIVE row for workstream 113 now links the research file by name.

## Log
- 22:08: readback sent, plan written, servers on 3461 and 3480 and both tunnels answer 200.
