# `RATIONALE.md` , the WHY behind the backend law

`LAW.md` is the frozen WHAT: short, scannable, one row per decision. This is the reasoning: the forces, the tradeoff, the cost each row pays. **It is never a lever to reopen a lock.** If you want to argue with a row, argue here first, then take it to the owner by name.

Full primary sources: `research/<topic>.md` (15 files, ~900KB, ~460 cited sources).

## Section 0. Evidence tiers

| tier | meaning |
|---|---|
| **T0** | Verified directly against OUR code or live DB. The strongest tier here: a fact about us, not a claim about the world |
| **T1** | Formal standard or replicated consensus: an RFC, NIST SP 800-63B, OWASP, official Postgres/Stripe docs, a peer-reviewed paper |
| **T2** | One strong source, or two independent sources converging |
| **T3** | Directional only: a vendor blog, a single benchmark. Verify on our own data before trusting the magnitude |
| **CONV** | A named convention: a coordination device with a domain of validity, not an empirical truth |
| **MYTH** | Debunked, stale, or fabricated. Named so nobody cites it again |

**A rule with no source is folklore. A rule with no stated cost is a slogan. Both are banned.**

---

## The decisions, with their forces

### Money is integer minor units
**FORCES:** binary floats cannot represent 0.1 exactly; money errors are silent and compound. **OPTIMIZES FOR:** never being wrong by a rounding error. **SACRIFICES:** ergonomics (every read/write converts). **BOUNDARY:** our live DB runs two conventions (integer Rappen and `numeric(x,2)`), and they agree exactly on every sampled row. **MECHANIC:** `numeric` is exact decimal, so it is defensible; `real`/`double` is not. **SOURCE:** T1 + T0 live query. **The cost of the lock:** we accept a documented inconsistency rather than a risky migration on live money tables. See `QUESTIONS.md` Q3.

### Prove behaviour, not existence (the ONE law)
**FORCES:** PostgREST returns `error: null` on a zero-row UPDATE and silently nulls a phantom-column select; a green cron proves the wrapper ran, not that work happened. **OPTIMIZES FOR:** catching the failure mode that has cost this project the most. **SACRIFICES:** every consequential write needs an extra round-trip to confirm. **BOUNDARY:** it ranked as the top finding in **7 of 15 topics independently**, so it is stated once centrally rather than seven times. **SOURCE:** T1 + repeated T0 incidents.

### RBAC + RLS, not ABAC/ReBAC
**FORCES:** authz architecture is where training data most over-recommends for scale we do not have. **OPTIMIZES FOR:** an authz model one person can hold in their head. **SACRIFICES:** cross-org sharing and per-staff-per-salon permissions are unexpressible today. **BOUNDARY:** the first real ReBAC-shaped requirement (a staff member with different permissions across multiple salons) has not arrived. **SOURCE:** T2/CONV.

### Read Committed stays the default
**FORCES:** Serializable is "safer" in the abstract and worse in practice without a retry wrapper. **OPTIMIZES FOR:** predictable behaviour, no surprise 500s. **SACRIFICES:** you must think at each chokepoint instead of buying blanket safety. **MECHANIC:** Serializable raises `40001` on conflict; unhandled, that is a raw uncaught 500. **SOURCE:** T1.

### Forward-only migrations
**FORCES:** a mechanical `down` against live data silently discards rows written since the up. **OPTIMIZES FOR:** never destroying data during a rollback. **SACRIFICES:** you cannot "just undo"; you must fix forward. **BOUNDARY:** down migrations are a real safety net **pre-traffic only**. **SOURCE:** T2. **T0:** genuinely followed, 0 down migrations across 264 files.

### No versioning scheme
**FORCES:** "APIs should be versioned" is a reflex that buys real ongoing overhead. **OPTIMIZES FOR:** not paying for a problem we do not have. **SACRIFICES:** if a partner API ever ships, this must be revisited before the first external consumer. **BOUNDARY:** T0, no third-party API exists. **MECHANIC:** we coordinate through the mobile release cadence instead.

### Do not build a circuit breaker
**FORCES:** it is the reflex answer to retry storms. **OPTIMIZES FOR:** not maintaining machinery whose value is structurally weaker on serverless (there is no long-lived pool to protect). **SACRIFICES:** if one dependency turns genuinely flaky, we will feel it before we have a breaker. **MECHANIC:** AWS's own source ranks it SECOND, after a token-bucket retry budget. **SOURCE:** T1/T2. **Timeouts + capped jittered retries cover our actual risk at 28 salons**, and we do not even have the timeouts yet (see `audit/reliability.md`), which is the honest reason a breaker would be premature: **you cannot circuit-break what you never bounded.**

### Alert on symptoms, not causes
**FORCES:** cause-alerts are easy to write and train the reader to ignore them. **OPTIMIZES FOR:** the founder still trusting an alert in six months. **SACRIFICES:** symptom alerts need a rate computation, which is real work. **BOUNDARY:** alert fatigue is hard to reverse once trained. **SOURCE:** T1 (Google SRE, Ewaschuk).

