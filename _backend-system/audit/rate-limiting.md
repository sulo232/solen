# Rate limiting & abuse , Solen vs `LAW.md` section 9 (audit 2026-07-16)

> Parts of this document were written from a source read and were WRONG. Live-verified corrections are marked `CORRECTED 2026-07-17` inline. Where this doc and the live re-audit disagree, live wins.

## Verdict

The core is solid AND actively maintained. **Three prior findings are confirmed FIXED**, and the `BACKEND_HEALTH_AUDIT_2026-07-14` claims ("48/49 admin routes unthrottled", "~57 write routes lacking it") are **STALE**, superseded by commit `b0e4f97fd` ("ring9(abuse)"). Every example that finding named now calls `applyRateLimit`. Algorithm and lockout laws are clean MATCHes.

The real gap is the topic's own explicit ask, quota vs throttle on paid AI: the **public, unauthenticated** discovery-AI-vision guard is keyed on a spoofable raw XFF and carries no quota at all.

## Per-principle table

| id | rule | verdict | evidence | severity |
|---|---|---|---|---|
| RL-01 | Sliding window, no fixed-window/token-bucket | MATCH | `grep -rn "fixedWindow\|tokenBucket"` across `app/`+`lib/` = **0 hits**. All 20 limiters use `Ratelimit.slidingWindow` | NONE |
| RL-02 | `userId` where a session exists; IP fallback via `getClientIp()` | PARTIAL | **94 of 96** IP-keyed sites use `getClientIp(req)`. 2 raw-XFF exceptions: `app/[locale]/inspo/[id]/page.tsx:48` (guards a PAID call), `app/api/recommendations/chips/route.ts:61` | MEDIUM |
> **CORRECTED 2026-07-17 (live re-audit):** STALE. Both sites were fixed and the prescribed fix below is already implemented (a typed `ClientIpHeaders` interface at `lib/ratelimit.ts:441`). RL-02 is now a full MATCH (96 of 96), not a PARTIAL. Evidence: `grep -rn x-forwarded-for app lib` -> 3 hits, none a live key (2 comments, 1 intended fallback). Live test: rotating `x-forwarded-for` across 14 requests with a trusted header present collapsed to ONE Redis bucket and still tripped the 429.
| RL-03 | Never hard-lock an account | MATCH | Whole-repo grep `account_locked\|failed_login_attempts` = **0 hits**. `authLimiter` is a self-clearing throttle | NONE |
| RL-04 | Fail CLOSED per-route for abuse-prone/money routes | PARTIAL | `lib/ratelimit.ts:266-274` correctly fails closed for `ABUSE_PRONE_LIMITERS` on the unconfigured-Redis case. But `:292-295` and `:316-318` (the runtime-error catches) fail **OPEN for every limiter**, incl. abuse-prone ones. Confirms the research's own open question as still live | MEDIUM |
> **CORRECTED 2026-07-17 (live re-audit):** All three line citations are stale; the file grew with the global-budget work. Current locations: fail-closed branch 366-388, `applyRateLimit`'s catch 408-411, `checkRateLimit`'s catch 429-435. The substance of RL-04 is confirmed, only the citations rotted. Evidence: read of `lib/ratelimit.ts` (458 lines): `catch (err) { console.error("[ratelimit] Redis error, skipping rate limit:", err); }` is at 408-411; the allow-through catch is at 432-435.
| RL-05 | Every 429 sets `Retry-After` | GAP | `lib/ratelimit.ts:272` (fail-closed) still bare, unchanged since the api-design audit. Plus `admin/nail/generate/route.ts:51`, `directory/[id]/claim/route.ts:87` | MEDIUM |
> **CORRECTED 2026-07-17 (live re-audit):** STALE on all three sites. Every 429 in the repo now ships `Retry-After` (4 sites total, all 4 set it). RL-05 is a MATCH, not a GAP. Evidence: live 429 on the real-hit path: 14x GET `/api/referral/validate` -> first 429 on request #11, `retry-after: 533`. Live 429 on the fail-closed path (simulated prod boot, Upstash unset): `429 | Retry-After: 60` across all 9 abuse-prone limiters.
| RL-06 | Admin routes rate-limited | **MATCH (was GAP, now fixed)** | **44 of 51** admin route files call `applyRateLimit`, keyed on `userId`. The 7 without are all GET-only and role-gated (read in full) | LOW |
| RL-07 | Authenticated mutating routes rate-limited | **MATCH (was GAP, now fixed)** | **195 of 200** mutating route files call it. The 5 without: `stripe/webhook` (signature-verified, correctly exempt), 3 `CRON_SECRET`-gated internal routes, and `stripe/payment-methods` (a real gap) | LOW |
| RL-08 | Per-handler completeness in multi-method files | GAP | **13 handlers across 11 files** have no limiter despite a sibling handler in the same file having one (all 11 read in full; no shared helper covers them). DELETE is by far the most-skipped | LOW-MEDIUM |
| RL-09 | Paid third-party calls carry a throttle AND a quota | GAP | The core 8-route set correctly pairs a throttle with `getAiDailyLimiter()`. But: the public vision guard has neither a working key nor a quota; 4 admin Gemini routes have a throttle but no quota; `discovery/check-ai` has neither | HIGH (public) / MEDIUM (admin) |
> **CORRECTED 2026-07-17 (live re-audit):** Right in substance, wrong in path and count. The route is `app/api/admin/discovery/check-ai/route.ts` (`discovery/check-ai` does not exist as a bare path), and only 3 routes (not 4) have throttle-but-no-quota; `check-ai` is the 4th AI-calling admin route with NEITHER, so the true split is 3+1. Evidence: `find app -ipath '*check-ai*'` -> only `app/api/admin/discovery/check-ai/route.ts`. Per-file quota grep: `generate-roadmap`, `discovery/smart-import`, `discovery/backfill` all `quota_calls=0`; `check-ai` also `quota_calls=0` and zero throttle calls.

