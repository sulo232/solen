# Solen — Operation Log

> Append-only. Newest entries on top. One block per substantive session.
> Format: `## YYYY-MM-DD HH:MM — <one-line summary>` then 2–6 bullet points.
> When this file passes ~500 lines, archive the bottom half to `completed/LOG-<year>-Q<n>.md`.

---

## 2026-05-02 19:28 — session end

- Last commit: design: Q16 lock — kill decorative gradients across system
- _Refresh _rules/HOT.md if active context changed._


## 2026-05-02 19:10 — Wiki spine scaffolded (additive only)

- Created `_rules/HOT.md` (active-context cache, with 2h stale protocol)
- Created `_rules/INDEX.md` and `_tasks/INDEX.md` (one-line summaries of every rule/task file)
- Created this file (`_tasks/LOG.md`) as new append-only operation history
- Created `.claude/scripts/wrap-session.sh` (stop hook script, NOT wired into settings.json yet)
- Created `.claude/skills/wiki-log/SKILL.md` (project-local skill for log appends)
- Appended §16 memory-protocol pointer to `CLAUDE.md`
- **Did NOT touch:** any `_rules/*.md` body, any production code, any questionnaire-active task file, `OVERNIGHT_LOG.md` (left in place; will rename later when questionnaire phase is done)
- **Files touched:** 6 new + 1 small CLAUDE.md append. Zero deletes, zero renames.
