<!-- WORKSTREAMS-INDEX , do NOT overwrite this file with a single plan. Add/update a ROW; put plan detail in _plans/<NAME>.md. The workstreams-index-guard hook BLOCKS any write that drops this marker. -->
# WORKSTREAMS , every in-flight workstream (auto-injected, survives compaction)

> THE durable index of all in-flight work. On a topic-switch the previous workstream STAYS here as `PAUSED` , it is NOT deleted or overwritten. Each row points to its own detail file in `_plans/`. Keep the statuses current; never replace this index with one plan.

| # | workstream | status | detail | open / next |
|---|---|---|---|---|
| 1 | Homepage design pass | **ACTIVE** | [HOMEPAGE.md](HOMEPAGE.md) | item 7 Walk-in (not started); parked: ab-CHF i18n decision, fake-times no-fab fix |
| 2 | Bug-hunt (customer/onboarding/admin) | **PAUSED** (since 2026-06-29, for #1) | [BUG_HUNT.md](BUG_HUNT.md) | onboarding + admin not started; PDP/booking FIX-clear + FIX-careful queued; i18n batch; reviews dedup |
| 3 | System-Upgrade (hooks/meta) | **DONE** | [SYSTEM_UPGRADE_PLAN.md](SYSTEM_UPGRADE_PLAN.md) | deferred polish: armed-flag TTL/cleanup, silent-stop detector, mockup-gate web arm, memory merge, skill retarget, log archive |

## Why this file is an index (2026-06-29)
The old single-`ACTIVE.md` model **clobbered** the bug-hunt plan: it was overwritten by #3 and was never committed, so it was lost from git entirely. Fix: workstreams now live in separate files; this index is the never-lose map; `_plans/` is committed so nothing is working-tree-only again. The `workstreams-index-guard` hook blocks any write to this file that isn't an index (missing the marker above), so a single plan can't clobber it.

## Rule on topic-switch
When the owner switches topics: set the current workstream's status here (ACTIVE -> PAUSED), do NOT abandon or delete it, then start/resume the new one. Resume a paused workstream by re-reading its detail file.
