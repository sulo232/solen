# Geometry check report

Generated: 2026-09-04T22:39:49.765Z
Base URL: http://localhost:3461  Viewport: mobile (375x812)

Report-only pass (checklist item 1): this script never fails the run. Findings
below are raw candidates, not confirmed bugs, until triaged for false positives.
FLOORS is likewise report-only and always exits 0 - a future turn can flip it to
a gate once triaged (see the file header comment). Not a gate yet.

(--floors-only: geometry pass (a)-(d) skipped this run)

Totals (floors): 2 FAIL / 6 checks, 1 route(s), viewport 390x844

---
## /en/dev/mockups-0904/notifications-link

### FLOORS (2 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 0% | floor >= 33% | FAIL |
| F6 display anchor | 28px ("Test Kunde") | floor >= 28px | PASS |
| F7a weight share | 0% (0/21) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2.15x | floor >= 1.8x | PASS |
| F7c size spread | 6 distinct, densest cluster 4 within 8px (global spread 16px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 0 distinct box-shadow | floor >= 2 | FAIL |

