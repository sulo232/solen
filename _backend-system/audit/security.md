# Security , Solen vs `LAW.md` section 8 (audit 2026-07-16)

> Parts of this document were written from a source read and were WRONG. Live-verified corrections are marked `CORRECTED 2026-07-17` inline. Where this doc and the live re-audit disagree, live wins.

## Verdict

Stronger than typical for this stage: CORS is a real allowlist, mass assignment is blocked everywhere sampled, identifier injection is avoided by construction, and the one real SSRF incident was fixed MORE thoroughly than the research knew (including the `redirect:"manual"` half it had marked unverified). Four gaps survive with file:line, one broader than research described, plus one genuinely NEW finding.

## Per-principle table

| id | rule | verdict | evidence | severity |
|---|---|---|---|---|
| SEC-01 | Client-chosen sort/filter column hits a hardcoded allowlist | MATCH | `app/api/salons/route.ts:454-459`, `search/treatments/route.ts:16`, `reviews/salon/[salon_id]/route.ts:23-25` all map `sort` through an if/else to a fixed column. Zero `.order(`/`.select(` anywhere in `app/api` takes a raw request string | NONE |
| SEC-02 | Every server-side fetch of a user-supplied URL goes through the SSRF guard | PARTIAL | `lib/ai-vision.ts:216,266` call the guard AND use `redirect:"manual"` (resolves a research "Unverified"). `admin/discovery/staging/route.ts:81` and `admin/discovery/backfill/route.ts:131` call neither. **CORRECTED 2026-07-17 (live re-audit):** the guard is stronger than described here too, it undersold as a plain CIDR blocklist. Evidence: executed the real `assertSafeFetchUrl` module directly, 15/15 hostile cases BLOCKED including decimal-encoded `2130706433`, hex-encoded `0x7f000001`, short-form `127.1`, and `[::ffff:127.0.0.1]`, plus 1/1 legit case (`images.unsplash.com`) ALLOWED. Because it checks every DNS-resolved address rather than only the literal, it defeats all three encoding bypasses that beat a naive CIDR blocklist. | MEDIUM |
| SEC-03 | Every secret comparison uses `crypto.timingSafeEqual` | GAP, **fleet-wide, broader than research** | Research sampled 3 crons and generalised. Read **all 25** `/api/cron/*` routes checking `CRON_SECRET`: **every one** uses a plain `!==`. **Zero** use `timingSafeEqual`, despite 5 other sites in this codebase doing it correctly (`lib/bookings/guest-access.ts:79` is the canonical shape) | LOW |
> **CORRECTED 2026-07-17 (live re-audit):** the plain-`!==` finding is confirmed, but the count is **26** routes, not 25 (`grep -rln CRON_SECRET app/api/cron/ | wc -l` -> 26; `grep -rl timingSafeEqual app/api/cron/` -> 0). More importantly, this row never establishes the fact that actually decides LOW vs CRITICAL: whether all 26 ALSO fail closed when `CRON_SECRET` is unset (`CRON_SECRET` is optional in `lib/env.ts`). Live probe: with `CRON_SECRET` unset, hostile auth headers across 4 routes x 3 header shapes = 12/12 returned HTTP 503 before any side effect. So severity stays LOW, confirmed, not assumed.
| SEC-04 | Never spread a raw body into `.insert()`/`.update()` | MATCH | Fresh grep for `.insert({ ...body` / `.update({ ...body` across all of `app/api`: **0 hits** | NONE |
| SEC-05 | CSP set | GAP | `netlify.toml:20-33` sets nosniff, X-Frame-Options, Referrer-Policy, HSTS, Permissions-Policy. `Content-Security-Policy` appears **nowhere in the repo** | MEDIUM |
> **CORRECTED 2026-07-17 (live re-audit):** STALE, already FIXED. A `Content-Security-Policy-Report-Only` header now ships at `netlify.toml:58` with 11 directives, landed in commit `6d24a26e7` ("feat(#12): CSP, report-only, with a MEASURED origin list"), the same session as this audit's own recommendation #2 below. Do not re-do rec #2. Evidence: `grep -rln Content-Security-Policy` (excluding node_modules/.next/.git) now matches exactly `netlify.toml`; `git log --oneline -- netlify.toml` shows `6d24a26e7`. The real remaining gap is that the report-only policy reports violations to nobody (no `report-uri`/`report-to` endpoint wired).
| SEC-06 | Magic-byte validation + random key + bucket `allowed_mime_types` | GAP | **No magic-byte check anywhere** (0 hits for a sniffing lib). All 4 upload routes read in full check only `file.type` (client-supplied). `allowed_mime_types` set on **1 of 8** buckets (`service-photos`, after its own incident). Predictable `Date.now()` keys at `clients/[id]/photos:77`, `services/[id]/photos:61`, `salons/[slug]/gallery:82` | MEDIUM |
| SEC-07 | No `select("*")` on a sensitive table | PARTIAL | `recommendations/route.ts:211` confirmed FIXED (the campaign CRITICAL). `profile/route.ts:17` still `select("*")` on the caller's OWN RLS-scoped row and spreads it raw | LOW |
| SEC-08 | CORS allowlist, never wildcard | MATCH | `middleware.ts:44-72`: hardcoded `allowedOrigins`, checked before setting any CORS header. No credentials header | NONE |
| SEC-09 | Secrets never in a URL / never leak to a third party | **GAP, NEW** | Detail below | MEDIUM |

