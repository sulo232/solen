# Workstream 41 , MISSING PRINCIPLES research (whole estate, not just design)

**Owner ask (2026-07-26, verbatim):** "go research me all the missing principle on each design or wherevre yk all the files not only design or how u output stuf or backend security idk all of em its a multi hour research and comparing loop session one u got all the file and analyzed evrth and researched and make me a concrete list one in all details and here on text tell me in plain english and what we should add im expecting 100 or more important stuff concrete okay use subgents alot and also subagents for opinion etc go"

**Close condition (binary, graded):**
- [ ] C1 , 100+ concrete MISSING-principle items delivered, each with: the principle text ready to paste, why (first principles), evidence the gap bites (file:line or a number), proof of absence (what was searched), where it should live, how it gets enforced.
- [ ] C2 , every item passes the not-already-covered test (a named search that came back empty, or a named partial with the delta stated).
- [ ] C3 , coverage spans ALL estate areas, not just design: backend, security, privacy, data, API, performance, observability, testing, marketplace/trust, agent-output/communication, meta/law-system.
- [ ] C4 , opinion/judgment subagents rank the list (severity x effort) so it is actionable, not a dump.
- [ ] C5 , deliverable = a SERVED VISUAL PAGE (taste-book grammar) + plain English in chat, same turn. Not a bare markdown file.
- [ ] C6 , closing report re-reads the original message and ticks every atomic box.

## Atomic asks (from the owner message)

- [ ] A1 , research missing principles for DESIGN
- [ ] A2 , research missing principles "not only design" , every other file/area in the estate
- [ ] A3 , research missing principles for HOW I OUTPUT STUFF (communication / reporting / verification)
- [ ] A4 , research missing principles for BACKEND SECURITY
- [ ] A5 , "all of em" , the remaining areas (data, API, perf, observability, privacy, testing, marketplace, meta/law)
- [ ] A6 , get ALL the files first and analyze everything (grounded, not from memory)
- [ ] A7 , research + COMPARE (against outside state-of-the-art, not just internal opinion)
- [ ] A8 , multi-hour LOOP session (waves, not one pass)
- [ ] A9 , one concrete list, in full detail
- [ ] A10 , plain English here in chat, saying what we should add
- [ ] A11 , 100+ items, concrete
- [ ] A12 , use subagents a lot
- [ ] A13 , use subagents for OPINION too (judgment panel)

## Premortem (gate 3, run before dispatch)

Top concrete risks:
1. **Generic textbook advice** , agents return "add accessibility", already covered somewhere in 410k words of design docs. MITIGATION: every finding must carry `existing_coverage` (a named grep that came back empty or a named partial) or it is discarded in the dedupe pass.
2. **Padding to hit 100** , the count becomes the goal. MITIGATION: the judgment panel scores each item and the report separates the ranked core from the long tail; a padded item gets cut, not renamed.
3. **Rate limits / fleet death** , 10-wide bursts hit limits twice on record. MITIGATION: waves of 4, results persisted in the workflow journal, resumeFromRunId on failure.
4. **Path confusion** , worktree vs main repo. MITIGATION: absolute worktree path in every brief.
5. **Deliverable ends as markdown** , violates the visual-deliverable rule. MITIGATION: HTML page + tunnel link is part of the close condition (C5).

Load-bearing unknowns + cheapest probe:
- What the estate ALREADY covers (probe: doc inventory + per-domain grep , DONE in the first pass).
- Whether the serving dir mismatch bites again (probe: write a file, curl it, before promising a link).

Out of scope: implementing any principle, editing any gate or hook, redesigning UI. This is research + a ranked list.

## Waves

- [ ] W1 , design-side domains (12 read-only research agents, waves of 4)
- [ ] W2 , backend/security/process domains (14 read-only research agents, waves of 4)
- [ ] W3 , dedupe + judgment panel (opus, judgment-shaped) + severity ranking
- [ ] W4 , build the visual deliverable page + serve + tunnel link
- [ ] W5 , plain-English close in chat

## Unplanned additions

(none yet)
