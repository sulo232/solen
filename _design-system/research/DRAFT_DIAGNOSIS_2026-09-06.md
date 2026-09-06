# ROOT_CAUSES.md

Arbiter pass over the seven per-screen diagnoses in this folder plus `airbnb/CAPTURE.md`, the four
`look-diff-*.md` runs, and the screenshots under `diagnosis/shots/` and `airbnb/`.

Every number below is quoted from one of those files, with the file named. Where a number does not
exist in any of them, the line says "not measured" and names the helper who should have produced it.
No number here was recalled, and no number was re-measured by this pass (the arbiter reads, it does
not render).

**The owner's complaint this document answers, verbatim:** *"it looks ass. What is this design? Not
even talking about the structure. It's about the design itself. How does Airbnb do it ... ours looks
like a draft, not premium at all. Why?"* Plus: *"if the design system changes per screen it's gonna
be ass"*, and on search: *"too much text and unnecessary"* and *"the counts make it cheap"*.

**The control.** `payment-step?s=lift` is the screen he approved. Its diagnosis
(`control-payment-lift.md`) returned zero severity-2, -3 or -4 findings. Every candidate cause below
was tested against it first. Three traits that look like obvious causes are killed by that test and
are named in Part 1.0 so nobody spends a build round on them.

---

## PART 1: ROOT CAUSES OF "DRAFT, NOT PREMIUM"

### 1.0 First, the three traits that are NOT causes (the control shares them)

