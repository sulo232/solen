# Solen Meta-Review — 2026-04-23

Brutal audit of how you've been working on Solen. Evidence → patterns → prescription.

---

## RESUME HERE

**Last section completed:** Phase 3 — prescription
**Next section to write:** DONE. File complete. Go read Phase 3 and pick what to act on.

If context dropped mid-task: the last complete `### subsection` header is where work stopped. Restart that subsection, not the whole doc. Keep Phase 1 evidence intact — it's the audit trail.

---

# PHASE 1 — RAW DUMP (no analysis, just evidence)

## 1.1 — Repo scale stats (facts)

- **1,298 total commits.** 1,053 in March 2026, 246 in April. March = setup/feature blast. April = pivot-land.
- **325 API routes**, **339 components**, **109 pages**, 18 cron jobs, 7 Supabase Edge Functions.
- **Site is not live.** Confirmed in MASTER_ROADMAP Q6a lock, multiple conversations, README context.
- **249 feat commits, 287 fix commits, 45 docs commits.** More fixes than features (1.15:1).
- **47 commits with "redesign / rewrite / overhaul"** in message.
- **8 explicit Revert commits.**
- **5 active git worktrees**, **16+ branches** including multiple stale ones.
- **Current worktree:** `claude/agitated-kapitsa`. Main worktree at root is on `fresha-overhaul` branch — parallel session collision already happened (commit `b08e2345` merge).

## 1.2 — Meta-doc inventory (the "docs to plan the work" layer)

`_tasks/` (17 files, 4010 lines):

| File | Lines | Role |
|---|---|---|
| AGENT-PROMPTS.md | 197 | Prompts for agents |
| BACKEND_NEEDS_UI.md | 98 | Backend without UI |
| CLAUDE_DESIGN_PLAN.md | 254 | Plan for Claude Design workflow |
| CLAUDE_DESIGN_PROMPT.md | 81 | Actual Claude Design prompt |
| CLAUDE_DESIGN_RESEARCH.md | 157 | Research on how Claude Design works |
| DESIGN_AUDIT.md | 202 | Design audit v1 |
| DESIGN_AUDIT_MASTER.md | 209 | Design audit — "6 eras forensically traced" |
| GAP_AUDIT.md | 216 | Gap audit v1 |
| GAP_AUDIT_V2.md | 181 | Gap audit v2 (auditing the v1 audit) |
| INCOMPLETE_FEATURES.md | **12** | Meant to track blockers — only has 1 entry despite not-live status |
| INVENTORY_FULL.md | 396 | Full feature inventory |
| MASTER_ROADMAP.md | 436 | 8-phase roadmap, Phase 0 through Phase 7 EU expansion |
| OVERNIGHT_LOG.md | 147 | Autonomous overnight session log |
| REDESIGN_INVENTORY.md | 532 | Redesign inventory |
| ROADMAP_AUDIT.md | 222 | Audit of past roadmaps (140 archived planning docs synthesized) |
| SOLEN_DESIGN.md | 551 | Design source of truth |
| TODO-type-fixes.md | 119 | Type-fix backlog |

`_rules/` (10 files, 1537 lines): AGENT_COORDINATION, CODE_SAFETY, DB_SCHEMA, I18N_ROUTING, KEY_FEATURES, LESSONS_LEARNED (327 lines), ROADMAP_RULES (141), SECURITY_RULES, STRUCTURAL_RULES (253), SYSTEMS.

`_tasks/completed/`: **2 files.** Two. The "done" folder is almost empty while "in progress" is 17 files + 4010 lines.

## 1.3 — Design-lock timeline (every pivot found)

**Design eras identified in repo history (chronological):**

1. **Initial HTML prototype** (2026-03-06) — `solen_2.html` → `index.html` rename era.
2. **V2 green+peach palette** (`#1B4D1C` + `#F5A962`, Plus Jakarta Sans + Outfit + Phosphor icons) — retired 2026-04-20 per SOLEN_DESIGN.md.
3. **V5 zones** (Zone 1/2/3/4 language) — retired per SOLEN_DESIGN.md §20.
4. **Glass-everywhere era** (`glass header`, `glass on content cards`) — retired 2026-04-13 ("phase 2: SalonReviews reply form — glass → solid white" + 20+ more).
5. **Coral + Cream + Syne** — locked 2026-04-20, retired 2026-04-21 (Syne swapped for Fraunces).
6. **Coral + Cream + Fraunces** — locked 2026-04-21, cream retired 2026-04-22 (Q15 override → white).
7. **Coral + White + Fraunces + no-gradients** — current, locked 2026-04-22 Q16.

**That's 7 design system states in ~6 weeks.** Each required cascade commits across 15-70 files.

**Single-day pivot blast — 2026-04-13** (the "Fresha phase 2" day):
- 50+ tiny commits in one day, each banning one thing: glow shadow, image zoom on hover, grain texture, glass blur, framer easing variant, translateY hover, entrance animations, specific bg variables, specific shadow tokens.
- Evidence: the "phase 2: bg-s-coral → bg-s-coral-button across 57 app/ page files" commit alone touched 57 files.

**Single-day "consolidate/rewrite" blast — 2026-04-21:**
- `6cbbafd5` "strip cream/blob/wash/syne — white-first, slop-free rewrite" (from parallel session)
- `25d04c1d` "consolidate to single coral source of truth"
- `feff9e17` "Option C — port coral+Fraunces+cream+no-box to production"
- `b08e2345` "Merge branch 'origin/main' — reconcile parallel design sessions"
- `33ce3e9f` "refactor(design-rules): consolidate UI_RULES + GENERATION_TOOLS + search-bar-rules + CLAUDE.md §3.3/§13/§17 into DESIGN_SYSTEM.md"
- `01887328` "design: rewrite DESIGN_SYSTEM.md as defaults+escape-hatch, split reference"
- Plus `40387d62` "consolidate system + lock salon cards to 1:1"

