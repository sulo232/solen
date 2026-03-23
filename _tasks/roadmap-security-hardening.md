# 🔒 Solen.ch Security Hardening Roadmap

> **This roadmap has TWO sections:**
> 1. **🤖 CLAUDE CODE PHASES** — Pure code changes. Give this to Claude Code.
> 2. **🧑 MANUAL PHASES** — Require external dashboards, API keys, or human config. We do these together.
>
> Follow CLAUDE.md rules (one commit per sub-phase, `npm run build` before commit, verify Vercel after push).

---

# ⚠️ BREAKAGE RISK ASSESSMENT — READ BEFORE EXECUTING

> **This section tells you which phases could break active features, what exactly will break, and how to prevent it. Claude Code: READ THIS CAREFULLY before starting any phase.**

## Risk Summary

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 (Git cleanup) | 🟢 SAFE | Nothing. Only changes `.gitignore` + untracks files. | No special precautions needed. |
| **Phase 2 (RLS)** | **🔴 HIGH** | **Profile data display, booking confirmations, chat names** | Must update `from("profiles")` → `from("public_profiles")` for OTHER-user queries. See list below. |
| Phase 3 (Headers) | 🟢 SAFE | Nothing — unless `X-Frame-Options` is set to `DENY` instead of `SAMEORIGIN` (would break homepage iframe). | Use `SAMEORIGIN`, not `DENY`. |
| **Phase 4 (Rate limiting)** | **🟡 MEDIUM** | **ALL API routes crash at runtime** if Upstash env vars are missing. Build still passes — only discovered when users hit the API. | Manual Phase A (Upstash setup) MUST be done first. Verify env vars in Vercel before deploying. |
| Phase 5 (Kill switch) | 🟢 SAFE | Nothing. New table + utility, adds checks to routes. | Don't accidentally set `maintenance_mode = true`. |
| **Phase 6 (Zod)** | **🟡 MEDIUM** | **Legitimate requests rejected** if schemas don't match what frontend actually sends. | For each route, `console.log(body)` in dev FIRST to see exact shape, THEN write the schema to match. |
| Phase 7 (CORS) | 🟡 LOW | Middleware handles every request — bugs here = entire site down. | Test locally with `npm run dev` before committing. |
| Phase 8 (GDPR) | 🟢 SAFE | Nothing. New endpoint + migration. No existing code changes. | Only risk: FK constraint name mismatch in migration (see BE CAREFUL). |
| Phase 9 (Audit) | 🟢 SAFE | Nothing. Adds logging to existing routes. | Wrap `logAuditEvent()` in try/catch so logging failures don't block. |
| Phase 10 (CLAUDE.md) | 🟢 SAFE | Nothing. Documentation only. | Only run after Phases 1-9 are deployed. |

## Phase 2 Deep Dive — Exact Files At Risk

After analyzing the codebase, I found **34 queries** to `from("profiles")` across the app. Here's the breakdown:

### ✅ SAFE (won't break) — 28 queries

These use either `createAdminSupabaseClient()` (bypasses RLS entirely) or query `eq("id", user.id)` (own profile = allowed by new RLS). No action needed:

- `app/api/profile/route.ts` — own profile GET/PATCH ✅
- `app/api/admin/*` (13 files) — all use `admin.from("profiles")` which bypasses RLS ✅
- `app/api/stripe/connect/create-account/route.ts` — uses `admin` client ✅
- `app/api/stripe/webhook/route.ts` — uses `admin` client ✅
- `app/api/analytics/*` — uses `admin` client ✅
- `app/api/admin/users/route.ts` — uses `admin` client ✅
- `app/api/bookings/[id]/cancel/route.ts` — uses `admin` client ✅
- `app/api/bookings/[id]/confirm/route.ts` — uses `admin` client ✅
- `lib/automod.ts` — uses `admin` client ✅

### ⚠️ AT RISK (will break) — 6 queries

These use `createServerSupabaseClient()` (respects RLS) and query OTHER users' data. **These MUST be changed to `from("public_profiles")` or switched to `createAdminSupabaseClient()`**:

| File | Line | What it queries | Fix |
|---|---|---|---|
| `app/api/bookings/route.ts` | ~57 | Gets other user's profile for booking confirmation email | Switch to `admin.from("profiles")` — needs `locale` field not in `public_profiles` |
| `app/api/bookings/[id]/reschedule/route.ts` | ~65 | Gets other user's profile for reschedule notification | Switch to `admin.from("profiles")` — needs `locale` field |
| `app/api/conversations/[id]/messages/route.ts` | ~93 | Gets salon owner's `notification_email`, `locale` | Already uses `admin` ✅ (double-check at execution time) |
| `app/api/bookings/recurring/route.ts` | ~59 | Gets own user's `is_first_visit_default` | Uses `supabase` client + `eq("id", user.id)` → ✅ own profile, safe |
| `app/api/availability/manage/[slot_id]/route.ts` | ~33 | Gets booked user's `id` only | Uses `supabase` client but only selects `id` — needs `admin` or `public_profiles` |
| `app/api/salons/[slug]/route.ts` | ~66 | Gets own profile role | Uses `admin` client ✅ safe |

**Net result: Only 2-3 queries need fixing in Phase 2.** The roadmap's Phase 2 already tells Claude Code to grep and fix these, but now the exact files are listed above.

### 🏠 Monolith (`index.html`) — NOT AT RISK

Searched `index.html` for `from("profiles")` — **zero results**. The monolith doesn't query the `profiles` table directly. ✅

### 📦 Components (`components/`) — NOT AT RISK

Searched all `.ts` and `.tsx` files in `components/` — **zero results**. No components query `profiles` directly. ✅

---

# PART 1: 🤖 CLAUDE CODE PHASES

> Claude Code executes these. No external accounts, API keys, or dashboard access needed.

---

## Phase 1 — Credential Cleanup & Git Hygiene

> **Priority: 🔴 CRITICAL — Do first, before everything else**

### 1.1 Fix `.gitignore` — stop tracking secrets

The `.env` file (containing live Supabase URL + anon key) is **tracked in git**. The `.gitignore` only blocks `.env.*.local` — not bare `.env`.

