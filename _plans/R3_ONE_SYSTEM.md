# R3 one system: the three candidate value sheets (round 3, 2026-09-06)

Source: the round-3 arbiter's ROOT_CAUSES.md Part 2, written from the seven measured diagnoses (the copy in the repo is `_design-system/research/DRAFT_DIAGNOSIS_2026-09-06.md`). Every value cites a Solen token, a dated owner lock, an Airbnb row, or is marked PICK. A builder uses one candidate's column and nothing from another. The recommendation is B; A and C are built beside it so he compares on his phone, per mockup-first.

## PART 2: THE ONE SYSTEM, THREE CANDIDATES

He asked for one system defined once that holds on every screen. All three candidates below are that:
a complete value sheet, applied identically to confirmation, search, bookings, pay, profile, empty
states and pills. They differ in strategy, not in paint.

**Sources used for every value:** `_kit/tokens.ts` and `_kit/systems.ts` (the round-2 kit, read this
pass), the CLAUDE.md design contract and FLOORS LAW, `airbnb--look-recipe.md` rows by number, and
`airbnb/CAPTURE.md`. Anything without one of those is written `PICK: <value>, no source`.

**Locks all three candidates inherit, unchanged (not restated per candidate):**
page background `#FFFFFF` with no dark mode ever (CLAUDE.md theme row); ink text `#0A0A0A`
(`tokens.ts` COLOR.inkText); meta `#6B6B6B` (COLOR.meta); hairline token `#E4E4E7` (COLOR.hairline);
tray `#F4F4F5` (COLOR.tray); accent `#276EF1` on small text links only, never a fill, never a button
(CLAUDE.md taste rule 3); star `#FFC32B`; save `#FF3366`; the one commit button is ink `#1C1C1F`
(COLOR.inkFill, owner 2026-08-15); every interactive control >= 44px (CLAUDE.md touch-target row,
statutory tier); no warm cream anywhere (taste rule 3, which is why Airbnb row 7's confirmation cream
is refused in all three).

---

### CANDIDATE A: RULE REFINED (no cards, inset hairlines, bare rows)

