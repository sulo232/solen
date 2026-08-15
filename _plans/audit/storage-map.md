# Solen.ch storage map (2026-07-06)

Scope: how everything is stored and the risks that follow. Source of truth for table names/rows/RLS is the LIVE snapshot `_inventory/_db-snapshot.json` (captured 2026-07-06), not migration files, per house rule. 145 tables total in the live snapshot (some added since the "132 tables" figure elsewhere in the inventory docs was written; treat 145 as current).

---

## (a) The 145 tables, grouped by domain, with row-growth class

Growth class legend: **HOT** = grows every transaction/every user action, unbounded, no prune job. **WARM** = grows steadily but bounded by real-world cardinality (one row per salon/staff/service). **COLD** = admin-managed, rarely written. **EMPTY** = 0 rows live today (feature dormant, unused, or dead).

### Booking (core transactional path)
| table | rows | growth |
|---|---|---|
| `availability_slots` | 165,194 | **HOT, unbounded.** By far the largest table (150x the next biggest). Generated nightly by `/api/cron/generate-slots` (30-day rolling window forward), but nothing ever deletes past slots. See RISKS #1. |
| `bookings` | 957 | HOT, core table, will scale with GMV |
| `booking_disputes`, `booking_waitlist`, `waitlist` | 4 / 0 / 1 | COLD |
| `recurring_booking_rules`, `group_bookings`, `guest_bookings` | 0 / 0 / 0 | EMPTY, dormant features |
| `off_peak_slots`, `salon_pace`, `salon_closures` | 0 / 1 / 0 | EMPTY/COLD, scheduling support tables |

### Salon / listing
| table | rows | growth |
|---|---|---|
| `salons` | 25 | WARM (one row per salon, will scale to thousands at most) |
| `salon_directory` | 48 | WARM (superset incl. non-onboarded listings) |
| `salon_photos`, `salon_documents`, `staff_portfolio_images` (12) | 0 / 0 / 12 | WARM, image-heavy, see Storage section (b) |
| `salon_analytics`, `salon_page_views` (411), `salon_engagement` (22) | HOT-ish | `salon_page_views` is an every-pageview log with no prune cron, see RISKS #2 |
| `salon_badges`, `salon_badge_assignments`, `salon_groups`, `salon_last_minute_settings`, `salon_drafts` (7) | mostly 0 | COLD/dormant |
| `services`, `service_categories` (67), `service_options`, `service_addons`, `service_bundles`, `service_bundle_items`, `service_packages`, `addons` | WARM | canonical taxonomy, per project memory `project_service_taxonomy_personalization` |
| `staff_members` (71), `staff_schedules` (402), `staff_services`, `staff_calendars`, `staff_breaks`, `staff_time_off`, `staff_invites` | WARM | one row per staff/schedule entry |
| `pricing_rules`, `nail_dynamic_pricing_rules`, `search_ranking_weights` | EMPTY/COLD | admin-tunable weight tables |

### User / profile
| table | rows | growth |
|---|---|---|
| `profiles` | 35 | WARM, 1:1 with auth.users |
| `user_preferences`, `notification_preferences`, `push_subscriptions` | 1 / 0 / 0 | dormant, low adoption or unwired |
| `favorites` | 5 | WARM |
| `client_notes`, `client_tags`, `client_formulas`, `client_photos`, `consultation_notes`, `hand_chart_notes`, `intake_form_responses` | mostly 0-3 | COLD, salon-owner-facing CRM notes on their clients |
| `salon_clients` | 1 | WARM, per-salon client roster |
| `account_actions`, `account_warnings`, `warnings` | 0 | EMPTY, moderation scaffolding unused so far |

### Discovery (Inspo feed)
| table | rows | growth |
|---|---|---|
| `discovery_items` | 1,071 | WARM-HOT, the feed content itself, curated + TikTok-sourced |
| `discovery_staging` | 3 | intake buffer ahead of admin approval, see (f)/(b) orphan notes |
| `discovery_interactions` (84), `discovery_search_events` (127), `discovery_likes`, `discovery_saves` (2), `discovery_comments`, `discovery_board_pins` | HOT | per-user-action event logs, no prune cron, see RISKS #2 |
| `discovery_boards` (3), `discovery_collections` (2) | COLD | low adoption |
| `discovery_products`, `discovery_product_recommendations` | 0 | EMPTY, dormant retail-tie-in |
| `user_style_affinity` (46), `user_salon_affinity` (121) | WARM | derived/recomputed data, see (f) |
| `search_embeddings` (101), `search_synonyms` (84), `search_events` (2) | COLD-ish | see (f), coverage gap flagged below |

