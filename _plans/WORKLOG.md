# WORKLOG , plain-English record of what got done, per session

The newest entry is at the top. Every session that ships real work adds one entry here, in plain English (what + why), so a future session (or you, weeks later) can tell what happened without reading code or git. Surfaced automatically at the start of every session by `.claude/hooks/worklog.py`.

---

## 2026-07-12 , design-system consolidation: web canon solidified, mobile canon created, 17 contradictions killed

**What you asked for:** "solidify the design system... web first, then the app... actually think and add many stuff... do this or don't, not do this or that... find inconsistency, everything."

**What got done:**
1. **Found a whole day of YOUR approved design law stranded on an unmerged branch** (the 2026-07-10 CANON fold + design-governance audit + TASTE_LOG fixes + drift-gate blue-law rewrite never reached main). Revived it (80691b351) instead of re-deriving.
2. **17 doc-vs-doc contradictions found and resolved decisively** (43b4f7a99), always the latest dated decision: code font Inter Tight tabular (not JetBrains), blue = hyperlink-scope only (chips/buttons removed from CLAUDE.md's allowed list), input radius 12 (your 2026-06-08 call; 3 docs said 16), ONE red #DC2626 for error+closed (code-verified; docs said two reds), urgency #C2410C, accent hover #1E54B7, tab-active gray, s-pop un-retired note, styleguide hex fixes. 7 leads checked clean.
3. **Drift gate reconciled with the law** (3 live divergences fixed + block/pass self-tested; 100ms registered from code reality with revert path noted).
4. **Registry + component docs to code truth**: StatusPill tombstone, Toast/FilterSheet docs rewritten to shipped recipes, 16 new registry rows, 5 new component docs, SalonCard transposed hex fixed. Reviewer caught the round-1 coder FABRICATING call-sites (8 fake Modal call-sites); round 2 re-grepped everything, PASS 7/7.
5. **Mobile canon created**: THEMING.md canonized (the never-built MOBILE_LOCKFILE), 26-row token tables code-verified, 4 internal contradictions resolved, web-vs-app parity table (7 deliberate, 4 accidental-open), 7 derived gap rules. Reviewer 10/11 round 1, punch fixed. solen-mobile fd6fa2d.
6. **6 regressed drift classes + census** -> 7 chips emitted (token sweep, radius, CardName 14px, SearchOverlay V3-D445, shadows, press-scale, mobile ErrorState).

**Report:** _design-system/CONSOLIDATION_2026-07-12.md. **Open for you (report §5):** BackButton 40px vs the 44px floor; disabled-opacity 40 vs 50; mobile selected-state ink vs web gray; 100ms duration registered (revertible); notification badge red vs ink (standing).

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
