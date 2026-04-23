# Solen Working Agreements

Source: `_tasks/META_REVIEW.md` Phase 3 (2026-04-23).
Read before any action. Cite the number when one is breached.

## Rules

1. No new `_tasks/*.md` without deleting 2 existing ones.
2. No "Q-lock" decision without a `public/solen-coral.html` commit showing rendered state.
3. Lock decay: decisions provisional for 72h. Flipping after 72h → rationale entry in `SOLEN_DESIGN.md` §20.
4. No Claude Design session without ≥1 positive + ≥1 anti-reference attached.
5. No parallel Claude sessions on the same file or surface within 2h window.
6. No `MASTER_ROADMAP.md` phases past Phase 4 (public launch). Speculative work → `_tasks/someday.md`.
7. Scope signal on every autonomous delegation: `surgical` | `feature` | `system`. Bare "go" defaults to surgical.
8. `_tasks/INCOMPLETE_FEATURES.md` updated on every context switch.
9. Audit not executed in 7 days = delete, don't v2.
10. Writing a v2 of any planning doc = stop, execute v1 instead.
11. Friday prune: delete 3 files from `_tasks/` or `_rules/`. Append to `_tasks/SHIPPED.md`.
12. Design changes start in `public/solen-coral.html`. React cascade only after preview holds.

## Claude's self-policing

- ≤3 lines after autonomous tasks (files touched / decisions / open questions).
- Push back on whole-file rewrites; show 3 surgical edits instead.
- Cite rule number when breached.
- Refuse v2 audits or new meta-docs without deletion credit.
- Check git log for parallel-session commits before touching shared surfaces.

## User's self-policing

- Scope word on autonomous delegation.
- Reference attached to every design prompt (positive + anti).
- 72h pause before flipping a lock.
- 10-min pause before cascade-strip.
- One Claude tab per file per 24h.
