<!-- exists-check: net-new vs SOURCE.md, QUESTIONS.md, CONTRADICTIONS.md, CONSISTENCY_AUDIT.md,
     AGENT_BRIEF_TEMPLATE.md, PRINCIPLES_GAP_RESEARCH.md and _tasks/archive/CLAUDE_DESIGN_RESEARCH.md,
     because every one of those holds research OUTPUT (findings, open questions, contradictions found,
     audit results) or a brief FORMAT. None states the METHOD by which research is conducted and
     judged. AGENT_BRIEF_TEMPLATE.md is the closest neighbour and is complementary, it says how to
     write one brief; this says how many briefs, along which axes, how to tier what comes back, and
     when research is finished. It fills the open ask at _plans/ACCOUNT_BUILD.md:61, "DEEP-RESEARCH
     principle: we have none". -->

# RESEARCH METHOD , the law for how research gets done here

**Owner, 2026-07-28:** *"I love how you're researching. I love the way that you're researching. I need this actually to get into a whole principle for this."*

Not a general essay on research. Every rule below is derived from a specific thing that happened in the 2026-07-28 session, and each names the case that produced it, so none of it is invented best practice.

Precedence: tier 8 of the `CLAUDE.md` chain, the doctrine layer. It never outranks a live owner instruction or a statutory floor.

---

## R1. Never one source. Fan out, one agent per LENS.

Five agents ran on one question, each a different lens: published specs, perception science, drift tooling, a cross-app teardown, and the company-specific story.

**Why lenses and not copies:** three agents asked the same question return three versions of one answer and feel like confirmation. Three agents asked *different* questions return findings that contradict each other, and the contradiction is where the truth is. The teardown lens is what established that Airbnb is the MAJORITY pattern rather than an idiosyncrasy, which staring at Airbnb alone could never have shown.

**Rule:** three genuinely different lenses minimum. Name the lens in the brief. Tell each agent what the others cover so they do not converge.

## R2. Tier every claim, and never present tier (c) as tier (a).

- **(a)** peer-reviewed research, or a primary source published by the party in question
- **(b)** credible practitioner writing from a named expert
- **(c)** your own inference

**The case:** the perception lens separated "pop-out requires a minority feature" (tier a, Treisman and Gormican) from "therefore 56% bold means bold has stopped meaning anything" (tier c, an extrapolation). Both useful. Collapsing them would have dressed an inference as a finding.

## R3. "Could not verify" is a first-class result. Deliver it, never paper over it.

**The cases, one session:** Treatwell and Booksy are not in Mobbin, so their row anatomy went uncharacterised rather than guessed from menu names. Apple's HIG would not render, so no icon numbers were invented for it. Lindgaard's exact correlation sat behind a paywall and was reported as unverified while the methodology was confirmed. Primer publishes no type scale comparable to the others, and that was stated as a finding.

A named gap is information. A gap filled with a plausible guess is contamination, and it is undetectable later.

## R4. Hunt the counter-case on purpose. Ask what would DISPROVE this.

**The case:** the Airbnb brief explicitly demanded credible criticism and honest self-assessment. That instruction is what surfaced Saarinen's own line, *"I wish we had taken more time to think about the rows"*, the single most useful sentence in the whole trail, because rows were the exact component under discussion. A brief asking only "how does Airbnb achieve consistency" would never have found it.

**Rule:** every brief carries an explicit instruction to find the disconfirming evidence, the abandoned experiment, the thing that did not work.

## R5. Actively debunk. A number without a traceable source is worse than no number.

**The cases:** "white space increases perceived value by up to 300%" traces to nothing and has the exact shape of a fabricated marketing statistic. The "5 to 10% of a page should be bold" rule has no study behind it. "Misalignment is detected in X milliseconds" could not be sourced. A three-layer box-shadow attributed to Airbnb had no credible source and was flagged as probably invented.

This estate already keeps a myth table for this reason (`_design-system/PSYCHOLOGY.md`). Feed it.

## R6. Verify the LOAD-BEARING claims yourself. An agent's finding is a lead, not a fact.

**Three cases in one session, every one of which changed the answer:**
- Agent said `text-s-ink/<opacity>` was in ~54 files. Counted: **55 files, 251 instances** in the illegible band.
- Agent recommended Betterer as the ratchet. Checked: newest release is a **2024 alpha**, and the ratchet **already existed** in our own checker.
- Agent framing implied our floors gate would fail the build. Ran it: it **exits 0 today**.

**Rule:** before repeating a finding to the owner, run it, read the file, or count it. Especially anything that would change a decision. Enforced by `~/.claude/hooks/runnable-claim-gate.py`.

## R7. Separate PUBLISHED from RECONSTRUCTED.

**The case:** Airbnb publishes no spacing scale and no type ramp. Third-party reconstructions disagree on the base unit itself, one rebuilding 8px and others 4px. Two independent reverse-engineering attempts landing on different answers means **neither is citable**.

**Rule:** never let a community reconstruction pass as a company's specification. Where the only numbers come from measuring a shipped artefact, say they are ours, measured, and our decision, never "matching X".

## R8. Where sources AGREE is law. Where they DIVERGE is taste, and taste goes to the owner.

**The cases.** Convergent, four independent systems: an 8px spacing base (Material, Carbon, Primer, Atlassian). Convergent, two systems: a list row reuses the ordinary body-text token rather than a bespoke size (Material, Carbon).

Divergent, and both deliberate: Material makes the trailing chevron **identical** to the leading icon (24dp = 24dp); Atlassian makes it **explicitly one step smaller** (12px against 16px) and says why. That is two live maintained systems directly disagreeing, not one being sloppy. The lesson is not which to pick, it is that you pick one and write the number down.

**Rule:** convergence across independent systems is the strongest evidence available. Divergence is not a failure to find the answer, it is the finding that there is no single answer, and it becomes an owner decision with the options named.

## R9. A negative result is a finding. Report it as one.

**The case:** three rounds of search found **no shared tool** that renders a page and asserts distributional design rules. "Nobody has built this" reframed our own checker from "something I failed to look up" into "closer to novel infrastructure", and it stopped a search that would otherwise have run indefinitely.

## R10. Brief with the measurements already taken, and forbid re-measuring.

Every agent received the numbers already in hand and was told to build on them. That bought depth instead of five agents re-deriving the same row pitch, and it makes their output checkable: a claim contradicting a supplied measurement is immediately visible.

---

## The close condition

Research is done when every claim is tiered, every load-bearing claim has been independently verified, the gaps are named as gaps, the debunks are stated, convergence is separated from divergence, and the divergences are put to the owner as decisions rather than silently resolved.

Research is NOT done when it has produced a confident narrative. A confident narrative with no tiering is the failure mode this document exists to prevent.
