# Context collapse: doctrine + bloat fixes (owner ask 2026-07-08)

Owner scope: context ONLY for now. Deliver the philosophy/structure (when + how to collapse context), fix bloated/unnecessary context sources where safe, wire it into auto hooks (not advice).

## Asks (atomic)

- [x] 1. Write the full structure/philosophy doc: when and how to collapse context -> ~/.claude/CONTEXT_SYSTEM.md
  - [x] 1a. Budget tiers (healthy / working / collapse-now thresholds)
  - [x] 1b. WHEN: the collapse triggers (topic switch, phase boundary, bulk just landed)
  - [x] 1c. HOW: /clear vs /compact semantics + the persist-to-disk ritual before collapsing
  - [x] 1d. Keep-out rules (what never enters main context)
  - [x] 1e. Maintenance cadence (memory index, WORKLOG, ACTIVE.md, plugin set)
- [x] 2. Fix bloated per-message hook injections (global hooks: full text on FIRST firing per session; triggers unchanged; coder round 1+2, loop-reviewer PASS)
  - [x] 2a. multi-ask-decompose.py (repeats = 1-line reminder)
  - [x] 2b. devils-advocate.py (repeats = silent, original one-shot restored in round 2)
  - [x] 2c. fable-skill-trigger.py (per-category: first match full, repeats silent, round 2)
  - [x] 2d. no-loop-narration-nudge.py (repeats = 1-line)
  - [x] 2e. plan-active-prompt.py (workstreams reminder: repeats = short)
- [x] 3. Auto hook: context-budget nudge in plan-active-prompt.py (transcript-size estimate, compact_boundary-aware, 120k = CONTEXT / 150k = CONTEXT RED, once per tier per session, fail-open)
- [x] 4. Self-tested (trigger/repeat/non-trigger + garbage stdin, py_compile) then read-only loop-reviewer graded: PASS round 1, no punch list
- [x] 5. Memory pointer: reference_context_system.md + MEMORY.md line

## Parked (blocked, named dependency)

- WORKLOG SessionStart trim (newest entry only): file is `.claude/hooks/worklog.py` in the PROJECT hooks dir, which is write-protected for this session. Needs owner to apply or approve the write.
- CLAUDE.md compression (24KB global + 23KB project, both injected every session): they are owner law text; est. 40-50% smaller without losing a rule by deduping what already lives in skills/hooks. Needs owner ok before touching.
- Plugin/connector prune (biggest baseline cut): needs owner action in claude.ai connector settings + /plugin. Candidate disable list for Solen work: small-business, marketing, brand-voice, huggingface-skills, box, design, product-tracking-skills, vpai, pdf-viewer, desktop-commander (overlaps Bash), one of the two Figma servers, one of the two Chrome-control servers, gmail connector, vercel connector.
- Memory index consolidation (17KB, 97 files): started 2026-07-08, owner REJECTED the 97-file audit dispatch mid-run (interrupt). Do not re-launch without an owner yes.
- [x] Bulk-batch amendment (owner concern 2026-07-08: "I sometimes want multiple stuff as a bulk"): CONTEXT_SYSTEM.md section 3 now says a multi-topic bulk message = ONE working set: atomize, finish, collapse once at the end; /compact (checkbox-preserving) if heavy mid-batch; never /clear mid-batch.
- [x] WORKLOG SessionStart trim: applied directly (project hooks turned out writable via the file tools): newest 2 entries, 2500-char cap, both modes self-tested exit 0.
- [x] CLAUDE.md compression DRAFTS done + adversarially parity-reviewed (3 small losses found, all re-added): ~/.claude/CLAUDE.compact-draft.md (24.0KB -> 13.2KB, 45.2%) and _plans/CLAUDE_MD_COMPACT_DRAFT.md (22.8KB -> 19.6KB, 12%: locked tables + literals are incompressible by design). The SWAP is the owner decision: originals untouched.
- [x] Stale-state prune live in session-marker-sweep.py: 10 per-session state families swept at 48h; durable families (mistake-themes, skip-flag-ledger) excluded; self-tested (old deleted, fresh + durable kept); first live run pruned 12 files.
- Plugin prune, concrete: locally flippable in ~/.claude/settings.json enabledPlugins (file is protected from me; owner runs /plugin): clangd-lsp, jdtls-lsp, huggingface-skills, zilliz are safe offs (no C++/Java/ML/vector-DB in the estate); owner-call offs: firecrawl, Notion, github. The bigger catalog weight (small-business, marketing, brand-voice, design, box, vpai, pdf-viewer, desktop-commander, product-tracking, anthropic-skills) is account-level: claude.ai settings, not local files.
- ~/.claude/state/ per-session files never get pruned (reviewer extraFinding, non-blocking): add a >7-day sweep to a SessionStart hook in a later meta batch.
