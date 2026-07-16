# API design, Solen audit 2026-07-16

## Verdict

Solen's API design is mostly right for its actual shape: one team, one style (REST/JSON over Next.js route handlers, zero GraphQL/tRPC/gRPC, zero API versioning infrastructure), which is the correct call at 28 salons with two first-party clients and no third-party consumers. The two money-critical conventions that matter most, idempotency keys on payment writes and RFC-shaped rate-limit headers, are correctly implemented on the hot path. But three concrete, current gaps survived this pass with file:line evidence: the fail-closed 429 branch in `lib/ratelimit.ts` still omits `Retry-After` (a real, two-line fix), 422 is used exactly once across 354 route files so business-rule failures are almost always indistinguishable from malformed requests, and roughly a third of mutating routes (64 of 200) accept a request body with zero zod validation, some of them (`staff/[id]` PATCH) writing client-supplied values straight into money-adjacent columns through an allowlist with no type/range check. None of these is a live money-loss or data-leak bug on the scale of the 2026-07 campaign findings; they are hardening gaps consistent with a young, single-team API.

## Coverage and sampling method

- Read `_docs/BACKEND.md` section 11 (API surface & conventions) in full before sampling, to ground where to look and to avoid re-reporting the already-documented `{error}` vs `{message}` split.
- Cross-checked `_plans/BACKEND_AUDIT_INDEX.md` (141 campaign findings) and `_plans/BACKEND_HEALTH_AUDIT_2026-07-14.md` (re-verification + Part D fixes) for anything already found/fixed under this topic. Nothing in either doc is API-shape-specific (they are auth/money/RLS-focused); no overlap to avoid re-reporting.
- Exhaustive `grep` passes (not a sample) across all 354 `app/api/**/route.ts` files for: `status: 201/400/409/422`, `.range(`, `Location` header sets, `success: false`, zod import (`lib/validations` and inline `from "zod"`), Gemini/fal.ai call sites, GraphQL/tRPC/gRPC package references, `v1`/`v2` directories. These counts are exhaustive for the pattern searched, not sampled.
- For the 45 files using `status: 201` and the 13 files using `.range()`, read the actual surrounding code (not just the grep line) for a sample of them, chosen to cover the highest-traffic customer-facing cases (bookings, services, reviews, discovery comments, nail-inspo images) plus a couple of staff/admin-only cases, to classify risk rather than just count occurrences.
- Read `lib/ratelimit.ts` in full (335 lines) for the fail-closed vs normal 429 path.
- Read the batch endpoints named in the brief in full: `app/api/slots/bulk/route.ts`, `app/api/dashboard/batch/route.ts`, `app/api/admin/discovery/bulk-import/route.ts`.
- Sampled 6 of the 64 "zero zod" mutating routes end to end (`staff/[id]`, `vouchers/create`, `salon/go-live`, `favorites/toggle`, `dashboard/clients/[id]/notes`, `profile/delete`, `services/reorder`) to distinguish "no zod but ownership-gated and safe" from "no zod and a real gap."
- Attempted to verify Netlify's live function timeout for Solen's actual plan tier via `WebFetch` against three current Netlify docs pages (`functions/limits`, `functions/overview`, `functions/usage-and-billing`, `functions/api`); none of the three fetched pages stated a plan-tier-specific number in the fetched content, and Solen's actual billing/plan tier is not discoverable from this sandbox (no Netlify account/API access). Reported as UNKNOWN below rather than filled from training memory (a versioned platform fact, per the "reality over memory" rule).
- Did not read all 354 route files individually. Did not run any query against the live DB for this topic (no schema question was in scope); the one DB-adjacent check (row-growth pattern for `.range()` classification) was answered from the code's `.order()` clause plus the already-known scale (28 salons, ~9,365-row largest table per the migrations audit pass), not a fresh live query.

## Per-principle table

