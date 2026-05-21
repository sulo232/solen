# Topic 2C — Magic Values Audit
Date: 2026-05-16
Scope: Role/status string literals, hardcoded URLs/emails/UUIDs, magic numbers, Supabase RPC/bucket names

---

## Summary

- **Total findings:** 728 (CRITICAL: 0 | HIGH: 332 | MEDIUM: 357 | LOW: 39)
- **Sub-counts:**
  - role-strings: 116 (110 `'admin'`, 4 `'salon_owner'`, 1 `'customer'` + 1 legacy)
  - status-strings: 165 (equality) + 96 (`.eq("status", ...)`) + 31 (`.update({status: ...})`) = 292 total
  - URLs (hardcoded, non-config): 303 occurrences, 28 production files with `solen.ch`, plus 64 `images.unsplash.com`, 13 `api.resend.com`, 6 Gemini URLs
  - emails (literal, non-test): 17 occurrences (5 critical-business)
  - UUIDs (in TS/TSX): 0
  - magic numbers (time durations): 106 (`24*60*60*1000`, `86400`, `3600` repeated)
  - threshold checks (length/count): 228
- **Files scanned:** ~600 (entire `app/`, `lib/`, `middleware.ts`, `supabase/functions/`, `scripts/`, plus a sweep through `src/` for context — but `src/` is documented as deprecated/draft legacy)

---

## Findings by severity

### CRITICAL (0)

**No hardcoded admin emails or UUIDs gating access control.** The codebase consistently routes admin checks through `profile.role === 'admin'` against the DB, and `ADMIN_EMAIL` is always behind `process.env.ADMIN_EMAIL ?? "..."`. No email-equality access checks like `email === "admin@solen.ch"`.

---

### HIGH (332)

#### H1. `https://solen.ch` baked into 28 production files (~111 occurrences)

