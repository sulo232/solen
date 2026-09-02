<!-- Exists-check: `_design-system/references/` already holds AIRBNB_SYSTEM_VS_OURS.md,
     airbnb--profile-list.md, airbnb--profile-1to1-diff.md, airbnb--category-switch.md,
     airbnb--home-search-chrome.md. None of them carry @font-face byte sizes, format/variable
     flags, x-height/ascender/descender ratios, or a fallback-strategy comparison; the closest,
     AIRBNB_SYSTEM_VS_OURS.md, gives a type-SCALE table (token names, px/lh) and a cap-height
     ratio (0.710) for the account surface only. This file is net-new on the font-METRICS axis
     and reuses that file's account-surface numbers by citation instead of re-deriving them
     (marked SRC-CITE below), per the owner's "go research the fonts" scope, which is font-only;
     a separate agent owns icons. -->

# Airbnb's fonts vs ours, measured

Owner ask, 2026-08-03 verbatim: *"go research the fonts and actual icons that they use and what
we're doing differently."* This file is the font half only. Live site is primary
(`preview_start` + Browser pane, 390x844), stills are secondary and used only where the live
surface sits behind a login. No credentials entered, no product code touched, no commit made.

---

## SOURCES

| tag | exactly what | how |
|---|---|---|
| **AB-LIVE-390** | `https://www.airbnb.com/` and `https://www.airbnb.com/help`, Browser pane **390x844**, logged out | `getComputedStyle`, `document.fonts`, `document.styleSheets` CSSOM, `performance.getEntriesByType('resource')`, `fetch(..., {method:"HEAD"})` for byte sizes, mine this run |
| **AB-CANVAS** | in-page `canvas.measureText` / pixel-scan against the live-loaded `"Airbnb Cereal VF"`, same tab as AB-LIVE-390, 300px em | ink bounding-box metrics at weights 300-800, mine this run |
| **O-LIVE-390** | `https://card-albums-anne-mood.trycloudflare.com/de`, `/de/coiffeur`, `/de/profile`, `/de/inspo`, Browser pane **390x844**, logged in as the seed QA test account | same instrumentation as AB-LIVE-390, mine this run |
| **O-CANVAS** | in-page `canvas.measureText` / pixel-scan against our loaded `"Inter Tight"` and `"Inter"`, same tab as O-LIVE-390, 300px em | same method as AB-CANVAS, mine this run |
| **S69xx** | `~/Downloads/IMG_6900.PNG`-`IMG_6904.PNG`, Airbnb account/settings screens (behind login) | **not re-measured by me**; the row-label size/weight (16px/400), the two title states (22px/600 collapsed, 32px/600 expanded) and the zero-tracking finding are cited from `_design-system/references/AIRBNB_SYSTEM_VS_OURS.md`, which measured these stills directly with two independent rulers (cap-height route and ink word-width route) agreeing to 0.01pt. Marked **SRC-CITE** everywhere used. |
| **SRC** | file read on disk this run, `file:line` given | Read / grep |

**Airbnb's account and settings screens are behind a login.** I did not authenticate and entered
no credentials, per scope. Everything about those screens in this file is SRC-CITE from the
prior stills-based measurement, not re-derived. Everything else (family, @font-face, byte sizes,
weights-in-use on the homepage and Help Center, cap/x-height/ascender/descender ratios) is live,
this run, tagged AB-LIVE-390 / AB-CANVAS.

---

## 1. Airbnb's font family

**Resolved live** (`AB-LIVE-390`, `getComputedStyle(document.body).fontFamily`):

```
"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif
```

`document.fonts` confirms **9 `@font-face` rules**, all `font-family: "Airbnb Cereal VF"`, all
`font-display: swap`, all `format("woff2-variations")`, i.e. every one is a **variable font**, not
a static cut. Airbnb splits the variable file **by script**, not by weight, one file per range:

