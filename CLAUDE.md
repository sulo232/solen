# Solen.ch

Swiss beauty + wellness booking marketplace. Next.js App Router + Supabase + Stripe. Deploy: **Netlify** (auto from `main`). Cron via GitHub Actions (`.github/workflows/cron-jobs.yml`). i18n: de / en / fr / it.

---

## 🎨 Design system — start here

**Before any design / UI work: read `_design-system/SOURCE.md`.** It is the canonical, 22-section source-of-truth for tokens, motion, spacing, components, voice, a11y, and patterns.

**Key recent rules** (V3-D197 / V3-D198 / V3-D199, 2026-05-26):
- **Three-layer color system**: Layer 1 chrome (B&W) / Layer 2 brand accent (royal blue, small footprint) / Layer 3 semantic UI (color IS the message — Toast / StatusPill / AlertBanner / FormFieldError / etc.). Before picking ANY color class, answer §14.0's decision tree.
- **Universal-color convention**: don't invent semantic hues. success=green / error=red / warning=amber / info=blue / rating=yellow / save=pink / urgency=burnt-amber / disabled=muted-grey. See §1 universal colors table.
- **Saturation contract**: every new color token defines `.DEFAULT` (L 36-51%, S 65-92%) + `.bg/.pale` (L 93-96%) together. See §1 saturation contract.
- **Refined pastel pattern** for Layer 3 surfaces: pastel `.bg` + ink text + saturated icon. Tailwind UI / Stripe / Vercel — not screamy saturated solids. It **supersedes**:

- `_tasks/SOLEN_LIVE_TRUTH.md` → archived (pre-B&W pivot, V2-D70 era — almost entirely stale)
- `_tasks/SOLEN_DESIGN.md` → extracted into SOURCE.md §2 (Colors) + §1 (Positioning), 95% aligned with shipped code

**It complements (does NOT supersede)**:

