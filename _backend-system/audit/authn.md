# AuthN (authentication)

Solen audit 2026-07-16

## Verdict

Solen follows the hard security-boundary rules well and the sloppy rules poorly. The getUser()-not-getSession() rule, the OAuth PKCE default, and the open-redirect guard on the callback route are all correctly implemented and, in the redirect case, a real backslash-bypass hole found by the 2026-07-09 audit has since been fixed. The two genuinely open gaps are NIST-style password policy (composition rule instead of length + breach check, no session invalidation on password reset) and the three-way split "restricted account" state on `profiles`: `is_suspended` has a full admin-panel write path but the live enforcement gate only ever reads `banned_at`, which has no write path at all. That second one is this project's own documented #1 failure mode (a control that looks wired but does nothing) and it is real, live, and DB-confirmed today. MFA does not exist anywhere in the codebase, which is a genuine gap for the owner/staff dashboard tier that sits next to Stripe Connect payouts, but it is a build item, not a live hole.

## Coverage + sampling method

Read in full: `_docs/BACKEND.md` section 1 (auth/sessions/roles, lines 33-109), `_plans/AUTH_BACKEND_AUDIT.md` (the 2026-07-09 flow-specific audit, 12 findings), the auth-relevant excerpts of `_plans/BACKEND_HEALTH_AUDIT_2026-07-14.md` and `_plans/BACKEND_AUDIT_INDEX.md`, `app/api/auth/signup/route.ts`, `app/[locale]/auth/reset-password/page.tsx`, `app/api/auth/callback/route.ts`, `app/api/admin/preview-salon/route.ts`, `lib/audit.ts`, `lib/feature-flags.ts` (`checkUserBanned`), `middleware.ts:95-150`, `app/api/favorites/toggle/route.ts` and `app/api/profile/favorites/route.ts` (followed up on a misleading comment, see below).