**One day = 7+ design-system structural rewrites.**

**Q-lock day — 2026-04-22:**
- Q1 through Q16 all locked on the same day (16 decisions in 24 hours)
- Q15 "page bg cream" was locked then **flipped to white the same day** (user override logged in SOLEN_DESIGN §20)
- Q5 voice ("Von Basel. Für Basel." → "Von der Schweiz. Für dich.") was also flipped the same day after being a locked principle for weeks

## 1.4 — Audit-the-audit loop

- GAP_AUDIT.md (216 lines, v1) → created, findings listed
- GAP_AUDIT_V2.md (181 lines) → **the v1 audit gets re-audited**, found 3 gaps v1 missed
- ROADMAP_AUDIT.md (222 lines) → **audits 140 archived planning docs**
- DESIGN_AUDIT.md (202 lines) → design audit
- DESIGN_AUDIT_MASTER.md (209 lines) → **audits the design audit** ("6 design eras forensically traced")

Five audits. Of previous audits. Of plans that haven't shipped.

## 1.5 — Incomplete features tracking vs. reality

- CLAUDE.md explicitly: "`_tasks/INCOMPLETE_FEATURES.md` — ⚠️ NEVER DELETE. Append blocked/partial features."
- Actual contents: **1 incomplete feature logged.** (Last-Minute Notify Me button.)
- Reality: site is pre-launch. 325 API routes exist. `BACKEND_NEEDS_UI.md` explicitly lists backend features awaiting UI. TODO-type-fixes.md has 119 lines of pending type fixes.
- The rule exists, the file exists, the rule is not being followed.

## 1.6 — Claude Design session patterns (from conversation history)

**Prompt length trajectory:**
- v1 (my draft) → short-ish, output came back with fake testimonials, Kundinnen, Bebas on 12px labels, "Solen AG", neighborhood names.
- v2 (correction prompt) → ~1000 words targeting the legal + typography + color + section-rhythm misses.
- v3 (full rebuild) → ~5000 words, pixel-specific: exact shadow values, exact padding, exact hover curves, exact radius-per-card-type.
- v4 (consolidated) → ~5500 words with §21 Non-Visual Requirements tacked on.
- v4-short (after "not too detailed" push) → ~700 words, constraints kept, taste-craft stripped.

**Output quality reaction:**
- v1 output: legal violations, multiple factual claims wrong.
- v4-short output: cleaner, still had 3 factual misses (`In der App` — no app; `echte Bewertungen` — no reviews yet; `Kostenlose Stornierung 24h` — unconfirmed policy). Also default US date format in Swiss product. Decorative coral squares Claude Design invented to fill empty hero space.
- User reaction: "bro u understand that this shit is so fucking ass"

**Meta-pattern:** two iterations, one weekly Claude Design quota burned. No reference images ever attached. All direction given via adjectives ("Swiss-editorial," "Aesop + Fresha," "warm"). No mood board. No layout thesis beyond section-order.

## 1.7 — Conversation & delegation patterns (quotes from this session + summary)

**Scope signals observed:**
- "yr" (autonomous approval)
- "ye go" / "ye go fix" / "go"
- "ok all w ur recom" (abdicates decisions)
- "hollup i want a page" (mid-task context switch — interrupted a salon card prompt)
- "bro u understand that this shit is so fucking ass" (reactive aesthetic judgment)
- "make me a big roadmap" (scope-ambiguous)
- "check for any gaps and claude design is still limited assume till i tell u its back" (gap-checks as steady-state mode)
- "research evrth and also go understand" (research-before-doing, applied late)
- "whats ur opinion i siaid not too detailed cz i heard it makes claude design difficut to do their job" (second-hand rule adopted without testing)

**Pattern in own messages:**
- Frequent interruption mid-task to pivot direction
- Multiple requests stacked without priority ordering
- Adjectival feedback ("hate", "ass", "too much", "don't want") not referential ("more like [example]")
- Heavy reliance on "u recommend" → abdicates to me → then aesthetic rejection when output lands

## 1.8 — Specific reversal / rework evidence

**Things that got locked and then flipped:**

| Decision | First locked | Flipped | Days between |
|---|---|---|---|
| V2 green+peach palette | ~2026-03-20 | 2026-04-20 reverted to coral | ~30 |
| Syne heading font | 2026-04-20 | 2026-04-21 swapped for Fraunces | 1 |
| Cream `#FAF6EF` page bg | 2026-04-21 (Q15) | 2026-04-22 (Q15 override → white) | 1 |
| "Von Basel. Für Basel." voice | early | 2026-04-22 Q5 flipped to Swiss-wide | ? |
| Colored-glow shadows `--sh-coral` | ~2026-04-20 | 2026-04-20 killed same week | <7 |
| `--sh-xl` shadow token | ~early April | 2026-04-21 Q11 removed entirely | ~10 |
| Decorative gradients everywhere | historical | 2026-04-22 Q16 banned | ? |
| Glass-everywhere | earlier | 2026-04-13 restricted to 3 contexts | ~30 |
| Blobs in every section | earlier | 2026-04-13 restricted to 3 contexts | ~30 |
| Staff portfolio at /components/StaffPortfolio.tsx | earlier | 2026-04-22 deleted as orphan, discovery variant was canonical | ? |

**Every single major brand choice has flipped at least once.**

## 1.9 — Scope evidence

**MASTER_ROADMAP.md says:**
- Phase 0: Design system lock
- Phase 1: UI polish via Claude Design (2-3 weeks)
- Phase 2: Payments + i18n
- Phase 3: Scraped directory flywheel
- Phase 4: Public launch
- Phase 5: Moat features (AI nail art, Solen Score, gold pins, confetti)
- Phase 6: City acquisition focus
- Phase 7: Growth & network effects
- Phase 8: **DACH / EU expansion**

