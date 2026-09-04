# Solen.ch security audit — 2026-09-04

Read-only. No file was edited. Dedup baseline read first: `_plans/AUTH_BACKEND_AUDIT.md`,
`_plans/GETUSER_MIGRATION.md`, `_plans/BACKEND_LOOP_2026-08-23.md`, `_plans/BACKEND_FIX_TRACKER.md`,
`_plans/CROSSCUTTING_BACKEND_AUDIT.md`, `_plans/SECURITY_AUDIT_P1.md` (2026-07-07), `_rules/LESSONS_LEARNED.md`.
No API route file was added or modified since 2026-09-01 (`git log --since=2026-09-01` on
`app/api/**/route.ts` returns nothing) and no new route was added since 2026-08-23, so the last
backend loop's coverage of route additions is current. This pass verified prior findings' CURRENT
state against the live code/migrations rather than re-deriving them, then covered the checklist
items no prior audit fully closed (cron secret comparison, CSP reporting wiring, headers,
redirects, secrets, uploads).

## Section 1 — the numbers

365 `app/api/**/route.ts` files, 243 pages, 377 migration files. 151 live DB tables, **0 with RLS
disabled** (`_inventory/_db-snapshot.json`, refreshed 2026-08-23).

Auth-helper census (regex over all 365 route files, hand-verified where the regex undercounted):
- `getSession()` used for identity anywhere in `app/` or `lib/`: **0**. Fully migrated to
  `getUser()` (verified JWT). The 12 client-side `auth.getSession()` calls that remain are all in
  `"use client"` components reading their own already-verified browser session for UI state, not
  a server authorization decision.
- `createAdminSupabaseClient` (service-role, bypasses RLS): 245 routes. **0** references to it or
  to `SUPABASE_SERVICE_ROLE_KEY` found in any `"use client"` file — not reachable from the browser
  bundle.
