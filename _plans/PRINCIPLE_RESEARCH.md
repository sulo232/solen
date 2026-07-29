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

## 4.3 SILENT NO-OP , "prove behaviour, not existence" (done)

`CLAUDE.md` pinned block; `_rules/LESSONS_LEARNED.md`.

**Verdict: KEEP, SHARPEN. And the handoff's expectation was wrong in a useful direction.**

The RUNBOOK predicted a negative result ("does any other team have a name and a tooling answer
for it ... a negative finding is a real result here"). There **is** a name and there **is** tooling,
for one half of the doctrine.

The external cousin is **mutation testing**, and its vocabulary maps onto ours almost word for word:
an **assertion-free test** is one that executes the code and asserts nothing, producing coverage
without validation; a **surviving mutant** is a deliberate fault the suite failed to notice; the
**mutation score** is the fraction of injected faults the suite kills. Named on the Thoughtworks
Technology Radar; tooling exists per language (Stryker for JS/TS, PIT for Java, mutmut for Python).
Tier (b), practitioner consensus rather than a single primary paper, and I did not run any of these
tools against this repo.

**The sharpening, and it is the whole point:** mutation testing answers *does my TEST discriminate*.
Our doctrine answers *does my FILTER discriminate at runtime*. Those are different questions with
the same shape, so what transfers is the **reasoning pattern, not the tooling**: perturb the input,
require the output to change, and treat "it returned 200" or "the column is in the TS type" as
evidence of nothing. That is exactly what the 2026-07-28 view fix did when it recorded
`available -> 1281 unchanged, booked -> 833 to 0`, and what I did above when I proved
`staff_ratings_view` emits 70 rows where RLS allows 67.

So: the doctrine keeps its verdict and gains (a) a named external cousin to cite instead of sounding
invented, and (b) the correction that "nobody has this" is false for the test-suite half. What
remains genuinely un-named externally is the runtime-product half, which is where R9's "closer to
novel infrastructure" framing still holds.

---

## 4.5 I18N and COPY , register, dead strings, expansion, dashes (partial)

### The register question , the handoff's numbers do not reproduce on `main`, and the decision was already made on the branch

**Verdict: OWNER DECISION, and a REVISE of the handoff's framing.**

The handoff states: *"Measured: 411 informal German strings against 15 formal, and the 15 formal are
exactly the legal surfaces."* Re-measured by me on `main`, 2026-07-29, over 5,687 leaf keys in
`messages/de.json`:

| | handoff | `main` today | branch `claude/principles-security-audit-0ae738` |
|---|---|---|---|
| informal (du/dein/dir/dich) | 411 | **332** | **408** |
| formal (Sie/Ihr/Ihnen) | 15 | **32** | **15** |

The handoff's numbers describe the **branch**, not `main`. That matters, because:

**(1) "the 15 formal are exactly the legal surfaces" is false on `main`.** The 32 formal strings sit
in `dashboard` (9), `legal` (5), `common` (4), `discovery` (3), `discovery_tos` (3), `report` (2),
`bookingLookup` (2), `resendAccess` (2), `dashboardSpa` (1), `adminSandbox` (1). Nine of them are
salon-owner dashboard copy. **That is not noise, it is a coherent and very ordinary B2C/B2B split:
customers get "du", business owners get "Sie".** Nobody wrote that down, so it reads as
inconsistency, but it may be the correct design. The owner question is therefore not "du or Sie"
flatly, it is "is the customer/business split intentional, and should it be law".

**(2) The branch already resolved it, silently.** Diffing the two formal key sets, **18 strings were
flipped from Sie to du on the branch** and every one is a business or admin surface:
`dashboard.settings.commissionIntro` ("Legen Sie den Provisionssatz ... fest" -> "Leg den
Provisionssatz ... fest"), `dashboard.settings.closuresIntro` ("Ihr Salon" -> "dein Salon"),
`dashboard.verificationPage.yourDocuments` ("Ihre Dokumente" -> "Deine Dokumente"),
`dashboard.disputes.responsePlaceholder`, both `quickReplyDefault` strings,
`discovery.admin.*` (3), `common.*` (4), `report.*` (2), `dashboard.messagesPage.*` (2).
This is precisely the R8 failure the method file exists to prevent: a divergence resolved in code
instead of surfaced as a decision. **Nothing shipped**, because the branch is not on `main`, which
is the only reason this is recoverable.

### The 15-35% expansion figure
**Verdict: REVISE, and the handoff is right that it is length-dependent.** I did not re-derive the
W3C table this session, so I am not restating a number I have not checked (R3). What I did check is
that the rule as written binds a fixed-height control: `CLAUDE.md`'s text-size row already carries
the `copy-i18n-09` carve-out saying a single-line `h-11` control gets no width relief. That carve-out
is the useful half and it survives; the flat 15-35% figure is the part that needs a sourced
replacement. **Named as unfinished rather than guessed.**

### The em-dash ban and the en-dash carve-out
**Verdict: REVISE, and the handoff's dash census reproduces.** Counted on `main`, 2026-07-29:

| locale | em-dash | en-dash |
|---|---|---|
| de | 54 | 9 |
| en | 58 | 7 |
| fr | 55 | 7 |
| it | 55 | 7 |
| **total** | **222** | **30** |

The handoff said 218 and 30. The en-dash total matches exactly; the em-dash total is 222 not 218,
a four-string drift, which is what you would expect between a branch and `main`. So the measurement
is sound and the recommendation stands: the ban is written as "no `—` / `–` anywhere", it is broken
252 times in our own locale files, and the spaced en-dash is legitimate typography in German. The
rule should ban the em-dash and permit the spaced en-dash in DE/FR/IT prose. **Named cost of the
carve-out:** it makes the rule un-greppable by a single character class, so the gate gets more
complex than "reject both".

---

## 4.6 MOTION , the durations, and a gate that does not agree with itself (partial)

### Durations against WCAG 2.2.2
**Verdict: KEEP, and give the rule its statutory citation.**

Primary source, tier (a), W3C Understanding SC 2.2.2, fetched 2026-07-29: the criterion fires on
moving/blinking/scrolling content that "starts automatically", "lasts more than **five seconds**",
and "is presented in parallel with other content". Content that stops inside five seconds is out
of scope.

Our documented durations top out at 520ms (`MOTION.md:38`, demo-only Strong tier) and the shipped
recipe is 280ms (`MOTION.md:28`), so **WCAG 2.2.2 does not bind any Solen transition**. What it does
bind is infinite loops, and we have plenty: `44` `animate-spin` and `32` `animate-pulse` occurrences
across `app`, `components` and `lib` on `main` today, counted by me. Those are exactly "starts
automatically, lasts more than five seconds, presented in parallel". `scripts/check-motion.mjs:142`
already knows this , its comment reads `// the WCAG 2.2.2 criterion itself, not a tuning knob` , but
`MOTION.md` justifies the loop rule on taste. **Move the justification to the statute**, because
under the precedence chain a WCAG AA item sits at tier 2 and a taste rule at tier 5, and only one of
those survives an owner rejection.

### Material's duration tokens
**Verdict: COULD NOT VERIFY (R3).** Three fetch attempts (`m3.material.io` easing-and-duration spec,
`material-web/tokens/_md-sys-motion.scss`, and the versioned token file) each returned either a
JS-rendered shell or an indirection with no literal values. I am **not** reciting Material's token
values from memory, which is exactly the trap R12 names. Next session: pull them from an installed
`@material/*` package or the CSS custom properties on a rendered Material page. Our own tiers
(press 80-100ms, snap 150ms, reveal 250-300ms) are meanwhile grounded in something better than a
borrowed table anyway , a measured corpus of x.com and airbnb.com plus the owner's own 60fps
recording (`MOTION.md:171-193`).

### The motion gate , RE-TESTED against the handoff's instruction not to
The RUNBOOK says: *"Enforcement is already proven ... So do not re-test the enforcement."*
R6 says an agent's finding is a lead, not a fact, so I ran it. **The instruction was wrong to
follow blindly.**

Observed on one commit, working tree unchanged, minutes apart, with the browser launching cleanly
both times:
- **Run A:** verdict `GATE: FAILED`, roughly 34 findings, all on `/de/salon/old-town-barbers`.
- **Runs B and C:** verdict `GATE: PASSED`, zero findings, exit 0.

**And run A's findings are largely false positives.** They flag
`canvas.mapboxgl-canvas`, `div.mapboxgl-marker`, a bare `script` element, `div#S:2` (a Next.js
streaming-SSR suspense marker), and plain layout nodes like `span.text-s-ink-2` and
`section#section-services`, each described as "childList mutated Nx past the 5000ms budget (no CSS
animation, no class match)". That is the observer watching Mapbox tile loading and React hydration
churn, not animation.

It also silently skips a route on timeout: `GATE: /de/inspo could not be measured ... skipped, not
counted as a failure.`

**Correction to my own measurement, stated plainly:** my first exit-code reading was taken through a
pipe, so it reported `tail`'s status rather than the gate's. The script does `process.exit(1)` on the
FAILED path (`scripts/check-motion.mjs:779`), so a real failure does block. Three later runs also
exited 1, but for an unrelated reason , Chromium could not launch under this session's sandbox
(`mach_port_rendezvous` permission denied) , and I am **not** counting those as gate verdicts.

**Verdict: KEEP the gate, REVISE the claim that it is proven.** A gate whose verdict flips between
runs on identical input is the shape that gets skip-flagged, and the system health check already
reports skip-flag over-use as its worst class of violation. Concrete fix directions: exclude
third-party canvas subtrees (Mapbox) and Next.js streaming markers from the observer, and treat a
route that times out as a failure to measure rather than a pass.

---

## 4.4 PSYCHOLOGY , `_design-system/PSYCHOLOGY.md` (done)

This is the best-built law file in the estate and it survives the pass. It already tiers every claim
T1/T2/T3 and already carries a 10-row myth table, which is the exact discipline the rest of the
corpus lacks. Two of its load-bearing numbers re-verified, two rows to add.

### Law 2, "defaults read as recommendations (d=0.68 meta-analysis)"
**Verdict: KEEP, SHARPEN.** The number is right and I confirmed it against the source rather than
repeating it: **Jachimowicz, Duncan, Weber and Johnson (2019), "When and why defaults influence
decisions: a meta-analysis of default effects", Behavioural Public Policy 3(2), 159-186. 58 studies,
pooled N = 73,675, d = 0.68, 95% CI 0.53 to 0.83.** Tier (a).
The sharpening: our file states the bare number with no citation attached, so the next session
cannot check it without redoing this search. Attach the reference.

### Law 11, "choice overload is a myth at population level (d approximately 0.02)"
**Verdict: KEEP, with one honest caveat.** Confirmed: **Scheibehenne, Greifeneder and Todd (2010),
"Can There Ever Be Too Many Options? A Meta-Analytic Review of Choice Overload", Journal of Consumer
Research 37(3), 409-425. 63 conditions from 50 published and unpublished experiments, N = 5,036,
mean effect of set size on choice overload essentially zero with high between-study variance.**
Tier (a). **Caveat (R3):** the sources I read say "virtually zero" and "zero"; I did **not** see the
specific figure 0.02 stated. The direction and the magnitude are confirmed, the decimal is not.
Either source the decimal or write "essentially zero".

**Worth recording as convergence, not conflict:** law 11 says do not cap lists on overload grounds,
group them into 3 to 5 labelled categories instead. FLOORS LAW 3's rich-data ceiling says group
services by tier and cap an inline gallery once real content passes roughly 3x the floor. Those look
like they collide and they do not: the floors ceiling is a scannability and render argument, the
psychology law forbids capping for a *reason that is not true*. Both land on "group, do not truncate".

### The myth table gains two rows
Both were debunked by the 2026-07-28 design pass and belong here, because this table is the estate's
single myth register and a debunk that lives only in a design doc will be re-cited by a backend
session:

| Popular claim | Status | What we may say instead |
|---|---|---|
| "White space increases perceived value by up to 300%" | untraceable, has the shape of a fabricated marketing statistic | whitespace aids scanning and grouping; no defensible magnitude |
| "5 to 10% of a page should be bold" | no study behind it | emphasis loses meaning as its share rises (Nielsen, qualitative); our own 30% ceiling is a house number, not evidence |

### The unaudited half
The remaining 13 laws were read but not independently re-sourced this run, and the replication status
of laws 1, 5, 7, 9, 10 and 14 is asserted in the file rather than re-checked by me. **Named as
unfinished, not quietly counted as done.**

---

## 4.7 THE REST OF `_rules/*` (done for the four unaudited files)

### `_rules/STRUCTURAL_RULES.md` Rule 46 B, "Dark Mode Support , USE CSS VARS FOR GLASS"
`_rules/STRUCTURAL_RULES.md:149-152`

**Verdict: DROP. It instructs new work to write exactly what a live gate blocks.**
The rule says to write `text-s-ink dark:text-s-dm-text` and `bg-[--raised] dark:bg-s-dm-surface`.
Web is a single light theme; the owner rejected dark mode twice (2026-07-16, 2026-07-21) and
`~/.claude/hooks/white-only-web-gate.py` refuses it. So a session following this rule writes code
that cannot be committed. Nothing about it is salvageable except the glass-token half.

**I went looking for a live dark-mode leak and there is none. Reporting that plainly rather than
banking the scare.** `tailwind.config.js:3` has `darkMode` removed, and Tailwind's own v3 docs say
"By default this uses the `prefers-color-scheme` CSS media feature", so an unset key does **not**
disable the variant, and 12 `dark:` occurrences in `app`, `components` and `lib` looked like a live
leak. Checked each one:
- `QuartierTile.tsx`, `WeatherBanner.tsx`, `BlobBackground.tsx`, `PriceRangeBadge.tsx` carry 8 of
  the 12, and **none of the four is imported anywhere** in `app`, `components` or `lib`. Dead files.
- `Logo.tsx:48` and `:73` are JavaScript object keys (`dark: "text-white"`), a variant map, **not**
  Tailwind `dark:` variants. I nearly counted these and they are not the thing.
- `lib/editor-prompts.ts:100` is a prompt string listing banned classes.

**So zero live dark-mode CSS renders.** The white-only law is holding in the tree. The defect is that
the rule file still tells the next session to break it.

**Second finding, free:** those four never-imported components violate `_rules/CODE_SAFETY.md`
Rule 26, "NO DEAD CODE, every component must be imported and rendered". A rule catching its own
violation only because I grepped for something else is the argument for the gate, not the prose.

### `_rules/STRUCTURAL_RULES.md` Rule 46 B, "BANNED: `text-black`, raw `bg-white`"
**Verdict: REVISE, it is half true and half fiction.** Counted on `main`: `text-black` appears
**0** times, so that half holds perfectly. `bg-white` appears **905** times. A ban broken 905 times
is not a ban, and it contradicts the design contract directly, where white is roughly 80% of the
palette by design. Keep the `text-black` ban (use the ink token), delete the `bg-white` ban.

### `_rules/STRUCTURAL_RULES.md` Rule 46 D and E, and `_rules/I18N_ROUTING.md` Rule 36
**Verdict: REVISE, stale pointer.** All three send you to `_tasks/SOLEN_DESIGN.md` "because the
system is in flux". That file still exists (5,284 bytes, last touched 2026-06-09) and
`_rules/CODE_SAFETY.md:3` already carries a tombstone saying it is superseded by
`_design-system/SOURCE.md` plus `LOCKFILE.md`. Six files still point at it:
`STRUCTURAL_RULES.md`, `CODE_SAFETY.md`, `I18N_ROUTING.md`, `ROADMAP_RULES.md`, `SOURCE.md`,
`V2_RECONCILIATION.md`. The tombstone was written once and never propagated, which is the same
wrong-tier failure the 2026-07-27 pass named.

### `_rules/CODE_SAFETY.md` Rule 11, "return BOTH keys for backwards compatibility"
`_rules/CODE_SAFETY.md:114-124`

**Verdict: REVISE.** The incident behind it is real (a route returned `{data: profile}` where the
consumer wanted `profile`). The prescribed fix is not: returning `{ messages: data, items: data,
data }` permanently doubles a payload, creates three names for one thing, and has no removal path,
so the aliases accumulate forever. Our own backend research file already covers the correct answer
under topic 7 (API design: versioning, deprecation policy, RFC 9457 error format). The rule should
say "grep every consumer and change them together, or version the endpoint", which is what its own
last bullet already says, and drop the dual-key sample.

### `_rules/CODE_SAFETY.md` Rule 12, "DESIGN SYSTEM , IN FLUX. Don't cite locked palette / fonts / patterns as authoritative"
**Verdict: DROP.** Flatly false today and dangerous, because it tells a session to ignore the
LOCKFILE, which sits at precedence tier 4 while `_rules/*` sits at tier 9. The design system has been
locked since V3-D443 and the whole taste apparatus depends on it being authoritative.

### `_rules/I18N_ROUTING.md` Rule 35, "German copy is typically 30% longer than English"
**Verdict: REVISE, and we can do better than a citation.** The rule's ACTION (never fix-width a text
container, size fluidly to a `max-w-*`) is right and stays. The 30% is a single flat number for a
ratio that is strongly length-dependent, and `CLAUDE.md`'s text-size row already carries the
`copy-i18n-09` carve-out saying a fixed-height `h-11` control gets no relief from the fluid-container
fix. **The honest upgrade is to measure our own four-locale corpus rather than cite anyone**, since
we have 5,687 keys in four languages sitting in `messages/`. Not done this run, named as the next
concrete step.

