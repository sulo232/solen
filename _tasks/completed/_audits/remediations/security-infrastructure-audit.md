# Security & Infrastructure Audit Report

**Date**: 2026-03-22
**Scope**: Rate limiting, feature flags, validation, audit logging, auth, Stripe, Sentry, CORS, HMAC

---

## Section A: CRITICAL Issues (Session-Breaking)

| # | Issue | File | Severity | Fix |
|---|---|---|---|---|
| 1 | `getUser()` on Edge runtime — causes session loss (Rule 25) | `app/api/profile/favorites/route.ts:11,43,75` | 🔴 CRITICAL | Replace with `getSession()` |
| 2 | `getUser()` on Edge runtime — referral system broken | `app/api/referral/complete/route.ts:15` | 🔴 CRITICAL | Replace with `getSession()` |
| 3 | `getUser()` on Edge runtime — admin salon approval broken | `app/api/admin/salons/[id]/approve/route.ts:15` | 🔴 CRITICAL | Replace with `getSession()` |

**Root cause**: `getUser()` makes a network call to Supabase that times out on Vercel Edge runtime (<100ms budget). User gets 401 despite valid session cookie → forced logout.

---

## Section B: Infrastructure Issues

| # | Issue | File | Severity | Fix |
|---|---|---|---|---|
| 1 | Sentry completely gutted — server, edge, client configs are stubs/missing | `sentry.server.config.ts`, `sentry.edge.config.ts` | 🟡 HIGH | Reinstall @sentry/nextjs, configure all 3 configs |
| 2 | No `sentry.client.config.ts` exists at all | — | 🟡 HIGH | Create client config |
| 3 | No `withSentryConfig` in next.config | `next.config.*` | 🟡 HIGH | Wrap config with Sentry |
| 4 | `@sentry/nextjs` not in package.json | `package.json` | 🟡 HIGH | `npm install @sentry/nextjs` |

---

## Section C: Security Stack — What's Working ✅

| Component | Status | File | Notes |
|---|---|---|---|
| Rate limiting (Upstash Redis) | ✅ Solid | `lib/ratelimit.ts` | 13 named limiters, graceful Redis fallback, proper 429 response with headers |
| Feature flags / kill switch | ✅ Solid | `lib/feature-flags.ts` | Maintenance mode + per-feature toggles, DB-backed |
| Ban system | ✅ Solid | `lib/feature-flags.ts` | `checkUserBanned()` checks `profiles.banned_at` |
| Zod validation schemas | ✅ Solid | `lib/validations.ts` | 40+ schemas covering all input types, UUID validation, phone regex, max lengths |
| Audit logging | ✅ Solid | `lib/audit.ts` | Non-blocking, captures IP, action types, metadata |
| Supabase server client | ✅ Solid | `lib/supabase.ts` | Correct `getSession()` pattern in helper, cookie error handling |
| Supabase browser client | ✅ Solid | `lib/supabase-browser.ts` | Separate file for client components, no server imports |
| Admin client isolation | ✅ Solid | `lib/supabase.ts` | Service role key only in `createAdminSupabaseClient()`, no cookie persistence |
| Stripe utility | ✅ Solid | `lib/stripe.ts` | Lazy init, env var check, Rappen conversion helper |
| Stripe webhook verification | ✅ Solid | `app/api/stripe/webhook/route.ts` | `constructEvent()` signature check + idempotency via `processed_webhook_events` |
| Stripe webhook idempotency | ✅ Solid | `app/api/stripe/webhook/route.ts:34-38` | Replay attack prevention |
| HMAC-signed loyalty tokens | ✅ Solid | `lib/barber/loyalty-qr.ts` | SHA-256 HMAC with secret, 16-char truncation, verify function |
| CORS headers | ✅ Solid | `middleware.ts:44-72` | Origin whitelist, OPTIONS preflight, Max-Age caching |
| Middleware auth guards | ✅ Solid | `middleware.ts:124-177` | Dashboard role check, admin-only path list, redirect to login |
| Middleware `getSession()` | ✅ Correct | `middleware.ts:121` | Uses safe `getSession()` — NOT `getUser()` |
| Env var safety | ✅ Solid | `middleware.ts:89-96`, `lib/stripe.ts:9` | Graceful fallback when env vars missing |

---

## Section D: Design Quality Notes

| # | Observation | Verdict |
|---|---|---|
| 1 | Redis client uses graceful `null` fallback when env vars missing — won't crash in dev | ✅ Good |
| 2 | `applyRateLimit()` catches Redis errors and allows request through | ✅ Correct (fail-open for availability) |
| 3 | `getClientIp()` reads `x-forwarded-for` first, falls back to `x-real-ip`, then `"unknown"` | ✅ Correct for Vercel |
| 4 | Audit logging uses `try/catch` with empty catch — never blocks main operation | ✅ Correct |
| 5 | `validateBody()` returns structured error with field paths | ✅ Good DX |
| 6 | Stripe webhook processes 6 event types with proper metadata extraction | ✅ Comprehensive |
| 7 | Feature flag system checks maintenance_mode FIRST before specific flags | ✅ Correct priority |

---

## Section E: Sentry Gap Analysis

Sentry was previously installed but removed due to build issues. Current state:

- `sentry.server.config.ts` → placeholder comment only
- `sentry.edge.config.ts` → placeholder comment only
- `sentry.client.config.ts` → does not exist
- `@sentry/nextjs` → not in package.json
- `next.config` → no `withSentryConfig` wrapper

**Impact**: Zero error monitoring in production. Runtime errors, unhandled rejections, and API failures are invisible. This is a significant operational gap but not a security vulnerability.

**Recommendation**: Reinstall Sentry in a dedicated session. Requires:
1. `npm install @sentry/nextjs`
2. Create `sentry.client.config.ts` with DSN
3. Populate server + edge configs
4. Wrap `next.config` with `withSentryConfig`
5. Set `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` env vars in Vercel

---

## Fix Plan (Severity Order)

1. 🔴 **CRITICAL** — Replace `getUser()` → `getSession()` in 2 files (4 locations)
2. 🟡 **HIGH** — Sentry reinstallation (separate session, requires env vars)
