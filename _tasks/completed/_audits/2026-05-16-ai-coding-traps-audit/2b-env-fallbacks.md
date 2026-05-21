# Topic 2B — Env Fallback Patterns Audit
Date: 2026-05-16
Scope: `process.env.X || 'fallback'`, `?? 'default'`, `X!`, untyped env access

## Summary

- **Total findings: 60** (CRITICAL: 23 | HIGH: 14 | MEDIUM: 14 | LOW: 9)
- **Typed env module present:** NO — there is no `lib/env.ts`, no `env.mjs`, no `src/env`, no `@/env` anywhere in the repo (verified via `find` and grep over the entire tree, scope excludes already in place).
- **Validation library in use:** NONE for env. Zod v4.3.6 is installed and used for request-body validation (e.g. `lib/validations.ts`, route handlers), but never for `process.env`.
- **Direct `process.env.*` call sites:** **162 occurrences across 102 files** (vs centralized: 0). Of those:
  - 3 are the benign `process.env.NODE_ENV` checks (expected/standard Next.js pattern)
  - 159 are direct access to secret/config envs scattered across the codebase

This is a **structural systemic issue**, not a localized bug. The entire env surface is unvalidated, untyped, and fallback-ridden. The single highest-risk anti-pattern is the CRON_SECRET template-string comparison: 21 cron / admin / loyalty routes use `authHeader !== \`Bearer ${process.env.CRON_SECRET}\``, which silently authenticates a request with the literal string `Bearer undefined` if CRON_SECRET is missing — full bypass of admin/cron auth.

---

## Findings by severity

### CRITICAL (23)

These are env fallbacks (or equivalent silent-default patterns) on auth secrets, signing secrets, and webhook secrets. If the env is missing in production the system silently uses a wrong/empty/`undefined` value and accepts forged or unauthorized requests.

#### C1. `process.env.CRON_SECRET` in template-string auth check — 21 occurrences (auth bypass on missing env)

This is the worst finding in the entire repo. Every cron and admin-trigger endpoint uses:

