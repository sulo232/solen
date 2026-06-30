# Search backend plan , Query-led search + Google-style no-results helper

> Produced by a 3-agent audit workflow (2026-06-30), verified against live code + the live DB
> (Supabase `tocfnsmxmdxkrcmjzzdw`). This is the gap-free, risk-assessed plan the owner asked for.

## Headline corrections (the plan turns on these)
1. **Query-led AND-combine is ALREADY SHIPPED.** `/[locale]/search` -> `SearchTemplate` already sets `q`
   on `/api/salons?...` alongside `city`/`date`/`period` (`SearchTemplate.tsx:628-633`). Feature 1's
   backend + results wiring is DONE. The only gap: the new mockup overlay isn't the production overlay yet.
2. **`SearchResults.tsx` + `/api/salons/search` are DEAD** (q-only, ignore city/date, imported nowhere).
   Do NOT build on them. Delete + REMOVED.md line (Phase 4).
3. **Data reality:** 3 cities (basel/zuerich/bern); **all 20 listed salons are in Basel; Zürich + Bern = 0.**
   So "nearby cities" + "search everywhere" have little real to find outside Basel. Handle honestly , a
   fallback renders ONLY when its real count > 0. Never fabricate a count.

## Reuse (extend, don't rebuild)
- `app/api/salons/route.ts` , THE search endpoint (q -> `search_salons_ranked`, ANDed with city/date/period;
  already gates is_active ∧ listed_on_marketplace ∧ NOT is_test). Extend with a `count_only` path.
- `search_salons_ranked(p_q,p_limit,p_query_embedding)` (live) , city-agnostic, so "everywhere" = drop `.eq(city_id)`.
- `salons_with_slot_in_hours(...)` (live) , date/period availability.
- `SearchTemplate.tsx` EmptyState (1247-1256 + 1664-1716) , insertion point for the helper (`q`,`activeCity`,`total` in scope).
- `SearchOverlay.tsx` , the production overlay (port target); `buildParams`/`navigate` already make the correct AND-combine URL.
- `lib/cities.ts` haversine + `cities.latitude/longitude` (present for the 3 live rows).

## Net-new (small): `count_only=1` on `/api/salons`; `GET /api/search/no-results`; `get_nearby_cities` RPC; SQL category matcher; port the mockup motion into SearchOverlay.

## Feature 1 , query-led search (mostly done)
Port the mockup's `expand` scroll-linked motion (lines 79-132) into `SearchOverlay` (treatment only; keep
the URL contract + data hooks). Drop the mockup's RECENTS/FEATURED stubs; wire real `useRecentSearches`.
Backend changes: NONE. Verify AND-combine via curl (`q=Haarschnitt&city=Basel` subset; `&city=Bern` -> 0 = the trigger).

## Feature 2 , no-results helper (fires when `total===0 && q.length>=2`)
One endpoint `GET /api/search/no-results` (q, city, date) runs in parallel server-side, returns only count>0:
- **Überall suchen -> N**: same query minus the city predicate. Needs `count_only=1` (skip joins/hydration/slots; keep gates).
- **In <nearby city>: N**: `get_nearby_cities` RPC (haversine over `cities`) + count per city. Gate behind ">=2 cities have salons" until supply exists (R1).
- **Meintest du <category>**: deterministic SQL/synonym match (NOT the Gemini `detectCategory` , 300-800ms on the hot empty path). Render only if count>0.
Frontend: `<NoResultsHelper>` in EmptyState; tappable rows that push the adjusted URL (drop/swap city, swap to `?category=`).

## Risk register (top)
- **R1 HIGH , empty marketplace outside Basel.** Nearby fallback near-useless today. Ship 3a+3c now; gate 3b behind a supply check.
- **R2 HIGH , 8-vs-3 city mismatch.** Overlay lists 8, DB has 3 -> picking Lausanne/Genf -> 0 + nearby RPC can't resolve origin. FIX: trim overlay to 3 real cities now (recommended) OR seed the 5 missing `cities` rows (show 0 until supply).
- R3 MED , count cost on empty path -> `count_only` is one indexed query; run the <=5 in parallel; reuse the cached embedding.
- R4 MED , `total: items.length` caps at 60 in semantic mode -> show "60+"; exact >60 needs a count RPC (defer).
- R5 MED , Gemini latency -> use SQL category match on this path.
- R6 MED , `salons_with_slot_in_hours` not self-scoped -> count_only must keep the main-query gates.
- R7/R9/R10 LOW , public counts only (no PII); city casing via RPC slug; emptyResult fires before slot fan-out (correct).
- R8 LOW , delete dead SearchResults.tsx + /api/salons/search (Phase 4).

## Phase 0 , BLOCKING owner decisions
- **D1 city list:** trim overlay to 3 real cities (recommended) vs seed 5 missing rows.
- **D2 nearby radius** (only if seeding / keeping 8): ~100km (changes nothing with current data).
- **D3 category matcher:** SQL/synonym (recommended) vs Gemini.
- **D4 copy:** final de/en/fr/it strings for the 3 fallback rows ("Überall suchen", etc.).

## Phases (each shippable)
1. Port the overlay motion (Feature 1 visual), no backend , verify + design-verifier.
2. `count_only=1` on `/api/salons` (self-test good/bad).
3. `get_nearby_cities` RPC (additive migration) + `/api/search/no-results` + `<NoResultsHelper>` (gate nearby on supply).
4. Cleanup: delete dead SearchResults.tsx + /api/salons/search + REMOVED.md.

## Post-mockup wiring (owner confirmed 2026-07-01)
After the mockup is signed off: port into the real `SearchOverlay` (per "Feature 1" above) AND wire personalization , the **DNA** (style-affinity point system: `user_style_affinity` / search-book affinity, see project memories `project_style_affinity_for_you` + `project_search_book_points`). The search results + suggestions should be personalized by the user's DNA/affinity, not just raw ranking. This is part of the port, not the mockup.
