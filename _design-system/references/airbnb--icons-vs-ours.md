<!-- exists-check: extends, not new. `_design-system/references/AIRBNB_SYSTEM_VS_OURS.md` line 342
 already flagged this exact gap: "I did not re-measure Airbnb's icon stroke myself." Section 6
 of that file (`NOT MEASURED`) names it explicitly and cites two conflicting PIL-derived
 estimates (1.33pt and 1.67pt) from `airbnb--profile-list.md:84,90`, neither settled. This file
 closes that gap with live DOM attribute reads (viewBox, stroke-width, linecap, linejoin, fill)
 instead of pixel-sampled stills, and reconciles the old estimates against the real numbers
 (see "Reconciling the old PIL estimate" below). It also corrects a stale internal number: the
 owner's "12 different icon sizes" recollection was already superseded inside this repo by
 `_plans/DESIGN_REENGINEER.md:206-209` ("The real numbers are 26 sizes across 888 instances"),
 which this file cites rather than re-deriving. No product code was touched. -->

# Airbnb vs Solen: the icon drawing itself, not just its layout

Owner ask, 2026-08-03: "go research the fonts and actual icons that they use and what we're doing
differently." This file is the ICON half only (a separate pass owns fonts). Method: live DOM
inspection of [airbnb.com](https://airbnb.com) and our own dev tunnel via
`javascript_tool`/`getComputedStyle`/`getBBox()` at a 390x844 mobile viewport, plus the five iOS
app screenshots the owner supplied at `~/Downloads/IMG_6900.PNG` through `IMG_6904.PNG` for
surfaces the web can't show (native app account menus). Every number below names its source route
or filename. "Not measured" is stated plainly where true, never filled from memory, per the
project's own reality-check rule.

---

## 1. How Airbnb ships icons

**Inline `<svg>` per instance. No sprite, no icon font.**

Measured on [airbnb.com](https://airbnb.com) home (390x844): `document.querySelectorAll('svg')`
returns 41-99 elements depending on scroll/load state (cards lazy-load more instances of the same
few glyphs); `document.querySelectorAll('use')` returns **0** every time, on every page checked
(home, Help Center, `/s/Paris/homes` search results). That rules out a `<symbol>`/`<use>` sprite
sheet. There is no `@font-face` icon font either, no `class="icon-*"` ligature pattern anywhere in
the markup. Every glyph is a literal `<path>` (or `<circle>`/`<g>`) written straight into the DOM
at each call site, framework-generated (React, judging by the attribute ordering and
`aria-hidden="true" role="presentation" focusable="false"` boilerplate repeated on every single
one).

`viewBox="0 0 32 32"` on **100% of the ~130 distinct SVG instances sampled** across three pages
(home, Help Center, search results). This is a fixed internal grid Airbnb's icon system commits
to regardless of render size; small icons (8px star) and large ones (24px nav) share the same
32-unit coordinate space, just scaled and stroke-compensated differently (see §2-3).

A handful of `img[src*="icon"]` tags also exist (8 on the home page) - not inspected further,
almost certainly footer app-store badges / social glyphs rather than UI icons. **Not measured.**

---

## 2. Stroked outline or filled shape - the load-bearing question, answered with attributes

**Both, and the split is not random: it tracks render size and glyph shape, not a single design
rule.** Nine distinct icons measured with real computed-style values (source = live DOM on
[airbnb.com](https://airbnb.com) unless noted):

| icon | context | construction | `stroke-width` | `stroke-linecap` | `stroke-linejoin` | rendered | ink bbox in the 32x32 grid |
|---|---|---|---|---|---|---|---|
| magnifying glass | bottom-tab "Explore" (active) | **true stroke**, 2 paths (circle + diagonal) | 2.667px | butt | miter | 24x24 | 1.33,1.33 → 29.33x29.33 (~96% fill) |
| open heart | bottom-tab "Wishlists" | **true stroke**, 1 path | 2px | butt | miter | 24x24 | 1.67,3.33 → 28.67x25.33 |
| person-in-circle | bottom-tab "Log in" | **true stroke**, 1 path + 1 circle (r=14) | 2px | butt | miter | 24x24 | 2,2 → 28x28 (uniform 6.25% margin) |
| X / close | promo banner dismiss | **true stroke**, 1 path (`m6 6 20 20M26 6 6 26`) | 2.667px | butt | miter | 12x12 | 6,6 → 20x20 (18.75% margin, deliberately small) |
| 5-point star | listing rating | **filled shape**, `fill-rule:evenodd`, no stroke | n/a (fill: `rgb(108,108,108)`) | n/a | n/a | 8x8 | 0.23,0.99 → 31.53x30.09 (~99% fill, near zero padding) |
| heart on photo | wishlist toggle over a card image | **filled + stroked** (two-tone): `fill:rgba(0,0,0,.5)` + `stroke:#fff` | 2px | butt | miter | 24x24 | same path as the nav heart, 28.67x25.33 |
| magnifying glass (small) | "Start your search" pill | **filled shape**, `fill:rgb(34,34,34)`, no stroke | n/a | n/a | n/a | 12x12 | 0,0 → 31.41x31.41 (~98% fill) |
| house (+ shield / diagonal roof) | Help Center article rows ("AirCover for guests", "Essential resources") | **filled shape**, `fill:rgb(34,34,34)`, no stroke | n/a | n/a | n/a | 23x23 | 2,2.31 → 28x27.69 and 0.63,1.16 → 30.74x29.17 |
| sliders (3 lines + 3 handles) | "Show filters" button, search results | **true stroke**, 1 path | 2.5px | butt | miter | 16x16 | 3,2 → 26x28 |

**The pattern:** the SAME magnifying-glass concept is drawn two different ways depending on render
size. At 24px (bottom nav) it's a true SVG stroke. At 12px (search-bar pill) it's pre-flattened to
a filled silhouette, because a true stroke at that size would produce a sub-pixel line and vanish.
The Help Center row icons (house/shield glyphs, 23px) are also filled, not stroked, even though
they render close to nav-icon size - filled construction there looks like a library choice for
that icon family (thicker, more literal shapes: a roofline, a shield) rather than a size rule.
**Net: true-stroke construction covers simple line-based glyphs (search-nav, heart, person, X,
sliders) at every size tested; filled-flattened construction covers glyphs that need to read as a
solid mark at small size (star) or that were authored as solid icons in the first place (the
house-family glyphs, the pill search icon).** It is not "outline library, period" - it's mixed by
design intent, and the split is visible in the raw attributes, not guessable from a screenshot.

Page-wide instance count on the home page (includes every repeat across every listing card, not
distinct glyphs): **stroked = 18, filled = 81** at one sample. This ratio is misleading if read as
"Airbnb is mostly filled" - it's dominated by the star and heart-on-photo glyphs appearing once
per listing card, repeated dozens of times, while the true-stroke chrome icons (nav, filters,
close) appear only a handful of times per page. Distinct-glyph count, not instance count, is the
right lens, and by that count it's close to even (roughly 5 stroke-based glyphs vs 4 fill-based
ones in the sample above).

---

## 3. Optical size and ink-to-box padding

Padding = how much of the 32x32 (or 24x24, ours) grid is empty margin around the glyph, measured
via `SVGGraphicsElement.getBBox()`, not eyeballed.

| icon | grid | ink bbox | padding (each side, avg) |
|---|---|---|---|
| Airbnb star (rating) | 32x32 | 31.53 x 30.09 | ~1-2% - almost none, so it stays legible at 8px |
| Airbnb search-bar pill icon | 32x32 | 31.41 x 31.41 | ~2% - same reason, renders at 12px |
| Airbnb person-in-circle | 32x32 | 28 x 28 | 6.25% uniform |
| Airbnb sliders/filter | 32x32 | 26 x 28 | ~6-9% |
| Airbnb search-nav (circle+bar) | 32x32 | 29.33 x 29.33 | ~4% |
| Airbnb heart (nav + on-photo) | 32x32 | 28.67 x 25.33 | 5.2% sides, 10.4% top/bottom (heart's point) |
| Airbnb close/X | 32x32 | 20 x 20 | 18.75% - the one icon with real breathing room, and it's also the smallest render (12px) |
| ours: `house` (category pill) | 24x24 | 18 x 19 | 12.5% sides, ~8-12.5% top/bottom |
| ours: `star` (rating) | 24x24 | 20 x 19.07 | ~4% - matches Airbnb's near-zero star padding |
| ours: `heart` (wishlist) | 24x24 | 20 x 17.02 | 8.3% sides |
| ours: `search` | 24x24 | 18 x 18 | 12.5% uniform |

**Reads the same way on both sides for glyphs that must stay legible tiny (star: ~2-4% padding on
both), and reads similarly for general UI icons (~5-12% padding on both).** No systemic gap here - 
this axis is not where the two systems diverge.

---

## 4. Corner and terminal treatment - the single starkest, cleanest difference found

**Every stroked icon sampled on Airbnb uses `stroke-linecap: butt` and `stroke-linejoin: miter`.
Zero exceptions across 18+ stroked instances on three different pages** (home, Help Center,
search results): the search-nav circle+bar, the heart outline, the person-circle, the close X, the
sliders/filter icon all return `butt`/`miter` from `getComputedStyle`. Ends are cut square, not
rounded; corners are sharp points, not filleted. This is a deliberate, geometric, "engineered"
terminal style, and it holds even on the friendliest-looking glyphs (the heart).

**Every stroked icon on our own four routes uses `stroke-linecap: round` and
`stroke-linejoin: round`, with equally zero exceptions** - checked across 117 stroked instances on
`/de` alone, plus separate checks on `/de/coiffeur`, `/de/profile`, `/de/inspo`. This is Lucide's
library-wide default (`stroke-linecap="round" stroke-linejoin="round"` is baked into every Lucide
icon's generated SVG), and nothing in the codebase overrides it - there is no shared icon wrapper
component (`grep` for a Lucide re-export or a global `svg.lucide { stroke-linecap }` CSS rule in
`app/globals.css` returns nothing) and no per-icon override of these two properties anywhere in
the 384 files that import from `lucide-react`.

Detail density: Airbnb's stroke-based icons are simple, 1-2 `<path>` elements each (the search-nav
icon is 2 paths: a circle and a diagonal line; the heart, person, close, and sliders icons are
each a single path). The filled ones are also single-path (`fill-rule:evenodd` doing double duty
for the star's negative space). Ours are the same order of complexity: Lucide's `house` is 2
paths, `heart`/`search`/`star` are each 1 path. **Node/path count is not where the systems
differ** - both aim for minimal, simple glyphs. The terminal treatment is the entire visible gap.

---

## 5. Colour policy

Airbnb, measured across home + Help Center + search results: exactly **4 colours** appear on any
icon.

| colour | hex (from `rgb()`) | role |
|---|---|---|
| `rgb(34,34,34)` | `#222222` | primary ink - most icons, at rest |
| `rgb(108,108,108)` | `#6C6C6C` | secondary/inactive - grey nav tabs, star fill |
| `rgb(255,255,255)` | `#FFFFFF` | the stroke ring on the on-photo heart, for contrast against any photo |
| `rgb(218,18,73)` | Airbnb's rausch/brand red | **only** on the active bottom-nav tab icon (selected state) |

(`AIRBNB_SYSTEM_VS_OURS.md:173,178` already documents Airbnb's token-level 3-tier icon palette,
`--palette-icon-primary/secondary/tertiary` = `#222222`/`#6C6C6C`/`#8C8C8C`; this file's live
measurement of primary and secondary matches it exactly, and adds the two states that palette
list doesn't cover: the white on-photo contrast stroke and the brand-red active-tab exception.)

No icon anywhere carries a hue for decoration. Category pills ("🌐 All", "🏡 Homes", "🎈
Experiences") use **raw emoji glyphs, not custom icons** - a different delivery mechanism
entirely, worth noting since it means those specific colourful marks aren't part of the SVG icon
system at all.

Ours, measured across all four routes: **also 4 colours**, and the roles map almost one-to-one:
`#0A0A0A` (`s-ink`, primary), `#6B6B6B` (`s-ink-2`, secondary - 1 step off Airbnb's `#6C6C6C`,
already noted as a non-issue in `AIRBNB_SYSTEM_VS_OURS.md:161`), `#FFFFFF` (on-photo contrast,
same role as theirs), plus two colours Airbnb's icon set doesn't use at all in the pages sampled:
`#FFC32B` (star fill, semantic/taste-locked) and `#FF3366` (save-heart fill when a salon is
already wishlisted, semantic/taste-locked). **No blue (`s-accent`) appears on any icon on any of
the four routes** - consistent with the project's own taste rule that blue is text-link-only, and
there is no Solen equivalent of Airbnb's "tint the active nav icon in brand colour" pattern
because Solen has no bottom tab bar (`AIRBNB_SYSTEM_VS_OURS.md:331-333`, a dated owner decision).

---

## 6. Do icons appear on settings/detail lists, or only in nav?

**Both, on Airbnb, with no counter-example found.** Confirmed two ways:

- **Live DOM**, Help Center "Guides for getting started" list (`airbnb.com`, no login needed):
 each row (`AirCover for guests`, `Essential resources for new hosts`) carries a left icon,
 `fill:rgb(34,34,34)`, 23px, same construction family as the nav icons.
- **iOS app screenshots** (`IMG_6900.PNG` = Profile tab root, `IMG_6901.PNG`/`IMG_6902.PNG` =
 Account settings list, `IMG_6903.PNG`/`IMG_6904.PNG` = Login & security detail): every single
 row in both the Profile menu (Account settings/gear, Get help/question-mark, View profile/
 person, Privacy/hand, Refer a host/two-people, Find a co-host/person-plus, Legal/book, Log out/
 door) and Account settings (Personal information/person, Login & security/shield, Privacy/hand,
 Notifications/bell+gear, Payments/wallet, Taxes/calculator, Translation/globe, Booking
 permissions/hand+key, Travel for work/briefcase, Accessibility/gear+person) carries a left-
 aligned icon plus a right-aligned chevron, and the one detail sub-screen shown (device history)
 still has an icon (a phone outline) next to its one row.

I did not find one list row, on any surface checked, where the icon slot is empty or replaced by
something else. Bottom-tab icons and detail-list icons on Airbnb are drawn from the same
construction family (compare the Profile-tab person-in-circle to the Account-settings
"Personal information" person glyph - both simple single-path/circle strokes at the same relative
weight).

Ours, `/de/profile` (directly comparable - same anatomy, left icon + label + right chevron, 7
rows): `arrow-left`, `calendar`, `wallet`, `ticket-percent`, `heart`, `stamp`, `settings`,
`log-out`, plus 7 `chevron-right`. Same pattern as Airbnb's Account settings: icon-per-row is
already how Solen builds this surface, not a gap.

---

## 7. What Lucide is actually rendering on our four routes (not what the code implies)

Confirmed via live DOM, not source reading:

- **`viewBox="0 0 24 24"`** on every Lucide instance, on every route (24 is Lucide's fixed native
 grid - the library doesn't offer a 32-grid option the way Airbnb's does).
- One non-Lucide exception found: a Swiss-flag glyph (`viewBox="0 0 32 32"`, two white bars on
 `#DA291C`) next to a currency/locale label on `/de/coiffeur`. Not a UI icon in the Lucide sense,
 just a small flag graphic - flagged so it isn't miscounted as a design violation.
- **`lib/icon-stroke.ts`** is real and correctly documents its own calibration (14px→1.6,
 18px→1.9, 22px→2.2, 24px→2.4, monotonic, anchored to an owner-approved mockup per the file's own
 comment). But `grep -rl "strokeForSize"` across the repo returns exactly **3 files**:
 `app/[locale]/_components/layout/Header.tsx`, `app/[locale]/_components/search/FilterSheet.tsx`,
 `app/[locale]/queue/[token]/page.tsx`. Meanwhile `grep -rln "strokeWidth={"` returns **191
 files**, each hand-picking its own value - a 20-line sample alone shows `1.75`, `2`, `2.1`,
 `2.2`, `2.4`, `2.5` used at sizes the table would calibrate differently (e.g. `size={16}
 strokeWidth={2.25}` on the wishlist heart, where the table says `1.9`; `size={16}
 strokeWidth={2}` on the search-bar hamburger, same gap). **The table is a real, working piece of
 design infrastructure that is bypassed at essentially every call site that isn't one of the
 three files that use it.**

---

## 8. Count of distinct sizes and stroke widths - correcting a stale internal number

The owner's prompt cited "a prior audit... found 12 different icon sizes." That number already
has a documented correction inside this repo, not just from this pass: `_plans/
DESIGN_REENGINEER.md:206-209` states "I reported '12 distinct sizes, 648+ instances' from a cruder
grep. The real numbers are **26 sizes across 888 instances**" (full sitewide sweep of `app/` +
`components/`, distribution table included at line 203-204, spanning 8px through 48px with almost
no gaps between 10 and 22). So the "12" figure was already stale before this task started; the
real, current, sitewide number is 26.

This pass adds a narrower, live-rendered cross-check limited to the four routes named in the ask:

| route | distinct rendered sizes (px) | distinct stroke-widths (px) |
|---|---|---|
| `/de` | 11, 12, 13, 16, 18, 20, 24 (7) | 1.25, 2, 2.2, 2.25, 2.4, 2.5 (6) |
| `/de/coiffeur` | 11, 12, 13, 16, 18, 20, 24 (7) | 2, 2.25, 2.4 (3) |
| `/de/profile` | 17, 18, 19, 22 (4) | 1.9, 2.2 (2) |
| `/de/inspo` | 16, 18, 20, 24 (4) | 2, 2.4, 2.5 (3) |
| **union across all 4** | **11, 12, 13, 16, 17, 18, 19, 20, 22, 24 (10)** | **1.25, 1.9, 2, 2.2, 2.25, 2.4, 2.5 (7)** |

Airbnb, same live-measurement method, sample of ~130 icon instances across home + Help Center +
search results: rendered sizes observed were **8, 12, 16, 23, 24, 26px (6 distinct)**, and
stroke-widths **2, 2.5, 2.667, 4, 5.333px (5 distinct)**, all against the single fixed 32-unit
grid. **Correcting a second common assumption in the same breath: Airbnb does not use "one icon
size."** It uses roughly half a dozen, same order of magnitude as our own 4-route sample. The real
difference is not size-count, it's whether the sizes map to named roles. Airbnb's sizes read as
purposeful tiers (8px = inline-with-text rating star, 12px = tiny chrome affordance, 16px =
secondary control, 23-26px = primary nav/row icon) each with a matching stroke-width that keeps
physical on-screen weight roughly constant (see §9). Ours, per `DESIGN_REENGINEER.md`'s sitewide
sweep, is "26 individual decisions" with no gaps between 10 and 22 - the same underlying glyph at
sizes 1px apart with no visible reason, which is what "inconsistent" actually means here, not raw
size-count.

---

## 9. Filled, coloured, or hand-drawn exceptions on our side

Checked all four routes for anything that isn't a stock outline Lucide glyph:

- **`heart`, filled `#FF3366`** when a salon is already wishlisted (`/de/coiffeur`). Intentional
 and taste-locked (`CLAUDE.md`: "save-heart `#FF3366`"). Not a violation.
- **`star`, filled `#FFC32B`**, every route. Intentional and taste-locked. Not a violation.
- **The Swiss-flag glyph** noted in §7. Not a Lucide icon, not really a "UI icon" at all (a
 country flag), not a violation, just worth naming so it isn't mistaken for a hand-drawn icon.
- **No hand-drawn inline SVG paths and no rogue colour** found on any icon across the four routes
 checked. `strokeLinecap`/`strokeLinejoin` were `round`/`round` on every single stroked instance
 sampled (117 on `/de` alone), no exceptions - the library default holds everywhere, for better
 or worse (see §4 and §12).

---

## 10. The difference table

| axis | Airbnb (measured, source) | ours (measured, route) | the difference | does it matter visually |
|---|---|---|---|---|
| delivery | inline `<svg>` per instance, `viewBox 0 0 32 32` fixed, no sprite/font (`airbnb.com` home, `use` count = 0) | inline `<svg>` per Lucide component, `viewBox 0 0 24 24` fixed, no sprite/font (all 4 routes) | same mechanism, different fixed grid (32 vs 24) | no, this is invisible to the user |
| stroke vs fill | mixed by glyph/size intent: ~5 true-stroke chrome glyphs, ~4 filled glyphs (star, on-photo heart, search-pill, house-family) | mixed the same way: stroked outlines for nav/action icons, filled for `star` and the "saved" `heart` state | same strategy, smaller filled set on our side | no, both read as "mostly outline, filled where legibility needs it" |
| **stroke terminal (linecap/linejoin)** | **`butt`/`miter`, 100% of 18+ instances sampled, 3 pages** | **`round`/`round`, 100% of 117+ instances sampled, 4 routes** | **total, zero overlap, and it's a LIBRARY DEFAULT on our side (Lucide), never touched** | **yes, this is the single biggest visible difference. Sharp/geometric vs soft/friendly is a whole visual-language decision, not a bug** |
| optical size / ink padding | ~1-19% padding depending on glyph (star ~2%, close 19%) | ~4-13% padding depending on glyph (star ~4%, house 12.5%) | comparable range, both systems pad the "must stay tiny and legible" glyphs least | no, this axis already tracks close |
| stroke-width discipline | width scales inversely with render size to hold physical on-screen weight near-constant (2px at 24px render ≈ 1.5 CSS px; 4px at ~11px render ≈ 1.33 CSS px) | a real calibration table exists (`lib/icon-stroke.ts`) doing the same thing, but is called from 3 files while 191 files hardcode their own value | the mechanism exists on our side and is unused almost everywhere | yes, inconsistent physical stroke weight across a screen reads as sloppy even when nobody can name why |
| count of distinct sizes | ~6 observed (8/12/16/23/24/26px), each mapped to a role | 10 observed across 4 routes live; 26 across the whole app per `DESIGN_REENGINEER.md`'s sitewide sweep | order-of-magnitude more sizes on our side, and ours has no gaps (10-22 all used) vs Airbnb's clean tiers | yes, this is the "26 individual decisions" problem named in that file, confirmed still live on all 4 routes checked here |
| detail density | 1-2 paths per glyph | 1-2 paths per glyph (Lucide) | none | no |
| corner radii inside drawings | sharp (miter joins, no rounding at corners) | rounded (round joins) | same axis as the linecap row above, restated at the vector level | yes, same finding, different lens |
| colour policy | 4 colours: ink, grey, white, one brand-red exception on the active nav tab only | 4 colours: ink, grey (1 step lighter), white, plus 2 taste-locked semantic fills (star yellow, save-heart pink) that Airbnb's icon set doesn't carry at all in the pages sampled | near-identical restraint, different semantic-colour vocabulary | no, both are disciplined; the extra 2 colours on our side are intentional and already taste-locked |
| icons on settings/detail lists | present on every row checked (Help Center + 2 full account-settings screens) | present on every row checked (`/de/profile`, 7 rows) | none | no, already matched |

---

## 11. The honest part

Lucide is a good, disciplined library, and Airbnb's set is custom-drawn and proprietary. That gap
is real and can't be closed by tweaking props. But most of what people perceive as "their icons
look nicer" when comparing screenshots is **not** the things that would take rebuilding a custom
icon library:

- **Stroke vs fill strategy**: already matches. Not a gap.
- **Padding/optical sizing**: already close. Not a gap.
- **Detail density / path count**: already matches (both minimal). Not a gap.
- **Colour discipline**: already matches (4 colours each, similar roles). Not a gap.
- **Icon presence on lists**: already matches. Not a gap.

**What actually reads differently, in terms someone can act on:** Airbnb's icons look sharper,
more "engineered," more confident because every single stroke ends in a flat cut and every corner
is a real point (`butt`/`miter`). Ours look softer and rounder because Lucide's shipped default
(`round`/`round`) has never been touched, on any of the 384 files that import from it. That one
CSS-level property pair, sampled with zero exceptions on both sides, is doing more work in the
"why does theirs look tighter" perception than the size table, the padding, or anything about the
glyphs themselves.

Second, smaller thing that actually matters: the **stroke-width calibration table exists and is
right**, but it's dead code in 191 of 194 call sites. That's not a Lucide-vs-custom gap either,
it's an enforcement gap. Fixing it is mechanical, not a redesign.

**Where the gap does NOT matter, stated plainly so it isn't chased:** nobody is going to notice
that Airbnb's grid is 32 units and ours is 24, that their icons average slightly less padding, or
that their palette has one more shade of grey than ours. Those are all real, measured differences
in this file, and none of them would move a screenshot comparison.

---

## 12. What to change, keeping Lucide

Concrete, from-value to-value, file-by-file. No code changed in this pass, per the ask.

1. **Stroke terminal (`stroke-linecap`/`stroke-linejoin`): `round`/`round` → `butt`/`miter`, IF the
 goal is Airbnb's sharper read.** This is the highest-leverage single change found and it is
 also a full visual-language call the owner should see rendered before deciding, not something
 to flip silently (`CLAUDE.md` rule 5: goal before action). No wrapper component exists today
 (`grep` for a shared Lucide re-export returns nothing); the cheapest test is one CSS rule,
 `svg.lucide { stroke-linecap: butt; stroke-linejoin: miter; }` in `app/globals.css` (CSS
 `stroke-linecap`/`stroke-linejoin` properties override the SVG presentation attributes Lucide
 bakes in), which would flip all 384 import sites at once for a mockup comparison without
 touching a single call site. Flag: `heart` and a few glyphs with genuine curves (not just
 corners) may look worse with `miter` on tight inner angles; that needs an actual rendered
 before/after, not a guess from this file.

2. **Enforce `strokeForSize()` everywhere, kill the 191 ad-hoc `strokeWidth={}` literals.** The
 table (`lib/icon-stroke.ts`) is already correct and owner-approved; the fix is adoption, not a
 new value. Concretely: `size={16} strokeWidth={2.25}` on the wishlist heart and
 `size={16} strokeWidth={2}` on the search-bar menu icon (both on `/de`, exact files not
 re-derived here, found via the DOM only) should both become `strokeForSize(16)` = `1.9`, same
 pattern for every one of the other 190 files. This alone collapses the stroke-width set from 7
 observed values (1.25/1.9/2/2.2/2.25/2.4/2.5) toward the table's intended 4 (1.6/1.9/2.2/2.4).

3. **Collapse the size set.** Current: 10 distinct rendered sizes across 4 routes, 26 sitewide.
 Airbnb's effective set is ~3 role-tiers (inline-with-text, small chrome, primary nav/row), not
 a flat list. `_plans/DESIGN_REENGINEER.md:212` already proposed a 3-tier target for this exact
 problem, sitewide: **16 (meta) / 20 (row) / 24 (nav)**, built from the same `648+`/`888`-instance
 sweep this file cites in §8. That proposal was **stopped by the owner on 2026-07-29**, but for
 the mockup's presentation ("this after so many buttons... stop"), not on the three numbers
 themselves (`DESIGN_REENGINEER.md:216-224`) - worth re-surfacing as a narrower, better-presented
 ask rather than re-deriving a new target set from scratch.

---

## Method notes / not measured

- Airbnb's account/settings screens live on the web are behind login; not authenticated, per the
 task's own instruction and this project's standing rule against entering credentials. Those
 surfaces are iOS-screenshot-only (`IMG_6900`-`IMG_6904`), consistent with how
 `AIRBNB_SYSTEM_VS_OURS.md` already scoped the same limitation.
- **Reconciling the old PIL estimate**: `airbnb--profile-list.md:84,90` and
 `airbnb--profile-1to1-diff.md:90` derived Airbnb's icon stroke-width from pixel-sampling the app
 screenshots at 1.33pt and 1.67pt, and `AIRBNB_SYSTEM_VS_OURS.md`'s NOT MEASURED section
 explicitly declined to pick between them. Live DOM reads in this file give the *web* nav icons a
 CSS `stroke-width` of `2px` against `viewBox 0 0 32 32`, rendered into a 24px box: physical
 on-screen stroke = 2 x (24/32) = **1.5 CSS px**, sitting almost exactly between the two old PIL
 estimates. The web and the iOS app are not guaranteed to share byte-identical vector assets, so
 this is a reconciliation, not a proof of identity, but it closes the "neither figure is settled"
 gap with a mechanism that explains both readings.
- Amenity/category filter icons on Airbnb's search results page (Washer, Kitchen, Instant Book,
 Free parking) were checked and are **text-only pills with no icon** at all, in the one search
 session run. Not exhaustively checked across every filter category.
- The 8 `img[src*="icon"]` tags on Airbnb's home page were not inspected. Likely app-store badges
 or social icons, not part of the SVG icon system. Not measured.
- Font choice, metrics, and weight are explicitly out of scope for this file, per the task; a
 separate pass owns that half.
