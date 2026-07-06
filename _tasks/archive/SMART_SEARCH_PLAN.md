# Smart Search , Architecture & Build Plan v2 (full scope, council-reviewed)

**Status:** PLAN. v2 supersedes v1. Grounded in a re-audited live DB (`tocfnsmxmdxkrcmjzzdw`) + a 5-lens architecture council (Postgres/FTS, IR/relevance, migration/RLS, privacy/Swiss-compliance, marketplace-product).
**Owner decision (2026-06-06):** build the **full** system , nothing deferred. The council's *fixes* are folded in; the council's *scope-cut* (defer the learning loop) was **overridden by the owner**. The legal guardrails (consent / erasure / anti-manipulation) are NOT optional , they ship with the loop because without them it's unlawful + riggable.
**Decision still standing:** in-house Postgres (no Algolia/Typesense). The dormant pgvector stack is in-house too, so it's folded in, not bought.

---

## 0. Corrected ground truth (v1's audit was wrong on 4 facts , fixed here)

| Fact | Reality (re-audited) | Consequence |
|---|---|---|
| Scale | 23 salons (all geo-coded), 83 services, 67 categories, **71 staff** | quality + future-proofing, not perf |
| **Staff table** | **`staff_members` EXISTS (71 rows)** , `name, bio, specialties[], is_active, access_role`. **No public-visibility flag.** `/api/salons/search` already searches it by name. | Stylists tab is **in scope**, but needs a new `is_publicly_listed` + owner/staff consent flag before exposing real people. |
| **Semantic search** | **ALREADY BUILT, dormant:** `search_embeddings` table (0 rows), `match_search_embeddings` RPC (city + marketplace gated), `/api/search/smart`, `lib/search/embeddings.ts` (Gemini `text-embedding-004`, 768-dim), admin backfill route. | Phase "semantic" = **populate + fold in the existing stack**, not build. This is also the real fr/it cross-lingual fix. Costs $ per query (Gemini) , gate it. |
| **Geo** | `salons.latitude/longitude` populated for all 23; `get_nearby_salon_ids()` RPC + `077_geospatial_search` + earthdistance. | Proximity works **today**. But 1 city = no variance → keep geo **wired but weight 0** until multi-city. |
| Availability | `availability_slots` exists. | Availability-boost is feasible via a pre-aggregated per-salon flag (not a live slot scan). |
| Extensions | pgvector 0.8 + pg_cron + btree_gin + pg_stat_statements **installed**; pg_trgm + unaccent + fuzzystrmatch **available, not installed**. | One `CREATE EXTENSION` each in Phase 0. |
| FTS precedent | `discovery_fts_doc()` = IMMUTABLE wrapper, hardcoded regconfig, **no `unaccent`**; GIN index. | Mirror it EXACTLY (solves the immutability trap , see §3). |
| Visibility gates | `/api/salons` enforces `is_active ∧ listed_on_marketplace ∧ is_test=false`. **`/api/salons/search` leaks `is_test` today.** | Gates become hard-coded, non-optional predicates in the RPC (§3). |
| Migrations | healthy chain, forward-only (**no DOWN convention exists**). | "reversible" replaced with explicit teardown scripts (§8). |
| App already has | cookie consent (analytics = opt-in), a deletion/anonymize pipeline (does NOT touch search logs), a rate-limiter (`lib/ratelimit.ts`, **fail-open when Upstash env missing**). | Reuse consent + wire erasure + harden the limiter (§8). |

---

## 1. Architecture , one frozen RPC, hybrid brain

Everything routes through one Postgres function, **`search_marketplace(params jsonb)`** , the frozen contract behind `/api/search/suggest` (as-you-type) and `/api/salons/search` (results). The HTTP routes + UI are thin callers; internals evolve without touching them.

