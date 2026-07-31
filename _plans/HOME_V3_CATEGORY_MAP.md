# HOME V3 , cities out, cards matched, category grid + floating map, walk-in in Barber, Inspo

Owner message 2026-07-31 (dictated, 4 screenshots, 4 selected elements).
Standing order still in force: **mockups only, nothing lands in a .tsx yet.**

## Atomic asks

- [x] **1. Delete the "Städte" row.** verified: 0 matches for citySection/CITIES/sa-cityempty in search-a.html; rendered section list no longer contains Städte. Owner: "Remove this city's row row."
  - [x] 1a. Remove the section and its `citySection()` builder. verified: `grep -c "citySection\|CITIES\|sa-cityempty"` = 0.
  - [x] 1b. Graveyard line filed (owner deletion). verified: _design-system/REMOVED.md, "staedte cities row, city rail, top in zurich".
- [x] **2. Cards must match the real home page card exactly.** verified: card now renders Haarsalon Margot / 4.8 / Coiffeur / 4051 Basel / 35 CHF, the same five values in the same order as the real card.
  - [x] 2a. Add the missing `4056 Basel` line. verified: rendered row 4 is "4051 Basel". MEASURED: the real card renders four text rows (name+rating / category / PLZ city / price); mine renders three, no postal line.
  - [x] 2b. Rating to 13px tabular. verified: computed fontSize on .sa-rate is 13px, was 12px.
  - [x] 2c. Price on the PLZ row, right-aligned. verified: .sa-placerow is a space-between flex row holding .sa-place and .sa-price.
  - [x] 2d. Body wrapper mt-2 / 2px pad / 2px gap. verified: search-a.html:447 `.sa-body { margin-top: 8px; ... padding: 0 2px; display: flex; flex-direction: column; gap: 2px; }`.
- [x] **3. Remove Walk-in from the category icon row.** verified: rendered pills are All, Coiffeur, Barber, Nails, Spa, Inspo; `grep -c 'slug: "walkin"'` = 0.
  - [x] 3a. Graveyard line filed. verified: _design-system/REMOVED.md, "walk-in category pill, walkin category icon".
- [ ] **4. Mockup: how walk-in is implemented inside the Barber section**, now that it is not a category. 3 distinct directions.
- [ ] **5. Category icons as the real 3D tile grid (Airbnb-like), with a floating map button in the middle that opens the map.** 3 distinct directions.
  - [ ] 5a. Reference captured, not built from memory.
  - [x] 5b. Exists-check DONE, and it changes both remaining mockups. `MobileCategoriesRow.tsx:43-48` already IS the 3D tile grid he screenshotted: 3 columns, rounded-3xl, six tiles, and Karte is ALREADY one of them routing to `search?view=map`, with Walk-in routing to `barbershop?walk_in=true`. So neither the map entry point nor the walk-in-inside-Barber route is net-new; both exist and need a TREATMENT, not a system. Graveyard also returned a hard constraint for ask 5: "map floating popup store preview over map" is REMOVED (owner 2026-07-02, "invented UI, the reference uses the BOTTOM SHEET"), so a floating preview card over the map is off the table; a floating map BUTTON is a different thing and is still open.
- [x] **6. Research what already exists vs what does not.** Findings in 5b above plus: `npm run exists map` returns 68 matches with 6 graveyard entries; NearbyMap.tsx and SalonLocation.tsx exist; the map view is a query param on search (`search?view=map`), not its own route.
- [ ] **7. Mockup for Inspo.**

## Notes

Ask 5 is a **variations** ask, so at least 3 genuinely different directions side by side, per the
mockup rule, with a recommendation. Not one synthesized answer.