#### [MODIFY] `.gitignore`

In the `# Environment` section, change:

```diff
 # Environment
 .env
+.env.*
 .env.*.local
 .env.development
```

This ensures `.env`, `.env.sentry-build-plugin`, `.env.production`, `.env.anything` are ALL ignored.

### 1.2 Untrack the committed `.env` files

```bash
git rm --cached .env
git rm --cached .env.sentry-build-plugin
```

This removes them from git tracking WITHOUT deleting the local files.

### 1.3 Verify no other secrets in git history

```bash
git log --all --oneline -- .env .env.sentry-build-plugin .env.local
```

If any commits show up, add a note in `_tasks/security-manual-steps.md`:
```
## Exposed Credentials in Git History
- .env was committed in commit <hash> — contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (anon key is public by design, low risk)
- .env.sentry-build-plugin was committed in commit <hash> — contains SENTRY_AUTH_TOKEN (MUST be rotated manually)
```

### 1.4 Commit

```bash
git add .gitignore
git commit -m "phase 1: remove tracked .env files from git, fix .gitignore to block all .env variants"
git push origin main
```

**Verify**: `git status` should NOT show `.env` or `.env.sentry-build-plugin` as tracked.

> ⚠️ **BE CAREFUL**:
> - `git rm --cached` only removes from tracking, NOT from your disk. The files stay locally. If you accidentally use `git rm` (without `--cached`), the files get DELETED from disk and you lose your env vars.
> - Do NOT run `git filter-branch` or `BFG` to rewrite git history unless the user explicitly asks — it can break shared branches and force-pushes are dangerous.
> - After this phase, if the `.env` files were committed in past commits they are still in git history. This is acceptable for now because the repo is private and the Supabase anon key is designed to be public. The Sentry token is the only real concern and gets rotated in Manual Phase B.

---

## Phase 2 — Supabase RLS Hardening

> **Priority: 🔴 CRITICAL — This is the single biggest vulnerability**
> 
> **What's wrong**: The `salon_directory` table (48 rows with phone numbers, emails, Google Place IDs, claim verification codes) has RLS **completely disabled**. Anyone with the Supabase anon key can DELETE all rows, INSERT fake ones, or UPDATE claim codes to hijack salon claims. The `profiles` table has `OR true` in its SELECT policy, exposing ALL user data (hair type, gender, age, bio) to everyone.

### 2.1 Create RLS hardening migration

#### [NEW] `supabase/migrations/018_rls_hardening.sql`

```sql
-- Migration 018: Security hardening — RLS fixes
-- Date: 2026-03-17
-- Context: Security audit found salon_directory has NO RLS, profiles leaks all data
-- ============================================================================

-- ============================================
-- 1. SALON_DIRECTORY — Enable RLS (currently DISABLED)
-- ============================================
ALTER TABLE public.salon_directory ENABLE ROW LEVEL SECURITY;

-- Public can READ directory listings (this is a public directory)
CREATE POLICY "salon_directory_select_public" ON public.salon_directory
  FOR SELECT USING (true);

-- Only admins can INSERT/UPDATE/DELETE directory data
CREATE POLICY "salon_directory_modify_admin" ON public.salon_directory
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "salon_directory_update_admin" ON public.salon_directory
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "salon_directory_delete_admin" ON public.salon_directory
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ============================================
-- 2. PROFILES — Fix overly permissive SELECT
-- ============================================

-- Drop the broken policy (currently: FOR SELECT USING (auth.uid() = id OR true) — "OR true" means EVERYONE sees EVERYTHING)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

-- New policy: users can only see their OWN full profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Public view for safe profile display (only display_name + avatar_url)
-- Used by: salon cards, review author display, chat participant names
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, display_name, avatar_url
  FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ============================================
-- 3. REVOKE DANGEROUS ANON PRIVILEGES
-- ============================================

-- Anon should NEVER be able to DELETE or TRUNCATE profiles
REVOKE DELETE ON public.profiles FROM anon;
REVOKE TRUNCATE ON public.profiles FROM anon;

-- Anon should NEVER be able to write to salon_directory
REVOKE INSERT ON public.salon_directory FROM anon;
REVOKE UPDATE ON public.salon_directory FROM anon;
REVOKE DELETE ON public.salon_directory FROM anon;
REVOKE TRUNCATE ON public.salon_directory FROM anon;
```

### 2.2 Update frontend code that reads other users' profiles

After this migration, any code that queries `profiles` to show OTHER users' names/avatars will break. These need to query `public_profiles` instead.

**Search for these patterns and update them**:

```bash
grep -rn "from(\"profiles\")" app/ components/ lib/ --include="*.ts" --include="*.tsx"
```

For each result:
- If the query is for the **current user's own profile** → keep using `profiles` (RLS allows own data)
- If the query is to **display another user's name/avatar** (e.g., in salon cards, review lists, chat) → change to `from("public_profiles")`

**Example fix**:
```typescript
// ❌ BEFORE — Breaks after RLS fix (can't see other users' profiles)
const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", otherUserId);

// ✅ AFTER — Uses the safe public view
const { data } = await supabase.from("public_profiles").select("display_name, avatar_url").eq("id", otherUserId);
```

### 2.3 Apply and verify

```bash
# Apply migration
npx supabase db push

# Verify: test as anon role in Supabase SQL Editor
# These should WORK:
#   SELECT * FROM salon_directory LIMIT 1;
#   SELECT * FROM public_profiles LIMIT 1;
# These should FAIL:
#   DELETE FROM salon_directory WHERE id = '...';
#   INSERT INTO salon_directory (name) VALUES ('hacked');
#   SELECT * FROM profiles;  (as anon — should return 0 rows)
```

### 2.4 Commit