It is a **hybrid** brain from the start (because both halves already exist in-house):
- **Lexical** , FTS (weighted tsvector) + trigram (typos + prefix) + synonyms.
- **Semantic** , the existing `match_search_embeddings` (pgvector), fused in by reciprocal-rank-fusion (RRF) once embeddings are populated. This is the cross-lingual fr/it answer.

The contract carries query + ALL filters in one call → structurally fixes the filter-drop bug, and the three visibility gates live in exactly one place.

---

## 2. The pipeline (inside the RPC)

```
1. NORMALIZE   lower → f_unaccent (IMMUTABLE wrapper, §3) → trim → tokenize
2. EXPAND      synonyms: ONE-WAY only (colloquial/fr/it → canonical), capped fan-out,
               expanded terms carry a match_via_synonym flag (discounted in rank, ×0.6)
3. MATCH       a) FTS  , to_tsquery built by hand so synonyms + prefix work:
                  - whole-token lexemes for stems
                  - last token gets a :* PREFIX so "herr" hits "Herrenschnitt" (autocomplete)
               b) TRIGRAM , word_similarity (%>) for typos AND prefix fallback
               c) COMPOUND , an ILIKE '%token%' branch so "Haarschnitt" hits
                  "Herrenhaarschnitt" (the german config does NOT decompound)
               d) SEMANTIC , match_search_embeddings (vector), fused via RRF
4. FILTER      hard-coded gates (is_active ∧ listed_on_marketplace ∧ NOT is_test)
               + user facets (city, gender, price, open_now, walk_in, deals, rating, date)
               , ALL in the same query (fixes filter-drop)
5. RANK        two-stage: (i) cheap candidate set from 3a-d top-K (~200);
               (ii) blend ONLY on top-K:
               score = w_text·ts_rank + w_fuzzy·sim + w_sem·vector_sim
                     + w_rate·bayesian_rating + w_pop·debiased_popularity
                     + w_geo·proximity(0 until multi-city) + w_avail·has_slot_soon
               weights in search_ranking_weights (1-row, tunable live)
6. PAGINATE    stable tiebreak by id; statement_timeout + q-length + fan-out caps
7. RETURN      suggest mode → grouped top-5 (services/salons/stylists);
               results mode → full cards + count
```

Two helper SQL functions (`_suggest`, `_results`) share the matchers but differ in shape/limits , avoids overloading one body with two perf profiles.

---

## 3. Schema (additive; IMMUTABLE-correct; gated; teardown-scripted)

- `f_unaccent(text)` , an **IMMUTABLE** wrapper over `unaccent('unaccent',$1)` (the standard, safe "promise"; the dictionary is fixed). Required because stock `unaccent` is STABLE and **cannot** sit in a generated column/index (this exact trap silently broke a GIN index here once , migration 067).
- `service_search_doc(...)` / `salon_search_doc(...)` , IMMUTABLE `LANGUAGE sql`, `SET search_path=public`, hardcoded `german`+`english` regconfigs (mirror `discovery_fts_doc`). Used in BOTH the generated column AND the RPC's WHERE/ORDER so the GIN index is actually hit.
- `services.search_doc` / `salons.search_doc` GENERATED tsvector + GIN. Plain `ts_rank` (not `ts_rank_cd` , density is meaningless on a concatenated dual-config vector). (Adding the column locks+rewrites the table , trivial at 23/83, do off-peak.)
- trigram GIN on names (for `word_similarity`/`%>`). Set `pg_trgm.word_similarity_threshold` deliberately.
- **Reconcile, don't duplicate:** reuse the existing `search_embeddings` + `match_search_embeddings`; the RPC calls it. Do NOT create a parallel vector table.
- New tables: `search_synonyms` (locale, term, canonical, weight, one-way, source, is_active), `search_events` (session_id, **user_id null**, query, query_norm, locale, city_id, results_count, clicked_type, clicked_id, clicked_position, booked, created_at), `search_popularity` (matview, REFRESH CONCURRENTLY, unique idx), `search_ranking_weights` (1 row). View `search_zero_results`.
- `staff_members.is_publicly_listed boolean default false` + consent capture , gates the Stylists tab.
- RPC + helpers: `GRANT EXECUTE ... TO anon, authenticated, service_role` (miss this → every search 401s). Every function `SET search_path=public`.
- **Teardown scripts** per phase (drop cron → RPC → indexes → generated cols → tables), since the repo is forward-only and "reversible" must be real, not asserted.

