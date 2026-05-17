# Topic 4D — API / Auth / Query Duplication
Date: 2026-05-16
Scope: Auth helpers, API route overlap, server actions, Supabase queries, Stripe wrappers, email infra
Stack: Next.js 15 App Router + Supabase SSR + Stripe + Resend
Total API routes: 332 `route.ts` files

## Summary
- **Auth helper implementations**: 4 distinct Supabase client factories live in code; **only 1 canonical** (`lib/supabase.ts`). The other 3 are inline `createClient`/`createServerClient` inside route files. The doc-blessed pattern (`getSession()` → `user`) is recopied inline in ~235 route handlers.
- **Custom auth wrappers (`requireAuth`, `useUser`, `useAuth`, `useSession`)**: **0** exist. There is no `lib/auth.ts`, no `requireAuth(req)`, no `requireAdmin(req)`, no `requireSalonOwner(req, salonId)`. The 4-line `getSession()` boilerplate + `if (!user) return 401` is duplicated literally hundreds of times.
- **API route overlap clusters**: **8 clusters** with clear consolidation candidates.
- **Server action duplicates**: **0**. The codebase has no `'use server'` files — everything goes through API routes. Not a vector here.
- **Query patterns extractable to `lib/queries/`**: **7+ recurring patterns**. The directory does not exist.
- **Stripe wrappers**: 1 canonical `lib/stripe.ts` (`getStripe()` + deprecated `stripe` proxy). **15+ routes ignore it** and re-instantiate `new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" })` inline. The "deprecated" `stripe` proxy is the one most of the canonical-using routes import.
- **Email infrastructure**: **3 parallel paths** to Resend — `lib/email.ts` (raw `fetch`), `lib/booking-email.ts` (Resend SDK), and 6 inline `fetch("https://api.resend.com/emails", …)` blocks in routes. Three different `from` defaults, three different env-key lookups.
- **Top overlap cluster**: Salon-by-slug fetches — `/api/salons/[slug]` GET vs `/api/salons/by-slug/[slug]` GET both fetch a single salon by slug; different select columns, different visibility rules; one route exists because the canonical was incomplete and a junior copy was made rather than an extension.

---

## Auth helpers

### Supabase client factories

| Helper name | Location | Signature | Status |
|---|---|---|---|
| `createServerSupabaseClient` | `lib/supabase.ts:8` | `async () → SupabaseClient` (reads cookies via `next/headers`, swallows parser errors) | **canonical, keep** |
| `createAdminSupabaseClient` | `lib/supabase.ts:61` | `() → SupabaseClient` (service_role, no cookies) | **canonical, keep** |
| `createBrowserSupabaseClient` | `lib/supabase.ts:84` | `() → SupabaseClient` (singleton — caches in module scope) | **canonical, keep** |
| `getSessionUser` | `lib/supabase.ts:51` | `async () → { supabase, user }` (wraps server client + getSession) | exported but **only used by 0 routes** — every route inlines the equivalent. Underused / forgotten. |
| `createBrowserSupabaseClient` | `lib/supabase-browser.ts:7` | `() → SupabaseClient` (NO singleton — creates new instance every call) | **duplicate, retire**. Same exported name as the canonical in `lib/supabase.ts`. Used by 10 components in `components-legacy/`. Creates redundant client instances → memory leak + duplicate auth listeners. |
| inline `createServerClient` | `app/api/auth/callback/route.ts:22` | inlined factory tied to the response object so cookies set on redirect | **acceptable exception** — needs to set cookies on a `NextResponse.redirect` rather than `next/headers`. Document this special case so it isn't blindly removed. |
| inline `createClient` | `app/api/partner/leads/route.ts:21` | uses `supabase-js` not `@supabase/ssr`; reads `SUPABASE_SERVICE_ROLE_KEY` with anon-key fallback | **bug + duplicate, retire**. Falling back to anon key for an admin write means a misconfigured prod inserts as anon → blocked by RLS, silently returns "success: true, warning: 'mocked'". Should be `createAdminSupabaseClient()`. |
| inline `createClient` (`getSupabase()`) | `app/api/salons/[slug]/gallery/route.ts:4` | `supabase-js` admin client created per call (3 handlers, 8+ invocations) | **duplicate, retire**. Should be `createAdminSupabaseClient()`. Also: token extracted from `Authorization` header and verified with `auth.getUser(token)` — bespoke pattern not used elsewhere. |
| inline `createServerClient` | `app/api/salons/verify/route.ts:5` | imported but **never used in the file** | dead import — remove. |

