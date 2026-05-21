# Topic 2A — Secrets / Service Role / NEXT_PUBLIC Security Audit
Date: 2026-05-16
Scope: Hardcoded secrets, service-role-key leaks, NEXT_PUBLIC exposure audit

## Summary
- Total findings: 10 (CRITICAL: 0 · HIGH: 4 · MEDIUM: 5 · LOW: 1)
- Service role usages found: 14 (16 references) | NEXT_PUBLIC_ vars: 10 | Suspect hardcoded keys: 0

**Top-line verdict: no literal secret values are committed in source, and no service-role-key reference appears inside a `'use client'` file.** The codebase passes the "did Claude paste my API key into the repo" check.

However, `lib/supabase.ts` co-locates the service-role admin client and the browser client in the same module, and two `'use client'` legacy components import from it. Next.js inlines only `NEXT_PUBLIC_*` env vars in client bundles, so this is not an active leak — but it is a fragile architecture that one stray `import { createAdminSupabaseClient }` from a client component will turn into a live leak with no compile-time error. Highest-leverage fix: enforce the split between `lib/supabase.ts` (server) and `lib/supabase-browser.ts` (already exists) and update the two offending legacy files.

A second cluster of HIGH-severity issues comes from `process.env.X!` non-null assertions (35 occurrences). These lie to the type checker and become `loadStripe(undefined)` / `createClient(undefined, undefined)` at runtime when env vars are missing — a class of silent-broken-prod errors. Recommend a single `lib/env.ts` zod-validated env object.

---

## Service role key usages (table)

All 16 occurrences across 14 files. Every one is in a server-only context. No client contamination.

| File | Line | Context (client/server) | Verdict |
|---|---|---|---|
| `app/api/content/route.ts` | 19 | API route (Edge runtime) | OK |
| `app/api/partner/leads/route.ts` | 13 | API route (Node) | OK — but anon-key fallback is a smell (see HIGH-3) |
| `app/api/salons/[slug]/gallery/route.ts` | 6 | API route (Node) | OK |
| `supabase/functions/booking-reminder/index.ts` | 8 | Supabase Edge Function (Deno) | OK |
| `supabase/functions/post-booking-preferences/index.ts` | 18 | Supabase Edge Function (Deno) | OK |
| `supabase/functions/compute-analytics/index.ts` | 9 | Supabase Edge Function (Deno) | OK |
| `supabase/functions/salon-verification/index.ts` | 24 | Supabase Edge Function (Deno) | OK |
| `supabase/functions/smart-nudges/index.ts` | 8 | Supabase Edge Function (Deno) | OK |
| `supabase/functions/recurring-booking-processor/index.ts` | 31 | Supabase Edge Function (Deno) | OK |
| `supabase/functions/slot-auto-release/index.ts` | 9 | Supabase Edge Function (Deno) | OK |
| `scripts/collect-basel-salons.ts` | 34 | CLI script (Node) | OK |
| `scripts/send-outreach-emails.ts` | 32 | CLI script (Node) | OK |
| `scripts/backfill-embeddings.ts` | 22 | CLI script (Node) | OK |
| `lib/supabase.ts` | 64 | Server lib (consumed by API routes + server components) | OK at runtime, ARCHITECTURE-FRAGILE (see HIGH-1) |

`createAdminSupabaseClient` (the helper from `lib/supabase.ts`) is imported by ~165 files. Spot-checked the highest-risk callers (`app/sitemap.ts`, page files under `app/[locale]/*/page.tsx`, all `app/api/**/route.ts`): every caller is either a server component (no `"use client"` header) or an API route handler. **None are client components.** No service-role key leaks into the browser bundle today.

The 2 `'use client'` files that DO import from `lib/supabase` are:
- `components-legacy/notifications/NotificationBell.tsx:5` — imports `createBrowserSupabaseClient`
- `components-legacy/global/TOSUpdateBanner.tsx:4` — imports `createBrowserSupabaseClient`

