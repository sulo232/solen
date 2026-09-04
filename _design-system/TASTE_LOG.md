# Taste Log: elicited design decisions

The running record of the **taste-picking initiative** (V3-D441+, 2026-06-07).
Each round shows the user 2-4 coherent options on a REAL screen; the user picks
plus says why; the decision is locked HERE and in the relevant component doc /
CLAUDE.md pinned rules / drift-checker.

This is the **"stop re-guessing" ledger**: read it before any design work on a
covered surface, so a settled call is never re-litigated (the recurring failure).

**Method:** `public/solen-taste-*.html` mockups, one variable per row, English,
grounded in the real component (no invented layouts, no fabricated data).

## Conversion-spine coverage
- [x] Round 1: Search result card (`SalonResultCard`)
- [x] Round 2: Salon PDP (Book CTA + title)
- [x] Round 3: Booking step (date / time) + audit conflicts B1/B2
- [x] Round 4: Pay step , covered by a different mechanism (owner-approved mockup, not the 2-4 option elicitation used in Rounds 1-3): commits `58098af8b` "approved redesign — blue icon stepper, hair step v3, pay step restyle" (2026-06-11) + `71ba0909c` "pay-step payment choice per approved mockup 24d-ink" (2026-06-12). Closed 2026-07-10 (governance backfill).
- [x] Round 5: Confirmation , covered: commit `77f47b00b` "rebuild to senior scorecard 5/5 (the approved mockup)" (2026-06-09), cross-referenced in MOTION.md's DONE log ("Confirmation rebuilt to 5/5"). Also an approved-mockup rebuild, not the elicitation format. Closed 2026-07-10 (governance backfill).

---

## Round 1: Search result card (2026-06-07)

Mockup: `public/solen-taste-01b-search-cards.html` (v1 `-01-` was rejected:
changed too many vars at once + invisible shadows + an incoherent orphan-blue
price number). Confirmed verbatim: **"all ur count correct"** (all 4 "my read" picks).