### "Get-the-user" pattern duplication

There is no `requireAuth()` helper. Every API route inlines one of these variants:

| Variant | Files | Count |
|---|---|---|
| `const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;` followed by `if (!user) return Unauthorized` | broadly the canonical pattern | **~235 routes** |
| `const { data: { user } } = await supabase.auth.getUser();` (network call — explicitly warned against in `lib/supabase.ts:48` JSDoc) | `app/api/salon-draft/route.ts:17,41,88` | 3 routes |
| `const { data: userData, error: authError } = await supabase.auth.getUser(); if (authError || !userData?.user)` | `app/api/dashboard/walkin-analytics/route.ts:14`, `app/api/dashboard/barber-leaderboard/route.ts:14` | 2 routes |
| Bearer-token verification via `auth.getUser(token)` from `Authorization: Bearer …` header | `app/api/salons/[slug]/gallery/route.ts:23,127,197` | 3 handlers in one file |

**Recommendation**: introduce a typed `lib/auth-helpers.ts`:

```ts
// Returns 401 NextResponse or { supabase, user }
async function requireAuth(): Promise<{ supabase, user } | NextResponse>
// Same but also checks role === 'admin'
async function requireAdmin(): Promise<{ supabase, user, admin } | NextResponse>
// Verifies the user owns the given salon (or is admin)
async function requireSalonOwner(salonId: string): Promise<{ supabase, user, salon } | NextResponse>
// Cron-secret check (both Bearer-header and x-cron-secret-header forms)
function requireCronSecret(req: NextRequest): NextResponse | null
```

The `requireAdmin` helper would collapse the duplicated `profile?.role !== "admin"` check across **77 files**.
The `requireSalonOwner` helper would collapse the `salon.owner_id !== user.id` check across **26 files**.
The `requireCronSecret` helper would unify the 18+ cron routes plus the one outlier using `x-cron-secret` (`app/api/admin/badges/auto-assign/route.ts:10`).

### Sign-in / sign-up / sign-out

Single canonical implementations — no duplication here:
- `app/api/auth/login/route.ts` — handles password login, OAuth (Google), reset request
- `app/api/auth/signup/route.ts` — handles signup
- `app/api/auth/logout/route.ts` — handles logout
- `app/api/auth/callback/route.ts` — handles OAuth callback (special inline `createServerClient`, OK)
- `app/api/auth/verify-otp/route.ts`, `verify-phone/send|check`

No `useAuth` / `useUser` / `useSession` React hooks exist. Components call `createBrowserSupabaseClient()` directly and inline the session-fetching logic — same duplication problem on the client side as on the server side.

---

## API route inventory (full)

332 route files. Grouped by resource. Methods column shows which HTTP verbs each route exports.

### Auth (5 routes)
| Route | Methods | Purpose | Overlap |
|---|---|---|---|
| `/api/auth/login` | POST | password / OAuth / reset combined | — |
| `/api/auth/signup` | POST | email signup | — |
| `/api/auth/logout` | POST | sign-out + redirect | — |
| `/api/auth/callback` | GET | OAuth code-exchange + redirect | — |
| `/api/auth/verify-otp` | POST | 6-digit OTP verify | partial — see `verify-phone/check` |
| `/api/auth/verify-phone/send` | POST | send phone OTP | — |
| `/api/auth/verify-phone/check` | POST | check phone OTP | partial — see `verify-otp` |