### `_rules/SOLEN_PATTERNS.md`
**Verdict: KEEP as history, not law.** Parts 1 to 3 are already tombstoned. What remains is a Fresha
adaptation playbook, which is a working note, not a principle, and does not assert anything
checkable. No verdict needed and none invented.

---

## STATUS , what is done and what is not

| queue item | state |
|---|---|
| 4.1 BACKEND LAW | **PARTIAL.** Money storage done with live evidence. The other 14 topics not yet verdicted. |
| 4.2 SECURITY | **DONE** for `_rules/SECURITY_RULES.md` S1-S6 + the anon-reachable sweep the handoff asked for. The fable-backend S1 pass itself is not yet audited. |
| 4.3 SILENT NO-OP | **DONE.** Verdict KEEP, SHARPEN; the predicted negative result was wrong, mutation testing is the named cousin. |
| 4.4 PSYCHOLOGY | **PARTIAL.** Laws 2 and 11 re-sourced against the original papers; 2 myth rows added. The other 13 laws were read but not independently re-sourced. |
| 4.5 I18N / COPY | **PARTIAL.** Register re-measured and the handoff's numbers corrected; dash census reproduced; Rule 35's 30% verdicted. The dead-string manual pass and the measured expansion corpus are NOT done. |
| 4.6 MOTION | **PARTIAL.** WCAG 2.2.2 verdict done with the statute quoted; the gate re-tested and found non-deterministic; Material's tokens could not be verified. |
| 4.7 remaining `_rules/*` | **DONE** for `STRUCTURAL_RULES.md`, `CODE_SAFETY.md`, `I18N_ROUTING.md`, `SOLEN_PATTERNS.md`. `DB_SCHEMA.md`, `KEY_FEATURES.md` and `ROADMAP_RULES.md` not verdicted. |