---

## 4. Multilingual

- de/en services → `german`/`english` FTS + `f_unaccent`.
- fr/it → three bridges, strongest last: (1) `service_categories` 4-lang labels, (2) one-way `search_synonyms` (~80 fr + ~80 it → canonical), (3) **the existing pgvector embeddings**, which match a fr query to a de service *semantically* , the genuine fix. Backfill embeddings (existing admin route) makes Romandie/Ticino search real, but note: search is downstream of **fr/it supply + content**, which is a business prerequisite, not a search fix.

---

## 5. Ranking (honest, debiased, fair)

- **Bayesian rating** (IMDb-style prior) , a 5.0 from 1 review must not beat 4.6 from 200.
- **Debiased popularity** , not raw lifetime CTR. Time-decay (exp half-life), position-debias (divide by an empirical position-prior , we log `clicked_position`), Bayesian-smoothed for tiny samples, **per distinct session** not raw clicks.
- **New-salon exploration boost** , a temporary multiplier for low-impression/new listings so they get seen before popularity can bury them (marketplace-supply protection , existential at 23 salons).
- **Browse mode** (no query) , its own formula (bayesian_rating × availability × small new-boost; geo when multi-city). Most sessions are browse, so this is first-class, not an afterthought.
- `w_geo = 0` until >1 city; `w_avail` from a pre-aggregated `has_slot_soon` flag (pg_cron), never a live slot scan.

---

## 6. Learning loop (built now, built safe)

```
search → POST /api/search/event (rate-limited, consent-gated) → search_events
result click / booking → same endpoint (clicked_id validated ∈ returned set; booked verified vs a real bookings row)
        pg_cron nightly  → REFRESH MATERIALIZED VIEW CONCURRENTLY search_popularity
                           (time-decay + position-debias + smoothing baked into the SQL)
        pg_cron weekly   → refresh search_zero_results
        admin (authenticated, role=admin) reviews zero-results → adds one-way synonyms
        anomaly check    → clicks/distinct-session, click→booked sanity, per-IP volume → alert
```

Anti-manipulation (mandatory, the loop is public-facing): logging goes through a **rate-limited Next.js endpoint** (not a raw public RPC), one impression-set per session, `booked` reconciled against `bookings`, owners excluded from clicking their own listings, `session_id` server-issued (HMAC) + short-lived.

---

## 7. Build order (everything in scope; dependency order)

| Phase | What | Notes |
|---|---|---|
| **0** | extensions (pg_trgm, unaccent) · `f_unaccent` + doc wrappers · golden-query harness (seed from real `discovery_search_events`, held-out split) · reconcile decisions (§11) | safety + baseline |
| **1** | unified `search_marketplace` RPC + FTS + **hard-coded visibility gates** + **fix filter-drop** · repoint both endpoints + grants | beats ILIKE immediately |
| **2** | trigram typos + **prefix (`:*`/`word_similarity`)** + **compound ILIKE branch** | autocomplete + de compounds |
| **3** | synonyms (one-way, discounted, fr/it seed) + **thin/zero-result UX** (auto-broaden, nearby, categories, notify-me) | the common case at this stage |
| **4** | ranking blend: bayesian rating, availability pre-agg, geo-ready(0), exact>stem>synonym | explainable, no popularity yet |
| **5** | **semantic/hybrid** , backfill the existing `search_embeddings`, fuse via RRF, reconcile `match_search_embeddings` into the RPC | real cross-lingual |
| **6** | learning loop , `search_events` (consent+erasure+retention) + safe logging endpoint + debiased pg_cron popularity + new-salon boost + anomaly alerts + zero-result mining | the auto-improve, built safe |
| **7** | ops , search→booking dashboard, manipulation alerts, `get_advisors` clean, search_path audit, perf, teardown scripts verified | launch-ready |
| **+** | Stylists tab , after `is_publicly_listed` + consent flag ships | data exists, consent doesn't |

