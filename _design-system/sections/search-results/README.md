# /{locale}/{city}/{category} section docs

Per-section specs for the search-results route, measured on `/de/basel/coiffeur`. Each section .md file follows the same shape as `salon-detail`:

- **Reference:** where the numbers came from (here: the measurement file, not a screenshot)
- **Component:** file path of the React component
- **Layout:** the visual + structural target (numbers measured, not eyeballed)
- **Measured:** the band's box, surface, text roles and card anatomy, verbatim from the JSON
- **Chrome position:** the search pill's box, in the one section that owns it
- **Tokens:** color/font/spacing tokens used
- **Interaction:** what each tap does
- **Intentional deviations:** Solen brand choices, and places the shipped code differs from a locked row
- **Empty state:** what renders with no data
- **Against the floors:** which floors this section's measured numbers pass and fail, with the number
- **Provenance:** the lock(s) and dated owner decisions that drove the section

`08-screen-job.md` is the one file that does not take that shape, and says so in its own header: it has no band, no component and no tokens, because FLOORS LAW 10 grades the composition rather than a section.

This folder **extends** `CORPUS.md`; it does not replace it. Where the corpus settled a question it is cited rather than re-decided. One thing the corpus can no longer describe is flagged in `03-top-category-rail.md`: the corpus was written on 2026-07-29 against the flat `SalonResultCard` feed, and owner 2026-08-01 replaced that feed with horizontal rails on any route with an active category, so `CORPUS.md` sections 4, 5, 7 and 8 describe a mobile screen this route no longer renders.

## Sections (top to bottom on mobile, 390x844)

| # | File | Section | Component | JSON band |
|---|---|---|---|---|
| 1 | `01-header.md` | Global sticky header, Home tile + hamburger | `layout/Header.tsx` | 0 |
| 2 | `02-search-band.md` | Sticky search pill | `search/SearchTemplate.tsx:1306-1360` | none, see below |
| 3 | `03-top-category-rail.md` | "Top Coiffeur" carousel | `search/CategoryMobileRails.tsx` + `homepage/SalonCard.tsx` | 2 + 3 |
| 4 | `04-nearby-rail.md` | "In der Nähe" carousel | `search/CategoryMobileRails.tsx` + `homepage/SalonCard.tsx` | 4 + 5 |
| 5 | `05-bottom-nav.md` | Floating bottom nav (fixed chrome) | `layout/BottomNav.tsx` | 6 |
| 6 | `06-faq.md` | City-category FAQ | `[city]/[category]/page.tsx`, local `CityCategoryFaq` | 7 |
| 7 | `07-footer.md` | Global footer + newsletter | `layout/Footer.tsx` | 8 + 9 + 10 |
| 8 | `08-screen-job.md` | The screen's job, and every element graded against it | none, this file grades the composition | none |

**Count, plainly: 11 measured bands, 8 files.** Six files are band-backed and between them cover ten of the eleven bands (0, 2, 3, 4, 5, 6, 7, 8, 9, 10). Band 1 is `main`, which contains every other band, so it backs no file of its own and is instead drawn on wherever a child band lacks a number. Two files carry no band at all: `02-search-band.md`, because the search pill is a `motion.div` the walker never promotes, and `08-screen-job.md`, because FLOORS LAW 10 grades the composition rather than any one band.

**Ordering.** `scripts/measure-sections.mjs` sorts bands by `rect.top`, so the bottom nav lands at index 6 between the rails and the FAQ even though it is `position: fixed`. This table keeps that order rather than re-sorting into DOM order, so the file numbers and the JSON indices stay walkable side by side.

**What was folded rather than given its own file.** Bands 1, 3, 5, 9 and 10 do not get files:

- **Band 1 is `main`**, the all-containing element. Its text roles and card list are the union of every band inside it, so a file for it would restate the whole screen. Its own numbers are used in two places where a child band does not carry them: the search pill's card entry (`02-search-band.md`) and the screen-wide totals.
- **Bands 3 and 5 are wrapper divs** (`div.mb-[14px] flex items-center justify-between gap-4`), the heading rows of the two rails, promoted only because they lead with an `h2`. Folded into `03` and `04`.
- **Band 9 is a bare wrapper div** around the footer's newsletter title. Folded into `07`.
- **Band 10 is the newsletter `form`**, promoted because `form` is a landmark tag. It is one control inside the footer, and its card entry is already present in band 8, so it is folded into `07` too.

