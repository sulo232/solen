# The saved-salon grid

**Reference:** [Fresha, Favourites, iOS](https://mobbin.com/screens/9e1ed828-f7f4-4472-a1ec-cff44b33ce8c), the closest screen to the corpus skeleton (`CORPUS.md` section 1). **No measurement** of the Solen render exists; see this folder's `README.md`.
**Component:** `app/[locale]/_components/profile/FavoritesList.tsx:101-107`, item is `components-legacy/SalonCard.tsx`
**Layer:** 2. The item is a registered component, composed rather than hand-drawn, which is FLOORS LAW 9 satisfied.

## Layout

```
   grid-cols-1  (sm: grid-cols-2)  gap-4
   +--------------------------------------+
   |  photo, aspect-[5/4], radius 16      |   [heart] top-right
   |                                      |
   +--------------------------------------+
   |  Haarwerk Basel        * 4.8 (54)    |  name 15 / rating 14 semibold
   |  Coiffeur Gundeldingen               |  14 s-ink-2
   |  CHF 65                              |  price
   +--------------------------------------+
    padding 14px 16px 16px, gap 4
```

One column on mobile, two from `sm`. The whole card is the tap target; the heart is the only
other control on it.

## Measured
**not measured.**

Source literals, read from `SalonCard.tsx`, not measured:
- Photo: `aspect-[5/4]`, `rounded-[16px]` (line 184). The 5/4 came from CARD_REDESIGN_2026-07-13 C1, replacing `aspect-square`.
- Info block: `padding: 14px 16px 16px`, `gap-1` (line 305)
- Name: `font-heading text-s-ink text-[15px] leading-[1.1] truncate` (line 310)
- Rating: `text-sm font-semibold text-s-ink` with a 14x14 `fill-s-star` star, value and count both `tabular-nums`, count in `text-s-ink-2 font-normal text-xs` (lines 315-319)
- Meta line: `text-sm text-s-ink-2 leading-5 truncate`, category plus quartier, or quartier plus distance (line 328)
- Heart: absolute `top-1 right-1`, `p-2`, `rounded-full`, `active:scale-[0.92]` (line 225)

## Tokens
- Star `#FFC32B` `s-star` (V3-D200)
- Name `s-ink`, meta and review count `s-ink-2`
- Card radius 16 on the photo; the design contract's SalonCard row is photo + `shadow-whisper` + no border

## Interaction
- Tap card: the salon PDP. No per-card "Buchen" button, which the corpus settles: 21 of 26 venue apps make the whole card the only tap target, and the PDP already owns the commit action via `SalonMobileBookBar`.
- Tap heart: optimistic removal, `DELETE /api/profile/favorites?salon_id=...`, then a neutral toast with Undo that re-inserts the card at its original index and re-POSTs. On failure the card comes back and an error toast offers Retry (`FavoritesList.tsx:31-78`).
- The toast is deliberately neutral, not a green check: nothing succeeded, a salon left the list. Icon is a `Heart` on `bg-s-bg-sunken text-s-ink-2`.

## Intentional deviations
- The heart persists on the saved item rather than becoming an X. The corpus measured a real 23 to 19 split in favour of the heart and says the argument for the X is real (on a saved screen every item is saved, so the heart encodes nothing and its only job is removal). It stays because `HeartButton` is the same object the customer tapped to get here, and switching glyphs on one screen breaks FLOORS LAW 8.
- This screen renders `components-legacy/SalonCard.tsx`, the LEGACY card, not the modern one. That is the same-entity-two-implementations risk FLOORS LAW 8 names, and it has already cost once: the legacy card rendered the "ab" / "from" price wording unconditionally while the modern card has always guarded it, so this list advertised a starting price with no named offer attached, which Art. 13 PBV does not allow. Corrected 2026-08-16 (`SalonCard.tsx:340-344`).

## Empty state
Not this file's. Zero favourites renders `EmptyStateDiscovery` (`04-empty-state.md`); removing the
last one in-session renders the thin inline fallback described in `02-count-line.md`.

## Against the floors
- **Imagery: not measured, and this is the band that would carry it.** The photo is the largest element of the card and its `src` is `salons.cover_photo_url`, a data-driven source, which is how FLOORS LAW 2 asks the floor to be met. A card whose salon has no photo takes the sunken plus initial fallback (`SalonCard.tsx:202`, a 15px `s-ink-2` monogram), never a bare grey box.
- **Density floor: not measured.** The floor asks for >= 4 content units in the first mobile viewport plus a visibly cropped next item. At one column with a 5/4 photo plus a three-line info block, whether four units fit above 844px is exactly the kind of thing this folder cannot answer without a capture.
- **Display anchor: not measured.** The largest text authored on this band is the 15px name.
- Source-literal size count on this band alone: 15 (name), 14 (rating, meta), 12 (review count). Three sizes, all on the locked scale.

## Provenance
- Owner 2026-06-13, the heart must remove a favourite from this list
- CARD_REDESIGN_2026-07-13 C1, `aspect-square` to `aspect-[5/4]`
- 2026-07-26 no-caps gate, Q26 caps removed from the card
- 2026-08-16, PBV Art. 13 correction on the legacy card's from-price wording
- `CORPUS.md` sections 1 to 2, one column, photo-forward, keep the heart, no per-card commit button
