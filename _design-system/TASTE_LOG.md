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
- [ ] Round 4: Pay step
- [ ] Round 5: Confirmation

---

## Round 1: Search result card (2026-06-07)

Mockup: `public/solen-taste-01b-search-cards.html` (v1 `-01-` was rejected:
changed too many vars at once + invisible shadows + an incoherent orphan-blue
price number). Confirmed verbatim: **"all ur count correct"** (all 4 "my read" picks).

| Dimension | Decision | Why |
|---|---|---|
| **Elevation** | Soft, visible shadow (`elevation-2` family) | Gentle lift, the card family. Flat reads cheap; lifted too "app"; hairline too boxy. |
| **Availability hook** | **Green availability pill** (semantic), not ink text | Green = available is *information*, the one intentional splash of life on a calm card. |
| **Price** | **Bold ink number**, units grey | The number is what you scan, so it carries the weight; `from`/`CHF` recede. |
| **Card extras** | **Clean** | Name, rating (no count), one meta line (`category · city`), price, the one slot hook. No review-count, no distance, no badge. Re-confirms V3-D354. |

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

Shown on the REAL `DateTimePicker` primitive via a throwaway harness route, after
the hand-drawn calendar mockup was rejected ("that aint actually the real
calendar"). Confirmed verbatim: **"both b"**.

| Dimension | Decision | Why |
|---|---|---|
| **Time-slot layout** | **Grouped grid** (Vormittag / Nachmittag) | the `DateTimePicker` primitive ALREADY does this; the booking flow just runs a bespoke full-width-ink-rows version instead. |
| **Selected-state colour (audit B1)** | **Blue `s-accent`** everywhere a single choice is active (calendar date, time slot, active tab, radio); **ink reserved for the ONE commit button** | one "selected" language; matches the search overlay; collapses the 5 dialects the audit found. |
| **Card price weight (audit B2)** | **Bold ink number, name kept LARGER** as the anchor | resolves B2; amend rule A13 to "anchor by SIZE, name + price may both be ink if the name is larger." |

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
