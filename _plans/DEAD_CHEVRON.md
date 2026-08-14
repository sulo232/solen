# Dead-chevron audit (owner rule 2026-07-16)

**Rule source (verbatim):** TASTE_LOG.md:253 (happy-jackson-514459 worktree, unmerged branch): "A chevron/arrow affordance may NEVER render without a real wired destination. A dead chevron is a fabricated affordance, the same class as fabricated data. Mockups mark inert controls as inert; product code never ships an unwired chevron." RATIONALE.md:694 domain 13: "no chevron/arrow ships without a real route or handler; a mockup showing an inert control labels it inert; when a row has no destination yet, it carries NO chevron rather than a dead one."

**NOTE:** the rule docs live ONLY on the unmerged `happy-jackson-514459` branch; main + this worktree do not have TASTE_LOG:238-268 / RATIONALE.md yet. Rule STANDS per that log (line 268). Flag to owner at close.

**Close condition (binary):**
- [ ] Every ChevronRight / ArrowRight / ArrowUpRight render site in app/ and components*/ classified WIRED / DEAD / CONDITIONALLY DEAD with file:line (77 files hit by grep)
- [ ] Every DEAD site in PRODUCTION code fixed: wired to the obvious real destination if one exists, else chevron removed (row content kept)
- [ ] Surgical edits only; one commit per component
- [ ] loop-reviewer PASS with file:line proof (writer never grades own work)
- [ ] No git push

**Scope decisions (defaults, flagged at close):**
- app/[locale]/dev/* = mockup/harness routes: CLASSIFY + report, do NOT edit (approved-mockup guard; rule says mockups label inert controls, but editing approved mockups needs owner ok). PARKED.
- components-legacy/*: classify + check if mounted; unmounted legacy = report only (no render = no shipped affordance).

## Classification ledger
(filled by audit agents, waves of 4)

## Fix ledger
(one row per component: file, fix, commit sha)

## Parked
- dev/* mockup inert-control labelling: owner call.
- Rule docs unmerged (happy-jackson branch): owner merge call.
