# Orchestrator's own LIVE verification (run against the production Supabase project, read-only)

Project: solen (tocfnsmxmdxkrcmjzzdw), Postgres 17.6, eu-west-2. Only SELECTs were run.

## 1. Live RLS posture, measured 2026-07-26

```sql
select count(*) from pg_tables where schemaname='public';                       -- 150 tables
select count(*) ... where relrowsecurity;                                       -- 150 with RLS ENABLED
select count(*) ... where relforcerowsecurity;                                  --   0 with FORCE RLS
select count(*) from pg_policies where schemaname='public';                     -- 322 policies
-- policies whose USING or WITH CHECK is the literal `true` on a write command:  0
```

RESULT: RLS is enabled on 100 percent of public tables, and there is not a single bare
`USING (true)` / `WITH CHECK (true)` write policy live. The live authorization posture is
materially better than the migration folder suggests.

## 2. CORRECTION to a subagent CRITICAL finding

The authz-rls agent reported a live RLS hole: `005_reviews_trust.sql:29-31` creates
`"Owners can update review replies" ON reviews FOR UPDATE USING (true) WITH CHECK (true)`,
and `009_verified_reviews_rls.sql:30` drops a DIFFERENT name
(`"Salon owners can update reviews"`), so the permissive policy is never dropped.

The migration-file half of that is TRUE, verified by reading both files. The LIVE half is FALSE:

```sql
select policyname, cmd, qual, with_check from pg_policies
where schemaname='public' and tablename='reviews';
```
returns exactly four policies, all correctly scoped:
`reviews_select_public` (SELECT true), `reviews_insert_own` (INSERT, must own the row AND have a
confirmed/completed booking at that salon), `reviews_update_own_48h` (UPDATE, own row, within 48h),
`reviews_delete_merged` (DELETE, admin or own row). The permissive policy does not exist live.

So the finding is DOWNGRADED from critical-live-hole to a real but different principle:

**The migration folder and the live policy set have diverged, and nothing reconciles them.**
A replay of `supabase/migrations` onto a fresh database would recreate policies that were
deliberately removed live. That is the actual missing principle, and it is worth more than the
original claim because it names a class rather than one row.

## 3. Other verified numbers

- `_inventory/_db-snapshot.json` says 146 tables, captured 2026-07-12. Live says 150.
  The snapshot the whole estate treats as DB truth is 4 tables behind, 14 days old.
- `_inventory/_db-columns.json` records column NAMES only, no types. So a claim such as
  "money is stored as integer minor units" cannot be verified from the file the rules point at.
  Verified separately from the migrations: `bookings.paid_amount`, `platform_fee`, `net_amount`
  are `integer` (Rappen, per the inline comment), while `retail_purchases`-era migrations also
  contain `net_amount numeric(10,2)`. Two money representations coexist with no law choosing one.
- FORCE ROW LEVEL SECURITY is on 0 of 150 tables (confirms the low-severity subagent finding).

## 4. Method note

This is the reason the report separates "verified" from "expect". Two of the highest-severity
agent findings in this run were migration-file truths presented as live truths. The estate
already has the rule that DB truth comes from the live snapshot, not migration files, and this
run shows the rule needs a second half: the snapshot itself must be fresh, and policy state
belongs in it.

## 5. The branch graveyard (main-thread finding, verified 2026-07-26)

```
git branch | wc -l                          -> 85 local branches
git branch --no-merged main | wc -l         -> 40 branches never merged
sum of `git rev-list --count main..<branch>` -> 1,686 commits off main
git rev-list --count main                    -> 2,416 commits on main
```

So there are 1,686 commits of work sitting on branches that never reached main, against 2,416
commits that did. Two concrete cases where this has already produced a false record:

- `npm run consistency`, recorded in memory as "SHIPPED 2026-07-24: npm run consistency
  (4 detectors) + 2 live gates". Neither this branch nor `main` has that script. The commit
  that adds it is `3745266140` (2026-07-23), and `git branch --contains` puts it on exactly one
  branch: `claude/quirky-ellis-ef5559`, unmerged, 267 commits ahead of main.
