# Backend law layer , the backend equivalent of the taste system (owner ask 2026-07-16)

**Owner's ask, verbatim-ish (dictated):** "we have a taste [bible] for the front end... maybe making one for the back end because it keeps making stuff up when I open a new session. So I'll list up stuff that we need, like principles, and I want you to go into deep research and use the playwright feature to look into Wikipedia or UI/UX places so you can actually make a full audit about each topic. Like a deep one, multi-hour... once you're done I'm going to feed that into another session. Also think about it's for Solen, consider that. And also compare if it actually matches with the current thing that we have in the backend and also give a recommendation how to improve. So this is probably like a loop session."

## The gap this fills (exists-check, rule 12 / project exists protocol)

`npm run exists backend` = 18 hits, all graveyard/RPC, **zero** law-layer hit. Inventory of what already exists and why none of it is this:

| Existing | Layer it holds | Why it is not the ask |
|---|---|---|
| `_docs/BACKEND.md` (1213 lines, 15 systems) | **DESCRIPTIVE** , how each Solen system currently works, file:line grounded | Says what IS, never what SHOULD BE. A new session reading it learns our plumbing, not the decision law. Analogue: `_design-system/SOURCE.md`. |
| `_rules/SECURITY_RULES.md`, `DB_SCHEMA.md`, `CODE_SAFETY.md`, `SOLEN_PATTERNS.md`, `STRUCTURAL_RULES.md` | Partial prescriptive rules | Fragmentary, undated, unsourced, and per the precedence chain tier 8 (legacy). No PK strategy, no money-storage law, no error format, no pagination law, no idempotency law. |
| `_plans/BACKEND_HEALTH_AUDIT_2026-07-14.md` + the 9 `*_BACKEND_AUDIT.md` + `BACKEND_AUDIT_INDEX.md` (141 findings) | **FINDINGS** , what was broken, dated | Bug lists, not principles. They tell you the 22 criticals were fixed; they do not tell a fresh session what to decide next time. |
| `_rules/LESSONS_LEARNED.md` | Incident memory | Postmortems, not law. |

