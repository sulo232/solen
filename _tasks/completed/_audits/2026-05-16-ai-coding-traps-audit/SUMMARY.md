# AI Coding Traps · Master Audit Summary
Date: 2026-05-16
Scope: Full Solen codebase scan across 5 anti-pattern categories, dispatched as 20 parallel research agents (4 per topic).
Per-slice reports: `1a` through `5d` in this directory.

---

## 🔥 STOP-THE-PRESSES: ship-blocking security issues

These warrant immediate action before any other work continues. Each is documented with file:line in the underlying slice report.

1. **Payment bypass — customer can pay 1 cent for a 500 CHF service.**
   `app/api/stripe/create-payment-intent/route.ts:46-78` takes `deposit_amount` raw from the client body (`lib/validations.ts:72-77`) and uses it as the Stripe PI amount. There is no server-side reconciliation against the service's actual price. (Slice 5D, finding 8.)

2. **RLS catastrophes — `USING (true) WITH CHECK (true)` on 7 tables.** Any authenticated user can read, write, or delete any salon's data. Tables affected (per slice 5D): `inventory`, `sms_reminders`, `staff_calendars`, `addons` (legacy), `salon_photos`, `staff_invites`, `gift_cards`.
   - `staff_invites.invites_by_token FOR SELECT USING (true)` exposes secret tokens publicly. Combined with `app/api/staff/accept-invite/route.ts:46` only warning on email mismatch = **full salon staff takeover** via leaked URL.
   - `gift_cards.gc_public_check FOR SELECT USING (true)` exposes every voucher code to anonymous users.

3. **Stripe webhook has no outer try/catch.** Idempotency key is set BEFORE all DB writes complete (`app/api/stripe/webhook/route.ts`), so a mid-write throw marks the event "processed" but applies state partially. Money-state divergence risk. (Slice 1C, finding 1.)

4. **`checkUserBanned` fails open.** `lib/feature-flags.ts` returns "not banned" on DB error, so banned users would not be blocked during a DB blip. (Slice 1B.)

5. **Commission rate drift — 1% vs 15%.** `packages/purchase` route uses 1% commission; `stripe/create-payment-intent` uses 15%. Same product, two prices. Silent revenue bug. (Slice 4D.)

---

## Per-topic results

### Topic 1 · Silent Error Handling — ~340 findings

| Slice | Findings | CRITICAL | HIGH | MEDIUM | LOW | Hottest issue |
|---|---|---|---|---|---|---|
| 1A · empty catches | 64 | 3 | 23 | 18 | 20 | Stripe `confirm-price`, salon-cancel + customer-cancel all show success UI when server may have failed |
| 1B · ignored DB errors | 86 | 18 | 27 | 28 | 13 | **251 of 329 Supabase calls (76%) never check `error`** — house-style problem. Stripe webhook has 18 silent admin DB ops. |
| 1C · fetch/async | 22 | 2 | 6 | 8 | 6 | Stripe webhook no outer try/catch; 5+ Resend REST calls don't check `res.ok` (bypassing `lib/email.ts` wrapper); `r => r.json()` without `r.ok` check is pervasive (~40 dashboard pages) |
| 1D · UI defaults | 23 | 1 | 7 | 10 | 5 | Allergy warning silently disabled on API error; coming-soon-notify returns `ok:true` after DB write failure; favorites returns empty items on DB error |

### Topic 2 · Hardcoded Values — ~225 findings

