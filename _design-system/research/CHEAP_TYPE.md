# CHEAP: TYPE

<!-- exists-check: `npm run exists type` / `font` not re-run here; the type corpus already in this
     repo was read in full first and this file DEFERS to it rather than restating it.
     research/AXIS_FONT.md (2026-07-29) = competitive corpus + Inter-vs-Inter-Tight metrics + a
     SOURCE-CODE class inventory (9 named Tailwind steps, 68.1% of authored weights >= 600).
     research/FLATNESS_DIAGNOSIS_2026-07-25.md = the original 86%-bold measurement.
     research/TASTE_TYPOGRAPHY.md = external-source findings on heading levels and emphasis stacking.
     What none of them contains, and what this file adds: (1) a RENDERED per-leaf measurement of
     `/de` at both viewports with a viewport-band breakdown, (2) the arbitrary-value size census
     (42 `text-[Npx]` values, 267 half-step occurrences) that the named-step inventory could not see,
     (3) PIL-measured reference ratios with the method validated against our own ground truth, and
     (4) the LOCKFILE-versus-LOCKFILE contradiction that is holding the SalonCard flat.
     No new component, route, table or migration is proposed. -->

**Date:** 2026-07-30
**Route:** `http://localhost:50723/de` (dev server, seed data)
**Instrument:** Playwright + headless Chromium, `getComputedStyle` per text leaf. Reference screens
measured with PIL over downloaded Mobbin images.

---

## 1. Method

### What was measured

Every **text leaf** on `/de`: the parent element of every non-empty text node, deduplicated, with
`fontSize`, `fontWeight`, `fontFamily`, `color`, `letterSpacing`, `lineHeight` and
`getBoundingClientRect` read off the rendered page. No number below is read from source. The two
numbers that ARE from source (the arbitrary-size census in 2d, the LOCKFILE quotes in 5) say so.

Two viewports, measured in separate browser contexts:

- **390 x 844**, `isMobile: true`, `hasTouch: true`, `deviceScaleFactor: 1`
- **1512 x 950**, desktop, `deviceScaleFactor: 1`

Three scopes per viewport: the **first viewport** (scroll 0, occlusion-hit-tested), the **whole
page**, and a **per-viewport-height band** walk down the document.

### What was excluded, and why

- `<script>`, `<style>`, `<noscript>`, `<title>` text.
- Anything with `display:none`, `visibility:hidden` or `opacity:0` anywhere in its ancestor chain.
- Screen-reader-only text (`clip: rect(0,0,0,0)`).
- Zero-area elements.
- **In first-viewport scope only:** any element whose centre point fails
  `document.elementFromPoint`, so a Mapbox marker mid-flight outside the map's clip is not counted
  as visible. This mattered: an un-hit-tested first pass counted 6 map pins that were not on screen.
- The **cookie banner** was suppressed by seeding the privacy-preserving consent choice
  (`solen-cookie-consent` = necessary true, analytics false, marketing false) in an init script. An
  unseeded run put the banner over the mobile first viewport and contaminated it with 2 of 16 leaves.

### Two traps worth naming, because they silently corrupt this measurement

1. **`scroll-behavior: smooth` defeats `window.scrollTo(0,0)`.** The scroll animates, a synchronous
   probe fired immediately after reads the OLD positions. First run reported the H1 at y = -7. Fix:
   set `scrollBehavior='auto'` first, then scroll, then measure in a separate tick.
2. **The shared browser tab is not yours.** Mid-session another agent resized the shared Chrome tab
   from 1512 to 390 between two of my calls. Every number in this file comes from an isolated
   headless context I own, not from the shared preview tab.

### Reference method, and its validation

Mobbin serves web screenshots at 768 px wide with unknown capture width, so no absolute px is
claimed. Ink height of a text run is measured with PIL (contiguous dark rows inside a hand-set box),
then converted to a size estimate by `size = ink / k`, where **k = 0.73** for a run containing a
capital or lining digits and no descender (cap height; Inter's measured cap/em is 0.727 per
AXIS_FONT 5a) and **k = 0.92** for a run carrying both ascender and descender.

