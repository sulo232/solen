# Geometry check report

Generated: 2026-07-25T11:27:23.167Z
Base URL: http://localhost:3000  Viewport: mobile (375x812)

Report-only pass (checklist item 1): this script never fails the run. Findings
below are raw candidates, not confirmed bugs, until triaged for false positives.
FLOORS is likewise report-only and always exits 0 - a future turn can flip it to
a gate once triaged (see the file header comment). Not a gate yet.

(--floors-only: geometry pass (a)-(d) skipped this run)

Totals (floors): 10 FAIL / 17 checks, 3 route(s), viewport 390x844

---
## /de

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 4.66% | floor >= 33% | FAIL |
| F6 display anchor | 31.2px ("Termine, sofort bestätigt.") | floor >= 28px | PASS |
| F7a weight share | 50% (11/22) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 2.31x | floor >= 1.8x | PASS |
| F7c size spread | 9 distinct, densest cluster 7 within 8px (global spread 19.2px, context only) , TRAP: 7 distinct sizes inside one 8px window | trap: densest cluster >4 distinct within 8px | FAIL |
| ELEVATION | 4 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `#main-content > div.relative:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(26, 18, 9, 0.04) 0px -12px 32px 0px; `#main-content > div.relative:nth-of-type(1) > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.grid:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.05) 0px 1px 2px 0px, rgba(50, 47, 44, 0.1) 0px 4px 12px -6px; `div.relative:nth-of-type(1) > section.relative:nth-of-type(3) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > a.relative:nth-of-type(1) > div.h-full:nth-of-type(1) > div.mapboxgl-canvas-container:nth-of-type(2) > div.inline-flex:nth-of-type(14)` rgba(0, 0, 0, 0.3) 0px 1px 5px 0px

---

## /de/salon/old-town-barbers

### FLOORS (4 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 34.66% | floor >= 33% | PASS |
| F6 display anchor | 22px ("Old Town Barbers") | floor >= 28px | FAIL |
| F7a weight share | 83.33% (25/30) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 1.57x | floor >= 1.8x | FAIL |
| F7c size spread | 6 distinct, densest cluster 5 within 8px (global spread 9px, context only) , TRAP: 5 distinct sizes inside one 8px window | trap: densest cluster >4 distinct within 8px | FAIL |
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