| script / role | file | unicode-range | bytes | loaded on the homepage? |
|---|---|---|---|---|
| Latin base (the one that renders for a CH/EN visitor) | `AirbnbCerealVF_W_Wght....woff2` | `U+0-3FF, U+500-58F, U+700-74F, U+780-FAFF, U+FE00-FE6F, U+FF00-EFFFF, U+FFFFE-10FFFF` | **67,812 B** | yes (`performance` resource entry, `initiatorType: early-hints`, i.e. preloaded) |
| Italic (Latin) | `AirbnbCerealVF_Italics_W_Wght....woff2` | same range, `font-style: italic` | 71,496 B | no, `document.fonts` status `unloaded` |
| Arabic | `..._Arabic_W_Wght....woff2` | `U+600-6FF, U+750-77F` | 59,016 B | no |
| Cyrillic | `..._Cyril_W_Wght....woff2` | `U+400-4FF` | 50,564 B | no |
| Hebrew | `..._Hebrew_W_Wght....woff2` | `U+590-5FF, U+FB00-FB4F` | 46,804 B | no |
| Devanagari | `..._Deva_W_Wght....woff2` | `U+900-97F` | 120,664 B | no |
| Thai | `..._ThaiLp_W_Wght....woff2` | `U+E00-E7F` | 56,320 B | no |
| Greek | `..._Greek_W_Wght....woff2` | `U+370-3FF` | 45,800 B | no |

Sum of all 8 non-italic-duplicate files + italic = **518,476 B (~506 KB)** if every script were
downloaded; a CH/EN/DE/FR/IT visitor downloads only the **67,812 B (66.2 KB)** Latin file
(`AB-LIVE-390`, confirmed via `fetch(...,{method:"HEAD"})`, `content-length: 67812`,
`content-type: font/woff2`, `cache-control: public, max-age=31536000`).

**No `font-weight` range is declared on any of the 9 `@font-face` rules** (`r.style.getPropertyValue('font-weight')`
returns `""` on every one, confirmed by reading `cssText` directly). Despite that, real DOM text on
the page renders at 400/500/600 (section 2 below), so the browser is resolving the variable axis
from a bare numeric `font-weight` with no declared range, live confirmation that Chrome does this
for a `woff2-variations` resource even undeclared.

**Fallback stack:** `Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif`.
`Circular` has **zero `@font-face` rules on the page** (`circularFaceCount: 0`), i.e. Airbnb does
not self-host it here; `document.fonts.check('16px Circular')` returned `true`, but that check is
known to fall back loosely when no face matches, so **whether "Circular" is a real, distinct
fallback in a clean environment is NOT MEASURED** (see section 6). **Every one of the 9
`@font-face` rules sets `font-display: swap`**, confirmed by reading `cssText`.

---

## 2. Airbnb's weights actually on screen (`AB-LIVE-390`, homepage + Help Center)

| role | text | family | size | weight | line-height | letter-spacing | color |
|---|---|---|---|---|---|---|---|
| section H2 | "Popular homes in Paris" / "Great hotels for your next trip" | Cereal VF | 18px | 600 | 24px (1.33x) | -0.18px (-1%) | `#222222` |
| promo H1 | "Get 15% in Airbnb credit at ho..." | Cereal VF | 26px | 600 | (26_30 token, ~1.15x) | not captured | `#222222` |
| search pill | "Start your search" | Cereal VF | 14px | 500 | 18px | normal | `#222222` |
| category pill (inactive) | "Homes" | Cereal VF | 14px | 400 | 18px | normal | `#222222` |
| card title | "Room in 5th Arrondissement" / "Hôtel Du Flâneur" | Cereal VF | 13px | 500 | 16px | normal | `#222222` |
| badge | "Guest favorite" | Cereal VF | 14px | 600 | ~20px | normal | `#222222` |
| card subline (dates/host) | "Aug 7 - 9" | Cereal VF | 12px | 400 | 16px | normal | `#6C6C6C` |
| price | "Fr. 218" / "total" | Cereal VF | 12px | 400 | 16px | normal | `#6C6C6C` (**not bold**) |
| promo subline | "Plus, get Airbnb credit..." | Cereal VF | 12px | 400 | 16px | normal | `#6C6C6C` |
| app-banner title | "Get the app" | Cereal VF | 14px | 500 | 18px | normal | `#222222` |
| CTA button | "Use app" | Cereal VF | 14px | 500 | 18px | normal | white on Rausch |
| bottom-nav label (active) | "Explore" | Cereal VF | 10px | 500 | 12px | **+0.2px (+2%)** | Rausch `#DA1249` |
| bottom-nav label (inactive) | "Wishlists" / "Log in" | Cereal VF | 10px | 400 | 12px | +0.2px | `#6C6C6C` |

**Account/settings-specific** (behind login, **SRC-CITE** `AIRBNB_SYSTEM_VS_OURS.md` sections 0a/0b,
two independent rulers agreeing to 0.01pt):