---

## 8. Security / privacy / compliance (non-negotiable, ships with the loop)

- **Consent** , behavioural logging gated on the app's existing `analytics` opt-in. No consent → log only a fully anonymous event (no session/user) for zero-result mining, or nothing.
- **Erasure** , `search_events.user_id → profiles(id) ON DELETE SET NULL` + extend the existing anonymize trigger to NULL user_id + add `search_events` to the deletion accountability log.
- **Retention** , raw `query` TTL (30-90d via pg_cron purge); keep only anonymous aggregates beyond that. Activate `pg_partman` from day one.
- **Data minimization** , `session_id` (rotating, server-issued) preferred over `user_id`; the loop needs patterns, not people.
- **Anti-manipulation** , see §6. The current rate-limiter fail-opens when Upstash env is unset , fix that or popularity is trivially riggable.
- **No raw queries to external LLM** , zero-result synonym mining is manual, OR aggregated+thresholded+in-region only. No per-user query text leaves CH/EU.
- **Injection** , `websearch_to_tsquery`/parameterized everywhere; every SECURITY DEFINER fn pins `search_path` (4 existing fns forgot this , don't inherit the bug).
- **Data residency** , confirm the Supabase project region is EU/CH for behavioural data (open item , `get_project`).
- **Advisors** , run `get_advisors(security)` after every DDL phase; remediation is part of the phase, not deferred.

---

## 9. Verification

- **Golden-query harness** , real queries seeded from `discovery_search_events`, split into a tuning set + a **frozen holdout** (never tuned against). Cases: exact, stem, typo, prefix, **compound**, synonym, fr/it, and a "test salon must NEVER appear" assertion.
- **Primary metric: search → booking conversion** (the business outcome), not CTR. CTR + zero-result-rate are diagnostics only (zero-rate falls trivially by returning junk , pair it with a precision proxy like top-1 accuracy / MRR on the holdout).
- **Manipulation watch** , post-loop, alert on click anomalies.

---

## 10. Residual risks (after the fixes)

- Relevance ceiling is low while supply is tiny (more a supply problem than a search one) , the thin-result UX (§7 P3) is the mitigation.
- `ts_rank` isn't BM25; fine ≤ a few thousand docs; `rum`/`pgroonga` are the noted upgrade path (no rebuild , behind the RPC).
- Embeddings cost $ per query (Gemini) , cache + only on the results path, never per-keystroke suggest.
- fr/it markets need supply + content, not just search.

---

## 11. Reconciliation decisions (resolve in Phase 0)

1. **Embeddings** , fold the existing `match_search_embeddings` into `search_marketplace` as the semantic component (recommended) vs keep `/api/search/smart` separate. Rec: fold in; retire the standalone route.
2. **Stylists** , add `staff_members.is_publicly_listed` + consent; ship the tab after. (Don't expose 71 real people without it.)
3. **Geo** , wire proximity, weight 0 until >1 city.
4. **Apply path** , in-repo migration files applied by `db push`; MCP `apply_migration` ONLY with the identical file committed same-change (the drift history makes this a hard rule, not a choice).

---

## 12. Build boundaries

I author: additive migrations (+ teardown scripts), the RPC + helpers + `log`/`f_unaccent` fns, API rewrites, seed data, the safe logging endpoint, UI hooks + thin-result UX, the golden-query harness, the admin zero-result view, the `is_publicly_listed` flag. Apply via in-repo migrations (you `db push`) or MCP `apply_migration` (file committed same-change). No data deletion, no destructive ops, no commits/pushes without your say.
