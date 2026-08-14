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
- [ ] R2. ASKED: the strategy for the 40 old branches.
- [ ] R3. ASKED: what to do about 57 migration files that are not on main while the live database
      has moved on.
- [ ] R4. ASKED: delete or keep the 12 branches that carry no product code.
- [ ] R5. ASKED: when two branches did the same file differently, does he want a comparison built
      every time, or a recommendation with the reasoning.
- [ ] R6. Execute whatever he picks, branch by branch, and record each decision here.
