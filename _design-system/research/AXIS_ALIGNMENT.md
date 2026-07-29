# AXIS: ALIGNMENT

<!-- exists-check: net-new vs _design-system/research/GEOMETRY_PRINCIPLES_2026-07-17.md,
     TASTE_HIERARCHY.md, TASTE_GROUPING.md, docs/audit/fresha-airbnb-solen-audit-part1.md and
     part2.md, and the sibling _design-system/research/AXIS_FONT.md (all read or grepped first).
     GEOMETRY_PRINCIPLES covers radii, spacing scale and container geometry; TASTE_GROUPING covers
     WHICH elements belong together and how they are separated; TASTE_HIERARCHY covers emphasis
     order. None of them measures where an icon, a label and a chevron sit on the vertical axis of
     one row, nor whether a number column is left- or right-aligned. This file adds exactly those
     two and defers to the three above on everything they already cover. Sibling AXIS_FONT.md owns
     type size and weight; this file cites its line-box reasoning but sets no font sizes.
     `npm run exists SettingsRow` run 2026-07-29: 0 matches, no graveyard hit. -->

Alignment research for Solen. Where things line up in modern booking and marketplace products,
measured where measurement was possible, and a verdict on the row anatomy the owner has complained
about.

Date: 2026-07-29
Scope: vertical axis of a list/settings row (icon, label, trailing chevron), left-edge columns,
number-column alignment, and the divergence between the two schools that exist.

Owner's complaint this axis exists to answer, in spirit: *icons, text and arrows in our rows are not
aligned at the same heights the way Airbnb does it.*

---

## 0. Sample size, stated plainly

| what | count |
|---|---|
| Mobbin searches run | 13 (9 `ios`, 4 `web`) |
| screen results returned and looked at | 96 (at least 5 repeats across searches, so roughly 91 distinct) |
| distinct apps in the corpus | 22 |
| screenshots downloaded and pixel-measured | 10 |
| individual rows measured in pixels | 51 |

The 22 apps: Airbnb, Fresha, Square Go, Careem, Warby Parker, Lugg, Shangri-La Circle, Revolut,
Stripe, Linear, Uber, OpenTable, Airtasker, Behance, Ulta Beauty, Alan, Peloton, Open, Equinox+,
Runna, adidas, Preply.

**Not a census.** A 22-app convenience sample from 13 queries.

### R3 declaration: what I could not verify

Per `RESEARCH_METHOD.md` R3, the gaps are reported as findings rather than filled in.

1. **Booksy, Treatwell, Vagaro, StyleSeat, Squire, Mindbody, Calendly and Resy are absent.** All
   eight were queried by name. Mobbin returned adjacent apps instead (Square Go for Booksy and
   StyleSeat, Fresha for Treatwell, Peloton and Equinox+ for Mindbody). **I say nothing about those
   eight below.** This matches the R3 case already on record for Treatwell and Booksy.
2. **I could not obtain a higher-resolution capture.** Mobbin serves signed, downscaled previews
   (299 x 678 for iOS, 768 x 521 for web). Adding a resize parameter to the redirect target breaks
   the signature and returns JSON, not an image. Verified by trying it.
3. **I did not render any Solen page.** Section 5 is read from source. The render check that would
   close it is written out in V4.

### How to read the numbers here, given the sibling file's caution

`AXIS_FONT.md` states, correctly, that no absolute px figure from a Mobbin screenshot is a
measurement. That applies to **absolute** quantities. This axis is mostly a **relative** one, and the
two behave differently under downscaling:

- **Relative claims** (the gap between three element centres inside one image) survive downscaling
  intact. They are limited only by resolution: 1 preview px. These are tier (a) observations, marked
  **measured** below.
- **Absolute claims** (a 24 pt margin, a 56 pt row pitch) require a scale factor and are therefore
  **reconstructed**, tier (c), and per R7 they are *ours, measured off a shipped artefact*, never
  Airbnb's published specification. Airbnb publishes no spacing scale.

