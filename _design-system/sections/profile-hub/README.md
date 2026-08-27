# /de/profile section docs

Per-section specs for the account hub, written to the shape of `salon-detail/README.md`. Each
section file carries: Reference, Component, Layer, Layout (ASCII), Measured, Tokens, Interaction,
Intentional deviations, Empty state, Against the floors, Provenance.

**This EXTENDS `CORPUS.md` in this folder, and does not replace it.** One caveat on reading the
corpus: it is dated 2026-07-29 and names `ProfileTabs.tsx` as the Solen surface it bears on. That
component was replaced by `AccountHub.tsx` on 2026-08-02, so the corpus describes the screen this
one succeeded.

## Where the numbers come from

`_design-system/sections/_measured/profile-hub.json`, produced by `scripts/measure-sections.mjs`
at 390x844 against the running dev server, signed in as the seeded customer
(`kunde@solen.ch`), after the settle wait. That record carries `httpStatus 200`,
`redirectedAway false`, `settled true`, `finalUrl http://localhost:3457/de/profile`,
`title "Konto"`, `documentHeight 1038`. It is the real signed-in screen, not the login page.

Two different populations are quoted in these files and they do not agree, so both are named
wherever they appear:
- **Section dump** (`profile-hub.json`): every own-text element in the whole document. It records `textElements 30`, `boldElements 11`, which is **36.67%** at weight >= 600.
- **Floors gate** (`scripts/check-geometry.mjs`): leaf text elements clipped to the FIRST viewport only, and the anchor ratio is against the MEDIAN size, not the body token. It reports **33.33%**, and 28 / 13 = **2.15x**. The same 33.3% and the same 21-element viewport population are independently recorded in `_design-system/AIRBNB_PROFILE_PRINCIPLES.md:164-168`.

- **Live audit** (`_design-system/AIRBNB_PROFILE_PRINCIPLES.md:163-168`, same route, one viewport): **six distinct sizes**, listing a **10px badge** that appears in neither reading above.

Neither number is wrong. They count different things.

**Three readings of the size count, and all three disagree: nine, seven, six.** Nine is `screen.distinctSizes` over the whole 1038px document. Seven is what the per-band `textRoles` attribute (the two the bands never account for are 16 and 15). Six is the live audit's first-viewport count, and it names a 10px badge that no reading of `profile-hub.json` contains at all. All three are on disk and I did not re-measure, so all three are quoted where they appear rather than reconciled into one number.

**One flat contradiction between two of those sources, and the JSON wins.** The live audit records the name as `28px/700`. `profile-hub.json` measures it as **28px / weight 600**, and `AccountHub.tsx:140` reads `font-heading text-[28px] font-semibold`, which is 600. Two independent sources agree on 600, so the audit's 700 is the wrong one. It is a file outside this folder and nothing here changes it.

## Sections (top to bottom on mobile)

| # | File | Section | Component | Own band in `profile-hub.json`? |
|---|---|---|---|---|
| 1 | `01-header-chrome.md` | Global sticky header, "Profil" | `layout/Header.tsx` | yes, band 0 |
| 2 | `02-identity.md` | Eyebrow + avatar + name + edit link | `profile/AccountHub.tsx:132-158` | yes, band 2 (the name column) |
| 3 | `03-bookings-group.md` | Buchungen group, and the shared row anatomy | `AccountHub.tsx:161-165` | no |
| 4 | `04-wallet-group.md` | Wallet group, saved card + vouchers | `AccountHub.tsx:167-172` | no |
| 5 | `05-personal-group.md` | Persoenlich group, hair profile + saved + stamps | `AccountHub.tsx:174-212` | no |
| 6 | `06-settings-row.md` | Einstellungen, the one unlabelled group | `AccountHub.tsx:213-219` | no |
| 7 | `07-sign-out.md` | Abmelden form | `AccountHub.tsx:221-229` | yes, band 4 |
| 8 | `08-bottom-tab-bar.md` | Bottom tab bar | `layout/BottomNav.tsx` | yes, band 3 |
| 9 | `09-entity-consistency.md` | The salon on the profile surface (FLOORS LAW 8) | `components-legacy/SalonCard.tsx` | no, and it cannot have one: the hub renders no salon |

## What was folded, and why

