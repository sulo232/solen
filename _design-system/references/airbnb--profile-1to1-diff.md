<!-- exists-check: `npm run exists profile` run this turn, 2026-08-02 (see bottom-tab-bar row below
     for the one `npm run exists "bottom nav"` hit that matters to this doc, a graveyard entry).
     `_design-system/references/airbnb--profile-list.md` already exists and carries the full PIL
     measurement of the five reference stills (IMG_6900-6904); that file is REUSED wholesale as the
     reference-side source for this table, not re-measured. This file is net-new: it is the first
     doc that puts those reference numbers next to a live measurement of OUR page in one row-by-row
     table, which the sibling file's own "vs ours" section does only partially (it quotes
     AccountHub.tsx source, not the rendered page, and it doesn't cover the header/back/hamburger
     chrome at all, since that lives in Header.tsx, a file outside the sibling doc's scope). -->

# Airbnb vs Solen, `/profile` account hub , one-to-one difference table

Owner verdict that produced this file, 2026-08-02, verbatim: *"that is not a fucking phone width...
it does not match a screenshot and screen recording at all... The back button doesn't look like it.
Why is there a fucking hamburger menu icon in the notification bar there? Why is the fonts like
that? Every single part of it does not look like the reference at all."*

**Scope correction, mid-task:** the screen recording named in the original brief
(`ScreenRecording_08-02-2026 22-09-37_1.MP4`) was pulled from scope by the owner before this table
was written ("no screenrecording"). Every reference number below comes from the five stills
(`IMG_6900.PNG`-`IMG_6904.PNG`) only, via `_design-system/references/airbnb--profile-list.md`'s PIL
measurements. Nothing in this table is sourced from that recording.

**Method.** Reference column = quoted from `airbnb--profile-list.md` (PIL pixel-sampling, scale
3.0x, 1206x2622px = 402x874pt). Ours column = `getBoundingClientRect()` / `getComputedStyle()` read
live off `https://card-albums-anne-mood.trycloudflare.com/de/profile` (logged in via
`/api/dev/login?to=/de/profile`, browser viewport 390x844, test user "QA Test"), captured this
session, not recalled from source code. Where a value was not independently re-measured this
session it says so instead of restating the sibling file's number as if it were fresh.

---

## The four the owner named directly

### 1. Back affordance

| | Airbnb (measured) | Solen (measured live) |
|---|---|---|
| shape | **circle**, diameter 119px = 39.7pt (`airbnb--profile-list.md` IMG_6901 line 72) | **rounded square**, 44x44px, `border-radius: 16px` (not a circle) |
| fill | light grey `#F2F2F2` | white `#FFFFFF` |
| border | none detected | `1px solid #E4E4E7` (s-border) |
| arrow glyph | 42x37px = 14.0x12.3pt, ink | Lucide `ArrowLeft`, 22x22px, `stroke-width` not read this pass (Lucide default 2 unless overridden; Header.tsx passes `strokeWidth={2.2}`) |
| position | floats alone at the top of the scroll area, page title appears BELOW it, large (30.7pt), not beside it (IMG_6901: title y399-490, back button y150-350, i.e. stacked, not inline) | inline in a single header row: back button + title "Profil" (18px Inter Tight 700) side by side, `x16,y20,44x44` button then title at `x70,y29` |
| **delta** | circle, grey fill, no border, stacked-below-title layout, smaller glyph | square, white fill, bordered, inline-with-title layout, larger glyph |
| **root cause** | Solen's global `Header.tsx` (:754-786) uses one shared "utility tile" recipe (`rounded-input border bg-white`, 44x44) for every icon-button on the site , home icon, back icon, menu icon all share it. Airbnb's back affordance is a page-local, page-title-specific treatment, not a shared site-chrome tile. | |
| **target for the mockup** | render the back control as a light-grey (`#F2F2F2`-equivalent, nearest token `s-bg-sunken` `#F4F4F5`) circle, ~40px, no border, stacked above/beside the title per the reference's own layout, in THIS mockup only, not a live Header.tsx change (that is a sitewide component used on every deep page, out of this task's scope) | |

### 2. Top-right icon row (the hamburger)

