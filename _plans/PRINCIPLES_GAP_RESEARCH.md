# Workstream 41 , MISSING PRINCIPLES research (whole estate, not just design)

**Owner ask (2026-07-26, verbatim):** "go research me all the missing principle on each design or wherevre yk all the files not only design or how u output stuf or backend security idk all of em its a multi hour research and comparing loop session one u got all the file and analyzed evrth and researched and make me a concrete list one in all details and here on text tell me in plain english and what we should add im expecting 100 or more important stuff concrete okay use subgents alot and also subagents for opinion etc go"

**Close condition (binary, graded):** every tick below carries its proof. Re-derived from the
COMMITTED corpus this turn, not from narrative.

- [x] C1 , **276 findings against a target of 100**, 21 critical / 94 high / 111 medium / 50 low.
      verified: counted from `_design-system/research/missing-principles-2026-07-26/*.json` (27 topic
      files, `_`-prefixed files excluded) at commit `5afd74886`. 276 distinct ids, zero duplicates.
      Plus 20 net-new in `_judge3-gaps.json` -> 296 principles.
- [x] C2 , **276 of 276 carry an `absence_proof`, 276 of 276 carry `existing_coverage`.**
      It was 269 of 276 when first ticked and I recorded the real number rather than the claim.
      The seven gaps are now CLOSED, not excused: I ran the absence greps myself for
      `observability-3`, `observability-4`, `observability-5`, `observability-8`,
      `responsive-desktop-04`, `states-forms-02` and `typography-04`, and wrote each result into
      the finding, marked as orchestrator-filled so the provenance stays honest.
      verified: recount over the committed corpus prints 276/276; the greps behind each are quoted
      in the finding itself (for example `states-forms-02` now cites LOCKFILE:503/554/556 as the
      only three `toast` hits, none of them a field-error placement rule).
- [x] C3 , 27 topic files spanning design, people/fairness, backend/security/privacy, engineering
      and meta. verified: `ls _design-system/research/missing-principles-2026-07-26/*.json` at
      commit `5afd74886` lists accessibility, agent-output, api-contracts, authz-rls, color-tokens,
      copy-i18n, data-money, ethics-psychology, frontend-architecture, hierarchy-density,
      ia-navigation, imagery-icons, input-abuse, law-system-meta, layout-geometry,
      marketplace-trust, motion, observability, orchestrator-output, performance,
      privacy-compliance, responsive-desktop, secrets-webhooks, seo-comms, states-forms,
      testing-release, typography.
- [x] C4 , three judgment passes. verified: `_judge1-rank.json` (19 do-now, 24 do-next, 20 deferrals),
      `_judge2-cull.json` (15 cut, 16 downgraded, 10 merge clusters), `_judge3-gaps.json`
      (9 blind spots, 20 net-new), all committed in `0bb9a1c8b`.
- [x] C5 , page committed at `public/_research/missing-principles/index.html` (commit `0bb9a1c8b`),
      served on :3210. verified by measuring the RENDERED page in the browser this turn:
      4 distinct font sizes (28/15/13/11), 2 weights (400/600), 21.6 percent of text at weight >=600,
      `document.documentElement.scrollWidth === innerWidth` so no horizontal overflow;
      `grep -c "prefers-color-scheme\|data-theme"` = 0 and em-dash count = 0 on the committed file.
- [x] C6 , closing report re-reads the original message and ticks every atomic box, below.

## Delivery record (for the closing report and for any session that resumes this)

- Page (repo copy): `public/_research/missing-principles/index.html`
- Page (served copy): `/Users/sulo/Documents/solen-mobile/_design-system/captures/principles/index.html`
  served on port 3210 by the "Mockup delivery (mobile captures)" launch config.
