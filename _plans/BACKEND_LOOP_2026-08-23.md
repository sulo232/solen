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
- [ ] A1. Audit the 11 API routes added since 2026-07-17 that no audit has ever seen.
- [ ] A2. Audit the changed backend files since 2026-07-17 for new bugs.
- [ ] A3. Re-verify every CRITICAL from 2026-07-09 is still fixed in today's code.
- [ ] A4. Re-verify every CRITICAL and HIGH from 2026-07-17 is still fixed in today's code.
- [ ] A5. Prove each confirmed bug with a discriminating check, not by reading the diff.

### B. Security
- [ ] B1. Every route using the admin/service-role client has its own ownership check.
- [ ] B2. Auth and authorization on the new and changed routes (IDOR, missing ownership, role
      escalation).
- [ ] B3. Input validation and rate limiting on the new and changed routes.
- [ ] B4. Secrets: nothing server-only reachable from the client bundle or a log.
- [ ] B5. Live RLS state versus what the code assumes, read from the database, not from
      migration files.
- [ ] B6. Run Supabase's own security advisor and act on what it returns.

### C. How things are stored, so it can scale
- [ ] C1. Column types and constraints: money, timestamps, enums, nullability, defaults.
- [ ] C2. Foreign keys and what happens on delete, across every table that holds money or PII.
- [ ] C3. Indexes for the query paths that exist TODAY, not the ones that existed in June.
- [ ] C4. Tables with no growth bound: what happens at 100x the current row count.
- [ ] C5. Anything stored in a shape that will not survive growth (JSON blobs used as columns,
      arrays used as join tables, text where an enum belongs).
- [ ] C6. Files and images: where they live, whether reads are signed, whether deletes orphan.
- [ ] C7. Run Supabase's own performance advisor and act on what it returns.

### D. Waste and speed
- [ ] D1. N+1 queries: a query inside a loop, or a nested select that fans out per row.
- [ ] D2. Unbounded selects: no limit, no pagination, select star where three columns are used.
- [ ] D3. Serial awaits that could run at once.
- [ ] D4. Caching: what is recomputed on every request that could be computed once.
- [ ] D5. Measure before and after on anything claimed as faster. A claim without both numbers
      does not count.

### E. Fix, not just report
- [ ] E1. Every confirmed finding either fixed, or carrying a concrete named blocker.
- [ ] E2. Each batch built by a coder and graded by a separate reviewer, to PASS.
- [ ] E3. Migrations applied additively and verified live, never a push or a reset.
- [ ] E4. Nothing pushed. Commits only.

### F. The loop itself
- [ ] F1. Rounds run until a round finds nothing new, not until a fixed count is reached.
- [ ] F2. Each round finds strictly fewer new items than the one before, or the regression gets
      found before continuing.
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
