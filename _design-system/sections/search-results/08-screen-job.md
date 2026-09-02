# The screen's job, and every element against it , FLOORS LAW 10 pass

**Reference:** `_design-system/sections/_measured/search-results.json` (all 11 bands) plus the seven section files in this folder. No new measurement was taken for this file; every number below is already recorded in one of them or is cited to a source line.
**Component:** none. This file grades the COMPOSITION of the screen, not a component. It is the one file here with no band and no component of its own, alongside `02-search-band.md`, which has no band but does have a component.
**Layer:** not applicable.

## The job, in one sentence

**Someone who has already named a city and a category comes here to pick which salon to open.**

Everything before this screen has narrowed twice. `/de/basel/coiffeur` carries the city in one segment and the category in the other, so the visitor is not browsing the marketplace and is not searching it. The only decision left is WHICH salon. FLOORS LAW 10 (2026-07-29) asks that the job be named in one sentence and then every element justified against it, so the rest of this file is that.

## Every element, against the job

| element | file | serves this job | verdict |
|---|---|---|---|
| Search pill | `02` | yes | The only control on the screen that can change which salons are shown. Directly the job. |
| Top `<Category>` rail | `03` | yes | The candidates, rating-ordered. This is the screen. |
| "In der Nahe" rail | `04` | in principle | A second ordering of the candidates. See below: on this measurement it holds no candidate the first rail does not. |
| Header Home tile | `01` | no, global | Site-wide escape. Justified as chrome every screen carries, not by this job. |
| Header hamburger | `01` | no, global | Opens `MobileMenu`. Justified as chrome, and now load-bearing: after the correction in `02`, it is the ONLY mobile-menu trigger left on this route. |
| Bottom nav, 4 items | `05` | no, global | Every one of the four navigates away from the job. Justified as site-wide chrome. |
| FAQ | `06` | **no, a different screen's job** | Search-engine acquisition. Named below. |
| Footer, incl. newsletter | `07` | **no, a different screen's job** | Site navigation, legal, and marketing capture. Named below. |
| The 32px circular heading arrow | `03`, `04` | **no job at all** | `aria-hidden="true"`, no handler (`CategoryMobileRails.tsx:99-102`). It has the shape of the see-all this job needs and does nothing. |
| Hero title and breadcrumb | `02` | yes, and not rendered | The only elements that would tell the visitor where they are. Computed, passed, drawn nowhere. |

## The element that serves the job in principle and not in fact

**The two rails render the same eight salons.** Bands 2 and 4 each measure 8 cards and 340,477 px of imagery, identical to the pixel, and `RAIL_CAP` is 10 (`CategoryMobileRails.tsx:64`), so a count of 8 against a cap of 10 means the pool holds 8 rows and each rail draws all of them. A second ordering of the same members helps the job only if a reader can tell the two orderings apart, and the only visible difference between the bands is which card is first (`4.8` against `4.2`).

Against the job as stated, this element is currently close to zero: it doubles the vertical cost of reading the candidate list and adds no candidate. That is not a defect of the component, which is doing exactly what it was built to do; it is what an 8-row pool does to a two-rail design. It is recorded here because FLOORS LAW 10 grades the element as it renders, not as it was intended.

## Elements that serve a different screen's job

Two, and naming them is what the floor asks. Neither is proposed for removal.

- **The FAQ** (`06`) serves search-engine acquisition. Its three questions are about what a visit costs, how to choose a salon and whether you can book online, all in the abstract, and not one of them is answerable from the eight salons rendered above it. This route exists partly to rank, so the element is justified by that job. It is also below the fold at y 868, which is where a second job's element belongs.
- **The newsletter form** inside the footer (`07`) serves marketing capture. Same treatment.

**And one element serves no job:** the inert 32px arrow beside each rail heading. It is not decoration in taste rule 2's sense, which would be harmless; it is worse, because it is shaped like the exact affordance this job is missing.

