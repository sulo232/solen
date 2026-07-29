<!-- exists-check: net-new vs _plans/BACKEND_LAW.md (which BUILDS a law layer from external research),
     PRINCIPLES_GAP_RESEARCH.md / PRINCIPLES_IMPLEMENTATION.md / PRINCIPLES_LOOP.md (which are about
     principles we were MISSING). This file runs the opposite direction: it takes the non-design
     principles we ALREADY WROTE and tests each against external evidence, one verdict per principle.
     Different verb, different input, different output. Method: _design-system/RESEARCH_METHOD.md. -->

# PRINCIPLE RESEARCH , deep-research the non-design principles we already have

**Brief:** the 2026-07-28 RUNBOOK, section 4 queue. Method law: `_design-system/RESEARCH_METHOD.md`
(R1 lenses, R2 tiers, R3 could-not-verify is a result, R5 debunk, R6 verify load-bearing yourself,
R8 convergence is law / divergence is an owner decision, R9 a negative result is a finding,
R12 date every principle).

Verdicts: **KEEP** / **KEEP, SHARPEN** / **REVISE** / **DROP** / **OWNER DECISION**.
Evidence tiers: **(a)** primary source or peer-reviewed · **(b)** named practitioner · **(c)** my own inference.

Run started 2026-07-29. Every number below was produced by me this session, against the live
production database (`tocfnsmxmdxkrcmjzzdw`) or the working tree, not carried from the handoff.

---

## 0. FINDING BEFORE THE QUEUE , the handoff's own premises were partly false

The RUNBOOK told me to read two files first and treated a security fix as landed. Checked:

1. **`_design-system/RESEARCH_METHOD.md` does not exist on `main`.** It exists only at
   `.claude/worktrees/quirky-ellis-ef5559/_design-system/RESEARCH_METHOD.md`, on branch
   `claude/principles-security-audit-0ae738` (introduced by `f320d88c1`). `git merge-base
   --is-ancestor f320d88c1 main` returns false. The entire 2026-07-28 design pass, 39 commits and
   660 changed files, is stranded on that branch. **This is the second occurrence of the identical
   failure**: the 2026-07-27 law pass found four law-cited files stranded on
   `claude/taste-rationale-frameworks-37390c`. Once is an accident; twice is a workflow defect.
2. **The security migration is not on `main` either.** `supabase/migrations/20260728_availability_slots_public_security_invoker.sql`
   exists only on that branch. **But the fix IS live.** Verified directly:
   `reloptions = {security_barrier=true, security_invoker=true}` on `public.availability_slots_public`
   in production. So the exposure is genuinely closed; what is missing is the migration FILE, which
   means a rebuild-from-migrations would recreate the hole. Severity: reproducibility, not exposure.

**Consequence for this run:** I used the worktree copy of RESEARCH_METHOD.md as the method. The
branch itself is an owner decision, see D5 below, and I did not merge 660 files unilaterally.

---

## 4.2 SECURITY , `_rules/SECURITY_RULES.md` (done)

### S1 , "every new API route must have these layers, in this exact order"
`_rules/SECURITY_RULES.md:11-69`

**Verdict: REVISE.** Two defects, one architectural and one ordering.

**(i) The rule assumes the Next.js API route is the only door. It is not.** Solen exposes PostgREST
directly with the anon key, so every `SECURITY DEFINER` function granted to `anon` is a second
entrance that no S1 layer guards. Measured live via `get_advisors(security)` and `pg_proc`:

| function | security_definer | anon can EXECUTE | reachable at |
|---|---|---|---|
| `create_group_booking(text,uuid,int,text,jsonb)` | yes | **yes** | `/rest/v1/rpc/create_group_booking` |
| `search_salons_ranked(text,int,text)` | yes | yes | `/rest/v1/rpc/search_salons_ranked` |
| `search_suggest(text,uuid,text)` | yes | yes | `/rest/v1/rpc/search_suggest` |

