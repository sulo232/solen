# Floating bottom nav

**Reference:** `_measured/saved-salons.json` band 4, `/de/profile/favorites` at 390x844, signed in,
2026-08-27.
**Component:** `app/[locale]/_components/layout/BottomNav.tsx`, mounted from
`app/[locale]/layout.tsx:169-171` inside `<HideInBooking hideOnDashboard coverSalonDetail>`.
**Layer:** 1 chrome. Global furniture, not owned by this screen. It gets a file here because it is a
band in this screen's JSON and because it sits over the grid's second card.

## Layout

```
                  ...card 2 photo continues under the bar...
 774 +----------------------------------------------+   366 x 58, radius 9999
     |   Suchen     Inspo    Gespeichert    Profil  |   white at 80% + backdrop blur
 832 +----------------------------------------------+   inset 12 left and right
 844  fold
```

Fixed, `md:hidden`, `z-[700]`, inset 12px from each side and 12px plus the safe-area inset from the
bottom.

## Measured

| axis | value |
|---|---|
| tag | `nav` |
| class | `md:hidden fixed inset-x-0 bottom-0 z-[700] [body[data-overlay-open]_&]:hidden mx-3 mb-3 rounded-full overflow-hidden mb-[calc(12px+env(safe-area-inset-bottom))]` |
| box | top 774, left 12, 366 x 58 |
| background | `rgba(255, 255, 255, 0.8)` |
| radius | 9999 |
| images | 0 |

Two text roles:

| size | weight | colour | line-height | count | sample |
|---|---|---|---|---|---|
| 12 | 400 | `rgb(107, 107, 107)` | 12 | 3 | "Suchen" |
| 12 | 600 | `rgb(10, 10, 10)` | 12 | 1 | "Profil" |

Four labels, exactly one at weight 600 in ink, which is the active item. On this route the active
item is Profil, matched by `profileActive = /^\/(profile|account|auth)(\/|$)/`
(`BottomNav.tsx:123`). The saved heart is NOT the active tab on the saved-salons screen, because
that tab points somewhere else; see Cross-screen.

The band's `cards` list is empty for the same extractor reason given in `01-header-title.md`: a
band's own box is never in its own card list. Its shadow is therefore unmeasured, which is why the
screen's distinct-shadow count in the README is stated as 1 rather than 2.

## Tokens

- `FROST_GLASS` (`lib/frost-glass.ts`), the house glass recipe approved at V3-D420 and already
  shipping on the map chip
- Active: 600 ink on icon and label. Inactive: 400 `s-ink-2`. No fill, no blue, which is the CONTENT
  TABS row of the design contract (owner 2026-07-21) applied to a tab bar
- Label 12px, deliberately above the reference's 10px: sub-12px text is below this project's
  legibility floor and an armed drift gate refuses it (`BottomNav.tsx:29-31`)

## Interaction

- Four destinations. `ITEMS` (`BottomNav.tsx:87-97`) holds search, inspo and saved; profile is
  appended in the render.
- **The heart goes to `/inspo/saved`** (`BottomNav.tsx:96`), not to this screen. So the bar on the
  saved-salons screen offers a tab labelled "saved" that leads to a different saved screen.
- It condenses on downward scroll past 80px and expands on upward scroll, with a 6px dead zone and
  always-full zones in the top 80px and the last 60px (`BottomNav.tsx:147-172`). The capture is at
  scroll 0, where the bar is always full by that rule, so the condensed state is not measured.

## Intentional deviations

- **It shrinks, it does not leave** (owner 2026-08-10). The component's own comment records the
  Mobbin survey behind that: six apps, none of which removes the bar.
- Four items rather than the reference's three, because `MobileMenu` carries the city selector and
  the language switcher and would otherwise have no trigger on any customer route.

## Empty state

Unchanged. The bar renders identically on the populated and the empty screen.

## Against the floors

- **Touch target: PASS.** The bar is 58px tall, so each item clears the 44px floor vertically; item
  width at four across 366px is about 91px.
- **Contrast: PASS on the active item** (`#0A0A0A`), **PASS on the inactive** (`#6B6B6B` at 5.33:1
  on white). The bar is 80% white over whatever is behind it, and on this screen what is behind it
  is a photograph, so the effective contrast of the inactive labels is lower than the 5.33:1 that
  the token affords on flat white. Not measured; naming it because the bar sits over image 2 of the
  grid, which is the only place on this screen where text meets a photo.
- **It overlaps content by design and the layout pays for it.** `main` carries
  `pb-[calc(56px+env(safe-area-inset-bottom))]` (`layout.tsx:123`) precisely so the last card is not
  clipped, and the comment records that the clipping was measured before the padding was added.
- Type: 12px is the smallest size on the screen and is on the locked scale.

## Cross-screen, FLOORS LAW 8

**The heart tab deletes the bar it belongs to.** `HideInBooking.tsx:54` returns null for
`/\/inspo\/(board|saved)(\/|$)/` with no prop guard, so every `HideInBooking` wrapper is null on
`/de/inspo/saved`, including the one that mounts this nav. Tapping the saved tab therefore navigates
to a screen with no bottom nav. Verified twice, once in source and once in the measurement:
`saved-looks.json` has no `nav` band and no 12px size anywhere in its screen totals, while this
file's band exists and carries four 12px labels. Detailed in `../saved-looks/README.md`.

## Provenance

- Owner 2026-08-10, "I think I want to have, like, a bottom navigation bar for, you know, the web
  area", after picking option C off `/dev/menu-placement`
- Owner 2026-08-10, "saved maybe, like, a heart icon", which is why the heart is the glyph
- Airbnb mobile web measured the same day at 375x812, recorded in the component header
- `hierarchy-density-06`, the sticky-CTA floor, which is why the bar yields to `SalonMobileBookBar`
  on the PDP rather than stacking with it