### Salons (32 routes — biggest overlap surface)
| Route | Methods | Purpose | Possible overlap with |
|---|---|---|---|
| `/api/salons` | GET, POST | list (huge filter set) / create | — |
| `/api/salons/[slug]` | GET, PATCH | salon detail + services + staff + reviews / owner update | `/api/salons/by-slug/[slug]` GET — same lookup |
| `/api/salons/by-slug/[slug]` | GET | minimal salon-by-slug | **DUPLICATE** of `/api/salons/[slug]` GET |
| `/api/salons/by-category` | GET | salons containing category, optional city | `/api/salons` GET with `category=` |
| `/api/salons/by-slugs` | GET | bulk salon-by-slug list | could be merged with `/api/salons?ids=…` |
| `/api/salons/last-minute` | GET | RPC `get_last_minute_slots` | — |
| `/api/salons/mine` | GET | salons the current user owns | — |
| `/api/salons/nearby` | GET | salons by lat/lng or city | partial overlap with `/api/salons` GET (`lat`/`lng` params accepted there too) |
| `/api/salons/recommendations` | GET | **dual-mode**: similar-by-`salon_id` OR personalized recs | **OVERLAPS** `/api/salons/similar` (same similar-by-salon-id logic) |
| `/api/salons/similar` | GET | similar by `current_id` + `quartier` + `category` | **DUPLICATE** of recommendations' similar branch |
| `/api/salons/search` | GET | name/desc + services + staff search | overlaps `/api/salons` GET, `/api/search/smart`, `/api/search/suggest` |
| `/api/salons/trending` | GET | top 10 active+non-test | overlaps `/api/salons` GET sort=rating |
| `/api/salons/quartier-counts` | GET | counts per quartier | — |
| `/api/salons/quartier-featured` | GET | first cover image per quartier | — |
| `/api/salons/verify` | GET | token-based salon verification | — |
| `/api/salons/[slug]/nearby` | GET | nearby salons relative to this salon (overlap categories) | **OVERLAPS** `/api/salons/similar` and recommendations' similar branch |
| `/api/salons/[slug]/ai-info` | GET, POST | AI-generated info | — |
| `/api/salons/[slug]/badges` | GET | badges for one salon | — |
| `/api/salons/[slug]/client-tags` | GET, POST, PATCH | client tag mgmt | — |
| `/api/salons/[slug]/gallery` | POST, DELETE, PATCH | photo upload / delete / reorder | — |
| `/api/salons/[slug]/off-peak-today` | GET | off-peak today | — |
| `/api/salons/[slug]/score` | GET | solen-score breakdown | — |

### Bookings (24 routes)
| Route | Methods | Purpose | Overlap |
|---|---|---|---|
| `/api/bookings` | GET, POST | list user bookings (paginated) / create | `/api/bookings/user` is a 2nd "list user bookings" route |
| `/api/bookings/user` | GET | list user bookings by tab (upcoming/past/cancelled) | **OVERLAPS** `/api/bookings` GET |
| `/api/bookings/[id]` | GET, PATCH | one booking / update | — |
| `/api/bookings/[id]/cancel` | POST | cancel + refund | — |
| `/api/bookings/[id]/confirm` | POST | confirm | — |
| `/api/bookings/[id]/dispute` | POST | open dispute | partial overlap with `/api/admin/booking-disputes` |
| `/api/bookings/[id]/inspo` | … | inspiration | — |
| `/api/bookings/[id]/quick-action` | POST | quick-action wrapper | — |
| `/api/bookings/[id]/refund` | POST | refund-only | partial overlap with cancel |
| `/api/bookings/[id]/report` | POST | report booking | — |
| `/api/bookings/[id]/reschedule` | POST | reschedule | — |
| `/api/bookings/express-rebook` | POST | rebook last booking | — |
| `/api/bookings/express-rebook/confirm` | POST | confirm rebook | — |
| `/api/bookings/group` | POST | group booking | — |
| `/api/bookings/recurring` | POST, GET | recurring | — |
| `/api/bookings/recurring/[id]` | … | recurring detail | — |
| `/api/bookings/waitlist` | POST, GET | waitlist | — |
| `/api/bookings/walk-in` | POST | walk-in | — |
| `/api/bookings/walk-in-verify` | POST | walk-in verify | — |