## The sharpest gap: an anonymous visitor can defeat the only cost control on a paid Gemini call

`app/[locale]/inspo/[id]/page.tsx:44-52`. The code's own comment states the intent correctly, then implements it with the exact anti-pattern the law names:
```ts
const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";
if (!(await checkRateLimit(discoveryAiLimiter, `ai:${ip}`))) {
```
The leftmost XFF is client-supplied and trivially spoofed, and this does not even try Netlify's trusted `x-nf-client-connection-ip` first (unlike `lib/ratelimit.ts:322-335`'s `getClientIp()`). Rotating the header defeats the 4-per-10-min cap entirely.

Cost is bounded (analysis is persisted once per item, line 94, so each item is paid at most once), so the worst case is "an attacker burns the entire unanalyzed backlog at will," not infinite spend. But there is **no daily quota on this route at all**, unlike every other Gemini-calling customer route, and `discoveryAiLimiter` is **not** in `ABUSE_PRONE_LIMITERS`, so if Upstash is ever unconfigured in production this specific paid-call guard fails fully open.

**Fix:** loosen `getClientIp`'s param type to accept any `{ get(name): string|null }` (both `NextRequest.headers` and `next/headers()` satisfy it) so both call sites share ONE implementation, and wire the route into `getAiDailyLimiter()` like the other 8.

> **CORRECTED 2026-07-17 (live re-audit):** STALE on all three counts. The route now runs three guards in sequence (per-IP throttle, per-IP daily quota, house-wide global budget); on a simulated unconfigured-Upstash prod boot the per-IP throttle fails open but the daily-quota guard fails CLOSED and blocks the call before it reaches Gemini. Evidence: live fail-posture harness (`CONTEXT=production`, Upstash unset): `discoveryAiLimiter` -> FAIL OPEN, but `aiDailyLimiter` -> `429 | Retry-After: 60`, and the route returns the item un-analyzed rather than reaching Gemini.

## Second: a CHF budget cap that can never fire

`lib/nail/ai-budget.ts:72-74`: `if (status.blocked && !isAdmin)`. Its only caller in the repo is `app/api/admin/nail/generate/route.ts:49`, which calls `checkBudget(true)` hardcoded, and the route is already admin-gated. So `!isAdmin` is always false and the CHF 50/month block is **dead code**. Spend tracking works; the gate does not. This is the project's #1 failure mode (a control that looks wired but does nothing) applied to a cost control. `getAiDailyLimiter()` (100/day, count-based) still backstops the same route, so this is "the CHF-denominated cap does not work," not "zero quota."

**Owner decision, not mine to guess:** should the CHF cap ever hard-block an admin, or is spend-tracking-only the real intent?

