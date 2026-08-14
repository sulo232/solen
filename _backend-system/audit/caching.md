# Caching , Solen vs `LAW.md` section 13 (audit 2026-07-16)

> Parts of this document were written from a source read and were WRONG. Live-verified corrections are marked `CORRECTED 2026-07-17` inline. Where this doc and the live re-audit disagree, live wins.

## Verdict

The check that matters most comes back **clean**: no personalized data is cached at a shared URL. All 7 files that set any cache header were read in full; every one that reads auth/session state correctly branches to `no-store`/`private`, and `Vary: Cookie` (the explicitly-wrong fix) appears **zero times** repo-wide. The real gaps are two silent no-ops and one dead invalidation hook. Neither is a privacy bug.

**Honest bottom line:** Solen caches very little (3 anon browse routes with real CDN headers, 4 `revalidate` routes, 2 module-level TTL Maps, 1 image proxy). At 28 salons that sparse posture is **legitimate, not a gap**.

## Per-principle table

| id | rule | verdict | evidence | severity |
|---|---|---|---|---|
| CACHE-01 | Next 15 `fetch()` uncached by default; no code assumes the Next 14 default | MATCH | `package.json:54` = `next: 15.3.8` (read, not recalled). Zero `unstable_cache` usage repo-wide. The 4 `revalidate` uses are explicit route-segment exports | NONE |
| CACHE-02 | CDN caching uses `Netlify-CDN-Cache-Control`, not a bare `Cache-Control`/`netlify.toml` block | ~~GAP~~ | `salon-of-month/route.ts:32` and `discovery/category-meta/route.ts:88` set only `Cache-Control` with `s-maxage`. Contrast the correct trio: `salons/route.ts:41-44`, `salons/[slug]/route.ts:26-29`, `lib/discovery/feed-cache-headers.ts:35-38` set both | LOW-MEDIUM (perf/cost only) |

> **CORRECTED 2026-07-17 (live re-audit):** two separate errors in the CACHE-02 row above.
> 1. **Citation:** `salons/route.ts:41-44` is NOT a cache-header implementation. Those lines are rate-limiting and searchParams parsing, containing zero cache headers. The real reference-correct header definitions live in `lib/salons/cache-headers.ts:31-34` (`ANON_CACHE_HEADERS`, sets both `Netlify-CDN-Cache-Control` and `Cache-Control`), a file this audit never names. It was moved out of the route on 2026-07-16 (the same date this audit is stamped) because re-exporting it broke a TS2344 type constraint.
> 2. **Verdict:** the GAP verdict itself is wrong. Both `salon-of-month` and `category-meta` set `s-maxage` via plain `Cache-Control`, and Netlify's own current docs confirm that IS honored at the edge (fetched live from docs.netlify.com/build/caching/caching-overview: "Cache-Control: general field that can apply to any CDN"; "If you specify more than one of the supported headers, Netlify will respect the most specific one", i.e. precedence, not exclusivity). The correct verdict is MATCH, not GAP. Recommendation #2 below (add `Netlify-CDN-Cache-Control` to these two routes, "copying" `salons/route.ts:41-44`) is therefore a no-op against a false premise. Additionally, `salon-of-month` has zero callers today (the public homepage calls the lib function directly, not the API route; only the admin dashboard hits it), so impact was zero even under the original false premise.
| CACHE-03 | Never cache an auth-varying response at a URL that does not encode it; never `Vary: Cookie` | **MATCH** | All 7 header-setting files read in full. 3 correctly branch to `no-store` on auth (`feed-cache-headers.ts:52-55`, `salons/[slug]/route.ts:41-43`, `loyalty/qr/[cardId]/route.ts:57`). The other 4 never read a session at all. `grep -rn "Vary"` = **0 hits** | NONE |
| CACHE-04 | In-memory `Map` never treated as fleet-consistent | MATCH | `lib/feature-flags.ts` (30s/10s TTL) and `lib/cities.ts` (5min) both fall back to a fresh DB read on a cold instance and document the tradeoff in comments | NONE |
| CACHE-05 | Postgres has no query cache; no materialized view without a measured slow query | MATCH | Zero materialized views live. No code reaching for a Postgres "query cache" setting | NONE |

> **CORRECTED 2026-07-17 (live re-audit):** the "zero materialized views" evidence is FALSE. `public.search_popularity` exists (`select schemaname, matviewname from pg_matviews` returns it), `ispopulated = true` (8192 bytes), and it is left-joined into three live search-ranking RPCs. It is refreshed nightly by a `pg_cron` job (`cron.job`: `search-popularity-refresh`, schedule `0 3 * * *`, `active = true`; 41 runs recorded, all `succeeded`, last run 2026-07-17 03:00). The MATCH verdict happens to survive because the view was built against a measured need, but the stated evidence for it was never checked against the live catalog and was wrong. See the CACHE-08 correction below, same underlying miss.
| CACHE-06 | TTL-cached user-editable value gets event-based invalidation | GAP | `lib/search/filter-availability.ts` ships `bustFilterAvailabilityCache()` whose own doc comment promises it fires on a settings change, but `grep -rn` finds it **called nowhere** | LOW |
| CACHE-07 | Stampede protection matches actual scale | MATCH | Zero Redis locking, zero XFetch. All 3 CDN routes use `stale-while-revalidate` only, the researched-correct default | NONE |
| CACHE-08 | No premature caching infrastructure | MATCH | No materialized views, no `unstable_cache`, no Redis-as-cache, no cache-tag purging. Upstash is used only for rate limiting/OTP/budget | NONE |