---

## The myth table , never cite these again

Every one appeared in a source, a habit, or a plausible-sounding recollection, and every one is wrong. **If you catch yourself about to say one of these, stop.**

| # | myth | the truth |
|---|---|---|
| 1 | "The error came back null, so the write happened" | PostgREST returns `error: null` on a **zero-row** UPDATE. Check the affected row count |
| 2 | Supabase gives you transactions across a page of `.from()` calls | One call = one transaction. Multi-write atomicity needs an `.rpc()` |
| 3 | "Exactly-once delivery" is achievable | Marketing for at-least-once + an idempotent consumer. Two Generals/FLP |
| 4 | A migration that runs successfully means the feature works | PostgREST's schema cache can still be stale. Verify with a live API call |
| 5 | Down migrations are a safety net | Only pre-traffic. Against live data they silently discard rows |
| 6 | UUIDs make an endpoint safe from IDOR | OWASP: supplementary, **never** a substitute for an authz check |
| 7 | RLS still protects me underneath the admin client | **False.** `BYPASSRLS` is a Postgres role attribute. RLS does not apply at all |
| 8 | A passed role check means the request is authorized | Vertical != horizontal. It says nothing about whether THIS caller may touch THIS row |
| 9 | Middleware/edge auth is enough | CVE-2025-29927 proved the Next.js edge layer spoofable |
| 10 | Composition rules make passwords stronger | NIST SP 800-63-4 (July 2025) **explicitly rejects** them |
| 11 | "NIST caps failed logins at 10" | **The ceiling is 100.** This was a real secondhand-search error caught in our own research |
| 12 | SameSite cookies solved CSRF | Not state-changing GETs, not sibling-subdomain abuse, not client-side CSRF via XSS |
| 13 | SMS OTP is a fine MFA factor | NIST restricts it: SS7/SIM-swap |
| 14 | JWTs don't need a database, so they scale better, full stop | Only if you never revoke early |
| 15 | Escaping user input is basically as good as parameterizing | OWASP rates escaping "STRONGLY DISCOURAGED" |
| 16 | OWASP Top 10 is the 2021 list | **Superseded Nov 2025** |
| 17 | A wildcard CORS origin is itself the vulnerability | Orthogonal to authz. The missing auth check is the hole |
| 18 | pgsodium is the modern way to encrypt PII in Supabase | **Supabase itself says do not.** It is deprecating |
| 19 | The file's Content-Type tells you what kind of file it is | Trivially client-spoofed. Magic bytes or nothing |
| 20 | A signed URL is about as safe as a login-gated page | No revocation, no identity check. It is a bearer token |
| 21 | Private bucket = safe, whatever the app code does | Only if **every** path signs. `.getPublicUrl()` on a private bucket is broken |
| 22 | RLS matters for reads on a public bucket | It does not. The `public` flag bypasses it |
| 23 | Next.js `fetch()` is cached by default | True in 14. **False in 15**, which is what we run |
| 24 | Postgres has a query cache we can turn on | No such feature. `shared_buffers` is page caching |
| 25 | `Vary: Cookie` is the correct fix for personalized caching | **Explicitly the wrong one** per MDN |
| 26 | Netlify Blobs is a safe shared cache across concurrent invocations | Eventually consistent, last-write-wins, no concurrency control |
| 27 | `console.error` with a bracketed prefix is basically structured logging | No request id, no trace id. Correlation is impossible |
| 28 | Our logs are our audit trail | Netlify retention is 24h to 7d. Log Drains are Enterprise-only |
| 29 | 100% uptime is the right target | Google SRE: chasing it actively harms velocity |
| 30 | Liveness/readiness probes are just good practice everywhere | A Kubernetes idiom. There is no long-lived process on Netlify |
| 31 | OpenTelemetry is simply the modern default | CONV. Its own governance committee admits real adoption friction |
| 32 | Circuit breakers are the standard fix for retry storms | AWS's own source ranks them **second**, after a retry budget |
| 33 | A fallback code path is a safety net | AWS's 2001 Amazon.com postmortem: it can be **strictly worse** than none |
| 34 | Fail-open vs fail-closed is one global choice | It is per-dependency, per-route |
| 35 | `SKIP LOCKED` turns any table into a queue for free | Only helps concurrent-consumer contention, which we do not have |
| 36 | GitHub Actions' `schedule` is a reliable clock | Explicitly best-effort, with no overlap protection |
| 37 | A webhook switch with no `default:` case is a bug | It is correct. The missing **log line** is the gap |
| 38 | Disable Next's bodyParser for the webhook route | Stale Pages Router advice. App Router never auto-parses |
| 39 | A wider webhook timestamp tolerance is more secure | Backwards. Wider = a longer replay window |
| 40 | Blocking by IP stops credential stuffing | Trivially circumvented via proxies + CGNAT |
| 41 | A soft-delete flag satisfies GDPR erasure | Still fully re-identifiable data |
| 42 | Encryption at rest protects us from a leaked credential | It does not |
| 43 | "We have backups" because the cron reports success | That proves the write path only. **An untested backup is not a backup** |
| 44 | `pg_dump` nightly is basically PITR, just less granular | Structurally different mechanisms |
| 45 | Postgres `money` type is a reasonable modern choice | Locale-dependent. Community consensus: avoid |
| 46 | Vercel's caching/deployment behaviour applies to us | **We are on Netlify.** This one bites constantly |
| 47 | Google Maps is a third-party dependency we must degrade | Verified FALSE by grep. The server never calls it; the real dependency is **Mapbox** |

