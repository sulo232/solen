# Geometry check report

Generated: 2026-08-27T15:33:52.834Z
Base URL: http://localhost:3457  Viewport: mobile (375x812)

Report-only pass (checklist item 1): this script never fails the run. Findings
below are raw candidates, not confirmed bugs, until triaged for false positives.
FLOORS is likewise report-only and always exits 0 - a future turn can flip it to
a gate once triaged (see the file header comment). Not a gate yet.

(--floors-only: geometry pass (a)-(d) skipped this run)

Totals (floors): 41 FAIL / 90 checks, 15 route(s), viewport 390x844

---
## /de

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 41.3% | floor >= 33% | PASS |
| F6 display anchor | 18px ("Für dich empfohlen") | floor >= 28px | FAIL |
| F7a weight share | 33.33% (10/30) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 1.5x | floor >= 1.8x | FAIL |
| F7c size spread | 3 distinct, densest cluster 3 within 8px (global spread 6px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 7 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div.md:hidden:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 6px 20px 0px; `#main-content > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 3px 2.5px 0px, rgba(0, 0, 0, 0.15) 0px 1px 1px 0px, rgba(…; `#main-content > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(2)` rgb(255, 255, 255) 0px 1px 0.5px 0px, rgba(0, 0, 0, 0.15) 0px -0.5px 1px 0px, rg…; `div.relative:nth-of-type(3) > div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1) > span.relative:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…

---

## /de/coiffeur

### FLOORS (2 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 41.75% | floor >= 33% | PASS |
| F6 display anchor | 18px ("Top Coiffeur") | floor >= 28px | FAIL |
| F7a weight share | 28.13% (9/32) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.5x | floor >= 1.8x | FAIL |
| F7c size spread | 4 distinct, densest cluster 4 within 8px (global spread 6px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 7 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div.min-h-screen:nth-of-type(1) > div.max-md:sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(50, 47, 44, 0.12) 0px 6px 16px 0px; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 3px 2.5px 0px, rgba(0, 0, 0, 0.15) 0px 1px 1px 0px, rgba(…; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(2)` rgb(255, 255, 255) 0px 1px 0.5px 0px, rgba(0, 0, 0, 0.15) 0px -0.5px 1px 0px, rg…; `div.mx-auto:nth-of-type(5) > div:nth-of-type(1) > div.md:hidden:nth-of-type(1) > div:nth-of-type(1) > section.mb-6:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `div.md:hidden:nth-of-type(1) > div:nth-of-type(1) > section.mb-6:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1) > span.relative:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…

---

## /de/nails

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 41.75% | floor >= 33% | PASS |
| F6 display anchor | 18px ("Top Nails") | floor >= 28px | FAIL |
| F7a weight share | 30.3% (10/33) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 1.5x | floor >= 1.8x | FAIL |
| F7c size spread | 4 distinct, densest cluster 4 within 8px (global spread 6px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 7 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div.min-h-screen:nth-of-type(1) > div.max-md:sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(50, 47, 44, 0.12) 0px 6px 16px 0px; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 3px 2.5px 0px, rgba(0, 0, 0, 0.15) 0px 1px 1px 0px, rgba(…; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(2)` rgb(255, 255, 255) 0px 1px 0.5px 0px, rgba(0, 0, 0, 0.15) 0px -0.5px 1px 0px, rg…; `div.mx-auto:nth-of-type(5) > div:nth-of-type(1) > div.md:hidden:nth-of-type(1) > div:nth-of-type(1) > section.mb-6:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `div.md:hidden:nth-of-type(1) > div:nth-of-type(1) > section.mb-6:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1) > span.relative:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…

---

## /de/spa

### FLOORS (2 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 41.75% | floor >= 33% | PASS |
| F6 display anchor | 18px ("Top Spa") | floor >= 28px | FAIL |
| F7a weight share | 28.13% (9/32) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.5x | floor >= 1.8x | FAIL |
| F7c size spread | 4 distinct, densest cluster 4 within 8px (global spread 6px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 7 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div.min-h-screen:nth-of-type(1) > div.max-md:sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(50, 47, 44, 0.12) 0px 6px 16px 0px; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 3px 2.5px 0px, rgba(0, 0, 0, 0.15) 0px 1px 1px 0px, rgba(…; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(2)` rgb(255, 255, 255) 0px 1px 0.5px 0px, rgba(0, 0, 0, 0.15) 0px -0.5px 1px 0px, rg…; `div.mx-auto:nth-of-type(5) > div:nth-of-type(1) > div.md:hidden:nth-of-type(1) > div:nth-of-type(1) > section.mb-6:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `div.md:hidden:nth-of-type(1) > div:nth-of-type(1) > section.mb-6:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1) > span.relative:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…

---

## /de/barbershop

### FLOORS (5 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 21.59% | floor >= 33% | FAIL |
| F6 display anchor | 20px ("Jetzt frei") | floor >= 28px | FAIL |
| F7a weight share | 45.24% (19/42) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 1.67x | floor >= 1.8x | FAIL |
| F7c size spread | 5 distinct, densest cluster 5 within 8px (global spread 8px, context only) , TRAP: 5 distinct sizes inside one 8px window | trap: densest cluster >4 distinct within 8px | FAIL |
| ELEVATION | 7 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div.min-h-screen:nth-of-type(1) > div.max-md:sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(50, 47, 44, 0.12) 0px 6px 16px 0px; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 3px 2.5px 0px, rgba(0, 0, 0, 0.15) 0px 1px 1px 0px, rgba(…; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(2)` rgb(255, 255, 255) 0px 1px 0.5px 0px, rgba(0, 0, 0, 0.15) 0px -0.5px 1px 0px, rg…; `div.mx-auto:nth-of-type(5) > div:nth-of-type(1) > div.md:hidden:nth-of-type(1) > div:nth-of-type(1) > section.mb-6:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `div.md:hidden:nth-of-type(1) > div:nth-of-type(1) > section.mb-6:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1) > span.relative:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…

---

## /de/basel

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 43.18% | floor >= 33% | PASS |
| F6 display anchor | 25px ("Salons in Basel") | floor >= 28px | FAIL |
| F7a weight share | 43.75% (7/16) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 1.79x | floor >= 1.8x | FAIL |
| F7c size spread | 4 distinct, densest cluster 3 within 8px (global spread 13px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 4 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `#main-content > main.min-h-screen:nth-of-type(1) > section.max-w-5xl:nth-of-type(3) > div.grid:nth-of-type(1) > div:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.04) 0px 1px 3px 0px, rgba(50, 47, 44, 0.03) 0px 1px 2px 0px; `main.min-h-screen:nth-of-type(1) > section.max-w-5xl:nth-of-type(3) > div.grid:nth-of-type(1) > div:nth-of-type(1) > div.relative:nth-of-type(1) > a.block:nth-of-type(1) > div.relative:nth-of-type(1) > button.absolute:nth-of-type(2)` rgba(0, 0, 0, 0.05) 0px 1px 2px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

---

## /de/basel/coiffeur

### FLOORS (2 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 41.03% | floor >= 33% | PASS |
| F6 display anchor | 18px ("Top Coiffeur") | floor >= 28px | FAIL |
| F7a weight share | 28.57% (8/28) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.5x | floor >= 1.8x | FAIL |
| F7c size spread | 4 distinct, densest cluster 4 within 8px (global spread 6px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 5 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > a.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `#main-content > div.min-h-screen:nth-of-type(1) > div.max-md:sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(50, 47, 44, 0.12) 0px 6px 16px 0px; `div.md:hidden:nth-of-type(1) > div:nth-of-type(1) > section.mb-6:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1) > span.relative:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…; `#main-content > div.min-h-screen:nth-of-type(1) > button.fixed:nth-of-type(1)` rgba(50, 47, 44, 0.18) 0px 6px 20px 0px, rgba(50, 47, 44, 0.1) 0px 2px 6px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

---

## /de/inspo

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0.71% | floor >= 33% | FAIL |
| F6 display anchor | 14px ("Styles suchen...") | floor >= 28px | FAIL |
| F7a weight share | 14.29% (2/14) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.17x | floor >= 1.8x | FAIL |
| F7c size spread | 2 distinct, densest cluster 2 within 8px (global spread 2px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 6 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > main.min-h-screen:nth-of-type(1) > div.max-w-7xl:nth-of-type(1) > div.relative:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 6px 20px 0px; `#main-content > main.min-h-screen:nth-of-type(1) > div.max-w-7xl:nth-of-type(1) > div.-mx-4:nth-of-type(2) > div.md:hidden:nth-of-type(1) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 3px 2.5px 0px, rgba(0, 0, 0, 0.15) 0px 1px 1px 0px, rgba(…; `#main-content > main.min-h-screen:nth-of-type(1) > div.max-w-7xl:nth-of-type(1) > div.-mx-4:nth-of-type(2) > div.md:hidden:nth-of-type(1) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(2)` rgb(255, 255, 255) 0px 1px 0.5px 0px, rgba(0, 0, 0, 0.15) 0px -0.5px 1px 0px, rg…; `#main-content > main.min-h-screen:nth-of-type(1) > div.max-w-7xl:nth-of-type(1) > div.relative:nth-of-type(3) > div.flex:nth-of-type(1) > button.relative:nth-of-type(1)` rgba(0, 0, 0, 0.07) 0px 2px 8px 0px; `#main-content > main.min-h-screen:nth-of-type(1) > button.fixed:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px

---

## /de/salon/cuts-and-culture

### FLOORS (0 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 34.66% | floor >= 33% | PASS |
| F6 display anchor | 30px ("Cuts & Culture") | floor >= 28px | PASS |
| F7a weight share | 30% (9/30) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2.14x | floor >= 1.8x | PASS |
| F7c size spread | 5 distinct, densest cluster 4 within 8px (global spread 17px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 3 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#section-photos > div.relative:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…; `main.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-6:nth-of-type(1) > div.flex:nth-of-type(1) > button.flex:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 1px 3px 0px; `#section-services > ul.mt-5:nth-of-type(1)` rgba(10, 10, 10, 0.04) 0px 1px 3px 0px, rgba(10, 10, 10, 0.1) 0px 10px 28px -14p…

---

## /de/salon/cuts-and-culture/reviews

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 30px ("Bewertungen") | floor >= 28px | PASS |
| F7a weight share | 41.67% (10/24) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 2.31x | floor >= 1.8x | PASS |
| F7c size spread | 7 distinct, densest cluster 6 within 8px (global spread 18px, context only) , TRAP: 6 distinct sizes inside one 8px window | trap: densest cluster >4 distinct within 8px | FAIL |
| ELEVATION | 2 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

---

## /de/profile

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 28px ("Test Kunde") | floor >= 28px | PASS |
| F7a weight share | 33.33% (8/24) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 2.15x | floor >= 1.8x | PASS |
| F7c size spread | 7 distinct, densest cluster 5 within 8px (global spread 16px, context only) , TRAP: 5 distinct sizes inside one 8px window | trap: densest cluster >4 distinct within 8px | FAIL |
| ELEVATION | 2 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

---

## /de/profile/settings

### FLOORS (5 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 24px ("T") | floor >= 28px | FAIL |
| F7a weight share | 34.78% (8/23) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 1.6x | floor >= 1.8x | FAIL |
| F7c size spread | 9 distinct, densest cluster 8 within 8px (global spread 12px, context only) , TRAP: 8 distinct sizes inside one 8px window | trap: densest cluster >4 distinct within 8px | FAIL |
| ELEVATION | 2 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

---

## /de/notifications

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 20px ("Benachrichtigungen") | floor >= 28px | FAIL |
| F7a weight share | 14.29% (1/7) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.67x | floor >= 1.8x | FAIL |
| F7c size spread | 4 distinct, densest cluster 4 within 8px (global spread 8px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 2 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

---

## /de/help

### FLOORS (1 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 30px ("Hilfe & Support") | floor >= 28px | PASS |
| F7a weight share | 18.75% (3/16) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2.31x | floor >= 1.8x | PASS |
| F7c size spread | 4 distinct, densest cluster 3 within 8px (global spread 18px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 2 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

---

## /de/warum-solen

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 27.3px ("Was Solen anders macht") | floor >= 28px | FAIL |
| F7a weight share | 25% (4/16) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2.1x | floor >= 1.8x | PASS |
| F7c size spread | 7 distinct, densest cluster 6 within 8px (global spread 15.3px, context only) , TRAP: 6 distinct sizes inside one 8px window | trap: densest cluster >4 distinct within 8px | FAIL |
| ELEVATION | 2 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