**The method was validated against ground truth on our own screenshot**, where the true font size is
known from `getComputedStyle`:

| Solen run | true px | ink px | k | derived px | error |
|---|---|---|---|---|---|
| H1 "Termine, sofort bestätigt." | 44 | 34 | 0.75 | 45.3 | +3.0% |
| sub "Beauty & Wellness in der ganzen Schweiz." | 20 | 18 | 0.92 | 19.6 | -2.2% |
| H2 "Top auf Solen" | 20 | 19 | 0.92 | 20.7 | +3.4% |
| card name "Cuts & Culture" | 14 | 10 | 0.73 | 13.7 | -2.1% |
| card meta "4056 Basel" | 12 | 9 | 0.73 | 12.3 | +2.5% |
| card category "Barbershop" | 12 | 11 | 0.92 | 12.0 | 0.0% |

Worst error 3.4%. **Reference RATIOS below are therefore good to roughly +/- 5%, and absolute
reference px are render-px at 768, never the competitor's real px.**

---

## 2. Our numbers

### 2a. First viewport, both widths

| Metric | 390 x 844 | 1512 x 950 | Floor |
|---|---|---|---|
| visible text leaves | 14 | 44 | none |
| **distinct font sizes** | **6** | **8** | <= 4 |
| size histogram | 12x6, 14x3, 15x1, 18x2, 28x1, 31.2x1 | 12x20, 13x5, 13.5x1, 14x12, 15x1, 20x3, 28x1, 44x1 | |
| largest | 31.2 | 44 | >= 28 |
| smallest | 12 | 12 | none |
| spread (max - min) | 19.2 px | 32 px | none |
| modal size (the shipped body) | **12** (43%) | **12** (45%) | none |
| anchor / modal size | 2.60 | 3.67 | >= 1.8 |
| anchor / 14 (contract "body") | 2.23 | 3.14 | >= 1.8 |
| anchor / 16 | 1.95 | 2.75 | >= 1.8 |
| **weight >= 600, by leaf count** | **28.6%** (4 of 14) | **22.7%** (10 of 44) | <= ~30% |
| weight >= 600, by rendered text area | 49.1% | 37.0% | (not the house metric) |
| leaves in the 11 to 14 px band | 64.3% | 86.4% | none |
| typefaces rendered | Inter Tight 4, Inter 10 | Inter Tight 5, Inter 31, **Helvetica Neue 8** | one system |

The 28 px leaf at both widths is the "Solen" wordmark in the header, not content. The real content
anchor is the H1: `text-[clamp(30px,8vw,44px)]`, so 31.2 px at 390 and 44 px at 1512.

### 2b. Whole page

| Metric | 390 x 844 | 1512 x 950 |
|---|---|---|
| text leaves | 262 | 254 |
| document height | 4283 px (5.1 viewports) | 3663 px (3.9 viewports) |
| **distinct font sizes** | **14** | **15** |
| sizes present | 11, 12, 12.5, 13, 14, 15, 16, 17, 18, 20, 22, 25, 28, 31.2 | 11, 12, 12.5, 13, 13.5, 14, 15, 16, 17, 18, 20, 22, 28, 40, 44 |
| modal size | 12 px (**56.5%** of all text) | 12 px (**52.8%** of all text) |
| leaves in the 11 to 14 px band | **93.1%** | **92.5%** |
| weight >= 600, by leaf count | **32.1%** | **33.1%** |
| typefaces rendered | Inter Tight 27, Inter 209, **Helvetica Neue 26** | Inter Tight 26, Inter 202, **Helvetica Neue 26** |

### 2c. Per viewport-height band: the number that matters most

The home page is 4 to 5 screens tall. Both floors ("one anchor >= 28 px", "anchor >= 1.8x body") are
written **per screen**. Measured per screen-height band:

**Desktop, 1512 x 950**

