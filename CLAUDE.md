# Solen.ch — Project Configuration

> Every AI agent must read this file before changes.

**Stack:** Next.js App Router · TS · Tailwind · Supabase · Stripe · Netlify.
**Reference (load on demand):** `_docs/PROJECT_REFERENCE.md` (full stack table, architecture, commands, deployment, task-tracking conventions).

---

## 🎨 Design system — single source of truth

- **READ FIRST (the principal — current locked state, no history):** `_tasks/SOLEN_LIVE_TRUTH.md`
- **History / context (slower-moving Q-lock decision log — archived):** `_tasks/archive/SOLEN_DESIGN.archived.md` §20
- **Preview (V3 locked, 2026-05-07):** `public/solen-v2-republik-teal.html` (homepage) · `public/solen-v2-palette.html` (full palette) · `public/solen-v2-combos.html` (31-combo grid) — serve via `npx serve public -p 4747`
- **Hierarchy when docs conflict:** `SOLEN_LIVE_TRUTH.md` wins over Q-locks wins over reference HTML wins over component JSDoc. **If `SOLEN_LIVE_TRUTH.md` is wrong, fix it first**, then propagate to other files. Never reverse.

**Retired — do not reintroduce:**
- **Brand colors:** V1 green+peach (`#1B4D1C` / `#F5A962`), V2 brand orange `#E8742A` (retired V2-D15-3), `#FFE4D2` brand-subtle peach, `#8A3C0F` brand-text, `#5C2308` brand-text-deep, `#F0834D` hover-top, hover gradient `#F0834D → #E8742A`
- **6-cat colorways** (retired V2-D15-3): `#B5588A` rose, `#E8A957` sunny, `#C77A5C` clay, `#88B89E` sage, `#D66547` coral-orange, `#A66E3D` camel, `#9B7BB8` plum (V2-D15-2 purple ban). 5th cat Makeup retired entirely.
- **Typography:** Plus Jakarta, Outfit, Phosphor, Anton, Bebas Neue, Bricolage Grotesque (V2 display — retired V2-D15-3), Inter Tight (retired as primary V2-D15-3, retired as fallback V2-D42), Instrument Serif italic, JetBrains Mono, DM Sans, Figtree, Fraunces, Cooper BT (V3 display — retired V2-D42), Cooper Black Std, ITC Avant Garde Gothic Std (V3 body — retired V2-D42), Sansita 900 (Cooper fallback — retired V2-D42), League Spartan (Avant Garde fallback — retired V2-D42)
- **Surfaces:** warm cream substrate `#FBF8F3` (V2-D15 reverted to white), V5 zone language, glass-everywhere, 3:2 cover photos, dark mode, blobs-in-every-section
- **Italic anywhere in UI** — period (V2-D15)
- **V2-D15-3 era V3 dark teal trio** (retired V2-D48 2026-05-09): `#043338` brand teal + `#C2F0F1` pale teal + `#E1F4F4` brand subtle + `#0A6873` brand-mid. Replaced by Earthen Wellness Light emerald palette below.
- **V2-D15-3 era V3 cat text colors** (retired V2-D48): cherry `#B5345A` (was Coiffeur text), magenta `#B50051` (was Nails text), sandy beige `#948565` (was Spa text). Replaced by Earthen Wellness Light cat colors below.
- **Sage `#A8B89A` as a CTA / button / glyph-bg color** (retired V2-D49j 2026-05-10 — too low contrast on cream). Sage stays only as an atmosphere-blob hue.

**Locked V3 brand (V2-D48 Earthen Wellness Light, 2026-05-09):** emerald `#1F5C42` (`s-brand`) + terracotta `#C97A57` (`s-accent`) + cream substrate `#F5EBDD` (`s-bg-base`). Pale `#A8CFB8`, subtle `#D4EBD9`, brand-mid `#0F3D26`, brand-deep `#0A2917`.

