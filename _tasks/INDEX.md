# Solen Tasks — Index

> Companion to `_rules/INDEX.md`. `_tasks/` holds the moving stuff: roadmaps, audits, design source-of-truth, logs.

---

## Active source-of-truth (do NOT edit outside their workflows)

| File | Workflow |
|---|---|
| `SOLEN_DESIGN.md` | Q-lock questionnaire — §20 decision log appends only |
| `INCOMPLETE_FEATURES.md` | Append blocked/partial features per CLAUDE.md Rule 45 |
| `BACKEND_NEEDS_UI.md` | Backend features awaiting UI (questionnaire-active) |
| `REDESIGN_INVENTORY.md` | Component tree reference (questionnaire-active) |
| `LOG.md` | Append-only operation history |

## Audits & inventories (likely candidates for future merge)

| File | Notes |
|---|---|
| `GAP_AUDIT.md` + `GAP_AUDIT_V2.md` | Post-Q1-Q15 gap scan + supplement (V2 missed gaps) |
| `DESIGN_AUDIT.md` + `DESIGN_AUDIT_MASTER.md` | Forensic git archaeology of design iterations |
| `ROADMAP_AUDIT.md` | Audit of all historical planning docs |
| `INVENTORY_FULL.md` | Full component & feature inventory (every pattern built) |

## Roadmaps & plans

| File | Notes |
|---|---|
| `MASTER_ROADMAP.md` | Synthesis from forensic audits |
| `CLAUDE_DESIGN_PLAN.md` | Plan for Claude Design tool usage |
| `CLAUDE_DESIGN_PROMPT.md` | First-message prompt template |
| `CLAUDE_DESIGN_RESEARCH.md` | Research report on how Claude Design works |

## Operations / agent prompts

| File | Notes |
|---|---|
| `AGENT-PROMPTS.md` | Copy-paste prompts for parallel Claude Code windows |
| `OVERNIGHT_LOG.md` | Single-session overnight run log (2026-04-21). Will be superseded by `LOG.md`. |
| `TODO-type-fixes.md` | TypeScript error backlog (Phase 1 in progress) |

## Subdirs

- `completed/` — archived finished work
- `screenshots/` — raw image assets

## Read order for new sessions

1. `_rules/HOT.md` (if recent)
2. `_rules/INDEX.md` (this file's sibling)
3. `_tasks/SOLEN_DESIGN.md` (only if working on visuals)
4. `_tasks/INCOMPLETE_FEATURES.md` (always check before declaring done)