## What the job needs and this screen does not render

Each of these is something a visitor doing the stated job would reach for. All five are measured or read from a cited source line, none is a guess.

1. **A title.** Not rendered. `page.tsx:211` passes `hero={{ title: "Coiffeur in Basel", ... }}` and a three-item `breadcrumb`; `SearchTemplate.tsx:429-430` destructures both and renders neither (full trace in `02-search-band.md`). The largest text the visitor actually sees is "Top Coiffeur", a rail label, and they never see the city they typed.
2. **A result count.** Absent from every band. The screen shows eight cards twice and never says how many Coiffeur salons Basel holds.
3. **A filter or a sort control.** `SearchTemplate.tsx:1439` wraps the filter chip row and the `SlidersHorizontal` button in `mx-auto hidden w-full max-w-[680px] px-4 md:block`, hidden below 768. The comment at `:1436` states that the filter state, the URL params, the `FilterSheet` and `activeFilterCount` all stay intact and only the row stops rendering. So the filter machinery is fully built and, on mobile on a category route, has no trigger.
4. **A see-all.** `RAIL_CAP` is 10 and the heading arrow is inert, so there is no path on this screen to an eleventh salon.
5. **A category switcher.** `CategoryPillRow` is `md:hidden`, so it is mobile-only, and it self-gates on `showCategoryChrome` (`CategoryPillRow.tsx:130`, null at `:171`), which is false on a two-segment path. It renders on `/de/coiffeur` and not here.

Items 3, 4 and 5 share a shape worth naming: the affordance exists in this codebase, works on a neighbouring route or at a neighbouring breakpoint, and is absent on this one. Item 1 is the one that costs a floor.

## Against the floors

This pass has no threshold of its own. What it changes is how two existing failures should be read.

- **F6 anchor 18 against 28, and F7b ratio 1.5x against 1.8**, are booked in `03-top-category-rail.md` against the `RailHeading`, correctly, because that heading is the largest text that renders. The job pass says the anchor is MISSING rather than too small: a rail label is not a screen title, so raising 18 to 28 would make a rail heading shout, and the element the job actually needs is the one at item 1 above, which the code declines to draw. That distinction matters before anyone "fixes" F6 by enlarging the wrong element.
- **F2 imagery 41.03% passes**, and it passes because of the candidate rails, which are the elements this job is about. It is the one floor this screen passes for the right reason rather than incidentally.
- **F7a bold share 28.57% passes**, and `05-bottom-nav.md` records that it passes partly because four bottom-nav labels carry no emphasis on this route since no tab is active. So a global element that serves a different job is holding a content floor inside its threshold. That is a pass on borrowed credit.

Against the owner's target ladder (`/de/salon/cuts-and-culture`, measured 2026-08-27: anchor 30px over a 14px body, ratio 2.14x, 5 distinct sizes, weight-600 share 30%, 3 elevations, 34.66% photographic): the salon page carries its anchor in a title block that names the thing the visitor came for. This screen has no title block at all, so the gap to the ladder is not 12px of type, it is one missing element. Every other axis follows from it: body 12 against 14, ratio 1.5x against 2.14x, and emphasis at 600 against 500.

## Provenance

- **FLOORS LAW 10** (2026-07-29), "EVERY ELEMENT MUST BELONG TO THE SCREEN'S JOB", and its founding case, the owner asking why his own profile had a search bar
- **FLOORS LAW 8** (2026-07-29), which this file leans on twice, for `CategoryPillRow` and for the pill; both are worked in `02-search-band.md`
- **Owner 2026-08-01**, "remove cz we made it carousel right did u forget" , the two rails replace the flat mobile feed, which is also what removed the mobile filter row
- **Owner 2026-08-10**, the hamburger leaves the search pill, which is what left the header hamburger as this route's only menu trigger
- **A7-city-category-seo (2026-07-27)** , the FAQ's per-locale copy, and the acquisition job it serves