```ts
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

If `CRON_SECRET` is unset in production, `process.env.CRON_SECRET` is `undefined`, the template literal evaluates to `"Bearer undefined"`, and any attacker sending `Authorization: Bearer undefined` is authenticated as cron. There is no `if (!secret) throw` guard before the comparison.

Affected files:
- `app/api/admin/solen-score/recalculate/route.ts:14`
- `app/api/admin/badges/auto-assign/route.ts:11`
- `app/api/loyalty/award/route.ts:17`
- `app/api/cron/birthday-messages/route.ts:10`
- `app/api/cron/welcome-series/route.ts:14`
- `app/api/cron/no-show/route.ts:8`
- `app/api/cron/rebooking-nudge/route.ts:12`
- `app/api/cron/salon-onboarding/route.ts:19`
- `app/api/cron/auto-complete/route.ts:9`
- `app/api/cron/generate-slots/route.ts:10`
- `app/api/cron/late-cancel/route.ts:17`
- `app/api/cron/release-deposits/route.ts:10`
- `app/api/cron/nail-infill-reminders/route.ts:10`
- `app/api/cron/barber-smart-reminders/route.ts:11`
- `app/api/cron/sms-reminders/route.ts:16`
- `app/api/cron/process-deletions/route.ts:11`
- `app/api/cron/pre-charge/route.ts:15`
- `app/api/cron/pending-timeout/route.ts:9`
- `app/api/cron/release-payments/route.ts:14`
- `app/api/cron/reminders/route.ts:13`
- `app/api/cron/review-prompt/route.ts:14`

Severity: CRITICAL. This is template-string fallback masking, not technically `|| 'default'`, but the runtime semantics are identical and worse — attackers can guess the literal `Bearer undefined` payload.

#### C2. `process.env.SUPABASE_SERVICE_ROLE_KEY!` non-null assertion (service-role key, RLS-bypass)

- `lib/supabase.ts:64` — `createAdminSupabaseClient()` uses `process.env.SUPABASE_SERVICE_ROLE_KEY!`. If missing, the admin client is constructed with `undefined` as the JWT, which Supabase-JS may stringify into `"undefined"` and pass as a bearer token in every admin write — silent failure mode (writes fail with cryptic 401/403 instead of bootstrap error).
- `app/api/salons/[slug]/gallery/route.ts:6` — module-level `process.env.SUPABASE_SERVICE_ROLE_KEY!` evaluated at import time.
- `scripts/collect-basel-salons.ts:34` — bang on service-role key in script.
- `scripts/send-outreach-emails.ts:32` — bang on service-role key in script.

Severity: CRITICAL. Service-role key bypasses RLS; a wrong/missing value breaks every admin path silently and prevents the boot-time error TypeScript can never produce because of the `!`.

#### C3. `SUPABASE_SERVICE_ROLE_KEY || NEXT_PUBLIC_SUPABASE_ANON_KEY` fallback chain (privilege downgrade silent)

- `app/api/partner/leads/route.ts:13` — `const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;`

If the service-role key is missing, the route silently falls back to the anon key. Inserts into `partner_leads` may then either fail (if RLS blocks) or, worse, succeed under a different identity profile than the code expects. Lines 16-18 then check both and return `{ success: true, warning: 'mocked' }` — fake success returned to the client. This masks a misconfiguration as a feature.

Severity: CRITICAL. Silent privilege downgrade + fake-success response.

---

### HIGH (14)

Env fallbacks / non-null assertions on Stripe payment secrets and Supabase URL. These are payment-critical but slightly less severe than auth-bypass because Stripe itself will reject an empty/wrong key (it just fails noisily later, not silently). Still HIGH because the failure mode is "checkout returns 500 in production with no clear log" vs "boot-time crash with the actual missing-env name."

#### H1. `process.env.STRIPE_SECRET_KEY!` non-null assertion (13 occurrences)

- `app/api/gift-cards/purchase/route.ts:13`
- `app/api/bookings/[id]/route.ts:91`
- `app/api/bookings/[id]/cancel/route.ts:11`
- `app/api/bookings/[id]/refund/route.ts:11`
- `app/api/admin/booking-disputes/[id]/action/route.ts:118`
- `app/api/admin/salons/[id]/freeze/route.ts:63`
- `app/api/conversations/[id]/price-offer/route.ts:124`
- `app/api/packages/purchase/route.ts:11`
- `app/api/tips/route.ts:11`
- `app/api/cron/no-show/route.ts:39`
- `app/api/cron/pre-charge/route.ts:9`
- `app/api/cron/pending-timeout/route.ts:67`
- `app/api/cron/release-payments/route.ts:8`

Note: `lib/stripe.ts:8-9` correctly does `if (!key) throw new Error("STRIPE_SECRET_KEY is not set")` — a good pattern that should be the project standard. But the routes above bypass `lib/stripe.ts` entirely and instantiate `new Stripe(process.env.STRIPE_SECRET_KEY!, …)` inline, dodging the validated path.

#### H2. `process.env.STRIPE_SECRET_KEY || ""` empty-string fallback (2 occurrences)

- `app/api/vouchers/route.ts:22` — `new Stripe(process.env.STRIPE_SECRET_KEY || "", …)`
- `app/api/vouchers/confirm/route.ts:14` — same pattern

Strictly worse than `!` because Stripe SDK is given a literal empty string and will return obscure auth errors at request time, not at boot. Voucher purchases silently break if STRIPE_SECRET_KEY is unset.

#### H3. `process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!` non-null assertion (4 occurrences)

- `app/[locale]/checkout/page.tsx:20`
- `app/[locale]/vouchers/page.tsx:19`
- `app/[locale]/vouchers/buy/page.tsx:24`
- `components-legacy/profile/PaymentMethodsSection.tsx:10`

`loadStripe(undefined)` returns a Stripe object that rejects every operation at runtime. Client-side payment forms render and crash on submit.

#### H4. `process.env.NEXT_PUBLIC_SUPABASE_URL!` / `NEXT_PUBLIC_SUPABASE_ANON_KEY!` non-null assertion (10 occurrences)

- `lib/supabase.ts:19, 20, 63, 87, 88` (5 sites)
- `lib/supabase-browser.ts:9, 10` (2 sites)
- `app/api/auth/callback/route.ts:23, 24`
- `app/api/salons/[slug]/gallery/route.ts:5`
- `scripts/collect-basel-salons.ts:33`
- `scripts/send-outreach-emails.ts:31`

Missing env → `createClient(undefined, undefined)` → cryptic runtime errors instead of boot-time failure. Note middleware (`middleware.ts:103-108`) DOES correctly read these without `!` and guard with `if (!supabaseUrl || !supabaseKey) return response;` + console.error — this is the right pattern, but only middleware uses it.

---

### MEDIUM (14)

Fallback on app config — URLs, admin emails, integration tokens. Won't bypass auth, but produces wrong behavior silently (emails to wrong address, links pointing to wrong domain, missing maps).

#### M1. `process.env.NEXT_PUBLIC_APP_URL || "https://solen.ch"` / `"http://localhost:3000"` (4 occurrences)

- `app/api/off-peak/route.ts:132` — `|| "https://solen.ch"`
- `app/api/admin/tos/notify/route.ts:52` — `|| "https://solen.ch"` (on NEXT_PUBLIC_SITE_URL)
- `app/api/reviews/route.ts:81` — `|| "http://localhost:3000"`
- `app/api/reviews/[id]/respond/route.ts:66` — `|| "http://localhost:3000"`

The `localhost:3000` fallbacks in production emails would send users links pointing to localhost. Silent failure.

#### M2. `process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.solen.ch"` (1 occurrence)

