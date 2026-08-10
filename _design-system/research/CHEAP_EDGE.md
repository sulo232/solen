<!-- exists-check: `npm run exists edge` (8 hits) and `npm run exists shadow` (3 hits) run
     2026-07-30. Two graveyard hits are LOAD-BEARING here and are handled by name in section 5:
     (1) "borderless chrome-off model-b liftup-fs take-the-box-off" (owner reverted 2026-07-18,
     the carded style won) , NOTHING in this document proposes stripping card chrome, removing a
     box, or codifying borderless. Every fix below either DROPS ONE of two stacked mechanisms or
     ADDS a ground; none removes a card. (2) "dashboard left-edge accent-bar" (owner 2026-07-15)
     , no edge accent bar is proposed. (3) "full-bleed hero takeover" (owner denied 2026-07-16)
     , the fix for the BusinessTeaser placeholder is a real photo INSIDE the existing square
     slot, not a bleed or a takeover.
     Sibling convention: research/AXIS_GRID.md, AXIS_FONT.md, WHY_DENSITY.md,
     sections/home-feed/CORPUS.md. This is a CHEAP_* file: a single-axis measured audit of the
     shipped page, not a corpus. No new component, route, table or migration is proposed. -->

# CHEAP: EDGE, DEPTH AND COLOUR

**Date:** 2026-07-30
**Probe:** EDGE. Borders, shadows, backgrounds and colour roles on the home feed.
**Verdict in one line:** the edge discipline is largely sound and the colour palette is genuinely
tight (17 values). Two things are actually broken, and one of them is not a subtle design defect at
all: **a self-labelled image placeholder has been shipped on the live home page since 2026-05-26.**

---

## 1. Method

**Route:** `http://localhost:50723/de`, the live dev render, logged in as the seed QA user.

**Viewports:** measured twice, at **1512 x 950** and **390 x 844**. Every number below states which.
Where a defect exists at only one width, it says so.

**Instrument:** `Claude_Browser` `javascript_tool`, `getBoundingClientRect` and `getComputedStyle` on
the rendered DOM. No number in section 2 is read from source. Where I cite source it is to explain
*why* a rendered number is what it is, and the file:line is given.

**What "a container" means here.** Every element in `body` with a rendered box of at least
100 x 60 px carrying any of: `border-radius >= 8`, a non-`none` `box-shadow`, or a border on all four
sides. Instances of one component are collapsed into one recipe row with a count.

**What I excluded, and why.**
- Tailwind emits two transparent ring placeholders in front of every real `box-shadow`. Those are
  stripped before a shadow is counted, otherwise every shadowed element reports three shadows.
- Elements with `display:none`, `visibility:hidden` or `opacity:0`.
- The sticky header. My first background-band scan sampled `elementFromPoint` and hit the header's
  `bg-white/65` overlay at every scroll depth, which produced a nonsense reading of 15 background
  bands. The scan was redone excluding anything with a `fixed` or `sticky` ancestor. The corrected
  scan is what section 2d reports.
- **Loading and hover states.** `WalkInBand.tsx:105` gives its skeleton card a border AND
  `shadow-[0_6px_16px_rgba(0,0,0,0.05)]`, and six components declare `hover:shadow-elevation-3`. I
  did not measure either state, so neither is counted in the rendered totals.

**One measurement hazard worth recording,** because it invalidated two intermediate readings before I
caught it: `resize_window` reported success while the page stayed at the old size, and the viewport
silently reverted from 1512 to 390 partway through a run. Every measurement in this document
therefore asserts `innerWidth`/`innerHeight` *inside the same script that measures*, and any run
whose asserted viewport did not match the intended one was discarded and repeated.

**Corrected in flight, per rule 18.** My first section-level pass counted `<img>` elements and
reported the Inspo section as carrying zero photography. That was wrong: Inspo renders its 8 tiles as
`background-image` on divs (`/api/discovery/thumb/...`), not as `<img>`. Inspo **has** a photo anchor.
Section 2c reports the corrected count.

