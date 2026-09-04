# Geometry check report

Generated: 2026-09-04T13:52:17.846Z
Base URL: http://localhost:3461  Viewport: mobile (375x812)

Report-only pass (checklist item 1): this script never fails the run. Findings
below are raw candidates, not confirmed bugs, until triaged for false positives.
FLOORS is likewise report-only and always exits 0 - a future turn can flip it to
a gate once triaged (see the file header comment). Not a gate yet.

(--floors-only: geometry pass (a)-(d) skipped this run)

Totals (floors): 7 FAIL / 18 checks, 3 route(s), viewport 390x844

---
## /de

### FLOORS (4 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 28.56% | floor >= 33% | FAIL |
| F6 display anchor | 18px ("Top auf Solen") | floor >= 28px | FAIL |
| F7a weight share | 37.14% (13/35) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 1.5x | floor >= 1.8x | FAIL |
| F7c size spread | 3 distinct, densest cluster 3 within 8px (global spread 6px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 7 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div.md:hidden:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 6px 20px 0px; `#main-content > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 3px 2.5px 0px, rgba(0, 0, 0, 0.15) 0px 1px 1px 0px, rgba(…; `#main-content > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(2)` rgb(255, 255, 255) 0px 1px 0.5px 0px, rgba(0, 0, 0, 0.15) 0px -0.5px 1px 0px, rg…; `div.relative:nth-of-type(3) > div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1) > span.relative:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…

---

## /de/salon/muse-beauty-studio

### FLOORS (0 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 34.66% | floor >= 33% | PASS |
| F6 display anchor | 30px ("Muse Beauty Studio") | floor >= 28px | PASS |
| F7a weight share | 25% (8/32) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2.14x | floor >= 1.8x | PASS |
| F7c size spread | 5 distinct, densest cluster 4 within 8px (global spread 17px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 3 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#section-photos > div.relative:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…; `#section-services > ul.mt-5:nth-of-type(1)` rgba(10, 10, 10, 0.04) 0px 1px 3px 0px, rgba(10, 10, 10, 0.1) 0px 10px 28px -14p…; `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px

---

## /de/search

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 63.54% | floor >= 33% | PASS |
| F6 display anchor | 16px ("Muse Beauty Studio") | floor >= 28px | FAIL |
| F7a weight share | 29.41% (5/17) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.19x | floor >= 1.8x | FAIL |
| F7c size spread | 5 distinct, densest cluster 5 within 8px (global spread 4px, context only) , TRAP: 5 distinct sizes inside one 8px window | trap: densest cluster >4 distinct within 8px | FAIL |
| ELEVATION | 6 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > main.min-h-screen:nth-of-type(1) > div.min-h-screen:nth-of-type(1) > div.max-md:sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(50, 47, 44, 0.12) 0px 6px 16px 0px; `#main-content > main.min-h-screen:nth-of-type(1) > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 3px 2.5px 0px, rgba(0, 0, 0, 0.15) 0px 1px 1px 0px, rgba(…; `#main-content > main.min-h-screen:nth-of-type(1) > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(2)` rgb(255, 255, 255) 0px 1px 0.5px 0px, rgba(0, 0, 0, 0.15) 0px -0.5px 1px 0px, rg…; `div.md:hidden:nth-of-type(1) > div.flex:nth-of-type(1) > article.relative:nth-of-type(1) > a.block:nth-of-type(1) > div.relative:nth-of-type(1) > div.absolute:nth-of-type(1) > button.group:nth-of-type(1) > span.relative:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…; `#main-content > main.min-h-screen:nth-of-type(1) > div.min-h-screen:nth-of-type(1) > button.fixed:nth-of-type(1)` rgba(50, 47, 44, 0.18) 0px 6px 20px 0px, rgba(50, 47, 44, 0.1) 0px 2px 6px 0px

