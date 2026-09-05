# Geometry check report

Generated: 2026-09-05T14:16:52.365Z
Base URL: http://localhost:3461  Viewport: mobile (375x812)

Report-only pass (checklist item 1): this script never fails the run. Findings
below are raw candidates, not confirmed bugs, until triaged for false positives.
FLOORS is likewise report-only and always exits 0 - a future turn can flip it to
a gate once triaged (see the file header comment). Not a gate yet.

Totals: off-grid=2105  broken-axis=79  nested-radius=8  asymmetric-pair=0
Totals (floors): 4 FAIL / 24 checks, 4 route(s), viewport 390x844

---
## /en/salon/muse-beauty-studio

Elements scanned: 552

### (a) OFF-GRID (618)

- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginTop=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginRight=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginBottom=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginLeft=-1px (nearest 4pt: 0px)
- `#main-content` width=375px (nearest 4pt: 376px)
- `#main-content > main.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > main.relative:nth-of-type(1) > div.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > main.relative:nth-of-type(1) > div.relative:nth-of-type(1) > section.mx-auto:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > main.relative:nth-of-type(1) > div.relative:nth-of-type(1) > section.mx-auto:nth-of-type(1)` height=281.25px (nearest 4pt: 280px)
- `#section-photos` width=375px (nearest 4pt: 376px)
- `#section-photos` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(1)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(2)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(2)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(3)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(3)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(4)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(4)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(5)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(5)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(6)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(6)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(7)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(7)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(8)` width=375px (nearest 4pt: 376px)
- ...+588 more (truncated for readability, count above is exact)

### (b) BROKEN AXIS (near-miss alignment) (31)

- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `#main-content` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `#main-content` , top edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > div.pb-[calc(56px+env(safe-area-inset-bottom))]:nth-of-type(3)` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1)` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1)` , top edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > div.fixed:nth-of-type(5)` , left edges differ by 1px
- `#section-photos > div.relative:nth-of-type(1) > div.absolute:nth-of-type(2) > button.group:nth-of-type(1)` vs `#section-photos > div.relative:nth-of-type(1) > div.absolute:nth-of-type(2) > span.sr-only:nth-of-type(1)` , left edges differ by 1px
- `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(1) > span.mt-0.5:nth-of-type(1)` vs `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(1) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(2) > span.mt-0.5:nth-of-type(1)` vs `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(2) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(3) > span.mt-0.5:nth-of-type(1)` vs `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(3) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(4) > span.mt-0.5:nth-of-type(1)` vs `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(4) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(5) > span.mt-0.5:nth-of-type(1)` vs `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(5) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(6) > span.mt-0.5:nth-of-type(1)` vs `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(6) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(7) > span.mt-0.5:nth-of-type(1)` vs `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(7) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` , right edges differ by 2px
- `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` , top edges differ by 2px
- `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , left edges differ by 1px
- `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , top edges differ by 1px
- `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` vs `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , top edges differ by 3px
- `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > h3.font-body:nth-of-type(1)` vs `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > span.font-body:nth-of-type(1)` , top edges differ by 1px
- `section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > span.font-body:nth-of-type(1) > span.inline-flex:nth-of-type(1) > svg:nth-of-type(1)` vs `section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(1) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > span.font-body:nth-of-type(1) > span.inline-flex:nth-of-type(1) > span:nth-of-type(1)` , top edges differ by 3px
- `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` , right edges differ by 2px
- `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` , top edges differ by 2px
- `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , left edges differ by 1px
- `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , top edges differ by 1px
- `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` vs `div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , top edges differ by 3px
- `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > h3.font-body:nth-of-type(1)` vs `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > span.font-body:nth-of-type(1)` , top edges differ by 1px
- `section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > span.font-body:nth-of-type(1) > span.inline-flex:nth-of-type(1) > svg:nth-of-type(1)` vs `section:nth-of-type(9) > div.mt-5:nth-of-type(1) > a.group:nth-of-type(2) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > span.font-body:nth-of-type(1) > span.inline-flex:nth-of-type(1) > span:nth-of-type(1)` , top edges differ by 3px
- `body.text-s-ink:nth-of-type(1) > div.pb-[calc(56px+env(safe-area-inset-bottom))]:nth-of-type(3) > footer.relative:nth-of-type(1) > div.bg-s-bg-sunken:nth-of-type(1) > div.mx-auto:nth-of-type(1) > form.relative:nth-of-type(1) > label.sr-only:nth-of-type(1)` vs `#footer-newsletter-email` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > div.pb-[calc(56px+env(safe-area-inset-bottom))]:nth-of-type(3) > footer.relative:nth-of-type(1) > div.bg-s-bg-sunken:nth-of-type(1) > div.mx-auto:nth-of-type(1) > form.relative:nth-of-type(1) > label.sr-only:nth-of-type(1)` vs `#footer-newsletter-email` , top edges differ by 1px
- ...+1 more (truncated for readability, count above is exact)