| role | size | weight | letter-spacing |
|---|---|---|---|
| row label (Profile root + Account settings, same on both) | **16px** | **400** | normal |
| page title, collapsed into nav bar | 22px | 600 | normal |
| page title, expanded (top of scroll) | 32px | 600 | normal |
| every named type token in `AB-LIVE-390`'s own `:root` | any | any | **`normal`**, one single opt-in exception `tracking-wide` at `0.04em` |

Airbnb's own weight vocabulary is named, not numeric, in its live tokens: `book` / `medium` /
`semibold` (three ramps), which is why every measured weight above lands on 400, 500 or 600.
**Nothing in either live sampling or the cited stills shows Airbnb using weight 700 anywhere.**

---

## 3. Airbnb's real metrics (`AB-CANVAS`, 300px em, weights 300-800)

Method: render a single glyph on an offscreen canvas at a known baseline, scan the alpha channel
for the topmost and bottommost ink row, express as a fraction of the em.

| weight | cap-height (`H`) | x-height (`x`) | ascender (`h`) | descender (`y`, below baseline) |
|---|---|---|---|---|
| 300 | 213/300 = **0.710** | 154/300 = 0.513 | 222/300 = 0.740 | 64/300 = 0.213 |
| 400 | 213/300 = **0.710** | 156/300 = 0.520 | 223/300 = 0.743 | 63/300 = 0.210 |
| 500 | 213/300 = **0.710** | 157/300 = 0.523 | 224/300 = 0.747 | 62/300 = 0.207 |
| 600 | 213/300 = **0.710** | 158/300 = 0.527 | 224/300 = 0.747 | 61/300 = 0.203 |
| 700 | 213/300 = **0.710** | 159/300 = 0.530 | 224/300 = 0.747 | 61/300 = 0.203 |
| 800 | 213/300 = **0.710** | 160/300 = 0.533 | 225/300 = 0.750 | 60/300 = 0.200 |

**Cap-height is exactly weight-invariant: 0.710 at every one of the six weights**, matching
`AIRBNB_SYSTEM_VS_OURS.md`'s independent finding on the same font. x-height creeps slightly
upward with weight (0.513 to 0.533); ascender exceeds cap-height at every weight, by **4.2-5.6%**
(lowercase `h`/`b`/`d`/`k`/`l` poke visibly above the capitals).

**Measurement caveat, stated plainly.** A separate ink-pixel-AREA test (fill a 200px-em `H`, count
opaque pixels) found that Chrome's canvas weight-matching for this variable font, absent a
declared `font-weight` range, only resolves to **two** real rendered instances in this
environment: weights 300/400/500 produced an *identical* pixel count (7,457) and weights 600/700/800
produced a second identical count (10,887). The small monotonic x-height/ascender creep above is
therefore likely antialiasing/hinting noise between those two real shapes, not six genuinely
interpolated ones. **Only the cap-height ratio (weight-invariant regardless of which of the two
instances renders) should be treated as fully resolved from this route**; the x-height/ascender/
descender numbers above are reported as measured but flagged with this caveat rather than
over-claimed as six-way-resolved.

---

## 4. Our fonts, resolved live (`O-LIVE-390`, `/de`, `/de/coiffeur`, `/de/profile`, `/de/inspo`)

**Body**, live-resolved on `/de/inspo`:
```
Inter, "Inter Fallback", Inter, system-ui, -apple-system, sans-serif
```
**Headings** (`h1`-`h6`, `.font-heading`, `.font-display`), live-resolved on the same page:
```
"Inter Tight", "Inter Tight Fallback", "Inter Tight", system-ui, -apple-system, sans-serif
```
Note **`Inter` and `"Inter Tight"` each appear twice** in their own resolved stacks. This is
harmless (the browser just skips the redundant second match) but it is a literal stack
redundancy: `var(--font-inter)` (next/font) already resolves to `Inter, "Inter Fallback"`, and
`tailwind.config.js:236` (`body: [...]`) then appends a third, literal `"'Inter'"` on top of that.
Source: `tailwind.config.js:234-236`, `app/globals.css:123,130`.

**`@font-face` count on `/de`: 62 rules total** (`document.styleSheets` CSSOM scan). Breakdown:
- **56 real product faces**: 2 families (`Inter Tight`, `Inter`) x 4 declared weights (400/500/600/700,
  `SRC app/layout.tsx:22-23`, `Inter_Tight({ subsets:["latin"], weight:["400","500","600","700"] })`)
  x 7 unicode-range subsets each (Google's standard Latin / Latin-ext / Cyrillic / Cyrillic-ext /
  Greek / Greek-ext / Vietnamese split).
