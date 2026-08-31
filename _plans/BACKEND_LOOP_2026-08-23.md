# Backend loop 2026-08-23: bugs, security, storage, scale, waste

Owner, verbatim: *"As a loop, I want you to analyze, like, every single inch of back end, like,
bugs, security, all of it, like, as a loop, and also fix up those stuff, like, how everything is
stored or like... so, you know, it can scale and everything. And also that if it's, like,
inefficient and stuff, you can fix that and all of it."*

## What already exists, so this EXTENDS rather than repeats

Two full adversarial audits have already run and their code fixes are committed:

- **2026-07-09**, `BACKEND_AUDIT_INDEX.md`: 141 confirmed findings (22 critical), all code fixes
  committed per `BACKEND_FIX_TRACKER.md`, 5 database migrations applied and verified live.
- **2026-07-17**, `BACKEND_REAUDIT_2026-07-17.md`: 36 confirmed findings, 39 of 40 boxes closed.

So the value here is NOT re-running those. It is three things they did not cover:

1. **Five weeks of new code.** `verified:` 332 backend files changed and 11 new API routes added
   since 2026-07-17 (`git log --since=2026-07-17 --diff-filter=A -- 'app/api/**/route.ts'`).
2. **Did the fixes hold?** The 07-17 pass found one 07-09 fix that had not. Regressions are the
   base rate, not the exception.
3. **Storage, scale and waste.** Both prior audits were bug-and-security shaped. He asked this
   time for how things are STORED so it can scale, and for what is INEFFICIENT. That axis is new.

Pre-launch framing binds throughout: impact is what each finding WOULD do once live.

## Atomic boxes

### A. Bugs
- [x] A1. `verified:` commit 69c7e23fd. All eleven read end to end by two lenses; findings R1, R5 and the
      csp-report and account-warnings receiver-with-no-sender notes came from them.
- [x] A2. `verified:` the 332 changed backend files were covered by the money-paths and
      changed-core lenses; findings R2, R3, R6, R7 came from them.
- [x] A3. `verified:` commit 69c7e23fd. All 22 criticals from 2026-07-09 checked; the ones
      reported as gone were re-checked by me against main and are R10, never-merged, not undone.
- [x] A4. `verified:` commit 69c7e23fd, same pass; two reported regressions (R8, R9) did not
      survive being opened and are recorded as false.
- [x] A5. `verified:` every R-numbered finding above carries a file:line I opened myself, and
      R6 and R8 both had their reported MECHANISM corrected by doing so.
- [x] B1. `verified:` the new-routes security lens read all eleven; the four admin routes each
      do getUser plus a profiles.role check that fails closed. No missing-ownership case found in
      the new set.
- [x] B2. `verified:` R1 is the one authorization hole found and it is fixed in this batch.
- [x] B3. `verified:` gap found: /api/reviews/translate calls a paid AI service with no auth and
      no per-user cap, while lib/ratelimit.ts names 'translate' in the list that must carry both.
      Not yet fixed, carried to the next batch.
- [x] B4. `verified:` no secret reachable from the client bundle was found; the new avatar
      route derives its storage path from the session user id rather than from input.
- [x] B5. `verified:` see round 2. 19 tables have RLS on with no policy, and no client-side
      code reads any of them, so they are deliberately service-role-only.
- [x] B6. `verified:` see round 2. Every WARN chased into the function body; all four flagged
      functions check auth.uid() themselves.
- [x] C1. `verified:` money is integer Rappen at every Stripe boundary and CHF numeric in
      salon_payouts, checked by the money lens across bookings, booking-pay-intent,
      create-payment-intent, walkin/pay-intent and retail/purchase. No float found.
- [x] C2. `verified:` all 260 foreign-key columns enumerated from pg_constraint; the seven
      uncovered ones are fixed in commit 2756782ee.
- [x] C3. `verified:` commit 2756782ee, 7 of 260 uncovered before, 0 of 260 after.
- [x] C4. `verified:` see the section below. availability_slots is the answer and nothing
      prunes it.
- [x] C5. **Checked, and clean.** `verified:` enumerated every jsonb and array column on a table
      with more than 50 rows, from pg_attribute. 17 of them. The nine on `discovery_items` are the
      Inspo feed's tags and match lists, and `tags` already has a GIN index
      (`idx_discovery_items_tags_gin`) plus a full-text one, so filtering by tag is indexed rather
      than a scan. `bookings.policy_snapshot` is a deliberate frozen copy of the terms at booking
      time, which is the correct use of jsonb, not a smell. `staff_members.permissions` is read
      one row at a time. Nothing here needs reshaping.
- [x] C6. `verified:` R-batch found the avatar bucket is not purged on account deletion and
      the admin photo takedown removes the row but not the object. Both carried to the next batch.
- [x] C7. `verified:` commit 2756782ee for the per-row auth call, commit 4aac463f7 for the
      three unpinned functions, 3 of 65 before and 0 of 65 after.
- [x] D1. `verified:` 48 sites in 27 files, and the one inside a customer request is capped at
      three by its own .limit(3), so the emails are the cost there, not the queries.
- [x] D2. `verified:` 107 select-star calls in 74 files, from the census already in the repo.
- [x] D3. `verified:` covered by the same loop scan; anything already wrapped in Promise.all
      was excluded as the fixed shape.
- [x] D4. `verified:` 99 duplicated blocks, 4,179 lines, 2.49%, from the census in the repo.
- [x] D5. **Every claim in this loop carries both numbers.** `verified:` commits 2756782ee, 4aac463f7, dd1ac4606, 5f2d05549. Foreign keys uncovered
      7 of 260 to 0 of 260; our own functions with no pinned lookup path 3 of 65 to 0 of 65; the
      snapshot's slot count 9,365 to 62,913 live; user-typed values landing raw in an email 208
      to 32 to (pending) 0. Nothing in this loop is claimed as faster without a before and an
      after, and no wall-clock speed claim is made at all, because with no traffic there is
      nothing to time.

### E. Fix, not just report
- [x] E1. **Four fixed, three carried with a named next step, three are his call.**
      `verified:` commit 5f2d05549 closes R1 to R4. Carried to the next batch with the reason
      named, not as a vague later: R5 (the translation cache serves hidden reviews), R6 (a card
      can be charged twice when the paid-marking write matches no row), R7 (the admin
      payment-mode override and the customer's booking page read different columns, and I have
      not yet proven the charged amount is wrong). Plus the AI translate route with no auth or
      cap, the avatar bucket not purged on account deletion, and the photo takedown that removes
      the row and leaves the file. His three: the slot retention decision, the leaked-password
      toggle, and whether the July fixes stranded on unmerged branches get brought across.
- [x] E2. **Built by a coder, graded by a separate reader, and the reader was not enough.** `verified:` commits 5f2d05549 and 3ce0fb23e; the reader returned FAIL with one item, I counted the remainder myself and
      found five templates raw, not one. It found the one dead template and missed the
      cancellation, reschedule, reminder and welcome emails, which are all live. The lesson is in
      the new check: a sweep is judged by its remainder, never by its diff.
- [x] E3. `verified:` three migrations applied additively via apply_migration and each
      re-queried afterwards; no push, no reset, no drop.
- [x] E4. `verified:` nothing pushed. Commits only.
- [x] F1. **Three rounds, strictly shrinking, and the third was near dry.** `verified:` commits 69c7e23fd and bf4cd4c7d. Round 1
      raw 58, round 2 four new things, round 3 four measurements of which three were already-known
      counts. A fourth round on the same ground would repeat, so the loop stops here rather than
      padding. What continues it is not another sweep of the same code, it is the batch of fixes
      below that is still open.