### Profile / Me / User (8 routes)
| Route | Methods | Purpose | Overlap |
|---|---|---|---|
| `/api/me` | GET | consolidated home-page user data (profile, lastBooking, nextBooking, favorites) | partial overlap with `/api/profile` and `/api/profile/favorites` |
| `/api/profile` | GET, PATCH | profile detail + (admin) preview-salon override | — |
| `/api/profile/accept-tos` | POST | accept TOS | — |
| `/api/profile/delete` | DELETE | delete profile | — |
| `/api/profile/export` | GET | GDPR export | — |
| `/api/profile/favorites` | GET, DELETE | list favorites (joins salons) / delete one | **table mismatch**: uses `favorites` table |
| `/api/profile/live-state` | GET | live state | — |
| `/api/profile/preferences` | … | preferences | — |
| `/api/profile/vouchers` | … | user vouchers | — |
| `/api/favorites/toggle` | POST | toggle favorite | **table mismatch**: uses `salon_favorites` table — different table from `/api/profile/favorites` |

### Reviews (10 routes)
| Route | Methods | Purpose | Overlap |
|---|---|---|---|
| `/api/reviews` | POST | create review | — |
| `/api/reviews/[id]/flag` | … | flag | — |
| `/api/reviews/[id]/photos` | … | photos | — |
| `/api/reviews/[id]/respond` | … | salon owner response | partial overlap with `/api/reviews/reply` |
| `/api/reviews/reply` | … | reply | partial overlap with `/api/reviews/[id]/respond` |
| `/api/reviews/eligibility` | GET | can-i-review check | — |
| `/api/reviews/featured` | GET | top reviews for homepage (4+ stars, limit 6, joins profiles+salons) | **DUPLICATE** of `/api/reviews/homepage` |
| `/api/reviews/homepage` | GET | top reviews for homepage (4+ stars, limit 6, last 12 months) | **DUPLICATE** of `/api/reviews/featured` |
| `/api/reviews/my-booking` | … | my booking's reviews | — |
| `/api/reviews/salon/[salon_id]` | GET | reviews for a salon | — |

### Discovery (12 routes)
| Route | Methods | Purpose | Overlap |
|---|---|---|---|
| `/api/discovery/feed` | GET | feed | — |
| `/api/discovery/post` | POST | post item | — |
| `/api/discovery/like` | POST | toggle like (RPC `toggle_discovery_like`) | parallel to `save` |
| `/api/discovery/save` | POST | toggle save (RPC `toggle_discovery_save`) | parallel to `like`; partial overlap with `saves` |
| `/api/discovery/saves` | GET | list user's recent saves | reads `discovery_saves` — overlaps `save` write side |
| `/api/discovery/save/sync` | POST | bulk-sync local saves | overlaps `save` (single) — both write `discovery_saves` |
| `/api/discovery/comments` | … | comments | — |
| `/api/discovery/interactions` | POST | log interaction (view/click/scroll/share) | — |
| `/api/discovery/boards` | … | boards | — |
| `/api/discovery/similar` | … | similar items | — |
| `/api/discovery/style-names` | … | style taxonomy | — |
| `/api/discovery/salons-for-style` | … | salons that offer a style | — |
| `/api/discovery/generate-description` | … | AI description | — |

### Search / Recommendations (8 routes — fragmented)
| Route | Methods | Purpose | Overlap |
|---|---|---|---|
| `/api/search/suggest` | GET | services+salons typeahead (ilike) | partial overlap with `/api/salons/search` |
| `/api/search/smart` | GET | pgvector embedding search | partial overlap with `/api/search/suggest`, `/api/salons/search` |
| `/api/search/treatments` | GET | treatment list | — |
| `/api/search/detect-category` | … | text → category | — |
| `/api/salons/search` | GET | name/desc + services + staff search (ilike) | **OVERLAPS** `/api/search/suggest` and `/api/search/smart` |
| `/api/recommendations` | GET | Gemini-ranked salon recs | overlaps `/api/salons/recommendations` |
| `/api/salons/recommendations` | GET | similar OR personalized | **OVERLAPS** `/api/recommendations`, also `/api/salons/similar` and `/api/salons/[slug]/nearby` |
| `/api/ai/recommend` | POST | intake-form → recommendation text | distinct (text generation), not salon ranking |