| band | y range | leaves | distinct sizes | largest | mode | largest/mode | weight >= 600 | largest element |
|---|---|---|---|---|---|---|---|---|
| 0 | 0 to 950 | 53 | 9 | 44 | 12 | **3.67** | 28.3% | H1 "Termine, sofort bestätigt." |
| **1** | **950 to 1900** | **74** | **6** | **20** | **12** | **1.67** | **39.2%** | **"70-98 Min" (walk-in wait)** |
| 2 | 1900 to 2850 | 43 | 7 | 40 | 12 | 3.33 | 46.5% | "Solen für" (partner CTA) |
| 3 | 2850 to 3800 | 22 | 5 | 22 | 13 | 1.69 | 31.8% | "Solen" (footer wordmark) |

**Mobile, 390 x 844**

| band | y range | leaves | distinct sizes | largest | mode | largest/mode | weight >= 600 | largest element |
|---|---|---|---|---|---|---|---|---|
| 0 | 0 to 844 | 17 | 6 | 31.2 | 12 | 2.60 | 35.3% | H1 |
| **1** | **844 to 1688** | **35** | **5** | **18** | **12** | **1.50** | **31.4%** | **"In der Nähe"** |
| **2** | **1688 to 2532** | **39** | **5** | **20** | **12** | **1.67** | **61.5%** | **"70-98 Min"** |
| 3 | 2532 to 3376 | 4 | 3 | 25 | 14 | 1.79 | 75.0% | "Solen für" |
| 4 | 3376 to 4220 | 22 | 5 | 22 | 13 | 1.69 | 31.8% | "Solen" (footer) |

Band 1 on desktop is the feed: the "Top auf Solen" card row, the "In der Nähe" map plus card row, and
the walk-in cards. **It is the densest band on the page (74 of 254 leaves, 29% of all text) and it
has no anchor.** Its largest element is 20 px, its body is 12 px, ratio 1.67.

And the largest element in that band is not a heading. It is `70-98 Min`, the walk-in wait estimate:
**20 px, weight 700, `#16A34A` green, Inter Tight**, the only saturated-colour text in the band. Its
own section header "Top auf Solen" is the same 20 px at weight 600 in ink. So the single loudest
piece of typography in the product's feed is an estimated waiting time.

### 2d. The SalonCard, every field, measured

`app/[locale]/_components/homepage/SalonCard.tsx`, rendered at 1512 x 950:

| field | line | size | weight | colour | family | tabular |
|---|---|---|---|---|---|---|
| name "Cuts & Culture" | 505 | 14 px | **500** | `#0A0A0A` | Inter | no |
| rating "4.8" | 509 | 13 px | 400 | `#6B6B6B` | Inter | yes |
| category "Barbershop" | 520 | 12 px | 400 | `#6B6B6B` | Inter | no |
| address "4056 Basel" | 529 | 12 px | 400 | `#6B6B6B` | Inter | no |
| **price "15 CHF"** | **534** | **12 px** | **400** | **`#6B6B6B`** | **Inter** | yes |

**Three of the five fields render at identical size, identical weight and identical colour.** Four of
five are `#6B6B6B` at weight 400. The card's whole size range is 14 to 12, a ratio of **1.17**.

The price is not styled loosely. It is rendered through `<CardMeta>`, the same primitive as the
address (`app/[locale]/_components/primitives/CardText.tsx:47`), whose docstring lists price as
recessive meta by name. See section 5.

### 2e. Two typefaces render where one is specified

26 elements on the page, 10.2% of all text, compute to `"Helvetica Neue", Arial, Helvetica,
sans-serif`. Cause, confirmed on disk: `node_modules/mapbox-gl/dist/mapbox-gl.css:1` opens with
`.mapboxgl-map{font:12px/20px Helvetica Neue,Arial,Helvetica,sans-serif;...}`, and the marker built
in `app/[locale]/_components/homepage/NearbyMap.tsx:49-80` carries no font class, so it inherits.

The consequence is visible in one viewport at 1512 x 950. The same datum, a salon rating, renders
twice:

| where | y | size | weight | family |
|---|---|---|---|---|
| SalonCard row | 655 | 13 px | 400 | Inter |
| map pin, same page | 745 | 12 px | 600 | **Helvetica Neue** |

### 2f. Size census from source, which the rendered count understates

`grep` over `app/` and `components/` in this worktree, 2026-07-30:

- **42 distinct arbitrary `text-[Npx]` values**, across **2,460 occurrences**.
- Plus the **9 named Tailwind steps** already counted in AXIS_FONT 5b.
- **267 of those occurrences are half-pixel steps**: `text-[12.5px]` 140, `text-[13.5px]` 95,
  `text-[14.5px]` 17, `text-[11.5px]` 8, `text-[10.5px]` 4, `text-[15.5px]` 2, `text-[9.5px]` 1.
- The top four arbitrary values are 12 px (601), 13 px (546), 14 px (only 424) and 15 px (242).

`text-[13px]` is the second-most-used size in the estate and **13 px appears nowhere in the design
contract's `text size` row**, which names 14 / 12 / clamp(18,2vw,20) / 14 / 15 / 11 plus the >= 28
anchor.

`tailwind.config.js` still extends no `fontSize` scale (AXIS_FONT F3, unchanged). There is **no
type-scale gate live in this repo**: I checked `package.json` scripts on this worktree and on
`/Users/sulo/Documents/solen` for anything matching `consist` (none), listed `.claude/hooks` on both
(no type or scale hook), and grepped `.claude/hooks` and `~/.claude/hooks` for
`type.scale|typeScale|font.size.scale` (one unrelated hit). The memory note
`project_consistency_system.md` describes a live type-scale gate; on disk today it is not here.
Flagging per rule 18, not resolving it.

---

## 3. The reference numbers

Three web home screens, chosen for anatomy rather than fame: one is the declared structural source of
truth, two are the closest structural analogues to what `/de` actually is (headline, search, then
rows of provider cards carrying photo, name, price, rating with count).

