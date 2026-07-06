# Solen Claude-Code System Audit — 2026-06-28

Full inventory of every "target": hooks, orchestration (agents/commands/workflow), skills, memory files, docs. For each: what it does, health, verdict, why. Plus duplicates/merge map and the cross-session gap. Read-only audit; nothing changed yet.

Legend: KEEP · FIX · MERGE→ · ARCHIVE · REMOVE · WIRE (orphaned, should be active)

---

## 0. Top-line

Healthy core, decayed edges. The loop engine (coder/loop-reviewer/refine.workflow.js), the anti-dup + taste hooks (no-caps, no-focus-ring, no-ai-assets, mockup-gate, exists-guard), and the generated truth layer (_inventory + LOCKFILE/SOURCE/CANON) are genuinely well-built. The rot is concentrated in: (a) 2 orphaned safety hooks, (b) a stale design-verifier the harness actually loaded, (c) ~34 duplicate memory files, (d) a retired `_rules` design tier + `_tasks` log pile that still present as authoritative, (e) ~7 skills duplicating installed plugins + 4 skills calling a Playwright MCP that isn't installed here.

Pattern under all of it: **you build enforcement, but nothing enforces the enforcement** — hooks get de-registered by later settings edits, memory rules fall out of the loaded index, old docs never get retired when new ones replace them.

---

## 1. HOOKS

### Healthy — KEEP as-is
| Hook | Scope / wiring | Does |
|---|---|---|
| exists-guard.py | global, Write | Concept-greps git ls-files for filename overlap, blocks new dup files |
| finish-autonomously-gate.py | global, Stop | Blocks early-stop when user asked to finish autonomously |
| link-gate.py | global, Stop | Mobile turn must end with a clickable preview link |
| loop-default.py | global, SessionStart | Injects layered-loop-default posture |
| mockup-gate.py | global, Write/Edit | `ask` on real mobile screen edits unless approved |
| no-ai-assets.py | global, Bash | Denies image-gen commands |
| no-caps-gate.py | global, Write/Edit | Denies `uppercase`/text-transform in UI files |
| no-focus-ring-gate.py | global, Write/Edit | Denies focus rings / glow halos |
| sim-auto.py | global, PostToolUse | Auto-screenshots sim after a mobile edit |
| sim-shot.sh | global, helper (not a hook) | CLI to open+shoot a route on the sim |
| user-prompt-binary-triggers.sh | project, UserPromptSubmit | Injects "fire X tool first" per input type |
| pre-component-edit-pixel-spec.sh | project, Edit/Write | Blocks UI edit until a pending pixel-spec is read |
| pre-edit-drift-gate.sh | project, Edit/Write | Diff-aware design-drift gate (the modern hex/token enforcer) |
| pre-build-exists-check.sh | project, Write | Blocks new page/route/migration until `npm run exists` ran |
| pre-commit-graveyard.sh | project, Bash | Blocks deletions unless REMOVED.md staged too |

### Problems
| Hook | Status | Verdict | Why |
|---|---|---|---|
| **mcp-prod-write-guard.py** | global, **ORPHAN** (in bak3, dropped from live settings Jun 25) | **WIRE** — PreToolUse matcher `mcp__a0c76f25-...__*` + Vercel | Best-built unwired hook. Right now Supabase `execute_sql`/`apply_migration`/`deploy_to_vercel` are reachable with NO guard, while CLAUDE.md forbids them. Returns `ask`, not `deny` — costs a legit write nothing. **Highest-priority fix.** |
| **pre-done-claim-check.sh** | project, **ORPHAN + STALE** | **FIX-then-wire, or REMOVE** | Doubly dead: unwired AND requires `mcp__playwright__browser_*` which isn't installed (this session has Claude_Preview / Claude_in_Chrome). Intent (verify before "done") is CLAUDE.md rules 7-9. Fix = retarget tools + wire under Stop; else remove. |
| **pre-page-commit-check.sh** | project, wired but STALE | **FIX paths or REMOVE** | Watches `components/home/**`, `components/HomePage.tsx`, `components/SalonCard.tsx` — none exist (moved to `app/[locale]/_components/homepage/**` + `components-legacy/`). Receipt `.claude/last-page-loop.json` is never written → can't be satisfied. Enforcement theater. |
| **pre-sweep-check.sh** | project, wired but STALE | **FIX ref or RETIRE** (superseded) | Keyed to retired `public/solen-coral.html` palette + cites deleted `SOLEN_BUILD_LEARNINGS.md`. Superset job already done by pre-edit-drift-gate.sh. |

