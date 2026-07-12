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
- **Semantic availability = green pill** (-> universal-color convention): an
  "open / free / available / next-slot" signal uses the green pastel pill
  (`text-s-success` on a green-pale bg), not ink text, not a dot.

### Applied in code?
- ✅ **Green availability pill** applied in `SalonResultCard` (grid + list nextSlot),
  verified on the real grid results (V3-D442). tsc clean.
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

- keywords: filter, filter pill, filter chip, filter sheet, sort segment, price slider, filter button, filters neutral, blue filter, gray filter, grey filter, sheet chip, apply button

## 2026-07-06 , data-state filters: hide while empty (owner approved)
- Decision: filter surfaces that point at data which cannot discriminate are HIDDEN, not shown-but-empty. Applied to the Angebote pill + FilterSheet group + deals sort + Angebote rail (while 0 listed salons carry a deal) and the Fuer-wen pill + group (while every active service is tagged for all genders). They reappear automatically when the data changes (cached availability check, ~5 min).
- Why: a filter that always yields 0 results or never narrows is a dead control; showing it violates the no-fabricated-affordance principle (same family as taste rule 1). Seeding fake deals was rejected as data fabrication.
- Record: mockup public/_mockups/sweep-datastate-filters.html (real-page captures, treatment-only); owner: "this is so good approved". Root-cause data facts: 0 deals live; 264/264 services tagged both genders (verified via SQL 2026-07-06).

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