- Raw research corpus: `_design-system/research/missing-principles-2026-07-26/` (26 JSON files,
  the digest, the orchestrator's live verification, a README with the method and its honest limits).
- Local link that works on the owner's own Mac: http://localhost:3210/principles/
- NO tunnel link is possible this session. ROOT CAUSE, measured this turn, not recalled:
  cloudflared's own connectivity pre-check (running OUTSIDE the Bash sandbox) reports
  `DNS Resolution PASS`, `Cloudflare API api.cloudflare.com:443 PASS`, and
  `UDP Connectivity 7844 FAIL` + `TCP Connectivity 7844 FAIL` to both region1 and region2
  argotunnel, then `precheck complete hard_fail=true`. So 443 to Cloudflare works and 7844
  specifically does not: this is a port filter on this machine or its network, not DNS, not the
  sandbox, and not cloudflared. Root fix: allow outbound TCP+UDP 7844, or use a tunnel that
  transports over 443. My own socket probe cannot discriminate here and I am saying so: from the
  Bash sandbox, `socket.connect()` returns `PermissionError [Errno 1]` on 7844 AND on 443, and DNS
  fails, so the sandbox blocks all outbound sockets from my shell. cloudflared's pre-check is the
  authoritative evidence, not my probe.
- The six built-but-unarmed gates cannot be armed from this session. ROOT CAUSE, measured this turn
  with a discriminating probe that writes nothing: `os.access(W_OK)` is `False` and
  `open(path, "r+")` raises `PermissionError [Errno 1] Operation not permitted` for BOTH
  `~/.claude/settings.json` and `~/.claude/settings.local.json`. Those two paths sit in this
  session sandbox's `denyWithinAllow` list. So `/harden` can write a gate FILE and can never wire
  it, which is exactly why 8 orphaned hooks exist. CAUTION for the next session: an earlier
  append-mode probe (`open(path, "a")`) reported both files WRITABLE, which was a false positive.
  Use `r+` or `os.access`, never append mode, to test write permission here.
- CORRECTION to an earlier line in this file: I first wrote that the sandbox cannot write to the
  main repo's `public/`. The truth is narrower and I re-measured it: creating an empty file there
  via append mode succeeded, while `open(..., "w")`, `mkdir` and `os.unlink` all raise
  `PermissionError [Errno 1]`. Net effect is the same (the page cannot be served from the running
  :3000 dev server) but the reason I first gave was wrong.
- SIDE EFFECT I could not clean up: that probe left a 0-byte file at
  `/Users/sulo/Documents/solen/public/_probe.txt`. `os.unlink` on it is denied from here. It is
  harmless and it is mine; remove it with `rm /Users/sulo/Documents/solen/public/_probe.txt`.

## Atomic asks (from the owner message)

- [x] A1 , DESIGN: 9 topics (colour/tokens, typography, layout/geometry, hierarchy/density,
      motion, states/forms, imagery/icons, navigation, responsive/desktop) = 88 principles.
- [x] A2 , "not only design": 17 more topics across people/fairness, backend, engineering and meta.
- [x] A3 , HOW I OUTPUT STUFF: two independent passes, one research agent (9 findings) and the
      orchestrator's own list written after reading the whole reporting doctrine (14 findings),
      deliberately kept separate so the overlap is visible.
- [x] A4 , BACKEND SECURITY: authz/RLS, input/injection/abuse, secrets/webhooks = 28 principles,
      plus a live database audit by the main thread.
- [x] A5 , "all of em": data/money, API contracts, performance, observability, privacy/Swiss law,
      testing/release, frontend architecture, marketplace trust, SEO/email, the law system itself.
- [x] A6 , grounded: every agent read the existing law first and proved absence with named greps;
      the orchestrator additionally queried the live database, measured three rendered routes,
      and audited git, GitHub and the estate health check.
- [x] A7 , compared outward: WCAG success criteria by number, OWASP, nFADP and GDPR articles,
      Swiss PBV price-indication law, Google Web Vitals, Postgres and Stripe docs, named per finding.
- [x] A8 , multi-hour, in waves: 12 agents in 3 waves, then 14 in 5 waves, then 3 judges. About
      3 hours 15 minutes wall clock.
- [x] A9 , one concrete list in full detail: the served page, plus the raw corpus in the repo.
- [x] A10 , plain English in chat, with what to add.
- [x] A11 , 276 items against a target of 100, 227 of them verified against real code or live data.
- [x] A12 , 29 subagents total (26 research + 3 judges).
- [x] A13 , opinion subagents: three opus judges, deliberately given conflicting jobs so they
      would disagree (rank it, attack it, find what it missed).

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

- [x] W1 , design-side domains (12 read-only research agents, waves of 4) , workflow wf_5c2874cc-402
- [x] W2 , backend/security/process domains (14 read-only research agents, waves of 3) , workflow wf_b4c59297-4d3
- [x] W2b , ORCHESTRATOR's own live verification (not delegated): live Supabase reads, live rendered-page
      measurement, git branch audit, estate health check. Written to the scratchpad as
      `_orchestrator-live-verification.md`. This pass CORRECTED one agent CRITICAL (a migration-file
      truth presented as a live truth) and produced the run's headline finding (the design floors are
      enforced on mockups and never on the shipped page: `/de` 4.4% imagery, `/de/basel` 0.0%).
- [x] W3 , judgment panel (3 opus judges: adopt-first ranking, adversarial cull, completeness critic)
- [x] W4 , build the visual deliverable page + serve
- [x] W5 , plain-English close in chat

## Findings from the run itself (things only the orchestrator could see)

- [x] The cloudflare tunnel CANNOT be established in this environment. Measured, not guessed:
      cloudflared's own connectivity pre-check reports UDP 7844 and TCP 7844 both blocked to
      region1 and region2 argotunnel, so every quick tunnel dies at "Failed to dial a quic
      connection". Delivery therefore uses the local static server plus the file itself.
      Global rule 0.5 (always a tunnel link) has no way to be satisfied here today.
- [x] The dev server on :3000 serves the MAIN repo's `public/`, not this worktree's. A file written
      to the worktree 500s. Confirms the known serve-dir-mismatch trap; the deliverable is served
      from a writable directory on :3210 instead.

## Final numbers (verified)

- 276 findings from 26 research topics + 20 net-new principles from judge 3 = **296 principles**.
- 21 critical, 94 high, 111 medium, 50 low across the research set. 227 of 276 tiered `verified`.
- Judge 1: 19 do-now, 24 do-next, 20 deferrals each with the number that makes them due.
- Judge 2: 15 cut, 16 downgraded, 10 merge clusters, recommended absorption rate 12 to 18 now.
- Judge 3: 9 structural blind spots + 20 principles no domain agent could have found.
- 29 subagents, 5,637,655 subagent tokens, about 3h20m wall clock.
- THREE agent findings were wrong on mechanism or liveness and were corrected by live checks
  (reviews RLS, amenity fabrication, email locale). All three are published on the page rather
  than deleted.

## Unplanned additions

- Parked for the owner: whether to arm the six unwired gates (one of them, `no-decorative-image-gate.py`,
  is cited in CLAUDE.md as if it were live). Needs a non-sandboxed shell to edit settings.
- Parked for the owner: the 40 unmerged branches / 1,686 unmerged commits. Not this turn's job to
  merge, but two systems recorded as SHIPPED live only there.