- [Fresha web home](https://mobbin.com/screens/5d0af5ca-c15a-4477-99b9-198794bf74f8)
- [Airtasker web home](https://mobbin.com/screens/756a4205-72b6-4e12-ac24-c7f31f921cfe)
- [OpenTable web home](https://mobbin.com/screens/e1886298-cf19-4bc3-9924-620b7621853c)

All figures are render-px at 768 and are meaningful **only as ratios**.

### 3a. Derived sizes

| Fresha hero | ink | k | est. px |
|---|---|---|---|
| headline "Book local beauty..." (cap B) | 32 | 0.73 | 43.8 |
| counter numeral "320,396" | 11 | 0.75 | 14.7 |
| counter words "appointments booked today" | 12 | 0.92 | 13.0 |
| nav "For business" | 7 | 0.73 | 9.6 |
| pill "Get the app" | 8 | 0.92 | 8.7 |
| field label "Current location" | 6 | 0.73 | 8.2 |
| field label "Any treatment or venue" | 7 | 0.92 | 7.6 |

| Airtasker | ink | k | est. px |
|---|---|---|---|
| headline "Book a Tasker directly" (cap B) | 19 | 0.73 | 26.0 |
| section header "Home organisation" | 10 | 0.92 | 10.9 |
| provider line "Anthony J. ★5.0 (583)" | 8 | ~0.85 | ~9.4 |
| price "From $200" | 7 | ~0.80 | ~8.8 |
| card title "Ceiling and Walls Cleaning(Mould)" | 8 | 0.92 | 8.7 |
| sub "Browse our Taskers' listed services" | 6 | 0.73 | 8.2 |
| section sub "Spruce up your home for the Holidays" | 7 | 0.92 | 7.6 |

| OpenTable | ink | k | est. px |
|---|---|---|---|
| headline "Find your table for any occasion" (cap F, light on dark) | 17 | 0.73 | 23.3 |
| section header "Outdoor dining" | 13 | 0.92 | 14.1 |
| section header "Recently viewed" | 12 | 0.92 | 13.0 |
| card name "STK - NYC - Midtown" | 7 | 0.73 | 9.6 |
| "6683 reviews" | 7 | 0.73 | 9.6 |
| card meta "Steakhouse • $$$ • Midtown West" | 6 | 0.73 | 8.2 |

### 3b. The comparison, as ratios

| ratio | Fresha | Airtasker | OpenTable | **Solen /de desktop** |
|---|---|---|---|---|
| hero anchor / smallest body text | **5.8** | 3.2 | 2.8 | **3.67** |
| section header / card meta | n/a, no cards in viewport | 1.25 | 1.66 | **1.67** |
| card name / card meta | n/a | ~1.0 | 1.17 | **1.17** |
| **distinct size tiers, first viewport** | **6** | **4** | **4** | **8** |
| card name weight vs meta weight | n/a | bold vs regular (observed) | bold vs regular (observed) | **500 vs 400 (measured)** |
| price separated from meta? | n/a | yes, dark ink vs grey (observed) | n/a, price is a `$$$` tier | **no: identical size, weight and colour (measured)** |
| typefaces on the screen | 2 (serif display + sans) | 1 (observed) | 1 (observed) | **3 (Inter Tight, Inter, Helvetica Neue)** |

Weight and colour rows are **observed** from the image, not measured. An ink-coverage proxy was
computed and discarded: it is contaminated by anti-aliasing across different render scales and does
not survive as evidence.

### 3c. What the comparison actually says

**Solen's size ratios are not the problem.** The hero ratio 3.67 is above two of three references.
The feed's section-header-to-body ratio 1.67 is within 1% of OpenTable's 1.66. The card's internal
1.17 is exactly OpenTable's 1.17. On every ratio the brief asked for, Solen sits inside the reference
band or above it.

**Solen's size COUNT is the outlier**: 8 tiers in the first viewport against 4, 4 and 6, and 15
across the page. And its extra tiers are 12.5, 13, 13.5, differences of 4% to 8%, well under the
threshold at which a size step reads as hierarchy at all. That is EMPHASIS BUDGET clause (c) named
exactly: variety without range.

**Where the references genuinely beat us is emphasis, not size.** Both card-bearing references run a
nearly flat card internally (1.0x and 1.17x) and then spend a real WEIGHT step plus a COLOUR step on
the deciding field: Airtasker's title is bold dark over a grey provider line; OpenTable's name is
bold and link-blue with red stars, a grey meta line and a red time pill. Solen's card runs the same
flat 1.17x and then spends a **half** weight step (500, not 600) on the name and **nothing at all**
on the price.

---

## 4. Verdict per item

| # | Item | Measured | Verdict |
|---|---|---|---|
| 1 | **<= 4 distinct font sizes per screen** | 8 desktop first viewport, 6 mobile, 15 and 14 across the page | **BREAKS A FLOOR.** Twice the ceiling on desktop, and no reference exceeded 6. |
| 2 | **One display anchor >= 28 px per customer screen** | First viewport yes (44 / 31.2). Desktop bands 1 and 3 max out at 20 and 22; mobile bands 1, 2 and 4 at 18, 20 and 22 | **BREAKS A FLOOR**, on the per-screen reading the floor is written in. See the caveat below. |
| 3 | **Anchor >= 1.8x body** | First viewport 3.67 desktop / 2.60 mobile. Feed band 1.67 desktop / 1.50 mobile | **FINE in the first viewport. BREAKS A FLOOR in the feed.** Same caveat. |
| 4 | **<= ~30% at weight >= 600** | First viewport 22.7% desktop / 28.6% mobile. Whole page 33.1% / 32.1%. Feed band 39.2% desktop, 61.5% mobile band 2 | **FINE where the floor is measured** (the rendered first viewport). **Breaks it everywhere below the fold**, which the floor as written does not reach. |
| 5 | **Size variety is not range** | 92.5% of all page text inside 11 to 14 px. 42 arbitrary `text-[Npx]` values plus 9 named steps in source. 267 half-step occurrences. 13 px is the 2nd most-used size and is not in the contract | **BREAKS A FLOOR.** This is the clearest single break and it is systemic, not local. |
| 6 | **One type system** | 26 elements (10.2% of page text) render `Helvetica Neue`. The same rating renders in two faces, two sizes and two weights in one viewport | **BREAKS A FLOOR** (FLOORS LAW 8, "the same thing looks the same everywhere"). No reference showed a fallback face. |
| 7 | **Card two-anchor rule** (§17.4: name larger at 600 + price at 600 tabular) | Name 14 px / **500**. Price 12 px / **400** / `#6B6B6B`, byte-identical to the address in size, weight and colour | **BREAKS A FLOOR** on both anchors. |
| 8 | **Anchor-to-body ratios vs the references** | Hero 3.67 vs 5.8 / 3.2 / 2.8. Section-to-meta 1.67 vs 1.25 / 1.66. Card-internal 1.17 vs ~1.0 / 1.17 | **FINE.** In band or better on all three. Do not "fix" these. |
| 9 | **Anchor size in absolute terms** | 44 px desktop, 31.2 px mobile, both above the 28 px floor; H1 clamp bottoms out at 30 px | **FINE.** |
| 10 | **Typeface choice and the Inter / Inter Tight pairing** | Not re-measured. AXIS_FONT 5a settled it: identical x-height, cap-height and vertical metrics, 5 to 10% narrower advance only | **FINE for this probe.** Its open recommendations (restrict Inter Tight to >= 24 px, make tracking size-conditional) stand unchanged and are not re-litigated here. |
| 11 | **CTA and control sizes** | "Termine finden" 15 px / 700, matching the contract's CTA 15 and its "never <= 13 on a button" | **FINE.** |
| 12 | **Emphasis allocation** | The largest, heaviest and only saturated-colour text in the feed band is `70-98 Min`, a wait estimate, at 20 px / 700 / `#16A34A`. Every salon name on the same screen is 14 px / 500 ink | **BELOW THE REFERENCE**, and it is a taste gap rather than a numbered floor break. Both references reserve their loudest treatment for the entity name or the price, never for a derived estimate. |
| 13 | **Declared body size vs shipped body size** | The contract says body 14. The measured mode is **12 px**, carrying 52.8% of desktop and 56.5% of mobile text; 14 px is a minority | **BREAKS A FLOOR indirectly**, and it matters: the 1.8x ratio floor was derived as 28/16 (AXIS_FONT F6 already flagged 14). Over a 12 px body, a 22 px heading clears 1.8x while the screen still reads flat. The floor is being passed by a body size nobody chose. |

### The caveat on items 2 and 3, stated rather than buried

Items 2 and 3 break **our own floors**, and the references do not back the floors on this point. Of
the three home screens measured, none carries a >= 28-px-equivalent anchor in its card bands either:
Airtasker's feed maxes out at a 10.9 section header over 8.7 card text (1.25x) and OpenTable's at
14.1 over 8.2 (1.72x). Solen's 1.67 is normal for a list band. AXIS_FONT section 3 raised exactly
this collision and asked for an owner call; this measurement is a second, independent confirmation of
it from a different surface. **The honest reading is that the feed band's ratio is a floor break on
paper and a non-issue in practice, and that the floor should be scoped to hero / PDP / confirmation
surfaces.** Chasing item 3 by growing a heading in the feed would manufacture an element that serves
no screen job, which FLOORS LAW 10 forbids. Do not build to items 2 and 3.

---

## 5. The single worst thing, and what it would take to fix

### The finding

**The SalonCard's price renders at 12 px, weight 400, `#6B6B6B`, which is identical in all three
properties to the postcode next to it. The card has one ink element where the locked law requires
two, and the field the user decides on is set exactly like the field they ignore.**

Three of the card's five text fields are pixel-identical; four of five are grey 400. The card's total
size range is 1.17x. Both card-bearing references run a card just as flat on size and then buy the
hierarchy back with a weight step and a colour step on the deciding field. We buy nothing back.

That is precisely "content that is real but arranged as though it were placeholder" from the brief's
list, and it repeats 10 or more times per viewport in the band that carries 29% of the page's text.

### Why it is there, which is the part that matters

This is not drift and it is not carelessness. **Two locked rules in the same LOCKFILE contradict each
other, and the shipped card obeys the older one.**

`_design-system/LOCKFILE.md:479`, rule A13 (V3-D346, dated **2026-05-28**):

> Inside any repeating card or list item ... there is **exactly ONE ink anchor**: the entity NAME =
> `text-s-ink font-medium` (500). ... Every other value recedes: all meta = `text-s-ink-2
> font-normal` (grey, 400). Meta = rating value + star, distance, next-slot time, **price**, duration,
> review count, address ...

Its FORBIDDEN table flags, as drift to be swept away, exactly the treatment the other rule requires:
"`font-medium text-s-ink` on a meta value (rating, count, eta, **price**)".

`_design-system/LOCKFILE.md:1921`, §17.4 (V3-D442, dated **2026-06-07** in CLAUDE.md):

> **Card two-anchor rule (V3-D442 adopted as THE card-emphasis law):** TWO ink anchors per card, name
> (larger, 600) + **price (600, tabular)**.

By the precedence chain's own rule ("latest DATED owner decision wins"), §17.4 is ten days later and
declares itself THE card-emphasis law, so it supersedes A13 on the price. But A13 is the one that is
wired: `CardText.tsx` bakes its weights and colours into the primitives, and the drift checker's A13
rule would flag the correct, §17.4-compliant card as a violation. **An enforcement path from a
superseded rule is actively holding the card flat, and nothing in the system can notice, because a
rule cannot see that another rule outranks it.**

A13's rationale is real and should survive: the owner's 2026-05-28 complaint was "using too bold ...
multiple times that destroys my eye", and four competing anchors on one card is a genuine failure.
V3-D442 does not undo that. It says the card may carry **two**, not four, and that size, not colour
alone, marks which is the anchor.

### What it would take to fix

1. **Arbitrate the two rules and write the outcome down.** One owner sentence: does the SalonCard
   price get a weight and colour step, or does A13's one-anchor model stand and §17.4 get scoped to
   commerce cards only. Nothing else on this list is safe to build before that sentence exists,
   because both directions are currently law.
2. **If §17.4 wins**, the code change is small and local: `SalonCard.tsx:534` swaps the price off
   `<CardMeta>`; `SalonCard.tsx:505` moves the name from 500 to 600. Two lines. Then the A13 drift
   rule needs a price exemption or it will re-flag the fix forever.
3. **Update `CardText.tsx:44-49`**, whose docstring names price as recessive meta, so the primitive
   stops teaching the superseded rule to every future card.
4. **Verify the result at both widths against the reference bar**, not against a vibe: after the
   change the card should show a real weight step (600 vs 400) and a real colour step (ink vs
   `#6B6B6B`) on the price, matching what Airtasker and OpenTable both do, while still carrying
   exactly two ink elements and not four.

### Second and third, ranked by harm divided by cost

- **Cheapest real win on this axis:** add `font-body` to the marker element in
  `NearbyMap.tsx:56-57`. One class removes a system fallback typeface from 26 elements and makes the
  rating look the same in both places it appears. A fallback font is the single most legible signal
  that a page is unfinished, and no reference had one.
- **Largest structural win:** define a `fontSize` scale in `tailwind.config.js` (AXIS_FONT F3, still
  open) and retire the 267 half-step occurrences. 12 versus 12.5 is a 4% difference; it costs a size
  tier and buys no hierarchy. Removing the half-steps alone takes the page from 15 rendered tiers to
  roughly 11 without changing how anything looks.

---

## 6. What I could not determine

1. **Reference weights are observed, not measured.** I can see that Airtasker's card title and
   OpenTable's card name are bolder than their meta. I cannot give their numeric weights, and the
   ink-coverage proxy I tried was too contaminated by scale-dependent anti-aliasing to keep.
2. **Reference "share of text at weight >= 600" was not computed.** It needs a per-leaf weight read,
   which a downscaled screenshot cannot give. The reference column for that metric is therefore
   absent rather than estimated, and the 30% ceiling stays what CLAUDE.md already admits it is: a
   house number with no external citation.
3. **Only three references, all web.** No mobile-viewport reference numbers here, so the mobile
   verdicts in section 4 are graded against our own floors only.
4. **Whether any of this changes behaviour.** Nothing measured here is evidence about conversion.
5. **Whether `/de` is representative.** One route, seed data, one salon set. The PDP measured at
   17.6% weight-heavy on 2026-07-28 and clears the ratio floors comfortably; the home page is a
   different shape and the numbers here do not transfer to it.
