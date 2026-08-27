# The masonry grid of saved looks

**Reference:** none on this route. **This band has never been captured on `/de/inspo/saved`**, in the
2026-08-27 skeleton capture or in the 2026-08-27 re-take, because the seeded account
`kunde@solen.ch` has zero saved looks: `GET /api/discovery/saves?limit=60` returns 200 with
`{"items": []}`, measured live. Writing a save to the database is outside what I may do, so the
populated grid is a **blocker, not a finding**. See this folder's README.
**Component:** `app/[locale]/inspo/saved/page.tsx:98-123`, items are
`components-legacy/discovery/ItemCard.tsx` and `VideoCard.tsx` inside
`components-legacy/discovery/MasonryGrid.tsx`
**Layer:** 2. Composed from the discovery card set, so nothing here is hand-drawn. None of those
three components is in `COMPONENT_REGISTRY.md`; see Intentional deviations.

## How to read the numbers in this file

Three tiers, and every number below carries one:

- **source** the literal is read from the file named. It has never been rendered on this route.
- **probe** the real wrapper classes from `page.tsx:98` and `MasonryGrid.tsx:22,24` were rendered
  into the live `/de/inspo/saved` page, measured, and removed. This settles the geometry of the
  container. It does not measure a real card, because there is no real card to measure.
- **feed** measured on `/de/inspo`, where the same `MasonryGrid` and the same `ItemCard` render with
  real saved-item data at the **same 186px column width**. Different route, same components.

Nothing in this file is a measurement of a look card on `/de/inspo/saved`.

## CORRECTION, 2026-08-27

The previous version of this file called the 186px column width **derived**, from the arithmetic
(390 - 12 - 6) / 2. That arithmetic was right and it is now **probe-measured** at 186 on the live
route. The rest of the file was source literals and stays source literals, with one class string
corrected and two line citations tightened (see Measured).

## Layout

```
   68  px-1.5
      +---------+  +---------+
      |  look   |  |  look   |     2 columns, gutter 6px, CSS multi-column
      |  photo  |  |  photo  |     each tile takes its image's NATURAL aspect
      | [chip]  |  +---------+
      +---------+  |  look   |
      creator      |  photo  |
      +---------+  |         |
      |  look   |  +---------+
      ...          creator
```

`columns-2 md:columns-3 lg:columns-4 gap-1.5 [column-fill:balance]`, each item
`mb-1.5 break-inside-avoid`. Heights vary because each card self-measures its photo on load and sets
`aspectRatio` from the natural dimensions, defaulting to 9/16 before the image arrives.

## Measured

### Container geometry, probe

The real wrapper classes rendered into the real page at 390x844, then removed:

| axis | value |
|---|---|
| wrapper `-mx-0 px-1.5` | 390 wide |
| grid `columns-2 gap-1.5` | 378 wide |
| computed column-gap | 6px |
| one column | **186** |
| default 9/16 photo frame | 186 x **331**, radius 16px, background `rgb(244, 244, 245)` |
| tile including the creator line | 186 x 355 |

### Card anatomy, feed

Six real `ItemCard`s measured on `/de/inspo` at the identical 186px column width:

| element | measured | note |
|---|---|---|
| photo frame | 186 wide, 270 to 331 tall | radius `16px`, background `rgb(244, 244, 245)` |
| tile outer | 186 x 316 to 377 | frame plus 6px gap plus the 18px creator line |
| heart hit area | **44 x 44** | clears the touch-target floor the screen's own back tile misses |
| style chip | 45 to 109 wide, 22 tall | 12px / weight 500 |
| creator line | 186 x 18 | 12px / weight 400, `rgb(107, 107, 107)` |
| photo `src` | `/_next/image?url=/api/discovery/thumb/...` | from the item's own record |

One of the six had no loaded image and rendered the frame on `rgb(244, 244, 245)`, which is the
spec'd sunken fallback rather than a bare grey box.

### Source literals

| element | literal | file:line |
|---|---|---|
| grid | `columns-2 md:columns-3 lg:columns-4 gap-1.5 [column-fill:balance]` | `MasonryGrid.tsx:22` |
| item wrapper | `mb-1.5 break-inside-avoid animate-in fade-in duration-300` | `MasonryGrid.tsx:24` |
| page wrapper | `-mx-0 px-1.5` | `page.tsx:98` |
| photo frame | `relative w-full overflow-hidden rounded-2xl bg-s-bg-sunken` | `ItemCard.tsx:55` |
| frame ratio | `aspectRatio` from natural size, default `9 / 16` | `ItemCard.tsx:42,56` |
| heart | `absolute right-1 top-1` wrapper, `LikeButton` `grid h-11 w-11` hit with a `h-7 w-7` visible disc | `ItemCard.tsx:93`, `LikeButton.tsx:101,117` |
| style chip | `absolute bottom-1.5 left-1.5 max-w-[80%] truncate rounded-full bg-white/90 px-2 py-0.5 text-[12px] font-medium text-s-ink shadow-elevation-1 backdrop-blur-[2px]` | `ItemCard.tsx:107` |
| play button (tiktok) | `grid h-10 w-10 place-items-center rounded-full bg-white/85 shadow-elevation-2 backdrop-blur-[2px]`, `Play size={15}` optically nudged | `ItemCard.tsx:80-81` |
| creator line | `mt-1.5 flex items-center gap-1 font-body text-[12px] font-normal text-s-ink-2`, with a 12px `Store` glyph for salon items | `ItemCard.tsx:116-117` |
| card signals | `mt-1 flex flex-wrap items-center gap-x-2 gap-y-1`, each `text-[12px]`, review count in `text-s-accent`, availability at weight 500 | `CardSignals.tsx:32-47` |