- Aurora V2 dashboard skin, already known to be stranded on `claude/bold-hellman-b31513`
  (32 commits, last touched 2026-06-30), and recorded as such in memory.

The missing principle is not "merge more". It is that **a workstream may not be recorded as DONE
or SHIPPED while its commits are unreachable from `main`**, and that branch count and unmerged
commit count belong in the weekly system health check exactly like orphan hooks do.

Oldest unmerged branch tip: 2026-05-31. Largest: 267 commits.

## 6. Law text that claims an enforcement which does not exist (verified 2026-07-26)

`python3 ~/.claude/hooks/system-health-check.py --report` returns 17 violations, 8 of them
orphaned hook files (present on disk, referenced by no settings file, so they never run):
emphasis-budget-gate.py, flag-instead-of-fix-gate.py, no-decorative-image-gate.py,
no-italic-ui-gate.py, paint-proof-gate.py, peer-list-ink-cta-gate.py, plus two solen test helpers.

Grepping both settings files for each name confirms the wiring:

| gate | in settings.json | in settings.local.json | what the law text says |
|---|---|---|---|
| white-only-web-gate.py | 0 | 1 | CLAUDE.md:51 calls it a GATE (correct). CLAUDE.md:109 says "wire on Write/Edit when settings is writable" (STALE, it is wired). |
| reference-measure-gate.py | 0 | 1 | CLAUDE.md:56 calls it a GATE (correct). |
| no-decorative-image-gate.py | 0 | 0 | CLAUDE.md:67 says "Gate: ~/.claude/hooks/no-decorative-image-gate.py blocks a hardcoded src". REMOVED.md:99 repeats it. NOT WIRED. |
| emphasis-budget-gate.py | 0 | 0 | no law text claims it, but the EMPHASIS BUDGET floor it implements is live law |
| peer-list-ink-cta-gate.py | 0 | 0 | written for two owner-flagged recurrences, never armed |
| no-italic-ui-gate.py | 0 | 0 | same |
| paint-proof-gate.py | 0 | 0 | same |
| flag-instead-of-fix-gate.py | 0 | 0 | same |

The sharp case: the owner rejected decorative hero imagery THREE times (2026-07-25 verbatim is
quoted in both CLAUDE.md and REMOVED.md). The gate written to prevent the fourth rejection is on
disk, is cited in the law as if it were live, and has never run.

The missing principle is a doc-vs-runtime reconciliation: any law sentence that names a hook file
must be checked against the settings files, and a mismatch is a violation on the same footing as
an orphaned hook. Today the health check knows about orphaned hooks but nothing checks the
CLAIMS made about them in prose.

## 7. Personal-data exposure, measured against the LIVE schema (2026-07-26)

```sql
-- columns whose name matches email|phone|first_name|last_name|birth|address|ip_address|allerg|health|note(s)
select count(distinct table_name), count(*) from information_schema.columns
where table_schema='public' and column_name ~* '(...)';         -- 37 tables, 62 columns
select ... from pg_tables where tablename ~* '(consent|cookie|gdpr|privacy|retention|dsar)';  -- 0 tables
select ... where column_name ~* '(deleted_at|anonymized|retention|expires_at|purge)';         -- 12 columns
```

62 personal-data columns across 37 of 150 tables. Zero consent, retention or DSAR tables. Only
12 lifecycle columns exist across the entire schema, so almost nothing expires by construction.
The single privacy-shaped table that does exist is `data_deletion_log`.

HEALTH DATA IS ALREADY BEING STORED. These are sensitive personal data under Swiss nFADP
Art. 5 lit. c ("besonders schützenswerte Personendaten", which names health explicitly) and a
special category under GDPR Art. 9:

- `consultation_notes.allergies`
- `nail_client_preferences.allergies`, `.allergy_notes`, `.allergy_severity`
- `salon_clients.allergies`
- `waxing_sensitivity_log.notes`
- `wellness_journals.notes`, `.aftercare_notes`
- `spa_treatment_outcomes.follow_up_notes`