---

## 2. Our numbers

### 2a. Every card and grouped container: border, shadow, both, or neither

Desktop 1512 x 950 unless noted. `count` is rendered instances. Parent background is the first
non-transparent background walking up the tree.

| # | What it is | Size | Radius | Border | Shadow | Own bg | Parent bg | Photo? | n | Both? |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | SearchBar shell | 820x60 | pill | none | `0 2px 8px rgba(50,47,44,.09)` | white | white | no | 1 | no |
| 2 | FeedZone top seam | 1512x2751 | 40 top | top only, `#E4E4E7` | `0 -16px 40px rgba(26,18,9,.05)` | transparent | white | yes | 1 | seam |
| 3 | SalonCard photo | 194x155 | 22 | none | `0 2px 8px rgba(50,47,44,.09)` | `#F4F4F5` | white | **yes** | 19 | no |
| 4 | Map / Karte card | 1224x156 | 16 | 1px `#E4E4E7` | none | `#F4F4F5` | white | no | 1 | no |
| 5 | **Walk-in card** | 528x140 | 13 | 1px `#E4E4E7` | none | white | **white** | **no** | 4 | no |
| 6 | Inspo tile | 200x356 | 16 | none | none | transparent | white | **yes** | 8 | no |
| 7 | Inspo end-tile CTA | 200x380 | 16 | 2px `rgba(10,10,10,.3)` | none | white | white | no | 1 | no |
| 8 | **Review card** | 280x220 | 16 | 1px `#E4E4E7` | `0 2px 8px rgba(50,47,44,.09)` | white | **white** | **no** | 6 | **YES** |
| 9 | **BusinessTeaser placeholder** | 576x576 | 20 | none | none | `#F4F4F5` | white | **no** | 1 | no |
| 10 | Category tile (**390 only**) | 106x92 | 24 | none | `0 1px 2px rgba(50,47,44,.05)` + `0 4px 12px -6px rgba(50,47,44,.1)` | white | white | yes | 6 | no |

At 390 x 844 the same recipes render at mobile sizes (review card 260x220, walk-in card 157x140,
placeholder 358x358) and row 10 appears, since `MobileCategoriesRow` is `md:hidden`. **Row 8 is the
only "both" at either viewport**, and it is both at both viewports.

**Row 8 in source:** `app/[locale]/_components/homepage/Reviews.tsx:141-146` sets
`"rounded-2xl border bg-s-bg-surface p-4"`, `"border-s-border"`, `"shadow-elevation-2"` on the same
element.

### 2b. Shadow recipes actually rendering, and how many are system tokens

| Recipe | Token? | n (390) | Where |
|---|---|---|---|
| `0 2px 8px rgba(50,47,44,.09)` | **`elevation-2`** | 20 | SearchBar, SalonCard photo |
| `0 2px 8px rgba(50,47,44,.09)` + 1px `#E4E4E7` | token + border | 6 | Review cards (the violation) |
| `0 1px 3px rgba(0,0,0,.1)` + inset white, 1px `rgba(255,255,255,.6)` | **`FROST_GLASS`** | 27 | Heart buttons over photos |
| `0 1px 5px rgba(0,0,0,.3)` | arbitrary | 13 | Rating pills over photos |
| `0 1px 3px rgba(26,18,9,.1)` + 1px `rgba(255,255,255,.75)` | arbitrary | 8 | Inspo caption pills |
| `0 1px 2px rgba(50,47,44,.05)` + `0 4px 12px -6px rgba(50,47,44,.1)` | arbitrary | 6 | Category tiles (390 only) |
| `0 -12px 32px rgba(26,18,9,.04)` (390) / `0 -16px 40px rgba(26,18,9,.05)` (1512) | arbitrary | 1 | FeedZone seam |
| `0 2px 10px rgba(0,0,0,.12)` | arbitrary | 1 | One over-photo pill |
| `0 4px 14px rgba(0,0,0,.1)` | arbitrary | 1 | Ink CTA |

