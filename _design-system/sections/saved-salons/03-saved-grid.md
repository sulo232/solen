# The saved-salon grid and its card

**Reference:** `_measured/saved-salons.json` bands 2, 3 and 5, `/de/profile/favorites` at 390x844,
signed in, 2026-08-27.
**Component:** `app/[locale]/_components/profile/FavoritesList.tsx:101-107`. The item is
`components-legacy/SalonCard.tsx`, **not** the registry's `homepage/SalonCard.tsx`; see Intentional
deviations.
**Layer:** 2. The item is a shared component, composed rather than hand-drawn, so FLOORS LAW 9 is
satisfied in the letter. Which shared component it is, is the finding.

## Layout

```
 144 +--------------------------------------------------+  card 1, 358 x 388
     |                                            [ v ] |  heart, absolute top-1 right-1
     |            photo, 358 x 286, 5/4, radius 16      |
     |                                                  |
 430 +--------------------------------------------------+
     |  14px pad                                        |
 444 |  Old Town Barbers               * 4.3 ( 12 )     |  name 15/400, rating 14/600, count 12/400
 468 |  Barbershop Grossbasel                           |  meta 14/400 #6B6B6B
     |  CHF 65                                          |  price 14/400 #6B6B6B, tabular
 532 +--------------------------------------------------+
       gap-4, 16px
 548 +--------------------------------------------------+  card 2, identical anatomy
 848 |  Muse Beauty Studio             * 4.2 ( 11 )     |
 936 +--------------------------------------------------+   (fold at 844, so card 2 is cropped)
```

`grid grid-cols-1 sm:grid-cols-2 gap-4`. One column on mobile, two from `sm`. The whole card is the
tap target; the heart is the only other control on it.

## Measured

**Band 2**, the grid:

| axis | value |
|---|---|
| tag | `section`, class `mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4` |
| box | top 144, left 16, 358 x 793 |
| background | transparent |
| images | 2, total area 205,056 px |

**Bands 3 and 5** are the same element twice, the name-plus-rating row inside each card
(`div.flex items-start justify-between gap-2`, `SalonCard.tsx:301`): 326 x 24 at left 32, tops 444
and 848. 326 = 358 minus the card's 16px side padding twice. Their pitch, 848 - 444 = 404, equals
the card height 388 plus the 16px grid gap, so the two cards are exactly uniform.

**Card anatomy**, two entries, both count 2, so one of each per card:

| radius | shadow | border | background | padding | size |
|---|---|---|---|---|---|
| 16 | `rgba(50,47,44,0.04) 0 1px 3px, rgba(50,47,44,0.03) 0 1px 2px` | none | `rgb(255,255,255)` | 0 | 358x388 |
| 16 | none | none | transparent | 0 | 358x286 |

The first is the card, white on white with the `shadow-whisper` recipe and no border, which is the
design contract's SalonCard row exactly. The second is the photo frame; 358 x 4/5 = 286.4, so the
measured 286 confirms `aspect-[5/4]` (`SalonCard.tsx:184`).

**Text roles inside the card**, from band 2:

| size | weight | family | colour | line-height | count | sample |
|---|---|---|---|---|---|---|
| 15 | 400 | Inter Tight | `rgb(10, 10, 10)` | 16.5 | 2 | "Old Town Barbers" |
| 14 | 600 | Inter | `rgb(10, 10, 10)` | 24 | 2 | "4.3" |
| 14 | 400 | Inter | `rgb(107, 107, 107)` | 20 | 4 | "Barbershop Grossbasel" |
| 12 | 400 | Inter | `rgb(107, 107, 107)` | 16 | 2 | "( 12 )" |

Four elements at 14/400 across two cards means two per card: the meta line
(`text-sm text-s-ink-2 leading-5`, `SalonCard.tsx:328`) and the price
(`text-sm text-s-ink-2 leading-5 tabular-nums`, `SalonCard.tsx:355`). Both grey, both weight 400.

The info block closes to the pixel: 388 - 286 = 102 = 14 top padding + 24 name row + 4 gap +
20 meta + 4 gap + 20 price + 16 bottom padding.

## Tokens

- Star `#FFC32B` `s-star` (V3-D200), rendered 14x14 (`w-3.5 h-3.5 fill-s-star`)
- Name `s-ink`; meta, price and review count `s-ink-2` `#6B6B6B`, measured `rgb(107, 107, 107)`
- Card: radius 16, `shadow-whisper`, no border, which is the locked SalonCard surface row
- Photo fallback for a salon with no `cover_photo_url`: `bg-s-bg-sunken` plus a category icon plus a
  15px `s-ink-2` initial (`SalonCard.tsx:196-206`), never a bare grey box

## Interaction

- Tap card: the salon PDP. No per-card "Buchen" button. `saved/CORPUS.md` settles it: 21 of 26 venue
  apps make the whole card the only tap target, and the PDP already owns the commit action via
  `SalonMobileBookBar`.
