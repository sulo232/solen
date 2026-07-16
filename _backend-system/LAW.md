# `LAW.md` , the frozen backend decisions

<!-- exists-check 2026-07-16: net-new. `npm run exists backend` = 18 hits, all graveyard + 2 RPCs, zero law-layer hit. This file duplicates nothing: `_docs/BACKEND.md` is DESCRIPTIVE (how our plumbing works today), `_rules/*` are undated fragments at precedence tier 8, `_plans/*_BACKEND_AUDIT.md` are dated findings. This is the PRESCRIPTIVE layer: what a backend decision SHOULD be. -->

**Why this exists (owner, 2026-07-16):** "we have a taste bible for the front end, maybe make one for the back end, because it keeps making stuff up when I open a new session."

A fresh session can learn *how* our plumbing works from `_docs/BACKEND.md`. Nothing told it what to **decide**. So it decided from training memory: an invented error shape, a re-litigated primary-key choice, a "best practice" that was current three years ago. This file is the answer.

**How to use it:** read this file. It is short on purpose. Need the reasoning, or want to argue with a row? **`research/<topic>.md`** , the full primary-sourced file behind it, one per topic. Need to know whether we actually FOLLOW a row today? `audit/<topic>.md` (8 of 15 exist, see "Honest coverage" at the bottom). Need to know how the system is wired? `_docs/BACKEND.md`.

> `RATIONALE.md` (the distilled forces/tradeoffs layer, mirroring `_design-system/RATIONALE.md`) is **not written yet**, and neither are `AUDIT_2026-07-16.md` or `QUESTIONS.md`, though `README.md`'s layer map names all three. Until they exist, `research/<topic>.md` IS the reasoning layer. Do not chase those filenames.

**Do not reopen a row without the owner saying so by name.** Where a row and an old `_rules/*` line disagree, this file wins and the `_rules` line is history.

**Evidence tiers:** **T0** verified directly against OUR own code or live DB this session (the strongest tier here: it is a fact about us, not a claim about the world) · **T1** formal standard / replicated (RFC, NIST, OWASP, Postgres/Stripe docs) · **T2** one strong source or converging independents · **T3** directional, verify on our own data · **CONV** a named convention, a coordination device not a truth · **MYTH** debunked, never cite.

**Scale caveat, load-bearing:** Solen runs ~28 salons. Most published backend advice targets companies three orders of magnitude larger. **Adopting big-company machinery early is itself a failure mode, not caution.** Every topic carries a "premature" line naming the trigger that would change that.

**GATED** on a row means a hook physically blocks the violation. The marker in brackets is the inline escape hatch when you genuinely mean it: write `// cas-ok: <reason>` and the gate stands down. An escape with no reason is a smell.

**GATED (new routes only)** means the hook fires on `Write` (a brand-new file) but NOT on `Edit`/`MultiEdit` of an existing one. Read that qualifier literally: since this project mandates surgical edits, **the common path of adding the violation to an EXISTING route is not blocked.** The scoping is deliberate, not laziness: wired on Edit, those two gates denied 34-45% of legitimate existing routes, and a gate that cries wolf gets disabled, after which nothing is enforced. The row is still law on every route; only the enforcement is partial. Do not read "GATED" as "the machine will catch me."

---

## 0. THE ONE LAW (if you read nothing else)

> **A control that returns 200 has proven nothing. Prove BEHAVIOR, not existence.**

This is the house's #1 failure mode and it recurred as the top-ranked finding in 7 of the 15 research topics independently: data-modeling, transactions, migrations, authz, file-storage, jobs-async, webhooks. It wears different costumes:

- PostgREST returns `error: null` on a **zero-row** UPDATE. The lost race reports success.
- PostgREST **silently nulls** a select on a column that does not exist. The homepage went blank for weeks.
- A cron reports `ok: true` on a night **every Stripe call failed**, because it counted failures in a field the wrapper never read.
- Storage RLS **fails closed silently**: `review-photos` returned `200 {success:true}` for months while writing nothing.
- A migration applies cleanly and the feature is still broken, because **PostgREST's schema cache** had not reloaded.

