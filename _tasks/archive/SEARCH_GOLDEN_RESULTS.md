# Smart Search: Golden-Query Verification

Invariant-based verification harness for the Phase 1 Smart Search engine
(Postgres FTS + trigram + one-way synonyms + rating-blended ranking).

- Harness: `_tasks/search-golden-queries.ts`
- Run: `npx tsx _tasks/search-golden-queries.ts` (from repo root `/Users/sulo/Documents/solen`)
- Reads env from `.env.local` the same way the repo's other scripts do
  (`scripts/seed-coiffeur-rails.ts` / `scripts/enrich-coiffeur-demo.ts`):
  `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
- Read-only on the engine: it only CALLS `search_salons_ranked` /
  `search_suggest` and reads the `salons` + `services` tables (no writes, no DDL,
  no DB mutation). It does NOT edit the RPCs, routes, or migrations.
- Exit code: `0` when all invariants hold, non-zero (`1`) when any assertion
  fails, `2` when the service-role env is missing.

The engine contract (read-only reference):
- `supabase/migrations/20260606190706_search_phase1_rpcs.sql`
- `supabase/migrations/20260606190515_search_phase1_synonyms.sql`
- callers: `app/api/salons/search/route.ts`, `app/api/search/suggest/route.ts`

## Design: invariants, not hardcoded ids

Every case asserts a structural property (count thresholds, set overlap,
visibility) instead of pinning specific salon UUIDs, so the harness survives
seed-data churn. The one exception by necessity is the security invariant, which
reads the live `salons` table to derive the "must never appear" set, then asserts
that set is disjoint from every ranked result.

## Cases

| # | Case | Query | Invariant |
|---|------|-------|-----------|
| 1 | exact | `Haarschnitt` | >= 1 salon (FTS exact) |
| 2 | typo | `haarschnit` | >= 1 salon (trigram tolerates 1-char drop) |
| 3 | prefix / as-you-type | `herr` | >= 1 salon (reaches Herren* services) |
| 4 | compound | `Haarschnitt` | a marketplace-visible salon offering a Herren* compound haircut service appears (ILIKE branch) |
| 5a | synonym de | `maenner` | >= 1 salon, result overlaps the canonical `herren haarschnitt` set |
| 5b | synonym de | `männer` | >= 1 salon, result overlaps the canonical `herren haarschnitt` set |
| 6 | fr bridge | `coupe homme` | >= 1 salon (fr -> de synonym) |
| 7 | it bridge | `taglio uomo` | >= 1 salon (it -> de synonym) |
| 8 | junk | `asdfqwerty` | exactly 0 |
| 9a | short guard | `` (empty) | 0 (RPC nullifies blank) |
| 9b | short guard | `a` | 0 (single char) |
| 10 | SECURITY (ranked) | 27 probe queries | NO salon with `is_test=true` OR `listed_on_marketplace=false` OR `is_active=false` appears in ANY `search_salons_ranked` result |
| 11 | SECURITY (suggest) | 5 probe queries | same hidden set never appears in any `search_suggest` `salons[]` group |

The security probe set (case 10) re-runs every golden query plus a battery of
broad category / canonical / generic terms (`coiffeur`, `salon`, `haar`,
`massage`, `färben`, `nägel maniküre`, etc.) each at `p_limit=500`, unions every
returned `salon_id`, and intersects with the hidden set. The hidden set is built
exactly per spec with a PostgREST `.or("is_test.eq.true,listed_on_marketplace.eq.false,is_active.eq.false")`.

## Latest run (2026-06-06, project `tocfnsmxmdxkrcmjzzdw`)

Service-role env loaded cleanly. Result: **9/13 pass, 4 fail.** The
**SECURITY INVARIANT PASSES** (0 leaks across 27 ranked probes; 0 leaks across
5 suggest probes; hidden-set size = 4).

```
==============================================================================================================
CASE                       QUERY                  RESULT  DETAIL
--------------------------------------------------------------------------------------------------------------
exact                      Haarschnitt            PASS    7 salon(s)
typo                       haarschnit             PASS    7 salon(s)
prefix                     herr                   PASS    6 salon(s)
compound                   Haarschnitt -> Herren… PASS    matched (>=1 of 6 compound salon(s) is in ranked result)
synonym-de:maenner         maenner                FAIL    0 salon(s); overlap-with-canonical=false (canonical set=7)
synonym-de:männer          männer                 FAIL    4 salon(s); overlap-with-canonical=false (canonical set=7)
fr                         coupe homme            PASS    3 salon(s)
it                         taglio uomo            FAIL    0 salon(s)
junk                       asdfqwerty             PASS    0 salon(s)
short-guard:""             (empty)                PASS    0 salon(s)
short-guard:"a"            a                      FAIL    19 salon(s)
SECURITY-INVARIANT         27 probe queries       PASS    0 leaks. hidden-set size=4; distinct ranked salons probed=19; probe queries=27
SECURITY-INVARIANT(sugges… 5 suggest probes       PASS    0 leaks across 5 suggest probes
==============================================================================================================

SUMMARY: 9/13 cases passed, 4 failed.
SECURITY INVARIANT (ranked): PASS, no hidden salons leaked
```

## Diagnosis of the 4 failures

Each was confirmed with read-only SQL against the live DB (not guessed).

### F1 + F2 + F3 share one ENGINE BUG: synonym expansion is AND-joined

`search_salons_ranked` builds its FTS query as:

```sql
websearch_to_tsquery('german', f_unaccent(norm || ' ' || expanded))
```

`websearch_to_tsquery` joins bare terms with **AND**. So when a synonym expands,
the user's ORIGINAL tokens get ANDed with the canonical, instead of OR-ed:

| query | norm | expanded | resulting tsquery |
|-------|------|----------|-------------------|
| `herren haarschnitt` (direct) | herren haarschnitt | (none) | `'herr' & 'haarschnitt'` |
| `männer` | manner | herren haarschnitt | `'mann' & 'herr' & 'haarschnitt'` |
| `taglio uomo` | taglio uomo | herren haarschnitt | `'taglio' & 'uomo' & 'herr' & 'haarschnitt'` |
| `coupe homme` | coupe homme | herren haarschnitt | `'coup' & 'homm' & 'herr' & 'haarschnitt'` |

Consequences:

- **F2 `männer` (engine-bug):** expansion is correct, but the FTS branch now
  requires a service doc to contain `mann` AND `herr` AND `haarschnitt`. The 7
  real haircut salons have "herren haarschnitt" but not the literal token
  "mann", so FTS misses them. The 4 rows `männer` does return come only from the
  trigram branch matching "manner" on incidental names, which is why overlap with
  the canonical set is 0.
- **F3 `taglio uomo` (engine-bug):** requires `taglio` AND `uomo` AND `herr` AND
  `haarschnitt` in one doc. No German service doc contains "taglio"/"uomo", so the
  AND can never be satisfied -> 0 results.
- The fr case `coupe homme` only PASSES by luck: 3 of the 7 haircut salons have
  bilingual fr+de service docs ("Coupe Homme / Herren Haarschnitt"), so they
  satisfy `coup & homm & herr & haarschnitt`. Verified: those 3 are exactly the
  overlap with the canonical set, and no name literally contains "coupe homme"
  (it matches purely through the bilingual `search_doc`). The same bug that kills
  `taglio uomo` is latent under `coupe homme`; it just happens to find data.

**Net:** cross-language and colloquial synonyms are effectively broken whenever
the salon's `search_doc` does not also contain the user's literal source-language
words. The intended behavior is "expand to canonical and match THAT". Fix is in
the engine (out of scope here, read-only): build the expansion as an OR, e.g.
union the tsqueries `to_tsquery(norm) || to_tsquery(expanded)`, or join with
`' or '` before `websearch_to_tsquery`, or run the expansion as a separate
matched branch.

### F1 `maenner` (test-data-gap, with an engine angle)

`f_unaccent('männer')` = `manner`, and the synonym table seeds the term `männer`
(stored, compared after unaccent as `manner`). But `f_unaccent('maenner')` =
`maenner` (no `ae` -> `ä` transliteration), and there is no `maenner` seed row.
So `maenner` never matches a synonym and never expands -> 0 results.

This is primarily a **seed gap** (add `('de','maenner','herren haarschnitt')`
and the other `ae/oe/ue` ASCII fallbacks), with a secondary engine angle
(`f_unaccent` does not transliterate the German ASCII digraphs). Either fix
resolves it. Confirmed: `maenner` -> expanded = `null`; `männer` -> expanded =
`herren haarschnitt`.

### F4 `a` short-guard (contract-boundary, defense-in-depth gap)

The 2-character minimum is enforced only in the HTTP routes
(`if (!q || q.length < 2)` in both `route.ts` files). The RPC itself has **no
length guard**: it only does `nullif(..., '')`, so blank is caught but a single
character is not. The RPC's ILIKE branches run `name ilike '%a%'`, which matches
any name containing the letter "a", so calling `search_salons_ranked('a')`
directly returns 19 salons.

In normal app flow this is masked by the route guard, so user-facing behavior is
fine. But any other caller of the RPC (a future server action, a cron job, this
harness) bypasses the guard. The harness intentionally fails this case to flag
the missing defense-in-depth. Fix (engine, out of scope): add
`and length((select norm from qx)) >= 2` (or `>= 1` if single-char prefix is
desired) inside the RPC.

## What PASSED (and what that proves)

- exact / typo / prefix all pass: FTS, trigram typo-tolerance, and prefix
  reach are working on the German path.
- compound passes: the ILIKE compound branch surfaces Herren* compound haircut
  services for a bare `Haarschnitt` query.
- junk + empty pass: no false positives on gibberish or blank.
- **SECURITY INVARIANT passes on BOTH RPCs.** This is the most important result:
  the three visibility gates (`is_active` AND `listed_on_marketplace` AND NOT
  `is_test`) baked into the RPCs hold across 27 broad ranked probes and 5 suggest
  probes. No test / unlisted / inactive salon leaked into any result. Note the
  RPC is actually slightly STRICTER than the spec's hidden-set definition: it
  filters `listed_on_marketplace` truthy, so it also excludes NULL
  `listed_on_marketplace` rows (the column is `DEFAULT true` but nullable), which
  the spec's `=false` set would not include. The harness's hidden set follows the
  spec literally and still finds 0 leaks.

## Re-running

```
cd /Users/sulo/Documents/solen
npx tsx _tasks/search-golden-queries.ts
```

The 4 current failures are real engine / seed findings, not harness defects. The
harness will go green on these cases once: (1) the synonym AND/OR bug is fixed
(unblocks F2 + F3 and makes F1 work after its seed is added), (2) the `maenner`
seed (and sibling ASCII digraphs) are added or `f_unaccent` transliterates them
(F1), and (3) a length guard is added inside the RPC (F4). All three are engine /
data changes that are out of scope for this read-only harness.