### Loyalty
| table | rows | growth |
|---|---|---|
| `loyalty_status` (8), `loyalty_stamps` (9), `loyalty_cards`, `tier_perks` (3) | WARM | Solen Status frequency ranks, recomputed monthly |
| `barber_loyalty_cards`, `barber_loyalty_history`, `barber_loyalty_programs` | 0/0/1 | EMPTY, category-gated (nail/barber features disabled) |
| `referrals` | 30 | WARM |

### Payments / commerce
| table | rows | growth |
|---|---|---|
| `tips` | 1 | WARM |
| `retail_sales` (11), `retail_purchases` (0), `sales`, `sale_line_items` | WARM/EMPTY | POS-adjacent, low volume so far |
| `package_purchases`, `voucher_purchases` (2), `voucher_redemptions`, `vouchers` (2), `gift_cards` (2) | mostly EMPTY/COLD | vouchers/credits ON per memory, gift cards killed/hidden |
| `credit_redemptions`, `user_credits` | 0 | EMPTY, credits feature |
| `price_offers`, `price_disputes` | 0 | EMPTY, deprecated per STATUS.md |
| `processed_webhook_events` | 0 | **self-cleaning**, see (d)/(f), Stripe webhook inserts then deletes same row after processing (`app/api/stripe/webhook/route.ts:50` insert, `:749` delete) |
| `promo_codes` | 13 | COLD, admin-managed |

### Messaging (feature OFF per memory `project_killed_features`)
| table | rows | growth |
|---|---|---|
| `conversations`, `messages`, `chat_templates` | 0 / 0 / 0 | EMPTY, dormant, matches "chat messaging fully OFF" |

### Category-specific verticals (barber / nail / waxing / spa / makeup / bridal)
| table | rows | growth |
|---|---|---|
| `barber_chairs`, `barber_cut_history` (10), `barber_walkin_queue` (21), `fade_blueprints` (4) | WARM/COLD | barber vertical |
| `nail_stations`, `nail_client_preferences`, `nail_design_history` (4), `nail_retail_products` (7), `nail_inspo_boards`, `nail_inspo_images` | mostly EMPTY | nail vertical, gated behind `nail_features` flag per memory |
| `waxing_sensitivity_log`, `waxing_zone_packages`, `waxing_zone_preferences` | 0 | EMPTY |
| `spa_treatment_rooms` (3), `spa_treatment_outcomes` (2) | COLD | spa vertical |
| `makeup_face_charts`, `makeup_kit_items` | 0 | EMPTY |
| `bridal_workflows` | 0 | EMPTY |
| `wellness_journals` | 2 | COLD |

### Reviews / trust
| table | rows | growth |
|---|---|---|
| `reviews` (260), `review_photos`, `review_replies` (1), `review_attributes` | WARM | core trust signal |
| `content_reports` | 0 | EMPTY, moderation |

### Admin / meta / platform
| table | rows | growth |
|---|---|---|
| `audit_log` | 34 | **HOT by design**, append-only via `lib/audit.ts`, no prune cron currently, see RISKS #2 |
| `feature_flags` (18), `platform_settings` (2), `platform_stats` (0), `site_content` (7), `help_articles` (4) | COLD | admin-configured |
| `customer_segments` (5), `customer_segment_members` (14) | COLD | marketing segmentation |
| `data_deletion_log` | 0 | EMPTY, GDPR erasure tracking, see (f) |
| `partner_leads` (5), `feature_requests` (4) | COLD | marketing/product intake |
| `sms_reminders`, `calendar_tokens` | 0 | EMPTY |
| `cities` (7), `quartier_subscriptions` | COLD | geography config |
| `case_events` (7) | COLD | admin dispute/case tracking |

---

## (b) Supabase Storage buckets