Grepped repo-wide (excluding node_modules): `getSession(` across `app/`, `lib/`, `components-legacy/`, `middleware.ts` (28 hits, each one individually classified: server-side hits all in the documented BACKEND.md client-exception list, verified by checking the first line of every hit's file for a `"use client"` directive); `flowType` (0 hits); `mfa\.|totp|TOTP` and `webauthn|passkey` (0 hits each); `pwned|haveibeenpwned|breach.*password` (0 hits); `bcrypt|scrypt|argon2|pbkdf2|createHash|randomBytes|randomInt` (7 files, all hashing/random-generating high-entropy tokens, never a user password); `banned_at` (4 hits: 1 write-capable location which turned out to be a read, 1 admin-schema definition that is imported nowhere, 2 reads); `is_suspended` in `app/api/admin/users/route.ts` and `app/[locale]/dashboard/all-users/page.tsx` (confirmed write path); `no-getsession-authz-gate` in `.claude/settings.json` (3 hits, confirming the hook is wired in this worktree, resolving the discrepancy the 2026-07-14 health audit flagged).

Live DB checked via `_inventory/_db-columns.json` (companion file to `_db-snapshot.json`, holds the actual column lists) for the `profiles` table (confirmed `account_status`, `ban_reason`, `banned_at`, `is_suspended`, `role`, `staff_salon_id` all exist live) and for `audit_log` (confirmed columns `action, actor_id, created_at, id, ip_address, metadata, target_id, target_type` exist live and the table is populated by 26 files via `lib/audit.ts`'s `logAuditEvent()`).

This is a targeted read of the ~15 files the research already named plus the ones those files' imports/comments led to, not a blind sample of the 354 API routes. For the two general findings that don't reduce to one named file (rate-limiting via `getClientIp`, and the getSession sweep) the full repo-wide grep was run rather than a sample.

## Per-principle table

| id | rule | verdict | evidence | severity |
|---|---|---|---|---|
| AUTHN-01 | Never `getSession()` server-side for authz; always `getUser()` | MATCH | `middleware.ts:142,146` and `lib/supabase.ts` use `getUser()`; all 28 repo-wide `getSession(` hits are in files starting `"use client"` (verified each); hook wired in `.claude/settings.json` (3 refs) | NONE |
| AUTHN-02 | Password policy length-based, not composition-based; breach-list check | GAP | `app/api/auth/signup/route.ts:18-22` (`.regex(/[A-Z]/)`, `.regex(/[0-9]/)`); `app/[locale]/auth/reset-password/page.tsx:53,172-173` (same composition rule shown as UI requirement badges); zero grep hits for pwned/breach anywhere | MEDIUM |
| AUTHN-03 | Password reset must invalidate other sessions | GAP | `app/[locale]/auth/reset-password/page.tsx:61-69`, full file read: `updateUser({password})` then `setSuccess(true)` and a redirect, no `signOut({scope:'others'})` or equivalent anywhere in the file | HIGH |
| AUTHN-04 | Cookies HttpOnly+Secure+SameSite, narrowest Path, `__Host-` where possible | PARTIAL | 4 cookie sites read (`lib/bookings/guest-access.ts:118-123`, `app/api/admin/preview-salon/route.ts:42-47`, `app/api/search/event/route.ts:99-104`, `app/api/analytics/track-view/route.ts:52`): all httpOnly + sameSite=lax + secure-in-prod-only; none use `__Host-` | LOW |
| AUTHN-05 | OAuth via PKCE, never implicit flow | MATCH (code) / UNKNOWN (dashboard) | `flowType` never set anywhere (0 grep hits) → `@supabase/ssr`'s PKCE default stands; Supabase project's Redirect URLs allowlist config not checkable from this repo | NONE (code) |
| AUTHN-06 | Redirect validation: exact-match or safe-prefix that handles backslash | MATCH (fixed since 2026-07-09) | `app/api/auth/callback/route.ts:18`: `startsWith("/") && !startsWith("//") && !includes("\\")`, all three checks present; closes the MEDIUM finding in `_plans/AUTH_BACKEND_AUDIT.md` | NONE |
| AUTHN-07 | Refresh tokens rotate with reuse-detection | UNKNOWN (platform-internal) | No app code implements or could disable this; it is inside Supabase GoTrue, not independently verifiable from this repo | NONE |
| AUTHN-08 | Don't hand-roll password hashing; Argon2id > scrypt > bcrypt > PBKDF2 if ever needed | MATCH/NA | Supabase Auth hashes real passwords (outside this repo). Solen's own hashing usage is sha256 over 256-bit random tokens (`lib/bookings/guest-access.ts:31`, `app/api/bookings/resend-access/route.ts:40-41`, `app/api/directory/[id]/claim/route.ts:11`), never a low-entropy secret, so a slow KDF is not needed there | NONE |
| AUTHN-09 | MFA (TOTP) for the highest-blast-radius tier (owner/staff dashboard) | GAP | Zero grep hits for `mfa`/`totp` in `app/` or `lib/` | MEDIUM |
| AUTHN-10 | Don't depend on Supabase's beta passkey support yet | MATCH | Zero grep hits for `webauthn`/`passkey`; correctly not adopted. `@supabase/supabase-js` at `2.110.2` (package.json:40), above the passkey-beta floor but unused | NONE |
| AUTHN-11 | Don't build SAML; OIDC is correct for B2C | MATCH/NA | No SAML anywhere; Google/Apple OAuth (OIDC-based) already in use, not a live topic | NONE |
| AUTHN-12 | Admin impersonation must log actor/target/reason/time, be time-boxed, admin-only | PARTIAL | `app/api/admin/preview-salon/route.ts` (full file read): admin-role-gated (:20-22) and restricted to `[TEST]%`-prefixed salons only (:34), cookie `maxAge: 60*60` = 1hr (:46, shorter than a real login session); but it never calls `lib/audit.ts`'s `logAuditEvent()`, which 26 other admin routes do use, so no actor/target/reason row is written anywhere for this action | LOW |
| AUTHN-13 | Wire `is_suspended`/restriction fields into the enforcement gate; give `banned_at` a write path | GAP (confirmed live) | `lib/feature-flags.ts:158-159` `checkUserBanned()` selects only `banned_at, ban_reason`; `_inventory/_db-columns.json` confirms `profiles` has `is_suspended`/`account_status` live; `app/api/admin/users/route.ts:66` + `app/[locale]/dashboard/all-users/page.tsx` give `is_suspended` a full working admin-panel write path that `checkUserBanned()` never reads; grep for `banned_at` finds zero write sites anywhere in `app/` or `lib/` | HIGH |

## The gaps in detail

### AUTHN-13: admin "Suspend" button is a silent no-op (HIGH)

What is wrong: three separate "is this account restricted" fields exist on `profiles` (confirmed live: `banned_at`/`ban_reason`, `is_suspended`, `account_status`), but the one live enforcement gate, `checkUserBanned()`, only ever reads `banned_at`:

```
lib/feature-flags.ts:158-159
  const { data: profile, error } = await admin
    .from("profiles").select("banned_at, ban_reason").eq("id", userId).single();
...
lib/feature-flags.ts:175
  const banned = !!profile?.banned_at;
```

Meanwhile `is_suspended` has a real, working write path:

```
app/api/admin/users/route.ts:61,66
  const { user_id, role, is_suspended } = validated;
  ...
  if (is_suspended !== undefined) updates.is_suspended = is_suspended;
```

and a real UI (`app/[locale]/dashboard/all-users/page.tsx:120-128` toggles it via a "Suspend" confirm dialog that calls this route and updates the row in place). `checkUserBanned()` is called at the top of roughly 100 route handlers.

What breaks in practice: an admin opens the all-users dashboard, clicks Suspend on an abusive customer, sees the UI flip to "suspended", and believes the account is now blocked. It is not. Every route gated by `checkUserBanned()` still lets that user book, review, message, and transact normally, because the gate never looks at `is_suspended`. There is also no way to set the field the gate DOES check (`banned_at`) short of a raw SQL write in Supabase Studio, so the admin panel's suspend action and the code's actual ban check are two disconnected systems.

The fix and its cost: this is a one-function, one-route change. Either (a) extend `checkUserBanned()` to also read and OR-in `is_suspended` (cheapest, ~3 lines), or (b) go further and consolidate all three fields behind one check with `account_status` as the source of truth. Either way, also decide whether `banned_at` needs its own admin write path or should be retired in favor of `is_suspended` alone, since maintaining three parallel fields with only one enforced is exactly the kind of drift this project has been burned by before.

### AUTHN-03: password reset does not invalidate other sessions (HIGH)

What is wrong: `app/[locale]/auth/reset-password/page.tsx` exchanges the recovery code for a session (`:34-48`), lets the user set a new password (`:61`, `supabase.auth.updateUser({ password })`), and on success just shows a confirmation and redirects to login (`:67-68`). Nothing in the file calls `supabase.auth.signOut({ scope: "others" })` or any equivalent revocation.

What breaks in practice: a user resets their password specifically because they suspect their account was compromised (stolen laptop, leaked credential, a session that leaked via XSS elsewhere). Today, that reset changes the password but does nothing to the attacker's already-established session or refresh token; the attacker's session survives the very action meant to lock them out. This is precisely the scenario OWASP's Forgot Password Cheat Sheet calls out.

The fix and its cost: one line, right after the `updateUser` call succeeds: `await supabase.auth.signOut({ scope: "others" })`. Cheap, no schema change, no new route.

### AUTHN-02: password policy is composition-based with no breach check (MEDIUM)

What is wrong: both the signup schema and the reset-password UI enforce "8+ chars, one uppercase, one digit" instead of a length floor with no composition rule:

```
app/api/auth/signup/route.ts:18-22
  password: z.string().min(8, "Mindestens 8 Zeichen")
    .regex(/[A-Z]/, "Mindestens ein Grossbuchstabe")
    .regex(/[0-9]/, "Mindestens eine Zahl"),

app/[locale]/auth/reset-password/page.tsx:53
  const passwordValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
```

There is no breach-list check anywhere in the codebase (zero grep hits for pwned/breach), and the platform-level equivalent, Supabase Auth's "leaked password protection" (HaveIBeenPwned check), is confirmed OFF per `_plans/BACKEND_HEALTH_AUDIT_2026-07-14.md:48,134,146` (a Supabase dashboard toggle, an owner action, not app code).

What breaks in practice: composition rules push users toward predictable patterns (`Password1!`) that satisfy the regex but are weaker than a longer passphrase the rule would otherwise block, and without a breach check, a password already sitting in a public breach corpus is accepted without warning.

The fix and its cost: relax the zod schema and the UI validator to a length floor (NIST recommends 15+ for single-factor; Solen's current 8 is below even NIST's 8-with-MFA floor, and there is no MFA per AUTHN-09) with no forced uppercase/digit. The breach-check half is effectively free: flip Supabase's "leaked password protection" toggle (Auth > Providers > Password), which the health audit already queued as a 10-second owner action. Only the composition-rule removal needs a code change.

### AUTHN-09: MFA does not exist (MEDIUM)

What is wrong: zero references to `mfa`, `totp`, `webauthn`, or `passkey` anywhere in `app/` or `lib/`.

What breaks in practice: nothing breaks today, this is an absent control, not a bug. But it means the highest-blast-radius account tier (salon owner/staff dashboards, which sit next to Stripe Connect payout access) has exactly the same single-factor protection as a browsing customer account, and the composition-rule password policy above means a credential-stuffed or breached password is the only thing standing between an attacker and a salon's payout dashboard.

The fix and its cost: this is real product work, not a one-liner. Supabase's TOTP MFA API (`auth.mfa.enroll/challenge/verify/listFactors`) is free and already available on the project; the build is an enrollment UI, recovery-code flow, and a support/reset path, scoped to owner/staff roles rather than every customer.

### AUTHN-12: salon-preview impersonation writes no audit trail (LOW)

What is wrong: `app/api/admin/preview-salon/route.ts` correctly gates on `role === "admin"` and restricts the target to `[TEST]%`-prefixed salons only, and its cookie expires in 1 hour, all good. But it never calls `lib/audit.ts`'s `logAuditEvent()`, the audit-log helper 26 other admin routes (salon approve/reject/freeze/warn, commission changes, feature-flag toggles, discovery moderation) already use to write to the live `audit_log` table.

What breaks in practice: nothing today, because the route is scoped to test salons only, so there's no real customer/salon data exposure risk yet. But if this route is ever generalized to preview real salons (a natural next step for support tooling), there would be zero record of which admin previewed which salon, when, or why.

The fix and its cost: one extra call, `await logAuditEvent(request, user.id, "preview_salon", "salon", salon_id)`, right before returning the response. Trivial, and worth doing before the route's scope is ever widened past test salons.

### AUTHN-04: no `__Host-` cookie prefix (LOW)

What is wrong: none of the 4 sampled cookie sites use the `__Host-` name prefix. All correctly set `httpOnly: true`, `sameSite: "lax"`, and `secure` conditional on `NODE_ENV === "production"` (deliberately, so local dev over plain HTTP still works, per the comment in `lib/bookings/guest-access.ts:112-114`).

What breaks in practice: nothing today; this is defense-in-depth against subdomain cookie-tossing, a threat that requires an attacker already controlling a sibling subdomain of solen.ch. Adopting `__Host-` also requires the cookie to be unconditionally Secure and Path=/, which conflicts with the deliberate prod-only Secure flag used for local dev.

The fix and its cost: low priority. If pursued, would need a dev-environment HTTPS setup first (so Secure can be unconditional), then a rename with a migration window for in-flight cookies.

## What Solen already does RIGHT

- **getUser() discipline is real, not aspirational.** Every server-side authorization decision in `middleware.ts` and the auth helpers uses `getUser()`. All 28 repo-wide `getSession()` calls were individually checked and are in `"use client"` files doing UI-only "already logged in, bounce away" checks, exactly the documented exception. The enforcement hook (`no-getsession-authz-gate.py`) is confirmed wired into `.claude/settings.json` in this worktree (a prior health audit flagged this as possibly missing; it is not missing here).
- **The backslash open-redirect bug found on 2026-07-09 is fixed.** `app/api/auth/callback/route.ts:18` now has all three guards (`startsWith("/")`, `!startsWith("//")`, `!includes("\\")`). Preserve all three if this line is ever touched again.
- **Signup's email-enumeration oracle is fixed and the fix is documented in the code.** `app/api/auth/signup/route.ts:70-74` returns the identical generic response whether the email is new or already registered, with an explicit `SECURITY:` comment explaining why. This closes the MEDIUM finding from the 2026-07-09 audit.
- **PKCE is the active OAuth flow by platform default and nothing overrides it.** `flowType` is never set anywhere in the repo.
- **Rate-limiting's IP-spoofing hole is fixed.** `lib/ratelimit.ts:322-334`'s `getClientIp()` now prefers Netlify's trusted `x-nf-client-connection-ip` header (unspoofable at the edge) before falling back to the attacker-controllable `x-forwarded-for`, closing the HIGH finding from the 2026-07-09 audit that let an attacker bypass every auth-route rate limit by rotating a fake XFF header. Not one of this topic's 13 named principles, but directly load-bearing for auth-route abuse resistance, so worth recording here.
- **Solen never hand-rolls password hashing**, and its own use of hashing (sha256 over 256-bit random tokens for booking-access and directory-claim codes) is the correct tool for that job, a slow KDF would be wasted effort on an already-infeasible-to-brute-force token.
- **No premature SAML or passkey dependency.** Both correctly deferred per the research's own "correct at scale, not yet" framing, and nothing in the code contradicts that.

## Unknowns

- **Supabase project's Auth > URL Configuration > Redirect URLs allowlist** (exact-match vs wildcard, AUTHN-05's second half): this lives in the Supabase dashboard/Management API, not in this repo, and could not be checked without a `SUPABASE_ACCESS_TOKEN` (the health audit already noted this token is absent from env). Would need the owner to open the dashboard or grant Management API access.
- **Refresh-token rotation and reuse-detection (AUTHN-07):** entirely inside Supabase GoTrue; no app code implements, wraps, or could disable it, so there is nothing in this repo to point at as proof either way. Treated as "trust the platform" per the research's own framing, not independently verified here.
- **Whether `preview-salon`'s 1-hour cookie is meaningfully shorter than "a normal session" in practice:** a real logged-in user's session persists indefinitely via silent refresh-token rotation (also platform-internal, see above), so the comparison is against an unbounded baseline. The 1-hour absolute cap is a real, verifiable bound in the code; whether that counts as "shorter than normal" depends on how a normal Supabase access-token TTL is configured project-wide, which is also dashboard config, not code.
- **Whether the `guest-access.ts`/`search/event.ts`/`analytics/track-view.ts` cookies could adopt `__Host-` without breaking local dev:** would need to check how local development actually serves HTTPS today (or confirm it doesn't and would need to start), not established in this pass.