Source path patterns: API routes, lib/email.ts, lib/seo.ts, lib/booking-email.ts, lib/email-templates/*, app/[locale]/privacy, app/[locale]/terms, app/[locale]/partner/layout.tsx, app/robots.ts, app/sitemap.ts.

Example representative call sites:
- `lib/seo.ts:23`  → `const BASE_URL = "https://solen.ch";`
- `lib/seo.ts:124,129,143,148,203` → URL templates hardcode `https://solen.ch/${locale}/...`
- `app/sitemap.ts:7` → `const APP_URL = "https://solen.ch";`
- `app/api/stripe/connect/create-account/route.ts:54` → `const origin = req.headers.get("origin") ?? "https://solen.ch";`
- `app/api/staff/invite/route.ts:69` → `const inviteUrl = \`https://www.solen.ch/de/staff/accept?token=${token}\`;`
- `app/api/loyalty/qr/[cardId]/route.ts:50` → QR-encoded stamp URL hardcodes `https://www.solen.ch`
- `app/api/stripe/confirm-price/route.ts:86` → `\`https://solen.ch/de/bookings/${...}/approve-increase\``
- `app/api/bookings/walk-in/route.ts:79` → `\`https://www.solen.ch/walk-in-pay?token=${token}\``
- `lib/email.ts` (lines 161-443+) → German/EN/FR/IT body templates repeat `https://solen.ch` literally 80+ times
- `app/api/gift-cards/purchase/route.ts:94` → email CTA `<a href="https://www.solen.ch">`
- `app/api/notifications/off-peak/route.ts:92,98` → email body hardcodes `https://www.solen.ch/de/salon/${salon.slug}` and `/de/profile`

Mixed inconsistency: some files use `solen.ch`, some use `www.solen.ch`. No single `APP_URL`/`SITE_ORIGIN` const that everyone imports. The string `https://solen.ch` literal appears as both bare hostname and inside i18n-templated link bodies — staging/preview deployments cannot redirect these without a string replacement.

**Severity rationale:** changing prod domain or supporting staging would require touching 28 files; current arrangement also conflicts with `lib/email.ts` mixing `from`/`to` content where one is env-driven and the other is hardcoded.

#### H2. `https://api.resend.com/emails` hardcoded in 12 files

- `lib/email.ts:25`
- `app/api/loyalty/award/route.ts:103`
- `app/api/bookings/[id]/report/route.ts:92`
- `app/api/cron/review-prompt/route.ts:129,157` (used twice)
- `app/api/admin/booking-disputes/[id]/action/route.ts:71`
- `app/api/dashboard/barber-reminders/send/route.ts:52`
- `app/api/notifications/off-peak/route.ts:77`
- `supabase/functions/recurring-booking-processor/index.ts:11`
- `supabase/functions/smart-nudges/index.ts:18`
- `supabase/functions/salon-verification/index.ts:13`
- `supabase/functions/booking-reminder/index.ts:13`
- `scripts/send-outreach-emails.ts:53`

Each call duplicates the same `fetch(RESEND_URL, { method: "POST", headers: { Authorization: Bearer ${KEY} } })` block. Belongs in `lib/email.ts` as a single transport helper — call sites should pass `{ to, from, subject, html }`. Resend swap (e.g., to Postmark) would touch 12 files today.

#### H3. `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent` in 6 files

- `app/api/ai/intake-recommendation/route.ts:63`
- `app/api/salons/[slug]/ai-info/route.ts:71`
- `app/api/chat/suggest/route.ts:42`
- `app/api/translate/route.ts:45`
- `app/api/discovery/generate-description/route.ts:77`
- `app/api/admin/generate-roadmap/route.ts:61` (parametrized model)

The literal model name `gemini-2.0-flash` is repeated. Migrating to gemini-2.5 or swapping provider = 6-file change. Should live in `lib/ai/gemini.ts` as `GEMINI_MODEL`/`GEMINI_URL` constants.

#### H4. Hardcoded admin/support emails (5 occurrences, env-fallback pattern)

| File | Line | Email | Pattern |
|------|------|-------|---------|
| `app/api/admin/notify-new-salon/route.ts` | 15 | `admin@solen.ch` | `process.env.ADMIN_EMAIL ?? "admin@solen.ch"` |
| `app/api/stripe/webhook/route.ts` | 183, 212 | `admin@solen.ch` | `process.env.ADMIN_EMAIL ?? "admin@solen.ch"` |
| `lib/booking-email.ts` | 75 | `noreply@solen.ch` | `process.env.RESEND_FROM_EMAIL ?? "noreply@solen.ch"` |
| `app/api/admin/booking-disputes/[id]/action/route.ts` | 75 | `support@solen.ch` | Hardcoded literal in `from:` field (NOT env-gated) |
| `app/api/bookings/[id]/report/route.ts` | 96 | `support@solen.ch` | Hardcoded literal in `from:` field (NOT env-gated) |

Plus body text in `action/route.ts:80` includes `Contact: support@solen.ch` as plain English. The two NOT env-gated entries are real config leaks — a Resend domain change cannot be done by ops without a code change.

**Note:** `src/modules/auth.js:18` has `const ADMIN_EMAIL = ... || 'habobi1238@proton.me'` — this is a personal email in legacy draft code, NOT in production (`src/_pages-draft/`, `src/modules/`, `src/services/`, `src/views/` are documented as deprecated). Still: visible in repo history and could leak.

#### H5. `process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"` in 3 production routes

- `app/api/reviews/[id]/respond/route.ts:66`
- `app/api/reviews/route.ts:81`
- `app/api/off-peak/route.ts:132` (this one falls back to `https://solen.ch`, not localhost — inconsistent)

Two different fallback strategies in the same codebase for the same env var. If `NEXT_PUBLIC_APP_URL` is unset on Netlify (which is the documented current deploy target), review-respond and reviews flows produce broken `http://localhost:3000/...` links in user-facing emails.

#### H6. Stripe Dashboard URL + magic structure in `app/api/stripe/webhook/route.ts:187`

```
<a href="https://dashboard.stripe.com/disputes/${dispute.id}">View in Stripe →</a>
```

Hardcoded; no `STRIPE_DASHBOARD_BASE` const. Low-impact (informational link) but joins the 28-file `solen.ch` family — same anti-pattern.

#### H7. Twilio-alternative SMS gateway hardcoded — `https://gateway.seven.io/api/sms`

- `app/api/auth/verify-phone/send/route.ts:45`
- `app/api/bookings/walk-in/route.ts:89`
- (one more — also seven.io)

Same anti-pattern. Belongs in `lib/sms.ts` as the single transport.

#### H8. Google Maps + open-meteo + tiktok external URLs

- `https://maps.google.com/search/...` (3 sites, all in deprecated `src/` legacy) — not production
- `https://api.open-meteo.com/v1/forecast?latitude=47.5596&longitude=7.5886` — only in deprecated `src/spa_pages/HomePage.tsx`/`src/_pages-draft/HomePage.tsx`
- `https://www.tiktok.com/oembed?url=...` in `lib/ai-vision.ts:193` — production, magic URL not in a constant

#### H9. Basel coordinates 47.5596, 7.5886 hardcoded in 6 places

- `lib/cities.ts:26` (canonical) ✓
- `app/api/salons/route.ts:316-317` — used as fallback when latitude/longitude params missing
- `app/api/admin/seed-test-salons/route.ts:118`
- `app/api/admin/test-salon/route.ts:93-94`
- `src/modules/salons.js:91-92`, `src/views/filtering/index.js:36`, `src/spa_pages/HomePage.tsx:112`, `src/_pages-draft/HomePage.tsx:112` (legacy)

The 4 production hits should import from `lib/cities.ts`'s `CITIES.basel` instead of re-typing 47.5596/7.5886.

---

### MEDIUM (357)

#### M1. Role string literals: 116 occurrences in non-legacy code, 110 are `'admin'`

`UserRole` type exists in `lib/types.ts:33` as `"customer" | "salon_owner" | "admin"` — but **no `ROLES` const** is exported, so call sites repeat the string literal. Examples (a small subset):

- `middleware.ts:168, 186, 205` — 3 admin/owner gates
- `app/api/admin/**/*.ts` — ~40 separate files each contain `if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });` verbatim
- `app/api/dashboard/**/*.ts` — ~10 files with `salon?.owner_id !== session.user.id && profile?.role !== "admin"` pattern
- `app/api/salons/route.ts:431` — `profile?.role === "customer" || !profile?.role`
- `app/api/dashboard/today/route.ts:39` — multi-role check `(profile.role !== "salon_owner" && profile.role !== "admin")`
- `components-legacy/dashboard/DashboardLayout.tsx:236,378,486` — `customer`/`admin` UI gates (legacy but still active)

**Drift risk:** a typo (`"Admin"` vs `"admin"` vs `"administrator"`) in any of these gates silently fails-open. A single `ROLES.ADMIN` const + a `requireAdmin(req)` helper would collapse this into a typed function call.

The `'admin'` literal appears 110 times. The 4 `'salon_owner'` and 1 `'customer'` occurrences confirm the same pattern across all roles. Plus the `discovery/post/route.ts:32` uses `'salon_owner'` as a permission key with no consolidated table.

**Helper exists for none of this.** No `isAdmin(profile)` or `requireAdmin(supabase)` function in `lib/`.

#### M2. Status string literals: 292 total occurrences

Distribution by status name (top values):
- `"completed"` — 16 equality + many in DB ops
- `"pending"` — 14
- `"confirmed"` — 14
- `"cancelled"` — 12
- `"booked"` — 11
- `"available"` — 8
- `"active"` — 7
- `"blocked"` — 6
- `"waiting"` — 6 (walk-in queue)
- `"in_chair"` — 5 (walk-in queue)
- `"paid"` — 4
- `"no_show"` — 4
- `"deposit_held"` — 4
- `"requires_capture"` — 3
- Many more single-use values

Types DO exist:
- `BookingStatus` (lib/types.ts:21)
- `SlotStatus` (lib/types.ts:35)
- `PaymentStatus` (lib/types.ts:705)
- `WalkinStatus` (lib/types.ts:1021)
- `DisputeStatus` (lib/types.ts:710)
- `DiscoveryStatus` (lib/types.ts:428)

But there are **no `BOOKING_STATUS`/`SLOT_STATUS` constant maps**, and call sites use bare string literals everywhere:
- `.eq("status", "confirmed")` — 96 DB-query usages
- `.update({ status: "available" })` — 31 DB-write usages
- `status === "confirmed"` — 165 equality checks (UI rendering + business logic)

Most-egregious file: `app/[locale]/dashboard/calendar/page.tsx` (lines 315-822) has 14 separate `status === "booked"`/`"blocked"`/`"available"` UI branches. Adding a 4th slot status would require finding all of these by hand.

Same drift risk as M1 — a `BOOKING_STATUS.CONFIRMED` exported map (or `as const` constants object) plus a `STATUS_LABEL` map would collapse this.

#### M3. Magic time durations repeated 106+ times

Variations of "one day in ms" appear in:
- `24 * 60 * 60 * 1000` — appears ~30 times across `lib/automod.ts`, `app/api/profile/live-state/route.ts`, `app/api/metrics/global/route.ts`, `lib/cancellation-policy.ts`, `lib/discovery-algorithm.ts`, `lib/nail/infill-calculator.ts`, multiple supabase functions
- `7 * 24 * 60 * 60 * 1000` — appears ~10 times for week computations
- `86400000` — appears ~10 times in `supabase/functions/compute-analytics/index.ts` (recompiled `24 * 60 * 60 * 1000`)
- `86400` (seconds, used in middleware CORS + Redis TTL + sms.ts + revalidate) — appears ~5 times
- `3600` (Redis revalidate, lib/posthog-api.ts:27; lib/sms.ts:39) — appears ~3 times
- `1000 * 60 * 60` — appears ~5 times
- `365 * 24 * 60 * 60 * 1000` (gift card 1-year expiry, app/api/gift-cards/purchase/route.ts:63) — once but should be `ONE_YEAR_MS`
- `30 * 24 * 60 * 60 * 1000` (token expiry, salon-verification:43) — once, naked

Only one file has named time constants: `supabase/functions/smart-nudges/index.ts:25` defines `const DAY_MS = 24 * 60 * 60 * 1000;` — then **stops using it 4 lines later** and writes the literal again.

Recommended pattern: `lib/constants/time.ts` exporting `ONE_DAY_MS`, `ONE_HOUR_MS`, `ONE_WEEK_MS`, etc.

#### M4. Business-logic magic numbers (threshold checks, 228 occurrences)

High-signal examples (not exhaustive):

| File | Line | Magic | Meaning |
|------|------|-------|---------|
| `lib/automod.ts` | 42 | `< 10` | Review comment too short |
| `lib/automod.ts` | 72, 81, 99, 107 | `>= 3` | "3 recent 1-star/5-star" review-bombing detection |
| `lib/strikes.ts` | 40 | `>= 2` | "+1 for current makes 3" cancellation threshold |
| `lib/strikes.ts` | 67, 71 | `=== 3` / `>= 5` | No-show warning vs suspension threshold (ToS §4.4) |
| `lib/nail/ai-budget.ts` | 9 | `50` | CHF/month AI generation budget |
| `lib/nail/ai-budget.ts` | 10 | `0.05` | CHF per fal.ai call |
| `lib/nail/ai-budget.ts` | 11 | `0.8` | Warning threshold (80%) |
| `app/api/reviews/[id]/photos/route.ts` | 46, 52 | `3` | Max review photos |
| `app/api/gift-cards/balance/route.ts` | 26 | `< 3` | Voucher code min length |
| `app/api/referral/validate/route.ts` | 13 | `< 3` | Same — voucher code min length |
| `app/api/coming-soon-notify/route.ts` | 18 | `< 5` | Email min length |
| `app/api/salon/waxing-zone-packages/route.ts` | 65 | `Math.min(50, ...)` | Max 50% discount |
| `app/api/discovery/similar/route.ts` | 16 | `12` | Max similar items |
| `app/api/directory/route.ts` | 22 | `50` | Max page size |
| `app/api/admin/discovery/backfill/route.ts` | 47 | `50` | Same — max page size |
| `lib/barber/visit-cycle-algorithm.ts` | 36 | `0.7`, `1.5`, `0.2` | Time-decay weights |
| `app/api/directory/[id]/claim/route.ts` | 87 | `100000 + ... * 900000` | 6-digit OTP generator |
| `app/api/auth/verify-phone/send/route.ts` | 30 | `100000 + ... * 900000` | Same 6-digit OTP — duplicated logic |

The ToS-derived strike thresholds (`lib/strikes.ts`) are notably critical — they encode the terms-of-service rules numerically, and the rules are coded with `=== 3` and `>= 5` inline instead of `MAX_NO_SHOWS_BEFORE_SUSPENSION = 5`.

Rate-limit windows in `lib/ratelimit.ts` are inline (`Ratelimit.slidingWindow(30, "1 m")`, `(5, "1 h")`, `(3, "1 h")`, `(20, "1 m")` etc.) — fine since each limiter is named, but the windows themselves are not centralized.

#### M5. Hardcoded Supabase RPC names — duplication low

`get_nearby_salon_ids`, `get_last_minute_slots`, `match_search_embeddings`, `toggle_discovery_like`, `toggle_discovery_save`, `create_group_booking`, `get_rebooking_candidates`, `increment_unread`, `increment_discovery_view`, `increment_field`.

Most names appear exactly once. `increment_field` is the only RPC called twice (`app/api/discover/nails/route.ts:106, 111`). Generally well-managed — but worth a `lib/supabase/rpc.ts` enum to defend against future typos.

#### M6. Hardcoded Supabase storage bucket names

| Bucket | Usages |
|--------|--------|
| `salon-photos` | 5 |
| `review-photos` | 4 (also 1 differently-quoted) |
| `discovery-images` | 4 |
| `chat-attachments` | 2 |
| `salon-documents` | 2 |
| `service-photos` | 1 |
| `client-photos` | 1 |

The `review-photos` bucket is referenced with mixed quoting (`'review-photos'` 4× + `"review-photos"` 1×) across `src/services/salons.js`, `src/views/reviews/index.js`, etc. Plus `src/services/bookings.js` uses `chat-attachments`. Recommend `lib/constants/storage.ts` with `STORAGE_BUCKETS.SALON_PHOTOS`, etc.

---

### LOW (39)

#### L1. Magic ints in UI ScrollRow + section limits

Scattered `limit: 6`, `limit: 8`, `limit: 12` in API route query params and homepage section fetches. No `HOMEPAGE_SECTION_LIMIT` const. Drift between Coiffeur (6), Nearby (8), Featured (12) etc. is plausible business intent — but worth naming.

#### L2. Email-template price/CHF/percent literals inside `lib/email.ts` HTML strings

Things like `padding:10px 20px`, `border-radius:8px`, `background:#F25C54` — these are inline CSS for Resend emails (Resend strips many `<style>` blocks, so inline is correct). Low priority but the brand color `#F25C54` appears literally 4+ times in email HTML — should be exported from `lib/email-templates/brand.ts`.

