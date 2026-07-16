# `QUESTIONS.md` , the backend forks only the owner can settle

Each has my **recommendation** and the reasoning. None is a bare "you decide." Answer by name and I will apply it; the row then gets dated into `LAW.md`.

---

## Q1. The fabricated accessibility flags on prod , RESOLVED 2026-07-16 (owner said "go")

> **DONE, do not re-ask.** Owner approved (a)+(b). Prod data nulled via a SCOPED update: each
> column only where its value still equalled that column's exact hash expression, so a real human
> correction would have survived. Verified 20/20 matched beforehand, so nothing real was lost;
> re-verified after: 0 of 20 salons still claim any amenity. Migration
> `20260716150000_null_fabricated_salon_amenities.sql` added so a db reset reproduces the corrected
> state instead of re-running the idempotent seed (old migration untouched, forward-only). Badges +
> facets hidden behind `AMENITIES_SELF_REPORTED` (`app/[locale]/_components/salon/_shared.ts`), and
> `app/api/salons/route.ts` now IGNORES a stale `?wheelchair_accessible=true` link instead of
> applying it (applying it returns 0 of 20, proved with SQL, with no visible chip to clear: the
> silent-no-op class). Option (c) was moot: there are 0 test salons.
>
> **STILL OPEN as separate work:** collect the real answers via onboarding/dashboard, THEN flip the
> flag. Do not flip it before the data is real. The filter is only honest when the data is real.

<details><summary>Original question, kept for the record</summary>


**The fact.** `supabase/migrations/20260530_seed_salon_amenities.sql:11-21` sets nine amenity booleans on the live `salons` table from `abs(hashtext(id || salt)) % 100 < N`. Verified on prod 2026-07-16: **all 20 active salons still exactly equal the hash output**, so not one has ever been corrected by a real owner. **7 claim wheelchair access, 8 claim LGBTQ+ welcome, purely as a function of their UUID.** They render as badges (`SalonAdditionalInfo.tsx:54-62`) and as live search filter facets (`SearchTemplate.tsx:230-237`).

The new `migration-fabricated-data-gate.py` blocks the NEXT one. **It cannot un-write the rows already there.**

**Why this one is different:** these are accessibility and identity claims. A wheelchair user filtering for step-free access gets a coin flip. That is real-world harm and plausibly Swiss legal exposure, not a taste violation.

**My recommendation: (a) now, (b) next.**
- **(a) Null the 9 columns and hide the badges + facets today.** Cheap, immediate, honest. You lose the varied-facet UX the migration was chasing, which was never real anyway.
- **(b) Then add the amenity fields to salon onboarding and backfill from real answers.** The correct long-term fix; costs an onboarding form section.
- (c) Restrict the flags to `is_test = true` salons only. Pick this instead of (a) only if the seeding was always meant to be demo-only.

**Why (a) before (b):** every day the rows stay, a real user can act on a false accessibility claim. (b) takes a form; (a) takes an UPDATE. Do not wait for (b) to fix (a).

---

</details>

## Q2. Should the CHF AI budget ever hard-block an admin?

**The fact.** `lib/nail/ai-budget.ts:72-74` reads `if (status.blocked && !isAdmin)`. Its only caller (`app/api/admin/nail/generate/route.ts:49`) passes `checkBudget(true)` hardcoded, and the route is already admin-gated. So `!isAdmin` is always false and **the CHF 50/month block is dead code.** Spend tracking works; the gate does not. `getAiDailyLimiter()` (100/day, count-based) still backstops the route, so this is "the CHF cap does not work," not "no cap."

**My recommendation: make it a real ceiling (remove the `isAdmin` bypass).** A budget that exempts the only person who can trigger it is not a budget, it is a logger. If you want an override, make it explicit and loud (an env var or a per-call flag), not an implicit always-true parameter. Cost: a one-line condition change.

**But this is genuinely yours:** if the intent was always "track admin spend, never block the founder mid-work," then the fix is to rename the function and delete the dead branch so nobody mistakes it for a control. Either answer is defensible; the current state is the only one that is not, because it *looks* wired.

---

## Q3. Two money conventions in the database

**The fact.** ~25 integer (Rappen) columns and ~36 `numeric(x,2)` (decimal CHF) columns coexist, **including both on the same `bookings` row** (`price_paid='120.00'` alongside `paid_amount=12000`). Live-verified: they agree exactly on every sampled row. Nothing has drifted.

**My recommendation: document, do NOT migrate.** A migration would touch ~24 tables including live `bookings` (957 rows) and every read site assuming decimal CHF. There is **no incident** to justify touching money on live tables: the evidence says both conventions are internally consistent today. Mark every column's unit in `_rules/DB_SCHEMA.md` instead. Cost: documentation only.

**The risk you are accepting:** a future feature that sums a `numeric` and an `integer` column without adjusting is wrong by exactly 100x, silently. The doc is what prevents that. Revisit the migration only if that bug actually happens.

---

## Q4. MFA for the salon-owner/staff dashboard

**The fact.** MFA does not exist anywhere (AUTHN-09, GAP). Supabase ships TOTP free. The dashboard tier sits next to Stripe Connect payouts.

**My recommendation: yes, but not this week.** It is the highest-leverage missing auth control and it is free, but it is a real product decision (it adds friction to owner login and a support burden when someone loses their phone). Rank it after Q1 and the express-rebook fix. Cost: a Supabase MFA enrolment flow + a recovery path + a support story.

---

## Q5. Password policy conflicts with NIST

**The fact.** `app/api/auth/signup/route.ts:18-22` enforces composition rules (uppercase/digit) on an 8-char floor. **NIST SP 800-63-4 (July 2025) explicitly rejects composition rules** and recommends length (~10-15 char floor) plus a breach-list check instead.

**My recommendation: change it.** Composition rules make passwords *worse* (they push users toward `Password1!`) and NIST now says so outright. Move to a 12-char floor, drop the character-class requirements, add a breach check. Cost: a schema change + a copy change on the signup form. Low risk, and it is a rare case where the better security is also the better UX.

---

## Q6. The 6 crons that under-report failures

**The fact.** The type now makes `errors: <number>` impossible forever (`lib/cron-run.ts`, tsc clean). But six live crons (`release-payments`, `pre-charge`, `no-show`, `reconcile`, `discovery-ai-backfill`, `process-deletions`) report failures under names the wrapper never reads (`failed`, `declined`, `mismatches`, `results`), and `discovery-ai-backfill/route.ts:74` hardcodes `ok: true` regardless of failure count. So a night where every Stripe charge fails can still log a green run.

**My recommendation: fix all 6 in one scoped pass.** This is mechanical, not a decision, and it is the difference between finding out about a bad night at 08:00 and finding out from a customer. I parked it only because it is a code change to six files rather than an enforcement question, and I did not want to widen a gate on a guess (the reviewer proved the gate for this was inert). Cost: ~6 small edits, each populating `errors: string[]`.

Say go and I will run it through the loop.
