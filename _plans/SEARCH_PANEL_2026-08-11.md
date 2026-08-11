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
- [x] Delete `Beliebte Stores` from the focused body of the service step , verified: zero render
      sites left, `grep storesLabelTxt` returns nothing, only the comments at SearchOverlay.tsx:382
      and :1710 that record the removal. Commit a5b177c7d.
- [x] Delete the `Fuer Sie` look grid from the focused body of the service step , verified: both
      remaining `<LookCard` sites (SearchOverlay.tsx:1684, :1697) sit inside the `if (typing)` block
      that opens at :1528, so the idle branch has none. Commit a5b177c7d.
- [x] Keep `Zuletzt` (recents) as the first block when it has rows , verified: SearchOverlay.tsx:1715
      still guards on `visibleRecents.length > 0` and is the first child of the idle return.
- [x] Keep `Kategorien` as the fallback block when there are no recents , verified:
      SearchOverlay.tsx:1722-1723 renders the label plus `categoryRows` unconditionally. Rendered
      check on the live panel: with no recents the body is 4 category rows and 0 photo tiles.
- [x] Confirm the recents hook is REUSED, not rebuilt , verified: SearchOverlay.tsx:51-54 imports
      it and :334 calls it. No new hook or storage key was added anywhere in the diff.

### 2b , delete the three dots
- [x] Remove the `SuggestLoaderDots` render site from the service field , verified: `grep
      SuggestLoaderDots` returns one line, the pointer comment at SearchOverlay.tsx:2087. Rendered
      check while typing: 0 dot elements, clear X 18px off the capsule's right edge.
- [x] Remove the now-unused `SuggestLoaderDots` component
- [x] Confirm the clear X ends up at the capsule's right edge (measure, do not eyeball)
- [x] Confirm the skeleton rows still render while a query is in flight

### 3b , the no-result state and leaving it
- [x] Move the no-result message to the top of the body instead of a third of the way down
- [x] Give it a way forward (the same category rows as the idle body)
- [x] Drop the grey Lucide disc (it is banned by the locked EmptyState anatomy anyway)
- [x] Back chevron: clear the typed query as well as unfocusing
- [x] Back chevron: drop the no-result state with it
- [x] Confirm the query still lands in recents so it is one tap to get back

### 4 , the empty-submit question, ANSWERED BY MEASUREMENT (2026-08-11)
- [x] Enter with nothing typed -> `/de/search` with NO params, which renders the full list
- [x] Suchen with nothing chosen -> `/de/search`, same
- [x] Open `Wann?`, pick nothing, press Suchen -> `/de/search`, same
- [x] The city question, and the first answer was WRONG. An empty submit from a Zurich results
      page lands on `?city=Basel`, which reads like a bug and is not one. `/api/cities` returns
      exactly ONE active city right now, Basel, so `slugFromCity("zurich", rows)` finds no match
      and the page falls back to the only city that exists. It also renders "Suchen Basel" in the
      heading, so the screen never claims otherwise. Nothing to fix here until a second city goes
      live; re-check this the day one does.
- [x] Map: measured end to end. Opening the panel from `/de/search?map=1` and pressing Suchen with
      nothing chosen returns to `/de/search?map=1`. The map context survives an empty submit.

### Correction owed to him
- [x] `/dev/search-states` says the back arrow "does nothing". Measured properly with a real tap,
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

## Found while verifying, NOT part of his ask, and it needs a decision (2026-08-11)

**The city picker offers eight cities and the product can serve one.** Measured end to end: open
the panel, tap `Wo?`, pick Zurich, and the results page renders the heading "Suchen Basel" with
Basel salons under it, while the URL still says `city=Zurich`. Nothing errors and nothing says the
city is unavailable, so a successful-looking screen answers a question the user did not ask.

Cause, not a bug in the picker: `/api/cities` returns exactly one active city (basel), while the
picker is driven by the hardcoded `SEARCH_CITIES` list in `lib/cities.ts:139` (Basel, Zurich, Bern,
Lausanne, Genf, Luzern, Neuchatel, Winterthur). `SearchTemplate.tsx:469-472` cannot resolve a city
that is not active and falls back to `DEFAULT_CITY_SLUG`, which is Basel.

This is the no-fabrication rule in its quietest form: the screen promises a city the system cannot
back, and answers with a different one rather than saying so.

- [x] DONE, and it was not really a fork. A city that hands you a different city is a screen
      making a claim the system cannot back, and no-fabrication is not a taste axis, so the
      conservative reading wins: the picker now offers only what we can serve. Verified live: the
      Wo? list renders "Keine Praeferenz" plus Basel, nothing else. Not a new system either, it
      moved onto `useActiveCities`, the shared fetch every other city picker in the app already
      uses; this list was the last one still reading the hardcoded array. The static list stays as
      the fallback while the fetch is in flight or if it fails, which is that hook's documented
      contract, so the picker is never empty. Reversible in one line if he wants the other seven
      shown as coming-soon instead.
