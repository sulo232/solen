# Geometry check report

Generated: 2026-09-04T23:03:02.399Z
Base URL: http://localhost:3461  Viewport: desktop (1280x900)

Report-only pass (checklist item 1): this script never fails the run. Findings
below are raw candidates, not confirmed bugs, until triaged for false positives.
FLOORS is likewise report-only and always exits 0 - a future turn can flip it to
a gate once triaged (see the file header comment). Not a gate yet.

(--floors-only: geometry pass (a)-(d) skipped this run)

Totals (floors): 0 FAIL / 6 checks, 1 route(s), viewport 1280x900

---
## /en/dev/mockups-0904/desktop-type-salon

### FLOORS (0 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 48.06% | floor >= 33% | PASS |
| F6 display anchor | 34px ("Muse Beauty Studio") | floor >= 28px | PASS |
| F7a weight share | 0% (0/21) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2.27x | floor >= 1.8x | PASS |
| F7c size spread | 7 distinct, densest cluster 4 within 8px (global spread 22px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 2 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#section-photos > div.hidden:nth-of-type(2) > div.relative:nth-of-type(1) > button.relative:nth-of-type(3) > span.font-body:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px; `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > header.w-full:nth-of-type(1) > div.flex:nth-of-type(1) > div.hidden:nth-of-type(2) > button.group:nth-of-type(2) > span.relative:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…