**Not a cause: the 99px capsule button.** `confirmation-rule.md` ranks it severity 4, the highest
finding on that screen, quoting the dated 2026-08-16 lock ("16px is a chosen corner at every width,
NOT a capsule"). But the approved control renders exactly the same shape: `control-payment-lift.md`
section 0 measures the "Confirm booking" CTA at 358x52 with `border-radius: 99px`, "true pill at this
height". A shape present, unchanged, on the one screen he approved cannot be what makes the other
screens read as drafts. The radius question is real and it is live (see Part 4, item 1), but it is a
consistency question, not the premium question.

**Not a cause: the absence of shadow.** `search-rule.md` ranks "zero shadow" severity 4 and calls it
"the single largest measured driver". The control measures **1 shadowed element** in its whole fold
(the payment card) against **2 bordered** ones, which is fewer shadows than confirmation LIFT's five
and one more than confirmation RULE's zero. A screen with one shadow was approved. Shadow count is
not the axis.

**Not a cause: 0% of text at weight 600.** Measured at 0% on the control, 0% on confirmation RULE, 0%
on search RULE, 0% on bookings LIFT, 0% on empty states. Universal, therefore discriminates nothing.
(`globals.css:268-273` demotes every `font-semibold` inside `main` to 500 on customer surfaces, per
`category-pills.md`, so this is a system-wide fact, not a per-screen choice.)

---

### CAUSE 1 (rank 1): one kind of thing is drawn more than one way on the same screen, and again differently on the next screen

**Mechanism, in one sentence a non-designer reads on a phone:** the same sort of thing (a row, a
button, a chip, a box) is dressed differently each time it appears, so the screen reads as several
people's work stitched together rather than one product.

**The number, on the rejected screens:**

- **Confirmation RULE.** "Your appointment" holds three uniform facets of one record (salon, service,
  staff), all 14px/400 ink title over a 12px/400 grey subline. They render in **three different
  treatments**: a bordered 16px-radius card (y=1020), a bare row with no card (y=1124), and a row on
  the far side of an `<hr>` inserted mid-list (y=1184). Three treatments for one class, on one screen.
  On the same screen, the two facet-groups get **two different grouping strategies**: 1 card for
  "Your appointment", 0 cards for "What happens next". (`confirmation-rule.md` sections 0 and 4.)
- **Empty states LIFT.** The screen has exactly one element class that matters, the single action that
  fills the state. It renders **two ways on one continuous page**: 1 of 4 as a solid ink pill, 3 of 4
  as a white outline with a 1px `#e4e4e7` hairline. Across both variants, **7 of 8 CTAs (87.5%)** are
  the outline. (`empty-states.md` sections 0 and 7, findings 2 and 4.)
- **Category pills.** One control class (a category chip) with the same job on two screens carries
  **6 differing CSS values**: radius 16px versus 9999px in both states, selected fill `#F4F4F5` versus
  `#1C1C1F`, selected border 1px versus 0px, selected text `#0A0A0A` versus `#FFFFFF`. Every
  unselected value is byte-identical, so the two pills agree at rest and disagree only on shape
  (always) and on how selection reads (always). (`category-pills.md`, the table.)
- **Profile.** The identical 7 peer destination rows render through **0 boxes** (RULE, hairline only)
  and through **5 boxes** (LIFT, one card per group), live on the same route family today.
  (`profile-rule.md` sections 0 and 7, severity 4.)
- **Confirmation LIFT.** Introduces its own version: **two card radii on one screen**, 16px on 3 cards
  and 24px on 2, for content that is not obviously more or less category-like than its neighbours.
  (`confirmation-rule.md` section 9.)

**The same number on the control:** `control-payment-lift.md` section 0 lists every container:
3 chrome-carrying containers (1 bordered card, 1 shadowed card, 1 bordered sticky bar), **0 elements
carrying both border and shadow**, exactly 2 hairlines, both the identical `#E4E4E7` token, one ink
CTA used once. The diagnosis records **zero same-class-two-treatments findings** on that screen. Its
own summary: "9 distinct colours in the fold, and every single one has exactly one job".

**The same number on Airbnb:** Airbnb runs more than one recipe per family, but each recipe has a
named different job. Two hairline values by context, `rgb(221,221,221)` for content dividers and
`rgb(235,235,235)` for the tab-bar edge (`airbnb--look-recipe.md` rows 8 and 39). Two on-photo badge
recipes, Guest-favourite (row 23) and Superhost (row 24), each for a different fact. Two CTA
geometries, the Reserve pill (rows 13/25) and the multi-step ink rounded-rect (row 14), each tied to
a different moment in a flow. And where the job is one job, the recipe is one recipe: the filter pill
(row 21) has one resting recipe, and `airbnb/CAPTURE.md` Part A measured its selected state live and
found **only the border colour changes** (`#DDDDDD` to `#222222`), with fill, text colour, size and
weight all unchanged. Airbnb's rule is not "one value", it is "one value per named role".

**The fix, as a rule a builder applies without judgment:**

> **ONE CLASS, ONE RECIPE.** Before a screen ships, list every element class on it (card, list row,
> pill, primary button, secondary button, status badge, divider, avatar, icon). For each class,
> assert that `border-width`, `box-shadow`, `border-radius`, `background-color` and `font-weight` are
> identical across every instance in the rendered fold, and identical to that class on every other
> screen. A second recipe for a class is legal only when the component file names the different job
> in a comment. Two recipes with no named job difference is a defect, whichever one looks better.

---

### CAUSE 2 (rank 2): the facts of one record are not held by one object, so the screen reads as loose parts on a page

**Mechanism, in one sentence:** on a receipt or a booking, everything the customer is being told is
one thing, and when those facts sit loose on white instead of inside one box, the page looks
unfinished no matter how correct each line is.

**The number, on the rejected screens:**

- **Confirmation RULE.** Container-chrome share of the fold (any element carrying a border or shadow,
  area-clipped to 0 to 844px, `hr` excluded as near-zero area): **4.6%** (15,014 of 329,160 px2). Of
  17 containers on the whole page, **exactly 1 is a content-grouping card**. The three-fact "What
  happens next" group gets **0 cards**. (`confirmation-rule.md` sections 0 and 4.)
- **Empty states, both variants.** **0 of 8** clusters sit inside any bordered or shadowed card, and
  **0 of 8** sit on the `#F4F4F5` sunken tray that the CLAUDE.md states row and FLOORS LAW 4 both
  require for grouped content on white with no photo anchor. (`empty-states.md` section 7.)
- **Confirmation RULE, downstream evidence.** Two of its 14 distinct sibling gaps are **80px and
  96px**, and both trace directly to the un-carded service and staff rows, not to a spacing choice.
  Missing containment shows up as spacing noise. (`confirmation-rule.md` section 7, severity 2.)

**The same number on the control:** every booking fact (salon, rating, address, stylist, date, time,
service, price, total) sits inside **one** bordered card, 358x335 at y=160; the one payment fact sits
inside a second card, 358x72 at y=599. Nothing about the record floats. The chrome-share **percentage
was not computed** by `control-payment-lift.md`; the container boxes are all listed in its section 0
but the helper did not turn them into a fold-area percentage, so a direct 4.6% versus X comparison is
not available. That helper should have produced it.

**The same number on Airbnb:** `airbnb/mobbin-confirmation1.png` (read this pass): the entire receipt,
photo, title, date and time, guest count and amount paid, sits inside **one** white rounded card on a
warm ground, with the single ink CTA outside and below it.
`airbnb/mobbin-trips-list.png`: each trip is **one** white card holding photo, on-photo pill, title,
one grey subline, a hairline and one full-width action. `airbnb--look-recipe.md` row 38: the whole
search-result card is one link. And the counter-case that makes this a role lookup rather than "cards
everywhere": `airbnb/mobbin-profile-hub2.png` renders the profile settings list as **bare text rows
with hairlines only between logical groups, no per-row card**, which `airbnb--profile-list.md`
Recipe A already records as zero dividers inside a group and one hairline at a group boundary.
Fresha agrees on both halves: `fresha--profile.md` item 3 is "a flat list of eight rows, each icon +
label + trailing chevron, no card", and `fresha--bookings-list.md` item 3 is a "bordered/rounded
container" for the Upcoming booking.

**The fix, as a rule a builder applies without judgment:**

> **A RECORD IS A CARD. A DESTINATION IS A ROW.** If a group of facts describes one thing that exists
> in the database (a booking, a receipt, a salon, a payment method, a stylist), all of its facts go
> inside exactly one container, and no fact about it renders outside that container. If a group is a
> list of places to go (a nav list, a settings list, an account hub), no row gets a container; the
> only chrome is one hairline at each group boundary, inset 24px both sides. A screen never mixes the
> two inside one group.

---

### CAUSE 3 (rank 3): the one fact the screen exists to deliver is the smallest, lightest, greyest thing on it

**Mechanism, in one sentence:** the thing you opened the screen to find out is printed smaller and
fainter than the decoration around it, so nothing on the screen looks in charge.

**The number, on the rejected screens:**

- **Bookings LIFT.** The date and time, the single fact a bookings screen exists to deliver, renders
  at **12px / weight 400 / `#6B6B6B`** (contrast 5.33:1), the smallest size and lightest weight
  measured anywhere on the page, at y=384, 45% into the fold. The badge above it (12px/**500**/ink)
  and the price below it (14px/500/ink) both outrank it. Under a real Gaussian blur it is
  "indistinguishable from the 'Women Cut' meta text next to it", while the photo and the pale-green
  pill survive. Anchor-to-body ratio **1.29x** (18/14) against the 1.8x floor.
  (`bookings-lift.md` sections 0, 1, 2, 7.)
- **Search RULE.** Anchor-to-body **1.29x** (18/14). At blur radius 18, the second most graphic shape
  on the screen is the **Map pill**, a navigation control, not the salon name, price or rating that
  the scan-and-pick job needs. Both adjacent type steps are under the 30% jump that makes a step read
  as a level: 14 to 16 is **14%**, 16 to 18 is **12.5%**. (`search-rule.md` sections 1, 2, 3.)
- **Profile, both variants.** Only **1 of 3** adjacent type-ladder steps (33%) clears the sourced 30%
  line; the other two, 18 to 14 at **22.2%** and 14 to 12 at **14.3%**, do not. (`profile-rule.md`
  section 7.)
- **Bookings LIFT, second instance.** The page title "Bookings" and the in-page section label "More
  bookings" are pixel-identical: both 18px/500/`#0A0A0A`, line-height 23.4px. Nothing marks one as
  the screen's identity. And the next-appointment salon name (14px/400) is pixel-identical to the
  same string on a history row three screens down. (`bookings-lift.md` sections 2, 7.)

**The same number on the control:** anchor 28px over body 14px = **2.0x**, clearing the 1.8x floor
with margin, and the anchor is literally the fact ("You'll pay CHF 35 at the salon"). Confirmation
RULE also passes this at 2.0x, which is why confirmation is not listed above; this cause is real on
bookings, search and profile, and absent from confirmation and from the control.

**The same number on Airbnb:** display anchor 26px/500 (`airbnb--look-recipe.md` row 1) over body
14px/400 (row 4) = **1.86x**. On the trip card, the fact "when" is not left to the subline at all: a
timing pill sits **on the photo, top-left**, reading "In 2 weeks", before any body copy is read
(`airbnb--trips.md` item 4, verified; the pill's colour deliberately does not encode urgency).
`airbnb/CAPTURE.md` Part B measured that pill off the Mobbin still: height **8.4% of the photo width**,
inset **3.2% of photo width from the top** and **4.0% from the left**, fill opaque white at ~99.5%
lightness. Airbnb's own card name carries weight **500** (row 30) where Solen's most important
upcoming booking carries 400.

**The fix, as a rule a builder applies without judgment:**

> **THE JOB SENTENCE OWNS THE TOP TWO TIERS.** Write the screen's job in one sentence. The fact named
> in that sentence renders in the screen's largest or second-largest size, at weight 500, in
> `#0A0A0A`, as ONE text run, never split across spans, and never in `#6B6B6B`. On a card, the same
> rule applies within the card. A screen where the job fact is the smallest or lightest run on the
> page fails before anything else is judged.

---

### CAUSE 4 (rank 4): the vertical gaps have no ladder, so the page looks assembled rather than laid out

**Mechanism, in one sentence:** the space between things is a different amount almost every time, so
nothing groups, and the eye gets no rhythm to follow.

**The number, on the rejected screens:**

- **Confirmation RULE.** **14 distinct gap values** between sibling blocks on one screen: 4, 10, 13,
  16, 17, 18, 21, 23, 32, 33, 36, 50, 80, 96px. (`confirmation-rule.md` section 0.)
- **Search RULE.** **7 distinct gap values**, two of them (6px and 10px) off the locked 4-point scale.
  (`search-rule.md` section 0.)
- **Bookings LIFT.** Measured gaps 15, 7, 7, 18, 41, 14, 12 to 13px; four of those (15, 7, 41, 13) are
  not multiples of 4. (`bookings-lift.md` section 0, full-page ladder.)
- **Confirmation RULE, second instance.** Five `<hr>` dividers run a **40px** left margin while 20+
  other elements on the same page run **16px**, a second grid living inside one screen.
  (`confirmation-rule.md` section 7, severity 1.)

**The same number on the control:** **5 distinct gap values, 12 / 16 / 20 / 24 / 32, every one a
multiple of 4**, page margin 16px both sides, card width 358 = 390 minus 32. Its own diagnosis calls
this "a real, varied rhythm, not a single repeated gap pretending to be a system".
(`control-payment-lift.md` section 0.)

**The same number on Airbnb:** page horizontal margin 24px (row 34), gap between two rail cards 12px
(row 35), last row of a section to the next heading 26px (row 36), review rhythm 35px content to
divider plus 24px divider to next row (row 17). Airbnb is **not** on a strict 4-point grid; 26 and 35
are both off it. So the failure is not "off the 4pt scale", it is the **count**: 14 values versus the
control's 5.

**The fix, as a rule a builder applies without judgment:**

> **FIVE GAPS, NO MORE.** A screen uses at most five distinct vertical gap values, drawn from
> 12 / 16 / 20 / 24 / 32 (`_kit/tokens.ts` SPACING: sibling 12, group 16, homeFeedSection 24, section
> 32, plus 20). Every divider on a screen uses the same horizontal inset (24px per SPACING.dividerInset),
> and that inset is either the page margin or a single named exception, never both on one screen.

---

### CAUSE 5 (rank 5): the same fact is printed twice in the same role, which reads as filler

**Mechanism, in one sentence:** the screen tells you the same thing twice within a thumb's width,
which is what a draft does before someone edits it.

**The number, on the rejected screens:**

- **Search RULE.** The review count renders **twice per card, 14 times across 7 cards**: the blue
  "(16)" next to the star at (539, 337), and "Coiffeur, 16 reviews" 44px below at (583, 24). Same
  number, same job. **Deleting only the "(16)" the owner named leaves the second instance fully
  visible.** (`search-rule.md` section 7, severity 3.)
- **Search RULE, second instance.** The heading repeats the search pill verbatim: **4 of its 8 words**
  ("Hair salons in Basel") are character-for-character what the pill 135px above already says, before
  it adds "sorted by most reviewed". Deleting the heading and reattaching the hairline at this file's
  own 24px gap frees **71px, 8.4% of the 844px fold**. (`search-rule.md` sections 0 and 7.)
- **Confirmation RULE.** "11:00" appears in the h1 sentence and again as the first token of the very
  next line, **twice inside a 70px vertical span**. (`confirmation-rule.md` section 7, severity 2.)

**The same number on the control, and why the crude version of this cause is wrong:** the control
prints "CHF 35" **four times** in its 58-word fold (in the anchor, on the service line, on the Total
row, and in the payment-method subline) and "Change" twice. Repetition alone is therefore shared with
the approved screen and cannot be the cause. What differs is role: on the control each instance
answers a different question (what will I pay, what does this item cost, what is the total, how do I
pay it). On search, "(16)" and "16 reviews" answer the identical question. On confirmation, the two
"11:00"s answer the identical question. (`control-payment-lift.md` section 0 text-run table.)

**The same number on Airbnb:** the trip card carries **one** grey subline doing one job, "Jun 10 |
3:00 PM | Hosted by Selcuk" (`airbnb--trips.md` item 4), and the timing fact appears once more only
because the on-photo pill states it in a **different** form (relative, "In 2 weeks") than the subline
does (absolute). Two renderings, two roles.

**The fix, as a rule a builder applies without judgment:**

> **ONE FACT, ONE ROLE, ONE RENDER.** If a value appears twice on a screen, name in three words the
> different question each instance answers. If you cannot, delete the second one. Applied to search:
> the review count answers one question, so it renders once at most, and the owner has said it
> renders zero times ("the counts make it cheap"), so both instances go.

---

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

---

## PART 3: PER-SCREEN FIX LIST

Every "changes" line is a number from a diagnosis file in this folder. "Stays" lines are things a
diagnosis explicitly cleared, so a builder does not repair them by accident.

### 3.1 Confirmation

**Placement source:** `fresha--confirmation.md`, "Measured (ordered element list, iOS, top to bottom)"
items 1 to 10.
**Causes that apply:** 1 (three treatments for one facet group), 2 (4.6% chrome, 0 cards on the
timeline), 4 (14 gap values, dividers on a second grid), 5 ("11:00" twice).

**Changes:**
1. Wrap the three "Your appointment" facets (salon, service, staff) in **one** card, 16px radius,
   with inset hairlines between rows. Today: 1 bordered card at y=1020, 1 bare row at y=1124, 1 row
   behind a mid-list `<hr>` at y=1184. Remove that mid-list `<hr>`.
2. Wrap the three "What happens next" rows in **one** card, 16px radius. Today: 0 cards, three bare
   rows on a 1px connector line. LIFT already ships this exact content in one card at 552 to 976px.
3. Headline drops to the date only: "Thursday, 17 September", 28px/500, and "11:00" appears once, in
   the 12px subtext line. Today the h1 is 8 words, 346x66, and repeats 11:00 seventy pixels above
   where the subtext repeats it. This is LIFT's own headline for the same content.
4. All 5 `<hr>` dividers move from `left: 40` to the page column at `left: 16`, or the whole page
   moves to 40; one of the two, not both. Today 5 dividers run 40px against 20+ elements at 16px.
5. Gap values collapse to the five-value ladder. Today 14 values; the 80px and 96px outliers
   disappear on their own once items 1 and 2 land, per `confirmation-rule.md` section 7.
6. The status pill's check icon goes from `#0A0A0A` to `#16A34A`, matching taste rule 6's own recipe
   (pastel background, ink text, saturated icon). Same bug in LIFT, so fix it in the shared component.
7. "Deposit paid online" is promoted from 12px/400/`#6B6B6B` to 14px/400/`#0A0A0A`, matching its peer
   "Owed at salon". Two receipt lines, one type tier. Shared with LIFT.

**Stays:** the full-bleed 390x240 hero photo at top=0 left=0 (the one thing this screen gets right
against both references at once, `confirmation-rule.md` section 8); the borderless white back-arrow
circle on the photo; the 4-size / 2-weight budget; the 2.0x anchor ratio; the green-filled done dot
with white-outline pending dots; pure white background, no cream; all 12 Lucide glyphs; every WCAG
pair (19.80:1 ink, 5.33:1 meta, 4.58:1 accent, 17.00:1 white-on-ink, 17.60:1 ink-on-pale-green).

**Do not "fix":** the 99px CTA radius. It is on the approved control (Part 1.0) and it is inside the
live radius collision (Part 4 item 1). One decision, applied everywhere at once, not per screen.

---

### 3.2 Search results

**Placement source:** `fresha--search-results.md`, "Measured" item 2 (result-count line and Filters
button on their own row) and item 4 (result card: photo, venue name, star rating with review count,
then up to three service rows inside the same card).
**Causes that apply:** 3 (1.29x anchor, the Map pill wins the squint), 4 (7 gaps, two off-grid),
5 (count twice per card, heading repeats the pill).

**Changes:**
1. **The heading line is removed.** Delete the whole 18px block "Hair salons in Basel sorted by most
   reviewed" at y=169. Reattach the hairline directly under the filter row at this file's own 24px
   gap. Frees **71px, 8.4% of the 844px fold**. Note for the builder: `systems.ts` rule requires the
   18px tier to carry at least 3 text runs, so on Candidate A this screen either keeps a reduced
   heading or the system's own rule needs the exception written down. On Candidate B that constraint
   does not exist.
2. **The review count is removed, both instances.** The blue "(16)" beside the star (7 instances) and
   the "N reviews" half of the meta line (7 instances), **14 removals across 7 cards**. Keep the star
   glyph and the "4.8" value. Deleting only the blue one leaves the number he objected to fully
   visible one line below.
3. Removing the blue "(16)" also removes the borrowed link affordance: `RatingStars.tsx` renders it in
   `#276EF1` inside a plain `<span>` with no `onClick`, `href` or `role`, so today the only
   blue, clickable-looking element on the card is inert.
4. The three service rows become **one** bounded list with inset dividers, not three free-floating
   `#F4F4F5` boxes with 6px gaps. This lives in `SalonResultCard.tsx`, the registered component, not
   in the mockup file.
5. The two off-grid gaps go: 6px (between service rows) and 10px (photo to name, category to
   services) round onto the five-value ladder.
6. The floating Map pill must not overlap card content at scroll-top 0. Today its box (659 to 703,
   152 to 237) sits directly over the boundary between card 1's first and second service rows.

**Stays:** **no grey band.** The page stays `#FFFFFF` end to end; the only `#F4F4F5` on the screen is
the service-row fill and the photo's loading fallback, and neither is a page-background band. The four
filter pills stay exactly as measured: white fill, 1px `#E4E4E7`, 13px/500 `#6B6B6B`, height 44px,
capsule, 8px row gap, 16px row inset. The 44px height stays even though Airbnb row 21 measures 34px,
because the 44px touch floor is statutory tier 2 and outranks a taste source. Also stays: the 4-size /
2-weight budget, the 28.2% photo share, the star token, and every WCAG pair.

---

### 3.3 Bookings

**Placement source:** `fresha--bookings-list.md`, "Measured (iOS)" item 2 (section label plus count
badge), item 3 (Upcoming card: photo area, then salon name as the largest text on the card, then the
date/time line, then a dot-separated meta line, then two side-by-side actions at the card's bottom
edge), item 5 (Past row: compact, no card shell, small square thumbnail, one right-aligned action).
**Causes that apply:** 3 (the date is the least visible run on the card), 1 (the page title and the
section label are pixel-identical, and the next card's name is identical to a history row's).

**Changes:**
1. **The next-appointment unit comes under a named height.** Today the card is 440px, **52.1% of the
   844px fold**, and the date does not appear until y=384, 45% down. Target: **the unit ends at or
   above y=400, so the card is at most 340px, at most 40% of the fold**, and the date/time run starts
   at or above **y=280**. `PICK: 340px and 40%, no source`; they are derived from the measured 52.1%
   and from putting the date in the fold's top third, not from a reference row. The photo is the only
   place that slack exists (today 286px, 65% of the card).
2. **A timing pill goes on the photo**, top-left corner, per `airbnb--trips.md` item 4. Copy is
   relative ("In 4 days", "Tomorrow"), matching the locked no-times-in-listings convention. Neutral
   fill, and the colour does not encode urgency (Airbnb's own pill is the same treatment for "In 2
   weeks", "In 3 months" and "Pending"). Geometry from `airbnb/CAPTURE.md` Part B: on a 358px-wide
   photo that is height ~30px, top inset ~11px, left inset ~14px, opaque white fill. Cheaper and more
   consistent alternative: reuse the existing StatusBadge shape measured at 99x22 with 12px/500 text,
   at those same insets, since composing the registered component is FLOORS LAW 9. Today: **0 on-photo
   elements exist anywhere in the capture**.
3. **The date and time become the second-largest text**, per Fresha's own card order (name largest,
   then date/time, then meta). Salon name goes to **18px/500 ink** (today 14/400, identical to a
   history row), date and time to **14px/500 `#0A0A0A` as ONE run** (today 12px/400/`#6B6B6B`, the
   smallest and lightest thing on the page, split across 5 spans). Everything else on the card stays
   12px/400 grey. Screen sizes remain four: 28 / 18 / 14 / 12.
4. **A reminder line is added**, one run, 12px/400 `#6B6B6B` with the `bell` glyph: "Reminder 24 hours
   before". The copy already exists and renders on the confirmation screen ("Sent 24 hours before your
   appointment"), so this is a port, not new copy. He said "there is no reminder or anything".
5. The page anchor: "Bookings" rises to **28px/500** so the ratio to 14px body clears the 1.8x floor
   (today 18/14 = **1.29x**) and so it stops being pixel-identical to the "More bookings" section
   label, which stays 18px/500.
6. The five-fact meta run gets one separator between the "when" group and the "what" group, per
   Fresha's own dot-separated line. Treatment only.

**Stays:** the two side-by-side actions ("Get directions" and "Manage") stay, because
`fresha--bookings-list.md` item 3 is the placement authority and it measures two actions at the card's
bottom edge; Airbnb's one-action rule (`airbnb--trips.md` item 4) is a look reference, and the
2026-09-05 amendment gives placement to Fresha. Also stays: the stacked "Bookings / More bookings"
sections in one scroll (already closer to Fresha than the production three-tab switch); the seeded
`salonCoverUrl` photo and its reuse across rows for the same salon; the pale-green and pale-red badge
recipes; the 3-size / 2-weight budget; the 41px-above / 14px-below heading rhythm.

**Named conflict, already logged, not re-opened here:** Fresha's Upcoming card uses a **map
thumbnail**, not a venue photo. `fresha--bookings-list.md` records this as a live CONFLICT.

---

### 3.4 Pay (THE CONTROL: what must not move)

**Placement source:** `fresha--payment-step.md`, "Measured (iOS)" items 1 to 12.
**Causes that apply:** none. Zero severity-2, -3 or -4 findings.

**What must not move, each with the measured value a builder would otherwise break:**
- 4 sizes (28 / 18 / 14 / 12) and 2 weights (400 / 500), sitting **at** the ceiling, never over it.
- Anchor 28px over body 14px = **2.0x**, and the anchor is the fact ("You'll pay CHF 35 at the salon").
- 3 chrome-carrying containers (1 bordered card 358x335, 1 shadowed card 358x72, 1 bordered sticky
  bar 390x85), **0 elements carrying both border and shadow**, exactly **2 hairlines**, both `#E4E4E7`.
- 5 spacing values (12 / 16 / 20 / 24 / 32), every one a multiple of 4; page margin 16px; card 358 wide.
- 9 Lucide icons, **0 of them decorative**; each is a real control or sits beside a labelled fact.
- 9 colours in the fold, **each with exactly one job**: blue only on the two live "Change" links, green
  only on the cancellation fact, yellow only on the one rating star.
- One ink `#1C1C1F` commit button, 358x52, used exactly once, in a sticky bar.
- Touch targets: back and exit 44x44, "Change" expanded to a 44px tap height, payment row 56px tall,
  CTA 52px tall.
- 0.83% photo share, a named exemption for a checkout screen, not padded with a decorative hero.

**The three open items on the control, all low, none blocking:** the sticky-bar CTA reads bare
"Confirm booking" with no price in this fixture, where `fresha--payment-step.md` item 12 shows price
plus a one-line summary on the left (the fixture is `payment_mode="at_salon"` with `amountDueNow`
computing to 0, so there may genuinely be nothing to show); there is no Notes section, present in
Fresha item 11; the cancellation sentence does not bold its hour figure the way Fresha's does.

---

### 3.5 Profile

**Placement source:** `fresha--profile.md`, "Measured (iOS)" item 1 (back arrow, "Profile" headline),
item 2 (identity card, bordered rounded container), item 3 (**a flat list of eight rows, each icon +
label + trailing chevron, no card**), item 4 (two inline items separated by a gap, not a hairline).
**Causes that apply:** 1 (0 boxes versus 5 boxes for the identical 7 rows), 3 (2 of 3 adjacent type
steps under the 30% line).

**Changes:**
1. **The 7 destination rows get no container.** Both references agree without qualification: Fresha
   item 3 is a flat list with no card, and `airbnb--profile-list.md` Recipe A measures zero dividers
   inside a group and one `#EBEBEB` hairline at a group boundary, inset 24pt both sides. Drop LIFT's
   5 group boxes (measured at 59% of the fold's height). This is the role lookup from Cause 2, and it
   is the one place where the recommended system deliberately renders no card.
2. The group boundary hairline is `#E4E4E7`, 1px, **inset 24px both sides**, one per boundary, none
   between rows inside a group. RULE already measures exactly this and matches Recipe A almost to the
   pixel.
3. **The one identity/next-appointment card stays a card** (a record, not a destination), 16px radius,
   using the locked individual-entity recipe. If it renders under Candidate B and carries no photo, it
   takes the hairline edge, not the invisible shadow.
4. LIFT's inline badge must stop truncating a moderate name: "Atelier Haarwerk" (17 characters)
   truncates to "Atelier Ha..." because the name shares one line with the Confirmed badge in a 99px
   column at x=181 with the badge starting at x=290. RULE's anatomy (name on its own full-width line,
   badge in the footer row) is the one to carry forward, and FLOORS LAW 1(f) requires the longest real
   name to survive.
5. The type ladder's bottom step is a measured wobble on both variants (14 to 12 is **14.3%**, and 18
   to 14 is **22.2%**, both under 30%). This is a shared-token issue in `_kit/tokens.ts`, so it is
   fixed once for every screen, not here.

**Stays:** the bare-glyph row anatomy with no `bg-s-bg-sunken` icon tile and no subline (already an
improvement over production `AccountHub.tsx`, which carries a 38x38 tile Airbnb does not use, and
already matching Recipe A); the chevron on every navigating row; the labelled group eyebrows
(Bookings / Wallet / Personal details), which both variants keep and which `fresha--profile.md`'s own
conflict log says not to undo without an owner call; exactly one accent-blue use case (link text);
the pale-green badge recipe; 4 sizes / 2 weights; white end to end with no dead-grey field.

**Named contradiction to fix in code, not in design:** `ProfileLiftView.tsx`'s header comment says the
render "carries no photographic focal", and it measurably does render 1 real `<img>` at 72x72. Stale
comment.

---

### 3.6 Empty states

**Placement source:** `fresha--empty-states.md`, "Measured" states 1 to 3 (small icon, bold headline
naming the missing thing, grey one-line subline, exactly one CTA, no card or border around the
cluster, positioned in the upper third rather than centred in the viewport).
**Causes that apply:** 1 (one element class, two treatments, on one page), 2 (0 of 8 clusters in any
container or on the tray), 5 (a headline that contradicts what is on screen 231px below it).

**Changes:**
1. **Pick one CTA treatment and apply it to 4 of 4 in both variants.** Today: **7 of 8 (87.5%)** are a
   white outline with a 1px `#e4e4e7` hairline and 1 of 8 is a solid ink pill, so on LIFT the same
   element class renders two ways on one continuous page. Three references disagree with each other
   here, so this needs his word: CLAUDE.md's own states row locks "a filled ink CTA" with no
   exception; Fresha runs 2 of 3 outline with the filled one reserved for its money-adjacent voucher
   state; Airbnb runs filled on rows 14 and 26 and outline on exactly 1 of the 4 states studied. See
   Part 4 item 4.
2. **The "No looks yet." contradiction is resolved.** Today the headline sits at top=136 and a live
   grid of 4 real photos starts at top=367, **231px below it, in the same 844px fold**, disambiguated
   only by a 12px caption that is 4x smaller than the 28px headline above it. Either drop the rail on
   this one state (matching the other three, which show no rail) or move the framing into the headline
   so the two claims cannot contradict at a glance.
3. **Each cluster sits on the `#F4F4F5` sunken tray**, per the CLAUDE.md states row ("on the sunken
   tray inside a living page") and FLOORS LAW 4. Today **0 of 8**.
4. **The icon stops being a bare 56x56 Lucide glyph.** Today 4 of 4 in both variants are bare glyphs
   with no tile, no fill and no illustration, against a lock that names a `/icons/categories/` 3D icon
   or a ghost-preview and bans the generic default by name. Airbnb's own highest-fidelity empty-state
   icon is a real product screenshot; Fresha's is a two-tone gradient illustration; ours is the most
   generic option available.
5. "My vouchers" is rewritten to match its three siblings ("No vouchers yet."). Its own subline already
   uses the "No X" shape the headline abandons.
6. The rail's photo tiles carry a visible competitor logo and four unrelated baked-in typefaces
   (1 of 4 tiles shows a TikTok badge). Crop or reselect, or render the rail photo-only.

**Stays:** exactly one CTA per state (matches Fresha, both variants already correct); the upper-third
cluster position (matches Fresha); the 28px headline over 14px body at **2.0x**; 3 sizes / 2 weights;
the heart at `#FF3366` as an icon fill only; the `stroke-width="1.5"` scaling (deliberate, not a
blown-up artifact); the 173x231 3:4 photo tiles at 16px radius; every hex traced to `_kit/tokens.ts`.

---

### 3.7 Category pills

**Placement source:** `fresha--booking-flow.md`, "Step: Select services".
**Causes that apply:** 1, in its purest form: one control class, one job, **6 differing CSS values**
across two screens.

**Changes:**
1. **One radius, on both screens.** Today 16px on the salon page (shared `TabPill.tsx`) and 9999px on
   the booking step (a hand-written `<button>` in `ServicesStaffStep.tsx`). This is FLOORS LAW 9 in
   the wild: the 2026-08-16 radius ruling reached all 29 TabPill importers and never reached this
   button, because the button composes nothing. **Which value wins is a live collision, Part 4 item 1.**
   Whichever he picks, the fix is the same: the booking pill is rebuilt from `TabPill`, not restyled.
2. **Delete the false comment.** `ServicesStaffStep.tsx:495` currently asserts "Same token the shared
   TabPill now uses, so the salon page and this step finally answer 'selected' the same way". That
   stopped being true on 2026-08-16 when TabPill reverted to grey, three weeks before that comment's
   own last-touched date in a 2026-09-04 merge.
3. Decide whether the two rows may keep doing different jobs with an identical-looking control: the
   salon pill **filters** (picking one hides the others), the booking pill **scrolls** (picking one
   jumps to a section, nothing is ever hidden). Also, one row is `sticky top-0` with a blurred bar and
   a bottom hairline and the other is not. Both are structural, both are real, neither is a CSS value.

**The three selected-state candidates, with the numbers:**

| | 1. Calm grey (the dated lock) | 2. Ink fill (owner override 2026-07-19) | 3. Airbnb, measured live |
|---|---|---|---|
| Fill, selected | `#F4F4F5` | `#1C1C1F` | **white, unchanged from unselected** |
| Text, selected | `#0A0A0A` | `#FFFFFF` | `rgb(34,34,34)` ink, unchanged |
| Border, selected | 1px `#F4F4F5` (matches fill) | 0px (none) | **1px, colour changes `#DDDDDD` to `#222222`** |
| Font, selected | 13px / computes 500 | 13px / computes 500 | 12px / 400, **unchanged, no bolding** |
| Checkmark added | no | no | no |
| Radius | 16px | 9999px | 24px on a 34px pill (renders as a capsule) |
| Height | 44px | 44px | 34px (**refused, under the 44px touch floor**; port at 44px) |
| Source | CLAUDE.md selected/active row, owner 2026-06-29 and the 2026-08-16 revert ("I don't like how it's, like, black ... the contrast is just, like, too harsh"); measured live | `ServicesStaffStep.tsx:489` `selected-ok:` comment, dated 2026-07-19, and named in CLAUDE.md's exception list; measured live | `airbnb/CAPTURE.md` Part A, `getComputedStyle` on airbnb.ch 2026-09-06, `aria-pressed` toggled false to true |

**Stays:** every unselected value is already identical on both screens and none of it changes, white
fill, 1px `#E4E4E7`, 13px/500 `#6B6B6B`, height 44px, 12px side padding, 8px row gap, 16px row inset.

**Not measured, and the pills helper should have said which:** Airbnb has no captured selected-state
row for its filter pill in `airbnb--look-recipe.md`; row 19 records that its top-nav tab has no visible
selected-state difference at all. Column 3 above comes from `CAPTURE.md`'s live capture of the
quick-filter chip row, which is a real toggle, not from the Filters sheet.

---

## PART 4: HIS DECISIONS

Only what cannot be decided from the sources above. Each carries what each reference does, and the
verdict word from `_design-system/TASTE_AUTHORITY.md`.

### 1. The pill, chip and button radius: 16px or the capsule. **ASK.**

**Why it cannot be decided here.** Two dated owner statements point opposite ways and the newer one
was never written down anywhere he can see. **2026-08-16**, in CLAUDE.md's design contract radius row
and in `TabPill.tsx`'s own header, with his words quoted: *"you're really elongating this pill, so it
looks like it has a sharp corner"*, and *"Now it's a lot lot lot lot better. You can go implement
this"*, landing 16px on the 29 files that import TabPill. **2026-09-02**, quoted in exactly two places
in the whole repository, `_kit/tokens.ts` and `_kit/Pill.tsx`, both dev-kit code comments: *"I never
wanted this corner thing"*, about a corner "landed unshown". A grep for that quote across
`_design-system/` and `_plans/` returns **zero hits**, so it is in no taste log, no lockfile and no
CLAUDE.md row. The precedence chain says the latest dated decision wins, which would make the capsule
correct and CLAUDE.md's 16px stale, and the approved control does render the capsule at 99px. But a
decision that exists only inside a code comment is not evidence a builder should act on against a
written lock.

**What each reference does.** Airbnb: no single answer, by design. Its multi-step and confirmation CTA
is a 12px rounded rect (row 14), its wishlist empty-state CTA reads 24 to 28px (row 26), its Reserve
button is a true 999px pill (rows 13, 25), its filter pill is 24px on a 34px control which renders as
a capsule (row 21), and its top-nav tab is 40px (row 19). Fresha: not measured for radius in any
reference file read this pass; the Fresha helper should have captured it. Treatwell: `treatwell--look-recipes.md`
exists in `_design-system/references/` and was not read by any helper on this round, so it carries no
number here.

**Verdict, and why:** TASTE_AUTHORITY step 4 fires (a component more than one file imports, and the
2026-08-16 precedent went to him for exactly this reason), and step 1 cannot resolve it because two
dated decisions of his disagree. That makes it an **ASK**, and the ask is one question: is the
2026-09-02 "corner thing" rejection real and current, or was it about something narrower than every
pill on the product. One word settles a value that 359 live call sites already render.

### 2. The selected state of a chip: keep calm grey, or move to Airbnb's border-only. **SHOW.**

**What each reference does.** Airbnb, measured live this round: fill stays white, text stays 12px/400,
**only the border goes `#DDDDDD` to `#222222`**, no bold, no checkmark (`airbnb/CAPTURE.md` Part A).
Fresha: `fresha--booking-flow.md` "Step: Select services" is the placement source; no selected-state
fill value was captured, the booking-flow helper should have. Treatwell: not read this round.

**Verdict, and why:** TASTE_AUTHORITY step 1 says a dated decision already answers it, so calm grey is
a **DECIDE** and stays. But Airbnb's border-only version is a different mechanism, not a different
value inside the band, and step 5 sends a new pattern to **SHOW**. So: calm grey ships today, and if
the Airbnb port is on the table it goes to him as one stacked comparison at real size, not as a
question in words. Both alternatives he already killed (blue border, ink fill) stay dead.

### 3. Status colour: keep the pale-green Confirmed badge, or go neutral like Airbnb. **SHOW.**

**What each reference does.** Airbnb: colour never encodes state. On-photo badges are white-80%
(row 23) and dark-grey-60% (row 24), the trip timing pill is neutral "regardless of urgency"
(`airbnb--trips.md` item 4), and confirmation metadata rows render as plain text with no pill at all
(row 42). Fresha: a pale-lavender status pill with a checkmark on the confirmation
(`fresha--confirmation.md` item 2) and a pale-green form chip (item 7), so Fresha does colour-code.
Solen's own lock: pastel background, ink text, saturated icon (taste rule 6), measured today on 4
screens as `#E8F5E9` with a `#16A34A` icon.

**Verdict, and why:** step 5 (a change to what a colour means across the product) plus step 4 (the
badge is a shared component). **SHOW.** It is not a small value change; going neutral removes the one
semantic-colour moment several of these screens have, which touches FLOORS LAW 1(d).

### 4. The empty-state CTA: filled ink or outline. **ASK.**

**Why it cannot be decided here.** Three sources give three answers and one of them is our own lock.
CLAUDE.md's states row locks "a filled ink CTA to the filling action" with no exception. Fresha runs
**2 of 3 outline**, reserving the filled treatment for its money-adjacent voucher state
(`fresha--empty-states.md` states 1 to 3). Airbnb runs filled on rows 14 and 26 and outline on exactly
**1 of 4** states studied, and `airbnb--empty-states.md` logs that Airbnb is not internally consistent
here either. What ships today is **7 of 8 outline**, the inverse of our own lock, with no dated
decision anywhere authorising it.

**Verdict, and why:** this is not a taste micro-choice, it is either a bug against a written lock or an
undocumented supersession of it, and TASTE_AUTHORITY's step-1 search finds no dated decision. **ASK**,
as one question: does the outline default supersede the CLAUDE.md filled-ink lock, yes or no. Whichever
way it goes, 8 of 8 then render the same way, which is Cause 1's fix.

### 5. Confirmation: full-bleed hero photo, or the photo inside the card. **SHOW.**

**What each reference does.** Fresha: full-bleed photo hero with the back arrow top-left in a white
circle (`fresha--confirmation.md` item 1), which is what RULE renders today, 390x240 at top=0 left=0.
Airbnb: the confirmation still puts the photo **inside** the white receipt card
(`airbnb/mobbin-confirmation1.png`), and the trip card does the same (`airbnb--trips.md` item 4, "photo
fills the top portion of the card, corners rounded to match the card"). So the current law's own split
puts them on opposite sides: placement authority (Fresha) says full-bleed, look authority (Airbnb) says
inside the card. Treatwell: not read this round.

**Verdict, and why:** step 5, a new pattern on a screen he has already rejected once, and it changes
the first thing the eye lands on. **SHOW**, as the two treatments stacked at real width with everything
else held constant.

### 6. Bookings: the card's photo is the salon's cover, Fresha's is a map. **PARK.**

`fresha--bookings-list.md` item 3 measures a static map thumbnail with a pin, not a venue photo, and
its own file already logs this as a CONFLICT with a note that the map orients a return trip. Airbnb's
trip card uses a destination photo (`airbnb/mobbin-trips-list.png`). Today's render uses the salon's
seeded `salonCoverUrl`, and `bookings-lift.md` adds that the shot is a generic stock image reused
across every row for that salon, so it is doing less identifying work than either reference's choice.
**PARK** per step 7: it does not block any of the fixes in 3.3, and it is already logged.

### 7. Everything else was DECIDED here and is not listed.

For the record, so nobody re-opens them: the four-size / two-weight ceiling stays (TASTE_AUTHORITY
section 5 names the size-count contradiction as open and says the enforced ceiling is the working
default until he closes it); the 44px touch floor overrides Airbnb's 34px chip and 40px CTA heights
(statutory tier 2 outranks a taste source); warm cream stays banned including on the confirmation
(taste rule 3, and Airbnb row 7 is tagged `assume` anyway); the anchor rounds up to 28px rather than
copying Airbnb's 26 (FLOORS LAW 6, and the look-recipe's own port map says the same); and the profile
destination rows get no container (Fresha item 3 and Airbnb Recipe A agree without qualification, so
step 1 fires and there is nothing to ask).

---

## Not measured, and who should have measured it

- **The approved control's container-chrome share of its fold, as a percentage.**
  `control-payment-lift.md` lists every container box in its section 0 but never converts them to a
  fold-area percentage, so the cleanest single number for Cause 2 (4.6% on confirmation RULE, 74.8% on
  confirmation LIFT) has no control value to sit beside. That helper should have produced it.
- **Fresha's radius values, anywhere.** No Fresha reference file read this pass carries a measured
  corner radius, which is why Part 4 item 1 has an empty Fresha column. The `fresha-section-capture`
  runs behind those files should have.
- **Airbnb's secondary in-card button fill.** `airbnb--trips.md` item 4 describes it as "grey/neutral"
  with no hex. The trips helper should have PIL-sampled it.
- **Treatwell, on every axis.** `_design-system/references/treatwell--look-recipes.md` exists and no
  helper on this round opened it, so every Part 4 comparison has a blank Treatwell column.
- **Airbnb's selected filter-chip fill in `airbnb--look-recipe.md`.** The file has no such row; the
  live capture in `airbnb/CAPTURE.md` Part A is the only source, and it should be folded into the
  numbered table as a new row so future look-diff runs can cite it by number.