**Two files have no band.** The sticky search pill is a `motion.div` with no heading child, so it fails both tests the walker uses to promote a node. It gets file `02` anyway, because it is the element item S2 of the plan is about, and its measured card entry lives inside band 1. `08-screen-job.md` has no band either, and could not: FLOORS LAW 10 asks what the screen is FOR and then grades every element against that, which is a question about the set and not about any member of it.

## Reference set

There are no reference screenshots for this route. `salon-detail` cites 13 Fresha stills because it was built from them; this route was not. The one measurement behind every number in this folder:

- `_design-system/sections/_measured/search-results.json` , `scripts/measure-sections.mjs` at 390x844 against `http://localhost:3457/de/basel/coiffeur`, HTTP 200, `settled: true`, `redirectedAway: false`, document height 2311, title "Beste Coiffeur in Basel - Termin buchen | Solen"
- `CORPUS.md` , 14 Mobbin searches, 2026-07-29, cross-app anatomy only, no pixel measurements by its own statement

## The floor result for this route

Six floors, from `scripts/check-geometry.mjs --floors-only`, measured over the first viewport:

| floor | measured | threshold | verdict | section that owns it |
|---|---|---|---|---|
| F2 imagery | **41.03%** | >= 33% | PASS | `03` + `04`, half each |
| F6 display anchor | **18px** | >= 28px | **FAIL** | `03` |
| F7a bold share | **28.57%** | <= 30% | PASS | `03` + `04` push it up, `05` pulls it down |
| F7b anchor ratio | **1.5x** | >= 1.8x | **FAIL** | `03` |
| F7c size spread | **4 distinct sizes** | <= 4 | PASS | screen-wide |
| ELEVATION | **5 levels** | >= 2 | PASS | screen-wide |

**Three of six met. Both failures are the same missing thing, and section 03 owns it.** The screen's largest text is the 18px `RailHeading` `h2` in `03-top-category-rail.md`, which is 10px short of the display-anchor floor and gives a 1.5x ratio against a 12px median body. The screen has no page title. `app/[locale]/[city]/[category]/page.tsx:211` passes `hero={{ title: "Coiffeur in Basel", subtitle: ... }}` and a three-item `breadcrumb` into `SearchTemplate`, and `SearchTemplate.tsx:429-430` destructures both and renders neither: grepping all 2546 lines returns the prop types, the destructures and three comments, and no render site. Recorded in full in `02-search-band.md`. No fix is proposed in this folder.

**Against the owner's target ladder** (the salon page's, which he chose for every screen): anchor 30 against this screen's 18, body 14 against 12, ratio 2.14x against 1.5x, five distinct sizes with four in the densest cluster against four here, bold share 30% against 28.57%, three elevation levels against five, imagery 34.66% against 41.03%. Emphasis on the salon page is carried by size and colour at weight 500; here the card name is weight 600, overridden at the call site (`SalonCard.tsx:517`) over a `CardName` primitive that bakes 500 and whose own docstring forbids the override. Imagery is the only axis where this screen is ahead of the salon page.

**The target ladder collides with two ceilings in the project CLAUDE.md, and surfacing that is not the same as arguing with it (recorded 2026-08-27).** The ladder is `/de/salon/cuts-and-culture` measured 2026-08-27, and the owner chose "same ladder everywhere". Two of its six numbers sit at or over a written ceiling. **Distinct sizes: the ladder is 5, and NEVER-AGAIN floor 2 reads "at most 4 distinct font sizes AND at most 2 distinct weights on one screen".** So a screen that reaches the ladder exactly is one size over that ceiling. **Weight-600 share: the ladder is 30% and FLOORS LAW 7(a) is "at most about 30%",** so the ladder sits exactly on that ceiling with no headroom, on a number the same block already labels a house number with no external citation. The other four ladder values clear their floors comfortably: anchor 30 against 28, ratio 2.14x against 1.8, imagery 34.66% against 33%, and elevations are uncapped. Per the precedence chain this is a tier-1 dated owner decision meeting tier-5 pinned rules, so it is surfaced with both sides named and not resolved here. It matters for this route in one concrete way: this screen currently measures 4 distinct sizes in the first viewport and PASSES that ceiling, and moving it onto the ladder would take it to 5 and break the ceiling it passes today. Nobody has been asked which of the two governs.


