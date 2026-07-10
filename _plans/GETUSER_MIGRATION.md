# getSession -> getUser identity-verification migration (2026-07-10)

Source finding: `_plans/AUTH_BACKEND_AUDIT.md` confirmed `supabase.auth.getSession()`
reads the client-supplied cookie without verifying the JWT signature (checked against
`node_modules/@supabase/auth-js@2.99.2`). An attacker can forge a cookie with any
`user.id`. 236 API routes + 4 lib files resolve identity this way, then key the
service-role admin client (bypasses RLS) or a JS `=== user.id` check on that forged id.
`getUser()` verifies the JWT against the Supabase Auth server and fails CLOSED
(`{data:{user:null}}`) on any verification failure. App deploys on Netlify Node
functions (not Vercel Edge), so the old "avoid the network call" premise doesn't apply.

## Scope (single coder pass, mechanical + codemod)
1. Hand-fix the two shared primitives: `lib/supabase.ts` `getSessionUser()`,
   `lib/auth/require.ts` `requireAuth()`. Every other helper (`requireAdmin`,
   `requireSalonOwner`, `requireRole`) inherits the fix by calling `requireAuth()`.
2. Codemod (`scripts/codemods/getsession-to-getuser.mjs`) over the remaining
   ~236 inline `auth.getSession()` callers in `app/api` + `lib`, transforming the
   dominant idiom and SKIP-listing anything that doesn't match (access_token reads,
   aliased destructuring, colliding local vars) for hand-fix.
3. Hand-fix the SKIPPED list + the 3 access_token-dependent files
   (`app/api/bookings/guest-lookup/route.ts`, `lib/bookings/guest-access.ts`,
   `lib/bookings/authorize.ts`): gate the identity/authz decision on a verified
   `getUser()` user; keep `getSession()` only for reading `access_token` itself.
4. Independent bug in the same domain, already logged in AUTH_BACKEND_AUDIT.md as
   [HIGH] CONFIRMED: `app/api/dashboard/clients/[id]/notes/route.ts` GET has no
   salon-ownership check (POST/DELETE in the same file do). Add the matching check.
5. `npx tsc --noEmit` clean (excluding 2 pre-existing unrelated errors in
   `app/api/admin/discovery/backfill/route.ts` / `app/api/cron/discovery-ai-backfill/route.ts`).

## Status
ACTIVE (2026-07-10) - dispatched to the coder sub-agent as a single security-critical
mechanical pass. Reviewer grades against the checklist in the coder brief.