| | Airbnb (measured) | Solen (measured live) |
|---|---|---|
| icon count in the row | **exactly 1** , a bell, at x1077-1118px (`airbnb--profile-list.md` IMG_6900 line 45, dark-pixel column-cluster scan, explicit finding: "no hamburger/menu icon anywhere in this row") | **2** , bell (`svg.lucide-bell`, 40x40 wrapper, bare, no bg/border, badge "3" in accent blue) at `x278,y22`, then hamburger (`button[aria-label="Menü öffnen"]`, 44x44, white bg, bordered, `svg.lucide-menu` 22x22) at `x330,y20` |
| bell treatment | circular light-grey bg `~#F1F1F1` behind the glyph | no tile at all, bare glyph on white, blue notification-count badge |
| **delta** | 1 icon (bell only), tiled/circular | 2 icons (bell + hamburger), bell untiled, hamburger tiled |
| **root cause** | Airbnb's bottom tab bar (Explore/Wishlists/Trips/Messages/Profile) IS the site's primary navigation, so the account screen needs no secondary nav trigger in its top chrome. Solen has no bottom tab bar (see that row below); the global `Header.tsx` puts the hamburger , trigger for `MobileMenu.tsx`, the sheet holding site-wide category/login/language nav , on every route including `/profile`, because on Solen `/profile` there is no other way to reach that sheet. | |
| **target for the mockup** | drop the hamburger from THIS mockup's top chrome (bell only, matching the reference), with a note that the real fix is structural (Solen's nav paradigm has no bottom tab bar to absorb that function) and is out of this task's scope to resolve sitewide | |

### 3. Type: family, size, weight, letter-spacing

