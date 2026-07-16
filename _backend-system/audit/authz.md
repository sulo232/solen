# AuthZ , Solen vs `LAW.md` section 6 (audit 2026-07-16)

## Verdict

The model is right for our scale: RBAC + RLS, zero ABAC/ReBAC/policy-engine creep, middleware correctly not the sole gate (Next 15.3.8 is past the CVE-2025-29927 fix line). Two things earn attention: one live money-relevant IDOR, and a `FORCE ROW LEVEL SECURITY` question that a live query finally RESOLVES as a non-issue.

## Per-principle table

| id | rule | verdict | evidence | severity |
|---|---|---|---|---|
| AUTHZ-01 | Ownership check on every client-supplied ID, on every route | PARTIAL | Re-ran the gate's own heuristic as a static sweep over all 354 existing routes (the gate itself is Write-only, so existing routes are never re-graded): 32 flagged. Read 7 in full: **1 real gap** (below), 5 false positives (public-by-design). 25 of 32 + ~322 unflagged NOT read | MEDIUM |
| AUTHZ-02 | The admin client has BYPASSRLS; every call site is a zero-backstop decision | MATCH (fact) | `grep -rl createAdminSupabaseClient app/ lib/` = **267 files, 339 occurrences** (live count this session) | HIGH by construction |
| AUTHZ-03 | RBAC + RLS, not ABAC/ReBAC | MATCH | 0 hits for `opa\|zanzibar\|openfga\|spicedb\|cedar\|abac\|rebac` across `app/`, `lib/`, `package.json` | NONE |
| AUTHZ-04 | Middleware never the sole gate | MATCH | `package.json:54` = Next `15.3.8` (past 15.2.3 fix). `middleware.ts` fails CLOSED on exception. All 244 `getUser()` sites re-check inside the handler | NONE |
| AUTHZ-05 | Tenant isolation RLS-enforced; `FORCE ROW LEVEL SECURITY` set | PARTIAL, **live-resolved as non-issue** | Live: RLS enabled **148/148** tables; `relforcerowsecurity` = **0/148**. BUT all 148 are owned by `postgres`, which carries `rolbypassrls = true`, so FORCE RLS would change nothing (BYPASSRLS overrides it). `authenticated`/`anon` (what the app actually connects as) do NOT have bypassrls, so RLS genuinely restricts every session-client query | LOW |
| AUTHZ-06 | Use `lib/auth/require.ts`; never inline a new copy | GAP | Real importers outside the helper: **1** (`app/api/staff/[id]/availability/route.ts:3`). 83 files still inline `role !== "admin"` | LOW (debt, not a live bug) |

## The one real gap

**`app/api/bookings/express-rebook/confirm/route.ts:44-45` trusts a client-supplied `service_id` for pricing.**
```ts
const { data: service } = await admin
  .from("services").select("price").eq("id", service_id as string).single();
```
No `.eq("salon_id", slot.salon_id)`. The price is then written straight onto the booking (`price_paid: service?.price ?? 0`, line 80). A customer can book a slot at salon A while citing a cheaper service row belonging to salon B, understating what salon A is owed, with no error and no log.

Two sibling routes already do this correctly and are the copy-paste fix: `app/api/stripe/create-payment-intent/route.ts:59` (`if (service.salon_id !== salon_id) return 400`) and `app/api/walkin/pay-intent/route.ts:83`. `staff_id` (line 77) has the same unscoped shape; its blast radius was named but not traced.

## Ranked recommendations

1. **Fix express-rebook/confirm's salon-scoping.** Cost: ~6 lines, copying a pattern already proven twice in this codebase. The only live, provable, money-relevant gap found.
2. **Read the remaining 25 of 32 flagged routes.** Cost: a ~2h read-only pass.
3. **Turn the static sweep into `npm run` (NOT a blocking gate).** Cost: ~30 min. The gate's own history (34-45% FP on Edit) is the reason this stays informational.
4. **Adopt `lib/auth/require.ts` opportunistically, per file as touched.** Cost: ~10-15 lines/file. Do NOT mass-refactor 267 sites.
5. **DO NOT DO YET: FORCE RLS as a tracked control.** Live-proven a non-issue today. **Trigger:** a SOC2/enterprise questionnaire demanding it, or a connection-model change introducing a non-BYPASSRLS owner role.
6. **DO NOT DO YET: OpenFGA/SpiceDB/OPA/Cedar/ABAC.** **Trigger:** a staff member needing different permissions across MULTIPLE salons, or a partner/agency layer.

## What Solen already does RIGHT

- The 3 campaign IDORs stay fixed (client notes, client tags, barber-leaderboard: 2 of 3 re-read this session).
- `create-payment-intent` + `walkin/pay-intent` are the correct reference for scoping a client `service_id`. Copy them; do not touch them.
- `referral/complete` now requires a qualifying booking before crediting CHF 10 (prior HIGH, confirmed fixed by direct read).
- `stripe/save-card` resolves the Stripe customer server-side (prior MEDIUM, confirmed fixed).
- `directory/[id]/claim` OTP: rate-limited both steps + a 5-attempt cap that invalidates the code.
- `guard_profile_privilege_columns` + `guard_booking_status_escalation` DB triggers are backstops that hold even if an RLS policy is loosened.

## Sampling honesty

Grep-exhaustive on every pattern searched (267 admin-client files, 83 inline-role files, 0 policy-engine hits, 326 `CREATE POLICY`). Live DB queried read-only for RLS/FORCE/owner/bypassrls. Deep-read a MINORITY: 7 of 32 flagged routes + ~10 others. **25 of 32 flagged and ~322 unflagged routes were NOT read: that is "not checked", not clean.** Whether the heuristic has false NEGATIVES was not tested. `walkin-analytics`'s fix was not independently re-read (relying on the 2026-07-14 pass). The 18 `rls_enabled_no_policy` tables were reasoned from Postgres deny-by-default semantics, NOT confirmed with a live anon HTTP call.