- [x] F2. `verified:` round 1 raw 58, round 2 raw 4, round 3 raw 4. Strictly decreasing.
- [x] F3. `verified:` the closing message of 2026-08-23, and this file at commit 87dd370d1 is what it summarises.

## Rounds

| round | scope | status |
|---|---|---|
| 1 | New and changed code since 2026-07-17 + regression check on the old criticals | pending |
| 2 | Storage, schema, indexes, growth | pending |
| 3 | Waste and speed, measured | pending |
| 4+ | Until a round is dry | pending |

---

## Round 1 result (2026-08-23)

Six lenses read the new and changed backend code and returned **58 raw findings**. The
adversarial pass that normally kills the weak ones could not run: the weekly limit hit and all
174 skeptics errored. So I verified the top of the list MYSELF, off disk, before writing any of
it down. That turned out to matter.

### Reproduced by me, and REAL

- [x] R1. **`/api/unsubscribe` lets any anonymous caller permanently lock a salon out of claiming
      its own listing.** `verified:` `app/api/unsubscribe/route.ts:39-43` nulls
      `salon_directory.email` for any email posted to it, with only an IP rate limit;
      `app/api/directory/[id]/claim/route.ts:138` then answers "No email address on file for this
      listing" forever. Directory emails are scraped from Google Places, so they are public. 48
      rows.
- [x] R2. **A salon's own name reaches a customer's inbox as raw HTML.** `verified:` `lib/email.ts`
      escapes `vars.address` at :235 and `vars.replyText` at :936 and :970-973, and does NOT
      escape `vars.salon` or `vars.service` in the booking-confirmation bodies at :242, nor
      `vars.salon` in the review-reply bodies. Same file, same function, two treatments.
- [x] R3. **Money can move with no ledger row and nothing notices.** `verified:`
      `app/api/stripe/webhook/route.ts:268` and `:396` both `await admin.from("salon_payouts")
      .upsert({...})` with the result discarded. This exact class already cost this project once
      (the 42P10 constraint mismatch, re-audit item 1).
- [x] R4. **The audit trail can fail silently.** `verified:` `lib/audit.ts:18` awaits the insert
      without reading `{error}`. PostgREST returns an error object rather than throwing, so the
      try/catch around it never fires on a normal rejection.
- [x] R5. **A hidden review is still translatable back into view.** `verified:`
      `app/api/reviews/translate/route.ts:43-51` reads the translation cache with no `is_hidden`
      filter and returns early when every id is cached; the guard sits only on the miss path,
      where its own comment claims it is checked "as well as at the read site".
- [x] R6. **A card can be charged twice.** `verified:` `app/api/cron/pre-charge/route.ts:131-145`.
      When the paid-marking update matches no row, the code logs "charged in Stripe but not marked
      paid, needs reconciliation" and continues. Nothing marks the booking, so the next daily run
      selects it again and charges the same card again. NOTE: the finding as reported said the
      error was discarded. It is not; `updatedRows` is checked. The mechanism is different from
      the one reported, and the outcome is the same.
- [x] R7. **The admin payment-mode override and the customer's own booking page disagree.**
      `verified:` `app/api/bookings/route.ts` selects `payment_mode_enforced`, while
      `app/[locale]/salon/[slug]/booking/page.tsx` selects raw `payment_mode`. Two sources for one
      decision. I have NOT yet proven the charged amount is wrong, only that the two reads differ.

### Reproduced by me, and NOT TRUE

Both were reported as HIGH. Neither survived being opened.

- [x] R8. "payment_intent.payment_failed frees a slot with no compare-and-set." FALSE.
      `verified:` `app/api/stripe/webhook/route.ts:508-516` guards on
      `.in("payment_status", ["pending","none","card_saved"])` and only frees the slot inside
      `if (cancelledRows?.length)`, with a comment naming that exact race as already fixed.
- [x] R9. "The reviews authenticity gate is gone and nothing replaced the per-person cap." FALSE
      on both halves. `verified:` the gate was removed on purpose by
      `20260809120000_reviews_open_rating_no_visit_check.sql`, whose own header quotes the owner
      ("no no real visit check jst normal su bro") and records the fake-rating cost as knowingly
      accepted. And a per-person cap DOES exist, at `app/api/reviews/route.ts:79-88`, which blocks
      one account posting twice for the same salon.

### Why so many "the July fix is gone" reports, and it is not a regression

Several lenses reported 2026-07-17 fixes as missing. They ARE missing, and the reason is not that
someone undid them.

- [x] R10. **The fixes were written and never merged.** `verified:` `lib/ai/gemini.ts` does not
      exist on this branch OR on `main`; `lib/search/embeddings.ts` has no `AbortController` on
      either; `app/api/analytics/platform/route.ts` has no `unstable_cache` on either. The plan
      file recording them as fixed is on main; the code is stranded on unmerged branches. This is
      workstream 67 (40 unmerged branches, none on main) showing up as backend risk.

---

## Round 2 (2026-08-23): how it is stored, read from the live database

Everything below was measured against the live Postgres catalogue with my own queries, not read
off a report. 151 tables, RLS on all of them, biggest is `availability_slots` at 9,365 rows.

### Fixed and verified live

- [x] C3. **Seven foreign keys on money tables had no index. Now zero do.** `verified:` before
      7 of 260 foreign-key columns uncovered, after 0 of 260, both counted by the same
      pg_constraint-to-pg_index query. Migrations
      `20260823120000_backend_loop_fk_indexes_money_tables.sql` and commit 2756782ee. Tables:
      credit_redemptions, package_purchases, voucher_redemptions, salon_of_month_winners. They
      were missed because all four were created AFTER the 2026-06-24 pass that added 142 such
      indexes, so that sweep was complete when it ran.
- [x] C7. **The one remaining policy that asked who you are once per row now asks once per
      query.** `verified:` `salon_portfolio_images_manage_owner`, migration
      `20260823120100_...`, re-read from pg_policy afterwards: still owner-scoped, now wrapped.
      Same story as above, the table postdates the June pass.
- [x] B6. **Security advisor run and every WARN chased to the source.** `verified:` the four
      SECURITY DEFINER functions it flags as callable by anon or by any signed-in user
      (`create_group_booking`, `toggle_discovery_like`, `toggle_discovery_save`,
      `set_customer_persona`) ALL check `auth.uid()` in their own bodies, read from
      pg_get_functiondef. `toggle_discovery_like` and `toggle_discovery_save` take a
      `p_user_id` parameter, which looks like an IDOR until you read them: both raise
      'unauthorized' unless it equals `auth.uid()`. Not findings.
- [x] B5. **19 tables have RLS on and no policy, and that is correct here.** `verified:` no
      client-side code reads any of them; every access is a server route on the admin client.
      A policy-less table is fail-closed, so this is deliberate service-role-only storage, not
      a hole and not a silent no-op.

### Real, not yet fixed

- [x] C7b. **Three functions had no fixed search_path. Now none do.** `verified:` commit
      4aac463f7, migration `20260823120200_...`. All three were SECURITY INVOKER
      (`prosecdef=false`), so this was never the privilege-escalation case the linter warns
      about, only determinism. Scope, because the raw count misleads: 237 of the 302 functions in
      the schema still have no pinned path and none of them are ours, they belong to installed
      extensions. Counting only ours: 3 of 65 before, 0 of 65 after.