`profile-hub.json` records five bands for eight sections. Two of its five were folded into their
parent here, per the folding rule for this spec set:
- **Band 1, `<main>`** (`top 84, width 390, height 954, padding 0 0 56px`). It contains every
  other band on the screen, so it is the page, not a section. Its geometry is quoted once, here,
  and its text roles are attributed to the sections that render them.
- **Band 2, `<div class="min-w-0 flex-1">`** (`top 134, left 94, width 276, height 66`). A layout
  wrapper inside the identity row, holding the name and the edit link. Folded into `02-identity.md`,
  whose Measured block quotes its box.

Three sections (03, 04, 05) and one more (06) have **no band of their own** and this is a property
of the extractor, not of the screen: it opens a band for a landmark tag or an element leading with
a heading, and the groups are a `<p>` label over a plain `<div>`. Their measured text roles are
carried in the `main` band's role list and are attributed per file with counts.

## The screen's job, and every element against it

**JOB: get a signed-in customer to the one account destination they came for, and say on the way
whether anything there needs them.**

That second clause is what the sublines are for, and it is the test that separates a row that
belongs from a row that is a link with a label on it.

| element | serves the job? | evidence |
|---|---|---|
| Header title "Profil" | yes, weakly | Names the screen once, in the bar. It restates the destination the customer already tapped, and it costs 84px of band height. |
| Avatar + name (28px anchor) | yes | Answers "which account am I in", which is the first question on any account screen, and carries the screen's only display anchor. |
| "Profil bearbeiten" link | yes | A real destination that existed with no route to it until 2026-08-05. |
| Buchungen row | yes | Subline carries the next real appointment, or says there is none. |
| Wallet row | yes | Subline carries the real saved card. |
| Gutscheine row | yes | Subline carries the real active-voucher count. |
| Haarprofil row | yes, label only | No subline by design (owner 2026-08-05). It is a destination, not a state report. |
| Gespeichert row | yes, label + count | Subline is the live favourites count. |
| Stempel row | yes | Subline plus an optional n/m badge, both from live loyalty rows. |
| Einstellungen row | yes, label only | Destination only, subline deliberately dropped. |
| Abmelden | yes | The one thing on this screen that is an action rather than a route. |
| Bottom tab bar | not this screen's | Global chrome. It serves navigation between top-level surfaces, and it renders on this screen because it renders on all of them. |
| **Search bar** | **NOT PRESENT, and that is the answer to the question that produced FLOORS LAW 10** | The owner asked why his own profile had a search bar. It was removed on **2026-08-02** with the ProfileTabs to AccountHub rebuild, citing FLOORS LAW 10 by name (`app/[locale]/profile/page.tsx:10-14` and `AccountHub.tsx:52-56`). The graveyard carries it twice, `_design-system/REMOVED.md` lines 115 and 116, the second reading "Also discharges FLOORS LAW 10 (he had asked why his own profile has a search bar)". The measurement does not contradict it: `profile-hub.json` records no search glyph and no search-field band. That record is weaker evidence than it looks, because the extractor only reports elements that own a text node, so an input's placeholder would not appear either way. The source and the graveyard are what settle it. **Nothing here is a proposal to remove it. It is already gone, and this row exists so the next reader does not go looking for it.** |

Two more things that went with the search bar in the same removal, recorded for the same reason:
the Gespeichert/Termine tab bar, the Sortieren pill, and the bespoke 3-photo `CollageTile`. The
collage is the FLOORS LAW 8 half of that removal, and it did NOT fully close: see
`09-entity-consistency.md`, which measures the salon still rendering through two different
components at two different radii.

### Recommendation

**Search bar: keep it gone, and treat the question as settled rather than open.** It was removed on 2026-08-02, the removal is in the graveyard twice, and a graveyard hit means it is not re-proposed without an explicit owner yes. The reason it was cut still holds and is worth restating in one line, because it is the test that governs the next row anyone wants to add here: a search field on an eight-row list serves the job of a screen with hundreds of items, which this screen is not.

**Two elements are in the same position today, and they get different calls.**

