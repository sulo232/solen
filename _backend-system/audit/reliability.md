# Reliability , Solen vs `LAW.md` section 15 (audit 2026-07-16)

## Verdict

Solen gets the two hardest calls right and lets the cheapest one slide **everywhere**. Idempotency-keyed money chokepoints mean a lost Stripe response never double-charges. Zero circuit breaker, zero SIGTERM handler, zero retry-with-backoff utility exist, exactly what the law prescribes at 28 salons: no premature machinery to walk back.

But the "one gap" research named in `lib/email.ts` is a **codebase-wide pattern** once every outbound call is swept: of ~29 external-call source files, only **8 attach any timeout at all (~28%)**. The sharpest instance is not hypothetical.

## Per-principle table

| id | rule | verdict | evidence | severity |
|---|---|---|---|---|
| REL-01 | Every outbound call gets an explicit timeout | **GAP, broader than documented** | `lib/email.ts:35` (no signal), `lib/sms.ts:55`, 8 more raw Resend fetches, all 9 Gemini SDK `generateContent()` sites (0 pass `requestOptions`), `admin/nail/generate/route.ts:79,108` (fal.ai) | HIGH |
| REL-02 | Retry only idempotent/idempotency-keyed ops | MATCH | Zero bare-retry loops exist anywhere (grep). Every money chokepoint carries a deterministic key. Enforced by convention only, not a gate | NONE |
| REL-03 | Caller's timeout must exceed the callee's worst case incl. its own retries | **UNKNOWN** | `lib/stripe.ts:10` sets no `timeout`/`maxNetworkRetries`; the SDK's actual defaults could NOT be verified (the `stripe` package is absent from this worktree's `node_modules`). Not guessed. For Gemini the question is moot: no timeout exists to budget | n/a |
| REL-04 | Never fabricate a plausible fallback number | **GAP, worse than documented** | `app/api/metrics/global/route.ts:11-17,34-46,56-65`. Two independent fabrication paths, not one | HIGH |
| REL-05 | Do NOT build a circuit breaker | MATCH | `grep -rn "CircuitBreaker" app lib` = 0 hits | NONE |
| REL-06 | No SIGTERM reasoning; substitute = idempotent + `maxDuration` + reconcile | PARTIAL | `grep -rn "SIGTERM" app lib` = **0 hits** (good). `maxDuration` present on only **2 of 354** route files | MEDIUM |

## The gaps

**1. `sendEmail()` has zero timeout and sits inside the customer-facing booking POST (REL-01, sharpest).**
`lib/email.ts:35` calls `fetch("https://api.resend.com/emails", {...})` with no `signal`, no `AbortController`. `app/api/bookings/route.ts:594` and `:628` both **`await sendEmail(...)` synchronously inside `POST /api/bookings`**, after the booking row already committed.

If Resend **hangs** (not errors, hangs, e.g. a slow TLS handshake on a cold connection), the `await` never resolves and never rejects, so the surrounding `try/catch` never fires (a catch needs a throw, not a hang). The request blocks until Netlify's platform ceiling kills it. **What the customer sees: their booking WAS created seconds earlier, but their browser shows a failed request.** A downstream email hang turns a successful booking into a customer-visible failure.