### (c) NESTED RADIUS (2)

- `#section-location > div.relative:nth-of-type(1) > a.absolute:nth-of-type(1)` bottom-left inner=16px inside `#section-location > div.relative:nth-of-type(1)` outer=16px, gap=13px, expected inner=4px (off by 12px)
- `#section-location > div.relative:nth-of-type(1) > a.absolute:nth-of-type(1)` bottom-right inner=16px inside `#section-location > div.relative:nth-of-type(1)` outer=16px, gap=13px, expected inner=4px (off by 12px)

### (d) ASYMMETRIC PAIR (0)

none found

### FLOORS (1 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 34.66% | floor >= 33% | PASS |
| F6 display anchor | 30px ("Muse Beauty Studio") | floor >= 28px | PASS |
| F7a weight share | 6.9% (2/29) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2.14x | floor >= 1.8x | PASS |
| F7c size spread | 6 distinct, densest cluster 5 within 8px (global spread 17px, context only) , TRAP: 5 distinct sizes inside one 8px window | trap: densest cluster >4 distinct within 8px | FAIL |
| ELEVATION | 3 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#section-photos > div.relative:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…; `#section-services > div.mt-5:nth-of-type(2) > section:nth-of-type(1) > ul.overflow-hidden:nth-of-type(1)` rgba(10, 10, 10, 0.04) 0px 1px 3px 0px, rgba(10, 10, 10, 0.1) 0px 10px 28px -14p…; `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px

---

## /en/dev/directions-0905/salon-page?v=a

Elements scanned: 480

### (a) OFF-GRID (595)

- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginTop=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginRight=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginBottom=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginLeft=-1px (nearest 4pt: 0px)
- `#main-content` width=375px (nearest 4pt: 376px)
- `#main-content` height=5506.55px (nearest 4pt: 5508px)
- `#main-content > div:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1)` height=5450.55px (nearest 4pt: 5452px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > span.text-[12px]:nth-of-type(1)` width=167.11px (nearest 4pt: 168px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1)` width=117.22px (nearest 4pt: 116px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1) > a.flex:nth-of-type(1)` width=32.52px (nearest 4pt: 32px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1) > a.flex:nth-of-type(2)` width=33.89px (nearest 4pt: 32px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1) > a.flex:nth-of-type(3)` width=34.81px (nearest 4pt: 36px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1)` height=5406.55px (nearest 4pt: 5408px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.relative:nth-of-type(1)` height=5382.55px (nearest 4pt: 5384px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.relative:nth-of-type(1) > section.mx-auto:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.relative:nth-of-type(1) > section.mx-auto:nth-of-type(1)` height=281.25px (nearest 4pt: 280px)
- `#section-photos` width=375px (nearest 4pt: 376px)
- `#section-photos` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(1)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(2)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(2)` height=281.25px (nearest 4pt: 280px)
- ...+565 more (truncated for readability, count above is exact)

### (b) BROKEN AXIS (near-miss alignment) (14)

- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `#main-content` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `#main-content` , top edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1)` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1)` , top edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > div.fixed:nth-of-type(2)` , left edges differ by 1px
- `#section-photos > div.relative:nth-of-type(1) > div.absolute:nth-of-type(2) > button.group:nth-of-type(1)` vs `#section-photos > div.relative:nth-of-type(1) > div.absolute:nth-of-type(2) > span.sr-only:nth-of-type(1)` , left edges differ by 1px
- `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(1) > span.mt-0.5:nth-of-type(1)` vs `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(1) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(2) > span.mt-0.5:nth-of-type(1)` vs `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(2) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(3) > span.mt-0.5:nth-of-type(1)` vs `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(3) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(4) > span.mt-0.5:nth-of-type(1)` vs `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(4) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(5) > span.mt-0.5:nth-of-type(1)` vs `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(5) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(6) > span.mt-0.5:nth-of-type(1)` vs `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(6) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(7) > span.mt-0.5:nth-of-type(1)` vs `div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(1) > div.mt-8:nth-of-type(9) > div:nth-of-type(1) > section:nth-of-type(1) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(7) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1) > button.grid:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1) > span.sr-only:nth-of-type(2)` , left edges differ by 3px

### (c) NESTED RADIUS (2)

- `#section-location > div.relative:nth-of-type(1) > a.absolute:nth-of-type(1)` bottom-left inner=16px inside `#section-location > div.relative:nth-of-type(1)` outer=16px, gap=13px, expected inner=4px (off by 12px)
- `#section-location > div.relative:nth-of-type(1) > a.absolute:nth-of-type(1)` bottom-right inner=16px inside `#section-location > div.relative:nth-of-type(1)` outer=16px, gap=13px, expected inner=4px (off by 12px)

### (d) ASYMMETRIC PAIR (0)

none found

### FLOORS (1 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 34.66% | floor >= 33% | PASS |
| F6 display anchor | 30px ("Muse Beauty Studio") | floor >= 28px | PASS |
| F7a weight share | 5.71% (2/35) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2.14x | floor >= 1.8x | PASS |
| F7c size spread | 7 distinct, densest cluster 6 within 8px (global spread 18px, context only) , TRAP: 6 distinct sizes inside one 8px window | trap: densest cluster >4 distinct within 8px | FAIL |
| ELEVATION | 3 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#section-photos > div.relative:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…; `#section-services > div.mt-5:nth-of-type(2) > section:nth-of-type(1) > ul.overflow-hidden:nth-of-type(1)` rgba(10, 10, 10, 0.04) 0px 1px 3px 0px, rgba(10, 10, 10, 0.1) 0px 10px 28px -14p…; `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px

---

## /en/dev/directions-0905/salon-page?v=b

Elements scanned: 409

### (a) OFF-GRID (427)

- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginTop=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginRight=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginBottom=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginLeft=-1px (nearest 4pt: 0px)
- `#main-content` width=375px (nearest 4pt: 376px)
- `#main-content` height=5929.14px (nearest 4pt: 5928px)
- `#main-content > div:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1)` height=5873.14px (nearest 4pt: 5872px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > span.text-[12px]:nth-of-type(1)` width=225.78px (nearest 4pt: 224px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1)` width=117.22px (nearest 4pt: 116px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1) > a.flex:nth-of-type(1)` width=34.52px (nearest 4pt: 36px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1) > a.flex:nth-of-type(3)` width=34.81px (nearest 4pt: 36px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1)` height=5829.14px (nearest 4pt: 5828px)
- `#section-photos` width=375px (nearest 4pt: 376px)
- `#section-photos` height=421.94px (nearest 4pt: 420px)
- `#section-photos > div.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(1)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(2)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(2)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(3)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(3)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(4)` width=375px (nearest 4pt: 376px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(4)` height=281.25px (nearest 4pt: 280px)
- `#section-photos > div.relative:nth-of-type(1) > div.flex:nth-of-type(1) > div.relative:nth-of-type(5)` width=375px (nearest 4pt: 376px)
- ...+397 more (truncated for readability, count above is exact)

### (b) BROKEN AXIS (near-miss alignment) (24)

- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `#main-content` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `#main-content` , top edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > div.fixed:nth-of-type(2)` , left edges differ by 1px
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > span.text-[12px]:nth-of-type(1)` vs `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1)` , top edges differ by 2px
- `#section-photos > div.relative:nth-of-type(1) > div.absolute:nth-of-type(2) > div.flex:nth-of-type(1) > span.active:scale-[0.94]:nth-of-type(1) > button.group:nth-of-type(1)` vs `#section-photos > div.relative:nth-of-type(1) > div.absolute:nth-of-type(2) > div.flex:nth-of-type(1) > span.active:scale-[0.94]:nth-of-type(1) > span.sr-only:nth-of-type(1)` , left edges differ by 1px
- `#section-photos > div.px-4:nth-of-type(2) > div.mt-3:nth-of-type(2) > span.flex:nth-of-type(1)` vs `#section-photos > div.px-4:nth-of-type(2) > div.mt-3:nth-of-type(2) > span.font-semibold:nth-of-type(3)` , top edges differ by 2.5px
- `#section-photos > div.px-4:nth-of-type(2) > div.mt-3:nth-of-type(2) > span.flex:nth-of-type(1) > svg:nth-of-type(1)` vs `#section-photos > div.px-4:nth-of-type(2) > div.mt-3:nth-of-type(2) > span.flex:nth-of-type(1) > span.text-s-accent:nth-of-type(2)` , top edges differ by 1.5px
- `#section-photos > div.px-4:nth-of-type(2) > div.mt-3:nth-of-type(2) > span.flex:nth-of-type(1) > span.text-[22px]:nth-of-type(1)` vs `#section-photos > div.px-4:nth-of-type(2) > div.mt-3:nth-of-type(2) > span.flex:nth-of-type(1) > span.text-s-accent:nth-of-type(2)` , top edges differ by 2.5px
- `#section-team > div.flex:nth-of-type(1) > h2.text-[22px]:nth-of-type(1)` vs `#section-team > div.flex:nth-of-type(1) > a.text-[14px]:nth-of-type(1)` , top edges differ by 2.5px
- `#section-team > div.mt-5:nth-of-type(2) > a.flex:nth-of-type(2) > div.mt-3:nth-of-type(1)` vs `#section-team > div.mt-5:nth-of-type(2) > a.flex:nth-of-type(2) > div.mt-1:nth-of-type(2)` , left edges differ by 1.91px
- `#section-team > div.mt-5:nth-of-type(2) > a.flex:nth-of-type(2) > div.mt-3:nth-of-type(1)` vs `#section-team > div.mt-5:nth-of-type(2) > a.flex:nth-of-type(2) > div.mt-1:nth-of-type(2)` , right edges differ by 1.89px
- `#section-reviews > div.flex:nth-of-type(1) > svg:nth-of-type(1)` vs `#section-reviews > div.flex:nth-of-type(1) > span.text-[22px]:nth-of-type(1)` , top edges differ by 3px
- `#section-reviews > div.flex:nth-of-type(1) > span.text-[22px]:nth-of-type(1)` vs `#section-reviews > div.flex:nth-of-type(1) > span.text-[14px]:nth-of-type(2)` , top edges differ by 2.5px
- `#section-reviews > ul.mt-6:nth-of-type(1) > li:nth-of-type(1) > div.flex:nth-of-type(1) > span.relative:nth-of-type(1)` vs `#section-reviews > ul.mt-6:nth-of-type(1) > li:nth-of-type(1) > div.flex:nth-of-type(1) > div.min-w-0:nth-of-type(1)` , top edges differ by 1.5px
- `#section-reviews > ul.mt-6:nth-of-type(1) > li:nth-of-type(2) > div.flex:nth-of-type(1) > span.relative:nth-of-type(1)` vs `#section-reviews > ul.mt-6:nth-of-type(1) > li:nth-of-type(2) > div.flex:nth-of-type(1) > div.min-w-0:nth-of-type(1)` , top edges differ by 1.5px
- `#section-reviews > ul.mt-6:nth-of-type(1) > li:nth-of-type(3) > div.flex:nth-of-type(1) > span.relative:nth-of-type(1)` vs `#section-reviews > ul.mt-6:nth-of-type(1) > li:nth-of-type(3) > div.flex:nth-of-type(1) > div.min-w-0:nth-of-type(1)` , top edges differ by 1.5px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(1) > svg:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(1) > span:nth-of-type(1)` , top edges differ by 2px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(2) > svg:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(2) > span:nth-of-type(1)` , top edges differ by 2px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(3) > svg:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(3) > span:nth-of-type(1)` , top edges differ by 2px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(4) > svg:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(4) > span:nth-of-type(1)` , top edges differ by 2px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(5) > svg:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(5) > span:nth-of-type(1)` , top edges differ by 2px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(6) > svg:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(6) > span:nth-of-type(1)` , top edges differ by 2px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(7) > svg:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(9) > ul.mt-4:nth-of-type(1) > li.flex:nth-of-type(7) > span:nth-of-type(1)` , top edges differ by 2px
- `body.text-s-ink:nth-of-type(1) > div.fixed:nth-of-type(2) > div.min-w-0:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > div.fixed:nth-of-type(2) > a.flex:nth-of-type(1)` , top edges differ by 3px

### (c) NESTED RADIUS (2)

- `#section-location > div.relative:nth-of-type(1) > a.absolute:nth-of-type(1)` bottom-left inner=16px inside `#section-location > div.relative:nth-of-type(1)` outer=16px, gap=13px, expected inner=4px (off by 12px)
- `#section-location > div.relative:nth-of-type(1) > a.absolute:nth-of-type(1)` bottom-right inner=16px inside `#section-location > div.relative:nth-of-type(1)` outer=16px, gap=13px, expected inner=4px (off by 12px)

### (d) ASYMMETRIC PAIR (0)

none found

### FLOORS (1 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 34.66% | floor >= 33% | PASS |
| F6 display anchor | 28px ("Muse Beauty Studio") | floor >= 28px | PASS |
| F7a weight share | 0% (0/22) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2x | floor >= 1.8x | PASS |
| F7c size spread | 4 distinct, densest cluster 2 within 8px (global spread 16px, context only) | trap: densest cluster >4 distinct within 8px | PASS |
| ELEVATION | 1 distinct box-shadow | floor >= 2 | FAIL |

elevation examples: `#section-photos > div.relative:nth-of-type(1) > div.absolute:nth-of-type(2) > span.active:scale-[0.94]:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…

---

## /en/dev/directions-0905/salon-page?v=c

Elements scanned: 389

### (a) OFF-GRID (465)

- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginTop=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginRight=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginBottom=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginLeft=-1px (nearest 4pt: 0px)
- `#main-content` width=375px (nearest 4pt: 376px)
- `#main-content` height=4769.28px (nearest 4pt: 4768px)
- `#main-content > div:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1)` height=4713.28px (nearest 4pt: 4712px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > span.text-[12px]:nth-of-type(1)` width=225.78px (nearest 4pt: 224px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1)` width=117.22px (nearest 4pt: 116px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1) > a.flex:nth-of-type(1)` width=34.52px (nearest 4pt: 36px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1) > a.flex:nth-of-type(2)` width=33.89px (nearest 4pt: 32px)
- `#main-content > div:nth-of-type(1) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1) > a.flex:nth-of-type(3)` width=32.81px (nearest 4pt: 32px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1)` height=4669.28px (nearest 4pt: 4668px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.flex:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.relative:nth-of-type(1) > span.absolute:nth-of-type(1)` width=72.58px (nearest 4pt: 72px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.relative:nth-of-type(1) > span.absolute:nth-of-type(1)` paddingRight=10px (nearest 4pt: 12px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.relative:nth-of-type(1) > span.absolute:nth-of-type(1)` paddingLeft=10px (nearest 4pt: 12px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2)` width=375px (nearest 4pt: 376px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2)` height=4273.28px (nearest 4pt: 4272px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > header.w-full:nth-of-type(1)` width=343px (nearest 4pt: 344px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > header.w-full:nth-of-type(1)` height=98px (nearest 4pt: 100px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > header.w-full:nth-of-type(1) > div.flex:nth-of-type(1)` width=343px (nearest 4pt: 344px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > header.w-full:nth-of-type(1) > div.flex:nth-of-type(1)` height=98px (nearest 4pt: 100px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > header.w-full:nth-of-type(1) > div.flex:nth-of-type(1) > div.min-w-0:nth-of-type(1)` width=343px (nearest 4pt: 344px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > header.w-full:nth-of-type(1) > div.flex:nth-of-type(1) > div.min-w-0:nth-of-type(1)` height=98px (nearest 4pt: 100px)
- `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > header.w-full:nth-of-type(1) > div.flex:nth-of-type(1) > div.min-w-0:nth-of-type(1) > h1.font-display:nth-of-type(1)` width=343px (nearest 4pt: 344px)
- ...+435 more (truncated for readability, count above is exact)

### (b) BROKEN AXIS (near-miss alignment) (10)

- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `#main-content` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `#main-content` , top edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > div.fixed:nth-of-type(2)` , left edges differ by 1px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(1) > span.mt-0.5:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(1) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(2) > span.mt-0.5:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(2) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(3) > span.mt-0.5:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(3) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(4) > span.mt-0.5:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(4) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(5) > span.mt-0.5:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(5) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(6) > span.mt-0.5:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(6) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(7) > span.mt-0.5:nth-of-type(1)` vs `div:nth-of-type(1) > main.relative:nth-of-type(1) > div.mx-auto:nth-of-type(2) > div.mt-8:nth-of-type(1) > section:nth-of-type(8) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(7) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px

### (c) NESTED RADIUS (2)

- `#section-location > div.relative:nth-of-type(1) > a.absolute:nth-of-type(1)` bottom-left inner=16px inside `#section-location > div.relative:nth-of-type(1)` outer=16px, gap=13px, expected inner=4px (off by 12px)
- `#section-location > div.relative:nth-of-type(1) > a.absolute:nth-of-type(1)` bottom-right inner=16px inside `#section-location > div.relative:nth-of-type(1)` outer=16px, gap=13px, expected inner=4px (off by 12px)

### (d) ASYMMETRIC PAIR (0)

none found

### FLOORS (1 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 35.55% | floor >= 33% | PASS |
| F6 display anchor | 30px ("Muse Beauty Studio") | floor >= 28px | PASS |
| F7a weight share | 3.33% (1/30) | ceiling <= 30% | PASS |
| F7b anchor ratio | 2.22x | floor >= 1.8x | PASS |
| F7c size spread | 7 distinct, densest cluster 6 within 8px (global spread 18px, context only) , TRAP: 6 distinct sizes inside one 8px window | trap: densest cluster >4 distinct within 8px | FAIL |
| ELEVATION | 2 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div:nth-of-type(1) > main.relative:nth-of-type(1) > div.relative:nth-of-type(1) > span.absolute:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…; `#section-services > div.mt-5:nth-of-type(2) > section:nth-of-type(1) > ul.overflow-hidden:nth-of-type(1)` rgba(10, 10, 10, 0.04) 0px 1px 3px 0px, rgba(10, 10, 10, 0.1) 0px 10px 28px -14p…