- **2 metric-matched fallback faces**: `"Inter Fallback"` and `"Inter Tight Fallback"`, both
  `src: local("Arial")`. Next.js's font optimizer auto-generates these, adjusting the fallback's
  ascent/descent/line-gap metrics to approximate Inter's box, specifically to reduce layout shift
  before the real font loads. **Airbnb's fallback stack has no equivalent** (section 1): it is a
  plain named list with no metric-adjusted local face.
- **4 dev-only faces**: `__nextjs-Geist` / `__nextjs-Geist Mono`, injected by Next.js's dev-mode
  error overlay tooling (`/__nextjs_font/...`). **Not shipped to production**, excluded from every
  count and byte total below.

**The subset that DE/EN/FR/IT actually load.** Within each family, all 4 declared weights point at
the **same file hash** for a given subset (e.g. Inter Tight's "latin" declarations for 400, 500,
600 and 700 all resolve to `/_next/static/media/103fc5fac08dcb15-s.p.woff2`), confirmed by reading
each rule's `src` directly. This means each family ships **one variable-instance file per subset**,
aliased into 4 static-weight-labelled `@font-face` rules, not 4 separate static binaries, the same
underlying approach Airbnb takes (section 1), though Airbnb's format string says
`"woff2-variations"` explicitly and ours says plain `"woff2"` despite the identical-file-across-
weights behavior.

German, French and Italian accented characters (ä ö ü ß é è ê ç à ì ò ù) all live in Unicode's
Latin-1 Supplement block, `U+00-FF`, which is inside the **"latin"** subset
(`unicode-range: U+0-FF, U+131, U+152-153, ...`), the same one English uses. **All four shipped
locales load the identical font file**; no locale pays an extra subset download.

| file | bytes | HEAD-confirmed |
|---|---|---|
| Inter Tight, "latin" subset | **44,916 B (43.9 KB)** | `content-length: 44916`, `font/woff2` |
| Inter, "latin" subset | **48,432 B (47.3 KB)** | `content-length: 48432`, `font/woff2` |
| **combined, one locale's first paint** | **93,348 B (91.2 KB)** | |

Versus Airbnb's single 67,812 B (66.2 KB) Latin file: **we ship ~38% more font weight at first
load for the same script coverage, because we load two families (display + body) where Airbnb
loads one.** `font-display: swap` on every real face, matching Airbnb.

---

## 5. Our weights/sizes actually on screen (`O-LIVE-390`, all four routes, 390x844)

**`/de` (home / discovery):**

| role | text | family | size | weight | line-height | letter-spacing | color |
|---|---|---|---|---|---|---|---|
| section H2 | "Top auf Solen" / "In der Nähe" | Inter Tight | 18px | 600 | 22.5px (1.25x) | -0.18px (-1%) | `#0A0A0A` |
| card title | "Old Town Barbers" | Inter | 14px | 500 | 19px | **normal** | `#0A0A0A` |
| card title | "Cuts & Culture" | Inter | 14px | 500 | 17.5px | **-0.14px (-1%)** | `#0A0A0A` |
| card subline | "Barbershop" / "4056 Basel" | Inter | 12px | 400 | 16.2px | normal | `#6B6B6B` |
| rating | "4.8" | Inter | 13px | 400 | 19.5px | normal | `#6B6B6B` |
| status badge | "Bestätigt" | Inter | 12px | 600 | 18px | normal | `#16A34A` |
| search placeholder | "Suchen" | Inter | 16px | 500 | 24px | normal | `#0A0A0A` |

Two card titles, **same role, same size, same weight**, one with `-0.14px` tracking and one with
`normal`, confirmed on the same viewport (`findBySubstring`, live DOM).

**`/de/coiffeur` (category listing):**

| role | text | family | size | weight | line-height |
|---|---|---|---|---|---|
| section H2 | "Top Coiffeur" | Inter Tight | 18px | 600 | 22.5px, tracking -0.18px (matches home H2) |
| filter chip | "Jetzt geöffnet" | Inter | 13.5px | 500 | 13.5px (1.0x, no leading) |
| sort label | "Beliebteste" | Inter | 13px | 500 | 13px (1.0x) |
| nav pill | "Coiffeur" | Inter | 14px | 400 | 14px (1.0x) |

