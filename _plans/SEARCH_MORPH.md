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