**Therefore: net-new law layer, mirroring the frontend stack 1:1.** Frontend has SOURCE (how) + LOCKFILE (frozen what) + RATIONALE (why + sourced mechanics + evidence tiers) + TASTE_LOG (dated owner calls) + research/*.md. Backend has only the "how". This workstream builds the missing three.

**Placement decision (default picked, not asked , gate 1):** `_backend-system/` mirroring `_design-system/`. Backlinks into `_docs/BACKEND.md`; duplicates none of it.

```
_backend-system/
  LAW.md                  , the frozen decisions (LOCKFILE-equivalent): one locked row per axis, 15 topics
  RATIONALE.md            , the WHY: forces/tradeoffs/mechanic/source per decision, evidence-tiered T1/T2/T3/CONV/MYTH
  AUDIT_2026-07-16.md     , Solen today vs each law: MATCH / GAP / UNKNOWN + severity + recommendation
  research/<slug>.md      , 15 deep sourced research files (primary sources only)
  QUESTIONS.md            , the forks only the owner can settle
```

## Evidence standard (inherited from RATIONALE.md section 0, non-negotiable)

Every claim carries a tier: **T1** formal standard / replicated (RFC, NIST, OWASP, Postgres docs) · **T2** one strong source or converging independents · **T3** directional (vendor blog, single benchmark) , verify on our own data · **CONV** named convention, coordination device not truth · **MYTH** debunked, never cite. Rule 15 binds: no version/API/limit claim from memory, every one verified against the live source this session.

---

## Atomic boxes

### Setup
- [x] Exists-check run (`npm run exists backend`) + gap table above written
- [x] Plan file + ACTIVE.md row (this file)
- [ ] `_backend-system/` scaffold + README pointer from `_docs/BACKEND.md`

### Per topic , 3 atomic boxes each (research / audit / recommend). Owner's 15 topics, verbatim scope.

**1. Data modeling & storage** , DB choice (relational/doc/KV) · schema + normalization · PK strategy (UUIDv4 vs v7 vs ULID vs bigint) · indexing · enums (DB enum vs check vs lookup) · JSON columns · money storage (int cents, never float) · timestamps + UTC · soft vs hard delete · constraints as source of truth · multi-tenancy (tenant_id vs schema vs DB) · RLS
- [ ] 1a research (primary-sourced, tiered)
- [ ] 1b audit vs live Solen (file:line + live DB snapshot, not TS types)
- [ ] 1c recommendations (ranked, each with a named cost)

**2. Transactions & concurrency** , isolation levels · optimistic vs pessimistic locking · race conditions · N+1 · connection pooling (killer w/ serverless) · deadlocks
- [ ] 2a research
- [ ] 2b audit
- [ ] 2c recommendations

**3. Migrations** , forward-only vs reversible · zero-downtime + expand/contract · backfills · seeding · rollback plan
- [ ] 3a research
- [ ] 3b audit
- [ ] 3c recommendations

**4. Backup & recovery** , PITR · restore drills · RTO/RPO · retention
- [ ] 4a research
- [ ] 4b audit
- [ ] 4c recommendations

**5. AuthN** , sessions vs JWT (the real debate) · cookie flags · argon2id vs bcrypt · NIST 800-63B password policy · email verification · password reset (entropy, single-use, no enumeration) · magic links · OAuth2/OIDC + PKCE · SSO/SAML · MFA/TOTP · passkeys/WebAuthn · refresh rotation + reuse detection · session revocation · impersonation + audit
- [ ] 5a research
- [ ] 5b audit
- [ ] 5c recommendations

**6. AuthZ** , RBAC vs ABAC vs ReBAC (Zanzibar/OpenFGA) · where authz lives (middleware vs service vs RLS vs policy engine) · object-level checks (IDOR/BOLA = #1 real vuln) · tenant isolation enforcement · policy-as-code
- [ ] 6a research
- [ ] 6b audit
- [ ] 6c recommendations

**7. API design** , REST vs GraphQL vs tRPC vs gRPC · verbs + status codes · idempotency keys · pagination (offset vs keyset) · versioning (Stripe date-based vs URL) · error format (RFC 9457) · boundary validation · batch ops · long-running ops (202 + poll vs webhook) · OpenAPI · deprecation policy
- [ ] 7a research
- [ ] 7b audit
- [ ] 7c recommendations

**8. Security** , OWASP Top 10 + API Top 10 · SQLi/XSS/CSRF · SSRF (webhooks + URL fetch, block 169.254.169.254) · security headers + CSP · CORS · mass assignment · timing attacks · secrets mgmt + rotation · TLS · field-level PII encryption · dependency/supply chain · file upload security · security.txt + disclosure
- [ ] 8a research
- [ ] 8b audit
- [ ] 8c recommendations

**9. Rate limiting & abuse** , token bucket vs sliding window · per-user vs per-IP vs per-key · brute force · lockout tradeoffs · bot/signup abuse · quota vs throttle
- [ ] 9a research
- [ ] 9b audit
- [ ] 9c recommendations

**10. File & object storage** , S3/R2 vs DB blobs · presigned direct uploads · signed URLs + expiry · CDN + cache headers · image transforms · virus scan · orphan cleanup
- [ ] 10a research
- [ ] 10b audit
- [ ] 10c recommendations

**11. Background jobs & async** , queue choice · at-least-once + idempotent consumers · retries/backoff/jitter · DLQ · cron + distributed locks · outbox pattern · timeouts
- [ ] 11a research
- [ ] 11b audit
- [ ] 11c recommendations

**12. Webhooks** , outbound: signing, retries, replay protection, ordering · inbound: signature verify, idempotency, fast-ack-then-process
- [ ] 12a research
- [ ] 12b audit
- [ ] 12c recommendations

**13. Caching** , layers (CDN/app/query/materialized) · invalidation · TTL vs event-based · stampede protection · ETags · tenant-safe cache keys
- [ ] 13a research
- [ ] 13b audit
- [ ] 13c recommendations

**14. Observability** , structured logs + request/trace IDs · metrics (RED/USE) · SLI/SLO/error budgets · OpenTelemetry · error tracking · alerting (page vs email, fatigue) · health checks (liveness vs readiness) · audit trail != logs · PII scrubbing
- [ ] 14a research
- [ ] 14b audit
- [ ] 14c recommendations

**15. Reliability** , timeouts everywhere · retries only on idempotent ops · circuit breakers · bulkheads · graceful degradation · graceful shutdown/SIGTERM drain · backpressure · third-party failure modes
- [ ] 15a research
- [ ] 15b audit
- [ ] 15c recommendations

### Synthesis + delivery
- [ ] Adversarial verify pass on every GAP finding (default-refute skeptics, >=2/3 to confirm)
- [ ] `LAW.md` written , one locked row per axis, Solen-specific, backlinked to RATIONALE + BACKEND.md
- [ ] `RATIONALE.md` written , forces/tradeoffs/mechanic/source per decision, tiered
- [ ] `AUDIT_2026-07-16.md` written , MATCH/GAP/UNKNOWN per law + ranked recommendation list
- [ ] `QUESTIONS.md` , owner-only forks surfaced
- [ ] Served visual page + cloudflare tunnel link (owner deliverable law: visual page + plain English, same turn)
- [ ] Handoff block for the next session (what to paste in)
- [ ] Committed

## Unplanned additions / parked decisions
(none yet)
