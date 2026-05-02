# Solen Rules — Index

> **Memory protocol:** Read `_rules/HOT.md` first. If it has the answer, stop. If not, scan this index, then read only the file(s) you need.
> **Don't grep `_rules/`** until both HOT and INDEX have failed you.

---

## Files in `_rules/`

| File | Lines | Purpose |
|---|---|---|
| `AGENT_COORDINATION.md` | 94 | Multi-agent coordination — how Dev1/Dev2/Dev3/bug-agent avoid stepping on each other (DB migrations, shared components) |
| `CODE_SAFETY.md` | 245 | MANDATORY rules to prevent fabricated imports / nonexistent APIs (post-2026-03-17 prod incident). Verify before writing. |
| `DB_SCHEMA.md` | 84 | Supabase schema reference — tables, key columns, RLS notes, payouts |
| `I18N_ROUTING.md` | 68 | Locale-aware routing rules. No hardcoded strings. Layouts must handle longer German words. |
| `KEY_FEATURES.md` | 64 | Full feature list — discovery, booking, messaging, auth, last-minute, etc. **(questionnaire-active — read-only)** |
| `LESSONS_LEARNED.md` | 327 | Bug + fix log. Read before changes; append after discovering new footguns. **Big file** — search for keyword first. |
| `ROADMAP_RULES.md` | 141 | Standards every new roadmap must follow (sections, risk warnings, gold standard reference) |
| `SECURITY_RULES.md` | 134 | API route mandatory layers — rate limit, RLS, Zod, audit. Post-2026-03-17 audit. |
| `STRUCTURAL_RULES.md` | 253 | Feature checklist, naming, orphan prevention, banned tokens (post-2026-03-25 audit) |
| `SYSTEMS.md` | 127 | Systems & tools quick-match — payments, email, search, AI, analytics |

## Cross-references (canonical sources)

- **Design system** → `_tasks/SOLEN_DESIGN.md` (§20 decision log; questionnaire-active, do not edit outside Q-lock flow)
- **Living preview** → `public/solen-coral.html`
- **Active blockers** → `_tasks/INCOMPLETE_FEATURES.md`
- **Operation history** → `_tasks/LOG.md`
- **Active context** → `_rules/HOT.md`

## When to update this index

Whenever a `_rules/*.md` file is added, deleted, or its purpose materially shifts. Append-only changes to existing files don't require index updates.
