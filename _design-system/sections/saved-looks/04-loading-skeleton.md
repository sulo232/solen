# The loading skeleton, and what the JSON actually measured

**Reference:** `_measured/saved-looks.json` band 0, `/de/inspo/saved` at 390x844, signed in,
2026-08-27. **This is the only file in this folder backed by a render measurement**, and that is the
finding rather than a convenience: the capture caught the screen in its loading state.
**Component:** `components-legacy/discovery/DiscoveryGridSkeleton.tsx`, rendered from
`app/[locale]/inspo/saved/page.tsx:76-77` while `GET /api/discovery/saves?limit=60` is in flight.
**Layer:** 1 chrome.

## Layout

```
   0 +--------------------------------------------------+
  16 |  (<-)  Gespeichert                               |   the header row, 01-header-row.md
  68 +--------------------------------------------------+
     |  +--------------+  +--------------+              |   12 tiles, 196 wide
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

Band 0, verbatim:

| axis | value |
|---|---|
| tag | `main`, class `isolate pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-[env(safe-area-inset-bottom)]` |
| box | top 0, left 0, 390 x 2019 |
| background | transparent |
| padding | 0px 0px 56px |
| images | **0**, area 0 |

One text role, the header row's title, specified in `01-header-row.md`.

Card anatomy, one entry:

| radius | shadow | border | background | padding | count | example |
|---|---|---|---|---|---|---|
| 16 | none | none | `rgba(0, 0, 0, 0)` | 0 | **12** | **196x261** |

**Those two numbers are what prove the capture is the skeleton**, and the full four-check proof is
in this folder's README. In short: 12 is `RATIOS.length`; 196 is the skeleton's column width
(its `-mx-4 px-1.5` wrapper widens the track, so (390 - 12 + 32 - 12 - 6) / 2 = 196) against the
real grid's 186; 261 is 196 x 4/3, which is `RATIOS[0]`; and a gradient tile reports a transparent
`backgroundColor` and contributes nothing to the image area, while a real `ItemCard` photo frame is
`bg-s-bg-sunken` and holds an `<img>`.

The `h-3` shimmer bar under each tile does not appear in the card list because `cardAnatomy` skips
anything under 32px tall, which is consistent with the same reading.

## Tokens

- Shimmer: `bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken bg-[length:200%_100%]
  animate-shimmer`, the `Skeleton` primitive's own tokens rather than a second recipe
- `prefers-reduced-motion` is handled globally in `globals.css`
- Radius `rounded-2xl` (16px), matching the real card frame

## Interaction

None. The block is `aria-hidden="true"` (`DiscoveryGridSkeleton.tsx:26`) and holds no control.

## Intentional deviations

- **It shape-matches rather than spinning.** The component's own header records that it used to be
  an empty `<div/>` stub that flashed blank. The design contract's states row asks for a `Skeleton`
  whose shape matches the final layout, never a bare spinner, and this is that.
- **It uses varied ratios on purpose** so it reads as the Pinterest masonry rather than a rigid
  grid, which is the density floor's "loading derives from the populated layout" applied literally.
- **Its wrapper is 10px wider per column than the grid it stands in for.** `-mx-4 px-1.5` on the
  skeleton against `-mx-0 px-1.5` on the real grid gives 196 versus 186, so real looks swap in
  5px narrower per column than the placeholder that preceded them. That is a small layout jump in
  the one component whose stated purpose is that "real looks swap in without a layout jump". It is
  also what made the capture diagnosable, so it is recorded here as a finding rather than hidden.

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

**One thing this file cannot say: why the fetch had not resolved.** `settled: true` in the record is
true and beside the point, because the settle sampler tracks text count, largest font and image
area, all constant while a shimmer animates, so a stable skeleton reads as a settled page. The two
candidates are a slow `/api/discovery/saves` on a cold dev server and a request that never resolved,
and this capture cannot separate them. The test that settles it: rerun `measure-sections.mjs` with
the server warm and log that one endpoint's response time.

## Provenance

- The component's own header: it was an empty stub, the blank flash was the reason it was built
- Design contract states row, loading = `<Skeleton>` whose shape matches the final layout
- V3-D412, the 6px gutters it inherits from `MasonryGrid`