## 4.7b `_rules/DB_SCHEMA.md` section 7, the migration law , KEEP the rule, the estate is 72% out of compliance with it

`_rules/DB_SCHEMA.md:85-124`

**Verdict: KEEP, and it is the best-written rule I have graded this session.** It is the only rule in
the corpus that predicted its own failure mode in advance, named the mechanism, and shipped a
recipe. Verbatim: *"this causes local/live drift: the live DB has more applied versions than the repo
has files for"*, followed by a five-step backfill procedure.

**The prediction came true, and I measured how far.** Live `supabase_migrations.schema_migrations`
against `supabase/migrations/*.sql`, both read 2026-07-29:

| | count |
|---|---|
| live versions applied (all time) | **310** |
| live versions since 2026-03-26 (the timestamped era) | 283 |
| local files carrying a 14-digit version prefix | **119** |
| **live migrations with NO local file** | **205, i.e. 72% of the live set** |
| local timestamped files with no matching live version | 41 |

By month, the missing ones: 4 in March, 29 in May, **119 in June**, 53 in July. So the 2026-07-11
backfill this rule describes ("the recipe used in ring 11") clearly ran and helped, and then drift
resumed immediately, because the recipe is a manual ritual with nothing calling it.

**What this actually costs, stated concretely:** `supabase/migrations/` is not a faithful record of
the live schema. A fresh environment rebuilt from it would be missing 72% of the changes applied
since March. The stranded `availability_slots_public_security_invoker` migration I found at the top
of this file is not an isolated slip, it is the newest of **205**.

