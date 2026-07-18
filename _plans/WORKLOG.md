# WORKLOG , plain-English record of what got done, per session

The newest entry is at the top. Every session that ships real work adds one entry here, in plain English (what + why), so a future session (or you, weeks later) can tell what happened without reading code or git. Surfaced automatically at the start of every session by `.claude/hooks/worklog.py`.

---

## 2026-07-18 , weekly estate self-audit run (workstream #17 LAW, standing loop)

**What you asked for (auto-triggered):** the weekly self-audit doctrine (system health, skip ledger, injection diet, mistake themes, lessons-inject verify, design-suggest refresh, doc-vs-gate reconciliation), owner-sanctioned 2026-07-10.

**What got done:** [SELF_AUDIT_2026-07-18.md](SELF_AUDIT_2026-07-18.md) written. Health check reported 16 violations, one is a **real hook orphan** (`flag-instead-of-fix-gate.py`, exists but unwired), one is a **health-check bug** (the "missing" tunnel-health-preflight is present; `expanduser` silently no-ops when `~` sits mid-command) with a one-line fix and repro , parked because Edit hit a sensitive-file guard on `~/.claude/hooks/system-health-check.py`; the other 14 are report-only stale flags + 3 already-known phantom `mcp__Claude_Preview__` strings in `browser-verify-gate.sh`. Injection diet holds across trivial / heavy / brand shapes (peak 5.2KB total, top hook 1.6KB). Two prior dead-law gates (`finish-autonomously`, `batch-items`) dropped skip rate sharply this week (27→6, 25→8); `plan-first` still #1 at 24. Lessons-ledger-inject fires correctly on 4/4 code-path entries of the newest 5 (the 5th is a plan-file entry, N/A by design). Design-suggest gather+record refresh appended a 2026-07-18 block to [`_design-system/SUGGESTIONS.md`](../_design-system/SUGGESTIONS.md) (no chips). DOC-VS-GATE reconciliation surfaced 10 missing hexes from `ALLOWED_HEX` and 4 missing entries in `RETIRED_TOKENS` vs LOCKFILE §1 in `.claude/skills/solen-drift-check/scripts/check.py` (product code, park for owner). No phantom gate names cited in `_design-system/*.md`. Commit touches `_plans` + `_design-system/SUGGESTIONS.md` only.

---

## 2026-07-16 (night) , picks round 2 applied + the full-bleed exploration + the honest overhaul verdict

**What you asked for:** close the C's (C3 undecided), G1 current, G2 grid-for-search carousel-for-home; define the icon rule's "almost"; you dislike the gray backgrounds; you want full-bleed a lot (not on the confirmation); and is this enough to overhaul the site?

