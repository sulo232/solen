# Security , researched law

Date: 2026-07-16. Sources fetched this run: 16 (listed at the bottom, each with what it established). Who this is for: any session touching an API route, auth, a webhook, a file upload, a fetch of a user-supplied URL, or a security header, on Solen.ch (Next.js 15.3.8 App Router, Supabase Postgres + PostgREST, Stripe Connect, Netlify, ~28 salons live, low traffic, serverless/cold-lambda request model).

This file is LAW for future sessions. Every claim below is tagged T1/T2/T3/CONV/MYTH per the tiering rubric in the task brief. Where the codebase already does the right thing, that is cited as the concrete pattern to keep; where it does not, that is named as a live finding, not smoothed over.

---

## 0. The short version (10 rules a new session must obey)

1. **Parameterize, never string-build SQL.** Supabase's JS client (`.eq()`, `.filter()`, `.ilike()`) and PostgREST itself parameterize every VALUE automatically; the only injection surface left is column/table names and raw SQL in migrations, which must be allowlisted, never built from request input. T1.
2. **Every user-supplied URL a server fetches (webhooks, avatar-by-URL, AI vision, etc.) must go through `assertSafeFetchUrl()` (`lib/security/ssrf-guard.ts`) first.** It blocks loopback/private/link-local/metadata ranges by IP, not by hostname string match. T1 (OWASP SSRF cheat sheet), a known live gap: it does not defend DNS rebinding (documented in the file's own header comment).
3. **CSP is the one security header Solen does not send.** Netlify adds zero security headers by default; everything in `netlify.toml` was hand-added, and CSP was never added to that list. This is the single highest-value gap this file found. T1 finding, T2 fix path.
4. **CORS is allowlist-based already (`middleware.ts`), not a wildcard.** Keep it that way; a wildcard + credentials is browser-rejected anyway (T1), but a wildcard without credentials is still a data-exposure risk for any authenticated-by-cookie route.
5. **Constant-time compare every secret/token comparison, no exceptions.** The guest-access, walk-in, and loyalty-QR code paths already do this correctly with `crypto.timingSafeEqual`. The cron-secret check in every `/api/cron/*` route uses a plain `!==` string compare instead, an inconsistency worth closing (T1 finding, low severity given the low-entropy trigger scenario, see section 10).
6. **Never spread raw request body into `.insert()`/`.update()`.** Zod-validate first, then spread the *validated* object (the codebase does this correctly everywhere checked, e.g. `.insert({ ...validated, salon_id: salon.id })`); a raw `.insert({ ...body })` would be mass assignment. T1.
7. **Dependencies have a live critical CVE right now.** `npm audit` (run this session) shows 1 critical (protobufjs, transitive via `posthog-js`), 2 high (`next` itself, `lodash` transitive via `recharts`), 17 moderate. This is not hypothetical, it is the current state of `package-lock.json`. T1 finding (verified by running the tool, not memory).
8. **File uploads: validate by magic bytes, never trust `Content-Type` or extension alone; store under a random key, never the user's filename.** T1 (OWASP File Upload cheat sheet). Not fully verified against every one of Solen's 11 upload routes in this pass, see Unverified.
9. **TLS is Netlify's job, not ours, and it is done correctly.** Netlify auto-provisions Let's Encrypt certs and Solen's `netlify.toml` already sends `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`. Nothing to add here. T1.
10. **security.txt does not exist yet.** RFC 9116 is a five-minute add (two required fields, no code) with real value once salons handle client PII and card-adjacent flows at any volume. T1 for the spec, T3 for how much it matters at 28 salons (see Premature section, though this one is genuinely NOT premature, it is nearly free).

---

## 1. OWASP Top 10 (edition) and OWASP API Security Top 10

**The question:** which edition is current, and did anything change that affects how we prioritize.

**What the evidence says.** The OWASP Top 10 was updated in **November 2025** to the **OWASP Top 10:2025**, the first refresh since 2021 (T1, [owasp.org/Top10/2025](https://owasp.org/Top10/2025/0x00_2025-Introduction/)). Full list:

| Rank | 2025 | 2021 equivalent |
|---|---|---|
| A01 | Broken Access Control | Broken Access Control (unchanged #1) |
| A02 | Security Misconfiguration | moved up from #5 |
| A03 | Software Supply Chain Failures | NEW, expands 2021's "Vulnerable and Outdated Components" |
| A04 | Cryptographic Failures | dropped from #2 |
| A05 | Injection | dropped from #3 |
| A06 | Insecure Design | dropped from #4 |
| A07 | Authentication Failures | renamed from "Identification and Authentication Failures" |
| A08 | Software or Data Integrity Failures | unchanged |
| A09 | Security Logging & Alerting Failures | renamed from "...and Monitoring Failures" |
| A10 | Mishandling of Exceptional Conditions | NEW |

The most consequential structural change for a codebase like Solen's: **SSRF was folded into Broken Access Control** rather than kept as its own bucket, and **Supply Chain got its own top-3 category** for the first time, reflecting that dependency compromise (not just outdated versions) is now judged a distinct, larger risk class than in 2021 (T2, corroborated by [Qualys](https://blog.qualys.com/qualys-insights/2026/06/15/what-changed-in-owasp-top-10-2025-and-recommendations-for-each-category) and [GitLab's](https://about.gitlab.com/blog/2025-owasp-top-10-whats-changed-and-why-it-matters/) independent writeups of the same list).

The **API Security Top 10** is a separate OWASP project and is still on its **2023 edition** (T1, [owasp.org/API-Security/editions/2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/), no 2025 refresh has happened for the API list as of this fetch):

API1 Broken Object Level Authorization, API2 Broken Authentication, API3 Broken Object Property Level Authorization (merges 2019's Excessive Data Exposure + Mass Assignment), API4 Unrestricted Resource Consumption, API5 Broken Function Level Authorization, API6 Unrestricted Access to Sensitive Business Flows, API7 SSRF, API8 Security Misconfiguration, API9 Improper Inventory Management, API10 Unsafe Consumption of APIs.

**Solen fit.** Solen is 354 API route files, essentially a pure API product with a thin server-rendered shell, so the **API Top 10 is the more relevant lens day to day**, and it already maps directly onto this project's own S1-S6 rule stack: API1/API5 (object/function level authz) = the `requireSalonOwner`/role-check pattern; API2 = the `getUser()`-not-`getSession()` rule; API3 = the mass-assignment discipline in section 8; API4 = the rate-limit stack; API7 = the SSRF guard; API9 = arguably a real gap, nothing in this codebase currently inventories which of the 354 routes are meant to be public vs internal-only (`_inventory/SURFACE.md` documents structure, not intended exposure).

**Cost of using this as the checklist:** none, it is free to reference; the risk is treating "we cover API1-API10" as a completeness proof when the Top 10 by construction is not exhaustive (T1, OWASP's own framing: it is an awareness document of the *most common* risks, not a full taxonomy).

---

## 2. SQL injection, parameterization, and the PostgREST angle

**The question:** does Solen's stack (Supabase JS client -> PostgREST -> Postgres) actually prevent injection, and where is the residual risk.

**What the evidence says.** Parameterized queries (prepared statements) are the T1-recommended primary defense because the database driver sends the query text and the user-supplied values as **separate wire-protocol messages**; the SQL parser never re-parses the value as code, so there is no string for an attacker to break out of ([OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)). Escaping is explicitly rated **"STRONGLY DISCOURAGED"** by the same cheat sheet: escaping is a denylist of dangerous characters that varies by DB/context and "cannot guarantee prevention of all SQL injections in all situations" (T1). This is the general form of the same allowlist-over-denylist principle that recurs in SSRF and mass assignment below, worth naming once: **allowlisting/parameterizing survives things you didn't think of; denylisting/escaping only survives things you did.**

PostgREST specifically: every `.eq()`, `.filter()`, `.ilike()` etc. call from `@supabase/supabase-js` is translated into a parameterized query at the PostgREST layer, so **values are always safe** (T2, [PostgREST docs](https://docs.postgrest.org/en/v14/references/configuration.html) + corroborating community discussion). The one place parameterization structurally cannot help is **identifiers** (column/table names), because SQL has no bind-parameter syntax for identifiers, only for values; a query builder that lets a caller choose which column to filter/sort/select by string must validate that string against an allowlist of real column names, never pass it through unchecked (T2, [PostgREST GitHub discussion #1591](https://github.com/PostgREST/postgrest/discussions/1591)).

**Solen fit.** Solen never hand-builds SQL strings from request input in the route tree (verified pattern: every route in `app/api/**` goes through `.from(table).select/eq/filter()`, and `_rules/DB_SCHEMA.md`/migrations are the only place raw SQL lives, written by the developer, not assembled from a request). The residual identifier-injection risk applies anywhere a route lets the client choose a **sort column** or **search field** by name (e.g. any `?sort=` query param): that must be checked against a hardcoded allowlist of column names, never interpolated. This was not exhaustively grepped this pass, flagged in Unverified.

**Tradeoff:** none, parameterization has no real cost and PostgREST gives it for free; the discipline cost is entirely on the identifier-allowlist habit, which is a one-line `if (!ALLOWED_SORT_COLUMNS.includes(sort)) return 400` per route, cheap.

---

## 3. XSS, and where a BACKEND causes it

**The question:** since Solen is React (auto-escaping JSX), where does a *server* still cause XSS.

**What the evidence says.** Modern frameworks auto-escape by default, but the OWASP cheat sheet is explicit that developers must understand the "escape hatches": React's `dangerouslySetInnerHTML` without sanitization is the named example ([OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), T1). The cheat sheet also names two backend-specific failure modes that matter for an API-heavy product like Solen: (a) **wrong `Content-Type` on a JSON response** ("verify that the Content-Type header is `application/json` and not `text/html`, to prevent XSS" -- a JSON body reflected with an HTML content-type can be interpreted and executed by a browser that's tricked into rendering it directly); (b) **treating data from your OWN database or another internal service as trusted** just because it isn't fresh user input this request -- "data from responses originates outside your application" and must still be encoded at render time, because it was tainted when it was written, not when it's read.

**Solen fit.** `dangerouslySetInnerHTML` appears in 7 files (`app/[locale]/salon/[slug]/layout.tsx`, the 4 category landing pages, `SalonDetailV3.tsx`). These are almost certainly JSON-LD structured-data injection (a legitimate, common Next.js pattern for SEO schema markup), not raw user content, but that must be confirmed per call site, not assumed, because JSON-LD built from a salon's own free-text bio/description field IS user-controlled content flowing through `dangerouslySetInnerHTML`, and `JSON.stringify` alone does not neutralize a `</script>` closing tag inside a string value. This was not verified per-file this pass, flagged in Unverified as the single highest-value follow-up from this section. Every API route sets `Content-Type: application/json` by virtue of using `NextResponse.json()`, which is the framework default and was not seen to be overridden anywhere checked.

**Tradeoff:** sanitizing content that flows into `dangerouslySetInnerHTML` (e.g. with a library, or by verifying the string can't contain `</script>`) costs a few lines per call site and should be done once per file, not deferred.

---

## 4. CSRF, and how SameSite changed but did not eliminate it

**The question:** does Solen need CSRF tokens, given it uses cookie-based Supabase sessions.

**What the evidence says.** `SameSite=Lax` (the modern browser default) blocks the classic cross-site `<form method=POST>` CSRF attack by not sending the cookie on a cross-site subrequest, but the OWASP cheat sheet lists concrete gaps that remain even with `Lax` or `Strict` set correctly: (1) **any state-changing action reachable via GET** is not protected by `Lax` at all, since `Lax` explicitly allows the cookie on top-level GET navigations; (2) SameSite is scoped to the **registrable domain**, not the origin, so a compromised sibling subdomain is "same-site" and unaffected; (3) it does nothing against **client-side CSRF**, where an XSS or malicious script on the SAME origin forges the request, since that request is same-site by definition; (4) legacy browsers that predate the `Lax`-by-default change are unprotected. ([OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), T1). The cheat sheet's own verdict: SameSite "suffices only in narrow deployments meeting all specified criteria," otherwise it should be a defense-in-depth layer alongside CSRF tokens, not a replacement for them.

**Solen fit, and a genuinely favorable structural fact:** Solen has **zero Next.js Server Actions** (`"use server"` grep returned 0 files), so the CSRF-relevant surface is entirely the JSON API under `/api/**`. Every mutating route reads `req.json()`, which requires the request to carry `Content-Type: application/json`. A cross-site form post cannot set that content-type (forms can only send `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`), so a naive cross-site CSRF form POST against a Solen API route either fails Zod validation immediately (wrong body shape) or, more fundamentally, `fetch()` with a JSON content-type from `evil.com` triggers a CORS preflight that **`middleware.ts`'s allowlist (`solen.ch`, `www.solen.ch`, dev localhost) will refuse**, so the browser never even sends the real request. This is real protection, not by design as a CSRF control but as a side effect of (JSON-only APIs) + (strict CORS allowlist), and it is worth naming explicitly so a future session does not "add CSRF tokens" as a redundant, un-asked-for feature. All Supabase auth cookies seen this pass (`guest-access.ts`, `preview-salon`, `search/event`, `salons/active`, `analytics/track-view`) are already set with `sameSite: "lax"`, matching the modern default.

The one gap this reasoning does NOT cover: **GET routes that mutate state.** If any `/api/**` GET route causes a side effect (a tracking pixel that also writes a DB row is a common accidental example, and `analytics/track-view` sets a cookie from a GET, worth a second look on whether it also writes), that route is NOT protected by the content-type/CORS argument above, because a plain `<img src="https://solen.ch/api/...">` cross-site GET sends cookies under `SameSite=Lax` and needs no preflight.

**Tradeoff:** relying on "JSON-only + CORS allowlist" instead of explicit CSRF tokens is cheap now (zero code) but is a hidden dependency: if a future route ever accepts `multipart/form-data` (a plausible file-upload shape) or is added as a GET-that-mutates, this protection silently stops applying to that one route and nobody will notice until it's exploited. Recommendation: **document this as an explicit constraint** ("mutating routes MUST be POST/PATCH/DELETE with application/json, never GET-with-side-effect") rather than leave it as an accidental property.

---

## 5. SSRF: webhooks, user-supplied URL fetches, metadata, DNS rebinding, redirects, allowlist vs denylist

**The question:** what does full SSRF defense look like, and where does Solen's existing guard fall short.

**What the evidence says.** [OWASP's SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) (T1) frames it as two cases: Case 1, the app only ever needs to reach a small set of known trusted endpoints, use an **allowlist** of exact destinations; Case 2, the app must be able to reach arbitrary external URLs (an avatar-by-URL feature, a webhook target the user configures), where a full allowlist isn't possible and defense becomes: validate the input is a syntactically real IP/domain, then confirm the resolved address is **public** (reject private/loopback/link-local/metadata ranges), restrict scheme to http/https, and layer network-level egress firewalling behind the application check. Named cloud metadata endpoints to block explicitly: `169.254.169.254` (AWS IMDS, GCP, Azure all use this same link-local address), plus `metadata.amazonaws.com` / `metadata.google.internal` as hostname aliases. **DNS rebinding** is named as a genuine TOCTOU gap: the hostname resolves to a public IP at validation time, then to a private IP at actual-fetch time (an attacker fully controls their own DNS record's TTL and answer); the cheat sheet's own mitigation is continuous re-verification, not a one-time check, or (the stronger, code-level fix not in the cheat sheet's own text but implied by "resolve once, pin, fetch that same address") using a custom fetch dispatcher that fetches the *exact IP already checked* rather than letting the HTTP client re-resolve DNS. **Redirect following** is a separate bypass: an initially-safe URL can 30x-redirect to a private address, so the cheat sheet says to disable redirect-following in the fetch client or re-validate every redirect target with the same checks.

**Solen fit.** `lib/security/ssrf-guard.ts` (added 2026-07-10 after an incident: `lib/ai-vision.ts` fetched an attacker-supplied `image_url` with zero guard, letting a prod server reach `169.254.169.254` or scan internal ports using the fetch's success/failure as an oracle) implements the IP-range-blocklist half of this correctly and thoroughly: it blocks `0.0.0.0/8`, `10.0.0.0/8`, `127.0.0.0/8`, `169.254.0.0/16` (explicitly including cloud metadata), `172.16.0.0/12`, `192.168.0.0/16`, `100.64.0.0/10` (carrier-grade NAT, an "extra safety" addition beyond the standard RFC1918 set), plus the IPv6 equivalents (`::1`, `fe80::/10`, `fc00::/7`, IPv4-mapped forms). This is a **denylist by IP range**, not a hostname-string denylist, which matters: blocking the string "169.254.169.254" is trivially bypassed by an alternate representation (`0xa9fea9fe`, decimal `2852039166`, etc.); resolving to a real IP and range-checking that IP is the correct approach and Solen does this correctly (T1 pattern match).

**The gap, stated in the file's own comment:** "this resolves DNS once, up-front. It does not protect against DNS rebinding... That would require a custom fetch dispatcher pinned to the checked address, which is out of scope here." This is a real, named, unfixed TOCTOU gap (T1 per the cheat sheet's own framing of DNS rebinding as a known SSRF-guard failure mode), not a hypothetical: it applies to every caller of `assertSafeFetchUrl` where the actual `fetch()` happens after the check with the raw hostname, not the resolved IP. Redirect-following was not verified this pass (does the actual `fetch()` call disable `redirect: "manual"` or follow redirects by default), flagged in Unverified.

**Recommended default for Solen:** keep the current IP-range-allowlist-of-public-space approach (it is the right shape), and treat DNS-rebinding pinning as the next hardening increment **only if** a genuinely adversarial user population starts hitting a URL-fetch feature at volume (see Premature section, this is a real gap but a narrow one given ~28 known salons, not the general public, control most of the surfaces that reach this guard today). Redirect-following should be checked and, if the underlying `fetch()` follows redirects by default (Node's `fetch` does), either disabled (`redirect: "manual"`) or the redirect target re-validated through the same guard before following.

---

## 6. Security headers + CSP, and what Netlify actually serves

**The question:** what headers does Netlify give for free, what does Solen already send, and what's missing.

**What the evidence says.** **Netlify sends zero security headers by default.** ([Netlify custom headers docs](https://docs.netlify.com/manage/routing/headers/) + corroborating third-party audit writeups, T1): "Netlify serves static sites with excellent performance but does not add application-level security headers by default. Without a `_headers` file or `netlify.toml` configuration, your Netlify site lacks Content-Security-Policy, X-Frame-Options, and Strict-Transport-Security." Everything has to be hand-added via `netlify.toml`'s `[[headers]]` blocks or a `_headers` file (`netlify.toml` takes precedence when both exist). For CSP specifically, Netlify has no built-in enforcement; it is purely a header you write yourself, though Netlify does offer an optional **Content Security Policy extension** (an Edge Function that generates a fresh nonce per request and can auto-wire a violation-reporting endpoint) as an opt-in convenience, not a default ([Netlify CSP docs](https://docs.netlify.com/manage/security/content-security-policy/), T2).

**Solen fit, verified live from `netlify.toml`:**

```
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-DNS-Prefetch-Control = "on"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(self), payment=(self)"
    Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"

[[headers]]
  for = "/api/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Cache-Control = "no-store, no-cache, must-revalidate"
```

Everything here is correct and matches OWASP Secure Headers guidance (nosniff, frame-ancestors-equivalent via X-Frame-Options, HSTS with preload, a scoped Permissions-Policy, no-cache on API responses so nothing sensitive gets cached at an edge/proxy). **The one missing header is `Content-Security-Policy`.** Given zero `dangerouslySetInnerHTML` sanitization was verified (section 3) and the app has no CSP as a backstop, a single missed-escaping bug in the JSON-LD injection paths has no second line of defense today.

**Recommended default for Solen:** add a CSP via `netlify.toml`, starting in **Report-Only mode** first (`Content-Security-Policy-Report-Only`) to see what actually breaks (Next.js's own inline runtime scripts, Google Maps, Stripe.js, PostHog, any inline `<script>` from third-party embeds) before enforcing, then flip to enforcing `Content-Security-Policy` once the report log is clean for a deploy cycle. A nonce-based `script-src 'nonce-{RANDOM}' 'strict-dynamic'` (OWASP's own recommended strict-CSP baseline) is harder to wire into Next.js's static/ISR output than a hash-based or `'self'`-based policy, so a first pass at Solen's scale should likely start with an explicit-domain allowlist (`script-src 'self' https://js.stripe.com https://maps.googleapis.com ...`) rather than chase nonces on day one; nonces are the stronger long-term answer once the third-party-script list is known and stable.

**Cost:** CSP is the header most likely to break something on first deploy (every third-party script/style/font/img host must be enumerated), so it needs the report-only staging step, not a same-day flip to enforce. That staging period is the real cost, not the header itself.

---

## 7. CORS: what it actually protects, and the permissive-header-is-not-an-authz-hole distinction

**The question:** is Solen's CORS setup safe, and what does a permissive CORS header actually expose (versus what it doesn't).

**What the evidence says.** CORS is a **browser-enforced** restriction on which cross-origin JavaScript is allowed to *read the response* of a request; it does nothing to stop the request from being *sent server-to-server*, or from a non-browser client (curl, a script, Postman) ignoring the header entirely ([MDN CORS guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), T1). Critically: **`Access-Control-Allow-Origin: *` combined with `Access-Control-Allow-Credentials: true` is spec-forbidden and browsers reject it outright** ("the server must specify an origin...instead of the wildcard"; a response with both headers set is blocked client-side with a console CORS error, not silently allowed). This means the classic "wildcard CORS + cookies = account takeover" bug is largely self-defeating by design in modern browsers: you cannot combine wildcard-origin with credentialed requests and have it work.

The subtler and more important point: **a permissive CORS policy is not itself an authorization vulnerability; it is orthogonal to authorization.** CORS controls whether a browser hands a cross-origin script the response body. If a route has no auth check at all (any caller, cookie or not, gets the data), a wildcard CORS header does not create that hole, the missing auth check does, and a non-browser client bypasses CORS to hit the same hole anyway. Where permissive CORS DOES matter: a route that is auth-protected by a **cookie** (not a bearer token the JS has to explicitly attach) and ALSO sends a non-wildcard-but-attacker-controlled origin reflection (e.g. blindly echoing back whatever `Origin:` header the browser sent, with credentials allowed) genuinely does enable a CSRF-flavored cross-origin read: the attacker's page, in the victim's authenticated browser, can read data the wildcard case would have blocked. That reflected-origin-plus-credentials pattern, not a flat wildcard, is the real CORS misconfiguration to watch for.

**Solen fit, verified live from `middleware.ts:41-72`:** Solen's CORS is a **hardcoded allowlist** (`https://solen.ch`, `https://www.solen.ch`, plus `localhost:3000` only in `NODE_ENV === "development"`), checked with `allowedOrigins.includes(origin)` before setting any `Access-Control-Allow-Origin` header at all, on both the OPTIONS preflight path and the real-request path. No `Access-Control-Allow-Credentials` header is set anywhere in that block. This is the correct, safe pattern: it is neither a flat wildcard nor a blind origin-reflection, it is an actual allowlist compare. Nothing to change here; the finding is that this is already right.

**Tradeoff of the allowlist approach:** it must be updated by hand if Solen ever adds a second first-party domain (a marketing site, a partner subdomain that needs to call the API) or an approved third-party integration partner; a forgotten allowlist entry is a functionality bug (blocked legitimate caller), not a security bug, which is the correct failure direction (fail closed).

---

## 8. Mass assignment / over-posting

**The question:** does spreading request bodies into DB writes create a privilege-escalation path, and does Solen do this safely.

**What the evidence says.** Mass assignment happens when a framework (or a hand-rolled route) binds request fields directly onto an object/row without an explicit allowlist, letting an attacker add fields the developer never intended to expose, e.g. POSTing an extra `isAdmin=true` alongside the expected `username`/`password` fields and having it silently accepted because the binding logic maps *any* matching field name ([OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html), T1). The cheat sheet ranks defenses: **allowlisting specific bindable fields** or **DTOs (separate objects with only the editable fields)** as the correct fix; **blocklisting** dangerous fields is explicitly named as weaker ("fails if you forget a field").

**Solen fit, verified live via grep of every `.insert({ ...X` / `.update({ ...X` call site in `app/api/**`:** every instance found spreads a **validated** object, never the raw body: `.insert({ ...validated, salon_id: salon.id, customer_id: customerId })` (`app/api/clients/[id]/cut-history/route.ts:77`), `.insert({ ...validated, admin_id: user.id })` (`app/api/admin/feature-requests/route.ts:90`), `.update({ ...updates, updated_at: ... })` (`app/api/admin/help/route.ts:106`), `.insert({ ...parsed.data, salon_id: salon.id })` (two spa routes), `.update({ ...validated, customer_preferences: ... })` (`app/api/profile/route.ts:71`). This matches the DTO/allowlist pattern by construction: Zod's `.safeParse()` (via `validateBody()`, `lib/validations.ts`) only returns the fields defined in the schema, so `validated`/`parsed.data`/`updates` can never carry an attacker-added extra field even if the raw `req.json()` body contained one, the Zod schema itself IS the allowlist. This is the correct pattern and it is used consistently everywhere checked (6 call sites), which is a real, positive, verified finding, not an assumption. Server-controlled fields (`salon_id`, `admin_id`, `customer_id`, `updated_at`) are always added AFTER the spread, from server-derived values (the authenticated session, a path param already authorized), never taken from the client, which is the second half of doing this correctly (client can't smuggle `salon_id` to write into someone else's salon by including it in the body, because the server's own `salon_id` always wins by coming after in the object literal, overwriting any same-named key from the spread).

**Tradeoff:** none found; this pattern costs nothing extra over an unsafe spread and Solen already pays it everywhere sampled. The only residual risk is a schema that is itself too permissive (e.g. a Zod schema that includes a `role` or `is_admin` field the client should never be able to set), which is a schema-design review question, not a spread-pattern question, and was not audited field-by-field across all 100+ schemas in `lib/validations.ts` this pass (Unverified).

---

## 9. Timing attacks and constant-time comparison

**The question:** where does Solen compare secrets, and is every comparison timing-safe.

**What the evidence says.** CWE-208 (Observable Timing Discrepancy) is the formal name: a `==`/`!==` string compare on most languages/engines short-circuits at the first mismatched byte, so the time taken to return "false" leaks how many leading bytes were correct, letting a remote attacker recover a secret (a token, an HMAC, a password hash) byte-by-byte via repeated timing measurements and statistical analysis (T1, [CWE-208](https://radicalnotion.ai/cwe/cwe-208) + a real 2026 CVE example, [Trilium's sync-endpoint timing attack](https://github.com/TriliumNext/Trilium/security/advisories/GHSA-hxf6-58cx-qq3x), which is exactly this class: an HMAC compared non-constant-time, recovered byte-by-byte remotely). The fix is a constant-time comparison primitive (`crypto.timingSafeEqual` in Node, `hmac.compare_digest` in Python) that always takes the same time regardless of where the first difference is, typically by comparing every byte and combining results with a running OR rather than early-exiting.

**Solen fit, verified live.** Solen already does this correctly in every guest-facing token/HMAC path checked: `crypto.timingSafeEqual` in `app/api/bookings/resend-access/route.ts:42`, `app/api/bookings/walk-in-verify/route.ts:28`, `app/api/bookings/[id]/quick-action/route.ts:27`, `app/api/walkin/confirm/route.ts:23`, and `lib/bookings/guest-access.ts:79` (which additionally guards against `timingSafeEqual`'s own footgun: it throws on unequal-length buffers, so the code checks `a.length === b.length` first, and does the constant-time compare BEFORE the expiry short-circuit, "so a missing/expired [token] doesn't leak via an early return", per the file's own comment, a genuinely careful implementation). `lib/barber/loyalty-qr.ts:32` does the same for its HMAC.

**The one inconsistency found:** the `CRON_SECRET` bearer-token check, present near-identically in every `/api/cron/*` route, uses a plain string compare: `if (authHeader !== \`Bearer ${cronSecret}\`)` (verified in `app/api/cron/no-show/route.ts:17` and matching lines in the other cron routes). This is architecturally the same shape as the guest-access token compare that was deliberately hardened, just not migrated to `timingSafeEqual`. **Severity is genuinely low, not zero:** `CRON_SECRET` is a server-to-server secret between GitHub Actions and Netlify, never handled by an untrusted browser client, and the attack requires an adversary who can already send many timed requests directly at a specific cron URL and measure response-time deltas in the single-digit-millisecond range across a serverless cold-start-variable network path, a much noisier channel than a same-datacenter timing attack. Still, it is free to fix (swap to `timingSafeEqual` on equal-length buffers, same pattern already proven correct elsewhere in this codebase) and it is inconsistent with the project's own stated standard (`lib/bookings/guest-access.ts`'s own header comment literally says "compare with `crypto.timingSafeEqual` (NEVER `!==`)" as a rule, which the cron routes violate).

**Recommended default:** any comparison of a secret, token, or HMAC against a server-held value uses `crypto.timingSafeEqual` on equal-length buffers, no exceptions, including secrets that "feel" low-value like a cron bearer token. Cost: near zero (a few extra lines, `Buffer.from()` + length check).

---

## 10. Secrets management and rotation

**The question:** does Solen's secrets model match current guidance, and where does it fall short at our scale.

**What the evidence says.** [OWASP's Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) (T1) recommends: regular rotation so a stolen secret has a short useful life (explicitly excluding end-user passwords, which should only rotate on suspected compromise, per NIST); centralized secret STORES (AWS Secrets Manager, Vault, etc.) over plain environment variables, because "secrets should never be hardcoded using docker ENV/ARG... these can easily leak with the container definitions"; least-privilege scoping so no single identity/process can read every secret; and pre-commit/CI scanning to catch a secret before it's ever pushed.

**Solen fit.** Solen's model (`lib/env.ts`, documented in `_docs/BACKEND.md` section 9) is **environment variables validated by a Zod schema at boot**, not a dedicated secrets vault, this is the T3-premature end of the spectrum for a 28-salon product on Netlify (Netlify's env var storage is already access-controlled to the project's team, and a dedicated Vault/Secrets Manager is real infrastructure overhead disproportionate to the current team size and blast radius). What Solen does that IS aligned with the cheat sheet regardless of scale: format-validated secrets (`sk_live_`/`sk_test_` prefix checks for Stripe, `whsec_` for the webhook secret, T2 defense-in-depth against a copy-paste wrong-secret mistake, not a cryptographic control), crash-loud-at-boot rather than silent-fallback-at-runtime on a missing required secret, and `SUPABASE_SERVICE_ROLE_KEY` never allowed in `NEXT_PUBLIC_*` (enforced by the separate `serverEnvSchema`/`publicEnvSchema` split, a real allowlist boundary, not just a naming convention).

**What's missing relative to the cheat sheet:** no documented rotation cadence for any secret (Stripe keys, Supabase service role key, `CRON_SECRET`, Resend key), and no automated pre-commit secret-scanning tool wired in (the project's own history includes "exposed credentials in git" as the founding incident behind the S1 security stack per `_rules/SECURITY_RULES.md:7`, which is exactly the failure mode pre-commit scanning exists to prevent). A rotation cadence and a scanning pre-commit hook (e.g. `git-secrets`, `detect-secrets`, or GitHub's own push-protection which is likely already active on a GitHub-hosted repo but should be confirmed, not assumed) are both cheap, config-only additions appropriate at Solen's current scale, unlike a full secrets-vault migration.

**Recommended default for Solen:** keep env-vars-plus-Zod-schema (right-sized for now), add (a) a written rotation cadence, even a simple one like "Stripe/Supabase/Resend keys rotate on any team member offboarding or annually, whichever first" and (b) confirm GitHub secret scanning / push protection is enabled on the repo (a settings check, not a build). Defer an actual secrets-vault migration until team size or compliance requirement (see Premature section) changes the calculus.

---

## 11. TLS

**The question:** does Solen need to configure TLS itself, and is what Netlify does sufficient.

**What the evidence says.** Netlify auto-provisions and auto-renews TLS certificates via Let's Encrypt for every custom domain, with automatic retry on provisioning failure, and serves HTTPS by default with no configuration required ([Netlify HTTPS docs](https://docs.netlify.com/manage/domains/secure-domains-with-https/https-ssl/), T1). The current baseline recommendation industry-wide (Mozilla's SSL Configuration "Intermediate" profile, T2, [Mozilla wiki](https://wiki.mozilla.org/Security/Server_Side_TLS) + [ssl-config generator](https://ssl-config.mozilla.org/), noting the generator project itself migrated to a community fork at `configurator.tlsref.org` in 2026, a volatile-fact catch worth recording so a future session doesn't cite a dead URL) is TLS 1.2 + TLS 1.3 only, ECDHE key exchange, AEAD ciphers only. This is a **server/reverse-proxy configuration concern**, and on Netlify's managed edge, Solen has no direct lever to set cipher suites, TLS version floors, or certificate parameters; Netlify manages all of it.

**Solen fit.** Nothing to configure. Solen's own `netlify.toml` already sends HSTS with `max-age=63072000; includeSubDomains; preload`, which is the correct complementary header (forces the browser to never even attempt plaintext HTTP after the first successful HTTPS visit, closing the "attacker downgrades the very first request" window that TLS-config-alone can't close). This section exists in this file mainly to record, explicitly, that TLS is Netlify's responsibility and Solen should not build or configure anything here, so a future session doesn't waste time on a self-hosted-TLS-tuning task that has no lever to pull on this host.

---

## 12. Field-level PII encryption

**The question:** should Solen encrypt specific PII columns (phone, address, notes) at the application/column level, beyond Supabase's platform-level encryption at rest.

**What the evidence says.** Supabase's own current guidance (T1, [Supabase pgsodium docs](https://supabase.com/docs/guides/database/extensions/pgsodium), fetched this run) is unusually direct: **"Supabase does not recommend the usage of pgsodium as it will be deprecated."** The column-level Transparent Column Encryption (TCE) feature (label a column with `SECURITY LABEL`, get an automatic encrypt-on-write trigger + decrypt-on-read view) was even pulled from the dashboard UI specifically because it "has sharp edges and the dashboard made it too easy to encrypt columns without considering trade-offs" (T2, corroborating GitHub discussion). The currently-recommended primitive is **Supabase Vault**, which is really designed for storing *secrets* (API keys, service credentials) inside Postgres safely, not as a general-purpose bulk PII-encryption tool, though it can be adapted. Supabase's own docs explicitly note that for many compliance regimes, the platform's **default encryption at rest is sufficient** without any additional column-level encryption (T2).

**Solen fit.** This is a case where the evidence itself argues against building the thing: field-level encryption is genuinely hard to get right (key management, searchability tradeoffs, backup/restore complexity, the deprecated-feature trap Supabase's own docs warn against), Supabase's own current recommendation is "don't, unless you have a specific unmet compliance requirement," and Solen has not identified such a requirement (Swiss nFADP/GDPR erasure is already handled at the row level per `_docs/BACKEND.md` section 13, which is a different mechanism, deletion not encryption). **Recommendation: do not build field-level PII encryption now.** Rely on Supabase's platform-level encryption at rest (present by default on all Supabase projects, T2) plus RLS as the actual access-control layer (which is the real, load-bearing defense for who can even query the PII, encryption at the column level is a defense against someone who already has raw disk/backup access, a much narrower threat model than Solen currently faces).

**Trigger that would change this:** a specific regulatory requirement (a payment processor mandate, a specific nFADP finding, a customer/partner contractual requirement for field-level encryption) or a real, hostile-actor incident that showed row-level RLS alone was an insufficient control. Absent that, this is the textbook Premature-at-our-scale case, see that section.

---

## 13. Dependency and supply-chain risk

**The question:** is `package-lock.json` currently clean, and what does provenance actually buy us.

**What the evidence says, verified live this run (not a memory claim), running `npm audit --omit=dev --json` against Solen's actual `package-lock.json`:**

- **1 critical**: `protobufjs <=7.6.2`, arbitrary code execution + prototype pollution + several DoS advisories. Transitive path: `posthog-js` -> `@opentelemetry/exporter-logs-otlp-http` -> `@opentelemetry/otlp-transformer` -> `protobufjs`. Not a direct dependency; pulled in by PostHog's OpenTelemetry exporter.
- **2 high**: (a) `next` itself, multiple advisories including image-optimization cache-key confusion, content injection, middleware-redirect SSRF, HTTP request smuggling in rewrites, and several DoS variants, with fixed ranges starting around `15.4.7`-`15.5.10` depending on the specific CVE (Solen is pinned to `15.3.8`, below every one of these fix floors); (b) `lodash <= 4.17.23` (prototype pollution / code injection via `_.template`), transitive via `recharts` (a dashboard charting library, not attacker-reachable from an untrusted user in the common case, but still a supply-chain liability).
- **17 moderate**, not itemized here, `svix`/`uuid` (transitive via `resend`) among them.

npm's **provenance** feature (T1, [npm docs](https://docs.npmjs.com/generating-provenance-statements)) uses Sigstore (a public transparency log + short-lived signing certs tied to a CI/CD OIDC identity, no long-lived private key to leak) to cryptographically link a published package to the exact source commit and build job that produced it, checkable locally via `npm audit signatures`. It proves **origin**, not **safety**, a provenance-attested package can still have a real vulnerability (as the `next` finding above shows: `next` almost certainly publishes with provenance today and is still the source of 2 high findings). Provenance is a supply-chain-tampering defense (did this tarball really come from the claimed GitHub Action, not a compromised maintainer's laptop or a hijacked npm account), not a vulnerability scanner.

**Solen fit.** The `next` finding is the one that actually matters for Solen specifically: it is a **direct, first-party dependency**, the framework the entire app is built on, and several of its own advisories (SSRF via middleware redirects, request smuggling in rewrites) are directly relevant risk categories already covered elsewhere in this file. **Recommendation: upgrade `next` to the latest 15.x patch release that clears the highest fix-floor among the found advisories** (verify the exact target version at upgrade time, ranges above were as reported by this run's `npm audit`, don't recite the specific version number from this file months later without re-running `npm audit`, versions and fix floors drift). The `protobufjs`/`lodash` transitive findings are lower urgency (not directly reachable by request input in the common path) but should be tracked; `npm audit fix` reported fixes available for all three flagged packages this run.

**Tradeoff of upgrading `next` now vs later:** a minor/patch Next.js bump on a 15.3.8 baseline is usually low-risk, but App Router + Netlify's `@netlify/plugin-nextjs` adapter means any Next upgrade should be smoke-tested against the adapter before merging, not just `npm install`+ship; this is exactly the kind of change that benefits from the project's own layered-loop review process (build + reviewer) rather than a same-turn drive-by bump.

---

## 14. File upload security

**The question:** do Solen's 11 upload-touching routes follow the OWASP baseline.

**What the evidence says.** [OWASP's File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) (T1) recommends defense in depth: an **allowlist of extensions** (never a blocklist, which is bypassable via double-extensions, null bytes, case tricks), explicit warning that **client-supplied `Content-Type` cannot be trusted** and should be checked alongside (not instead of) **magic-byte / file-signature validation**, **random filenames** (UUIDs) rather than trusting user-supplied names (which can carry path-traversal or shell-metacharacter payloads), storage **outside the webroot or on a separate host/domain** so an uploaded file can never be directly executed by the serving process, explicit **size limits** (accounting for decompressed size on anything that can be a zip bomb), and, for images specifically, **re-encoding/rewriting** the image rather than trusting the original bytes (a technique that neutralizes most polyglot-file attacks, since re-encoding forces the file through a real image decoder that will reject anything that isn't actually a valid image).

**Solen fit.** 11 route files were found touching uploads (`clients/[id]/photos`, `salon/documents`, `discovery/thumb/[id]`, `admin/discovery/staging`, `admin/discovery/upload`, `admin/reviews/[id]`, `dashboard/coiffeur/formula-photo`, `salons/[slug]/gallery`, `services/[id]/photos`, `services/import`, `reviews/[id]/photos`). Storage location is inherently safe by construction: everything goes through **Supabase Storage** (an object store, not a served-from-webroot filesystem path), which structurally satisfies the "outside the webroot, can't be directly executed" recommendation regardless of what filename or content-type validation exists on top, this is a real, load-bearing, already-correct architectural choice, not something to redo. What was NOT verified this pass, and is the concrete follow-up: whether each of these 11 routes (a) validates file extension against an allowlist vs trusting client `Content-Type`, (b) checks magic bytes, (c) generates a random storage key vs using the client-supplied filename, (d) enforces a size limit, (e) re-encodes images. This needs a route-by-route pass, flagged fully in Unverified, this file establishes the checklist, not the per-route audit.

**Recommended default:** every upload route should (1) accept a hardcoded allowlist of extensions/mimetypes appropriate to its purpose (photos: jpg/png/webp only; documents: pdf only, likely a narrower list than "any file"), (2) generate the Supabase Storage key itself (a UUID or a deterministic `${salonId}/${uuid}.${ext}` shape), never interpolate the client's original filename into the storage path, (3) set an explicit size cap in the route (Zod or a manual `Content-Length`/buffer-length check) rather than relying only on any platform-level default.

---

## 15. security.txt and a disclosure policy

**The question:** should Solen publish one, and what does RFC 9116 actually require.

**What the evidence says.** RFC 9116 (T1, [rfc-editor.org/rfc/rfc9116](https://www.rfc-editor.org/rfc/rfc9116.html), fetched this run) defines exactly **two mandatory fields**: `Contact` (at least one, in preference order, how a researcher should report a vulnerability) and `Expires` (an RFC 3339 timestamp, recommended less than a year out, forcing periodic republication so a stale forgotten file doesn't linger indefinitely). The canonical location is `https://<domain>/.well-known/security.txt` (a legacy top-level `/security.txt` is permitted to redirect for backward compatibility, but the `.well-known` copy wins if both exist). The file must be served as `text/plain`, UTF-8, over HTTPS. Signing with OpenPGP cleartext signature is RECOMMENDED, not required; a `Canonical` field naming the file's own official URL is the anti-tampering mechanism for the signed case.

**Solen fit.** No `security.txt` was found anywhere in the repo (`find . -iname "security.txt"` returned nothing this run). This is a near-zero-cost addition: two lines of plain text at `public/.well-known/security.txt` (`Contact: mailto:<security-contact>@solen.ch` and `Expires: <a date within a year>`), served automatically by Next.js's static file handling from `public/`. **This is genuinely NOT premature at Solen's scale**, unlike most of the Premature section below, because it costs nothing (no infra, no code, no ongoing maintenance beyond an annual date bump) and directly serves the actual population Solen already has an obligation toward: 28 salons and their customers whose PII and payment flows already exist today. The absence of a disclosure channel means a good-faith security researcher who finds a real bug (e.g. exactly the kind of thing this file catalogs) has no clear, low-friction way to report it, and may default to public disclosure or simply move on, which is a worse outcome for Solen either way.

**Recommended default:** add it this week, independent of any other work in this file; low cost, real (if modest) benefit, and it is the kind of "obviously should exist" gap that tends to get found in an external audit and read as neglect if still missing by then.

---

## Decision candidates

| axis | options | when each wins | recommended for Solen | tier |
|---|---|---|---|---|
| CSP rollout | ship enforcing immediately vs report-only first | report-only wins whenever the third-party script/style host list isn't fully enumerated yet (true for Solen: Stripe.js, Google Maps, PostHog, fonts) | report-only for one deploy cycle, then enforce | T1 (staging method) / T3 (exact duration) |
| CSP script policy | nonce + strict-dynamic vs explicit domain allowlist | nonce wins once the third-party script list is stable and SSR nonce plumbing is worth the effort; allowlist wins for a fast first pass on a framework not yet wired for per-request nonces | explicit domain allowlist first, migrate to nonce later | CONV (industry practice), T3 (which is "better" for us specifically) |
| SSRF guard: DNS-rebinding fix | leave as one-time-resolve vs build a pinned-IP fetch dispatcher | pinned dispatcher wins once the URL-fetch surface is reachable by a genuinely adversarial, high-volume, untrusted population | leave as-is for now, revisit if a public (non-salon-controlled) user-supplied-URL feature ships | T1 (the gap is real) / T3 (the urgency call) |
| PII encryption | column-level (pgsodium/Vault) vs rely on platform-at-rest + RLS | column-level wins only under a specific compliance mandate or after platform-at-rest + RLS is shown insufficient | platform-at-rest + RLS, no column-level encryption | T2 (Supabase's own current guidance) |
| Secrets storage | plain env vars (Zod-validated) vs dedicated vault (HashiCorp Vault / AWS Secrets Manager) | vault wins once team size, secret count, or compliance need outgrows "one person can see all of Netlify's env var UI" | env vars + Zod schema, add rotation cadence + confirm push-protection | T1 (cheat sheet) / T3 (scale threshold) |
| Timing-safe compare scope | only "important" secrets vs every secret comparison, no exceptions | there is no real argument for "only important ones", the fix is cheap everywhere | every secret/token/HMAC compare uses `timingSafeEqual`, including `CRON_SECRET` | T1 |
| Rate-limit fail posture for a new limiter | fail-open (default) vs fail-closed (`ABUSE_PRONE_LIMITERS`) | fail-closed wins for enumeration oracles, payment, auth, booking; fail-open is fine for low-value, high-volume reads | classify explicitly at creation time, default to fail-open unless the surface is abuse-prone | T2 (already the project's own documented rule, cited here for completeness) |

---

## Myths and traps

- **MYTH: "OWASP Top 10 is still the 2021 list."** It was superseded by the **2025 edition** (November 2025). Citing 2021 category numbers/names (e.g. "A03:2021 Injection") in new work or docs is now citing a stale edition; use the mapping table in section 1.
- **MYTH: "A wildcard `Access-Control-Allow-Origin` is inherently the vulnerability."** It's not, by itself; the vulnerability (if any) is a missing/weak auth check on the route, which a non-browser client bypasses CORS to reach anyway. A wildcard IS a real problem specifically when combined with credentialed requests and reflected origins, not as a flat rule. See section 7.
- **MYTH: "SameSite cookies solved CSRF."** They close the most common vector (cross-site form POST) but explicitly do not cover state-changing GETs, sibling-subdomain same-site abuse, or client-side CSRF via XSS. See section 4.
- **MYTH: "Escaping user input is basically as good as parameterized queries."** OWASP's own cheat sheet rates escaping "STRONGLY DISCOURAGED" and explicitly won't guarantee it stops all injection; parameterization is a structurally different (and stronger) guarantee, not a stricter version of the same idea. See section 2.
- **MYTH: "pgsodium/Transparent Column Encryption is the modern way to encrypt PII in Supabase."** Supabase's own current docs say the opposite: don't use pgsodium, it's being deprecated; the dashboard even removed the UI for it. See section 12.
- **TRAP, this stack specifically (serverless/cold-lambda):** the feature-flag and ban-check caches in `lib/feature-flags.ts` are **per-process in-memory Maps**, not shared across serverless instances (documented already in `_docs/BACKEND.md` section 9's Gotchas). A newly-cold Netlify function instance always re-reads fresh state, a warm one can serve a stale flag/ban for up to its TTL. This isn't a security bug per se, but a session touching feature-flag TTLs or "why isn't this ban taking effect everywhere instantly" should know this before assuming a bug in the ban logic itself.
- **TRAP, PostgREST specifically:** parameterization protects VALUES, not identifiers. A route that lets a client choose a sort/filter COLUMN by name from a request param and passes that string straight into a `.order()`/dynamic `.select()` call is not protected by "Supabase parameterizes everything," it needs its own explicit column-name allowlist. See section 2.
- **TRAP, Netlify specifically:** there is no default security-header floor. A brand-new route, a brand-new Netlify site, or a `_headers`/`netlify.toml` typo that drops the `[[headers]]` block silently ships with **zero** of X-Frame-Options/HSTS/nosniff/CSP, not "reasonable defaults minus what's missing." Treat the header block in `netlify.toml` as load-bearing config, not boilerplate.
- **TRAP, Stripe Connect specifically (not separately sourced this run, flagged as a reasoning note, not a fetched claim):** webhook idempotency (correctly implemented in `app/api/stripe/webhook/route.ts` via a `processed_webhook_events` unique-constraint atomic claim) is a *reliability* control (don't double-process a retried delivery), not by itself a *security* control (signature verification, via `stripe.webhooks.constructEvent`, is the actual authenticity check, and Solen's route correctly does both, verifying `stripe-signature` before the idempotency claim, in the right order).

---

## Premature at our scale

- **Dedicated secrets vault (HashiCorp Vault / AWS Secrets Manager) over env-vars-plus-Zod.** Correct at scale (larger teams, more secrets, compliance audits that specifically demand a vault's audit-log trail). Premature for a team small enough that Netlify's own env-var access control already scopes who can see what. **Trigger to revisit:** team grows past a size where "who can see the Netlify dashboard" stops being an acceptable access-control boundary, or a specific compliance requirement (PCI DSS scope expansion, a partner's security questionnaire) explicitly demands it.
- **Field-level PII encryption (column-level, pgsodium or otherwise).** Correct at scale for specific regulated data classes. Premature now: Supabase's own current guidance is not to build this without a specific unmet need, and Solen has not identified one. **Trigger:** a specific regulatory finding, contractual mandate, or an incident showing RLS-plus-platform-encryption was insufficient.
- **DNS-rebinding-proof SSRF guard (pinned-IP custom fetch dispatcher).** Correct at scale once URL-fetch features are reachable by a large, adversarial, non-vetted user population. Premature now: today's user-supplied-URL surfaces are dominated by salon-side inputs (a small, known, mostly-trusted population of ~28 salons), not the open public. **Trigger:** any new feature that lets an anonymous/public user supply a URL the server fetches (a public "add your portfolio link" feature, an open webhook-target-configuration UI), at which point the DNS-rebinding gap becomes reachable by a genuinely hostile population and should be closed before shipping that feature, not after.
- **A full CSP nonce pipeline wired through Next.js SSR.** Correct at scale/maturity once the CSP itself has been running in report-only long enough to have a stable, known third-party script list. Premature to build nonces on day one of adding CSP at all; get a working explicit-allowlist CSP shipped first (section 6), evolve to nonces later.
- **Automated malware/AV scanning on file uploads.** OWASP's own cheat sheet lists this as a defense-in-depth layer, correct at scale for a product handling arbitrary public-facing user uploads at volume. Premature relative to the more basic gaps (extension/magic-byte allowlisting, random filenames) that weren't even confirmed present yet in section 14; fix the cheaper, more foundational controls before reaching for a scanning service/vendor integration.
- **Network-level egress firewalling as an SSRF layer** (the "Network Layer" half of OWASP's SSRF defense-in-depth model, restricting which destinations the server process can reach at the infrastructure level). Correct at scale on infrastructure you control (a VPC, a proxy you operate). Not really available to configure on Netlify's managed serverless functions at all, this isn't "premature," it's largely inapplicable to the current host; the application-layer guard (`assertSafeFetchUrl`) is the only layer Solen actually has a lever on.

---

## Unverified

- Whether every one of Solen's 11 file-upload routes validates extension/magic-bytes, uses a random storage key instead of the client filename, enforces a size limit, and re-encodes images. Section 14 establishes the checklist from OWASP; a route-by-route pass against that checklist was not done this run.
- Whether any `/api/**` GET route causes a state-changing side effect (the one scenario where the JSON-content-type/CORS-allowlist CSRF argument in section 4 does not apply). `analytics/track-view` sets a cookie from what looks like a GET and deserves a specific look; not confirmed either way this run.
- Whether the `dangerouslySetInnerHTML` call sites (7 files) inject only static/JSON-LD-schema content or ever include unescaped salon-supplied free-text (bio/description fields), and whether `JSON.stringify`'d values passed into those blocks are hardened against a `</script>`-breakout (a known JSON-LD XSS pattern independent of this being React). Flagged as the highest-value follow-up from section 3.
- Whether the actual `fetch()` calls that follow a successful `assertSafeFetchUrl()` check disable redirect-following (`redirect: "manual"`) or re-validate a redirect target through the same guard. The guard itself was read in full; the calling code at each of its call sites was not.
- An exhaustive per-schema audit of all 100+ Zod schemas in `lib/validations.ts` for any schema that is itself too permissive (e.g. accidentally allows a client to set a `role`/`is_admin`-shaped field). Section 8 verified the *spread pattern* is safe everywhere sampled; it did not verify every schema's own field list.
- Whether GitHub secret-scanning / push protection is actually enabled on the Solen repo (a settings check, not something visible from the local working tree).
- The exact target Next.js patch version that clears every advisory found in section 13; the ranges recorded are as reported by this run's `npm audit` and will drift, re-run before acting on a specific version number.
- Whether Solen's CORS allowlist in `middleware.ts` is the only CORS-relevant code path, or whether any individual API route sets its own `Access-Control-Allow-Origin` header independently of the shared middleware (would bypass the allowlist if so); not grepped exhaustively this run.

---

## Sources

- [OWASP Top 10:2025 Introduction](https://owasp.org/Top10/2025/0x00_2025-Introduction/) , confirmed the 2025 edition (Nov 2025), full A01-A10 list, and that SSRF was folded into Broken Access Control.
- [Qualys: What Changed in OWASP Top 10 2025](https://blog.qualys.com/qualys-insights/2026/06/15/what-changed-in-owasp-top-10-2025-and-recommendations-for-each-category) , second source corroborating the 2025 edition's structural changes (Supply Chain, Mishandling of Exceptional Conditions).
- [OWASP API Security Top 10, 2023 edition](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) , confirmed the API-specific Top 10 is still the 2023 list, full API1-API10.
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) , allowlist-over-denylist framing, DNS rebinding, cloud metadata endpoints, redirect-following guidance.
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) , context-specific encoding rules, backend-caused XSS via Content-Type and "escape hatches" like `dangerouslySetInnerHTML`.
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) , token-based defenses, and the specific gaps SameSite does not close.
- [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html) , recommended strict-CSP baseline, nonce vs hash, report-uri/report-to.
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) , what CORS protects against, the wildcard+credentials spec rule, CORS-is-not-authorization framing.
- [OWASP Mass Assignment Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html) , the over-posting mechanism and allowlist/DTO defenses.
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) , why parameterization beats escaping, the four ranked defenses.
- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) , extension allowlisting, magic bytes, storage location, filename handling, re-encoding.
- [RFC 9116](https://www.rfc-editor.org/rfc/rfc9116.html) , security.txt required fields (Contact, Expires), canonical location, signing.
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) , rotation, vault-over-env-vars, least privilege, pre-commit scanning.
- [Netlify: Custom headers](https://docs.netlify.com/manage/routing/headers/) + [Netlify: Content Security Policy](https://docs.netlify.com/manage/security/content-security-policy/) , confirmed Netlify sends zero security headers by default, CSP is purely custom-header/extension-based, nonce support exists via an Edge Function extension.
- [Netlify: HTTPS (SSL)](https://docs.netlify.com/manage/domains/secure-domains-with-https/https-ssl/) , automatic Let's Encrypt provisioning/renewal, default-on HTTPS.
- [Supabase: pgsodium docs](https://supabase.com/docs/guides/database/extensions/pgsodium) , confirmed pgsodium/TCE is explicitly not recommended by Supabase and is being deprecated; Vault is the current pointer, platform-at-rest often sufficient.
- [npm: Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements) , what provenance proves (origin, not safety), Sigstore mechanism, `npm audit signatures`.
- CWE-208 background via [RadicalNotion.AI CWE-208](https://radicalnotion.ai/cwe/cwe-208) and the [TriliumNext GHSA-hxf6-58cx-qq3x](https://github.com/TriliumNext/Trilium/security/advisories/GHSA-hxf6-58cx-qq3x) real-world timing-attack advisory , grounded the CWE-208 mechanism and a concrete recent incident of the same shape as the CRON_SECRET finding.
- Live tool runs against Solen's own repo this session (not web sources, listed for completeness since several law rows depend on them): `npm audit --omit=dev --json` (dependency findings, section 13), `npm ls next/protobufjs/lodash` (transitive-path confirmation), `grep`/`Read` across `netlify.toml`, `middleware.ts`, `lib/security/ssrf-guard.ts`, `app/api/stripe/webhook/route.ts`, `lib/bookings/guest-access.ts`, `_rules/SECURITY_RULES.md`, `_docs/BACKEND.md` section 9, and the mass-assignment/timing-attack/CORS/upload-route grep sweeps cited inline throughout.
