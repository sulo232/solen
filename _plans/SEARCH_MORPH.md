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

## PARKED , owner decisions (block the port)
1. **Canonical cities: 8 vs 3.** `SEARCH_CITIES` = 8 display names; only 3 (Basel/Zuerich/Bern) exist as DB city records, so the city-scoped suggest filter only discriminates for those 3 (pre-existing). Pick the canonical list before porting.
2. **Port into the real `SearchOverlay`** (the live homepage + search-page search). Changes a core shared component; do on the owner's go.
