# Reliability, researched law

Status: researched 2026-07-16. 19 external sources fetched this run (listed at the bottom, each
with what it established). Written for a real production system with ~28 salons live on Netlify
+ Supabase + Stripe, low traffic, serverless request model. This file is permanent engineering
law until an owner decision supersedes a row; every claim is tiered (T1/T2/T3/CONV/MYTH) so a
future session knows how much weight to put on it.

No em-dashes anywhere in this file (project rule).

---

## 0. The short version

The 8 rules a new session must obey before touching anything that calls another system:

1. **Every outbound call gets an explicit timeout.** No exceptions, including calls to Supabase,
   Stripe, Resend, Upstash, Mapbox, or Gemini. A default client with no timeout means a hung
   dependency hangs your request until the *platform's* timeout kills it, not yours. (T1, source:
   AWS Builders' Library, RFC-adjacent industry consensus)
2. **A caller's timeout must be longer than the callee's own worst-case time, including the
   callee's own retries.** If a downstream client retries 3 times internally, your timeout must
   cover all 3 attempts or you time out mid-retry and gain nothing. (T2)
3. **Only retry idempotent operations, or operations wrapped in an idempotency key.** Retrying a
   bare `POST` that charges a card can double-charge. Solen already does this correctly at every
   money chokepoint (see Section 8) via app-level idempotency keys, not the Stripe SDK's built-in
   retry. (T1, RFC 7231 + Stripe's own idempotency contract)
4. **Retries need a cap and backoff with jitter, or they turn a slow dependency into an outage.**
   Uncapped retries at multiple stack layers multiply combinatorially (3 retries at 5 layers = 243x
   load on the bottom layer). (T1, AWS + Google SRE, independently converging)
5. **Circuit breakers are a real pattern with a real cost (added state, a class of bugs that only
   fires during an incident) and are premature for 28 salons.** Timeouts + capped retries +
   healthy defaults cover almost all of Solen's actual risk today. Revisit if a single flaky
   dependency (most likely Resend or the Gemini vision call) causes a repeat, correlated outage.
   (T2, reasoned from Solen's current shape, not from a vendor's default advice)
6. **Never build a "fallback" code path that only runs during an incident.** A path that isn't
   exercised in normal operation is not tested, and AWS's own postmortem shows a fallback can be
   *worse* than no fallback (a 2001 Amazon.com outage was caused by exactly this). Prefer: serve
   stale, hide the feature, or let the caller retry, over "quietly switch to a different code path
   nobody has run in months." (T1, AWS Builders' Library, named production incident)
7. **"Graceful shutdown" does not mean what it means on a server you own.** Solen runs on Netlify
   Functions (Next.js API routes), a serverless model with no long-lived process to drain. There is
   no `SIGTERM` handler to write. What actually matters here: idempotent crons (already true, see
   `_docs/BACKEND.md`), and keeping handler bodies short enough that killed-mid-execution is rare
   and recoverable, not "listen for a shutdown signal." (T2, reasoned from the actual runtime,
   corrected against a genuine mismatch between the owner's brief and Solen's platform)
8. **Not every third party is equally critical.** Stripe down means checkout is down (hard,
   unavoidable dependency). Resend down should never take down a booking (degrade to "email will
   follow", already partially true). Mapbox down should degrade search to city-only. The scope
   brief says "Google Maps" but Solen's actual server-side geocoding dependency is **Mapbox**;
   Google Maps only appears as a client-side "open directions" link that never touches Solen's
   servers (verified by grep, see Section 9).

---

## 1. Timeouts on every outbound call, and how to budget them

**The question.** Every network call can hang: DNS, TCP connect, TLS handshake, waiting for the
response body. Without an explicit ceiling, "slow" becomes "hung forever," which is functionally
identical to "down" from the caller's perspective, except it also ties up the caller's own
resources (memory, DB connections, the serverless invocation itself) for the whole hang.

**What the evidence says.**

Marc Brooker's AWS Builders' Library article "Timeouts, retries, and backoff with jitter" (T1,
Amazon's own internal engineering standard, fetched in full via PDF) states the concrete practice:

> "A best practice in Amazon is to set a timeout on any remote call, and generally on any call
> across processes even on the same box. This includes both a connection timeout and a request
> timeout."
> [builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter)

Note the two-part timeout: a **connection timeout** (how long to wait to establish the TCP/TLS
session) and a **request timeout** (how long to wait for the response once connected) are
different failure modes and both need a ceiling. A client library that only exposes one is
under-protecting you.

**How to choose the number.** Brooker's article gives the actual method Amazon uses, not a rule
of thumb: pick an acceptable rate of false timeouts (their example: 0.1%), then set the timeout at
the corresponding latency percentile of the downstream service (their example: p99.9). This
inverts the usual "just pick 5 seconds" folklore into a measurable process. Two stated pitfalls:
it breaks down for calls with high, variable network latency (cross-internet, not same-region,
which is Solen's exact shape for Stripe/Resend/Upstash/Mapbox/Gemini, all external HTTP APIs, not
same-datacenter calls) where you must pad for worst-case network latency; and it breaks down for
services with a tight latency distribution (p99.9 close to p50) where the naive number causes
timeout storms on ordinary jitter. (T1)

**The specific trap Brooker names from his own postmortem** (worth keeping because it is exactly
Solen's serverless shape): a service saw sporadic 20ms-timeout failures right after every
deployment. Root cause: the timeout window included TLS handshake time on a *new* connection, and
a fresh connection took longer than the timeout, while a warm, reused connection didn't. This is
directly analogous to a cold Lambda/Netlify Function making its first outbound HTTPS call: a
timeout tuned against warm-connection latency will falsely trip on every cold start. Any timeout
Solen sets against Stripe, Resend, Mapbox, or Supabase should be measured including a cold
invocation, not just a warm one.

**Budgeting: the caller must exceed the callee's own total time, including its retries.** This is
the part most people get backwards. If a downstream client library itself retries 3 times
internally before giving up, and each attempt has a 2s timeout, the library's own worst case is
~6s (plus backoff delays between attempts). A caller that sets its *own* timeout to 2s "to be
safe" will abort mid-retry, get nothing, and gain zero benefit from the downstream retry logic it
paid the latency cost for. The caller's timeout must be `callee_total_worst_case + margin`, not
`callee_single_attempt_time`. This composes across every layer: a 5-deep call stack each with its
own retry budget needs the top-layer timeout to be the sum of the whole chain's worst case, or
every layer above the slow one times out uselessly while the slow layer is still working.

**Solen's actual state, verified by reading the code (not assumed):**

- **Good, already correct examples exist.** `middleware.ts:142-146` races `getUser()` against a
  4-second timeout via `Promise.race`, and treats a *rejected* promise identically to a timeout (a
  documented fix for a prior auth-bypass bug where a rejection fell through to unauthenticated
  pass-through, see `_docs/BACKEND.md:97`). `lib/health.ts`'s three dependency probes (DB, Redis,
  env) each use a 2-second `Promise.race` timeout (`PROBE_TIMEOUT_MS = 2000`,
  `lib/health.ts:14,31-38`). `app/api/search/geocode/route.ts:199-201` uses an `AbortController`
  with a 4-second timeout on each Mapbox call, fired in parallel via `Promise.all` across served
  cities, so the worst case stays ~4s regardless of how many cities are configured. `app/api/salons/route.ts`
  races `generateEmbedding(q)` against a 500ms timeout and falls through to lexical-only search
  either way (`_docs/BACKEND.md:611`), a genuinely good "degrade, don't hang" pattern.
- **A real gap: `lib/email.ts`'s `sendEmail()` has no timeout at all.** It calls
  `fetch("https://api.resend.com/emails", ...)` with no `signal`, no `AbortController`, nothing.
  If Resend hangs, this call hangs for as long as the surrounding Node runtime allows, which on
  Netlify's synchronous function limit is a hard ceiling (see Section 7), but on the two crons that
  explicitly set `maxDuration = 300` (`discovery-ai-backfill`) it could hang for up to 5 minutes.
  Most crons that call `sendEmail()` in a loop (`sms-reminders`, `birthday-messages`,
  `welcome-series`, `rebooking-nudge`) do **not** set `maxDuration`, so they inherit whatever the
  platform default is, and a hung Resend call partway through a batch loop silently truncates the
  rest of that batch with no timeout-specific error, just an eventual platform kill.
- **Stripe SDK client (`lib/stripe.ts:10`) is initialized with only `apiVersion` set, no `timeout`
  or `maxNetworkRetries` option.** The Stripe Node SDK does have both options (confirmed present
  in the SDK's own TypeScript surface via `node_modules/stripe`), but Solen never sets them, so it
  runs on the SDK's own built-in defaults, unverified here as a specific number, and not a
  deliberate choice.

**Recommended default for Solen:** every new outbound `fetch()` to a third party gets an explicit
`AbortSignal.timeout(ms)`, sized per Brooker's method (measure the dependency's real p99, add
margin for a cold invocation, cap at something well under Netlify's function ceiling). Retrofit
`lib/email.ts` first since it is the one confirmed gap with a live blast radius (a batch cron
silently truncating). Cost: a few lines per call site, and one number to pick per dependency,
which requires a real latency measurement, not a guess (rule: don't invent, measure).

---

## 2. Retries only on idempotent operations

**The question.** "Just retry it" is safe for a read. It is not safe for a write, because the
first attempt may have already succeeded server-side even though the client never saw the
response (the response was lost, not the request). Retrying blind in that case repeats the
side-effect: a second charge, a second row, a second email.

**What the evidence says.**

RFC 7231 §4.2.2 (T1, the actual HTTP specification, fetched directly) gives the formal definition:

> "A request method is considered 'idempotent' if the intended effect on the server of multiple
> identical requests with that method is the same as the effect for a single such request."
> [rfc-editor.org/rfc/rfc7231.html](https://www.rfc-editor.org/rfc/rfc7231.html)

And the classification: **GET, HEAD, PUT, DELETE, OPTIONS, TRACE are idempotent** (PUT and DELETE
by explicit design: doing them twice with the same body leaves the resource in the same state as
doing them once). **POST is explicitly not idempotent** by the spec: two identical POSTs are two
distinct create-or-mutate operations as far as HTTP itself is concerned. PATCH is not addressed by
RFC 7231 at all (it was defined later, in RFC 5789) and is not idempotent by default; whether a
given PATCH is idempotent depends entirely on what the patch document does.

This is a **CONV**, not a law of nature: idempotency is a property the *implementation* must
provide, HTTP verbs are just a convention that signals intent. A `POST` handler CAN be made safe
to retry, but only if the application explicitly makes it so.

AWS's "Making retries safe with idempotent APIs" (T1, fetched via search-extracted summary,
consistent with Amazon's own documented pattern) describes the actual mechanism: a caller-supplied
idempotency token, checked atomically against a store before the mutation runs; a retry with the
same token returns the original outcome instead of re-running the mutation; parameter mismatch on
a reused token is rejected as an error (protects against accidentally reusing a token for a
different logical operation); and the token is retained for a bounded window (AWS's own example:
resource lifetime plus a grace interval, not forever).

Stripe's own idempotency contract (T1, fetched directly from Stripe's API reference) is the same
pattern, productized: an `Idempotency-Key` header (recommended: a v4 UUID) on any POST. Stripe
saves the first response (success or failure) keyed to that header value, and replays it for any
retry within **24 hours**. A retry with the same key but *different* parameters is rejected as an
error, exactly the AWS pattern's parameter-mismatch guard. After 24 hours the key is pruned and a
reused key starts a fresh operation.
[docs.stripe.com/api/idempotent_requests](https://docs.stripe.com/api/idempotent_requests)

**What retrying a non-idempotent operation without protection actually causes, concretely, for
Solen:** retry a bare `stripe.paymentIntents.create` twice (network blip on the first response) and
you get two PaymentIntents, i.e. a double-charge risk. Retry a bare `stripe.refunds.create` twice
and you double-refund. This is not hypothetical; it is exactly the failure mode Solen's own money
code was built to prevent.

**Solen's actual state, already correct, verified by reading `_docs/BACKEND.md` and the cited
files:** Solen already implements the AWS/Stripe pattern precisely, at every money chokepoint:
`lib/bookings/issue-refund.ts` / `lib/purchases/issue-purchase-refund.ts` key on
`refund:{source}:{id}:{staleRefunded}:{amountCents}`; `booking-pay-intent.ts` keys the PaymentIntent
create on `(booking_id, baseAmountRappen)`; `charge-fee.ts` keys on `(source, id, kind,
amountCents)`; `pre-charge`'s cron uses `pre-charge:<bookingId>:<amountRappen>`. The rule stated in
`_rules/LESSONS_LEARNED.md` (quoted in `_docs/BACKEND.md:343`) is exactly the AWS/RFC principle:
"never call `stripe.paymentIntents.create` / `refunds.create` outside these chokepoints, or a
retry collapses to nothing and a double-charge/double-refund becomes possible." This is good,
evidence-aligned law already in force; this research file is naming *why* it's correct, not
inventing something new.

**The one gap:** this discipline is enforced by convention (a comment, a rule doc), not by a type
system or a lint rule. Nothing stops a future PR from calling `stripe.paymentIntents.create`
directly outside the chokepoint files. **Recommended, low-cost hardening:** a grep-based CI check
or a pre-commit hook that flags any `stripe.paymentIntents.create(` / `stripe.refunds.create(` call
outside the known chokepoint file list, the same mechanical-enforcement pattern the project
already uses for other rules (see `.claude/hooks/`). Cost: one grep rule, near-zero false-positive
risk since the chokepoint file list is small and named.

---

## 3. Retry storms, and why retries need budgets or circuit breaking

**The question.** A single retry is cheap. What happens when *every* client of a degraded
dependency retries at the same time, or a request retries independently at every layer of a deep
call stack?

**What the evidence says.**

Brooker's article (T1, same source as Section 1) states the multiplication problem explicitly with
a worked number: a 5-deep service stack, 3 retries at each layer, ends in **243x** load
amplification at the bottom layer (3^5) if each layer retries independently and blindly. Their
stated best practice: **retry at a single point in the stack**, for low-cost control-plane/data-plane
operations, and let a failure at a lower layer propagate up as a failure rather than getting
independently retried at every layer above it.

The article also states something sharper than folklore: **circuit breakers are not free of
cost**, quoting the source directly: "circuit breakers introduce modal behavior into systems that
can be difficult to test, and can introduce significant addition time to recovery." Amazon's own
stated mitigation of choice is **not** a circuit breaker first; it is a **token bucket local retry
limiter**: calls retry freely while tokens exist, then downshift to a fixed low rate once tokens
run out. This has shipped in the AWS SDK since 2016. This is a genuinely useful nuance: the
industry-popularized answer to "retry storms" is "add a circuit breaker," but AWS's own primary
engineering source treats the circuit breaker as a heavier, harder-to-test tool and reaches for a
retry budget (token bucket) first.

Google's SRE book, "Handling Overload" chapter (T2, fetched, direct quotes below), converges on a
compatible but distinctly different mechanism: **client-side adaptive throttling with a criticality
system**, not a binary circuit breaker. Each client tracks `requests` (attempts) and `accepts`
(backend-accepted) over a rolling window; once `requests >= K * accepts` (K commonly 2), the
client starts probabilistically rejecting its own retries locally, before they even leave the
process. Requests also carry a **criticality** label (`CRITICAL_PLUS`, `CRITICAL`,
`SHEDDABLE_PLUS`, `SHEDDABLE`), and lower-criticality traffic sheds first under pressure. A
backend under load can additionally return an explicit **"overloaded; don't retry"** signal
(distinct from a generic error) specifically to stop the combinatorial multi-layer retry explosion
Brooker describes, by telling the caller "do not retry me, I am not going to get better from your
retry." [sre.google/sre-book/handling-overload/](https://sre.google/sre-book/handling-overload/)

Google's "Addressing Cascading Failures" chapter (T2, fetched, direct quotes) frames the mechanism
of *why* retry storms turn into full outages: a cascading failure is "a failure that grows over
time as a result of positive feedback" where a portion failing "increas[es] the probability that
other portions of the system fail." A concretely named trigger: naive retries without exponential
backoff "compound load problems... exponentially increasing backend load" on top of a backend that
is already struggling. The chapter's stated retry-budget number: cap retries to roughly **60 per
minute per process**, propagate deadlines down the call chain so a server stops working on a
request whose caller has already given up, and always use **randomized exponential backoff**, not
plain exponential backoff, to avoid synchronized retry waves.
[sre.google/sre-book/addressing-cascading-failures/](https://sre.google/sre-book/addressing-cascading-failures/)

**Where the real tradeoff lies.** There are at least three distinct, non-identical mitigations in
the literature, and picking the wrong one for your scale is the actual mistake:

1. **Retry-at-one-layer-only + capped attempts + jittered backoff.** Cheapest, works for almost any
   single-service, non-microservice shape. This is Solen's shape.
2. **Local token-bucket retry budget** (AWS's preferred fix). Useful once you have enough traffic
   that a fixed retry cap still adds up to meaningful load; needs almost no new infrastructure,
   just a counter.
3. **Circuit breaker.** Useful once a dependency failure is common/long enough that "stop calling it
   entirely for a while" beats "keep trying with backoff." Costs: state machine complexity, a class
   of bugs (breaker mis-tripping on transient blips, or getting stuck open) that, per Fowler and
   Azure's own docs below, "shows up only in the most chaotic moments," i.e. it is very hard to
   test the exact path that matters most.

**Recommended default for Solen: option 1, tightened.** At ~28 salons and low traffic, Solen does
not have deep multi-layer service-to-service call chains (it's a monolith calling external HTTP
APIs directly, not service A calling service B calling service C). The 243x-amplification failure
mode requires exactly the deep-stack shape Brooker describes; Solen's shape is closer to "one
layer calls Stripe/Resend/Mapbox directly," so the single-point-of-retry rule is nearly automatic
today, not something that needs new machinery. What Solen is actually missing is simpler and
cheaper: a shared, capped, jittered retry helper (there is currently **zero** retry-with-backoff
utility anywhere in `lib/` or `app/`, confirmed by grep) so that any future retry logic doesn't get
hand-rolled inconsistently, uncapped, or without jitter.

---

## 4. Circuit breakers (states, thresholds, half-open)

**The question.** Once a dependency is confirmed down, should the caller keep trying (burning
time and resources on calls very likely to fail) or should it stop calling entirely for a while?

**What the evidence says.** The pattern was popularized by Michael Nygard's *Release It!* and is
described consistently across Martin Fowler's bliki (T2, fetched directly) and the Microsoft Azure
Architecture Center's Circuit Breaker pattern page (T1-equivalent for a widely-adopted named
pattern, fetched in full).

**The state machine, as both sources describe it identically:**

- **Closed**: normal operation. Every call passes through. A failure counter increments on each
  failure and (per Azure's fuller description) resets on a time basis, not just "on any success",
  specifically so a service having a few occasional, unrelated failures doesn't spuriously trip
  the breaker. Once failures exceed a threshold within a time window, the breaker moves to **Open**.
- **Open**: calls fail immediately, with no attempt made at all, and a reset timer starts. This is
  the entire point of the pattern: stop wasting caller resources (threads, connections, memory) on
  calls that are very likely to fail, and stop adding load to an already-struggling dependency.
- **Half-Open**: after the timer expires, a **limited number** of trial calls are allowed through.
  Azure's description: success on those trials (Azure recommends counting a threshold of
  consecutive successes, not just one) closes the breaker and resets the failure counter; any
  failure during the trial reopens the breaker and restarts the timer. Fowler's toy implementation
  literally uses a threshold of 1 (any single half-open success closes it), which he explicitly
  flags as a simplification: "a more sophisticated approach might look at frequency of errors,
  tripping once you get, say, a 50% failure rate," and different thresholds for different
  exception types ("a threshold of 10 for timeouts but 3 for connection failures").
  [martinfowler.com/bliki/CircuitBreaker.html](https://martinfowler.com/bliki/CircuitBreaker.html) ,
  [learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)

**Azure's own stated list of when the pattern is NOT appropriate** (T1, directly relevant to
scale-honesty for Solen): "Well-known retry algorithms are sufficient and your dependencies are
designed to handle retry mechanisms. In this scenario, a circuit breaker in your application might
add unnecessary complexity to your system." Also flagged: circuit breakers add pure overhead for
protecting *local, in-process* resources, and event/message-driven architectures usually already
have an equivalent via dead-letter queues, making an extra circuit breaker redundant. Azure also
explicitly names the failure mode Solen would actually hit if it built one prematurely:
"Inappropriate time-outs on external services: A circuit breaker might not fully protect
applications from failures in external services that have long time-out periods... many other
application instances might also try to invoke the service through the circuit breaker and tie up
numerous threads before they all fail," meaning a circuit breaker without a correct underlying
timeout (Section 1) doesn't actually solve anything, it just adds a second layer of bookkeeping on
top of the real fix.

**Where the tradeoff lies.** A circuit breaker's entire value is protecting a *stateful,
long-lived process* (threads it owns, connections it's pooling) from exhausting itself against a
dependency that has gone down for an extended period. Its cost is a genuinely hard-to-test failure
mode (the exact path that matters, tripping under a real incident, is the one path that's
hardest to safely exercise in a test), plus a decision surface (thresholds, window size, half-open
trial count) that needs real production data to tune correctly, or it just adds noise (false
positives) or false confidence (false negatives).

**Recommended default for Solen: do not build one yet.** Solen's runtime is serverless (each
request/cron run is typically a short-lived, often-cold invocation, not a long-lived process
holding a thread pool open against Stripe for hours). The core value proposition of a circuit
breaker (protect a long-lived process's own exhausting resources from a persistently-down
dependency) is structurally weaker in a model where each invocation is short and stateless to
begin with; the resource that a circuit breaker protects in Nygard's original telling (thread
pools on a long-running app server) barely exists in the same shape here. A per-invocation timeout
(Section 1) plus a capped, jittered retry (Sections 2 and 3) covers nearly all of Solen's actual
risk at 28 salons. See "Premature at our scale" for the concrete trigger that should change this
call.

---

## 5. Bulkheads

**The question.** If one dependency (say, a slow Gemini vision call) exhausts a shared resource
pool (connections, threads, memory), does that also take down unrelated work (say, a booking
write to Supabase) that never touched the slow dependency?

**What the evidence says.** The Azure Architecture Center's Bulkhead pattern page (T1-equivalent,
fetched in full) gives the clean statement of the problem and solution:

> "A consumer might send requests to multiple services simultaneously and use resources for each
> request. When the consumer sends a request to a misconfigured or unresponsive service, the
> resources that the client's request uses might remain unavailable for an extended period... the
> consumer's requests to other services are affected. Eventually, the consumer can't send requests
> to any other services, not only the original unresponsive service."
> [learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead)

The fix: partition resources (connection pools, thread pools, queues) **per dependency**, so
exhaustion against one dependency cannot starve calls to a different, healthy one. Named
implementation options: separate connection pools per downstream service, separate thread pools /
semaphores per consumer class (the doc names `resilience4j` and `Polly` as the usual libraries for
this in long-lived-process languages), or, at the infrastructure level, separate containers/VMs
per service so a resource leak in one doesn't share fate with another. Azure's own stated
"not appropriate when" list: when the added resource-isolation overhead isn't worth it, or the
complexity isn't justified, which is exactly the scale question below.

**Where the tradeoff lies.** A bulkhead's cost is under-utilization: a pool sized and reserved for
one dependency sits partially idle while another dependency's pool is saturated, which is the
whole point (isolation over maximal utilization) but is a real efficiency cost, and it adds
configuration surface (how many pools, how big each one, per what dimension).

**Solen's actual shape: this is largely moot today, and here is why, verified rather than assumed.**
Solen's request model is one Next.js API route handler per invocation, running on a serverless
platform (Netlify Functions), not a long-lived process holding a shared, hand-managed connection
pool across requests. There is no shared, in-process thread pool that a slow Gemini call could
starve away from a concurrent Supabase write, because each invocation largely owns its own
resources for its own lifetime; the "shared pool exhaustion" failure mode the Bulkhead pattern
exists to solve is a feature of long-lived multi-tenant processes (the classic Java app-server case
Nygard and Azure describe), which is structurally not Solen's shape. The one place a bulkhead-like
concern legitimately exists in Solen today is the **Postgres connection pooler** (Supabase's
Supavisor/PgBouncer layer): a burst of slow queries from one code path (say, a bad discovery-feed
query) genuinely can exhaust the shared connection pool and starve unrelated queries (say, a
booking write) that hit the same pooler. That is a real, present-tense bulkhead-shaped risk, and
the correct mitigation is not a hand-rolled application-level bulkhead but Supabase's own
per-role `statement_timeout` (see Section 9's DB entry: currently unset in Solen, running on
Supabase's platform default of anon=3s / authenticated=8s, confirmed directly from Supabase's own
docs) plus not letting any one query path run unbounded.

**Recommended for Solen:** no application-level bulkhead machinery. Instead, treat Postgres
`statement_timeout` (already enforced by Supabase's platform default, verified, not something
Solen has to build) as the de facto bulkhead against one slow query path starving others through
the shared pooler, and keep it that way rather than raising it project-wide "to stop annoying
timeout errors," which would quietly remove the one bulkhead Solen already has for free.

---

## 6. Graceful degradation (serve stale, hide the feature, never take the whole page down)

**The question.** When a dependency fails, what should the user see? The naive answer ("show an
error page") is often worse than necessary; the naive *fix* ("silently fall back to something
else") is often worse still, per Section on fallback below.

**What the evidence says.**

Google's "Addressing Cascading Failures" chapter (T2, fetched) names graceful degradation as one of
its core recommended mitigations directly: "Once a service passes its breaking point, it is better
to allow some user-visible errors or lower-quality results to slip through than try to fully serve
every request," giving the concrete example of serving reduced-quality results (fewer images, a
simplified/cheaper algorithm) rather than either a full failure or an attempt to fully serve every
request that risks cascading the whole service down.

AWS's "Avoiding fallback in distributed systems" (T1, fetched in full via PDF, Jacob Gabrielson)
draws the crucial, frequently-missed **distinction between graceful degradation done well and a
fallback done badly**. The article names four legitimate strategies for handling a failure (retry,
proactive/parallel retry, failover to a different copy of the same thing, and fallback to "a
different mechanism to achieve the same result") and argues Amazon "almost never" uses the fourth
one, fallback, specifically because:

- **Fallback paths are rarely exercised, which means they are effectively untested in production.**
  "It might take years before even one customer's [situation]... actually [triggers] the specific
  line of code with the fallback." A latent bug in a fallback path can sit for years before firing,
  at the worst possible moment: during a real incident.
- **The fallback itself can fail, and often makes the outage *worse*, not better.** The article's
  own named production incident (Amazon.com, circa 2001): a caching layer was added in front of a
  supply-chain database because the database couldn't handle direct load. The team added a
  fallback: if the cache is unhealthy, query the database directly. This worked for months. Then
  every cache instance failed around the same time, so every web server fell back to hitting the
  database directly, all at once, which "created enough load to completely lock up the database,"
  taking down the entire website *and* every fulfillment center worldwide, because the same
  database served both. Direct quote: **"the fallback strategy itself amplified the problem and
  was worse than no fallback strategy at all."**
  [d1.awsstatic.com/builderslibrary/pdfs/avoiding-fallback-in-distributed-systems.pdf](https://d1.awsstatic.com/builderslibrary/pdfs/avoiding-fallback-in-distributed-systems.pdf)

The article's own prescribed alternative to a naive fallback: **"convert fallback into failover"**,
meaning if a fallback path is genuinely needed, exercise it continuously in production (e.g.
randomly route some fraction of normal traffic through it, always, not just during failures), so a
latent bug surfaces immediately under normal load instead of during an incident. If you can't
afford to run the fallback path continuously, that itself is a signal you shouldn't have it; prefer
"improve the reliability of the primary path" or "let the caller retry" instead.

**Where the real tradeoff lies.** Graceful degradation done well (serve stale, hide the feature)
degrades gracefully, is simple, and fails toward "less functionality" rather than "wrong or
dangerous functionality." A naive fallback done badly (silently switch to a whole different code
path only under failure) trades "no results" for "an untested code path that might make things
worse," which is a real net loss, not a safety margin. The distinguishing question to ask before
writing any fallback: **is this path exercised right now, under normal load, or does it only run
during an incident?** If the latter, it's a Section-6-banned fallback, not graceful degradation.

**Solen's actual state, verified:**

- **Good, already-correct examples.** `app/api/salons/route.ts`'s semantic search: races the
  embedding call against a 500ms timeout, and regardless of outcome always falls through to
  lexical-only ranking (never blocks the request on the embedding). This runs on **every** search
  request, not just during an outage, so it is continuously exercised, exactly the "convert
  fallback into failover" pattern AWS recommends, not a rarely-triggered fallback. `app/[locale]/inspo/[id]/page.tsx`'s
  `ensureAIData` Gemini vision call "fails open to render the item as-is rather than erroring" per
  `_docs/BACKEND.md:1157`, a correct degrade-not-crash choice for a non-critical enrichment call.
  `app/api/analytics/track-view/route.ts` "degrades to a 200 no-op if the table write fails," which
  is correct because view-tracking failing silently is the right tradeoff (nobody's booking should
  ever be blocked by an analytics write).
- **A real violation of the same principle, already flagged in `_docs/BACKEND.md:883`:**
  `app/api/metrics/global/route.ts:56-65` catches its whole `Promise.all` block and silently
  returns **hardcoded fabricated fallback numbers** (`salons: 500, bookings_this_week: 10000, ...`)
  with no logging at all. This is exactly the failure mode this section warns against: a fallback
  path (fabricated constants) that only fires during a real failure, is never exercised under
  normal operation, is indistinguishable from real data to anyone reading the page, and directly
  violates the project's own "no fabricated data" rule (CLAUDE.md taste rule 1). Worth fixing on
  next touch: either surface a genuine loading/error state, or omit the section, never fabricate a
  number.

**Recommended default for Solen:** when writing a new degrade-path, ask "does this path run under
normal load too, or only during a failure?" If only-during-failure, prefer instead: surface a
clear, honest empty/error state (the project already has `<EmptyState>` / `<ErrorState>` /
`ErrorFallback` primitives, per the design contract), or omit the element, never synthesize a
plausible-looking fake number.

---

## 7. Graceful shutdown / SIGTERM drain, and what that means in serverless

**The question, as scoped by the owner:** what does "drain in-flight work before shutting down"
mean when you don't own the process?

**What the evidence says, and the genuine correction this section has to make.** The classic
graceful-shutdown pattern (catch `SIGTERM`, stop accepting new work, finish in-flight requests,
then exit) assumes you control a long-lived process on a server you provisioned. AWS's own
documentation on Lambda's actual shutdown behavior (T1, fetched via search, converging with the
official AWS Lambda docs) states the real mechanics: **a bare Lambda function with no registered
external extension gets NO shutdown window at all.** Only when a function has a registered
external extension does Lambda send a `SIGTERM` to the runtime, followed by a `Shutdown` event to
the extension, with a **300ms** window (500ms if the extension is internal) out of an overall
**2000ms** budget, before Lambda force-kills the process with `SIGKILL`. Ordinary application code
in an ordinary function, the shape almost every Solen API route is, gets none of this.

Netlify's Next.js runtime (`@netlify/plugin-nextjs`) runs Next.js API routes as Netlify Functions,
which are themselves built on AWS Lambda. **This means the owner's framing of this sub-topic
("what does drain mean when you don't own the process") is the right question, but the concrete
answer for Solen is: there is effectively no drain step to write.** A Solen API route or cron
handler does not get a reliable `SIGTERM` hook to catch cleanup on. UNVERIFIED: whether Netlify's
specific Lambda wrapper registers an internal extension that would grant Solen's own function code
even the 300500ms window; this was not directly confirmed from Netlify's own docs in this run (see
Unverified section).

**What actually matters instead, for a system that cannot rely on a shutdown hook:**

1. **Idempotent handlers, so a mid-execution kill is safe to simply re-run, not "safe to detect and
   resume."** Solen already does this well for crons, verified: `_rules/LESSONS_LEARNED.md` (quoted
   in `_docs/BACKEND.md:474`) confirms state-machine crons (`auto-complete`, `pending-timeout`,
   `no-show`) gate on a status column, `abandon-sweep` re-checks live Stripe state before acting and
   re-asserts its WHERE clause at update time so a webhook racing the sweep can't be clobbered, and
   `pre-charge` uses a deterministic Stripe idempotency key. This is the *correct* substitute for
   "listen for SIGTERM and drain": instead of trying to finish gracefully, make it safe to be killed
   at any point and simply re-run from the top on the next tick.
2. **Short handler bodies, bounded by an explicit time budget, so "killed mid-execution" stays
   rare.** Most Solen cron routes declare `runtime = "nodejs"` with no `maxDuration` override
   (confirmed by grep), meaning they run on whatever Netlify's default synchronous limit is (see
   Section 9's Netlify entry: 10 seconds default, up to 26 seconds on a paid plan, confirmed
   directly from Netlify's own docs). Only `discovery-ai-backfill` explicitly widens this to
   `maxDuration = 300` because it deliberately needs more room. Any cron whose real workload can
   exceed the default ceiling and doesn't explicitly declare a longer `maxDuration` (or convert to
   a Netlify Background Function, 15-minute ceiling) is at risk of a silent mid-batch kill with no
   graceful-anything, just a truncated loop and whatever the idempotency of the next tick can
   repair.
3. **A "reconcile" pass as the real safety net for whatever a graceful shutdown would have caught
   on a stateful server.** Solen already has exactly this pattern named in
   `_docs/BACKEND.md:498` (a cron's "reconcile" mismatch alert). This is the honest serverless
   substitute for "the shutdown hook flushed my buffers": a periodic pass that finds and repairs
   whatever a mid-execution kill left half-done, rather than trying to prevent the kill from ever
   mattering.

**Recommended default for Solen:** stop reasoning about this sub-topic in terms of "catch SIGTERM."
Reason about it in terms of: (a) is this handler idempotent if killed halfway, (b) does it have an
explicit, correct time budget for its real workload (`maxDuration` or Background Function), and (c)
is there a reconcile/sweep pass that catches whatever a partial run leaves behind. All three are
already partially built; the gap is that (b) is inconsistently declared (most crons rely on an
undeclared default rather than a deliberate choice).

---

## 8. Backpressure and load shedding

**The question.** When more work arrives than a system can handle at acceptable latency, what
should happen: try to serve everything (and risk everything getting slow or failing), or
deliberately reject some of it to protect the rest?

**What the evidence says.** AWS's "Using load shedding to avoid overload" (David Yanacek, T1,
fetched in full via PDF) gives the clearest mechanical explanation available of *why* this matters,
grounded in the Universal Scalability Law (a derivation of Amdahl's Law): throughput is ultimately
bounded by a system's points of serialization, and past a certain offered load, a system doesn't
just plateau, its actual useful output (**"goodput," the article's term: the subset of throughput
served correctly and fast enough to be useful**) can collapse toward zero, because an overloaded
system keeps accepting work it has no real capacity for, spends increasing time on context
switching and contention instead of useful work, and every one of those wasted requests still
eventually times out on the client side, so the "work" it did was pure waste.

The article's central graph (reproduced faithfully): without load shedding, goodput rises with
offered throughput up to a peak, then **collapses to near zero** as offered load keeps increasing,
because the system is now spending all its time being slow rather than doing useful work, and the
client-perceived availability crashes to 0% once median latency exceeds the client's timeout. With
load shedding, goodput **plateaus and stays flat** instead of collapsing: the system deliberately
rejects the excess, keeping the accepted subset fast and available, at the cost of a rejection rate
that rises with excess load. Quoted directly: **"the goal of load shedding is to keep latency low
for the requests that the server decides to accept... With this approach, the server maintains
high availability for the requests it accepts, and only the excess traffic's availability is
affected."**
[d1.awsstatic.com/builderslibrary/pdfs/using-load-shedding-to-avoid-overload.pdf](https://d1.awsstatic.com/builderslibrary/pdfs/using-load-shedding-to-avoid-overload.pdf)

**The positive feedback loop that makes this urgent, not optional, per the same article and Google's
"Addressing Cascading Failures" chapter (both converge on the identical mechanism, T1+T2):** an
overloaded system gets slower; slower responses mean clients (or upstream retriers) hold resources
longer per request; that increases concurrent in-flight work; that makes the system slower still.
Google's chapter names the specific resource-exhaustion variant: less available CPU leads to
slower requests, which leads to more requests queued in memory, which leads to more garbage
collection, which leads to even less available CPU. Both sources independently name **retries
without backoff as the single most common accelerant** of this loop: a client retrying against an
already-overloaded backend adds load on top of load, precisely when the backend can least afford
it, potentially delaying recovery "long after the original issue is resolved" (Brooker's phrase,
Section 1).

**What actually decides what to reject, per the same primary source:** ping/health-check requests
from a load balancer get top priority, explicitly, because failing those causes the load balancer
to pull the instance from rotation entirely, the worst outcome; beyond that, request criticality
varies by service (Yanacek's example: search-crawler traffic for a page render is lower priority
than a real user request and can be shed first, or deliberately not provisioned for at all,
trading cost for graceful, non-critical unavailability under specific named conditions). Google's
chapter's version of the same idea is the four-tier `CRITICAL_PLUS` / `CRITICAL` / `SHEDDABLE_PLUS`
/ `SHEDDABLE` classification described in Section 3.

**Where backpressure fits as the client-side mirror of load shedding:** load shedding is what a
server does to protect itself; backpressure is what a caller does in response, slowing down or
stopping new work rather than blindly firing more requests at a struggling downstream. Google's
client-side adaptive throttling (Section 3) is the backpressure half of this same picture: track
your own success rate against a dependency and throttle your own outgoing calls before the
dependency even asks you to.

**Solen's actual shape, and the honest scale call.** Solen already has one real backpressure
mechanism in production: `lib/ratelimit.ts`'s Upstash-backed sliding-window limiters (per-route,
per-user or per-IP), which is genuinely load shedding at the edge, rejecting excess *client*
requests before they consume a booking/payment/auth resource, with a deliberately asymmetric
fail-open/fail-closed design already documented in `_docs/BACKEND.md:707` (most limiters fail open
if Upstash is unconfigured, but a named `ABUSE_PRONE_LIMITERS` set fails **closed** with a
synthetic 429 specifically in a real production boot, which is exactly the right call for
payment/auth/booking routes: shed load rather than risk an abuse-prone route running unprotected).

Beyond that, at ~28 salons with low, non-bursty traffic, **the Universal-Scalability-Law collapse
this section is about does not apply to Solen's own compute today.** Solen has never load-tested
itself to find its own goodput-collapse point, and at current traffic there is no evidence it is
anywhere near one. What Solen genuinely has, right now, is the *inverse* problem: it is a caller,
not a callee, most of the time, meaning the load-shedding lessons in this section apply less to
"protect Solen's own servers from overload" (premature, see below) and more to "don't blindly hammer
Stripe/Resend/Mapbox/Gemini with retries if THEY start rejecting us," which is exactly Section 1
and 3's territory, restated from the receiving end.

---

## 9. Third-party failure modes: what happens to Solen when each dependency is slow or down

Per-dependency, verified against Solen's actual code, not assumed from the vendor's brand
reputation.

### Stripe (payments, Connect payouts). Hard dependency, cannot be degraded away.

If Stripe is down or slow, checkout is down; there is no meaningful degrade path for "take
someone's money" other than "don't take it and tell them to try again." What Solen already gets
right: every money-moving call goes through an idempotency-keyed chokepoint (Section 2), so a
Stripe-side timeout on Solen's end that actually succeeded server-side does not get double-applied
on retry. Stripe's own webhook retry behavior (T2, fetched via search, industry-consistent):
Stripe retries a failing webhook endpoint for **up to 3 days with exponential backoff** in live
mode (roughly: immediately, ~5 min, ~30 min, ~2h, ~5h, ~10h, then every ~12h, approximately 16
attempts total before giving up and disabling the endpoint with a notification). Solen's webhook
handler is itself idempotent (`processed_webhook_events` primary-key claim, `_docs/BACKEND.md:278`),
which is exactly what's needed to safely receive Stripe's own retries without double-processing.
**Gap, unverified in this run:** `lib/stripe.ts` sets no explicit `timeout` or `maxNetworkRetries`
on the SDK client, so Solen runs on the SDK's undocumented (in this run) defaults rather than a
deliberately chosen number.

### Supabase (Postgres + Auth + Storage). Hard dependency for almost everything.

Verified directly from Supabase's own docs (T1): Postgres's own **`statement_timeout` defaults per
role are anon=3s, authenticated=8s** (service_role defaults to the authenticator role's 8s if
unset), confirmed at
[supabase.com/docs/guides/database/postgres/timeouts](https://supabase.com/docs/guides/database/postgres/timeouts).
Solen has **never overridden these** (zero hits for `statement_timeout` across all 264 migrations,
confirmed by grep), meaning every one of Solen's own queries already runs under an enforced,
platform-provided ceiling whether or not Solen's own code sets one. This is a genuinely good,
free floor: any pathological query gets killed by Postgres itself at 3s/8s, which is also Solen's
de facto bulkhead against one bad query path exhausting the shared pooler (Section 5). On backups:
Supabase's own docs (T1, fetched directly) confirm **Point-in-Time Recovery is a paid add-on**
(Pro/Team/Enterprise, ~$100/mo per 7-day window, billed hourly), not included by default, and
`_plans/OPS_RUNBOOK.md` (cited in `_docs/BACKEND.md:811`) records PITR as **currently disabled** on
Solen's live project, meaning the in-house nightly `db-backup` cron export
(`lib/backup/export.ts`, 24 tables, 14-day retention) is Solen's **only** restorable backup path
today, a real, already-flagged gap, not new here.

### Resend (transactional email). Degradable, and mostly already treated that way, with one gap.

Verified directly from Resend's own docs (T2, fetched via search): default rate limit is **10
requests/second per team**, returning 429 on breach, with separate daily/monthly quota errors also
returning 429. None of this should ever block a booking: a booking confirming and an email sending
are two different concerns. Solen's crons already largely treat email as best-effort (e.g.
`sms-reminders` marks its own send flags `true` even when the underlying send fails, deliberately,
"to avoid retry loops on a permanently-bad number," per `_docs/BACKEND.md:590`, correctly choosing
"skip forever" over "retry forever" for a hard failure). **The one real gap, already named in
Section 1: `sendEmail()` itself has no timeout**, so a hung (not failed, hung) Resend call is not
degraded gracefully today, it just occupies the invocation until something else (the platform's
function ceiling) kills it.

### Upstash (Redis, used only for rate limiting). Degradable by explicit design, already good.

Verified from Upstash's own docs (T2, fetched via search): the JS SDK defaults to **5 retries**
with a backoff function on transient failures; the REST API (not a persistent TCP connection,
which matters specifically because Solen is serverless and a persistent Redis connection per
invocation would be its own reliability problem) returns clear HTTP status codes (400/401/405) on
real errors. Solen's own `lib/ratelimit.ts` (Section 8) already has the correct asymmetric
fail-open/fail-closed design: most limiters fail open if Upstash is unreachable or unconfigured
(rate limiting is a nice-to-have, not availability-critical, for most routes), except a named
abuse-prone set that fails closed in real production. This is a genuinely well-designed
degrade path already.

### Mapbox (geocoding). Degradable, already partially done. Also: the scope brief's naming needs
a direct correction.

**The owner's brief for this file names "Google Maps" as a third-party dependency to analyze.
Verified by grep across the whole codebase: Solen's server-side geocoding dependency is Mapbox
(`NEXT_PUBLIC_MAPBOX_TOKEN`, called from `app/api/search/geocode/route.ts`), not Google Maps.**
"Google Maps" appears exactly twice in the codebase, both as a plain client-side deep link
(`https://www.google.com/maps/search/?api=1&query=...`) that opens in the user's own browser or
phone's Maps app when they tap "get directions"; this link is never fetched by Solen's own
servers, carries no API key, and has no server-side failure mode at all, because Solen never calls
Google's servers, the user's device does. **If Google Maps is down, nothing in Solen breaks**,
the user's own phone might fail to open directions, which is outside Solen's control or
responsibility. The real, verifiable dependency to reason about for "what happens when maps/geo
is slow or down" is **Mapbox**, and Solen already degrades it reasonably: each per-city geocode
request has an explicit 4-second `AbortController` timeout (Section 1), requests fire in parallel
via `Promise.all` so the timeout doesn't compound across served cities, and a Mapbox failure for
any one city logs and returns an empty candidate list for that city rather than throwing, so a
degraded Mapbox produces "no address suggestions right now," not a broken search page.

### Google's Generative AI (Gemini, vision + embeddings). Soft, non-critical, already correctly
degraded.

Not in the owner's original list by name but genuinely a third-party dependency Solen calls
(`@google/generative-ai`), worth including for completeness since two of Solen's degrade patterns
already target it. `app/api/salons/route.ts` races the embedding call against 500ms and always
falls through to lexical search either way (Section 1 and 6). `app/[locale]/inspo/[id]/page.tsx`'s
`ensureAIData` fails open, rendering the Inspo item without AI-generated description rather than
erroring the page (Section 6). Both are correct: Gemini enrichment is a quality-of-result feature,
never a hard dependency for the request to succeed.

---

## Decision candidates

| axis | options | when each wins | recommended for Solen | tier |
|---|---|---|---|---|
| Outbound call timeout | none / fixed guess / measured-percentile (Brooker method) | measured-percentile always wins once you can measure real latency; fixed guess only acceptable as a temporary stopgap before measuring | measured-percentile, retrofit `lib/email.ts` first (confirmed zero-timeout gap) | T1 |
| Retry safety | bare retry / idempotency-key retry / no retry | idempotency-key retry whenever the op has a side effect and you can key it (booking/payment/refund writes); bare retry only for genuinely read-only GETs; no-retry when a failure should surface immediately (e.g. a user-facing validation error) | idempotency-key retry at all money chokepoints (already true); add a lint/grep guard so it stays true | T1 |
| Retry storm control | retry-at-every-layer / retry-at-one-layer / token-bucket budget / circuit breaker | retry-at-one-layer suffices for a shallow, mostly-monolithic call graph (Solen's shape); token-bucket budget once traffic volume makes a fixed per-request cap meaningfully additive; circuit breaker only once a specific dependency has a track record of prolonged, correlated outages | retry-at-one-layer + capped, jittered backoff today; revisit token-bucket if traffic grows an order of magnitude | T1 (AWS + Google SRE converge) |
| Circuit breaker | build one now / defer | build now if a long-lived process is protecting a shared thread/connection pool from a chronically-flaky dependency; defer if the runtime is serverless/short-lived and timeouts+retries already cover the real risk | defer; Solen's serverless shape structurally weakens the pattern's core value proposition | T2 (reasoned from Solen's actual runtime, not from vendor default advice) |
| Resource isolation (bulkhead) | app-level pools / rely on platform-level isolation (DB statement_timeout, serverless per-invocation isolation) | app-level pools matter for a long-lived multi-tenant process; platform-level isolation suffices when each invocation already owns its own resources | rely on Supabase's `statement_timeout` as the de facto bulkhead; do not build app-level pools | T2 |
| Degrade path | fabricate a plausible fallback value / omit and show empty state / degrade to a lower-quality real result | fabricate: never (violates the project's own no-fabrication rule and AWS's fallback-risk evidence); omit: when there is truly nothing degraded to show; lower-quality-real-result: whenever a cheaper/faster real computation exists (lexical search instead of semantic, item-without-AI-description instead of full AI enrichment) | lower-quality-real-result where one exists (already the pattern in search + Inspo); omit otherwise; fix `metrics/global`'s fabricated fallback on next touch | T1 |
| Serverless "shutdown" handling | catch SIGTERM / idempotent-handler-plus-reconcile | catch SIGTERM only applies where you own a long-lived process with a registered extension; idempotent-handler-plus-reconcile is the only real option on a bare serverless function | idempotent-handler-plus-reconcile (already Solen's actual pattern for crons); stop reasoning in SIGTERM terms | T1 (AWS Lambda's own documented shutdown mechanics) |
| Load shedding surface | shed at the edge (rate limiter) / shed deep in business logic | edge-shedding is cheaper, simpler, and catches abuse before it costs a DB write or a Stripe call; deep-in-logic shedding only useful once you have identified a specific expensive, non-critical code path worth explicitly deprioritizing | edge (Upstash rate limiters), already Solen's pattern | T1 |

---

## Myths and traps

- **MYTH: "Circuit breakers are the standard fix for retry storms."** The most-cited primary
  source on this exact topic (Brooker's AWS article) explicitly treats circuit breakers as the
  *second* choice, after a token-bucket local retry budget, specifically because circuit breakers
  add hard-to-test modal behavior. The popularized narrative (circuit-breaker-as-default-answer)
  outruns what Amazon's own primary source actually recommends first.
- **MYTH: "A fallback code path is a safety net."** AWS's own postmortem (Section 6, the 2001
  Amazon.com cache-fallback outage) shows a fallback can be strictly worse than no fallback,
  because it is untested by construction (it only runs during the exact failure it's supposed to
  handle) and it can amplify the failure it was meant to contain.
- **MYTH (as applied to Solen specifically): "Google Maps is a third-party dependency we need a
  degrade strategy for."** Verified false by grep: Solen's server never calls Google Maps. The real
  dependency is Mapbox. Anyone auditing this file against "does Solen have a Google Maps degrade
  path" is asking the wrong question; the right one is Mapbox's.
- **Solen-specific trap: PostgREST/Supabase's default `statement_timeout` (3s/8s) is invisible in
  the code.** A future session reading `app/api/*/route.ts` and seeing no explicit timeout on a
  Supabase call might assume "no timeout is set here," when in fact Supabase enforces one at the
  platform level regardless. This is a genuine safety net, but it also means a query that needs
  more than 3s (anon) or 8s (authenticated) legitimately will fail with `57014 canceling statement
  due to statement timeout` and that failure can look like a bug in Solen's own code when it is
  actually the platform's default ceiling; know the number before debugging a mystery timeout.
- **Netlify/serverless trap: `export const maxDuration` is easy to forget, and its absence is
  silent.** A cron route with a real workload that occasionally exceeds Netlify's default
  synchronous limit does not fail loudly with "you forgot maxDuration"; it just gets killed
  mid-execution with a generic platform timeout, which then depends entirely on the handler's own
  idempotency (Section 7) to be safe. Only one of Solen's 20+ cron routes (`discovery-ai-backfill`)
  explicitly declares this, which is correct for that route's known-longer workload, but it means
  every other cron is implicitly betting its normal runtime never approaches the platform default.
- **Serverless trap: there is no `SIGTERM` handler to write, and reasoning as if there were wastes
  effort on a mechanism Solen's platform doesn't reliably grant to ordinary function code** (Section
  7). The correct target for engineering effort is idempotency and time-budgeting, not a shutdown
  hook.
- **Trap: "fail open" and "fail closed" are not a single global choice, they're per-dependency and
  per-route.** Solen's own `lib/ratelimit.ts` already gets this right (most limiters fail open,
  abuse-prone ones fail closed in real production); the trap is applying one policy uniformly to
  a new dependency without asking which failure mode (letting bad traffic through vs. blocking
  good traffic) is cheaper for that specific route.

---

## Premature at our scale

Advice that is correct at a larger scale, but a wrong investment for Solen today, plus the trigger
that should change the call. All of these are genuine tradeoffs (see Section 4/5/8's cost
discussion), not blanket dismissals.

- **A dedicated circuit breaker library/implementation** (Section 4). Correct once a specific
  dependency has a documented history of prolonged, correlated failures that timeouts and capped
  retries aren't containing, or once Solen runs a genuinely long-lived process holding a shared
  resource pool that needs protecting. **Trigger to revisit:** two or more incidents in the same
  quarter where a single flaky dependency (most likely candidate today: Resend, given its
  currently-missing timeout, or the Gemini vision call) causes repeat, correlated failures that a
  timeout alone doesn't resolve.
- **A token-bucket local retry budget** (Section 3, AWS's own preferred first fix ahead of a
  circuit breaker). Useful once retry traffic is a meaningful fraction of total load. **Trigger:**
  observed retry volume (once Solen has a shared retry helper to even measure this from) exceeding
  a noticeable fraction of normal request volume.
- **Application-level bulkheads (separate connection/thread pools per dependency)** (Section 5).
  Correct for a long-lived, multi-tenant process serving many concurrent requests off a shared
  pool. Solen's serverless, largely-one-request-per-invocation shape doesn't have the shared-pool
  problem this pattern solves, with the single exception of the Postgres connection pooler, which
  Supabase's own `statement_timeout` already partially covers. **Trigger:** evidence that one
  specific query path is measurably starving others through the shared pooler even with
  `statement_timeout` enforced.
- **Client-side adaptive throttling with a formal criticality system** (Section 3, Google's
  `CRITICAL_PLUS`/`CRITICAL`/`SHEDDABLE_PLUS`/`SHEDDABLE`). Built for a system with enough traffic
  and enough distinct request classes that shedding low-priority traffic first is a meaningfully
  different outcome from shedding at random. At 28 salons, Solen doesn't have distinguishable
  traffic classes at that granularity yet. **Trigger:** traffic volume high enough that Solen's own
  compute (not a third party) becomes the bottleneck, which current evidence does not show.
- **Formal load testing to find Solen's own goodput-collapse point** (Section 8). Genuinely
  valuable, and genuinely not yet done (no evidence any load test has been run against Solen's own
  API surface). Listed here as premature only in the sense of "not urgent before a real traffic
  event," not "never worth doing." **Trigger:** any concrete signal of approaching real capacity
  (rising p99 latencies under normal traffic, or a planned marketing push expected to spike
  traffic).
- **OpenTelemetry-style distributed tracing across the whole request lifecycle**, implicitly
  useful for diagnosing exactly which layer in a retry chain is slow. Solen's call graph is shallow
  enough (a monolith calling external HTTP APIs directly, not a deep internal service mesh) that
  `console.error` plus the existing `cron_runs` table and `lib/error-report.ts`'s throttled admin
  alert (already built, per `_docs/BACKEND.md:883`) covers the actual diagnostic need today.
  **Trigger:** the call graph growing an internal service-to-service hop (Solen splitting into more
  than one deployable backend), which is not currently planned.

---

## Unverified

- The Stripe Node SDK's exact **default** `timeout` and `maxNetworkRetries` values were not
  confirmed from a fetched Stripe source in this run (only that the SDK exposes both options,
  confirmed via the SDK's own bundled TypeScript definitions). Solen's `lib/stripe.ts` does not
  override either, so it is running on whatever that unconfirmed default is.
- Whether Netlify's own Lambda wrapper for `@netlify/plugin-nextjs` functions registers an internal
  Lambda extension (which would grant Solen's own route handlers the 300500ms `SIGTERM` window
  AWS documents for extension-bearing functions) was not directly confirmed from Netlify's own
  docs in this run; Section 7's conclusion (treat it as no shutdown window at all) is the safe
  assumption, not a confirmed fact about Netlify's internals specifically.
- The exact current Stripe webhook retry schedule (the specific intervals: ~5min, ~30min, ~2h,
  etc.) was sourced from search-engine-summarized third-party integration guides describing
  Stripe's behavior, not from a Stripe-published exact schedule; the "up to 3 days, exponential
  backoff, endpoint disabled after 3 days of failure" framing is corroborated across multiple
  sources and treated as T2, but the minute-by-minute schedule specifically is not Stripe's own
  documented number and should not be cited as if it were.
- Whether Solen's `lib/health.ts` `probeDb` retry follow-up (flagged as still-not-implemented in
  `_docs/BACKEND.md:849`, a single 2s-timeout attempt with no retry) has changed since that note
  was written was not re-verified in this pass; treated as still true per the cited doc, not
  independently re-checked against current `lib/health.ts` beyond confirming the file's current
  single-attempt shape (which was re-read in this run and does match the flagged description).

---

## Sources

- [builder.aws.com — Timeouts, retries, and backoff with jitter (Marc Brooker)](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter) , fetched full text via PDF. Established: the timeout-choice method (acceptable false-timeout rate against a latency percentile), the cold-connection timeout pitfall, retry-at-one-layer-only vs 243x multi-layer amplification, AWS's token-bucket preference over circuit breakers, and the jitter rationale.
- [d1.awsstatic.com — Avoiding fallback in distributed systems (Jacob Gabrielson)](https://d1.awsstatic.com/builderslibrary/pdfs/avoiding-fallback-in-distributed-systems.pdf) , fetched full text via PDF. Established: the four failure-handling strategies, the 2001 Amazon.com cache-fallback outage as a named production incident, and the "convert fallback into failover" alternative.
- [d1.awsstatic.com — Using load shedding to avoid overload (David Yanacek)](https://d1.awsstatic.com/builderslibrary/pdfs/using-load-shedding-to-avoid-overload.pdf) , fetched full text via PDF. Established: the Universal Scalability Law framing, the goodput-vs-throughput collapse graph, the positive-feedback-loop mechanism, and ping-request prioritization under brownout.
- [aws.amazon.com — Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) , fetched via search extraction. Established: the idempotency-token pattern (atomic check-and-record, parameter-mismatch rejection, bounded token retention).
- [sre.google/sre-book/handling-overload/](https://sre.google/sre-book/handling-overload/) , fetched directly. Established: client-side adaptive throttling formula (`requests >= K * accepts`), the four-tier criticality system, and the "overloaded; don't retry" signal.
- [sre.google/sre-book/addressing-cascading-failures/](https://sre.google/sre-book/addressing-cascading-failures/) , fetched via search extraction with direct quotes. Established: cascading-failure definition, resource-exhaustion feedback loop, ~60-retries/min/process budget, deadline propagation, N+2 capacity planning.
- [martinfowler.com/bliki/CircuitBreaker.html](https://martinfowler.com/bliki/CircuitBreaker.html) , fetched directly. Established: the closed/open/half-open state machine and the note that a real implementation needs per-error-type thresholds, not a single naive counter.
- [learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) , fetched full text. Established: the fuller state-machine description (time-windowed failure counting, consecutive-success half-open threshold), the explicit "when NOT to use this pattern" list, and the "inappropriate timeouts defeat the breaker" caveat.
- [learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead) , fetched full text. Established: the resource-exhaustion problem statement, the per-dependency pool-partitioning solution, and the "when NOT to use" list.
- [en.wikipedia.org/wiki/Circuit_breaker_design_pattern](https://en.wikipedia.org/wiki/Circuit_breaker_design_pattern) , fetched directly. Established: the foundational three-state definition as a cross-check against Fowler and Azure.
- [www.rfc-editor.org/rfc/rfc7231.html](https://www.rfc-editor.org/rfc/rfc7231.html) , fetched directly, section 4.2.2. Established: the formal definition of HTTP method idempotency and the exact classification (GET/HEAD/PUT/DELETE/OPTIONS/TRACE idempotent, POST not).
- [docs.stripe.com/api/idempotent_requests](https://docs.stripe.com/api/idempotent_requests) , fetched directly. Established: the `Idempotency-Key` header contract, 24-hour key retention, and parameter-mismatch rejection behavior.
- [supabase.com/docs/guides/database/postgres/timeouts](https://supabase.com/docs/guides/database/postgres/timeouts) , fetched directly. Established: default `statement_timeout` per role (anon 3s, authenticated 8s, service_role inherits 8s if unset, postgres capped at 2 min globally), and how to override at role/database/session/function level.
- [supabase.com/docs/guides/platform/backups](https://supabase.com/docs/guides/platform/backups) , fetched directly. Established: PITR is a paid add-on (Pro/Team/Enterprise only), Free tier has no automatic backups, and how restore works.
- [docs.netlify.com/build/functions/background-functions/](https://docs.netlify.com/build/functions/background-functions/) plus corroborating forum search , fetched directly + search. Established: synchronous function default 10s / max 26s on paid plans, background functions up to 15 minutes.
- [resend.com/docs/api-reference/rate-limit](https://resend.com/docs/api-reference/rate-limit) , fetched via search extraction. Established: default 10 req/sec/team rate limit, 429 on rate and quota breaches.
- [upstash.com/docs/redis/features/restapi](https://upstash.com/docs/redis/features/restapi) , fetched via search extraction. Established: REST-based (not persistent-TCP) client model appropriate for serverless, default retry counts and backoff behavior.
- AWS Lambda shutdown-lifecycle documentation (via search, converging across multiple sources including `github.com/aws-samples/graceful-shutdown-with-aws-lambda`) , established: no shutdown window without a registered extension; 300500ms window plus a 2000ms total budget when an extension is registered, before SIGKILL.
- Stripe webhook retry behavior (via search, multiple converging third-party integration guides) , established: up to 3-day exponential-backoff retry window in live mode, endpoint auto-disabled after 3 days of continuous failure.
- Solen's own codebase, read directly this run (not a memory recall): `_docs/BACKEND.md`, `middleware.ts`, `lib/health.ts`, `lib/email.ts`, `lib/stripe.ts`, `lib/ratelimit.ts`, `lib/cron-run.ts`, `app/api/search/geocode/route.ts`, `app/api/cron/*/route.ts` (grepped for `runtime`/`maxDuration`), and a full-codebase grep for `circuitBreaker`/`retry helper`/`google maps`/`mapbox`/`statement_timeout`. Established every Solen-specific claim in this file, including the confirmed absence of any circuit-breaker or shared retry utility, the confirmed Mapbox-not-Google-Maps correction, and the confirmed missing timeout in `lib/email.ts`.