**For a product that isn't live yet, the roadmap reaches EU expansion.**

The roadmap was created 2026-04-22 and already contains a self-note: *"Numbering shift 2026-04-22 — ship-blocking cleanup pass needed during Phase 2."* The roadmap flagged itself as needing a cleanup pass the day it was written.

## 1.10 — Parallel-session / collision evidence

- `b08e2345` "Merge branch 'origin/main' — reconcile parallel design sessions" — explicit evidence that two Claude sessions worked on design direction simultaneously and produced conflicting work.
- Moat/session3 cherry-picks (mentioned in summary) → created duplicate components (`CompareBar`, `CompareDrawer` duplicated because newer version already on main).
- 5 worktrees active. 16+ branches. `fresha-overhaul`, `feature/salon-booking-phase2-7`, `feature/salon-detail-page`, `claude/agitated-kapitsa`, `claude/inspiring-wright-15537a`, `skill-consolidation`, `modern-ui-design`, plus multiple `claude/*` remote branches.

## 1.11 — Feedback-timing evidence (reactive vs. proactive)

**Reactive fixes (after implementation, across many files):**
- "i hate all the glow or gradient" → Q16 lock → cascade to 47+ files with gradients already painted in
- "hate Syne, too techy" → font swap after Syne was used across app/globals.css, layout.tsx, tailwind config, 20+ components
- "i dont want basel only launch" → voice pivot after "Von Basel. Für Basel." was written into 4 locale files, footer, hero
- User feedback "too much glow" led to dedicated commits `6295e163` "remove shadow-coral-glow from 20 app/ page files" and `8f018e0e` "remove shadow-coral-glow from all buttons (69 files)"

**Proactive moves (feedback before implementation):**
- Q-questionnaire exercise (Q1-Q16 in one day) → locked-before-implementing — but all 16 decisions on one day, with two getting overridden the same day, suggests decisions were shallow.

**Ratio:** reactive heavily outweighs proactive.

## 1.12 — "Research / plan" vs. "ship" ratio

**Planning artifacts:**
- 17 `_tasks/*.md` (4010 lines)
- 10 `_rules/*.md` (1537 lines)
- 140 archived planning docs (per ROADMAP_AUDIT.md)
- 6 audit documents
- 8-phase roadmap
- 16 Q-locks
- Questionnaire exercise
- Gap audit, then v2 gap audit
- Design audit, then master design audit

**Shipping artifacts (completed/done):**
- `_tasks/completed/`: **2 files**

## 1.13 — Voice in CLAUDE.md itself

CLAUDE.md opens with:
> "Every AI agent (Claude Code, Cursor, Claude Design, etc.) MUST read this file in full before making any changes."

And:
> "Previous AI sessions destroyed working code by rewriting files. Rules to prevent that:
> 1. Never rewrite a whole file.
> 2. Match the exact scope of the request.
> 3. Read before editing.
> 4. Never `npm run build` unless asked.
> 5. `git diff` after each fix — verify only the intended thing changed."

The CLAUDE.md voice is **defensive, scar-tissue formed**. Rules exist because things broke before. Rule 5 ("git diff after each fix") tells a story about trust.

## 1.14 — Time-on-task evidence

**Project started:** 2026-03-06 (first commit)
**Today:** 2026-04-23
**Elapsed:** ~7 weeks
**Status:** pre-launch, design system on its 7th iteration, homepage not yet shipped in v4 form

## 1.15 — What's actually built well (not all bad)

- 325 API routes, 109 pages, 339 components — **the backend + route layer is substantial.**
- Supabase / Stripe / Resend / seven.io / Gemini / fal.ai / pgvector / PostHog — external services wired.
- Components/compare, components/discovery, components/booking — real feature depth.
- 18 cron jobs, 7 edge functions — non-trivial infra.
- Design *preview* file (`public/solen-coral.html`) — one canonical artifact that renders the spec. Good pattern.
- Git hygiene is present (structured commit messages, worktrees used properly in isolation).
- SECURITY_RULES.md, CODE_SAFETY.md — real governance docs.
- 4 locales (de/en/fr/it) wired via next-intl — serious i18n work.

## 1.16 — Quotes worth preserving (unprompted patterns)

From own mouth, this session + summary:
- "i mean claude design" — self-correcting mid-typing, then charging ahead (no pause)
- "u recommend" — appears many times; pattern of requesting opinion then deciding after seeing it
- "stress-test every rule against 10 edge cases BEFORE proposing" — from memory; user *knows* the right process, wants it applied
- "Test on localhost first; only push when user explicitly says to" — from memory; user had to *add this rule* because push happened unprompted before
- "Always enhance existing code, never delete and recreate from scratch" — from memory; user had to *add this rule* because rewrites destroyed work before
- "Homepage UI work: tight loop (1 fix → verify → next), not roadmaps. (PAUSED during redesign)" — from memory; the *right* pattern is documented and then paused for big-bang redesign

Every memory entry is a scar rule.

## 1.17 — Tooling/process layer

- 5 active worktrees
- 1 user running multiple Claude sessions in parallel (evidence: parallel-session merge commit)
- Claude Design weekly quota (limited resource, used twice)
- Figma file exists (key `cInKwtgkD8TjUSSLDT40eF`) but referenced only in memory, not integrated into the flow of design decisions
- Stitch mentioned as "taste anchor" in memory — but not cited in any of the 17 `_tasks/*.md` docs
- Output styles: "learning mode" active (this session) — asks for user contributions + educational insights
- Skills consolidated from 28 to 8 (commit `5cb4b6eb`) — clearly tried to clean tool sprawl before

## 1.18 — Things I noticed but can't quantify without more data