### Stripe (8 routes)
| Route | Methods | Purpose |
|---|---|---|
| `/api/stripe/approve-increase` | POST | approve fee increase |
| `/api/stripe/confirm-price` | POST | confirm price |
| `/api/stripe/connect/create-account` | POST | salon onboarding |
| `/api/stripe/connect/status` | GET | connect status |
| `/api/stripe/create-customer` | POST | create customer |
| `/api/stripe/create-payment-intent` | POST | deposit hold (booking) |
| `/api/stripe/payment-methods` | GET | list saved cards |
| `/api/stripe/save-card` | POST | setup intent |
| `/api/stripe/webhook` | POST | webhook |

### Cron (19 routes)
All exist under `/api/cron/*` — auto-complete, late-cancel, no-show, release-deposits, release-payments, reminders, sms-reminders, review-prompt, rebooking-nudge, generate-slots, salon-onboarding, welcome-series, birthday-messages, barber-smart-reminders, nail-infill-reminders, pre-charge, pending-timeout, process-deletions. **18 of them duplicate** the same `authHeader !== \`Bearer \${process.env.CRON_SECRET}\`` check.

### Admin (38 routes)
All gated by `profile?.role !== "admin"` check, which **is duplicated 77 times** across the API.

### Other top-level
Cities, categories, content, conversations, dashboard (32 routes), help, intake, loyalty (7 routes), nail / nail-inspo / nail-tech / nail-discovery, newsletter, notifications, notify, off-peak, packages (4 routes), partner, profile, promo, quartier, referral, reports, salon (dashboard side — 14 routes), salon-draft, services, slots, staff (12 routes), tos, translate, tips, vouchers (4 routes), waitlist, walkin (4 routes).

---

## Route overlap clusters

### Cluster 1: salons-by-slug (canonical-vs-junior-copy)
- **Route A** `/api/salons/[slug]` GET (`app/api/salons/[slug]/route.ts:7`) — fetches salon + services + staff + reviews; allows owner to see pending; returns `{ ...salon, services, staff, reviews }`
- **Route B** `/api/salons/by-slug/[slug]` GET (`app/api/salons/by-slug/[slug]/route.ts:6`) — fetches salon (minimal columns); active-only; returns `{ salon }`
- **Recommendation**: **delete route B**. It exists because someone needed a salon-by-slug fetch without the relations and didn't realize `/api/salons/[slug]` already did the job. Make Route A accept `?include=salon` (default = full payload) or have callers pick fields. Grep finds Route B is fetched only from search-card components — they can use `/api/salons/[slug]` with a thin select.

### Cluster 2: similar-salons (three implementations, three formulas)
- **Route A** `/api/salons/similar?current_id=X&quartier=Y&category=Z&limit=N` — exact-quartier + contains-category, sorted by `solen_score`. Returns `{ salons }`.
- **Route B** `/api/salons/recommendations?salon_id=X` — fetches salon's categories, returns salons with overlapping categories sorted by `explore_score`, limit 4. Returns `{ salons }`.
- **Route C** `/api/salons/[slug]/nearby` — categories overlap + Euclidean distance + min-service-price enrichment, limit 4. Returns `{ items }`.
- **Recommendation**: merge into one `/api/salons/[slug]/similar` route (or `/api/salons/similar?salon_id=…&limit=…`). Three different sort columns (`solen_score` / `explore_score` / Euclidean distance) is a product-correctness bug, not just code duplication — the user sees different "similar salons" depending on which page they're on.