**Color rule (V2-D49j 2026-05-10, locked LIVE_TRUTH §5h principle 9 + §5h.2):** emerald `s-brand` is the ONLY color allowed on action affordances (CTAs, primary links, focus outlines, success/check glyphs, active chip states). Terracotta `s-accent` is reserved for ONE-OR-TWO highlight words inside h1/h2 display text + logo dot + eyebrow leading-dot — **never on buttons, never on links, never on glyph backgrounds.** Heart-saved fill is the universal-semantic exception (love-red `#FF4A6B`).

**Locked V3 categories (4, V2-D48 Earthen Wellness Light):** Coiffeur `#FAF2E5`/`#C97A57` (cream+terracotta), Barbershop `#E8DDC9`/`#2A1F18` (bone+ink), Nails `#D4DDC8`/`#8E4A2D` (sage-pale+terra-deep), Spa & Wellness `#D4EBD9`/`#0F3D26` (emerald-subtle+emerald-deep).

**Locked V3 typography (V2-D42, 2026-05-09 — overrides V2-D15-3):** Peace Sans (display: hero h1, logo, feature h2) + Open Sauce One (body/UI: section h2s, eyebrows, body text, buttons, microcopy). Both via cdnfonts. Inter via Google Fonts as the cdnfonts-failure fallback for body. Peace Sans + Open Sauce Sans were briefly tried earlier in V2-D15-3 evolution but a different variant (Open Sauce **Sans**, broken on cdnfonts) — V2-D42 picks Open Sauce **One** (sister font, full 300-900 weights, working CDN).

Full V3 spec lives in `_tasks/SOLEN_LIVE_TRUTH.md` §1 brand, §2 categories, §5 typography, §5a pill rule, §5g atmosphere wash, §5h color philosophy, §5i combo library. Operational playbook (pattern library + Fresha translation rules): `_rules/SOLEN_PATTERNS.md`. Decision log: `_tasks/V2_REBUILD_LOG.md` (latest series V2-D48 / V2-D42 / V2-D49j).

---

## 🎨 Design exploration — skill-first 4-stack (auto-trigger sequence)

For ANY visual / design question, run this skill sequence INSTEAD of opening `.tsx` components. NEVER iterate on visual questions in real component code.

### Step 1 · `huashu-design` (auto-trigger) — variation exploration

Build 3–5 variations side-by-side at `public/solen-v3-mockup-{topic}.html` using real V3 tokens (`s-brand`, `s-accent`, `s-bg-base`, Peace Sans, Open Sauce One). Has "Design Direction Advisor" fallback for vague briefs (3 directions from 20 design philosophies). User picks a letter → refine micro-variations → lock.

**Auto-trigger phrases** (call `Skill` with `skill: "huashu-design"` as FIRST action — before any Read/Edit/Write on layout components):
- "redesign / redo / rework / design the X / overhaul"
- "make it look like [ref]", "match [ref] style", "like [site].com"
- "mockup", "variations", "options", "explore designs", "show me alternatives"
- "hero / header / card / footer variants"
- "design direction", "visual feel", "vibe", "make it more [adj]" applied to style
- "is this the right look", "does this feel [adj]"

### Step 2 · Execute — port the locked variation to React

Single clean edit to the real component. Use existing V3 tokens. No improvisation, no scope creep, no "while I'm in here" tweaks.

### Step 3 · `uiux-audit` (auto-trigger after build) — production-standards review

Audits the rendered output against 20 production UI/UX standards: visual hierarchy, typography scale, WCAG 2.2 accessibility, animation performance, responsive issues, states (hover/focus/active/disabled/loading), spacing rhythm, contrast ratios. **This compensates for my visual-detail blind spots** — it sees what I miss.

**Auto-trigger phrases:** "review / audit / check / improve / critique / accessibility check / WCAG / responsive / dark mode / states / hierarchy / spacing / make this look better".

Returns a punch list with severity. Fix high-severity items, re-audit. Stop on PASS or after 3 rounds.

### Step 4 · `emil-design-eng` (optional final polish) — motion / micro-interaction

Run ONLY after layout + uiux-audit pass. Reviews timing, easing, choreography for hover / focus / entry / exit animations. Output format: markdown table `| Before | After | Why |`.

