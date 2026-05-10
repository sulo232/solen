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

## 🚨 Surgical edits only

1. Never rewrite a whole file — change only the lines that cause the bug.
2. Match the exact scope of the request.
3. Read before editing.
4. Never `npm run build` unless asked.
5. `git diff` after each fix.
6. **Mass token sweeps are runtime-blocked.** A `PreToolUse` hook (`.claude/hooks/pre-sweep-check.sh`, registered in `.claude/settings.json`) BLOCKS any `Edit` with `replace_all: true` whose `old_string` contains a hex literal that exists in `public/solen-coral.html` or `_tasks/archive/SOLEN_DESIGN.archived.md`. Skipped paths: `tailwind.config.js`, `app/globals.css`, every `_tasks/_rules/_audits/_docs/_specs/_plans/_visual-qa/`, `CLAUDE.md`, `.claude/`, `messages/*.json`. To explicitly authorize a brand-pivot-style sweep (e.g. Q64), the user runs `touch .claude/sweep-approved.flag` — flag auto-expires in 10 minutes. This exists because lesson L8 in `_tasks/archive/SOLEN_BUILD_LEARNINGS.archived.md` self-diagnosed that documentation alone didn't prevent sweep-without-grep failures.

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

## ⭐ Design enforcement

Anything visual must come from `_tasks/SOLEN_LIVE_TRUTH.md` (V3 lock — V2-D15-3 era → V2-D48 Earthen Wellness Light pivot 2026-05-09 → V2-D42 typography pivot 2026-05-09 → V2-D49j color rule 2026-05-10). New colors use existing tokens. To change the design itself: edit `SOLEN_LIVE_TRUTH.md` first, then update any V3 mockup HTML in `public/solen-v2-*.html`, then log decision as next `V2-D##` entry in `_tasks/V2_REBUILD_LOG.md`. Historical Q-locks in `_tasks/archive/SOLEN_DESIGN.archived.md` §20 are context only — V3 supersedes any conflict.

**🚨 Permanent technical anti-patterns (LIVE_TRUTH §0d.7 + V2_REBUILD_LOG.md V2-D41-fu).** Read these BEFORE editing layout, body styles, atmosphere wash, salon cards, search bar, or section frames. Breaking any silently breaks visible design:
1. ❌ `bg-white` on `<body>` element (kills atmosphere wash)
2. ❌ Cat-color halo glows on salon cards (retired V2-D41)
3. ❌ Section padding ↔ ScrollRow margin drift (cards stick out past rounded border)
4. ❌ "Fixing" Cooper Black Std cdnfonts URL by reordering font-family (actual loaded font is Sansita 900)
5. ❌ `will-change` / `transform: translateZ(0)` at REST (causes blurry text)
6. ❌ Animating `width` / `height` to/from `auto` (browsers can't smooth this)

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
| UI principles (skill) | `_rules/SOLEN_UI.md` |
| Agent coordination | `_rules/AGENT_COORDINATION.md` |
| Roadmap rules | `_rules/ROADMAP_RULES.md` |
| Systems map | `_rules/SYSTEMS.md` |
