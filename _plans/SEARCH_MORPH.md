# Search redesign , Airbnb-style mockup

Owner-driven redesign of the customer search, mocked at **`/dev/search-morph`** (dev-only route, `notFound()` in prod). Mockup-first; not yet ported to the live search.

## Built (approved direction, "perfect" 2026-06-30)
Full Airbnb search flow, our tokens:
1. **Collapse-on-scroll bar** , homepage sticky "Suche starten" pill + category tabs that go compact on scroll.
2. **Morph-expand** , tap the pill -> shared `layoutId` morph into the search surface (frosted-blur backdrop, white cards float).
3. **Accordion** , Suche / Standort / Datum; active card content capped + internal-scroll so the 3 steps stay visible; tap an active title (chevron) collapses it.
4. **In-search full expand** , tap the Suche input -> input jumps to top with a back arrow (no title), full content, Standort/Datum hidden (Airbnb focused state).
5. **Real typeahead** , `useSearchSuggest` (services/salons/stylists), Skeleton loading, "Keine Treffer" empty.
6. **Date** , Daten/Flexibel toggle + multi-month calendar; past struck + beyond-6-week-window greyed; Monday-first.
7. **Bottom bar** , Zuruecksetzen + ink Suchen, white with gradient fade (DS sticky-bar rule), not a card.

## Uses EXISTING data (no re-invention , enforced)
`CATEGORIES` (searchCategories), `SEARCH_CITIES` (lib/cities, new canonical export), `TRENDING` (searchTrending), `FEATURED_SALONS` (searchFeatured), `useSearchSuggest`. Hardened by `~/.claude/hooks/pre-edit-reinvent-data-gate.py`.

## Real-code fixes shipped alongside (council-caught)
- `SEARCH_CITIES` added to lib/cities.ts; **SearchBar + SearchOverlay now import it** (killed the duplicate city list).
- `searchCategories` Nails icon Sparkles -> Gem (banned glyph fixed at source).
- `useSearchSuggest` normalizes payload (defaults services/salons/stylists to []) , prevents a `results.stylists.length` crash in the REAL overlay too.

## Interaction model (owner-locked 2026-06-30)
- **Only SEARCH** has the scroll-up expand (continuous follow -> snap on release at >=0.4 -> focused; EXPAND_DIST 120). Location & Date are PLAIN accordion panels that expand IN PLACE in fixed order Suche > Standort > Datum (location in the MIDDLE, never above search). See REMOVED.md.
- Freeze fix: per-frame box-shadow/bg/margin/radius interpolation was the jank -> all toggled by `inputFocused` CLASS (one CSS transition at commit); only crop + element heights stay scroll-linked.
- Focused fills to the bottom (footer maxHeight collapses, padding INSIDE the wrapper); cropped rounded sheet, blur above (not full-screen). Recents have a remove-X; bar icons are bare (no circle).