| id | rule | verdict | evidence | severity |
|---|---|---|---|---|
| API-01 | REST/JSON only, no GraphQL/tRPC/gRPC | MATCH | `grep -i "graphql\|trpc\|grpc" package.json` = 0 hits. No `app/api` route uses anything but `NextResponse.json`. | NONE |
| API-02 | 422 for business-rule failures, 400 for malformed requests | GAP | `status: 422` appears once in 354 route files (`app/api/directory/[id]/claim/route.ts:127`); `status: 400` appears 415 times, `status: 409` 72 times. The one 422 usage IS a genuine business-rule case (read below). | LOW (fix going forward, no backfill) |
| API-03 | Every 429 sets Retry-After, including fail-closed | GAP | `lib/ratelimit.ts:272` (fail-closed, no Redis reachable in prod) returns `NextResponse.json(RATE_LIMITED_BODY, { status: 429 })` with NO headers object at all. The normal path at `lib/ratelimit.ts:282-290` correctly sets `Retry-After`. | MEDIUM |
| API-04 | Deterministic idempotency keys on money writes | MATCH | `lib/bookings/issue-refund.ts:134` keys on `refund:${source}:${id}:${staleRefunded}:${amountCents}`. `app/api/stripe/booking-pay-intent/route.ts:481` keys a sha256 hash on `booking-pay:${booking.id}:${baseAmountRappen}`, explicitly the PRE-discount amount (comment at :470-478 explains why, to avoid forking a second PaymentIntent when a discount changes between attempts). | NONE |
| API-05 | Keyset pagination for growing/concurrent customer-facing lists; OFFSET OK for small/static | PARTIAL | 13 files, 15 `.range()` call sites (see detail below). 3 are genuine candidates (public reviews list, discovery comments, nail-inspo images, all `ORDER BY created_at DESC` with live concurrent inserts). No recorded duplicate-row-while-scrolling complaint found in `_rules/LESSONS_LEARNED.md` or `_plans/*.md` (grepped, 0 hits). | LOW (real pattern, no incident yet, low depth at current scale) |
| API-06 | No formal API versioning while zero third-party consumers | MATCH | `find app/api -iregex ".*/v[0-9]+$"` = 0 hits. No version header/date-pinning code found. | NONE |
| API-07 | RFC 9457 Problem Details on new routes only, no mass migration | MATCH (as designed) | `_docs/BACKEND.md:11.6` documents the same finding this pass found independently: `{error, code}` (1356 occurrences) and `{message, code}` (223 occurrences) coexist project-wide. This is the accepted, bounded-cost state the principle itself prescribes; no new RFC 9457 adoption found anywhere either, which is fine since none was required yet. | LOW |
| API-08 | zod at the trust boundary for every mutating route; no mass assignment | PARTIAL | Of 200 route files with a POST/PUT/PATCH/DELETE handler: 128 import the shared `lib/validations.ts`, 10 more validate with an inline local zod schema (138/200 = 69% validated), leaving 64 (32%) with zero zod. Concrete gap: `app/api/staff/[id]/route.ts:38-45` builds the update object from a hardcoded field allowlist (blocks mass assignment of arbitrary columns) but never validates the VALUE of `commission_rate` or `permissions`, both money/access-adjacent fields, before writing them. | MEDIUM (per-route, not systemic) |
| API-09 | Batch endpoints document a max cap + atomic-vs-partial contract | PARTIAL | `slots/bulk`: MATCH, `weeks` capped to `{1,2,4}` by zod, single atomic `.insert()`. `dashboard/batch`: GAP, `requests` array has no length cap and no zod at all (`app/api/dashboard/batch/route.ts:27-31`, just an `Array.isArray` check). `admin/discovery/bulk-import`: PARTIAL, `pages` capped at 5 (`route.ts:46`) but the per-photo upsert loop is partial-success with only an aggregate `totalImported` count returned (`route.ts:84,93`), no per-item result array. | MEDIUM (dashboard/batch), LOW (bulk-import, admin-only) |
| API-10 | Long-running generation goes 202+poll, not synchronous | GAP | 0 occurrences of a job-status/202 pattern anywhere in `app/api` (grepped `jobId`, `job_status`, literal `202`). All 12 Gemini/fal.ai routes are synchronous. Concrete example: `app/api/admin/nail/generate/route.ts:79` calls `fetch("https://fal.run/fal-ai/flux/schnell", ...)` inline with no `AbortController`/timeout guard. | LOW-MEDIUM (flux/schnell is a fast/distilled model, typically low seconds; no production timeout evidence found, see Unknowns) |
| API-11 | No hand-written OpenAPI spec today | MATCH | Zero OpenAPI files in the actual repo; every `*openapi*` hit is inside `node_modules`/worktree `node_modules` (Stripe/Svix SDK internals), not project code. | NONE |
| API-12 | No Sunset-header infra; extend REMOVED.md to API route removals | MATCH (already happening) | `_design-system/REMOVED.md` already has API-route-specific entries: line 38 (`GET /api/reviews/homepage` removed as a duplicate), line 53 (`/api/nail/retail/checkout` removed), lines 58-59 (`GET /api/salons/last-minute`, gift-card purchase/redeem endpoints removed). The discipline the principle asks for is already the live practice. | NONE |

