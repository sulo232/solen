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
ROLE: [main author | approved-design implementer | warranted verifier]
ROUTE: [/de/salon/[slug]]
SCOPE: [the sections this agent owns, listed]
PROJECT ROOT: [run `pwd`. Never paste a path from any doc.]
DEV SERVER: [inspect the current local server or browser state with the documented available tools. Never assume a port.]

SOURCE GROUNDING, after confirming the current checkout and before design judgment or edits:
  - _design-system/COMPONENT_REGISTRY.md      what already exists
  - _design-system/LOCKFILE.md                the frozen production values
  - _design-system/TASTE_LOG.md               settled verdicts on this surface
  - _design-system/QUESTIONS.md               what is still open
  Read the applicable sections with enough surrounding contract to interpret them; read a whole
  file when a partial read could change the decision. Reuse unchanged accepted evidence across
  workers and phases. Re-read when the source or task evidence changed, is missing, or a failure
  calls the premise into doubt.

THE JOB: [one sentence]
DONE MEANS: [a condition someone else could check, not "looks good"]

CONSTRAINTS:
  - Reuse before you build. A new component needs a registry entry in the same turn.
  - No category branches (no `if category === 'X'`).
  - Production values come from LOCKFILE. An explicit exploration commission may authorize scoped
    variation inside its mockups; it does not change the production locks.
  - Read-only if you are the verifier. Verifiers never edit.
```

That is the whole template. It is short on purpose: everything that used to be spelled out here now
lives in the file that owns it, so it cannot drift out of sync the way the old one did.

---

## The three steps

**1. Ground.** Identify the applicable owner among the four files above and read enough surrounding
contract to make the decision. If the same accepted evidence and file identity remain current,
reuse them rather than imposing another full reread on each worker or phase. If the surface has a
`TASTE_LOG` entry, it is settled and is not reopened. If `npm run exists <keyword>` finds it, extend
it rather than building beside it, except where an explicit exploration commission authorizes a
separate mockup composition.

**2. Build.** The main assistant owns all design, from a button or component through a section, screen and journey: reference inspection, taste, composition, states, motion, the design artifact and final visual acceptance. Subagents may collect useful independent reference or asset evidence, research distinct hypotheses, faithfully implement a precisely approved design, or independently review consequential work. Missing creative choices return to the main assistant. Main implements directly when coupling makes a handoff cost more than it saves. Production design approval remains the user's decision. Faithful implementation uses the actual user-approved design and main checks rendered fidelity. Routine delegation uses the existing compact brief with relevant scope, widths, states and motion; no formal contract, separate evidence report or independent review is required merely because the change is visual. Consequential implementation retains the structured handoff and independent acceptance. Reuse existing approval and test evidence. Main creates the design artifact; an implementer does not fill missing creative decisions. For consequential implementation in an opted-in loop, fable-execution owns contract enrollment and independent acceptance. A mockup commission authorizes creating its proposal; it is not production approval. Keep the current reviewable simulated-payment mockup milestone; real payment/backend/font endpoints follow approval unless explicitly commissioned now.

Production values come from LOCKFILE. For an unlocked
production value, first apply `TASTE_AUTHORITY.md` and current authorization; ask only when a
material owner decision remains, otherwise park the dependency and finish independent work.

When the owner explicitly commissions multiple genuinely different directions or net-new
exploration, that commission authorizes the mockups to vary product template anatomy, layout,
type, shape, hierarchy, and decorative treatment without separate permission for every literal.
Use actual data, behavior, and accessible primitives where useful, but do not force the same
full-page copy, component anatomy, or one captured reference layout across every direction. Keep
the commissioned calm palette, clean ordinary typography, and meaningful responsive reactions
and motion. Production locks still govern shipping and uncommissioned redesign. Accessible
interactions, data truth, money and terms, and security remain mandatory. Production implementation
or adoption as design law still needs explicit owner approval; a complaint is never approval.

**3. Check and grade.** The working assistant renders the real route at 390x844, inspects the
screenshot, DOM, interaction, accessibility, and real data, and measures against the current project
floors. Ordinary low-risk reversible visual work closes with those focused direct checks. When
actual consequence, uncertainty, or reach requires independent acceptance, the writer is not the
grader: one read-only native verifier returns a verdict or punch list with `file:line` and can cover
all applicable visual, code, and security criteria. Add a specialist only for a material uncovered
question. After a third failing round, diagnose the method, specification, or missing evidence
before another repair. Ask the owner only when that diagnosis identifies a material owner decision.

## What a verifier is told to ignore

Deliberate departures from any reference, so they are not re-flagged every round:

- Primary CTAs are ink, not the reference's colour.
- Star rating is yellow `#FFC32B`, matching everyone.
- The interactive accent is sparse and small: links, small chips, review counts. Not big CTAs, not
  prices, not headings.
- **Focus rings and halos are BANNED, not "functional-only".** Input focus is one ink edge, set
  globally. If a brief or a doc says otherwise, reconcile it to the current focus owner before
  grading the surface.

For production-directed work, everything else in the applicable reference is fair game to flag. In
an explicit owner-commissioned multi-direction or net-new exploration, grade each direction against
the commission and evidence; do not reject it merely for departing from another direction's layout
or from the production template.