**9 distinct shadow recipes render. 2 of the 9 are system tokens** (`elevation-2`, `FROST_GLASS`).
The seam recipe **changes value between breakpoints** (`.04`/32px at 390, `.05`/40px at 1512), which
is a deliberate-looking scale but is written as two unrelated literals.

In the source folder, counting declarations rather than renders:

```
app/[locale]/_components/homepage/ :
  shadow-whisper        0 uses, 0 files
  shadow-elevation-2    6 uses
  shadow-elevation-3    3 uses
  shadow-[...]         25 uses across 22 DISTINCT hardcoded literals
```

**25 of 34 shadow declarations (74%) are arbitrary one-off literals.** And
`shadow-whisper`, the token LOCKFILE §17.2 names as the card shadow, **is used zero times on this
page.** Several of the unrendered literals carry chromatic tints
(`rgba(5,79,49,.32)`, `rgba(31,92,66,.25)`, `rgba(4,51,56,.10)`, green and teal) against a token
system whose shadows are deliberately warm `rgba(50,47,44,…)`. I did not verify those render on
`/de`; they are in the files, not in my rendered set of 9.

### 2c. Sections, their photo anchor, and their ground

Desktop 1512 x 950. Photo area is measured area of `<img>` plus `background-image` divs, as a
percentage of the section's own box.

| Section | y | h | Photo area | Ground it sits on | Tray? |
|---|---|---|---|---|---|
| Hero | 80 | 335 | 0% | white | no |
| Top auf Solen | 464 | 312 | 25.5% | white | no |
| In der Nähe | 791 | 472 | 63.3% | white | no |
| **Walk-in** | 1279 | 311 | **0%** | white | **no** |
| Inspiration | 1606 | 488 | present (8 bg-image tiles) | white | no |
| **Bewertungen** | 2110 | 312 | **0%** | white | **no** |
| **Für dein Geschäft** | 2438 | 736 | **0%** (331,776 px of it is a grey placeholder) | white | **no** |

**3 of 7 sections carry zero photography, sit on white, and have no tray.**

### 2d. Background rhythm down the page

Sampled every 20 px at the left page gutter, fixed and sticky layers excluded.

| Viewport | Page height | White | Sunken `#F4F4F5` | Bands |
|---|---|---|---|---|
| 1512 x 950 | 3698 px | **97.3%** | 2.7% | 3: white 0-3180, sunken 3200-3280, white 3300-3680 |
| 390 x 844 | 4316 px | **95.5%** | 4.2% | 3: white 0-3400, sunken 3420-3580, white 3600-4280 |

The single sunken band at both widths is in the footer newsletter strip. **The entire content column,
3180 px on desktop and 3400 px on mobile, is one unbroken white field with zero alternation.**

### 2e. Colour census

**17 distinct colour values at each viewport** (18 in union; mobile adds the Swiss flag red, desktop
carries a second header-alpha step). Role counts are element counts, not area.

| Colour | Token | Roles (n) | Class |
|---|---|---|---|
| `#0A0A0A` | `s-ink` | text 91, svg-stroke 74, bg 5 | chrome |
| `#6B6B6B` | `s-ink-2` | text 160, svg-stroke 58 | chrome |
| `#FFFFFF` | white | bg 38, text 12, svg 8 | chrome |
| `#F4F4F5` | `s-bg-sunken` | bg 32 | chrome |
| `#E4E4E7` | `s-border` | border 21 | chrome |
| `rgba(255,255,255, .45/.6/.75/.8/.95)` | frost family | bg 37, border 35 | chrome |
| `rgba(0,0,0,.55)` | over-photo scrim | bg 8 | chrome |
| `rgba(10,10,10,.3)` | none | border 1 | chrome, off-token |
| `#000000` | none | svg-fill 1 | chrome |
| `#FFC32B` | `s-star` | svg-fill 128, svg-stroke 8 | **semantic** |
| `#276EF1` | `s-accent` | text 4, bg 1 | **semantic** |
| `#16A34A` | `s-success` | **text 4**, bg 1 | **semantic token, decorative use** |
| `#DA291C` (390) | none | svg-fill 1 (13x13 rect) | content (Swiss flag glyph) |

