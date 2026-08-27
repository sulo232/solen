<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md (extended, not edited),
     scripts/measure-sections.mjs and the _plans/ roadmaps. Full note in 01-search-and-categories.md.
     Structure follows _design-system/sections/salon-detail/. -->

# BottomNav (floating tab bar): section spec

**Reference:** `_measured/home-feed.json` band index 3 (this is file 13, see the ordering note below) · `CORPUS.md` section 1 row 1 names the 5 iOS exceptions that demote search to a tab-bar destination, and Uber Eats iOS as a sixth shape with a floating search pill at the bottom
**Component:** `app/[locale]/_components/layout/BottomNav.tsx`, mounted from `app/[locale]/layout.tsx` outside `main`
**Layer:** 1 (chrome)

**Ordering note.** The JSON lists this band third, at measured top 774, because it is `position: fixed`
and the page was captured at scroll 0, so its box lands at the bottom of the first viewport. It is not
the third thing in the document. It is filed last here, the way `salon-detail` files its own fixed
`17-mobile-book-bar.md` after the content sections.

## Layout

```
                 ... feed continues under the bar ...
+------------------------------------------+
|   (o)      (o)       (o)       (o)       |   icons 24, strokeWidth 2.2 active / 1.8 inactive
|  Suchen   Inspo   Gespeichert  Profil    |   12px, 600 active ink / 400 inactive ink-2
+------------------------------------------+
 366 x 58, radius 9999, white at 80%, 12px each side, 12px off the bottom
```

## Measured

Band index 3. Box top 774, left 12, width 366, height 58. Surface background
`rgba(255, 255, 255, 0.8)`, padding 0, border-radius 9999px.

| Role | Size / weight | Family | Colour | Line-height | Count | Sample |
|---|---|---|---|---|---|---|
| Active label | 12 / 600 | Inter | `rgb(10,10,10)` | 12 | 1 | "Suchen" |
| Inactive label | 12 / 400 | Inter | `rgb(107,107,107)` | 12 | 3 | "Inspo" |

- Cards: none. The bar's own rounded surface is captured as the band's `surface`, not as a card.
- Imagery: 0 images, 0 px2.
- Text elements 4, of which 1 is weight >= 600. Four tabs, derived from the 1 + 3 label counts.
- Geometry derived from the box: left 12 and width 366 at a 390 viewport means 12px of clearance each
  side, matching `mx-3`. Top 774 with height 58 puts its bottom edge at 832, which is 12px above the
  844 viewport floor, matching `mb-3`.
- This band sits outside `main`: `main`'s own text total is 298 and the screen total is 330, and these
  4 elements are part of the 32 that fall outside it (derived).

## Tokens

- Bar: `rounded-full`, `bg` white at 80% opacity, `mx-3 mb-3`, `mb-[calc(12px+env(safe-area-inset-bottom))]`,
  `z-[700]`, `md:hidden`. It hides outright while an overlay is open
  (`[body[data-overlay-open]_&]:hidden`).
- Item ink: active `text-s-ink` `#0A0A0A`, inactive `text-s-ink-2` `#6B6B6B`. Both measured exactly.
- Icons: lucide at size 24, strokeWidth 2.2 active and 1.8 inactive, so weight carries the state on the
  glyph as well as on the label.
- Row height `h-14` (56) expanded, `h-12` (48) condensed.

## Interaction

- Four destinations: Suchen (owns the home page and every category or search route), Inspo, Saved,
  and a fourth that flips between Profil and the login route on real auth state.
- On scroll the bar condenses rather than leaving: labels collapse to `max-h-0 opacity-0` and the row
  drops from 56 to 48. The component's own note records the five references checked for that decision
  and that none of them removes the bar.
- The bar keeps its accessible name the whole time; each item carries its label as `aria-label`, so
  losing the visible label does not lose the label.

## Intentional deviations

- Active is ink, not a brand colour. The component names the reference it diverges from: Airbnb puts
  Rausch red on the active icon and label, and the Solen contract puts colour only on small clickable
  accents.
- The floating capsule is variant B: it keeps its width and loses its labels, where Savee and Substack
  narrow theirs.

## Empty state

None. Four static destinations, always rendered at this width.

## Provenance

- The component carries its own record of why the bar came back after a note in the same place said the
  opposite for three months.
- N2 (2026-08-11): the footer got `main`'s bottom padding because this bar is fixed and was sitting on
  top of the last footer row.

## Against the floors

- **Display anchor >= 28px: not applicable to chrome, and it contributes nothing.** Largest text 12px.
  It occupies the bottom 58px of the first viewport, which is 58px the first viewport cannot spend on
  an anchor or on photography.
- **Anchor at least 1.8x body: not applicable.** One size (12px).
- **At most ~30% of text at weight >= 600: PASS at 25.00%** (1 of 4). It is the lowest bold share of any
  band on the screen, and structurally so: exactly one tab can be active.
- **At most 4 sizes and 2 weights: PASS within this band** (1 size, 2 weights). It spends no size budget.
- **Imagery: zero, correctly.** Chrome is exempt.
- **Touch target >= 44px: PASS expanded, and worth watching condensed.** The row is `h-14` (56)
  expanded and `h-12` (48) condensed, both above the 44 floor.
- **Locked radius: PASS.** 9999 is the pill rung.
- **Tertiary grey ban: PASS.** The inactive ink is `#6B6B6B` (`s-ink-2`, 5.33:1 on white), not
  `#9CA3AF`.
- **Selected state (design contract): the active tab is 600 ink plus a heavier icon stroke, with no
  fill.** That is the content-tabs treatment minus the underline, not the pill treatment, and the
  contract's tab row is the closer of the two.