- `applyRateLimit`: 266 routes.
- `validateBody` (the project's zod wrapper): 166 routes.
- `.select("*")`: 70 call sites (matches the prior census's 74-file/107-site count for the pattern
  generally; sampled ~10 of the booking/client-adjacent ones by hand, none returned a sensitive
  column to a non-owner).
- 91 routes matched none of `requireAuth/requireAdmin/requireSalonOwner/requireSalonAccess/
  getSessionUser/getUser/CRON_SECRET` by regex. Hand-reclassified all 91 (`no_auth_routes.txt`,
  `classify_routes2.py` in the scratchpad): **69** actually gate on something the regex didn't
  match (`resolveBookingActor`, `resolveRequestUser`, an HMAC/guest-cookie token, a Stripe
  `constructEvent` signature, or an internal shared-secret header) and **22** are genuinely public
  GET endpoints returning non-personal browse/discovery/health data (salon listings, categories,
  cities, help, availability calendars, search) — read every one of the 22, none leaks PII or a
  secret.
- 30 `app/api/cron/*` routes, all check `CRON_SECRET` and all **fail closed** (503) when the env
  var is unset. **24 of 30** compare it with the project's own constant-time helper
  (`verifyCronSecret`/`constantTimeStringEqual`); **6 of 30** use a plain `!==` string compare
  (Section 2, finding 1).
- Supabase Edge Functions: the `supabase/functions/` directory **no longer exists** — the 7
  functions the 2026-07-09 audit flagged as having no request-auth gate were deliberately deleted
  (`_design-system/REMOVED.md:65`) and every scheduled job now runs through the CRON_SECRET-gated
  Next.js `/api/cron/*` routes instead. That CROSSCUTTING finding is closed by removal, not by
  patching the functions.
- RLS live-policy snapshot (`_inventory/_rls-policies.json`, 312 policies): dated **2026-07-07**,
  now ~2 months stale (Section 4). Cross-checked the highest-risk tables (`profiles`, `bookings`,
  `availability_slots`, `client_notes`, `client_tags`, `vouchers`, `staff_members`,
  `salon_payouts`, `discovery_items`, `salon_directory`, `booking_disputes`) against every
  RLS/GRANT/policy migration dated after 2026-07-07 (50 files) individually; current policy text
  is reproduced in the findings below for every table where it changed.

## Section 2 — ranked punch list

### 1. MEDIUM — 6 of 30 cron routes compare `CRON_SECRET` with a non-constant-time `!==`
`app/api/cron/affinity-recompute/route.ts:18`, `app/api/cron/db-backup/route.ts:26`,
`app/api/cron/discovery-ai-backfill/route.ts:20`, `app/api/cron/discovery-deadcheck/route.ts:27`,
`app/api/cron/process-deletions/route.ts:21`, `app/api/cron/salon-engagement-recompute/route.ts:16`.
All six correctly return 503 when `CRON_SECRET` is unset (fail closed) but then gate with
`authHeader !== \`Bearer ${cronSecret}\``, a plain string comparison whose runtime leaks how many
leading bytes matched. The other 24 cron routes use the project's own `verifyCronSecret()`
(`lib/cron-auth.ts:36`), which wraps `constantTimeStringEqual` for exactly this reason — the same
class of bug the walk-in tracking-token compare was fixed for previously (`_rules/
LESSONS_LEARNED.md` "secrets-webhooks-10"). Exploit: a network attacker who can send many
precisely-timed requests could in principle recover `CRON_SECRET` byte-by-byte and then invoke
these 6 crons (`affinity-recompute`, `db-backup` triggers a DB dump, `discovery-ai-backfill`/
`discovery-deadcheck` burn AI/API budget, `process-deletions` runs account-deletion sweeps) at
will; a real remote timing attack is hard over the internet's jitter, which is why this is MEDIUM
not HIGH. Fix: swap the `!==` in these 6 files for `verifyCronSecret(authHeader, cronSecret)`,
the exact helper the other 24 already use.
`prior: NEW` — not named in any of the read prior audits.

### 2. LOW/MEDIUM — CSP violation-report endpoint exists and is fully built, but the CSP header never points browsers at it
`app/api/csp-report/route.ts` (added 2026-08-14, commit `d25e70e27`) is rate-limited, dedupes by
origin, and writes to `record_csp_violation`. `netlify.toml:49` ships
`Content-Security-Policy-Report-Only` (last touched 2026-07-27, commit `e6ffc9db0`) with **no
`report-uri` or `report-to` directive** — its own comment still reads "No report-uri/report-to: no
CSP report-collection endpoint exists in this repo", which was true on 2026-07-27 and has been
false since 2026-08-14, three weeks before this audit. So the endpoint has received zero real
traffic since it shipped, and the documented rollout plan the endpoint's own file comment
describes ("watch real reports for a normal traffic week, fix what they name, THEN enforce") can
never proceed — there is nothing telling browsers to send it anything, so the CSP will stay
Report-Only (i.e. not actually blocking anything) indefinitely by omission rather than by
decision. Not itself exploitable (Report-Only never blocked an XSS payload either way), but it is
the reason a real CSP enforcement layer against XSS has effectively stalled. Fix: add
`report-uri /api/csp-report; report-to csp-endpoint` (plus a matching `Reporting-Endpoints` header
for the newer `report-to` spec) to the `Content-Security-Policy-Report-Only` value in
`netlify.toml`.
`prior: _plans/BACKEND_LOOP_2026-08-23.md:31` — recorded there only as one word in a list
("...csp-report and account-warnings receiver-with-no-sender notes came from them"), never
written up as its own ranked item and never fixed. **Still open**, first full write-up here.

### 3. LOW — dev-only login route's redirect `to` param has no same-origin check, but the whole route 404s outside `NODE_ENV=development`
`app/api/dev/login/route.ts:39-40`. `toPath.startsWith("/") ? toPath : \`/${toPath}\`` never
rejects `//evil.com` (a protocol-relative URL) or a backslash-based bypass the way
`app/api/auth/callback/route.ts:17` now does. Impact is bounded to nothing in production: line
21-23 hard-returns 404 unless `process.env.NODE_ENV === "development"`, and `next build` sets
`NODE_ENV=production`, so this can't run on the Netlify-built deploy. Exploit would require an
attacker who can already set `NODE_ENV=development` on the running server, at which point they
already have far worse access than an open redirect. Fix (cheap, not urgent): mirror the same
`!rawRedirect.startsWith("//") && !rawRedirect.includes("\\")` guard used in `auth/callback` for
consistency, since it's a two-line change and the file is a template other dev routes may copy.
`prior: NEW`.

## Prior findings re-verified as FIXED (current state, not re-reported as new)

Every item below was a real, confirmed finding in an earlier audit. Re-checked against the current
code/migrations; all now closed. Listed so nobody re-finds them.

- **Auth identity: `getSession()` → `getUser()` migration.** `prior: _plans/GETUSER_MIGRATION.md`.
  `lib/supabase.ts:68` (`getSessionUser`) and `lib/auth/require.ts:56` (`requireAuth`) both call
  `auth.getUser()`. Zero `auth.getSession()` calls remain anywhere in `app/` or `lib/` for an
  identity decision (verified by grep across the whole tree, not just `app/api`).
- **`profiles` role self-escalation (SECURITY_AUDIT_P1 rank 1, CRITICAL, 2026-07-07).**
  `prior: _plans/SECURITY_AUDIT_P1.md`. Fixed same day:
  `supabase/migrations/20260707120000_security_phase1_profiles_privilege_guard.sql` adds a
  `BEFORE UPDATE` trigger (`guard_profile_privilege_columns`) that reverts `role`, `is_admin`,
  `is_suspended`, `account_status` to their old values for any caller whose `auth.role()` isn't
  `service_role`. The `profiles_update_4c9184_m` RLS policy itself still has no column
  restriction (RLS can't express one), so the trigger is the actual gate, and it's in place.
- **`bookings` mass-assignment via the customer's own UPDATE policy.**
  `prior: SECURITY_AUDIT_P1.md` (systemic pattern #1). Closed by
  `supabase/migrations/20260711211500_audit_fix_bookings_protected_fields_guard.sql`, a
  `BEFORE UPDATE` trigger blocking a non-owner/non-admin from changing `price_paid`,
  `payment_status`, `paid_amount`, `platform_fee`, `refunded_amount`, `stripe_customer_id`,
  `stripe_payment_method_id`, `stripe_setup_intent_id`, `fee_charge_*`, `applied_tier`,
  `tier_discount_amount`. Sibling status-escalation trigger from
  `20260709184246_audit_fix_bookings_status_escalation_guard.sql` also confirmed present.
- **`availability_slots` base-table `OR true` SELECT policy (world-readable booking calendar
  including who booked what).** `prior: _rules/LESSONS_LEARNED.md` "A view is INVISIBLE to RLS by
  default". The `_inventory/_rls-policies.json` snapshot (2026-07-07) still shows the `OR true`
  text, but three later migrations supersede it, confirmed applied and self-documented as
  captured from the live catalog: `20260712161000` + `20260717180000` (ALTER POLICY to owner-only
  on the base table) and `20260718120000_fix_availability_slots_public_select_rls.sql` (adds back
  a public SELECT scoped to `status = 'available'` only, so a booked slot's `booked_by`/
  `booking_id`/`client_id` stay owner-only). The `availability_slots_public` barrier view got its
  `security_invoker = true` fix in `20260728_availability_slots_public_security_invoker.sql`, and
  that migration file records a live PostgREST discriminating test (booked rows return `*/0`,
  available rows unchanged) proving it actually took effect, not just that the SQL ran.
- **`public_profiles` / `profile_summaries` views writable + `SECURITY DEFINER`, letting any
  signed-in user delete another user's profile row through the view.**
  `prior: SECURITY_AUDIT_P1.md`-class finding, fixed
  `supabase/migrations/20260712140000_audit_fix_profile_views_writable_critical.sql`:
  INSERT/UPDATE/DELETE/TRUNCATE revoked from anon/authenticated, `security_invoker = true` set on
  both views.
- **`/api/dashboard/clients/[id]/notes` and `/tags` GET — IDOR, any signed-in user reads another
  salon's private client notes/tags.** `prior: _plans/AUTH_BACKEND_AUDIT.md` (HIGH, confirmed x2).
  Both files now check `salon?.owner_id !== user.id` at line 27 before the read
  (`app/api/dashboard/clients/[id]/notes/route.ts:27`, `.../tags/route.ts:27`).
- **`/api/dashboard/barber-leaderboard` and `/api/dashboard/walkin-analytics` — IDOR, any
  signed-in user reads any salon's staff revenue / walk-in analytics.**
  `prior: AUTH_BACKEND_AUDIT.md` (HIGH x2). Both now check
  `salon?.owner_id !== user.id && profile?.role !== "admin"` before querying
  (`barber-leaderboard/route.ts:36`, `walkin-analytics/route.ts:41`).
- **Auth rate limiting keyed on spoofable `X-Forwarded-For`.** `prior: AUTH_BACKEND_AUDIT.md`
  (HIGH). `lib/ratelimit.ts:435-449` `getClientIp()` now prefers Netlify's edge-set
  `x-nf-client-connection-ip`, then `x-real-ip`, and only falls back to the spoofable XFF leftmost
  entry when neither trusted header is present.
- **Open redirect in `/api/auth/callback` via `\`-normalization.** `prior: AUTH_BACKEND_AUDIT.md`
  (MEDIUM, confirmed 2/3). `app/api/auth/callback/route.ts:17` now rejects any redirect target
  containing `//` or `\`, not just a bare `startsWith("//")` check.
- **Account/email enumeration on signup.** `prior: AUTH_BACKEND_AUDIT.md` (MEDIUM). `app/api/auth/
  signup/route.ts:96-100` now always returns the same 200 "Verification code sent" regardless of
  whether Supabase's `identities` array says the account already existed.
- **Unauthenticated phone-OTP SMS-bombing (IP-only rate limit, target phone unbounded).**
  `prior: AUTH_BACKEND_AUDIT.md` + `CROSSCUTTING_BACKEND_AUDIT.md` (HIGH). `app/api/auth/
  verify-phone/send/route.ts:30-33` now rate-limits on the normalized target phone number in
  addition to caller IP.
- **`/api/notify/review-replied` — unauthenticated open email relay + unescaped HTML injection
  (CRITICAL).** `prior: CROSSCUTTING_BACKEND_AUDIT.md`. Now requires a matching `x-internal-secret`
  header verified with `constantTimeStringEqual` against `CRON_SECRET`
  (`app/api/notify/review-replied/route.ts:19-21`), and the only caller
  (`app/api/reviews/[id]/respond/route.ts:84-87`) sends that header. Reply text is rendered
  through `reviewRepliedEmail`, and the earlier finding that its HTML wasn't escaped
  (`BACKEND_LOOP_2026-08-23.md` R2) is separately confirmed fixed in `lib/email.ts`.
- **`/api/notify/review-posted` — unauthenticated salon-owner email-bombing.**
  `prior: CROSSCUTTING_BACKEND_AUDIT.md` (HIGH). Same internal-secret gate now present
  (`app/api/notify/review-posted/route.ts:16-19`), caller confirmed at
  `app/api/reviews/route.ts:165-169`.
- **`/api/unsubscribe` — any anonymous caller could permanently null a salon directory listing's
  email (locks it out of ever being claimed).** `prior: _plans/BACKEND_LOOP_2026-08-23.md` R1
  (verified real by the orchestrator). `app/api/unsubscribe/route.ts:44-46` now requires
  `verifyUnsubscribeToken(email, token)` to succeed before the `UPDATE ... SET email = null`.
- **Supabase Edge Functions with no request-auth gate, invocable by anyone holding the public anon
  key.** `prior: CROSSCUTTING_BACKEND_AUDIT.md` finding 3 (HIGH). The entire `supabase/functions/`
  source tree is gone; `_design-system/REMOVED.md:65` records the deliberate deletion, and every
  scheduled job it used to cover now runs through a `CRON_SECRET`-gated `/api/cron/*` route per
  `.github/workflows/cron-jobs.yml`.

## Section 3 — checked and CLEAN (no need to re-check)

- **Stripe webhook signature verification.** `app/api/stripe/webhook/route.ts:31-46` reads the raw
  body via `req.text()` (not parsed JSON) before calling `stripe.webhooks.constructEvent(body, sig,
  webhookSecret)`, and returns 400 if either the signature header or the secret is missing. Claim
  processing is atomic (insert into `processed_webhook_events`, PK on `event_id`, 23505 = already
  processed) rather than check-then-insert.
- **Service-role client never reachable from the browser bundle.** Zero references to
  `createAdminSupabaseClient` or `SUPABASE_SERVICE_ROLE_KEY` in any `"use client"`-marked file
  across `app/`, `components/`, `components-legacy/`.
- **Hardcoded secrets in tracked source.** No `sk_live_`/`sk_test_`/`whsec_`/JWT-shaped
  (`eyJhbGciOi...`) strings, no AWS-key-shaped or Google-API-key-shaped strings, in any tracked
  `.ts/.tsx/.js/.json/.md` file. `.env.example` contains only placeholder text (`eyJ...`,
  `sk_live_...`). `git ls-files | grep env` returns only `.env.example`. `.gitignore:31-34,95-96`
  covers `.env`, `.env.local`, `.env.*.local`, `.env.production`, `.env.sentry-build-plugin`,
  `.env*.bak*`. `git log --all -S 'sk_live_'` over the whole repo history returns no commit that
  ever introduced a real Stripe live key.
- **Security headers on every response.** `netlify.toml:20-27`: HSTS
  (`max-age=63072000; includeSubDomains; preload`), `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` denying camera/microphone by default. `/api/*` additionally gets
  `Cache-Control: no-store, no-cache, must-revalidate`.
- **Open redirect sweep across every `NextResponse.redirect` call in `app/api`.** Only two routes
  build a redirect target from anything other than a hardcoded literal path:
  `app/api/auth/callback/route.ts` (fixed, see above) and the dev-only `app/api/dev/login/route.ts`
  (Section 2, item 3, low severity by construction). Every other `NextResponse.redirect` in
  `app/api` (`auth/logout`, `salons/verify` x5) targets a fixed `${origin}/de...` string with no
  user input in the path.
- **Voucher validation.** `app/api/vouchers/validate/route.ts`: rate-limited per-IP, one generic
  failure message for not-found/unpaid/redeemed/expired (no oracle), exact `.eq()` match on the
  code (not `.ilike`, which would allow `%`/`_` wildcard binary search), explicit column
  allowlist in the `.select()` rather than `*`.
- **`profiles` self-update RLS + trigger.** Column-level privilege escalation is blocked by the
  trigger above; non-privilege columns (display_name, locale, avatar, birthday, etc.) remain
  freely self-editable by design.
- **Storage buckets.** `salon-documents` and `formula-photos` are `public = false`
  (`supabase/migrations/20260712160000_create_missing_storage_buckets.sql`) with object-read/
  insert policies scoped to `(storage.foldername(name))[1] IN (SELECT id FROM salons WHERE
  owner_id = auth.uid())`. `review-photos` is intentionally `public = true`. Six upload routes
  (gallery, client photos, formula-photo, review photos, salon documents, service photos) were
  previously confirmed SOUND by `CROSSCUTTING_BACKEND_AUDIT.md` (owner-scoped + MIME allowlist +
  size cap on every one); spot-checked the bucket-privacy migration above as independent
  corroboration rather than re-reading all six route files byte-for-byte.
- **SSRF via the discovery thumbnail proxy.** `app/api/discovery/thumb/[id]/route.ts` only ever
  fetches a fixed host (`tiktok.com/oembed`) plus whatever URL that response itself returns; the
  caller never controls the fetch target directly (only a stored `discovery_items.id` which maps
  to a DB-stored `tiktok_url`). Already refuted in `CROSSCUTTING_BACKEND_AUDIT.md`; re-confirmed
  the route is unchanged since. No other `fetch()` call in `app/api` takes a raw user-supplied URL
  as its target — every other dynamic `fetch()` (`translate`, `geocode`, `transit/nearest-stop`,
  `ai/intake-recommendation`, admin discovery import/backfill) either calls a fixed external API
  host or fetches a URL that was itself already stored server-side from a prior fixed-host call.
- **22 "TRULY-OPEN" (no auth-helper match) GET routes** — read every one individually
  (`no_auth_routes.txt` in scratchpad, cross-referenced against `classify_routes2.py`'s output):
  `analytics/platform`, `availability/[salon_id]`, `availability/unavailable-dates`, `brand/[slug]`,
  `content`, `dev/login` (Section 2/3 above), `discovery/category-meta`, `health`,
  `homepage-sections`, `intake/templates`, `metrics/global`, `salons/[slug]/badges`,
  `salons/by-slug/[slug]`, `salons/quartier-counts`, `salons/quartier-featured`, `salons/similar`,
  `salons/trending`, `search/detect-category`, `slots/last-minute`, `slots/next-available`,
  `staff/[id]/profile`, `walkin/queue-stats`, `walkin/salon-info`. All return only
  public-by-design browse/discovery/booking-availability data (salon names, categories, staff
  display names/photos, available time slots, aggregate counts). None returns a customer's PII,
  a payment identifier, or an internal secret.
- **Auth rate-limit coverage.** login, signup, verify-otp, verify-phone/send, verify-phone/check
  all call `applyRateLimit(authLimiter, ...)`.
- **`app/api/bookings/[id]/quick-action` one-click email confirm/cancel link.** This is the exact
  historical CRITICAL scenario CLAUDE.md's project memory names (a stranded `consumed_at`
  migration with zero replay protection) — but the CURRENT live route is a different, already-
  fixed design, not the stranded one: HMAC-signed token (`lib/env.ts` `BOOKING_HMAC_SECRET`),
  `crypto.timingSafeEqual` compare, embedded expiry, and a **per-action** single-use marker
  (`confirm_link_used_at` / `cancel_link_used_at`, set via a compare-and-swap `UPDATE ... WHERE
  status = X AND link_used_at IS NULL`) recovered 2026-08-14. Separately, guest self-service
  booking access (`lib/bookings/guest-access.ts`) uses a 256-bit token, SHA-256 hash-at-rest
  (never the raw token persisted), and a timing-safe, length-normalized compare — a different,
  intentionally TTL-based (not single-use) mechanism for a different purpose (ongoing guest
  access to their own booking, not a one-shot action link).

## Section 4 — could not verify / limitations

- **RLS policy live-truth snapshot is ~2 months stale.** `_inventory/_rls-policies.json` is dated
  2026-07-07; no Supabase MCP connection was available in this session (the connector needs
  authorization the user hasn't granted in this environment) and no direct DB credential is
  usable from a read-only sandboxed audit without printing `.env.local` values, which is
  prohibited. I cross-verified every high-risk table I could find a later migration for (11
  tables, 50 candidate migration files individually opened), but a table with **no** RLS-touching
  migration after 2026-07-07 is reported here on the strength of the 2026-07-07 snapshot alone,
  not a live re-query. Recommend running `node scripts/rls-drift.mjs` with the DB secret in CI
  (its own header names this exact gap) or a fresh `apply_migration`-adjacent live dump.
- **`.select("*")` sweep was a sample, not exhaustive.** 70 call sites exist; ~10 were opened by
  hand (the ones on `bookings`-adjacent tables, the highest-risk join). The remaining ~60 were not
  individually read this session.
- **Upload routes were corroborated, not re-read line-by-line.** `CROSSCUTTING_BACKEND_AUDIT.md`
  already did a full per-route read of all six upload endpoints and found them sound; this pass
  independently checked the underlying bucket-privacy migration rather than re-reading every route
  handler, so a regression introduced in application code (not the DB policy) since 2026-07-09
  without a corresponding migration would not be caught by this pass specifically (though the
  general "no new/changed API routes since 2026-08-23" finding in Section 1 bounds that risk).
- **GitHub Actions run history for the 30 cron jobs.** Whether the crons are actually firing on
  schedule in production (vs. failing silently) could not be checked — `gh run list` requires
  network access this sandbox does not have to `api.github.com`. `BACKEND_LOOP_2026-08-23.md`
  already logged this exact same limitation for the same reason; still true today.
- **Whether `auth_leaked_password_protection` is enabled** is a Supabase-dashboard toggle, not
  code, and was already flagged to the owner as an open decision in
  `_plans/BACKEND_LOOP_2026-08-23.md` (still parked as of that file's last entry, 2026-09-01). Not
  independently re-checked here since it isn't verifiable from source and isn't this audit's to
  decide.
- **Netlify's own edge/proxy configuration** (whether `x-nf-client-connection-ip` really can't be
  spoofed by a client on this specific hosting setup) was taken on the strength of the in-repo
  comment citing Netlify's documented behavior; not independently verified against Netlify's own
  docs or a live request in this session.
