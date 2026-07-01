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

### DNA wiring , DONE + verified 2026-07-01 (commit 678a7b129, migration 20260701120000_search_dna_affinity.sql)
- `search_salons_ranked` + `search_suggest` now read the signed-in caller via **`auth.uid()` inside the function** (same 3-arg signatures , CREATE OR REPLACE preserves grants, no DROP/GRANT, no route changes) and add `w_affinity * category_affinity` to the score, mirroring `discovery_feed_for_you`.
- **`search_ranking_weights.w_affinity` (new, default 0.0 = INERT).** The feature ships dark; one UPDATE activates it.
- **Security:** auth.uid() (not a caller param) closes the IDOR the council flagged; search_path pinned; no injection. Passed the catastrophic-op guard (no DROP/GRANT) by keeping signatures.
- **Verified live:** anon results byte-identical to pre-migration baseline (no regression); auth.uid() resolves inside the definer fn; with w_affinity temporarily 1000 the test user's affinity boosted 8/12 coiffeur results (rolled back).
- **Taxonomy mismatch caught + bridged.** Discovery affinity vocab (hair/nails/lashes/brows/beard) != salon vocab (coiffeur/barbershop/nails/spa). Pre-bridge the join matched 0 salons (silent no-op). Mapped confident pairs: hair->coiffeur, beard->barbershop, nails->nails.

### OPEN owner decisions (DNA)
- **D5 activation weight.** `update public.search_ranking_weights set w_affinity = <x> where id = 1;` Recommend starting ~0.3-0.5, tune live (instantly reversible). Currently 0.0 (off).
- **D6 lashes/brows/spa mapping.** These affinity/salon categories have no clean counterpart, so they do NOT boost today (graceful). Owner to confirm: should a lashes/brows-affinity user be nudged toward `spa` salons? Should `spa` map from any affinity category? Add the CASE arms once decided.
- **Data note:** only 1 user has category affinity today; the daily `style-affinity-recompute` cron grows it from discovery saves/likes/searches. Real personalization scales with usage.

### Feature 2 (no-results helper) + i18n , DONE 2026-07-01 (commits 9709b93e4, d98e317ac)
- **No-results helper SHIPPED.** `GET /api/search/no-results` (self-contained: reuses `search_salons_ranked` + a category tally; NO `/api/salons` change, NO migration/RPC , sidesteps the DDL guard). Returns `anywhere` (drop-city count) + `category` (dominant-category browse), each only when count > 0 (no fabrication). `<NoResultsHelper>` renders in SearchTemplate's EmptyState above the fallback buttons. Verified: Coiffeur+Bern -> 12 + coiffeur 8; Nagel+Bern -> nails 4; nonsense -> nulls.
  - **Nearby-city row DEFERRED** (R1/D1): all live salons are in Basel, so a nearby row is useless until supply grows. Add it (haversine over cities, gate on >=2 cities-with-salons) when Zürich/Bern have salons.
- **i18n DONE:** the 20 SearchOverlay port keys + 4 no-results keys translated to en/fr/it (were German placeholders). Competent translations; owner may refine tone.
- **D3 (category matcher):** resolved to the dominant-category-of-matches approach (reuses existing fuzzy/trigram), NOT Gemini and NOT a hand-keyword list. D1 resolved to 3 real cities (nearby deferred). D4 copy: shipped competent de/en/fr/it, owner may refine.

## STILL open (genuine owner decisions only , not blocking)
- **D5 DNA activation:** `update public.search_ranking_weights set w_affinity = <x> where id = 1;` , left at 0.0 (inert). This is a product go-live + tuning call (needs real affinity data to tune; only 1 user has any today), so it is intentionally the owner's to flip, not a default I set blind. Recommend ~0.3-0.5, tune live.
- **D6 lashes/brows/spa category mapping** (see DNA section) , add CASE arms when decided.