```bash
npm run build
git add supabase/migrations/018_rls_hardening.sql app/ components/ lib/
git commit -m "phase 2: harden RLS — enable on salon_directory, fix profile data leak, revoke anon write access"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - **This phase WILL break things if you don't update frontend queries.** After locking down `profiles`, any query like `supabase.from("profiles").select("display_name").eq("id", someOtherUserId)` will return EMPTY for non-own users. You MUST grep for all `from("profiles")` calls and decide which need `from("public_profiles")` instead.
> - **The monolith (`index.html`) may also query profiles.** Search inside `index.html` for any Supabase queries referencing `profiles` — those have to be updated too or they'll silently return no data.
> - **Do NOT drop the `profiles` table or rename it** — only the POLICY changes. The table itself stays the same.
> - **Test with a non-admin, non-owner user** after applying. Log in as a regular customer and make sure you can still see salon names, review authors, and chat participant names.
> - **If `npx supabase db push` fails**, it might be because the migration conflicts with existing policies. Check the error message — you may need to `DROP POLICY IF EXISTS` on additional policies not accounted for.

---

## Phase 3 — Security Headers

> **Priority: 🟡 HIGH**
> 
> **What's wrong**: `vercel.json` is just `{ "framework": "nextjs" }`. No security headers at all. The site can be embedded in malicious iframes (clickjacking), has no HSTS (users could reach HTTP version), and API responses can be cached by browsers.

### 3.1 Update `vercel.json`

#### [MODIFY] `vercel.json`

Replace the ENTIRE file with:

```json
{
  "framework": "nextjs",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-DNS-Prefetch-Control", "value": "on" },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(self), payment=(self)"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    },
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate" }
      ]
    }
  ]
}
```

**Why each header matters**:
| Header | Prevents |
|---|---|
| `X-Content-Type-Options: nosniff` | Browser guessing file types → prevents serving JS as HTML attacks |
| `X-Frame-Options: SAMEORIGIN` | External sites embedding solen.ch in an iframe (clickjacking). `SAMEORIGIN` still allows your own monolith iframe |
| `Referrer-Policy` | Leaking full page URLs (including user IDs, session tokens) to third-party sites |
| `Permissions-Policy` | Malicious scripts accessing camera/microphone. `geolocation=(self)` allows YOUR map, blocks third-party |
| `Strict-Transport-Security` | Users accessing HTTP version. Forces HTTPS for 2 years |
| API `Cache-Control: no-store` | Browser caching API responses with sensitive user data |

### 3.2 Commit & verify

```bash
npm run build
git add vercel.json
git commit -m "phase 3: add security headers — HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy"
git push origin main

# After deploy (wait 30s):
curl -sI https://www.solen.ch | grep -iE "x-frame|x-content|strict-transport|referrer|permissions"
# Must show ALL 5 headers
```

> ⚠️ **BE CAREFUL**:
> - `X-Frame-Options: SAMEORIGIN` is intentional, NOT `DENY`. The monolith (`public/home.html`) is served via an iframe in `app/[locale]/page.tsx`. If you set `DENY`, the homepage will show a blank white page because the iframe gets blocked.
> - `Strict-Transport-Security` with `preload` is permanent and hard to undo. Once Chrome adds your domain to the preload list, ALL browsers will force HTTPS forever. This is fine since solen.ch should always be HTTPS, but be aware.
> - Do NOT add a `Content-Security-Policy` header in this phase. The monolith has inline scripts and inline styles — a strict CSP would break the entire SPA. CSP can be added later when the Next.js migration is complete.
> - The `vercel.json` headers merge with any headers set by Next.js itself. If you see duplicate headers, it's usually fine — the Vercel ones take priority.

---

## Phase 4 — Rate Limiting

> **Priority: 🟡 HIGH**
> 
> **What's wrong**: ALL 41 API routes have zero rate limiting. An attacker can:
> - Spam `POST /api/bookings` to exhaust all available slots
> - Spam `POST /api/stripe/create-payment-intent` to create thousands of payment intents (costing you Stripe fees)
> - Spam `POST /api/conversations/[id]/messages` to flood DMs
> - Brute-force `POST /api/auth/login`
> 
> **Dependency**: Requires Upstash Redis env vars set in Vercel (done in Manual Phase A).

### 4.1 Install Upstash

```bash
npm install @upstash/ratelimit @upstash/redis
```

### 4.2 Create rate limiter utility

#### [NEW] `lib/ratelimit.ts`

Create this file with the following rate limiters:

| Limiter | Window | Use Case |
|---|---|---|
| `generalLimiter` | 30 req / 1 min / IP | Public GET routes (search, directory, salons) |
| `bookingLimiter` | 5 req / 1 hour / user | Booking creation |
| `messageLimiter` | 10 req / 1 min / user | Sending DMs |
| `paymentLimiter` | 3 req / 1 hour / user | Creating payment intents |
| `adminLimiter` | 20 req / 1 min / user | Admin panel actions |
| `authLimiter` | 5 req / 1 min / IP | Login attempts |

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const generalLimiter = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(30, "1 m"), analytics: true, prefix: "rl:general",
});

export const bookingLimiter = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(5, "1 h"), analytics: true, prefix: "rl:booking",
});

export const messageLimiter = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(10, "1 m"), analytics: true, prefix: "rl:message",
});

export const paymentLimiter = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(3, "1 h"), analytics: true, prefix: "rl:payment",
});

export const adminLimiter = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(20, "1 m"), analytics: true, prefix: "rl:admin",
});

export const authLimiter = new Ratelimit({
  redis, limiter: Ratelimit.slidingWindow(5, "1 m"), analytics: true, prefix: "rl:auth",
});

type RateLimitIdentifier = { ip: string } | { userId: string };

export async function applyRateLimit(
  limiter: Ratelimit,
  identifier: RateLimitIdentifier
): Promise<NextResponse | null> {
  const key = "ip" in identifier ? identifier.ip : identifier.userId;
  const { success, limit, reset, remaining } = await limiter.limit(key);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }
  return null;
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}
```

### 4.3 Apply rate limiting to these exact routes

Add rate limit check as the **first operation** in each handler (before auth check for IP-based, after auth check for user-based):

