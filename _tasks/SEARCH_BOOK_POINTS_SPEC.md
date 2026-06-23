<!-- exists-check: searched _tasks/_audits/_rules/_design-system 2026-06-23 — NO dedicated attribution/
     affinity/points spec exists (only passing mentions in SOLEN_NEXT/KEY_FEATURES/LOCKFILE). Net-new,
     but EXTENDS live systems (search_events, discovery_interactions, discovery-algorithm, loyalty_status,
     recommendations.ts, bookings.acquisition_source) — does NOT add a parallel event log. -->

# Search → Book points / affinity system (TikTok-style weighted funnel)

**Status:** Phase 1 SHIPPED on `feat/search-book-points` (2026-06-23). Phases 3-5 specced, not built.
**Owner intent:** weight funnel actions like TikTok (search = light signal, search→book = strong), to
(1) personalize each user and (2) rank salons by how well they convert.

---

## 1. Verified reality (live DB, 2026-06-23)

| Stage | Tracked? | Where |
|---|---|---|
| Search query + results count | ✅ live | `search_events` (`app/api/search/event/route.ts`) |
| Which salon/service/stylist clicked + position | ✅ live | `search_events.clicked_type` ∈ {service,salon,stylist} / `clicked_id` / `clicked_position` |
| Discovery feed view/click/share | ✅ live | `discovery_interactions` |
| Booking exists | ✅ live | `bookings` |
| `bookings.acquisition_source` | ✅ **column exists** (was set on old rows, NOT on insert) | `bookings.acquisition_source text` |
| `search_events.booked` + `session_id` | ✅ **exist** (booked never written) | — |
| **Book ← search attribution** | ✅ **NOW WIRED (phase 1)** | see §4 |
| Per-user affinity / per-salon score | ❌ later (phases 3-4) | — |

**Key correction vs the first draft:** `acquisition_source`, `search_events.booked`, and `session_id`
ALREADY existed (the generated `database.types.ts` lagged the live DB, schema drift). So the migration
was tiny, and no second event log is needed: points derive from `search_events` action depth.

## ⚠️ BLOCKER: the funnel source is not capturing data (found 2026-06-23)
Live DB: `search_events` = **0 rows**, `discovery_interactions` = **0 rows**. The `/api/search/event`
logging route exists but **NOTHING in the app calls it** (grep: zero client callers; the route was
scaffolded in sweep commit 9d4cc10b9 and never integrated). So search impressions/clicks are never
recorded. The 949 bookings + 900 `acquisition_source` values are **SEED/test data**, not real tracking;
`discovery_search_events` has 34 real rows (the Inspo search box).
**Consequence:** phases 1 + 3 are built and correct but **DORMANT** — there is nothing to attribute or
score until the web search UI is instrumented to POST `/api/search/event` (impression on search, click on
result tap, respecting consent). **This client instrumentation is the real keystone, ahead of phases 4-5.**
Until it's wired, the points engine runs on an empty pipe.

## 2. Session backbone (reused, not reinvented)
`solen_se_sid` httpOnly cookie, `path: "/"`, sameSite lax, 30-day sliding (`search/event/route.ts:56,99-105`).
It reaches `/api/bookings` (path "/"), so the booking route reads the SAME cookie as the attribution key.
Anon + auth both get it; `search_events.session_id` is only stored when consent is given (privacy-gated →
no consent = no attribution, by design).

## 3. Weights (`lib/points/weights.ts`, tunable in one place)
search 0.1 · click 0.25 · book_via_search 0.5 · discovery_click 0.2 · discovery_save 0.3.
Action depth is READ from existing rows (no-click row = search; `clicked_id` set = click; `booked=true` =
converted) — derived, not a second write path. `ATTRIBUTION_WINDOW_MIN = 60`.

## 4. Phase 1 — attribution wire (SHIPPED)
- **Migration** `supabase/migrations/20260623_search_book_attribution.sql` (applied live, idempotent):
  `bookings.attributed_search_event_id uuid → search_events(id)` + index `idx_search_events_session_created
  (session_id, created_at desc)`. (acquisition_source + booked already existed.)
- **`lib/points/attribution.ts`** `attributeBookingToSearch(admin, {sessionId, salonId, bookingId})`:
  newest-first scan of the session's recent clicks within 60 min; resolves clicked_type→salon
  (`salon`=clicked_id · `service`=`services.salon_id` · `stylist`=`staff_members.salon_id` — verified all
  three resolve correctly); first match (last-touch) → `search_events.booked=true` +
  `bookings.attributed_search_event_id` + `acquisition_source='search'`.
- **`app/api/bookings/route.ts`** step 10: reads `solen_se_sid`, calls the helper in a try/catch that can
  NEVER break a booking (mirrors the referral side-effect block). No-op without session/consent/match.
- **Verified:** migration columns/index present; full-project `tsc --noEmit` 0 errors; click→salon
  resolution proven against real data; session-window query valid. True end-to-end (real search→book) is
  best confirmed on a deploy/preview — NOT faked in production.
- **Follow-up (optional):** regenerate `lib/database.types.ts` to type `attributed_search_event_id` /
  `acquisition_source` (today the helper uses a loosely-typed client to absorb the drift — build is green).

## 5. Rollup A — per-user affinity (phase 3, LATER)
Weighted points per `(user_id, salon_id)` + `(user_id, category)` from `search_events` +
`discovery_interactions`, time-decayed (reuse `discovery-algorithm.ts` decay). New tables
`user_salon_affinity` / `user_category_affinity`, materialized by a cron mirroring
`app/api/cron/loyalty-recompute` (CRON_SECRET bearer, admin RPC, `.github/workflows/cron-jobs.yml`).
Consumers: extend `lib/ai/recommendations.ts` (today only time+location); feed Hair-DNA `serviceMix`.
Consent-gated rows only.

## 6. Rollup B — per-salon conversion score (phase 4, LATER)
Per salon: `clicks` (search_events clicking it) and `books` (booked=true). Score = **conversion RATE** =
`books/clicks` with a Wilson lower bound / min-sample floor (anti rich-get-richer + anti-gaming;
owner-self-clicks already excluded upstream). New table `salon_search_conversion`, same recompute-cron.
Consumer: a ranking signal in salon search / "Empfohlen". New salons fall back to rating+recency until they
have sample.

## 7. Reuse map (rule 12 — EXTEND, never duplicate)
`search_events` = the event log (derive points, no 2nd table) · `solen_se_sid` = attribution key (no new id)
· `discovery_interactions`/`discovery_items` saves = discovery signals · `loyalty_status` +
`cron/loyalty-recompute` = the recompute-cron blueprint · `discovery-algorithm.ts` decay/scoring · extend
`recommendations.ts` (no new recommender) · `bookings.acquisition_source` reused (only added
`attributed_search_event_id`).

## 8. Build order
1. ✅ Attribution wire (phase 1). 2. ✅ Weights config. 3. Per-user affinity rollup + cron + recommendations.
4. Per-salon conversion rollup + ranking. 5. Mobile reads affinity (after the DNA web↔app sync).

## 9. Tunable / open (not blockers)
Last-touch v1 (multi-touch later) · 60-min window · weights · decay half-life · Wilson confidence — all
config. Online-pay bookings (status `pending`) are attributed at creation in v1; if a payment later fails,
the `booked` flag slightly overcounts — phase 4 conversion can filter by final status if it matters.

## Build location
Built on `feat/search-book-points` (off current `main`, which has the full search feature). The earlier
mockups worktree forked before search shipped, so live backend code does NOT belong there.