#### L3. Test-data placeholder emails (`lara@example.ch`, `mitarbeiter@email.ch`)

- `app/[locale]/dev/primitives/page.tsx` — 7 usages of `lara@example.ch` as form placeholders
- `app/[locale]/vouchers/buy/page.tsx:265` — `beispiel@email.com`
- `app/[locale]/_components/layout/Footer.tsx:154` — `deine@email.ch`
- `components-legacy/onboarding/steps/TeamStep.tsx:72` — `mitarbeiter@email.ch`

These are intentional UI placeholders. LOW priority — not config leaks.

#### L4. Hardcoded Stripe webhook docstring URL

`app/api/stripe/webhook/route.ts:13` — comment mentions `https://solen.ch/api/stripe/webhook`. Not executable code; LOW.

#### L5. Instagram / TikTok URL templates

`https://instagram.com/${salon.instagram}` and `https://www.tiktok.com/oembed?...` — these are inline template strings without a constant. Single-use, LOW.

---

## Consolidation recommendations

### Existing constants files
- `lib/constants/categories.ts` — only one file in `lib/constants/`. Contains `CATEGORY_OPTIONS`.
- `lib/cities.ts` — has `CITIES` and `CITY_SLUGS` consts (good pattern).
- `lib/feature-flags.ts` — has `CLIENT_FEATURE_FLAGS` (`as const`).
- `lib/tos-version.ts` — `CURRENT_TOS_VERSION`, `TOS_EFFECTIVE_DATE`.
- `lib/types.ts` — all `*Role`/`*Status` **types** are here, but no **runtime constants** for them.