## The gaps in detail

### 1. Fail-closed 429 has no Retry-After (API-03, MEDIUM)

`lib/ratelimit.ts:260-297`:

```
262:  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
266:    if (process.env.CONTEXT === "production" && process.env.NODE_ENV === "production") {
267:      if (ABUSE_PRONE_LIMITERS.has(limiter)) {
272:        return NextResponse.json(RATE_LIMITED_BODY, { status: 429 });
273:      }
...
282:    if (!success) {
283:      return NextResponse.json(RATE_LIMITED_BODY, {
284:        status: 429,
285:        headers: {
286:          "X-RateLimit-Limit": String(limit),
287:          "X-RateLimit-Remaining": String(remaining),
288:          "X-RateLimit-Reset": String(reset),
289:          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
290:        },
291:      });
```

Line 272 is the fail-closed path: Upstash is unreachable in a real production boot, and the route is one of the `ABUSE_PRONE_LIMITERS` (the ones this project has decided must fail closed rather than open). It returns the same 429 body as the normal path but with zero headers, so a well-behaved client has no signal for how long to back off, exactly the RFC 9110 10.2.3 gap the principle names. The code's own inline comment (lines 268-271) explains why the `X-RateLimit-*` headers are omitted (no real limit/remaining/reset numbers without a Redis call), but that reasoning doesn't extend to `Retry-After`: a fixed, conservative retry hint (e.g. 60 seconds) doesn't require Redis data to be honest, it's a "we don't know, try again in a minute" signal, not a precise reset time.

**What breaks in practice:** only when Upstash is down in production AND the hit route is abuse-prone (auth, payment, admin per `ABUSE_PRONE_LIMITERS`). A legitimate client retries immediately instead of backing off, working against the exact reason this path fails closed in the first place. Narrow trigger condition, but a real one, Upstash outages happen.

**Fix and cost:** add a fixed `Retry-After` header (e.g. `"60"`) to the line-272 response. Two lines, no new dependency, no behavior change to the success path.

### 2. 32% of mutating routes have zero request-shape validation (API-08, MEDIUM, per-route)

200 route files export a POST/PUT/PATCH/DELETE handler. 128 import `lib/validations.ts`; another 10 validate inline with their own local `z.object(...)` (`auth/login`, `auth/signup`, `auth/verify-otp`, `dashboard/clients/[id]/tags`, `dashboard/clients/[id]/notes`, `dashboard/spa/wellness-journal`, `dashboard/spa/rooms`, `partner/leads`, `salon-draft`, `vouchers/create`), so those 10 are correctly validated, just not through the shared schema file the first grep pass counted. That leaves 64 files (32% of the 200) with no zod at all.

Most of the 64 are either genuinely bodyless (`profile/delete` is a DELETE with no input), signature-verified instead of zod-shaped (`stripe/webhook`, which validates via `stripe.webhooks.constructEvent`, the correct mechanism for that trust boundary), or protected downstream by an explicit ownership/role check even though the body itself isn't schema-validated (`services/reorder`, `salon/go-live`).