**Whole-document totals, for contrast with the first-viewport figures above**, from the JSON's `screen` block: 8 distinct sizes (22, 18, 17, 16, 15, 14, 13, 12), 4 distinct weights (400, 500, 600, 700), 138 text elements of which 48 are weight 600 or more, which is 34.78%. The first-viewport figures are what the gate grades; both are recorded so the gap between them is visible.

## Not yet measured

Gaps in `_measured/search-results.json` that a spec in this folder needed and could not get. Nothing below was filled in by guessing.

1. **The search pill's y.** The JSON records cards by anatomy, with an `exampleSize` and no box, so the pill has a measured height (54) and width (358) and no measured top. `02-search-band.md` derives 88 from measured numbers plus source constants and closes the derivation exactly on the measured 166 of band 2, and labels it derived. Item S2 needs this measured on every screen it compares, so the fix is a box for non-band elements in `measure-sections.mjs`, not a re-derivation per screen.
2. **A 15px text size that belongs to no band.** `screen.distinctSizes` includes 15 and no band's `textRoles` contains it. Six text elements and three bold elements are likewise unaccounted for: summing every real band gives 132 text and 45 bold against the screen's 138 and 48. Those elements sit outside every node the walker promoted to a band. Which elements they are is unknown from this file.
3. **The bottom nav's own box-shadow and radius.** `cardAnatomy` walks descendants and never the root, so band 6 reports zero cards despite being a 366x58 glass capsule. Its shadow in `05-bottom-nav.md` is read from `BottomNav.tsx:233`, not measured.
4. **The fifth elevation level.** The checker reports 5 distinct box-shadow values in the first viewport. Four are nameable from this JSON plus source: `elevation-2` (SalonCard photo and the header tiles), `elevation-3` (the search pill), the bottom nav's inline glass shadow, and `none`. The fifth is not identifiable from this file.
5. **Whether the measured run had geolocation.** `04-nearby-rail.md` needs it to say which arm of the `hasDistance` branch ran. The JSON records no permission state.
6. **Why the three FAQ `<details>` rows measured open.** All three answers measured as visible elements, and `CityCategoryFaq` sets no `open` attribute. Recorded as unexplained in `06-faq.md`.
7. **The 57px below the footer.** The last band ends at 1374 + 880 = 2254 and `documentHeight` is 2311. Nothing in the measurement accounts for the remaining 57px, and no band has a box that reaches it. Recorded, not explained.
8. **Anything about desktop.** Every number in this folder is 390x844. `SearchTemplate` renders a completely different mobile and desktop screen (the rails are `md:hidden`, the filter chip row and the grid are `md:` only), so nothing here describes what a desktop visitor sees.

## Corrections made to this folder on 2026-08-27, after the files above were first written

Five claims in the seven original files were checked against the JSON and the source and did not hold. Each is corrected in place with the reason stated at the point of the change, rather than silently rewritten.