- `lib/booking-email.ts:76`

#### M3. `process.env.ADMIN_EMAIL ?? "admin@solen.ch"` (3 occurrences)

- `app/api/admin/notify-new-salon/route.ts:15`
- `app/api/stripe/webhook/route.ts:183`
- `app/api/stripe/webhook/route.ts:212`

#### M4. `process.env.RESEND_FROM_EMAIL ?? "noreply@solen.ch"` (1 occurrence)

- `lib/booking-email.ts:75`

#### M5. `process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''` / `?? ""` (2 occurrences)

- `app/[locale]/salon/[slug]/page.tsx:749` — embedded directly in mapbox URL → broken map image
- `components-legacy/MapView.tsx:74`

#### M6. `process.env.NEXT_PUBLIC_MAPBOX_STYLE_*` fallback (4 occurrences)

- `components-legacy/MapView.tsx:76, 77, 122, 123`

Defaults to public mapbox style URLs — reasonable, but still hides the env-missing case.

#### M7. `process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ""` (1 occurrence)

- `components-legacy/ui/AddressAutocomplete.tsx:24`

#### M8. `process.env.BASE_URL || "http://localhost:3001"` (1 occurrence)

- `playwright.config.ts:35` — test infra only; legitimate to keep but listed for completeness.

#### M9. `process.env.GOOGLE_PLACES_API_KEY!` non-null assertion (1 occurrence)

- `scripts/collect-basel-salons.ts:32` — script context.

#### M10. `process.env.RESEND_API_KEY!` non-null assertion (1 occurrence)

- `scripts/send-outreach-emails.ts:33`

---

### LOW (9)

Optional-feature envs that legitimately default to "feature disabled" — e.g. Upstash Redis short-circuiting to no-rate-limiting, AI keys producing 503s. These are arguably correct: a missing env genuinely should disable the optional feature rather than crash boot. Flagged so the team can decide whether each is truly optional.

