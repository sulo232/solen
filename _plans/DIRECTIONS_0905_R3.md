# Directions round 3 (owner 2026-09-06, dictated after reading the round-2 index)

Parent: [DIRECTIONS_0905_R2.md](DIRECTIONS_0905_R2.md) (round 2, closed for review 2026-09-06 17:17). Round 1: [DIRECTIONS_0905.md](DIRECTIONS_0905.md).

## His words, decoded (dictated, speech-to-text)

1. The round-2 index opens with a block he cannot read: "the first one, the three left, I don't understand what the fuck that is" = the "three look systems" section and its three kit-preview links (pills and buttons in isolation, the micro-mockup format he graveyarded on 2026-09-05).
2. Confirmation: "it looks ass ... not even talking about the structure. It's about the design itself. How does Airbnb do it ... ours looks like a draft, not premium at all. Why?" Loose lean: "probably the rule".
3. Search results: RULE ("I like the filter pills in the rule"); TRAY out ("what is this grey bar"); the heading "Hair salons in Basel sorted by most reviewed" out ("too much text, unnecessary"); the review count beside the rating out on every card ("why do we have a count of how many people reviewed it, that's cheap, remove that literally").
4. Bookings list: "none of them"; LIFT has "a lot of spacing, some hierarchy" but "the next one is too big" and "it's not really visible when the next time is, there is no reminder or anything".
5. Review and pay: "I like the lift. Lift is good."
6. Profile hub: "probably the rule", and the real ask: "there's a lot of inconsistency. We have to define how we're gonna do it: the pill-shaped thingy, the box one, or let it be. If the design system changes per screen it's gonna be ass."
7. Empty states: "ass, none of them."
8. Home: "none of them. Keep how it is right now."
9. Salon page: box 3 of round 2 (match the row Book to the bar Book) was a MISREAD. His words: "the filter, like services, they're all on other colors when you select that one. That pill is completely different from what it is after when you click." The service-category pill on the salon page and the category pill on the screen after Book (the booking services step) are two different pills, and they must be one.
10. Whole round: one system, defined once, holding on every screen; premium, not draft.

## Boxes

- [ ] 1. Diagnosis, measured, of why the built look reads as a draft next to Airbnb: per rejected screen (confirmation RULE and LIFT, search RULE, bookings LIFT, profile RULE, empty states LIFT and RULE, the salon and booking category pills), the taste walk (squint, size and weight counts, hairline and icon counts, spacing ladder, colour provenance, contrast) against the Airbnb measured rows and the Fresha placement, root causes named with numbers, one arbiter across the set
  - [ ] 1a. per-screen diagnosis files in scratchpad r3/diagnosis/<slug>.md
  - [ ] 1b. the arbiter's root causes (3 to 5, each with the number that proves it and the fix it implies) in scratchpad r3/diagnosis/ROOT_CAUSES.md
  - [ ] 1c. Airbnb's filter-chip selected state and Airbnb's trip-card timing pill captured live or from Mobbin, numbers, not memory
- [ ] 2. One system, defined once: pill, box or bare, with every value (fill, border, radius, text, selected state, card treatment, hairline rule), written in `_plans/R3_ONE_SYSTEM.md` and applied identically to every round-3 screen; the three round-3 directions are three candidate single systems, never a system per screen
- [ ] 3. Confirmation, round 3: three directions, one per candidate system, Fresha placement kept, the root causes from box 1 fixed in each
- [ ] 4. Search results, round 3: RULE placement as the base under each candidate system
  - [ ] 4a. the "category in city sorted by X" heading line removed
  - [ ] 4b. the review count beside the rating removed from every result card in the mockups (the live `SalonResultCard` keeps it until he has seen the card without it)
  - [ ] 4c. the RULE filter pills kept
  - [ ] 4d. no grey band anywhere
- [ ] 5. Bookings list, round 3: LIFT spacing and hierarchy kept
  - [ ] 5a. the next-appointment unit measurably smaller than round 2's 440px
  - [ ] 5b. when it is visible at a glance: Airbnb's own trip-card anatomy (a timing pill on the photo, "In 11 days", plus a date and time subline)
  - [ ] 5c. a reminder line (when the reminder goes out) on the next appointment
- [ ] 6. Review and pay: LIFT carried into round 3 unchanged apart from the shared system's values; verified that the one system did not move its anatomy
- [ ] 7. Profile hub, round 3: RULE placement under each candidate system
- [ ] 8. Empty states, round 3: rebuilt from the Airbnb and Fresha empty-state captures, three directions that differ in structure
- [ ] 9. Home: out of the round, the live home stays; graveyard line for directions A, B, C
- [ ] 10. Salon category pill = booking-step category pill: a mockup showing BOTH screens (salon services section, booking services step) with one pill, three directions (the calm grey fill of the lock, the ink fill of his 2026-07-19 override, Airbnb's measured selected chip), recommendation first
- [ ] 11. Round-3 index: recommendation first, no kit previews, no systems block; per screen the stacked variants with one plain line of difference each; every link cold-checked through the production tunnel
- [ ] 12. Graveyard lines the same turn: TRAY, home A/B/C, the three empty-state directions, the search heading line, review counts on cards, the kit-preview index block, the salon-book-button harness (misread)
- [ ] 13. TASTE_LOG entry 2026-09-06 with his verbatim picks and rejections
- [ ] 14. Harden (option 2, measure instead of scold): a look-diff script that renders a route and prints our computed values beside the Airbnb measured rows, used by the round-3 critics; lands this turn
- [ ] 15. Closing report: readback first, the index link, the root causes in the reply itself, his decisions each with Fresha, Treatwell and Airbnb looked up and the verdict word

## Harden

Pick: option 2. Round 2's critics graded compliance with the kit and the floors, and the kit obeyed every rule; nothing compared a rendered screen to the Airbnb numbers the look was supposed to come from, so "obeys the tokens, reads as a draft" could not be caught before he saw it. The artifact is a measuring script, not a check: given a route it prints, per element class, our computed values next to the Airbnb rows, and the critic reads the gaps. Not a Stop gate (it would only ever produce a second message).

## Log
- 18:15 (2026-09-06): readback written, 15 boxes atomized, ACTIVE row 116 added, TASTE_LOG entry appended, seven graveyard lines fed. Diagnosis fan-out next.
