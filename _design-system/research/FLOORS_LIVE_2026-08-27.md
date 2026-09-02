[check-geometry] self-test passed (10 assertions, nested-radius FIX 1/2/3 logic)
[check-geometry] self-test passed (21 assertions, FLOORS logic)
[check-geometry] base=http://localhost:3000 viewport=mobile (375x812) floorsOnly=true
[check-geometry] routes: /de, /de/coiffeur, /de/barbershop, /de/nails, /de/spa, /de/inspo, /de/basel, /de/basel/coiffeur, /de/salon/cuts-and-culture, /de/salon/cuts-and-culture/reviews, /de/profile, /de/profile/settings, /de/notifications, /de/help, /de/warum-solen
[check-geometry] FLOORS viewport: 390x844 (default - LOCKFILE EMPHASIS BUDGET 390x844)
[check-geometry] /de FLOORS: imagery=28.56%(FAIL) displayAnchor=18px(FAIL) weightShare=37.14%(FAIL) anchorRatio=1.5x(FAIL) sizeSpread=3distinct,densestCluster=3within8px,globalSpread=6px(PASS) elevation=7(PASS)
[check-geometry] /de/coiffeur FLOORS: imagery=0.71%(FAIL) displayAnchor=14px(FAIL) weightShare=10%(PASS) anchorRatio=1.02x(FAIL) sizeSpread=3distinct,densestCluster=3within8px,globalSpread=2px(PASS) elevation=5(PASS)
[check-geometry] /de/barbershop FLOORS: imagery=21.59%(FAIL) displayAnchor=20px(FAIL) weightShare=45.24%(FAIL) anchorRatio=1.67x(FAIL) sizeSpread=5distinct,densestCluster=5within8px,globalSpread=8px(FAIL) elevation=7(PASS)
[check-geometry] /de/nails FLOORS: imagery=0.71%(FAIL) displayAnchor=14px(FAIL) weightShare=10%(PASS) anchorRatio=1.02x(FAIL) sizeSpread=3distinct,densestCluster=3within8px,globalSpread=2px(PASS) elevation=5(PASS)
[check-geometry] /de/spa FLOORS: imagery=0.71%(FAIL) displayAnchor=14px(FAIL) weightShare=10%(PASS) anchorRatio=1.02x(FAIL) sizeSpread=3distinct,densestCluster=3within8px,globalSpread=2px(PASS) elevation=5(PASS)
[check-geometry] /de/inspo FLOORS: imagery=0.71%(FAIL) displayAnchor=14px(FAIL) weightShare=14.29%(PASS) anchorRatio=1.17x(FAIL) sizeSpread=2distinct,densestCluster=2within8px,globalSpread=2px(PASS) elevation=6(PASS)
[check-geometry] /de/basel FLOORS: imagery=0%(FAIL) displayAnchor=25px(FAIL) weightShare=54.55%(FAIL) anchorRatio=1.79x(FAIL) sizeSpread=3distinct,densestCluster=2within8px,globalSpread=13px(PASS) elevation=2(PASS)
[check-geometry] /de/basel/coiffeur FLOORS: imagery=0%(FAIL) displayAnchor=14px(FAIL) weightShare=0%(PASS) anchorRatio=1.17x(FAIL) sizeSpread=3distinct,densestCluster=3within8px,globalSpread=2px(PASS) elevation=4(PASS)
[check-geometry] /de/salon/cuts-and-culture FLOORS: imagery=34.66%(PASS) displayAnchor=30px(PASS) weightShare=30%(PASS) anchorRatio=2.14x(PASS) sizeSpread=5distinct,densestCluster=4within8px,globalSpread=17px(PASS) elevation=3(PASS)
[check-geometry] /de/salon/cuts-and-culture/reviews FLOORS: imagery=0%(FAIL) displayAnchor=30px(PASS) weightShare=43.48%(FAIL) anchorRatio=2.31x(PASS) sizeSpread=7distinct,densestCluster=6within8px,globalSpread=18px(FAIL) elevation=2(PASS)
[check-geometry] /de/profile FLOORS: imagery=0%(FAIL) displayAnchor=18px(FAIL) weightShare=40%(FAIL) anchorRatio=1.5x(FAIL) sizeSpread=2distinct,densestCluster=2within8px,globalSpread=6px(PASS) elevation=2(PASS)
[check-geometry] /de/profile/settings FLOORS: imagery=0%(FAIL) displayAnchor=18px(FAIL) weightShare=40%(FAIL) anchorRatio=1.5x(FAIL) sizeSpread=2distinct,densestCluster=2within8px,globalSpread=6px(PASS) elevation=2(PASS)
[check-geometry] /de/notifications FLOORS: imagery=0%(FAIL) displayAnchor=28px(PASS) weightShare=28.57%(PASS) anchorRatio=1.87x(PASS) sizeSpread=3distinct,densestCluster=2within8px,globalSpread=15px(PASS) elevation=1(FAIL)
[check-geometry] /de/help FLOORS: imagery=0%(FAIL) displayAnchor=30px(PASS) weightShare=10%(PASS) anchorRatio=2.5x(PASS) sizeSpread=3distinct,densestCluster=2within8px,globalSpread=18px(PASS) elevation=2(PASS)
[check-geometry] /de/warum-solen FLOORS: imagery=0%(FAIL) displayAnchor=27.3px(FAIL) weightShare=25%(PASS) anchorRatio=2.1x(PASS) sizeSpread=7distinct,densestCluster=6within8px,globalSpread=15.3px(FAIL) elevation=2(PASS)

