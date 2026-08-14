# 40 unmerged branches: what is in them, what to merge, what to delete (2026-08-14)

Owner: "alr look in deeep theres gnna be alot of conflicts etf ask me alot of questions u can stop
and stuff and ask yk go carefully and merge them or delete but ask me alot", then "and there might
be like same work or smth and we might need to decide between n stuff makebmockup to compare
smtimes".

## Readback

1. Look deep. Expect a lot of conflicts.
2. Go carefully, and merge or delete each branch.
3. Stop and ask him a lot rather than deciding alone.
4. Some branches did the SAME work in different ways. Where that happens, build a comparison so he
   can choose, rather than picking silently.

## What I measured before asking anything

- **40 branches, about 1,800 commits, none of it on main.** Verified by content with `git cherry`,
  not by branch name: these are genuinely new changes, not copies of what already landed.
- **Every one of them has now DIVERGED**, because main moved 112 commits today. So none can
  fast-forward; each is a real merge.
- **Conflicting hunks, measured per branch with `git merge-tree`:**

  | branch | conflicts | migrations not on main | last touched |
  |---|---|---|---|
  | crazy-bose-57e405 | **813** | 7 | 2026-06-28 |
  | clever-mirzakhani-1af8ef | **434** | 21 | 2026-07-06 |
  | quirky-ellis-ef5559 | **303** | 15 | 2026-07-24 |
  | cranky-bose-5621bf | 255 | 6 | 2026-07-08 |
  | context-compact-architecture-5d1ace | 254 | 0 | 2026-07-10 |
  | backend-analysis-improvements-77f02b | 244 | 21 | 2026-07-16 |
  | pre-rebase-backup | 244 | 21 | 2026-07-14 |
  | sad-austin-a99451 | 222 | 1 | 2026-07-06 |
  | happy-jackson-514459 | 180 | 1 | 2026-07-10 |
  | elated-raman-2dda12 | 169 | 0 | 2026-07-03 |
  | bold-hellman-b31513 | 147 | 1 | 2026-06-30 |
  | bold-jepsen-6019eb | 118 | 0 | 2026-07-06 |

- **`pre-rebase-backup` is a twin of `backend-analysis-improvements`**: identical conflict count,
  identical migration count. One of the two is redundant by construction.
- **THE SAME WORK WAS DONE MANY TIMES.** Of the product files these branches touch, **653 are
  touched by two or more branches** and only 365 by exactly one. The worst:
  `app/api/bookings/route.ts` and `lib/validations.ts` each have **twelve** different unmerged
  versions; `app/api/salons/route.ts` has ten; `SalonCard.tsx` and `SearchTemplate.tsx` eight each.
  That is his "there might be like same work" and it is bigger than he thought.
- **12 branches have ZERO product files left** in their remaining diff (plans, mockups and research
  only): archive-stale-docs, bold-leakey, dashboard-design-overhaul, elastic-colden,
  ig-handoff-plans, keen-nightingale, local-main-cloudflare-link, stoic-northcutt, untitled,
  cleanup-leaked-secrets, cleanup-vercel, cron-jobs.

## The honest read, before he answers anything

Merging these wholesale is not viable and I will not pretend otherwise. One branch alone carries
813 conflicting hunks, and twelve different versions of one API route cannot all be right. The
realistic shapes are: take main as the truth and lift named features across one at a time; or spend
real hours per branch resolving by hand; or archive most of it.

## Boxes

- [x] R1. Deep look done and quantified, above: per-branch conflicts, migrations, overlap, and the
      twin pair found.
- [x] R2. ANSWERED: **main is the truth, lift features across one at a time.** Nothing old gets
      merged wholesale. He names a feature he misses, I find the branch with the best version of it
      and bring only that across. No 800-conflict day.
- [x] R3. ANSWERED: **audit all of them and report.** DONE, below.
- [x] R4. ANSWERED: **delete the empty ones.** DONE: 11 of the 12 deleted, each recorded with its
      recovery sha first. The twelfth, `dashboard-design-overhaul-f5603f`, is checked out in a
      worktree so git refuses; it needs the worktree removed first and that is one command he or I
      can run once he says so.
- [x] R5. ANSWERED: **build a comparison only for things he would see.** Back-end duplicates get
      the two approaches in words plus a recommendation.
- [x] R6. DISPOSED as a standing dependency on him, which is the one kind of stop that is real:
      under the strategy he chose, work happens when he NAMES a feature he is missing. There is no
      list of features only he can produce, so there is nothing for me to execute unasked. The four
      missing migrations below are the exception and they are the first thing to bring across when
      he says go, because three of them are security.

## THE MIGRATION AUDIT (R3), every file checked against the live schema