### Anti-patterns (V2-D56 session burned 6 rounds on these)

- Opening `Header.tsx` / `Hero.tsx` / `SearchBar.tsx` for a visual question
- Interpreting visual feedback in words ("rounded the other way") instead of building variations to point at
- HMR-cycling on real components instead of comparing flat artboards
- Claiming "done" based on my eye alone — skip `uiux-audit` and I miss details (corner-curve direction, micro-spacing rhythm, contrast failures)

### Exceptions (regular code edits, not design)

- Surgical bug fixes: "the logo is 2px off", "dropdown broken on mobile"
- Token swaps where decision is already made: "use `s-brand` here"
- Data wiring / API connection / state logic

### Planned: `solen-design` custom skill

A `skill-creator`-built wrapper that pre-loads V3 tokens + anti-patterns + retired-color list, auto-triggers on Solen visual questions, and calls the 4-stack internally. Status: TBD. Builds in ~1hr, compounds across every future design task.

**Memory backup:** `feedback_check_skills_first.md` in user memory mirrors this stack across sessions.

---

## 🚨 Surgical edits only

1. Never rewrite a whole file — change only the lines that cause the bug.
2. Match the exact scope of the request.
3. Read before editing.
4. Never `npm run build` unless asked.
5. `git diff` after each fix.
6. **Mass token sweeps are runtime-blocked.** A `PreToolUse` hook (`.claude/hooks/pre-sweep-check.sh`, registered in `.claude/settings.json`) BLOCKS any `Edit` with `replace_all: true` whose `old_string` contains a hex literal that exists in `public/solen-coral.html` or `_tasks/archive/SOLEN_DESIGN.archived.md`. Skipped paths: `tailwind.config.js`, `app/globals.css`, every `_tasks/_rules/_audits/_docs/_specs/_plans/_visual-qa/`, `CLAUDE.md`, `.claude/`, `messages/*.json`. To explicitly authorize a brand-pivot-style sweep (e.g. Q64), the user runs `touch .claude/sweep-approved.flag` — flag auto-expires in 10 minutes. This exists because lesson L8 in `_tasks/archive/SOLEN_BUILD_LEARNINGS.archived.md` self-diagnosed that documentation alone didn't prevent sweep-without-grep failures.

---

## ✅ "Done" claim discipline (runtime-enforced)

Before saying "it's done / fixed / shipped / working / rendering" for any UI work:

1. Open the relevant URL with `mcp__playwright__browser_navigate`
2. Take a screenshot with `mcp__playwright__browser_take_screenshot`
3. Quote in 1-2 lines what's literally visible on the rendered page (e.g. "viewport shows header + 4 salon cards bleeding to frame edge; no atmosphere clipping at the boundary")
4. Then say done.

`tsc --noEmit clean` / `curl 200` / `log-grep returns 0 errors` are **necessary but never sufficient** per global CLAUDE.md rules 7 + 8 + 9. The screenshot + literal description IS the close condition for visual / behavioral claims.

**Runtime enforcement:** `.claude/hooks/pre-done-claim-check.sh` (registered under `hooks.Stop` in `.claude/settings.json`) blocks the agent from ending its turn when ALL three hold:
- Last assistant text contains done-class language (`it's done` / `renders correctly` / `all sections present` / `no errors` / etc.)
- AT LEAST ONE `Edit` or `Write` to a UI file (`.tsx` / `.css` / `components-legacy/`) happened in the recent transcript
- NO `mcp__playwright__browser_*` tool was used in the recent transcript

When blocked, the hook injects a system-reminder telling the agent to either verify in Playwright now or retract the claim.

**Override** (legitimate docs-only or non-UI completion claim the heuristic misjudged):
```sh
touch .claude/done-claim-override.flag   # 5-minute TTL
```

This rule is belt-and-suspenders — the global CLAUDE.md already has rules 7 + 8 + 9 (verifier-loop protocol). This project-level entry exists because documentation alone didn't prevent the failure pattern across the V3 rebuild sessions. The hook is the actual fix; this section is the receipt.