### Hook duplicates
- **exists-guard.py vs pre-build-exists-check.sh** — overlap (same rule, same event) but check different things: concept-grep vs process-receipt. KEEP both, add a header line to each naming the other so neither gets deleted as a "dup."
- **pre-sweep-check.sh vs pre-edit-drift-gate.sh** — drift-gate is a strict superset. MERGE pre-sweep's "don't obliterate a locked value" into drift-gate, then retire pre-sweep.

---

## 2. ORCHESTRATION (agents / commands / workflow)

### Healthy — KEEP
| File | Role | Note |
|---|---|---|
| ~/.claude/agents/coder.md | Builder layer | `tools:` correct (has write); return contract matches BUILD_SCHEMA |
| ~/.claude/agents/loop-reviewer.md | Grader layer | Correctly read-only (`tools: Read,Grep,Glob,Bash`); matches VERDICT_SCHEMA |
| ~/.claude/commands/refine.md | Orchestrator launcher | Correctly pins engine reviewer to loop-reviewer |
| ~/.claude/commands/harden.md | Recurring-miss → hook | Self-contained, accurate |
| ~/.claude/workflows/refine.workflow.js | The loop engine | Strongest file: deterministic, convergence + round cap + recurring-miss, defensive |

### Problems
| File | Status | Verdict | Why |
|---|---|---|---|
| **design-verifier.md (worktree copy)** | **STALE + NOT read-only + harness loaded it** | **FIX — resync/symlink to main copy** | The worktree copy has NO `tools:` line (so it can edit code despite claiming read-only) AND grades against dead coral/Q64 tokens + archived SOLEN_LIVE_TRUTH. The harness registered THIS copy (confirmed: the registered agent shows solen-coral.html + "All tools"). **Highest-severity finding** — the verifier I'd reach for is wrong on both axes. Main checkout copy is correct. |
| **verify.md (project command)** | STALE | **FIX ref or MERGE→agent** | Hardcodes `solen-coral.html` in 3 places + a rot-prone section→component map. Thin dispatcher; fold into the agent or slim to a 5-line forwarder with no hardcoded reference. |
| **LOOP_SYSTEM.md** | INCONSISTENT | **FIX claim** | Says "both design-verifier copies byte-identical, tools added" — false for worktrees. Make `wt-setup` responsible for project-agent sync. |

### Orchestration duplicates
- **verify.md ⇄ design-verifier.md** — one job split across a stale command + a (correct-in-main) agent. MERGE: move section map into the agent, slim/delete verify.md.
- **refine.md vs refine.workflow.js** — clean split (policy vs engine). KEEP both.
- **loop-reviewer vs design-verifier** — clear boundary (generic in-loop grader vs Solen-design post-PASS grader). KEEP both.

### Cross-session orchestration — CONFIRMED GAP
Zero matches for cross-session/multi-session/SendMessage/resume across all 8 files. Everything is single-session. Worktrees give parallel *isolation*, cron gives fresh *re-runs* — neither hands state/checklists between sessions. No system for "coder finishes overnight, reviewer picks up the punch list tomorrow." This is the thing you sensed was missing.

---

## 3. SKILLS

