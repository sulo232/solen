# The second saved surface, /de/inspo/saved

**Reference:** none captured. **No measurement**; see this folder's `README.md`.
**Component:** `app/[locale]/inspo/saved/page.tsx`, items are `components-legacy/discovery/ItemCard.tsx` and `VideoCard.tsx` inside `MasonryGrid.tsx`
**Layer:** 2, composed from the discovery card set.

## Why this file exists

The bottom tab bar's heart, labelled "saved", goes here and not to `/profile/favorites`
(`BottomNav.tsx:96`, `{ key: "saved", href: "/inspo/saved", labelKey: "saved", Icon: Heart }`). So
for a customer navigating by the tab bar, THIS is the saved screen. A spec of the saved archetype
that covered only `/profile/favorites` would describe the screen fewer people reach.

The entities differ: this one saves LOOKS from the Inspo feed, `/profile/favorites` saves SALONS.
Two entities can legitimately have two anatomies. What is not settled by that is the label: one
word, "saved", points at one of the two.

## Layout

```
   (o<)  Gespeichert                            back tile 40, h1 22/700
   [ masonry, 2 columns, px-1.5 ]
   +--------+  +--------+
   |  look  |  |  look  |                        ItemCard or VideoCard
   +--------+  |        |
   +--------+  +--------+
```

Its own back tile and its own body `<h1>`. It does not use the header title slot that
`/profile/favorites` uses, so the two saved screens carry their titles in different places.

## Measured
**not measured.**

Source literals, read from `inspo/saved/page.tsx`, not measured:
- Back tile `h-10 w-10 rounded-full border border-s-border`, glyph `ArrowLeft size={18} strokeWidth={1.9}` (lines 65-71, aria-label at 68)
- Title `font-heading text-[22px] font-bold tracking-[-0.02em] text-s-ink` (line 73), hardcoded German string "Gespeichert", not a translation key
- Grid wrapper `px-1.5`, `MasonryGrid`
- Page `min-h-screen bg-white pb-24`

## Tokens
- Title `s-ink`, back tile hairline `s-border` `#E4E4E7`
- The empty-state CTA is `bg-s-ink` with `text-[15px] font-bold text-white` on an `h-11` pill, the one commit action on the screen

## Interaction
- Tap a look: `/{locale}/inspo/{id}`, or the salon PDP when the item is a salon-sourced item with a slug.
- Tap the filled heart on a card: unsave. The item is removed optimistically and restored on failure. There is no Undo toast here, unlike the salon list, which does offer one.
- Back tile: `/{locale}/inspo`, a fixed destination, not history back.

## Intentional deviations
- Flat grid, no boards. The named-collections layer (boards, `SaveToBoardSheet`, the boards grid on this route) was killed 2026-06-23 and is in the graveyard (`_design-system/REMOVED.md` line 33). Do not re-propose it without an owner yes.
- The title and the empty-state copy are hardcoded German, not i18n keys, on a four-locale product.

## Empty state
`page.tsx:78-96`. A 14px `s-ink-2` line, "Tippe bei einem Look auf das Herz, um ihn hier zu
speichern.", plus an ink pill labelled "Inspo". Added 2026-08-11 (E1), because the screen
previously had a heading and one line of text with no control at all, so the only way out was the
bottom bar.

Two things this empty state does that its sibling on `/profile/favorites` does not: it uses the
informal "Tippe" while `EmptyStateDiscovery` uses the formal "Tippen Sie", and it carries no
imagery at all while the sibling carries a 220px photograph and a six-tile rail. `COPY_LAW.md`
holds the register rule (formal `Sie` in German), so the informal line is a copy defect on the
face of it. Recorded, not changed: it is a source file.

## Against the floors
- **Type budget, source literals: 22, 15, 14** on the empty state path, three sizes, all on the locked scale. The populated path's sizes live in `ItemCard` / `VideoCard` and are not read here.
- **Display anchor 22px authored**, against a >= 28px floor, unless the masonry photography is the focal, which the floor allows for a photo-led screen. Not measured.
- **Imagery:** the populated screen is nothing but photographs, so the floor is met by content. The EMPTY screen has zero imagery and zero real content, which is the case FLOORS LAW 2 and the empty-state anatomy both aim at, and it is the weaker of the product's two saved zero states.
- Everything measurable: not measured.

## Provenance
- Owner 2026-06-23, boards ditched, "the heart icon just saves, simple plain" (`REMOVED.md` line 33)
- Owner 2026-08-10, the bottom bar's heart is the saved destination (`BottomNav.tsx:71,96`)
- E1 2026-08-11, the empty state gained a way out