- [x] C7c. **"55 stacked permissive policies" is an artefact of the counter, not a finding.** `verified:` commit cd4e854a9; read from pg_policy directly.
      `discovery_items`, which the linter blames for 24 of the 55, has **five** policies, not 24:
      one admin catch-all, one public read of published-and-active rows, and one each for insert,
      update and delete scoped to the owner. That is a clean minimal design. The 24 is 4 commands
      times 6 database roles, all generated by the single `ALL` admin policy legitimately
      overlapping each command-specific one, which is exactly what an admin override is supposed
      to do. Consolidating anything here would remove the admin override, not speed anything up.
- **B7. Leaked-password protection is off.** (his call, PARKED above) A Supabase dashboard toggle, so it is his to
      flip, and it changes sign-up behaviour (it rejects passwords found in known breaches).

### Deliberately NOT reported as findings

- **100 "unused index" notices.** Pre-launch with no traffic, so every index looks unused. That
  number means nothing until there are real requests, and dropping any of them now would be
  acting on an artefact of having no customers.

## Round 3 (2026-08-23): waste, measured

- [x] D2. **107 `select("*")` calls across 74 API files.** `verified:` `npm run select-star:census`.
      Worst single file is `app/api/profile/export/route.ts` with 27, which is the data-export
      route, so selecting everything there is arguably correct. The other 80 are over-fetching.
- [x] D1. **48 places make a database call one row at a time, inside a loop, across 27 files.**
      `verified:` a scan that excludes anything already wrapped in `Promise.all`, since that is
      the fixed shape. Most are crons, where batching matters less. The one in a customer's own
      request is `app/api/bookings/[id]/cancel/route.ts:310`, and I checked it: the loop is
      capped at 3 by `.limit(3)`, so the round trips are bounded. The real cost there is not the
      queries, it is that up to three EMAILS are sent inside the cancel request while the
      customer waits.
- [x] D4. **99 duplicated code blocks, 4,179 lines, 2.49% of the tree.** `verified:`
      `npm run duplication:census`.
- [x] D2b. **1,755 error responses in the old shape** against 19 in the agreed one, and 44
      "created" responses that do not say where the thing was created. `verified:`
      `npm run contracts:census`. The backend law already decided not to mass-migrate these, so
      this is a number to watch, not work to do.

### C4. The one that actually decides whether this scales

- [x] **`availability_slots` grows forever and nothing ever removes a slot.** `verified:` counted
      live, not from the snapshot. **58,999 rows, 76 MB on disk, for 21 salons.** That is 2,809
      slots per salon over a six-month horizon. **17,572 of them (29.8%) are already in the past,
      and 16,711 of those were never booked**, so they can never matter again. The only two
      DELETE statements in the whole codebase (`availability/manage/[slot_id]`, `slots/[id]`) are
      a salon owner removing one slot by hand. `generate-slots` skips CREATING past slots; it
      removes nothing. No retention job exists.
      Straight-line: 3.6 MB per salon and rising. 500 salons on the same pattern is roughly 1.4M
      rows and 1.8 GB; 2,000 salons is 5.6M rows and 7 GB. The backend law's own trigger for
      revisiting primary keys is "a few million rows", so that trigger is reachable.
- [x] **The indexes on that table are bigger than the table.** `verified:` 11 indexes totalling
      about 43 MB against 33 MB of data. Every query path is covered, so this is not an indexing
      gap. Deleting dead rows shrinks both halves.
- **DECISION FOR HIM, and the only one in this whole loop.** (PARKED above) Removing rows is a data
      deletion, which is his call by standing rule, so nothing was deleted. The proposal: a
      nightly job that removes slots that are in the past AND were never booked AND are older
      than 90 days. On today's data that is 795 rows; it matters at scale, not now.
- [x] **The snapshot everything trusts is stale.** `verified:` `_inventory/_db-snapshot.json`
      (captured 2026-08-14) records `availability_slots` at 9,365 rows. The live count is 58,999,
      so it is off by 6x on the biggest table, and it is the file `npm run exists` reads and that
      every audit in this project treats as column truth. The backend law quotes the stale number
      too, in its own primary-key trigger row.


---


## Round 4 (2026-08-26): he asked to merge before it ages, so the branch pile got measured

Owner, verbatim: *"cant we pursue more n rn if u dont commit n merge i feel like its gnna pile up
n go too old yk analyze gimme ur opinion on the nexgt step"*

### The merge, done first because that was the worry

- [x] **This whole loop is on main.** `verified:` merge commit 996ebd830, 46 commits, 262 files.
      The test merge said clean before it ran, `npx tsc --noEmit` exits 0 after it, and
      `npm run check:email-escaping` reports 0 raw values on the merged tree. It resurrects
      nothing from the graveyard: its six net-new product files are two libs, one check script
      and the three migrations.

### His instinct was right, and here is the mechanism, measured

- [x] **Every merge into main makes the remaining branches harder to merge.** `verified:` ran
      `git merge-tree` over all 16 remaining branches before and after. Total clashing files went
      4,880 to 5,022. One merge of 46 commits added 142 new clashes to other people's work. That
      is the pile-up he felt, and it compounds: the longer a branch waits, the more merges land in
      front of it.
- [x] **What is left: 16 branches, 1,632 commits.** `verified:` 3 branches were touched today and
      hold 428 commits, 2 are one to four weeks old and hold 26, and 11 are over a month old and
      hold 1,178. The oldest last moved 2026-05-31.


### THE ROOT CAUSE OF THE PILE, and it was not "nobody remembered to merge"

- [x] **The machine that exists to prevent this has run 1,253 times and merged nothing.**
      `verified:` `~/.claude/checkpoint-merge.log`, skip reasons counted rather than sampled:
      **984** are the old "main is checked out, cannot safely update it from here", **186** are
      "main's worktree has uncommitted changes", 35 are a failing typecheck, 22 are a clash in
      `.claude/launch.json`, 6 in `_plans/ACTIVE.md`, 2 a genuine divergence. The 2026-08-14 pass
      fixed the first reason and the second quietly took over from it.
- [x] **What was blocking it: nine unsaved files, the oldest untouched since 2026-08-17.** `verified:` commit acff03259 lists all nine.
      `verified:` seven gate edits last modified 2026-08-23, the rebuilt mockup index from
      2026-08-24, and one Playwright scratch file from 2026-08-17. The merge refuses while ANY
      change is uncommitted, and `git status --porcelain` counts untracked files, so a single
      stray `.tmp-` file was enough to hold the whole thing shut.
- [x] **Unjammed.** `verified:` commit acff03259 on main saves all nine, `.gitignore` learns
      `.tmp-verify-*` so the next scratch file cannot repeat it, and `git status --porcelain` in
      main's worktree is now empty. The rebuilt mockup index that had been sitting there unsaved
      for two days is a real deliverable of his: 367 mockups across 170 surfaces, replacing a page
      written 2026-06-09 that listed five.
- [x] **Proved it rather than asserting it.** `verified:` commit fa6fb1099 on main, merged
      `claude/hook-permission-error-bc75ea`, the only remaining branch with zero clashing files,
      two commits and five lines in one plan document. It went through clean.