### Keep (bespoke, healthy)
- **pixel-spec-auto** — PIL auto-measure of a screenshot. Hub of the pixel cluster, no MCP dep. KEEP.
- **gemini-visual-check** — external-model (Gemini) vision second-opinion. KEEP (fix trigger wording).
- **llm-council** — multi-model opinion synthesis. KEEP (distinct from deep-research).
- **huashu-design** — HTML hi-fi prototyping/variation/critique. KEEP.
- **skill-creator**, **consolidate-memory** — meta-tools. KEEP.
- **solen-drift-check** (project) — the single best-maintained, properly-wired custom skill. KEEP.

### Fix (Playwright MCP not installed here → retarget to Claude_in_Chrome/Preview)
- **fresha-section-capture** — only skill covering motion+click states. FIX MCP calls, KEEP.
- **site-teardown** — live-URL→design tokens. FIX (also points at deleted extract-typography.js/extract-colors.js; use extract-everything.js), KEEP.

### Merge / slim
- **pixel-ref-collect** → MERGE into pixel-spec-auto as a `--collect-refs` mode (thin wrapper).
- **screenshot-spec** → slim to its only non-redundant tier (manual annotation); Tiers 1-2 are just pixel-spec-auto.

### Remove (exact duplicates of installed plugins — double-listed noise)
- accessibility-review ⇄ design:accessibility-review
- design-critique ⇄ design:design-critique
- design-handoff ⇄ design:design-handoff
- design-system-management ⇄ design:design-system
- user-research ⇄ design:user-research
- ux-writing ⇄ design:ux-copy
- watch ⇄ watch:watch plugin

No dead symlinks; no malformed SKILL.md.

---

## 4. MEMORY (92 files → ~70 with zero info loss)