- Tap heart: optimistic removal, `DELETE /api/profile/favorites?salon_id=`, then a neutral toast
  with Undo that re-inserts the card at its original index and re-POSTs. On failure the card comes
  back and an error toast offers Retry (`FavoritesList.tsx:31-78`).
- The toast is deliberately neutral rather than a green check: nothing succeeded, a salon left the
  list. Icon is a `Heart` on `bg-s-bg-sunken text-s-ink-2`.

## Intentional deviations

- **This screen renders `components-legacy/SalonCard.tsx`, and the registry says it renders
  `homepage/SalonCard.tsx`.** `COMPONENT_REGISTRY.md:137` lists SalonCard at
  `app/[locale]/_components/homepage/SalonCard.tsx` and names "/favoriten" among its call sites.
  `FavoritesList.tsx:12` imports `@/components-legacy/SalonCard`, a separate 21KB file. Both files
  exist. Measured on the same day by the same tool, the two draw the same entity differently:

  | route | file | photo box | radius |
  |---|---|---|---|
  | `/de/profile/favorites` | `components-legacy/SalonCard.tsx` | 358x286, 5/4 | 16 |
  | `/de/basel/coiffeur` and `/de` | `homepage/SalonCard.tsx` | 231x185, 5/4 | 22 |

  The aspect agrees, the radius does not. This is the FLOORS LAW 8 case in its exact form: one
  entity, two implementations, and the registry row pointing at the wrong one. It has already cost
  once. The legacy card rendered the "ab" / "from" price wording unconditionally while the modern
  card has always guarded it, so this list advertised a starting price with no named offer attached,
  which Art. 13 PBV does not allow. Corrected 2026-08-16 (`SalonCard.tsx:344-357`), on the legacy
  file only, because the modern one never had the bug.
- **The heart persists on a saved item rather than becoming an X.** The corpus measured a real 23 to
  19 split in favour of the heart. It stays because `HeartButton` is the same object the customer
  tapped to get here, and switching glyphs on one screen is the FLOORS LAW 8 failure in miniature.

## Empty state

Not this file's. Zero favourites renders `EmptyStateDiscovery` (`05-empty-state.md`); removing the
last one in-session renders the thin inline fallback described in `02-count-line.md`.

## Against the floors

- **Imagery: PASS, and it is this band that carries it.** 205,056 px of photo across two images,
  both fully inside the 390x844 first viewport (image 1 spans 144 to 430, image 2 spans 548 to
  834), so 62.30% of the first screen is photographic against a 33% floor and a 34.66% ladder value.
  The `src` is `salons.cover_photo_url`, a data-driven source, which is how FLOORS LAW 2 asks the
  floor to be met, and the photo is the largest element of the card. The bottom nav's translucent
  bar sits over the last 58px of image 2; the floor does not net that out and neither does this
  reading.
- **Card emphasis: FAIL, measured.** FLOORS LAW 6 and V3-D442 ask for two anchors, the name larger
  at weight 600 and the price at 600 tabular, with card titles `s-ink` rather than grey. Measured,
  the name is 15/400 and the price is 14/400 in `#6B6B6B` grey. The only weight-600 text on the card
  is the rating value. So the loudest thing on a saved-salon card is the rating, not the salon.
- **Display anchor: FAIL.** The largest text on this band is the 15px name.
- **Density: FAIL on count, PASS on the scroll promise.** The floor asks for >= 4 content units in
  the first mobile viewport plus a visibly cropped next item. Measured: one whole card and one
  cropped card, because the account holds two favourites. `hierarchy-density-04` waives the count
  for a real thin list, and this list does not fabricate. What the waiver does not cover: at a 404px
  card pitch, four units need 1,616px, so no account of any size ever shows four in the first
  viewport at one column.
- **Type: 4 sizes on this band alone** (15, 14, 12, and 13 if the count line above it is included in
  the reading), all on the locked scale.
- **Elevation: 1 distinct shadow**, the whisper on the card, against a ladder that wants at least 2
  and measures 3 on the salon page. The card is white on a white page with a 4% shadow, which
  FLOORS LAW 4 names as the invalid case unless the photo edge carries the boundary. Here it does:
  the photo is flush to the card edge and is 286 of the card's 388 px, so the boundary is real for
  the top three quarters of the card and absent for the info block below it.

## Provenance

- Owner 2026-06-13, the heart must remove a favourite from this list
- CARD_REDESIGN_2026-07-13 C1, `aspect-square` to `aspect-[5/4]`, confirmed by the measured 358x286
- 2026-07-26 no-caps gate, Q26 caps removed from the card
- 2026-08-16, PBV Art. 13 correction on the legacy card's from-price wording
- `saved/CORPUS.md` sections 1 and 2: one column, photo-forward, keep the heart, no per-card commit