# Geometry check report

Generated: 2026-08-27T11:41:53.961Z
Base URL: http://localhost:3000  Viewport: mobile (375x812)

Report-only pass (checklist item 1): this script never fails the run. Findings
below are raw candidates, not confirmed bugs, until triaged for false positives.
FLOORS is likewise report-only and always exits 0 - a future turn can flip it to
a gate once triaged (see the file header comment). Not a gate yet.

(--floors-only: geometry pass (a)-(d) skipped this run)

Totals (floors): 45 FAIL / 90 checks, 15 route(s), viewport 390x844

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

## /de/coiffeur

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0.71% | floor >= 33% | FAIL |
| F6 display anchor | 14px ("Coiffeur Schweizweit") | floor >= 28px | FAIL |
| F7a weight share | 10% (1/10) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.02x | floor >= 1.8x | FAIL |
| F7c size spread | 3 distinct, densest cluster 3 within 8px (global spread 2px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 5 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div.min-h-screen:nth-of-type(1) > div.max-md:sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(50, 47, 44, 0.12) 0px 6px 16px 0px; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 3px 2.5px 0px, rgba(0, 0, 0, 0.15) 0px 1px 1px 0px, rgba(…; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(2)` rgb(255, 255, 255) 0px 1px 0.5px 0px, rgba(0, 0, 0, 0.15) 0px -0.5px 1px 0px, rg…; `#main-content > div.min-h-screen:nth-of-type(1) > button.fixed:nth-of-type(1)` rgba(50, 47, 44, 0.18) 0px 6px 20px 0px, rgba(50, 47, 44, 0.1) 0px 2px 6px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

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

## /de/nails

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0.71% | floor >= 33% | FAIL |
| F6 display anchor | 14px ("Nails Schweizweit") | floor >= 28px | FAIL |
| F7a weight share | 10% (1/10) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.02x | floor >= 1.8x | FAIL |
| F7c size spread | 3 distinct, densest cluster 3 within 8px (global spread 2px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 5 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div.min-h-screen:nth-of-type(1) > div.max-md:sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(50, 47, 44, 0.12) 0px 6px 16px 0px; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 3px 2.5px 0px, rgba(0, 0, 0, 0.15) 0px 1px 1px 0px, rgba(…; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(2)` rgb(255, 255, 255) 0px 1px 0.5px 0px, rgba(0, 0, 0, 0.15) 0px -0.5px 1px 0px, rg…; `#main-content > div.min-h-screen:nth-of-type(1) > button.fixed:nth-of-type(1)` rgba(50, 47, 44, 0.18) 0px 6px 20px 0px, rgba(50, 47, 44, 0.1) 0px 2px 6px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

---

## /de/spa

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0.71% | floor >= 33% | FAIL |
| F6 display anchor | 14px ("Spa Schweizweit") | floor >= 28px | FAIL |
| F7a weight share | 10% (1/10) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.02x | floor >= 1.8x | FAIL |
| F7c size spread | 3 distinct, densest cluster 3 within 8px (global spread 2px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 5 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div.min-h-screen:nth-of-type(1) > div.max-md:sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(50, 47, 44, 0.12) 0px 6px 16px 0px; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 3px 2.5px 0px, rgba(0, 0, 0, 0.15) 0px 1px 1px 0px, rgba(…; `#main-content > div.min-h-screen:nth-of-type(1) > div.md:hidden:nth-of-type(2) > div.flex:nth-of-type(1) > a.relative:nth-of-type(1) > span.pointer-events-none:nth-of-type(2)` rgb(255, 255, 255) 0px 1px 0.5px 0px, rgba(0, 0, 0, 0.15) 0px -0.5px 1px 0px, rg…; `#main-content > div.min-h-screen:nth-of-type(1) > button.fixed:nth-of-type(1)` rgba(50, 47, 44, 0.18) 0px 6px 20px 0px, rgba(50, 47, 44, 0.1) 0px 2px 6px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

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

## /de/basel

### FLOORS (4 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 25px ("Salons in Basel") | floor >= 28px | FAIL |
| F7a weight share | 54.55% (6/11) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 1.79x | floor >= 1.8x | FAIL |
| F7c size spread | 3 distinct, densest cluster 2 within 8px (global spread 13px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 2 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

---

## /de/basel/coiffeur

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 14px ("Coiffeur Basel") | floor >= 28px | FAIL |
| F7a weight share | 0% (0/6) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.17x | floor >= 1.8x | FAIL |
| F7c size spread | 3 distinct, densest cluster 3 within 8px (global spread 2px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 4 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > a.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `#main-content > div.min-h-screen:nth-of-type(1) > div.max-md:sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1)` rgba(50, 47, 44, 0.12) 0px 6px 16px 0px; `#main-content > div.min-h-screen:nth-of-type(1) > button.fixed:nth-of-type(1)` rgba(50, 47, 44, 0.18) 0px 6px 20px 0px, rgba(50, 47, 44, 0.1) 0px 2px 6px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

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
| F7a weight share | 43.48% (10/23) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 2.31x | floor >= 1.8x | PASS |
| F7c size spread | 7 distinct, densest cluster 6 within 8px (global spread 18px, context only) , TRAP: 6 distinct sizes inside one 8px window | trap: densest cluster >4 distinct within 8px | FAIL |
| ELEVATION | 2 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

---

## /de/profile

### FLOORS (4 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 18px ("Profil") | floor >= 28px | FAIL |
| F7a weight share | 40% (2/5) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 1.5x | floor >= 1.8x | FAIL |
| F7c size spread | 2 distinct, densest cluster 2 within 8px (global spread 6px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 2 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

---

## /de/profile/settings

### FLOORS (4 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 18px ("Einstellungen") | floor >= 28px | FAIL |
| F7a weight share | 40% (2/5) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 1.5x | floor >= 1.8x | FAIL |
| F7c size spread | 2 distinct, densest cluster 2 within 8px (global spread 6px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 2 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `body.text-s-ink:nth-of-type(1) > nav.md:hidden:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 6px 24px 0px, rgba(255, 255, 255, 0.5) 0px 1px 0px 0px i…

---

## /de/notifications

### FLOORS (2 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 28px ("Willkommen zurück") | floor >= 28px | PASS |
| F7a weight share | 28.57% (2/7) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.87x | floor >= 1.8x | PASS |
| F7c size spread | 3 distinct, densest cluster 2 within 8px (global spread 15px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 1 distinct box-shadow | floor >= 2 | FAIL |

elevation examples: `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.pointer-events-auto:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px

---

## /de/help

### FLOORS (1 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 30px ("Hilfe & Support") | floor >= 28px | PASS |
| F7a weight share | 10% (1/10) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2.5x | floor >= 1.8x | PASS |
| F7c size spread | 3 distinct, densest cluster 2 within 8px (global spread 18px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
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


[check-geometry] report written to /Users/sulo/Documents/solen/.claude/worktrees/stress-test-gates-hooks-6dc8e8/_design-system/_geometry-report.md
WIDE EXIT: 0