1. **The header title "Profil" (`01`).** Same shape as the search bar: it serves the job of a screen you might have arrived at without knowing where you are, and it costs 84px of band height to restate a destination the customer just tapped. It is NOT recommended for removal, for one reason the search bar did not have: it is shared chrome (`Header.tsx`), rendered on every profile sub-page, so deleting it here would break the same-thing-looks-the-same rule to fix a belongs-to-the-job problem, and FLOORS LAW 8 is the harder floor. The honest description is a bounded cost accepted for consistency, not an element that earns its place.
2. **The bottom tab bar (`08`).** The job table already marks it "not this screen's", and that is correct and fine. Global navigation chrome is exempt from the belongs-to-the-job test by construction: it serves movement BETWEEN surfaces, so it has no single screen to belong to. Recorded so that the next reader does not apply FLOORS LAW 10 to it and reach the wrong answer.

**One live collision found while checking the above, and it is a wayfinding problem rather than a floor breach.** Two controls on this one screen both read **"Gespeichert"** and go to different places: the Persoenlich row goes to `/{locale}/profile/favorites`, which lists saved SALONS through `SalonCard`, and the bottom tab bar's Saved tab goes to `/inspo/saved` (`BottomNav.tsx:96`), which lists saved LOOKS through `ItemCard` / `VideoCard`. Both labels are the same string in `messages/de.json`. Because the two entities genuinely differ, this is NOT a FLOORS LAW 8 violation, and I am not calling it one. It is one word doing two jobs within one thumb's reach. Named, not fixed: the naming is an owner call.

## Against the floors, whole screen

Floors-gate numbers at 390x844, first viewport. **Four of six fail**, which matches the count recorded for `/de/profile` in `_plans/DESIGN_CONSISTENCY_2026-08-27.md` S1 ("profile 4" in the measured list of 15 routes, line 134).

**The four are now named, and naming them is what caught the error below.** The gate's six are `imagery, displayAnchor, weightShare, anchorRatio, sizeSpread, elevation` (`check-geometry.mjs:1252`). Anchor (28 >= 28) and anchor ratio (2.15 >= 1.8) both pass on numbers this JSON supports. That leaves imagery, weight share and the size-spread trap as three failures against a verified total of four, so the fourth had to be elevation, which this table used to mark PASS. A direct census of every shadow-bearing element on the screen then found exactly one, independently. Two lines of evidence, same answer.

