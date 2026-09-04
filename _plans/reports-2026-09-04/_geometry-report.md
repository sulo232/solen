# Geometry check report

Generated: 2026-09-04T15:17:32.530Z
Base URL: http://localhost:3461  Viewport: mobile (375x812)

Report-only pass (checklist item 1): this script never fails the run. Findings
below are raw candidates, not confirmed bugs, until triaged for false positives.
FLOORS is likewise report-only and always exits 0 - a future turn can flip it to
a gate once triaged (see the file header comment). Not a gate yet.

(--floors-only: geometry pass (a)-(d) skipped this run)

Totals (floors): 5 FAIL / 6 checks, 1 route(s), viewport 390x844

---
## /de/dashboard

### FLOORS (5 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 26px ("Übersicht") | floor >= 28px | FAIL |
| F7a weight share | 50% (2/4) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 1.68x | floor >= 1.8x | FAIL |
| F7c size spread | 4 distinct, densest cluster 3 within 8px (global spread 13px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 0 distinct box-shadow | floor >= 2 | FAIL |