---

## The "premature at our scale" register

**Adopting big-company machinery early is itself a failure mode, not caution.** Solen runs ~28 salons; the biggest table is `bookings` at **957 rows**. Each item below has the trigger that would change the answer. **Do not build these. If you think you need one, check the trigger first.**

| do NOT build | trigger that changes the answer |
|---|---|
| BRIN indexes | A 10M+ row, time-ordered, append-only table. We have 957 |
| UUIDv7 / ULID migration | A PK index no longer fitting in cache. Even then it is new-tables-only, never a retrofit |
| Schema-per-tenant / DB-per-tenant | One tenant big enough to justify losing cross-salon search. 28 similar salons make this a regression today |
| Event-sourced money ledgers | A real external audit requirement naming it |
| Serializable-everywhere + retry middleware | A measured, repeated write-skew bug that chokepoint locks did not catch |
| A raw `pg`/Prisma driver "for perf" | A measured bottleneck. Naive addition on serverless is the textbook connection-exhaustion outage |
| A Redis distributed-lock service | `pg_advisory_xact_lock` already does this for free |
| Batched-migration job systems, dual-write comparison harnesses | Tables large enough that a backfill cannot run in one pass |
| Supabase PITR add-on (~$100+/mo) | Real revenue, or an actual undetected same-day-corruption incident |
| A separate immutable backup store (Object Lock) | The first genuinely irreplaceable dataset, or a compliance demand |
| SAML / enterprise SSO | A B2B customer asking for it |
| Passkeys as PRIMARY login | Supabase's support leaving beta |
| Risk-based / adaptive authentication | Enough traffic and fraud signal to tune it |
| OpenFGA / SpiceDB / OPA / Cedar / full ABAC | A staff member needing different permissions across MULTIPLE salons, or a partner/agency layer |
| A full OpenAPI spec, a versioning scheme, a Sunset/Deprecation pipeline | The first third-party/partner API consumer |
| Mass RFC-9457 migration of all error responses | Nothing. Adopt on new/touched routes only |
| A secrets vault (Vault/AWS SM) | A second team member, or a real rotation requirement |
| Field-level PII encryption | **Never via pgsodium** (Supabase is deprecating it). A named compliance demand |
| Automated AV/malware scanning on uploads | User-to-user file sharing |
| A full CSP nonce pipeline on day one | Nothing. Start with a domain allowlist, report-only |
| Distributed / multi-region rate limiting | Multi-region origin compute |
| ML bot scoring, JA3 fingerprinting, CAPTCHA everywhere | A documented, repeated scripted-abuse incident. **Not a hypothetical one** |
| A real broker (SQS/QStash/Kafka), Postgres-as-a-queue with SKIP LOCKED, a literal outbox table, a formal DLQ topic | Concurrent consumers, which we do not have |
| A dedicated CDN/S3/R2 in front of Supabase Storage | A measured egress or latency problem |
| Redis stampede locks, XFetch, a general Redis response cache, Netlify Durable Cache, cache-tag purging | An endpoint observed under stampede-level load. None has been |
| Materialized views | A specific query measured slow AFTER indexing |
| Prometheus/Grafana/Datadog, RED+USE dashboards, multi-window burn-rate alerting | Traffic where checking the already-paid Supabase/Upstash dashboards stops sufficing |
| Error-budget POLICY machinery (automated release freezes) | More than one person shipping regularly |
| The OpenTelemetry SDK + Collector | A second deployable backend service. **The cheap piece (a `traceparent`-shaped request id) is NOT premature** |
| A cryptographic audit-ledger PRODUCT | A named compliance regime or an FDPIC inquiry. **A plain Postgres `audit_log` table is NOT premature, and we already have one** |
| A circuit-breaker library, a token-bucket retry budget, app-level bulkheads, adaptive throttling | Two incidents in a quarter where one flaky dependency causes repeat correlated failures a timeout alone does not fix |
| Formal load testing | Rising p99 under normal traffic, or a planned marketing push |
| Sentry | **Nothing.** It was scaffolded and deliberately removed. PostHog is already paid and wired |