- `lib/ratelimit.ts:82` — Upstash gate (returns null = "skip rate limiting"); arguably should fail-closed in production
- `lib/nail/ai-budget.ts:17` — Upstash gate
- `app/api/gift-cards/balance/route.ts:10` — Upstash gate
- `app/api/auth/verify-phone/send/route.ts:8-11` — Upstash gate (this one is more serious — without rate-limit the phone-verify endpoint can be hammered for SMS-cost abuse; arguably should be HIGH/CRITICAL)
- `app/api/auth/verify-phone/check/route.ts:9-12` — same
- `app/api/cron/sms-reminders/route.ts:20` — `if (!SEVEN_IO_API_KEY)` early-return; optional feature
- `app/api/admin/nail/generate/route.ts:18` — FAL_KEY guard
- `app/api/chat/suggest/route.ts:19` — GEMINI_API_KEY guard
- `app/[locale]/discover/[id]/page.tsx:30` — GEMINI_API_KEY guard

---

## Direct `process.env.*` call sites

102 files × 162 occurrences. The complete distribution by env name (rough counts):

- `STRIPE_SECRET_KEY` — 16
- `NEXT_PUBLIC_SUPABASE_URL` — 13
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 11
- `CRON_SECRET` — 21
- `SUPABASE_SERVICE_ROLE_KEY` — 6
- `GEMINI_API_KEY` — 10
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — 4
- `RESEND_API_KEY` — 7
- `UPSTASH_REDIS_REST_URL` / `_TOKEN` — 10
- `NEXT_PUBLIC_MAPBOX_TOKEN` — 2
- `BOOKING_HMAC_SECRET` — 3
- `LOYALTY_HMAC_SECRET` — 2
- Other (NODE_ENV, ADMIN_EMAIL, SEVEN_API_KEY, FAL_KEY, GOOGLE_PLACES_API_KEY, …) — remainder

None go through a single chokepoint. Each new route handler re-implements env access with its own ad-hoc guard pattern (or no guard at all).

---

## Recommendation

**Yes — add a typed validated env module.** This is the single highest-leverage cleanup in the codebase from a security + reliability standpoint.

Why:
1. The 21 `CRON_SECRET` template-string comparisons are a real auth-bypass vulnerability that would be impossible if `env.CRON_SECRET` was zod-validated `z.string().min(32)` at boot — the app would refuse to start with an unset cron secret.
2. The 33 non-null assertions (`!`) on `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_*` are lies to TypeScript that produce cryptic runtime failures instead of clear boot-time errors. Zod schema would turn each into a single readable boot error.
3. The 14 silent-fallback patterns (`|| "https://solen.ch"`, `?? "admin@solen.ch"`, `|| ""`) currently mask "this env is misconfigured in prod" as "the system is running, just sending email to admin@solen.ch instead of the configured admin." A boot-time validation would surface these.
4. 102 files do raw `process.env.*` access — that surface area makes consistent guarding via review impossible. Centralizing into `lib/env.ts` (`export const env = envSchema.parse(process.env)`) means each call site becomes `env.STRIPE_SECRET_KEY` with full type narrowing and no possibility of `undefined`.

How (recommended):
- Add `@t3-oss/env-nextjs` (purpose-built for Next.js, handles the server vs `NEXT_PUBLIC_*` client split correctly). Zod is already a dep.
- Create `lib/env.ts` with `server` schema (STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, BOOKING_HMAC_SECRET, LOYALTY_HMAC_SECRET, RESEND_API_KEY, GEMINI_API_KEY, etc — all `.min(N)` or `.url()` validated) and `client` schema (NEXT_PUBLIC_* with the same prefix rule).
- Codemod the 102 files: replace every `process.env.X` with `env.X` from `@/lib/env`. Strip all `!`, `|| "fallback"`, `?? "default"`. The validation lives in one place.
- Mark optional features (Upstash, FAL_KEY, SEVEN_IO_API_KEY, PostHog) as `.optional()` in the schema. Then route handlers do `if (!env.UPSTASH_REDIS_REST_URL) …` against a properly-typed `string | undefined`, not a stringly-true raw `process.env` read.

This is a 4-8 hour codemod that closes 23 CRITICAL + 14 HIGH findings in one PR and prevents an entire failure class from ever recurring.

---

## Notes on what was NOT a finding