- [x] **The honest limit of the unjamming.** `verified:` `~/.claude/checkpoint-merge.py:1` plus `git rev-list --left-right --count` per branch; the unjam itself is commit `acff03259` and the first branch it let through is `fa6fb1099`. The checkpoint uses `--ff-only`, so it only helps a
      branch that is strictly ahead of main. Every branch here is also BEHIND main (this one by 54
      commits at the time of the merge), so they still need a real merge commit, which the
      checkpoint will not make on its own. Unjamming stops the log filling with skips; it does not
      by itself clear the fifteen that are left.

### The finding that changes what to do about it

- [x] **Most of what looks stranded is stuff he deleted on purpose.** `verified:` the naive count
      says **651** files exist on those branches and not on main. **421** of them are named in
      `_design-system/REMOVED.md`, the graveyard, and another **177** were deleted by main in a
      commit of its own. That leaves **53** genuinely stranded, 8 percent of the scary number.
      (The first draft of this line said 653 and 62; both were arithmetic done by eye rather than
      by the script, and the script prints the totals now so it cannot happen again.)
      On the oldest branch, 83 of its 107 unique files are corpses: `MarketplaceVisual`, `Step`,
      `business/page.tsx`, `fuer-salons` and `SalonServicesSheet` were all deleted by his own
      decisions on 2026-07-19 and 2026-08-14. Merging an old branch wholesale would bring them
      all back. This is the strongest argument for the strategy he already picked on 2026-08-14:
      main is the truth, lift one thing across at a time.


### What is actually worth rescuing: 53 files read, 7 survive

Eleven readers judged all 53 genuinely-stranded files, one branch each, and every BRING verdict
was then handed to a separate adversary told to REFUTE it. 20 were claimed worth bringing, and
**13 of those were knocked down**, which is the number that matters: the second pass killed two
thirds of the first pass's recommendations.

- [x] **The seven that survived, each with the live check that settles it, recorded at commit 9c801c29f.** `verified:` workflow
      wf_60abb1ee-20f, 31 agents, 0 errors, verdicts read from `journal.jsonl` rather than the
      summary.

      1. **`lib/staff-permissions.ts`** (nice-hugle). The EIGHT-AREA staff permission model. **He
         chose this by name on 2026-08-14, answering "Eight separate areas".** Measured live just
         now: `staff_members` has both `access_role` and `permissions`, there are **70 staff rows,
         0 carry a role and 0 carry a permission object**, and nothing on main reads either. His
         own decision is sitting on a branch that never merged. This is the most decision-relevant
         thing in the whole pile.
      2. **`lib/ai/gemini.ts`** (quirky-ellis). One place for the model id plus a 15 second
         ceiling on the AI call, feeding 9 AI-backed customer routes. Found independently by this
         session's own timeout sweep, which is two measurements converging rather than one.
      3. **`lib/auth/request-user.ts`** (airbnb-animated-icons, HANDS-OFF branch). Identifies an
         API caller from either the web cookie or an iOS bearer token. Without it a logged-in iOS
         customer is written as a guest on a booking: no user id, no ban check, wrong rate-limit
         key. NOTE: he said "leave all commit n eveth from ths branch" on 2026-08-14, so this one
         is not touched, only reported.
      4. **`lib/service-category-resolve.ts`** (clever-mirzakhani). Turns a saved favourite
         category into the salons that actually offer it. Main's recommendations route reads
         `favorite_service_slugs` only to decide whether to take the personalised path, then
         filters on quartier alone. Someone who saves categories and no district gets generic
         popularity and is told it is personalised.
      5. **`app/[locale]/_components/salon/SalonRecentlyViewed.tsx`** (pdp-styling). Main's own
         `TASTE_LOG.md` row B14 records this as approved on 2026-08-15 and cites commit 21a9655ff,
         which exists on that branch only. The decision is written down as settled and the code
         never landed.
      6. **`20260817120000_add_bookings_to_realtime_publication.sql`** (offline-booking-device).
         **The reader flagged a contradiction rather than smoothing it, and the reader was right
         to.** Its own comment claims it was already applied. Settled with a live query, control
         row included: `bookings` IS already published for realtime, so the claim that the live
         activity feed never fires is FALSE. What is genuinely missing is `REPLICA IDENTITY FULL`
         (live value is `d`), which only affects what an update or cancel event carries, not
         whether the feed fires. Impact reduced from "staff-facing gap" to "update events arrive
         with only the primary key".
      7. **`scripts/app-parity.mjs`** (airbnb-animated-icons, HANDS-OFF). Dev tooling that diffs
         web routes against the iOS app. No runtime impact. Reported, not touched.

- [x] **The thirteen that did not survive**, `verified:` same journal, commit 9c801c29f. In one line: they were real files with real absences
      and no real consequence.** `verified:` same journal. `lib/api-error.ts`, `lib/posthog-lazy.ts`,
      `lib/supabase-browser-lazy.ts`, `lib/coachmark-seen.ts`, `Coachmark.tsx`, `NextStepsStack.tsx`,
      `RotaPlanner.tsx`, `CalendarColorTab.tsx`, `[city]/loading.tsx`, `stuck-rows.mjs`,
      `seed-guest-names.mjs`, `seed-review-text.mjs`, `pair-measure.py`. The commonest refutation
      was not "main already has it" but "bringing the file across does nothing without a caller
      that would have to be written fresh against a route that has since drifted".

### Two stale claims in the older plan, corrected against the live database

- [x] **The four "genuinely missing" migrations from 2026-08-14 are all live now.** `verified:`
      queried each object with a known-answer control in the same result set. `bookings.consumed_at`,
      `csp_violation_reports`, the hashed walk-in token and both payment-mode columns all exist.
      The 08-14 audit read a snapshot captured 2026-07-12, which is why it said otherwise.
- [x] **The one-click email link replay hole is closed on main.** `verified:`
      `app/api/bookings/[id]/quick-action/route.ts:75` check-and-sets `consumed_at` in the same
      update. The plan's claim that the shipped route "contains no single-use check of any kind"
      was true when written and is not true now.

### Of the three July fixes he was told were stranded, two are already on main

- [x] **The analytics one landed.** `verified:` `app/api/analytics/platform/route.ts:11` sets
      `revalidate = 86400`, with a comment explaining why the admin client is what makes ISR work.
- [x] **The AI-timeout file does not exist on main at all.** `verified:` `lib/ai/` holds
      recommendations, translate and untrusted, and no gemini. Eight files on main call Google's
      API without it.
- [x] **FIXED, `717cae6cb`. All 17 now carry a ceiling, and a remainder sweep found 2 more.**
      `verified:` guarded outbound calls went 8 to 25, `npx tsc --noEmit` clean, and every value
      was copied from a call that already ships here rather than invented: 4000 transit, 8000
      image bytes, 10000 a gateway, 25000 a text generation. The two worst are closed:
      `lib/sms.ts`, which sends booking confirmations, and `lib/search/embeddings.ts`, which every
      cache-missing search goes through. **THE REMAINDER, named rather than skipped:** the builder
      was given a 12-file allowlist and its own leftover scan found 2 genuine unguarded calls
      outside it, `app/[locale]/_components/salon/SalonLocation.tsx:740` (map directions) and
      `app/api/admin/nail/generate/route.ts:138` (an image download, whose sibling call in the
      same file already has one). It refused to widen its own scope, which is correct. A third hit
      was a false positive it diagnosed itself: `SearchTemplate.tsx:1079` builds a relative url to
      our own API. See the box below.
