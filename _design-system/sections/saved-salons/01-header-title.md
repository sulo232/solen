# Global header, the "Favoriten" title

**Reference:** `_design-system/sections/_measured/saved-salons.json` band 0, `/de/profile/favorites`
at 390x844, signed in, 2026-08-27.
**Component:** `app/[locale]/_components/layout/Header.tsx`. Route-to-title map at line 472,
`[/\/profile\/favorites\/?$/, "Favoriten"]`; the title span renders at line 804.
**Layer:** 1 chrome. Shared furniture, mounted from `app/[locale]/layout.tsx:111-113`, not owned by
this screen.

## Layout

```
+--------------------------------------------------+  0
|  [back tile]   Favoriten                         |   sticky top-0, z-50, py-5, transparent
+--------------------------------------------------+  84
        main starts here: px-4, pt-4
```

The page renders no `<h1>` of its own. `favorites/page.tsx:77-78` says why in a comment: "Title
lives in the global header beside the back tile (owner, 2026-06-11)". So on this screen the header
title is the only page title there is, and it is the largest text on the whole screen.

## Measured

Band 0, verbatim:

| axis | value |
|---|---|
| tag | `header` |
| class | `sticky top-0 left-0 right-0 z-50 transition-all duration-300 ease-glide py-5 bg-transparent` |
| box | top 0, left 0, 390 x 84 |
| background | `rgba(0, 0, 0, 0)` |
| padding | 20px 0px |
| radius | 0 |
| images | 0 |

One text role:

| size | weight | family | colour | line-height | letter-spacing | count | sample |
|---|---|---|---|---|---|---|---|
| 18 | 700 | Inter Tight | `rgb(10, 10, 10)` | 27 | -0.18px | 1 | "Favoriten" |

The band's own card list is empty, and that is an artefact rather than a fact: the extractor's
`cardAnatomy` walks `root.querySelectorAll("*")`, which never includes the root, so a band's own
surface never appears in its own card list. The header's surface is the `surface` block above.

## Tokens

- `font-heading` (Inter Tight), `text-[18px] font-bold tracking-[-0.01em]` (`Header.tsx:804`)
- Colour `s-ink` `#0A0A0A`; measured `rgb(10, 10, 10)`, so the token and the render agree
- Surface transparent at scroll 0

## Interaction

- Back tile: history back.
- The title is not a control.
- The whole bar is `sticky top-0 z-50`, so it stays over the grid for the screen's 180px of scroll.

## Intentional deviations

- **No body page title.** The 2026-06-11 owner call moved every deep profile page's title into the
  bar because a stacked page `h1` under the header read unbalanced.
- **The title is a hardcoded German literal**, not a translation key. `Header.tsx:465-466` says so
  in its own comment ("a missing i18n key here would throw and white-screen the app, i18n is
  tracked separately"), and the map at 472 holds "Favoriten" as a string. On a four-locale product
  an English, French or Italian visitor to this route reads a German word. Recorded, not fixed:
  `Header.tsx` is a source file and this task is documentation.

## Empty state

The title is identical whether the list has salons or not. `EmptyStateDiscovery` renders its own
22px `h2` below it, so the EMPTY screen carries two headings and a 22px anchor while the POPULATED
screen carries one heading and an 18px anchor. The screen's largest text is bigger when it has
nothing to show.

## Against the floors

- **Display anchor: FAIL, and this band is the whole reason.** 18px measured against a >= 28px
  floor (FLOORS LAW 6) and a 30px ladder value. Nothing else on the populated screen is above 15px,
  so this band alone sets the anchor.
- **Anchor ratio: FAIL.** 18 over a 14px body is 1.29x, against a >= 1.8x floor and a 2.14x ladder.
- **Ladder shape:** the ladder asks for emphasis carried by size and colour at weight 500. This band
  carries it at weight 700, the heaviest on the screen, at a size only 1.29x the body. It is the
  wrong lever pulled hard.
- **One tap up the same section, `/de/profile` measures a 28px anchor** (`profile-hub.json`,
  `distinctSizes` begins 28, 24, 18). So the hub clears the anchor floor and its own sub-page does
  not, using the same `Header.tsx` band, because the hub also carries a body title and this screen
  deliberately does not.
- Colour: `#0A0A0A` on white is 19.3:1, far above AA.

## Provenance

- Owner 2026-06-11, profile sub-page titles sit beside the back tile
- Owner 2026-06-12, rolled out to every deep profile page
- `_design-system/sections/saved/01-header-title.md`, which reached the same reading from source
  before any measurement existed; this file confirms its 18px prediction with the render