**`/de/profile` (account, the surface most comparable to Airbnb's account screens):**

| role | text | family | size | weight | line-height | letter-spacing |
|---|---|---|---|---|---|---|
| header title | "Profil" | Inter Tight | 18px | **700** | 27px (1.5x) | -0.18px |
| display name (screen anchor) | "QA Test" | Inter Tight | **28px** | **700** | 42px (1.5x) | **-0.56px (-2%)** |
| eyebrow / group label | "Konto" / "Buchungen" / "Wallet" / "Persönliche Angaben" | Inter | 12px | 600 | 18px | normal |
| row label | "Gutscheine" / "Haarprofil" / "Gespeichert" / "Stempel" | Inter Tight | **15.5px** | 500 | 23.25px (1.5x) | -0.155px (-1%) |
| row subline | "Karte hinzufügen" / "1 aktiv" / "2 Stores" / "Noch 6 bis zur Belohnung" | Inter | 13px | 400 | 19.5px | normal |

Exact source of the two headline numbers: `SRC app/[locale]/_components/profile/AccountHub.tsx:136`
(`text-[28px] font-bold tracking-[-0.02em]`, matches the measured 28px/700/-0.56px exactly) and
`:243` (`text-[15.5px] font-medium tracking-[-0.01em]`, matches the measured 15.5px/500/-0.155px
exactly).

**`/de/inspo` (discovery feed):**

| role | text | family | size | weight | line-height | color |
|---|---|---|---|---|---|---|
| filter tab, active | "Für dich" | Inter Tight | 12px | 600 | 18px | `#0A0A0A` |
| filter tab, inactive | "Haare" / "Nägel" / "Wimpern" | Inter Tight | 12px | 500 | 18px | `#6B6B6B` |
| search placeholder | "Styles suchen..." | Inter | 16px | 500 | 24px | `#0A0A0A` |
| nav pill | "Coiffeur" / "Barber" | Inter | 14px | 400 | 14px | `#0A0A0A` |

**Distinct sizes across just this four-route sample: 28, 18, 16, 15.5, 14, 13.5, 13, 12 = 8.**
`/de/profile` alone carries 5 (28/18/15.5/13/12), over the CLAUDE.md floor-2 ceiling of 4, matching
`AIRBNB_SYSTEM_VS_OURS.md`'s independent finding of 6 on the same screen (small sample difference,
same conclusion).

**Distinct non-zero letter-spacing values measured: -0.56px, -0.18px, -0.155px, -0.14px**, plus
`normal` used inconsistently on same-role elements. There is a sitewide default,
`app/globals.css:132`, `h1,h2,h3,h4,h5,h6 { letter-spacing: -0.025em; }`, but it is overridden by a
component-level Tailwind arbitrary value almost everywhere sampled. **No `fontSize` key exists in
`tailwind.config.js`** (grepped, zero matches): every size on every route above is a one-off
`text-[Npx]` arbitrary value, not a shared scale. A repo-wide grep for `tracking-\[` in
`app/components/lib` returns dozens of distinct arbitrary tracking values from `-0.03em` up to
`+0.22em` with no shared token, for example `AccountHub.tsx:136` (`-0.02em`), `:243` (`-0.01em`),
`SettingsForm.tsx:321` (`-0.005em`), `dashboard/reports/page.tsx:175` (`-0.015em`),
`profile/stamps/page.tsx:165` (`.22em`, positive, uppercase eyebrow).

---

## 6. Our real metrics (`O-CANVAS`, same 300px-em method as section 3)

| family | cap-height (`H`) | x-height (`x`) | ascender (`h`) | descender (`y`) | weight-invariance |
|---|---|---|---|---|---|
| Inter Tight | 219/300 = **0.730** | 164/300 = **0.547** | 219/300 = **0.730** | 61/300 = 0.203 | **exactly flat, 400-700** |
| Inter (body) | 219/300 = **0.730** | 164/300 = **0.547** | 219/300 = **0.730** | 62/300 = 0.207 | **exactly flat, 400-700** |

Unlike Cereal, both of our families showed **pixel-identical** cap/x-height/ascender/descender at
every one of the four declared weights (400, 500, 600, 700), no creep at all. This is a known,
documented Inter design property (Inter deliberately keeps its vertical metrics weight-invariant),
corroborated here by direct measurement rather than assumed from memory.

**The same weight-differentiation sanity check as section 3** (ink-pixel area of `H` at 200px em)
confirms our weight axis genuinely renders four distinct shapes, not a no-op:

| family | w300/400 | w500 | w600 | w700/800 |
|---|---|---|---|---|
| Inter Tight | 6,636 px (300 clamps to 400) | 8,404 px | 9,612 px | 10,930 px (800 clamps to 700) |
| Inter | 7,190 px | 8,281 px | 9,544 px | 10,811 px |

Monotonic, four real steps (+64.7% Inter Tight, +50.4% Inter from lightest to heaviest declared
weight), each clamping cleanly at the boundary of what was actually requested from Google Fonts
(`weight:["400","500","600","700"]`, `SRC app/layout.tsx:22-23`), confirming our weight system is
not a silent no-op.

---

## 7. THE DIFFERENCE, ranked

| axis | Airbnb (measured, source) | ours (measured, route) | difference | does it matter visually |
|---|---|---|---|---|
| family | 1 family, Cereal VF, proprietary variable (`AB-LIVE-390`) | 2 families, Inter Tight (display) + Inter (body) (`O-LIVE-390`, all 4 routes) | we run 2 files where they run 1 | Low on its own; compounds with the byte-size row below |
| weights in use | 400, 500, 600 only, on the homepage, Help Center, and the cited account stills (`AB-LIVE-390`, `S69xx`) | 400, 500, 600, **700** (`O-LIVE-390`: `AccountHub.tsx:136`, `:243`, header "Profil") | we reach 700 on comparably-sized headings where they cap at 600 | Yes, our profile display name and header read a step heavier than Airbnb's equivalent-size text does anywhere I measured or found cited |
| distinct sizes, one screen | ~3, by `AIRBNB_SYSTEM_VS_OURS.md`'s independent count on the account surface | 5 (`/de/profile`: 28/18/15.5/13/12, `O-LIVE-390`), 8 across our 4-route sample | over both their count and our own CLAUDE.md ≤4 ceiling | Yes, this is CLAUDE.md floor 2, already failing independently of the Airbnb comparison |
| letter-spacing | `normal` on every named token, one opt-in `tracking-wide 0.04em` exception (`AB-LIVE-390`) | 4+ distinct non-zero values, no shared token, 1 sitewide CSS default (`globals.css:132`) overridden ad hoc almost everywhere sampled | we are the outlier; they hold one discipline | Yes, the two same-role different-tracking card titles (section 5) read as an accident, not a decision, when adjacent |
| cap-height ratio | 0.710, weight-invariant 300-800 (`AB-CANVAS`) | 0.730, weight-invariant 400-700 (`O-CANVAS`) | Inter's capitals sit ~2.8% taller relative to its own em than Cereal's | Marginal at matched px |
| x-height ratio | 0.520 at w400, creeps to 0.533 at w800 (`AB-CANVAS`, canvas-matching caveat noted in section 3) | 0.547, flat at every weight (`O-CANVAS`) | Inter's x-height is ~5% larger relative to em, and perfectly flat where Cereal creeps | **The single biggest letterform difference at small sizes**, see section 8 |
| ascender vs cap | ascender overshoots cap by 4.2-5.6% (`h`/`b`/`d`/`k`/`l` poke above capitals) | ascender **equals** cap exactly, every weight | real letterform-family difference, not noise | Subtle: Cereal has a touch more visual "air" above lowercase ascenders in mixed case |
| loading strategy | 1 variable file per SCRIPT, only Latin (66.2 KB) loads for CH/EN/DE/FR/IT; `swap`; no metric-matched fallback face | 1 variable file per unicode-range PARTITION x 2 families; only "latin" (93.3 KB combined) loads for all 4 shipped locales; `swap`; **metric-matched `local(Arial)` fallback auto-generated by next/font** | we ship ~38% more font bytes for equivalent Latin coverage, but carry a CLS-safety net Airbnb's stack does not | Not directly visible; a measured perf/CLS tradeoff, not a look tradeoff |

---

## 8. The honest part: what actually differs from Cereal, and whether a free family is closer

**Cereal is proprietary** (cut for Airbnb by Dalton Maag, not licensable), so this is about how
Inter reads differently against it, not about closing the gap by licensing.

1. **x-height, the biggest real difference.** Inter's x-height ratio (0.547, flat) is roughly 5%
   larger relative to its em-box than Cereal's (0.520 at matched weight, `AB-CANVAS` vs
   `O-CANVAS`). At our own 16px body-text floor, that is on the order of half a pixel of extra
   lowercase height for Inter at identical nominal size, before any weight difference is even
   applied. This is a well-documented, intentional Inter design choice (a deliberately large
   x-height for small-screen legibility), and the measurement here corroborates it directly rather
   than repeating it from memory. It is the main reason Inter body text reads a touch
   rounder/heavier next to Cereal at the same px.