**What this hook does NOT fix:** scope creep, taste-fork skipping, missing-spec-items. Those need pre-build scope confirmation + verifier sub-agents per global rule 9, not post-claim verification.

---

## 🗣 Discuss-before-execute (design + structural)

Order: **PROPOSE → WAIT → EXECUTE → VERIFY**. For design tokens, components, layout, or `SOLEN_LIVE_TRUTH.md` / V3 preview HTML (`solen-v2-republik-teal.html`, `solen-v2-palette.html`, `solen-v2-combos.html`) edits, propose options first and wait for explicit "ok / lock / go".

**Skip protocol:** clear-repro bug fixes, terminal commands per §⚡, or user says "just do it / ship it".

---

## 🔍 Verify before asking

Try to answer yourself first. Use `grep` / `Read` / `git log` / `preview_eval` / existing docs (`_tasks/SOLEN_LIVE_TRUTH.md`, `_rules/*.md`, `_tasks/V2_REBUILD_LOG.md`, `package.json`, `tailwind.config.js`). Older docs (`SOLEN_DESIGN.md`, `REDESIGN_INVENTORY.md`, `BACKEND_NEEDS_UI.md`, `GAP_AUDIT_V2.md`) are archived under `_tasks/archive/` — re-derive against V3 LIVE_TRUTH instead of consulting the archives.

**Only ask the user about:** preferences, taste, intent, business decisions, or info only they have.

---

## ⚡ Terminal autonomy

Run npm/npx, git status/add/commit/push/diff/log, tsc, file ops without asking.
**Ask before:** `git push --force`, `reset --hard`, DB data deletion, `.env.local` edits.

## 🚀 Deploy workflow (Netlify, migrated 2026-05-09)

**Local preview:** `npm run dev` for the app · `npx serve public -p 4747` for design preview HTML files.

**Production:** every push to `main` auto-deploys to Netlify. Build config lives in `netlify.toml`. There's no `[deploy]` commit-message token anymore — pushes to `main` DO deploy, period.

**Crons:** GitHub Actions runs `.github/workflows/cron-jobs.yml` to invoke `/api/cron/*` routes on schedule (replaces the old `vercel.json` crons).

**Memory rule (still active):** every commit message must end with `[skip vercel]` — belt-and-suspenders for the paused Vercel project from pre-migration. Has no effect on Netlify deploys; harmless redundancy.

**Default workflow:** commit + push to feature/worktree branches freely; nothing reaches production. Only merge to `main` (or push to `main`) when the user explicitly says "deploy" / "merge to main" / "ship it."

---

## ⚠️ INCOMPLETE_FEATURES is sacred

If a feature can't finish: append to `_tasks/INCOMPLETE_FEATURES.md` using the canonical format (Feature · File/Line · Backend · Frontend · Blocker · Next Steps · Priority — see `_rules/STRUCTURAL_RULES.md` Rule 45 for the full schema). Never delete or hide failures. File is never deleted.

---

## ❌ Error handling

Never `.catch(() => {})`. Always `console.error("[Component] desc:", err)`. Auth fetches → log + redirect. Payment flows → log + user-visible error with retry.

---

## 🔌 V3 wire-up status (2026-05-10)

V3 UI is largely shipped (homepage, SearchBar with Path C hub, atmosphere, sections) but **most homepage feed sections still use static `DEMO` arrays** (Coiffeur, LastMinute, Nearby, RecentlyViewed) — the salons shown are fake. The search-results page still renders legacy `SplitView`. Booking flow, auth, favorites, profile = NOT BUILT in V3.

**Active audit:** `_audits/2026-05-10-v3-wireup-audit.md` — phased customer-side wireup + reconnection. Customer surfaces only this round; B2B/Stripe/crons/email = separate audit later.

