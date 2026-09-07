<!-- exists-check: extends _design-system/AGENT_BRIEF_TEMPLATE.md (read in full first, now moved to
     archive/ and replaced by this). Net-new vs LOCKFILE / TASTE_LOG / QUESTIONS / COMPONENT_REGISTRY
     because those hold VALUES and VERDICTS, while this holds the procedure for briefing and grading,
     which is the concern the canon list has assigned to this filename all along. CANON_PLAN.md is
     the plan for the consolidation, not the process itself. -->

# PROCESS.md , how design work is scoped, briefed and graded

The canon list has named this file for a while and it did not exist, so the gate that routes people
here was pointing at nothing. Created 2026-08-08, replacing the 240-line `AGENT_BRIEF_TEMPLATE.md`
(now in `archive/`), which had rotted in two ways worth naming, because both are the failure mode
this file has to avoid:

1. **It hardcoded a worktree path that no longer exists** (`vigorous-spence-0e9aa7`), so every agent
   briefed from it started by being told to work in a deleted directory.
2. **It told the verifier that blue is "functional-only: focus rings"** , and a focus ring conflicts
   with the current focus rule recorded in the design owners (2026-07-01, 07-02, 07-17).
   A brief that instructs the grader to bless a banned thing is worse than no brief.

**The rule that comes out of both: a brief carries no literal values and no environment.** It points
at the file that owns them. A literal copied into a second file is a value that will be wrong later.

---

## The brief, in full

```
ROLE: [builder | verifier]
ROUTE: [/de/salon/[slug]]
SCOPE: [the sections this agent owns, listed]
PROJECT ROOT: [run `pwd`. Never paste a path from any doc.]
DEV SERVER: [inspect the current local server or browser state with the documented available tools. Never assume a port.]

READ FIRST, in this order, before any other tool call:
  1. _design-system/COMPONENT_REGISTRY.md      what already exists
  2. _design-system/LOCKFILE.md                the frozen values
  3. _design-system/TASTE_LOG.md               his settled verdicts on this surface
  4. _design-system/QUESTIONS.md               what is still open

THE JOB: [one sentence]
DONE MEANS: [a condition someone else could check, not "looks good"]

CONSTRAINTS:
  - Reuse before you build. A new component needs a registry entry in the same turn.
  - No category branches (no `if category === 'X'`).
  - Values come from LOCKFILE, never from this brief and never from memory.
  - Read-only if you are the verifier. Verifiers never edit.
```

That is the whole template. It is short on purpose: everything that used to be spelled out here now
lives in the file that owns it, so it cannot drift out of sync the way the old one did.

---

## The three steps

**1. Ground.** Read the four files above. If the surface has a `TASTE_LOG` entry, it is settled and
is not reopened. If `npm run exists <keyword>` finds it, extend it rather than building beside it.

**2. Build.** One section at a time. Values come from LOCKFILE. For an unlocked value, first apply
`TASTE_AUTHORITY.md` and current authorization; ask only when a material owner decision remains,
otherwise park the dependency and finish independent work.

**3. Grade.** The writer is never the grader. The verifier renders the real route at 390x844,
measures against the current project floors, and returns a verdict or punch list with `file:line`.
After a third failing round, diagnose the method, specification, or missing evidence before another
repair. Ask the owner only when that diagnosis identifies a material owner decision.

## What a verifier is told to ignore

Deliberate departures from any reference, so they are not re-flagged every round:

- Primary CTAs are ink, not the reference's colour.
- Star rating is yellow `#FFC32B`, matching everyone.
- The interactive accent is sparse and small: links, small chips, review counts. Not big CTAs, not
  prices, not headings.
- **Focus rings and halos are BANNED, not "functional-only".** Input focus is one ink edge, set
  globally. If a brief or a doc says otherwise, reconcile it to the current focus owner before
  grading the surface.

Everything else in the reference is fair game to flag.