2. **Ascender-to-cap relationship.** Cereal's lowercase ascenders overshoot its own capitals by
   4-6%; Inter's sit exactly flush with its capitals. Mixed-case Cereal running text therefore has
   slightly more vertical variety (two ceiling heights, caps and ascenders); Inter's caps and
   ascenders share one ceiling, reading marginally more geometric/blocky in paragraph text.
3. **Terminal and counter shape (cut vs rounded terminals, aperture openness): NOT MEASURED.** The
   canvas method used here captures ink bounding boxes (top/bottom/width), not glyph-outline
   geometry. Answering this honestly needs an actual outline extraction (SVG path or opentype.js)
   comparison, which was out of this pass's time budget. Not asserting anything here from memory.
4. **Letterform advance-width at matched weight: NOT MEASURED comparably.** Cereal's w400 "HHHH"
   advance width was benchmarked at 100px em (288.8px); Inter's equivalent run was not measured in
   this session (I measured Inter's `H` ink-AREA at 200px em for the weight-differentiation check
   in section 6, a different metric). Flagging the gap rather than estimating across it.
5. **Behavior at 16px on a phone.** Both families keep flat, weight-consistent proportions (neither
   distorts as weight changes, unlike some legacy static-only fonts), so 16px renders predictably
   in both. In practice the visible difference at that size is almost entirely the x-height gap in
   point 1, not an instability in either family.

**Is a free family a closer match than Inter?** Not evaluated, and per the instruction not to
invent an answer: I did not run the same cap-height/x-height/ascender canvas pipeline against any
named free alternative (Public Sans, Work Sans, IBM Plex Sans, Manrope, General Sans, etc.) in this
session, so I have no measured basis to name one as closer to Cereal. **Inter is already the right
call to keep**, on grounds independent of any free-alternative comparison: it is deeply wired
(`var(--font-inter)`/`var(--font-inter-tight)` across `tailwind.config.js`, `globals.css`, and
every component cited in section 5), locked by multiple dated owner decisions
(`app/globals.css:129-130`, "Geist reverted per user"; the sitewide "Never Geist" rule), and its
large, flat x-height is a genuine, deliberate legibility choice for a small-screen product, not an
accident. If the owner wants a real free-alternative comparison, the next step is running this
same section-3/6 canvas pipeline against named candidates, not a guess.

---

## 9. What to change, given we keep Inter (concrete, file:line)

1. **Weight ceiling.** Stop reaching for `font-bold` (700) on customer-facing display text; cap at
   600 (`font-semibold`), matching the heaviest weight measured anywhere on Airbnb, live or cited.
   `app/[locale]/_components/profile/AccountHub.tsx:136` (`text-[28px] font-bold tracking-[-0.02em]`
   -> `font-semibold`), same file `:243` is already at 500 and does not need this change.
2. **One tracking scale, not dozens of arbitrary values.** Section 5 found `-0.56px`, `-0.18px`,
   `-0.155px`, `-0.14px` and `normal` in a four-route sample, and a repo grep for `tracking-\[`
   turned up values from `-0.03em` to `+0.22em` with no shared token. Recommend collapsing to
   three tiers tied to size, replacing the blanket `app/globals.css:132` (`-0.025em` on every
   `h1`-`h6`, which is stronger than nearly every measured value and gets overridden anyway):
   `normal` for body/sublines (<=14px), `-0.01em` for headings 15-20px (matches the H2 pattern
   already used correctly at `DashboardUI.tsx:102` and `AccountHub.tsx:243`), `-0.02em` for display
   text >=26px (matches `AccountHub.tsx:136`'s own value, keep that one, just stop the 700 weight
   alongside it).
3. **Size-tier ceiling.** `/de/profile` carries 5 distinct sizes (28/18/15.5/13/12) against the
   CLAUDE.md floor-2 ceiling of 4. This is `AIRBNB_SYSTEM_VS_OURS.md` item 3 restated with a fresh
   measurement (5 here vs 6 there, same screen, same conclusion), not re-decided here; that file's
   ranked change list (section 3, items 3 and 10) already owns the specific collapse target.