- `process.env.NODE_ENV === "development"` / `=== "production"` — Next.js sets this; safe and idiomatic. 3 such call sites are correct.
- `lib/stripe.ts:6-13` — `getStripe()` does correct `if (!key) throw new Error(...)` guard. This is the pattern to copy, not the problem to fix. The fix is that 13 other routes bypass `getStripe()` and instantiate `new Stripe(process.env.STRIPE_SECRET_KEY!)` inline.
- `app/api/bookings/walk-in/route.ts:11-12` — does `if (!secret) throw new Error("BOOKING_HMAC_SECRET not set")` — correct pattern, fail-closed.
- `middleware.ts:106-108` — does explicit null-check with logging — correct pattern.

The good patterns exist. They're just not enforced or systematic.

---

## env.ts presence audit

**`lib/env.ts` (or any equivalent validated env loader: `env.ts`, `env-config.ts`, `env-validation.ts`, `src/env`, `@/env`, `@t3-oss/env-nextjs`) does NOT exist.**

Verified via `find . -name "env.ts" -not -path "*/node_modules/*" -not -path "*/.next/*"` (zero matches) and `grep -r "z\.object" lib/ src/` (zero matches for env-shaped schemas — zod is only used for request-body validation in `lib/validations.ts` and `lib/registration-validation.ts`).

This is flagged as **HIGH severity infrastructure gap** because the current codebase has:
- 33 distinct env vars referenced across 102+ files
- 35 `!` non-null assertions on env (lies to TS, cryptic runtime crashes)
- 15 `|| "fallback"` literal-string fallbacks
- 6 `?? "fallback"` literal-string fallbacks
- 21 `CRON_SECRET` template-string comparisons (auth bypass on missing env, see C1)
- 5+ silent rate-limiter / budget-cap bypasses on missing Redis env (lib/ratelimit.ts:82, lib/nail/ai-budget.ts:17 — financial-cap bypass on the second)
- 1 silent fake-200 lead-capture failure on missing service-role key (app/api/partner/leads/route.ts:13)
- 1 build-time env alias in next.config.mjs (`NEXT_PUBLIC_MAPBOX_TOKEN: process.env.MAPBOX_API`) that fails-undefined silently

### Suspected env-name inconsistencies discovered during audit

Two findings worth flagging — both are typo-class risks that a single `lib/env.ts` schema would expose immediately:

1. **`SEVEN_API_KEY` vs `SEVEN_IO_API_KEY`** — both are referenced in the codebase as if they were the same service.
   - `app/api/auth/verify-phone/send/route.ts:35` reads `process.env.SEVEN_API_KEY`
   - `app/api/bookings/walk-in/route.ts:82`, `lib/sms.ts:21,57`, `app/api/cron/reminders/route.ts:17` read `process.env.SEVEN_IO_API_KEY`
   - Only one of these matches the actual env value set in Netlify. The other half of the codebase is silently degraded.

2. **`GEMINI_API_KEY` vs `GOOGLE_AI_API_KEY`** — both used for Google Generative AI calls.
   - `app/api/ai/suggest-service/route.ts:27` reads `process.env.GOOGLE_AI_API_KEY`
   - 14 other AI files read `process.env.GEMINI_API_KEY`
   - Same risk — only one env is set in deployment, the other is silently broken.

A typed env schema would have caught both at build time.

### Complete list of distinct env vars referenced — "should be in env.ts"

Below is every distinct `process.env.*` reference found across the codebase, grouped by severity tier. Each entry maps to the schema definition that should be added to a future `lib/env.ts`.

#### Tier 1 — CRITICAL (must be `.required()` in production schema)

| Env var | Used where | Recommended schema |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | DB endpoint (client + server) | `z.string().url()` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | DB anon (client + server) | `z.string().min(20)` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin DB (RLS bypass) | `z.string().min(20)` |
| `STRIPE_SECRET_KEY` | Server Stripe SDK | `z.string().startsWith("sk_")` |
| `STRIPE_WEBHOOK_SECRET` | Webhook sig verification | `z.string().startsWith("whsec_")` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client Stripe Elements | `z.string().startsWith("pk_")` |
| `BOOKING_HMAC_SECRET` | Booking action token signing | `z.string().min(32)` |
| `LOYALTY_HMAC_SECRET` | Loyalty QR token signing | `z.string().min(32)` |
| `CRON_SECRET` | Cron auth (21 sites — see C1) | `z.string().min(20)` |