| Slice | Findings | Headline |
|---|---|---|
| 2A · secrets | 8 | 🟢 **0 hardcoded live secrets. 0 service-role leaks to client.** 35 `process.env.X!` non-null assertions (env footgun). `STRIPE_SECRET_KEY || ""` fallback in 2 voucher routes. `MAPBOX_API` aliased to `NEXT_PUBLIC_MAPBOX_TOKEN` (privilege-escalation risk if operator stores an `sk.*` Mapbox token) |
| 2B · env fallbacks | 60 (23 CRITICAL) | 🔴 **`lib/env.ts` ABSENT.** 33 distinct env vars referenced across codebase, none validated at boot. `SEVEN_API_KEY` vs `SEVEN_IO_API_KEY` split across 5 files = same SMS service two names. `GEMINI_API_KEY` vs `GOOGLE_AI_API_KEY` split across 14+ AI files. |
| 2C · magic values | ~131 (9 HIGH clusters) | 🔴 **154 hardcoded `https://solen.ch` URLs across 40+ files.** Personal email `habobi1238@proton.me` hardcoded as admin allowlist fallback (`src/modules/auth.js`). Roles inlined in 82 files. Statuses inlined 40+ files. `Europe/Zurich` in 6 sites. 131 `de-CH` hardcodings. `zurich` vs `zuerich` city slug mismatch. Commission `15`, referral `1000`/`10` magic numbers. |
| 2D · demo data | 23 (1 CRITICAL · 11 HIGH) | 🔴 **9+ customer-visible surfaces shipping fake data** (CLAUDE.md said 4 — actual is wider). CRITICAL: `app/api/nail/hand-chart/route.ts` uses module-scope `Map` as "persistence" — every cold start loses dashboard data. Coiffeur/LastMinute/Nearby/Reviews/FeaturedStylists DEMO arrays. `/barbershop` has 4 fake humans (`FEATURED_BARBERS`). Barber-leaderboard fabricated KPI %. |

### Topic 3 · Fake TypeScript — ~2,000+ findings

| Slice | Findings | Headline |
|---|---|---|
| 3A · `any` types | 551 references (4 CRITICAL) | 105 `: any` annotations + 424 `as any` casts. CRITICAL: Stripe webhook event objects cast `any` 5× (`webhook/route.ts:193,207,232,252,277`); `lib/ratelimit.ts:10` `null as any` Redis fallback = **rate limiting silently disabled if env typo**; `app/api/salons/route.ts:425` role mutation via `Record<string, any>`. Worst file: `app/[locale]/salon/[slug]/page.tsx` (5 `:any` + 19 `as any` — driven by stale `Salon` type missing V3 columns). |
| 3B · type assertions | ~519 sites | 323 `as Foo` + 424 `as any` + 29 `as unknown as Foo` + 29 `process.env.X!` (positive: 112 `as const` good usages). 19 identical Supabase-join authorization casts in booking/staff/services/admin routes. 10+ inline `new Stripe(...)` instantiations instead of `lib/stripe.ts` `getStripe()` helper. Zero zod validation on Gemini LLM output, localStorage parse, fetch.json. `formData.getAll("photos") as unknown as File[]` (user upload). |
| 3C · suppressions | 14 | 🟢 **0 `@ts-ignore`, 0 `@ts-nocheck`, 0 `@ts-expect-error` in scope.** 10 `Record<string, any>` as escape (5 fixable with Database row types). 2 empty interfaces (both idiomatic). 6 `@ts-ignore` in `src/` which tsconfig excludes (likely dead). **tsconfig missing**: `noUncheckedIndexedAccess` (high impact), `noFallthroughCasesInSwitch`, `noImplicitReturns`, `noImplicitOverride`. |
| 3D · untyped boundaries | ~1459 sites | 🔴 **`lib/database.types.ts` DOES NOT EXIST.** 125 migrations applied, 0 typed clients. **15/15 Supabase client creation sites are untyped** → cascades to ~1314 `.from()` call-sites returning `any`. **43 API routes parse `await req.json()` with zero zod validation.** CRITICAL: `app/[locale]/checkout/page.tsx:144` parses URL-controlled JSON for Stripe PI amount. CRITICAL: `app/api/bookings/[id]/reschedule/route.ts:9` — `Date(undefined)` → `NaN`, 24-hour cancellation rule SKIPPED. 16 cron-secret `===` comparisons (timing attack — use `crypto.timingSafeEqual`). |

### Topic 4 · Duplicates — ~520 findings + structural issues

