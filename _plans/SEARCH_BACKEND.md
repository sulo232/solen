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

## NEXT TASK , treatment-accurate `from_price` on the rich-search salon cards (owner chose "proper fix" 2026-07-01)
**Problem (proven with data):** the rich-search salon card shows `from CHF X`. Today X = the salon's OVERALL cheapest active service (venue floor). On a STYLE query ("buzzcut") this reads misleadingly low, e.g. Old Town Barbers shows `ab CHF 15` , that 15 is an "Augenbrauen" (eyebrow) service TAGGED `category='barbershop'`. Council (3 lenses) voted category-scoped, but the live data falsifies it: everything a barbershop offers (eyebrows, beard, cuts) is tagged the one broad category, so `barber_floor == venue_floor == 15`. No floor computation makes buzzcut accurate.

**Root cause:** the style synonym maps to a BROAD CATEGORY, not a treatment. `search_synonyms`: the 11 terms buzz cut/buzzcut/crew cut/fade/high fade/low fade/pompadour/quiff/skin fade/taper/undercut -> canonical `barbershop`; the 5 terms bob/layers/lob/pixie/shag -> `coiffeur`. Category canonicals can't isolate "the haircut price".

**Why the naive remap DOES NOT WORK (measured, do NOT ship it):** remapping buzzcut -> `herren haarschnitt` BREAKS salon recall. `websearch_to_tsquery('herren haarschnitt')` = `herren & haarschnitt` (AND). Salon `search_doc`s contain the category word "barbershop", not the phrase; services are compounds ("Herrenschnitt") that don't tokenize to `herren`+`haarschnitt`. Measured: `barbershop` tsquery matches 2 live salons, `herren haarschnitt` matches 0, `herrenschnitt` matches 0 -> buzzcut search would drop 2 -> 0 salons (catastrophic). SALON matching relies on category words; SERVICE names carry the treatment. The two must NOT share one canonical.

**The actual design (pricing-canonical separate from matching-canonical):**
1. Keep the current style->category synonym for SALON MATCHING (preserves recall). Do NOT touch the `barbershop`/`coiffeur` mapping used by the salon match.
2. Add a PRICING hint: a way to know "buzzcut is a men's-haircut treatment" so `from_price` can scope to the salon's HAIRCUT services (which ARE named "Herrenschnitt"/"Coupe"/"Haarschnitt"...). Options: (a) new column `search_synonyms.price_canonical` (e.g. buzzcut.price_canonical = 'herren haarschnitt' or 'schnitt'), or (b) a synonym `kind` discriminator ('match' vs 'price'), or (c) a separate small `style_treatment` map. Prefer (a): least churn, one nullable column, read only by the from_price subquery.
3. `from_price` becomes treatment-matched at the SERVICE level: `min(price)` of the salon's active services whose `name_de/name_en/search_doc` match the price-canonical tokens (service names carry the treatment even when the salon doc does not). Test the German-compound matching: `schnitt` as a stem likely matches "Herrenschnitt"/"Damenschnitt"; verify with real service rows before trusting it.
4. Fallback: `coalesce(treatment-matched-min, venue-floor)`. Owner leans "show an accurate price", so fall back to venue floor only when the treatment match is empty; accept the venue floor as the documented floor when even that is a cross-treatment add-on (undetectable today).

**Mandatory verification (the "own verification" this task carries):**
- Per remapped/priced term, assert SALON-match parity before vs after (no recall drop) , the buzzcut 2->0 result is the canary.
- Assert `from_price` for buzzcut at a barber changes from the eyebrow floor (15) to the real men's-cut price, and stays a REAL row (no fabrication).
- German-compound check: does the price-canonical actually match the service names in the live DB (not just in theory)? execute_sql the service-name match set per term.
- Re-run the rich-search screenshots (buzzcut de, coiffeur en) + council-review the RPC change.

**Interim (shipped, acceptable):** `from_price` = venue floor (commit cef5ad9b1). It's a real "starting at" price; the mislead is bounded and the owner has seen it. Stays until this task lands.

### DONE 2026-07-01 , treatment-accurate `from_price` SHIPPED (migration 20260701140000)
Built the pricing-canonical design above. `search_synonyms.price_canonical` added (nullable); set to `schnitt` for the 16 broad-category style terms (canonical in barbershop/coiffeur). `search_suggest` from_price is now `coalesce(min price of the salon's services whose name substring-matches the query / pcano tokens, kids cuts excluded ; venue floor)`. MATCHING CTEs untouched -> recall provably unchanged.
- **Verified live (RPC + overlay):** buzzcut -> 2 salons (unchanged), `ab 35 CHF` (was 15, the Maschinenschnitt/men's-cut floor, no longer the eyebrow). fade -> 3 salons all 35. balayage -> Atelier Haarwerk 220 (real balayage). coiffeur -> 35. massage/zzxq -> 0 (graceful). Overlay renders "ab 35 CHF". No console errors.
- **Substring (ilike) not tsquery** for the price match , handles German compounds ("Herrenschnitt" contains 'schnitt'); tsquery's AND-split does not.
- **KNOWN pre-existing matching quirk (NOT from this change, separate item):** "balayage" also matches "Nail Lounge Basel" (a nail salon) via the loose salon-match (word_similarity / search_doc). Its from_price correctly falls back to the venue floor (15). This is SEARCH-MATCH PRECISION, not pricing , the matching CTEs are unchanged by this migration. Park as a matching-precision follow-up if the owner wants tighter salon recall.
- **Note:** `schnitt` min can include a women's/unisex cut at a coiffeur or a Maschinenschnitt at a barber , it is the salon's cheapest ADULT cut (kids excluded), which is the honest "starting at" for a haircut style. Per-gender price canonicals (herren vs damen) are a future refinement if needed.
- **Council-cleared (correctness + security PASS).** Correctness caught a future-insert gap (a NEW synonym row with canonical barbershop/coiffeur + NULL price_canonical would silently price off the venue floor again). Hardened: `psyn` uses `coalesce(price_canonical, case when canonical in ('barbershop','coiffeur') then 'schnitt' else canonical end)` , the RPC is now self-correcting and does NOT depend on the one-time UPDATE. Security: injection-free (value expressions, no dynamic SQL), no new data exposure, auth.uid affinity untouched.