| File | Method | Limiter | Identifier | Where to add |
|---|---|---|---|---|
| `app/api/bookings/route.ts` | POST | `bookingLimiter` | `{ userId: user.id }` | After auth check |
| `app/api/conversations/[id]/messages/route.ts` | POST | `messageLimiter` | `{ userId: user.id }` | After auth check |
| `app/api/stripe/create-payment-intent/route.ts` | POST | `paymentLimiter` | `{ userId: user.id }` | After auth check |
| `app/api/reviews/route.ts` | POST | `generalLimiter` | `{ userId: user.id }` | After auth check |
| `app/api/directory/route.ts` | GET | `generalLimiter` | `{ ip: getClientIp(req) }` | First line (public route) |
| `app/api/salons/search/route.ts` | GET | `generalLimiter` | `{ ip: getClientIp(req) }` | First line (public route) |
| `app/api/salons/route.ts` | GET | `generalLimiter` | `{ ip: getClientIp(req) }` | First line (public route) |
| `app/api/admin/salons/route.ts` | GET | `adminLimiter` | `{ userId: user.id }` | After auth check |
| `app/api/admin/salons/[id]/approve/route.ts` | POST | `adminLimiter` | `{ userId: user.id }` | After auth check |
| `app/api/admin/salons/[id]/reject/route.ts` | POST | `adminLimiter` | `{ userId: user.id }` | After auth check |
| `app/api/auth/login/route.ts` | POST | `authLimiter` | `{ ip: getClientIp(req) }` | First line |

**DO**:
```typescript
// ✅ Add exactly this pattern to each route
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";

// Inside POST handler, AFTER auth:
const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
if (rateLimited) return rateLimited;
```

**DON'T**:
```typescript
// ❌ Don't add rate limiting ONLY in middleware.ts — it needs to be per-route with different limits
// ❌ Don't create your own rate limiting logic — use the Upstash library
// ❌ Don't skip the rate limit response headers (429 must include Retry-After)
```

### 4.4 Update `.env.example`

Add to the end of `.env.example`:

```
# --- Rate Limiting — Upstash Redis ---
# Get from: console.upstash.com → Redis → Create Database (choose EU-West for latency)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token-here
```

### 4.5 Commit

```bash
npm run build
git add lib/ratelimit.ts app/api/ .env.example package.json package-lock.json
git commit -m "phase 4: add Upstash rate limiting to 11 critical API routes"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - **If `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` are not set**, every API route with rate limiting will crash with a runtime error. The `Redis()` constructor will throw. **This phase MUST NOT be deployed until Manual Phase A is done** (Upstash account created, env vars set in Vercel).
> - **`npm run build` will pass even without the env vars** (they're only checked at runtime, not build time). The crash only happens when someone actually hits an API route in production. So build passing does NOT mean it works.
> - **For public (unauthenticated) GET routes**, the rate limit must be the FIRST line of the handler — before any auth check. For authenticated POST routes, it goes AFTER auth (because you need `user.id` as the identifier).
> - **Don't rate-limit the Stripe webhook** (`app/api/stripe/webhook/route.ts`). Stripe sends webhook events from their own servers — rate limiting those would block legitimate payment events. The webhook already validates signatures, which is its security layer.
> - **If you see `fetch failed` errors after deploying**, it likely means Upstash env vars are missing or wrong. Check Vercel logs, not just the build output.

---

## Phase 5 — Kill Switch & Feature Flags

> **Priority: 🟡 HIGH**
> 
> **What this gives you**: A `feature_flags` table in Supabase where you can instantly disable bookings, payments, messaging, reviews, or the entire site — without deploying code. Plus per-user banning via `banned_at` on profiles.

### 5.1 Create migration

#### [NEW] `supabase/migrations/019_feature_flags.sql`

```sql
-- Migration 019: Feature flags + kill switch + user banning
-- ============================================================================