**91 unique migration files exist on branches and not on main.** The migration ledger is NOT a
reliable test: `add_bookings_arrived_at` is absent from the applied list and its column IS live, so
those were applied by a route that stamped a different version. The schema is the only honest test,
so every file was parsed for the tables and columns it creates and those were checked against
`_inventory/_db-snapshot.json` and `_db-columns.json` (captured 2026-07-12).

| verdict | count | meaning |
|---|---|---|
| already live | 21 | every table and column it creates exists. The file is a record, nothing to do. |
| no table or column to check | 65 | policies, indexes, grants and functions only. Cannot be proven from the schema snapshot; needs a live query to settle. |
| **NOT live** | **4** | its objects genuinely do not exist in the database. |
| partial | 1 | `20260712010000_audit_fix_partner_leads_missing_migration` |

**THE FOUR THAT ARE GENUINELY MISSING, and they are the whole point of the audit:**

1. `20260712150000_audit_fix_quick_action_token_single_use.sql` (on backend-analysis + its twin) ,
   adds `bookings.consumed_at` so a quick-action token can only be used once. **A token that can be
   replayed is a security hole, not a nicety.**
2. `20260717140000_csp_violation_reports.sql` (quirky-ellis) , the table behind CSP violation
   reporting. Without it that endpoint has nowhere to write.
3. `20260717200000_walkin_tracking_token_hash.sql` (quirky-ellis) , hashes the walk-in tracking
   token instead of storing it raw.
4. `20260721100000_salon_payment_mode_admin_enforce.sql` (quirky-ellis) , `payment_mode_admin` and
   `payment_mode_enforced` on salons, so an admin can pin a salon's payment mode.

Three of the four are security or privacy. They are the strongest argument in this whole pile for
not simply deleting `quirky-ellis`.

Full per-file table: `/tmp/claude/migration-audit.md`.

## The 65 unprovable ones, stated rather than glossed

They only create policies, indexes, grants or functions, and the snapshot on disk records tables and
columns, not those. Proving them needs a live query against `pg_policies` and `pg_indexes`. The
Supabase tool refused with a permission error this session, so that half of the audit is not done
and I am not claiming it is.

## ROUND 2, the clashes (owner 2026-08-14: "for the clashes ask me tons of questions and if its visual sh ask me too")

### What the 28 remaining branches actually contain, measured

| branch | product files | of those, SCREENS | behind the scenes | clashes |
|---|---|---|---|---|
| crazy-bose-57e405 | 579 | 247 | 331 | 813 |
| clever-mirzakhani-1af8ef | 328 | 174 | 152 | 434 |
| quirky-ellis-ef5559 | 372 | 113 | 259 | 303 |
| nice-hugle-c0b706 | 93 | 61 | 31 | 294 |
| cranky-bose-5621bf | 164 | 6 | 157 | 255 |
| context-compact-architecture-5d1ace | 110 | 108 | 1 | 254 |
| backend-analysis-improvements-77f02b | 164 | 18 | 145 | 244 |
| pre-rebase-backup | 164 | 18 | 145 | 244 (exact twin of the row above) |
| sad-austin-a99451 | 151 | 114 | 36 | 222 |
| happy-jackson-514459 | 137 | 117 | 19 | 180 |
| elated-raman-2dda12 | 112 | 109 | 2 | 169 |
| bold-hellman-b31513 | 83 | 69 | 14 | 147 |

**13 branches are mostly SCREENS, 14 are mostly behind the scenes.** That split is what decides
whether a clash is a question for his eyes or a question for judgement.

**47 SCREENS have six or more competing versions.** The worst, and every one of these is a real
screen a customer or a salon owner uses:

| versions | screen |
|---|---|
| 9 | password reset |
| 9 | dashboard badge manager |
| 9 | the dashboard frame itself (`DashboardLayout`) |
| 9 | dashboard settings |
| 8 | `SalonCard`, the salon tile used across the product |
| 8 | `SearchTemplate`, the search results page |
| 8 | booking lookup |
| 8 | resend booking link |
| 8 | dashboard revenue |
| 8 | checkout |

64 more behind-the-scenes files also have six or more versions.

### Boxes

- [x] C1. Clashes measured and split into "he would see it" versus "judgement", which is what makes
      the questions answerable rather than a wall.
- [ ] C2. ASKED: which screen to settle first, since 47 of them have competing versions.
- [ ] C3. ASKED: how to settle a SCREEN clash, given he wants to be asked about visual ones.
- [ ] C4. ASKED: how to settle a behind-the-scenes clash, where there is nothing to look at.
- [ ] C5. ASKED: the twin pair, and whether to delete the redundant one.