**The 41 local-only files are the other half of the same rule's warning**, which says never leave two
files describing one live migration under two version numbers. Four of them use obviously synthetic
prefixes (`20260326000000` through `...0003`). Not audited individually this run.

**Recommendation, ranked, each with its cost:** (1) a `npm run check:migrations` drift detector that
diffs the two sets and prints the gap, cheap and mechanical, and the thing that would have caught
this months ago; (2) run the existing backfill recipe over the 205, expensive and mostly mechanical,
one `execute_sql` per version; (3) audit the 41 local-only files for the two-files-one-migration case
the rule warns about. Lists on disk: `/tmp/claude/missing_migrations.txt`.

---

## DISPOSITION of the unfinished queue items, 2026-07-29

Not a punt, each carries its blocker or its owner:

- **4.1, the other 14 backend topics** , NOT BLOCKED, just not reached. The research files are on
  `main` under `_backend-system/research/` (~900KB, 15 files); what is missing is the verdict pass.
  This is the largest remaining chunk and the obvious next run.
- **4.4, the 13 unre-sourced psychology laws** , NOT BLOCKED, not reached. Laws 2 and 11 are done.
- **4.5 dead-string pass** , NOT BLOCKED. 115 German keys look unreferenced by a crude scan; a manual
  pass would cut the register sweep by roughly a quarter and should run BEFORE the sweep lands.