### Missing constants files (recommended)

| File | Should export | Purpose |
|------|---------------|---------|
| `lib/constants/roles.ts` | `ROLES = { ADMIN: "admin", SALON_OWNER: "salon_owner", CUSTOMER: "customer" } as const` + `isAdmin(profile)` + `requireAdmin(supabase)` | Collapse 116 role-string occurrences |
| `lib/constants/status.ts` | `BOOKING_STATUS`, `SLOT_STATUS`, `PAYMENT_STATUS`, `DISPUTE_STATUS`, `WALKIN_STATUS`, `DISCOVERY_STATUS` as const maps | Collapse 292 status occurrences |
| `lib/constants/time.ts` | `ONE_MINUTE_MS`, `ONE_HOUR_MS`, `ONE_DAY_MS`, `ONE_WEEK_MS`, `ONE_MONTH_MS`, `ONE_YEAR_MS` | Collapse 106 time-duration literals |
| `lib/constants/urls.ts` | `SITE_ORIGIN` (derived from `NEXT_PUBLIC_APP_URL`), `RESEND_API_URL`, `GEMINI_API_BASE`, `GEMINI_MODEL`, `STRIPE_DASHBOARD_BASE`, `SMS_GATEWAY_URL`, `TIKTOK_OEMBED_BASE` | Collapse 41 file-level URL hits (Resend×12 + solen.ch×28 + Gemini×6) |
| `lib/constants/storage.ts` | `STORAGE_BUCKETS = { SALON_PHOTOS: "salon-photos", ... } as const` | Single source of truth for bucket names |
| `lib/constants/limits.ts` | `MAX_REVIEW_PHOTOS = 3`, `MAX_DISCOUNT_PERCENT = 50`, `MAX_PAGE_SIZE = 50`, `MIN_REVIEW_COMMENT_LENGTH = 10`, `OTP_DIGITS = 6` | Business limits |
| `lib/constants/strikes.ts` | `MAX_SALON_CANCELS_30D = 3`, `MAX_NO_SHOWS_FOR_WARNING = 3`, `MAX_NO_SHOWS_FOR_SUSPENSION = 5`, `STRIKE_WINDOW_DAYS = 30`, `NO_SHOW_WINDOW_DAYS = 180` | Currently inline in `lib/strikes.ts` |
| `lib/email-templates/brand.ts` | `EMAIL_PRIMARY_COLOR`, `EMAIL_BUTTON_RADIUS`, etc. | Used in HTML template strings |
| `lib/supabase/rpc-names.ts` | `RPC = { GET_NEARBY_SALON_IDS: "get_nearby_salon_ids", ... } as const` | Catch typos at compile time |

### Quick-win refactor priority

1. **`lib/constants/urls.ts` + a single `SITE_ORIGIN` derived from `NEXT_PUBLIC_APP_URL`** — fixes the broken `localhost:3000` review-respond email links (HIGH H5) and unifies 28 hardcoded-domain files.
2. **`lib/constants/roles.ts` + `requireAdmin()` helper** — touches 110 `role === "admin"` sites; 40 are `if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });` boilerplate that could become `if (await requireAdmin(supabase)) return Forbidden();`. Reduces drift risk + cuts ~10 lines per admin route.
3. **`lib/constants/status.ts` + per-domain status maps** — eliminates 292 string literals in DB ops and UI branches.
4. **`lib/constants/time.ts`** — purely mechanical replace of `24 * 60 * 60 * 1000` → `ONE_DAY_MS` across 106 sites.

### Net consolidation impact (back-of-envelope)

Refactoring all 7 missing-constants files would touch ~150-200 source files and reduce ~728 magic-value occurrences to ~10-15 imported constants. Lines-changed estimate: ~1500-2000 single-line edits, mechanically applied via TS-AST codemod or rg/sed.

---

## Audit complete.