A filter must **discriminate** (return a correct subset), not merely render. A column must appear in the **live snapshot** (`npm run exists <col>`), not merely in a TS type. A write must be confirmed by **affected-row count**, never by `error === null`.

---

## 1. Data modeling & storage

| axis | LOCKED | tier |
|---|---|---|
| money | **integer minor units (Rappen). Never float. Never Postgres `money`.** Legacy tables already violate this: do not copy them. | T1 |
| write confirmation | **Every consequential write checks affected-row count.** `error === null` is not proof. | T1 |
| RLS | **Enabled on every table, no exceptions.** Wrap `auth.uid()` as `(select auth.uid())`: the bare call costs 94-99% at scale (Supabase's own benchmark). | T1 |
| timestamps | **`timestamptz` for every instant. Never bare `timestamp`.** | T1 |
| status columns | **`text` + `CHECK`. Never a native Postgres `ENUM`.** `ALTER TYPE ... ADD VALUE` cannot run inside a transaction block, which breaks migration tooling the moment a status grows a value. | T1 |
| primary keys | **UUIDv4 (`gen_random_uuid()`).** Do not chase UUIDv7/ULID/bigint. Biggest table is ~9,400 rows: the cache-locality problem they solve does not exist here yet. | T2 |
| day keys | **`opening_hours` is SHORT-day-keyed (`mon`..`sun`).** Long day-names returned empty everywhere for weeks. | T0 |

**Premature:** BRIN indexes (need 10M+ rows), UUIDv7 migration, schema-per-tenant, a Redis read-cache, event-sourced money ledgers.
**Myths:** UUIDs make an endpoint IDOR-safe (OWASP: supplementary, never a substitute) · a soft-delete flag satisfies GDPR erasure (still re-identifiable) · Postgres `money` is a reasonable modern choice.

## 2. Transactions & concurrency

| axis | LOCKED | tier |
|---|---|---|
| transaction unit | **One `.from()`/`.rpc()` call = one transaction.** Multi-write atomicity REQUIRES a Postgres function via `.rpc()`. There is no client-side multi-statement transaction. | T1 |
| CAS | **Every compare-and-swap UPDATE checks the row count.** `.eq(<precondition>)` + `.select("id").maybeSingle()`, branch on null. | T1 · **GATED** [`cas-ok:`] |
| isolation | **Read Committed stays the default.** Get atomicity from explicit patterns at chokepoints, never a project-wide bump. Serializable without a `40001` retry wrapper produces raw uncaught 500s. | T1 |
| locks | **Pessimistic locks live inside a single-transaction RPC.** Never spread across client calls. **Never held across a slow external call** (Stripe): it serializes every other request on that key. | T1 |
| lock ordering | **Consistent order wherever 2+ locks are ever taken together.** CI cannot catch a deadlock; only production collision reveals it. | T1 |
| data access | **supabase-js/PostgREST is the only path.** A raw `pg`/Prisma driver on serverless is the textbook connection-exhaustion outage; if ever added it MUST use Supavisor transaction mode with prepared statements disabled. | T1 |

**Premature:** Serializable-everywhere + retry middleware, a raw driver "for perf" with no measured bottleneck, a Redis lock service (`pg_advisory_xact_lock` is free).
**Myths:** Supabase gives transactions across a page of `.from()` calls · "the error came back null, so the write happened" · check-then-act is fine if the two lines are close together.

## 3. Migrations

| axis | LOCKED | tier |
|---|---|---|
| direction | **Forward-only. Never a `down` migration against production.** Genuinely followed today: 0 down migrations across 264 files. | T2 |
| structural change | **Expand / migrate / contract.** Schema (Supabase) and code (Netlify) deploy on separate timelines, so a single-step change creates a real disagreement window. | T1 |
| new constraint | **`ADD CONSTRAINT ... NOT VALID`, then a separate `VALIDATE CONSTRAINT`.** The plain form takes `ACCESS EXCLUSIVE` for a full scan. | T1 |
| new index | **`CREATE INDEX CONCURRENTLY`** on any table with rows. Bare form blocks writes for the whole build. | T1 |
| add column | **Constant/NULL default only.** A volatile default (`now()`, `gen_random_uuid()`) silently triggers a full table rewrite under `ACCESS EXCLUSIVE`. | T1 |
| seed data | **Never synthesize a display value.** No `hashtext()`/`random()`-derived writes to a column customers read. Seed `is_test = true` rows, or leave NULL until self-reported. | T1 · **GATED** [`seed-ok:`] |
| proof | **Verify via a live API call.** "Migration applied" is not proof PostgREST sees the new shape. | T1 |
| applying | **Additive, idempotent `apply_migration` only. NEVER `supabase db push` / `db reset`.** | T0 |

**Premature:** batched-migration job systems (GitLab's machinery), offline snapshot backfills, dual-write comparison harnesses, blue-green schema swaps.
**Myths:** a migration that runs means the feature works · down migrations are a safety net (only pre-traffic) · the "3-release cadence" is law (it is GitLab's cadence; the two underlying rules are the law).

## 4. Backup & recovery

| axis | LOCKED | tier |
|---|---|---|
| the rule | **An untested backup is not a backup.** Our restore procedure has NEVER been executed end to end. | T1 |
| RPO/RTO | **Explicit, written, TESTED numbers.** The `~1-2h` in `_plans/OPS_RUNBOOK.md:16` is a guess, never timed. | T1 (NIST SP 800-34) |
| export vs PITR | **`pg_dump`/row export is NOT PITR.** No cadence makes it so. | T1 |
| coverage | **The nightly export covers 24 of 146 live tables**, a deliberate subset. Everything else has zero app-level backup. Do not assume "we back up the DB". | T0 |
| blast radius | **The backup credential and the live-DB credential are the same service-role key.** A leak reads AND deletes both. Encryption-at-rest does not help. | T2 |

**Premature:** the PITR add-on (~$100+/mo) until real revenue or an actual same-day-corruption incident, a separate immutable store with Object Lock, a write-only backup credential, hot standby, tabletop DR ceremony.
**Myths:** "we have backups" because a cron reports success (proves the write path only) · nightly dumps are basically PITR · encryption at rest protects against a leaked credential · 3-2-1 is enough (now 3-2-1-1-0: immutable copy + verified restore).

## 5. AuthN

| axis | LOCKED | tier |
|---|---|---|
| identity | **`getUser()` server-side, ALWAYS. Never `getSession()` for an authz decision.** `getSession` trusts an unverified client cookie. Real discipline today: all 28 `getSession` hits are verified client-only. | T2 · **GATED** |
| password policy | **Length over composition.** ~10-15 char floor, NO forced uppercase/digit, NO rotation, breach-list check. NIST SP 800-63-4 (July 2025) explicitly rejects composition rules. Our signup schema currently violates this. | T1 |
| hashing | **Never hand-roll. Supabase Auth owns it.** If we ever hash our own secret: Argon2id > scrypt > bcrypt > PBKDF2, and bcrypt truncates at 72 bytes. | T1 |
| OAuth | **PKCE mandatory. Implicit flow banned. Redirect URIs exact-match.** Correct today only via the `@supabase/ssr` default: `flowType:"implicit"` silently regresses it. | T1 (RFC 9700) |
| password reset | **Revoke other sessions** (`signOut({scope:"others"})`). **CONFIRMED GAP:** an attacker's live session survives the victim's reset today. | T1 (OWASP) |
| MFA | **TOTP should gate the salon-owner/staff tier** (it sits next to Stripe Connect payouts). Absent entirely today despite Supabase shipping it free. | T2 |

**Premature:** SAML/enterprise SSO, DPoP/mTLS sender-constrained tokens, a custom session store, passkeys as PRIMARY login (Supabase support is beta), risk-based adaptive auth.
**Myths:** JWTs scale better, full stop (only if you never revoke early) · composition rules make passwords stronger · SameSite=Lax alone is full CSRF protection · SMS OTP is a fine MFA factor (NIST restricts it: SS7/SIM-swap).

## 6. AuthZ

| axis | LOCKED | tier |
|---|---|---|
| object-level check | **Every client-supplied ID gets an ownership check, on every route, IN ADDITION to any role check.** OWASP API1, #1 vuln two editions running. A passed role check says nothing about whether THIS caller may touch THIS row. | T1 · **GATED (new routes only)** [`ownership-ok:`] |
| the admin client | **`createAdminSupabaseClient()` has BYPASSRLS. RLS does NOT apply underneath it.** All **267 call sites** (across 234 route files) are hand-rolled, zero-backstop authz decisions. | T1 · T0 count |
| model | **RBAC (role column) + RLS ownership predicates.** Do NOT reach for ABAC or ReBAC/Zanzibar. | T2 |
| middleware | **Never the sole gate.** CVE-2025-29927 proved the Next.js edge layer spoofable. Always pair with a route-handler identity + object check. | T1 |
| tenant isolation | **RLS-enforced, not a hand-written WHERE alone.** Verify `FORCE ROW LEVEL SECURITY` is set: by default the table OWNER bypasses its own policy, and that is the role that runs migrations. | T2 |
| helpers | **Use `lib/auth/require.ts`.** Never inline a new `getUser()+role-check` copy: 244+ inline re-implementations already exist and are unauditable. | T2 |

**Premature:** OpenFGA/SpiceDB, OPA/Rego or Cedar, a full PEP/PDP/PIP/PAP architecture.
**Myths:** a passed role check means authorized (vertical != horizontal) · RLS protects me through the admin client (false, BYPASSRLS is a role attribute) · middleware auth is enough · REST verb maps to CRUD permission.

## 7. API design

| axis | LOCKED | tier |
|---|---|---|
| style | **REST/JSON over Next.js Route Handlers.** No GraphQL/tRPC/gRPC: they do not fit a cross-repo mobile client and fixed-shape screens. | T2 |
| idempotency | **Every mutating endpoint with a plausible client retry uses a deterministic key from invariant fields, computed BEFORE the external call.** A double-tap on bad wifi double-books or double-charges. Already correct at every sampled Stripe site: extend it, do not reinvent it. | T1 |
| status codes | **409 = conflict with world state · 422 = well-formed but semantically invalid · 400 = malformed.** Do not blur. We use 422 exactly once across 354 routes, so 400 is doing double duty. | T1 (RFC 9110) |
| 429 | **Always set `Retry-After`**, including the fail-closed early-return branch (live gap: `lib/ratelimit.ts:272`). | T1 |
| versioning | **None, while there is no third-party/partner API.** Coordinate through the mobile release cadence. A session pattern-matching "APIs should be versioned" buys real ongoing overhead for a problem we do not have. | T0 (no partner API exists) |
| long operations | **202 + poll.** Never block the Lambda: Netlify's wall-clock ceiling truncates it silently with no partial-progress record. | T2 |
| errors | **RFC 9457 problem+json on NEW/touched routes only.** Do not mass-migrate. | T1 |

**Premature:** a full OpenAPI spec, a formal versioning scheme, mass RFC-9457 migration, full keyset-pagination migration, a Sunset/Deprecation pipeline, gRPC.
**Myths:** REST means resources and verbs (Fielding's REST requires HATEOAS; nobody, including Stripe, does that: CONV, not standard) · Vercel caching behavior applies to us (**we are on Netlify**) · a `200` with `{success:false}` is acceptable.

## 8. Security

| axis | LOCKED | tier |
|---|---|---|
| SQL | **Parameterize, never string-build.** The residual surface is IDENTIFIERS (a client-chosen sort/filter column): those hit a **hardcoded allowlist**. "Supabase parameterizes everything" does not cover `?sort=`. | T1 · **GATED** [`filter-ok:`] |
| SSRF | **Every server-side fetch of a user-supplied URL goes through the guard**, which range-checks the RESOLVED IP (never a hostname denylist). Block `169.254.169.254`. We already had this incident (`lib/ai-vision.ts` reached cloud metadata). | T1 |
| secret comparison | **`crypto.timingSafeEqual` on equal-length buffers. No exceptions**, including "low value" secrets. Hardened everywhere except `CRON_SECRET`. | T1 (CWE-208) |
| mass assignment | **Never spread a raw body into `.insert()`/`.update()`.** Zod-validate, spread the VALIDATED object, add server-derived fields AFTER. Correct everywhere sampled: the risk is a new route breaking it. | T1 |
| headers | **CSP is the one missing header. Netlify sends ZERO security headers by default**, so a dropped/typo'd header block ships with none of X-Frame-Options/HSTS/nosniff/CSP. | T1 |
| uploads | **Validate by MAGIC BYTES, never client `Content-Type`/extension. Random storage key. AND set the bucket's `allowed_mime_types`** (app-layer alone is not enough). We already had this incident on `service-photos`. | T1 |
| select | **No `select("*")` on a sensitive table.** Explicit column lists. | T1 · **GATED** |

**Premature:** a secrets vault over env-vars+Zod, field-level PII encryption (Supabase says do not use pgsodium, it is deprecating), DNS-rebinding-proof SSRF, a full CSP nonce pipeline on day one, AV scanning, egress firewalling.
**Myths:** OWASP Top 10 is the 2021 list (**superseded Nov 2025**) · a wildcard CORS origin is itself the vulnerability (orthogonal: the missing auth check is the hole) · SameSite solved CSRF · escaping is as good as parameterizing (OWASP: "STRONGLY DISCOURAGED") · pgsodium is the modern way to encrypt PII.

## 9. Rate limiting & abuse

| axis | LOCKED | tier |
|---|---|---|
| algorithm | **Sliding-window counter.** Fixed window leaks bursts at boundaries. Already our pattern. | T2 |
| key | **`userId` wherever a session exists.** IP fallback only pre-auth, via `getClientIp()` (trusted-header-first). **Never trust the leftmost `X-Forwarded-For`**: attacker-spoofable, and CGNAT punishes innocent shared-IP users. | T2 |
| lockout | **NEVER hard-lock an account on failed logins. Progressive throttling only.** A hard lockout is a trivial DoS against a victim who never touched the account. | T1 (NIST 800-63B-4) |
| fail posture | **Per-route, not global.** Abuse-prone/money/enumeration-oracle routes fail **CLOSED** when the limiter backend is unreachable, including the runtime-error case (live gap: only the unconfigured-Redis case is covered). | T2 |
| quota vs throttle | **Different things. A quota applies IN ADDITION to the per-minute limiter** for any metered/paid third-party call: a rate cap alone does not bound cost. | T2 |

**Premature:** distributed/multi-region limiting, ML bot scoring, JA3 fingerprinting, CAPTCHA everywhere (no observed abuse), a paid disposable-email blocklist, partner API-key tiers.
**Myths:** **NIST caps failed logins at 10 (FALSE: the ceiling is 100)** , this was a real secondhand-search error caught in our own research, never repeat it · the `RateLimit` headers are an RFC (still `draft-ietf-httpapi-ratelimit-headers-11`) · blocking by IP stops credential stuffing · CAPTCHA solves bot signup.

## 10. File & object storage

| axis | LOCKED | tier |
|---|---|---|
| type validation | **Magic bytes AND the bucket's `allowed_mime_types`.** Both layers. | T1 |
| signed URLs | **Bearer tokens with NO revocation.** Store the PATH, re-sign fresh, short expiry. **Never persist a signed URL string.** | T1 |
| upload path | **Direct signed-upload URL above ~2-3MB.** Netlify's body ceiling is ~6MB raw / ~4.5MB effective base64, and several routes validate at 10MB, ABOVE the platform's actual limit. | T2 |
| private buckets | **A private bucket only protects reads if EVERY path signs.** `.getPublicUrl()` on a private bucket is broken, not "a smaller public URL" (live drift: `client-photos`/`formula-photos`). | T2 |
| immutable | **Only when the URL changes with the content.** Never mark an `upsert:true` stable path immutable. | T1 |
| proof | **Storage RLS fails CLOSED silently.** Confirm BOTH the row and the object exist. A 200 is not proof: `review-photos` returned success for months while writing nothing. | T1 · **GATED (new routes only)** [`storage-ok:`] |

**Premature:** ClamAV, automated storage/DB reconciliation with auto-delete, a pre-generated image-size matrix, a CDN/S3/R2 layer in front of Supabase Storage, S3-Inventory orphan audits.
**Myths:** Content-Type tells you the file type · a signed URL is as safe as a login-gated page · private bucket = safe whatever the code does · RLS matters for reads on a public bucket (the `public` flag bypasses it) · Postgres handles binary badly (TOAST is fine).

## 11. Background jobs & async

| axis | LOCKED | tier |
|---|---|---|
| delivery | **"Exactly-once" does not exist. At-least-once + an IDEMPOTENT consumer.** Given Stripe's 3-day retry window, a retry is a certainty, not an edge case. | T1 (Two Generals) |
| retries | **Jittered exponential backoff (Full Jitter).** Never fixed-interval, never bare exponential. We have ZERO jittered backoff anywhere today: the next retry loop is the first test. | T1 (AWS) |
| cron trigger | **GitHub Actions `schedule` is best-effort with NO overlap protection** (`cron-jobs.yml` has no `concurrency:`). Design bounded, re-runnable batches + row-level idempotency. Add `pg_try_advisory_lock` per cron NAME where side effects are not per-row-safe. | T1 |
| ordering | **Compute the idempotency key BEFORE the external call.** Never write local "done" state before the external call is confirmed. | T2 |
| timeouts | **Every plausibly-long job declares `maxDuration`**, sized to its batch. 1 of 26 crons does today. | T1 |
| failure signal | **`errors` is `string[]`, one string per failed item. A non-empty array is the `ok:false` signal.** Enforced by the TYPE (`lib/cron-run.ts`), not a gate: a bare count used to be permitted and was silently dropped, so `ok` stayed true on a night every item failed. This shipped 3 separate times. | T1 · **TYPE-ENFORCED** |

**Premature:** a real broker (SQS/QStash/Kafka), Postgres-as-a-queue with `SKIP LOCKED` (no concurrent consumers), a literal outbox table + relay, a Redis lock service, a formal DLQ topic, OTel tracing across jobs.
**Myths:** exactly-once delivery is achievable (marketing for at-least-once + idempotent consumer) · `SKIP LOCKED` turns any table into a queue for free · GitHub Actions' schedule is a reliable clock.

## 12. Webhooks

| axis | LOCKED | tier |
|---|---|---|
| signature | **Verify against the RAW body (`req.text()`), never the parsed body.** Any re-serialization breaks it. | T1 |
| idempotency | **Claim the event ID via an atomic unique-constraint INSERT BEFORE handler logic. Never check-then-insert.** Release the claim on throw. Stripe redelivers, sometimes concurrently. We hit and fixed this race in production; the `processed_webhook_events` pattern is correct, keep it. | T1 |
| ordering | **Never assume it. Every state-write is an advance-only CAS, never a blind overwrite.** Stripe explicitly does not guarantee order. Live bug: the generic booking `else` branch unconditionally resets `payment_status`. | T1 |
| unknown events | **Silent no-op, log only. Never throw/4xx/5xx**: that makes Stripe retry an event you were never going to process. | T2 |
| response | **2xx fast.** A slow handler gets retried, compounding into duplicate load. | T1 |
| outbound (none yet) | If ever built: **HMAC-SHA256 over `id.timestamp.payload`** (Standard Webhooks), **re-resolve DNS immediately before EVERY send** (not just at registration), dual-secret rotation from day one. | T1/CONV |

**Premature:** a queue/worker fleet for async webhook processing, a Smokescreen-style egress proxy, strict FIFO for outbound, a Vault for signing secrets.
**Myths:** a switch with no default case is a bug (it is correct; the missing LOG line is the gap) · disable Next's bodyParser (stale Pages Router advice; App Router never auto-parses) · a wider timestamp tolerance is more secure (backwards) · idempotency makes signature verification redundant (different threats, both required).

## 13. Caching

| axis | LOCKED | tier |
|---|---|---|
| Next.js default | **Next.js 15 `fetch()` is UNCACHED by default.** This REVERSES Next 14, and a session's older instinct is flatly wrong here. | T1 |
| the CDN | **Only `Netlify-CDN-Cache-Control` reaches the CDN from a Function.** `netlify.toml`'s static header block does **NOT** apply to function responses at all. | T1 |
| personalized data | **Never cache an auth/tenant-varying response at a URL that does not encode it.** When ambiguous: `private`/`no-store`. **NEVER `Vary: Cookie`** (explicitly the wrong fix). This is the most expensive cache bug class: one user's data served to another. | T1 |
| in-memory | **A per-process `Map` is "cheap when warm", never a source of correctness.** It passes a manual click-test on a warm instance and serves wrong state on a cold one. | T2 |
| Postgres | **There is NO query result cache.** `shared_buffers` is page caching. Escalation path: index -> materialized view -> app cache, measure first. | T1 |
| invalidation | **TTL bounds staleness by a clock, not by writes.** Once a cached value is user-editable and TTL exceeds a few seconds, add tag-based invalidation on the write path. Shortening TTL just moves DB load back without fixing correctness. | T1 |

**Premature:** Redis SETNX stampede locks, XFetch, materialized views (until a specific slow query is MEASURED), a general Redis response cache, Netlify Durable Cache, cache-tag purging.
**Myths:** Next `fetch()` is cached by default (14 yes, 15 no) · Postgres has a query cache to turn on · `Vary: Cookie` is the fix · Netlify Blobs is a safe shared cache (eventually consistent, last-write-wins).

## 14. Observability

| axis | LOCKED | tier |
|---|---|---|
| request id | **ONE id per inbound request, threaded through every log call for its lifetime.** ZERO propagation across 203 `console.error` sites today: a failed booking's 6 lines across 3 files cannot be correlated except by guessing timestamps. **The highest-leverage missing piece in the stack.** | T1/T2 |
| PII | **Never log a password, token, full card number, or government ID. Prefer the internal UUID over name/email/phone.** A log line containing PII IS "processing of personal data" under GDPR/nFADP, and it is a second copy with none of the DB's access controls. | T1 |
| audit trail | **`console.error` is NOT an audit trail** (not retained, not tamper-evident, not queryable). Booking/payment/role-change events need a dedicated append-only table. Netlify keeps function logs 24h-7d; the gap surfaces during a payment dispute or an FDPIC inquiry. | T1/T2 |
| alerting | **Alert on SYMPTOMS (an SLO burning), never CAUSES (CPU%, one failed cron).** Over-alerting trains the on-call human (the founder) to ignore alerts: hard to reverse. | T1 (Google SRE) |
| health checks | **ONE dependency-health endpoint (already built).** Liveness/readiness pairs are a Kubernetes idiom: there is no long-lived process here. | T1 |
| error tracking | **Turn on PostHog's `captureException`. Do NOT add Sentry**: PostHog is already paid and wired. | T2 |

**Premature:** Prometheus/Grafana/Datadog with RED+USE dashboards, error-budget policy machinery, the OTel SDK+Collector, a cryptographic audit-ledger PRODUCT (a plain Postgres table is NOT premature), multi-window burn-rate alerting.
**Myths:** `console.error` with a bracketed prefix is structured logging · our logs are our audit trail · 100% uptime is the right target · liveness/readiness probes are good practice everywhere · OTel is simply the modern default (its own governance committee admits adoption friction).

## 15. Reliability

| axis | LOCKED | tier |
|---|---|---|
| timeouts | **Every outbound call gets an explicit timeout**, sized to the dependency's measured p99 INCLUDING a cold invocation. `lib/email.ts`'s `sendEmail()` has literally zero timeout today. | T1 (AWS) |
| retries | **Only retry idempotent operations, or ones wrapped in an idempotency key.** Never bare-retry a POST with a money side effect. | T1 |
| timeout budget | **A caller's timeout must exceed the callee's worst case INCLUDING the callee's own internal retries.** Not its single-attempt time. | T2 |
| fallbacks | **Never build a fallback that only runs during an incident and is never exercised.** Run it continuously or replace it with an honest empty/error state. **Never fabricate a plausible number.** Live violation: `metrics/global` returns hardcoded fabricated numbers on failure, with zero logging. | T1 (AWS's 2001 Amazon.com postmortem) |
| circuit breakers | **Do NOT build one.** AWS's own source treats it as the SECOND choice (after a token-bucket retry budget), and it is structurally weaker on serverless (no long-lived pool to protect). Timeouts + capped jittered retries cover our actual risk at 28 salons. | T1/T2 |
| shutdown | **SIGTERM draining does not apply on Netlify Functions.** The substitute: idempotent handlers + explicit `maxDuration` + a periodic reconcile pass. | T1 |

**Premature:** a circuit-breaker library, a token-bucket retry budget, app-level bulkheads (Supabase's `statement_timeout` is the de facto one), adaptive throttling with a criticality system, formal load testing, distributed tracing.
**Myths:** circuit breakers are the standard fix for retry storms (AWS: second choice) · a fallback is a safety net (it can be strictly worse than none) · fail-open vs fail-closed is one global choice (it is per-dependency, per-route) · Google Maps is a dependency to degrade (verified FALSE by grep: the server never calls it; the real dependency is Mapbox).

---

## What Solen already does RIGHT (do not "fix" these)

A fresh session's instinct is to improve things. These are correct, hard-won, and several were fixed 3 times before they stuck. Leave them alone.

- **Idempotency keys** on every sampled Stripe charge site, keyed on business-invariant fields computed BEFORE the call, and correctly propagated to 5+ money call sites.
- **`getUser()` discipline** is real project-wide, not aspirational. All 28 `getSession()` hits are verified client-only.
- **Booking slot-claim**: app-level CAS + a GIST EXCLUDE constraint + a second independent unique partial index. Textbook layered defense.
- **Credit/voucher/promo/member-discount/staff-limit RPCs** all take their lock BEFORE any read.
- **`processed_webhook_events`** PK-claim + release-on-throw. Correct.
- **Forward-only migrations**: genuinely followed, 0 down migrations across 264 files. PostgREST auto-reload (`pgrst_ddl_watch`) confirmed live.
- **Nightly export**: idempotent, never conflated with PITR, per-table try/catch, two independent failure-alert paths. `db-backups` bucket genuinely private.
- **GDPR photo-purge** deletes orphaned Storage bytes before the DB row.
- **No premature infra anywhere sampled**: no GraphQL, no hand-written OpenAPI, no hot standby, no lock service, no broker. Correctly deferred.

## Honest coverage

7 of 15 topics are researched but **NOT yet audited** against live code: authz, security, rate-limiting, caching, observability, reliability, data-modeling. Their rows above are law; their live-compliance verdict is unknown. Treat "no gap found" in an unaudited topic as **"not yet checked"**, never a clean bill of health.

Even the 8 audited topics are grep-exhaustive but deep-read a MINORITY sample (roughly 15-25 files per topic out of ~354 routes + 264 migrations + 26 crons). `transactions-concurrency` names ~165 unopened loop sites as a possible unswept N+1 source; `jobs-async` names 9 of 26 crons unverified for the very bug it found in the other 17.