- [x] **Original measurement, kept for the record.** `verified:` `lib/search/embeddings.ts:23` calls Google with a bare `fetch(` and
      no ceiling. Swept the whole estate for the same shape: **17 outbound calls to another
      company's server have no time limit, against 12 that do.** The detector was checked against
      the 12 guarded ones so it can tell them apart. The worst once live are `lib/sms.ts:55`,
      which sends booking confirmations, and `lib/search/embeddings.ts:23`, which every search
      that misses cache goes through. A slow upstream, not a dead one, holds a connection open
      and eventually starves pages that never touch that API.

### Four delete paths that keep the file after removing the row

- [x] **FIXED in two rounds, `5d8a5f045`. Round 1 closed the leak and opened a worse one; round 2
      closed both, graded by three reviewers who did not write it.** `verified:` round 1 checked
      which bucket a url pointed at and never who owned it, so a person could paste a stranger's
      photo address into their own profile and have our own cleanup delete that stranger's file.
      All three reviewers returned FAIL. Round 2 made the owner a REQUIRED argument with no
      default, taken from the row being deleted and never parsed out of the url, so a call site
      cannot compile without it. Two reviewers replayed both attacks and both now fail at
      `lib/storage.ts` before any removal runs. The two call sites that made the attack reachable
      were deleted outright rather than patched, because nothing writes those columns: no upload
      route fills them and 0 of 70 staff rows point at our storage. A fifth site was found and
      fixed, `app/api/services/[id]/route.ts`, where deleting a service left up to twenty photos
      behind in a public bucket. `npx tsc --noEmit` clean.
      **THE REMAINDER, and it is a real one.** The third reviewer returned FAIL for a sixth site:
      `app/api/admin/test-salon/route.ts` deletes a whole test salon, and the database cascade
      wipes eleven more tables that carry file columns, with no cleanup on any of them. Measured
      against the live database rather than the migration files: **every one of those columns
      holds zero of our own files today.** All 174 gallery rows, all 264 service rows and all 70
      staff rows point at Unsplash seed photos, and 11 of our 15 buckets are empty. So the sixth
      site cannot orphan anything at present, and it will the moment a real salon uploads a real
      photo. Left open deliberately rather than silently: see the box below.
- [x] **Original measurement, kept for the record.** `verified:` swept
      every table delete in `app/` and `lib/`: 64 of them, 8 sit next to a file column, 3 remove
      the object and **5 do not**. Two of the five are false positives (`notifications` and
      `discovery_search_events` have no file column in the live schema). The four real ones:
      `app/api/admin/reports/[id]/route.ts:99` deletes a REPORTED photo's row and prunes it from
      the gallery list but leaves the object in the public bucket at the exact URL the report
      named; the GDPR erasure job purges two buckets by name and not `avatars`, so an erased
      person keeps their face in a public bucket; `app/api/staff/[id]/route.ts:87`; and
      `app/api/nail-inspo/images/route.ts:90`.


### The orphan-file fix, round 1: three lenses, three FAILs, and the reviewers were right

- [x] **Round 1 fixed the leak and opened a worse hole**, `verified:` commit dcd4159a5 records it, workflow wf_f64b13a4-62b is the run. Recorded here rather than quietly
      re-rolled, because it is the clearest case this session of why the writer is never the
      grader.** `verified:` workflow wf_f64b13a4-62b, 1 builder and 3 reviewers, 10 findings, 4 of
      them HIGH. The builder did good work: it extended `lib/storage.ts` rather than adding a
      second helper, matched the existing `purge-*-storage.ts` sibling pattern, got the ordering
      right (read the url before deleting the row), and named its own uncertainty about two
      buckets instead of papering over it.

      What it got wrong is one dropped half of one guard. The reference it copied,
      `app/api/salons/[slug]/gallery/route.ts` around :282, checks TWO things: that the path is in
      the right bucket, and that its first segment is the caller's own folder. The generalised
      helper kept the first and dropped the second. Two reviewers independently walked the same
      consequence, and I re-checked every link myself rather than taking it on trust:

      - `GET /api/reviews/salon/[salon_id]` is explicitly PUBLIC and its select list at :44
        returns `profiles(display_name, avatar_url)`. Anyone can read anyone's avatar url.
      - `updateProfileSchema.avatar_url` is `z.string().url()` with no origin restriction
        (`lib/validations.ts:163`), written through by `PATCH /api/profile`.
      - So a normal customer could point their own avatar at someone else's file, request their
        own account deletion, and the erasure job would delete the other person's photo.
      - A second, higher-privilege version of the same thing runs through
        `staffUpdateSchema.avatar_url` (`lib/validations.ts:1444`) and `DELETE /api/staff/[id]`.

      Before the fix, neither was possible, because that route never touched storage at all. A
      cleanup miss had been turned into a weapon. Round 2 is scoping every removal to its owner,
      dropping the two sites whose columns no upload flow ever writes, and adding a fifth site the
      remainder lens found.

- [x] **The remainder lens found a fifth site the sweep missed, and it is the most ordinary one.**
      `verified:` `app/api/services/[id]/route.ts:133` deletes a service and never reads
      `photo_urls`. `app/api/services/[id]/photos/route.ts:71` uploads up to 20 photos per service
      into the PUBLIC `service-photos` bucket. A salon owner deleting a service is routine, unlike
      the other four (an admin takedown, an erasure job, a staff removal, a nail board), so this is
      the one that would actually accumulate. Confirmed by reading both files myself.

- [x] **How much is leaking TODAY: nothing.** `verified:` queried the live rows rather than
      assuming. Every seed photo is an Unsplash link: 174 of 174 portfolio images and all 22
      salons' gallery urls point off our storage, 0 of 70 staff rows point at it,
      `nail_inspo_images` has 0 rows. Exactly **one** profile avatar sits in our own bucket. So
      these fixes are correct code with zero present effect, and they matter only once salons
      upload real photos. Saying otherwise would be inventing an emergency.

### Round 5: switches that exist and are obeyed by nothing

Same class as the permission crash below, asked of every other switch a person can set.
Measured over 27 owner-settable switches across profiles, salons, services, staff and bookings.
The detector was checked against two switches known to be live (`walkin_enabled`, `permissions`)
before any result was believed, and a hit only counts when something BRANCHES on the value, never
when a query merely carries it along.

**23 of 27 are genuinely obeyed.** The four that are not, each with the reason, because a dead
thing with no reason gets restored by mistake later:

- [x] **`bookings.price_increase_approved` , SUPERSEDED, leave it.** `verified:` retired by commit `14d180635`, replacement live at `app/[locale]/bookings/[id]/upcharge/page.tsx:2`. The commit that
      deleted its code is on main and says so by name: "retire legacy System B + upcharge ledger".
      The replacement shipped and is customer-facing: `app/[locale]/bookings/[id]/upcharge/` is a
      whole approve-or-decline screen. Nothing is broken. The column is a leftover of a deliberate
      swap, and dropping it is a tidy-up, not a fix.
- [x] **`services.station_required` , DORMANT, part of a feature that is switched off.**
      `verified:` introduced by `supabase/migrations/072_nail_foundation.sql`, and the nail
      feature set is gated off. It appears in exactly one place in the code, a column list, and
      nothing reads it. Correct while nail stays off.
- [x] **`salons.is_featured` , NEVER LANDED.** `verified:` its only site in the repo is a column list, `lib/salon-detail.ts:67`; zero code branches on it on any branch.
      The only commits touching it are performance passes trimming column lists. So an admin
      marking a salon as featured today changes nothing anywhere. Not in the graveyard, so it was
      never rejected, it was simply never built. It is a one-line filter if he ever wants it.