| floor | measured | verdict | section that owns it |
|---|---|---|---|
| F2 imagery, floor 33% | **0%** | **FAIL** | `02-identity`. It is the only slot on the screen with an image source, and `imageCount` is 0 in all five bands, so the monogram rendered. No other band has a photographic slot at all. |
| F6 display anchor, floor 28px | **28px** | PASS | `02-identity`, the name. Exactly on the floor, nothing else above 18px. |
| F7a weight share, ceiling 30% | **33.33%** | **FAIL** | Spread: `01` header title (1), `02` name + monogram + eyebrow (3), `03` + `04` + `05` group labels (3), `08` active tab label (1). Eight attributable elements. `06` and `07` contribute none. **The eight do not reconcile with the percentage, and the gap is one element:** 33.33% of the gate's 21-element first-viewport population is exactly 7, while the section files attribute 8 across the whole 1038px document. So exactly one of the eight sits below the fold and the gate never counted it. `profile-hub.json` opens no band for the groups, so it holds no geometry that says which one. Both numbers are right for their own population. |
| F7b anchor ratio, floor 1.8x | **2.15x** | PASS | `02-identity`, 28px over a 13px median. |
| F7c size-spread trap | **cluster of 5 in an 8px window** | **FAIL** | **CORRECTED 2026-08-27: this row used to read "Size count, ceiling 4", which is a real law but is NOT the gate's sixth floor.** The gate fails when more than 4 distinct sizes sit inside a sliding 8px window (`SIZE_SPREAD_TRAP_MAX_DISTINCT = 4`, `SIZE_SPREAD_TRAP_MAX_SPREAD_PX = 8`, `check-geometry.mjs:203-204`); the global spread is context only. On the live audit's first-viewport sizes {10, 12, 13, 15.5, 18, 28} the window 10 to 18 holds **five** distinct sizes. On the JSON's nine, the window 12 to 18 holds **seven**. Both populations trip it. |
| Size count, ceiling 4 (CLAUDE.md NEVER-AGAIN floor 2, not one of the gate's six) | **nine** document-wide, **seven** in the bands, **six** in the live-audit viewport | **FAIL** on every reading | 28 and 24 in `02`, 18 in `01`, 15.5 in `03`-`06` and `07`, 14 in `02`, 13 in `03`-`05`, 12 in `02` + `03`-`05` + `08`. The bunching is the real shape: five of the seven sit between 12 and 18. |
| Elevation, floor 2 steps | **one** | **FAIL** | **CORRECTED 2026-08-27, this row read "two / PASS" and both halves were wrong.** The gate counts distinct non-none computed `box-shadow` values among visible elements in the first viewport, floor 2 (`scripts/check-geometry.mjs:1233-1250`, `FLOOR_ELEVATION_COUNT` at :205). This screen has exactly one: `BottomNav.tsx:230`, `0 6px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.5)`, on the band whose measured background `rgba(255, 255, 255, 0.8)` matches the `FROST_GLASS` recipe. Nothing else can supply a second: the rows are forbidden a container (LOCKFILE:578-580), the avatar card measures `boxShadow "none"`, the header is transparent. Owned by `08`. |
| Weight count, ceiling 2 | **four**: 400, 500, 600, 700 | **FAIL** | 700 in `01`, 600 in `02` + group labels + `08` active, 500 in row labels + `02` link + `07`, 400 in sublines + `08` inactive. Recorded because the ceiling is half of NEVER-AGAIN floor 2 and the brief's six-number grade does not include it. |

**Off the locked type scale: 15.5px, 8 elements.** Measured as two roles: 15.5 / 500 / Inter
Tight / `#0A0A0A` / letter-spacing -0.155px, **count 7**, sample `"Buchungen"` (the row labels,
files 03 to 06); and 15.5 / 500 / **Inter** / `#DC2626` / letter-spacing `normal`, **count 1**,
sample `"Abmelden"` (file 07). `ALLOWED_PX` holds whole-number values only and `isAllowedPx`
requires an exact integer, so no fractional size can be on the scale
(`scripts/lib/type-scale-allowed.mjs`). Re-running the detector reports
`text-[15.5px] (4 uses across 3 files)` naming `AccountHub.tsx:224` and `AccountHub.tsx:279`; the
committed `_design-system/_type-scale-report.md` names only 2 uses across 2 files and omits
`AccountHub.tsx`, so the committed report predates these two call sites. Recorded, not changed.

## Target ladder

The owner's decision, and it is the salon page's own ladder: **anchor 30px, body 14px, ratio
2.14x, five distinct sizes with four of them in the densest cluster, bold share 30%, three
elevation levels, and emphasis carried by size and colour at weight 500 rather than by weight
600.** This screen sits at 28 / 13 / 2.15x / seven sizes / 33.33% / **one** elevation step / 0% photographic. Only the ratio actually matches. Per-section ladder grades are in each file's "Against the floors" block under **Against the ladder**. No fix is
proposed in this folder; the specs record what is, against both numbers.

## Not yet measured

- Per-row geometry for every row in files 03 to 06: row height, icon rect, chevron rect, label baseline. `profile-hub.json` opens no band for the groups, so none of it is on disk.
- The 12px group-label band boxes (the four eyebrows) individually. Only the shared role and its count of 4 are recorded.
- The stamps `n/m` end badge, at any size. It did not render for the measured account.
- The avatar in its PHOTOGRAPH state. Every measured band reports `imageCount 0`, so only the monogram fallback has ever been measured on this screen.
- Five text elements and three of the eleven bold elements at document level are not inside any measured band, and two sizes in `screen.distinctSizes` (16 and 15) appear in no band's `textRoles`. The section dump does not name individual elements, so I cannot say what they are. Two things sharpen it: `textRoles` filters on `visible()`, so 16 and 15 are REAL rendered text somewhere on the document and not hidden markup; and the live audit adds a third unaccounted size, a 10px badge, that no reading of the JSON contains. `node scripts/measure-sections.mjs /de/profile --auth` with per-element output is what settles all three. I did not re-measure.
- A gate RUN. Every floors number in this folder is read off `profile-hub.json`, the live audit, and a source census; I could not run `check-geometry.mjs` because no dev server was up on 3457 or 3000 at 2026-08-27. The elevation correction above rests on two agreeing lines of evidence, not on a gate run.
- Desktop. Every number in this folder is 390x844.
- The scrolled-to-bottom state, where the fixed bottom bar sits over the last 58px of a 1038px document.
- Locales other than `de`. Row labels and group labels are the longest-string risk (design contract i18n row, copy-i18n-09).
