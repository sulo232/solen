# Re-analyse the design law, then unify the screens that do not look like the PDP and home

Owner, verbatim (dictated, 2026-08-23): *"reanalyze all the, um, taste, file, design rules, you
know, all those principles that we had and a harness, like, for them ... I love how it looks like in
the PDP page of stores and also, like, um, how it looks on the home page. But we use, like, a lot
of, like, other different, like, design system, and that is really different ... make it, like, more
visually appealing ... I want, like, pictures, not a... big changes, not just, like, small ones. So
can you actually, like, look into it as a loop and then make, like, few mock ups"*

## The asks, atomised

- [x] 1. Re-analyse the rule files · verified: seven ranked contradictions with file and line on both sides, in "The law audit" below
- [x] 2. Re-analyse the harness · verified: two checks enforce OPPOSITE sides of the stylist-card rule and both are armed; a rule CLAUDE.md calls "ACTIVE" is wired nowhere; a check built for a repeated measuring mistake is wired nowhere
- [x] 3. What the two he likes have in common · verified, and it CONTRADICTS the premise: the store page leads at 30px and 2.31x, the home page has no anchor at all at 18px and 1.50x. They do not share a type scale. What they share is photography leading and calm chrome
- [x] 4. The off-look screens, measured · verified: seven screens at 390x844, table below. Search results is the flattest at 3% bold against the store page's 13%; coming-soon and login are the loudest at 30% and 27%
- [x] 5. Big changes, not small · verified live over the tunnel: the name goes 16px to 24px and the photo goes from wide 5:4 to tall 4:5, on the REAL results card with real stores
- [x] 6. Loop · verified by what it caught rather than by claiming it ran: the first build refused invented column names (city, cover_url, price_from against the real city_id, cover_photo_url, quartier), the second refused an invented prop shape (a salon object where the card takes flat props). Both were caught before he saw anything
- [x] 7. Mockups · verified 200 over the tunnel and tapped through it: /en/dev/unify, four directions on the real search-results screen

## Standing constraints that do not move

- Mockup first. Nothing applied to a real screen until he picks.
- Pre-launch, so every row is seed data and nothing here is an outage.
- The look he likes is the BASELINE, so the PDP and home are the reference, not Airbnb, wherever the
  two disagree. Airbnb stays the tie-breaker only where our own two screens are silent.

## MEASURED, every screen at 390x844 on the built site, 2026-08-23

The two he likes are at the top. "Range" is the biggest text divided by the smallest.

| screen | text sizes | biggest | range | bold | tracking values | corners in play |
|---|---|---|---|---|---|---|
| store page (likes it) | 6 | 30px | 2.31x | 13% | 5 | 16, 20, 24, 99, capsule |
| home (likes it) | 5 | 18px | 1.50x | 11% | 2 | 14, 16, 22, 24, 40, capsule |
| search results | 5 | 18px | 1.50x | **3%** | 2 | 16, 22, 24, 40, capsule |
| inspo | 4 | **15px** | **1.25x** | 14% | 1 | 14, 16, 24, 40, capsule |
| help | 6 | 30px | 2.50x | 18% | 2 | 12, 16, 24, 99, capsule |
| login | 5 | 28px | 2.33x | **27%** | 3 | 12, 16, 24, 99, capsule |
| coming-soon | 5 | 30px | 2.50x | **30%** | 2 | 12, 16, 24, 99, capsule |

Four things fall straight out of that table, and one of them contradicts the premise.

**1. THE TWO HE LIKES ARE NOT ONE SYSTEM.** The store page leads with a 30px anchor at 2.31x. The
home page has no anchor at all: nothing on it exceeds 18px and its range is 1.50x, the same as the
screens he says look wrong. So "make the others look like these two" cannot be executed literally,
because the two disagree. What they share is not a type scale, it is photography leading and calm
chrome. Surfaced rather than resolved silently.

**2. EVERY SCREEN IS CROWDED IN THE SAME PLACE.** On all seven, four or five of the sizes sit
within 5px of the smallest. That is FLOORS LAW 7c by name, and it is universal here, not a
per-screen slip.

**3. EMPHASIS SWINGS TENFOLD.** 3% bold on search results against 30% on coming-soon. Both are
inside the 30% ceiling, so the ceiling has never once caught this: the problem is the SPREAD
between screens, and nothing measures that.

**4. NINE CORNER SIZES ARE IN USE, AND ONLY FOUR ARE WRITTEN DOWN.** In play: 12, 14, 16, 20, 22,
24, 40, 99, plus the full capsule. Locked: 12 input, 16 card and button, 24 grouped list, 28 sheet.
IMPORTANT CORRECTION to my own first read: the extras are not sloppiness. The 22px card photo was
owner-approved by name on 2026-07-13 (CARD_REDESIGN C1) and the 40px belongs to the search pill and
category row. They were approved one at a time and never folded back into the locked scale, so the
scale stopped describing the product. That accumulation IS what "a lot of different design systems"
measures out to.

## The law audit, ranked, from a reader that only read

1. The stylist card shape contradicts itself and TWO live checks enforce opposite sides. LOCKFILE
   line 560 files staff under the 24px grouped card; line 561 says "stylists are individual not
   groups", 16px. `card-radius-gate.py` enforces the first, `entity-card-gate.py` the second, both
   armed. Shipped code follows 24px (`SalonTeam.tsx:70`). QUESTIONS.md Q22 already flags it, still
   open, and cites LOCKFILE sections that do not exist.
2. CLAUDE.md contradicts itself on availability colour: taste rule 4 keeps "availability green",
   the contract row says plain ink and no green pill. Code follows the contract row.
3. A rule CLAUDE.md calls "ACTIVE, not a silent default" is enforced by nothing:
   `missing-needs-a-reason-gate.py` is in no settings file.
4. A live dark-mode block ships in `public/_mockups/ig-principles-designparser/index.html:54`,
   past an armed gate that bans it in any web file.
5. COMPONENT_REGISTRY, which calls itself the single source of truth, carries duplicate rows with
   opposite verdicts for eight components (PillToggle, Checkbox, Radio, Select, TextInput,
   DateTimePicker, SuccessMark, SeeAllButton).
6. `glyph-height-is-not-font-size-gate.py`, built for a measurement mistake that recurred, is armed
   nowhere.
7. The booking-slot radius has two owner picks, never reconciled, and the entry fell out of the
   QUESTIONS.md template so it also fell out of review.

What nothing can see: cross-screen consistency (FLOORS LAW 8), size SPREAD rather than count
(7c), sticky-CTA reachability (3b), the trust floor on paid actions, and the contrast bounds.
Finding 3 above is the shape of the whole harness problem: the law says armed, the settings say no.

## Findings still open

- The mockup at `/en/dev/unify` is the deliverable for asks 5 and 7. His pick drives what gets
  applied and to which screen first.