**One decorative colour found, and exactly one.** `#16A34A` on the walk-in wait figure.

`WalkInBand.tsx:125` renders
`<div className="font-display text-[20px] font-bold ... text-s-success">` and the only branch below
it is on the *string*, not the colour:

```
{sofort ? "Jetzt frei" : `${s.waitMinutes}-${s.waitMinutesMax} Min`}
```

So **"Jetzt frei" and "70-98 Min" render in the identical success green.** Measured live: two cards
read "70-98 Min" and two read "35-49 Min", all four in `#16A34A` at 20px/700, the largest and boldest
element on the card. A 98-minute wait is not a success and the colour does not discriminate between a
35-minute wait and a 98-minute one. The token is being spent on the slot, not on the state.

Contrast, computed independently rather than quoted: `#16A34A` relative luminance 0.2686, against
white **3.30:1**. At 20px weight 700 this qualifies as WCAG large text (>= 18.66 px bold), floor
3:1, so it **passes AA**. This is a semantic-integrity break, not a statutory one, and I am not going
to inflate it into one.

The blue `(16)` review counts: `#276EF1` on white is **4.58:1**, passes AA for normal text, and every
instance is inside an `<a>`. Legitimate.

---

## 3. The reference numbers

**Instrument:** Mobbin MCP, 2 web searches this session, 22 screens returned and examined as images.
**Precision, stated before any claim:** Mobbin renders web captures at roughly **768 px wide**, so no
absolute pixel value below is claimed. What survives that downscale reliably is (a) a large flat
ground tint, and (b) a 1 px hairline against white. What does **not** reliably survive is a low-alpha
drop shadow: a 9%-alpha, 8 px-blur shadow at 768 px is at the edge of perceptible. Every claim below
is therefore phrased as **"no visible shadow"**, never as "no shadow in the source CSS".

### 3a. Review and testimonial cards, 10 screens

The directly comparable case, because our worst offender is a review rail.