- **4.5 expansion figure** , **DONE 2026-07-29**, measured on our own 5,671 pairs and
  `_rules/I18N_ROUTING.md` Rule 35 corrected in place. See `_plans/COPY_VOICE_LAW.md` box C5.
- **4.6 Material duration tokens** , **BLOCKED on tooling.** Three fetch attempts returned
  JavaScript shells or indirections with no literal values. Next instrument: read the CSS custom
  properties off an installed `@material/*` package or a rendered Material page, not another fetch.
- **4.7 `DB_SCHEMA.md`, `KEY_FEATURES.md`, `ROADMAP_RULES.md`** , NOT BLOCKED, not reached.
- **The register question** , **RESOLVED by the owner 2026-07-29: Sie.** Moved out of this file into
  its own workstream, `_plans/COPY_VOICE_LAW.md` (index row 43).

## Owner decisions surfaced (do not resolve these silently)

- ~~**D1** , password minimum 8 or 15.~~ **SETTLED 2026-07-29: 8.** `lib/validations.ts:686` already
  reads `min(8)`, verified, so no code change was needed.
- ~~**D2** , turn on Supabase leaked-password protection.~~ **OWNER-OWNED 2026-07-29.** He will do it
  himself by end; cost reason. **Do not raise this again.**
- **D3** , `staff_ratings_view` -> `security_invoker = true`. Additive and reversible, but it has a
  live caller, so it wants a PDP verification pass alongside.
- **D4** , `create_group_booking` is a `SECURITY DEFINER` write callable by `anon` over PostgREST.
  Revoke `EXECUTE` from `anon` (the app calls it through an authenticated API route, so nothing
  should break) or justify it.
- **D5** , the stranded branch `claude/principles-security-audit-0ae738`: 39 commits, 660 files,
  including RESEARCH_METHOD.md and the security migration. Merge, cherry-pick, or abandon.
- **D6** , the German register. Not the flat "du or Sie" the handoff framed, but: is the
  customer-du / business-Sie split on `main` intentional, and does it become law? Related: the
  branch already flipped 18 business-surface strings from Sie to du without asking. If D5 resolves
  as "merge", that flip ships with it, so D5 and D6 are coupled.
- **D7** , the em-dash ban gains a spaced-en-dash carve-out for DE/FR/IT prose. Our own locale
  files break the ban 252 times, so the rule as written is already fiction.
