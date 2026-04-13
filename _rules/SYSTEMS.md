# Solen — Systems & Tools

> **Read this every session.** Match the user's request to a system, then follow it.

---

## Quick Match

| User wants... | System | Key file |
|---|---|---|
| Design new UI / redesign a component | **Figma First** | `_rules/FIGMA_CODE_SYNC.md` |
| Compare code to Figma / audit accuracy | **Figma Sync** | `_rules/FIGMA_CODE_SYNC.md` |
| Check for visual regressions after changes | **Playwright** | `playwright.config.ts` |
| Fix a visual bug / something looks wrong | **QA Registry** | `_tasks/VISUAL_QA_REGISTRY.md` |
| Wrong color / font / spacing / token | **Design Tokens** | `_rules/UI_RULES.md` |
| Animation / hover / interaction polish | **Animation** | `emil-design-eng` skill |
| Build a feature / new page / API route | **Feature Dev** | `_rules/CODE_SAFETY.md` |

---

## 1. Figma First

Design in Figma, get approval, then code. For any new or redesigned customer-facing UI.

**Figma file key:** `cInKwtgkD8TjUSSLDT40eF`

**Tools:** `use_figma`, `get_screenshot`, `get_design_context`, `search_design_system`, `get_metadata` — all via Figma MCP.

**Skills:** Always load `figma:figma-use` before calling `use_figma`. Use `figma:figma-implement-design` for code generation. Solen-specific loop: `.agents/skills/figma-solen-workflow`.

**Loop:** Design → Screenshot → User approves → Implement → Verify on localhost.

**Reference:** `_rules/FIGMA_CODE_SYNC.md` (section map with node IDs), `_rules/FIGMA.md` (file structure).

---

## 2. Figma Sync

Compare Figma designs to live code. Find and fix mismatches. Figma is source of truth.

**Section map:** `_rules/FIGMA_CODE_SYNC.md` maps 15 homepage sections with exact Figma node IDs to code files.

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

**Component specs:** `_rules/DESIGN_SPEC.md` — the complete design system with exact values for every component, color, shadow, spacing, animation, and interaction. **Read the relevant section BEFORE implementing any component.**
**Tailwind mapping:** `tailwind.config.js` (tokens), `app/globals.css` (CSS vars).
**Rules:** `_rules/UI_RULES.md`, `_rules/SOLEN_DESIGN_SYSTEM.md`.

**Key tokens:** `s-coral` (#E8735A accent, #C05038 button, #B84A35 text), `s-ink` (#222222), `s-amber`, `s-blue`. `rounded-card` (16px), `rounded-btn` (99px). `shadow-elevation-1/2/3`. See `_rules/DESIGN_SPEC.md` for all values.

**Banned:** `shadow-sm/md/lg`, `hover:bg-s-coral/90`, `transition-all`, `bg-white`, `text-black`, `rounded-lg`, `ease-in` on enters, `duration-500+` on UI.

---

## 6. Animation

Easing, timing, micro-interactions. Skills: `emil-design-eng`, `frontend-design`.

**Rules:** Easing `cubic-bezier(0.23, 1, 0.32, 1)`. Duration 100-300ms. Enter from `opacity:0, y:12`. Press: `active:scale-[0.97]`. Stagger: 40-60ms.

---

## 7. Feature Dev

Building features, pages, API routes. Every feature needs all 8 layers: types, DB migration, API route, component, page, i18n (4 locales), imported + rendered, navigation entry.

**Reference:** `_rules/CODE_SAFETY.md`, `_rules/STRUCTURAL_RULES.md`, `_rules/I18N_ROUTING.md`, `_rules/SECURITY_RULES.md`, `_rules/DB_SCHEMA.md`, `_rules/ROADMAP_RULES.md`, `_rules/LESSONS_LEARNED.md`, `_rules/KEY_FEATURES.md`, `_rules/search-bar-rules.md`.

**Check first:** `_tasks/INCOMPLETE_FEATURES.md` — might already be half-built.

---

## Also Available

| What | File | When |
|---|---|---|
| Intentional Figma deviations | `_rules/FIGMA_DEVIATIONS.md` | Code correctly differs from Figma — log it so audits don't re-flag |
| Multi-agent coordination | `_rules/AGENT_COORDINATION.md` | Multiple agents active, shared file edits |
| Asset generation | `_rules/GENERATION_TOOLS.md` | Need icons (Recraft.ai), animations (LottieFiles), UI icons (lucide-react) |
| Solen context for skills | `.agents/skills/{design,review,refine}/SOLEN_CONTEXT.md` | Loaded automatically by those skills |

---

## Adding a New Tool

When you set up a new tool or workflow, add it here: a section with **what** it does, **when** to use it, key **commands/files**, and add a row to the quick-match table. Then add a one-liner to the CLAUDE.md systems summary list.