They only use `createBrowserSupabaseClient`, not the admin client. The Next.js bundler will strip `createAdminSupabaseClient` via tree-shaking IF the module is side-effect-free (no top-level `process.env.SUPABASE_SERVICE_ROLE_KEY` evaluation — and indeed there isn't, the env access is inside the function body). So the env var IDENTIFIER never appears in the client bundle, and Next.js wouldn't inline a non-`NEXT_PUBLIC_` value into the browser bundle anyway. **Not an active leak.** But this is exactly the configuration where one stray import on a redesign sprint flips to live exposure with zero compile error.

---

## NEXT_PUBLIC_ inventory (table)

| Var name | Used in | Is it actually safe to publish? |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | env config / canonical URL helpers | YES — a URL string, intended public |
| `NEXT_PUBLIC_SITE_URL` | env config / canonical URL helpers | YES — duplicate of APP_URL, both public |
| `NEXT_PUBLIC_SUPABASE_URL` | every Supabase client constructor | YES — project URL is public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | every Supabase client constructor | YES — anon key is designed for browser exposure, protected by RLS |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `app/[locale]/checkout/page.tsx`, `vouchers/page.tsx`, `vouchers/buy/page.tsx`, `components-legacy/profile/PaymentMethodsSection.tsx` | YES — publishable keys are intended for browser |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | `components-legacy/ui/AddressAutocomplete.tsx:24` | CONDITIONAL — Google Maps keys are browser-exposed by design but MUST be restricted by HTTP referrer / API in GCP console. If unrestricted, anyone scrapes the key and bills your account. Verify GCP key restrictions. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `components-legacy/MapView.tsx`, `app/[locale]/salon/[slug]/page.tsx:749` | CONDITIONAL — Mapbox public tokens are intended for browser, but MUST be scoped to URL allowlist in Mapbox dashboard. Otherwise anyone reuses the token and burns your free tier. |
| `NEXT_PUBLIC_MAPBOX_STYLE_LIGHT` | Mapbox style URL config | YES — a style URL, public |
| `NEXT_PUBLIC_MAPBOX_STYLE_DARK` | Mapbox style URL config | YES — a style URL, public |
| `NEXT_PUBLIC_POSTHOG_KEY` | analytics init | YES — PostHog project API keys are designed for browser; protected by allowed-origins on the PostHog side |

**Verdict: no `NEXT_PUBLIC_*` var leaks an actual secret.** The Google Maps and Mapbox keys are the only ones with platform-side scoping dependencies (see MEDIUM-1).

---

## Findings

### HIGH-1 — `lib/supabase.ts` co-locates server admin client and browser client in one module
**File:** `lib/supabase.ts:1-91` (entire file)
**Code (quoted):**
```ts
// line 61-76
export function createAdminSupabaseClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    ...
  );
}

// line 84-91
export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return browserClient;
}
```
**Context:** This module is imported by both server contexts (API routes, server components — `createAdminSupabaseClient` and `createServerSupabaseClient`) AND by 2 client components (`components-legacy/notifications/NotificationBell.tsx:5`, `components-legacy/global/TOSUpdateBanner.tsx:4` — `createBrowserSupabaseClient`).
**SEVERITY:** HIGH (architectural risk — one stray import from a client file flips to a CRITICAL exposure with zero compile error).
**Fix recommendation:**
1. Add `import "server-only";` at the top of `lib/supabase.ts`. This makes Next.js throw a build error if any client component ever tries to import from it.
2. Update `components-legacy/notifications/NotificationBell.tsx` and `components-legacy/global/TOSUpdateBanner.tsx` to import `createBrowserSupabaseClient` from `lib/supabase-browser.ts` (already exists, line 7).
3. Optionally delete `createBrowserSupabaseClient` from `lib/supabase.ts` once both client files are migrated, so the only browser export lives in `lib/supabase-browser.ts`.

The `server-only` package is a 0-byte runtime poison pill — its existence in your client bundle triggers a build error. This is the standard Next.js pattern for exactly this leak class.

### HIGH-2 — 35 `process.env.X!` non-null assertions on env vars
**Representative files / lines:**
- `app/[locale]/checkout/page.tsx:20` — `loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)`
- `app/[locale]/vouchers/page.tsx:19`, `vouchers/buy/page.tsx:24` — same pattern
- `app/api/gift-cards/purchase/route.ts:13`, `tips/route.ts:11`, `packages/purchase/route.ts:11`, `bookings/[id]/cancel/route.ts:11`, `bookings/[id]/refund/route.ts:11`, `bookings/[id]/route.ts:91`, `admin/booking-disputes/[id]/action/route.ts:118`, `admin/salons/[id]/freeze/route.ts:63`, `conversations/[id]/price-offer/route.ts:124`, `cron/no-show/route.ts:39`, `cron/pre-charge/route.ts:9`, `cron/pending-timeout/route.ts:67`, `cron/release-payments/route.ts:8` — all `new Stripe(process.env.STRIPE_SECRET_KEY!, ...)`
- `app/api/auth/callback/route.ts:23-24`, `app/api/salons/[slug]/gallery/route.ts:5-6` — Supabase clients
- `lib/supabase.ts:19,20,63,64,87,88`, `lib/supabase-browser.ts:9,10` — every constructor
- `components-legacy/profile/PaymentMethodsSection.tsx:10` — `loadStripe(...!)`
- `scripts/collect-basel-salons.ts:32-34`, `scripts/send-outreach-emails.ts:31-33` — CLI scripts

**Context:** TypeScript `!` tells the compiler "trust me, this isn't `undefined`." When the env var is genuinely missing (forgot to set in Netlify, deploy-without-env, build-time vs runtime mismatch), the runtime passes `undefined` to `loadStripe` / `new Stripe` / `createClient`, producing cryptic errors like `Cannot read properties of undefined (reading 'charAt')` deep inside the vendor SDK. Hard to diagnose, easy to ship.
**SEVERITY:** HIGH — these are silent footguns. None is a secret leak, but missing env at runtime crashes payments / auth flows for users.
**Fix recommendation:** Create `lib/env.ts` with a zod-validated env object loaded at module init. Replace `process.env.X!` with `env.X`. Example:
```ts
// lib/env.ts
import { z } from "zod";
const schema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16),
});
export const env = schema.parse(process.env);
```
Now a missing env crashes loudly at boot with a precise error message instead of producing zombie state in production.

### HIGH-3 — `app/api/partner/leads/route.ts` falls back from service-role to anon key silently
**File:** `app/api/partner/leads/route.ts:13`
**Code (quoted):**
```ts
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
```
**Context:** API route that captures partner leads (signup form). It tries the service-role key first, falls back to the anon key, and if neither is present, returns 200 with `warning: 'mocked'`. The intent ("don't fail during build/audit phase") is reasonable, but the silent anon-key fallback is a footgun: if `SUPABASE_SERVICE_ROLE_KEY` is forgotten on production, every lead insert quietly attempts via anon-key auth and fails RLS — but the route returns 200 to the user. Lead data lost silently.
**SEVERITY:** HIGH (data loss, not leak — but worth fixing in a security audit because the fallback pattern is the kind of "AI-shaped reasonable-looking code" that hides production bugs).
**Fix recommendation:** Require `SUPABASE_SERVICE_ROLE_KEY` explicitly (via the proposed `lib/env.ts`). If missing, return 500 with a clear error and log loudly. Never return 200 for a write that didn't write.

### HIGH-4 — `app/api/salon/retail/purchase/route.ts` builds Stripe client only when key exists, returns silent-success otherwise
**File:** `app/api/salon/retail/purchase/route.ts:10-12`
**Code (quoted):**
```ts
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
```
**Context:** Same anti-pattern as HIGH-3 — graceful degradation that returns success to the caller when the payment provider isn't configured. Worth verifying that callers downstream of this null `stripe` don't return 200 for "purchased successfully" with no actual Stripe charge.
**SEVERITY:** HIGH (potential silent-success on payments — but not a secret-leak issue).
**Fix recommendation:** Throw at module init via `lib/env.ts`. Payment flows should never silently degrade to no-op.

### MEDIUM-1 — `NEXT_PUBLIC_GOOGLE_MAPS_KEY` and `NEXT_PUBLIC_MAPBOX_TOKEN` require platform-side scoping
**Files:** `components-legacy/MapView.tsx:74`, `components-legacy/ui/AddressAutocomplete.tsx:24`, `app/[locale]/salon/[slug]/page.tsx:749`
**Context:** Both are intended browser-exposed keys, but their safety depends on configuration in the vendor dashboard (HTTP referrer allowlist for GCP, URL allowlist for Mapbox). If misconfigured, anyone can scrape the key from the JS bundle and burn your billing.
**SEVERITY:** MEDIUM (not a code bug — a deployment-config dependency to verify).
**Fix recommendation:** Verify in GCP console that the Google Maps key is restricted to `solen.ch`, `*.netlify.app` preview URLs, and `localhost:3000`. Verify in Mapbox that the public token is scoped the same way. Document this in `_rules/SECURITY_RULES.md` so future-Claude knows the keys must stay locked-down platform-side even though they look "exposed."

### MEDIUM-2 — `lib/supabase.ts:53` calls `supabase.auth.getSession()` for server-side auth
**File:** `lib/supabase.ts:53`
**Code (quoted):**
```ts
const { data: { session } } = await supabase.auth.getSession();
```
**Context:** `getSession()` reads the session from cookies WITHOUT verifying the JWT signature against the Supabase auth server. Supabase docs recommend `getUser()` for server-side auth checks because the cookie could be tampered with. The comment in the code says "no network call" is intentional ("can timeout on Vercel Edge"), which is a fair tradeoff for performance — but worth confirming the design intent: are downstream callers using `user` for authorization decisions, or just for displaying name/avatar?
**SEVERITY:** MEDIUM — depends on how `getSessionUser` is consumed. If used for `auth.userId === resource.ownerId` checks, the trust is in the cookie alone, which is fine when paired with RLS (which IS in the codebase) but worth a documented call-out.
**Fix recommendation:** Document in `_rules/SECURITY_RULES.md` that `getSessionUser()` is the fast path and RLS is the source of authorization truth. Add a `getVerifiedUser()` variant that does the network call for high-stakes operations (admin actions, payment flows).

### MEDIUM-3 — `process.env.STRIPE_WEBHOOK_SECRET` has no non-null guard at module init
**File:** `app/api/stripe/webhook/route.ts:19`
**Code (quoted):**
```ts
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
```
**Context:** Unlike `STRIPE_SECRET_KEY` which uses `!` (an over-promise), this one is read raw with no validation. If `STRIPE_WEBHOOK_SECRET` is missing, `stripe.webhooks.constructEvent(rawBody, sig, undefined)` will throw — but the failure mode is: webhooks silently never verify, and a malicious actor can hit the endpoint with arbitrary JSON.
**SEVERITY:** MEDIUM (defense in depth — current code throws, but failure-mode could regress with a "graceful fallback" refactor).
**Fix recommendation:** Move to `lib/env.ts` zod validation so this can never be `undefined` at runtime.

### MEDIUM-4 — Bearer-token cron secret pattern repeats across 18 cron routes
**Files (representative):** `app/api/cron/birthday-messages/route.ts:10`, `welcome-series/route.ts:14`, `no-show/route.ts:8`, plus 15 more (`rebooking-nudge`, `salon-onboarding`, `auto-complete`, `generate-slots`, `late-cancel`, `release-deposits`, `nail-infill-reminders`, `barber-smart-reminders`, `sms-reminders`, `process-deletions`, `pre-charge`, `pending-timeout`, `release-payments`, `reminders`, `review-prompt`)
**Code (quoted):**
```ts
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
```
**Context:** String compare with `!==` is a timing-attack vector, though in practice exploitation against a Vercel/Netlify Edge function is hard. More important: `process.env.CRON_SECRET` is `undefined` if missing, which would let `authHeader === "Bearer undefined"` authenticate. An attacker with a guessed-loose `Authorization: Bearer undefined` would pass.
**SEVERITY:** MEDIUM.
**Fix recommendation:** (a) Validate `CRON_SECRET` exists at boot via `lib/env.ts`. (b) Use `crypto.timingSafeEqual` for the compare. (c) Extract to a `requireCronAuth(req)` helper so the pattern lives in one place.

### MEDIUM-5 — `process.env.X!` on `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in client pages
**Files:** `app/[locale]/checkout/page.tsx:20`, `app/[locale]/vouchers/page.tsx:19`, `app/[locale]/vouchers/buy/page.tsx:24`, `components-legacy/profile/PaymentMethodsSection.tsx:10`
**Code (quoted):**
```ts
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
```
**Context:** Not a secret leak (publishable key is intended for browser), but the `!` means if the env var is missing in a preview deploy, the checkout page renders broken with an obscure Stripe.js error instead of a clear "STRIPE_PUBLISHABLE_KEY not configured" message.
**SEVERITY:** MEDIUM (UX failure mode for payment pages — silent in dev tools).
**Fix recommendation:** Same `lib/env.ts` pattern; surface a clear error in the UI if missing.

### LOW-1 — `process.env.GEMINI_API_KEY` exposed in URL query string
**Files:** `app/api/chat/suggest/route.ts:42`, `app/api/ai/intake-recommendation/route.ts:63`
**Code (quoted):**
```ts
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
```
**Context:** This is how the Gemini v1beta REST API authenticates — the key goes in the URL. Server-side, never reaches the browser, so not a leak. Worth flagging because: (a) URLs are often logged by infrastructure (Netlify request logs, Sentry breadcrumbs) and the key might end up in log storage; (b) the v1beta endpoint isn't the only option — they could use the `x-goog-api-key` header pattern instead.
**SEVERITY:** LOW (server-only; key won't leak to users; but might end up in your own logs).
**Fix recommendation:** Switch to header-based auth: `headers: { "x-goog-api-key": env.GEMINI_API_KEY }`. Confirms Netlify isn't logging full request URLs with secrets in them.

---

## Notes

### Hardcoded literal secret scan — clean
Searched for: `sk_live_`, `sk_test_`, `rk_live_`, `pk_live_`, `pk_test_`, `eyJ` (JWT prefix), `Bearer <literal>`, `BEGIN PRIVATE KEY`, `BEGIN OPENSSH`, `BEGIN PGP`, `service_account`. Zero matches in source tree (excluded paths: `node_modules`, `.next`, `_audits`, `_tasks`, `_rules`, `_docs`, `_specs`, `_plans`, `_visual-qa`, `public/`, `.claude`, `_archive`, `_manual_testing`, `_prompts`, `_roadmaps`).

### Why this passed cleanly
Two design decisions that paid off:
1. Every Supabase / Stripe constructor reads from `process.env.*`, never from a string literal.
2. `lib/supabase-browser.ts` (separate file) exists and is the correct browser-side helper. The fact that 2 client files import from `lib/supabase.ts` instead is a migration-gap, not a designed-leak.

### What's NOT covered by this audit
- `.env.local` / `.env.production` / `.env*` files (per scope — gitignored, not source-controlled).
- Secrets pushed to git history (not audited — `git log -p | grep -E "sk_(live|test)_"` is the follow-up if there's any doubt; cheap to run).
- Edge-function deployment env (`supabase functions secrets list` is the correct check, lives outside the repo).
- Build-time vs runtime env divergence on Netlify (the `lib/env.ts` proposed fix surfaces this automatically — the validation runs in both contexts).

### Recommended remediation order
1. Add `import "server-only";` to top of `lib/supabase.ts` (5-minute fix, prevents the entire leak class going forward). HIGH-1.
2. Migrate `NotificationBell.tsx` and `TOSUpdateBanner.tsx` to import from `lib/supabase-browser.ts`. HIGH-1.
3. Create `lib/env.ts` zod-validated env object. Replace all `process.env.X!` with `env.X`. HIGH-2.
4. Fix `app/api/partner/leads/route.ts` and `app/api/salon/retail/purchase/route.ts` silent-success fallbacks. HIGH-3, HIGH-4.
5. Verify Google Maps + Mapbox key scoping in vendor dashboards. MEDIUM-1.
6. Extract `requireCronAuth(req)` helper with timing-safe compare. MEDIUM-4.
7. Switch Gemini URL-key to header-key. LOW-1.

Steps 1–2 are the highest-leverage: they prevent the entire "service role key in browser bundle" class of failure with one import line and one file migration.