CREATE TABLE public.feature_flags (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('bookings', true, 'Allow new bookings to be created'),
  ('payments', true, 'Allow Stripe payment intents'),
  ('messaging', true, 'Allow new DM messages'),
  ('reviews', true, 'Allow new reviews'),
  ('registration', true, 'Allow new salon registrations'),
  ('last_minute', true, 'Show Last Minute offers'),
  ('maintenance_mode', false, 'Global kill switch — blocks ALL write operations');

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flags_select_public" ON public.feature_flags
  FOR SELECT USING (true);

CREATE POLICY "feature_flags_modify_admin" ON public.feature_flags
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- User banning
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banned_at timestamptz,
  ADD COLUMN IF NOT EXISTS ban_reason text;

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### 5.2 Create feature flag utility

#### [NEW] `lib/feature-flags.ts`

Two functions:
- `checkFeatureEnabled(key)` — returns `503 Service Unavailable` if feature is off or maintenance mode is on. Returns `null` if enabled (proceed).
- `checkUserBanned(userId)` — returns `403 Forbidden` if user has `banned_at` set. Returns `null` if not banned (proceed).

```typescript
import { createAdminSupabaseClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

type FeatureKey = "bookings" | "payments" | "messaging" | "reviews" | "registration" | "last_minute" | "maintenance_mode";

export async function checkFeatureEnabled(featureKey: FeatureKey): Promise<NextResponse | null> {
  const admin = createAdminSupabaseClient();

  // Always check maintenance mode first
  const { data: maintenance } = await admin
    .from("feature_flags").select("enabled").eq("key", "maintenance_mode").single();
  if (maintenance?.enabled) {
    return NextResponse.json(
      { error: "solen.ch is currently under maintenance. Please try again shortly.", code: "MAINTENANCE_MODE" },
      { status: 503 }
    );
  }

  const { data: flag } = await admin
    .from("feature_flags").select("enabled").eq("key", featureKey).single();
  if (flag && !flag.enabled) {
    return NextResponse.json(
      { error: "This feature is temporarily disabled.", code: "FEATURE_DISABLED" },
      { status: 503 }
    );
  }

  return null; // feature is enabled, proceed
}

export async function checkUserBanned(userId: string): Promise<NextResponse | null> {
  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("profiles").select("banned_at, ban_reason").eq("id", userId).single();
  if (profile?.banned_at) {
    return NextResponse.json(
      { error: "Your account has been suspended.", code: "USER_BANNED", reason: profile.ban_reason ?? undefined },
      { status: 403 }
    );
  }
  return null; // not banned, proceed
}
```

### 5.3 Wire into API routes

Add feature flag check as the FIRST thing in each route (before auth, before rate limit):

| Route | Feature Key |
|---|---|
| `app/api/bookings/route.ts` (POST) | `"bookings"` |
| `app/api/stripe/create-payment-intent/route.ts` (POST) | `"payments"` |
| `app/api/conversations/[id]/messages/route.ts` (POST) | `"messaging"` |
| `app/api/reviews/route.ts` (POST) | `"reviews"` |
| `app/api/salons/route.ts` (POST — registration) | `"registration"` |
| `app/api/salons/last-minute/route.ts` (GET) | `"last_minute"` |

Add ban check AFTER auth, BEFORE rate limit:

```typescript
// After auth:
const banned = await checkUserBanned(user.id);
if (banned) return banned;
```

### 5.4 Create admin toggle API

#### [NEW] `app/api/admin/feature-flags/route.ts`

- `GET` — list all flags (admin only)
- `PATCH` — toggle a flag: `{ "key": "bookings", "enabled": false }` (admin only)

Both handlers must check `profile.role === "admin"` from the database.

### 5.5 Commit

```bash
npx supabase db push
npm run build
git add supabase/migrations/019_feature_flags.sql lib/feature-flags.ts app/api/admin/feature-flags/ app/api/
git commit -m "phase 5: kill switch via feature_flags table + user banning + admin toggle API"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - **`maintenance_mode` starts as `false`** in the migration. DO NOT set it to `true` accidentally — it would block ALL write operations across the entire app.
> - **The feature flag check makes a Supabase query on EVERY request.** This adds ~50ms latency per API call. This is acceptable for now. If performance becomes an issue later, cache flags in memory or Redis with a 60-second TTL.
> - **The `checkFeatureEnabled` function uses `createAdminSupabaseClient()`** (service role key) because feature_flags need to be readable even if the user's auth token is expired. This is intentional and correct.
> - **DO NOT add feature flag checks to the Stripe webhook route.** Stripe doesn't care about your flags — if you block the webhook, you'll lose payment events permanently.
> - **The admin toggle API (`PATCH /api/admin/feature-flags`) needs rate limiting too** — add `adminLimiter` to it. Even admins should be rate-limited to prevent accidental rapid toggling.
> - **When wiring ban check into routes**: the ban check goes AFTER auth (because you need `user.id`) but BEFORE rate limiting and business logic.

---

## Phase 6 — Input Validation with Zod

> **Priority: 🟡 MEDIUM**
> 
> **What's wrong**: API routes accept `req.json()` and pass it directly to Supabase. No type checking, no length limits, no unexpected field rejection. The DB has CHECK constraints as a safety net, but the error messages from Postgres are ugly (`violates check constraint "reviews_rating_check"`).

### 6.1 Install zod

```bash
npm install zod
```

### 6.2 Create validation schemas

#### [NEW] `lib/validations.ts`

Create zod schemas for EVERY request body in the app:

| Schema | Used by | Key validations |
|---|---|---|
| `createBookingSchema` | `POST /api/bookings` | `slot_id: uuid`, `service_id: uuid` |
| `createReviewSchema` | `POST /api/reviews` | `rating: 1-5`, `comment: max 500 chars` |
| `createMessageSchema` | `POST /api/conversations/[id]/messages` | `content: 1-2000 chars`, `message_type: enum` |
| `updateProfileSchema` | `PATCH /api/profile` | `bio: max 500`, `hair_type: enum`, `locale: de|en` |
| `createConversationSchema` | `POST /api/conversations` | `salon_id: uuid` |
| `createPaymentIntentSchema` | `POST /api/stripe/create-payment-intent` | `estimated_price: positive number`, `deposit_amount: positive number` |
| `directorySearchSchema` | `GET /api/directory` | `search: max 100 chars`, `page: positive int`, `limit: 1-50` |

Also create a `validateBody()` helper that returns `{ data, error }`.

**DO**:
```typescript
// ✅ Validate before using data
const body = await req.json();
const { data, error } = validateBody(createBookingSchema, body);
if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });
const { slot_id, service_id } = data; // fully typed
```

**DON'T**:
```typescript
// ❌ Don't destructure req.json() directly
const { slot_id, service_id } = await req.json(); // no validation, no type safety
```

### 6.3 Apply to all routes listed in 6.2

### 6.4 Commit

```bash
npm run build
git add lib/validations.ts app/api/ package.json package-lock.json
git commit -m "phase 6: add zod input validation to all POST/PATCH API routes"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - **Zod validation is STRICT by default** — it will reject any fields not defined in the schema. If the frontend sends extra fields (e.g., `timestamp`, `__metadata`), they'll be stripped or cause errors. Use `.passthrough()` on schemas if you want to allow extra fields, but generally strict is better.
> - **For GET routes** (like directory search), validate `searchParams`, not `req.json()`. Use `z.coerce.number()` for query params because they arrive as strings.
> - **Don't add validation to the Stripe webhook route.** Stripe sends its own event format — you validate it via `stripe.webhooks.constructEvent()`, not zod.
> - **The `reviews/route.ts` already has some manual validation** (rating check, booking_id check). Replace those manual checks with the zod schema — don't duplicate validation logic.
> - **If a zod schema rejects a field the frontend relies on**, the API returns `400 VALIDATION_ERROR`. Check that the frontend handles `400` responses gracefully (shows an error toast, doesn't crash).
> - **For `directorySearchSchema`**: the `search` param is used in `.ilike()` which is a PostgreSQL pattern match. Zod's `.max(100)` prevents absurdly long search strings, but the Supabase client auto-parameterizes the value, so SQL injection is not a risk here.

---

## Phase 7 — CORS Restriction + Review Policies

> **Priority: 🟢 MEDIUM**

### 7.1 Add CORS handling to middleware

#### [MODIFY] `middleware.ts`

Currently, API routes skip all middleware processing. Change this so they get CORS headers:

```typescript
if (pathname.startsWith("/api")) {
  const response = NextResponse.next();
  const origin = request.headers.get("origin") ?? "";
  const allowedOrigins = [
    "https://solen.ch",
    "https://www.solen.ch",
    process.env.NODE_ENV === "development" ? "http://localhost:3000" : "",
  ].filter(Boolean);

  if (allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Max-Age", "86400");
  }
  return response;
}
```

**DO**: Only allow `solen.ch`, `www.solen.ch`, and `localhost:3000` (dev)
**DON'T**: Don't add `Access-Control-Allow-Origin: *` — that defeats the purpose

### 7.2 Add review update/delete RLS policies

#### [NEW] `supabase/migrations/020_review_policies.sql`

```sql
-- Allow users to edit their review within 48 hours
CREATE POLICY "reviews_update_own_48h" ON public.reviews
  FOR UPDATE USING (
    auth.uid() = user_id AND created_at > now() - interval '48 hours'
  );

-- Allow users to delete their own reviews
CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Allow admins to delete any review (moderation)
CREATE POLICY "reviews_delete_admin" ON public.reviews
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
```

### 7.3 Commit

```bash
npx supabase db push
npm run build
git add supabase/migrations/020_review_policies.sql middleware.ts
git commit -m "phase 7: CORS restriction to solen.ch only + review update/delete policies"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - **The CORS change modifies `middleware.ts` which handles EVERY request.** If you introduce a bug here, the entire site goes down. Test locally with `npm run dev` first.
> - **The monolith (`index.html`) makes API calls from the same origin**, so CORS won't affect it. But if anyone accesses the API from a different origin (e.g., a mobile app in the future), they'll be blocked. This is intentional for now.
> - **Don't forget to handle `OPTIONS` (preflight) requests.** Browsers send `OPTIONS` before `POST`/`PATCH` with custom headers. If middleware doesn't respond to `OPTIONS` with CORS headers, the actual request will never fire. Add an `OPTIONS` handler or let the CORS logic handle it.
> - **Review 48-hour edit window** (`reviews_update_own_48h`): this is based on `created_at`, not `updated_at`. So a user gets 48 hours from when they FIRST posted the review, regardless of edits. Each edit does NOT reset the window.
> - **Both `reviews_delete_own` AND `reviews_delete_admin` exist.** Postgres evaluates policies with OR logic — if EITHER matches, the action is allowed. So admins can delete any review, users can delete their own.

---

## Phase 8 — GDPR / nDSG Compliance

> **Priority: 🟢 MEDIUM — Required before public launch in Switzerland**
> 
> Swiss New Data Protection Act (nDSG) requires: right to deletion, data portability, and transparent data handling.

### 8.1 Migration for review anonymization

#### [NEW] `supabase/migrations/021_gdpr_support.sql`

```sql
-- Allow reviews to persist after user deletion (anonymized, not deleted)
ALTER TABLE public.reviews ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Deletion request log (for compliance auditing)
CREATE TABLE public.data_deletion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  tables_cleared text[] DEFAULT '{}'
);

