# Geometry check report

Generated: 2026-07-25T10:29:46.468Z
Base URL: http://localhost:3000  Viewport: mobile (375x812)

Report-only pass (checklist item 1): this script never fails the run. Findings
below are raw candidates, not confirmed bugs, until triaged for false positives.
FLOORS is likewise report-only and always exits 0 - a future turn can flip it to
a gate once triaged (see the file header comment). Not a gate yet.

Totals: off-grid=1520  broken-axis=176  nested-radius=4  asymmetric-pair=0
Totals (floors): 5 FAIL / 12 checks, 2 route(s), viewport 390x844

---
## /de

Elements scanned: 939

### (a) OFF-GRID (1046)

- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginTop=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginRight=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginBottom=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginLeft=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > a.shrink-0:nth-of-type(1)` width=70.91px (nearest 4pt: 72px)
- `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > a.shrink-0:nth-of-type(1)` height=30px (nearest 4pt: 32px)
- `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > a.shrink-0:nth-of-type(1) > span.inline-flex:nth-of-type(1)` width=70.91px (nearest 4pt: 72px)
- `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > a.shrink-0:nth-of-type(1) > span.inline-flex:nth-of-type(1) > span:nth-of-type(1)` width=70.91px (nearest 4pt: 72px)
- `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(2) > button.md:hidden:nth-of-type(1) > span.absolute:nth-of-type(1)` width=42px (nearest 4pt: 44px)
- `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(2) > button.md:hidden:nth-of-type(1) > span.absolute:nth-of-type(1)` height=42px (nearest 4pt: 44px)
- `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(2) > button.md:hidden:nth-of-type(1) > span.absolute:nth-of-type(2)` width=41.58px (nearest 4pt: 40px)
- `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(2) > button.md:hidden:nth-of-type(1) > span.absolute:nth-of-type(2)` height=41.58px (nearest 4pt: 40px)
- `#main-content` width=375px (nearest 4pt: 376px)
- `#main-content` height=3263.45px (nearest 4pt: 3264px)
- `#main-content > div.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div.relative:nth-of-type(1)` height=3263.45px (nearest 4pt: 3264px)
- `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1)` height=389.17px (nearest 4pt: 388px)
- `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1)` height=389.17px (nearest 4pt: 388px)
- `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.w-full:nth-of-type(1)` width=343px (nearest 4pt: 344px)
- `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.w-full:nth-of-type(1)` height=67.17px (nearest 4pt: 68px)
- `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.w-full:nth-of-type(1) > h1.mb-3:nth-of-type(1)` width=343px (nearest 4pt: 344px)
- `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.w-full:nth-of-type(1) > p.font-body:nth-of-type(1)` width=343px (nearest 4pt: 344px)
- `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2)` width=343px (nearest 4pt: 344px)
- `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2)` height=250px (nearest 4pt: 252px)
- `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1)` width=343px (nearest 4pt: 344px)
- `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1)` height=250px (nearest 4pt: 252px)
- ...+1016 more (truncated for readability, count above is exact)

### (b) BROKEN AXIS (near-miss alignment) (160)

- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1)` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > header.sticky:nth-of-type(1)` , top edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `#main-content` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > footer.relative:nth-of-type(1)` , left edges differ by 1px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1) > div.absolute:nth-of-type(1) > button.group:nth-of-type(1) > span.flex:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1) > div.absolute:nth-of-type(1) > button.group:nth-of-type(1) > span.font-body:nth-of-type(2)` , top edges differ by 1.5px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1) > div.absolute:nth-of-type(1) > button.group:nth-of-type(2) > span.flex:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1) > div.absolute:nth-of-type(1) > button.group:nth-of-type(2) > span.font-body:nth-of-type(2)` , top edges differ by 1.5px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1) > div.absolute:nth-of-type(1) > button.group:nth-of-type(3) > span.flex:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1) > div.absolute:nth-of-type(1) > button.group:nth-of-type(3) > span.font-body:nth-of-type(2)` , top edges differ by 1.5px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1) > div.absolute:nth-of-type(2) > div.flex:nth-of-type(1) > div.flex:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1) > div.absolute:nth-of-type(2) > div.flex:nth-of-type(1) > button.grid:nth-of-type(1)` , top edges differ by 2.36px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` , right edges differ by 2px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` , top edges differ by 2px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , left edges differ by 1px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , top edges differ by 1px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , top edges differ by 3px
- `section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > h3.font-body:nth-of-type(1)` vs `section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(1) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > span.font-body:nth-of-type(1)` , top edges differ by 1.25px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` , right edges differ by 2px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` , top edges differ by 2px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , left edges differ by 1px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , top edges differ by 1px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(2) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , top edges differ by 3px
- `section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(2) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > h3.font-body:nth-of-type(1)` vs `section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(2) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > span.font-body:nth-of-type(1)` , top edges differ by 1.25px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(3) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(3) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` , right edges differ by 2px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(3) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(3) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` , top edges differ by 2px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(3) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(3) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , left edges differ by 1px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(3) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(3) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , top edges differ by 1px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(3) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(3) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , top edges differ by 3px
- `section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(3) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > h3.font-body:nth-of-type(1)` vs `section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(3) > div.mt-2:nth-of-type(2) > div.flex:nth-of-type(1) > span.font-body:nth-of-type(1)` , top edges differ by 1.25px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(4) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(4) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` , right edges differ by 2px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(4) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(4) > div.relative:nth-of-type(1) > button.group:nth-of-type(1)` , top edges differ by 2px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(4) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(4) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , left edges differ by 1px
- `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(4) > div.relative:nth-of-type(1) > img.object-cover:nth-of-type(1)` vs `div.relative:nth-of-type(1) > section.relative:nth-of-type(2) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > div.mt-1:nth-of-type(2) > a.group:nth-of-type(4) > div.relative:nth-of-type(1) > span.sr-only:nth-of-type(1)` , top edges differ by 1px
- ...+130 more (truncated for readability, count above is exact)

### (c) NESTED RADIUS (2)

- `#main-content > div.relative:nth-of-type(1) > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.grid:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1)` top-left inner=24px inside `#main-content > div.relative:nth-of-type(1) > div.relative:nth-of-type(1)` outer=28px, gap=24px, expected inner=4px (off by 20px)
- `#main-content > div.relative:nth-of-type(1) > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.grid:nth-of-type(1) > a.group:nth-of-type(3) > div.relative:nth-of-type(1)` top-right inner=24px inside `#main-content > div.relative:nth-of-type(1) > div.relative:nth-of-type(1)` outer=28px, gap=24px, expected inner=4px (off by 20px)

### (d) ASYMMETRIC PAIR (0)

none found

### FLOORS (2 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 4.66% | floor >= 33% | FAIL |
| F6 display anchor | 31.2px ("Termine, sofort bestätigt.") | floor >= 28px | PASS |
| F7a weight share | 50% (11/22) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 2.31x | floor >= 1.8x | PASS |
| F7c size spread | 9 distinct, spread 19.2px | trap: >4 distinct AND spread<8px | PASS |
| ELEVATION | 4 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#main-content > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.09) 0px 2px 8px 0px; `#main-content > div.relative:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(26, 18, 9, 0.04) 0px -12px 32px 0px; `#main-content > div.relative:nth-of-type(1) > div.relative:nth-of-type(1) > section.relative:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.grid:nth-of-type(1) > a.group:nth-of-type(1) > div.relative:nth-of-type(1)` rgba(50, 47, 44, 0.05) 0px 1px 2px 0px, rgba(50, 47, 44, 0.1) 0px 4px 12px -6px; `div.relative:nth-of-type(1) > section.relative:nth-of-type(3) > div.mx-auto:nth-of-type(1) > div.px-3:nth-of-type(1) > a.relative:nth-of-type(1) > div.h-full:nth-of-type(1) > div.mapboxgl-canvas-container:nth-of-type(2) > div.inline-flex:nth-of-type(14)` rgba(0, 0, 0, 0.3) 0px 1px 5px 0px

---

## /de/salon/cuts-and-culture

Elements scanned: 435

### (a) OFF-GRID (474)

- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginTop=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginRight=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginBottom=-1px (nearest 4pt: 0px)
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` marginLeft=-1px (nearest 4pt: 0px)
- `#main-content` width=375px (nearest 4pt: 376px)
- `#main-content` height=4197px (nearest 4pt: 4196px)
- `#main-content > main.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > main.relative:nth-of-type(1)` height=4197px (nearest 4pt: 4196px)
- `#main-content > main.relative:nth-of-type(1) > div.relative:nth-of-type(1)` width=375px (nearest 4pt: 376px)
- `#main-content > main.relative:nth-of-type(1) > div.relative:nth-of-type(1)` height=4101px (nearest 4pt: 4100px)
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
- ...+444 more (truncated for readability, count above is exact)

### (b) BROKEN AXIS (near-miss alignment) (16)

- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `#main-content` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `#main-content` , top edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > footer.relative:nth-of-type(1)` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1)` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1)` , top edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > a.sr-only:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > div.fixed:nth-of-type(3)` , left edges differ by 1px
- `#section-photos > div.relative:nth-of-type(1) > div.absolute:nth-of-type(2) > button.group:nth-of-type(1)` vs `#section-photos > div.relative:nth-of-type(1) > div.absolute:nth-of-type(2) > span.sr-only:nth-of-type(1)` , left edges differ by 1px
- `#section-team > div.flex:nth-of-type(1) > h2.font-display:nth-of-type(1)` vs `#section-team > div.flex:nth-of-type(1) > a.text-[14px]:nth-of-type(1)` , top edges differ by 1px
- `#section-reviews > section.rounded-[24px]:nth-of-type(1) > div.mt-4:nth-of-type(1) > svg:nth-of-type(1)` vs `#section-reviews > section.rounded-[24px]:nth-of-type(1) > div.mt-4:nth-of-type(1) > span.font-display:nth-of-type(1)` , top edges differ by 2px
- `#section-reviews > section.rounded-[24px]:nth-of-type(1) > div.mt-4:nth-of-type(1) > svg:nth-of-type(1)` vs `#section-reviews > section.rounded-[24px]:nth-of-type(1) > div.mt-4:nth-of-type(1) > span.font-body:nth-of-type(2)` , top edges differ by 1.75px
- `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(2) > section:nth-of-type(7) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(1) > span.mt-0.5:nth-of-type(1)` vs `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(2) > section:nth-of-type(7) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(1) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(2) > section:nth-of-type(7) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(2) > span.mt-0.5:nth-of-type(1)` vs `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(2) > section:nth-of-type(7) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(2) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(2) > section:nth-of-type(7) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(3) > span.mt-0.5:nth-of-type(1)` vs `div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-8:nth-of-type(2) > section:nth-of-type(7) > ul.mt-4:nth-of-type(1) > li.font-body:nth-of-type(3) > span.leading-relaxed:nth-of-type(2)` , top edges differ by 2px
- `body.text-s-ink:nth-of-type(1) > footer.relative:nth-of-type(1) > div.border-b:nth-of-type(1) > div.mx-auto:nth-of-type(1) > form.relative:nth-of-type(1) > label.sr-only:nth-of-type(1)` vs `#footer-newsletter-email` , left edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > footer.relative:nth-of-type(1) > div.border-b:nth-of-type(1) > div.mx-auto:nth-of-type(1) > form.relative:nth-of-type(1) > label.sr-only:nth-of-type(1)` vs `#footer-newsletter-email` , top edges differ by 1px
- `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1) > button.-ml-1:nth-of-type(1)` vs `body.text-s-ink:nth-of-type(1) > nav.fixed:nth-of-type(1) > div.mx-auto:nth-of-type(1) > div.flex:nth-of-type(1) > span.sr-only:nth-of-type(2)` , left edges differ by 3px

### (c) NESTED RADIUS (2)

- `#section-location > div.relative:nth-of-type(1) > a.absolute:nth-of-type(1)` bottom-left inner=16px inside `#section-location > div.relative:nth-of-type(1)` outer=16px, gap=13px, expected inner=4px (off by 12px)
- `#section-location > div.relative:nth-of-type(1) > a.absolute:nth-of-type(1)` bottom-right inner=16px inside `#section-location > div.relative:nth-of-type(1)` outer=16px, gap=13px, expected inner=4px (off by 12px)

### (d) ASYMMETRIC PAIR (0)

none found

### FLOORS (3 FAIL / 6)

| floor | measured | floor/ceiling | status |
|---|---|---|---|
| F2 imagery | 34.66% | floor >= 33% | PASS |
| F6 display anchor | 22px ("Cuts & Culture") | floor >= 28px | FAIL |
| F7a weight share | 83.33% (25/30) | ceiling <= 30% | FAIL |
| F7b anchor ratio | 1.57x | floor >= 1.8x | FAIL |
| F7c size spread | 6 distinct, spread 9px | trap: >4 distinct AND spread<8px | PASS |
| ELEVATION | 3 distinct box-shadow | floor >= 2 | PASS |

elevation examples: `#section-photos > div.relative:nth-of-type(1) > button.grid:nth-of-type(1)` rgba(0, 0, 0, 0.1) 0px 1px 3px 0px, rgba(255, 255, 255, 0.4) 0px 1px 0px 0px ins…; `main.relative:nth-of-type(1) > div.relative:nth-of-type(1) > div.relative:nth-of-type(2) > div.lg:grid:nth-of-type(1) > div.min-w-0:nth-of-type(1) > div.mt-6:nth-of-type(1) > div.flex:nth-of-type(1) > button.flex:nth-of-type(1)` rgba(0, 0, 0, 0.12) 0px 1px 3px 0px; `#section-services > ul.mt-5:nth-of-type(1)` rgba(10, 10, 10, 0.04) 0px 1px 3px 0px, rgba(10, 10, 10, 0.1) 0px 10px 28px -14p…

