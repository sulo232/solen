# Design Diagnosis Frameworks — Research Findings

## Findings (ordered by usefulness)

**1. Nielsen's 10 Usability Heuristics — canonical verbatim list.** The standard vocabulary for naming *why* an interface fails, not just that it does:
1. Visibility of System Status
2. Match Between the System and the Real World
3. User Control and Freedom
4. Consistency and Standards
5. Error Prevention
6. Recognition Rather than Recall
7. Flexibility and Efficiency of Use
8. Aesthetic and Minimalist Design
9. Help Users Recognize, Diagnose, and Recover from Errors
10. Help and Documentation
"The design should always keep users informed about what is going on" (heuristic 1). [source: https://www.nngroup.com/articles/ten-usability-heuristics/] T1

**2. Heuristic evaluation is a two-pass procedure, not a glance.** Pass 1: walk the interface as a user completing a real task, purely to learn it — don't evaluate yet. Pass 2: walk it again systematically checking each element against the 10 heuristics. 3–5 evaluators work independently (1–2 hours each) and must not see each other's findings until done, because "each individual… is likely to miss some of the potential usability issues." Findings are logged one-per-row, then a group debrief consolidates them. [source: https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/] T1

**3. A single reviewer catches roughly a third of the problems.** Nielsen's own data: "single evaluators found only 35 percent of the usability problems in the interfaces," averaged across six projects — the empirical case for never trusting your own solo read of a screen. Diminishing returns set in after ~5 evaluators. [source: https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/theory-heuristic-evaluations/] T1

**4. Severity rating turns "this looks bad" into a prioritized, comparable number.** Nielsen's 0–4 scale: 0 = not a problem, 1 = cosmetic (fix only if time allows), 2 = minor (low priority), 3 = major (high priority), 4 = catastrophe (must fix before ship). It's computed from three dimensions — **frequency** (common vs. rare), **impact** (how hard for the user to overcome), and **persistence** (one-time vs. recurring) — plus a noted "market impact" factor for problems that hurt perception disproportionate to their fix cost. [source: https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/] T1

**5. Feldman's four-step critique method is the named source for "describe → interpret → evaluate."** Sequential and non-skippable: (1) **Description** — factual, value-neutral inventory of what's literally on screen, banning words like "strong/weak/ugly"; (2) **Analysis** — how the described parts relate and combine; (3) **Interpretation** — subjective reading of what it communicates/means; (4) **Judgment** — the reasoned evaluative verdict, held back until last "so that personal bias doesn't contaminate observation." Originated in art-criticism pedagogy and is the standard taught sequence for separating observation from opinion in any visual critique. [source: https://us.humankinetics.com/blogs/excerpt/feldman-model-of-criticism] T2

**6. NN/g's critique-facilitation rule: reformulate opinion as a goal-question.** Subjective feedback ("Yikes, that layout") gets converted to a goal-tied question ("How does this layout make it easier for the user to accomplish their task quickly?") — the discipline of tying every critique comment back to an agreed design objective rather than personal taste. [source: https://www.nngroup.com/articles/design-critiques/] T2

**7. Five Principles of Visual Design in UX (NN/g's own audit vocabulary, beyond Gestalt).** In presented order: **Scale** (relative size signals importance), **Visual Hierarchy** (guides eye order via size/color/spacing), **Balance** (visual weight distributed across an axis, not necessarily symmetric), **Contrast** (dissimilar elements read as distinct/different), and Gestalt grouping (already covered in RATIONALE.md — not restated). [source: https://www.nngroup.com/articles/principles-visual-design/] T1

**8. NN/g's own case-study method implicitly orders a visual audit: layout/grid → typography → color → imagery/balance.** Their comparative teardown of real sites moves in that sequence when explaining why a design reads as good or bad; this is inductive practice, not a formally named rubric, so treat the ordering as observed convention rather than doctrine. [source: https://www.nngroup.com/articles/why-does-a-design-look-good-part2/] CONV

**9. The 5-second test operationalizes "first impression."** Show the screen for 5 seconds, then ask 4–6 questions (no more, or you're testing memory, not impression) — "What was the main point?", "What would you click?" Don't warn the participant about the time limit beforehand. Diagnoses whether the intended focal point/message actually lands before analysis begins. [source: https://www.nngroup.com/articles/testing-visual-design/] T2

**10. Heuristic evaluation vs. lab testing: heuristic review finds different bugs than user testing, and is not a substitute.** It stretches a limited research budget and surfaces likely issues fast, but "cannot replace user research" — a heuristic PASS is not proof of usability. [source: https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/] T1

---

## Diagnostic checklist: "why does this screen feel bad" walk

1. **Symptom: "something's off but I can't say what."** Run the **5-second test protocol** on yourself or a colleague — flash the screen 5s, ask "what's the main point / what would you click." A wrong or blank answer = **weak visual hierarchy / no clear focal point** (not yet a specific fix). [source: https://www.nngroup.com/articles/testing-visual-design/]

2. **Symptom: your critique is just "ugly."** Force a **Feldman Description pass** first: list only literal facts on screen (colors present, element sizes, text) with zero judgment words. If you can't produce this list, the complaint is vibes, not a finding — go look harder before judging. [source: https://us.humankinetics.com/blogs/excerpt/feldman-model-of-criticism]

3. **Symptom: you're arguing about taste in a review.** Reformulate every subjective comment as a goal-tied question ("does X help the user do Y faster?"). If it can't be reformulated, it's a preference, not a defect — park it. [source: https://www.nngroup.com/articles/design-critiques/]

4. **Symptom: "the flow is confusing" / functional complaints.** Do the **two-pass heuristic walk**: pass 1 complete the task naively, pass 2 re-walk checking each screen against Nielsen's 10 named heuristics. Name which of the 10 is violated (e.g., "Recognition Rather than Recall" for a form that makes you remember an earlier value) — this converts vague friction into a named, communicable category. [source: https://www.nngroup.com/articles/ten-usability-heuristics/]

5. **Symptom: "nothing draws my eye / everything looks equally important."** Check **Scale**: does element size actually track importance rank, or is everything the same visual weight? [source: https://www.nngroup.com/articles/principles-visual-design/]

6. **Symptom: "I don't know where to look first."** Check **Visual Hierarchy** explicitly: trace the intended eye path via size/color/spacing cues and see if it matches the intended reading order — competing focal points is the named failure here. [source: https://www.nngroup.com/articles/visual-hierarchy-ux-definition/]

7. **Symptom: "it feels lopsided / heavy on one side."** Check **Balance**: is visual weight distributed across the layout's central axis (not necessarily symmetric)? [source: https://www.nngroup.com/articles/principles-visual-design/]

8. **Symptom: "it's muddy" (nothing stands out) OR "it's noisy" (everything stands out).** Check **Contrast**: dissimilar elements should read as distinct; if nothing differs enough, that's under-contrast; if too many things compete for attention, that's over-contrast. [source: https://www.nngroup.com/articles/principles-visual-design/]

9. **Once you have a list of named issues, rate each 0-4 for severity** (frequency x impact x persistence) before touching code — this separates "must fix before ship" from "cosmetic, low priority" and stops effort being spent on the loudest-looking issue instead of the worst one. [source: https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/]

10. **Before calling your own diagnosis final, get a second independent pass.** A solo reviewer catches only ~35% of the real problems — route the screen through at least one more independent evaluator (or a fresh look after a break) before treating your list as complete. [source: https://www.nngroup.com/articles/how-to-conduct-a-heuristic-evaluation/theory-heuristic-evaluations/]