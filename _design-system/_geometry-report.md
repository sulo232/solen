# Geometry check report

Generated: 2026-08-27T18:27:54.522Z
Base URL: http://127.0.0.1:3457  Viewport: mobile (375x812)

Report-only pass (checklist item 1): this script never fails the run. Findings
below are raw candidates, not confirmed bugs, until triaged for false positives.
FLOORS is likewise report-only and always exits 0 - a future turn can flip it to
a gate once triaged (see the file header comment). Not a gate yet.

(--floors-only: geometry pass (a)-(d) skipped this run)

Totals (floors): 7 FAIL / 17 checks, 3 route(s), viewport 390x844

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

## /de/salon/old-town-barbers

### FLOORS (0 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 34.66% | floor >= 33% | PASS |
| F6 display anchor | 30px ("Old Town Barbers") | floor >= 28px | PASS |
| F7a weight share | 30% (9/30) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2.14x | floor >= 1.8x | PASS |
| F7c size spread | 5 distinct, densest cluster 4 within 8px (global spread 17px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 3 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#section-photos > div.relative:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…; `main.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-6:nth-of-type(1) > div.flex:nth-of-type(1) > button.flex:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 1px 3px 0px; `#section-services > ul.mt-5:nth-of-type(1)` rgba(10, 10, 10, 0.04) 0px 1px 3px 0px, rgba(10, 10, 10, 0.1) 0px 10px 28px -14p…

---

## /de/booking/lookup

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | n/a (exempt) | floor >= 33% | EXEMPT |
| F6 display anchor | 21px ("Buchung finden") | floor >= 28px | FAIL |
| F7a weight share | 27.27% (3/11) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.56x | floor >= 1.8x | FAIL |
| F7c size spread | 5 distinct, densest cluster 4 within 8px (global spread 9px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 0 distinct box-shadow | floor >= 2 | FAIL |