### Cluster 3: bookings-by-user (paginated vs tabbed)
- **Route A** `/api/bookings` GET — paginated, all statuses, joins salons+services+staff, status filter via `?status=`.
- **Route B** `/api/bookings/user` GET — tab filter (`upcoming` / `past` / `cancelled`), joins salons+services+staff with different shape.
- **Recommendation**: keep Route A only. Add `?tab=upcoming|past|cancelled` and a join-shape parameter (or just standardize the join shape — they're 90% identical).

### Cluster 4: top-reviews-for-homepage (literal duplicate)
- **Route A** `/api/reviews/featured` — 4+ stars, not flagged, not hidden, limit 6, joins profiles+salons, returns `{ items }`.
- **Route B** `/api/reviews/homepage` — 4+ stars, last 12 months, limit 6, no joins, returns `{ reviews }`.
- **Recommendation**: delete one. The split is a result of someone needing the homepage testimonial section before the existing route was rediscovered.

### Cluster 5: discovery save (single + bulk vs read)
- **Route A** `/api/discovery/save` POST — toggle single (RPC).
- **Route B** `/api/discovery/save/sync` POST — bulk insert from `item_ids` array, dedupe.
- **Route C** `/api/discovery/saves` GET — list saves (joined to items).
- **Recommendation**: consolidate to `/api/discovery/saves` with `{ GET, POST (toggle one), PUT (bulk-sync) }` — single resource, three verbs. Right now we have three routes for one logical resource.

### Cluster 6: favorites — TABLE MISMATCH (this is a bug, not a code-style issue)
- **Route A** `/api/profile/favorites` (`app/api/profile/favorites/route.ts:17,61`) — reads/writes table **`favorites`** with column `user_id`.
- **Route B** `/api/favorites/toggle` (`app/api/favorites/toggle/route.ts:54,67,79`) — reads/writes table **`salon_favorites`** with composite key (`user_id`, `salon_id`).
- **Symptom**: a user hearts a salon via HeartButton (writes `salon_favorites`), then goes to `/profile/favorites` (reads `favorites`) and **sees nothing**. Two tables, two routes, two halves of the same feature.
- **Recommendation**: consolidate to one table (probably `salon_favorites`; verify which has data in prod), update both routes to use it, drop the other table after migrating any data.

### Cluster 7: salon-search-and-suggest fragmentation
- `/api/salons/search` — ilike on salons + services + staff, returns full salons.
- `/api/search/suggest` — services + salons typeahead.
- `/api/search/smart` — pgvector embedding.
- `/api/salons` GET with category/city/lat/lng — broad filtered list.
- `/api/recommendations` & `/api/salons/recommendations` — Gemini + popularity recs.
- **Recommendation**: define `/api/search/{q,suggest,smart,recommend}` as the **one** search surface and have client UI choose the strategy. `/api/salons/search` is duplicated effort and the path-name is misleading.

### Cluster 8: gallery upload (special-case auth scheme)
- `/api/salons/[slug]/gallery` POST / DELETE / PATCH — uses bespoke `Authorization: Bearer <session_token>` header + `auth.getUser(token)`, NOT cookie-based `getSession()`. Three handlers, lots of `getSupabase()` re-invocation.
- **Recommendation**: switch to cookie-based session like every other route; remove the custom auth scheme; replace the inline `createClient` factory with `createAdminSupabaseClient()`.

---

## Server action duplicates

**Zero**. No file in the repo contains `'use server'`. All mutations go through API routes. Not a duplication vector in this codebase.

---

## Supabase query extraction candidates

The directory `lib/queries/` **does not exist**. Strong candidates for a `lib/queries/salons.ts`, `lib/queries/bookings.ts`, `lib/queries/profile.ts`:

| Query | File occurrences | Suggested name |
|---|---|---|
| `from("salons").select("id, name, slug, average_rating, review_count, cover_photo_url, address, categories[, …]").eq("is_active", true)` | 16+ routes under `app/api/salons/*` plus 3 of `lib/*` data prep | `salons.activeCardSelect()` returning the standard select string + active filter |
| `from("profiles").select("role").eq("id", user.id).single()` then `profile?.role !== "admin"` | **77 files** | `auth.requireAdmin()` (covered above) |
| `from("salons").select("owner_id").eq("id", salonId).single()` then `salon.owner_id !== user.id` | **26 files** | `auth.requireSalonOwner(salonId)` (covered above) |
| `from("cities").select("id").eq("slug", citySlug).single()` then `query.eq("city_id", cityRecord.id)` | at least 6 routes (`salons/route.ts:48`, `salons/by-category:43`, `salons/nearby:43`, `search/suggest:27`, `search/smart:31`, `directory:42`) | `cities.idFromSlug(slug)` |
| `from("services").select("...").eq("salon_id", X).eq("is_active", true)` | 9+ routes | `services.activeForSalon(salonId, columns?)` |
| `from("bookings").select("*, salons(...), services(...), staff_members(...)").eq("user_id", X)` | 5+ routes | `bookings.forUser(userId, opts)` |
| `from("platform_settings").select("value").eq("key", "commission").single()` then `rate_percent ?? 1` | `bookings/route.ts`, `packages/purchase`, `stripe/create-payment-intent` (different defaults: 1% vs 15%!) | `platformSettings.commissionRate()` |
| `from("salon_directory").select(...)` for unclaimed listings | `directory/route.ts`, `directory/[id]/claim` | `directory.listUnclaimed(filters)` |

Note on the commission-rate inconsistency: `packages/purchase/route.ts:53` defaults to `1` (1%), but `stripe/create-payment-intent/route.ts:54` defaults to `15` (15%). Same DB lookup, different fallback values → user pays a different platform fee depending on which route hits the missing-row path. **This is a silent product bug surfaced by the duplication audit.**

---

## Stripe wrapper duplication

`lib/stripe.ts` exports:
- `getStripe(): Stripe` — lazy singleton (canonical)
- `stripe` — deprecated Proxy that delegates to `getStripe()`
- `toRappen(chf): number`

**Routes that ignore the canonical and re-instantiate Stripe inline:**

| Route | Pattern |
|---|---|
| `app/api/gift-cards/purchase/route.ts:13` | `function getStripe() { return new Stripe(...) }` inline factory |
| `app/api/salon/retail/purchase/route.ts:11` | `process.env.STRIPE_SECRET_KEY ? new Stripe(...) : null` |
| `app/api/bookings/[id]/route.ts:91` | inline `new Stripe(...)` inside webhook-style code path |
| `app/api/bookings/[id]/cancel/route.ts:11` | inline `getStripe()` factory |
| `app/api/bookings/[id]/refund/route.ts:11` | inline `getStripe()` factory |
| `app/api/admin/booking-disputes/[id]/action/route.ts:117` | `const Stripe = require("stripe"); ...` (uses CommonJS require!) |
| `app/api/admin/salons/[id]/freeze/route.ts:63` | inline `new Stripe(...)` |
| `app/api/conversations/[id]/price-offer/route.ts:124` | inline `new Stripe(...)` (note: no apiVersion!) |
| `app/api/packages/purchase/route.ts:11` | inline `getStripe()` factory (api version pinned) |
| `app/api/vouchers/route.ts:22` | inline `new Stripe(STRIPE_SECRET_KEY \|\| "", ...)` — empty string fallback |
| `app/api/vouchers/confirm/route.ts:14` | same empty-string fallback |
| `app/api/tips/route.ts:11` | inline `getStripe()` factory |
| `app/api/cron/no-show/route.ts:39` | inline `new Stripe(...)` |
| `app/api/cron/pre-charge/route.ts:9` | inline `getStripe()` factory |
| `app/api/cron/pending-timeout/route.ts:67` | inline `new Stripe(...)` |
| `app/api/cron/release-payments/route.ts:8` | inline `getStripe()` factory |

**15+ duplications.** Notably:
- `conversations/[id]/price-offer` omits the `apiVersion` config → uses the SDK's default, possibly different from the rest of the codebase.
- `vouchers/route.ts` and `vouchers/confirm/route.ts` use `STRIPE_SECRET_KEY || ""` → if env is missing, calls Stripe with empty key → 401 → unhelpful error.
- `admin/booking-disputes/.../action` uses `require("stripe")` (CommonJS) instead of ESM import.

**Recommendation**: enforce `import { getStripe } from "@/lib/stripe"` via lint rule. Delete every inline factory.

---

## Email infrastructure duplication

**Three parallel paths to Resend**:

1. **`lib/email.ts`** — raw `fetch("https://api.resend.com/emails", …)` wrapper. Reads `RESEND_API_KEY` with `PASTE_RESEND_KEY_HERE` placeholder check. `from: "solen.ch <noreply@solen.ch>"`. **No attachments support.** Exports template builders (`bookingConfirmation`, `bookingCancellation`, more).
2. **`lib/booking-email.ts`** — uses `Resend` SDK (`new Resend(apiKey)`). Reads `RESEND_API_KEY` and `RESEND_FROM_EMAIL` env (with `noreply@solen.ch` fallback). `from: "Solen <${fromEmail}>"`. **Attaches `.ics` calendar file.** Has its own HTML template inline.
3. **Inline `fetch("https://api.resend.com/emails", …)`** in 6 routes:
   - `app/api/loyalty/award/route.ts:103` — "almost there" email
   - `app/api/bookings/[id]/report/route.ts`
   - `app/api/admin/booking-disputes/[id]/action/route.ts`
   - `app/api/dashboard/barber-reminders/send/route.ts`
   - `app/api/notifications/off-peak/route.ts`
   - `app/api/cron/review-prompt/route.ts`

Each inline path has its own HTML template, its own `from:` value, its own error handling.

**Recommendation**: standardize on the Resend SDK (`Resend` import), centralize the `from` config, move all templates to `lib/email-templates/*.ts`, kill `lib/email.ts`'s raw-fetch implementation and re-export the SDK-backed `sendEmail`. Delete the 6 inline `fetch` blocks.

---

## Notes

### Bigger findings flagged by this audit (beyond code duplication)

1. **Favorites table split** (Cluster 6) — UI writes to `salon_favorites`, profile reads from `favorites`. Heart a salon, go to favorites page, see nothing. Likely already broken in prod.

2. **Commission-rate default inconsistency** — `packages/purchase` defaults to 1% if `platform_settings.commission` row is missing; `stripe/create-payment-intent` defaults to 15% in the same situation. Silent revenue / overcharge depending on path.

3. **Three "similar salons" formulas** giving different results depending on entry point.

4. **`partner/leads` route falls back to anon key** for an admin insert and returns `{ success: true, warning: 'mocked' }` when env vars are missing — partner sign-ups silently fail in any misconfigured deploy.

5. **2 `auth.getUser()` direct calls in production routes** — explicitly warned against in the canonical helper's own JSDoc (`lib/supabase.ts:48-50`) due to Edge timeout risk. `salon-draft/route.ts` has 3, `dashboard/walkin-analytics` + `dashboard/barber-leaderboard` 1 each.

6. **`api/salons/[slug]/gallery` uses bespoke `Authorization: Bearer <session_token>` scheme** — every other authenticated route uses cookie-based `getSession()`. Inconsistent for no documented reason. Increases attack surface.

7. **`createBrowserSupabaseClient` exported from TWO files** with the same name but different behavior (singleton vs non-singleton). `components-legacy/*` uses the non-singleton one → multiple Supabase client instances on the same page → duplicate auth-state subscribers → memory churn.

### Quick wins (one-PR scope each)
- Delete `lib/supabase-browser.ts` and re-route the 10 `components-legacy` imports to `lib/supabase`. Net: -10 client instances per session.
- Delete `/api/salons/by-slug/[slug]` route, redirect callers to `/api/salons/[slug]`. Net: -1 route.
- Delete one of `/api/reviews/featured` / `/api/reviews/homepage`. Net: -1 route.
- Pick one favorites table, migrate the other. Net: bug fix.
- Add `lib/auth-helpers.ts` with `requireAuth`, `requireAdmin`, `requireSalonOwner`, `requireCronSecret`. Apply via codemod across the ~235 auth-check sites, ~77 admin-check sites, ~26 owner-check sites, ~18 cron-check sites. Net: ~360 sites collapse to 4 helpers; ~1500 lines of code removed.
- Add `lib/queries/` with the 7 query helpers above. Net: select-column drift fixed (no more "did I include `last_minute_discount_percent` in this select or not").
- Add an ESLint rule banning `new Stripe(` outside `lib/stripe.ts`; ban `fetch("https://api.resend.com` outside `lib/email.ts`.

### Out of scope but worth a follow-up audit
- Server-rendered pages in `app/[locale]/**/page.tsx` were not audited here for query duplication. The `salons.select("…")` pattern is almost certainly repeated there too.
- `components-legacy/*` was inspected only for Supabase-client imports, not for inline query duplication. The 91-of-114 legacy import statistic from V3 wireup audit suggests these will be a rich vein too.