**Strategy = Modified Z (3-tier rebuild):**
- **Tier 1 (~15 critical-funnel pages, ~2 weeks):** search, salon detail, salon/booking, checkout, confirmation, auth/login, auth/signup, profile, profile/favorites, profile/bookings, 4 category pages, /[city]. Lock V2-D52, merge to main.
- **Tier 2 (~30 secondary surfaces, ~3 weeks):** salon detail extras, profile extras, help, vouchers, discover, onboarding, etc. Lock V2-D53.
- **Tier 3 (~45 long-tail, ~3 weeks):** legal pages, niche flows, brand pages. Lock V2-D54.

**91 of 114 customer page.tsx files import from `components-legacy/` (80%).** The V3 homepage is a beautiful lobby that opens onto a legacy hotel. All 91 eventually get V3 treatment.

**Don't ship Path C alone** — it's calling into broken downstream surfaces. Tier 1 ships together when Phase G.1 verifies all critical-funnel paths.

---

## ⭐ Design enforcement

Anything visual must come from `_tasks/SOLEN_LIVE_TRUTH.md` (V3 lock — V2-D15-3 era → V2-D48 Earthen Wellness Light pivot 2026-05-09 → V2-D42 typography pivot 2026-05-09 → V2-D49j color rule 2026-05-10). New colors use existing tokens. To change the design itself: edit `SOLEN_LIVE_TRUTH.md` first, then update any V3 mockup HTML in `public/solen-v2-*.html`, then log decision as next `V2-D##` entry in `_tasks/V2_REBUILD_LOG.md`. Historical Q-locks in `_tasks/archive/SOLEN_DESIGN.archived.md` §20 are context only — V3 supersedes any conflict.

**🚨 Permanent technical anti-patterns (LIVE_TRUTH §0d.7 + V2_REBUILD_LOG.md V2-D41-fu).** Read these BEFORE editing layout, body styles, atmosphere wash, salon cards, search bar, or section frames. Breaking any silently breaks visible design:
1. ❌ `bg-white` on `<body>` element (kills atmosphere wash)
2. ❌ Cat-color halo glows on salon cards (retired V2-D41)
3. ❌ Section padding ↔ ScrollRow margin drift (cards stick out past rounded border)
4. ❌ "Fixing" Cooper Black Std cdnfonts URL by reordering font-family (actual loaded font is Sansita 900)
5. ❌ `will-change` / `transform: translateZ(0)` at REST (causes blurry text)
6. ❌ Animating `width` / `height` to/from `auto` (browsers can't smooth this)
7. ❌ `mix-blend-mode: multiply` on `AtmosphereBlobs.tsx` (retired V2-D54 2026-05-11 — multiply darkens everything under blobs, producing a brownish film over cream substrate; cards look tinted and the page feels "just beige."). Also ❌ stacking >5 blobs or pushing opacity > 0.10 (retired V2-D55 2026-05-11 — V2-D54's vibrant glow ate the substrate; page felt "designer-pour" not "natural light"). Locked V2-D55 recipe: 5 blobs, `mix-blend-mode: normal`, opacity 0.05-0.08, `blur(130px) saturate(0.85)`. See `_rules/SOLEN_PATTERNS.md` §1.5.

---

## 📚 Topic-specific rules (load when relevant)

| Topic | File |
|---|---|
| DB schema | `_rules/DB_SCHEMA.md` |
| Security (RLS, rate limit, Zod) | `_rules/SECURITY_RULES.md` |
| Code safety | `_rules/CODE_SAFETY.md` |
| Structural | `_rules/STRUCTURAL_RULES.md` |
| I18N | `_rules/I18N_ROUTING.md` |
| Key features (60-entry list) | `_rules/KEY_FEATURES.md` |
| Lessons learned | `_rules/LESSONS_LEARNED.md` |
| **V3 patterns + Fresha playbook** | `_rules/SOLEN_PATTERNS.md` |
| **V3 wire-up audit (in progress 2026-05-10)** | `_audits/2026-05-10-v3-wireup-audit.md` |
| UI principles (skill) | `_rules/SOLEN_UI.md` |
| Agent coordination | `_rules/AGENT_COORDINATION.md` |
| Roadmap rules | `_rules/ROADMAP_RULES.md` |
| Systems map | `_rules/SYSTEMS.md` |