ALTER TABLE public.data_deletion_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deletion_log_admin_only" ON public.data_deletion_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
```

### 8.2 Account deletion endpoint

#### [NEW] `app/api/profile/delete/route.ts`

`DELETE /api/profile/delete` — deletes ALL user data:
1. Cancel active bookings (set status = "cancelled", reason = "Account deleted")
2. Delete user preferences
3. Delete conversations (cascade deletes messages)
4. Anonymize reviews (set user_id = NULL, keeps review for salon)
5. Delete profile (cascade deletes recurring rules)
6. Delete auth user via `admin.auth.admin.deleteUser()`
7. Log deletion in `data_deletion_log`

**DO**: Anonymize reviews (keep content, remove user link — preserves salon ratings)
**DON'T**: Delete reviews entirely (breaks salon rating averages)

### 8.3 Commit

```bash
npx supabase db push
npm run build
git add supabase/migrations/021_gdpr_support.sql app/api/profile/delete/
git commit -m "phase 8: GDPR account deletion + review anonymization + deletion audit log"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - **This migration ALTERS a foreign key constraint.** It drops `reviews_user_id_fkey` and recreates it with `ON DELETE SET NULL` instead of `ON DELETE CASCADE`. If the drop fails because the constraint name doesn't match exactly, the migration will error. Check the actual constraint name in the database first: `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'reviews' AND constraint_type = 'FOREIGN KEY';`
> - **The deletion endpoint uses `createAdminSupabaseClient()`** (bypasses RLS) because it needs to delete data across multiple tables that the user might not have RLS access to (e.g., conversations where they're the salon owner's side).
> - **DO NOT add a DELETE button to the frontend in this phase.** Just create the API endpoint. The frontend UI for "Delete My Account" should be its own feature task with proper confirmation dialogs, countdown timers, etc.
> - **After deletion, the user's auth session becomes invalid.** The frontend should redirect to the homepage and clear any local state/cookies. But since this phase is API-only, the frontend handling is a future task.
> - **Salon owners with active bookings**: what happens if a salon owner deletes their account? Currently, the `salons` table has `owner_id` with `ON DELETE CASCADE`, so the salon AND all its bookings/services/slots get deleted too. This might need a separate "transfer ownership" or "deactivate salon" flow before allowing deletion. For now, add a check: if the user owns any salon with active bookings, return `400` and tell them to cancel or transfer first.
> - **Log the deletion BEFORE deleting the auth user.** If you delete the auth user first, you lose the email address to log.

---

## Phase 9 — Audit Logging

> **Priority: 🟢 LOW — Polish before scaling**

### 9.1 Create audit log table

#### [NEW] `supabase/migrations/022_audit_log.sql`

```sql
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_log_actor ON public.audit_log (actor_id);
CREATE INDEX idx_audit_log_action ON public.audit_log (action);
CREATE INDEX idx_audit_log_created ON public.audit_log (created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_admin_only" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "audit_log_insert_auth" ON public.audit_log
  FOR INSERT WITH CHECK (auth.uid() = actor_id);
```

### 9.2 Create audit utility

#### [NEW] `lib/audit.ts`