1. **`07-footer.md`** claimed the footer band contributes 22 text elements of which 6 are bold, 27.3%. The JSON's band 8 sums to **23 and 7, 30.43%**. This folder's own screen-wide total of "132 text and 45 bold" only closes with the corrected figures, so the file disagreed with its own README.
2. **`03-top-category-rail.md`** gave the computed card area as 340,481 px against a measured 340,477. The formula it cites produces **340,525.5**. The reconciliation still holds, to 0.014%, and only the arithmetic was wrong.
3. **`02-search-band.md` and `05-bottom-nav.md`** both stated that the bottom nav's fourth item fires `solen:open-menu`, taking the claim from a comment at `SearchTemplate.tsx:1383` repeated at `HomeSearchPill.tsx:293`. **`BottomNav.tsx` contains no `dispatchEvent` and no `CustomEvent` at all**; item four is a `Link` to `/{locale}/profile` or `/{locale}/auth/login` (`:276`). The only listener is `Header.tsx:546-547`, so the event carrying the hamburger's moved job is dispatched by nobody, and the header hamburger is this route's only remaining menu trigger. The source comment is wrong and two specs inherited it.
4. **`03-top-category-rail.md`** presented the `CardName` weight-600 override as a call site beating a primitive's docstring. It is that, and it is also **a dated owner decision**, `SalonCard.tsx:515-516`: "OWNER PICK 2026-08-06, direction D: tracking off, name weight up to 600." A dated owner decision outranks a docstring, so the file now carries both and nobody should revert it to 500 on the docstring alone.

## Contradiction found while writing this, recorded rather than smoothed over

`_plans/DESIGN_CONSISTENCY_2026-08-27.md` section S1 states: "on `/de/coiffeur`, `/de/nails`, `/de/spa`, `/de/basel/coiffeur` and `/de/inspo` the largest text on the screen is 14px against a floor of 28, an anchor ratio of 1.02x to 1.17x." For `/de/basel/coiffeur` this measurement disagrees: the largest text in the first viewport is **18px** and the ratio is **1.5x**, which is also what the floor result handed to this spec says. The plan's numbers were taken on a live sweep at an earlier moment; this file's numbers come from `_measured/search-results.json`. Both failures still fail, so the conclusion is unchanged, but the plan's figure for this one route is not the figure this folder is built on. The other four routes in that sentence were not re-measured here.

**A second one, in `COMPONENT_REGISTRY.md` itself, found while answering FLOORS LAW 9 for this route (2026-08-27).** Three rows appear TWICE with different text: `CategoryBrowseRails` at lines 196 and 200, `MapSalonDetail` at 197 and 201, `CategoryHeroCarousel` at 198 and 202. The two `CategoryBrowseRails` rows disagree on a fact: line 196 records that the seeder `scripts/seed-coiffeur-rails.ts` is GONE, deleted 2026-07-11 in `89ee34e64` as a grep-proven orphan, while line 200 still says "see `scripts/seed-coiffeur-rails.ts`" as though it existed. Which row governs is undecided, and a reader who lands on the second one is pointed at a deleted file. None of the three duplicated components renders on this route at 390, so nothing in this folder depends on the answer; it is recorded because this folder is what found it, and fixing it is outside this folder's write scope.

## Locked decisions affecting this route

- **Owner 2026-08-01**, "remove cz we made it carousel right did u forget" , the mobile category feed becomes rails, and the filter chip row is hidden below 768px
- **Owner 2026-08-10**, variant C off `/dev/search-bar` , the 54px / radius 40 / 19px-padding search pill, hairline plus lift
- **Owner 2026-08-10**, the hamburger leaves the search pill and becomes the bottom nav's fourth item, which is a Profile
- **Owner 2026-08-11**, the bottom nav condenses by losing labels and height, never by narrowing to a capsule
- **V3-D376** , the sticky search band is a direct child of the page root so it stays pinned for the whole list
- **V3-D421d** , the pinned bar keeps its resting size; the city stays off line 1
- **V3-D262 (W4)** , this route was rewired from a handcrafted page to `SearchTemplate`
- **V3-D452** , the mobile borderless feed, which the 2026-08-01 rail change supersedes on category routes only
- **V3-D442 / V3-D348 / LOCKFILE A13** , the card's two anchors, name larger than price, one ink anchor per card
- **V3-D200** , star `#FFC32B`
- **V3-D420 `FROST_GLASS`** , the bottom nav's surface
- **A7-city-category-seo (2026-07-27)** , per-locale FAQ copy interpolated with the real city and category
- **Art. 13 PBV** , the from-price must be a genuine lower limit and must name the service it buys