The clearest concrete gap is `app/api/staff/[id]/route.ts:38-45`:

```
38:  const allowedFields = [
39:    "name", "avatar_url", "specialties", "is_active", "commission_rate",
40:    "languages", "instagram_url", "years_experience", "permissions",
41:  ] as const;
42:  const update: Database["public"]["Tables"]["staff_members"]["Update"] = {};
43:  for (const key of allowedFields) {
44:    if (key in body) update[key] = body[key];
45:  }
```

The allowlist correctly blocks mass assignment of columns not on the list (the OWASP API3 concern for which COLUMNS get written), but it does zero validation of the VALUE for any listed field. `commission_rate` (money-adjacent, drives staff payout math elsewhere) and `permissions` (access-adjacent, gates staff dashboard capabilities) can be any JSON shape the caller sends, a string where a number is expected, a negative number, an arbitrary object for `permissions`. The route is ownership-gated (only the salon owner or an admin can call it), so this is not a cross-tenant privilege-escalation vector, it's a "the owner's own client sends a malformed value and corrupts their own staff record with no clear error" risk, bounded but real.

**Fix and cost:** add a small zod schema (`z.object({ commission_rate: z.number().min(0).max(1).optional(), permissions: z.record(z.boolean()).optional(), ... })`) and call `validateBody` before the allowlist loop. Localized, no schema-file-wide refactor.

### 3. dashboard/batch has no cap on the requests array (API-09, MEDIUM)

`app/api/dashboard/batch/route.ts:27-31`:

```
27:  const body = await request.json();
28:  const { salonId, requests } = body as { salonId: string; requests: BatchKey[] };
29:  if (!salonId || !Array.isArray(requests)) {
30:    return NextResponse.json({ error: "salonId and requests required" }, { status: 400 });
31:  }
```

`requests` is cast to `BatchKey[]` with no runtime check that each entry is actually one of the 5 known keys, and no length cap. Ownership is verified before the `Promise.all` (lines 36-40), so this can only be fired by an authenticated user who owns the target salon (or an admin), not an arbitrary attacker. But nothing stops that owner's client (or a compromised/buggy client) from sending `requests` with, say, 50,000 entries of `"bookings_today"`, which the `Promise.all` on line 47 would fan out as 50,000 concurrent Supabase queries in a single request. Unknown keys silently no-op (the switch has no default case), so the DoS surface is specifically duplicated valid keys, not arbitrary garbage.

**Fix and cost:** validate `requests` as `z.array(z.enum([...batchKeys])).max(20)` (there are only 5 real keys; a generous cap like 20 covers any future addition without being unbounded). One schema, one `validateBody` call.

### 4. No 202+poll pattern for any AI generation route (API-10, LOW-MEDIUM)

All 12 routes that call Gemini or fal.ai (`translate`, `discovery/generate-description`, `admin/generate-roadmap`, `admin/discovery/smart-import`, `admin/discovery/check-ai`, `admin/nail/generate`, `recommendations`, `salons/[slug]/ai-info`, `ai/suggest-service`, `ai/recommend`, `ai/intake-recommendation`, `services/suggest`) run synchronously inside the request handler. Zero matches anywhere in `app/api` for a job-status/202 pattern (`jobId`, `job_status`, literal status `202`). Concrete example, `app/api/admin/nail/generate/route.ts:79`:

```
79:    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
```

No `AbortController`, no timeout wrapper, no fallback if the call runs long. This is the architecture-level gap the principle names: a synchronous call to a third-party model provider on a serverless function with a wall-clock limit has no partial-progress path if the provider is slow that day.

**Tempering the severity:** `flux/schnell` is a specifically fast/distilled image model (typically low single-digit seconds), and this pass found no evidence in the repo of an actual production timeout having occurred (no log/observability access from this sandbox to confirm either way, see Unknowns). This is a real structural gap worth knowing about, not an active incident.