```typescript
import { createAdminSupabaseClient } from "@/lib/supabase";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ratelimit";

type AuditAction =
  | "salon.approve" | "salon.reject" | "salon.freeze"
  | "user.ban" | "user.unban"
  | "feature_flag.toggle"
  | "account.delete"
  | "review.delete"
  | "payment.refund";

export async function logAuditEvent(
  req: NextRequest, actorId: string, action: AuditAction,
  targetType: string, targetId?: string, metadata?: Record<string, unknown>
) {
  const admin = createAdminSupabaseClient();
  await admin.from("audit_log").insert({
    actor_id: actorId, action, target_type: targetType,
    target_id: targetId ?? null, metadata: metadata ?? {},
    ip_address: getClientIp(req),
  });
}
```

### 9.3 Wire into admin routes

Add `logAuditEvent()` to:
- `app/api/admin/salons/[id]/approve/route.ts` → `salon.approve`
- `app/api/admin/salons/[id]/reject/route.ts` → `salon.reject`
- `app/api/admin/feature-flags/route.ts` PATCH → `feature_flag.toggle`
- `app/api/profile/delete/route.ts` → `account.delete`

### 9.4 Commit

```bash
npx supabase db push
npm run build
git add supabase/migrations/022_audit_log.sql lib/audit.ts app/api/admin/ app/api/profile/delete/
git commit -m "phase 9: audit logging for admin actions"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - **Audit logging should NEVER block the main operation.** If `logAuditEvent()` fails (e.g., DB error), the admin action should still succeed. Wrap audit calls in a try/catch or use `.catch(() => {})` — don't let logging failures break actual functionality.
> - **The `getClientIp` function** is imported from `lib/ratelimit.ts`. If Phase 4 hasn't been deployed yet, this import will fail. Make sure Phase 4 is done first, or extract `getClientIp` into its own utility file.
> - **Don't log sensitive data in `metadata`.** For example, don't log the user's email or password reset tokens. Log IDs and action types only.
> - **The audit log grows forever.** Add a cleanup cron job or retention policy later (e.g., delete entries older than 1 year). But don't worry about this now at 5 users.
> - **IP addresses in audit logs may be privacy-sensitive under nDSG/GDPR.** This is acceptable for security audit purposes (legitimate interest), but mention it in your privacy policy.

---

## Phase 10 — Update CLAUDE.md (Post-Implementation Cleanup)

> **Priority: ✅ FINAL — Do after all other code phases are complete**
> 
> After Phases 1-9 are all deployed, CLAUDE.md needs to be updated to reflect the new reality. The security utilities are no longer "coming soon" — they're mandatory.

### 10.1 Remove the "if files don't exist" caveat from Section 11

In `CLAUDE.md` Section 11 header, there's a NOTE that says:

```
> **NOTE**: The security utility files (`lib/ratelimit.ts`, `lib/feature-flags.ts`, `lib/validations.ts`, `lib/audit.ts`) are created by `_tasks/roadmap-security-hardening.md`. If they don't exist yet, skip those layers but leave a `// TODO:` comment.
```

**Replace** that entire NOTE with:

```
> **NOTE**: All security utility files are implemented and mandatory. See `lib/ratelimit.ts`, `lib/feature-flags.ts`, `lib/validations.ts`, `lib/audit.ts`. Every API route MUST include all security layers — no exceptions, no TODOs.
```

### 10.2 Remove Rule S5's "skip" clause

In Rule S5 (Security Utilities — Mandatory Imports), delete the paragraph:

```
If any of these files don't exist yet (security roadmap not fully executed), **skip** that layer but add a `// TODO: add rate limiting after security roadmap Phase 3` comment.
```

Replace with:

```
All four utility files exist and are mandatory in every API route. There are no exceptions.
```

### 10.3 Verify CLAUDE.md is correct

After editing, read through `CLAUDE.md` Section 11 and verify:
- No references to "if files don't exist"
- No "TODO" suggestions
- All security layers are described as mandatory (not optional)
- The `lib/` directory listing in Section 3.2 matches what actually exists on disk

### 10.4 Commit

```bash
npm run build
git add CLAUDE.md
git commit -m "phase 10: update CLAUDE.md — all security layers now mandatory, remove 'coming soon' caveats"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - **Only do this phase after ALL of Phases 1-9 are successfully deployed and verified.** If you do this before, Claude Code (in future sessions) will think the files exist when they don't, and will try to import them → build errors.
> - **Do NOT rewrite Section 11 from scratch** — only modify the specific NOTE and the S5 paragraph mentioned above. Leave all the examples and rules intact.
> - **Double-check that `lib/ratelimit.ts`, `lib/feature-flags.ts`, `lib/validations.ts`, and `lib/audit.ts` actually exist on disk** before claiming they're mandatory.

---

# PART 2: 🧑 MANUAL PHASES (We Do Together)

> **These require external dashboard access, API key creation, or human verification. Claude Code CANNOT do these.**

---

## Manual Phase A — Create Upstash Redis (Required for Phase 4)

> **Do this BEFORE Claude Code starts Phase 4**