| App | Card fill | Card border | Visible shadow | Band ground |
|---|---|---|---|---|
| [Turo](https://mobbin.com/screens/ec5b8dfa-605e-4bf7-b038-d216b29f4301) | white | **none** | none | **pale lavender band** |
| [Blue Apron](https://mobbin.com/screens/cd8c5b70-f92d-4052-a030-ddbb781a2529) | white | hairline | none | **saturated ochre band** |
| [Klaviyo](https://mobbin.com/screens/9a10693c-f337-4888-9e26-f41aca733290) | white | hairline | none | light grey page |
| [Literal](https://mobbin.com/screens/c62697d0-5e64-4cfb-8923-5b1ad1d948c0) | white | none | none | light grey page |
| [Assembly](https://mobbin.com/screens/e888ea97-01f1-4dcc-a82e-f20d21ea71a0) | **filled warm grey** | none | none | white |
| [SuperHi](https://mobbin.com/screens/3293593d-5c53-4ecb-b26b-903b408e1ba3) | **saturated fills** | none | none | green band |
| [Savee](https://mobbin.com/screens/71e85279-38da-49cc-a0e1-bf0a8ae3d113) | near-black step | hairline | none | dark page |
| [Fey](https://mobbin.com/screens/6929ddb6-58a8-46c1-b02b-a7ec51179c3d) | near-black step | hairline | none | dark page |
| [Etsy](https://mobbin.com/screens/60c4ec7d-a26e-40f3-abc1-63aeab36624b) | white | hairline | none | white |
| [Uxcel](https://mobbin.com/screens/c68570fa-e631-430d-ad00-131a38a836ca) | white | hairline | none | white |

**The ratios that survive scaling:**
- **8 of 10** give the review band a ground distinct from the page, by tinting the band, filling the
  card, or running the page dark. The separation is spent on the **ground**, across 100% of the band
  width.
- The **2 of 10** that keep a white card on white (Etsy, Uxcel) carry a hairline **and nothing else**.
- **0 of 10** stack a hairline and a visible shadow on a white card on a white page.
- **Mechanism count per card: 1, in 10 of 10.** Nobody spends two.

### 3b. Provider and marketplace feed cards, 12 screens

| Boundary mechanism | Apps |
|---|---|
| **Photo edge only** (no border, no visible shadow) | [Airtasker](https://mobbin.com/screens/756a4205-72b6-4e12-ac24-c7f31f921cfe), [Care.com](https://mobbin.com/screens/f5a2f425-cc06-4022-ac37-1587cb49d91f), [Square](https://mobbin.com/screens/71831d71-cbe0-4fbe-91c5-693adb70270f), [Dribbble](https://mobbin.com/screens/848d4265-d957-4bdc-b48b-6bbe6af9896b), [Shopify](https://mobbin.com/screens/a87f8a97-5044-4395-a684-6c29bc9594fd) |
| **Hairline only**, card on white | [Fiverr](https://mobbin.com/screens/763b7cc1-340d-4199-ac53-1f5bce3f30f6), [Whop](https://mobbin.com/screens/31012607-63d1-49cc-bfb7-d818fee811e3), [Jira](https://mobbin.com/screens/d8ef5d79-a346-4974-8968-1d25b8b5223e), [Preply](https://mobbin.com/screens/2bc08d44-af44-4514-84e8-23a31de91eeb) |
| **Hairline + tinted page** | [Braintrust](https://mobbin.com/screens/04c74b55-a789-4d52-8957-248cd53d942d), [Base44](https://mobbin.com/screens/38e7ea77-4001-4686-bad2-c484715ab1a4), [Relevance AI](https://mobbin.com/screens/583633c0-8408-4913-84de-ff2b6ff0f346) |

**0 of 12 carry a visible drop shadow, on any card type. Of the 5 that are photo-top cards, all 5 use
the photo edge alone**, with no border and no visible shadow. That is the exact structural analogue of
our `SalonCard`.

**Two secondary observations, both robust to downscaling.**
1. [Airtasker](https://mobbin.com/screens/756a4205-72b6-4e12-ac24-c7f31f921cfe) and
   [Care.com](https://mobbin.com/screens/f5a2f425-cc06-4022-ac37-1587cb49d91f) independently end a
   card rail with a **filled grey tile carrying a label** ("Can't find what...", "More"). Both use a
   flat fill and no chrome. Our equivalent, the Inspo end-tile, is a white box with a 2 px
   30%-ink border, which is the loudest border on our page and the only one not on `#E4E4E7`.
2. [Preply](https://mobbin.com/screens/2bc08d44-af44-4514-84e8-23a31de91eeb) marks its selected row
   with a **thicker dark border and no shadow change**. Depth is not used to encode state anywhere in
   either sample.

---

## 4. Verdict per item

Ordered worst first. I have been willing to write FINE and did so seven times.

| # | Item | Verdict | Evidence |
|---|---|---|---|
| 1 | **BusinessTeaser image placeholder** | **BREAKS A FLOOR (three)** | 576x576 = **23.1% of the desktop viewport**, 358x358 = **38.9% of the mobile viewport**. `bg-s-bg-sunken` at **1.10:1** against the page (its own edge is barely perceivable, so it reads as a hole rather than a card) with a 56 px `#6B6B6B` Lucide icon at 4.85:1 on it. Breaks the finished-screen pass item (e) "no dead-grey zone", NEVER-AGAIN floor 4 "an empty-state focal icon is a clean ink or a vivid `.DEFAULT` token, NEVER a washed-out gray disc", and FLOORS LAW 2's "a photo-first surface NEVER renders a bare grey box". `BusinessTeaser.tsx:44` |
| 2 | **Review cards carry border AND shadow** | **BREAKS A FLOOR** | 6 instances at both viewports. LOCKFILE §17.2: "a card carrying elevation drops its border, never both". Also §637: "Never stack fill + shadow + border at rest". Reference: 0 of 10 review-card screens do this. `Reviews.tsx:141-146` |
| 3 | **Panel content on white with no photo anchor and no tray** | **BREAKS A FLOOR** | Walk-in (0% photo) and Bewertungen (0% photo) both render rails of white cards on a white page. FLOORS LAW 4: "grouped/list/panel content on white with no photo anchor REQUIRES the sunken tray". Reference: 8 of 10 give the review band its own ground. |
| 4 | **Zero background alternation** | **BREAKS A FLOOR** | 97.3% white desktop / 95.5% mobile, one 100 px sunken band, and it is in the footer. FLOORS LAW 4: "alternate gray and white down a page for rhythm". |
| 5 | **`#16A34A` on the walk-in wait figure** | **BREAKS A FLOOR** (taste, not statutory) | Applied unconditionally at `WalkInBand.tsx:125`; "Jetzt frei" and "70-98 Min" render identically. Taste rule 4: "Success and heart are legal as ICONS, never as body text." Contrast 3.30:1 at 20px/700 **passes** AA large text, so this is a semantic break, not an accessibility one. |
| 6 | **Shadow vocabulary** | **BELOW THE REFERENCE** | 9 rendered recipes, only 2 of them tokens; 25 of 34 source declarations are arbitrary literals across 22 distinct values; `shadow-whisper` used zero times. Every reference app in both samples reads as one or two depth steps. Not a named floor break (no floor caps shadow variety), which is itself worth noting. |
| 7 | **Radius vocabulary** | **BELOW THE REFERENCE** | 8 distinct radii render (11, 13, 16, 20, 22, 28, 40, pill). The design contract names 12, 16, 24, 28, 0 and pill. Non-contract values in use: 11 (SearchBar), **13 (walk-in card)**, 20 (placeholder), 22 (SalonCard photo), 40 (FeedZone seam). 22 and 40 are documented elsewhere; 11 and 13 are not. |
| 8 | Inspo end-tile border | **BELOW THE REFERENCE** | 2 px `rgba(10,10,10,.3)`, the only non-`#E4E4E7` border on the page and roughly 4x the visual weight of every other edge. Two reference apps solve the same "end of rail" slot with a flat grey fill and no chrome. |
| 9 | SalonCard photo shadow | **FINE** | `elevation-2`, no border, flush photo edge. Satisfies the edge-visibility floor twice over (route b and route c). The references use the photo edge alone, so we spend one mechanism they do not, but at 9% alpha it is imperceptible and it breaks nothing. Leave it. |
| 10 | SearchBar shell | **FINE** | White on white with `elevation-2` and no border is precisely edge-visibility route (c), "on white keep the hairline OR step to elevation-2". The 4%-shadow-on-white case the floor bans is a different, lighter recipe. The owner likes this bar; nothing here argues with it. |
| 11 | Over-photo controls | **FINE** | 27 heart buttons on `FROST_GLASS` and 13 rating pills at `rgba(0,0,0,.3)`. A heavier shadow over a photograph is correct, not drift: it has to be darker to be perceivable against image noise. This is the sanctioned control-elevation case. |
| 12 | FeedZone top seam | **FINE** | Top border plus an upward shadow is a border-and-shadow pair, but it is a **seam**, not a card, and it is the one place on the page where the two mechanisms describe one idea (a sheet lifting off the hero). |
| 13 | Map / Karte card | **FINE** | Sunken fill plus a hairline, no shadow. One fill step and one hairline, no stacking. |
| 14 | Inspo tiles | **FINE** | Flush photo edge, no border, no shadow. Matches 5 of 5 photo-card references exactly. |
| 15 | The colour palette overall | **FINE, and better than the reference** | 17 values total, of which 12 are pure chrome and 3 are semantic. Only **one** decorative use in the entire page. Whatever makes this page read cheap, an undisciplined palette is not it, and no fix should touch the palette. |
| 16 | Green "Live" dot | **FINE** | `WalkInBand.tsx:93`. Owner pick 2026-06-29 with a recorded rationale ("wait/queue are real-time, so a Live marker is honest signal, not decoration"). Mildly redundant beside the word "Live", but it is a settled dated call and rule 10 governs. |

---

## 5. The single worst thing on this axis, and what it would take to fix

### The finding

**`app/[locale]/_components/homepage/BusinessTeaser.tsx:40-53` renders a self-labelled image
placeholder on the live home page, and it has been there since 2026-05-26.**

```html
<div role="img"
     aria-label="Bild-Platzhalter — Solon-Hero wird ersetzt"
     class="... aspect-square w-full ... bg-s-bg-sunken grid place-items-center">
  <ImageIcon size={56} strokeWidth={1.25} className="text-s-ink-2" />
</div>
```

The number behind it: **331,776 px, 23.1% of a 1512 x 950 viewport, and 38.9% of a 390 x 844 one.**
A flat `#F4F4F5` field at **1.10:1** against the page white, with a single 56 px `#6B6B6B` outline
icon centred in it. The in-file comment dates it: `V3-D166 (2026-05-26): real illustration removed
per user , placeholder while a replacement is in flight`. That is **65 days in flight** as of today.

**Why this is the worst thing on the edge axis and not merely a content gap.** A grey rectangle with
a picture-frame icon in the middle is the universal browser and operating-system signal for *this
image failed to load*. It is not a neutral empty slot; it is an active claim that the page is broken.
Nearly two fifths of a mobile viewport, on a marketplace with no brand yet, spends itself saying
"unfinished". The brief listed "content that is real but arranged as though it were placeholder" as a
candidate cause of cheapness. This is the literal case: content that **is** a placeholder, shipped.

It also breaks three written floors at once, which no other item on this page does: the
finished-screen pass item (e) no dead-grey zone, NEVER-AGAIN floor 4 no muted focal (this is exactly
the "gray-disc blob" the floor was written about, at 12x the area), and FLOORS LAW 2's "a photo-first
surface NEVER renders a bare grey box , a missing photo gets the spec'd fallback".

Two smaller things ride along and should be fixed in the same edit: the `aria-label` contains an
em-dash, which is banned in all shipped copy, and it says **"Solon"**, a typo for Solen, announced to
every screen reader that reaches it.

### What it would take to fix

**This is a content decision, not a design one, and it needs the owner.** The fix is one of:

1. **Restore the original.** The file the comment points at,
   `public/illustrations/business/business-hero-square.png`, is still in the repo. The comment gives
   the exact revert: swap the block back to `<Image src=...>` and re-add the `next/image` import.
   Blocked on why it was removed on 2026-05-26, which the comment records only as "per user".
2. **Show a real salon instead.** FLOORS LAW 2 is explicit that the imagery floor is met by
   surfacing real salon content and **never** by a photo baked into a component, and
   `no-decorative-image-gate.py` will block a hardcoded `src` anyway. A data-driven photo of an actual
   partner salon in the existing square slot satisfies the floor, the gate and the section's own
   argument ("Solen für dein Geschäft") at the same time.
3. **Cut the square and let the text block run full width.** Removes 736 px of section height and
   the dead-grey zone with it. Cheapest, and it costs the section its only visual anchor.

**I recommend 2, with 3 as the interim if no photo is available today.** Option 2 is the only one that
turns the worst liability on the page into evidence of supply, which is the thing
`WHY_DENSITY.md` section 4c identifies as Solen's actual missing ingredient. Option 1 is a revert to
something the owner already rejected once, and re-proposing a rejected asset without asking is the
failure mode the graveyard exists to prevent.

**Named cost of my own recommendation, so it is not a free pick.** Option 2 makes a marketing section
depend on a live query, which means it can render empty or slow, and the B2B teaser is the one
section on the home page where a *representative* image arguably beats a *real* one: a specific
salon's interior in the "for salons" pitch reads as an endorsement that salon has not given. If that
matters, option 3 is the honest answer, not option 2.

**What the fix must NOT be.** `npm run exists shadow` returns the 2026-07-18 graveyard line:
borderless "chrome off, density stays" was reverted and the carded style won. Nothing here proposes
taking a box off. Fixes 2 and 3 in the table below drop one of two stacked mechanisms or add a
ground; neither removes a card.

### The rest, in priority order, all small

- **Reviews card:** delete `"shadow-elevation-2"` from `Reviews.tsx:145` and keep the border, or keep
  the shadow and delete the border. §17.2 does not say which, and the reference is 10 of 10 for
  "hairline, no shadow". Recommend deleting the shadow. One line.
- **Walk-in and Bewertungen trays:** wrap each section in `bg-s-bg-sunken`. This closes floor breaks
  3 and 4 together, because it is also the alternation the page has none of. It is the highest
  ratio of "floors closed" to "lines changed" on this list.
- **Walk-in wait colour:** either make `#16A34A` conditional on a real threshold (short wait green,
  long wait ink or `s-warning`) so the token encodes something, or take it to ink. Do not leave a
  semantic token applied to a slot regardless of state.

---

## 6. A stale claim in an existing doc, surfaced not overwritten

Per rule 18. **`LOCKFILE.md:625` states `elevation-2` = `0 4px 12px rgba(50,47,44,0.08), 0 2px 4px
rgba(50,47,44,0.04)`, a two-layer shadow.** Both `tailwind.config.js:279` and the rendered
`getComputedStyle` say it is **`0 2px 8px rgba(50,47,44,0.09)`, single-layer**, and the config
carries a dated reason: "V3 (2026-06-29, owner + council): single-layer (the old two-layer read as a
'double line')". The config is the later dated decision and wins on the precedence chain; the
LOCKFILE box-shadow table was never updated when that landed. Anyone reading the LOCKFILE table today
gets the wrong value. Flagging rather than editing, since only the orchestrator writes the LOCKFILE.

---

## 7. What I could not determine

1. **Whether any of this is what the owner means by "cheap".** I measured edges, depth and colour on
   one probe. The palette came back tight and the edge discipline came back mostly sound, so on this
   axis there is exactly one large finding and it is a content placeholder rather than a design
   defect. If the cheapness is in type, spacing or photo ratio, this document does not reach it.
2. **Hover and loading states.** `WalkInBand.tsx:105` stacks a border and a shadow on its skeleton
   card, and six components declare `hover:shadow-elevation-3`. I measured rest state only.
3. **Whether the 22 arbitrary shadow literals in the homepage folder all render.** 9 recipes render
   on `/de`; the rest sit behind conditions I did not trigger. The chromatic ones
   (`rgba(5,79,49,.32)` and siblings) are worth a separate look.
4. **Reference shadow values.** Mobbin's 768 px web render cannot settle whether a low-alpha shadow
   exists in a competitor's CSS. Every reference claim here is about a **visible** shadow, a hairline,
   or a ground tint, which are the three things that do survive the downscale.
5. **Whether the 3 sections with no photo anchor should get a tray or should get photography.** The
   tray closes the floor. Photography would close it better and is a bigger change. I did not measure
   what photography is available for a review card or a walk-in card.
