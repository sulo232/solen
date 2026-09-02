# Zero state, banner + hint + top-rated rail

**Reference:** Mockup-19 Option B, owner-picked 2026-06-11. **Not in this capture:** the signed-in
test account holds two favourites, so `saved-salons.json` measured the populated screen and this
band never rendered. Every number below is a source literal, read from the component on 2026-08-27,
and labelled as such.
**Component:** `app/[locale]/_components/profile/EmptyStateDiscovery.tsx`, called from
`app/[locale]/profile/favorites/page.tsx:80-99`
**Layer:** 1 chrome. It is a registered component (`COMPONENT_REGISTRY.md:70`), not the locked
`EmptyState` primitive, and the registry row is explicit that profile list empties are its job.

## Layout

```
   Noch keine Favoriten.                         22/700 s-ink
   Tippen Sie auf das Herz bei einem Salon...    14/400 s-ink-2
   +------------------------------------+
   |  banner photo, h 220, radius 18    |        real cover_photo_url
   |                     Inspo oeffnen  |        18/700 white
   |                     Styles, Salons |        13 white/85
   +------------------------------------+
   +------------------------------------+
   | (heart) Das Herz finden Sie oben...|        12.5 s-ink-2 on s-bg-sunken, radius 14
   +------------------------------------+
   Top bewertet                   Alle >         17/600  +  13.5/600
   [tile 210 wide, photo h 160] [tile] [tile]    horizontal scroll
```

`flex min-h-[70vh] flex-col` with `mt-auto` before the rail, so the rail sits at the bottom of the
band and the top block stays put.

## Measured

**Not measured.** The band did not render in the 2026-08-27 capture. Source literals, verified line
by line in `EmptyStateDiscovery.tsx` for this file:

| element | literal | line |
|---|---|---|
| wrapper | `flex min-h-[70vh] flex-col` | 64 |
| title | `font-heading text-[22px] font-bold tracking-[-0.01em] text-s-ink` | 65 |
| lead | `mt-1.5 font-body text-[14px] leading-[1.55] text-s-ink-2` | 68 |
| banner | `mt-[18px] h-[220px] rounded-[18px] bg-s-bg-sunken`, real `<img>` | 73, 77 |
| banner title | `font-heading text-[18px] font-bold text-white` | 83 |
| banner sub | `font-body text-[13px] text-white/85` | 84 |
| hint card | `rounded-[14px] bg-s-bg-sunken px-3.5 py-3`, hint text `text-[12.5px] leading-[1.5]` | 89, 98 |
| rail heading | `font-heading text-[17px] font-semibold` | 103 |
| rail link | `font-body text-[13.5px] font-semibold` | 108 |
| rail tile | photo `h-[160px] rounded-[16px]`, name `text-[14.5px] font-semibold`, meta `text-[12.5px]` | 117, 123, 126 |

**The one measurement that closes this file:** sign in as an account with zero favourites and rerun
`node scripts/measure-sections.mjs --auth=<that account> /de/profile/favorites`. Nothing else about
this band is knowable from source, including whether the eight authored sizes all render.

## Tokens

- `s-bg-sunken` for the banner fallback and the hint card, so both have a perceivable edge on white
  (FLOORS LAW 4)
- The hint heart is `#FF3366`, the save-heart token, used here where it does mean "saved by you"
- Star `s-star`; the rail's review count is `s-accent`

## Interaction

- Banner: `/{locale}/inspo`
- "Alle" and the rail heading: `/{locale}/coiffeur`
- Each tile: that salon's PDP
- The hint card is not a control

## Intentional deviations

- **It is not the locked `EmptyState` primitive.** It carries a promise headline, a gesture subline,
  a real photograph and a live rail, which is the anatomy the design contract's states row asks for,
  but as a separately registered component. Legal, because the registry owns it by name.
- **The banner photo and the rail are real seeded content.** `favorites/page.tsx:68-74` queries the
  six top-rated active salons and only runs that query when the list is empty. No baked-in `src`
  anywhere, so the imagery here is content and not decoration.
- **The review count is blue.** The design contract puts blue on small tappable metadata including
  review counts; this count is not tappable on its own, since the whole tile is the link.

## Empty state

This IS the empty state. Its own empty case: `topSalons` returning zero rows leaves the banner on
`bg-s-bg-sunken` with no photo and the rail with no tiles. Not measured, and whether the seed
database can produce it was not checked.

## Against the floors

- **Type budget, from source literals: eight distinct sizes on one band** (22, 18, 17, 14.5, 14,
  13.5, 13, 12.5) against a ceiling of 4 and a ladder of 5, and **four of them are off the locked
  scale**: 14.5, 13.5 and 12.5 are fractional, which `isAllowedPx` can never allow, and 17 is a
  whole number named in the outlier detector's own odd-integer tail. This is a source reading, so a
  branch that does not render would lower it.
- **Display anchor: 22px authored** against a >= 28px floor, unless the 220px banner photograph is
  read as the focal, which FLOORS LAW 6 allows. Not measured either way.
- **The empty screen's anchor is larger than the populated screen's.** 22px here against the 18px
  header title that is the populated screen's largest text. A screen with nothing to show carries
  more hierarchy than the same screen with content.
- **Imagery:** met by content if `topSalons` returns rows. A 220px banner plus a 160px rail across a
  390-wide viewport is a large share and the exact number is not measured.
- **Weight share and elevation:** not measured.

## Provenance

- Owner 2026-06-11, Mockup-19 Option B, real top-rated salons for the rail and the banner
- Design contract states row: empty state = promise headline + gesture subline + filled ink CTA +
  real imagery, never a grey Lucide disc
- FLOORS LAW 2, imagery satisfied by content and never by a baked-in `src`
- `_design-system/sections/saved/04-empty-state.md`, which read the same literals from source before
  any measurement existed; this file re-verified every line number rather than copying them