Consent, as actually implemented (verified by reading
`app/[locale]/_components/primitives/CookieConsent.tsx` and `app/api/me/consent/route.ts`):
analytics consent for a LOGGED-IN user is a boolean on `profiles.analytics_consent`; for an
anonymous visitor it lives only in localStorage. There is no timestamped, versioned consent
RECORD anywhere (what text was shown, which version, when, from where), which is the artifact a
regulator actually asks for, and there is no consent construct at all for the health-category
data above.

Correct framing for the report: the cookie banner exists and works, and analytics consent is
honoured server-side, which is better than most pre-launch products. The gap is the record and
the special-category handling, not the banner.

## 8. What is already RIGHT (checked, so the report is calibrated and not just a complaint list)

A review that finds nothing wrong in a place is a legitimate result. These were checked live and
need no principle:

- **Double booking is prevented in the database, not in application code.** Live constraint:
  `prevent_double_booking EXCLUDE USING gist (staff_member_id WITH =, tstzrange(starts_at, ends_at)
  WITH &&) WHERE (status = ANY (ARRAY['booked','blocked']))` on `availability_slots`. That is the
  textbook-correct answer for a booking product, and it holds under concurrency where an
  application check would not. There is also a `bookings_one_active_per_slot` unique index and
  advisory locks on the credit and voucher redemption paths.
- **RLS is on for 100 percent of public tables (150 of 150) with 322 policies and no bare
  `true` write policy.**
- **Money in the booking path is integer Rappen**, with the unit named in the migration comment.
- **Security headers**: HSTS with preload, X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy and Permissions-Policy are all set in `netlify.toml`. The one missing header is
  Content-Security-Policy.
- **Analytics consent is honoured server-side**, not just in the browser: the banner posts to
  `/api/me/consent`, which writes `profiles.analytics_consent`, and `lib/posthog-server.ts` reads
  that column before capturing.
- **Translation coverage is close to complete**: de 5,687 keys, en 5,676, fr 5,669, it 5,658, so
  the worst gap is 29 keys, not a missing language.

## 9. The design floors measured on the LIVE, SHIPPED pages (not on a mockup), 390x844

Method: `next dev` serving `main`, viewport set to 390x844, then a script over the first viewport
that sums the on-screen area of every img/video/background-image, counts distinct computed
font-size values on elements with direct text, and computes the share of characters at weight
>= 600. Both pages measured this session.