| axis | value | source |
|---|---|---|
| Page background | `#FFFFFF` end to end, no tray band | `systems.ts` rule.deltas.card.usesTray = false |
| Container treatment | **None.** Groups are separated by inset hairlines and gap size alone. One named exception: a single identity block per screen may carry a border, forced through `Card.tsx` variant `entity`, never hand-written | `systems.ts` rule.definition + borderExceptionVariant: "entity" |
| Radius, pill / chip / button | 9999px capsule | `tokens.ts` RADIUS.pillPx (orchestrator override, owner 2026-09-02 quote; collides with CLAUDE.md's 16px, see Part 4 item 1) |
| Radius, the one entity card | 16px | `tokens.ts` RADIUS.entityCardPx; CLAUDE.md radius row "individual entity-card 16" |
| Radius, photo | 16px when the photo is inside the one entity card; **0px (full-bleed)** when it is the screen hero | RADIUS.photoCardPx; full-bleed measured as the RULE confirmation's own treatment, 390x240 at top=0 left=0, which `confirmation-rule.md` section 9 records as matching both Fresha and Airbnb hero patterns |
| Primary button | Ink fill `#1C1C1F`, white text 14px/500, height 52px, radius 9999px, full width (358 at 390 viewport) | measured on both the control and confirmation RULE; `tokens.ts` COLOR.inkFill + TYPE_RAMP.cta |
| Secondary button | White fill, 1px `#E4E4E7`, ink text 14px/500, height 50px, radius 9999px | measured on confirmation RULE and bookings LIFT |
| Pill / chip, unselected | White fill, 1px `#E4E4E7`, text 13px/500 `#6B6B6B`, height 44px, radius 9999px, 12px side padding, 8px row gap, 16px row inset | `category-pills.md` table (measured live, both screens agree byte for byte) |
| Pill / chip, selected | Fill `#F4F4F5`, text `#0A0A0A`, border 1px `#F4F4F5`, no bold (weight computes 500 either way) | CLAUDE.md selected/active row, owner 2026-06-29 and the 2026-08-16 revert; measured live on the salon page |
| Status treatment | Pastel background + ink text + saturated icon: success `#E8F5E9` bg / `#16A34A` icon, error `#FEE2E2` bg / `#DC2626` icon, text 12px/500 `#0A0A0A`, radius 9999px, padding 10px/4px, icon 14px | CLAUDE.md taste rule 6; `tokens.ts` COLOR.success/error + STATUS_BADGE_BASE |
| Hairline rule | `#E4E4E7`, 1px, **inset 24px on both sides on every screen**, spanning about 88% of width; a hairline appears only at a group boundary, never between rows inside a group | `systems.ts` rule notes; `tokens.ts` SPACING.dividerInset = 24; `airbnb--profile-list.md` Recipe A (zero dividers inside a group, one at a boundary) |
| Type ramp | 28 / 18 / 14 / 12, weights 400 and 500 only. Anchor 28/500 line-height 1.15, section heading 18/500, body 14/400, CTA 14/500, meta 12/400 | `tokens.ts` TYPE_RAMP; ceiling from CLAUDE.md NEVER-AGAIN floor 2 |
| The anchor | 28px, a sentence carrying the fact, never a label with a number beside it; ratio to body 2.0x against the 1.8x floor | `systems.ts` rule notes; CLAUDE.md FLOORS LAW 6 and 7b |
| Spacing ladder | 32 section / 16 group / 12 sibling, page margin 16, divider inset 24. Home feed only: 24 section | `tokens.ts` SPACING |
| Icon budget | An icon appears only where it labels a fact that has its own text row. Never one icon per row in a list of like items | derived from `control-payment-lift.md` section 7 ("zero purely decorative icons", 9 icons all tied to a labelled fact) |
| Photo radius and share | Hero full-bleed at radius 0, 390 wide; browse/discovery/PDP folds carry >= 1/3 photographic area at 390x844; forms, checkout, receipts exempt | CLAUDE.md FLOORS LAW 2 and the imagery row |
| Shadow | **None, on anything, including the sticky bar** (separated by gradient fade instead) | `systems.ts` rule notes |

**What A is good at, measured:** it produced the only full-bleed hero in the set, which
`confirmation-rule.md` section 9 records as matching both reference brands where LIFT's inset photo
matches neither; and its profile row anatomy matches `airbnb--profile-list.md` Recipe A and
`fresha--profile.md` item 3 exactly (bare icon, no tile, no subline, chevron, hairline at group
boundaries only).

**What A cannot do, measured:** it has no legal container for a record's facts. That is precisely the
gap Cause 2 names, and it is why confirmation RULE renders 4.6% container chrome with two facet groups
un-grouped.

---

### CANDIDATE B: LIFT REFINED (shadowed white cards, no borders)

| axis | value | source |
|---|---|---|
| Page background | `#FFFFFF` end to end, no tray band | `systems.ts` lift.deltas.card.usesTray = false |
| Container treatment | **Every group of facts about one record is one white card.** A destination list gets no card at all (this is the one rule that makes B a system rather than "cards everywhere"; see the role lookup in Cause 2's fix) | `systems.ts` lift.definition, extended by `fresha--profile.md` item 3 + `airbnb--profile-list.md` Recipe A, which both render a nav list with no card |
| Card edge, the resolution B needs | A card **with a photo** takes the flush photo edge and the whisper shadow; a card **with no photo** takes the 1px `#E4E4E7` hairline instead, and drops the shadow. Never both on one element | FLOORS LAW 4 cases (b) and (c); the approved control does exactly this (bordered summary card, shadowed payment card, 0 elements carrying both) |
| Shadow value | `rgba(10,10,10,0.04) 0px 1px 2px 0px` (shadow-whisper) | measured on confirmation LIFT and bookings LIFT (`confirmation-rule.md` section 9, `bookings-lift.md` section 0) |
| Radius, pill / chip / button | 9999px capsule | `tokens.ts` RADIUS.pillPx (same collision as A, Part 4 item 1) |
| Radius, card | 16px for a card holding one entity or one photo, 24px for a card holding multiple category members | `tokens.ts` RADIUS.entityCardPx / groupedListCardPx; CLAUDE.md radius row |
| Primary button | Ink fill `#1C1C1F`, white 14px/500, h52, radius 9999px, full width, in a sticky bar with a 1px `#E4E4E7` top border when the screen has a commit action | measured on the control (358x52, sticky bar 390x85 at y=759) |
| Secondary button | White fill, 1px `#E4E4E7`, ink 14px/500, h50, radius 9999px, **inside the card it belongs to** | measured on bookings LIFT; `fresha--bookings-list.md` item 3 ("two side-by-side actions at the card's bottom edge") |
| Pill / chip, both states | Identical to Candidate A | same sources |
| Status treatment | Identical to Candidate A (pastel + ink text + saturated icon) | same sources |
| Hairline rule | Ceiling of 1 standalone hairline per fold; inside a card, rows are separated by gap only, or by an inset hairline when the card holds more than 3 rows | `systems.ts` lift.deltas.card.hairlineCeiling = 1; inset-hairline half is `PICK: inside-card divider above 3 rows, no source` |
| Type ramp | Identical to Candidate A (28 / 18 / 14 / 12, weights 400 and 500) | `tokens.ts` TYPE_RAMP |
| Spacing ladder | Identical to Candidate A, plus: card internal padding 16px, card to card 12px | `tokens.ts` SPACING.group and SPACING.sibling |
| Icon budget | Identical to Candidate A | same source |
| Photo radius and share | Photo inside a card takes the card's radius on its top corners and is flush to the card's side edges; hero photo full-bleed at radius 0 only when it sits above every card, not inside one. Fold share floors unchanged | `airbnb--trips.md` item 4 ("photo fills the top portion of the card, corners rounded to match the card"); `airbnb/mobbin-confirmation1.png` read this pass |

**What B is good at, measured:** it is the recipe the approved control already renders, and it is what
both Airbnb stills show for a receipt and a trip. Confirmation LIFT wraps both facet groups that RULE
leaves loose (552 to 976px and 1008 to 1143px), and its container-chrome share is 74.8% of the fold
against RULE's 4.6%.

**What B gets wrong today and must fix to be shippable:** its own edge device does not survive a
photo-less white card. `profile-rule.md` severity 4 measured LIFT rendering **0 shadowed elements and
5 bordered ones**, failing `systems.ts`'s own written discriminator for LIFT, because someone had to
swap to borders when the whisper shadow proved invisible. The row above ("Card edge, the resolution B
needs") is that fix written down instead of improvised per screen.

---

### CANDIDATE C: THE AIRBNB PORT (the measured rows, inside Solen's locks)

Every row below is an `airbnb--look-recipe.md` row number or an `airbnb/CAPTURE.md` measurement,
except where Solen's locks refuse it, and every refusal is named.

| axis | value | source |
|---|---|---|
| Page background | `#FFFFFF` pure white on every screen. **Airbnb's confirmation-only warm cream is REFUSED** (taste rule 3 bans warm cream by name; the reference itself tags row 7 `assume`, a visual read off a still, not sampled) | row 6 accepted, row 7 refused |
| Container treatment | Card per record; **flat, no shadow, no border** for a card that carries a photo (the photo edge is the boundary); soft ambient shadow for a card in a rail | row 10 (search-result card: none, flat) and row 37 (rail card: `rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.1) 0 8px 24px`) |
| Radius, card and photo | **20px** | rows 9, 37, 38 (three independent measurements agree) |
| Radius, primary CTA | **12px rounded rect, not a pill** | row 14 |
| Primary button | Radius 12px, fill solid ink, height 40px, text white 14px/500. **Airbnb's fill `rgb(34,34,34)` is replaced by Solen's `#1C1C1F`**, and **Airbnb's Reserve rausch gradient (rows 13, 25) is REFUSED** (the one commit button stays ink, CLAUDE.md). Height 40px is **REFUSED**: below the 44px touch floor, so 44px minimum | row 14 accepted for shape, fill and height overridden by Solen locks |
| Secondary button | Neutral grey fill, full width, one per card, inside the card | `airbnb--trips.md` item 4 ("always a single button, never two side by side"); exact fill hex **not measured**, the trips helper should have PIL-sampled it |
| Over-photo control | 40x40 frosted circle for back and share; 32x32 circle with icon fill `rgba(0,0,0,0.5)` and white stroke for the save heart, no pill behind it | rows 27, 29, 28 |
| Pill / chip, unselected | White fill, radius 24px, 1px `rgb(221,221,221)`, height 34px, text 12px/400 ink. **Ported: height 44px** (44px touch floor is statutory tier 2 and outranks a taste source), **border `#E4E4E7`** (Solen token, 7-unit delta, imperceptible), **text 13px** (Solen's measured live value) | row 21 plus the named overrides |
| Pill / chip, selected | **Border colour only changes, `#DDDDDD` to `#222222`. Fill stays white. Text size, weight and colour unchanged. No checkmark, no bold.** Ported ink would be `#0A0A0A` | `airbnb/CAPTURE.md` Part A, measured live on airbnb.ch 2026-09-06, `aria-pressed` toggled. **This collides with Solen's dated calm-grey lock, see Part 4 item 2** |
| Map / mode toggle pill | Solid ink fill, radius 24px, height 38px, width 93px, white text. Ported: height 44px | row 22 plus the touch-floor override |
| Status treatment | **Neutral. Colour never encodes state.** On-photo badges are white-80% (row 23) or dark-grey-60% (row 24); the trip timing pill is "a plain light pill, same neutral treatment regardless of urgency"; confirmation metadata renders as plain text with no pill at all (row 42). **This collides with Solen's pale-green Confirmed badge, see Part 4 item 3** | rows 23, 24, 42, `airbnb--trips.md` item 4 |
| On-photo pill geometry | Top-left of the photo. Height 8.4% of photo width, top inset 3.2%, left inset 4.0%, fill opaque white ~99.5% lightness, soft contact shadow | `airbnb/CAPTURE.md` Part B (ratios are the load-bearing numbers, raw px belong to a 299px still) |
| Hairline rule | Two values by role: `rgb(221,221,221)` for content dividers, `rgb(235,235,235)` for a chrome edge such as the tab bar. Ported to Solen's single `#E4E4E7` for content; the chrome value is **PICK: `#EBEBEB` for chrome edges, no Solen token** | rows 8, 39 |
| Type ramp | Anchor 26px/500 (row 1), section heading 22px/600 on a listing (row 2) or 18px/600 on a feed (row 44), body 14px/400 `rgb(108,108,108)` (row 4), card name 13px/500 (row 30), card meta and price and rating 12px/400 grey (row 31), rating line on a listing 12px/400 ink (row 47), amenity row 16px/400 (row 45). **Ported: anchor rounds UP to 28** (FLOORS LAW 6 sets a >= 28px floor and Airbnb's 26 sits under it, exactly as `airbnb--look-recipe.md`'s own port map row 1 says); **600 demotes to 500** (`globals.css:268-273` on customer surfaces, plus the two-weight ceiling); **the ramp is cut to four sizes** since Airbnb's own row 33 measures 7 sizes and 3 weights across two screen types, which breaks the CLAUDE.md ceiling | rows 1, 2, 4, 30, 31, 33, 44, 45, 47 with three named overrides |
| Spacing ladder | Page margin 24px (row 34), card to card 12px (row 35), section end to next heading 26px (row 36), review rhythm 35 + 24 (row 17). **Ported: page margin stays 16px** (Solen's own `px-4` is locked and measured live at 34 elements on `/en`), 26 rounds to 24 and 35 rounds to 32 to stay on the 4-point scale, per the port map's own row 17 | rows 17, 34, 35, 36 with the named roundings |
| Icon budget | **Zero icons on a card.** Airbnb's search-result card renders no icon at this breakpoint, and its trip card carries none; status is carried by pill text alone | `airbnb--search-results.md` (its own "Not measured" note) and `airbnb--trips.md` item 4 |
| Photo radius and share | 20px radius (rows 9, 37, 38); search-result card photo ratio 1.331, home rail card 1.053 (rows 11, 12); card name sits directly under the photo with no extra top padding (row 51) | rows 9, 11, 12, 37, 38, 51 |
| Shadow | Rail card `rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.1) 0 8px 24px` (row 37); search-result card none (row 10); home search pill `rgba(0,0,0,.1) 0 6px 20px` (row 20); on-photo badge a three-layer soft shadow (row 23) | rows 10, 20, 23, 37 |

**What C is good at, measured:** it is the only candidate whose shadow is strong enough to be seen.
Airbnb's rail-card shadow is roughly 2.5x the alpha and 8x the blur radius of Solen's shadow-whisper
(`rgba(0,0,0,.1) 0 8px 24px` against `rgba(10,10,10,0.04) 0 1px 2px`), which is exactly why B's edge
vanished on a photo-less card and C's would not. It also settles the icon question with a hard number
(zero on a card) against today's measured 9 icons in the search fold and 6 in the bookings fold.

**What C costs:** three of its rows collide with dated Solen decisions (cream background, border-only
selected chip, colourless status), and two more need overrides on statutory grounds (40px CTA height,
34px chip height, both under the 44px floor). Its 20px card radius is a fourth radius value on top of
Solen's 16 and 24, so adopting it means retiring one of ours, not adding a third.

---

### RECOMMENDATION

**Candidate B, LIFT refined, with the card-edge rule written into the system rather than improvised:
a card with a photo takes the flush photo edge and the whisper shadow, a card with no photo takes the
1px `#E4E4E7` hairline and no shadow, and nothing ever carries both.** Three independent measurements
point the same way and none of them is a taste opinion. First, subtraction: the screen he approved is
already this, its facts held by one bordered 358x335 card and one shadowed 358x72 card with zero
elements carrying both, and `control-payment-lift.md` found no severity-2-or-worse finding on it, so
recommending B is recommending the thing that already passed. Second, both reference brands agree on
the role lookup that makes B one system instead of a per-screen choice: Airbnb's receipt and trip are
each one card (`airbnb/mobbin-confirmation1.png`, `airbnb/mobbin-trips-list.png`, `airbnb--trips.md`
item 4) while its profile list is bare rows with boundary hairlines only (`airbnb--profile-list.md`
Recipe A), and Fresha splits identically (`fresha--bookings-list.md` item 3 bordered card,
`fresha--profile.md` item 3 flat list, no card). Third, B is the only candidate that fixes Cause 2
without breaking Cause 1: A has no legal container for a record's facts at all, and C fixes both but
imports four collisions with dated owner decisions that would each need his word before a builder
could start. **The concrete cost, and it is measured, not hypothetical: Solen's whisper shadow is too
weak to be the boundary B claims it is.** `profile-rule.md` measured LIFT rendering 0 shadowed and 5
bordered elements, failing `systems.ts`'s own LIFT discriminator, because the shadow was invisible on
white and someone silently swapped device. The card-edge rule above is what stops that from being
re-decided per screen, and B is not shippable without it. **What would flip this to C:** if he looks
at the two side by side and says the hairline-edged card reads flat, then the honest answer is not to
thicken our shadow by eye but to take Airbnb's measured one (row 37) and its 20px radius with it,
which is Candidate C. **What would flip it to A:** if he says the boxes feel heavy, since profile LIFT
puts 5 boxes around 7 rows covering 59% of the fold's height where both references use zero, in which
case A wins for destination lists and B still wins for records, and the role lookup already lets both
be true at once without the system changing per screen.
