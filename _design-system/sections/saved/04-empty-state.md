# Zero state, banner + hint + top-rated rail

**Reference:** Mockup-19 Option B, owner-picked 2026-06-11. **No measurement**; see this folder's `README.md`.
**Component:** `app/[locale]/_components/profile/EmptyStateDiscovery.tsx`, called from `app/[locale]/profile/favorites/page.tsx:80-99`
**Layer:** 1 chrome. It is not the registered `<EmptyState>` component; it is a bespoke, richer zero state for this screen.

## Layout

```
   Noch keine Favoriten.                        22/700 s-ink
   Tippen Sie auf das Herz bei einem Salon...   14/400 s-ink-2
   +------------------------------------+
   |  banner photo, h 220, radius 18    |       real cover_photo_url
   |                     Inspo oeffnen  |       18/700 white
   |                     Styles, Salons |       13 white/85
   +------------------------------------+
   +------------------------------------+
   | (o) Das Herz finden Sie oben rechts|       12.5 s-ink-2, hint card
   +------------------------------------+       radius 14 on s-bg-sunken
   Top bewertet                    Alle >       17/600  +  13.5/600
   [tile 210x160] [tile] [tile] ...             horizontal scroll
```

`flex min-h-[70vh] flex-col` with `mt-auto` before the rail, so the rail sits at the bottom of
the band and the top block stays put.

## Measured
**not measured.**

Source literals, read from `EmptyStateDiscovery.tsx`, not measured:
- Title `text-[22px] font-bold tracking-[-0.01em]` (line 65)
- Lead `text-[14px] leading-[1.55] text-s-ink-2` (line 68)
- Banner `h-[220px] rounded-[18px] bg-s-bg-sunken`, real `<img>` from `topSalons[0].cover_photo_url` (lines 73-77)
- Banner title `text-[18px] font-bold text-white`, sub `text-[13px] text-white/85` (lines 83-84)
- Hint card `rounded-[14px] bg-s-bg-sunken px-3.5 py-3`, 36px white disc with `animate-breathe`, hint text `text-[12.5px] leading-[1.5]` (lines 89-98)
- Rail heading `text-[17px] font-semibold`, its link `text-[13.5px] font-semibold` (lines 103-108)
- Rail tile: `w-[210px]`, photo `h-[160px] rounded-[16px]`, name `text-[14.5px] font-semibold`, meta `text-[12.5px]`, rating value `font-semibold tabular-nums text-s-ink`, review count `tabular-nums text-s-accent` (lines 116-132)

## Tokens
- `s-bg-sunken` `#F5F5F4` for the banner fallback and the hint card, so both have a perceivable edge on white (FLOORS LAW 4)
- The hint heart is `#FF3366`, the save-heart token, used here where it does mean "saved by you"
- Star `s-star`, review count in `s-accent`

## Interaction
- Banner: `/{locale}/inspo`
- "Alle" and the rail heading: `/{locale}/coiffeur`
- Each tile: that salon's PDP
- The hint card is not a control.

## Intentional deviations
- It is not the locked `<EmptyState>` primitive. It carries a promise headline, a gesture subline, a real photograph and a live rail, which is the anatomy the states row of the design contract asks for, but as a bespoke component rather than the registered one. Recorded as a FLOORS LAW 9 open question, not resolved here.
- The banner photo and the rail are real seeded content: `favorites/page.tsx:68-74` queries the six top-rated active salons and only runs that query when the list is empty. No baked-in `src` anywhere, so the imagery here is content, not decoration.
- The review count is blue. On a card the design contract puts blue on small tappable metadata including review counts, and this count is not tappable on its own; the whole tile is the link.

## Empty state
This IS the empty state. Its own empty case: `topSalons` returning zero rows leaves the banner on
`bg-s-bg-sunken` with no photo and the rail with no tiles. That path is not measured and I did not
check whether the seed database can produce it.

## Against the floors
- **Type budget, from source literals alone: eight distinct sizes on one band** (22, 18, 17, 14.5, 14, 13.5, 13, 12.5) against a ceiling of 4, and **four of them are off the locked scale**: 14.5, 13.5, 12.5 (three fractional values, which `isAllowedPx` can never allow) and 17 (a whole number named in the detector's own odd-integer tail). This is a source reading, not a render measurement, so the rendered count could differ if a branch does not render. The committed `_design-system/_type-scale-report.md` counts the same family across the repo at `text-[14.5px]` 34 uses across 21 files and `text-[17px]` 41 uses across 28 files. A fresh run of `node scripts/detect-type-scale-outliers.mjs` reports 39 and 46, so the committed report is behind the current source by the same margin the profile folder records for 15.5px.
- **Display anchor: 22px authored**, against a >= 28px floor, unless the 220px banner photograph counts as the focal, which the floor allows. Not measured either way.
- **Imagery:** met by content if `topSalons` returns rows. A 220px banner plus a 160px rail across a 390-wide viewport is a large share, and the exact number is not measured.
- **Weight share and elevation:** not measured.

## Provenance
- Owner 2026-06-11, Mockup-19 Option B, real top-rated salons for the rail and the banner
- Design contract states row, empty state = promise headline + gesture subline + filled ink CTA + real imagery, never a grey Lucide disc
- FLOORS LAW 2, imagery satisfied by content and never by a baked-in `src`