## PARKED , owner ideas (brainstorm 2026-06-30, NOT yet specced)
1. **No-results helper (Google-style).** When a store/search has no results in the chosen location, show "Meintest du / Versuch's mit ..." suggestions instead of a dead empty state. Owner example: searching a store name that doesn't exist in their city.
2. **Search x Location x Date integration logic.** How the free-text query combines with location + date filters (what wins, what's optional). Needs a model before wiring; owner cycled several framings and parked it.

## PARKED , owner decisions (block the port)
1. **Canonical cities: 8 vs 3.** `SEARCH_CITIES` = 8 display names; only 3 (Basel/Zuerich/Bern) exist as DB city records, so the city-scoped suggest filter only discriminates for those 3 (pre-existing). Pick the canonical list before porting.
2. **Port into the real `SearchOverlay`** (the live homepage + search-page search). Changes a core shared component; do on the owner's go.

## LOCKED 2026-07-01 (owner: "lock it, it's already good")
The /dev/search-morph mockup design is FROZEN as the spec for the production port. Final state: pure 1:1 scroll-expand (no auto/lock), floating frosted cards -> cropped rounded focused sheet, search-first accordion (Suche > Standort > Datum), Standort default "Keine Präferenz" (no In der Nähe), paged calendar with arrows (full month) + optional toggle time-of-day (Vormittag/Nachmittag/Abend) that reveals on date-pick, balanced Flexibel grid (blue selected). Port into SearchOverlay per SEARCH_BACKEND.md (keep its data contract + i18n; add keys for the new German strings).

## PORTED + VERIFIED 2026-07-01 (commits b6df58187 wip + c29b61159 fix)
The mockup is now LIVE in the production `SearchOverlay.tsx` (homepage SearchBar + search-page sticky bar). Reviewer-graded PASS 13/14; the one fix (Keine Präferenz default showed greyed "Hinzufügen" -> now bold-ink "Keine Präferenz") applied. 31 i18n keys added across de/en/fr/it (en/fr/it use German placeholders , PARKED for owner copy). Data contract preserved (props + q/service/city/date/period URL + suggest/recents hooks + date-ISO + period-map). Runtime-verified after a clean .next rebuild: overlay opens on both callers, renders the new design, "Keine Präferenz" shows, typeahead returns real data, results page 200. NOTE: the headless submit-tap->URL was not captured live (next-dev HMR flakiness + two animating same-text Suchen buttons); the path is reviewer-confirmed at code level (line 396 handleSubmit -> navigate -> router.push). Owner to eyeball the Suchen tap on device.

## REMAINING (post-port)
1. **DNA personalization wiring** (owner-confirmed part of the port, SEARCH_BACKEND "Post-mockup wiring") , personalize suggest/results by user_style_affinity / search-book affinity. NOT yet done.
2. **No-results helper** (SEARCH_BACKEND Feature 2) , BLOCKED on owner decisions D1 (3 vs 5 cities) + D4 (fallback copy).
3. **en/fr/it translations** for the 31 new keys (German placeholders today).

## RICH SEARCH WIRED 2026-07-01 (mockup `/dev/search-rich` V2, owner "approved")
The overlay's TYPING state (query >=2 chars) is now a rich, sectioned result INSIDE the overlay (calendar/location steps untouched). Ported from the approved `/dev/search-rich` V2.
- **Autocomplete** , the raw query (leads, semibold) + up to 5 "similar" terms as clean ink rows (magnifier + up-left arrow, hairline dividers, NOT grayed). Sources MERGED: `useStyleLooks` style terms first, then `useSearchSuggest` service names. Tap a term -> `searchTerm(term)` -> /search?q=term.
- **Salons** (focal) , `results.salons` as rich cards: cover (or Store fallback), name, star rating, address, `from CHF X`, trailing arrow. Tap -> salon PDP (`/salon/<slug>`). Inline **See all results** row -> handleSubmit (full search page). Capped at the suggest limit (3).
- **Stylists** , preserved capability; compact rows, tap -> the stylist's salon PDP.
- **Looks** (small strip) , real Inspo photos from `style-suggest` thumbs; tap -> `/inspo?search=<term>` (the "connect w inspo" tie-in). Inspo now reads `?search=` into its committed-query state so the deep-link lands pre-filtered (was a would-be dead param).

Backend + data (all EXISTING, reused):
- `search_suggest` RPC gained a per-salon `from_price` (min active priced service at the salon) , additive CREATE OR REPLACE, same signature. NOTE (parked): it's the salon's OVERALL cheapest service, not the query-matched treatment, so a barbershop shows `ab CHF 15` (a beard trim) on a "buzzcut" search. Honest "starting at" price but a category-scoped from-price would be more relevant , refinement parked.
- New hook `useStyleLooks` (colocated w/ useSearchSuggest) , debounced fetch of `/api/discovery/style-suggest` (discovery-flag-gated, fails soft). One call powers BOTH the autocomplete completions and the Looks thumbs.
- i18n: 3 new keys per locale (`looksLabel`, `seeAllResults`, `fromPrice`) in de/en/fr/it (these ARE translated, not placeholders). Reused `groupSalons`/`groupStylists`.

Verified live (localhost:3000, iPhone 13, Playwright): DE "buzzcut" -> autocomplete (buzzcut + Bart trimmen/Coupe & Bart/...) + 2 salon cards (Cuts & Culture 4.8 ab CHF 15, Old Town Barbers 4.3) + See all + Looks; EN "coiffeur" -> Salon Lumière 4.4 `from CHF 35` + `See all results`. No console errors. tsc clean (4 pre-existing errors in admin/cron discovery-backfill, unrelated).

## MAP-VIEW SEARCH BATCH 2026-07-01 (owner 9-item batch)
Owner asked to bring the improved overlay + fixes into the map view and fix map behavior.
DONE + committed:
- **#1** map bar drops "Suchen" placeholder; shows `{q} | {city}` or just city (f641b2975).
- **#3** searching from the map preserves `map=1` via overlay `extraParams` (adbec2e5d).
- **#4** map search bar opens the REGULAR overlay state (no auto-keyboard) , `openSearchOverlay(false)`.
- **#5** overlay opened from the map lets you set all three together (service + Wo?/city + Wann?/date); verified live , picking a city advances to the date step, all rows apply.
- **#6** city recenter , the map stays mounted so the existing `fitBounds`-on-salon-set-change recenters to the new city's pins. (Only Basel has seed salons, so not visually demonstrable in dev; logic verified + the real blocker (being dumped to list) is fixed.)
- **#7/#8** touch focus rings suppressed in globals.css `@media (hover:none) and (pointer:coarse)`; filter pills neutral (ink border + sunken bg, no blue) both list + map (f641b2975).
- **#9** filter button active after a plain search , NOT reproduced: verified on BOTH list and map, all filter pills render neutral (aria-pressed=false, no ink/blue) after a `q`-only search. `activeFilterCount` already excludes `q`.
- **weird transition (map->list->map)** root-caused + fixed (bd89e517a): mobile map only opened on `?view=map`, not `?map=1`; and the map overlay unmounted during `loading`. Now honors `mapOpen` (both params) + stays mounted through re-fetch (old pins persist).

### PARKED , owner decision (blocks #2)
- **#2 "don't show Schweizweit , detect/default a city (Basel/Zürich)".** The map/search pill shows "Schweizweit" when no city is set. Owner wants a detected/default CITY instead. Can't just relabel (showing a city name while searching countrywide = fabricated filter). Real options: (A) browser-geolocation -> nearest Swiss city with salons -> default filter + honest label (needs permission prompt; risk: auto-filtering hides other cities , a user in an empty city sees 0 salons); (B) default to last-used city from recents (honest, no prompt, but "Schweizweit" persists for first-time users); (C) static launch-default = Basel (all seed data is Basel today) + filter. Recommendation: A with fallback chain last-used -> geolocated-nearest-with-salons -> Basel, and fall back to countrywide (neutral label) only if none resolve. Needs owner's call on geolocation-prompt + filter-vs-label before building.

## MAP + FILTER BATCH 2 2026-07-01 (owner follow-up, "3rd time" filter frustration)
- **Filter blue + focus ring , FIXED + PROVEN (owner raised 3x).** Earlier pass only did the collapsed pills; the blue lived INSIDE the sheet + the filter button. Neutralized ALL: SheetChip selected (s-accent tint -> ink border + sunken), sort segment, price slider fill+handle (s-accent -> ink), filter (sliders) button active (s-accent -> ink), + focus-visible:outline-none on every filter control + both pill rows. Verified live (iPhone 13): selecting "Für wen > Damen" = ink border + sunken fill, outline:none, and 0 s-accent (rgb(39,110,241)) elements on the page. Commit 2fa7ca58b. Matches LOCKFILE §1215 (owner 2026-06-29 gray-fill) which the code had drifted from; fixed the stale CLAUDE.md rule-3 note that still called the filter pill blue.
- **#1 map autocomplete term jumps to normal search , already FIXED** by the earlier map-open fix (bd89e517a). Verified: on the map, typing "buzz cut" + tapping the term -> ?q=buzz+cut&map=1, canvas present (stays on map). Owner's report predated that commit.
- **#2 store tap on map opens salon page instead of location , FIXED (council-backed).** 3-voice council (architecture + UX + devil's advocate) all converged: ONE overlay, context-aware navigation (NOT two systems); split only if conditionals proliferate / result types diverge. Impl: SearchOverlay gains optional onSalonLocate(store) callback; map parent supplies it (select in results -> MapView eases to pin, else search onto map ?q=name&map=1); normal/homepage overlay unchanged (opens salon page). Verified: from map, typing "Cuts" + tapping the store -> ?q=Cuts&map=1, canvas present, NOT /salon/. Commit e4fc43a8e.
- **#3 "numbers and prices how they move react buggy" , NEEDS OWNER CLARIFICATION.** Investigated: overlay typing video (list updates per keystroke, expected), rich-search static (clean), salon-card-stagger CSS (re-fires on each result change = fade+slide of whole cards incl. prices). Could also be map pin price labels repositioning on pan. 2-3 distinct candidates; fixing the wrong one = churn. Parked pending owner: WHICH screen (map pins / results cards / overlay) + which motion.
- Council-recommended polish PARKED: crosshair/locate icon on map store rows (signal that a tap locates, not navigates) , SalonResultCard shared-component change, deferred.

## STILL PARKED (owner decision)
- #2-city "Schweizweit" default (from batch 1) , unchanged, still needs the geolocation-UX + filter-vs-label call.

## #3 RESOLVED 2026-07-01 (owner clarified: map pin labels + filter count)
Owner picked the two: MAP PIN PRICE LABELS + FILTER COUNT.
- Map pins (commit 0e2d4b270): selecting a pin rebuilt every marker (render effect dep on selectedId) -> all price labels flickered on each tap. Now restyles only the tapped pill IN PLACE (applyPillSelection + selectedIdRef + salonPillsRef); render rebuilds only on data/zoom. Also fixed the BANNED Geist font on pins -> Inter, + eased transition. Verified: tap one pill -> exactly 1 ink-selected, other 8 unchanged, map eases to it. (Zoom still rebuilds markers , clustering genuinely changes with zoom; acceptable.)
- Filter count: wrapped list header + map "X Salons in diesem Bereich" + apply button counts in tabular-nums so digits don't reflow/jitter as filters change. (If the owner meant the network LAG of live-filtering rather than reflow, next step = debounce or apply-on-commit , flagged.)