4. **A real `fontSize` scale in `tailwind.config.js`.** None exists today (grepped, zero `fontSize`
   key), which is why 8 distinct `text-[Npx]` arbitrary sizes showed up in a 4-route sample.
   Defining the sizes already named in this repo's own design contract (`CLAUDE.md`: name 14,
   meta 12, section-H2 18-20, body 14, CTA 15, eyebrow 11, plus the 28px display floor) as actual
   Tailwind theme values would make the arbitrary-value drift visible in a diff instead of
   invisible in a class string.
5. **Fix the doubled family name in the resolved stack.** `tailwind.config.js:236` appends a
   literal `"'Inter'"` on top of `var(--font-inter)`, which next/font already expands to
   `Inter, "Inter Fallback"`; harmless today but worth deleting the redundant literal the next time
   that line is touched, since it is dead weight in every resolved `font-family` string sitewide.

---

## NOT MEASURED

- Airbnb's account/settings screens, live. Behind login; SRC-CITE only, from `AIRBNB_SYSTEM_VS_OURS.md`.
- Glyph terminal/counter shape for either family (needs outline extraction, not ink bounding-box).
- Cereal vs Inter advance-width at matched weight and size (measured two different things in each
  family in this pass; not directly comparable as reported).
- Any named free-alternative family's cap-height/x-height/ascender ratios; no comparison run.
- Whether `"Circular"` is a genuine, distinct system/fallback font in a clean (non-macOS-Claude)
  environment; `document.fonts.check()` returned `true` but is known to be unreliable here.
- Font behavior on `/de/coiffeur`'s and `/de/inspo`'s scrolled states, and at any viewport other
  than 390x844.
- Icons. Explicitly out of scope for this file; a separate agent owns that half of the owner's ask.

---

## ADDED 2026-08-28: the on-screen SIZE ladder of the phone home feed

Owner ask, verbatim: *"the proposed forty p x body. How does Airbnb do? Right? This is what we
learn from Airbnb."* He was answering my proposal to move a 12px card body to 14px.

This file already held @font-face metrics, byte sizes and cap/x-height ratios. It did NOT hold
what size the actual feed text renders at, and its own NOT MEASURED list says so. That is the
axis his question is about, so this section is the new part and nothing above it is restated.

**Captured live, not recalled.** `https://www.airbnb.ch/`, Browser pane at 390x844, logged out,
2026-08-28. Every visible text node walked, grouped by computed `font-size` and `font-weight`,
weighted by how many characters render at each. Nodes inside a `[role="dialog"]` excluded (there
were none on this load, checked and reported empty) and clipped skip-links excluded.

| size / weight | chars on the first screen | what it is |
|---|---|---|
| 12px / 400 | 733 | card meta: dates, price, the app-promo line |
| 14px / 400 | 361 | the top filter row: "Alles", "Unterkünfte" |
| **13px / 500** | **287** | **the listing name on a card** |
| 11px / 600 | 117 | the "Gäste-Favorit" badge |
| **18px / 600** | **102** | **section heading, "Beliebte Unterkünfte in Paris"** |
| 18px / 700 | 37 | one survey prompt |
| 14px / 500 | 34 | "Hol dir die App" |
| 13px / 600 | 26 | "Alle anzeigen" |
| 10px / 400-500 | 29 | the bottom tab bar |

**Three readings, and the first one reverses a proposal I had already put in front of him.**

1. **Their card title is 13px/500 and their card meta is 12px/400.** Our `SalonCard` renders its
   rating, category, address and price at 12px. That is Airbnb's own number for the same text, so
   the card is already right and the 14px proposal was wrong. The screen that is actually the odd
   one out is the salon detail page at 14px body, not the cards.
2. **Their section heading is 18px/600.** Our `SectionTitle` is `clamp(18px,2vw,20px)` semibold,
   which is 18px at 390 wide. Already identical, nothing to change.
3. **Nothing on their phone home is bigger than 18px.** The only 28px node was the logo's
   accessible name, which renders no visible glyphs. This is direct support for his settled
   2026-08-01 call that the phone home carries no display headline: the FLOORS LAW 6 ">= 28px
   display anchor per customer screen" is satisfied on their home by the photography, exactly as
   the floor's own "unless the photograph is the focal" clause allows. I re-proposed a 30px home
   headline on 2026-08-27 without checking this, and he had already decided it.

**NOT measured in this section:** their PDP and search-results ladders (home feed only), any
viewport other than 390x844, scrolled states, and the .com site (the .ch locale was used).