| element | Airbnb (measured) | Solen (measured live) |
|---|---|---|
| page title | "Account settings" 30.7pt bbox height / "Login & security" isolated-cap 20.0pt (two different sub-pages measure 12-13% apart, reported as-is in the sibling file, not reconciled) | "Profil": `font-family: "Inter Tight"`, `18px`, `font-weight:700`, `letter-spacing:-0.18px` |
| row label | cap-height 11.7pt on a clean sample ("Taxes"); **the sibling file's own orchestrator-correction says this is a CAP-HEIGHT, not a font size, and the real font is closer to ~16pt once word-width calibrated, not 11.7pt literally** | "Buchungen": `font-family: "Inter Tight"`, `15.5px`, `font-weight:500`, `letter-spacing:-0.155px` |
| eyebrow / group label | **not present** on the icon-nav list (Recipe A) at all | "Konto" / "Buchungen" / "Wallet" / "Persönliche Angaben": `font-family: Inter` (body font, not Inter Tight), `12px`, `font-weight:600`, `color: #6B6B6B` |
| name (profile root only, IMG_6900 not deep-measured for this axis) | not pixel-boxed in the sibling file (out of its row-anatomy scope) | "QA Test": `font-family: "Inter Tight"`, `28px`, `font-weight:700`, `letter-spacing:-0.56px` |
| font family | not identified (sibling file's own NOT MEASURED list: "Airbnb Cereal or a system fallback... not identified or verified, only glyph geometry was measured") | confirmed live: **Inter Tight** for title/name/row-label, **Inter** (default) for eyebrows/sublines. Cannot be word-width-calibrated against an unidentified reference family; the sibling file's calibration correction (~16pt for the row label) is the best-available number, already folded into Solen's own font family, not Airbnb's |
| **delta** | mixed: title mechanism differs entirely (stacked vs inline, collapsing on scroll vs not); row label is already close (15.5px measured vs reference's calibration-corrected ~16pt estimate, within 0.5px); the group-label eyebrow is a Solen-only addition with no Airbnb equivalent at all | |
| **target** | row label: keep ~15.5-16px (already close, do not shrink to the raw 11.7pt cap-height figure, that would ship smaller than what the owner already rejected as "so small" per the sibling file's own warning) | |

### 4. Frame width

| | measured |
|---|---|
| reference stills | **402pt exactly** (1206px / 3.0 scale factor, confirmed individually per-file with PIL `Image.size` on all five, `airbnb--profile-list.md` lines 13-21) |
| the REJECTED mockup (`public/_mockups/account-v2/account-hub-lines.html`), at a 390px mobile viewport | iframe rendered at **390x788px** , looks phone-width by accident only, because the browser happened to be 390px wide |
| the SAME rejected mockup, at a 1440px desktop viewport (measured live this session by resizing the Browser pane and reloading the exact same file, no code change) | iframe rendered at **1440px wide**, showing the full DESKTOP site chrome (`Services / Für Unternehmen / Inspo / Über uns / Basel / DE` nav, a `Home > Profil` breadcrumb, the content column floating centered in a sea of white) , confirmed screenshot on file |
| **root cause** | the mockup's CSS has no device-frame constraint at all: `iframe{width:100%}` inside an unconstrained `<body>`. It is a live iframe of the real responsive site, so it renders however wide the browser happens to be. On the owner's phone or a differently-sized window it is never guaranteed to be 402pt, which is exactly what he flagged. | |
| **target** | build the STEP 3 rebuild inside `_mockups/_BASE.md`'s mandated 402px fixed canvas, full-bleed, no responsive breakpoint , not a scaled iframe of the live responsive site | |

---

## Everything else in scope (status bar, title, avatar, rows, dividers, tab bar)

| axis | Airbnb (measured) | Solen (measured live) | delta / target |
|---|---|---|---|
| status bar | not pixel-boxed in the sibling file (time/signal/wifi/battery glyphs visible in every still, iOS system chrome, not app-rendered) | Browser-pane capture has no OS status bar (web viewport, not a native shell) | the STEP 3 mockup renders a fake iOS status bar per `_BASE.md`'s kit (real signal/wifi/battery glyphs, no `●●●` placeholders per the copy-economy mockup rule) |
| screen title mechanism | large title BELOW the back button while at the top of scroll, collapses into a small INLINE title beside the back button once scrolled (standard iOS large-title collapse, confirmed across IMG_6901→IMG_6902) | one fixed small inline title ("Profil", 18px) beside the back button at all scroll positions, no collapse behavior (this is Solen's sitewide header pattern, shared by every deep page) | structural difference, not fixable inside one mockup file without touching the shared `Header.tsx`; noted, not silently resolved |
| avatar block | not measured in the sibling file for the profile-root screen specifically (its Recipe A anatomy section covers the row list, not the header above it) | 60x60px circle at `x20,y134`, name inline at `x94,y143`, `28px/700` | no reference number to diff against; not claimed as a match or a gap |
| row height / pitch | **56.0pt exactly**, zero variance across 19 rows spanning two screens (chevron-top to chevron-top) | **not a fixed pitch**: first row (single-line subline) measures 74.8px tall as a CSS box (`py-[15px]` top/bottom around a 38px icon, per `AccountHub.tsx:227`), height varies with subline text length since nothing pins a row height | reference uses a hard-fixed row pitch regardless of content; ours is content-driven. Target for the mockup: honor the reference's 56pt fixed pitch on rows that have no subline, matching Recipe A (the icon-nav list is the correct recipe to mirror here, not Recipe B's variable-height text-detail rows) |
| icon size + stroke | **bare glyph, no tile**, ink bbox 21-23pt varying by glyph, stroke width 4px/1.33pt (measured on the one icon that repeats across screens, the device-history phone glyph) | **38x38px tile**, `background:#F4F4F5` (`s-bg-sunken`), `border-radius:14px`, glyph 19x19px inside, `stroke-width:1.9` (`AccountHub.tsx:229`) | this exact gap is FLOORS LAW 4's "dead-grey" objection already named in the file's own prior `Diagnosis:` comment (line 14 of the now-superseded mockup) , tile removal was already the plan once, just never finished. Target: bare 21-23pt ink glyph, no tile, `stroke-width` kept near reference's measured 1.33pt (close to Lucide's own 1.5-2 default range, not a big move) |
| chevron | 19x38px ink bbox (6.3 x 12.7pt tall), present on every navigable row, ABSENT on the one non-nav action row ("Log out") | `ChevronRight` 18x18px, `stroke-width:1.9`, present on every row (Solen's rows are all navigable `<Link>`s, so this is already correct behavior, just needs the size/stroke pass) | close already (18px vs reference's ~12.7pt-tall glyph is in the same range once font-vs-icon-pt conversion is accounted for); no major delta |
| divider colour + inset | **`#EBEBEB`**, 1.0pt thick, inset 24.0pt both sides from the screen edge, **present ONLY at the end of a whole group**, zero dividers between rows within one group | **`#E4E4E7`** (`s-border` token, computed `rgb(228,228,231)`), 1px, present on **every row** within a group (`divide-y`) via `border-top` | two separate deltas: (a) wrong colour (`#E4E4E7` cool-grey vs reference's `#EBEBEB`, close but not identical , `#E4E4E7` is this repo's LOCKED hairline token, so this is a legitimate token-vs-exact-hex tradeoff to flag, not silently overridden); (b) wrong frequency (every-row vs group-end-only). Target: keep the divider OFF every interior row, add ONE hairline only where a group ends, matching Recipe A exactly, since Recipe A (not B) is the anatomy this screen already resembles |
| group gap (between two row-groups) | row pitch jumps from 168px (56.0pt) to 267px (89.0pt) at a group boundary, i.e. **+33pt of extra whitespace** beyond a normal row-to-row gap | group-to-group gap not independently re-measured this session; `AccountHub.tsx` uses `<GroupLabel>` with `mt-[26px]` (26px top margin) between `RowCard`s, i.e. spacing comes from the eyebrow's margin, not a bare gap | not a clean 1:1 comparison since Solen's groups carry an eyebrow label the reference doesn't have at all (see type-table eyebrow row above); flagged, not force-matched |
| bottom tab bar | present on every one of the five stills: Explore / Wishlists / Trips / Messages / Profile, Profile active in red/pink, this IS the reference's primary nav | **does not exist on Solen, by name, on purpose**: `npm run exists "bottom nav"` returns a graveyard hit , owner 2026-07-02: *"Solen has NO bottom nav (fabricated)"* | **not a gap to close.** This is a locked, dated owner rejection (`_design-system/REMOVED.md`) and outranks a visual-match instinct here; noted for completeness per the task's instruction to cover it, not proposed as a fix |

---

## Summary: what actually changes in the STEP 3 rebuild

Grounded only in rows above with a stated **target**, nothing invented beyond them:

1. Fixed 402px device canvas, no responsive stretch (frame-width row)
2. Back control: light-grey circle (~40px, no border), not the site's shared white bordered square (back-affordance row)
3. Top-right: bell only, hamburger dropped from this mockup's depiction (hamburger row)
4. Row label stays ~15.5-16px (no change needed, already close once word-width-calibrated)
5. Icon: bare 21-23pt ink glyph, tile removed (icon-size row)
6. Divider: one `#EBEBEB`-equivalent hairline per group-end only, none between interior rows (divider row)
7. Row pitch: fixed to a consistent value on no-subline rows, not content-driven (row-height row)
8. Group eyebrow labels, the row card's border/shadow/radius-24 box, the bottom tab bar's absence, and the collapsing-title mechanism are named as structural deltas but NOT changed , they are either sitewide `Header.tsx` concerns outside this task's file scope, or a dated locked owner decision (bottom nav), or (the eyebrow) a deliberate Solen addition with no reference equivalent to revert to, not an oversight.

---

## ORCHESTRATOR RE-MEASUREMENT 2026-08-03: the label size came off the WRONG SCREEN

Owner: *"still not like it, acc diagnose"*. He is right, and this is the cause.

I PIL-sampled `IMG_6900.PNG` (the Profile ROOT, the screen he is comparing against) myself:

| element | ink cap-height | = cap pt | implied font | what the mockup shipped |
|---|---|---|---|---|
| title "Profile" | 51px | **17.0pt** | **~24pt** | **18px** |
| row label | 45px | **15.0pt** | **~21pt** | **16px** |

**The 11.7pt cap figure everything was built on came from `IMG_6901`/`6902`, the Account SETTINGS
screen, not from `IMG_6900`, the Profile root.** Those are two different screens with two different
type scales: settings labels sample at 11.7pt cap, the profile root at 15.0pt. Building the profile
root off the settings number makes every label ~24% too small, and the title ~25% too small.

This is the measurement-scope error this repo already has a gate for: the measuring was correct,
the ATTRIBUTION was wrong. A number from the right ruler and the wrong screen.

Second defect, same class: **the Profile root in IMG_6900 has NO back control at all.** It is a tab
root, its top-left is the bare word "Profile". The 40pt grey circle in the diff table was sampled
from IMG_6901, a sub-screen, which legitimately has one. The mockup therefore carries a back button
the reference screen does not have.

- [ ] **D1. Retype the mockup to the ROOT screen's scale:** title 18px -> 24px, row label 16px -> 21px.
- [ ] **D2. Drop the back control from the profile-root depiction** and re-check what actually sits
      top-left in IMG_6900 (measured: the title alone) and top-right (measured: one bell).
- [ ] **D3. Re-audit every other number in this table for the same screen-attribution error.** Row
      pitch, icon bbox and divider were sampled across several images; each needs its source image
      named per row, and any row sourced from a settings screen re-taken from IMG_6900.
