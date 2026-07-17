<!-- exists-check: net-new vs scripts/check-geometry.mjs and _design-system/_geometry-report.md.
     _geometry-report.md is the checker's own auto-regenerated raw dump (every finding, capped
     at 30 samples/section, no cause classification). This file is the human triage ON TOP of
     that raw dump: findings classified by root cause, exclusion rules derived and estimated,
     and a ranked defect list with file:line, per the owner's explicit brief ("triage the noise
     floor... so its output becomes a defect list a human can act on"). scripts/check-geometry.mjs
     was read (not edited, per this task's read-only constraint on product code) to source the
     exact extractGeometry() logic used for the classification. No other file in the codebase
     does this triage step, confirmed via `_design-system/REMOVED.md` (no graveyard hit) and a
     grep for "geometry" across _design-system/*.md (only _geometry-report.md and this checker
     reference it). -->

# Geometry checker triage: turning 1393 findings into a punch list

Method note: re-ran `scripts/check-geometry.mjs` fresh against the tunnel URL
(`https://stylus-infections-boundaries-fragrance.trycloudflare.com`, mirrors
`localhost:3000`) since the sandboxed shell can't reach `localhost` directly.
Fresh totals: **off-grid=1233, broken-axis=159, nested-radius=2** (task brief
said 1234/159/2 , within one-element run noise, confirmed reproducible). A
same-session run straight against a `localhost:3000` URL string returned
938/160/2 with a different `elementsScanned` count (939 vs 697) , that run
was hitting a different render state (dev-mode overlay/hydration artifact,
not reachable from this sandbox to confirm which), so it is NOT used as the
dataset here. Every number below is from the tunnel-backed run.

To classify by cause without touching the real checker, the exact
`extractGeometry()` function body (scripts/check-geometry.mjs:145-541) was
copied verbatim into a scratchpad runner that also dumps the FULL findings
array as JSON (the real script caps the printed report at 30 samples/section)
plus a few extra debug fields (parent content-width, parent display, element's
own display/position, whether the element's own class sets an explicit
width/height). `scripts/check-geometry.mjs` itself was not edited.

---

## 1. Headline signal-to-noise

| check | raw findings | after exclusion rules | signal-to-noise |
|---|---|---|---|
| off-grid | 1233 | **191** raw lines / **~15 unique root causes** (file:line) | 15.5% of raw lines are real; as unique defects it's **~1.2%** of the raw count |
| broken-axis | 159 | **0-9** (low confidence even on those 9) | effectively **0%** actionable on this 3-route sample |
| nested-radius | 2 | 2 (already triaged, out of scope here) | left alone per brief |

**Off-grid is usable but only after real filtering , not as shipped.** 84.5%
of its raw output is structurally impossible to be a bug (a 375px mobile
viewport propagating a non-4-multiple width to every full-bleed descendant,
sub-pixel layout rounding, screen-reader-only utility markup, shrink-to-fit
buttons). The remaining 191 lines collapse to roughly 15 distinct authored
values in ~12 files, several in shared primitives , that part is a genuinely
good, actionable list once the exclusion rules below are coded in.

**Broken-axis is currently near-useless as designed, and that needs to be
said plainly.** On this 3-route sample it did not surface a single
high-confidence "someone eyeballed this and got it wrong" defect. 73% of its
159 findings are one root cause (sub-pixel rounding on `aspect-[]` image
boxes), 12% is `align-items: baseline` behaving exactly as intended (the
checker doesn't know what baseline alignment is for), 9% is comparing a
visually-hidden `sr-only` accessibility element against a real sibling
(comparing apples to a11y-oranges), and the residual ~6% is icon-vs-text rows
where an icon's box-center and a text line's line-box-center differ by
1-2px , also not a human eyeballing error, just two different centering
mechanisms living next to each other. **What it should check instead**: skip
sibling-pair comparisons entirely inside (a) any container whose own
rect.width has a fractional part (that ancestor is already flagged, or would
be, by off-grid , don't re-derive noise from it), (b) `align-items: baseline`
parents, (c) pairs where either side is `.sr-only`. After those three cuts,
re-run on a WIDER route set (the current 3 routes are thin) before deciding
whether broken-axis is worth keeping at all , it may simply never have much
to say beyond nested-radius/off-grid once its known-noise sources are culled.

---

## 2. Off-grid class table

| class | count | 2 example selectors | exclude rule |
|---|---|---|---|
| **(c) sub-pixel/transform rounding** , fractional width/height | **566** (45.9%) | logo `a.shrink-0 > span.inline-flex` width=70.91px (intrinsic-ratio SVG logo scaled to a fixed height); page body `#main-content` height=3203.45px (auto content height) | Skip WIDTH/HEIGHT (not margin/padding , those are never fractional) whenever the value has a nonzero fractional part: `Math.abs(v - Math.round(v)) > 0.001`. Margin/padding are direct authored CSS box values and never render fractional at 1x DPR in this dataset (0 of 1233 margin/padding findings were fractional) , so this rule is safe with no false negatives observed. |
| **(a) impossible-by-construction** , width equals parent's content-box width (full-bleed inheritance from the 375px viewport) | **208** (16.9%) | `header.sticky` width=375px; `#main-content > div.relative > section.relative > div.relative` width=339px (inherits Hero's own padding, see defect #6 below) | Skip WIDTH when `abs(el.rect.width - (parent.clientWidth - parent.paddingLeft - parent.paddingRight)) <= 1`. 375 is not a 4-multiple, so any element that is simply "100% of its parent" inherits that non-4-multiple forever, arbitrarily deep. This is a symptom, never an independent authored value , the real defect (if any) lives on the ANCESTOR that first set an odd inset, not on every descendant that inherits it. |
| **(a) impossible-by-construction** , sr-only utility (visually-hidden a11y pattern) | **128** (10.4%) | `a.sr-only` (skip link) margin = -1px all sides; `label.sr-only` (form field label) margin = -1px all sides | Skip ALL properties when the element's className contains the token `sr-only`. This is the standard Tailwind visually-hidden recipe (`width:1px;height:1px;margin:-1px;overflow:hidden;clip:...`) , a deliberate, well-known a11y pattern, not a spacing decision. |
| **(a) impossible-by-construction** , flex/grid computed width fraction | **25** (2.0%) | homepage category grid item `a.group` width=101px (aspect-ratio grid cell, computed by `grid-template-columns`); carousel card `a.group` width=165px (`w-[44vw] max-w-[200px]`, a viewport-percentage literal) | Skip WIDTH when the parent's `display` is `flex`/`grid`/`inline-flex`/`inline-grid` AND the element's own className has no explicit fixed-width utility (no `w-[NNpx]` or bare `w-N` token; `w-full`, `w-1/2`, `w-[44vw]`, `w-auto` don't count as "fixed"). The layout algorithm chose the number, nobody typed it. |
| **(b) content-derived** , height with no explicit height-setting class | **107** (8.7%, of the post-fractional-exclusion pool) | rating row `span.inline-flex` height=21px (line-height driven); modal wrapper `div.relative` height=250px (fits its content) | Skip HEIGHT unless the element's own className sets an explicit height (`h-[NNpx]`, bare `h-N`, or a `min-h-*`/`aspect-*` combined with a fixed width). `height:auto` (the default, i.e. no `h-*` class) is BY DEFINITION never an authored literal , the existing checker's `isLeaf` heuristic is too narrow (it only exempts elements with zero children, missing every text row that wraps one inline icon/span). This also avoids double-counting: several of these "height" symptoms are downstream of a padding value that's already flagged separately (see defect #2 below , the badge's `py-[3px]` IS the real defect, its derived `height=17px` is not a second one). |
| **(a) impossible-by-construction** , `position:absolute` width computed from `left`+`right` insets | **7** (0.6%) | card hover CTA bar `div.absolute` width=149px (`absolute bottom-2 left-2 right-2` , width = container width minus 16px, not a literal) | Skip WIDTH when `position:absolute` and both `left` and `right` are set (non-`auto`). The number is `containingBlockWidth - leftInset - rightInset`, never typed directly. |
| **(a) impossible-by-construction** , shrink-to-fit inline element | **1** (0.1%, after the rules above) | CTA button width computed from padding + label text, no `w-*` class | Skip WIDTH when the element's own `display` starts with `inline` (inline-flex/inline-block/inline-grid) and it has no explicit fixed-width class , width is intrinsic to content (icon + label + padding), not authored. |
| **(e) GENUINE** , hand-authored, non-4-multiple, could easily be fixed | **191** (15.5%) | see THE DEFECT LIST (section 4) | none , these are the actual candidates a human should look at. |

Waterfall (rules applied in this order, each line shows what THAT rule alone
removes from what's left after the ones above it):

```
START                                                     1233
R1  fractional width/height                       -566 -> 667
R2  sr-only element (any property)                -128 -> 539
R3  width == parent content width (full-bleed)     -208 -> 331
R4  flex/grid computed width, no explicit w- class  -25 -> 306
R5  height, no explicit h- class                   -107 -> 199
R6  position:absolute, left+right insets             -7 -> 192
R7  inline-* shrink-to-fit width, no explicit class  -1 -> 191
REMAINDER (genuine candidates)                            191
```

---

## 3. Broken-axis class table

| class | count | 2 example pairs | exclude rule |
|---|---|---|---|
| **(a) sub-pixel rounding** , siblings inside a fractional-width `aspect-[]` image box | **116** (73.0%) | SalonCard photo `div.relative.aspect-[5/4]` , 5 edge/delta combos × 19 cards = 95 hits (right/top/left off by 1-3px between the image, the gradient overlay, and the badge overlay, all nominally `inset-0`); Entdecken TikTok-style card `div.relative.aspect-[9/16]` , 3 combos × 7 cards = 21 hits | Skip the sibling-pair comparison when the shared PARENT's own `rect.width` (or height) has a nonzero fractional part (the same fractional-value signal as off-grid Rule 1). An `aspect-[5/4]` box on a 375px-cascade width is guaranteed to render at a fractional pixel size; two `inset-0` children of that box round to the device-pixel grid independently and can legitimately land 1-3px apart with zero authoring error involved. |
| **(b) checker blind spot, NOT a bug** , `align-items: baseline` parent | **19** (11.9%) | SalonCard price/rating row `div.flex.items-baseline.gap-2` (`app/[locale]/_components/homepage/SalonCard.tsx:463`) , top edges differ by 1.25px because that's what baseline alignment of two differently-sized text runs IS SUPPOSED to do | Skip top-edge comparisons entirely when the parent's computed `align-items` is `baseline`. The checker currently has no concept of baseline alignment; it reads "tops differ by 1px" as a near-miss when the design intent is explicitly "tops should NOT match, baselines should." |
| **(a) deliberate exception** , comparing a `sr-only` element against a real sibling | **15** (9.4%) | skip-link `a.sr-only` vs `header.sticky` (left/top off by 1px); footer newsletter `label.sr-only` vs the visible `#footer-newsletter-email` input (left/top off by 1px) | Skip the pair entirely when EITHER side has the `sr-only` class , same reasoning as off-grid's sr-only rule; comparing a 1px×1px clipped element's position to a real element's position is meaningless. |
| **(b) intentional optical offset (lib/optical.ts), checked for but NOT found in this dataset** | **0 confirmed** | n/a | `lib/optical.ts`'s `opticalGlyphNudge()` (commit d2f349260) is used at `Entdecken.tsx:269` and `SolenStory.tsx:128` (Play icon `marginLeft` nudge) and `Avatar.tsx:64` via `opticalCircleSize` (used with `opticalOvershoot` only at `components-legacy/booking/PayConfirmStep.tsx:372`). None of these sit inside a 2-12-child flex row with a SIBLING to compare against on the 3 scanned routes (the Play icon is the sole child of its centering wrapper; the overshot Avatar's call site isn't on `/de`, `/de/salon/old-town-barbers`, or `/de/booking/lookup`) , so this exception class exists in the codebase but structurally cannot produce a broken-axis false positive on THIS route set. Flag it for when a route containing `PayConfirmStep` (the booking pay-confirm step) gets scanned: expect a ~1-2px sibling-width delta on the staff avatar row, and exclude any pair where one side traces to an `Avatar` rendered with `opticalOvershoot`. |
| **(d) GENUINE near-miss, LOW confidence** , icon-vs-text row, sub-3px | **9** (5.7%) | filter/date button `span.flex` (icon slot) vs `span.font-body` (text slot) inside `SearchBar.tsx`'s `h-[46px]` button, top off by 1.5px, 3 instances; empty-state icon+paragraph `span.mt-0.5.h-5.w-5` vs `span.leading-relaxed`, top off by 2px, 2 instances | No safe blanket exclusion found , these are the closest thing to "class (d)" in the whole dataset, but every one is a SINGLE occurrence (not a repeated pattern) and every one is an icon-box-center vs text-line-box-center comparison, which structurally differs by 1-3px even when both are intentionally "centered" by two different CSS mechanisms. Recommend: human eyeball check on these 4 specific pairs (they're listed in the file), not an automated rule , at n=1 each, a global exclusion rule risks hiding a REAL future misalignment of the same shape. |

Waterfall:

```
START                                                     159
sub-pixel rounding inside fractional aspect-[] box      -116 -> 43
align-items: baseline parent                             -19 -> 24
sr-only vs real sibling                                  -15 -> 9
REMAINDER (low-confidence residual, all n=1)                    9
```

---

## 4. THE DEFECT LIST (ranked by blast radius)

Ranked shared-component/primitive first (one fix, many screens) down to
one-off pages. Counts are raw off-grid line-hits on the 3 scanned routes;
"sitewide" notes where the SAME literal recurs in other files (found by
grep), which is the real blast-radius signal , a lot of these aren't typos,
they're a shadow spacing habit that never made it into the 4pt scale.

| # | file:line | literal | fix | raw hits (this scan) | sitewide |
|---|---|---|---|---|---|
| 1 | `app/[locale]/_components/homepage/SalonCard.tsx:462` | `mt-[10px] px-[2px] gap-[2px]` | `mt-[10px]` -> `mt-2` (8px) or `mt-3` (12px); `px-[2px]` -> `px-0` or accept as a hairline-scale exception (see note) | 57 (marginTop×19, paddingRight×19, paddingLeft×19) | SalonCard renders on every listing/carousel across the whole site , this is the single highest-blast-radius fix available |
| 2 | `app/[locale]/_components/primitives/Avatar.tsx:92` | count-badge pill `px-1.5 py-px` (paddingTop/Bottom=1px, paddingRight/Left=6px) | `py-px` (1px) -> `py-0.5` (2px, still not 4-multiple but closer) is a stopgap; real fix is redesigning the badge box to a fixed `h-*`/`w-*` pill instead of padding-driven sizing | 12 | `Avatar` is a shared PRIMITIVE (per LOCKFILE, avatar sizing is a locked reference point) , every screen using a team/staff avatar with a count badge inherits this |
| 3 | `app/[locale]/_components/salon/SalonServices.tsx:225` (+7 more files) | `px-5 py-[18px]` service-row padding | `py-[18px]` -> `py-4` (16px) or `py-5` (20px) | 10 (paddingTop×5, paddingBottom×5, this route only) | **`py-[18px]` appears in 8 files sitewide**: `SalonServicesSheet.tsx:264`, `TextInput.tsx:39` (the shared input PRIMITIVE's `lg` size variant), `SalonWalkInPanel.tsx:166,195`, `ServicesStaffStep.tsx:459`, `StaffProfilePage.tsx:345`. This is a de-facto "18px" token that's crept into a primitive and 5 other components independently , worth fixing as one design-system decision (pick 16 or 20), not 8 file edits. |
| 4 | `app/[locale]/_components/homepage/Entdecken.tsx:337` | photo-count badge `px-2.5 py-[3px]` (bg-black/55 pill) | `px-2.5` (10px) -> `px-2` (8px) or `px-3` (12px); `py-[3px]` -> `py-0.5` (2px) or `py-1` (4px) | 28 (paddingTop×7, paddingRight×7, paddingBottom×7, paddingLeft×7) | Entdecken renders on `/de` only in this scan, single source |
| 5 | `app/[locale]/_components/homepage/Entdecken.tsx:304` | review-count pill `px-2.5 py-1` | `px-2.5` (10px) -> `px-2` or `px-3` | 14 (paddingRight×7, paddingLeft×7) | same file as #4, could be fixed together |
| 6 | `app/[locale]/_components/homepage/Hero.tsx:150` | hero wrapper `px-[18px] pt-10 pb-2` | `px-[18px]` -> `px-4` (16px) or `px-5` (20px) | 2 (paddingRight×1, paddingLeft×1) | This is the ROOT of the page's largest off-grid cascade cluster: every full-bleed descendant of the hero section inherits this 18px inset (already excluded from the count above as a symptom, not a separate defect) , fixing this ONE line removes an entire branch of downstream "impossible by construction" noise, even though it only shows as 2 raw hits itself. |
| 7 | `app/[locale]/_components/homepage/SearchBar.tsx:682` | filter button `rounded-[6px] h-[46px] px-[14px]` | `h-[46px]` -> `h-11` (44px) or `h-12` (48px); `px-[14px]` -> `px-3` (12px) or `px-4` (16px) | 9 (height×3, paddingRight×3, paddingLeft×3) | SearchBar is a shared component; check other call sites for the same button before fixing |
| 8 | `app/[locale]/_components/salon/SalonHero.tsx:156` | carousel dot `h-[6px] w-[6px]` (+ active dot `h-[6px] w-[18px]`, same block) | Likely intentional micro-decorative sizing (see note below) , recommend NOT auto-fixing, flag for a taste call instead | 6 (width×5 inactive dots, width×1 active pill) | single file |
| 9 | `app/[locale]/_components/salon/SalonOpeningTimes.tsx:34` | `mt-4 space-y-2.5` (10px row rhythm) | `space-y-2.5` -> `space-y-2` (8px) or `space-y-3` (12px) | 5 (marginTop×5) | single file on this route; `space-y-2.5` recurs sitewide (10 total files via grep) as a shadow rhythm token, same shape as #3 |
| 10 | `app/[locale]/booking/lookup/page.tsx:237` | form label `mb-[7px]` | `mb-[7px]` -> `mb-1.5` (6px) or `mb-2` (8px) | 2 | Same `mb-[7px]` literal also in `booking/resend-link/page.tsx:233` and `GuestBookingForm.tsx:135,170,216` (component shared across booking flows) |
| 11 | `app/[locale]/booking/lookup/page.tsx:329,379,470` | `mt-[18px]` spacer | `mt-[18px]` -> `mt-4` (16px) or `mt-5` (20px) | 3 | **`mt-[18px]` recurs 20+ times sitewide** (`booking/resend-link/page.tsx` x9, `rewards/RewardsView.tsx` x3, `refund/*` x5, `queue/[token]/page.tsx`, `EmptyStateDiscovery.tsx`, `discovery/DetailPage.tsx`). This is the single most-repeated shadow spacing value in the codebase , worth a design-system decision (is 18px actually wanted between 16 and 20? if so, name and lock it; if not, sweep it) rather than a one-line fix. |

Long tail (12 more single-occurrence findings, each 1-4 raw hits, not
independently ranked): a `rounded-[14px] bg-s-bg-sunken px-3.5 py-3.5` info
box, a sheet header `px-4 pb-2.5 pt-[15px]`, several `bg-s-ink` CTA buttons
sharing `px-7 py-3.5` (SalonAppCta.tsx:70, BusinessTeaser.tsx:77, and 8 more
files via grep , same "Tailwind's `.5` scale isn't 4pt" root cause as #3/#11,
just lower per-route count), and one `w-[38px] h-[38px]` icon-button size
used in 7 files sitewide (SalonHero, DashboardLayout command-palette trigger,
onboarding icon chips, BookingCard) , all listed in the raw JSON, all fixable
by the same "round to nearest 4pt neighbor" move, none individually worth a
table row at n=1-2 on this route set.

**Note on #8 (carousel dots) and generally**: several "genuine" findings are
6-7px circular/pill micro-glyphs (dots, indicator pips). These ARE
hand-authored non-4-multiples that could technically be "fixed" to 8px, but
8px would visibly fatten a deliberately subtle indicator. This is a taste
call, not a mechanical grid violation , flagging it here rather than silently
auto-including or auto-excluding it.

---

## 5. Exclusion rules to implement (concrete, estimated post-exclusion counts)

Off-grid, in the order that gives the cleanest waterfall (numbers are what
REMAINS after each rule, cumulative):

1. **Fractional value**: `Math.abs(value - Math.round(value)) > 0.001` on
   WIDTH/HEIGHT only. -> removes 566, remaining **667**.
2. **`sr-only` class present** (any property, any element with that class in
   its own className): -> removes 128, remaining **539**.
3. **Width within 1px of parent's content-box width**
   (`parent.clientWidth - parent.paddingLeft - parent.paddingRight`): ->
   removes 208, remaining **331**.
4. **Width, parent `display` is flex/grid/inline-flex/inline-grid, AND no
   explicit fixed-width class on the element** (regex for `w-[NNpx]` or bare
   `w-N`, excluding `w-full`/`w-auto`/`w-N/M`/`w-[NNvw]`/`w-[NN%]`): ->
   removes 25, remaining **306**.
5. **Height, no explicit height-setting class on the element** (`h-[NNpx]` or
   bare `h-N`, or `min-h-*`/`aspect-*` combined with a fixed width): ->
   removes 107, remaining **199**.
6. **Width, `position: absolute` with both `left` and `right` set
   (non-`auto`)**: -> removes 7, remaining **192**.
7. **Width, own `display` starts with `inline` (inline-flex/inline-block/
   inline-grid), no explicit fixed-width class**: -> removes 1, remaining
   **191 (final)**.

Broken-axis, in order:

1. **Parent's own rect has a fractional width or height**: -> removes 116,
   remaining **43**.
2. **Parent's `align-items` computed style is `baseline`**: -> removes 19,
   remaining **24**.
3. **Either sibling has the `sr-only` class**: -> removes 15, remaining
   **9 (final, low-confidence residual)**.

With these 10 rules coded into the checker, a clean re-run should report
**~191 off-grid findings (from 1233) and ~9-24 broken-axis findings (from
159)**, both small enough that a human can actually read the report top to
bottom , which was the whole point of this pass. Given the off-grid remainder
collapses to ~15 unique file:line root causes (many repeating sitewide),
consider ALSO deduplicating the report by `(property, value, first-class-
token)` before shipping the next round, the same way this triage did by hand
, 191 lines of raw output is still 13x noisier than the 15 things a human
actually needs to look at.

---

## 6. What stays genuinely un-checkable (human diagnosis walk)

- **Micro-decorative sizing intent** (carousel dots at 6px, active-dot pills
  at 18px wide/6px tall): the checker can flag "not a 4-multiple" but cannot
  know whether 6px-vs-8px is a deliberate subtlety call. Needs the taste
  walk, not a rule.
- **Shadow spacing tokens** (`py-[18px]`, `mt-[18px]`, `space-y-2.5`,
  `.5`-suffixed Tailwind classes generally): the checker correctly flags each
  INSTANCE, but "should 18px become a real, named, locked design-system
  token instead of being swept to 16/20 everywhere" is a design decision
  above what a geometry script can decide. Section 4's ranking surfaces WHERE
  this recurs; a human (or the design-system owner) still has to pick the
  answer.
- **Icon-vs-text sub-3px near-misses** (section 3's residual 9): each is a
  genuine geometric near-miss, but distinguishing "two different valid
  centering mechanisms living 1-2px apart" from "someone eyeballed this and
  it's actually wrong" needs a rendered side-by-side look, not a numeric
  threshold , that's exactly what the (d) "GENUINE near-miss" bucket in the
  brief predicted would be the hard remainder.
- **`lib/optical.ts` intentional offsets on unscanned routes**: confirmed by
  code reading (not by data, since none appear on these 3 routes) that
  `Avatar`'s `opticalOvershoot` (used in the booking pay-confirm step) and
  the `Play`-icon nudge will eventually intersect a broken-axis or off-grid
  scan of a wider route set. The exclusion needs to trace back to whether an
  element's sizing/margin came from `lib/optical.ts`'s two exported
  functions , that provenance isn't visible from computed styles alone (the
  nudge is baked into an inline `style` attribute's px value by the time the
  DOM renders), so a future wider sweep will need either a `data-optical`
  marker on those elements or a maintained allowlist of their selectors.
- **Whether 191 remaining off-grid literals are worth fixing at all**: some
  (SalonCard's `mt-[10px]`, the Hero `px-[18px]` root) clearly are, given
  their blast radius. Others (a single `mb-[7px]` on one label) cost more
  developer time to hunt down and fix than the visual deviation is worth.
  Triage got this to a short, readable list; deciding WHICH of the 15 root
  causes justify a PR is a product/design-system prioritization call, not
  something this script (or this triage) should auto-decide.