- [x] **`staff_members.is_publicly_listed` , NEVER LANDED.** `verified:` its ONLY appearance anywhere is the generated type at `lib/database.types.ts:7617`. Zero mentions in code
      outside the generated type file. It arrived in a bulk migration backfill. A stylist cannot
      be hidden from a salon page by this switch, because nothing reads it.

None of the four is in `_design-system/REMOVED.md`, so none was killed on purpose, and none should
be re-proposed as new work without saying which of these four reasons applies.

### Round 5: a staff permission that crashes rather than refuses

- [x] **FIXED, `91624012f`. It discriminates now instead of crashing.** `verified:` the check
      understands both shapes, and the proof is the refuse case, not the allow case: an explicit
      `can_edit_schedule: false` returns 403, `{}` and null and both legacy array forms allow, and
      nothing throws. Absent means allowed on purpose, matching the dashboard's own
      `?? true` at `app/[locale]/dashboard/staff/page.tsx:77`, because refusing would silently
      remove a permission the owner's screen says the staff member already has.
      **NOT DONE, and the reason is a gate, not an oversight:** the stale line in
      `_design-system/ONBOARDING_SPEC.md:253` still says this permission always returns 403. The
      canon gate refuses an edit to that file and offers only two ways round, moving the file or
      editing the gate's own allowlist. Both are structural changes nobody asked for, so the
      builder stopped, which was right. The correct facts live here instead. HIS CALL if he wants
      that file corrected: allow it into the gate's list, or archive it.
- [x] **Original measurement, kept for the record.**
      `verified:` `app/api/staff/my-schedule/route.ts` reads `permissions` as a string array and
      calls `.includes()` on it. The dashboard at `app/[locale]/dashboard/staff/page.tsx` SAVES an
      object, and `lib/validations.ts` only accepts an object, so the array shape can never occur.
      All 70 staff rows hold `{}`. Ran the real line against five shapes with a control that
      passed: a string array allows, `{}` throws `perms.includes is not a function`.
      `_design-system/ONBOARDING_SPEC.md` already flagged this and called it a permanent 403,
      which is wrong in the detail; it is a crash. Also true and worth his attention: two of the
      three toggles that dashboard shows (`can_view_own_bookings`, `can_manage_portfolio`) are
      read by nothing at all, so they are decoration, and the eight-area model he chose on
      2026-08-14 is not built.

### 2026-08-31, the last mile of staff logins, and it is broken today

**INVITING SOMEONE THROWS AWAY THE ACCESS YOU GAVE THEM. Found while closing the loop on the
eight areas, and it is the difference between the feature working and being decoration.**

The chain, every link checked against the live database and the live code:

1. `staff_invites` has BOTH an `access_role` (text) and a `permissions` (jsonb) column. Verified
   against the live schema, not a migration file.
2. **Nothing ever writes them.** `app/api/staff/invite/route.ts:71-79` inserts exactly
   `salon_id`, `email`, `staff_name`, `token`, `expires_at`, `status`. And it could not write
   them anyway: `staffInviteSchema` at `lib/validations.ts:403-406` accepts only `email` and
   `staff_name`, so a client sending access would be rejected.
3. **Nothing ever reads them.** A grep for `invite.permissions` and `invite.access_role` across
   `app` and `lib` returns ZERO. The control on that same grep, `invite.salon_id`, returns 6, so
   the search works and the zero is real.
4. So `app/api/staff/accept-invite/route.ts:94-104` creates the staff row with only
   `salon_id`, `name`, `user_id`, `is_active`. `permissions` falls to its column default `'{}'`.
5. Under `requireSalonAccess`, `{}` means access to NOTHING. So an owner picks what a new
   teammate may see, sends the invite, and the teammate arrives able to open nothing.

**WHY IT IS MISSING, per the missing-needs-a-reason law: HALF-LANDED.** The columns shipped and
the code that fills them never did. Not killed (nothing in REMOVED.md), not superseded (nothing
else carries access through an invite), not blocked. The dangerous kind: the product looks
finished because the columns exist and the invite screen sends.

**TODAY IT HARMS NOBODY, and that is measured, not assumed.** All 70 `staff_members` rows have
`user_id` null, `permissions` `{}` and `access_role` null. Not one staff member can log in at
all, so nothing has been locked out. It becomes real the day the first invite is accepted.

**A CONSEQUENCE FOR THE 57 HAND-ROLLED OWNER CHECKS, which changes the risk I named last night.**
I said converting them would loosen access and so needed his approval first. With zero staff
logins in existence, converting them today changes what exactly nobody can do. The approval is
still worth having for the SCREEN, but the routes are far safer than I described.

- [ ] **FIX THE INVITE PATH so the access an owner picks survives the invite.** Three edits, all
      small: widen `staffInviteSchema` to accept `access_role` and `permissions`, write them on
      the insert, and copy them onto the staff row in accept-invite (both the create branch and
      the link-an-existing-row branch, which today only sets `user_id`). Queued behind the modal
      build because both touch `lib/validations.ts` and the same page.

### 2026-08-31, search speed: measured before touching anything

**THE NUMBER HE FEELS: a text search takes 518ms, and 390ms of that is one call to Google's
embedding service that is repeated in full every single time, even for text searched a second
ago.** Everything else on the search path is already fast.

Measured live against the running dev server, medians of 5 runs each, plus one EXPLAIN ANALYZE
on the live database. The 1-character row is the control that isolates the cost: the semantic
block is gated on `q.length >= 2`, so a 1-character query skips it entirely and shows what the
rest of the route costs on its own.

| what was asked for | median |
|---|---|
| `q=h` , 1 char, semantic block SKIPPED (the control) | **102ms** |
| `q=ha` , 2 chars, embedding + ranking run | **518ms** |
| `q=haar` repeated 5 times identically | **532ms** |
| `q=` novel text every time | **394ms** |
| `search_salons_ranked('haar', 60, null)` on the database itself | **26ms** |
| filter by category (`coiffeur`, `nails`) | 81 to 106ms |
| filter by city | 258ms |
| sort by distance | 284ms |
| open now | 182ms |
| geocode a street name | 30ms |

Reading it: 518 minus 102 is about 420ms for the semantic block, and the database is only 26ms
of that, so **roughly 390ms is the Gemini round trip**. The repeated-query row is the proof that
nothing caches: searching the identical word five times costs the same every time. The comment
already sitting at `lib/search/embeddings.ts:33` says "every search which misses cache goes
through this call", and that cache was never built, which is the decoration shape this project
bans by name: a comment naming a thing that does not exist.

**A STALE CLAIM IN THIS PLAN, CORRECTED.** An earlier line here called this "the one Google call
every cache-missing search makes". Two errors in one phrase. The geocode call is MAPBOX, not
Google (`app/api/search/geocode/route.ts`), and it is not on this path at all: it is a separate
30ms cached endpoint. The Google call is the Gemini EMBEDDING at `lib/search/embeddings.ts:23`,
and there is no cache in front of it to miss.

**THE THIRD BOUNDING IDIOM, found here and worth recording**, because two of my own greps missed
it: `app/api/salons/route.ts:138-141` bounds the embedding with a `Promise.race` against a 500ms
timer, not with `AbortSignal.timeout` and not with an `AbortController`. So this codebase has
THREE ways of bounding an outbound call, and any sweep that looks for fewer than three will
report a false positive. The live sweep running now was told about all three.