### Index health
- **5 orphans on disk, NOT in MEMORY.md** (won't load each session): `user.md` (!), `feedback_no_parallel_agents_frontend.md`, `project_search_facts.md`, `reference_test_server_pattern.md`, `RETIRED_feedback_no_vercel_deploy.md`. → ADD-TO-INDEX (except RETIRED).
- **1 dead link**: MEMORY.md:55 → `feedback_no_vercel_deploy.md` (renamed to `RETIRED_…`). → FIX-LINK or drop.

### Stale / wrong content
- **user.md** — design DNA says coral #E8624A + Anton/Figtree + Vercel. Contradicted by B&W pivot, no-Geist, Netlify. **FIX + index.** (most important data fix)
- **project_palette_b_w_pivot.md** — "generous blue" framing reversed by sparse-blue v3. FIX.
- **project_giftcard_solen_wide.md** — self-superseded (gift card killed). → killed-features cluster.

### Merge clusters (~34 files → ~12)
| Cluster | Members | → |
|---|---|---|
| A. Mockup discipline | mockup_first_always, mockup_every_design_decision, mockups_as_links, mockups_in_english, mockups_no_cdn, mockup_preflight_checklist, no_html_mockups_mobile, rich_not_bland (8) | → `feedback_mockup_protocol` (+ keep mobile + checklist) ≈ 2 |
| B. Color system | 90_10_color_rule, layer3_semantic_colors, no_muted_focal_colors, selected_state_ink_not_blue_ring, palette_b_w_pivot (5) | → `feedback_color_system` ≈ 1-2 |
| C. Copy/artifact economy | no_decorative_artifacts, copy_minimalism, no_times_in_listings, no_emdashes (4) | → `feedback_copy_and_artifact_economy` ≈ 1 (carry no-fabrication verbatim) |
| D. Icon bans | actual_icons_lucide, no_zap_icon, no_sparkles_star_icon (3) | → `feedback_icons` = 1 |
| E. Autonomy/loop | dont_checkpoint_keep_going, commit_often, layered_loop_default, no_parallel_agents_frontend (+no_auto_push stays separate) (5) | → `feedback_autonomy_and_loop` ≈ 2 |
| F. Verify/measure | running_ui_measure, exact_match_screenshot_spec, gemini_visual_check (fold into binary_triggers); laziness + verify_authgated → rigor (6) | → 2 |
| G. Clickable links | phone_preview_link, always_deeplink, mockups_as_links (3) | → `feedback_always_clickable_link` = 1 |
| H. Killed features | giftcard, messaging_off, lastminute_packages_removed, pivot_shelved (4) | → `project_killed_features` = 1 |

Do NOT merge: dashboard_*, mobile_*, inspo_*/search_* (distinct sub-systems). Carry verbatim: no-fabricated-data, never-push, dev-login route, selected-state LOCKFILE override.

---

## 5. DOCS

### Healthy core — KEEP
Global CLAUDE.md, LOOP_SYSTEM.md; _design-system: LOCKFILE, SOURCE, CANON, COMPONENT_REGISTRY, QUESTIONS, REMOVED, TASTE_LOG, WORK_TYPES, WAVE_PLAN, MOTION, SENIOR_SCORECARD, RESTRAINT_TEST, CONTROL_ELEVATION, components/*; _inventory: SURFACE (generated), STATUS; _rules functional: CODE_SAFETY, STRUCTURAL_RULES, SECURITY_RULES, I18N_ROUTING, ROADMAP_RULES, LESSONS_LEARNED, AGENT_COORDINATION.

### Dead-but-cited (highest priority)
| Doc | Verdict | Why |
|---|---|---|
| _tasks/archive/SOLEN_LIVE_TRUTH.archived.md | **ARCHIVE + repoint 7 refs** | Retired V2 (teal/Cooper BT) still cited as "principal spec" by SOLEN_PATTERNS, SOLEN_UI, KEY_FEATURES, ROADMAP_RULES, LESSONS_LEARNED, SOURCE, CLAUDE.md. An agent follows the pointer into dead truth. |
| _rules/UI_RULES.md | **ARCHIVE / gut to pointer** | Retired Terracotta #E8624A + cream + dark-mode-default, framed "must not be broken." |
| _rules/solen-color-60-30-10.md | **ARCHIVE** | Retired Sunset-Orange + Teal palette. |
| _rules/KEY_FEATURES.md, UTILITIES_INDEX.md | **ARCHIVE / MERGE→_inventory** | CLAUDE.md itself names these "rotted," replaced by generated SURFACE+STATUS. |

### Live contradictions — FIX
- Project CLAUDE.md: success green stated as `#16A34A` (lines 39/41) but `#15803D` at line ~89 (+ SOLEN_DESIGN as canonical). CANON §0 resolves to #16A34A. Fix line 89.
- "Generous blue v2" leftover prose in SOURCE/LOCKFILE/CANON that CANON §0 already reverses to sparse-blue.

### Overlap to resolve
- CANON vs LOCKFILE vs SOURCE — managed by CANON §0 precedence, but CANON should shrink to just §0 + precedence (its token table dup's LOCKFILE §1).
- SOLEN_PATTERNS §4-5-8 → already extracted to SOURCE §21; MERGE/demote.
- DB_SCHEMA.md (hand) vs _inventory/_db-snapshot.json (live) → ADD-POINTER "live wins."
- CONTRADICTIONS.md + CONSISTENCY_AUDIT.md + V2_RECONCILIATION.md + UBER_TYPE_SPEC.md → executed records, ARCHIVE.

### Generated — regenerate, don't archive
_inventory/SURFACE.{md,json}, _drift-report.md, _pending-migration.md (2.6MB), _db-snapshot.json/_db-columns.json (>30 days → regenerate).

### _tasks bulk
~45 files, mostly one-shot audits/logs (V2_REBUILD_LOG 265KB, OVERNIGHT_LOG×3, CUSTOMER_*_AUDIT, REFUND_WALKIN_×3, etc). Bulk-ARCHIVE into existing-but-underused `_tasks/archive/`.

---

## 6. The meta-fix
Every finding is "old enforcement/truth wasn't retired when new replaced it." The durable fix is a **system-health check** (a script or hook) that asserts: every hook on disk is wired (or intentionally shelved), every memory file is indexed, every doc's referenced paths exist, no doc cites an archived doc as canonical. That's what would've caught all of this.
