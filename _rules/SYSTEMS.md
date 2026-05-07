# Solen — Systems & Tools

> **Read this every session.** Match the user's request to a system, then follow it.

---

## Quick Match

| User wants... | System | Key file |
|---|---|---|
| Design new UI / redesign a component | **Design Lock** | `_tasks/SOLEN_LIVE_TRUTH.md` (V3 lock) + V3 preview HTML files |
| Compare code to design lock / audit drift | **Drift Audit** | `_audits/_chunks/audit-{1,2,3,4}-*.md` |
| Check for visual regressions after changes | **Playwright** | `playwright.config.ts` |
| Fix a visual bug / something looks wrong | **QA Registry** | `_tasks/VISUAL_QA_REGISTRY.md` |
| Wrong color / font / spacing / token | **Design Tokens** | `_tasks/SOLEN_LIVE_TRUTH.md` §1–§5i + `_rules/SOLEN_UI.md` |
| Animation / hover / interaction polish | **Animation** | `_tasks/SOLEN_LIVE_TRUTH.md` §5c (motion) |
| Decision history / why-did-we-pick | **Decision Log** | `_tasks/V2_REBUILD_LOG.md` (V2-D## entries) |
| Build a feature / new page / API route | **Feature Dev** | `_rules/CODE_SAFETY.md` |

---

## 1. Figma First

Design in Figma, get approval, then code. For any new or redesigned customer-facing UI.

**Figma file key:** `cInKwtgkD8TjUSSLDT40eF`

**Tools:** `use_figma`, `get_screenshot`, `get_design_context`, `search_design_system`, `get_metadata` — all via Figma MCP.

**Skills:** Always load `figma:figma-use` before calling `use_figma`. Use `figma:figma-implement-design` for code generation. Solen-specific loop: `.agents/skills/figma-solen-workflow`.

**Loop:** Design → Screenshot → User approves → Implement → Verify on localhost.

**Reference:** `_tasks/SOLEN_LIVE_TRUTH.md` (V3 lock — V2-D15-3, 2026-05-07) + V3 living previews: `public/solen-v2-republik-teal.html` (homepage), `public/solen-v2-palette.html` (palette), `public/solen-v2-combos.html` (combo grid). Figma artifacts are working drafts; **the lock lives in LIVE_TRUTH**, not in Figma. (Historical: SOLEN_DESIGN.md §20 Q-locks Q1–Q63 still hold for context, but V3 supersedes any conflict.)

---

## 2. Drift Audit

Compare live code to the locked design. Find and fix mismatches. **§20 Q-locks are source of truth** (Figma is iteration scratchpad).

**Drift findings:** `_audits/_chunks/audit-{1,2,3,4}-*.md` — six narrow scopes (tokens, component class drift, Q-lock implementation, rules contradictions, backend gaps, route coverage).

**Loop:** Screenshot Figma section → Read code file → Spot differences → Fix one at a time → Verify.

**Log mismatches in:** `_tasks/VISUAL_QA_REGISTRY.md` (Template B).

---

## 3. Playwright

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

## 4. QA Registry

Persistent log of visual bugs. Any agent can read it, fix issues, mark them done.

**File:** `_tasks/VISUAL_QA_REGISTRY.md`
**Audit workflow:** `.agents/workflows/ui-audit.md`

**Statuses:** `[OPEN]` → `[FIXED]` → `[VERIFIED]`

**Protocol:** Pick highest-severity `[OPEN]` → read file + line → make ONLY that change → `git diff` to verify scope → mark `[FIXED]`.

---

## 5. Design Tokens

All code must use design tokens. No arbitrary hex, no wrong fonts, no banned patterns.

**Component specs:** `_tasks/SOLEN_LIVE_TRUTH.md` (V3 lock — V2-D15-3) — single source of truth. **Read the relevant § BEFORE implementing any component.**
**Tailwind mapping:** `tailwind.config.js` (V3 tokens), `app/globals.css` (V3 CSS imports).
**Supplemental rules:** `_rules/SOLEN_UI.md` (interaction grammar, semantic-color discipline).

**V3 Key tokens (V2-D15-3):** `s-brand` (`#043338` dark teal — also kept as `s-coral` for backward-compat), `s-brand.pale` (`#C2F0F1`), `s-brand.subtle` (`#E1F4F4`), `s-brand.mid` (`#0A6873`), `s-cat-coiffeur`/`s-cat-barbershop`/`s-cat-nails`/`s-cat-spa` (4 V3 categories with text pairs), `s-ink` (`#1A1209`), `s-ink-2` (`#56463E`), `s-ink-3` (`#7A6957`), `s-border` (`#E8DFD2`), `s-bg` (`#FFFFFF` page), `s-bg-sunken` (`#FAF7F3`). Semantic: `s-love` (`#FF4A6B`), `s-success` (`#16A34A`), `s-warning` (`#F59E0B`), `s-error` (`#D32F2F`), `s-closed` (`#DC2626`), `s-star` (`#F3A864`). `rounded-card` (16px), `rounded-btn` (99px). `shadow-elevation-1/2/3` (warm-ink-tinted per §5b).

**Retired tokens:** `s-amber`, `s-blue`, `s-plum`, `s-yellow`, `s-sage`, `s-sand`, `s-bg-cream` (`#FFF4E8`) — V2-D15-3.

**Banned:** `shadow-sm/md/lg`, `hover:bg-s-brand/90` / `hover:bg-s-coral/90` (use brightness shift), `transition-all`, `text-black` (use `text-s-ink`), `rounded-lg/xl/2xl` (use `rounded-[Npx]` explicit), `dark:*` utilities (Q62 retired), `ease-in` on enters, `duration-500+` on UI. **`bg-white` is allowed** — page bg = white `#FFFFFF`.

---

## 6. Animation

Easing, timing, micro-interactions. Skills: `emil-design-eng`, `frontend-design`.

**Rules (per Q35 + SOLEN_UI):** Easing `cubic-bezier(0.2, 0.8, 0.4, 1)` (out-curve default); shared-element morph 400ms; standard slide 200ms. Enter from `opacity:0, y:12`. Press: `active:scale-[0.97]`. Stagger: 40-60ms. NEVER `transition-all`.

---

## 7. Feature Dev

Building features, pages, API routes. Every feature needs all 8 layers: types, DB migration, API route, component, page, i18n (4 locales), imported + rendered, navigation entry.

**Reference:** `_rules/CODE_SAFETY.md`, `_rules/STRUCTURAL_RULES.md`, `_rules/I18N_ROUTING.md`, `_rules/SECURITY_RULES.md`, `_rules/DB_SCHEMA.md`, `_rules/ROADMAP_RULES.md`, `_rules/LESSONS_LEARNED.md`, `_rules/KEY_FEATURES.md`. Search-bar grammar locked in `_tasks/SOLEN_DESIGN.md` §20 Q4 + Q48 (Fresha-flow stacked card).

**Check first:** `_tasks/INCOMPLETE_FEATURES.md` — might already be half-built.

---

## Also Available

| What | File | When |
|---|---|---|
| Multi-agent coordination | `_rules/AGENT_COORDINATION.md` | Multiple agents active, shared file edits |
| Solen context for skills | `.agents/skills/{design,review,refine}/SOLEN_CONTEXT.md` | Loaded automatically by those skills |

---

## Adding a New Tool

When you set up a new tool or workflow, add it here: a section with **what** it does, **when** to use it, key **commands/files**, and add a row to the quick-match table. Then add a one-liner to the CLAUDE.md systems summary list.
