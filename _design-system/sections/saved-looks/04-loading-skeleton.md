# The loading skeleton, and the capture that mistook it for the screen

**Reference:** `_measured/saved-looks.json` band 0, `/de/inspo/saved` at 390x844, signed in,
2026-08-27. **That capture is SUPERSEDED** by `_measured/de-inspo-saved.json`, taken the same day
with the fixed tool. It is kept, and this file is kept, because the loading state is a real state and
that capture is the only measurement of it this folder has.
**Component:** `components-legacy/discovery/DiscoveryGridSkeleton.tsx`, rendered from
`app/[locale]/inspo/saved/page.tsx:76-77` while `GET /api/discovery/saves?limit=60` is in flight.
**Layer:** 1 chrome.

## CORRECTION, 2026-08-27

This file used to open by claiming, in bold, that it was **"the only file in this folder backed by a
render measurement"**. That is no longer true. `03-empty-state.md` is now backed by a render
measurement of the screen itself, and this file is backed by a render measurement of a placeholder.
Two more lines in it are corrected below: the screen totals it pointed at, and the open question
about why the fetch had not resolved, which is now answered with numbers.

## Layout

```
   0 +--------------------------------------------------+
  16 |  (<-)  Gespeichert                               |   the header row, 01-header-row.md
  68 +--------------------------------------------------+
     |  +--------------+  +--------------+              |   12 tiles, 196 wide on THIS route
     |  |   3 / 4      |  |    9 / 16    |              |   gradient shimmer, radius 16
     |  |   261 tall   |  |              |              |
     |  +--------------+  |              |              |
     |  ---- (label)      +--------------+              |   12px shimmer bar, w-2/3
     |  ...                                             |
2019 +--------------------------------------------------+
```

`columns-2 md:columns-3 lg:columns-4 gap-1.5 [column-fill:balance]`, twelve tiles with the ratios
3/4, 9/16, 1/1, 9/16, 4/5, 1/1, 3/4, 9/16, 9/16, 3/4, 1/1, 4/5, each followed by an `h-3 w-2/3`
shimmer bar standing in for the creator line.

## Measured

Band 0 of the superseded capture, verbatim:

| axis | value |
|---|---|
| tag | `main`, class `isolate pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-[env(safe-area-inset-bottom)]` |
| box | top 0, left 0, 390 x 2019 |
| background | transparent |
| padding | 0px 0px 56px |
| images | **0**, area 0 |

Card anatomy, one entry:

| radius | shadow | border | background | padding | count | example |
|---|---|---|---|---|---|---|
| 16 | none | none | `rgba(0, 0, 0, 0)` | 0 | **12** | **196x261** |

**Those two numbers are what proved the capture was the skeleton.** In short: 12 is `RATIOS.length`
(`DiscoveryGridSkeleton.tsx:13-17`); 196 is the skeleton's column width on this route; 261 is
196 x 4/3, which is `RATIOS[0]` of `"3 / 4"`; and a gradient tile reports a transparent
`backgroundColor` and contributes nothing to the image area, while a real `ItemCard` photo frame is
`bg-s-bg-sunken` and holds an `<img>`. The re-take's own numbers confirm each of those by contrast:
document height 900 rather than 2019, and zero cards of that shape anywhere.

The `h-3` shimmer bar under each tile does not appear in the card list because `cardAnatomy` skips
anything under 32px tall, which is consistent with the same reading.

### The 196 is this route's fault, not the component's

Measured live on `/de/inspo` on 2026-08-27, with 24 shimmer elements on screen and the skeleton up:
its tiles are **186 wide** (heights 266, 349, 204, which are 186 x 4/3, 186 x 16/9 and 186 x 1/1,
each plus the 18px shimmer bar and its gap). The same component measures 186 on the feed and 196 on
saved, and the reason is the container each one sits in:

| route | chain | column |
|---|---|---|
| `/de/inspo` | page container `max-w-7xl mx-auto px-4` (`inspo/page.tsx:469`), then the skeleton's own `-mx-4 px-1.5` | (390 - 12 - 6) / 2 = **186** |
| `/de/inspo/saved` | `<div className="px-1.5">` (`saved/page.tsx:77`), then the skeleton's own `-mx-4 px-1.5` | (390 - 12 + 32 - 12 - 6) / 2 = **196** |
| `/de/inspo/saved`, real grid | `-mx-0 px-1.5` (`saved/page.tsx:98`) | **186**, probe-measured |