- [x] **Fork 3, Plan A executed end to end. AFTER: a repeated search is 532ms -> 170ms, 3.1x.**
      `verified:` commit `a0a25af72`, measured live on the running server, medians of 7 runs,
      with TWO controls in the same measurement so the number cannot be a coincidence:
      | | before | after |
      |---|---|---|
      | the same word searched again | 532ms | **170ms** |
      | a brand new word every time (control) | 394ms | 550ms, still slow, as it must be |
      | 1 char, semantic block skipped (the floor) | 102ms | 146ms |
      The floor is the reading that matters: a repeat now costs about 24ms more than doing no
      semantic work at all, where it used to cost 430ms more. The novel-word control staying
      slow is what proves this is a cache and not a generally faster server.
      Design notes on the cache itself, all deliberate: query text only, not the backfill texts
      (each seen once, so a cache there is pure memory); keyed on the trimmed lowercase text so
      Haar and haar share an entry; capped at 500 with oldest-out eviction because the key is
      attacker-controlled text and an uncapped Map is a memory leak anyone can drive; failures
      never cached, so one bad minute upstream cannot poison a word for six hours.

### 2026-08-31, what he chose and both arms of every fork, decided while he is here

He was asked what this session is for and picked THREE, not one: apply both mockups, hunt for
real hangs, make search and booking faster. Asked separately which filter button he wants, he
answered "mockup", so the pill is SHOWN and not applied. Both links served and confirmed
loading through the tunnel before this was written.

**A CORRECTION HE ACTED ON, stated because it changed what he was choosing between.** Last
night he was told three outbound calls could hang forever. All three are bounded and always
were. `app/api/auth/verify-phone/send/route.ts:74` and `app/api/admin/nail/generate/route.ts:116`
carry `AbortSignal.timeout`, and `lib/email.ts:136-163` uses the other legal idiom, an
`AbortController` with a 5000ms `RESEND_TIMEOUT_MS` and a `clearTimeout` at :175. The cause was
the instrument, twice: a 14-line window when the real timeouts sat 14 and 15 lines below the
call, then a grep for one idiom when this codebase uses two. Per the second-theory stop rule,
the measurement itself is now the thing being rebuilt, as a four-angle sweep with three
refuters per finding, rather than another grep by hand.

- FORK 1, the eight areas on the staff screen.
  PLAN A: he approves the mockup, wire the eight areas into the modal, keep the three legacy
  keys accepted so nothing already saved breaks, then convert routes area by area.
  PLAN B, if he rejects the look: keep the model and the gate exactly as they are on main, and
  re-mock only the screen. Nothing behind it needs to change for a look change.

- FORK 2, the hang sweep.
  PLAN A: findings survive their refuters, fix each one with the house idiom, smallest bound
  that cannot break a legitimately slow call.
  PLAN B, if the sweep returns nothing: that is a real answer, not a failure. Say so plainly,
  publish how each angle searched so the emptiness is checkable, and move the session's weight
  onto fork 3 rather than manufacturing findings.

- FORK 3, search and booking speed.
  PLAN A: measure the customer path end to end first, one number before and one after, and cut
  the biggest single cost.
  PLAN B, if the measurement shows the path is already fast: do not optimise anyway. Report the
  number, name what IS slow instead, and spend the time there.

- FORK 4, the filter pill.
  PLAN A: he picks C, apply it to all eight dashboard screens through one shared component
  rather than eight edits, per the compose-do-not-redraw floor.
  PLAN B, if he picks B or keeps the blue: record the dated decision in TASTE_LOG and leave the
  contrast note attached to it, because the readable floor is statutory and does not disappear
  because a look call went the other way.

### The remainder of this session, tracked rather than narrated

- [x] **THE MODEL AND THE GATE ARE BUILT AND ON MAIN. The SCREEN is waiting on him.**
      `verified:` `bc4f85484` brought `lib/staff-permissions.ts` across and added
      `requireSalonAccess` to `lib/auth/require.ts`; `b0302a345` is on main and `npx tsc --noEmit`
      exits 0 on that exact tree. The validator now discriminates, proven through the LIVE
      `PATCH /api/staff/[id]` route with the dev owner session: `{calendar:true}` 200,
      `{can_edit_schedule:false}` 200, `{nonsense:true}` 400 Unrecognized key,
      `{calendar:true, zzz:1}` 400. The two 200s are the known-answer control, so the 400s are
      the validator refusing junk rather than refusing everything; Emma's row was restored to
      `{}` afterwards. Original box text kept below.

- [ ] PARKED 2026-08-30 · Do you want the staff modal switched from today's three switches to the eight areas, exactly as the mockup shows it? · from: the eight-area build, the model and the gate are on main and only the screen is left
- [x] **The mockup for it is built and served.**
      `public/_mockups/staff-access-eight-areas.html`, today's three switches stacked above the
      eight areas he chose on 2026-08-14, at the real 437px modal width. Grounded in
      `app/[locale]/dashboard/staff/page.tsx:244-261` and measured live this session: section
      label 12px/500/#6B6B6B, rows 14px checkbox + 8px gap + 14px text at a 28px pitch. Mockup
      first is law, so the real screen is untouched until he says go.

- [x] **DECIDED, not left undone: the 57 places that ask "is this the owner" one by one stay
      as they are until the screen above is approved, and until then the new gate is called by
      nothing.**
      `verified:` `/usr/bin/grep -rn --include='*.ts' 'owner_id !== ' app lib` counts **57
      sites across 47 files** today, re-counted this session. An earlier note in this plan said
      42; that number predates the 293-commit merge from main and is corrected here rather than
      left standing. And `requireSalonAccess` appears in exactly **one** place, its own
      definition at `lib/auth/require.ts:165`, so **zero routes call it yet**. It is a
      foundation, not a live gate, and saying otherwise would be the silent-no-op shape this
      project bans by name.
      Converting them to `requireSalonAccess` would LOOSEN access, because each one today
      refuses everyone but the owner and the new gate lets granted staff through. That is the
      point of the feature, but it is a behaviour change on 42 routes and it belongs in the
      same approval as the screen, not ahead of it. Nothing regressed in the meantime: every
      one of those 57 checks still refuses everyone but the owner, exactly as before.

- [ ] PARKED 2026-08-30 · The chosen filter button on eight dashboard screens is blue, which you ruled out twice. Do you want option C from the mockup, a white chosen pill on the gray page at 44px? · from: measuring the staff screen, the blue also fails the readable floor at 4.02 against 4.5
- [x] **Mockup built and served: `public/_mockups/dashboard-filter-pill-gray.html`, three
      options at the real 437px width, A today's blue, B the locked recipe applied literally,
      C my pick. B is included ON PURPOSE because the locked recipe does not survive contact
      with this screen: it says selected = `bg-s-bg-sunken` #F4F4F5 over a WHITE unselected,
      and the dashboard page is itself #F4F4F5 (`bg-s-bg-sunken`, measured on the live wrapper),
      so the chosen pill vanishes into the page. That is a collision between a locked literal
      and the surface it is applied to, surfaced rather than silently resolved either way.
      C keeps the intent (calm, no blue, selected reads by fill) by inverting it: white fill +
      hairline + ink text on the gray page. Also measured on the same pass and fixed in C: the
      pill is 38px tall where the accessibility floor is 44.**
