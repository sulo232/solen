# HOME + CLOSE FIXES (owner dictation 2026-08-05, with annotated screenshots)

Screens: `/Users/sulo/.claude/uploads/1c4aafb4-f426-493f-b8e6-885ee10cdf1b/` (4 shots, one with a red
circle around the divider under the search bar).

- [ ] A1. The search overlay CLOSE is still weird. The lingering box is smaller but NOT gone.
- [ ] A2. Remove the dividing line under the search bar on the home page (his red circle).
- [ ] A3. Fix the fonts on the home page. He says he never approved them and they are nothing like
      Airbnb's rounded, welcoming type. CONFLICT TO SURFACE, NOT SILENTLY RESOLVE: the design contract
      locks Inter Tight (display) + Inter (body) and bans Geist. Airbnb's own face is Cereal, which we
      do not license. So this needs either a named alternative or an explicit unlock from him.
- [ ] A4. "In der Nähe": remove the store cards, leave just the map.
- [ ] A5. The "20 Stores in der Nähe" badge becomes liquid glass, matching the heart overlay's
      treatment (measured from the live heart: `rgba(255,255,255,0.80)`, `backdrop-filter: blur(4px)`,
      `1px solid rgba(255,255,255,0.6)`, `0 1px 3px rgba(0,0,0,0.10)` plus an inset white top edge).
- [ ] A6. Remove the "Bald frei" section.
- [ ] A7. Make the star icon bigger so it matches the number beside it visually.