| Slice | Findings | Headline |
|---|---|---|
| 4A · utility duplication | 12 groups, ~150 dupes | CRITICAL: `formatDate` has 5 named + 83 inline `toLocaleDateString` + 29 `toLocaleTimeString`, most hardcoded `de-CH` = wrong-language dates for FR/IT/EN users on bookings/invoices/reminders. `formatPrice` vs `formatCurrency` accidental fork (55 importers split). `capitalize` 1 canonical + 16 inline copies. 3 `generateICS` impls. 4 `relativeTime` impls. 11 `Math.random().toString(36)` ID generators. |
| 4B · component duplication | 24 dupe sets | **48 legacy orphans safe to delete immediately** (`BottomSheet`, `GlassCard`, lowercase shadcn `tabs/card/button/input/label`, `CookieBanner`, `AirbnbSearchBar`, `HomeSearchBar`, `AnimatedButton`, +36 more). **7 V3 orphans** — entire `SalonDetailV3.tsx` flow + `SearchResults.tsx` built but never wired. Biggest dupe: salon-detail page — 22 V3 components in `app/[locale]/_components/salon/` are orphan; actual page imports 12 from `components-legacy/salon/`. **V3 has no Button/Spinner/Skeleton/EmptyState primitive** (every page pulls from legacy = why legacy won't die). |
| 4C · types/schemas/constants | 9 type groups + 6 zod + 9 const groups | 🔴 **CRITICAL design-lock violation in prod**: `app/globals.css --base: #FFFFFF` overrides V2-D60 cream substrate `#FAF3E6` locked in Tailwind. Body bg = WHITE while every component expects cream. (Q15 white-page comment predates V2-D48 + V2-D60.) **Retired `#043338` dark teal still drives focus outlines & focus-ring** (tabbing renders OLD teal on NEW emerald). CATEGORIES chain: **9 primary definitions** (CLAUDE.md said 4). `Service` type has **9 definitions, 3 incompatible shapes**. DAY_KEYS is 8 defs across 3 conventions (Sun-first vs Mon-first → latent one-day-off bug). `signupSchema` has lib copy with **totally different rules** from active route. Phone regex drift = same Swiss number can pass registration and fail walk-in booking. |
| 4D · API/auth/queries | ~230 boilerplate dupes | **`lib/auth/` directory does NOT exist.** 0 `requireAuth`/`requireAdmin`/`requireSalonOwner` helpers. ~230 routes inline the same `getSession()` body. `profile?.role !== "admin"` check in **71+ files**. `salon.owner_id === user.id` ownership check in ~30 files. **`favorites` vs `salon_favorites` TABLE MISMATCH** — `/api/favorites/toggle` writes one, `/api/profile/favorites` reads the other → heart a salon, favorites page is empty. **Three "similar salons" implementations with three different sort formulas** — same UI on different pages shows different results. **Three parallel Resend code paths** (`lib/email.ts` raw fetch + `lib/booking-email.ts` SDK + 6 inline `fetch()` blocks) with different `from:` values and HTML templates. 16 inline `new Stripe(...)` instantiations instead of `lib/stripe.ts`. |

### Topic 5 · Fake Test Coverage — ZERO real coverage + 8 CRITICAL security gaps

| Slice | Findings | Headline |
|---|---|---|
| 5A · existing test quality | Verdict: **decorative leaning fake** | `e2e/visual/homepage.spec.ts` (109 lines, 9 tests). **5 of 9 tests silently pass when their target element is missing** (`if (isVisible) { expect }` with no `else throw`). Baselines lock in DEMO data. No `npm test` script. No `webServer` config (port mismatch risk). |
| 5B · critical surfaces | **332 API routes ALL untested** | Zero server actions (Solen uses API routes exclusively). **286 `CREATE POLICY` statements across 110 tables** — top-15 money/identity tables need ~180 SQL impersonation tests as starter. 17 DB functions, 15 triggers (highest-stakes: `handle_new_user()` role-assignment trigger = privilege escalation if wrong). Stripe webhook handles 8 event types, idempotent + signature-verified ✅ but untested. **`.github/workflows/cron-jobs.yml` referenced in CLAUDE.md DOES NOT EXIST on this branch.** |
| 5C · infrastructure | Vitest absent · Jest absent · No CI tests · No Supabase test stack · No MSW | Playwright wired (visual regression only). Zero npm test scripts. `supabase/config.toml` + `supabase/seed.sql` both absent — no local stack workflow. `.env.example` shows `STRIPE_SECRET_KEY=sk_live_...` (no test-mode pattern). |
| 5D · RLS/security | **8 CRITICAL findings** | See "Stop-the-presses" above. Stripe webhook signature verification IS correctly implemented + replay-protected via `processed_webhook_events` ✅. **322 routes use `auth.getSession()` vs 5 using safer `getUser()`** — codebase's own `middleware.ts:133` flags this as unsafe. **Rate limiting absent on**: signup, OTP/SMS verify, search, booking POST, reviews, accept-invite. |

---

## Recommended next-step priority order

### Phase 1 — Ship-blockers (must fix before next prod deploy):
1. Server-side reconcile `deposit_amount` in `stripe/create-payment-intent` against actual service price.
2. Replace `USING (true) WITH CHECK (true)` policies on `inventory`, `sms_reminders`, `staff_calendars`, `addons`, `salon_photos`, `staff_invites`, `gift_cards` — scope each policy to `owner_id` / `salon_id` / `user_id`.
3. Wrap Stripe webhook in outer try/catch; move idempotency-key write to AFTER all DB writes commit.
4. Fix commission rate inconsistency (1% vs 15%).
5. Fix favorites vs salon_favorites table mismatch.
6. Fix `checkUserBanned` to fail-closed (or fail-loud).
7. Remove personal email `habobi1238@proton.me` from admin allowlist fallback.

### Phase 2 — Infrastructure that unblocks the cleanup:
1. Generate `lib/database.types.ts` (`supabase gen types typescript --linked > lib/database.types.ts`).
2. Wire `createClient<Database>(...)` in every Supabase factory in `lib/supabase.ts`. (~15 instantiation sites; many become typed automatically.)
3. Create `lib/env.ts` with zod-validated env. Migrate the 33 env vars into it. Crash at boot if missing.
4. Create `lib/auth/` with canonical `requireAuth`, `requireAdmin`, `requireSalonOwner`. Migrate the ~230 inline getSession() boilerplate sites incrementally.
5. Add to `tsconfig.json`: `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, `noImplicitReturns`, `noImplicitOverride`. Fix the resulting compile errors (most will be real bugs).
6. Reconcile `app/globals.css` `--base` against Tailwind `s-bg.base` — both must equal cream `#FAF3E6` (or the design lock must be updated in `_tasks/SOLEN_LIVE_TRUTH.md` first).

### Phase 3 — Test scaffold:
1. Install Vitest + happy-dom + `@testing-library/react`.
2. Install MSW for Stripe / OpenAI / Resend mocks.
3. Wire `supabase/config.toml` + `seed.sql` for local stack integration tests.
4. Write the first 10 tests, in this order: (a) Stripe webhook integration, (b) booking flow E2E, (c) auth callback, (d) RLS impersonation tests for `bookings`/`payments`/`profiles`, (e) cron secret comparison.
5. Wire `.github/workflows/test.yml`.

### Phase 4 — Dedup & wire-up:
1. Delete the 48 confirmed legacy orphans (safe — zero callers).
2. Build V3 primitives (`Button`, `Spinner`, `Skeleton`, `EmptyState`) and replace legacy callers.
3. Wire `app/[locale]/salon/[slug]/page.tsx` to V3 `SalonDetailV3.tsx` (22 V3 components + 12 legacy come along).
4. Consolidate `formatDate` / `formatPrice` / `formatCurrency` to one each. Audit the 83 inline `toLocaleDateString` for locale-correct version.
5. Consolidate CATEGORIES (9 places → 1) and `Service` type (9 defs → 1).
6. Delete dead code: `src/_pages-draft/`, `src/spa_pages/`, dead `lib/utils.ts` exports, `lib/demo-data.ts`.

### Phase 5 — Magic-value extraction (lowest risk, mostly mechanical):
1. `lib/constants/roles.ts` — `ROLES` as const, eliminate 82 inline role-string sites.
2. `lib/constants/booking-status.ts` — `BOOKING_STATUS` as const, 40+ inline status-strings.
3. `lib/constants/billing.ts` — commission rate, referral reward, currency, fee defaults.
4. `lib/constants/locale.ts` — `'de-CH'`, timezone, locale list.
5. `lib/constants/urls.ts` — base URL accessor (one env var, one helper), eliminate 154 inline `solen.ch` literals.

---

## What this audit doesn't cover (out of scope)

- Performance issues (bundle size, render perf, query plans)
- Accessibility audit (handled by `uiux-audit` skill)
- SEO completeness
- Bundle analysis / unused npm deps
- Database query performance / missing indexes
- Email deliverability / DMARC setup
- Vercel residue (separate cleanup branch already exists)

Each per-slice report (`1a` through `5d`) has its own findings + recommendations beyond what's summarized here. Read those for line-level detail.