`create_group_booking` is a **write** path callable unauthenticated. The app calls it through
`app/api/bookings/group/route.ts:56`, which does carry the S1 stack, so the guarded door exists,
it just is not the only one. An attacker with the public anon key skips the feature flag, the ban
check, the rate limiter and the zod schema entirely. Evidence tier (a) for the reachability
(Supabase's own linter `0028_anon_security_definer_function_executable` names the exact REST path);
tier (c) for the exploitability, which I did not attempt against production.

**(ii) The prescribed order puts rate limiting fourth, behind three DB round trips.**
`checkFeatureEnabled` -> `requireAuth` -> `checkUserBanned` -> `applyRateLimit`. An unauthenticated
flood therefore costs three queries per request before anything throttles it.
**Honest scoping (R3):** I went looking for a primary source that says rate limiting must precede
authentication and **could not find one**. OWASP API4:2023 says only "implement a limit on how
often a client can interact with the API within a defined timeframe" and does not address ordering
(fetched 2026-07-29). OWASP ASVS 5.0 §6.3.1 (L1) requires anti-automation controls on
credential-stuffing and brute-force paths but likewise does not fix an order. So the amplification
argument is **tier (c), my own inference**, and it should be labelled that way in the rule rather
than dressed as a standard.

**Fix, both parts:** S1 gains a second clause, "PostgREST is a door too: any new `SECURITY DEFINER`
function must either be `SECURITY INVOKER`, or have `EXECUTE` revoked from `anon`, or be justified
in a comment"; and the ordering note is marked as house reasoning, not OWASP.

### S3 , "RLS is non-negotiable"
`_rules/SECURITY_RULES.md:90-107`

**Verdict: REVISE. The rule covers tables and says nothing about VIEWS, which is exactly the hole
the 2026-07-28 incident fell through.**

Primary source, tier (a), PostgreSQL 17 `CREATE VIEW` docs, fetched 2026-07-29, verbatim:

> "By default, access to the underlying base relations referenced in the view is determined by the
> permissions of the view owner."
> "If any of the underlying base relations has row-level security enabled, then by default, the
> row-level security policies of the view owner are applied ... However, if the view has
> `security_invoker` set to `true`, then the policies and permissions of the invoking user are used
> instead."

So a view is RLS-transparent by default. Every S3 bullet ("ALWAYS enable RLS", "ALWAYS add explicit
policies") is satisfiable while a view over the same table leaks everything.

**And there is a second live instance of the same shape, which the handoff asked me to hunt for.**
Sweep of all six views in `public`:

| view | runs as | anon SELECT |
|---|---|---|
| `availability_slots_public` | invoker | yes (fixed 2026-07-28) |
| `profile_summaries` | invoker | yes |
| `public_profiles` | invoker | yes |
| `search_zero_results` | invoker | yes |
| **`staff_ratings_view`** | **owner** | **yes** |
| `search_popularity` | owner | no (not granted) |

`staff_ratings_view` selects from `staff_members`, whose SELECT policy is
`(owner of the salon) OR (is_active = true)`. Running as owner, the view ignores that.
**Proven to discriminate, not assumed:** the view emits **70** rows; `staff_members` holds **70**
total of which **67** are `is_active`. So **3 inactive staff members** are visible through the view
to anonymous callers who could not read them directly. Smaller than the 833-slot case and it leaks
only a staff id plus an aggregate rating, but it is the identical defect class and it is live now.
The Supabase advisor does **not** flag it, so the linter is not a sufficient control here either.

**Fix:** add a views clause to S3, and set `security_invoker = true` on `staff_ratings_view`
(additive, reversible, and it has a real caller at `app/[locale]/_components/salon/_shared.ts:30`
so the change must be verified against the PDP, not just applied).

### S1's `getSession()` ban
`_rules/SECURITY_RULES.md:13`

**Verdict: KEEP, SHARPEN (recency, R12).** The security claim is right and the estate honours it:
361 `auth.getUser` call sites against 11 `auth.getSession`, and I opened every one of the 11 , all
sit in `"use client"` components (`Header.tsx:490`, `HeartButton.tsx:82`, `MobileMenu.tsx:117`,
`NotificationBell.tsx:25`, `useCustomerPrefs.ts:37`, `inspo/page.tsx:129`,
`auth/register/page.tsx:263`, `auth/reset-password/page.tsx:46`, `profile/intake-forms/page.tsx:45`,
`onboarding/salon/page.tsx:439`, plus a doc comment at `lib/supabase.ts:63`). Zero server-side
authz decisions. The rule holds.

**What is stale is the recommendation, not the ban.** Supabase's current Next.js docs (searched
2026-07-29) refresh the auth token via `supabase.auth.getClaims`, not `getUser`, in the proxy /
middleware layer. Installed: `@supabase/supabase-js` **2.110.2**, `@supabase/ssr` **0.12.0**, both
of which have `getClaims`. `middleware.ts:142` still calls `getUser()`. That is not a
vulnerability, it is a per-request network round trip that `getClaims` avoids with asymmetric keys.
Rule keeps its ban, gains a dated line naming `getClaims` as the current upstream shape.

### S2, S4, S5, S6
**Verdict: KEEP.** S6 (re-read the role from the database, never trust a client claim) is
OWASP API5:2023 Broken Function Level Authorization stated in our own words, tier (a). S2 and S4
are uncontroversial. S5 is a pointer table, not a claim.

### NEW GAP , breached-password checking is OFF, and two independent standards require it
Not currently a rule anywhere. Surfaced by `get_advisors(security)` on 2026-07-29:
`auth_leaked_password_protection` , "Leaked password protection is currently disabled."

Two independent primary sources converge, which R8 calls the strongest evidence available:
- **NIST SP 800-63B (rev 4) §3.1.1.2**, fetched 2026-07-29: verifiers "**SHALL** compare the
  prospective secret against a blocklist that contains known commonly used, expected, or
  compromised passwords."
- **OWASP ASVS 5.0 §6.2.12 (L2)**, fetched 2026-07-29: "Verify that passwords submitted during
  account registration or password changes are checked against a set of breached passwords."

Cost to close: one toggle in the Supabase dashboard, no code. **Owner action, not mine** , it is a
production auth config change.

### OWNER DECISION D1 , minimum password length, 8 or 15
`lib/validations.ts:686` sets `z.string().min(8).max(200)`.

The two standards **diverge**, so per R8 this is a decision, not a fact:
- ASVS 5.0 §6.2.1 (L1): "at least 8 characters in length although a minimum of 15 characters is
  strongly recommended." We **pass**.
- NIST 800-63B rev 4 §3.1.1.2: "**SHALL** require passwords ... to be a minimum of 15 characters"
  for single-factor. We **fail**, unless MFA is enforced, which it is not.

NIST is a US federal standard and is not law in Switzerland, so this is a quality bar, not a
statutory floor, and it does not enter precedence tier 2. **My lean: stay at 8 and turn on the
breached-password check instead.** Reason with a named cost either way: raising the floor to 15 on
a pre-launch consumer marketplace costs signup completion, and the breach check removes far more
real risk per unit of friction than length does. Also worth stating plainly: `max(200)` satisfies
ASVS §6.2.9 ("at least 64 characters are permitted"), so nothing is wrong at the top end.

---

## 4.1 BACKEND LAW , money storage and the two-convention hazard (partial, see status)

### "Money is stored as integer minor units, never float"
Stated in `_backend-system/research/data-modeling.md` (topic 1) and inherited by `_plans/BACKEND_LAW.md:49`.

**Verdict: KEEP the ban on floats. REVISE the claim that we follow the rule.**

Swept every money-shaped column in `public` (78 columns matched
`price|amount|total|fee|cost|balance|credit|payout|discount|revenue|subtotal|tax|vat`):

- **Zero** `double precision` or `real` columns. The float ban is genuinely held. Good, and a new
  session should not "fix" it.
- But **two conventions run side by side**, 36 columns in `integer` (Rappen / minor units) and 42
  in `numeric(n,2)` (CHF / major units), and `bookings` carries **both at once**:
  `paid_amount integer`, `net_amount integer`, `vat_amount integer`, `refunded_amount integer`
  alongside `price_paid numeric(8,2)`, `final_price numeric(10,2)`, `platform_fee numeric(10,2)`,
  `deposit_amount numeric(10,2)`, `estimated_price numeric(10,2)`.

**Which one is actually live, measured on 964 booking rows:** `price_paid` set on **964**,
`platform_fee` on **964**, `deposit_amount` on **964**, `paid_amount` on **9**, and
`final_price`, `estimated_price`, `net_amount`, `vat_amount` on **0**. So the dominant live
convention is CHF-major-units `numeric`, which is the opposite of the researched principle, and the
principle-compliant column is the near-dead one.

**Could not verify (R3):** I tried to prove a live unit mismatch and **failed to find one**. On all
9 rows where both are set, `paid_amount = round(price_paid * 100)` exactly (25.50 / 2550,
80.00 / 8000, 165.00 / 16500, ...). Zero rows have `final_price` and `paid_amount` both set, so
that pair cannot be tested at all. **There is no evidence of live corruption.** The finding is a
structural hazard, not a demonstrated bug, and saying otherwise would be the exact contamination
R3 exists to prevent.

**The estate already knows.** `app/api/bookings/[id]/cancel/route.ts:143-144` reads:
`// Fee base in Rappen: paid_amount (Rappen) ?? toRappen(price_paid CHF). NEVER mix units.`
So the convention and its fallback are correct in the code I opened. **What is missing is that this
is written nowhere in `_rules/*`, has no CHECK constraint, and has no gate.** A new session picks a
column by autocomplete. Named cost of leaving it: a 100x money error is one wrong column away, on a
pre-launch product where it would surface as a wrong charge the first week it is live.

**Recommendation, ranked, each with its cost:**
1. Write the convention into `_rules/DB_SCHEMA.md` as a named law (cost: nothing).
2. Retire the dead columns , `final_price`, `estimated_price`, `net_amount`, `vat_amount` hold zero
   rows (cost: a migration and a types regen; risk that a half-built feature wanted them, so this
   needs a grep pass first, which I have not done).
3. A gate that blocks a new money column whose name does not encode its unit (cost: one hook,
   plus the bikeshed about naming).

### `function_search_path_mutable` , 3 functions
`get_advisors(security)`, 2026-07-29: `salons_with_slot_in_hours`, `booking_revenue_sum`,
`record_csp_violation` have a role-mutable `search_path`. All three are `security_definer = false`
(verified in `pg_proc.prosecdef`), which is what makes this a WARN rather than the CVE-2018-1058
privilege-escalation shape. Real but low severity. Not a principle defect; a hygiene item.

---

## STATUS , what is done and what is not

| queue item | state |
|---|---|
| 4.1 BACKEND LAW | **PARTIAL.** Money storage done with live evidence. The other 14 topics not yet verdicted. |
| 4.2 SECURITY | **DONE** for `_rules/SECURITY_RULES.md` S1-S6 + the anon-reachable sweep the handoff asked for. The fable-backend S1 pass itself is not yet audited. |
| 4.3 SILENT NO-OP | not started |
| 4.4 PSYCHOLOGY | not started |
| 4.5 I18N / COPY | not started |
| 4.6 MOTION | not started |
| 4.7 remaining `_rules/*` | not started |

## Owner decisions surfaced (do not resolve these silently)

- **D1** , password minimum 8 (ASVS-compliant) or 15 (NIST-compliant). My lean: stay at 8, turn on
  the breach check. See 4.2.
- **D2** , turn on Supabase leaked-password protection. One dashboard toggle, production auth
  config, so it is the owner's to flip.
- **D3** , `staff_ratings_view` -> `security_invoker = true`. Additive and reversible, but it has a
  live caller, so it wants a PDP verification pass alongside.
- **D4** , `create_group_booking` is a `SECURITY DEFINER` write callable by `anon` over PostgREST.
  Revoke `EXECUTE` from `anon` (the app calls it through an authenticated API route, so nothing
  should break) or justify it.
- **D5** , the stranded branch `claude/principles-security-audit-0ae738`: 39 commits, 660 files,
  including RESEARCH_METHOD.md and the security migration. Merge, cherry-pick, or abandon.