- `_rules/SOLEN_PATTERNS.md` → Parts 4-5-8 (Fresha translation playbook) extracted into SOURCE.md §21; rest still useful for tactical reference. Some token refs are stale — defer to SOURCE.md when in conflict.
- `_rules/SOLEN_UI.md` → universal UX principles (orthogonal to tokens). Stays in place — token references inside need a refresh ([Q10 in QUESTIONS.md](_design-system/QUESTIONS.md#q10)).

**Per-component rules** live at `_design-system/components/<Name>.md`. **Open questions / drift items** live at `_design-system/QUESTIONS.md` — flag new questions there, don't ask in chat unless blocking.

**Component registry (the shared brain):** `_design-system/COMPONENT_REGISTRY.md` — every shared component listed with file path, Layer (1/2/3), public API, use-for/don't-reuse-for, status. **Read this BEFORE building any new component.** Drift-checker enforces membership (V3-D205).

**Agent brief template for route rebuilds:** `_design-system/AGENT_BRIEF_TEMPLATE.md` — standard self-contained brief for sub-agents doing Fresha-clone rebuilds. Fresha bones + Solen skin formula. Includes verifier-loop pattern.

**When creating a NEW shared component:** in the same turn, write `_design-system/components/<Name>.md` AND add to COMPONENT_REGISTRY.md. No new components without their doc + registry entry. Layer 1/2/3 declaration is mandatory in the .md.

**Universal-components rule (V3-D205):** same component renders correctly for every category (Coiffeur / Barber / Nails / Spa / Massage). No `if category === 'X'` branches. Drift-checker rule B5 flags violations.

**🔒 LOCKFILE (V3-D235, 2026-05-27):** `_design-system/LOCKFILE.md` is the frozen literal-values reference. Every token hex, primitive prop signature, copy pattern, layout invariant, and hard rule lives here as a single source of truth. **Subagents read it as immutable** — when a captured Fresha spec contradicts the LOCKFILE, the LOCKFILE wins. Only the orchestrator (not subagents) writes here; subagents propose changes in their return message for central merge. Created as the council-recommended single-highest-leverage fix to prevent aesthetic drift across parallel rebuild waves.

**🎚️ CONTROL_ELEVATION (V3-D420, 2026-06-01):** `_design-system/CONTROL_ELEVATION.md` decides when an interactive control is elevated-white-glass (A) vs flat (B) vs ink (C). One-line philosophy: **"elevation is earned by the background, not by the button."** Decision tree: the one primary commit action → ink fill (C); a control sitting OVER a photo → frosted white glass (A, shared recipe `lib/frost-glass.ts` `FROST_GLASS`); a calm control on white/stone → flat (B: text → `bg-s-bg-sunken` no shadow, icon-only → `bg-white border-s-border` no shadow). White+shadow on a calm surface is the banned "grey-haze" drift. **Read before styling any add-button, stepper, icon-button, or action pill.** Lives on the AESTHETIC axis (companion to LOCKFILE §3 + SOURCE §5/§14.0). Drift-checker rule A14 flags violations.

**🏗️ WORK_TYPES (V3-D331, 2026-05-28):** `_design-system/WORK_TYPES.md` is the work-type taxonomy. **Read it BEFORE scoping any new design / UI work.** Six types: (1) surgical fix, (2) route sweep, (3) component sweep, (4) ground-up rebuild, (5) new primitive, (6) major IA shift. Each has its own effort budget + verification requirement + commit granularity. User flag 2026-05-28 — sessions kept conflating types and budgeting the same way. Wave plans must tag each item with its work-type number. One wave = one shipping unit when all items are green + verified.

**🌊 WAVE_PLAN (V3-D331, 2026-05-28):** `_design-system/WAVE_PLAN.md` is the living roadmap of open work. Waves 9-17 enumerated with item-by-item work-type tagging + time estimates + verification requirements. Update after each wave completes. Order rationale: Salon PDP (W9) → Fusion finalize (W10) → Category landings (W11) → Spacing audit (W12) → Solen-originals (W13) → Map primitive (W14) → Booking flow separate session (W15) → Strict drift flip (W16) → Misc cleanup (W17).

**🎯 DUAL-AXIS SOURCE-OF-TRUTH (V3-D338, 2026-05-28) — THE MOST IMPORTANT RULE:** Per user "structure n evrth like fresha but colorways typography contrast like ubers." Every design decision sits on ONE of two axes. **STRUCTURE** (IA, layout, components, sections, hero pattern, sticky nav, grid layouts, what-section-goes-where, affordance set, copy density) = **Fresha** is source-of-truth (via `fresha-section-capture` skill → `public/_pixel-refs/fresha/<section>/SPEC.md`). **AESTHETIC** (colors, type role recipes, contrast pairings, accent application, eyebrow policy, imagery rules, spacing rhythm, motion timing, hover affordances) = **Uber via LOCKFILE §1.5/§2.5/§11/§6** is source-of-truth. **Both axes apply to every change. Never apply one without verifying the other.** Conflating them = the failure mode that's bitten this project ≥4 times (e.g. T4 of overnight run applied "Pattern 3" — an Uber Eats AESTHETIC pattern — as if it were a structural PDP-hero rule, when Fresha's actual PDP hero is 3-photo grid). Full rule + decision tree + anti-pattern catalogue at `_design-system/LOCKFILE.md` §10.0-§10.7. **Operational layer** (§10.8) — per-axis skill stack (which tool when), drift signals (concrete tells you're conflating), self-auto-verification triggers (when to run each check), the 60-second pre-edit check (Q1-Q5 script), Fresha SPEC.md cache TTL (30-day default), and the single-test "would my change MATCH or DIVERGE from current Fresha?" axis-identifier. **Read §10.0 + §10.8 before any non-trivial edit.** WORK_TYPES.md "Pre-task self-auto-verification" section mirrors the operational layer at the per-task scope.

**Drift check skill:** `/solen-drift-check` runs the static drift checker — logs token + dead-click drift to `_design-system/_drift-report.md` and `_pending-migration.md`. Never halts. Add a file to `_design-system/_rebuilt_routes.json` `strict_globs` when it passes clean.

**🎯 Fresha-clone capture skill (V3-D230, 2026-05-27):** `fresha-section-capture` is the FIRST tool to fire for any Fresha-clone section rebuild. Replaces eyeballing screenshots. Navigates the real Fresha URL via Playwright, snaps mobile + desktop, walks the DOM for computed CSS (sizes/colors/transitions/animations), clicks every interactive and screenshots the result, outputs a `SPEC.md` with measurements + a mission-lock translation table at `public/_pixel-refs/fresha/<section>/`. **Mission lock when rebuilding from a Fresha spec:** exact copy of Fresha section anatomy, spacing, hierarchy, animations, click states — ONLY exceptions are Solen primitives (the registry list), tokens (`s-accent #276EF1` / `s-star #FFC32B` / heart `#FF3366` / `s-urgency #9A3412`), fonts (Inter Tight / Inter), CTA discipline (primary stays `bg-s-ink` per V3-D192-fix). Anti-pattern this prevents: "screenshot whack-a-mole" — patching surface deltas without seeing motion + click states + structure. If you find yourself eyeballing a Fresha screenshot to rebuild a section, STOP, fire the skill instead.

---

## 🚨 Surgical edits only

1. Never rewrite a whole file — change only the lines that cause the reported bug.
2. Match the exact scope of the request — padding fix = padding class, nothing else.
3. Read before editing — find the exact lines, confirm match, then change.
4. Never `npm run build` unless asked — dev runs on port 3000.
5. `git diff` after each fix — verify only the intended thing changed.

---

## 📂 User's screenshot folder

The user saves all their phone screenshots, AI-generated illustrations, and reference images to:

**`/Users/sulo/solen/screenshots/`**

(Note: this is OUTSIDE the project at `~/solen/screenshots/` — separate from in-project `_audits/screenshots/` which Claude uses for Playwright captures.)

When the user says "I pasted in the screenshot folder", "see the screenshot folder", or refers to images they shared but the inline-attached images aren't a file you can process — look here FIRST. Filenames are usually `IMG_XXXX.png` (phone) or UUID-named `.png` (Mac screenshots / Nano Banana outputs).

---

## ⚡ Terminal autonomy

- ✅ npm/npx, git (status/add/commit/push/diff/log), tsc checks, file ops
- ❌ Ask before: `git push --force`, `reset --hard`, DB data deletion, `.env.local` edits

---

## Workflow rules

- **Functional rules** live in `_rules/*` (code safety, structural, i18n, security, db, lessons learned). Read the relevant one before related work.
- **Incomplete features** → append to `_tasks/INCOMPLETE_FEATURES.md` (file:line · blocker · next steps). **Never delete entries.**
- **Error handling** → never `.catch(() => {})`. Always `console.error("[Component] description:", err)`. Auth flows: log + redirect to login. Payment flows: log + user-visible error + retry.
