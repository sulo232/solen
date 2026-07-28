<!-- exists-check: net-new vs PRINCIPLES_GAP_RESEARCH.md, PRINCIPLES_IMPLEMENTATION.md,
     PRINCIPLES_LOOP.md and BACKEND_LAW.md. Those four are about principles we were MISSING and
     then built. This is the opposite direction: deep-researching the principles we ALREADY HAVE,
     one at a time, to test whether each survives contact with external evidence. Different verb,
     different input, different output. -->

# HANDOFF , deep-research every principle we already have (BACKEND and the rest)

**Owner, 2026-07-28:** *"we need to research all the principle that we're having and everything and improve it. Like, first the design and then the backend, like, actual deep research, one by one."* Then, scoping it: *"about the design principle research I want to do it here. But the backend and all of those other principle research I want to do in another session. So make me a handoff file for that."*

**So: DESIGN is being done in the originating session. THIS FILE covers everything else.** Start a fresh session, open this file first, and work down.

---

## Read these two first, they are the method

1. **`_design-system/RESEARCH_METHOD.md`** , the ten rules (R1 to R10) for how research is conducted and judged here. Written the same day from what actually worked. **Do not start without it.** The short version: three genuinely different lenses minimum, tier every claim (a)/(b)/(c), "could not verify" is a real answer, hunt the counter-case on purpose, debunk untraceable numbers, and verify the load-bearing claims YOURSELF because an agent's finding is a lead not a fact.
2. **`~/.claude/hooks/runnable-claim-gate.py`** , armed. It will block a closing message that says what a runnable thing does, costs or enforces unless that turn actually ran or read it. Do not fight it; it exists because three such claims in one session were all wrong.

## What "deep research a principle" means here, concretely

For each principle, the output is a verdict, not an essay:

- **KEEP** , external evidence supports it. Cite the evidence.
- **KEEP, SHARPEN** , the rule is right but vague or unnumbered. Give it the number, traced to at least two independent sources that agree (R8).
- **REVISE** , the evidence contradicts part of it. Say which part, with the source.
- **DROP** , it is folklore. This is a real possible outcome. The design pass already found "white space increases perceived value 300%" and the "5 to 10% bold" rule are both untraceable.
- **OWNER DECISION** , credible systems genuinely disagree, so there is no correct answer to find. Name the options and the lean, do not silently pick.

Every verdict names the principle's current home (file and line) so the edit is unambiguous.

## The queue, in order

### 1. BACKEND LAW , `_design-system/../_plans/BACKEND_LAW.md` plus `_rules/*`
The owner's stated next target. Fifteen topics were researched and audited when it was written; this pass tests them against external evidence rather than internal reasoning. Highest-value lenses: (a) published engineering standards and RFCs, (b) the actual Postgres/Supabase/Stripe documentation for the specific guarantees claimed, (c) post-mortems and incident write-ups from companies with the same shape of problem. Pay special attention to anything asserting a race-condition or money-safety property, since those are checkable against the vendor docs rather than debatable.

### 2. The SILENT NO-OP doctrine , `CLAUDE.md` pinned block and `_rules/LESSONS_LEARNED.md`
This estate's self-declared number-one failure mode (a filter that renders but does not discriminate). Research question: is the "prove behaviour, not existence" discipline supported by anything external, and do other teams have a name and a tooling answer for it? The design pass found the analogous gap on the frontend (nobody has built rendered design-floor assertions), so the honest answer here may also be a negative finding worth recording.

### 3. SECURITY , `_rules/` security file plus the S1 pass in the fable-backend skill
Test against OWASP ASVS and the Supabase security documentation specifically. Note the live example already found: a view granted to anon that bypassed row level security and exposed 833 booked slots. That was found by looking, not by a rule, which is itself evidence about the rules' coverage.

### 4. PSYCHOLOGY , `_design-system/PSYCHOLOGY.md`
Fifteen evidence-tiered behavioural laws plus a myth table. It already has tiering, so this pass is a re-verification: do the fifteen still hold, have any of the cited studies failed to replicate, and does the myth table need new entries. The design pass added candidates: the 300% whitespace claim and the 5-to-10% bold rule.

### 5. I18N and COPY , `_rules/I18N_ROUTING.md` plus the copy-economy block
Test the French-formal-versus-German-informal finding (already verified against Airbnb, Treatwell, Fresha and Planity) against a wider set, and check the 15 to 35% length-expansion claim for French and German against a real corpus rather than a rule of thumb.

### 6. MOTION , `_design-system/MOTION.md` and MOTION_LAW.md
The motion gate is already wired to CI and already caught 8 animate-spin plus 25 animate-pulse loops a manual audit missed sixfold. So the enforcement is proven; this pass tests the DURATIONS and easing against published guidance (Material has real numbers, Apple has real guidance) and against WCAG 2.2.2.

### 7. Everything else in `_rules/`
Sweep last, lowest value per unit effort.

## What the DESIGN pass already produced, so you do not redo it

Findings from 2026-07-28, all sourced, usable as precedent for the method:

- **Convergent across four independent systems:** an 8px spacing base (Material `space100 = 8dp`, Carbon, Primer, Atlassian all state it independently). Treat as law.
- **Convergent across two:** a list row's label reuses the ordinary body-text token, no bespoke "list text" size (Material's list label IS Body Large; Carbon's IS body-01).
- **Genuinely divergent, therefore taste:** trailing chevron size. Material makes it identical to the leading icon (24dp = 24dp); Atlassian makes it explicitly one step smaller (12px against 16px) for chevrons specifically. Two maintained systems, direct disagreement.
- **Material publishes a numeric optical correction** most systems do not: inside one 24dp icon grid, the square keyline is 18dp and the circle keyline is 20dp, roughly an 11% difference, because a circle inscribed in a square reads smaller. The other five systems have no equivalent published keyline table.
- **Apple has moved AWAY from fixed numbers.** The current HIG publishes no standard layout margin and no list row height; `UITableView.rowHeight` now defaults to `automaticDimension`. That is a philosophical split from Material, not a documentation gap.
- **Debunked, do not cite:** the 300% whitespace claim, the 5-to-10% bold rule, and "misalignment is detected in X ms".
- **Strongest evidence for the consistency hypothesis:** processing fluency (Reber, Schwarz and Winkielman 2004), plus a CHI 2023 finding that controlling for fluency drops the aesthetics-usability correlation from r=0.79 to r=0.34, plus Miniukovich and De Angeli's measurement that computable structural metrics INCLUDING grid/alignment regularity explain roughly a third of perceived-quality variance in real interfaces.
- **Fogg, n=2,684:** "design look" was the most-cited credibility factor at 46.1% of comments, and his own theory names the mechanism, that a user reads a defect as evidence the thing "was not carefully created in the first place".

## Ground rules carried over

- Commit each principle's verdict separately so the trail is readable.
- Register this workstream's row in `_plans/ACTIVE.md` as ACTIVE when you start, PAUSED when you stop.
- Do NOT touch design principles here; that pass belongs to the originating session and duplicating it is the exact rule-12 failure this estate keeps paying for.