1. Go to [console.upstash.com](https://console.upstash.com)
2. Sign up / log in
3. **Create Database** → Name: `solen-ratelimit` → Region: **EU-West-1 (Ireland)** (closest to your Supabase eu-west-2)
4. Copy the **REST URL** and **REST Token**
5. Go to [Vercel Dashboard](https://vercel.com) → solen → **Settings → Environment Variables**
6. Add:
   - `UPSTASH_REDIS_REST_URL` = the REST URL (for **Production + Preview + Development**)
   - `UPSTASH_REDIS_REST_TOKEN` = the REST Token (for **Production + Preview + Development**)

**Time**: ~3 minutes
**Cost**: Free tier = 10,000 requests/day (more than enough)

---

## Manual Phase B — Rotate Exposed Sentry Token

> **Do this after Phase 1 (git cleanup)**

1. Go to [sentry.io](https://sentry.io) → **Settings → Auth Tokens**
2. Find the token starting with `sntrys_eyJ...` (this was committed to git)
3. **Revoke** it
4. **Create a new token** with the same permissions
5. Go to Vercel → solen → **Settings → Environment Variables**
6. Update `SENTRY_AUTH_TOKEN` with the new token (Production + Preview)
7. Update your local `.env.sentry-build-plugin` with the new token

**Time**: ~2 minutes

---

## Manual Phase C — Set Billing Caps & Alerts

> **Do this anytime, but ideally before payments go live**

### Supabase Spend Cap
1. [Supabase Dashboard](https://supabase.com/dashboard) → Project `tocfnsmxmdxkrcmjzzdw`
2. **Settings → Billing** → Enable **Spend Cap** (ON)
3. This prevents Supabase from charging you beyond the free tier

### Google Cloud Places API Quota
1. [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Places API
2. **Quotas** → Set:
   - Requests per day: `100`
   - Requests per minute: `10`
3. Your Basel directory has ~48 salons, so 100/day is generous

### Stripe Protections
1. [Stripe Dashboard](https://dashboard.stripe.com) → **Settings → Billing Alerts**
2. Create alerts at **CHF 50**, **CHF 200**, **CHF 500**
3. [Stripe Radar](https://dashboard.stripe.com/radar) → **Enable** (free basic protection)
4. **API Keys** → Check that test keys (`sk_test_`) are on Preview, live keys (`sk_live_`) on Production

**Time**: ~10 minutes total

---

## Manual Phase D — Configure Cloudflare

> **Your Cloudflare account (created 2026-03-16) has zero WAF rules**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → solen.ch zone
2. **Security → Bots** → Enable **Bot Fight Mode** (ON)
3. **Security → Settings** → Set **Security Level** to **Medium**
4. **Security → WAF** → Enable **Managed Ruleset** (free OWASP rules)
5. Optional: **SSL/TLS** → Set to **Full (Strict)** for end-to-end encryption

**Time**: ~5 minutes

---

## Manual Phase E — Verify Vercel Environment Variables

> **Ensure Preview vs Production separation**

Go to [Vercel Dashboard](https://vercel.com) → solen → **Settings → Environment Variables**

Check these are set for **BOTH Production AND Preview**:

| Variable | Production | Preview |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your real Supabase URL | Same |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your real anon key | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Your real service role key | Same |
| `STRIPE_SECRET_KEY` | `sk_live_...` | ⚠️ `sk_test_...` (TEST key!) |
| `STRIPE_WEBHOOK_SECRET` | Live webhook secret | Test webhook secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | ⚠️ `pk_test_...` |
| `UPSTASH_REDIS_REST_URL` | From Manual Phase A | Same |
| `UPSTASH_REDIS_REST_TOKEN` | From Manual Phase A | Same |
| `SENTRY_AUTH_TOKEN` | New token from Manual Phase B | Same |

**Critical**: Stripe keys MUST be different for Preview vs Production. Preview should use TEST keys so preview deployments don't charge real money.

---

## Manual Phase F — Post-Deployment Verification Checklist

> **Do after Claude Code finishes all code phases**

### Security headers check:
```bash
curl -sI https://www.solen.ch | grep -iE "x-frame|x-content|strict-transport|referrer|permissions"
```
All 5 headers should appear.

### Rate limiting check:
```bash
# Hit directory 31 times in rapid succession — 31st should return 429
for i in $(seq 1 35); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://www.solen.ch/api/directory?search=test&t=$i")
  echo "Request $i: $code"
done
```

### RLS check (in Supabase SQL Editor):
```sql
SET ROLE anon;
-- These should WORK:
SELECT * FROM salon_directory LIMIT 1;
SELECT * FROM public_profiles LIMIT 1;
-- These should FAIL:
DELETE FROM salon_directory WHERE id = (SELECT id FROM salon_directory LIMIT 1);
INSERT INTO salon_directory (name) VALUES ('hacked');
SELECT bio, hair_type FROM profiles LIMIT 1;  -- Should return 0 rows
RESET ROLE;
```

### Kill switch check:
- In Supabase SQL Editor: `UPDATE feature_flags SET enabled = false WHERE key = 'bookings';`
- Try creating a booking → should get `503 FEATURE_DISABLED`
- Re-enable: `UPDATE feature_flags SET enabled = true WHERE key = 'bookings';`

### CORS check:
```bash
curl -sI -H "Origin: https://evil.com" https://www.solen.ch/api/directory | grep -i "access-control"
# Should return NOTHING (no CORS header for unauthorized origin)

curl -sI -H "Origin: https://solen.ch" https://www.solen.ch/api/directory | grep -i "access-control"
# Should return Access-Control-Allow-Origin: https://solen.ch
```

---

## Execution Order Summary

| Step | Type | What | Depends On |
|---|---|---|---|
| **Manual A** | 🧑 Manual | Create Upstash Redis, set Vercel env vars | Nothing |
| **Phase 1** | 🤖 Code | Git credential cleanup | Nothing |
| **Phase 2** | 🤖 Code | RLS hardening | Nothing |
| **Phase 3** | 🤖 Code | Security headers | Nothing |
| **Phase 4** | 🤖 Code | Rate limiting | Manual A (Upstash) |
| **Phase 5** | 🤖 Code | Kill switch + feature flags | Nothing |
| **Phase 6** | 🤖 Code | Zod input validation | Nothing |
| **Manual B** | 🧑 Manual | Rotate Sentry token | After Phase 1 |
| **Manual C** | 🧑 Manual | Billing caps on all services | Anytime |
| **Phase 7** | 🤖 Code | CORS + review policies | Nothing |
| **Phase 8** | 🤖 Code | GDPR account deletion | Nothing |
| **Phase 9** | 🤖 Code | Audit logging | Phase 4 (needs `getClientIp`) |
| **Phase 10** | 🤖 Code | Update CLAUDE.md — remove "coming soon" caveats | ALL Phases 1-9 |
| **Manual D** | 🧑 Manual | Cloudflare WAF config | Anytime |
| **Manual E** | 🧑 Manual | Verify Vercel env var separation | Anytime |
| **Manual F** | 🧑 Manual | Post-deployment verification | After all code phases |