| floor / ceiling (the estate's own law) | required | `/de` home | `/de/basel` city |
|---|---|---|---|
| imagery share of first viewport (FLOORS LAW 2) | ~>= 33% | **4.4%** | **0.0%** |
| distinct font sizes on one screen (NEVER-AGAIN 2) | <= 4, floor 3 | **7** (31,28,18,15,14,13,12) | **5** (25,15,14,13,12) |
| anchor / body size ratio (EMPHASIS BUDGET b) | >= 1.8x | 2.21x PASS | **1.79x** (misses by 0.01) |
| share of text at weight >= 600 (EMPHASIS BUDGET a) | <= 30% | **42.1%** | **35.7%** |
| distinct weights (SENIOR_SCORECARD dim 4) | <= 2 | **4** (400,500,600,700) | **3** (400,600,700) |

Third surface, the salon PDP `/de/salon/atelier-haarwerk`, measured the same way:
imagery **34.7%** PASS, anchor ratio **2.14x** PASS, weight-share **28.2%** PASS,
distinct sizes **5** FAIL (ceiling 4), distinct weights **3** FAIL (ceiling 2), 2 JSON-LD blocks.

That contrast is the finding, not a footnote. The PDP is the surface that got a dedicated design
workstream and it passes three of five measured floors. The two browse surfaces, which did not,
fail four and five respectively. Design quality in this estate tracks attention, not enforcement,
because nothing measures a shipped route.

`/de/basel` is a browse/discovery surface, which the imagery floor names explicitly, and it
contains **zero images of any kind**: 0 `<img>`, 0 `<picture>`, 0 CSS background-image, across a
9,325px page. 75 inline SVG icons and 32 card-like elements, no photography.

Root cause, checked against the live database:
- `salon_photos` has **0 rows** for 28 salons. The gallery table is empty.
- 20 of 28 salons DO have `salons.cover_photo_url` set, so the card COULD render a photo.
- Every one of those covers is a remote **Unsplash stock URL** (`images.unsplash.com/photo-...`),
  and at least two salons share the same photo (Belle Epil and Lisse Studio both point at
  `photo-1570172619644`). `RESTRAINT_TEST.md` says photography must be real, "no stock".
- So the browse page fails the imagery floor even though 71 percent of salons have a usable
  cover URL in the database. That is a wiring gap on top of a content gap.

Also measured live on `/de/basel`: **56 elements** render `text-transform: uppercase`, including
the tracked eyebrow `text-[12px] font-bold uppercase tracking-[0.16em]` ("BASEL") that the
mockup copy rules ban by name, and salon cards render the salon name as ~47px white uppercase
type where the photo should be.

THE PRINCIPLE THIS PRODUCES, and it is the most important one in the whole run: **every measured
design floor in this estate is enforced against MOCKUPS and never against the SHIPPED page.**
`check-geometry.mjs --floors-only` exists, `gate:floors` exists, the mockup gates exist. Nothing
runs the floors against a real route on real data. The floors have therefore been iterated on for
weeks while the two most-visited customer surfaces sit at 4.4 percent and 0 percent imagery.

## 10. The four-language surface, measured on the rendered page

GOOD, verified on `/de/basel`: `rel=canonical` is correct, and the full hreflang set is emitted,
including `x-default`:
```
de -> https://solen.ch/de/basel   en -> .../en/basel
fr -> .../fr/basel                it -> .../it/basel   x-default -> .../de/basel
```
That is the part most 4-language sites get wrong, and it is right here.

BROKEN, verified by loading `/en/basel` and reading the DOM:
- `document.documentElement.lang` is **"de"** on the English page. The body copy is English
  ("Find and book the best salons near you."), the language attribute says German. Same for fr
  and it, because `app/layout.tsx:39` hardcodes `<html lang="de">` and sits ABOVE the `[locale]`
  segment. WCAG 3.1.1 (Level A) fail, and it also mis-signals the page language to search
  engines and translation tools on three of four languages.
- The skip link still reads **"Zum Inhalt springen"** on `/en/basel`. Same root cause: it is
  rendered in the root layout, outside the locale tree, so it never gets translated.

Missing on the city landing pages: no JSON-LD at all, and no `og:image` (the latter partly
because there is no photography, see section 9).

The principle: any element rendered ABOVE the `[locale]` segment must be locale-independent by
construction, and anything locale-dependent that must live there reads the locale from the
request. A grep for hardcoded German strings and `lang="` in `app/layout.tsx` is a one-line CI
check.

## 11. CI and the remote: the biggest single gap found in this run (verified 2026-07-26)

```
git log -1 origin/main            -> 4dd8bc15f  2026-05-21  "Merge pull request #91"
git log -1 main                   -> cb868dc5b  2026-07-26  "Press tier: home, search, inspo ..."
git rev-list --count origin/main..main -> 1603
gh repo view --json defaultBranchRef  -> main
gh api repos/sulo232/solen/contents/.github/workflows -> exactly ONE file: cron-jobs.yml
gh secret list -> CRON_SECRET, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL,
                  SUPABASE_SERVICE_ROLE_KEY   (no STRIPE_SECRET_KEY)
gh run list --limit 5 -> five consecutive "Solen cron jobs" runs, ALL conclusion=failure,
                         5 to 7 seconds each, newest 2026-07-20T21:42:17Z
```

What this means, stated plainly:

1. **The remote `main` is 66 days and 1,603 commits behind the local `main`.** Everything since
   2026-05-21 exists only on this machine.
2. **CI has never run.** Four workflow files exist locally (`quality.yml`, `db-migrate.yml`,
   `invariants.yml`, `inventory-freshness.yml`); the GitHub repo contains only `cron-jobs.yml`.
   `gh run list --workflow=quality.yml` returns HTTP 404, "not found on the default branch".
   So every typecheck, lint, unit, e2e and visual job that the estate believes is protecting it
   has produced exactly zero results, ever.
3. **The one workflow that IS deployed is failing.** The five most recent scheduled runs of
   "Solen cron jobs" all failed, in 5 to 7 seconds, which is the signature of a failure before
   any real work (a missing secret, a bad ref, a syntax error), not a timeout. Nothing alerts on
   this. NOT VERIFIED, and I am saying so rather than guessing: the failure reason itself and
   whether any earlier run succeeded, because `gh run view --log-failed` hit a local TLS
   certificate error in this sandbox on the retry.
4. **`STRIPE_SECRET_KEY` is not among the repo secrets**, and `quality.yml`'s e2e job requires it
   along with three others, so even if that workflow were pushed it would skip its entire body
   and still report green (the workflow's own comment at line 83 says "the job always reports
   SUCCESS").

Pre-launch framing, honestly: none of this has harmed a customer, because there are none. The
cost so far is that every "CI protects this" assumption in the estate is false, and the cost once
live is that the crons which send reminders, settle no-shows and reconcile payments are currently
failing silently.

The principles this produces:
- A workflow file that is not on the remote default branch is not CI. Any doc that claims a CI
  guarantee must name the workflow AND the last green run, and a check must assert the local
  workflow set equals the remote workflow set.
- A CI job that can skip its entire body and still report success is a placebo. Absent secrets
  must fail the job loud after one release cycle.
- Scheduled work needs a heartbeat, not just an error log: assert that each expected cron has a
  successful run within 2x its interval, and alert on the ABSENCE.

## 12. Two promises in the Terms of Service that the code does not keep (verified 2026-07-26)

**Phone verification.** The marketplace-trust agent reported this and I checked it three ways:

- `app/api/auth/verify-phone/check/route.ts:56-63` validates the OTP, deletes it from Redis, and
  returns `{verified:true}`. Its own comment says the write happens later: "They will do that in
  the POST /api/salons handler when they submit the form."
- `app/api/salons/route.ts:696` is that handler, and the write is commented out:
  `// phone_verified: phone_verified || false, // [FIX] Bypassing schema cache error (defaults to false in DB)`
- The live schema is stronger evidence than either: **there is no `phone_verified` column on
  `salons` at all.** `select table_name, column_name from information_schema.columns where
  column_name ~* 'verif'` returns only `last_verified_at`, `verification_token`,
  `verification_token_expires_at`, `verification_warnings` on salons, plus two claim columns on
  `salon_directory`. So the comment's "defaults to false in DB" is itself wrong: there is no
  column to default.

A user completes an SMS verification, sees success, and nothing anywhere records that it happened.

**Strikes and suspensions.** `lib/strikes.ts` inserts into `account_warnings` at three places
(lines 41, 77, 84), tagged in its own comments as implementing ToS 3.3 and 4.4, at 3 and 5 no-shows
in 6 months for a customer and 3 cancellations in 30 days for a salon. Grepping `app/` and `lib/`
for any other use of that table returns **only those three inserts**. Nothing reads it, no job
acts on it, no screen shows it. The table is write-only, so the consequence the Terms promise
cannot fire.

This is the estate's own named number-one failure mode, the silent no-op, sitting in the place it
costs most: a legal representation to users. The principle is not "fix these two". It is that
**every claim the Terms of Service make about verification, enforcement or consequence needs a
test that exercises it end to end, and a Terms clause with no such test is not shippable.**

## 13. SECOND correction to an agent CRITICAL, and the pattern it reveals

The data-money agent reported a live money-adjacent fabrication: `supabase/migrations/
20260530_seed_salon_amenities.sql` sets nine amenity booleans on every active salon from a hash
of the salon id.

The migration is real and I read it in full. It does exactly that:

```sql
update salons set
  wheelchair_accessible = abs(hashtext(id::text || 'wheel'))   % 100 < 45,
  lgbtq_friendly        = abs(hashtext(id::text || 'lgbtq'))   % 100 < 45,
  woman_owned           = abs(hashtext(id::text || 'woman'))   % 100 < 42,
  ...
where is_active;
```

Its own header calls the flags "cosmetic facets" and says functional flags were deliberately not
touched. Wheelchair access is not a cosmetic facet.

BUT the live database says otherwise:

```sql
select count(*) filter (where wheelchair_accessible), ... from salons where is_active;
-- 20 active salons, and 0 true for wheelchair, lgbtq, woman_owned, kid_friendly, pet_friendly
```

So the fabrication is NOT live. It is a landmine in the migration folder: any replay onto a fresh
database (`supabase db reset`, a restore drill, a new environment) would invent wheelchair-access
and identity claims for every active salon.

**This is the second agent CRITICAL in this run that was a migration-folder truth presented as a
live truth** (the first was the reviews RLS policy). Two independent agents, two different topics,
the same error class. That is not two mistakes, it is one missing principle, and it is now the
best-evidenced principle in the whole run:

> The `supabase/migrations` folder is a HISTORY, not a description of the database. Any claim
> about current schema, policy or data state is made against the live database, and the migration
> folder is only evidence about what a REPLAY would produce. Both matter and they are different
> questions: "is this true now" and "would a restore make this true". Every audit states which one
> it answered.

And the corollary, which is the actual danger here: a replay-only landmine is invisible to every
current check, because nothing in this estate ever replays the migration folder onto a clean
database. The restore drill that would catch it has, by the backup-recovery agent's own finding,
never been executed end to end.

## 14. THIRD calibration note: right symptom, wrong mechanism (verified 2026-07-26)

The seo-comms agent's CRITICAL says transactional emails "accept a locale argument and silently
ignore it, always sending German". I checked every builder in `lib/email.ts`:

```
27 exported builders take a locale parameter. 27 of 27 actually use it
(subjects[locale] / bodies[locale]). 0 ignore it.
```

So the stated mechanism is wrong. The SYMPTOM is real, and the cause is one level out, at the
call sites:

```
grep -rn "sendEmail(" app lib | grep -v '^lib/email.ts:'   -> 35 call sites
   of those, passing the literal "de"                       ->  5
   of those, passing a locale variable                      ->  1
```

`app/api/bookings/[id]/cancel/route.ts:367` and `app/api/slots/[id]/route.ts:32` both pass `"de"`
as a literal, and the second also formats the date with `toLocaleDateString("de-CH")`. Every other
call site relies on the builder's default parameter, which is `"de"`. So on a four-language
product, one outbound message in thirty-five can be in the recipient's language.

The corrected principle is about the CALL SITE, not the builder: **a locale-aware function called
without a locale is a defect, not a default. Where a message is addressed to a specific person,
the locale is resolved from that person's stored preference at the call site and passed
explicitly; the default parameter exists only for system-to-operator mail.**

Running tally of this run's calibration: three agent findings had a wrong mechanism or a
wrong liveness claim (reviews RLS, amenity fabrication, email locale), out of 21 criticals and
276 findings. All three were caught by checking the live system rather than the file the agent
cited. The symptom was real in all three cases; only one (amenities) turned out to be a
non-issue today. That is the argument for the report separating what was measured from what was
reported, and it is why the "if you read nothing else" section of the page contains only things
the main thread checked itself.

## 15. The four-language product formats everything as Swiss German (verified 2026-07-26)

```
grep -ro '"de-CH"' app lib components                                   -> 116 literals
grep -roE 'toLocale(Date|Time)?String\(\s*"[a-z]{2}-[A-Z]{2}"'          ->  91 call sites
grep -roE 'Intl\.(NumberFormat|DateTimeFormat)\(\s*"[a-z]{2}-[A-Z]{2}"' ->  10 call sites
ls lib/format*                                                          -> format.ts, format-currency.ts, format-phone.ts
```

The helper layer exists and is bypassed 100-plus times. A French or Italian visitor sees Swiss
German date and number formatting throughout, and the same root cause produces the German-only
transactional email in section 14.

Pairs with the two things that ARE right here, so the picture stays honest: translation coverage
is 99.5 percent (de 5,687 keys, en 5,676, fr 5,669, it 5,658) and hreflang plus canonical plus
x-default are correctly emitted on the city pages. The gap is not translation, it is FORMATTING
and the call sites that never ask which language they are rendering for.