The skeleton's `-mx-4` exists to cancel the feed page's `px-4` container. The saved page has no such
container, and wraps the skeleton in a `px-1.5` of its own instead, so the `-mx-4` cancels nothing
and over-widens each column by 10px. That is a small layout jump in the one component whose stated
purpose is that "real looks swap in without a layout jump". It is also what made the bad capture
diagnosable, so it is recorded as a finding rather than hidden.

## Tokens

- Shimmer: `bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken bg-[length:200%_100%]
  animate-shimmer`, the `Skeleton` primitive's own tokens rather than a second recipe
- `prefers-reduced-motion` is handled globally in `globals.css`
- Radius `rounded-2xl` (16px), matching the real card frame, which measured 16px on the feed

## Interaction

None. The block is `aria-hidden="true"` (`DiscoveryGridSkeleton.tsx:26`) and holds no control.

## Intentional deviations

- **It shape-matches rather than spinning.** The component's own header records that it used to be
  an empty `<div/>` stub that flashed blank. The design contract's states row asks for a `Skeleton`
  whose shape matches the final layout, never a bare spinner, and this is that.
- **It uses varied ratios on purpose** so it reads as the Pinterest masonry rather than a rigid grid.
- **Its wrapper is 10px wider per column than the grid it stands in for, on this route only.** See
  the table above.

## Empty state

Not applicable. This IS a transient state. It is replaced by the grid (`02-saved-grid.md`) or by the
empty block (`03-empty-state.md`) the moment the fetch settles, because `loaded` is set in a
`finally` and therefore flips on success and on failure alike (`page.tsx:31-33`).

## Against the floors

The floors grade a screen, not a placeholder, so this block is graded only on what a loading state
owes:

- **It derives from the populated layout: PASS**, two columns, the same gutters, the same radius,
  varied heights.
- **It is not a spinner: PASS.**
- **It is `aria-hidden`: PASS**, so a screen reader is not read twelve empty tiles.
- **Zero imagery and zero real numbers**, which is correct for a placeholder and is exactly why the
  screen totals in `saved-looks.json` cannot be read as a grade of this screen.

## The open question is closed

The previous version of this file ended with: "**One thing this file cannot say: why the fetch had
not resolved.**" It named two candidates, a slow `/api/discovery/saves` on a cold dev server and a
request that never resolved, and said the test that would settle it was a rerun with the server warm
plus that endpoint's response time. Both halves were run on 2026-08-27.

- **The request resolves.** `GET /api/discovery/saves?limit=60` returns **200** with body
  `{"items": []}`. The empty state that follows it renders only after `loaded` flips, so its presence
  in the re-take is itself proof the promise settled.
- **It is slow cold and fast warm.** From the browser's own resource timing on a fresh load of the
  route: **6553ms**, starting 5330ms after navigation. An immediate refetch of the same endpoint on
  the same page: **629ms**.

So the "never resolved" candidate is eliminated and the "slow on a cold dev server" candidate is
confirmed with a number. What that does NOT mean: 6553ms is a dev-server cold-start figure on one
machine, not a production latency, and I did not measure this endpoint anywhere but here.

## What the instrument does now

Commit `cc69b05c2` fixed the settle rule that produced the bad capture. The signature it watched was
text-leaf count, largest font size and loaded image area, all three of which a shimmer holds still,
so a stable skeleton read as a settled page. The loop now also counts visible elements whose class
matches `animate-pulse|animate-shimmer|skeleton` and refuses to return settled while any are on
screen; if the cap is reached with some still up, the record carries `skeletonBlocked: true` and the
count, so a placeholder capture can never again be read as a real one. The re-take of this route
reports `skeletonBlocked: false` and `skeletonElementsVisible: 0`.

Independent check of that counter, run here rather than taken on trust: on `/de/inspo` while the feed
was loading, `document.querySelectorAll('.animate-shimmer').length` returned **24**, which is the 12
tiles times the 2 shimmer blocks each one draws, matching the number the commit message reports for
the same measurement on this route.

## Provenance

- The component's own header: it was an empty stub, the blank flash was the reason it was built
- Design contract states row, loading = `<Skeleton>` whose shape matches the final layout
- V3-D412, the 6px gutters it inherits from `MasonryGrid`
- `cc69b05c2`, the settle-rule fix, and `_plans/DESIGN_CONSISTENCY_2026-08-27.md` lines 233 to 238,
  which record the same diagnosis before the fix landed
