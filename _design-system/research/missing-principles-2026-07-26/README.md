# Missing Principles sweep, 2026-07-26

<!-- exists-check 2026-07-26: `npm run exists principles` and greps over _design-system, _rules,
_docs, _backend-system, both CLAUDE.md files and ~/.claude found no prior MISSING-principle
inventory. The nearest existing things are all different: the taste book renders SETTLED design
rules as wrong/right pairs; _design-system/research/TASTE_*.md hold researched floors that were
adopted; _backend-system/audit/*.md grade Solen against 8 of 15 backend topics; SELF_AUDIT and
SYSTEM_HEALTH check the enforcement layer's own wiring. None of them enumerates what the rulebook
does not yet say, across every area at once. That is what this folder is. -->

**Owner ask, verbatim (2026-07-26):** "go research me all the missing principle on each design or
wherevre yk all the files not only design or how u output stuf or backend security idk all of em
its a multi hour research and comparing loop session ... make me a concrete list one in all
details ... im expecting 100 or more important stuff concrete okay use subgents alot and also
subagents for opinion etc"

## What is in here

| file | what it is |
|---|---|
| `<domain>.json` | one read-only research agent's output for one topic. 24 topics. |
| `orchestrator-output.json` | the orchestrating thread's own principles for how it reports to the owner, written after reading the whole reporting doctrine. Kept separate because it is not agent output. |
| `_orchestrator-live-verification.md` | the orchestrator's OWN checks: live Supabase reads, live rendered-page measurement, git and GitHub state, the estate health check. **This file outranks any agent finding it contradicts**, and it already corrected one. |
| `_digest.md` | every finding in compact form, the input the judgment panel read. |
| `_judge1-rank.json` / `_judge2-cull.json` / `_judge3-gaps.json` | three independent judgment passes: what to do first, what to cut, and what a 24-topic sweep structurally cannot see. |

Rendered, readable version of all of it: `public/_research/missing-principles/index.html`.

## Method, so a later session can judge the quality

Each research agent was given: the repo paths for its topic, a requirement to read the existing law
FIRST, a requirement to PROVE ABSENCE with named greps across the whole estate before claiming a
gap, a requirement to ground every finding in this codebase with a file:line or a measured number,
and a requirement to write the missing rule as paste-ready law text with the threshold in the
sentence. Partial coverage counted as a valid finding only when the exact delta was named. Every
agent was told to grep `_design-system/REMOVED.md` and `TASTE_LOG.md` first so nothing already
rejected got re-proposed.

Two things this method does NOT guarantee, stated so nobody oversells it:

1. **Agents can present a migration-file truth as a live truth.** One did, at CRITICAL severity.
   The live database contradicted it. Always prefer `_orchestrator-live-verification.md`.
2. **Each agent was asked for 8 to 14 findings**, which guarantees some padding at the low end.
   That is what judge 2's cull exists for. Read the cull before adopting anything from the tail.

## The honest headline

The single most consequential thing found was not in any one topic. It is that this estate's
enforcement is aimed at the artifacts we make (mockups, edits, replies) and almost never at the
running system: CI has never executed once, the design floors are measured on mockups and never on
a shipped route, and two Terms of Service promises have no working implementation. Details and
evidence in `_orchestrator-live-verification.md`.
