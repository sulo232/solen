# Solen backend LAW, frozen decisions

**Status:** load-bearing. A fresh session opens this file to learn what Solen's backend HAS DECIDED, not what a generic best-practice guide would say. Do not reopen a row without the owner saying so by name (same rule as `_design-system/LOCKFILE.md`).

**Frozen 2026-07-27** from the 15 research files in `research/` (dated 2026-07-16, 24+ sources each, read in full for this freeze). Every row below carries the evidence tier from `README.md`'s tier table (T1/T2/T3/CONV/MYTH) and the file the reasoning lives in. Where the research names a trigger instead of a now-decision, the row states the decision (usually "not yet") AND the number/event that makes it due, so a future session does not have to re-derive the tradeoff, only check whether the trigger fired.

**What this file is not.** It is not the WHY (that's `RATIONALE.md`, not yet written, read `research/<topic>.md` directly until it exists), not an audit of whether Solen actually follows these rows today (`AUDIT_2026-07-16.md`, not yet written), and not the forks only the owner can settle (`QUESTIONS.md`, not yet written, see "Not yet frozen" at the bottom of this file for the one open owner question this freeze surfaced).

**Scale caveat carried forward from README.md:** every "not yet" row names the trigger, not a ban. Solen runs ~28 salons; do not build the larger-scale version of any row below until its trigger actually fires.

---

## 0. THE ONE LAW (if you read nothing else)

> **A control that returns 200 has proven nothing. Prove BEHAVIOR, not existence.**

RESTORED 2026-08-14. This section, plus the two at the bottom of this file, existed only on
`premerge-backup-2026-07-17` and were lost when the rest of this document was rewritten. They are
the highest-value paragraphs in it, which is exactly the kind of thing a rewrite drops quietly.

This is the house's #1 failure mode and it recurred as the top-ranked finding in 7 of the 15
research topics independently: data-modeling, transactions, migrations, authz, file-storage,
jobs-async, webhooks. It wears different costumes:

- PostgREST returns `error: null` on a **zero-row** UPDATE. The lost race reports success.
- PostgREST **silently nulls** a select on a column that does not exist. The homepage went blank for weeks.
- A cron reports `ok: true` on a night **every Stripe call failed**, because it counted failures in a field the wrapper never read.
- Storage RLS **fails closed silently**: `review-photos` returned `200 {success:true}` for months while writing nothing.
- A migration applies cleanly and the feature is still broken, because **PostgREST's schema cache** had not reloaded.

A filter must **discriminate** (return a correct subset), not merely render. A column must appear in
the **live snapshot** (`npm run exists <col>`), not merely in a TS type. A write must be confirmed by
**affected-row count**, never by `error === null`.

---

## 1. Data modeling and storage

Source: `research/data-modeling.md`.

| Decision | Tier |
|---|---|
| System of record is Postgres (relational); Upstash Redis stays scoped to ephemeral/high-frequency state (rate limits, OTP, nail-budget), never anything needing a foreign key or transaction | T2/CONV |
| Primary key for new tables: UUIDv4 (`gen_random_uuid()`). Not yet UUIDv7/ULID/bigint. Trigger: a table's PK index stops fitting comfortably in the Postgres shared-buffer cache, a few million rows is the order-of-magnitude alarm, or a table grows 2-3 orders of magnitude from today (`availability_slots` is 62,913 rows as of 2026-08-23, corrected during the backend loop that day: this row said ~9,400, which was the stale snapshot number and understated the table by 6.7x, so the trigger it defines was being read against the wrong baseline) | T2/T3 |
| Status columns: `text` + `CHECK (col IN (...))`, matching the existing 233-instance convention. Never a native Postgres `ENUM` (blocks inside transactional migrations, can't remove/reorder a value) | T1 mechanic / Solen convention |
| Money columns: `integer`, minor units (Rappen), never `numeric(x,2)`, never the Postgres `money` type. **IMPLEMENTED 2026-07-27**: `_rules/DB_SCHEMA.md` section 8 states this as project rule and documents the legacy `numeric(8,2)` split (do not silently migrate those columns as a side effect of unrelated work, that is its own tracked task) | T1 (Stripe's own minor-unit convention) |
| Timestamps: `timestamptz` for every specific instant, never bare `timestamp`. A locally-recurring schedule (a salon's Tuesday 9am slot) is stored as local wall-clock + IANA zone name, materialized to `timestamptz` only at the point a concrete occurrence is generated (already Solen's pattern for `opening_hours`/`staff_breaks`/etc) | T1 |
| Delete semantics: keep the three concepts Solen already separates, don't collapse them into a generic `deleted_at`. Product soft-delete = a purpose-named flag/status (`is_active`, `account_status`). Trust-and-safety = its own flag (`banned_at`). Legal GDPR/nFADP erasure = the dedicated anonymize-not-delete pipeline (`data_deletion_log`, `20260713150000_gdpr_deletion_completeness.sql`). A flag alone never satisfies Article 17 | T1 (GDPR text) / T2 |
| Multi-tenancy: shared table + `salon_id`/`owner_id` column + RLS (already the whole codebase). Not schema-per-tenant or database-per-tenant. Trigger: one enterprise-scale tenant with a contractual isolation requirement, handled as a one-off exception for that tenant, not a platform-wide switch | T2/CONV |
| Authorization layer: RLS enabled everywhere (already true, 146/146 tables) AND explicit ownership checks on every service-role-client write (partial, needs the per-call-site audit named in "Not yet frozen" list below is NOT this, see the authz section instead) | T1 mechanic |

**Also deferred, with trigger (from "Premature at our scale," not restated as full rows):** BRIN indexes (trigger: a table crosses ~10M rows with a time-correlated access pattern, none exists today); a dedicated Redis read-cache in front of Postgres for salon/search data (trigger: a specific profiled query stays slow after correct indexing); formally versioned/event-sourced money ledgers platform-wide (trigger: a named external audit/compliance requirement, not a general rigor impulse).

---

## 2. Transactions and concurrency

Source: `research/transactions-concurrency.md`.

| Decision | Tier |
|---|---|
| Isolation level: Read Committed everywhere, no override. Get atomicity from an RPC (Postgres function) plus explicit locking, not from Repeatable Read/Serializable, because nothing in Solen's route handlers catches and retries a `40001` serialization failure | T1 |
| Single-row state flip (slot claim, status transition): optimistic concurrency, a conditional `UPDATE ... WHERE <condition>` with the affected-row count checked, never just `error === null`. Already shipped | T2 mechanic + repo evidence |
| Balance/count operations (credits, vouchers, daily caps): pessimistic, a Postgres advisory lock inside an RPC. Already shipped | T2 mechanic + repo evidence |
| Any multi-write operation that must succeed or fail together (touches money, balances, or a shared cap): one Postgres function via `.rpc()`, never multiple sequential client-side `.from()` calls, because each PostgREST request is its own transaction, there is no client-side transaction API | T1 (PostgREST's own request-per-transaction model) |
| N+1 avoidance: PostgREST resource embedding in one `.select()` with an explicit narrow column list, not `*`, not a per-row loop | T1 |
| Column list discipline (performance-01, added 2026-07-27, closes the enforcement gap the research itself named): the narrow-column-list row above is now a CI ratchet, not prose alone. `npm run select-star:census` (`scripts/select-star-census.mjs`) counts every `select("*")`/`select('*')` under `app/api`, wired as the `select-star-census` job in `.github/workflows/quality.yml`, baseline 107 (today's actual count, no mass migration demanded). A route that genuinely needs every column (an owner-only admin export) is added to `scripts/select-star-allowlist.json` with a one-line reason, never silently exempted | T1 (mechanism) |
| Data access path: supabase-js/PostgREST only. A raw Postgres driver is not adopted speculatively; if one is ever added it MUST go through Supavisor transaction mode with prepared statements disabled | T1 |
| Deadlock handling: consistent single-lock-per-function discipline; the day any function needs 2+ locks, write an explicit acquisition order. Rely on Postgres's own detector as the backstop, not as the primary defense | T1 |

**Also deferred, with trigger:** a generic Serializable-everywhere retry-wrapper (trigger: measured 409 storms on a single popular slot/resource, not a theoretical risk); a raw driver "for performance" (trigger: a specific PostgREST-shaped query proven slow via `EXPLAIN ANALYZE` that resource embedding cannot fix); a dedicated distributed-lock service (Redis-based) for cross-request coordination (trigger: a lock ever needs to span multiple Postgres transactions/round trips, which none of Solen's current locks do, Postgres advisory locks already cover the single-transaction case for free).

---

## 3. Migrations

Source: `research/migrations.md` + `audit/migrations.md`.

| Decision | Tier |
|---|---|
| No paired down-migration files. Forward-only in production; local `supabase db reset` replays ups from zero | T2 |
| Expand/migrate/contract (not a single combined deploy) for any rename/type-change/removal on a table current code touches. Single-step is fine only for a genuinely new, unconsumed column | T1 |
| A new constraint on a live table with existing rows: always `NOT VALID` then a separate `VALIDATE CONSTRAINT`, never a plain `ADD CONSTRAINT` (which validates every row and can take a long lock) | T1 |
| A new index on a live table with rows/traffic: always `CREATE INDEX CONCURRENTLY` | T1 |
| Backfill execution: a single idempotent statement in the migration, matching current practice, until a specific table's row count makes that measurably slow (T3 on the exact size threshold, must be measured on Solen's own data, not assumed) | T2 |
| Seed data: keep current practice (reference-data seeds as ordinary migrations, test seeds as `/api/admin` routes); no dedicated `seed.sql` mechanism yet. Enforce idempotency on both | T3/CONV |
| Rollback on a bad migration in production: forward-fix by default; full restore only as an unrecoverable-corruption last resort. No mechanical down migrations in the production path | T2 |
| After any migration that changes what PostgREST exposes: explicitly verify with a real API call. Never assume the schema cache picked up the change automatically (`NOTIFY pgrst, 'reload schema'` is the manual fix; whether hosted Supabase auto-reloads on every DDL via the MCP `apply_migration` path was not confirmed, see Unverified in the research file) | T1/T2 |

**Also deferred, with trigger:** a dedicated background-job system for batched migrations (trigger: a genuinely needed backfill measured to take more than a few seconds as a single statement); an offline snapshot-based backfill pipeline (trigger: a backfill's own read-side query measurably affects production latency); a dual-write-plus-automated-comparison harness for data migrations (trigger: a migrated dataset large/critical enough that manual spot-checking can't give confidence); blue-green/shadow-database schema swaps (trigger: sustained traffic where even brief, well-managed locks start causing user-visible latency).

---

## 4. Backup and recovery

Source: `research/backup-recovery.md` + `audit/backup-recovery.md`.

| Decision | Tier |
|---|---|
| No Supabase PITR add-on yet. Trigger: real recurring revenue makes a lost day cost meaningfully more than ~$100/month amortized, OR a real same-day-undetected-corruption incident happens that "restore yesterday" can't fix | T1 mechanics, reasoned tradeoff |
| Keep the current bespoke JSON-per-table export over standard `pg_dump`/`pg_restore`, but run a real restore drill (never done as of this research pass) before trusting it further | T1 applied to our own code |
| Keep the shared service-role backup credential; do not build a separate write-only/no-delete backup identity yet. Trigger: same as immutable storage below | Reasoned from CISA/NIST posture, T2/T3 |
| Keep Supabase Storage as the backup location; no separate immutable (Object Lock) store yet. Trigger: ransomware/insider-threat becomes a realistic, not theoretical, threat model for Solen, i.e. meaningful revenue/salon count, or any real credential-leak incident | T2/T3 |
| Retention window: keep 14 days. No external standard prescribes a different number for us | Reasoned |
| Write down explicit RPO/RTO numbers rather than leaving them implicit: RPO <= 24h (accept, matches current cadence), RTO <= 4h (target, not yet verified by a real drill) | T1 (NIST SP 800-34), applied |

**Also deferred, with trigger:** hot standby/mirrored replica (trigger: Solen's actual RTO target tightens below "a few hours," not the case today); formal quarterly tabletop DR exercises (the substance, one real restore drill, should happen now; the ceremony is proportional to a larger org).

---

## 5. Authentication

Source: `research/authn.md` + `audit/authn.md`.

| Decision | Tier |
|---|---|
| Session model: the hybrid short-JWT + rotating-refresh Supabase already gives Solen. Not pure stateless, not pure stateful | T2 |
| Password hashing: bcrypt via Supabase Auth (platform-controlled, acceptable). Not Argon2id/scrypt/PBKDF2, those would require leaving the managed Auth provider | T1 |
| Password policy: length-only (10-15 char floor) + breach-check, per NIST 800-63-4. Composition rules (require an uppercase+digit+symbol) are explicitly rejected by current NIST guidance, they push toward predictable substitutions, not real entropy. Solen's current signup/reset schemas doing composition rules is a documented gap against this row | T1 |
| MFA factor: TOTP now for the owner/staff tier. Not SMS OTP (NIST restricts it, SIM-swap risk). WebAuthn/passkeys deferred, see below | T1 (NIST restricts SMS) / T2 (TOTP vs WebAuthn) |
| OAuth flow: authorization-code + PKCE, already the `@supabase/ssr` default. Never implicit, never code-without-PKCE | T1 |
| Federation protocol: OIDC (already in use via Google/Apple). Not SAML | CONV/T2 |
| Cookie SameSite: `Lax` for session cookies, current Solen default | T1 |
| Impersonation scope: scoped preview-only (current Solen shape), not full "log in as anyone" | CONV/T3 |
| Priority weighting: the salon-owner/staff dashboard session sits one hop from real payout money movement via Stripe Connect and must be weighted higher than the customer-browsing tier for any AuthN hardening spend (MFA effort, session timeout tightness), even though both run through the identical auth code path today | Reasoned from Solen's own architecture |

**Also deferred, with trigger:** SAML/enterprise SSO (trigger: first actual enterprise/franchise deal naming SAML as a contractual requirement); sender-constrained tokens (DPoP/mTLS) for refresh tokens (trigger: Solen ever issues API tokens to genuinely untrusted third-party public clients, not on the roadmap); a custom session store replacing Supabase Auth (no scale threshold makes this a good idea, only a specific capability gap Supabase genuinely cannot provide would); full WebAuthn/passkeys as the PRIMARY login method (trigger: Supabase marks passkey support GA, not beta, and cross-device UX is confirmed not to strand a meaningful share of Solen's actual Swiss device mix); risk-based/adaptive authentication (trigger: meaningful growth in transaction volume AND a first real fraud incident a fixed rule set would have missed).

**Checklist, not yet a live gap (authz-rls-08, 2026-07-27): step-up reauth on the highest-blast-radius dashboard actions.** A session that can reach `/dashboard` currently gets the identical validity bar for every action, from viewing a staff calendar to (once one exists) changing a Stripe Connect payout destination. Confirmed this pass: `app/api/stripe/connect/create-account/route.ts` only creates a NEW account or refreshes an expired onboarding link, actual bank details are entered on Stripe's own hosted page, never Solen's; there is genuinely no "swap the connected payout account" route today, so this is not a live hole. `app/api/staff/invite/route.ts` (salon owner invites staff) DOES exist live and was not previously named as checked against this principle; given its lower blast radius than a payout change, this pass does not gate it, but a future session should not assume it is covered. Rule for whoever builds a payout-account-change route, an email/password-change route, or widens staff-invite-permission scope: require a `requireReauth()`-shaped password/MFA confirmation in the same route before the change lands, not just a valid existing session. This is real UI/UX work (a confirmation modal), not a one-line backend fix, and belongs in the mockup-first pipeline when it is scoped, not guessed into existence here.

---

## 6. Authorization

Source: `research/authz.md`.

| Decision | Tier |
|---|---|
| Core model: RBAC (a role column) + RLS ownership predicates. Not ABAC, not ReBAC (Zanzibar/OpenFGA/SpiceDB). Trigger to revisit: staff-to-multi-salon or salon-to-salon delegated-management relationships need expressing, which RLS genuinely cannot do in one hop, and which is also today's visible gap (staff access is currently unmodeled in RLS) | T2/CONV |
| Where the check lives: route handler (identity + object check) AND RLS (ownership predicate), both, always. Middleware is for redirect UX only, never the sole gate (CVE-2025-29927 is the dated proof an edge-only check can be bypassed) | T1 (CVE) + T1 (Supabase RLS docs) |
| Object-level check: per-object ownership check on every route accepting a client-supplied ID, on top of the role check, checking affected-row count on writes. A role-only check is BOLA, OWASP API1 for two editions running | T1 |
| Tenant/salon isolation: RLS-enforced predicate on every salon-scoped table (326 policies already exist), never a hand-written `WHERE` clause alone. Always check affected-row count on writes. Whether `FORCE ROW LEVEL SECURITY` is actually set (not just `ENABLE`) is unverified against the live schema, see "Not yet frozen" | T2 |
| Policy centralization: adopt the existing `lib/auth/require.ts` helper for real, stop writing new inline checks. Not a dedicated policy engine (OPA/Cedar) yet | T2 |
| Service-role usage: keep the escape hatch (some ops need it), but every one of the 267 call sites must carry an explicit, visible, auditable ownership check in the same function. `BYPASSRLS` means Postgres evaluates zero policies for a service-role query, RLS gives zero protection through it by design | T1 |

**Also deferred, with trigger:** Zanzibar-style ReBAC as a standalone service (trigger: same as the core-model row above, a genuine multi-salon-staff or delegated-management need); a dedicated policy engine (trigger: Solen splits into multiple independently-deployed services needing shared policy decisions); full ABAC/PEP-PDP-PIP-PAP architecture (trigger: a genuine cross-cutting policy need like device-fingerprint risk scoring, which would likely be a small number of explicit checks even then, not a full engine); `FORCE ROW LEVEL SECURITY` as a formally tracked compliance control (trigger: a compliance requirement, SOC2 or an enterprise questionnaire, names it).

**Staff role, confirmed unmodeled (2026-07-27, authz-rls-02).** `profiles.role`'s live CHECK constraint (`profiles_role_check`) only allows `'customer'`, `'salon_owner'`, `'admin'`. `'staff'` is not a legal role value today; staff identity lives entirely in `profiles.staff_salon_id` (set by `app/api/staff/accept-invite/route.ts`) and the `staff_members` table. `middleware.ts`'s dashboard guard (~line 175) only ever admits `role === "salon_owner"` or `"admin"`, so a staff account that finishes the invite flow is unconditionally redirected home the moment it hits `/dashboard`, with no RLS policy anywhere referencing `staff_salon_id` to back a narrower grant even if middleware allowed it through. Interim fix shipped this pass: `MobileMenu.tsx`'s "Dashboard" nav entry no longer lights up for `staff_salon_id`-only profiles (it previously did, promising a working link that middleware then bounced), removing the false affordance without inventing a staff dashboard UI. The actual buildout (which dashboard subpaths staff may reach, what RLS predicate backs each one, whether `'staff'` becomes a first-class role value or the CHECK constraint stays closed) is a product-scope fork the owner has to pick, not something to guess into existence; queued, not implemented.

---

## 7. API design

Source: `research/api-design.md` + `audit/api-design.md`.

| Decision | Tier |
|---|---|
| API style: REST/JSON over Next.js Route Handlers. Not GraphQL, tRPC, or gRPC | T2 |
| Validation-failure status code: 422 for business-rule failures going forward. Audit existing 400 uses that are really 422s (not done as part of this freeze) | T1 |
| Idempotency key scope: deterministic-from-business-invariant-fields (e.g. `(booking_id, baseAmountRappen)`, the pre-discount amount), never a hash of the whole request body, and never a random per-attempt key for anything that must collapse retries to one side effect. Already the pattern in `booking-pay-intent`/`pre-charge` | T1 (Stripe's own documented pattern) |
| Pagination: OFFSET for small, static admin tables; keyset/cursor for growing customer-facing feeds/lists | T2 |
| Versioning: none today. Date-based (Stripe-style) is the strongest reference IF a public/partner API ever ships; not built speculatively | T2 |
| Error shape: adopt RFC 9457 Problem Details for new/touched routes; no mass migration of existing `{error: string}` responses | T1 for the standard, T3 for urgency at our size |
| Error shape, the CONCRETE subset (api-contracts-01, added 2026-07-27, closes the ambiguity the research itself named: "RFC 9457 or a subset"): `{ type, title, status, detail }`. `type` defaults to `"about:blank"` when no specific problem-category URI exists yet. `instance` is deferred, it needs a URI scheme decision not yet made. Extension members (a machine-readable `code` slug, a per-field validation-errors array) are allowed and MUST be ignored by generic consumers per RFC 9457 itself. Enforced as a CI ratchet: `npm run contracts:census` (`scripts/api-contracts-census.mjs`), wired as the `contracts-census` job in `.github/workflows/quality.yml`, fails only if the legacy-shape count grows past today's baseline (1716) | T1 (the concrete field list is RFC 9457 itself) |
| Success envelope (api-contracts-02, added 2026-07-27, was entirely unaddressed by the research, 7 distinct shapes found in active use): a paginated list wraps as `{ items, total, page, limit }`, never a domain-named key (`bookings`, `results`, `warnings`) in place of `items`; a single created/fetched resource wraps as `{ data: T }`; a boolean-outcome route wraps as `{ data: { ok: true } }`, never a bespoke top-level key (`saved`, `sent`). No mass migration of the 5 legacy list shapes and the assorted single-resource/boolean shapes already in the codebase, same posture as the error-shape row. Same CI ratchet covers the paginated-list half (baseline: 5 legacy list shapes); the single-resource/boolean half has no automated check yet, a future delta | Reasoned from the client-unwrapping problem the error-shape row already names |
| 201 Location header (api-contracts-05, added 2026-07-27): every 201 Created response sets a `Location` header pointing at the created resource's canonical GET URL. Measured today: 0 of 44 existing 201 responses set one, closing the research's own "Unverified" open question with a direct count. No mass migration of the 44 existing sites; new/touched 201 responses should set one. Same CI ratchet (baseline: 44 missing) | T1 (RFC 9110 section 15.3.2) |
| Resource naming grammar (api-contracts-07, added 2026-07-27): a route segment is singular only when it addresses a resource scoped to the authenticated caller's own single instance of it (`/api/salon/*`, "my own salon's sub-resources"); plural for any public/admin collection (`/api/salons`). A new top-level namespace for an existing domain (the `nail` / `nail-discovery` / `nail-inspo` / `nail-tech` split is the live example) requires extending an existing namespace, or a one-line comment in the new route file explaining why a new one was needed. Doc-only, folded into the existing `npm run exists <keyword>` pre-route-creation habit rather than new tooling | Reasoned from the codebase's own drift |
| Request body size (api-contracts-08, added 2026-07-27): any mutating route's zod schema puts an explicit `.max()`/`.length()` on every array or free-text field; Next.js Route Handlers impose no default body-size limit on `request.json()`, unlike the old Pages API. Default assumption for a new route: a body under a few KB unless documented otherwise. Folded into the existing zod-at-the-boundary discipline (already ~69% adopted per `audit/api-design.md` row API-08), not a new mechanism | T2 (reasoned resource-exhaustion risk) |
| Cache-Control policy (api-contracts-09, added 2026-07-27, cross-referenced with section 13): a route explicitly sets ONE of exactly two policies, `Cache-Control: private, no-store` (the default for anything reading/returning user-specific, payment, or auth-adjacent data) or the documented public/anonymous policy (`ANON_CACHE_HEADERS`, `lib/salons/cache-headers.ts`) for genuinely public non-personalized data. Today ~344 of 357 routes set neither, relying on Next/Netlify's own unstated default. Doc-only given scale (no CDN/edge cache sits in front of Netlify today); becomes a real gate the day a CDN/edge cache is introduced, at which point a route with no explicit Cache-Control is a blocking finding, not a style note | T3 (assume, no CDN today to test against) |
| Outbound fetch timeout, the api-design-local instance (api-contracts-06, added 2026-07-27, IMPLEMENTED): every third-party `fetch()` call inside an `app/api/**/route.ts` file passes `AbortSignal.timeout(N)`. Fixed all 8 zero-timeout call sites found (6 Resend email sends at 8s, 1 synchronous seven.io SMS send at 10s since the caller waits on it, 1 fal.ai image-generation call at 25s as a stopgap ahead of the 202+poll architecture section 15's reliability row still recommends long-term). Distinct from `lib/email.ts`'s own zero-timeout gap (section 15's reliability row, not an app/api route file, out of this domain's scope) | T1 (a hung third party must not hold the whole serverless wall-clock budget hostage) |
| Long-running operations: 202+poll for anything that can run long (AI generation, exports), given Netlify's function wall-clock limit; webhook already correctly used for Stripe's inbound events | T2 |
| Batch atomicity: partial-success with a per-item result array for salon-facing bulk imports/creation, not all-or-nothing. A salon owner bulk-creating 200 slots wants 198 created + 2 flagged, not one bad row voiding the batch | Reasoned from Solen's own use cases |

**Also deferred, with trigger:** a full OpenAPI spec for the whole surface (trigger: first partner/public API integration request, or repeated client/server type drift that a generated contract would fix); a formal versioning scheme (trigger: first public/partner API); mass-migrating all existing error responses to RFC 9457 (the standard is adopted, the bulk backfill is not); full keyset-pagination migration of every `.range()` call site (do it per-table as growth/concurrency actually warrants); a formal Sunset/Deprecation header pipeline (trigger: an automated external system needs to programmatically react to a retirement date, today it's one internal mobile-version-lag case, handled by a human-managed grace window); gRPC/service-mesh internal RPC (trigger: multiple genuinely separate backend services calling each other at real scale, Solen is one monolith today); mass-adding Location headers to the 44 existing 201 responses, or mass-migrating the 5 legacy paginated-list shapes, or retrofitting a Cache-Control header onto all ~344 unset routes (same "adopt for new/touched, no mass backfill" posture as the error shape).

**Route-level contract tests (api-contracts-04, added 2026-07-27):** `tests/api/contracts/` is the starter slice (per the finding's own scale-appropriate guidance, not a demand to backfill all 357 routes at once), one route-handler-level test per customer-facing route group asserting the documented status code + exact top-level body-key set for each branch. `tests/api/contracts/favorites-toggle.test.ts` is the first example, proven to discriminate (a deliberately broken shape was caught, then reverted). This locks the CURRENT documented shape as a drift tripwire, it does not itself prove the route uses the canonical envelope above, migrating an existing route's shape is the deferred bulk-backfill case, not something this test suite forces. Trigger to expand: the next route touched for an unrelated reason gets its own contract test added in the same PR (fix-while-you're-there, same ratchet philosophy as the lint job's baseline note).

---

## 8. Security

Source: `research/security.md`.

| Decision | Tier |
|---|---|
| CSP rollout: report-only for one deploy cycle, then enforce. **IMPLEMENTED 2026-07-27**: `netlify.toml` ships `Content-Security-Policy-Report-Only` (not yet the enforcing header, no report-uri configured since no CSP report-collection endpoint exists in this repo) | T1 (staging method) / T3 (exact duration) |
| CSP script policy: explicit domain allowlist first (Stripe.js, Google Maps, PostHog, fonts). Migrate to nonce+strict-dynamic later, once the third-party list is stable and SSR nonce plumbing is worth the effort | CONV / T3 |
| SSRF DNS-rebinding guard: leave as one-time-resolve for now. Trigger: a new feature lets an anonymous/public (not the current ~28-salon-owner population) user supply a URL the server fetches | T1 (the gap is real) / T3 (the urgency call) |
| PII encryption: platform-at-rest (Supabase's own) + RLS, no column-level encryption (pgsodium is explicitly being deprecated by Supabase itself, don't reach for it). Trigger: a specific compliance mandate or an incident showing platform-at-rest+RLS was insufficient | T2 (Supabase's own current guidance) |
| Secrets storage: env vars, Zod-validated (`lib/env.ts`), not a dedicated vault (HashiCorp Vault/AWS Secrets Manager). **Rotation cadence IMPLEMENTED 2026-07-27** (secrets-webhooks-04, see the cadence table below); GitHub push-protection status stays unverified, see "Not yet frozen" | T1 / T3 (scale threshold) |
| Timing-safe compare: every secret/token/HMAC comparison uses `timingSafeEqual` (or the Web-Crypto equivalent for edge-runtime routes), including `CRON_SECRET`, no exceptions for "less important" secrets. **IMPLEMENTED 2026-07-27** (secrets-webhooks-10): `lib/cron-auth.ts`'s `constantTimeStringEqual` fixed all 22 cron routes plus 3 more (admin badges/solen-score, notify internal-secret, walkin tracking_token); `scripts/check-timing-safe-secrets.mjs` gates the pattern in CI at baseline 0 | T1 |
| Rate-limit fail posture for a NEW limiter: classify explicitly at creation time (fail-closed for enumeration oracles, payment, auth, booking; fail-open for low-value high-volume reads), default to fail-open unless the surface is abuse-prone | T2 |

**Also deferred, with trigger:** a dedicated secrets vault (trigger: team grows past the size where "who can see the Netlify dashboard" is an acceptable access boundary, or a compliance requirement explicitly demands it); a full CSP nonce pipeline (build the allowlist CSP first, evolve to nonces once the third-party script list is stable); automated malware/AV scanning on uploads (fix the more foundational upload gaps first, see file-storage row below); network-level egress firewalling as an SSRF layer (not really configurable on Netlify's managed serverless functions at all, largely inapplicable to the current host, not a scale question).

### 8a. Secret rotation cadence (secrets-webhooks-04, frozen 2026-07-27)

A secret's usefulness to whoever obtains it (a leaked log line, a departing
team member's local `.env.local` copy, a compromised laptop) never expires on
its own; only rotating the secret itself ends it. This is the floor, not a
suggestion, for every server-held secret in `lib/env.ts`'s `serverEnvSchema`
(`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`,
`RESEND_API_KEY`, `CRON_SECRET`, `BOOKING_HMAC_SECRET`, `LOYALTY_HMAC_SECRET`,
and any secret added to that schema later):

| Trigger | Action |
|---|---|
| Any team member with dashboard/secret access (Netlify, Supabase, Stripe, Resend) offboards, or their access scope changes | Rotate every secret that person could read, same day |
| A secret is suspected or confirmed leaked (see the leak-response runbook, secrets-webhooks-05) | Rotate immediately, out of band from this cadence |
| No specific trigger fires | Rotate `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `RESEND_API_KEY` at least annually anyway, since a secret nobody has ever rotated is a secret an old leak (one nobody noticed) is still valid against |
| `CRON_SECRET`, `BOOKING_HMAC_SECRET`, `LOYALTY_HMAC_SECRET` | Same annual floor; rotating `CRON_SECRET` is a hard simultaneous cutover across every `/api/cron/*` route (no dual-secret grace window today, unlike Stripe's own webhook-secret rotation), so schedule it for a low-traffic window and expect every cron to 401 until the new value is set in both GitHub Actions secrets and Netlify env vars |

"Last rotated" is not yet tracked anywhere machine-readable (this is a
written cadence, a checklist per the finding's own enforcement tier, not a
CI gate: rotation is an operational action, not something a static grep can
verify happened). Extending `_backend-system/CREDENTIAL_EXPIRY.md`
(secrets-webhooks-03) with a "last rotated" column per secret, checked
manually against this table's annual floor, is the natural next step if this
cadence needs a harder enforcement mechanism later.

### 8b. Leak-response runbook (secrets-webhooks-05, frozen 2026-07-27)

Solen's own documented founding security incident is exposed credentials in
git (`_rules/SECURITY_RULES.md` line 7, cited by `research/security.md`
section 10). This is the first-hour runbook for the next time any secret is
confirmed exposed, so the response is a checklist under pressure, not an
improvisation. `_plans/OPS_RUNBOOK.md`'s own "Security maintenance" section
does not cover this today; this is deliberately placed in `LAW.md` instead of
a new file, since `LAW.md` is the one doc every session is already expected to
read first.

For every secret class: (1) where to revoke/regenerate, (2) what breaks the
instant it rotates and the redeploy order that minimizes the break window,
(3) who/what needs telling, (4) whether a dual-secret transition window
exists.

| Secret | Revoke/regenerate | What breaks + redeploy order | Who/what to tell | Dual-secret window? |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard > Developers > API keys > roll key | Every Stripe-touching route breaks the instant the old key is rolled (this is one full-access key used everywhere, secrets-webhooks-07). Set the new key in Netlify env vars FIRST, trigger a redeploy, confirm one test-mode charge succeeds, THEN roll the old key in Stripe (rolling first with no new key live yet is a self-inflicted outage) | Internal only today (no salon-facing Stripe integration exists yet). Note the outage window in whatever the team uses for status if it's customer-visible (an active booking payment mid-flight can fail) | No. Stripe's key roll is an instant hard cutover, not a window |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Developers > Webhooks > the endpoint > roll signing secret | Only `app/api/stripe/webhook/route.ts`'s signature verification breaks; incoming events get retried by Stripe (Stripe's own retry schedule) so a short window is recoverable, unlike the full secret key | Internal only | Yes, Stripe supports a dual-secret verification window on this one specifically (research/webhooks.md section 14); use it, don't hard-cut |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Project Settings > API > reset service_role key | Every server route using `createAdminSupabaseClient()` (the majority of `app/api/**`) breaks at once. Set the new key in Netlify env vars and redeploy before or immediately after resetting in Supabase; there is no way to sequence this to zero downtime, Supabase's reset is also an instant cutover | Internal only | No |
| `RESEND_API_KEY` | Resend Dashboard > API Keys > revoke + create | Only outbound transactional email breaks (bookings/reminders/digests silently stop sending, no user-facing error since email failures are logged not surfaced, see `lib/email`'s error handling). Lowest-urgency of this table: rotate on your own schedule once the new key is set | Internal only; check the `cron_runs`/digest logs afterward for a spike in email-send failures during the gap | No |
| `CRON_SECRET` | Generate a new random value (`openssl rand -base64 32` or equivalent), set in Netlify env vars AND every `.github/workflows/*.yml` secret that references it | ALL 22+ `/api/cron/*` routes 401 simultaneously the instant the value differs between GitHub Actions' secret and Netlify's env var (see section 8a); update BOTH in the same sitting, expect every cron to fail on the runs in between | Internal only, but check `lib/cron-heartbeat.ts`'s overdue-cron detection in the next daily digest to confirm every cron resumed | No, by design (secrets-webhooks-05 names this asymmetry explicitly versus Stripe's webhook secret) |
| `BOOKING_HMAC_SECRET`, `LOYALTY_HMAC_SECRET` | Generate a new random value, set in Netlify env vars | Any outstanding link/token signed with the OLD secret (a guest booking-access link already emailed, an unscanned loyalty QR) stops validating the instant the new secret is live; there is no re-signing pass, affected users must re-request a fresh link/code | Internal only; a support-facing note ("if a booking link stopped working today, resend it") is reasonable if this secret is ever actually rotated for a real reason rather than the annual floor | No |

The asymmetry the table makes visible on purpose: `CRON_SECRET` is the ONE
secret with no built-in grace period despite being the most frequently
rotated by this cadence (shared across every scheduled job), while Stripe's
webhook secret, rotated far less often, DOES support a graceful dual-secret
window. This is exactly the kind of detail meant to be read before an
incident, not discovered during one.

### 8c. Stripe key scoping (secrets-webhooks-07, frozen 2026-07-27)

One full-access `STRIPE_SECRET_KEY` is used across every Stripe-touching
route today (the webhook handler, payment-intent creation, Connect
transfers, disputes, payouts). A code-injection or SSRF-adjacent bug in ANY
one of those routes has the blast radius of the ENTIRE Stripe account, not
just the capability that route actually needs.

Decision: the full `sk_live_`/`sk_test_` key stays reserved for the routes
that genuinely need broad access (the webhook handler reacts to any event
type; payment-intent/Connect-transfer creation needs write access across
several resources). Any FUTURE route that only needs a narrow, mostly-read
slice (a reporting job, a read-only reconciliation script, a new partner
integration that never creates charges) uses a Stripe Restricted Key
(`rk_live_`/`rk_test_`) scoped to exactly what it needs, provisioned in the
Stripe Dashboard under Developers > API keys > Create restricted key.
`lib/env.ts` now validates an optional `STRIPE_RESTRICTED_KEY` (this session,
secrets-webhooks-07) so that field exists and is ready the moment a route
needs it; the actual key itself is NOT provisioned by this freeze, that is
an owner action in the Stripe Dashboard, not a code change.

**Not yet frozen (owner/provisioning-dependent):** no route needing a
Restricted Key exists yet, so no key has actually been created. When the
first such route is built, provision its `rk_` key with only that route's
required scopes, set it as `STRIPE_RESTRICTED_KEY` (or a route-specific
named var if more than one narrow-scope route ever exists), and have that
route import it instead of `STRIPE_SECRET_KEY`.

---

## 9. Rate limiting

Source: `research/rate-limiting.md`.

| Decision | Tier |
|---|---|
| Counting algorithm: sliding window counter (Upstash `slidingWindow`) everywhere. Already implemented | T2 |
| Identity dimension: userId-first once a session exists, IP-fallback pre-auth, a distinct limiter per route family. Already implemented | T2 |
| Brute-force control: progressive per-route sliding-window throttle, no hard account lockout (a MYTH-tier practice this file explicitly rejects), CAPTCHA deferred until scripted-abuse evidence exists. Already implemented | T1 |
| Backend-down behavior: per-route split, already implemented for the config-missing case (`ABUSE_PRONE_LIMITERS` fails closed on verified production boot, everything else fails open). The runtime-error case (Redis erroring mid-request, not just unconfigured) currently fails open even for abuse-prone limiters, and this is an explicit unresolved owner question, not a silent gap, see "Not yet frozen" | T2 |
| Response shape: 429 + `Retry-After` + `X-RateLimit-*`, already implemented. Not the pre-RFC IETF draft `RateLimit`/`RateLimit-Policy` headers yet | T1 (429/Retry-After) + CONV (X-RateLimit-*) |
| Cost control on metered calls (AI generation): both a per-minute throttle and a per-day DB-backed quota, already implemented | T2 |

**Also deferred, with trigger:** distributed/multi-region rate limiting (trigger: Solen ever deploys compute across multiple regions, not just CDN edge, or Upstash-region p95 latency becomes user-visible from a specific market); adaptive/ML-based bot scoring (trigger: documented, repeated scripted-abuse incidents that IP/user throttling and CAPTCHA-on-suspicion don't stop); device/connection fingerprinting (trigger: a real observed credential-stuffing campaign IP+user throttling alone doesn't stop); CAPTCHA on every signup/login (trigger: measurable scripted signup volume or a real spike in `authLimiter` 429s from a narrow IP/pattern set); a disposable-email-domain blocklist subscription (trigger: an observed abuse pattern, spam reviews, farmed referrals, promo-code abuse, actually causing a concrete problem); formal API-key partner-tier throttling (trigger: the first real external API consumer).

---

## 10. File storage

Source: `research/file-storage.md` + `audit/file-storage.md`.

| Decision | Tier |
|---|---|
| Where bytes live: object storage (Supabase Storage) for anything served to a browser/CDN or in the video/large-media range. Not Postgres `bytea`/TOAST for user-facing files | T2 |
| Upload path: direct signed-URL upload (`createSignedUploadUrl`) for new/updated routes above ~2-3 MB; server-proxy retained only for small, ownership-gated writes | T2/CONV |
| Signed URL lifetime: minutes for reads (re-signed per render), a few hours max for uploads paired with a size cap. Never days | T1/T2 |
| Bucket visibility: public only for genuinely-public content (published gallery/discovery images); private + signed URL for client/formula/document buckets. `client-photos` and `formula-photos` currently call `.getPublicUrl()` on private buckets, a documented live gap, not a design decision, fix on next touch | T2 |
| Cache policy: `immutable` long max-age for the timestamped upload paths already in use; short cache for any stable-path `upsert` writes | T1 |
| Image sizing: on-the-fly transform via Supabase's transform endpoint, not pre-generated size variants | T2 |
| Malware defense: allowlist + Storage-layer MIME + `nosniff`, no full AV scanning pipeline yet. **IMPLEMENTED 2026-07-27** (partial): `lib/upload-security.ts` stops trusting the client-supplied `file.type` string, strips EXIF/GPS metadata from every user upload, and adds a multipart-CSRF header requirement (`x-solen-upload`) that a plain cross-site HTML form cannot set. Route-by-route rollout across the 9 affected upload routes is not independently re-verified by this freeze | T2/T3 |
| Orphan handling: defensive logging/alerting now; a report-first reconciliation job later; never auto-delete on day one | T2/CONV |

**Also deferred, with trigger:** a full ClamAV/malware-scanning pipeline (trigger: a public no-login upload surface ships, or `salon-documents` becomes something a human routinely opens as a rendered PDF); automated storage/DB reconciliation with auto-delete (trigger: orphan storage cost or orphan-caused bugs become visible in a bill or support ticket); pre-generating a fixed image-size matrix (trigger: transform request volume/cost becomes material, or a specific page's load latency is traced to a transform cache miss); a dedicated CDN/S3/R2 layer in front of Supabase Storage (trigger: Storage egress cost or cache-hit-rate becomes a measured problem).

---

## 11. Jobs and async

Source: `research/jobs-async.md` + `audit/jobs-async.md`.

| Decision | Tier |
|---|---|
| Queue mechanism: HTTP cron (GitHub Actions) + `pg_cron` split, unchanged. Not a real broker (QStash/SQS), not Postgres `SKIP LOCKED` | T2 |
| Delivery guarantee to design for: at-least-once + idempotent consumer, always. "Exactly-once" is not an achievable engineering goal, treat any doc claiming it as wrong | T1 |
| Retry spacing: Full Jitter, add where currently missing. Never fixed-interval or bare exponential (thundering herd) | T1 |
| Failure terminal state: status column + admin alert, wire `errors[]` correctly everywhere, not a literal DLQ queue/topic. **IMPLEMENTED 2026-07-27** (the specific silent-no-fire gap): `lib/cron-heartbeat.ts` adds overdue-cron detection (a cron that never fires writes no row at all, and used to render as "0 failures" instead of a problem) to the daily-digest cron-health section, grounded in the actual `cron:` schedule entries of `.github/workflows/cron-jobs.yml` | T2/T1 |
| Cron overlap protection: row-level idempotency (have) + a Postgres advisory lock for any future cron whose side effects are not naturally per-row safe (add as needed). No GitHub Actions `concurrency:` group exists today, that is a real, present gap for any non-idempotent cron | T1 mechanic |
| Money + external call ordering: the keyed-call pattern (Stripe idempotency keys built from business-invariant fields), already in use, keep using it. Not a literal outbox table, Solen's two external dependencies that matter (Stripe, email/SMS) both have workable substitutes without one | T2 |
| Job timeout: explicit `maxDuration` on every batch/loop-heavy cron. Only one of 20+ cron routes (`discovery-ai-backfill`) declares this today; every other cron is implicitly betting its runtime never approaches the platform default (whose exact number is itself unresolved, Netlify's own docs disagree with each other, see research file's Unverified section) | T1 |

**Also deferred, with trigger:** a real message broker (trigger: genuinely concurrent consumers competing for the same work, or cross-service fan-out a DB table can't express); Postgres-as-a-queue with `SKIP LOCKED` (trigger: introducing a worker pool or parallel job processing against one table, today every cron is a single sequential consumer); a literal transactional outbox table (trigger: a second downstream consumer of the same event needing independent retry/ordering guarantees from the email send); per-cron distributed locking via Redis (trigger: cron overlap causes an actual incident, a Postgres advisory lock is cheaper today); a formal DLQ queue/topic (trigger: failure volume high enough that a human reading email digests can't keep up); OpenTelemetry-style tracing across job executions (trigger: cron failures become hard to correlate across services, today `cron_runs` + function logs + the digest are enough).

---

## 12. Webhooks

Source: `research/webhooks.md` + `audit/webhooks.md`.

| Decision | Tier |
|---|---|
| Inbound raw-body handling: `req.text()` then verify, never parse-then-reconstruct. Already built this way | T1 |
| Inbound idempotency claim: unique-constraint insert (`event_id` PK), never check-then-insert. Already built this way | T1 |
| Inbound processing model: fully synchronous handler, not ack-then-queue, while total handler time stays well under the platform timeout and event volume stays low. Revisit if any branch adds unbounded/slow work | T2 |
| Inbound unknown event types: silent no-op + log, never throw/error (an unhandled type erroring would make Stripe retry it forever). Solen currently no-ops correctly but is missing the log half | T2 |
| Outbound signature scheme: Standard Webhooks shape (`webhook-id`/`webhook-timestamp`/`webhook-signature`, HMAC-SHA256 over `id.timestamp.payload`), not a bespoke HMAC scheme, for any future outbound webhook system | CONV, near-T1 by convergence |
| Outbound retry schedule: exponential + Full Jitter, Svix's published attempt/interval schedule as the starting numbers, for any future outbound webhook system | T1 (AWS) + T2 (Svix schedule) |
| Outbound ordering: best-effort + a sequence/timestamp field in the payload, not strict FIFO, for any future outbound webhook system | T2 |
| Outbound SSRF control: validate at save AND immediately before each send (a DNS re-check), not validate-once, not yet a dedicated egress proxy, for any future outbound webhook system | T1 (OWASP) / T2 (Svix) |
| Secret rotation window: a dual-secret transition window, length longer than Stripe's 24h default given a slower integrator population, for any future outbound webhook system or a rotation of Solen's own inbound Stripe webhook secret | T2 |

**Also deferred, with trigger (all four apply only to a not-yet-built outbound webhook system, Solen currently only receives Stripe webhooks inbound):** a dedicated message queue/worker fleet (trigger: handler time or event volume risks the platform timeout or DB connection pool); a network-segmented egress proxy (trigger: the outbound system ships AND has more than a handful of self-hosted, not obviously-safe-managed-SaaS, partner endpoints); strict FIFO ordering (trigger: a specific future integration whose own correctness genuinely depends on exact order, a ledger/accounting-style feed, not a simple "booking changed" notification); a formal secret-manager service (trigger: secret count or team size growing enough that manual Netlify env-var rotation becomes error-prone, or an external audit names secret management specifically).

---

## 13. Caching

Source: `research/caching.md`.

| Decision | Tier |
|---|---|
| Anonymous browse GET responses (identical for every caller): CDN header (`Netlify-CDN-Cache-Control`), `s-maxage=60, stale-while-revalidate=300`, already the pattern in 3 routes | T1 |
| A rarely-changing server-side lookup (e.g. active cities): a per-process TTL `Map`, 5 min, the existing `lib/cities.ts` pattern. Not Redis, not `unstable_cache` | T2 |
| A cache that must be instantly fleet-wide consistent (a hard kill-switch, ban/flag state): keep the per-process Map, "not instant across the fleet" is an accepted, documented tradeoff. Move to Redis only if the owner explicitly needs faster-than-10s/30s propagation | T2 |
| Invalidation for a cached write-through record: TTL for current `revalidate=86400` usages; add tag-based invalidation (`revalidateTag`/`revalidatePath`/Netlify `purgeCache`) the first time a cached, user-editable record gets a real staleness complaint | T1 |
| Stampede protection: stale-while-revalidate only. No locking, no XFetch probabilistic early expiration, pre-emptively | T1/T3 |
| Expensive aggregate query: neither a materialized view nor an app cache today, zero materialized views exist and none are justified yet. Revisit only after a MEASURED slow query (fable-backend's own measure-first rule) | T2 |
| A personalized-at-the-same-URL response: binary cacheable/no-store split by presence of the personalization signal (already Solen's pattern in `feed-cache-headers.ts`), not a `Vary: Cookie` split (MDN explicitly calls this the wrong fix, it silently defeats caching while looking like it solved the problem) | T1 (the risk) / CONV (the choice) |

**Also deferred, with trigger:** distributed cache locking / XFetch (trigger: a specific cached endpoint independently measured, not guessed, to receive a burst of concurrent requests at the exact moment a cache entry expires); materialized views (trigger: a specific aggregate query provably slow via `EXPLAIN ANALYZE` and tolerant of minutes-scale staleness); a general-purpose Redis response-cache layer (trigger: a specific endpoint needs fleet-wide-consistent, sub-CDN-TTL freshness a per-process Map can't give); Netlify's Durable Cache primitive (trigger: function invocation count/cost becomes a measured concern); CDN cache-tag purging via `purgeCache({tags})` (trigger: a CDN TTL gets pushed longer than today's 60s/300s window and a write-triggered purge becomes necessary for correctness).

---

## 14. Observability

Source: `research/observability.md`.

| Decision | Tier |
|---|---|
| Log format: migrate opportunistically to JSON structured logging; prioritize adding a request id over the format switch itself | T2 |
| Request/trace id: adopt an internal request id now (cheap, closes Solen's actual current gap, 203 files use a bracketed-prefix `console.error` convention with no id to join lines from the same failed request). Adopt the `traceparent` wire shape (not the full OTel SDK) so a future tracing backend is a drop-in later | T1 (format) / CONV (which id scheme) |
| Metric framework: RED on request-driven routes (bookings, payments, search); USE on the 3 shared resources (Postgres, Redis, function concurrency). Not one or the other alone | T1/T2 |
| SLO source: derive the SLO from Solen's own booking/payment failure tolerance, never a copied industry-benchmark percentage | T1 (method) / CONV (which number) |
| Alert routing: symptom-based, one page-tier alert on booking/payment failure RATE. Keep cause-level detail in the existing daily digest, which is already doing real alerting work and should be named as such | T1 |
| Health check shape: one dependency-health endpoint (already built, `/api/health`), not a Kubernetes-style liveness/readiness pair (that idiom answers a question that doesn't exist for a stateless Netlify Function) | T1 |
| Audit trail: a dedicated append-only DB table for booking status changes, payment/refund actions, and profile role changes. Logs are not the audit trail, Netlify's own log retention is 24h-7 days depending on plan and Log Drains export is Enterprise-only | T1/T2 |
| PII in logs: log internal IDs (booking/user UUID) only, never raw names/emails/phones/secrets. Look the record up in the real DB when investigating | T1 |
| OpenTelemetry: adopt the `traceparent` header shape only. Defer the full SDK/Collector/semantic-convention vocabulary, OTel's portability value needs many services/vendors to pay off and Solen is one app, one deploy target | T1/T3 |

**Also deferred, with trigger:** a dedicated metrics/dashboards platform (Prometheus/Grafana/Datadog) (trigger: enough concurrent traffic or distinct services that "check the Supabase and Upstash dashboards directly" stops being sufficient); formal error-budget release-gating machinery (trigger: more than one person shipping to production regularly enough that "should we ship today" becomes a real recurring disagreement); the full OTel SDK+Collector (trigger: a second independently-deployed backend service that needs to share traces with the main app); a dedicated tamper-proof audit-log PLATFORM beyond the plain append-only table (trigger: a specific compliance regime names cryptographic tamper-evidence as a hard requirement); multi-window multi-burn-rate alerting (trigger: more than one on-call person, or SLO coverage broad enough that one fast/slow-burn pair per SLI stops being sufficient).

---

## 15. Reliability

Source: `research/reliability.md`.

| Decision | Tier |
|---|---|
| Outbound call timeout: measured-percentile (the Brooker method), not a fixed guess. Retrofit `lib/email.ts` first, it is the confirmed zero-timeout gap today | T1 |
| Retry safety: idempotency-key retry at every money chokepoint (already true), a bare retry only for genuinely read-only GETs, no retry when a failure should surface immediately. Add a lint/grep guard so the money-chokepoint coverage stays true | T1 |
| Retry storm control: retry-at-one-layer plus capped, jittered backoff today. Not retry-at-every-layer, not yet a token-bucket budget or a circuit breaker | T1 (AWS + Google SRE converge) |
| Circuit breaker: defer. Solen's serverless, short-lived runtime structurally weakens the pattern's core value proposition (it exists to protect a long-lived process's shared thread/connection pool, Solen doesn't hold one). AWS's own primary source treats a circuit breaker as the SECOND fix, after a token-bucket retry budget, not the default answer the popularized narrative suggests | T2 (reasoned from Solen's actual runtime) |
| Resource isolation (bulkhead): rely on Supabase's own `statement_timeout` as the de facto bulkhead. Do not build app-level connection/thread pools, Solen's per-invocation serverless shape doesn't have the shared-pool problem this pattern solves | T2 |
| Degrade path: a lower-quality REAL result where one exists (lexical search instead of semantic, already the pattern), or omit and show an empty state. Never fabricate a plausible fallback value, that violates the project's own no-fabrication rule and is the exact AWS-documented failure mode (the 2001 Amazon.com cache-fallback outage: an untested-by-construction fallback that made things worse). `metrics/global`'s fabricated fallback is a named, live violation of this row, fix on next touch | T1 |
| Serverless "shutdown" handling: idempotent-handler-plus-reconcile (already Solen's cron pattern). Stop reasoning in `SIGTERM`-handler terms, there is no registered shutdown hook to write on Solen's platform | T1 (AWS Lambda's own documented shutdown mechanics) |
| Load shedding: at the edge (the Upstash rate limiters), already Solen's pattern. Not deep in business logic | T1 |

**Also deferred, with trigger:** a dedicated circuit breaker library (trigger: two or more incidents in the same quarter where one flaky dependency, most likely Resend given its missing timeout, or the Gemini vision call, causes repeat correlated failures a timeout alone doesn't resolve); a token-bucket local retry budget (trigger: observed retry volume, once a shared retry helper exists to even measure it, becomes a noticeable fraction of normal request volume); application-level bulkheads (trigger: evidence one specific query path is measurably starving others through the shared Supabase pooler even with `statement_timeout` enforced); client-side adaptive throttling with a formal criticality system (trigger: traffic volume high enough that Solen's own compute, not a third party, becomes the bottleneck); formal load testing to find Solen's own goodput-collapse point (trigger: rising p99 latencies under normal traffic, or a planned marketing push expected to spike traffic, not urgent today but not "never" either); OpenTelemetry-style distributed tracing across the request lifecycle (trigger: the call graph grows an internal service-to-service hop, Solen splitting into more than one deployable backend, not currently planned).

---

## 16. Marketplace trust

Source: `_design-system/research/missing-principles-2026-07-26/marketplace-trust.json` (trust-01
through trust-11). Not one of the original 15 research topics; added 2026-07-27 once the
principles sweep found the gap the other 15 don't cover: promises the ToS makes to customers and
salon partners, and whether the code actually keeps them.

| Decision | Tier |
|---|---|
| Post-payout refund clawback (trust-07): when a refund is approved for a booking whose payout already reached the salon's bank account and the salon's Stripe Connect balance can't cover `reverse_transfer`, Solen fronts the shortfall (the refund still completes for the customer via a non-Connect-linked refund path or a manual transfer) and recovers it by deducting from the salon's NEXT payout. Chosen over "queue the refund until the salon's balance recovers" because a customer-facing refund promise cannot depend on an unrelated salon's cash-flow timing, and over "invoice the salon separately" because a payout deduction is the lower-friction collection path Solen already owns (no new AR process). `lib/bookings/issue-refund.ts:214`'s existing catch of the Stripe "insufficient balance" error is where this policy plugs in | CONV (an owner-level business-risk call, not a technical standard; revisit if real volume ever tests it) |
| Review-volume flagging (trust-09): independent of `lib/automod.ts`'s existing new-account-cluster rules, flag (never auto-hide) more than one review from the same `(user_id, salon_id)` pair inside a rolling 30 days. An established, real account manufacturing repeat "verified" signal for one salon is a distinct fraud shape from coordinated fake accounts and needs its own rule | T3 (reasoned, not externally sourced; revisit the 30-day/1-review threshold if it produces false positives against genuine repeat customers) |
| Duplicate-listing signal (trust-10): at salon creation, a phone or address match against an existing salon is a soft admin-facing warning on the approval screen (`_backend-system/audit/salon-onboarding.md`), never an automatic reject. `salon_groups` (legitimate multi-location chains) is the reason a hard block is the wrong shape | CONV |
| Cross-channel dispute reconciliation (trust-11): when a Stripe chargeback (`charge.dispute.closed`) resolves against a booking, the webhook must also write that outcome onto the booking's own dispute state (not only the payout ledger), so a parallel in-app refund/appeal for the same booking can see it happened and refuse a duplicate action | T1 mechanic (double-refund prevention is a straightforward correctness requirement, not a judgment call) |

**Not yet frozen (owner decision required, see the section below for why):** trust-04's exact
refund-reporting-window day count (implemented at 14 days, matching the pre-existing internal
proposal in `_tasks/REFUND_APPEAL_PLAN.md` section 11, but never explicitly owner-confirmed);
trust-08's review self-edit/delete policy (whether a customer may edit or delete their own posted
review at all, and for how long, is a product decision this file cannot make up).

---

## 17. Performance

Source: `_design-system/research/missing-principles-2026-07-26/performance.json` (performance-01
through performance-10). Not one of the original 15 research topics; added 2026-07-27 once the
principles sweep found the gap the other 16 sections don't cover: Solen has exactly one
performance number ever written down (LCP <= 2.5s, LOCKFILE.md) and it binds a manual per-wave
design check, not the codebase as a whole.

| Decision | Tier |
|---|---|
| Column list discipline (performance-01, IMPLEMENTED): see section 2's row, `npm run select-star:census` ratchets `select("*")` under `app/api` at baseline 107 | T1 (mechanism) |
| Core Web Vitals budget (performance-02, IMPLEMENTED): LCP <= 2.5s, CLS <= 0.1, and Total Blocking Time <= 500ms (the lab proxy for INP, real INP needs field data a CI run can't produce) are asserted by Lighthouse CI (`lighthouserc.js`) against 3 named routes (home, a city/category page, the sanctioned test-salon PDP), wired as the `lighthouse` job in `.github/workflows/quality.yml`. Same secrets-gated skip-green shape as the `visual`/`motion` jobs, so it activates the moment the Supabase secrets are set | T1 (web.dev's own "good" thresholds) |
| Per-page query-count budget (performance-03): a page/route's data-fetching entry point states, in a one-line comment, the max sequential (non-`Promise.all`'d) DB round trips it makes. More than 3 sequential round trips means parallelize or collapse into one RPC before merging, not after a future sweep finds it. Not automated (a grep-based "consecutive await" heuristic has real false-positive risk on legitimately-dependent queries), a code-review checklist item today | Checklist (reasoned false-positive risk, not gated) |
| Cache-addition trigger (performance-04): already frozen in section 13's table + deferred-triggers list. The residual gap this closes is PR-facing: `.github/pull_request_template.md` now carries a line requiring the specific measured number (an `EXPLAIN ANALYZE` time or a real p95) that justifies any new cache layer, so the requirement binds a human reviewer or an agent session without this file loaded, not only a Claude session with fable-backend's memory loaded | Checklist (PR template) |
| N+1 systematic check (performance-06): the current confidence level is a 4-file sample (`audit/transactions-concurrency.md:41`), not a systematic sweep of the ~165 API routes. A full grep-based heuristic (a loop body followed by an awaited `.from(` call) is not adopted as a hard gate, real false-positive risk (not every loop-with-a-query is a bug). The intended enforcement is a recurring quarterly line in `_plans/SWEEP_BACKLOG.md`'s own generation mechanism (a `_plans/` file, owned by the sweep orchestrator, not edited directly here); this row is the frozen decision that line should implement | Checklist (periodic sweep item, pending the orchestrator adding it to `_plans/SWEEP_BACKLOG.md`) |
| Measured before/after on a perf claim (performance-07): `.github/pull_request_template.md` now carries a line requiring the actual before-number and after-number, with units, on any PR whose description claims a performance improvement. A claimed optimization with no attached number is unverified and gets re-measured before merge, same standard as a correctness fix needing a reproduction | Checklist (PR template) |
| Bundle-size budget (performance-08, PARTIALLY IMPLEMENTED): `@next/bundle-analyzer` is now a devDependency, wired as a no-op-unless-`ANALYZE=true` wrapper in `next.config.mjs` (`npm run build:analyze` opens the treemap), confirmed to load correctly (adds a `webpack` config key only when enabled). The CI RATCHET (gzipped first-load JS for home/search/PDP tracked against a committed baseline) is NOT yet built: it needs a clean `next build` to establish the baseline numbers, and at the time this row was written the repo's `next build` was failing at the type-check step on an unrelated file (`app/api/directory/[id]/claim/route.ts`, a different, uncommitted, in-progress change, not this domain's) not fixable from here. Next step: once the build is green, run `npm run build`, read the "First Load JS" column for the 3 named routes, commit that as the baseline, wire the ratchet job | T2 (mechanism installed), ratchet itself blocked on a clean build |
| Per-request DB-time vs handler-time split (performance-09, IMPLEMENTED): `lib/db-timing.ts`'s `createDbTimer()` wraps a route's DB call(s) and logs one line splitting handler-total from DB-total (`[db-timing] <route>: handler=Xms db=Yms (N calls)`), proven to discriminate the two (a unit run showed handler=63.8ms vs db=42.3ms across 2 calls, non-DB overhead visibly isolated). Wired into `GET /api/salons/[slug]` (the PDP's own data source, the literal "PDP feels slow" example this finding names) as the first exemplar. Not yet retrofitted across all ~165 routes, that is fix-while-you're-there on next touch, not a mass migration | T1 (mechanism), retrofit is CONV (per-route, as touched) |
| Image weight budget (performance-10, PARTIALLY IMPLEMENTED): `next.config.mjs`'s `images.formats` is now pinned to `["image/webp"]`, confirmed live as Next 15.3.8's own current default (`node_modules/next/dist/shared/lib/image-config.js`), no behavior change today, just closes the "a future major bump silently changes it" risk. Quality stays Next's own unset 75 default. The 200KB max-rendered-weight NUMBER itself has no enforced ceiling yet (would need a next-build image-manifest check), still a nice-to-have given the photo count is small (28 salons) | T1 (pinning the format), the byte-ceiling itself is not yet gated |

**Also deferred, with trigger:** a bundle-size CI ratchet (trigger: this section itself names it as the next build-out, not urgent given only one manual bundle decision has ever been needed); a `lib/db-timing.ts` shared wrapper + per-route DB-time logging (trigger: the next "X feels slow" investigation that would otherwise start from zero, retrofit the wrapper onto that route first and expand from there); an automated grep-based N+1 heuristic (trigger: the periodic sweep-backlog reads turn up more than one or two real hits, proving the pattern recurs enough to be worth a noisier automated check); an automated grep-based per-page query-count check (trigger: the checklist item alone is shown, via a recurrence in `SWEEP_BACKLOG.md`, not to be catching a real case); pinning `images.formats`/`quality` in `next.config.mjs` with an enforced byte-weight ceiling (trigger: the photo set grows past a size where "still small" stops being true, or a real slow-LCP complaint traces back to an oversized photo).

---

## 18. Communications (email/SMS)

Source: `_design-system/research/missing-principles-2026-07-26/seo-comms.json` (seo-comms-04
through seo-comms-12). Not one of the original 15 research topics; added 2026-07-27 once the
principles sweep found the gap the other 17 sections don't cover: every email/SMS Solen sends,
whether it honors the recipient's own preferences, and whether its content does its job.

| Decision | Tier |
|---|---|
| Locale-parameter templates must actually branch (seo-comms-04, IMPLEMENTED): a template function typed `locale: EmailLocale` must branch its subject/body on all four locales in its own body, never accept the parameter and silently render one hardcoded language. `lib/email-templates/audit-notifications.ts`'s 17 functions (no-show fees, refunds, upcharges, account moderation, payouts) did exactly this, real per-user locale threaded in and dropped on the floor inside the template. Fixed | T1 mechanic (a function's signature must not lie about what it does) |
| A displayed preference control must be read by every send path it claims to govern (seo-comms-05, IMPLEMENTED): `profiles.notification_email`, written by the settings page ("Bestätigungen, Erinnerungen, Stornierungen"), is now read at the two places a booking-lifecycle email leaves (`lib/notifications.ts`'s `sendNotification`, `app/api/bookings/route.ts` step 7), gated via an explicit opt-outable-type allowlist. Deliberately NOT gated: fees/refunds/payouts/account moderation/reviews, transactional notices about money or account state that already happened, not a "send me updates" preference | T1 mechanic (this project's own named #1 failure mode, a silent no-op) |
| Transactional vs marketing classification (seo-comms-06): every automated customer send is one or the other, decided here, not left to each cron's author. TRANSACTIONAL (always sends, tied to a specific event the user directly triggered, no preference check): booking confirmed/pending/approved/rejected/modified/cancelled, no-show/late-cancellation fees, refunds, upcharges, payment-failed, review responses, account warnings/suspension, payouts, ToS changes, salon strikes, review-prompt (a direct follow-up to the specific appointment just completed). MARKETING (must check `notification_preferences.deals_enabled` or `.rebooking_enabled` first): welcome-series, rebooking-nudge, birthday-messages (fixed 2026-07-27, was unconditional; the other two already checked). INTERNAL, not a customer send at all (no preference logic applies): daily-digest and reconcile (both `adminEmail` only), nail-infill-reminders (writes an internal `client_notes` row for the salon owner, not a customer email/SMS) | T1 mechanic (classification) / CONV (which bucket birthday-messages sits in, a celebratory non-booking-triggered send reads as marketing) |
| Every Resend send carries a text/plain part (seo-comms-07, IMPLEMENTED): `sendEmail()` (`lib/email.ts`) derives `text` from the same `html` via `stripHtmlToText()` when a template doesn't hand-write one, rather than a 60-function mechanical rewrite of every template body. Verified: a real HTML sample derives to correctly-spaced plain text with link URLs preserved in parens | T1 (documented deliverability + accessibility signal) |
| A promised unsubscribe link must exist and actually suppress (seo-comms-08, IMPLEMENTED): `app/api/unsubscribe` + `app/[locale]/unsubscribe` now back the link `salonOutreachInvitation`'s footer has always cited nDSG Art. 31 over. `salon_directory` (the only current audience, unclaimed leads, no `profiles` row, no dedicated opt-out column) has its own `email` column nulled on unsubscribe, a genuine migration-free suppression since it is the only column any future outreach send would read. A proper `unsubscribed_at` column is the correct long-term shape; adding one needs a migration, out of reach in the session that shipped this row | T1 (a cited legal basis conditional on a working opt-out cannot ship with a dead link) |
| Booking confirmation content floor (seo-comms-09, IMPLEMENTED): a booking confirmation must carry, at minimum, the salon's address, a link to view/manage/cancel the booking, and a calendar file. All three added to `bookingConfirmation()` (address, `manageUrl`, a `.ics` VCALENDAR attachment via new `lib/ics.ts`, no external dependency), wired into both send paths (`app/api/bookings/route.ts`, the Stripe webhook's online-pay path) | T1 (a confirmation whose only value is restating the booking form back is not doing the job of a confirmation) |
| Bounce/complaint suppression (seo-comms-10): correctly deferred, not absent forever. No Resend webhook, no bounce/complaint table exists today, and none should yet. Trigger: roughly 500+ transactional emails/day, or any single marketing-style send (birthday, rebooking nudge) exceeding a few hundred recipients per run. At ~28 salons and pre-launch test data, building this now is the premature machinery this project's own scale-discipline rule warns against | T2 (expect, not directly verified this pass) |
| Reminder-window configurability (seo-comms-11): the 23.5-24.5h SMS reminder window (`app/api/cron/sms-reminders/route.ts`) stays a single hardcoded constant. Whether-to-send-at-all is already a per-salon toggle (`sms_reminder_24h`/`sms_reminder_1h`); only the WHEN becomes a per-salon column the day a salon/category demonstrably wants a different cadence (spa/nails needing more notice than a barbershop's same-day walk-in-adjacent booking), or a late-reminder-caused-cancellation complaint appears in support data | CONV (reasoned, not externally sourced; a QUESTIONS.md-weight parked note, not a law-layer row, until the trigger fires) |
| x-default must derive from the same constant as the crawler-facing default locale (seo-comms-12, IMPLEMENTED): `lib/seo.ts`'s `buildAlternates()` used to hardcode `"de"` independently of `middleware.ts`'s own `defaultLocale` import, two files that could silently drift with nothing to catch it. Both now read `lib/locale-constants.ts` (split out of `i18n.ts` so a `"use client"` component importing `lib/seo.ts` doesn't pull `next-intl/server` into the client bundle) | T1 mechanic (the invariant is now structurally impossible to drift, not a documentation-only rule) |

**Also deferred, with trigger:** a Resend bounce/complaint webhook + suppression table (trigger: named above, seo-comms-10); a per-salon/per-category configurable reminder window (trigger: named above, seo-comms-11); localizing `salonOutreachInvitation` itself (currently German-only with zero live callers anywhere in the app, a distinct gap from the 17 audit-notifications functions this freeze fixed; revisit the day anything actually calls it); a proper `salon_directory.unsubscribed_at` column replacing the email-nulling stopgap (trigger: a DB migration session with schema-authority tooling available).

---

## Not yet frozen, and why

Topics and rows the research covered but this freeze deliberately does NOT lock, because the research itself names the item as unresolved rather than recommended:

- **Rate limiting: fail-open vs fail-closed on a Redis RUNTIME error (not just missing config).** `research/rate-limiting.md` section 8 is explicit that this is "an open owner question," not an oversight to quietly patch: today every limiter, including the abuse-prone ones (`ABUSE_PRONE_LIMITERS`), fails open on a runtime error from Upstash (a timeout, a connection reset), while the SAME limiters correctly fail closed when Redis is simply unconfigured. What would settle it: an explicit owner call on whether "fail open on every runtime error, including for payment/auth/booking limiters" is an acceptable tradeoff (Upstash's managed uptime is high and an attacker can't trigger transient errors on demand) or whether the abuse-prone limiters should fail closed on a runtime error too, matching the unconfigured-Redis behavior. This belongs in `QUESTIONS.md` once that file exists.
- ~~Whether `FORCE ROW LEVEL SECURITY` is actually set on Solen's salon-scoped tables~~ **RESOLVED 2026-07-27 (authz-rls-09), see `audit/authz.md` AUTHZ-06.** `relforcerowsecurity = false` on every one of the 150 public tables (confirmed live), and it does not matter: `pg_roles` shows `anon.rolbypassrls = false` and `authenticated.rolbypassrls = false`, so the app's own session client can never hit the owner-bypass path FORCE RLS guards against, only `postgres`/`service_role` bypass, and app traffic never connects as either. No action needed unless a future operational script, migration runner, or reporting connection is ever added that connects as the table owner against production data, at which point this row must be reopened.
- **The exact Netlify function timeout number.** Two of Netlify's own current doc pages disagree with each other (one states 60s non-configurable for synchronous functions, another states 30s for "standard serverless functions" in the same product family), per `research/jobs-async.md` and `research/reliability.md`. The DECISION (always set an explicit `maxDuration` on batch/loop-heavy crons) is frozen above regardless of the exact platform default; the number itself needs either a direct Netlify support confirmation or an empirical test (deploy a controlled-sleep route handler and observe where it's actually cut off), neither done in this research pass.
- **Whether GitHub secret-scanning/push protection is actually enabled on the Solen repo.** `research/security.md`'s secrets-storage row recommends confirming this as an action item; it is a settings check, not visible from the local working tree, and was not independently verified. Not a decision fork, a to-do for whoever owns repo settings.

---

## What Solen already does RIGHT (do not "fix" these)

RESTORED 2026-08-14 from `premerge-backup-2026-07-17`, same reason as section 0 above.
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

**All 15 topics are now audited** against live code (`audit/<topic>.md`, 15 files; roll-up + ranked fix list in `AUDIT_2026-07-16.md`). Two of them (`data-modeling`, `authz`) were checked against the LIVE DB via read-only `execute_sql`, not TS types.

But every audit is grep-exhaustive for its search patterns while deep-reading a **MINORITY sample**: roughly 15-25 files per topic out of ~354 routes + 264 migrations + 26 crons. **Treat "no gap found" in an unread corner as "not yet checked", never a clean bill of health.**

Each audit names its own blind spot; the sharpest ones:
- `authz`: 25 of 32 statically-flagged routes and ~322 unflagged routes NOT read.
- `transactions-concurrency`: ~165 unopened loop sites, a possible unswept N+1 source.
- `jobs-async`: 9 of 26 crons unverified for the very bug found in the other 17.
- `rate-limiting`: **whether Upstash is actually configured on the live prod deploy is UNKNOWN.** If it is not, every non-abuse-prone limiter is silently off in production right now.
- `reliability`: every timeout recommendation still needs a real measured p99 first; none was available.