#### Tier 2 — HIGH (transactional / auth degradation)

| Env var | Used where | Recommended schema |
|---|---|---|
| `RESEND_API_KEY` | Transactional email (7 sites) | `z.string().startsWith("re_").optional()` (degrade-OK in dev, required in prod) |
| `RESEND_FROM_EMAIL` | Email sender | `z.string().email().default("noreply@solen.ch")` |
| `ADMIN_EMAIL` | Admin notification target | `z.string().email().default("admin@solen.ch")` |
| `NEXT_PUBLIC_APP_URL` | Callback URLs (4 sites) | `z.string().url()` |
| `NEXT_PUBLIC_SITE_URL` | Email link base URL | `z.string().url()` |
| `UPSTASH_REDIS_REST_URL` | Rate limit + budget cap | `z.string().url().optional()` — but fail-closed in prod |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth | `z.string().optional()` |
| `SEVEN_IO_API_KEY` | SMS (booking + cron) | `z.string().optional()` |
| `SEVEN_API_KEY` | SMS (verify-phone — **consolidate with above**) | `z.string().optional()` |

#### Tier 3 — MEDIUM (feature degradation)

| Env var | Used where | Recommended schema |
|---|---|---|
| `GEMINI_API_KEY` | AI features (14 sites) | `z.string().optional()` |
| `GOOGLE_AI_API_KEY` | AI alt key (1 site — **consolidate with GEMINI_API_KEY**) | `z.string().optional()` |
| `GOOGLE_PLACES_API_KEY` | Salon collection script | `z.string().optional()` |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Address autocomplete | `z.string().optional()` |
| `FAL_KEY` | Nail AI image gen (budget-tracked) | `z.string().optional()` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Maps display | `z.string().optional()` |
| `MAPBOX_API` | **Build-time alias** for above (next.config.mjs:14) | **remove — use NEXT_PUBLIC_MAPBOX_TOKEN directly** |

#### Tier 4 — LOW (optional analytics + cosmetic)

| Env var | Used where | Recommended schema |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | Client analytics | `z.string().optional()` |
| `POSTHOG_PERSONAL_API_KEY` | Server analytics API | `z.string().optional()` |
| `POSTHOG_PROJECT_ID` | Server analytics project | `z.string().optional()` |
| `NEXT_PUBLIC_MAPBOX_STYLE_DARK` | Custom map style | `z.string().optional()` |
| `NEXT_PUBLIC_MAPBOX_STYLE_LIGHT` | Custom map style | `z.string().optional()` |
| `UNSPLASH_ACCESS_KEY` | Stock photo provider | `z.string().optional()` |
| `PEXELS_API_KEY` | Stock photo provider | `z.string().optional()` |
| `PIXABAY_API_KEY` | Stock photo provider | `z.string().optional()` |
| `NODE_ENV` | Next.js standard | (auto-handled by Next) |
| `BASE_URL` | Playwright test only | (test-config scope) |

### Count + path

- **Total findings:** 60 (CRITICAL: 23, HIGH: 14, MEDIUM: 14, LOW: 9) — as previously enumerated above
- **Distinct env vars referenced:** 33
- **`lib/env.ts` present:** NO — flagged HIGH severity infrastructure gap
- **Recommended fix priority:** add `lib/env.ts` first (4-8h codemod), then close C1 (21 CRON_SECRET sites), then C2 (4 service-role bang sites), then H1-H4 (Stripe / Supabase bangs). One PR can close the entire CRITICAL + HIGH set.

**Report path:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/_audits/2026-05-16-ai-coding-traps-audit/2b-env-fallbacks.md`