## NEW finding: the guest booking token leaks to PostHog

`lib/bookings/guest-access.ts`'s own header states the design: the token is "exchanged ONCE for a short-lived httpOnly cookie... never in the URL path." The issuing side (hashing, `timingSafeEqual`, TTL) is careful and correct. The consuming side does not match:

- The 256-bit token rides in `/confirmation?...&access_token=...` and in the durable, savable `/booking/lookup?code=&t=` link.
- `app/[locale]/booking/lookup/page.tsx:88-108` exchanges it correctly via a background `fetch()` (the server never echoes it), but **never calls `history.replaceState`/`router.replace`**, so the raw token stays in the address bar and history.
- `components-legacy/PostHogProvider.tsx:19-24` inits PostHog with no `sanitize_properties`/`property_denylist`/URL masking. PostHog's own docs confirm `capture_pageview` and `autocapture` both default to `true`, so `$current_url` (full query string) is captured by default. PostHog has an open issue for exactly this class ([#18336](https://github.com/PostHog/posthog/issues/18336)).

**The real bound:** capture is opted OUT by default and only fires after that browser accepted the analytics cookie. When it fires, a third party receives a live bearer token valid for up to 30 days that can view the booking and enter the report/refund flow.

**Fix:** either alone suffices, do both. (a) `router.replace()` after a successful exchange, stripping `t=`/`access_token=`. (b) a PostHog `property_denylist`/`before_send` stripping those params from `$current_url` project-wide, a durable backstop for the next time a secret lands in a URL.

## Ranked recommendations

1. **Strip the guest token from the URL after exchange + add the PostHog denylist (SEC-09).** Cost: one `router.replace()` + a few lines of PostHog config. The only finding that hands a live credential to a third party.
2. **Ship CSP report-only first, then enforce (SEC-05).** Cost: one header, but the real cost is the staging period to see what breaks (Stripe.js, Maps, PostHog, Next's inline runtime). Highest-value header left; the 7 `dangerouslySetInnerHTML` sites currently have no second line of defence.
3. **Set `allowed_mime_types` on the other 7 buckets (SEC-06).** Cost: one `UPDATE storage.buckets` migration line per bucket. Nearly free; the app-layer check is a string the attacker controls.
4. **Add magic-byte validation (SEC-06).** Cost: one ~20-line shared helper called from ~8-11 upload routes. The real engineering cost here, but not an architecture change.
5. **Route the 2 unguarded fetches through the SSRF guard (SEC-02).** Cost: 2 lines each. Narrowed by provenance (both URLs come from admin-triggered ingestion of TikTok oEmbed/stock APIs, not an anonymous form field), but the law is unconditional.
6. **Add a shared `verifyCronSecret(req)` using `timingSafeEqual` (SEC-03).** Cost: one helper + 25 call-site swaps. Genuinely LOW severity (server-to-server secret, noisy serverless timing channel), and it removes duplication `_docs/BACKEND.md` already flags.

**DO NOT DO YET** + trigger: a secrets vault over env+Zod (trigger: a second team member or a real rotation requirement) · field-level PII encryption (Supabase itself says do not use pgsodium, it is deprecating) · DNS-rebinding-proof SSRF (trigger: a user-supplied-URL feature open to anonymous users) · AV scanning (trigger: user-to-user file sharing) · a full CSP nonce pipeline on day one (start with the domain allowlist).

## What Solen already does RIGHT

- **The SSRF guard is better than research credited:** `lib/security/ssrf-guard.ts` blocks 0.0.0.0/8, 10/8, 127/8, **169.254/16 (metadata, explicit)**, 172.16/12, 192.168/16, 100.64/10 (CGNAT, a deliberate extra) + IPv6, and blocks on unresolvable hosts rather than failing open. Both real call sites also pass `redirect:"manual"`.
- **CORS is a real allowlist, verified live.** Nothing to touch.
- **Mass assignment discipline is real**, verified by a fresh grep, not inherited.
- **Timing-safe comparison IS the house standard in 5 places**, incl. a careful `guest-access.ts` that normalises to fixed length before comparing and compares BEFORE the expiry check so a missing token does not leak via an early return.
- **`recommendations/route.ts:211`'s prior CRITICAL is confirmed fixed in code** (it had shipped `stripe_account_id`/`owner_id` to an unauthenticated route).

## Sampling honesty

Exhaustive (not sampled) for: all 25 `CRON_SECRET` crons, all 3 sort-param routes, every `.order(`/`.select(` with a non-literal arg, every `assertSafeFetchUrl` call site, the 7 files that both reference a URL field and call `fetch(`, `.insert/.update` body spreads, `Content-Security-Policy` (0 repo-wide), the 8 buckets referenced from `app/api`. **Did NOT** read all ~354 routes; did not attempt DNS-rebinding exploitation; did not check buckets never touched from `app/api`; did not re-run `npm audit`. Absence of a finding in an unread route is "not checked."
