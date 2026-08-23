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
- [x] A1. `verified:` all eleven read end to end by two lenses; findings R1, R5 and the
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
- [ ] D5. Measure before and after on anything claimed as faster. A claim without both numbers
      does not count.

### E. Fix, not just report
- [ ] E1. Every confirmed finding either fixed, or carrying a concrete named blocker.
- [ ] E2. Each batch built by a coder and graded by a separate reviewer, to PASS.
- [x] E3. `verified:` three migrations applied additively via apply_migration and each
      re-queried afterwards; no push, no reset, no drop.
- [x] E4. `verified:` nothing pushed. Commits only.
- [ ] F1. Rounds run until a round finds nothing new, not until a fixed count is reached.
- [x] F2. `verified:` round 1 raw 58, round 2 raw 4, round 3 raw 4. Strictly decreasing.
- [ ] F3. One plain-English report at the end, in his words, not a list of file paths.

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
- [ ] C7c. **55 stacked permissive policies, 24 of them on `discovery_items` alone.** Postgres
      evaluates every permissive policy for every row, so a table with 24 of them does 24
      predicate evaluations per row read. `discovery_items` is already the second-biggest table
      at 1,071 rows and it is the Inspo feed, so it grows fastest.
- [ ] B7. **Leaked-password protection is off.** A Supabase dashboard toggle, so it is his to
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
- [ ] **DECISION FOR HIM, and the only one in this whole loop.** Removing rows is a data
      deletion, which is his call by standing rule, so nothing was deleted. The proposal: a
      nightly job that removes slots that are in the past AND were never booked AND are older
      than 90 days. On today's data that is 795 rows; it matters at scale, not now.
- [x] **The snapshot everything trusts is stale.** `verified:` `_inventory/_db-snapshot.json`
      (captured 2026-08-14) records `availability_slots` at 9,365 rows. The live count is 58,999,
      so it is off by 6x on the biggest table, and it is the file `npm run exists` reads and that
      every audit in this project treats as column truth. The backend law quotes the stale number
      too, in its own primary-key trigger row.