| Dimension | Decision | Why |
|---|---|---|
| **Elevation** | Soft, visible shadow (`elevation-2` family) | Gentle lift, the card family. Flat reads cheap; lifted too "app"; hairline too boxy. |
| **Availability hook** | ~~Green availability pill (semantic), not ink text~~ **REVERSED (V3-D443, CONSISTENCY_AUDIT.md:8):** owner rejected the green pill; card availability is now **plain ink text**, no pill. Do NOT re-add (also locked in CLAUDE.md's design-contract "availability" row). | Green = available is *information*, the one intentional splash of life on a calm card. *(superseded rationale, kept for history)* |
| **Price** | **Bold ink number**, units grey | The number is what you scan, so it carries the weight; `from`/`CHF` recede. |
| **Card extras** | **Clean** | Name, rating (no count), one meta line (`category · city`), price, the one slot hook. No review-count, no distance, no badge. Re-confirms V3-D354. |

- keywords: availability, availability pill, green pill, next slot, next available, plain text availability, card availability

### Cross-cutting rules promoted from this round
- **Coherent emphasis** (-> CLAUDE.md taste rule #5): weight or colour maps to a
  WHOLE meaningful unit, never an orphan sub-token. The rejected version coloured
  only the "65" but not "from / CHF", which reads as a glitch, not a decision.
- ~~**Semantic availability = green pill** (-> universal-color convention): an
  "open / free / available / next-slot" signal uses the green pastel pill
  (`text-s-success` on a green-pale bg), not ink text, not a dot.~~
  **REVERSED , struck 2026-08-17 by the weekly law pass, using the supersession that was already
  written into the table twelve lines above this one (V3-D443, CONSISTENCY_AUDIT.md:8): the owner
  rejected the green pill and card availability is plain ink text with no pill. The row was struck;
  this bullet, which promoted the same dead rule to a UNIVERSAL convention, was not, so the reversal
  was only half-applied inside one file. `CLAUDE.md`'s availability row ("plain ink text , NO green
  pill, owner call, do not re-add") is canonical. `REJECTED_TREATMENTS.json` goes further still and
  deletes the next-slot row from the card entirely (`card-next-slot-row`, 2026-07-15); which of those
  two is live is a question for him, and it is in the 2026-08-17 report.**

### Applied in code?
- ~~✅ **Green availability pill** applied in `SalonResultCard` (grid + list nextSlot),
  verified on the real grid results (V3-D442). tsc clean.~~ Struck by the same reversal; kept so the
  history stays legible.
- Pending: card shadow `0_20px_40px_rgba(0,0,0,0.04)` -> `shadow-elevation-2`
  (deferred to the shadow sweep so all card families change together, no divergence).

---

## Round 3: Booking date + time + audit conflicts B1/B2 (2026-06-07)

> **B1 SUPERSEDED (owner 2026-06-29, gate `no-black-selected`; LOCKFILE §13.1 point 3):** the blue
> selected-state below now applies ONLY to the calendar date + time slot exception. Every OTHER
> selected state (active tab, radio, filter pill, chip, menu/list option, segmented control) moved to
> calm GRAY fill (`bg-s-bg-sunken` + `text-s-ink` + semibold), never blue-border, never black/ink. Do
> not re-litigate "active tab" or "radio" as blue , they are gray now.

Shown on the REAL `DateTimePicker` primitive via a throwaway harness route, after
the hand-drawn calendar mockup was rejected ("that aint actually the real
calendar"). Confirmed verbatim: **"both b"**.

| Dimension | Decision | Why |
|---|---|---|
| **Time-slot layout** | **Grouped grid** (Vormittag / Nachmittag) | the `DateTimePicker` primitive ALREADY does this; the booking flow just runs a bespoke full-width-ink-rows version instead. |
| **Selected-state colour (audit B1)** | ~~Blue `s-accent` everywhere a single choice is active (calendar date, time slot, active tab, radio)~~ **NARROWED 2026-06-29: blue survives ONLY for calendar date + time slot; active tab/radio/chip/menu-option are now GRAY** (`bg-s-bg-sunken`); **ink reserved for the ONE commit button** | one "selected" language; matches the search overlay; collapses the 5 dialects the audit found. |
| **Card price weight (audit B2)** | **Bold ink number, name kept LARGER** as the anchor | resolves B2; amend rule A13 to "anchor by SIZE, name + price may both be ink if the name is larger." |

- keywords: selected state, active state, selected colour, blue selected, gray selected, grey selected, filter pill selected, active tab, radio selected, no-black-selected, calendar date, time slot

### KEY FINDING (reframes round 3)
The search overlay uses the `DateTimePicker` primitive (grouped grid + blue via
`selectedTone="accent"`); the booking flow (`components-legacy/booking/DateTimeStep`)
does NOT, it has its own full-width ink rows + a separate calendar. So the round-3
fix is mostly a DELETION: booking adopts the primitive.

### Applied in code?
**DONE for `DateTimeStep` (V3-D442, in-place restyle, verified on the real booking
date step @ Old Town Barbers):**
- Time slots: full-width ink rows -> **grouped grid** (Morgens / Nachmittags /
  Abends, grid-cols-3), reusing the period groups already computed. ✅
- Selected colour -> **blue `s-accent`** on the date strip + the time slots + the
  month-popup calendar cell. ✅
- Decorative `bg-s-accent` waitlist dot **removed**. ✅
- Bottom commit button stays **ink** (correct per B1). ✅ · tsc clean.

NOTE: I did an in-place restyle, NOT a full swap to the `DateTimePicker` primitive,
because the booking date UI is a 14-day STRIP (not a month grid) and swapping
wholesale would change the date-picking UX the owner didn't pick. The popup
calendar (behind the calendar icon) still covers further-out dates.

Still pending (separate, lower priority):
- Consolidate booking + search onto ONE date component (kill the duplicate). Bigger
  refactor; the in-place restyle already gives visual parity.
- Give the booking popup-calendar the primitive's Mo-first + short-weekday fixes.
- Sweep selected-state -> blue on other tabs / toggles / radios per B1.
- Apply rounds 1-2 (card green availability pill, PDP gradient-fade bar).

(Audit conflicts B1 + B2 in `CONSISTENCY_AUDIT.md` are now RESOLVED.)

---

## Round 2: Salon PDP (Book CTA + title) (2026-06-07)

Mockups: `public/solen-taste-02-pdp.html` + `public/solen-taste-02b-bookbar.html`
(the bar row was re-shown bigger with a real service list + a gradient-fade option,
per user "show me better example"). Confirmed: row 1 "clean", row 2 "gradient
fade", row 3 "stacked no dots ... the color differentiation is enough".

| Dimension | Decision | Why |
|---|---|---|
| **Book button** (`SalonMobileBookBar`) | **Clean**: "Termin buchen" + chevron, NO price | You book a time; the from-price depends on the service picked next, so price on this button misleads. Price belongs on the service list. |
| **Sticky bar separation** | **Gradient fade** (content dissolves to white above the bar), NOT border / shadow / frost | Removes the hard cut without a shadow, so it stays flat (CONTROL_ELEVATION rule-correct) and reads premium. Shadow = grey-haze; frost = over-photo only. |
| **Title meta** (`SalonHeader`) | **Stacked, no dots.** Status = "Geöffnet bis 19:00", green word + ink time, NO `·` between | Colour contrast already separates the two; a dot is noise. Re-confirms V3-D232 stacked layout. |

### Cross-cutting rules promoted
- **Colour/weight contrast IS the separator** (-> CLAUDE.md taste rule #2): when two
  adjacent bits already differ by colour or weight, do NOT add a `·` dot too. (I
  violated this in the mockup, "Geöffnet · bis 19:00"; the user caught it.)
- **Sticky bottom CTA bars = gradient content-fade**, not border / shadow / frost
  (-> CONTROL_ELEVATION.md, sticky-bar case). Generalises to every sticky bottom
  action bar (booking, pay, walk-in).

### Applied in code?
- ✅ **`SalonMobileBookBar`**: hard `border-t` -> gradient content-fade (borderless
  white bar, `before:` pseudo). Clean `bg-s-ink` button kept. Verified on the real
  PDP (content fades behind the bar). V3-D442, tsc clean.
- ✅ **`StatusInline`**: the `·` between the status word + time is gone; the
  green/red vs grey colour separates them. Verified on the real PDP ("Geschlossen
  Öffnet Montag um 09:00", no dot).
- Pending: add the "sticky-bar = gradient fade" rule to `CONTROL_ELEVATION.md`.

---

## Inspo home chrome , multi-category architecture (council + owner, 2026-06-20)

Convened the LLM council (Gemini 3.1 Pro + Grok 4 + Claude) on the `/inspo` home. Both external
models converged: the page is built hair-only but the product is multi-category (hair/nails/barber/
spa), so the chrome IA is broken. Full record + phase-2 list: [`_discovery-audit/HOME_DIRECTION.md`](_discovery-audit/HOME_DIRECTION.md).

| Dimension | Decision | Why |
|---|---|---|
| **Category switcher** | **Pills, not a segmented control.** Keep the current rounded-box (`rounded-card`) filter-pill shape; category pills are the first control. | Owner wants the existing pill language, not new heavy chrome. Lighter, on-system. |
| **Filter model** | **Two-level progressive disclosure.** Top = category pills; tap a category -> expands to that category's sub-style pills (Hair reuses today's data-driven quick-chips; nails/barber/spa get their own). | Solves the council's "category collision" without a separate taxonomy fighting the feed. |
| **Default feed** | **Blended "For You"** (all categories), scoped by the pills + search. Hybrid, not pure-segmented. | Owner likes blended-for-you; council's siloed-intent concern is handled by the pill scope on tap. |
| **Feed cards** | **Keep as-is this pass** (owner "what we got rn"). | Card redesign is out of scope; chrome/IA first. |
| **Selected pill state** | ~~Blue border + blue text, NO fill; neutral resting pills.~~ **SUPERSEDED 2026-06-29 (out-of-scope discovery, flagged not fixed by this pass):** V3-D450 (cited here as still-locked) was itself superseded 9 days after this entry , selected pills are now GRAY (`bg-s-bg-sunken` + `text-s-ink`), never blue-border. See the Round-3 B1 supersession note above. | Re-confirms the locked filter-pill rule (V3-D450, now superseded). |

### Deferred (phase 2, data-coupled)
- Per-category sub-taxonomy for nails/barber/spa (extend `/api/discovery/chip-terms` to be category-scoped).
- Inventory-aware category pills (Basel-only cold-start: only show categories with real looks; no empty Spa pill).
- Real booking signal on cards (distance / "Frei diese Woche" / book-this-look) , needs geo + live availability.
- Seed-image mismatch cleanup (content fix, not design).

### Applied in code?
- Not yet , owner said "write it down" first. Next when greenlit: mockup of the real `/inspo` chrome
  (cards untouched) as a link, mockup-first.

## FilterSheet per-filter sheets , Apply button + in-sheet selected state (owner voice 2026-07-03, R4-1)

Owner approved `/dev/filter-menus` in full then said "just implement it" (2026-07-03). Two rows AMEND
prior LOCKFILE conventions, scoped to filter sheets only:
- **Apply/commit button in a filter sheet = neutral OUTLINE** (`bg-white border-s-border text-s-ink
  rounded-pill`, `hover:bg-s-bg-sunken`), NOT the LOCKFILE §2.5 ink Primary CTA ("i dont like black
  buttons"). Scope: FilterSheet.tsx Apply only , the ONE global commit CTA rule (LOCKFILE selected/active
  row: "ink ONLY for the one commit button") still holds everywhere else (booking pay, checkout, etc).
- **Selected/active state INSIDE a filter sheet = GRAY** (`bg-s-bg-sunken` + `border-transparent` + ink
  text), superseding V3-D450's blue-border chip rule for sheet-internal controls specifically (sort
  segment fill, gender/amenities/deals SheetChip). The filter PILL row OUTSIDE the sheet (SearchTemplate
  chip strip) is UNCHANGED , still its existing neutral-sunken treatment, not touched by this decision.
- Sort segmented control's active white pill now MORPHS between options via a shared `motion.span
  layoutId` (duration 0.26, EASE [0.32,0.72,0,1]) instead of a hard swap ("make it morphing, don't snap,
  more smooth"). Rating changed from a chip row to a swipeable discrete bar (Any/3.0/3.5/4.0/4.5) with
  the same eased-glide fill/thumb.

### Applied in code?
- Yes , `app/[locale]/_components/search/FilterSheet.tsx`: Sort segmented pill morph, Rating chip row
  -> `RatingBar` (discrete swipeable bar), Apply button -> neutral outline, in-sheet selected chips
  confirmed gray (`SheetChip` was already `bg-s-bg-sunken`, unchanged). i18n keys `ratingAndUp` /
  `ratingAria` added de/en/fr/it.

## 2026-08-09 , input fields go white with a hairline, and the focus line is removed

Owner verbatim, in order: *"is this style even correct how does airbnb n uber do"* , then, on being
shown the measurements, *"make like airbnb but without the focus line when tapped in"*.

**What was measured first, on the live sites the same day, before anything changed:**

| | height | corner | fill | line |
|---|---|---|---|---|
| Solen, before | 48 | 12 | grey `#F4F4F5` | `1px solid transparent` |
| Airbnb | 60 | 12 | none (white) | 1px grey `rgb(140,140,140)` |
| Uber | 48 | 8 | grey `rgb(246,246,246)` | 2px black on focus only |

**The decision, applied to the base input rule in `app/globals.css`:**

- fill `#F4F4F5` to **white**, because Airbnb has no fill and a grey fill under a grey line reads as
  two competing boundaries.
- the resting line from `transparent` to **`#E4E4E7`**. It is worth naming that the line was ALREADY
  THERE and invisible, so this is a colour change and not a new element.
- height stays **48**, not their 60. He asked for the look, not the size, and 48 is locked.
- **the ink focus line is REMOVED by his instruction.** Tapping a field now changes nothing visible.

**The cost, stated once at the time and then his call (rule 3, and he decided after hearing it):**
this removes the only visible focus indicator. On a phone the caret and keyboard cover it. On a
laptop, anyone moving through a form with a keyboard cannot see where they are, and WCAG 2.4.7 asks
for a visible focus indicator. The smallest thing that would satisfy both is the line darkening to
`s-ink-2` instead of jumping to black, and that remains available if he wants it later.

**Supersedes:** the 2026-07-17 input-fill decision (filled grey at rest, white on focus) and the
LOCKFILE §3.5 depth note that describes inputs as filled-grey. Both are now history; this row wins.

Verified live at 390 on `/de/booking/resend-link`: white fill, 1px `rgb(228,228,231)` line, and
identical at rest and when tapped.
- keywords: filter, filter pill, filter chip, filter sheet, sort segment, price slider, filter button, filters neutral, blue filter, gray filter, grey filter, sheet chip, apply button

## 2026-07-06 , data-state filters: hide while empty (owner approved)
- Decision: filter surfaces that point at data which cannot discriminate are HIDDEN, not shown-but-empty. Applied to the Angebote pill + FilterSheet group + deals sort + Angebote rail (while 0 listed salons carry a deal) and the Fuer-wen pill + group (while every active service is tagged for all genders). They reappear automatically when the data changes (cached availability check, ~5 min).
- Why: a filter that always yields 0 results or never narrows is a dead control; showing it violates the no-fabricated-affordance principle (same family as taste rule 1). Seeding fake deals was rejected as data fabrication.
- Record: mockup public/_mockups/sweep-datastate-filters.html (real-page captures, treatment-only); owner: "this is so good approved". Root-cause data facts: 0 deals live; 264/264 services tagged both genders (verified via SQL 2026-07-06).

## 2026-07-15 , Taste Lab round 1: five unsettled axes settled (owner verbatim: "1a 2 your pick 3b 4 b 5 no dark mode")

Elicited via public/_mockups/taste-lab/index.html (real SalonCard replicas, live tokens, forces/tradeoff annotations per _design-system/RATIONALE.md section 1). Lean-format entries per the hybrid template.

| Axis | Decision | Because / at the cost of | Mechanic |
|---|---|---|---|
| Corner curvature | **1A: circular arcs stay** (border-radius as-is, no squircle) | zero plumbing, shadows work natively; accepts the faint G1 kink on large surfaces. Revisit only when CSS corner-shape ships | RATIONALE.md section 6 corners (CONV/T2) |
| Optical alignment | **Adopt corrections as a rule**: play/asymmetric glyphs nudge toward visual center, circles next to squares get a small size overshoot, icon-text baselines eye-checked at 2x | perceived balance and the thorough-detail read; at the cost of per-icon manual nudges flexbox cannot verify | RATIONALE.md section 6 optical alignment (T2) |
| Contrast on sunken | **3B: retune**. Policy = WCAG 2.2 AA floor + APCA supplement. On s-bg-sunken #F4F4F5: meta grey deepens to #575757 (6.57:1, Lc 78.6) and blue metadata renders ink (blue stays on white only) | AA compliance everywhere + dark-ready policy; at the cost of one context rule (value depends on surface). IMPLEMENTATION QUEUED (sitewide sweep, own session) | RATIONALE.md section 4 measured table (T1/T2) |
| Text measure | **4B: cap long body/description text at 68ch**, line-height stays 1.5 | comfortable return sweep, German compounds get room; at the cost of asymmetric right whitespace on wide screens | RATIONALE.md section 5 measure (CONV) |
| Web dark mode | **DECLINED** ("no dark mode"). Graveyarded; do not re-propose without an owner yes | second full color system not worth it now; mobile dark stays the only dark surface | REMOVED.md entry 2026-07-15 |

Also this round: the rose photo DiscountBadge (web SalonCard.tsx V3-D85) was shown in the lab replicas and the owner rejected it on sight ("doesnt match at all"), consistent with the earlier mobile decision (memory project_card_badges: rejected red/rose photo tags, discount = pale-green by the price). Badges removed from the lab; web-badge alignment queued as its own mockup-first task.

## 2026-07-15 , Taste Book approved (owner verbatim: "this taste book so good and perfect except ths part... evrth else is perfect we need more of these")
- Decision: the visual Wrong/Right pair format (public/_mockups/taste-book/index.html) is the APPROVED owner-deliverable format for design knowledge; grow it with every research round and every audit.
- Amendment applied same turn: a rating number never appears bare; it always carries the star glyph (demo cards now read city + star + value on both panels). This mirrors the live card and the stars-with-count law.
- Why: the owner is visual; markdown research files were rejected as unreadable ("i need visuals... recurring pattern"). Enforced by scripts/hooks/visual-deliverable-gate.py (Stop): design-knowledge turns must close with a viewable link.

## 2026-07-15 , STRANDED DECISIONS surfaced (owner: "go check instead of guessing"): the converged card of 2026-07-13 outranks main's code
- Facts verified by reading branch claude/animation-reference-recognition-11f0c3 (SalonCard.tsx at tip, commits around 857e62882): CARD_REDESIGN_2026-07-13, owner-approved via card-redesign.html #c11: (C1) photo 5/4, supersedes the 3/2 landscape of 2026-07-02; (C11) rating = star + value, review COUNT DROPPED from Row 1 (so no blue count on cards); (C2) availability badge + next-slot text (calendar icon, "Heute 14:30") fully deleted; rows = name+star / category / address+price.
- Consequence for today's work: taste-lab/taste-book/audit replicas showed main's superseded card; home-refined corrected to the converged card same turn; audit finding H4 (bold time) becomes moot once the branch merges; H5 (dash placeholder) still holds, the converged code keeps the "—" fallback.
- Enforcement: three REJECTED_TREATMENTS.json signatures added (card-blue-review-count, card-landscape-photo-3-2, card-next-slot-row) so the superseded treatments cannot re-enter mockups.
- SYSTEMIC LESSON (recurring-pattern class): decision-truth is the LATEST DATED OWNER DECISION ACROSS ALL BRANCHES, not main's code and not the rendered main UI. Until the merge-review chip lands (task_c132841a), any card/homepage work must check the animation-reference branch first.

## 2026-07-15 , Wave-1 fix pairs ALL APPROVED (owner verbatim: "all approved")
- Scope: home-refined R1-R5 + fixes-refined S1-S3 / P1-P3 / D2-D4 / C1-C3 (17 pairs). Each Refined panel is now the approved treatment; apply to real code one commit per fix.
- R2 (card three-bolds) is DELIVERED BY the converged card (CARD_REDESIGN_2026-07-13) when the merge lands, not re-implemented by hand here.
- C1 note: the solid staff-swatch fills + initials proposal is hereby approved (was flagged as needing sign-off).

## 2026-07-16, reference-probe picks round 1 (owner dictated)

| Probe | Decision | Owner verbatim |
|---|---|---|
| P7 checklist language (done=green check / current=filled / upcoming=outline, all steps visible) | APPROVED | "RIP seven is approved" |
| P12 notifications expand in place + label folds to "View all" | APPROVED | "and p twelve two" |
| P1 rolling digits on updating numbers | APPROVED, WITHOUT the blur; refine the roll | "that blurting is not okay. But if it's better to improve it, that's good" |
| P14 InsightCard tips shape (backend still missing) | APPROVED (shape only) | "P fourteen is approved too" |
| P3 approve/decline collapses to committed pill + undo | REJECTED | "The p three, no. P three, I don't want that" |
| P13 search: grouped sections + match highlight + honest loader | APPROVED | "p thirteen, that's approved" |

P3 graveyarded (REMOVED.md). Undecided probes from the refs page stay open: P2, P4, P5, P6, P8, P9, P10, P11, P15, P16, P17, C1-C5, G1, G2.

## 2026-07-16, picks round 2 (owner dictated, evening)

| Item | Decision | Owner verbatim |
|---|---|---|
| C1 category chips | KEEP the neutral lock | "implement all of the c's" |
| C2 commit button | KEEP the ink lock | same |
| C4 celebration screens | KEEP the calm confirmation; full-bleed is wanted but NOT there | "that's okay, but we can maybe improve... I like full bleed stuff... not for that, not how you did it with c four" |
| C3 selected states | UNDECIDED, stays open | "c three. I don't know, bro" |
| C5 staging vs product color | unanswered, stays open | none given |
| G1 richness | KEEP current density (option b) | "for g one, keep the current" |
| G2 layouts | GRID for search/results pages, CAROUSEL for home rows | "grid is for when you search up, and Curacao is for home page" |
| Icon rule wording | "almost always" is too vague, the exemption set must be DEFINED | "what do you mean almost? Is it already defined?" |
| Gray backgrounds | Owner dislikes frequent gray boxes/backgrounds in my presentation pages; product-side gray locks (sunken tray, gray selected fill) stay LAW until reopened by name | "I don't really understand why you use gray background often. I don't like that." |
| Full-bleed | WANTED, a lot, on the right moments (per ref 05 family), placement to be probed | "I like full bleed stuff... I want it a lot. So make mock ups of that." |

## 2026-07-16, full-bleed picks + the dead-chevron rule (owner dictated, night)

Owner verbatim: "ok all of it no disban the full bleed thing one thing to add it smtimes make chevron that has no real destination"

| Item | Decision |
|---|---|
| FB1 home photo hero (straddling search) | APPROVED |
| FB2 PDP tall gallery hero | APPROVED |
| FB3 category/city landing hero tier | APPROVED |
| FB4a onboarding photo montage | APPROVED |
| FB4b gradient finish | NOT adopted (followed the stated recommendation inside "ok all of it"; one word reopens) |
| FB5 tier-up full-ink takeover | APPROVED |
| FB6 dark marketing bands with real product | APPROVED |
| FB7 green queue flood | NOT adopted (same recommendation basis) |
| Full-bleed as a direction | STANDING, not disbanded ("no disban the full bleed thing") |
| NEW RULE, dead chevrons | A chevron/arrow affordance may NEVER render without a real wired destination. A dead chevron is a fabricated affordance, the same class as fabricated data. Mockups mark inert controls as inert; product code never ships an unwired chevron. |

Interpretation note: "ok all of it" read as endorsing the recommendation set printed on the page and in chat (a on photo moments, yes FB5, no FB7, no gradient). If "all of it" meant literally every fork including FB7 and the gradient, say so and both flip to approved.

## 2026-07-16, CORRECTION: full-bleed DENIED (owner, same night)

Owner verbatim: "fym i told you full bleed is not okay i want it gone the mockup is denied bro"

The earlier "ok all of it no disban the full bleed thing" meant REJECTION and I misread it as approval: my mistake, logged plainly. The "full-bleed picks" table above is VOID. Standing state:

| Item | Decision |
|---|---|
| Full-bleed direction (photo/color heroes, takeovers, floods, montages) | DENIED and disbanded; graveyarded (REMOVED.md + REJECTED_TREATMENTS signature); never re-propose without an explicit owner yes by name |
| fullbleed.html exploration mockup | DENIED, deleted |
| FB1-FB7, all of them | REJECTED |
| Dead-chevron rule | STANDS (the owner did not retract it) |
| Earlier same-day "I like full bleed stuff... I want it a lot" | SUPERSEDED by this rejection; latest dated call wins |
## Dashboard coverage
- [x] Round D1: Operator dashboard home (2026-07-14/15, 7 mockup rounds)


## Round D1: Operator dashboard home (2026-07-14/15) , the redesign rounds

Source: 7 live mockup rounds (`public/_mockups/dashboard-overhaul/`, final draft `traced.html`),
owner reactions verbatim, plus an LLM-council diagnosis the owner commissioned ("its still so
cluttered what is the core cause"). These are DATED OWNER DECISIONS for `/dashboard/*`; read this
block before ANY operator-dashboard design work.

| Dimension | Decision | Why (owner voice) |
|---|---|---|
| Structure | From scratch. NOT the 64px icon rail, NOT the vertical white-card stack | "u built this mockup on top of the current dashboard, thats the whole recurring problem... acc make from new" |
| Navigation | ONE nav only: slim labeled sidebar (Focus/Linear style, expanded, workspace switcher + search + labeled items) | "the sidebar thats good... i love this a lot, it looks clean" |
| Second nav | NEVER a bottom action dock or any second nav-shaped bar | "what does this bottom navigation do? now we have two navigation... just clutter" |
| Home hero | People IN THE CHAIR now, several at once; the single dominant object | "put the person in chair, many person... make that main" |
| Revenue | A quiet small stat (with Appointments, Free chairs) top-left under the greeting; never the hero, no gradient hero, no chart on home | "not on board with this revenue today thing, we don't even need that as the main information" |
| Repetition | A person/event appears in EXACTLY ONE place; no right-rail to-dos/live stream restating the page | "a lot of to dos or same information all over and over again" |
| Today list | Small: count + See all + ~2 preview rows, never the full day | "make it a little bit small and maybe theres a see all" |
| Payments | Mark people paid/unpaid inline (bookings.payment_status), green Paid / amber Unpaid chip + Mark paid | "for the two payments to collect, mark in the people if they pay or not" |
| Card accents | NO colored left/right edge bars on cards, ever (occupied vs free = pill + timer text only) | "i hate that... this left side green thingy. never do this ever" |
| Fabrication | Only surfaces traced to real code ship in a mockup (Depicts manifest, mockup-depicts-gate); the generic waiting-queue was rejected as invented | "this waiting thingy, what is this? we don't even have that feature" |
| Open/closed | Workable clock-in/out treatment: green Open pill + closes-time when open; grey + green "Open now" when closed | "i like alot the workable one" |
| Card economy | ONE carded hero per screen; secondary info is BARE TEXT on the canvas (no card/box/pill costume) | "we need breathing space not just everywhere cards or boxes or pill"; council: flat equal-weight blocks = the clutter root cause |
| Pills | One pill spec per context: same height (36) + same font (13.5); no pill-inside-pill wrappers; no divider next to a color contrast | "why are these two different pill sizes and why is there a divider" |
| Rhythm | Binary 16/32 gaps only (16 inside a group, 32 between sections) | "what about the balance... the gaps and space between the bento boxes" |

### Root-cause note (council, 2026-07-15)
"Cluttered" was never element count: it was EQUAL VISUAL WEIGHT , every block wearing the same
card costume with no dominant focal object. Deleting elements can never fix that. The law that
falls out: one hero in a card, everything else quiet bare text, and the hero is the thing the
owner must act on (the live chairs), not a vanity metric.

### LOCKFILE §12 conflict , OWNER DECISION NEEDED
LOCKFILE §12.1 locks the OLD structure (Fresha icon rail, KPI-chart home) and §12.2 locks a blue
primary CTA; this round's approved direction (labeled sidebar, chairs hero, ink CTA) contradicts
both. Per the frozen-row rule nobody re-opens LOCKFILE rows without the owner saying so by name:
**§12.1 structure + §12.2 CTA color need an explicit owner supersede** before the real build.
Until then this TASTE_LOG block is the newer dated owner decision and wins by precedence.

### Applied in code?
- Mockups only (`traced.html` is current). Real `/dashboard` untouched; build starts after the
  owner approves the final mockup + rules on the §12 supersede.

## 2026-07-16, IG-principles round 1: all 12 ADD candidates APPROVED

Owner verbatim: "all approves" (answering the before/after page public/_mockups/ig-principles/index.html, which listed exactly 12 ADD candidates ig1-ig12 out of 217 evaluated principles; the other 205 were ALREADY_EXISTS / CONFLICTS_WITH_LOCK / DONT_ADD, register at public/_mockups/ig-principles/all-verdicts.html).

Reading logged: "all approves" = build all twelve, INCLUDING ig5's candidate symbol (the ink S mark), which the page had flagged as needing a named yes, and including ig8 (the photo-title weight drop) and ig12 (progress-bar activity signal) which I had recommended looking at / skipping. Latest dated owner call wins.

| id | decision | what ships |
|---|---|---|
| ig1 dm-length-beats-symbols | APPROVED | register + reset-password: the 3-item composition checklist becomes one computed strength bar + one exact-cause line; 8-char floor stays (matches the server schema) |
| ig2 dm-preserve-caret-on-autoformat | APPROVED | caret stays put while the Swiss phone formatter reformats (checkout + guest booking) |
| ig3 dm-cursor-pagination-over-offset | APPROVED | /inspo discovery feed moves from offset to a keyset cursor, no repeated cards mid-scroll |
| ig4 dp-crop-bone-shaft-not-joint | APPROVED | gallery uploader gets one framing line; square photo grid crops center-top, not blind center |
| ig5 dp-logo-format-earned-recognition | APPROVED incl. the ink S symbol | one ink-on-white symbol for favicon + PWA icons + manifest colors; the wordmark stays canonical everywhere it fits |
| ig6 dm-two-months-range-picker | APPROVED | DateTimePicker gains the reserved range variant (two adjacent months, shaded span, result pill), wired into settings VacationTab |
| ig7 dp-line-length-measure | APPROVED | the already-approved 68ch reading cap finally applied to SalonAbout, promoted to one shared measure utility |
| ig8 dp-irradiation-illusion | APPROVED | white-on-photo category titles drop 700 to 600 so they read equal to their ink counterparts |
| ig9 dp-stem-matched-icon-stroke | APPROVED | one calibrated icon-stroke-by-size table replaces the three ad-hoc values (1.9 / 2 / 2.2) |
| ig10 dp-grid-matches-content | APPROVED | the grid-type classification step (manuscript / column / modular / hierarchical) enters the law as a pre-layout decision; its dashboard demo folds into the parked operator-home decision, not a separate fork |
| ig11 dp-asymmetric-balance | APPROVED | solen-taste-diagnosis gains a balance collapse-test step |
| ig12 dp-progress-motion-is-status-signal | APPROVED | the one live determinate bar (discovery import) gains an activity signal so a stall reads as stalled, not as done-ish |

Full per-principle reasoning + citations: _design-system/research/IG_PRINCIPLES_VERDICTS_2026-07-16.md.

## 2026-07-17, inputs settled + the rhythm direction

Owner verbatim: "for input decision both a and b2 was the problem i hated that sh 2 continue 3 breathing room is good but those are too bug of a gap"

Reading logged (stated back to the owner in the same turn so a misread surfaces now): for the input decision the answer is a on BOTH questions, and 2b (the ink edge PLUS soft glow) is the thing they hated. Consistent with the standing record: they killed focus rings twice already, furious, 2026-07-01 and 2026-07-02 ("both has focus ring on open").

| id | decision | what it means |
|---|---|---|
| input fill | **a, FILLED GRAY** | Every input is the filled field: #F4F4F5, no hairline, radius 12, going white on focus. The white + #E4E4E7 hairline treatment loses. It was never a decision, it was a leak: components write border-s-border + bg-white classes that the type-targeted base rule silently overrides, which is why /de/booking/lookup shipped BOTH looks on one screen (lookup-code white/16, lookup-email gray/12, measured live 2026-07-17). The dead classes get deleted, not left to fight. |
| input focus | **a, INK EDGE ONLY** | Border darkens to ink, field goes white, nothing else. The soft glow is DEAD, by name, third time. The CLAUDE.md contract row that still writes "ink edge + a single soft halo" is now WRONG and must be corrected to edge-only; the global no-focus-ring gate was right and the doc was stale. |
| page rhythm | **direction: breathe, but much tighter than probed** | "breathing room is good but those are too big of a gap": flat-8 (variant a) is rejected, the page does need air, but +56 (b) and +72 (c) overshot. Re-probe at tighter values. Note the arithmetic the owner is circling: their OWN locked section rhythm is 32 (LOCKFILE 442-450) and the homepage renders 8, so "tighter breathing room" lands almost exactly on the law that already exists. |

## 2026-07-19, booking category pills: BLACK selected + scroll-spy (two owner overrides)

Owner verbatim: "i want the category pills yk on the top to be black bit gray when selected and also not each category having page when u click i want it to scroll down when u click" + confirmed "Actual black / ink" + "ye bro category sections plus scroll".

Scoped to the BOOKING services-step category pills only (custom pills, NOT the shared TabPill, so nothing else's selected-state changes). Verified live 2026-07-19: active pill bg = rgb(10,10,10), scroll-spy follows.

| id | decision | what it means |
|---|---|---|
| booking category pill, selected | **BLACK / ink** | Selected pill = `bg-s-ink text-white`, overriding the LOCKED calm-gray selected state AND the no-black-selected gate (owner picked black when told the lock+gate block it). `selected-ok:` escape on the line. Does NOT reopen gray-selected anywhere else; the 3 prior named exceptions plus this one. |
| booking category pill, behavior | **scroll-spy, not filter** | Clicking a pill SCROLLS to that category's section (all sections render); active pill follows on scroll. REPLACES the Express/Klassisch/Signature duration-tier grouping with CATEGORY sections (the salon's own service subcategories, dynamic). The tap-to-expand row design stays. |

---

## 2026-07-19 , Booking select-step card idiom + the grouped-card radius canon

Owner flagged a cross-page inconsistency in the booking flow: the SERVICES step sits in a bordered grouped card, but the STYLIST step was borderless gap-separated rows (Direction B), so the two select-steps read as different UIs. Owner: "match up" (stylist adopts the services idiom); then on the radius question, "pick whichever the services use."

Investigation surfaced that `rounded-[24px] border border-s-border bg-white shadow-whisper` is an established **grouped LIST-card grammar** shared across 12 call-sites (salon Services / Produkte / Pakete / service-sheet / staff profiles / dashboard + the booking services step). A full audit confirmed all 12 are 24. `shadow-elevation` is a separate, general elevation utility used at many radii by design (SalonCard 22, carousels 22, sidebars 12/14/18, form cards `rounded-card`/16) and is NOT a single-radius family. An earlier pass this turn briefly set services/salon/stylist to 16; that was the odd one out and was reverted to 24.

| id | decision | what it means |
|---|---|---|
| booking stylist step, card | **individual entity cards (NOT a group)** | Owner 2026-07-19 corrected the same-day 'match up': stylists are individual PEOPLE, not a category, so each is its OWN card (`rounded-card border border-s-border bg-white`, flat, gap-2.5, selected `bg-s-bg-sunken` + ink check) , the `SalonResultCard` entity-card grammar. Still gives each stylist a border (the original complaint), but as distinct entity cards. (116aa7f6d) |
| **PRINCIPLE: group card vs individual card** | **semantic, not cosmetic** | A GROUP card = ONE bordered card wrapping MULTIPLE related items as hairline-divided rows (`rounded-[24px]`+`shadow-whisper`) , use when items are members of a CATEGORY (services under "Colors", products). An INDIVIDUAL card = ONE card per DISTINCT ENTITY (a person/stylist, a salon) , gap-separated flat bordered cards (`rounded-card`+border, `SalonResultCard`), never merged into a group. Rule: distinct entities get individual cards; category members get a group card. Don't force entities into a group (owner 2026-07-19: "stylists are individual not groups"). Gated: `entity-card-gate.py`. |
| grouped list-card radius | **24 (`rounded-[24px]`), NOT 16** | The salon/booking grouped LIST-card grammar is 24 (the services grammar the owner pointed at), shared across 12 call-sites. `rounded-card` (16) stays the FORM/summary card (hair/pay/datetime, `shadow-elevation-1`). Two families, told apart by shadow: `shadow-whisper` = 24 list-card, `shadow-elevation` = the diverse-radius utility. |
| enforcement | **card-radius-gate.py (whisper-only)** | PreToolUse gate blocks a NET-NEW `shadow-whisper` card at any radius != 24. `shadow-elevation` intentionally NOT gated (21 legit radii). Escape: `radius-ok:` on the line / `~/.claude/card-radius-skip.flag`. |

---

## 2026-07-19/20 , Salon PDP drift sweep + the see-all intent split + the mockup-format law (the "failed rounds" session)

Five mockup rounds failed before the real work surfaced as a CODE DRIFT SWEEP (the sections had drifted off the same-day §427 lock). Settled calls, all dated + shipped + verified rendered:

| id | decision | what it means |
|---|---|---|
| salon PDP section wrappers | **all §427** | Services / Team / Reviews section wrappers all `overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper`. Team was `rounded-3xl shadow-float`, Reviews `rounded-2xl shadow-float` , swept to the lock, verified rendered (all three measure radius24+border+shadow). |
| see-all, **SPLIT by intent** | **Services/Reviews = gray pill; Team = ink link + chevron** | The pill (owner-approved 2026-07-15) stays on Services/Reviews , a see-all that ENTERS the booking flow earns button affordance. The Team see-all is a light ink link + chevron (beside a busy avatar row a pill read too big/unbalanced). `SeeAllButton` variant `pill` (default) / `link`. NEVER blanket-apply a LOCKFILE row over a component's dated approval , the dated decision wins (this was violated once and the owner caught it: "do you understand WHY I want the pill for that and not for the stylist?"). |
| staff row motion | **NO bounce-hello wave** | The scroll-into-view avatar bounce (translateY -10px, motion-22 idea 8) REJECTED ("staff jumps when u scroll"). Removed; `snap-mandatory` -> `snap-proximity`. Graveyarded. |
| PDP map | **static, no hover-scale** | The `group-hover:scale-[1.02]` on the static map img REJECTED ("it expands"). Removed. Map stays a static image linking out. OPEN forks in QUESTIONS.md: tap behavior + pin accuracy. |
| mockup FORMAT (law) | **live-iframe before/after + measured Diagnosis** | A mockup = BOTH panes live iframes of the SAME real route; AFTER = the change INJECTED on the real page. Every mockup carries a `Diagnosis:` manifest (measured current | violates <law line> | target); no-ops blocked. Abstract A/B panels + hand-drawn Afters are dead formats. Gates: mockup-diagnosis, mockup-fullscreen, mockup-no-flat, mockup-verify-before-show (global), flag-spam (global). |
| reviews section content | **OPEN , direction A recommended** | The "(11)" bare blue count + long stack still un-redesigned. 3 directions defined (A summary-first + count folded into the see-all; B histogram (needs an explicit un-drop, a code comment says owner dropped it); C featured-voice). Owner pick pending. |

## 2026-07-21 , profile reference sprint: the underline tab sanctioned + the on-phone base blessed

| axis | decision | why / record |
|---|---|---|
| content-tab selected state | **SANCTIONED for ALL content tabs: title + 2px ink underline** (active = 18/600 ink + underline; inactive = 18/400 ink-2). Owner verbatim: "i like ths title and underneath line when selected thing we can use in some places" -> picked "All content tabs" in the 3-option ask. | Fills the real law gap that tabs had NO sanctioned selected form (only the gray TabPill row existed, which stays law for pills/chips/options). Split: TABS (navigating between content views) = ink underline; OPTIONS (pills/chips/filters) = calm gray fill. Demo: public/_mockups/pinterest-ref-solen. Does NOT touch the locked TabPill row, the booking date/slot blue, or the one ink commit CTA. |
| mockup on-phone base | **public/_mockups/_BASE.md is LAW for every mockup** (owner picked "Yes, both"). | Born from the phone-diff: geometry was EXACT (avatar 108=108 dev, tile 393=393, sugg 303=303) while the page still read wrong , wireframe greys + Safari chrome + no text-size lock. Base: 402 device constant, boxes /3, fonts by WORD WIDTH, full-coverage diff, text-size-adjust 100%, 100dvh, safe-area, self-hosted REAL photos, final judge = PIL diff of the owner's phone screenshot vs the reference. Gates: mockup-base, no-fake-phone, width-calibration+full-diff, type-budget. |
| app-code fidelity gates | **QUEUED (approved)**: when the real profile build starts, extend the 4-size/2-weight type budget + measured-fidelity checks to the profile components (today they bind only /_mockups/). | Same owner answer ("Yes, both"). |
| gate false-positive fixes | 4 mechanical fixes applied (owner: "Yes, fix all 4"): German scan ignores comments (multi-line HTML + trailing //); resurrection signatures must match RENDERED markup, not comment prose; hue scan skips HTML entities (&#128222; is not a hex); measure-flag TTL 20->60 min. All self-tested block+pass. | These burned ~10 rounds this sprint; the fixes narrow each gate to its real target without weakening it. |
| Looks tab | **KILLED (owner 2026-07-21: "wtf is looks")** , the third profile tab was my carry-over, never an owner pick, and rendered as an empty state. Profile = TWO tabs: Gespeichert / Termine. Do not re-propose without an explicit yes. | Removed from the mockup + the running build brief the same hour. |
| empty states | **REFERENCE-GROUNDED anatomy replaces the grey-disc ritual (owner 2026-07-21: "the empty states thats what i mean... get references more")** , promise headline 18/600 + gesture subline + filled ink CTA + 3D category icon or ghost-preview, on the sunken tray in a living page; NEVER a washed grey Lucide disc. | 12 Mobbin references (Pinterest, Booking, Skyscanner, OpenTable, DoorDash, Peerspace, RTR...) in research/TASTE_EMPTY_STATES.md; 0/12 finished apps use an icon-disc. CLAUDE.md states row amended. |
| **FLOORS LAW** | **owner-approved "Yes, all 5" (2026-07-21)** , the UNFINISHED_AUDIT verdict: the law had only CEILINGS, so the compliance-optimal screen was the emptiest one ("always looks unfinished and ass", owner). Applied: CLAUDE.md FLOORS LAW block (finished-screen 5-pass, imagery ~1/3 floor, density floor/populated-target, edge-visibility + warmth carrier, deletion-names-what-it-keeps, display anchor >= 28 + two-anchor card + tertiary grey) · LOCKFILE §17 (17.1-17.5) · SOURCE §10.0 · CLAUDE.md contract rows imagery/density/shadow-table · mockup-floors-gate.py (self-tested 4/4, wired). | Evidence: research/UNFINISHED_AUDIT_2026-07-21.md (7 files read, 5 root flaws; "what is NOT broken" section protects the ceilings). Ceilings unchanged , do NOT loosen restraint to compensate. Remaining queued from flaw 5: SOURCE §3 in-place literal rewrite + eyebrow triple-contradiction + §21.5 (banner + LOCKFILE precedence cover the conflict meanwhile). |

## 2026-07-24/25 , WALK-IN: the decisions were shipped but never written down (owner: "in walk in did u write it in design file")

Answer: NO, they were not, and the LOCKFILE actively CONTRADICTED them. Recorded now, from the shipped
commits, so the next pass cannot re-litigate or revert them by following stale law.

| Decision | Shipped as | Why |
|---|---|---|
| A walk-in wait is a **FLOOR**, `ab {n} Min` , never a range, never "ca."/"~" | 45b1d8a8c, then 46cba1e58 purged the last `55-70` literal from dead code | A range makes the customer read the WORST number and leave. The floor is a commitment. **This reverses LOCKFILE section 12(a), which is now amended in place.** |
| The live-status bar is **decluttered**, with per-service wait chips instead of one lumped hero number | aafde1ffb | The single hero number could not answer "how long for MY service", which is the only question the bar exists to answer. |
| Exact-position hero WITHOUT a wait range , shipped then **REVERTED** | ff0dceeda shipped, 9a8882c91 reverted | Do not re-propose the position-only hero. It was tried and pulled. |
| Walk-in mode shows ONE stylist section | owner 2026-07-24, in SalonDetailV3's `!walkinMode` guards | The walk-in panel owns its own "Dein Barber" section, so rendering the browse-profile SalonTeam too was a SECOND stylist section on one screen. |

Standing rule extracted: **a walk-in number states what the salon COMMITS to, not what it fears.** Floor over
range, per-service over lumped, and never a number the queue data cannot actually support.

## 2026-07-26 , SalonCard imagery: the A3 photo lock is superseded by FLOORS LAW 2 (owner: "the mock up is approved that you made")

Two of the owner's own decisions contradicted each other on the exact same slot and nobody had
reconciled them: `components-legacy/SalonCard.tsx:152`'s **A3 LOCKED 2026-05-03** ("photos killed
pre-launch, solid category color + Anton name only") versus **FLOORS LAW 2** (2026-07-21, roughly
>= 1/3 photographic area on every browse viewport, imagery = the largest element of every
SalonCard). Line 94 of the same file was already building `allPhotos` from `cover_photo_url` +
`gallery_urls` + a `photos` prop and then deliberately not using it, which is what made the
contradiction visible rather than theoretical.

Shown as a before/after mockup on the real `/de/basel` city page (structure untouched, only the
cover slot's treatment changed):
`_design-system/captures/principles/saloncard-before-after/index.html` (mirrored from the
solen-mobile repo where it was authored). Approved verbatim: **"the mock up is approved that you
made."**

| Decision | Shipped as | Why |
|---|---|---|
| Photos ON for the default-variant card cover (the 5:4 slot on browse/discovery grids) | `SalonCard.tsx`: `allPhotos[photoIndex]` renders via `next/image` (`BLUR_PLACEHOLDER`, existing carousel dots/arrows kept) | FLOORS LAW 2 is dated after the A3 lock and was owner-approved on the exact surface it conflicts with; the later, more specific decision wins per the CLAUDE.md precedence chain. |
| No-photo fallback = **sunken bg + category icon + initial**, not the old 47px Anton placeholder | `SalonCard.tsx` default variant: `bg-s-bg-sunken` + a Lucide category icon (Scissors/Gem/Sparkles by category) + the salon name's first letter at 15px | This is the fallback the LOCKFILE imagery row already specifies ("NEVER a bare grey box, fallback = sunken + category icon + initial"); the old block-plus-47px-name treatment was not closer to that spec, and the 47px placeholder was also the FLATNESS-diagnosis-flagged largest element on the whole screen. Currently unverified live: none of the 20 seeded Basel salons has a null `cover_photo_url` in this dev DB, so the branch is proven by tsc + code review, not a live screenshot. |
| Compact variant (dashboard settings preview, not a customer surface) is **unchanged** | `SalonCard.tsx` compact variant keeps `ImageFallback` + the solid-color cover | Out of scope for this pass: not rendered on any customer browse surface, and `ImageFallback.tsx` is shared with `RecentlyViewed.tsx` (a different, untouched surface), so editing the shared component would ripple beyond the two surfaces this pass covers. |
| Card name (both variants), category filter pills, and the city eyebrow lose the all-caps transform | `SalonCard.tsx` h3/p, `CityPage.tsx` pill `Link`s and eyebrow `span`: `uppercase` (+ compensating `tracking-[...]`) removed; eyebrow font-bold to font-semibold, pills gain explicit font-semibold to hold legibility without caps | No-caps gate (project CLAUDE.md taste rule #10); sizes kept on the existing LOCKFILE ramp (14/12) rather than inventing a new value. |
| Distinct font sizes on the rendered `/de/basel` first viewport: 6 to 4 | Removing the 47px placeholder (subsumed by the photo/fallback change) was sufficient; 25 (h1) / 15 (name) / 14 (body: subtitle, pills, meta, price, rating) / 12 (eyebrow, rating count, "Neu" badge) already sit on the LOCKFILE ramp | The pre-fix "13px" the orchestrator's own baseline measurement implied needed merging with 14 turned out to be the cookie-consent banner's paragraph text (`text-[13px] md:text-[14px]`), a separate shared component outside this pass's scope, not a SalonCard/CityPage size. Confirmed by toggling the banner and re-measuring: content-only sizes were already 5 (then 4) without it. |
| The `★ Top` / `Walk-in` badges (`components-legacy/ui/SalonBadge.tsx`) **keep** their all-caps transform | Untouched | Out of the two-item "other two" scope the owner's ask named (category pills + city eyebrow); `SalonBadge` is a separate shared component also used on the owner's `/dashboard/badge-manager` page. Measured result: caps count on `/de/basel` dropped from 56 to 10, and all 10 remaining are this badge (7x "Top", 3x "Walk-in"). Flagged, not silently fixed. |
| Dot/arrow carousel click handlers | Untouched (still call `scrollContainerRef.current?.scrollTo(...)` against a ref that is never attached to any element, and never call `setPhotoIndex`) | Pre-existing dead state from the A3-era orphan comment, not a regression from turning photos on; fixing it is a structural change outside this pass's "treatment only" scope. Flagged as a follow-up. |

Measured on the rendered `/de/basel` page at 390x844 (banner dismissed, matching the content-only
comparison): imagery 0.0% to ~44%, sizes [47,25,15,14,13,12] to [25,15,14,12] (6 to 4), caps 56 to
10 (all 10 remaining are the out-of-scope SalonBadge).
## 2026-07-24 to 07-26 , the motion + consistency week, recorded by the weekly law pass

These are dated owner decisions that were APPLIED in code and written into the file that owns each axis,
but never entered this log, which is the record of what the founder actually said. Each row POINTS at the
owning file rather than restating its numbers, so there is exactly one place to update when a value moves.

| Decision | Owner, verbatim | Owning law file | Record |
|---|---|---|---|
| **The book label follows the JOB, not the surface.** `Jetzt buchen` is retired into `Termin buchen`; list row `Buchen`, picker row `Auswählen`, walk-in queue `Anstehen`. | "we have so many variations of it, like book... we need consistencies and we don't have that." | LOCKFILE §6 CTAs (amended by the weekly pass, which found it still preferring the retired label) + REMOVED.md | 62f14b274, 2026-07-25 |
| **Review dates are day-month-year, with no weekday and no time.** Fixed in the one shared helper so every caller inherits it; locale-correct via `Intl`, never hardcoded month names. | "I don't like how the dates, it's so detailed, how many hours and what weekday it is... we need just, like, the sixth June twenty twenty six" | NONE , this log is its only home. It is a copy/format rule with no owning section; if a date-format row is ever added to LOCKFILE §6, move it there and leave a pointer. | a7f0c92e1, 2026-07-25 |
| **Photo-grid overflow is a SMALL bottom-right badge on the ninth tile**, frost + ink + tabular numerals, non-interactive. NOT the full-tile black scrim with big centred text that shipped before. | "when there's more than nine, that it says plus how many are left on the last picture, on the right down" | COMPONENT_REGISTRY SalonPortfolio row says "+N overlay on last tile", which is true but does not distinguish badge from scrim. This row is the tiebreak. | a7f0c92e1, 2026-07-25 |
| **THE SPEED LAW** , three tiers, chosen by the JOB not the surface. | "ok approved" (to the two-tier recommendation; the third tier is the press tier it implied) | MOTION.md "THE SPEED LAW" | 2ae07fc45, 2026-07-25 |
| **The enter recipe retimes 420ms -> 280ms, blur kept.** Picked off a live three-column side-by-side, not off a description. | picked 280ms with the blur intact, in demo 7 | MOTION.md ENTER RECIPE | dbaf2aa65 + ca3c569d0, 2026-07-26 |
| **Map basemap reads LIGHT**: labels and POI back ON, light-grey buildings, white land. Reverses both the label-strip and the dark-buildings rounds of the same day. | reference image IMG_6693 | LOCKFILE §13 basemap block (already carries the full flag list + the constructor-config mechanism) | 5fa0ae51e, 2026-07-24 |

Two PROCESS decisions from the same week, which are not about any one screen and so have no other home:

- **Speed is decided by a visual the owner FEELS, never by a question.** Verbatim, 2026-07-25: "I'm not
  really sure about the speed because I'm not used to that, and I don't really know. So don't ask me about
  that one. SHOW ME A VISUAL so I can visualize." Building the side-by-side IS the answer. This is why the
  280ms retiming above is a pick off demo 7 rather than a number anyone proposed.
- **SwiftUI is an IDEA SOURCE, not a target.** Verbatim, 2026-07-25: "we're not gonna use SwiftUI itself,
  but we're gonna have ideas, and we can copy a few stuff". The law targets web; SwiftUI's vocabulary is
  mined for concepts, never for APIs.

---

## 2026-07-29 to 07-31 , the writing week: register goes formal, and the law that came out of it

Recorded 2026-08-03 by the weekly law pass. Same discipline as the block above: each row POINTS at the
file that owns the axis instead of restating its values, so there is one place to update when something
moves. **extends** the 07-24/26 block; supersedes nothing in it.

| Decision | Owner, verbatim | Owning law file | Record |
|---|---|---|---|
| **Register goes FORMAL, and it is not only German.** `Sie` (de), `Lei` (it), `vous` (fr). English keeps one register and stays plain. The owner said German; the sweep found the four locales had been contradicting each other the whole time, so the same call settles all three. | *"make it the Sie instead of the du"* | `_design-system/COPY_LAW.md` §1 (register table, the measured starting point, and the counter-evidence that Swiss consumer brands lean the other way , recorded once so it is not re-argued) | 69fc74d65 (de: 330 swapped + 161 hand-conjugated), a0423867d (it -> Lei, fr -> vous), and the round-2/3 sweeps 26c025cf5, c0ce6e64e, 597f4cf33, 9dc798ec8 , 2026-07-29 to 07-31 |
| **There must be a written law for HOW we write, not just how much.** The Copy economy block governs LENGTH; nothing decided register, sentence shape, punctuation, number/date/money format, or per-string-type voice, and nothing covered French or Italian at all. | *"research everything and make a whole principle about, like, when you're writing something, how to do it and stuff"* | `_design-system/COPY_LAW.md`, 9 sections. It is the canonical WRITING law; `SOURCE.md` §18 is now the Solen-specific pattern table only and defers to it (annotated 2026-08-03) | a289a2154, 2026-07-29 |

**Not an owner decision, flagged here so it is not mistaken for one:** the Italian button-label carve-out
(`COPY_LAW.md` §6b, 2026-07-31) , Italian buttons and nav labels stay in the bare imperative (`Salva`,
not `Salvi`) because Italian has no infinitive that works as a neutral label, the way German's does. That
was applied as the default rather than parked, because the alternative had no defensible version and
waiting would have blocked the sweep. **It is awaiting a yes or a no**; reversing it is 559 mechanical
edits and §6b is the record of why it was not done.


## 2026-08-09, the ten open decisions, answered in one message (owner verbatim)

His words: *"1 A but is it legal 2 A 3A 4B like google maps 5A 6 C 7C 8A i approve for every salon
9 a 10 A like short n if its too long tap to expand yk"*

| # | decision | his answer | mine was |
|---|---|---|---|
| 1 | salon sign-up: keep the contact email and the Google listing it finds | **A, save both** (asked: is it legal) | A |
| 2 | dashboard home revenue card: add a week/month switch | **A, stay weekly**, the Umsatz page keeps the switch | A |
| 3 | search-as-you-type price under a salon | **A, price of the searched treatment**, none when nothing matched | A |
| 4 | who can leave a star rating | **B, anyone signed in, like Google Maps** | A (visit-gated) , OVERRULED |
| 5 | the small label above a section heading | **A, keep it, card-meta size** | A |
| 6 | discount-code box on the payment screen | **C, only for salons with a live code** | C |
| 7 | the small text above a form input | **C, drop the label, bigger black question above the box (Uber)** | A (keep as today) , OVERRULED |
| 8 | does a new salon go live by itself | **A, he approves every salon**, verbatim *"i approve for every salon"* | A |
| 9 | advice panel on the salon owner dashboard | **A, build it now** | C (park until real history) , OVERRULED |
| 10 | service descriptions on the salon page | **A, tap to open**, verbatim *"short n if its too long tap to expand"* | C (salon page first) |

**Three overrules, and they point the same way.** On 4, 7 and 9 I picked the cautious option and he
picked the one that ships something. 4 and 9 I argued from a risk that has not happened yet (fake
ratings, invented advice); 7 I argued from an existing lock. His pattern across all three is to
prefer the version a user can see over the version that is safe to defend.

**Decision 4 carries a real cost he accepted by choosing it**, stated once here so it is on the
record: open ratings on a small salon list means one wave of fake ones moves the number people book
on. I offered the containment twice, and he refused it twice. Asked again in a follow-up whether to
add a "Verified visit" mark, the answer was verbatim: *"no no real visit check jst normal su bro"*.

**So the rating is plain and open. No visit check, no verified mark, no gating of the score.**
Anyone signed in can rate any salon, exactly like Google Maps, which is the reference he named. This
line exists so a future session does not helpfully re-add the containment he has now rejected twice.
Re-opening it needs him saying so by name.

**Decision 7 supersedes the input-label row by his own instruction.** The field itself stays as
locked on 2026-08-09 (white fill, grey resting line, nothing on tap). What changes is the LABEL
above it: gone, replaced by a larger ink question.


## 2026-08-09, decision 1 answered: yes it is legal, with two conditions

He picked A (save both the salon's contact email and the Google listing) and asked *"but is it
legal"*. Checked against the source rather than answered from memory:

**The Google listing: storing the place ID is explicitly allowed, indefinitely.** Google's own
Places policy says the place ID *"is exempt from the caching restrictions"* and *"you can therefore
store place ID values indefinitely"*. Everything else from Places (the name, address, phone,
rating) may only be cached about 30 days. So the rule for us is simple: **store the ID, never the
copied details.** Anything else we show has to be fetched fresh or be our own data.

**The contact email: ordinary business data, and lawful on the basis he is already on.** It is
given by a salon to be contacted about their own listing, which is the contract they are entering.
Under Swiss revDSG and GDPR that needs three things we control: say what it is for at the point they
type it, do not use it for marketing without a separate opt-in, and delete it when the salon leaves.

**Not legal advice, and the boundary is worth stating**: the Google term is quoted from Google's
published policy and is checkable; the Swiss and EU part is the standard reading of a B2B contact
field and is not a lawyer's sign-off.

Sources: [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies) ,
[Maps Platform service terms](https://cloud.google.com/maps-platform/terms/maps-service-terms)

## 2026-08-09, his standing ask: stop re-asking what is already settled

Verbatim: *"you actually, like, remember my preferences? It seems like you estimate every time,
like, it becomes, like, a big exhausting."*

**Measured, and part of it is a check of mine rather than forgetfulness.** `ask-before-loop-gate`
demands a question before any fan-out, and it accepted exactly one proof: asking him again. It has
forced a question **40 times across sessions, 7 in this one, twice in a single turn**. On anything
already settled in writing, that converts "I looked it up" into "I made him answer it twice".

**Changed the same turn: reading the record now satisfies it too.** Opening TASTE_LOG, PREFERENCES,
the graveyard, LOCKFILE or the decisions record counts as having done the work. Asking is still
correct for something genuinely unsettled; it is no longer the only way through.

**Where his settled answers live, so a future session looks before it asks:** this file for taste
and product decisions, `REMOVED.md` for things he has killed, `LOCKFILE.md` for frozen values,
`PREFERENCES.md` for how he wants work done.


## 2026-08-21, login screen: he approved the stripped version (variant B)

He shared a Quizlet login and asked: *"make the login uncluttered n like ths no blue but yk simple
and shapes n colors yk"*. Then, on the mockup: *"B but the apple google sh not monochrome and also
more up bro"* and *"and what abt create account"*. Approved with **"approved"**.

| axis | decision |
|---|---|
| login inputs | **grey fill `#F4F4F5`, NO border.** SUPERSEDES the 2026-08-09 white-fill-plus-hairline decision FOR THIS SCREEN. The no-focus-treatment half of 08-09 STANDS: tapping a field still changes nothing visible, no ring, no halo, no colour change. |
| forgot password | ink `#0A0A0A`, underlined. No longer blue `#276EF1`. |
| the two ways in | **must not match.** Apple = ink fill, white label. Google = `bg-s-bg-sunken`, ink label, no border. Measured cause: they matched on all 5 properties compared (342x56, radius 99, white, same 1px hairline), so they read as one button printed twice. |
| brand marks | the REAL svgs already in `SignIn.tsx`. He rejected hand-drawn stand-ins by name: *"fk are those colors"*, after I drew a blue letter G in a circle and a white disc behind the Apple glyph. Real icons only, never approximations. |
| the divider | **the "oder" rule is dead.** The empty gap between the two groups does that job, which is what the reference does. |
| the terms line | off the login screen. It belongs where an account is created. |
| the subtitle | off. It explains what signing in is, to someone who already tapped sign in. |
| the two ways in, position | pushed down but NOT pinned to the floor. A fixed 120px gap above them, never flex-grow. |
| create account | stays, below the two buttons. It was never missing, it was buried under the fold with the cookie banner over it. |

**What the reference actually contributed, measured rather than eyeballed.** PIL-sampled his
screenshot (881x1999) after pixel-spec-auto failed on it: side margin 56px scales to 25 at our 390
(ours is 24), field width 768 scales to 340 (ours is 342), field height scales to 56 (ours is 56).
So the sizes were ALREADY the same. The only real difference was an empty band of 548px, 27% of the
screen, between the forgot link and the first social button. The gap was the whole effect.


## 2026-08-10, the three top-bar controls, settled by him after I guessed wrong

His words: *"the back button maybe, like, a circle, or the x button, that, like, the circle too and
just an x button. And, yeah, and also, like, shadow. And, also, the hamburger menu too."*

I read "and the hamburger menu too" as "a circle too" and made all three circles. His correction,
verbatim: *"hamburger mini, make it, keep it fucking square. Are you dumb? And I told to make
fucking shadows."*

**LOCKED, so nobody re-guesses it:**

| control | shape | fill | edge |
|---|---|---|---|
| back | **circle** | white | hairline + whisper shadow |
| close / X | **circle** | white | hairline + whisper shadow |
| hamburger | **SQUARE** (`rounded-input`) | white | hairline + whisper shadow |

**The shadow is on all three.** That was the part of "the hamburger too" that he did mean.

**Why the hairline stays under the shadow, measured:** Qonto's circles carry no border because they
sit on a grey page (#F6F6F6) and the shadow separates them. Ours sit on white, where a low soft
shadow is nearly invisible, which is the grey haze the contract bans by name. Reference:
`_design-system/references/qonto--onboarding.md`.

**The reading error worth keeping, because it is the general case:** he listed three controls with
DIFFERENT treatments in one sentence, and I collapsed them into one treatment. When an instruction
names several things at once, the readback has to carry his words per thing, not my summary of all
of them.
---

## 2026-08-03 to 2026-08-10 , the account-hub week, recorded off UNMERGED branches

Recorded 2026-08-10 by the weekly law pass. **extends** the 07-24/26 and 07-29/31 blocks; supersedes
nothing in either.

**Read the caveat before the table.** Every decision below was made by the owner, verbatim, and applied
in real shipping components , and **none of it is on `main`.** It sits on five unmerged branches
(`agent-flow-design-overhaul-2af2c2` 236 commits, `security-audit-principles-a877df` 72,
`principles-security-audit-0ae738` 67, `preference-analysis-gates-620a8d` 29,
`airbnb-animated-icons-ee4329` 25). So this block is a record of what he DECIDED, not a description of
what the live site does. Anyone building on `main` today will find the old treatment still there and
must not read that as permission to keep it. This is the third consecutive pass to flag stranded branch
work (07-27 D5, 08-03 D5); it is now five branches instead of one, and it is why these decisions had to
be harvested from commit messages rather than from any law file.

The account hub is the spine of the week. Six of these are one screen, corrected six times.

| Decision | Owner, verbatim | Where it lives | Record |
|---|---|---|---|
| **A destination page carries no browse chrome.** The notification bell and the hamburger are off the account hub. Its own rows ARE its navigation; a bell about something elsewhere belongs to a different screen's job. | *"why is the notification inside and the hamburger menu inside a fucking profile page? I told you like ten fucking times."* | This log. The cause was structural, not taste: `Header.tsx` exempted home, category, search and `/inspo`, and the account hub fell into the leftover "deep page" branch **by omission, never by decision**. | `9bc96089b`, 2026-08-03 |
| **No box on an account hub, and never a box plus a per-row hairline.** | *"why the fuck is this still boxing?"* | Already law , `LOCKFILE.md` §17.2 names an account hub as a surface that gets NO container and says "never both". This row exists because the law was right and the code shipped both anyway for days. | `caad3e93e`, 2026-08-03 |
| **The back control is a filled grey circle with NO border**, and the grey tile behind every row glyph is gone. | *"then fucking fix it."* | This log. Measured, not picked: the reference back control is 39.7pt filled `#F2F2F2` with no border; ours was a 44px rounded square with a hairline. The 44px hit box STAYS (the touch floor outranks matching 40 exactly); the visible circle sits inside it. The icon tiles were also the dead-grey FLOORS LAW 4 forbids. | `0e5e9e2c7`, 2026-08-03 |
| **The pink `#FF3366` heart is out of the account hub nav row.** `#FF3366` remains the save-heart token everywhere it actually means "saved by you"; on a navigation row it was decoration wearing a semantic colour. | *"why is heart icon pink n how did u not flag it ever wtf."* | This log, alongside taste rule 4 (semantic colour is independent of the accent) , this is the boundary case that rule did not state: a semantic colour used where the semantics do not apply. | `fc07dccc8`, 2026-08-03 |
| **Row glyphs 19 -> 22px; a subline that only restates its own label is cut.** Five sublines stay because they carry live data (next appointment, saved card, active vouchers, saved stores, stamps). | *"alot better but icon should be abit bigger and i dont think every settings needs explanation."* | This log + Copy economy rule 1 (delete each word, see whether the meaning survives). Grounded: the captured reference measures 17.3-22.7pt per glyph, so 19 sat at the bottom of the band. | `11de048e1`, 2026-08-05 |
| **OVERHAUL MEANS STRUCTURE, not treatment.** Deciding which rows earn their place and in what order. Swapping the container, the divider, the icon and the label size is a treatment pass, and calling it an overhaul four rounds running is the failure this row exists to name. | *"I told you I want to overhaul it completely. But you didn't change any single fucking bit. You keep the structure. You keep everything."* | This log. It is a standing directive about a WORD, so it has no owning design file; it belongs beside `feedback_structure_vs_treatment`. Cause named honestly in the commit: treatment is the safe half, every change reverses, nothing can be wrong because nothing was invented. | `21b1357d8`, 2026-08-03 |
| **1:1 against a reference means measuring both sides, then tabling the differences**, before any rebuild. | *"every single part of it does not look like the reference at all. I need you to actually make it one to one. Especially analyzing, understanding what we're doing differently."* | `_design-system/references/airbnb--profile-1to1-diff.md` (on branch). Restates NEVER-AGAIN floor 5 in the owner's own words, so floor 5 stays canonical and this is the dated confirmation. | `e6e629d3b`, 2026-08-03 |
| **Top-bar controls are circles with a shadow** , back and close only. **The hamburger stays a SQUARE** and gets the shadow, not the shape. The border is KEPT alongside the shadow, not swapped for it: our controls sit on white, where a soft shadow alone is close to invisible. | *"and also, like, shadow"* (on keeping the border), then the correction *"keep the hamburger square"* | This log. Note the self-caught misread in `38e0f08ec`: "and the hamburger too" was read as "a circle too" and was not checked. | `b8df62383` + `38e0f08ec`, 2026-08-10 |
| **A sheet open is three staged acts, not one fade.** Old content leaves (~150ms), an EMPTY container travels (~150ms), and only then does content fade up, staggered. Content must be ABSENT during the travel, not carried along. | *"it's all already over there instead of everything fading up."* | **NOWHERE , this is a motion law with no home.** `MOTION.md` has no staged-choreography entry. If a choreography section is ever added there, move this row and leave a pointer. | `b66d492bc`, 2026-08-03 |
| **Every Lucide terminal is butt/miter, never round.** One rule in `globals.css` rather than 191 call sites; five hand-written inline SVGs squared by hand because CSS could not reach them. `beauty-icons.tsx` excluded by name. | no verbatim quote , the commit records "the three changes the owner approved" without quoting him. **Recorded as approved-but-unquoted; if this was never actually approved, say so and it comes out.** | This log. Measured: the reference runs butt/miter across 18+ instances with zero exceptions, we ran round across 117+ with zero exceptions, purely because it is a Lucide default nobody ever touched. | `c198042f1`, 2026-08-05 |
| **The `Wo?` search field keeps white fill + hairline**; a proposed switch to grey fill was OVERRULED. | no verbatim quote , commit records only "He overruled my grey recommendation." | This log, so the grey fill is not re-proposed. | `db2a45ca8`, 2026-08-03 |

**Standing rule extracted, and it is about this log rather than about a screen:** a decision that exists
only in a commit message on an unmerged branch is not in the law, and the next session will contradict
it. Six of the eleven rows above are the same screen corrected repeatedly, with *"I told you like ten
fucking times"* attached to one of them. That is the cost, stated in his words.

## 2026-08-12 , AIRBNB BECOMES THE SOURCE OF TRUTH, replacing Fresha-for-structure / Uber-for-aesthetic

**Owner, verbatim:** "airbnb te is source of truth", and in the same answer "no apply mockups i told
u". He was answering a question that quoted the rule being replaced and named the precedent against
it, so this is a decision taken with the collision in front of him, not a stray remark.

**What it replaces.** CLAUDE.md carried a rule labelled THE most important one: structure from
Fresha via the capture skill, aesthetic from Uber via the LOCKFILE. Airbnb is neither. That line now
names Airbnb on both axes and says so, with the old text quoted inside it so nobody has to guess
what changed.

**What it does NOT replace, and he did not ask it to.** A taste source cannot outrank a floor:
WCAG AA, nFADP/GDPR, the price-indication rule, the FLOORS LAW minimums, no dark mode on web, no
fabricated data, and any dated decision in this log that he made by name. Where Airbnb collides with
one of those it is surfaced as a conflict, which is how `references/AIRBNB_SYSTEM_VS_OURS.md`
already handles its seven.

**The precedent this has to live with.** On 2026-07-31 he killed a pill border that had been copied
from Airbnb, by name. So "Airbnb is the source of truth" does not mean every Airbnb detail survives
contact with him; it means Airbnb is where proposals now come FROM, and he still judges each one.

**Scope he set in the same exchange:** all 94 customer screens outside the dashboard, one screen at
a time, screens with no Airbnb counterpart graded against our own floors, and the design principles
themselves in scope for improvement, not just the screens.

---

## 2026-08-14 , the salon card photo shape stays as it ships. He picked A.

**Owner, verbatim:** "A", answering a three-stop toggle on the live home screen.

**The question, and why it existed at all.** Eight unmerged branches each carry their own
`SalonCard.tsx` and every file differs. Measured across all nine versions including main, corner,
shadow, name size and name weight are the same everywhere. The only visible disagreement is the
photo shape, and it splits 3 to 6: `aspect-[5/4]` on main, `6/5` on the other six.

**Measured on the rendered home card at 402pt, all three in the same session:**

| stop | ratio | rendered | what it is |
|---|---|---|---|
| **A (picked)** | 5/4 = 1.25 | 239 x 191 | what ships today |
| B | 6/5 = 1.20 | 239 x 199 | what six branches settled on |
| C | 20/19 = 1.053 | 239 x 227 | Airbnb's own card, measured 2026-07-28 |

**A and B are 8px apart, which is why C was added.** Two options that differ by 8px on a phone are
not a choice anyone can see, and handing him an invisible A/B is how a decision round gets wasted.
C put a genuinely different shape on the table so the pick meant something. He still chose A.

**What this settles, beyond one file.** The six branches' 6/5 is REJECTED by name, so none of the
eight competing SalonCards has anything left to contribute on shape, and the shape axis of that
clash is closed rather than pending. Airbnb being the source of truth (2026-08-12) did not carry the
card shape with it, which is the same pattern as the pill border he killed on 2026-07-31: Airbnb is
where proposals come from, and he judges each one.

**Where it was decided:** `/de/dev/mock/card-shape`, the real home screen with a three-stop toggle,
built under the mockup definition in `public/_mockups/_BASE.md`.

---

## 2026-08-14 , the branch versions of a screen lose to what ships. He picked "Now".

**Owner, verbatim:** "fice version keep now", answering the five-stop toggle on the search results
screen at `/de/dev/mock/versions/search`.

**What he was choosing between.** Five real renders of five real versions of `SearchTemplate.tsx`,
each written into the tree, rendered by the dev server at 402pt and photographed. Pixel diff against
what ships: v2 69.3%, v3 47.6%, v4 49.6%, v5 69.3% of the frame. The biggest rival is carried by 33
unmerged branches.

**Why this decision is bigger than one screen.** Measured the same hour across all 55 clashing
screens, by comparing the last commit date of every branch's copy of each file against main's: what
ships is the NEWEST version on 53 of them. The competing versions are older snapshots, not
alternative designs, so adopting one means going backwards. The home inspiration row is the clean
illustration: the live version is the only one of eleven that renders the creator handle and the
from-price under each card, and the largest rival group is from 17 July without it.

**The standing rule this sets, until he says otherwise:** on a screen where the live version is the
newest, the branch copies are history and are not re-proposed. The only screen measured with a
genuinely newer branch copy is `app/[locale]/coming-soon/page.tsx` (quirky-ellis 2026-07-23 against
main 2026-07-17), and that one is still his to look at.

**Where it was decided:** `/de/dev/mock/versions/search`, five stops, English labels, built under the
mockup definition in `public/_mockups/_BASE.md`.

---

## 2026-08-14 , no grey box behind an icon, anywhere. And sparkles is dead.

**Owner, verbatim, in three steps:** "i told you never use that spark sh it makes no scence harden",
then "it still using this gray box inside icon sh i never want this anywhere redesign", then "4" on
the icon toggle and "2" on the business-teaser toggle.

**What the icon looks like now, picked from five rendered stops:** the glyph sits on the page at
**64px, stroke 1.25, ink**, with nothing behind it. No tile, no disc, no outline ring. Applied to
every screen that had one: coming-soon, the loyalty stamp card, both walk-in queue end states, and
recently-viewed.

**The one exception, and it is a real one:** the brand page's logo FALLBACK is a grey square showing
an initial, not a glyph. The imagery floor requires a fallback there. It carries an inline
`drift-ok` note so the check can tell the difference.

**Sparkles and zap are gone from all thirteen real files** and replaced by glyphs that say what the
thing is: hand for nails, clock for coming-soon, check for a confirmation, gem for a loyalty tier,
tag for a deal, bot for the AI panels, droplets for waxing, rocket for the speed claim, timer for a
48-hour offer, badge-percent for a referral discount.

**The home page's business block lost its placeholder.** He removed the real illustration on
2026-05-26 (V3-D166), the code kept a grey square with a picture glyph "while a replacement is in
flight", and the replacement never came. Measured before deleting: 723pt tall on a 402pt phone, and
325pt after, so more than half the section was empty grey. The slot is NOT refilled with another
picture: the imagery floor and the no-decorative-image gate both say that slot is real salon content
or nothing.

**Enforced, not just recorded:** the existing design-drift check gained A25 (a grey tile behind a
glyph, floor 64px, tappable things skipped so the back button survives) and A26 (sparkles and zap by
name). No new gate was added. Driven end to end: adding either one is refused, the back button and a
plain icon pass.

**Where it was decided:** `/de/dev/mock/versions/coming-soon-icon` (five stops) and
`/de/dev/mock/versions/business-teaser` (three stops).
---

## 2026-08-09 to 2026-08-16 , the home / search-panel / chrome weeks, ON `main` and unrecorded

Recorded 2026-08-17 by the weekly law pass. **extends** the 2026-08-09, 08-12 and 08-14 blocks above,
which already hold six of this window's decisions; supersedes nothing in any of them.

**These ARE live.** Unlike the branch block below, every row here is on `main` and is what the site
does today. `main` took 306 commits in this window (383 including the merge of
`agent-flow-design-overhaul-2af2c2`), and this log had recorded six of them.

Rows marked approved-but-unquoted carry no verbatim from him; the commit records a pick, an approval or
a rejection without quoting him. Labelled, not dressed up as his words.

### Home feed and its sections (2026-08-14 to 08-16)

| # | Decision | Owner, verbatim | Record |
|---|---|---|---|
| M1 | Popular looks ships as **variant B**: the look name sits on the photo in a solid white pill, no blur, no border. The TikTok credit badge comes off the photo; the creator's name stays beside the price. | *"Remove the TikTok part thingy"* | `041c09674`, 08-16 |
| M2 | **All 26 stacked section versions rejected**, then one design named per section: Looks takes the Inspo card anatomy at 9:16 (not a 150 square), no TikTok badge, no black gradient, elevation-3 instead; Walk-in leads with the waiting count at 30px with colour-coded marks and `walkin.png` back; Reviews go 260x147 with the read-more inline in the quote. | approved-but-unquoted | `2ceddbd91`, 08-16 |
| M4 | **Popular looks and Find your inspiration merge into one looks section.** Measured: same query, same eight image ids, two headings. | *"doesn't make any sense"* | `e848dd9c7`, 08-15 |
| M5 | The Recently-viewed row renders through the page's own `SalonCard`, not a smaller bespoke card. Measured: his card 242x194 against mine at 112x90 on the same screen. Confirms FLOORS LAW 8 and 9. | *"make it like this"* · *"a normal section of the page"* | `87cf6e193`, 08-15 |
| M6 | **The square 86x86 tile row (`RecentlyViewedTiles`) is deleted from the homepage**, said twice: hiding it inside a mockup was not what remove meant. Square photo tiles rejected by name again; every direction uses our 5:4. | approved-but-unquoted | `f614fa3e9`, `721b25f77`, 08-15 |
| M7 | **Continue card = direction A**, reading as a sentence over two lines ("Continue searching for skin fades in Basel") with service and place in ink and a quiet lead-in. The grey page band under it is removed: on our white page it reads as a divider. | approved-but-unquoted | `20c3f0683`, `1a63b0dff`, 08-15 |
| M8 | **Every block sits on the page's own 16px left line**, not Airbnb's 23.6pt gutter. The card keeps its shadow and drops its border. The category-pill LABEL goes 14 -> 13 while the icons stay 28. | approved-but-unquoted (he drew a red line down the left of the screenshot) | `fa5039d79`, 08-15 |
| M9 | Continue-card corrections: not that tall (104px), no square photo (our 5/4), no dates or weekdays, no head count, no stacked photos (one photo), A shows the search itself and not a category, C uses fewer words, and the see-all is the circular Lucide arrow button this page already uses , a text link there was the inconsistency. | approved-but-unquoted | `588c1bb90`, 08-15 |
| M10 | The city line comes OFF the continue card (all 20 salons are in one city, so it says nothing). The card gets TALLER, explicitly not wider. Category-pill icons shrink: 28px inside a 40px pill was 55% bigger than the reference's 18.4pt. | approved-but-unquoted | `150ac548e`, 08-15 |
| M11 | The stylist row moves to the BOTTOM of the home feed, and the top card's photo becomes three fanned photos. **The stacked photos were reversed by him the next round (M9).** | approved-but-unquoted | `5dd12e4c8`, 08-15 |
| M12 | The recent-search **icon stands alone at 26px with no container** , the 87x70 sunken rectangle standing in for a photo is gone, because a search is not a place. And the salon card's price goes 12/400 grey to **12/600 ink**, so the card carries two ink anchors again. | *"not balanced ... it looks empty"* | `d89dafdee`, 08-15 |
| M13 | For a card on white with no photo: the sunken tray is rejected by name, the hairline is rejected, and elevation-2 is invisible to him, so the card steps to **elevation-3** as a documented deviation from FLOORS LAW 4. Whether the surface table gains a "card on white with no photo" row is his call, not mine. | approved-but-unquoted | `0762366f0`, 08-15 |
| M15 | The "Solen for your business" block does not belong on the mobile home , desktop only. Measured 0 height on a phone against 401pt on desktop. | approved-but-unquoted | `77b268979`, 08-14 |
| M14 | Delete the `/business` and `/fuer-salons` page files, keep the redirects. (Decision dated 08-14 in the body.) | approved-but-unquoted | `58db2c974`, 08-15 |

### Category icons (2026-08-10 to 08-14) , still OPEN

| # | Decision | Owner, verbatim | Record |
|---|---|---|---|
| M16 | **Five proposed icon styles rejected in a row:** 3D in colour, gloss on the circle, gloss on the glyph, a generated coral set, and the generated BLACK set. The family is back to the two sets already in the repo and the question is still open. | approved-but-unquoted | `77b268979`, 08-14 |
| M22 | Category icons: black, flat, normal. One row, four solid black silhouettes, no colour, no shine, no gradient, no options; the coral set and the three gloss versions deleted. **Later rejected, see M16.** | approved-but-unquoted | `e68db7b84`, 08-12 |
| M23 | Gloss belongs on the ICON, never on the pill or container; the container stays plain in every variant. | approved-but-unquoted | `fcbff0e92`, 08-12 |
| M24 | Every category icon must mean its own category: a diamond is not a nail, and hair salon and barbershop may not share one scissors. | approved-but-unquoted | `d2ffb8db6`, 08-12 |
| M25 | 2D, not 3D: the 3D renders come out of the search panel. Colour is sampled off the 2D set we own, which is monochrome coral, so per-category colour contradicts that set. | approved-but-unquoted | `1a49c87b9`, 08-12 |
| M26 | The category rows use the drawn icon set already in the repo, and each tile's colour is READ OFF its own drawing rather than chosen (dryer hue 90, chair 50, polish 20, leaf 120; one lightness and one chroma across the set). | approved-but-unquoted | `6b71e5e73`, 08-12 |
| M47 | **His own icon artwork is what ships** , barber chair, hair dryer, nail polish, spa stones, extracted from `solen-icon-motion.html` , not the old 1254px PNGs. | approved-but-unquoted (he named the branch) | `24927506e`, 08-10 |

### Search panel and search field (2026-08-11 to 08-12)

| # | Decision | Owner, verbatim | Record |
|---|---|---|---|
| M27 | Search-panel batch approved: salon rows carry the cover photo, gold star and rating value and **no review count**; category tiles take the computed tint system; the look card takes Inspo's own 9:16 (not squeezed to 3:4) with a two-line title; the section heading becomes the way into the Inspo feed (ink + chevron). | approved-but-unquoted | `d97bb4d4e`, `7ec174f8b`, `3992908f2`, 08-12 |
| M32 | **The search field is variant B** , a white box with the back arrow INSIDE it on the left , with our own grey hairline instead of the reference's near-black (56 tall, radius 15). Settles the service field and the `Wo?` field as one control. | *"B but not black like gray sh yk."* | `a4e2cde2f`, 08-11 |
| M33 | Earlier the same day he picked variant A: filled grey capsule, back chevron OUTSIDE the field, clear on a soft disc inside. **Superseded by M32 the same evening.** | approved-but-unquoted (one letter) | `f4905a364`, 08-11 |
| M34 | **Revert the search-panel body**: recents, popular stores with live addresses, categories, then the "Für dich" look grid. A live rejection outranks the earlier one-list approval. What stays killed: the loading dots, the old no-result state, keyboard-on-open, and the hardcoded eight-city list. | *"Revert whats inside of the search search bar i had like inspo n allat u replaced w ass categorys."* | `85ae2d218`, 08-11 |
| M35 | Picked off `/dev/search-states`: 1b one list on tap, 2b no loading dots (the clear X owns the field's right edge), 3b a no-result state with a way out and category rows under it. **1b was reversed hours later by M34.** | *"1b 2b 3 b"* | `a5b177c7d`, 08-11 |
| M36 | Tapping the home search bar opens the sheet **unfocused with no keyboard**; tapping the FIELD is a separate second step. | *"i dont like when u click once yk from home search bar yk once u click its alrdy keyboard mode."* | `edcf44fe3`, 08-11 |
| M37 | The collapsed row above the open step shows an ANSWER, never the field's placeholder: it reads "Alle Services", matching "Keine Präferenz" and "Jederzeit". | *"the on top of the wo yk once its expanded there is residue of search thats whats fucked."* | `d606fca3c`, 08-11 |
| M53 | The category pill row renders on the home page with the current category selected (All pill + Inspo pill), and the home search bar opens the overlay **in place** rather than navigating to `/search`. His branch's `Header.tsx` and `HomeSearchPill.tsx` are canonical. The 2x3 tile grid restore is reverted. | *"look like there being on a category"* · *"it jumps me into another version"* | `f5ed1d9de`, `66217cdc4`, 08-10 |

### Calendar , and the one that collides with a LOCKFILE row

| # | Decision | Owner, verbatim | Record |
|---|---|---|---|
| M30 | **The tapped calendar day is INK (`rgb(10,10,10)`) with white numerals, not accent blue**, and the home search bar keeps its height on scroll (the 64 -> 44 shrink-and-swap is gone). **COLLIDES with the design-contract line that keeps blue for the calendar date/slot fill , flagged, not resolved, because this row carries no verbatim.** | approved-but-unquoted | `0cb12ca7e`, 08-12 |
| M31 | Today's date in the calendar is NOT blue: it takes the calm grey sunken fill with bold ink. Blue is only the fill of the date you actually picked. | *"in wann why is it blue."* | `b6c20d937`, 08-11 |

### Chrome: top bar, bottom bar, control shape (2026-08-09 to 08-11)

| # | Decision | Owner, verbatim | Record |
|---|---|---|---|
| M38 | The bottom nav bar yields while a full-screen sheet is up; it was crossing the panel's own Suchen commit button by 12px. | *"bottom nav bar is everywhere."* | `0ba846668`, 08-11 |
| M39 | The collapsed bottom bar keeps its WIDTH , it loses labels and height only (Instagram's is full-bleed and never narrows). Home search bar height goes 59 -> **64** on his call. | approved-but-unquoted (he named Instagram) | `7bc5c23ee`, 08-11 |
| M40 | The gap between the search bar and the category-pill row is **20px** (was 36 from three stacked spacings); the row's own padding is the entire gap. | approved-but-unquoted (he drew a box around the band) | `f66ce5c0b`, 08-11 |
| M41 | Home search bar holds Airbnb's aspect at OUR width (358/6.11 = 59 tall), label back to 14px/**500**, pill row to 80 tall so the 40px pill stops dominating. **Names a floor broken on his live instruction: three font weights (400/500/600) against the two-weight ceiling.** | approved-but-unquoted | `144167ab1`, 08-11 |
| M42 | Everything at the top of the home page sits on one left edge, **16** , our own gutter beats copying Airbnb's absolute 342px pill width. | approved-but-unquoted | `ba47eebc4`, 08-10 |
| M43 | **The bottom bar CONDENSES on scroll and never leaves** (labels go, glass stays, reachable throughout). Hide-on-scroll is a web pattern and is out. **Reverses `beae3e770` the same day.** | *"the bottom bar not being removed and get smaller, i told you go research w mobbin why did u not do it."* | `84a835b2f`, 08-10 |
| M44 | The home search bar's outline is a light grey hairline `#E4E4E7`, not black. | *"when you scroll down and up on the phones"* | `beae3e770`, 08-10 |
| M45 | The home search-bar ring goes from ink `#0A0A0A` to `s-ink-2` `#6B6B6B`: at 19.8:1 it was the heaviest mark on the page. | *"why is it black outline bro just make it gray or something."* | `d4ee7af12`, 08-10 |
| M46 | His "c" meant BOTH: the search bar settles as one control (54 tall with the ring at rest, 44 with the hairline once scrolled), and the bottom bar is **frosted glass, floating** (12px inset, 12 off the bottom, fully rounded), variant B. **The height swap was later removed by M30.** | approved-but-unquoted | `d65674315`, 08-10 |
| M48 | His locked home search-bar values are restored verbatim and outrank Airbnb's measurements: `py-2.5` (a pinned bar does not shrink, V3-D421d), the 1:1 copied `0 2px 8px 0 rgba(0,0,0,0.07)` shadow, 16px/500 label. | approved-but-unquoted | `110a31fac`, 08-10 |
| M49 | **No hamburger in the bottom bar or the search bar**; the fourth item is a profile/User item; saved uses a **heart**, not a bookmark. | approved-but-unquoted | `56de9e3f8`, `3e7c7a4cc`, 08-10 |
| M50 | **Mobile web ships a bottom nav bar** (four items), reversing two `REMOVED.md` rows that had banned a second nav. | approved-but-unquoted (the commit says a verbatim yes was filed in the graveyard, but does not quote it here) | `bae83e692`, 08-10 |
| M51 | Sizes: home search bar 55 tall at top 12 with elevation-3; category pills 40 tall, 14px side padding, 28px icon; the 79px dead gap between the pill row and the first heading goes to 0 on mobile. The first bottom-bar item is **not "Home"**, and the replacement word never arrived. | *"I wanted the icons like this, the sizes"* | `ffb5eec8b`, 08-10 |
| M52 | Five of his fifteen: the divider under the hero is deleted; the "In der Nähe" map block has no heading and no arrow and its chip leads with the city; the see-all arrow becomes a **circle in the right-hand slot** (36px in a 44px cell) instead of inline after the title; the pill row moves under the search bar on home, category and Inspo; pills shrink so the row visibly crops. The pill TREATMENT is untouched by name. | *"not on a category, it's already good."* | `d0979aeed`, 08-10 |
| M54 | **No boxing:** review cards lose their per-card 1px border, 16px radius and 14px padding , the section container already draws that edge. A container edge PLUS per-row dividers is doubled chrome; pick one. Already LOCKFILE §17.2 law; this is the week it was enforced. | approved-but-unquoted (*"the boxing is the problem"*, twice this week) | `42ee4f35c`, `3f774b17d`, 08-10 |
| M55 | **Round is the house control shape.** Measured: 890 round controls against 36 boxed in customer code. The system had no rule at all, which is why both shipped. | approved-but-unquoted | `fac03788e`, 08-10 |
| M57 | **Every task screen keeps a way out.** Seven screens (walk-in join, both tipping screens, confirmation, staff invite, voucher and gift-card purchase) had been left with zero back or close controls; the back control goes back. **Corrects M58.** | approved-but-unquoted | `3107da56d`, 08-10 |
| M58 | Top bars split three ways: browse keeps the full bar, detail gets a back arrow and the name only (never a notification count), task screens strip everything and put the action at the bottom, legal and marketing pages keep a menu for a cold landing. | approved-but-unquoted | `9300abfbd`, `c72e06527`, 08-09 |

### The mockup format, corrected twice in four days

| # | Decision | Owner, verbatim | Record |
|---|---|---|---|
| M29 | **What a mockup IS, said four times:** ONE real screen, full-bleed, silent, viewed on his phone, with before and after on a toggle. Not a comparison page with paragraphs, not a list, not a document, not two phone panes on a desktop page. | approved-but-unquoted | `5fa047bb4`, 08-12 |
| M3 | **Amends M29 on SCOPE:** the mockup's scope matches the ask. One section or element under discussion means show THAT, at real width, with the variants STACKED , no top bar, no Before/After toggle, no iframe. The whole-page switcher template is banned for single-section work. Already applied to the CLAUDE.md mockup block. | *"remove the gate or anything that's making you do this shit so annoying"* · *"I can't even see a difference"* | `ca4b6b324`, `68d7804b9`, 08-15 |
| M17 | The eleven-version comparison page is dropped and graveyarded: from v2 on the versions are indistinguishable on screen, so there was no choice in it. | approved-but-unquoted (*"nothing changes after v2"*) | `a91ed19b9`, 08-14 |
| M18 | **Standing rule: anything he would SEE is never applied on a sensible default.** It is shown, and it waits for him. Both coming-soon icons were reverted to sparkles until he picked. | approved-but-unquoted | `fea79295c`, `1816db14f`, 08-14 |

**Two collisions this block exposes, stated rather than resolved** (they are in the report's owner-
decision section):

1. **M30 against the design-contract date/slot row.** The contract keeps blue as the calendar's selected
   fill; the shipped calendar has been ink since 08-12. M30 carries no verbatim, so the newest-owner-
   decision rule cannot be applied to it safely.
2. **M41 against the two-weight ceiling.** Three weights (400/500/600) ship on the home first viewport
   on his live instruction, and the ceiling is not a taste axis he waived by name.

---

## 2026-08-14 to 2026-08-16 , the PDP / terminal / iOS week, recorded off UNMERGED branches

Recorded 2026-08-17 by the weekly law pass. **extends** the "2026-08-03 to 2026-08-10, the account-hub
week" block above, which is the same shape of record; supersedes nothing in it.

**Read the caveat before the table.** Every decision below sits on a branch that is NOT merged into
`main`, so this is a record of what he DECIDED, not a description of what the live site does. The three
branches, measured 2026-08-17: `claude/pdp-styling-updates-b2582b` (56 commits ahead, tip 08-16),
`claude/offline-booking-device-266b10` (36, tip 08-17), `claude/airbnb-animated-icons-ee4329` (24, tip
08-15). Anyone building on `main` today will find the old treatment still there and must not read that
as permission to keep it. This is the fourth consecutive pass to flag stranded branch work (07-27 D5,
08-03 D5, 08-10 D5), though the pile did shrink this week: `agent-flow-design-overhaul-2af2c2` merged,
carrying 383 commits onto `main`.

**Rows marked approved-but-unquoted carry no verbatim quote from him.** The commit records an approval,
a pick or a rejection without quoting him. They are labelled rather than dressed up as his words; if one
of them was never actually approved, say so and the row comes out.

### Salon PDP (`claude/pdp-styling-updates-b2582b`)

| # | Decision | Owner, verbatim | Record |
|---|---|---|---|
| B1 | PDP round 2: the report control comes off every placement (header circle, hero frost, per-review flag, per-photo); rating + count + open status share one line; open status names the hour again ("Geöffnet bis 17:00"); services split one card each; About moves under the address; reviews get a 28px star row with the count in accent; discover-more becomes area pills over a two-column list. Open-green corrected `#22C55E` -> `#1F8900` (2.32:1 -> 4.53:1). | approved-but-unquoted | `1e855dfb7`, 08-15 |
| B2 | Services group by CATEGORY, one card per category, inline cap 5 -> 6, copied from the booking service step. About collapses to a clamp with an inline toggle. Review rows lose the card AND the per-row hairline, gap -> 28px. The neighbourhood pill is gone from Discover more. | *"separate it"* | `26dc0fa18`, 08-15 |
| B3 | "Small selection" on Zusatzinformationen was the LIST, not the type: 9 null amenity flags filled, 3 items -> 7. Type unchanged. | *"So small the selection"* | `7ea26870c`, 08-15 |
| B4 | Review stars measured off his Fresha capture: summary row 26px, per-review row stars stay 13px (a 16px bump reverted). **Superseded one day later by B21.** | *"Make the stars bigger"* | `bcd84d4b0`, `fa0ab16e7`, 08-15 |
| B5 | Gallery rebalanced to his Bildergalerie reference: venue tab = one column of full-bleed 16/9 photos (358x201), stylist tab = one full-width square plus two half-width. | *"not balance at all, it's just all weird"* | `498d55161`, 08-15 |
| B6 | Soft black `#1C1C1F` selected state on salon filter pills, review tier pills and booking category pills. **Overruled by B19 the next day. Do not build from this row.** | approved-but-unquoted | `edc5a19a9`, 08-15 |
| B7 | The About clamp is the documented copy-economy limit (~150 chars / 3 lines); the 4-line / 170-char variant was invented, not law. Collapsed block 91px -> 68px. | approved-but-unquoted | `edc5a19a9`, 08-15 |
| B8 | Staff gallery switches by avatar disc: 75px discs, 12px spacing, count badge on the disc, name beneath. Measured off his screenshot. | approved-but-unquoted | `edc5a19a9`, 08-15 |
| B9 | Every already-black FILL becomes soft black `#1C1C1F`; ink TEXT stays `#0A0A0A` by his carve-out; borders, glyphs and alpha scrims untouched. | approved-but-unquoted | `de4dac2ac`, 08-15 |
| B10 | He picked C: TWO font weights on customer screens (semibold/bold demote to medium), dashboard exempt by name. Accepted cost: the salon name leads by size alone, not weight. | approved-but-unquoted | `66b2a52cc`, `3511941fb`, 08-15 |
| B11 | "Pakete" is renamed **Combos** in all four locales plus dashboard nav and icon. The retail products section comes off the salon page (component, API and Stripe path kept). | approved-but-unquoted | `b0b5b836e`, 08-15 |
| B12 | Combo icon = the two-merging-into-one glyph. Same turn: the multi-decision mockup page was rejected as unreadable, so it is one question at a time, one preview, options restyling it in place. | *"the combined two drilling into one"* | `b7b927ca6`, 08-15 |
| B13 | Green A for the opening-hours dots; the word beside it takes the AA-legible `.text` variant of the same green (4.53:1), because A alone is 2.68:1. Combo card takes "One font". | approved-but-unquoted | `eedd98083`, 08-15 |
| B14 | His nearby-rail ask ships as TWO rails: "Zuletzt angesehen" (history, hides when empty) and "Ähnliche Stores" (same category, renamed from the old rail). | approved-but-unquoted | `21a9655ff`, `2d6ab4b7f`, 08-15 |
| B15 | Reviews section rejected as out of place: 8 type sizes -> 4, initials disc 56 -> 44px with the name the heaviest thing in its row, owner-reply tray becomes a left rule instead of a filled box. The big star row was checked and deliberately kept. | *"Looks weird"* | `f052c6e7d`, 08-15 |
| B16 | Stop producing mockups this round and apply what he had already picked. | approved-but-unquoted | `70ab64cff`, 08-15 |
| B17 | Review filter pills drop the brackets around the count, on both copies of the reviews list and on the Alle pill in all four locales. | the pill read *"5 star (10)"*; he wants the count with no brackets | `b5a191eb2`, `2a95b7b7d`, 08-15 |
| B18 | Counts come OFF the star filter pills entirely (asked twice); the total stays on the Alle pill; the star glyph inside the pill gets bigger. **Reverses the counts half of the 2026-07-24 F2 pick (`REMOVED.md`).** | approved-but-unquoted | `d194a86f6`, 08-16 |
| B19 | The selected pill reverts from black to the calm grey: the black is too harsh and does not match. **Restores the locked design-contract row and `REMOVED.md:41` (owner 2026-06-29); overrules B6.** | approved-but-unquoted | `d194a86f6`, 08-16 |
| B20 | Chips beat a rating bar chart on the reviews screen, and that stands even though Airbnb uses a chart, because 16 reviews is not a distribution. Only the counts half of the 07-24 pick reverses. | approved-but-unquoted | `ba248514b`, 08-16 |
| B21 | He tapped the option carrying four changes, now on the real screens: reviewer photo 44 -> 62px; filter pills stop being stretched capsules and take a deliberate 16px corner (this edits the every-button-is-a-capsule rule and a shared control 29 files import); row stars 13 -> 18px, past both references, his taste; the review score becomes the page anchor at 44px, above the "Reviews" heading. **Supersedes B4 on row-star size.** | approved-but-unquoted | `f0ab90328`, `41174f1b9`, `ac1ec574c`, 08-16 |
| B22 | Preview and mockup pages carry none of the app's furniture (no header, no bottom bar, no cookie strip), and the comparison numbers sit UNDER the thing being judged, never between the controls and it. | approved-but-unquoted | `16c8c6e2c`, `59fcc5ac4`, 08-16 |
| B23 | The body typeface was never loading on any screen (zero body font files, an empty variable killing the whole stack); he had said repeatedly he kept seeing a font he did not want. Confirms the locked font row, changes nothing in it. | approved-but-unquoted | `cf20e6f52`, 08-16 |
| B37 | **Left OPEN on purpose:** our own written rules contradict each other on type sizes (one demands 6-7, another caps at 4), named as the third cause of the clutter he complained about. Reconciling it rewrites a locked row across every screen, so it waits on him. | approved-but-unquoted (a question, not an answer) | `2b4f75120`, `cf69073dd`, 08-16 |

### Merchant terminal (`claude/offline-booking-device-266b10`)

| # | Decision | Owner, verbatim | Record |
|---|---|---|---|
| B24 | The merchant terminal is the Uber Eats merchant screen MINUS the physical device he explicitly does not want; auto-accept stays the default, so it is a live board and not an approval gate. | approved-but-unquoted | `f94c485be`, 08-15 |
| B25 | A mockup is composed from the shipping components (Avatar, TabPill, the PDP's grouped-list-card, row and button class strings), never hand-written Tailwind. Confirms FLOORS LAW 9 in his own words. | *"this mockup doesn't reflect our design system ... you're just using inconsistent everything"* | `85f03144a`, 08-15 |
| B26 | The seven-tab operator screen is rejected: ONE bar of chrome (116px of stacked chrome was measured), it must hold high volume and several people at once, and its rows must be clickable and actionable. | *"why are you making me such a sloppy fucking shit"* · *"what if there is a lot and multiple people"* · *"why don't you make it clickable, for example new booking, how are we gonna do that"* | `50203db09`, 08-15 |
| B27 | A prototype must DO something on tap: state changes, arrivals, undo, sound. Rendering the data is not a prototype. | *"you just made setup and didn't change the design or nothing ... make actual, like, a fucking prototype"* | `3f8919113`, 08-15 |
| B28 | A mockup must be in the server HTML from the first byte, not client-only after hydration. | *"The mockup isn't working at all."* | `2d0eb6e2a`, 08-15 |
| B29 | The operator canvas is WHITE, not grey, and 14 is the workhorse text size, both matching the salon PDP. Measured: the PDP uses 14 forty-five times and 13 thirty-two times; the terminal was 13 forty-nine times and 14 zero times. | *"i dont like ths gray backrgrounf evrth container sh bro and the fonts arent it too bro look how we do it in pdp page of a salon"* | `e31a1b8a8`, 08-16 |
| B30 | The beige sticky bar is rejected. `#FDF6E7` (`s-warning.bg`) is a legal token in an illegal ROLE: a pastel `.bg` lives on an inline chip or badge, and a bar is white. Third case of the same disease. | *"You made up a random fucking collar that's beige. I don't fucking know it."* | `367442f04`, 08-16 |
| B31 | Colour means state and nothing else: Accept goes green `#16A34A`, "New" carries no colour because new is an AGE not a state, the black dot and black count are deleted (black is for words), a fact appears once, and a control is named after what you will SEE ("Show the whole day", the whole bar is the button). | approved-but-unquoted (his selections reported, not quoted) | `11d255b31`, 08-16 |
| B32 | The sixth rejection settles the Screen Principle: a screen is NAMED operator or customer before it is built, and the customer FLOORS LAW is scoped so it stops demanding the sunken grey tray (floor 4) and a semantic-colour moment (floor 1d) on photo-less operator screens. A list of people is ROWS, not a card each. | approved-but-unquoted (expressed by rejection) | `5aa1e12da`, `9ca5063b3`, 08-16 |

### iOS app (`claude/airbnb-animated-icons-ee4329`)

| # | Decision | Owner, verbatim | Record |
|---|---|---|---|
| B33 | The whole iOS app is overhauled to match the web's look but with liquid glass and real native motion. **Superseded the same day by B34.** | approved-but-unquoted | `bcbf8c0bd`, 08-14 |
| B34 | iOS canon = the main web. Light only (his 2026-07-15 rule), and glass kept ONLY in the three placements `THEMING.md` already names. | approved-but-unquoted | `b774dc86c`, 08-14 |
| B35 | The app must be one to one with the web: every customer web route gets an app equivalent (34 gaps -> 0), with killed features excluded from the denominator by name (chat/messages, vouchers/gift cards). | approved-but-unquoted | `9f6f7ac0d`, `81f88e872`, 08-14 |
| B36 | The booking time step's SAMPLE slots are fabrication and come out; real availability and a real confirmation screen replace them. Confirms taste rule 1. | approved-but-unquoted | `06255bb23`, `252060ce0`, 08-14 |

**Three collisions this harvest exposes, stated rather than resolved:**

1. **B6 against B19, one day apart.** He picked soft-black selected pills on 08-15, overruling the locked
   calm-grey row and `REMOVED.md:41` by name, then on 08-16 called the black too harsh and sent it back to
   calm grey , the same objection he made in June. The newer call wins and `main` was right all along.
2. **B18 against the 2026-07-24 F2 pick.** He chose chips-with-counts then and killed the counts now.
   Chips-over-bars survives (B20), so only half of that pick reverses.
3. **B21 against B4, one day apart.** Row stars measured to 13 on 08-15 off his own Fresha capture, then
   raised to 18 on 08-16 as his taste deliberately going past both references.

---

## Locked-rule keyword index (governance backfill, 2026-07-10)

These are LOCKFILE-locked calls that never ran through the Rounds 1-4 mockup-elicitation
process but ARE among the most-relitigated rules per the design-governance audit
(`_design-system/DESIGN_GOVERNANCE_AUDIT_2026-07-10.md` Part 2 finding 5). Cross-referenced
here (not re-decided) so the upcoming TASTE_LOG injection hook can match them; source of truth
stays LOCKFILE.

### Blue is sparse (the hyperlink-only rule)
Blue `s-accent #276EF1` lands ONLY on text that reads as a hyperlink (review counts, inline
body links, "Mehr lesen", "Passwort vergessen", map/directions jump-links) plus locked system
states (focus ring, Spinner, stepper discs). LOCKFILE:59, "v3 (2026-06-11, council): BLUE = THE
HYPERLINK COLOR, not the clickability color (supersedes v2 'generous')."
- keywords: blue sparse, blue accent, hyperlink blue, generous blue, blue everywhere, accent color, s-accent

### Toast recipe (white pill + circle badge)
V3-D462 (2026-06-13, Chime/Google-Photos recipe): white pill (`bg-white border-s-border
shadow-elevation-3`), circle-badge tone icon (26px tint bg + saturated glyph), ink text, one
blue text action, docked BOTTOM. Replaced the earlier pastel whole-pill tint. LOCKFILE §5
(Toast/Toaster) + live `primitives/Toast.tsx:180-213`.
- keywords: toast, toast recipe, toast pill, pastel toast, notification, snackbar, toast badge

### Stepper is blue, never green
LOCKFILE §13.2 supersession note (2026-06-11, owner-approved booking-pay/-hair mockups,
shipped in `BookingWizard.tsx` + the live queue tracker): "the 2026-06-10 green-family stepper
+ walk-in-blue-exception model is REPLACED by ONE blue stepper language everywhere… Blue =
progress, green = state (success/confirmed), never the reverse." Green on a stepper node = NEVER.
- keywords: stepper, progress stepper, step tracker, stepper blue, stepper green, booking steps, walk-in tracker, step indicator

### Eyebrow rules
Eyebrow role (LOCKFILE:229, :301): 11px mobile / 12px desktop, weight 600, UPPERCASE,
tracking 0.08em, `text-s-ink-3`, max ONE per surface (drift rule A7 flags >1). V3-D421 cut
tracking 0.16em -> 0.08em and weight 700 -> 600.
- keywords: eyebrow, eyebrow rules, uppercase label, section label, tracking, small caps

### Radius scale
Card/block = 16 (`rounded-card`); button/chip = pill; input = 16; sheet = 28; image = flush
(0), with the SalonResultCard photo exception (`rounded-card`, V3-D350). CLAUDE.md design
contract "radius" row.
- keywords: radius, border radius, rounded, rounded card, rounded pill, rounded input, rounded sheet, corner radius

## 2026-08-21, the six-decisions page, and why four of the six should never have reached him

He answered a page of six decisions with one message. Four of his six answers were a version of
"why are you asking me this at all", so the answers and the reason each question was wrong are both
recorded here, because the reason is the reusable part.

Verbatim: *"I like these dumb stupid shit. I told you to use some agents counsel, you know, for
these small stuff. Like, why would you need my opinion for these small stuff? ... I'm seeing, like,
a core pattern of you not actually firing the fucking gates. The gate is not flagging and stuff.
Right? These are obvious fucking questions."*

| # | the question | his answer | should it have been asked |
|---|---|---|---|
| 1 | the code box on the payment screen shows for salons with no vouchers | **A: hide the box unless that salon has a voucher with money on it** | yes, a real product fork |
| 2 | can someone rate a salon they never booked | **already answered, stop asking** | NO. He settled it on 2026-08-09 in the ten-decisions message: *"4B like google maps"*. The answer is quoted in `app/api/reviews/route.ts` at the top of the eligibility branch. I asked him to re-decide something the code cites him deciding. |
| 3 | what I do when context runs out mid-job | **already solved, we have a system** | NO. `_plans/ACTIVE.md` auto-injects and survives compaction, and a SessionStart hook re-verifies after one. The machinery he is describing already runs. |
| 4 | 13px or 14px on one button | **cannot judge it, use a council, what is the core cause** | NO. See below. |
| 5 | the German word for "Salon" | **research it with a sub-council, look at other platforms** | the question was fair, the FORM was not: it was a menu, not a researched recommendation |
| 6 | switch on the new reply rules | **I do not understand it and should not have to approve it** | NO. Nothing about it is his taste. |

**The core cause of number 4, which is the one he asked for by name.** This system has ceilings
(at most 4 sizes, at most 2 weights) and floors (a button is never below 13px, a display anchor is
at least 28px). It has no rule for the case where BOTH candidate values are legal. 13 and 14 both
clear the floor and both sit on the scale, so nothing in 80KB of design law says who picks, and the
default with no rule is to ask him. That is the whole mechanism. It is not forgetfulness and it is
not laziness, it is a missing tier: the system says what is ALLOWED and never says what is MINE.

**The fix, same day:** `_design-system/TASTE_AUTHORITY.md`, which grants a subagent the authority
to decide inside a stated indifference band and names what still needs him.

**On his "the gates are not firing", measured rather than agreed with, and the FIRST count was
wrong.** 287 hook files sit on disk. The first pass called a gate live only if its filename appears
in a settings file, and reported 209 live with 50 tested-but-dead. That method is wrong twice over,
and a known-answer control caught it: `measurement-needs-scope-gate.py` fired on a real reply the
same hour while the method called it dead. Three ARMED aggregators (`evidence-family`, `link-family`,
`reply-family`) dispatch member gates that never appear in settings by name. Counting those as live
went too far in the other direction and resurrected `concise-response-gate.py`, which he killed on
2026-08-08, because another hook's DOCSTRING mentions it by name. Corrected method: a gate is live
when settings names it, or when a live hook EXECUTES it, docstring prose excluded. Corrected
numbers: **231 live, 11 shelved helpers, 41 running nowhere, 28 of those with a passing suite.**

The one gate that refuses the exact message that produced this complaint,
`no-permission-question-gate.py`, was among the unwired. Built, tested, never armed. Armed
2026-08-21 along with `measure-dont-ask-gate.py` and `mockup-already-answered-gate.py`, each driven
first over 198 real closing messages from this session to confirm it does not refuse ordinary work.
The remaining 25 were NOT mass-armed: the standing wiring tool would have re-armed
`concise-response-gate.py` and `reply-length-gate.py`, which he killed by name on 2026-08-08.


## 2026-08-21, the 20 dead gates audited, and the arm list came out EMPTY

After correcting the count (231 live, 41 running nowhere, 28 of those tested), 20 of the dead ones
that are not reply-shape gates were driven with real input, then handed to an adversary who had not
audited them and was told to break them.

**Eight were recommended for arming. All eight broke.** Seven of the eight breaks were re-checked
against the real files by the arbiter rather than taken on report. Examples, so the shape is clear:

- `touch-action-scroll-gate.py` would refuse a carousel written the same way as one already
  shipping in this repo (`components/ui/animated-testimonials.tsx:139` carries `touchAction:
  "pan-y"` as a committed, deliberate fix, and the gate refuses exactly that value).
- `repeat-fix-simplify-gate.py` matches the bare nouns check/gate/hook/rule, so three DIFFERENT
  gates each fixed once in one session trips its "you fixed the same defect three times" accusation.
  That is the exact shape of a hardening session.
- `halved-is-not-fixed-gate.py` defines `REDUCTION_IS_THE_GOAL` at line 71 and references it
  nowhere, so the performance exemption its own docstring promises is dead code and an honest
  "800ms to 320ms" is refused.
- `brand-claim-needs-capture-gate.py` fails BOTH ways: it blocks "Stripe uses idempotency keys"
  and lets through "Airbnb fades the fields in", which is the founding sin it was built for.

**Two are DELETE, not LEAVE.** `loop-does-not-report-gate.py` is beaten by the live
`unfinished-batch-gate.py`. `repeat-claim-needs-repro-gate.py` was already live once and HE ordered
it off on 2026-08-09 for causing repeated messages; re-arming it would repeat the mistake the audit
exists to catch. Re-measured today at 22% of real closing messages.

**THE FINDING THAT ACTUALLY ANSWERS HIS COMPLAINT, and it reframes it.** Seven of the eight had
never been shown to catch a single real thing before any attacker touched them. The dead pile is
therefore not a pile of missed protection. If checks are not flagging obvious things, the cause is
in the 231 that ARE running, not in the 41 that are not, and that is a different job from this one.

**Honest limit, stated because the measuring tool has real blind spots.** The shared driver feeds
closing-message text only, so a "0 of 200, therefore safe" number is guaranteed zero for any gate
that inspects a tool call before it runs, needs several turns of history, or scans project files
instead of messages. Three of the eight fall in those categories and their safety numbers were not
evidence.
## 2026-08-23 , search results stays as it is (owner: "the mockup keep it now", then "i tl u now")

Shown four directions on the REAL search results screen at `/en/dev/unify`: leave it, give it an
anchor (store names 14px to 24px), let the photo lead (every picture from wide 5:4 to tall 4:5), or
both plus one corner value. **He picked Now.** Twice, and the second time because I had missed it
the first.

SO: the search results screen is SETTLED as it ships. It is not a finding, not drift, and does not
go in a comparison table again.

THE COST, named once so it is on record and then dropped: measured at 390x844 on the built site the
same day, that screen is the flattest of the seven measured. Three words in a hundred carry bold
against thirteen on the store page he likes, and nothing on it exceeds 18px against that page's
30px. He has now seen the alternative rendered on the real screen with real stores and chosen this.
That is his call to make and the measurement does not overrule it.

WHAT IS NOT COVERED by this decision, because he was only ever shown search results: inspo, help and
login also measured out of step (inspo is flatter still at 15px and 1.25x; help and login are the
loudest at 18% and 27% bold). No direction has been shown to him for those.
## 2026-08-16 , THE SCREEN PRINCIPLE (owner: "Make a principle... Ask them the core cause of your sloppiness")

Written after a merchant terminal was rejected **six times in one session**. An adversarial panel of
three independent diagnoses plus a judge was run against my own candidate cause, with instructions to
refute it. Mine was the front half of the answer and did not survive alone.

### The cause, as the panel landed it
**The screen was never named, and it was never judged as one thing.**

No round began by saying what the screen IS (a merchant counter terminal, an operator surface) and
no round ended by looking at the whole rendered screen again. With neither end fixed, every decision
in between defaulted to the smallest unit available: for a value, one class string warranted by the
file it was copied from; for a round, the one sentence the owner had just said.

**And this is the part that matters, because it means the failure was not laziness alone.** Because
the surface class was never named, the operator law in this very file (the 2026-07-15 merchant round)
was never routed to, and the CUSTOMER-screen FLOORS LAW was applied by default. Two of its floors
then actively DEMANDED the two things he rejected:
- FLOORS LAW 4 mandates the sunken tray for grouped content on white with no photo -> the grey canvas
- FLOORS LAW 1d mandates a semantic-colour moment, and on a screen with no photography the only
  candidates left are the pale semantic tokens -> `s-warning.bg` `#FDF6E7` as a full-bleed bar,
  a colour taste rule 3 bans by name

So the law contradicted itself and nothing said which half won on which screen. FLOORS LAW now
carries a scope block naming exactly that, added the same day.

**The single strongest piece of evidence that identity was the missing step:** the design verifier
asked in ROUND ONE whether a list of people is one card with lines or a card per person. It was
parked. Five more rounds were built on the unanswered question. Round six is the owner answering it
by rejection.

**Honest limit, recorded rather than smoothed:** this cause prevents four of the six rejections. It
does NOT prevent "the mockup isn't working at all" (the page server-rendered nothing) or "make an
actual prototype" (nothing on it did anything), unless judging the whole screen means OPENING AND
USING the running page rather than measuring it. Measuring is this estate's reflex: a bespoke script
collecting six scalars ran every round while nobody clicked anything.

### THE SCREEN PRINCIPLE, and it is five lines before any markup

1. **Say what this screen is.** One line, with a person in it. "A merchant counter terminal, used
   standing up, by staff, during opening hours." Not "a page".
2. **Say whose law applies.** Customer screen or operator screen. This is the step that was skipped
   six times. Operator screens: the 2026-07-15 merchant round in this file. Customer screens: FLOORS
   LAW. Applying the wrong one is not a near miss, it produces the defect.
3. **Say the one job, in one sentence.** "Someone at the counter with three people waiting takes the
   next one without asking anybody anything." Every element is justified against that or it is cut.
4. **Say the one biggest thing, before any markup**, and give it the anchor. Everything else recedes.
5. **Write the three targets**: how many boxes (aim: one), the gap ladder (16 and 32, nothing else),
   the type ladder (an anchor, a workhorse, one small, and nothing used once in between).

### When the class string already exists in the repo
Finding the string is not permission to use it. **The file you copied it from is never a reason. The
rule line is the only reason.** Write one line beside the paste naming the rule and the condition it
sets, in your own words. "DashboardLayout.tsx has it" is not that line; that bar dresses an admin
preview banner, an internal tool, not a design decision.

### What a gate can and cannot see here
Gateable, and now measured on every round: the count of surface colours, the share of vertical pixels
inside a box, the gap ladder, the size ladder, controls under 44px.
NOT gateable, and it is dishonest to pretend otherwise: whether the screen is the right screen for
its job, and whether it feels like this product. Those need the owner, which is what the mockup-first
law is for.

### The state that was approved out of this round, measured
White surfaces only, no `#F4F4F5` anywhere on the terminal, no warm cream. ONE card (the chairs) at
25.2% of the viewport against a 35% ceiling. Section gaps `[32, 32, 32, 32]`, exact. Four sizes
`{13, 15, 18, 28}` with 14 deleted and the anchor at 2.15x the body. Nothing under 44px. Verified
still live by polling it for 30 seconds untouched: the attention count went 10 -> 11 -> 12 as two
bookings arrived on their own.