> **CORRECTED 2026-07-17 (live re-audit):** same error as CACHE-05: "no materialized views" is FALSE, `public.search_popularity` exists, is populated, is used by 3 live search-ranking RPCs, and is refreshed nightly by an active pg_cron job (`search-popularity-refresh`, `0 3 * * *`, 41 successful runs, last 2026-07-17 03:00). The MATCH verdict for CACHE-08 still stands (this view is not "premature," it backs real search ranking), but both CACHE-05 and CACHE-08 rested their evidence on a claim ("zero materialized views live") that was never checked against `pg_matviews` and was wrong. Do not re-derive this fact from a source read again; query the live catalog.

## The gaps

**1. Two routes intend CDN caching that never reaches the CDN (CACHE-02).** `salon-of-month/route.ts:32` and `discovery/category-meta/route.ts:88` copy the correct `public, s-maxage=N, stale-while-revalidate=M` shape but omit `Netlify-CDN-Cache-Control`, the only header Netlify's edge honours from a Function. `salon-of-month` additionally sets `max-age=0`, telling the browser not to cache either, so today that endpoint gets **zero caching at any layer**: every visitor triggers a fresh DB call. `category-meta`'s comment says "5-minute cache" and does not do what it says. Not a leak (both are unauthenticated public reads), a silent no-op. **Fix:** 2 lines each, copying `salons/route.ts:41-44`.

> **CORRECTED 2026-07-17 (live re-audit):** this whole paragraph's premise is FALSE. `GET /api/salon-of-month` was measured live and returns `cache-control: public, max-age=0, s-maxage=60`: `s-maxage` on a plain `Cache-Control` header IS honored by Netlify's edge (confirmed against Netlify's current docs, fetched live: precedence between the two headers, not exclusivity of one). So this is not "zero caching at any layer", it is caching at the CDN layer exactly as intended, and the correct verdict for CACHE-02 is MATCH, not GAP. Separately, `salon-of-month` has zero real callers: the public homepage calls the underlying lib function directly rather than hitting this API route, so even under the old (wrong) premise the user-facing impact was zero. The fix in recommendation #2 (below) is a no-op and should not be built. Also see the CACHE-02 table-row correction above: `salons/route.ts:41-44` is not a cache-header file at all, so "copying" it copies nothing.

**2. `discovery/thumb/[id]/route.ts` documents CDN caching it cannot deliver (CACHE-02 adjacent, LOW).** Sets `Cache-Control` only; its comment at line 46 claims "Netlify's edge cache handles repeat users," which does not hold for a Function response. Not broken (its 3-tier fallback of in-process Map -> Storage -> TikTok oEmbed still avoids the expensive round-trip, and browser `max-age=3600` is real), but the comment is inaccurate.

**3. The filter-visibility cache's bust hook is never called (CACHE-06).** `lib/search/filter-availability.ts:42-47` gates whether the Angebote and Für-wen search filters render at all, on a 5-min TTL. Both fields it depends on are user-editable through live write paths (`salons/[slug]/route.ts:102` writes `last_minute_discount_percent`; `services/route.ts:77` writes `suitable_gender`). Neither calls the bust function. The sibling `lib/cities.ts`'s `bustActiveCitiesCache()` IS correctly wired at `admin/cities/route.ts:74`, which is the pattern to copy. Effect: a salon owner turning on a deal waits up to 5 minutes for the filter to appear. Bounded, UX-only.

## Ranked recommendations

1. **Wire `bustFilterAvailabilityCache()` into the 2 write paths.** Cost: 2 one-line calls, following an existing in-repo pattern. First only because it is the sole finding touching the TTL-vs-invalidation law on user-editable data; still LOW.
2. **Add `Netlify-CDN-Cache-Control` to `salon-of-month` + `category-meta`.** Cost: 2 lines each. Second, not first, because the current failure mode is "not cached" (safe, slightly costlier), never "cached wrong."
3. **Same header on `discovery/thumb/[id]` + correct its comment.** Cost: 2 lines + a comment. Lowest of the three; the Storage tier already absorbs the cost.
4. **DO NOT DO YET, no trigger met:** Redis SETNX stampede locks, XFetch, materialized views, a general Redis response cache, Netlify Durable Cache, CDN cache-tag purging. No endpoint has been observed under stampede-level load; no query has been EXPLAIN-ANALYZE'd as slow. Building any now solves a problem that does not exist.

## What Solen already does RIGHT

- **The personalization split is correct AND test-verified, not just written.** `scripts/ring5b-kill-test.ts` proves the 3 main routes' anon-vs-owner header decisions against real invocations. Zero `Vary: Cookie`.
- **The in-memory Maps are textbook-correct soft optimizations**: documented tradeoff, sensible TTL asymmetry (bans 10s, flags 30s, deliberately shorter for the security-relevant one), fail-closed on ban-check DB error vs fail-open on flag-check, and a bounded-growth guard.
- **`lib/cities.ts`'s bust IS correctly wired**, the working sibling to the broken one above.
- **`salons/route.ts` is the reference-correct CDN implementation**: both headers set, the netlify.toml-does-not-apply reasoning spelled out in a comment, query-string cache-key behaviour accounted for.
- **No premature infrastructure anywhere.** Correctly deferred.

## Sampling honesty

Grep-exhaustive for every cache pattern: files setting `Cache-Control`/`Netlify-CDN-Cache-Control` (exactly 7, ALL read in full), `export const revalidate` (4), `unstable_cache` (0), `revalidateTag`/`revalidatePath` (0), `Vary` (0), module-level `Map`/`Set` (56 hits triaged to 6 real cross-request caches). Next version read from `package.json`, not recalled. **Did NOT**: read all ~354 routes; access a live Netlify dashboard, so the exact CDN behaviour when only `Cache-Control` is present is asserted from the research's direct Netlify-docs citation, not reproduced live; measure any query performance. Absence of a finding outside the files read is NOT a clean bill for that corner.
