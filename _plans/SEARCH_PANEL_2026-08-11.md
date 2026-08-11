# Search panel: his three picks + the empty-submit question (2026-08-11)

Owner message: "1b 2b 3 b but whatvif nth selected and tapped enter and or tried to go to next
section date slection or map uk and then press search"

He picked variant B in all three sections of `/dev/search-states`, then asked what happens when
nothing is chosen and you submit anyway.

## Readback, one line per ask

1. Section 1 = B (one list under the field)
2. Section 2 = B (delete the three dots)
3. Section 3 = B (no-result message moves up, gets a way forward, and closing clears)
4. New question: nothing selected + Enter, or nothing selected + go to the date step or the map,
   then press Search. What happens?

## Atomic boxes

### 1b , tapping the search bar shows ONE list
- [ ] Delete `Beliebte Stores` from the focused body of the service step
- [ ] Delete the `Fuer Sie` look grid from the focused body of the service step
- [ ] Keep `Zuletzt` (recents) as the first block when it has rows
- [ ] Keep `Kategorien` as the fallback block when there are no recents (pre-launch = everyone)
- [ ] Confirm the recents hook is REUSED, not rebuilt (`useRecentSearches.ts`, already imported)

### 2b , delete the three dots
- [ ] Remove the `SuggestLoaderDots` render site from the service field
- [ ] Remove the now-unused `SuggestLoaderDots` component
- [ ] Confirm the clear X ends up at the capsule's right edge (measure, do not eyeball)
- [ ] Confirm the skeleton rows still render while a query is in flight

### 3b , the no-result state and leaving it
- [ ] Move the no-result message to the top of the body instead of a third of the way down
- [ ] Give it a way forward (the same category rows as the idle body)
- [ ] Drop the grey Lucide disc (it is banned by the locked EmptyState anatomy anyway)
- [ ] Back chevron: clear the typed query as well as unfocusing
- [ ] Back chevron: drop the no-result state with it
- [ ] Confirm the query still lands in recents so it is one tap to get back

### 4 , the empty-submit question, ANSWERED BY MEASUREMENT (2026-08-11)
- [x] Enter with nothing typed -> `/de/search` with NO params, which renders the full list
- [x] Suchen with nothing chosen -> `/de/search`, same
- [x] Open `Wann?`, pick nothing, press Suchen -> `/de/search`, same
- [ ] Decide whether an empty submit should carry the city you were browsing (today it does not,
      so the results page falls back to Basel whatever page you came from)
- [ ] Map: `extraParams` carries `map=1` through `buildParams`, so a search from the map stays on
      the map. NOT yet measured end to end, the map route did not respond during this pass.

### Correction owed to him
- [ ] `/dev/search-states` says the back arrow "does nothing". Measured properly with a real tap,
      it DOES unfocus and bring `Wo?`/`Wann?`/`Suchen` back on screen (Wo? moves 860 -> 602 on a
      390x844 phone). What is actually true: it keeps the typed query and keeps the no-result
      message. Fix the page's wording.

## Measured, so it is not re-derived later

- Field capsule 52 -> 378. Clear X 306 -> 326. Dots 341 -> 359, INSIDE the capsule, PAST the X.
- While the field is focused the composer folds: `Wo?`, `Wann?` and the `Suchen` footer sit at
  y 844-869 on an 844px viewport, i.e. off-screen. Tapping the back chevron restores them.
- A failed query takes ~5s in dev to settle to "Keine Treffer" (three requests: geocode,
  style-suggest, suggest). Before it settles the body is skeletons.

## Open, needs him

- The imagery floor collision from the mockup page: taking the photo grid out drops the search
  panel to zero photographic area, and FLOORS LAW 2 asks a browse surface for roughly a third.
  Picking 1b implies the exemption, but he has not said the word, so it stays listed here.
