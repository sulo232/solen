# The masonry grid of saved looks

**Reference:** none. **This band never rendered in the 2026-08-27 capture**: the page was still
showing its loading skeleton, so every number below is a source literal read on 2026-08-27 and
labelled as such. See this folder's README for the proof and `04-loading-skeleton.md` for what was
measured instead.
**Component:** `app/[locale]/inspo/saved/page.tsx:98-123`, items are
`components-legacy/discovery/ItemCard.tsx` and `VideoCard.tsx` inside
`components-legacy/discovery/MasonryGrid.tsx`
**Layer:** 2. Composed from the discovery card set, so nothing here is hand-drawn. None of those
three components is in `COMPONENT_REGISTRY.md`; see Intentional deviations.

## Layout

```
   68  px-1.5
      +---------+  +---------+
      |  look   |  |  look   |     2 columns, gap 6px, CSS multi-column
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

**Not measured.** Source literals, verified for this file:

| element | literal | file:line |
|---|---|---|
| grid | `columns-2 md:columns-3 lg:columns-4 gap-1.5 [column-fill:balance]` | `MasonryGrid.tsx:22` |
| item wrapper | `mb-1.5 break-inside-avoid animate-in fade-in duration-300` | `MasonryGrid.tsx:24` |
| page wrapper | `-mx-0 px-1.5` | `page.tsx:98` |
| photo frame | `relative w-full overflow-hidden rounded-2xl bg-s-bg-sunken`, `aspectRatio` from natural size, default `9 / 16` | `ItemCard.tsx:42,54-57` |
| heart | `absolute right-1 top-1`, `LikeButton` at `h-11 w-11` hit with a 28px visible disc | `ItemCard.tsx:93`, `LikeButton.tsx:101,117` |
| style chip | `absolute bottom-1.5 left-1.5 max-w-[80%] truncate rounded-full bg-white/90 px-2 py-0.5 text-[12px] font-medium text-s-ink shadow-elevation-1` | `ItemCard.tsx:107` |
| play button (tiktok) | `h-10 w-10 rounded-full bg-white/85 shadow-elevation-2`, `Play size={15}` optically nudged | `ItemCard.tsx:80-81` |
| creator line | `mt-1.5 flex items-center gap-1 font-body text-[12px] font-normal text-s-ink-2`, with a 12px `Store` glyph for salon items | `ItemCard.tsx:116-117` |
| card signals | `mt-1 flex flex-wrap gap-x-2 gap-y-1`, each `text-[12px]`, review count in `text-s-accent` | `CardSignals.tsx:32-48` |

**Derived column width: 186px.** The page wrapper is `-mx-0 px-1.5` at a 390 viewport, so
(390 - 12 - 6) / 2 = 186. That number is the discriminator this folder's README uses to prove the
capture showed the skeleton, whose wrapper adds `-mx-4` and therefore measures 196.

## Tokens

- Photo frame `rounded-2xl` (16px) on `bg-s-bg-sunken`, so a tile with a slow or missing image is a
  sunken placeholder rather than a bare grey box
- Chip `bg-white/90` with `shadow-elevation-1`, ink text at weight 500
- Creator `s-ink-2` `#6B6B6B` at 400, the shared CardMeta recipe
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
- **None of the three components is registered.** `ItemCard`, `VideoCard`, `MasonryGrid`,
  `LikeButton` and `DiscoveryGridSkeleton` return zero hits in `COMPONENT_REGISTRY.md`. They are
  shared components, so this screen is composed rather than hand-drawn and FLOORS LAW 9 is satisfied
  in substance. What is missing is the registry row, which means nothing checks that a second screen
  reusing a look card gets the same anatomy. That is the same class of gap that let two salon cards
  exist, and it is recorded here rather than fixed.
- **No Undo on unsave**, against the salon list's Undo toast. One product, two saved screens, two
  answers to "I tapped that by mistake".

## Empty state

Not this file's. Zero saves renders the inline block at `page.tsx:86-96`, specified in
`03-empty-state.md`. While the fetch is in flight the screen renders `DiscoveryGridSkeleton`,
specified in `04-loading-skeleton.md`.

## Against the floors

- **Imagery: PASS by content, unmeasured in fact.** Populated, this band is a wall of photographs
  with 6px gutters and no chrome, the highest photographic share of any screen in the product, and
  every `src` comes from the item's own record (`ItemCard.tsx:45-47`), never a baked-in path. The 0%
  in the JSON is the skeleton. The exact share is not measured.
- **Density: not measured.** The floor asks for >= 4 content units in the first mobile viewport plus
  a cropped next item. At 186px columns and the default 9/16 ratio a tile is 331px tall, so four
  tiles across two columns occupy 668px plus their creator lines, so the floor is structurally
  easy here and the RICH-DATA CEILING is the live risk instead:
  the endpoint requests `limit=60` and renders all of them inline with no cap and no grouping, and
  `hierarchy-density-03` caps an inline gallery at 12 behind a lightbox once real content passes
  roughly 3x the floor. At 60 items this band is already past that.
- **Type: 12px everywhere below the title.** The style chip, the creator line and every card signal
  are 12px, so the screen has an anchor at 22 and metadata at 12 and no body size at all. Two sizes,
  under the ceiling, and the EMPHASIS BUDGET clause (c) is the rule that applies rather than the size
  count.
- **Weight: the chip is 500 and the creator is 400**, so the populated band contributes no
  weight-600 text at all. On a screen whose only 600-plus element is the title, the bold share
  populated would be roughly 1 in (1 + 3 per card), which passes the 30% ceiling comfortably. Not
  measured.
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