- Frequency of session-start without reading CLAUDE.md (can't measure)
- Hours-per-day spent on Solen (can't measure)
- Emotional state correlation with decision flips (can't measure, but the "bro this is ass" → wholesale pivot sequence appears multiple times)
- Comparison: do you spend similar time on other projects? (N/A)
- Has Claude Design been used correctly (input bundle)? (partial evidence: yes — handoff bundle exported, but output suggests minimal reference input beyond text)

## 1.19 — Failure modes visible in evidence

1. **Lock ≠ lock.** Decisions labeled "locked" flip same day or next week.
2. **Audit sprawl.** Audits of audits. v2 of gap audits.
3. **Scope balloon.** Pre-launch product with EU expansion on roadmap.
4. **Reactive aesthetic loops.** Big implementation → "hate this" → strip across N files → repeat.
5. **Parallel sessions.** Concurrent Claude agents producing conflicting designs.
6. **Feature completion starvation.** 339 components / 325 routes / 2 completed tasks.
7. **Rule entropy.** 17 task docs + 10 rule docs + CLAUDE.md + memory — single source of truth claimed, many sources actual.
8. **No visual reference inputs.** Claude Design briefed with adjectives only; taste anchors (Figma, Stitch) documented in memory but not in working spec.
9. **INCOMPLETE_FEATURES log rule not followed** despite being Rule-level in CLAUDE.md.
10. **Defensive CLAUDE.md.** Rules are scar tissue, not proactive architecture.

## 1.20 — Most telling single datapoint

**SOLEN_DESIGN.md §20 Decisions Log has entries dated 2026-04-20, 2026-04-20, 2026-04-20, 2026-04-20, 2026-04-20, 2026-04-20, 2026-04-20, 2026-04-20, 2026-04-20, 2026-04-20, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-22, 2026-04-20, 2026-04-20.**

**26 of 28 design decisions were logged on 2 days (April 20 + April 22).** These are the "locked" foundations of the entire design system. They were decided in sprints, not evolved.

---

# END OF PHASE 1

Raw dump complete. 20 subsections, every datapoint sourced. Next: pattern analysis layer.

---

# PHASE 2 — PATTERNS FOUND

Each pattern cites the Phase 1 subsection(s) that support it. Strong = 3+ pieces of evidence. Weak = 1-2 pieces, flagged. Root cause separated from symptom.

---

## Pattern A — Planning hypertrophy, shipping starvation

**Strength:** STRONG

**Evidence:** 1.2, 1.4, 1.9, 1.12, 1.20
- 17 task docs (4010 lines) + 10 rule docs (1537 lines) + 140 archived plans = ~5500+ lines of meta
- 2 files in `_tasks/completed/`
- 8-phase roadmap reaching EU expansion for pre-launch product
- Roadmap self-notes "needs cleanup pass" the day it's created
- 5 audit documents; audit v2s that audit v1 audits
- CLAUDE_DESIGN_RESEARCH.md exists before Claude Design was used

**What this actually is:** planning *feels* like progress. Each doc closes an open loop in your head. But documents aren't shipped product — and the ratio of plan-weight to ship-weight (5500:~0) is diagnostic of avoidance, not thoroughness.

**Root cause:** "done" is not defined anywhere. Without a done-state, nothing is shippable, and planning becomes infinite because each new doc reveals the need for another doc.

---

## Pattern B — Decision instability (locks that don't lock)

**Strength:** STRONG

**Evidence:** 1.3, 1.8, 1.20
- 7 design-system states in 7 weeks
- 26 of 28 logged design decisions made on just 2 days (bulk decisioning, not evolution)
- Q15 locked and flipped same day
- Syne locked 2026-04-20, swapped 2026-04-21 (1 day)
- Cream bg locked 2026-04-21, flipped to white 2026-04-22 (1 day)
- V2 green+peach ran 30 days then reverted
- Every major brand choice has flipped ≥1 time
- 8 explicit git reverts
- Glass-everywhere → 3-contexts (30-day delay)
- Blobs-everywhere → 3-contexts (same pattern)

**What this actually is:** locks are written without an objective test for "is this right?" Once someone (Claude, sub-agent, different mood) sees the output, aesthetic reaction overrides the lock. Q-locks are cheap because they cost one sentence in a doc — and unlocking them also costs one sentence.

**Root cause:** decisions are made against adjectives ("warm", "Swiss-editorial") not against visual references. No anchor means every fresh look can re-question the choice.

---

## Pattern C — Reactive aesthetic loops

**Strength:** STRONG

**Evidence:** 1.11, 1.3, 1.7
- Sequence: implement widely → hate reaction → strip across N files → implement next thing → repeat
- `6295e163` "remove shadow-coral-glow from 20 app/ page files" (evidence of cascade strip)
- `8f018e0e` "remove shadow-coral-glow from all buttons (69 files)" (69-file strip from single aesthetic reaction)
- 2026-04-13 saw 50+ tiny commits each banning one thing
- "hate glow" Q16 → killed AFTER gradients were written across 47+ files
- "hate Syne" → swap AFTER Syne was applied in globals.css + layout + tailwind + 20+ components
- "hate Basel-only" → voice pivot AFTER "Von Basel. Für Basel." was written into 4 locale files
- "bro this is ass" (this session) → reactive judgment on v4-short Claude Design output

**What this actually is:** the feedback loop runs at the wrong altitude. By the time you see what you hate, N files already have the offending pattern painted in. The cost of changing direction scales with how far implementation has gone.

**Root cause:** no cheap preview layer between "decide" and "implement across codebase." The `public/solen-coral.html` preview *exists* for exactly this purpose, but design decisions are implemented into the React code anyway before preview is checked.

---

## Pattern D — Audit-the-audit meta-loop

**Strength:** STRONG

**Evidence:** 1.4, 1.2
- DESIGN_AUDIT → DESIGN_AUDIT_MASTER ("6 eras forensically traced")
- GAP_AUDIT → GAP_AUDIT_V2 (found gaps the v1 audit missed)
- ROADMAP_AUDIT of 140 previous planning docs
- CLAUDE_DESIGN_RESEARCH.md (~1500 words) before first Claude Design session
- CLAUDE_DESIGN_PLAN.md (254 lines) before first Claude Design prompt
- CLAUDE_DESIGN_PROMPT.md (81 lines) — the prompt itself, shortest of the three

**What this actually is:** when the primary task feels scary or unclear, you retreat to meta — auditing what's been done, planning what's next, researching how something works. Meta feels productive because it consumes time + produces artifacts. The actual decision or ship gets deferred.

**Root cause:** meta work has no correctness criterion (you can always audit more thoroughly), so it's safe. Shipping has a correctness criterion (does it work / convert / look right), so it's scary.

---

## Pattern E — Delegation without taste anchors

**Strength:** STRONG

**Evidence:** 1.6, 1.7, 1.17
- Claude Design briefed with adjectives only: "Swiss-editorial," "Aesop + Fresha," "warm"
- No reference images attached to prompts (verified from prompt files)
- Figma file exists (memory) but not cited in `_tasks/*.md`
- Stitch declared "taste anchor" in memory — no evidence of being used as delegation input
- "u recommend" → abdicates decisions to agent → reactive reject
- "ok all w ur recom" → blanket accept → then "this is ass" on output

**What this actually is:** delegating taste without giving the taste anchor. Adjectives are compression of visual concepts — but the decompressor (Claude/Claude Design) defaults to the middle of its training distribution. Without references, "Swiss-editorial" decompresses to "median design-blog homepage."

**Root cause:** your taste is visual (Figma, Stitch, specific site references), but your delegation is verbal. Compression loss is total.

---

## Pattern F — Scope signal ambiguity

**Strength:** STRONG

**Evidence:** 1.7, 1.16
- "yr" / "ye go" / "go" / "yy" — approval tokens without scope clarification
- "make me a big roadmap" — unbounded scope
- "hollup i want a page" — mid-task interruption signal
- "check for any gaps" — steady-state mode, no completion criterion
- "research evrth" — unbounded
- No patterns of "finish X then stop" or "only do Y, not Z"

**What this actually is:** you trust the agent to guess scope. Agents guess wide. You then react ("too much detail," "this is ass," "u didn't need to do all that"). The feedback loop is expensive.

**Root cause:** no shared vocabulary for scope between us. No convention like "scope: just this file" vs "scope: whatever you think needed."

---

## Pattern G — Process sprawl / collision

**Strength:** STRONG

**Evidence:** 1.10, 1.17, 1.2
- 5 worktrees active simultaneously
- Multiple Claude sessions running concurrently (confirmed via parallel-session merge commit)
- 16+ branches
- 4 claimed sources-of-truth (CLAUDE.md, `_tasks/SOLEN_DESIGN.md`, `_rules/*`, user memory)
- Skills were consolidated 28 → 8 (prior cleanup) = sprawl is recurring pattern
- Moat/session3 cherry-picks created duplicate components

**What this actually is:** parallelism creates more branches than you can integrate. Each parallel session adds its own design direction, and merges become reconciliation exercises (`b08e2345` "reconcile parallel design sessions").

**Root cause:** no "one session at a time for the same surface" rule. Spinning up more workers feels like more throughput — it's actually more integration debt.

---

## Pattern H — Premature scope / backend ahead of stable frontend

**Strength:** STRONG

**Evidence:** 1.1, 1.9, 1.15
- 325 API routes, 339 components, 109 pages, 18 cron jobs, 7 edge functions before launch
- MASTER_ROADMAP includes Phase 5 "moat features" (AI nail art, Solen Score, gold pins, confetti) before first live customer
- Phase 8 "DACH/EU" on roadmap
- pgvector search, Gemini chat intelligence, fal.ai generation — all integrated pre-launch
- Meanwhile homepage on its 7th design iteration

**What this actually is:** the hard-but-bounded work (build an API, wire a service) is more legible and rewarding than the soft-but-infinite work (decide what the site should *feel* like). So the hard work gets done; the soft work stays in pivot limbo.

**Root cause:** backend has a correctness test (does the request return 200?) and aesthetic doesn't (does this look right?). Without an aesthetic-correctness test, that axis never closes, so you keep building in the direction that has a closeable correctness test.

---

## Pattern I — Rules written as scar tissue, not followed

**Strength:** STRONG

**Evidence:** 1.5, 1.13, 1.16
- INCOMPLETE_FEATURES.md rule is "NEVER DELETE, append blockers" — 1 entry
- CLAUDE.md opens with "Previous AI sessions destroyed working code" + 5 defensive rules
- Memory entries are scar rules: "always push = never push unless asked"; "never delete + recreate"; "test on localhost first"
- "Homepage UI work: tight loop (1 fix → verify → next), not roadmaps" — PAUSED (user explicitly paused the correct pattern)
- "Stress-test every rule against 10 edge cases BEFORE proposing" — memory, acknowledging the right process

**What this actually is:** you know the right process, write the right rules, then don't follow them under pressure or mood shifts. The rules accumulate because each breach adds a new rule instead of enforcing existing ones.

**Root cause:** the rules don't have enforcement. They're prose in files, not gates in the workflow.

---

## Pattern J — Claude Design used immaturely (weak signal → medium)

**Strength:** MEDIUM

**Evidence:** 1.6
- Only 2 weekly quota uses
- No visual references in prompts
- No mood board
- No layout thesis beyond section ordering
- Feedback on output is adjectival, not referential
- No post-output iteration process (just reactive rejection → rewrite prompt)

**What this actually is:** Claude Design is being used as Claude Code with a different brand name. Its value (visual generation, style exploration, multi-variant outputs) isn't being leveraged because the inputs don't differ from a text-LLM prompt.

**Root cause:** haven't treated Claude Design as a designer — treating it as "another model to write a prompt for." A designer gets references, a brief, a mood, a constraint list. Claude Design got a 700-word constraint list only.

---

## Pattern K — Genuine strengths (the "keep doing" pile)

**Strength:** STRONG

**Evidence:** 1.15
- `public/solen-coral.html` living preview = correct pattern (one renderable artifact > prose spec)
- Git hygiene (structured commits, worktree-per-feature)
- Real infra depth (Supabase, Stripe, 4-locale i18n, pgvector)
- Skills consolidation ability (28 → 8 previous cleanup showed you CAN prune sprawl when focused)
- SECURITY_RULES.md, CODE_SAFETY.md — real governance
- SOLEN_DESIGN.md §20 decisions log with rationale per row
- Willingness to self-critique (this meta-review is the pattern in action)

**What this actually is:** capability is present, discipline is intermittent. When focused, you prune, consolidate, document with rationale, and ship real infra. The problem isn't capacity — it's consistency of mode.

---

## Contradictions worth naming

1. CLAUDE.md forbids rewriting whole files. Design system has been rewritten whole 7 times.
2. "Tight loop: 1 fix → verify → next" documented as correct, then paused for big-bang redesign.
3. "Site isn't live" + backend at 325 routes — internal contradiction between "pre-launch" framing and production-scale backend reality.
4. 4-locale i18n done, but Basel-only voice was until last week.
5. "Single source of truth" claimed for design — 4 concurrent sources exist.
6. "Test on localhost first" rule — existed because auto-push happened before.

---

## Root-cause taxonomy

All observed symptoms cluster into three root causes:

**R1. No aesthetic-correctness test.**
Visual quality has no pass/fail. Without it: endless pivots, reactive loops, "I'll know it when I see it" → delegated → rejected on sight. (Drives patterns B, C, E, J)

**R2. No "done" definition.**
Without done: shipping is indefinitely deferred, planning fills the void, backend (which has a done-test) races ahead while frontend (which doesn't) stalls. (Drives patterns A, D, H)

**R3. No workflow gates.**
Rules exist as prose. Nothing prevents parallel sessions, same-day lock-flips, rewriting whole files, or auditing what's already been audited. (Drives patterns B, F, G, I)

Everything else is a surface manifestation of R1, R2, or R3.

---

# END OF PHASE 2

---

# PHASE 3 — PRESCRIPTION

Full lists, no caps. Each item names the pattern it addresses and says how to verify it's working.

---

## 3.1 — Stop doing (everything the evidence says is hurting you)

1. **Stop writing v2 audits.** If an audit's findings haven't been executed in 7 days, delete the audit. Don't audit the audit. *(Pattern D — audit-the-audit loop.)* Verify: `_tasks/` loses a file this week instead of gaining one.

2. **Stop running parallel Claude sessions on the same surface.** The `b08e2345` merge is evidence — two sessions produced incompatible design directions, reconciliation cost real time. One session per surface per 24h window. *(Pattern G.)*

3. **Stop locking decisions without a visual reference.** Q1-Q16 locked in 24h with adjectives. Q15 flipped same day. That's not locking, that's wishing. Every lock attaches ≥1 screenshot or `solen-coral.html` commit SHA showing the rendered state. *(Patterns B, E.)*

4. **Stop bulk Q-lock sprints.** 16 decisions in 24 hours guarantees shallow decisions. Max 3 locks per week. If decisions pile up faster than that, the bottleneck isn't decisioning — it's that you're avoiding a harder upstream question. *(Pattern B.)*

5. **Stop rewriting whole files.** CLAUDE.md already forbids this. You've done it 7 times to the design system. Enforce your own rule or delete the rule. *(Pattern I, contradiction 1.)*

6. **Stop cascading aesthetic reactions across N files before preview check.** `8f018e0e` touched 69 files to remove glow — after glow had already been painted in. `solen-coral.html` exists for exactly this — preview there first, strip once, cascade once. *(Pattern C.)*

7. **Stop writing more rule docs to enforce existing rule docs.** You have 10 `_rules/*.md` + CLAUDE.md + memory + `_tasks/` and the rules aren't followed. Adding an 11th rule doc won't fix it. *(Pattern I.)*

8. **Stop using bare approval tokens for autonomous scope.** "yr" / "go" / "ye" give no scope constraint. Every autonomous delegation gets a scope word: *surgical* (one line/file), *feature* (one component/route), *system* (crosscutting). *(Pattern F.)*

9. **Stop briefing Claude Design with adjectives.** "Swiss-editorial" decompresses to generic SaaS in the model. Attach ≥2 visual references + 1 anti-reference per prompt. *(Patterns E, J.)*

10. **Stop adding phases to the roadmap for a pre-launch product.** Phase 8 is EU expansion. You don't have one Swiss customer. Cut everything past Phase 4 (public launch). It comes back when you have customers. *(Pattern H.)*

11. **Stop treating `_tasks/completed/` as a graveyard.** 2 files in 7 weeks means things aren't reaching a done state. Either stop starting new work until the in-progress pile is closed, or redefine "done" to something achievable in a week. *(Patterns A, D.)*

12. **Stop pausing the "tight loop" pattern you documented as correct.** Your own memory entry says: *"Homepage UI work: tight loop (1 fix → verify → next), not roadmaps. (PAUSED during redesign)"* — the pause is the problem. Unpause it. *(Pattern I, contradiction 2.)*

13. **Stop making new meta-docs when existing ones cover the ground.** `CLAUDE_DESIGN_PLAN.md` + `CLAUDE_DESIGN_PROMPT.md` + `CLAUDE_DESIGN_RESEARCH.md` = three files where one would do. *(Pattern D.)*

14. **Stop auto-approving ("ok all w ur recom") then reactive-rejecting ("this is ass") after seeing output.** Either review before approving or commit to the result. The flip-flop costs me a full session + you a weekly Claude Design quota. *(Patterns C, E.)*

15. **Stop implementing design changes directly into React before `solen-coral.html` reflects them.** Preview is the decision layer. Code is the consequence layer. You've been doing it in reverse. *(Pattern C.)*

16. **Stop phrasing feedback as "hate X" without attaching "like Y instead."** "Hate Syne" / "hate glow" / "this is ass" stops the bad thing but doesn't vector the next attempt. Every negative must pair with ≥1 reference pointing at the positive. *(Pattern E.)*

17. **Stop spinning up new worktrees without closing stale ones.** 5 active worktrees. Each is a context-load tax on every session. Close any worktree whose branch hasn't been committed-to in 7 days. *(Pattern G.)*

18. **Stop asking for "opinion" then rejecting it on sight.** "whats ur opinion" → answer given → rejected as "ass." Pattern burns trust in the loop. Either ask me for evidence-backed analysis (what I give) or for a different mode ("show me 3 variations, don't opinion-ize"). *(Pattern E.)*

19. **Stop keeping retired content in SOLEN_DESIGN.md §18 banned list indefinitely.** The banned list keeps growing because every retirement stays. It's becoming noise. Prune it after 30 days — what was banned that long ago is no longer a live risk. *(Pattern A — accretion without pruning.)*

20. **Stop declaring "single source of truth" when you maintain 4.** CLAUDE.md + SOLEN_DESIGN.md + `_rules/` + memory are all claiming the throne. Pick one. *(Pattern I, contradiction 5.)*

---

## 3.2 — Start doing (everything the evidence says is missing)

1. **Write a "done" definition for your current milestone.** One sentence. Testable. Example: *"Homepage v-next is done when it's deployed to a Vercel preview URL, 5 external Swiss people say it looks trustworthy, and zero of the P0 legal items from the v1 critique are present."* Pin it to the top of `_tasks/MASTER_ROADMAP.md`. *(Root cause R2.)*

2. **Build a reference binder.** Folder: `_tasks/references/` with subfolders: `hero/`, `cards/`, `search/`, `footer/`, `anti-patterns/`. 5-20 screenshots each. Every design prompt pulls from this. *(Patterns E, J.)*

3. **Use Figma as the design gate.** You declared it taste anchor in memory — act on it. Before any major design prompt: one Figma frame at minimum, linked in the prompt. Claude Design supports image uploads; use it. *(Patterns E, J.)*

4. **Preview-first implementation.** Any design change: edit `solen-coral.html` first → view at `localhost:3000/solen-coral.html` → screenshot → if it holds up, cascade to React. No React cascade before preview. *(Pattern C.)*

5. **Lock decay protocol.** Every new decision is provisional for 72 hours. After 72h without objection, it's locked. Flipping a locked decision costs a rationale entry in SOLEN_DESIGN.md §20. No flips without new evidence (a user test, a failing accessibility check, a reference you weren't aware of). *(Pattern B.)*

6. **One-session-one-surface rule.** If a file or design surface has a Claude commit in the last 2 hours from any session, no other session touches it. I will enforce this from my side — if I see recent commits by another session on my target, I pause and surface it. *(Pattern G.)*

7. **Scope signals on every autonomous approval.** Convention: *"go — scope: [surgical | feature | system]"*. Without a scope word, I'll ask or assume surgical. *(Pattern F.)*

8. **Update `INCOMPLETE_FEATURES.md` at every context switch.** Before you say "hollup" and pivot, log the current task's state to that file. It's the rule you wrote — follow it. *(Pattern I.)*

9. **Merge the 17 task docs + 10 rule docs by 50% in one sitting.** Candidates for merge or delete: DESIGN_AUDIT + DESIGN_AUDIT_MASTER → one. GAP_AUDIT + GAP_AUDIT_V2 → one or delete both (findings should be done or dropped by now). CLAUDE_DESIGN_PLAN + RESEARCH + PROMPT → one file. INVENTORY_FULL + REDESIGN_INVENTORY → one. ROADMAP_AUDIT → delete (it audited archived docs that are already archived). *(Pattern A.)*

10. **Cap MASTER_ROADMAP at Phase 4 (public launch).** Moat features, EU expansion, growth — all premature. Save as `_tasks/someday.md` if you need to remember them, but they don't belong in the live roadmap. *(Pattern H.)*

11. **Weekly pruning ritual.** Every Friday, delete 3 files from `_tasks/` or `_rules/`. If you can't find 3 to delete, they're all active and fine. First Friday will be easy. *(Pattern A.)*

12. **Pair every negative with a positive reference.** "Don't do X — do Y like [link]." Without the "like Y," the negative is just a constraint, not direction. *(Pattern E.)*

13. **Set a Claude Design iteration protocol.** After each Claude Design output: (a) screenshot, (b) write 3 specific things that *work*, (c) write 3 specific things that *don't*, (d) attach ≥1 reference showing the direction for the fix, (e) THEN prompt v-next. Not before. *(Pattern J.)*

14. **Start a "shipped" log instead of a "done" folder.** `_tasks/SHIPPED.md` — append-only, date + what went live. Seeing the file grow changes how the week feels. *(Pattern A, R2.)*

15. **Use the `npm run dev` server + preview HTML as the only design feedback surface.** Not static docs. If a design choice can't be rendered at a URL, it's not a decision yet. *(Patterns B, C.)*

16. **Limit parallel worktrees to 2.** One for current work, one for emergency/backup. Close the rest. *(Pattern G.)*

17. **Collect references for Solen *before* the next Claude Design session.** Aesop, Ssense, Kinfolk, Apartamento, the Basel Kunstmuseum site, Schweizerisches Landesmuseum — sites whose compositional logic you want. The output has to aim at *something visual*. *(Patterns E, J.)*

18. **Write an "anti-reference" list.** Sites that look generic-SaaS (Treatwell, GlossGenius, Fresha — yes even Fresha) — attach to prompts as "don't look like this." The inverse reference closes the solution space faster than positives alone. *(Pattern E.)*

19. **Test decisions against existing visual moments.** Before locking a typography rule, check: "does this hold up on the busiest page in the app?" (probably salon detail + dashboard booking views). If the rule breaks on a real page, the rule is wrong, not the page. *(Pattern B.)*

20. **Adopt a rule-enforcement convention.** When you see me breach a CLAUDE.md rule, cite it by number. When I see you breach your own memory rule, I cite it back. Mutual enforcement or the rules stay prose. *(Pattern I.)*

---

## 3.3 — Keep doing (genuine strengths — don't lose these)

1. **The `public/solen-coral.html` living preview pattern.** One renderable artifact > prose spec. This is the single best architectural decision in the repo. Extend the pattern: `public/solen-entdecken.html`, `public/solen-salon.html` for each major surface.

2. **SOLEN_DESIGN.md §20 decisions log with rationale per row.** Git log + this table = auditable design history. Best meta-artifact you have. Keep the rationale column — it's what distinguishes this from a changelog.

3. **Structured commit messages with phase-prefixes.** `phase 2:`, `design:`, `feat(salon):` — makes git log readable as a work journal.

4. **Worktree-per-feature isolation** (when not overdone). Concept is correct; just cap the count.

5. **Real governance docs (SECURITY_RULES.md, CODE_SAFETY.md).** These aren't vibes — they're technical gates. Keep them.

6. **Willingness to self-critique.** You asked for this review, uncapped, with brutal tone. Rare. Most founders would have asked for validation. This capacity is your compounding advantage — don't lose it.

7. **Previous cleanup capability.** Skills 28→8 shows you can prune when focused. The pruning muscle is there; just exercise it more often.

8. **Separation of backend + frontend concerns.** Backend is substantive and un-thrashed while frontend iterates — that's actually correct architecture. The thrash is in the visible layer, which is the cheap layer to thrash. Don't let frontend churn contaminate backend.

9. **i18n from day one (4 locales).** Most pre-launch apps put this off. You didn't. Keep it — the cost of retrofitting would be brutal.

10. **External-service wiring (Supabase, Stripe, Resend, Gemini, fal.ai, pgvector, PostHog).** Real depth. Keep treating this as the moat it is.

---

## 3.4 — System changes (how we work together)

**My commitments (Claude):**

1. **After any autonomous task, I output ≤3 lines:** (a) files touched, (b) decisions I made, (c) open questions. No long summaries unless asked.

2. **Before any Claude Design prompt I draft, I list the reference check:** "Attached refs? Mood set? Anti-ref?" If any is missing, I pause before drafting.

3. **Before any "lock" commit, I verify:** "renderable in `solen-coral.html`? tested against 3 edge cases? logged in §20 with rationale?" If no, I flag before writing the lock.

4. **Parallel session protocol:** if I see commits on the target surface within the last 2h from another branch/session, I pause and surface it instead of proceeding.

5. **Rule enforcement:** when you breach a rule you've written (CLAUDE.md, memory), I cite the rule by number. I stop being polite about it.

6. **Scope defaults:** if I get a bare "go" / "yr" / "ye" without scope signal, I default to *surgical* (one file, one line) and surface the assumption. Never default to system-wide.

7. **No new docs without deletion credit:** if you ask me to create a new `_tasks/*.md`, I'll name 2 existing ones that could be merged or deleted first.

**Your commitments (suggested):**

1. **Scope word on every autonomous delegation:** "surgical", "feature", or "system". Bare "go" defaults to surgical.

2. **Reference attached to every design prompt:** minimum 1 positive, 1 negative. No references = no prompt.

3. **Lock decay:** no decision is "locked" until 72h have passed without objection. Before 72h: provisional.

4. **Weekly pruning ritual (Friday):** delete 3 docs from `_tasks/` or `_rules/`.

5. **Preview-first:** any design change begins with `solen-coral.html` edit. React cascade only after preview holds up.

6. **Mood pause:** before "hate this, strip it" cascade, 10-minute pause. Still hate it after 10 min, strip. (This one hurts but the evidence is overwhelming.)

7. **One session one surface:** don't open a second Claude tab on the same file for 24h.

---

## 3.5 — Working agreements (standalone — NOT for CLAUDE.md)

These live in this file only. CLAUDE.md stays as-is.

- No new `_tasks/*.md` file without deleting 2 existing ones.
- No "Q-lock" decision without a `solen-coral.html` commit showing the rendered state.
- No lock is final before 72h. Flipping before 72h: free. Flipping after: rationale entry required.
- No Claude Design session without references attached (≥1 positive + ≥1 anti-reference).
- No parallel Claude sessions on the same file or surface.
- No phase additions to `MASTER_ROADMAP.md` past Phase 4 (public launch). Speculative work goes to `_tasks/someday.md`.
- Scope signals on every autonomous approval: `surgical` | `feature` | `system`.
- `_tasks/INCOMPLETE_FEATURES.md` updated on every context switch.
- Any audit whose findings aren't executed in 7 days is deleted, not re-audited.
- If you start writing a v2 of a planning doc, stop and execute v1 instead.
- Friday pruning ritual — delete 3 meta-docs weekly.
- Design changes start in `solen-coral.html`. React cascade only after preview holds.

---

## 3.6 — The one sentence

Three root causes — no aesthetic-correctness test, no "done" definition, no workflow gates — produce every symptom above. **Define done. Render decisions before implementing them. Enforce rules mutually.** Nothing else on this list matters if those three don't land.

---

# END OF PHASE 3 — FILE COMPLETE

Read Phase 3 sections 3.1-3.5. Pick 3-5 items to act on this week. Don't adopt all of it — that's the pattern. Pick what hurts most, do it, come back.