The scale factor is derived, not assumed. The Airbnb settings hairline spans `x[18..279]` = 262 px.
At a 393 pt screen width with 24 pt margins the content width is 345 pt, giving 262/345 = 0.759 px/pt,
so **1 preview px = 1.314 pt**. Independently, 299/393 = 0.761. The two agree. Corroboration that the
393 pt assumption holds: every value derived from it lands on the 4 pt grid (24 / 24 / 16 / 56), which
would not happen if the scale were wrong. It remains a reconstruction.

**Resolution floor: 1 preview px = 1.3 pt.** "Aligned within 1 px" below means within about 1.3 device
points, under the perceptual threshold. It does not mean mathematically zero.

---

## 1. Single-line rows: one axis, and in Airbnb it is essentially exact

Screen: [Airbnb, Account settings (iOS)](https://mobbin.com/screens/936fbfe8-4c12-4c69-95f0-6c56b7dede64).
Nine rows of icon, label, trailing chevron. Vertical centres in preview px:

| row | icon centre | label cap centre | chevron centre | spread |
|---|---|---|---|---|
| Personal information | 163.5 | 162.5 | 163.0 | 1.0 |
| Login & security | 205.5 | 205.5 | 205.5 | 0.0 |
| Privacy | 248.0 | 248.0 | 248.0 | 0.0 |
| Notifications | 290.5 | 290.5 | 291.0 | 0.5 |
| Payments | 333.5 | 333.0 | 333.5 | 0.5 |
| Taxes | 376.0 | 376.0 | 376.0 | 0.0 |
| Translation | 418.5 | 418.0 | 418.5 | 0.5 |
| Travel for work | 461.5 | 461.0 | 461.0 | 0.5 |
| Accessibility | 503.5 | 503.5 | 504.0 | 0.5 |

**Worst-case spread across all nine rows: 1.0 preview px (1.3 pt). Mean: 0.39 px (0.5 pt).**
Measured. The owner is describing a real, quantifiable property of Airbnb's rows, not an impression.

### 1a. The axis is the cap-height band, not the ink bounding box

This is the part that gets implemented wrong, and it is measurable.

I measured each label twice: once by its full ink bounding box (which includes descenders), once by
its cap-top to baseline band.

| metric | mean absolute error vs icon centre | max |
|---|---|---|
| full ink bbox centre | 0.72 px | 1.0 px |
| cap-top to baseline centre | **0.28 px** | 1.0 px |

The error more than halves. The **sign pattern is the actual proof**: measured on the ink bbox, all
**4 of 4** rows containing a descender (Login & security, Privacy, Payments, Accessibility) put the
label centre *below* the icon centre at +1.0 px, and **3 of 3** rows with no descender put it *above*.
A clean separation, no overlap.

That is the signature of aligning to the text's **line box**, not to the pixels the glyphs paint.
Descenders drag an ink centroid down; a line box does not move.

Why this matters for Solen concretely, from first principles rather than by imitation: a row whose
icon is positioned with a hand-tuned `margin-top` will look correct on "Termine" and wrong on
"Zahlungen", because the second word has a descender and the first does not. Only line-box alignment
survives the copy changing. Solen ships four locales where the copy changes on every route.

### 1b. Icon ink height varies by 4 px; the axis does not move

Across those nine rows the icon ink height ranges 14 to 18 preview px and the width 14 to 18 px (the
person glyph is short, the bell is tall), yet every icon centre lands within 1 px of the row axis.
Airbnb centres a fixed **box** and optically centres each glyph inside it. Measured.

---

## 2. Multi-line rows: the corpus splits into two schools (an R8 divergence)

The finding that explains the complaint. On a single-line row the two schools are indistinguishable.
They diverge only once a row has a second line.

### School A, the title-line axis: Airbnb

Every satellite, leading icon and trailing chevron alike, centres on the **first line**.

[Airbnb, listing editor room detail (web)](https://mobbin.com/screens/59c20415-20f5-4199-b025-ea8798c268c9),
four two-line rows with a trailing chevron:

| row | line 1 centre | chevron centre | vs line 1 | vs block mid |
|---|---|---|---|---|
| Sleeping arrangements | 237.5 | 237.0 | -0.5 | -5.0 |
| Privacy info | 277.5 | 277.0 | -0.5 | -5.0 |
| Amenities | 316.5 | 316.5 | 0.0 | -5.5 |
| Accessibility features | 356.5 | 356.0 | -0.5 | -4.5 |

[Airbnb, "What this place offers" modal (web)](https://mobbin.com/screens/f0e9001e-550f-477d-bcfb-56d47baa833b),
two-line rows with a **leading** icon:

| row | line 1 centre | icon centre | vs line 1 | vs block mid |
|---|---|---|---|---|
| Essentials / Towels, bed sheets... | 322.5 | 323.5 | +1.0 | -3.5 |
| Bed linens / Cotton linens | 405.5 | 407.0 | +1.5 | -3.5 |

Single-line controls from the same two screens: Hangers 369.5 vs 370.5 (1.0), Hot water 206.0 vs
205.5 (0.5), Shared beach access 108.5 vs 108.5 (0.0), Air conditioning 157.5 vs 158.0 (0.5), Wifi
108.5 vs 108.5 (0.0).

**Airbnb tally: 20 rows measured, 4 screens, 2 platforms, 0 exceptions.**

### School B, the block axis: Uber, OpenTable, Linear

Satellites centre on the **whole text block**.

[Uber, hourly ride detail (iOS)](https://mobbin.com/screens/9228af44-f568-4f96-a70c-23023f075e7a),
leading icons:

| row | icon centre | block mid | line 1 centre |
|---|---|---|---|
| 4:00-6:00 PM / Starts when driver begins | 158.5 | 158.5 | 150.0 |
| 2 hours included / $0.98 per minute | 227.0 | 226.5 | 219.0 |
| Tolls and surcharges (3 lines) | 371.5 | 372.0 | 357.0 |

[OpenTable, order confirmation (iOS)](https://mobbin.com/screens/6f4cec19-d2f8-471d-9037-46d2909335c9),
the wrapped email row: icon 170.0, block mid 171.0, line 1 162.5. Block.

[Linear, Preferences (web)](https://mobbin.com/screens/d4e47b31-9152-40c7-a400-c6725e8de647),
trailing controls on two-line rows:

| row | ctrl vs line 1 | ctrl vs block mid |
|---|---|---|
| Default home view | +5.0 | +0.0 |
| Display names | +4.0 | -0.5 |
| First day of the week | +4.5 | -0.2 |
| Convert text emoticons | +4.0 | -0.5 |
| App sidebar | +3.5 | -1.0 |

[Linear, Coding tools (web)](https://mobbin.com/screens/9ac66835-aa7f-469f-ace3-a915c2cf2dfd),
leading icons on two-line rows: Amp 99.0 vs block mid 99.25, Claude Code 131.5 vs 132.0, Cursor 264.0
vs 264.25. Block, to within 0.25 px.

### The verdict on the split

**20 Airbnb rows on the title line. 12 Uber, OpenTable and Linear rows on the block. Zero rows in
either group that break their own app's rule.**

This is a textbook R8 divergence: live, maintained, well-regarded products deliberately disagreeing.
Per R8 that means there is no single right answer to discover, and the finding is that **you pick one
and write the number down**. V1 makes a recommendation and names its cost, but the pick is the
owner's.

**The defect is not choosing the "wrong" school. It is mixing them inside one list**, which is exactly
what a row component using `items-center` does when some of its rows have a subtitle and some do not.
Rows without a subtitle land on school A trivially (block equals line). Rows with one land on school
B. In a list containing both, the icons of the two-line rows sit roughly 4 to 5 px lower relative to
their titles than the icons of the one-line rows, and the eye reads the list as unaligned. Section 5b
shows Solen shipping precisely this.

---

## 3. Left edges: what lines up and what deliberately does not

From the Airbnb iOS settings screen. Left column measured, right column reconstructed per R7:

| element | preview px | derived pt (x1.314) | nearest 4 pt |
|---|---|---|---|
| page margin (hairline left end = icon box left) | 18 | 23.7 | **24** |
| icon box width | 18 | 23.7 | **24** |
| label column left edge | 49.5 | 65.1 | **64** (= 24 + 24 + 16) |
| icon-to-label gap | 13.5 | 17.7 | **16** |
| hairline right end | 279 | 366.8 | right margin **24** |
| row pitch (icon centre to icon centre) | 42.5 | 55.9 | **56** |

A 56 pt pitch clears the locked 44 pt touch floor with room.

All nine labels start at x = 49 or 50 preview px. **One label column, one number, regardless of how
wide the icon glyph is.** The horizontal twin of 1b: the box is fixed, the glyph floats inside it.

Three things that deliberately do **not** share that edge:

1. **Section headers align to the outer margin, not the label column.** On
   [Airbnb, Payments & payouts (iOS)](https://mobbin.com/screens/e62d97ca-2500-452c-8f53-e7210d9cf7e8)
   the group headings "Traveling" and "Hosting" start at the icon column, so each heading hangs left
   of the row text it governs. **Observed in the screenshot, not pixel-measured.**
2. **Dividers span margin to margin, not label to margin.** The settings hairline measures
   `x[18..279]`, the icon's left edge to the content right edge. It does **not** inset to the label
   column the way iOS's stock table view does. **Measured.**
3. **The subtitle aligns to the title, never to the icon.** In every two-line row measured, line 2's
   text-block origin equals line 1's (Linear: 290 and 290 on all five rows). The text block is one
   column; the icon sits outside it. **Measured.**

---

## 4. Numbers: right for quantities, left for identifiers

### Money is right-aligned, without exception in this sample

Right ink edge of every value in four money tables:

| screen | rows | money right edge (px) | money left edge |
|---|---|---|---|
| [Airbnb price details (iOS)](https://mobbin.com/screens/992ccadf-13af-4938-a38d-61257ef03143) | 3 | 279, 278, 279 | 240, 249, 238 |
| [Airbnb refund details (iOS)](https://mobbin.com/screens/cafad2e7-0065-483c-9f51-5b55ecd4fbb1) | 7 | 279 x6, 278 x1 | 239, 208, 245, 213, 249, 216, 231 |
| [OpenTable receipt (iOS)](https://mobbin.com/screens/14a141f3-4934-4563-84c9-e7cc1b1b45d3) | 4 | 285 x4 | 237, 237, 236, 237 |
| [Uber checkout (iOS)](https://mobbin.com/screens/9f25c2f7-4995-49d0-93fc-5626c17d55e9) | 4 | 285 x4 | 250, 259, 259, 241 |

**18 money lines, 3 apps. Right edge constant to within 1 px in every one. Left edge varies by up to
41 px.** Measured. Right-aligned, decisively, and this is a convergence, not a divergence: three
independent products agreeing is the strongest evidence class R8 recognises.

The two rows reading 278 rather than 279 are both `$17.81`. A terminal "1" paints less ink at the
right of its advance width than "3" or "4". A glyph artefact, not a layout difference, and worth
naming because it is the visible trace of why right-alignment alone does **not** line up decimal
points. See V3.

Two further measured properties:

- **Secondary lines in a money column are right-aligned too.** On the Airbnb refund screen the muted
  "of $161.00 paid" lines sit at left edges 208, 213 and 216 and all end at 279.
- **The label line and its money line share one y-centre exactly.** All 7 refund rows measure a delta
  of 0.0 px. The pairing is per line, not per block. On Uber's Total row, where the amount is visibly
  larger and bolder than its label, the delta is 0.5 px.

### Times, dates and identifiers are left-aligned

The opposite treatment, same corpus:

- [Fresha, salon About page (web)](https://mobbin.com/screens/b47dfaac-d730-408e-9ade-688c39aa4858):
  the opening-times table puts weekdays in one left-aligned column and "10.00 am - 07.00 pm" in a
  second left-aligned column.
- [Stripe, payment method domains (web)](https://mobbin.com/screens/9cc54c45-682a-42a9-9742-5ccb2e54f625):
  the "Created" timestamp column is left-aligned under a left-aligned header.

**Observed, not pixel-measured.**

The distinction is principled, which matters because it tells you what to do with a value you have not
seen yet. **Right-alignment exists so magnitudes can be compared by eye:** digits stack into
place-value columns and 118.00 visibly towers over 45.00. A time or a date has no magnitude a reader
compares that way, and the strings are the same length anyway, so right-aligning buys nothing and
costs a ragged left edge. **Quantities right, identifiers left.**

### Inside a tile, content centres

OpenTable's tip selector renders five equal-width boxes each with "20%" over "US$0.77", both centred,
on [OpenTable payment (iOS)](https://mobbin.com/screens/74f120bd-49ef-430f-b80a-b4814d65f4d7). Every
calendar date cell in the corpus centres its numeral. Edge alignment is the grammar of rows; centre
alignment is the grammar of tiles. Observed.

### One structural note specific to Solen

[Fresha's service list (iOS)](https://mobbin.com/screens/b82c55c4-339f-41d0-9493-4a6b097da8e8) has
**no price column at all.** Name, duration, description and "from $40" are all left-aligned in one
stacked column; the right slot holds only the action (a circled `+`, or a "Book" pill), centred on the
whole block. Since Fresha is Solen's locked structural reference, this matters: the services list is a
left-stack plus an action, not a two-column price table. The right-aligned money column belongs on
checkout and receipt screens. Observed.

---

## 5. Where Solen actually stands

Read from source on 2026-07-29 in this worktree. **I did not render these pages.** Everything here is
markup-level, and V4 names the render check that would close it.

### 5a. There is no row primitive, and that is the root cause

- `npm run exists SettingsRow`: **0 matches**.
- `_design-system/COMPONENT_REGISTRY.md` has no Row, ListRow or NavRow entry. The nearest neighbour is
  `Switch`, which renders a full row when given a `label`, but that is a toggle row, not a nav row.
- **27 non-dev files under `app/[locale]/` render a `ChevronRight` inside a flex row.** I read five of
  them closely and **did not classify the other 22**; several are near-certainly see-all arrows or
  carousel controls rather than nav rows.

The five I read specify five different rows:

| file:line | leading icon | gap | chevron | padding | label column left edge |
|---|---|---|---|---|---|
| `app/[locale]/profile/settings/page.tsx:140` | 22 | `gap-[14px]` | 16 | `px-4 py-[13px]` | 16+22+14 = **52** |
| `app/[locale]/_components/layout/MobileMenu.tsx:264` | 36 disc, 17 glyph | `gap-3` | 18 | (parent) | 16+36+12 = **64** |
| `app/[locale]/_components/layout/MobileMenu.tsx:435` | caller-passed | `gap-3` | 18 | `px-4 py-3.5` | **varies by caller** |
| `app/[locale]/dashboard/settings/page.tsx:1408` | 19 | `gap-3` | 18 | `px-3.5 py-3` | 14+19+12 = **45** |
| `app/[locale]/help/page.tsx:163` | none | n/a | 16 | `px-4 py-3` | **16** |

Airbnb's label column is one number on every screen measured. Solen's is 52, 64, 45, 16 and
caller-dependent. Chevrons are 16 or 18 by file. Vertical padding is `py-[13px]`, `py-3.5`, `py-3`,
`py-3`.

This is FLOORS LAW 8 ("the same thing looks the same everywhere", added 2026-07-29) landing on the
row, and FLOORS LAW 9 ("screens are composed, not drawn"). The row is the most repeated anatomy on the
estate and it has no registry owner, which is exactly why it differs per file.

### 5b. The mixed-school bug ships in `MobileMenu.tsx`

`app/[locale]/_components/layout/MobileMenu.tsx` renders two row shapes in one menu:

- **Line 264**, the Dashboard entry: `flex ... items-center gap-3` around a 36 px icon disc, a
  **two-line** stack ("Dashboard" 15 px bold over "Salon verwalten" 12 px), and an 18 px
  `ChevronRight`.
- **Line 435**, `MenuRow`: `flex w-full items-center justify-between` around an optional icon, a
  **single-line** label, and an 18 px `ChevronRight`.

`items-center` on the two-line row is school B. `items-center` on the single-line rows is school A by
default. They are stacked in the same menu. This is section 2's failure mode in shipped code on a
customer surface, and it is the best candidate I found for what the owner is actually looking at.

### 5c. One latent trap, named before it fires

`app/[locale]/profile/settings/page.tsx:138` defines `Row({ href, icon, label, sub, value })` with
`items-center`. **No call site passes `sub`** (verified: all 11 call sites, lines 89 to 103, pass only
`icon`, `label`, and one `value`). So this list is all single-line today and does **not** misalign.
The moment anyone passes `sub`, that row silently switches to block-centring while its neighbours stay
on line-centring, with no review signal. Read from source, not rendered.

### 5d. Money alignment is already correct, and is stricter than the references

`app/[locale]/walk-in-pay/page.tsx:539-550` renders the breakdown as
`flex items-baseline justify-between gap-3` with `shrink-0 tabular-nums` on every amount.
`app/[locale]/_components/primitives/PriceFrom.tsx:29` carries
`inline-flex items-baseline gap-1 tabular-nums`. 41 uses of `tabular-nums` under
`app/[locale]/_components`.

`justify-between` produces the right-aligned column section 4 measured. `items-baseline` is the
correct pairing rule where the two sides differ in size, which is the Total row (13 px label against a
22 px amount). Airbnb's Total row measured a 0.5 px centre delta so centre and baseline are
indistinguishable there, but baseline stays correct as the size gap widens. **No change needed.**

---

## 6. Verdict for Solen

### V1. Adopt school A, the title-line axis, and make it structural

Airbnb is the owner's named reference and the complaint is that our rows do not match it. On the
merits, in a row whose second line is a **value or status** (which is every settings, menu and nav row
we own), pinning satellites to the title line is also the better answer: the title is the row's
subject, the subtitle qualifies it, and the chevron acts on the subject.

Implement it so it **cannot** drift, rather than by nudging margins. Give each satellite a wrapper box
whose height equals the title's line-height, and set the row to `items-start`:

```tsx
<Link className="flex items-start gap-3 px-4 py-3">
  <span className="grid h-[22px] w-6 shrink-0 place-items-center">
    <Icon size={20} strokeWidth={1.9} className="text-s-ink" aria-hidden />
  </span>
  <span className="min-w-0 flex-1">
    <span className="block text-[15px] leading-[22px] font-medium text-s-ink">{label}</span>
    {sub ? <span className="mt-px block text-[12.5px] leading-4 text-s-ink-2">{sub}</span> : null}
  </span>
  {value ? <span className="shrink-0 text-[13.5px] leading-[22px] tabular-nums text-s-ink-2">{value}</span> : null}
  <span className="grid h-[22px] w-4 shrink-0 place-items-center">
    <ChevronRight size={16} className="text-s-ink-2" aria-hidden />
  </span>
</Link>
```

Why this shape and not `items-center` plus a margin: the wrapper's height **is** the title's line box,
so icon, value and chevron are centred on the title by construction, for one line, two lines, or a
title that wraps. Nothing needs re-tuning when copy changes, which is the whole point across de/en/fr/it
where German and French run 15 to 35 percent longer (`_rules/I18N_ROUTING.md` Rule 35). It is also the
only formulation satisfying section 1a: it aligns to the line box, so a descender in "Zahlungen"
cannot shift anything.

**The cost of this recommendation, named.** On a row whose second line is a wrapping paragraph of
three or more lines, pinning the leading icon to line 1 strands it at the top of a tall block, and
Uber's three-line "Tolls and surcharges" row is the case where block-centring genuinely looks better.
**My Airbnb sample contains no three-line row with a leading icon, so I cannot claim Airbnb solves
this.** Scope the rule accordingly: title-line axis for rows whose subtitle is a single value or
status line, which is all of ours today. A three-plus-line row is a new decision this research does
not cover.

**One value here is not locked and I am not inventing it silently:** `leading-[22px]`. The current
`text-[15px]` in `profile/settings/page.tsx` sets no explicit line-height, and the only line-height I
found in the estate is `line-height: 1.5 !important` at `app/globals.css:905`, which is scoped, not a
body default. 15 x 1.5 = 22.5, so 22 is the nearest even value. **Read it off the rendered page or ask
the owner; do not take it from me.**

### V2. Build one `SettingsRow` primitive and register it

Per FLOORS LAW 9 and the exists protocol: `npm run exists SettingsRow` returns 0 and the registry has
no Row entry, so this is genuinely net-new rather than a duplicate. It needs
`_design-system/components/SettingsRow.md` plus a `COMPONENT_REGISTRY.md` row in the same turn.

Geometry it should own, reconciled from section 3's reconstruction to Solen's 4 pt scale and `px-4`
page padding:

| token | value | grounding |
|---|---|---|
| leading icon box | 24 wide x title-line-height tall | Airbnb's box reconstructs to 24 pt; the height ties to the line box per V1 |
| icon glyph | Lucide 20 | between the 19 and 22 shipping today; 20 is a native Lucide size |
| icon-to-label gap | `gap-3` (12) | already the majority spelling, 3 of the 4 icon-bearing files read |
| label column left edge | 16 + 24 + 12 = **52** | one number, every surface |
| trailing chevron | Lucide 16 in a 16-wide box | 16 and 18 both ship; 16 reads calmer beside a 15 px label |
| row padding | `px-4 py-3` | `py-[13px]` and `py-3.5` are unexplained one-offs |
| divider | margin to margin, not inset to the label | measured, section 3 |

**Icon glyph size and chevron size are picks, not findings.** Flagged as such. If the owner wants a
different pair the rest of the table still holds. Note that this is also a live R8 divergence in the
published systems: Material makes the trailing chevron identical to the leading icon, Atlassian makes
it explicitly one step smaller. Our table follows Atlassian's side (20 leading, 16 trailing), which is
a choice, not a law.

Migration order, driven by where the mixing is visible:

1. `app/[locale]/_components/layout/MobileMenu.tsx` (both shapes, lines 264 and 435). The only
   confirmed shipped mixed-school list.
2. `app/[locale]/profile/settings/page.tsx:138`. Closes the latent `sub` trap before it fires.
3. `app/[locale]/dashboard/settings/page.tsx:1408`.
4. `app/[locale]/help/page.tsx:163`. No leading icon, so its label column starts at the page margin.
   That is a documented **variant** of the one component, not a second implementation (FLOORS LAW 8).

### V3. Write down the money rules that already work

No code change. What is missing is that none of this is stated in `LOCKFILE.md` or the design
contract, so a new price surface has nothing to comply with. Add:

- A money column is **right-aligned**, via `justify-between` with `shrink-0` on the amount.
- Money carries **`tabular-nums`**. Right-alignment alone lines up the right edge but not the decimal
  point: with proportional digits, "CHF 45.00" over "CHF 118.00" puts the separators in different
  places. Tabular figures fix it. The `$17.81` artefact in section 4 is the same effect at ink level.
- A label paired with a differently sized amount uses **`items-baseline`**, not `items-center`.
- Secondary lines in a money column are right-aligned too.
- **Times, dates and reference codes are left-aligned, not right.** Genuinely net-new to the estate
  and the rule most likely to be got wrong, because "it is a number, right-align it" is the intuitive
  and incorrect move. `_rules/` currently says nothing about it.

### V4. The render check that closes section 5

Open `/de/profile/settings` and the mobile menu at 390 x 844, run `getBoundingClientRect()` on each
row's icon, label and chevron, and confirm the three centres agree within 1 px on every row including
the two-line Dashboard entry at `MobileMenu.tsx:264`. That upgrades 5b from "read from source" to
"measured" and belongs to whoever builds V1. Until then, 5b is a source-level finding.

---

## 7. ADDENDUM: measured on our own live product, 2026-07-29

The sweep above measured the REFERENCE. This addendum measures US, because the whole dispute was
about whether our rows actually differ, and a claim about our own estate has to be measured on our
own estate.

**Instrument:** live dev server, Chrome, `getBoundingClientRect` on the rendered DOM, viewport
390x844. Offsets are the vertical distance between the element's centre and the centre of the
TITLE's first client rect (the line box, not the glyph ink, per section 1a).

### `/de/profile/settings`, 11 rows

Every row: `iconVsTitle 0.0px`, `chevVsTitle 0.0px`. Konto, Passwort, Zahlungsmethoden,
Empfehlungen anpassen, Haarprofil, Benachrichtigungs-Einstellungen, Sprache, Formulare,
Treue-Status, Stempel, Freunde einladen. All 48.5px tall, all single-line titles.

**This screen is not the defect.** It is also the screen I checked when I told the owner his
complaint was wrong, which is exactly why that answer was wrong: I measured the case that passes.

### `/de`, mobile menu open, the two-line row

| row | text blocks | row height | align-items | icon vs title line | chevron vs title line |
|---|---|---|---|---|---|
| Dashboard / Salon verwalten | 2 | 74.5px | center | **+10.0px** | **+10.0px** |
| Warum Solen | 1 | 51.5px | center | 0.0px | 0.0px |
| Service | 1 | 46.0px | center | 0.0px | n/a |
| Stadt | 1 | 46.0px | center | 0.0px | n/a |
| Zeit | 1 | 46.0px | center | 0.0px | n/a |

### The finding, stated plainly

**Single-line rows: 0.0px. Two-line rows: 10.0px off.** The split is total, with no overlap.

The mechanism is precisely the one section 6 predicted. `align-items: center` centres the icon and
the chevron against the WHOLE two-line block. On a one-line row the block and the title line are the
same box, so it looks correct and always will. Add a subtitle and the block grows downward, its
centre drops by roughly half the subtitle's line height, and the satellites follow it down while the
title stays put. 10.0px is that half-line.

Airbnb's comparable rows measure a worst case of 1.0 preview pixel across 9 rows
([mobbin.com/screens/936fbfe8](https://mobbin.com/screens/936fbfe8-4c12-4c69-95f0-6c56b7dede64)).
Ours is 10.0px. The owner said our icons, text and arrows were not at the same heights the way
Airbnb does it. He was right. I told him he was wrong because I looked at a screen made entirely of
single-line rows, where the bug is invisible by construction.

The fix is V1 above, and it is structural rather than a nudge: a wrapper box whose height equals the
title's line box, with the row set to `items-start`. That is correct for one line, two lines, and a
wrapping title, in all four locales, without re-tuning.

**Sites carrying the defect,** every row where a leading icon or trailing chevron shares a row with
a subtitle:
- `app/[locale]/_components/layout/MobileMenu.tsx:255` , confirmed by measurement above
- `app/[locale]/profile/settings/page.tsx:138` , has a `sub` branch at :144 with no current caller,
  so it is latent rather than live. It ships the bug the moment anyone passes a subtitle.
- `app/[locale]/dashboard/settings/page.tsx:1408` , not measured, auth path not opened this turn