- [x] **The original finding, kept for the record.**
      `verified:` measured live on `/en/dashboard/staff`, the selected "All" pill computes to
      `rgba(39,110,241,0.1)` fill with `rgb(39,110,241)` text at 13px. The design contract
      (filter pill row, his call 2026-06-29, reconfirmed 2026-07-01) says selected =
      `bg-s-bg-sunken` #F4F4F5 + `text-s-ink` + semibold, no blue. 14 selected-state sites
      across 8 dashboard screens carry it (clients, bookings, barber-ops, marketing, staff,
      services x3, analytics x2, settings x4). Five other blue sites are the NAMED legal
      exception (booking calendar date and slot fills, `DateTimePicker`) and must not move.
      It is also a contrast failure: blue #276EF1 on a 10% blue tint over white computes to
      **4.02:1**, and AA needs 4.5:1 for 13px text. Control on the same maths: the same blue on
      pure white gives 4.58:1, which matches the figure already recorded in CLAUDE.md, so the
      calculation is calibrated rather than invented.

- [x] **ORIGINAL BOX, kept because its reasoning is still the spec for the build.** `verified:` `git ls-tree -r claude/nice-hugle-c0b706` lists
      `lib/staff-permissions.ts`, 80 lines, and its eight keys are calendar, schedule, clients,
      catalog, marketing, finance, team, settings, with four preset roles over them. It already
      uses `Partial<Record<PermissionKey, boolean>>`, an OBJECT, which is exactly the shape the
      dashboard already saves and the validator already accepts, so it slots in rather than
      needing a data migration. `staff_members` already has both `permissions` and `access_role`.
      Today's fix at `91624012f` stopped the crash but left the dashboard showing three switches
      of which two (`can_view_own_bookings`, `can_manage_portfolio`) are read by no code anywhere.
      **A CORRECTION TO MY OWN CHECK, because it changed the recommendation.** Earlier this turn I
      ran a loop over every branch and reported that this file exists on none of them. That was my
      test being broken, not the truth: `git ls-tree` finds it on `nice-hugle` immediately. The
      plan line that said so was right and I contradicted it from a bad measurement.
      PLAN A: lift the file across, wire the eight areas into the dashboard modal and into every
      route that should gate on them, keeping the array fallback that already ships.
      PLAN B, if he does not want staff logins next: the search and booking speed pass, since the
      one Google call every cache-missing search makes is now the only third-party call on the
      customer path and it is measurable end to end.

- [ ] PARKED 2026-08-26 · A spec file still says this staff permission always refuses, when it actually crashed. Do you want that file allowed past the check that guards it, or moved to the archive so it can be corrected? · from: the permission fix, the builder correctly refused to move a file or edit a check's own list just to get an edit through

## What is still open, and who owns it

Three things need him, and nothing else in this loop does.

Each one is on the standing open-decisions page as of today, so it does not die with a context
window. The detail for each sits in the box below it.

- [ ] PARKED 2026-08-26 · Should a nightly job delete past time slots that were never booked and are older than 90 days? · from: the storage pass, 17,572 of 62,913 slots are already in the past and nothing has ever removed one
- [ ] PARKED 2026-08-26 · Do you want leaked-password protection switched on, knowing it rejects sign-ups using passwords from known breach lists? · from: the Supabase security advisor, it is a dashboard toggle and not code
- [ ] PARKED 2026-08-26 · Do you want the three July backend fixes brought across from the branches they were stranded on? · from: the regression pass, they exist on neither this branch nor main

- **HIS CALL: prune old slots.** (PARKED above) 17,572 of the 62,913 slots are in the past and 16,711 of
      those were never booked. Nothing removes them, ever. Deleting rows is his decision by
      standing rule, so nothing was deleted. Proposal: a nightly job removing past, never-booked
      slots older than 90 days. Today that is 795 rows. It matters at 500 salons, not at 21.
- **HIS CALL: leaked-password protection.** (PARKED above) Off today. It is a toggle in the Supabase
      dashboard, not code, and it changes sign-up: it rejects passwords that appear in known
      breaches.
- **HIS CALL: the stranded July fixes.** (PARKED above) A timeout on the AI calls, a timeout on the search
      embedding, and the cached-analytics fix were all written on 2026-07-17 and are on neither
      this branch nor main. Bringing them across is part of the branch reconciliation workstream
      (67), not something to cherry-pick blind.

Carried into the next batch, each with the reason it is not done rather than a bare later:

- [x] **fixed:** the translation cache serves a hidden review, because the is_hidden guard sits
  only on the cache-miss path. `app/api/reviews/translate/route.ts` now re-checks the cached ids
  against `reviews.is_hidden` before returning them.
- [x] **fixed:** a card can be charged twice: when the paid-marking write matches no row, the
  money has left Stripe and nothing stops tomorrow's run selecting the same booking.
  `app/api/cron/pre-charge/route.ts` now destructures the update error, alerts the admin and
  distinguishes it from the harmless zero-rows case, and the SELECT excludes any booking that
  already carries a `payment_intent_id`.
- The admin payment-mode override and the customer's own booking page read different columns. I
  have proven the two reads differ; I have NOT proven the charged amount is wrong.
- [x] **fixed:** the review-translate route calls a paid AI service with no auth and no per-user
  cap, while the rate-limit file names that exact route in the list that must carry both.
  `app/api/reviews/translate/route.ts` now applies the same global AI budget and daily-cap
  limiter `app/api/translate/route.ts` uses, keyed by IP instead of user id since the route is
  reached from a public, possibly-signed-out salon page. Whether to require sign-in instead is
  his call, not made here.
- Account deletion does not purge the new avatar bucket.
- The admin photo takedown deletes the row and leaves the file.

## Batch 2, and the two checks I ran myself that the builder said it could not

- [x] **The hidden-review fix DISCRIMINATES, proven against the live database.** `verified:` a
      rolled-back transaction: picked a review that has a cached translation, counted how many
      pass the new visibility filter (**1**), flipped `is_hidden` exactly as moderation would,
      counted again (**0**), rolled back. Both numbers in one result set on purpose, because if
      the "before" had also been 0 the test would be the broken thing rather than the code. The
      builder reported this as reasoned from the code path and NOT run live; it is now run.
- [x] **The new pre-charge guard does not silently stop legitimate charges.** `verified:` this
      was the dangerous half. The guard skips any booking that already carries a
      `payment_intent_id`, and `app/api/stripe/booking-pay-intent/route.ts:704` stamps that
      column when the PaymentIntent is CREATED, before any money is captured. So if a booking
      could be `card_saved` and `confirmed` and already carry an intent, the guard would stop it
      being charged at all, which is worse than the bug. Counted on the live table: **1**
      pre-charge candidate today, **0** would be skipped, and **0** bookings are `card_saved`
      with an intent in any status, out of 997. Stated precisely: proven empty on 997 real rows,
      not proven impossible by construction.

- [x] **Batch 2 graded PASS by a separate reader, which independently answered the dangerous
      question.** It greped every writer of `bookings.payment_intent_id` and traced that
      `payment_status = 'card_saved'` is set only by the setup-intent webhook, which never
      writes `payment_intent_id`. So the new guard cannot silently stop a booking that still
      needs charging. That is the stronger form of my own count, which only showed the collision
      is empty on today's 997 rows.
- **Left open on purpose, by the reader, and worth keeping** (a decision, not an open task): a translation cached for a
      review that is later hidden is never deleted from `review_translations`. Harmless today,
      because that table has exactly one reader and it now filters on every path. It becomes a
      leak the moment anyone writes a second reader without the same filter.
