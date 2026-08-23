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