**What got done:** picks logged as dated law; the icon-only exemption set is now a CLOSED 7-item list (no more "almost"); all six probe/explainer pages run white-first chrome (the gray you disliked was my presentation chrome, the product's gray locks stay law until you reopen them by name); a 3-agent workflow ranked where full-bleed earns its place, and fullbleed.html shows the seven moments with fork chips (photo full-bleed is free under your own 80/17 law because photography carries the color; the gradient and green-flood variants are flagged as lock conflicts needing your named yes). The readiness judge's verdict: roughly two-thirds of an overhaul's decisions are settled (the whole component layer); the missing third is page-level composition (rhythm, imagery direction, full-bleed placement) plus C3/C5 and two script sprints; the ordered list is in the plan file. Tunnel restarted (old one died): besides-refer-motels-academy.trycloudflare.com.


## 2026-07-16 (evening) , approved picks APPLIED to real code + the Wrong/Right completion page

**What you asked for:** "okay make it and also make mockups for all of em also for refs page u havent made mockup for all".

**What got done:**
1. **Applied (coder + read-only reviewer, PASS on all items):** P7, the setup banner now shows the whole plan with the approved checklist language (green check done, ink-filled current, outline upcoming) at 5e87f6f01; P12, the bell was dead wiring (salonId was hardcoded undefined) and now opens an in-place activity stack reading the same source as the activity card (835421ff1); P13, search suggestions now group under Salons and Services headers with the matched letters highlighted and an honest three-dot loader (fa4a482ee). Rendered proof for the dashboard pair captured live.
2. **P1 honestly blocked:** the revenue number never changes after load (one fetch, week hardcoded), so there is nothing to animate; a Woche/Monat toggle would be its own feature call, parked for the owner.
3. **round2-rules.html:** Wrong/Right mockups for every round-2 rule that had none, plus the missing refs probes (P17 interactive, C1/C2/C4 rendered A/B, G1 richness dial, G2 layout toggle).
4. Reviewer's out-of-scope catch chipped: staff users get a silent 403 from the activity-feed endpoint (pre-existing), task_8ac7442c.


## 2026-07-16 (later) , the probes moved INTO actual pages: hub + 5 integrated tappable mockups

**What you asked for:** "what abt mockups for the round 2" + "i want to see each one in acc pages like mockup that preview... integrated and tappable".

**What got done:** public/_mockups/taste-round2/ with a hub and five page-level mockups on REAL bases: the live dashboard capture with tappable overlays (rolling revenue, expanding setup checklist, in-place notification stack, approve-collapse with undo, dashed proposed tips panel), the bookings list rebuilt 1:1 from the real BookingCard (hero next-appointment + cascade), the pay step from the real commit-button recipe (CTA carries the amount, voucher rolls the total, the mute disabled button explains itself, email validates on blur), search opening over the live home capture (grouped results, match highlight, named availability wait), and the two judge-flagged generative probes (three richness levels side by side, list/grid/carousel toggle) using real salon names and real photo crops. Probes with no live surface to sit in are listed on the hub with the honest reason (loyalty page is coming-soon, no working-hours UI, no long-running jobs). Every interaction JS-verified; gemini alignment catches fixed and re-measured.


## 2026-07-16 , taste round 2: RATIONALE deep-mechanics layer + your 30 references captured, forked, and turned into a probe page

**What you asked for:** fix + commit; expand the rationale file with the og round-1 text and the round-2 digest from another AI; give an opinion; capture the ~30 X reference links with the ss pipeline instead of eyeballing; run opus sub-agents for more ideas; make mockups from the references with the "which part did you like" forks named.

**What got done:**
1. **Both parked calendar fixes applied** (06ea0b14b): week label reads "13. bis 19. Juli" per your approved panel; an unassigned slot shows the existing anyStaff copy instead of an empty line after the staff label.
2. **RATIONALE.md round 2 landed**: 13 new domains (epistemics, signifiers/cognition, depth+light, Radix token grammar, states+feedback, forms, icons, data display, typographic craft, composition+Swiss lineage, voice/tone, ethics, i18n deltas), BOUNDARY field added to the entry template, 6 new folklore rows. Two opus judges shaped it; their kill-list (RTL/CJK, deep data-viz, ISO 9186 depth) was honored, and their converged verdict is recorded as the section-28 gap register: the stack GRADES well but does not GENERATE (richness has no mechanics), and the floors are prose, not computed scripts.
3. **All 30 X references captured** (photos + motion frames + manifest), measured by 4 analysis agents, persisted to research/TASTE_REFS_2026-07.md.
4. **The taste-refs probe page built and verified** (31/31 images render): 17 fork probes applied to real-token Solen snippets + 5 explicit lock-conflict cards (per-category color, colored CTAs, selected states, color heroes, and THE question: staging taste vs product taste). Nothing ships without your picks.
5. Gate friction fixed honestly along the way: taste-refs added to the resurrection-gate exclude list (elicitation pages discuss treatments by design) after a blur(0px)+star-token false positive.


## 2026-07-15 (late) , wave-1 fixes APPLIED to real code: 14 commits, reviewer-checked, rendered proof

**What you asked for:** "all approved" on the 17 before/after pairs, then "ok" = apply. Also: confirm the salon-card changes are committed-but-unmerged (they are: SalonCard rewrite on the animation branch, 89/193 lines vs main, worktree clean).

**What got done:**
1. **12 safe fixes applied, one commit each** (R3 Live ink+dot 156ed1258, R5 footer case e273a965d, C3 calendar dashes b6dce7d73, C2 gray segments 0dcf5c2cd, D2 dashboard caps bafeaa87a, D3 setup dash 2e208ec74, C1 staff swatches 9418b43e6, S1 FAQ grouped card 31865b262, S3 44px targets 578e3900d, P1 price bold b00dbae68, P2 pill convergence a0b4559b7, P3 product placeholder f852377d7, D4 KPI ranking bba7ac173). S2 = not-a-bug (input already bordered).
2. **Loop-reviewer graded the batch**: 1 real catch (dynamic Tailwind classes in the new C1 header would silently never compile) fixed in ac765031c with grep proof; 4 non-blocking notes parked (range copy "bis" vs hyphen, empty staff fallback, D4 tile deviation, stale outer prop).
3. **Rendered proof**: calendar AFTER capture shows hyphen date range, non-blue Woche, solid initialed swatches.
4. **Deferred by design**: R1/R2/R4 live inside SalonCard.tsx whose owner-approved rewrite (CARD_REDESIGN_2026-07-13) sits unmerged; they apply after the merge chip (task_c132841a). Payment-step capture stays with its chip.


## 2026-07-15 (later) , taste diagnosis layer: real-source research, diagnosis skill, resurrection gate wired live

**What you asked for (dictated):** "it really doesn't grasp what's bad when I say this is bad"; research hierarchy/typography/grouping from REAL sites (Wikipedia/UI-UX sources) instead of hallucinating; fix the bento-box grouping confusion; more measured catches like the grey/blue one; kill the source-code residue; don't duplicate.

**What got done:**
1. **Resurrection gate WIRED + live-fire proven** (commit abec60603): a real Write of the rose-badge content was blocked by the running hook; clean writes pass. REJECTED_TREATMENTS.json is the extend-on-every-rejection signature file.
2. **6 web-research reports** (all URL-sourced: NN/g, Wikipedia, Butterick, Material, Baymard, W3C, Carbon/Nord) persisted to _design-system/research/TASTE_*.md. Honest drops recorded: Z-pattern is unverifiable folklore; no channel-strength ranking exists.
3. **RATIONALE.md extended** (domains 1/4/5 + folklore table): scanning patterns (F = failure mode, layer-cake = target, squint test), typography floors (max 3 sizes, 30-50 percent dominance jumps, space-above > below, max 2 stacked treatments), the grouping/bento decision tree (peers vs facets; stopping-point + cards-in-cards anti-patterns).
4. **solen-taste-diagnosis skill** built + registered live: "this is bad" now triggers a measured walk producing named violations with numbers + sources + severity. Wired: CLAUDE.md binary-trigger row, fable-frontend step 1.5, memory.
5. **First applications chipped:** dashboard audit (task_d48f79d5) + payment audit (task_400fe4c2), report-only, one click each.

**Also this session (earlier):** RATIONALE.md v1 + 45-block retrofit; Taste Lab round 1 (5 axes settled, owner picks logged); Taste Lab program registered (9 rounds); mockup badges removed after the owner rejected the resurrected rose tag.


## 2026-07-15 , taste rationale layer: research grounded, RATIONALE.md draft v1, taste-lab mockup, owner questions

**What you asked for:** you delivered an 8-domain design-decision research digest (perception, color, contrast, typography, spacing/shape, motion, aesthetic theory, rationale articulation) and asked to redefine the taste system's rationale layer on top of it, plus my opinion on what to add beyond it, plus questions and mockups to define more.

**What got done:**
1. **Stack inventory (6 read agents):** LOCKFILE's ~93 locked rules classified: 51 percent BARE (no recorded why), 4 percent mechanics-class; the 12 most load-bearing BARE rules listed. SOURCE.md mapped against the 8 domains (perception/aesthetics/articulation uncovered; contrast covered WCAG-only). All 6 candidate probe axes verified UNSETTLED against TASTE_LOG/QUESTIONS/REMOVED.
2. **_design-system/RATIONALE.md DRAFT v1:** the mechanics layer. Evidence tiers reuse PSYCHOLOGY.md's T1/T2/T3 + CONV + MYTH. FORCES/SACRIFICES entry template, 8 domain sections each backlinked to the LOCKFILE rules they ground, measured WCAG+APCA table for live tokens (found: blue on sunken 4.17:1 FAILS AA; green status text 3.30:1), design folklore table (golden ratio, Miller 7+/-2, fabricated Lin 2004, 60-30-10, plus in-house unsourced numbers flagged), 12-rule retrofit queue, documented-departures record (420ms enter, no-focus-ring override).
3. **Taste-lab mockup** (public/_mockups/taste-lab/index.html, tunnel-served): 5 probes with side-by-side variants on real SalonCard replicas + live tokens: corner curvature (squircle via superellipse clip-path), optical corrections, contrast retune vs document, 68ch measure cap, web-dark teaser with the shipped mobile darkColors. Coder built, loop-reviewer graded (round 1: one hex-token finding, fixed, re-verified rendered).
4. **Owner questions asked:** rationale location, retrofit scope, extra domains, template weight; probe picks via the lab page.

**Parked:** discount-badge memory-vs-code contradiction (pale-green memory vs live rose); spring double-definition; icon stroke inconsistency. All in _plans/TASTE_RATIONALE.md.


## 2026-07-11 , weekly estate self-audit: estate healthy, 3 dead-law gates + 5 drift-gate divergences found

**What you asked for:** the standing weekly self-audit (owner-sanctioned 2026-07-10): health-check, skip-flag ledger, hook injection sizes, mistake themes, lessons-ledger parse test, design-suggest gather, doc-vs-gate reconciliation, then report + commit _plans.

**What got done:**
1. **Health check clean:** system-health-check.py = 0 violations across all 5 sections. Injection diets all hold (largest repeat payload 420B). Mistake themes: none at warning tier. Lessons-ledger injection: all 5 newest entries fire correctly on a matching Edit payload, negative control silent.
2. **Skip-flag ledger is the red flag:** 3 gates are effectively dead law , plan-first (45 skips, accelerating), finish-autonomously (27 across 5 sessions), batch-items (25 across 8 sessions, and that one guards your #1 complaint, dropped sub-asks). Parked as an owner decision: raise the skip cost (logged reason + shorter TTL) or retire honestly.
3. **Doc-vs-gate reconciliation found 5 literal divergences** between the drift checker (solen-drift-check check.py) and LOCKFILE sections 1-4. Top two: `s-pop` is still in RETIRED_TOKENS though LOCKFILE un-retired it 2026-06-02 (gate blocks legitimate urgency badges), and ALLOWED_HEX whitelists a transposed `#F5F5F4` while the real sunken token `#F4F4F5` is absent (wrong hex passes, right hex flags). Zero phantom gate names in design-doc prose. Fixes are 2 lines in check.py but that file is outside this audit's write scope, parked with exact lines + self-test recipe.
4. **SUGGESTIONS.md seeded** (first run of the design-suggest record step): 6 verified S-effort suggestions (partner-page uppercase eyebrows x9, pay-step opacity hairlines x4, ink "Mehr lesen", 36px search touch targets, booking-action dead-end page, haptics leftover). One stale audit item caught and dropped: the pay-step star gating is already fixed in code. No chips emitted (audit cadence defers to this report).

**Report:** _plans/SELF_AUDIT_2026-07-11.md (prioritized fix list at the bottom). ACTIVE.md row 17 (LAW) added. No product code touched; nothing in ~/.claude/hooks needed fixing.

## 2026-07-08 , context-collapse system: doctrine, hook injection diet, budget nudge, law-file drafts

**What you asked for:** the usage insights showed 64% of spend at >150k context. You wanted the full structure/philosophy for managing and collapsing context (when and how: /clear, /compact, auto hooks), plus actually fixing the bloated files and unnecessary standing context. Mid-run you added: bulk multi-topic messages must not mean /clear per topic.

**What got done:**
1. **Doctrine** at ~/.claude/CONTEXT_SYSTEM.md: cost model (baseline + working set + sediment), budget tiers (70k/120k/150k), the three collapse triggers (topic switch = /clear after the persist ritual; phase boundary = /compact with focus hint; big dump just landed = extract then compact), the persist-then-flush ritual, keep-out rules (bulk reads/DB/reports stay in subagents + files), maintenance cadence. Amended same day with your bulk-batch exception: a multi-topic bulk message is ONE working set: atomize, finish, collapse once at the end, never /clear mid-batch.
2. **Hook injection diet** (coder + read-only reviewer, PASS): multi-ask, quiet-work, workstreams-pointer inject full text once per session then a one-liner; devils-advocate and fable-skill-trigger go silent on repeats (per category). Saves roughly 3-5KB per message on long sessions.
3. **Context-budget nudge** inside plan-active-prompt.py: estimates tokens from the transcript (compact-boundary aware), fires once per session at ~120k and ~150k telling the session to propose the right collapse. Fired live the same day at 134k, proving itself.
4. **Bloat fixes:** WORKLOG session-start excerpt trimmed to 2 newest entries / 2500 chars; session-marker-sweep now also prunes 10 per-session state-file families at 48h (12 stale files removed on first run; durable families like mistake-themes deliberately excluded).
5. **Law-file compression DRAFTS** (originals untouched, swap = owner decision): ~/.claude/CLAUDE.compact-draft.md (24.0KB -> 13.2KB, 45%) and _plans/CLAUDE_MD_COMPACT_DRAFT.md (22.8KB -> 19.6KB, only 12%: the locked tables + literals are 22% of the file and must stay verbatim). Adversarial parity review found 3 small losses; all 3 re-added (eyebrows in the blue-ban list, anti-patterns pointer, size placeholder).

**Not done / owner's court:** plugin prune (safe local offs: clangd-lsp, jdtls-lsp, huggingface-skills, zilliz via /plugin; the big catalog weight is claude.ai account-level), draft swap decision, memory consolidation (you rejected the 97-file audit dispatch mid-run; not relaunching without your yes). All recorded in _plans/CONTEXT_COLLAPSE.md.

## 2026-07-07 (later) , orchestrator upgrade: five gates, devil's advocate, model routing, Fable DNA

**What you asked for:** the five-gates work discipline (scope / evidence / adversarial / verify / report), a devil's advocate pass before dispatching subagents, smarter model routing (Opus 4.8 for human-eye and big decisions, Sonnet for code, Haiku 4.5 for reading , researched, not guessed), optimizing dynamic workflows, and extracting Fable's working method before access to it ends. Plus (earlier in the day) enforced rules: don't trust memory, check things exist, own mistakes without apology spirals.

**What I actually did:**
1. **The five gates** are now the canon in the fable-execution skill (section 7.5), written from your dictation: define done + the check before working; evidence before reasoning (cheapest probe first, thin end-to-end pass, two failed fixes = wrong diagnosis); reason adversarially (premortem, kill-your-own-answer, steelman); verify before done (evidence you didn't generate, sample first/last/weirdest, treat good news as suspect); report calibrated (verified vs assumed, cite file:line, never soften a real problem).
2. **Devil's advocate hook** (~/.claude/hooks/devils-advocate.py): on build/dispatch-shaped prompts it forces the premortem , top 3 concrete risks, load-bearing unknowns + cheapest probes, out-of-scope , BEFORE subagents go. Self-tested 4 cases.
3. **Model routing** (~/.claude/MODEL_ROUTING.md): verified lineup (Opus 4.8 $5/$25, Sonnet 5 $3/$15, Haiku 4.5 $1/$5) and a 6-step checklist: orchestrator = Fable then Opus 4.8; human-eye/taste + big decisions = Opus 4.8 (1-3 judges); code written/reviewed/researched = Sonnet 5; reading/mechanical = Haiku 4.5. The old blanket "no opus subagents" gate became a routing gate (opus allowed only for judgment-class dispatches). Self-tested 11 cases. This SUPERSEDES the 2026-06-30 ban, per your 2026-07-07 dictation.
4. **Fable DNA** (~/.claude/FABLE_DNA.md): mined the 3 biggest recent session transcripts with delegated readers + self-distilled , 34 working patterns with real quotes (retract claims on contradiction, instrument-then-remove-the-tap, distrust your own verification tooling, playback-lock, failure autopsies). Pointers added from the fable skills so the next orchestrator inherits it.
5. **Earlier same day:** rules 15-19 (reality over memory incl. unsourced-stat gate, mention is not existence, one-line mistake ownership, contradiction surfacing, post-compaction re-verify) with 4 self-tested hooks; plus a dogfood fix when the stat gate trapped its own description.

**Why it matters:** the orchestrator's method now lives in gates, checklists, and a pattern library that survive model swaps and context packing , not in Fable's memory.

**Not done / next:** nothing open in this batch. The psychology audit's 20 high-severity fixes (earlier entry) remain queued.

## 2026-07-07 , UX-psychology system + enforcement

**What you asked for:** watch a UX-psychology video, research the topic deeply, audit Solen against it, fold it into the design system, and make it stick (a skill + hooks) so it is not just a doc that gets forgotten.

**What I actually did, in order:**
1. **Watched the video** (uxpeak, "The UX Psychology Behind Apps People Can't Stop Using"). Pulled its transcript and 87 still frames. It teaches 6 principles (smart defaults, endowed progress, value-before-signup, IKEA effect, loss aversion, price anchoring).
2. **Fact-checked the video's numbers** with 8 skeptic agents. Found its mechanisms are real but 4 of its headline stats are fake or inflated (e.g. "free samples = +2,000%" has no real source). Recorded the real numbers instead.
3. **Ran 4 research fleets** (80 web-researchers total, 586 findings) on user psychology, conversion, retention, and business impact. Each topic got a ranked summary + a "myth-check" of numbers not to trust. Files: `_design-system/research/PSYCH_*.md`.
4. **Wrote the law file** `_design-system/PSYCHOLOGY.md`: 15 behavioral laws, each tagged by how strong the evidence is, plus hard ethics lines and a table of numbers we must never cite. This is the "textbook" the system reasons from.
5. **Audited all 12 customer screens** against those 15 laws, then had a separate agent re-check every finding at file:line. Result: 113 real findings (20 high-priority), e.g. star ratings shown with no review count on 5 screens, a fake "14 Salons" count on the homepage. Files: `_design-system/research/PSYCH_AUDIT_2026-07-07.md` + `AUDIT_CHANGELIST_2026-07-07.md`. Nothing was changed in the app , these are queued, visual ones stay mockup-first.
6. **Made it stick (3 enforcement layers):**
   - `fable-psychology` skill + a trigger-hook category: when you say "improve conversion/retention", Claude auto-loads the 15 laws so it reasons WITH them.
   - `.claude/hooks/pre-edit-psychology-gate.py`: a dumb mechanical gate that BLOCKS an edit that renders a star with no count, or hardcodes a count like "14 Salons". It does not think, it pattern-matches, so it works even when Claude forgets.
   - loop-reviewer psychology lens: a fresh-context reviewer checks the judgment-call laws (warm confirmation screen, no fake urgency, etc.) on every UI change.
7. **Fixed a real bug** in `delegate-media-read-gate.py` along the way (it was wrongly blocking subagents from reading images, which stalled the video frames).

**Why it matters:** the laws are no longer advice that gets forgotten as context fills. The checkable ones are a gate that physically blocks the mistake; the judgment ones get a fresh reviewer.

**Not done / next:** the 20 high-severity audit fixes are queued, not applied (the [code] ones can ship via the loop, the [mockup] ones need your sign-off first).
