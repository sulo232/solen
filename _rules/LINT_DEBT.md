<!-- exists-check: net-new vs _rules/KEY_FEATURES.md, _tasks/INCOMPLETE_FEATURES.md, _roadmaps/features/INCOMPLETE_FEATURES.md -- read all three, none tracks lint/type debt or a ratchet paydown schedule; KEY_FEATURES.md is product features, both INCOMPLETE_FEATURES.md files are per-feature gaps with file:line+blocker, neither has a lint-baseline concept. This file is specifically the fe-01 lint-ratchet paydown schedule, referenced FROM _tasks/INCOMPLETE_FEATURES.md on a stalled month, not a replacement for it. -->

# Lint debt paydown (fe-01)

> Added 2026-07-27. Context: `.github/workflows/quality.yml`'s `lint` job is a
> RATCHET, not a quality gate -- it only fails a build that pushes the total
> error count ABOVE the current baseline. A ratchet that only ever holds a
> line and never lowers it is a permanent debt marker: this file exists so the
> debt has a schedule instead of sitting frozen forever (the way it sat at 481
> from the gate's creation until 2026-07-27, when an unrelated a11y-rule
> activation moved it to 539 -- not a paydown, a new source of debt).

## Two separate mechanisms, don't conflate them

1. **`lint-diff-scoped` job** (`.github/workflows/quality.yml`, script
   `scripts/lint-diff-scoped.mjs`): a hard zero, no baseline, no exception.
   Runs ESLint only against files changed since the merge-base with `main`
   and fails on ANY new occurrence of `@typescript-eslint/no-explicit-any`,
   `@typescript-eslint/no-unused-vars`, or `@next/next/no-html-link-for-pages`
   in those changed lines. This is what stops a PR from laundering new debt
   against the old baseline (removing 5 `any`s in file A while adding 5 in
   file B, both individually under BASELINE). This mechanism needs no
   schedule -- it is always zero.
2. **The repo-wide `lint` ratchet's BASELINE** (currently 539): the existing
   debt pile. This file is the schedule for bringing that number down.

## Paydown schedule

- **Target rate: 20 errors off BASELINE per calendar month**, driven by
  fix-while-you're-there (rule already stated in the `lint` job's own
  comment): whenever a change touches a file that already has pre-existing
  lint errors, fix those errors as part of that change and drop BASELINE by
  the count fixed in the same PR.
- A month where BASELINE does not move gets its own line below, AND a matching
  entry in `_tasks/INCOMPLETE_FEATURES.md`, naming the month and the reason
  (nobody touched a debt-carrying file; a fix was attempted and reverted;
  etc). Do NOT silently let a month pass with no record.
- Priority order for a deliberate paydown session (not fix-while-you're-there):
  `@next/next/no-html-link-for-pages` first (64 real internal `<a>` tags to
  routes like `/privacy/`, `/datenschutz/`, `/` that force a full page reload
  instead of Next.js client navigation -- a real UX regression, not just a
  style nit), then `no-unescaped-entities` (55, mechanical find-replace),
  then `@typescript-eslint/no-explicit-any` (the largest bucket, ~354,
  correspondingly the slowest to pay down because each one needs an actual
  type, not a mechanical substitution).

## Log

| Month | BASELINE start | BASELINE end | Moved by | Note |
|---|---|---|---|---|
| 2026-07 | 481 | 539 | accessibility-09 | Not a paydown -- jsx-a11y's full recommended ruleset was switched on and surfaced 56 real pre-existing violations that were always there, invisible to lint before. BASELINE correctly absorbed them (per the ratchet's own comment) rather than blocking every future PR on pre-existing debt. Net paydown this month: 0. |

Next entry due end of 2026-08. If BASELINE is still 539 (or higher, minus
another legitimate new-rule-activation absorption like the one above), that
row states why, per the schedule above.
