# Geometry check report

Generated: 2026-07-25T13:33:59.803Z
Base URL: http://localhost:3000  Viewport: mobile (375x812)

Report-only pass (checklist item 1): this script never fails the run. Findings
below are raw candidates, not confirmed bugs, until triaged for false positives.
FLOORS is likewise report-only and always exits 0 - a future turn can flip it to
a gate once triaged (see the file header comment). Not a gate yet.

(--floors-only: geometry pass (a)-(d) skipped this run)

Totals (floors): 1 FAIL / 6 checks, 1 route(s), viewport 390x844

---
## /de

### FLOORS (1 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 4.59% | floor >= 33% | FAIL |
| F6 display anchor | 31.2px ("Termine, sofort bestätigt.") | floor >= 28px | PASS |
| F7a weight share | 27.27% (6/22) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2.23x | floor >= 1.8x | PASS |
| F7c size spread | 6 distinct, densest cluster 4 within 8px (global spread 19.2px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 4 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `#main-content > div.relative:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(26, 18, 9, 0.04) 0px -12px 32px 0px; `#main-content > div.relative:nth-of-type(1) > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.grid:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.05) 0px 1px 2px 0px, rgba(50, 47, 44, 0.1) 0px 4px 12px -6px; `div.relative:nth-of-type(1) > section.relative:nth-of-type(3) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > a.relative:nth-of-type(1) > div.h-full:nth-of-type(1) > div.mapboxgl-canvas-container:nth-of-type(2) > div.inline-flex:nth-of-type(14)` rgba(0, 0, 0, 0.3) 0px 1px 5px 0px