**2. The pattern spans the app, not one file (REL-01).**
- **8 more raw Resend fetches**, each re-implementing the POST instead of calling `sendEmail()`, all with zero signal: `bookings/resend-access:106`, `bookings/[id]/dispute:190`, `bookings/[id]/report:359`, `bookings/[id]/escalate:96`, `admin/booking-disputes/[id]/action:124`, `loyalty/award:106`, `dashboard/barber-reminders/send:64`, `cron/review-prompt:25`. **9 independent "POST to Resend" implementations exist**, so fixing `lib/email.ts` alone leaves 8 untouched.
- **`lib/sms.ts:55`** + its duplicate `auth/verify-phone/send/route.ts:57`: zero signal.
- **All 9 Gemini SDK sites have zero timeout** (grepped all for `requestOptions`, the SDK's actual signal mechanism: 0 hits). **7 are reachable by any logged-in customer**, not admin-gated.
- **`lib/search/embeddings.ts:23`**: the caller races it at 500ms (`salons/route.ts:141-149`), a good pattern for not blocking the caller, but **a `Promise.race` does not cancel the underlying fetch**, it only stops waiting. A distinct, softer failure mode worth naming.
- **`discovery/thumb/[id]/route.ts:133-138,160`**: zero signal, and it is **customer-facing** (the Inspo image proxy), unlike its siblings `import-tiktok` (8s) and `discovery-deadcheck` (12s) which do it correctly.

**3. `metrics/global` fabricates numbers, via TWO paths, not one (REL-04).**
```ts
const defaultStats = { salons: 500, bookings_this_week: 10000, bookings_all_time: 10000, reviews: 5000, avg_rating: 4.9 };
const salons = salonsResult.count ?? defaultStats.salons;   // :34-36, fires on ANY partial failure
...
} catch (error) { return NextResponse.json({ salons: 500, ... }); }  // :56-65, zero console.error
```
**None of the 5 parallel query results ever have `.error` checked.** PostgREST does not throw on a query-level failure, so `.count` comes back null, the `??` silently trips, and the same fake numbers ship **without entering the catch block and without a single log line in either path**. The fix `_docs/BACKEND.md:883` already suggests (log the catch) would not close the quieter path at all.

**Honest scope correction:** grepped the whole repo for callers. Only hits are the route itself and 2 unrelated comments citing it as an ISR precedent. `app/[locale]/page.tsx` has **no stat strip referencing these fields**. This route appears **currently orphaned at the render layer**, contradicting `_docs/BACKEND.md:900`'s description of it as "the public homepage stat-strip." The defect is real and live-callable regardless, but state it as "a user sees this the moment anything calls it," not as an active rendering incident.

**4. `maxDuration` is 2 of 354 (REL-06).** The jobs-async audit found 1 of 26 crons; the full-surface sweep finds 2 of 354 total. Adds one instance outside the cron fleet: `admin/discovery/backfill/route.ts` loops up to 50 rows with a per-item call that DOES have its own 10s timeout, but the route declares no ceiling.

## Ranked recommendations

1. **Add a timeout to `lib/email.ts`'s `sendEmail()`.** The one gap proven to sit inside a synchronous customer-facing request. Cost: one `AbortSignal.timeout(...)` line, **after measuring Resend's real p99 including a cold invocation**. Do not guess the number.
2. **Collapse the 8 duplicate Resend fetches into `sendEmail()`.** Fixing `lib/email.ts` alone leaves 8 paths unprotected, several customer- or owner-facing. Cost: a small refactor per site; a reuse win as well as a reliability one.
3. **Fix `metrics/global`'s per-field silent fallback, not just the outer catch.** Check `.error` on all 5 queries; log and omit, never substitute a literal. Cost: ~10 lines. Lower urgency (no live caller found), but a standing landmine the moment anything wires a stat strip to it.
4. **Add `requestOptions: { signal }` to the 9 Gemini SDK sites**, prioritising the 7 reachable by any logged-in customer. Cost: one object per site; needs a real measured number.
5. **Add a timeout to `lib/sms.ts` + `auth/verify-phone/send`.** Most SMS callers are cron batches, but the OTP-send route is a real exception: a hang there blocks a customer's own signup.
6. **Add `maxDuration` to `admin/discovery/backfill`.** Cost: one export line. Lowest urgency (admin-only, manually triggered).

**DO NOT DO YET** + trigger: a circuit breaker (two incidents in a quarter where one flaky dependency causes repeat correlated failures a timeout alone does not fix) · a token-bucket retry budget (retry volume becomes a meaningful fraction of requests; there is currently zero retry utility to even generate it) · app-level bulkheads (evidence one query path starves others through the pooler despite `statement_timeout`) · adaptive throttling + criticality (Solen's own compute, not a third party, becomes the bottleneck) · formal load testing (rising p99 under normal traffic, or a planned marketing push) · distributed tracing (a second deployable backend).

## What Solen already does RIGHT

- **Idempotency-keyed money chokepoints**, corroborated across three audits. Nothing here contradicts it.
- **Zero circuit breaker, zero SIGTERM handler, zero retry utility.** All three correctly-deferred non-adoptions, confirmed by grep, not assumed.
- **`search/geocode/route.ts`'s Mapbox degrade** (4s AbortController, parallel fan-out, empty-list-not-throw) is the correct reference pattern.
- **`lib/health.ts` (2s x3) and `middleware.ts`'s `getUser()` race (4s)** are both already-hardened, including the documented fix for a prior auth-bypass where a rejected promise fell through to unauthenticated pass-through.
- **`salons/route.ts`'s 500ms embedding race is a continuously-exercised degrade path** (runs on every search, not just during an outage), exactly AWS's "convert fallback into failover" recommendation.
- **Research's own correction stands verified: the real geo dependency is Mapbox, not Google Maps** (which appears only as a client-side deep link, never server-fetched).

## Sampling honesty + unknowns

Read in full: `lib/email.ts`, `lib/sms.ts`, `lib/stripe.ts`, `lib/health.ts`, `lib/search/embeddings.ts`, `lib/ai-vision.ts`, `metrics/global/route.ts`, plus targeted sections of `middleware.ts`, `salons/route.ts`, `search/geocode/route.ts`. Grepped all 304 `fetch(` hits, then filtered by each dependency's actual domain/SDK import to ~29 external-call files and opened every one's call site. Grepped all 9 Gemini SDK sites for `requestOptions`. **This is a targeted sweep by domain/SDK, not a line-by-line read of 354 routes**: a call site using a wrapper this domain list missed would not be caught.

**Unknowns:** the Stripe SDK's real default timeout/retries (package absent from `node_modules`; matches research's own "Unverified", not resolved) · whether `metrics/global` truly has zero callers (stated as the most likely reading, not a certainty) · Netlify's actual sync-function timeout for our plan (would need a deployed `sleep(N)` test route) · **real p99 latency of Resend/seven.io/Gemini under production load: every timeout recommendation above still needs a real measurement first, per the project's own measure-don't-invent rule** · whether the Gemini SDK has internal default retries that would compound with an added timeout.