Grep source: `grep -rn "\.storage\.from(" .` across `app/`, `components-legacy/`. Buckets referenced in code, **none of which have a `createBucket` call or migration for `salon-documents` or `client-photos`** (only `salon-photos` [migration 004, commented out] and `review-photos` [migration 005, live] have their bucket creation + policy tracked in `supabase/migrations/`). The other three buckets exist only because someone created them by hand in the Supabase dashboard, so their public/private flag and RLS policies are **not in version control at all**.

| bucket | referenced in | public/signed | tracked in migrations? | contents |
|---|---|---|---|---|
| `review-photos` | `app/api/reviews/[id]/photos/route.ts:74` | public (`getPublicUrl`) | YES, `005_reviews_trust.sql:41-51`, explicit `INSERT INTO storage.buckets ... public=true` + open INSERT/SELECT policies | customer review photos, low sensitivity |
| `salon-photos` | (referenced in `components-legacy/ui/ImageUpload.tsx` via generic `bucket` prop) | public (comment says so) | **commented out** in `004_salon_photos.sql:38`, never actually executed as written | salon gallery photos |
| `client-photos` | `app/api/clients/[id]/photos/route.ts:54,60` | assumed public (`getPublicUrl` called, no signed-URL path exists) | **NOT in any migration** | before/after client photos, salon-owner-facing CRM. Path includes `${salon.id}/${customerId}/...`, i.e. a real client's photo history. If the bucket is actually public (as the code's use of `getPublicUrl` implies it must be to work at all), any client's before/after photo is guessable/enumerable by anyone who has or brute-forces the path. No corresponding DELETE route exists anywhere (see below), so these accumulate forever once uploaded. |
| `salon-documents` | `app/api/salon/documents/route.ts:58,96` | **unclear, likely private** since the app stores the raw storage `path` (not a public URL) as `file_url` in the DB (`route.ts:61,68`) | **NOT in any migration** | KYC-style documents: trade licenses, professional certs, hygiene certs, ID proof, address proof. This is the most sensitive bucket in the app (government ID scans). Since no migration created it, its RLS/public setting was set by hand and is invisible to code review. Grep confirms **zero** `createSignedUrl` calls anywhere in the codebase, so even if the bucket is private, there is no code path that can ever generate a URL to view an uploaded document. Combined with no admin UI reading `salon_documents` (`grep -rln "salon_documents" app/ components/ --include=*.tsx` returns nothing), this looks like a dead, write-only feature: owners upload ID documents that are never reviewed, never displayed, and (if private) never even retrievable by anyone. |
| `discovery-images` | `app/api/admin/discovery/staging/route.ts:87,91`, `app/api/admin/discovery/upload/route.ts:40,45`, `app/api/discovery/thumb/[id]/route.ts:59,92,169` | public (`getPublicUrl`) | not found in migrations grepped | curated Inspo feed images + downloaded/cached TikTok thumbnails (per memory `project_discovery_imagery_expired`, this bucket is also the persistence layer that survives TikTok's own CDN URLs expiring) |
| `service-photos` | `app/api/services/[id]/photos/route.ts:42` | public | not found in migrations | per-service gallery photos |

**Orphan-file risk, systemic.** Across every bucket except `salon-documents`, upload code exists but no corresponding delete-on-row-delete code exists anywhere in the app:
- `services/[id]/photos/route.ts`, `reviews/[id]/photos/route.ts`, `clients/[id]/photos/route.ts` have **no DELETE handler at all** (grepped, confirmed absent). Once a photo is uploaded there is no way to remove it through the app; the storage object lives forever even if the DB row is later cleaned up by hand.
- `discovery_staging` → `discovery_items` (approve flow, `app/api/admin/discovery/staging/route.ts:69-129`): if a `discovery_items` row is later deleted (content report, moderation), the `discovery-images` object it uploaded is never removed (no delete-then-storage-remove pairing found anywhere for `discovery_items`).
- `salon-documents` is the **one exception**: `app/api/salon/documents/route.ts:96` calls `.storage.from("salon-documents").remove([doc.file_url])` before the DB delete. That's the correct pattern; it should be the template copied to the other four buckets, not the other way around.

---

## (c) Sessions / auth

- **Auth provider:** Supabase Auth via `@supabase/ssr`. Cookie name is the standard Supabase pattern derived from the project ref in `NEXT_PUBLIC_SUPABASE_URL` (`tocfnsmxmdxkrcmjzzdw`), i.e. `sb-tocfnsmxmdxkrcmjzzdw-auth-token` (possibly chunked into `-0`, `-1` suffixes if the JWT exceeds the cookie size limit). Set/read via `@supabase/ssr`'s cookie adapter, never referenced by literal string name in this codebase (correct — the SDK owns that name).
- **Three Supabase client constructors**, `lib/supabase.ts`:
  - `createServerSupabaseClient()` (lines 16-53): cookie-backed, used in Server Components/API routes, respects RLS as the calling user.
  - `createAdminSupabaseClient()` (lines 70-87): service-role key, `persistSession:false`, `autoRefreshToken:false`, bypasses RLS. Used liberally across `app/api/**` (this is normal for this codebase's pattern of "check auth/ownership manually, then use admin client for the actual query" — but it means every such route is personally responsible for its own authorization; RLS is not a backstop for these calls).
  - `createBrowserSupabaseClient()` (lines 95-103): singleton browser client for Client Components, anon key only.
- **Middleware session refresh** (`middleware.ts:101-224`): runs on every non-static request, refreshes the Supabase session via `supabase.auth.getUser()` (correctly using `getUser()` not `getSession()` for the auth decision, per the inline comment at `middleware.ts:137`, "getSession() is not safe for auth decisions"). Wrapped in a 4-second `Promise.race` timeout guard against edge-runtime hangs (`middleware.ts:139-143`).
  - Dashboard route guard (`middleware.ts:150-219`): unauthenticated → redirect to `/auth/login`. Authenticated but wrong role → self-healing role-repair (`middleware.ts:172-187`, if a user owns a salon but `profiles.role` wasn't set to `salon_owner`, the middleware silently fixes it on the fly then re-checks). Admin-only subpaths (`middleware.ts:200-208`) gated a second time on `role === 'admin'`.
  - `createServerSupabaseClient()` (`lib/supabase.ts:60-64`) exposes `getSessionUser()` which uses `getSession()` (not `getUser()`) deliberately, per its own comment, to avoid a network round-trip on every API route. This is an intentional and documented tradeoff (not re-flagging as new), but it does mean route-level auth checks trust the JWT's embedded claims without re-verifying against Supabase on every call, same class of tradeoff the middleware comment calls out for the opposite choice.
- **Other cookies found**, all first-party, all narrow-purpose:
  - `solen_admin_preview` (`app/api/admin/preview-salon/route.ts:7,42,58`): lets an admin preview a salon's dashboard as if impersonating it.
  - `pv_${salon_id}` (`app/api/analytics/track-view/route.ts:25,48`), `httpOnly`, per-salon page-view dedup cookie, one per salon ever visited by a browser (this could accumulate a large cookie count over a long-lived browser session, worth a TTL if not already set, not verified here).
  - `NEXT_LOCALE` (`middleware.ts:15`): i18n preference.

---

## (d) Server-side caches (module-level, warm-lambda risk)

Grepped every module-level `Map`/cache object under `lib/`. Three follow a safe, documented TTL pattern; one does not.

| file | pattern | TTL | risk |
|---|---|---|---|
| `lib/cities.ts:82` `activeCitiesCache` | `{data, fetchedAt}` singleton | 5 min (`ACTIVE_CITIES_TTL_MS`) | safe: global, non-PII, falls back to last-good value on DB error |
| `app/api/search/geocode/route.ts` `servedCitiesCache` | same pattern | 5 min | safe, same reasoning |
| `lib/search/filter-availability.ts:39` `cache` | same pattern | 5 min (`FILTER_AVAILABILITY_TTL_MS`) | safe, global boolean flags only (whether Angebote/Fuer-wen filters can discriminate today), explicitly designed 2026-07-06 to avoid a stale-empty-filter regression. Falls back to last-good value on error (not a bare `true`), per its own inline comment. |
| **`lib/ai-vision.ts:195`** `const cache = new Map<string, AIVisionResult>()` | **unbounded, no TTL, no max size, no eviction** | **never expires** | **This is the one real finding here.** Keyed by `${category}:${imageUrl}` (`ai-vision.ts:199`), populated on every Gemini vision call for a discovery image (`ai-vision.ts:235`), and never cleared, capped, or evicted. On a long-lived warm serverless instance (or if this ever moves to a persistent worker/cron process rather than a one-shot Lambda invocation), this Map grows forever and is a genuine memory leak. Not user-keyed (URLs, not PII), so it's a resource-exhaustion risk rather than a cross-user data leak, but still worth capping (LRU or a max-size guard) since `discovery-ai-backfill` runs every 30 minutes and could process thousands of images over the app's lifetime. |

No module-level cache anywhere in the codebase is keyed by user ID or session, so there is no cross-request PII-leak risk from these caches specifically (the risk class the brief asked about). The one dangerous shape (a cache keyed by something request-specific, stored at module scope, shared across concurrent requests on a warm lambda) does not currently exist in this codebase.

---

## (e) Client-side storage (localStorage / sessionStorage), PII flags

Full key inventory (grepped every literal + constant-derived key):

**localStorage keys:**
`solen-cookie-consent`, `solen_last_city`, `solen_nudge_dismissed`, `solen_quick_replies`, `disc_saves_guest`, `solen_discovery_saves`, `inspo:recent-searches`, plus per-component `STORAGE_KEY`/`CACHE_KEY`/`DISMISS_KEY` constants in `useRecentSearches.ts`, `useRecentlyViewed.ts`, `CookieConsent.tsx`, `WeatherBanner.tsx`, `useRecentVisits.ts`, `useAnalytics.ts`, `city-cookie.ts`, `guest-saves.ts`, `RecentlyViewed.tsx` (legacy), `TutorialTour.tsx`, `GuidedSearch.tsx`, `PWAInstallPrompt.tsx`, `BookingBubble.tsx` (keyed per-conversation: `booking_bubble_${conversationId}`), `SaveButton.tsx`, `RecentSearches.tsx` (legacy), `ChatWindow.tsx` (translation cache, keyed per message).

**sessionStorage keys:** `setup_banner_dismissed`, `solen_wizard`.

**Findings:**
- **Duplicate guest-saves systems.** `lib/guest-saves.ts:1` uses key `solen_discovery_saves`; `components-legacy/discovery/SaveButton.tsx:7` uses a *different* key, `disc_saves_guest`, for what appears to be the same concept (an unauthenticated user's saved discovery items, later merged into their account on login, per `SaveButton.tsx:94` clearing the key after a successful save-to-account call). Two independently-maintained localStorage stores for the same feature is a drift risk: a guest who saves items via one code path and later hits the other won't see their saves merged, and a future refactor that "cleans up" one key will silently orphan the other's data. Needs a decision on which is canonical (or a migration that reads both).
- **`solen_user_id` in localStorage** appears in `src/_pages-draft/account/MessagesPage.tsx:51` and `src/spa_pages/account/MessagesPage.tsx:51`, reading a raw user ID out of localStorage to key chat messages. Confirmed via grep that neither `src/_pages-draft/**` nor `src/spa_pages/**` is imported by any file under `app/` or `components/` (dead code, not part of the live app), so this is not a live PII-in-localStorage issue today, but if either directory is ever revived it re-introduces both a PII-in-localStorage pattern and a messaging feature that memory says is fully OFF.
- No other PII (email, phone, name) found stored in localStorage/sessionStorage; the rest of the keys are UI-state (dismissed banners, recent searches, last city, wizard progress) or non-sensitive guest-mode IDs (discovery save lists by content ID, not by person).
- `booking_bubble_${conversationId}` (`components-legacy/chat/BookingBubble.tsx:20,28`) leaks conversation IDs into localStorage keys, low sensitivity (a UUID, not content) but technically per-conversation state stored client-side forever with no expiry.

---

## (f) Derived data: embeddings, solen-score, style/salon affinity

| derived value | storage | recompute path | staleness risk |
|---|---|---|---|
| `search_embeddings` (101 rows) | `search_embeddings` table, `vector(768)` column, HNSW cosine index | `app/api/admin/search/generate-embeddings/route.ts` (manual/admin-triggered, not on the cron schedule in `cron-jobs.yml`), via `lib/search/embeddings.ts` calling Gemini `gemini-embedding-001` (`text-embedding-004` is retired, per `reference_gemini_embedding_model` memory, correctly already migrated here) | **No cron job regenerates this on a schedule.** 101 embedding rows against 259 `services` rows and 1,071 `discovery_items` means embedding coverage is well below 100% of searchable content, and nothing keeps it current as new services/items are added, it depends on someone remembering to hit the admin endpoint. Search relevance silently degrades for anything created after the last manual run. |
| `solen_score` / `solen_tier` / `score_details` | columns directly on `salons` table (not a separate table) | `app/api/admin/solen-score/recalculate/route.ts`, cron daily at 03:00 UTC (`cron-jobs.yml:99-104`) | Recompute loop does 3 sequential DB round-trips per salon inside a `Promise.all` over a chunk of 20 (`recalculate/route.ts:75-95`: bookings-count, completed-bookings-count, owner-profile-lookup, all serial per salon), an N+1-shaped cost that will slow down linearly as salon count grows; flagged as perf debt, not incorrectness (matches the "known open perf backlog" category, not re-litigating, just extending the pattern-list). |
| `user_style_affinity` (46 rows) | dedicated table | `app/api/cron/style-affinity-recompute/route.ts`, daily at 03:00 UTC via `recompute_user_style_affinity` RPC (security-definer, aggregates discovery saves/likes/views/searches into a decayed score) | Cron-driven, correctly scheduled, no gap found. |
| `user_salon_affinity` (121 rows) | dedicated table | mirrored by the same-shaped `recompute_user_salon_affinity` RPC per the style-affinity route's own comment (`style-affinity-recompute/route.ts:1,11`), presumably on its own cron entry (loyalty-recompute monthly is the closest scheduled job that touches ranks; the exact trigger for this specific RPC wasn't independently re-verified in this pass, worth a follow-up grep if this table's freshness is ever questioned). |
| `loyalty_status` / `loyalty_stamps` | dedicated tables | `app/api/cron/loyalty-recompute/route.ts`, monthly (1st, 04:00 UTC) | Monthly cadence for a "6-month frequency rank" system (per memory `project_loyalty_solen_wide`) is coarse but matches the feature's own stated window, not flagging as wrong. |
| `processed_webhook_events` | dedicated table, but used as a **transient idempotency lock**, not a log | `app/api/stripe/webhook/route.ts:50` inserts on receipt, `:749` deletes after successful processing | This is the one table in the entire schema that's self-cleaning by design (confirmed 0 rows live, correct for its purpose: it exists only to dedupe Stripe's at-least-once delivery, not to retain history). Worth noting explicitly since 0-row tables elsewhere in this report mean "unused feature," but here it means "working as intended." |

---

## RISKS (single points of truth, deploy-loss exposure, double-storage)

1. **`availability_slots` unbounded growth, no archival.** 165,194 rows today (150x the next-largest table), generated nightly by `/api/cron/generate-slots` on a rolling 30-day forward window with zero corresponding delete/prune of past slots (grepped the full 291-line route, no DELETE). At current pace this table will be the first to hit real performance/cost pain as salon count grows; needs either a prune cron (delete slots older than N days) or a partition strategy before scale. This is the single most concrete "will break at 100k scale" finding in this pass.

2. **No prune cron for any event/log table.** `salon_page_views` (411), `discovery_search_events` (127), `discovery_interactions` (84), `search_events`, and `audit_log` (34, append-only by design per `lib/audit.ts`) all grow on every user action with no retention policy anywhere in `app/api/cron/`. Individually small today; collectively this is the same unbounded-growth shape as finding #1, just earlier in its lifecycle. Worth deciding a retention window (e.g. 12-24 months) before these tables matter, rather than after.

3. **Storage buckets created outside version control.** `client-photos` and `salon-documents` have no `INSERT INTO storage.buckets` in any migration (only `review-photos` and the commented-out `salon-photos` do). Their public/private flag and RLS policies exist only in the live Supabase project, invisible to code review, and not reproducible if the project were ever recreated from migrations alone. This is a real single-point-of-truth gap: the only record of "is this bucket public" is a dashboard setting nobody versioned.

4. **`salon-documents` (KYC/ID documents) has no retrieval path at all.** Zero `createSignedUrl` calls anywhere in the codebase, and no admin UI reads `salon_documents`. Combined with finding #3 (unknown public/private state), this is either (a) a public bucket silently exposing uploaded government ID scans and business licenses to anyone who can guess or intercept a storage path, or (b) a completely dead, write-only feature where owners upload verification documents that are never looked at by anyone. Both outcomes are bad; this needs an owner decision on whether document verification is a real, live feature (build the review UI + signed URLs) or should be pulled (stop collecting sensitive documents nobody ever checks).

5. **Storage orphan accumulation, systemic.** Every bucket except `salon-documents` has upload-only code paths (no DELETE handler for `services/[id]/photos`, `reviews/[id]/photos`, `clients/[id]/photos`; no storage cleanup when a `discovery_items` row is deleted). Every photo ever uploaded through these routes lives in Storage forever, growing Supabase Storage cost and creating an unbounded set of URLs that outlive their DB rows' relevance. `salon-documents`'s delete-then-remove pattern (`app/api/salon/documents/route.ts:96`) is the correct template; it should be copied to the other four routes, not left as the sole exception.

6. **Two independent guest-saves storage keys.** `lib/guest-saves.ts` (`solen_discovery_saves`) and `components-legacy/discovery/SaveButton.tsx` (`disc_saves_guest`) both implement "save this discovery item while logged out, merge into account on login" against different localStorage keys. Whichever code path a given user hits first determines which key holds their data; a user who uses both surfaces (unlikely today, plausible after any UI consolidation) will see their saves split across two stores with no reconciliation. Pick one as canonical or write a one-time migration that merges both.

7. **`_inventory/STATUS.md` is stale on RLS status and contains a table that no longer exists.** It currently states "16 tables have RLS OFF... mostly discovery_* + test_table + customer_segments" and warns "do NOT blindly enable RLS." The live snapshot captured the same day this audit ran (`_db-snapshot.json`, `capturedAt: 2026-07-06`) shows `rlsDisabled: []` and every one of the 145 tables with `rls: true`, including `discovery_*` and `customer_segments`; `test_table` itself is gone from the live snapshot entirely (dropped). This is good news operationally (the RLS gap this doc warns about appears to already be closed), but the doc itself is now actively misleading: a future agent reading STATUS.md before touching a `discovery_*` table would over-worry about a gap that's closed, or worse, could miss that RLS policies (not just the RLS-enabled flag) still need their own review, since "RLS on" doesn't guarantee every policy is scoped correctly, it only guarantees a policy is required to read/write at all. Recommend re-running whatever produced this doc's RLS claim and updating it, and separately spot-checking the `USING (true)` write policies that do exist (7 found via grep across migrations, e.g. `005_reviews_trust.sql:29-34` "Owners can update review replies" `FOR UPDATE USING (true)` with no ownership predicate, and "Service role can insert google reviews" `FOR INSERT WITH CHECK (true)`) as a follow-up, since RLS-enabled-but-permissive is a different and still-open risk class from RLS-disabled.

8. **`salon-photos` bucket's own migration is dead code.** `supabase/migrations/004_salon_photos.sql:38` has the `INSERT INTO storage.buckets` line commented out (`-- INSERT INTO ...`), meaning even the one bucket that has SOME migration trace never actually ran that statement through migrations. If this bucket exists live today, it was, like `client-photos` and `salon-documents`, created by hand outside version control.

---

## What was explicitly NOT re-flagged (per task instructions)

- 142 FK indexes + RLS initplan wrap (2026-06-24 hardening), confirmed still in place, not re-audited here.
- select-* exposure on salon-row endpoints (closed 2026-07-06), not re-checked.
- inspo 9-call mount fan-out, PDP triple-query SSR, `/api/salons` serial awaits: these are known perf backlog items; the solen-score recalculate N+1 (finding in section f) is a new instance of the same *class* of issue, not a duplicate of those three, so it's included as a new location, not a re-statement of the existing three.