> **CORRECTED 2026-07-17 (live re-audit):** STALE. The `isAdmin` parameter is gone; `checkBudget()` now takes no arguments and the block behavior is a stored, admin-editable setting defaulting off, with the fork recorded as an open owner question rather than left as a dead-code bug. Evidence: `lib/nail/ai-budget.ts:126` `export async function checkBudget(): Promise<string | null>`; `:133` `if (status.blocked)`. Caller at `admin/nail/generate/route.ts:61` is now `const budgetError = await checkBudget();` with no argument.

## Ranked recommendations

1. **Fix the public AI guard's IP key + add a daily quota.** Cost: loosen one signature (fixes both raw-XFF sites), wire in `getAiDailyLimiter()`. The one live path where an anonymous visitor defeats the only cost control on real paid spend.
2. **Add `Retry-After` to `lib/ratelimit.ts:272` + the 2 custom 429 sites.** Cost: a few lines, zero happy-path change. Already flagged once (api-design audit); still unfixed.
3. **Rate-limit `stripe/payment-methods` POST/GET.** Cost: 2 lines, exact existing pattern. It creates real Stripe SetupIntents/customers, and Stripe's own account-level limit is a shared resource across ALL Solen users once tripped.
4. **Add `getAiDailyLimiter()` to the 4 admin Gemini routes + any limiter to `discovery/check-ai`.** Cost: ~2 lines x 5. Admin-gated so blast radius is a compromised admin session.
5. **Resolve the dead CHF-budget condition.** Owner decision. Flagged, not guessed.
6. **Fix `recommendations/chips/route.ts:61`'s raw XFF.** Cost: 1 line.
7. **Backfill the 13 missing per-handler limits.** Cost: 13 one-line insertions. Hygiene; all are ownership-gated surfaces.

**DO NOT DO YET** + trigger: distributed/multi-region limiting (multi-region compute) · ML bot scoring (documented repeated scripted abuse) · JA3 fingerprinting (an observed credential-stuffing campaign) · CAPTCHA everywhere (measurable scripted signup volume) · a paid disposable-email blocklist (observed farmed credits/promo abuse) · partner API-key tiering (the first external consumer).

## What Solen already does RIGHT

- **Sliding window everywhere**, zero exceptions.
- **`getClientIp()`'s trusted-header-first order** (Netlify's `x-nf-client-connection-ip` first, XFF only as a local/dev fallback) correctly applied at 94 of 96 sites.
- **No hard lockout anywhere** (0 hits repo-wide). Exactly NIST SP 800-63B-4's shape.
- **Signup email-enumeration fix is real**: `auth/signup/route.ts:70-74` returns an identical generic 200 whether or not the email exists.
- **SMS OTP victim-bombing is FIXED**: `auth/verify-phone/send` now has BOTH an IP limiter AND a phone-target limiter (`phone-otp:${normalizedPhone}`), so rotating IPs no longer floods a victim's phone.
- **Directory-claim brute force is FIXED**: a per-listing limiter PLUS a hard attempt cap that invalidates the stored code, stronger than a rate limit alone.
- **The `ABUSE_PRONE_LIMITERS` fail-closed split** correctly distinguishes money/enumeration/AI-cost routes from browsing routes.
- **The core 8-route AI set** is the textbook-correct quota-vs-throttle pattern. The gaps above are routes OUTSIDE that set, not cracks in it.
- **Coverage genuinely improved**: 44/51 admin and 195/200 mutating files, up from the 2026-07-14 audit's 1/49. Do not re-run that sweep from scratch.

## Sampling honesty + unknowns

Exhaustive greps (not samples) for: `applyRateLimit` (258 files), `fixedWindow`/`tokenBucket` (0), raw XFF outside `lib/ratelimit.ts` (2, both read), `account_locked` (0), `status: 429` (4 sites, all read), every Gemini/fal.ai call site (14 files, all opened). Built real file lists for the 200 mutating and 51 admin files and diffed against the limiter hit-list rather than assuming. All 5 zero-limiter mutating files and all 7 zero-limiter admin files read in full. **Did NOT** read all 354 routes; did not re-verify the ~184 files where handler-count equalled call-count.

**Unknowns:** whether Upstash is actually configured on the live production deploy (no credential access; if missing, every non-abuse-prone limiter is silently off in prod right now) · real historic 429 trip rates · whether `discoveryAiLimiter`'s omission from `ABUSE_PRONE_LIMITERS` was deliberate or an oversight (not stated anywhere; flagged, not assumed).