**Two corrections to the literals in the previous version**, both mine to own: the card-signals class
was written as `mt-1 flex flex-wrap gap-x-2 gap-y-1`, dropping `items-center`, and the photo-frame
citation `ItemCard.tsx:42,54-57` pointed at a range rather than the two lines that carry it (42 for
the default ratio, 55 for the classes, 56 for the applied `aspectRatio`).

## Tokens

- Photo frame `rounded-2xl` (16px, measured 16px on the feed) on `bg-s-bg-sunken` (measured
  `rgb(244, 244, 245)`), so a tile with a slow or missing image is a sunken placeholder rather than a
  bare grey box
- Chip `bg-white/90` with `shadow-elevation-1`, ink text at weight 500
- Creator `s-ink-2` `#6B6B6B`, measured `rgb(107, 107, 107)`, at 400, the shared CardMeta recipe
- `CardSignals` review count `s-accent`, which is the small-tappable-metadata case the design
  contract allows for blue

## Interaction

- Tap a look: `/{locale}/inspo/{id}`, or the salon PDP when the item is salon-sourced and has a slug
  (`page.tsx:38-44`).
- Tap the filled heart: unsave. The item is removed optimistically and restored on failure
  (`page.tsx:47-61`). **There is no Undo**, unlike the salon list, which offers one in a toast.
- Card press: `active:scale-[0.97]` at 80ms.

## Intentional deviations

- **Flat grid, no boards.** The named-collections layer (boards, `SaveToBoardSheet`, the boards grid
  on this route) was killed 2026-06-23 and is in the graveyard (`_design-system/REMOVED.md` line 33).
  Do not re-propose it without an owner yes.
- **None of the components is registered.** `ItemCard`, `VideoCard`, `MasonryGrid`, `LikeButton` and
  `DiscoveryGridSkeleton` return zero hits in `COMPONENT_REGISTRY.md` (grep control: the same grep
  finds `EmptyStateDiscovery` at row 70 of 112 rows). They are shared components, so this band is
  composed rather than hand-drawn and FLOORS LAW 9 is satisfied in substance. What is missing is the
  registry row, which means nothing checks that a second screen reusing a look card gets the same
  anatomy.
- **No Undo on unsave**, against the salon list's Undo toast. One product, two saved screens, two
  answers to "I tapped that by mistake".

## Empty state

Not this file's. Zero saves renders the inline block at `page.tsx:86-96`, specified in
`03-empty-state.md`, and that is the state both 2026-08-27 captures of this route were actually in.
While the fetch is in flight the screen renders `DiscoveryGridSkeleton`, specified in
`04-loading-skeleton.md`.

## Against the floors

- **Imagery: PASS by content, still unmeasured on this route.** Populated, this band is a wall of
  photographs with 6px gutters and no chrome, and every `src` comes from the item's own record
  (`ItemCard.tsx:45-47`), never a baked-in path. On the feed, where the same cards render, the photo
  frame is the largest element of every tile by a wide margin (186x270 to 186x331 out of a 316 to 377
  tall tile). The exact share on `/de/inspo/saved` is not measured and cannot be until an account has
  a saved look.
- **Density: not measured here.** The floor asks for >= 4 content units in the first mobile viewport
  plus a cropped next item. Probe geometry says a default 9/16 tile is 355 tall including its creator
  line, so two rows across two columns fill 710 of the 776px below the header, which puts four units
  and a cropped fifth inside the first viewport. That is arithmetic on a probe, not a render.
  The live risk is the opposite one: the endpoint requests `limit=60` and the page renders all of
  them inline with no cap and no grouping, while `hierarchy-density-03` caps an inline gallery at 12
  behind a lightbox once real content passes roughly 3x the floor.
- **Type: 12px everywhere below the title.** The style chip, the creator line and every card signal
  are 12px (feed-measured at 12px for the chip and the creator line), so the populated screen has an
  anchor at 22 and metadata at 12 and no body size at all. The EMPHASIS BUDGET clause (c) is the rule
  that applies rather than the size count.
- **Weight: the chip is 500 and the creator is 400** (both feed-measured), so the populated band
  contributes no weight-600 text at all. On a screen whose only 600-plus element is the title, the
  bold share populated would be roughly 1 in (1 + 2 or 3 per card), which passes the 30% ceiling
  comfortably. Not measured on this route.
- **Card titles: there are none.** A look card shows a photo, an optional style chip and a creator
  handle. No name, no price, no rating unless `CardSignals` has data. The two-anchor card rule does
  not apply to this entity and no rule in the system says what does.

## Provenance

- V3-D387 (2026-05-30), CSS-columns masonry, cards adopt the photo's natural aspect
- V3-D412, gutters tightened from 12px to 6px, owner: "make it dense like Pinterest"
- V3-D386, TikTok thumbnails route through `/api/discovery/thumb` for a fresh signed URL
- V3-D389, salon items show the studio name plus a store mark; TikTok items show the handle
- V3-D393, `CardSignals` renders nothing until real backend data exists, which is the
  no-fabrication rule applied to a card
