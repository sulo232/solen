# Global header on /de/profile/favorites, the "Favoriten" title

**Reference:** no screenshot, and **no measurement**. `_measured/saved.json` measured a 404 page at a route that does not exist; see this folder's `README.md`.
**Component:** `app/[locale]/_components/layout/Header.tsx`, route-to-title map line 472: `/profile/favorites/?$` renders "Favoriten"; title slot line 804
**Layer:** 1 (chrome). Shared furniture, not owned by this screen.

## Layout

```
+--------------------------------------------------+
|  [back tile]  Favoriten                          |   sticky, py-5
+--------------------------------------------------+
   main starts: max-w-2xl mx-auto px-4 pt-4
```

The page renders no `<h1>` of its own. `favorites/page.tsx:77-78` says so in a comment: "Title
lives in the global header beside the back tile (owner, 2026-06-11)". So on this screen the
header title is the only page title there is, which is a stronger dependency than on
`/de/profile`, where the customer's name still anchors the body.

## Measured
**not measured.** No render of this route exists in `_measured/`.

The nearest measured neighbour, and it is a neighbour rather than this band: `profile-hub.json`
band 0 measures the same `Header.tsx` component on `/de/profile` at box `top 0, left 0, width 390,
height 84`, `padding 20px 0px`, transparent, with one text role at 18px / 700 / Inter Tight /
`rgb(10, 10, 10)`, line-height 27, letter-spacing -0.18px. Whether this route renders the same
band is not measured.

## Tokens
Source literals, read from `Header.tsx:804`, not measured:
- `font-heading text-[18px] font-bold tracking-[-0.01em]`
- Colour `s-ink` `#0A0A0A`, surface transparent

## Interaction
- Back tile: history back.
- The title is not a control.

## Intentional deviations
- No body page title. The 2026-06-11 owner call moved every deep profile page's title into the bar because the stacked page h1 below the header read unbalanced (Header.tsx:456-461).

## Empty state
The title is identical whether the list has salons or not. `EmptyStateDiscovery` renders its own
22px `<h2>` below it (see `04-empty-state.md`), so the empty screen carries two headings and the
populated screen carries one.

## Against the floors
- **Display anchor: not measured.** If this band renders at the 18px measured on the sibling route, the populated screen's largest text is 18px against a >= 28px floor, since nothing in `FavoritesList` is above 15px and the card name is 15px (`SalonCard.tsx:310`). That sentence is a reading of the source, not a measurement, and it is the first thing a real capture settles.
- Everything else on this band: not measured.

## Provenance
- Owner 2026-06-11, profile sub-page titles sit beside the back tile
- Owner 2026-06-12, rolled out to every deep profile page
