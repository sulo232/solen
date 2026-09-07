# Solen: Systems & Tools

> Design work routes through _design-system/SOURCE.md (canonical) + _design-system/LOCKFILE.md (frozen literals, wins on conflict) and the fable-frontend skill pipeline (exists-check, ground, mockup-first, build whole, measured verify, tunnel link). This banner and the Quick Match table below are kept in sync; do not let one drift from the other.

> **Read this every session.** Match the user's request to a system, then follow it.

---

## Quick Match

| User wants... | System | Key file |
|---|---|---|
| Design new UI / redesign a component | **Design System** | `_design-system/SOURCE.md` + `_design-system/LOCKFILE.md` + `fable-frontend` skill |
| Check for visual regressions after changes | **Playwright** | `playwright.config.ts` |
| Wrong color / font / spacing / token | **Design Tokens** | `_design-system/LOCKFILE.md` (frozen values), `_design-system/SOURCE.md` (canonical) |
| Animation / hover / interaction polish | **Animation** | `_design-system/MOTION.md` |
| Build a feature / new page / API route | **Feature Dev** | `_rules/CODE_SAFETY.md` |

---

## 1. Design System

Design in the existing system, get approval on a mockup, then code. For any new or redesigned customer-facing UI.

**Pipeline:** the current `fable-frontend` skill is the ordered pass: exists-check (`npm run exists <keyword>`) → ground every element in a source → dual-axis spec (structure = Fresha capture, aesthetic = LOCKFILE) → mockup-first approval → build the whole design → measured verification → tunnel-link delivery.

**Canonical docs:** `_design-system/SOURCE.md` (22-section canonical: tokens, motion, spacing, components, voice, a11y). On conflict, `_design-system/LOCKFILE.md` wins (frozen literal values).

**Component registry:** `_design-system/COMPONENT_REGISTRY.md` (read BEFORE building any component). New shared component = write `_design-system/components/<Name>.md` + registry entry in the same turn.

**Loop:** Mockup (copy of the real page, treatment-only) → user approves → implement on the real component → verify on localhost.

---

## 2. Playwright

Automated screenshots at 3 viewports. Diffs against baselines to catch regressions.

**Use after a batch of changes (5-6 fixes), not per-fix.** Dev server + test run takes ~80s total.

```bash
npx playwright test                          # diff against baselines
npx playwright test --update-snapshots       # save new baselines after intentional changes
npx playwright test --project=desktop        # single viewport
npx playwright show-report e2e/visual/report # view diff report
```

**Viewports:** mobile (375px), tablet (768px), desktop (1280px).
**Sections:** full-page, header, hero, first-carousel, trust-stats, discover, city, footer, mobile-nav.
**Files:** `playwright.config.ts`, `e2e/visual/homepage.spec.ts`, baselines in `e2e/visual/baselines/`.
**Requires:** Dev server running + `npx playwright install chromium`.

---

## 3. Design Tokens

Tokens are LOCKED, not in flux. **Cite `_design-system/LOCKFILE.md` as authoritative** (frozen literal values: colors, radius, spacing, text sizes). `_design-system/SOURCE.md` is the canonical 22-section doc tokens live inside.

Tailwind / CSS implementation lives in `tailwind.config.js` + `app/globals.css`: those are the actual code, not anchors; the LOCKFILE is the source of truth when they drift.

---

## 4. Animation

Easing, timing, micro-interactions. Full principles + remaining-work list: `_design-system/MOTION.md` (read before motion work). Vocabulary is locked (Motion-22: shimmer, X-collapse, press tiers, cascade, heart burst, etc).

**Rules:** Easing `cubic-bezier(0.23, 1, 0.32, 1)`. Duration 100-300ms. Enter from `opacity:0, y:12`. Press: `active:scale-[0.97]`. Stagger: 40-60ms.

---

## 5. Feature Dev

Building features, pages, API routes. Canonical 8-layer completeness checklist: `_rules/STRUCTURAL_RULES.md` Rule 40 (don't restate it here, it drifts).

**Reference:** `_rules/CODE_SAFETY.md`, `_rules/STRUCTURAL_RULES.md`, `_rules/I18N_ROUTING.md`, `_rules/SECURITY_RULES.md`, `_rules/DB_SCHEMA.md`, `_rules/ROADMAP_RULES.md`, `_rules/LESSONS_LEARNED.md`, `_rules/KEY_FEATURES.md`, `_rules/search-bar-rules.md`.

**Check first:** `_tasks/INCOMPLETE_FEATURES.md` (might already be half-built).

---

## Also Available

| What | File | When |
|---|---|---|
| Multi-agent coordination | `_rules/AGENT_COORDINATION.md` | Multiple agents active, shared file edits |
| UI audit workflow | `.agents/workflows/ui-audit.md` | Sweeping the app for visual bugs |

---

## Adding a New Tool

When you set up a new tool or workflow, add it here: a section with **what** it does, **when** to use it, key **commands/files**, and add a row to the quick-match table. Then add a one-liner to the CLAUDE.md systems summary list.