**Fix and cost:** a genuine architecture change (job table + poll endpoint + client polling logic), not a two-line fix. Correctly scoped by the principle as "premature to build today" language would suggest, but worth doing the day one of these calls is observed to actually time out, or before adding a slower model.

## What Solen already does RIGHT (do not "fix" these)

- **Idempotency keys on money writes** (API-04): `lib/bookings/issue-refund.ts` and `app/api/stripe/booking-pay-intent/route.ts` both key deterministically on business-invariant fields (booking id + pre-discount amount), with an inline comment explicitly reasoning through why keying on the post-discount amount would fork a second PaymentIntent. This is textbook-correct and already matches what the principle asks for. Do not touch.
- **No versioning infrastructure, no GraphQL/tRPC/gRPC** (API-01, API-06): confirmed by direct grep, this is the correct state for a single-team, two-first-party-client API. Nothing to build here.
- **No hand-written OpenAPI spec** (API-11): also correct at this stage; the 138 routes with zod schemas already lower the cost of generating one later if a partner API ever ships.
- **Route-removal graveyard extended to API routes already** (API-12): `_design-system/REMOVED.md` already carries entries for `GET /api/reviews/homepage`, `/api/nail/retail/checkout`, `GET /api/salons/last-minute`, and the gift-card purchase/redeem endpoints. The discipline the principle recommends building is already the lived practice, just not named "API-12" until now.
- **The normal-path 429 response** (part of API-03): `lib/ratelimit.ts:282-290` sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, and `Retry-After` correctly from real Redis data. Only the fail-closed sibling branch needs the fix in gap #1 above; don't touch this branch.
- **slots/bulk batch endpoint** (API-09): correctly caps `weeks` to `{1,2,4}` via zod and performs a single atomic insert, exactly the atomic-batch shape the principle asks for. No per-item result array needed because it's genuinely all-or-nothing, not partial-success.
- **The single 422 usage is a real business-rule case, not an accident** (API-02): `app/api/directory/[id]/claim/route.ts:124-128` returns 422 when a directory listing has no email on file to send a verification code to, a well-formed request that fails because of the resource's own state, exactly the RFC 9110 15.5.21 distinction. Whoever wrote it understood the difference; the rest of the codebase just hasn't been touched with 422 in mind yet.

## Unknowns

- **Netlify's actual function timeout for Solen's live plan tier.** `WebFetch` against `docs.netlify.com/build/functions/{limits,overview,usage-and-billing,api}` did not return a plan-tier-specific number from the fetched content; a `WebSearch` summary suggested 30 seconds for standard synchronous functions and up to 15 minutes for background functions, but this was not confirmed by directly reading a page that states it, and Solen's actual billing/plan tier is not visible from this sandbox (no Netlify dashboard/API access). To close this: check the Netlify dashboard's billing page for Solen's plan, then cross-reference that plan's specific function timeout in Netlify's current docs.
- **Whether any AI/generation route has actually hit a production timeout.** No repo-local evidence either way (no `.catch` swallow, no incident note in `_rules/LESSONS_LEARNED.md`). Would need Netlify function logs or PostHog error tracking for the relevant routes, neither of which this read-only pass had access to.
- **Whether the 3 flagged `.range()` customer-facing lists (reviews, discovery comments, nail-inspo images) have caused a real duplicate-row-on-scroll complaint.** Grepped `_rules/LESSONS_LEARNED.md` and `_plans/*.md` for pagination/duplicate/offset-bug language, 0 hits. Absence of a recorded complaint isn't proof it hasn't happened quietly; would need frontend bug reports or a live reproduction (rapid-insert + concurrent-scroll test) to confirm either way.
- **Exact denominator semantics for the "13 `.range()` call sites" the brief cites.** This pass found 13 distinct files and 15 individual `.range()` call expressions (two files, `bookings/route.ts` and `bookings/user/route.ts`, each have 2 call sites for different query branches). The file-count (13) matches the brief; noting the site-count (15) discrepancy for anyone reconciling numbers later.
