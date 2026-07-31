# Geometry check report

Generated: 2026-07-31T11:07:11.992Z
Base URL: http://localhost:3000  Viewport: mobile (375x812)

Report-only pass (checklist item 1): this script never fails the run. Findings
below are raw candidates, not confirmed bugs, until triaged for false positives.
FLOORS is likewise report-only and always exits 0 - a future turn can flip it to
a gate once triaged (see the file header comment). Not a gate yet.

(--floors-only: geometry pass (a)-(d) skipped this run)

Totals (floors): 11 FAIL / 17 checks, 3 route(s), viewport 390x844

---
## /de

### FLOORS (4 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 0px ("") | floor >= 28px | FAIL |
| F7a weight share | 0% (0/0) | ceiling <= 30% | PASS |
| F7b anchor ratio | 0x | floor >= 1.8x | FAIL |
| F7c size spread | 0 distinct, densest cluster 0 within 8px (global spread 0px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 0 distinct box-shadow | floor >= 2 | FAIL |

---

## /de/salon/old-town-barbers

### FLOORS (4 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 18.72px ("Bleib auf dem Laufenden") | floor >= 28px | FAIL |
| F7a weight share | 17.86% (5/28) | ceiling <= 30% | PASS |
| F7b anchor ratio | 1.17x | floor >= 1.8x | FAIL |
| F7c size spread | 3 distinct, densest cluster 3 within 8px (global spread 5.39px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 0 distinct box-shadow | floor >= 2 | FAIL |

---

## /de/booking/lookup

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | n/a (exempt) | floor >= 33% | EXEMPT |
| F6 display anchor | 0px ("") | floor >= 28px | FAIL |
| F7a weight share | 0% (0/0) | ceiling <= 30% | PASS |
| F7b anchor ratio | 0x | floor >= 1.8x | FAIL |
| F7c size spread | 0 distinct, densest cluster 0 within 8px (global spread 0px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 0 distinct box-shadow | floor >= 2 | FAIL |

