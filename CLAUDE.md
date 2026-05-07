# Solen.ch — Project Configuration

> Every AI agent must read this file before changes.

**Stack:** Next.js App Router · TS · Tailwind · Supabase · Stripe · Vercel.
**Reference (load on demand):** `_docs/PROJECT_REFERENCE.md` (full stack table, architecture, commands, deployment, task-tracking conventions).

---

## 🎨 Design system — single source of truth

- **READ FIRST (the principal — current locked state, no history):** `_tasks/SOLEN_LIVE_TRUTH.md`
- **History / context (slower-moving Q-lock decision log):** `_tasks/SOLEN_DESIGN.md` §20
- **Preview (V3 locked, 2026-05-07):** `public/solen-v2-republik-teal.html` (homepage) · `public/solen-v2-palette.html` (full palette) · `public/solen-v2-combos.html` (31-combo grid) — serve via `npx serve public -p 4747`
- **Hierarchy when docs conflict:** `SOLEN_LIVE_TRUTH.md` wins over Q-locks wins over reference HTML wins over component JSDoc. **If `SOLEN_LIVE_TRUTH.md` is wrong, fix it first**, then propagate to other files. Never reverse.

**Retired — do not reintroduce:**
- **Brand colors:** V1 green+peach (`#1B4D1C` / `#F5A962`), V2 brand orange `#E8742A` (retired V2-D15-3), `#FFE4D2` brand-subtle peach, `#8A3C0F` brand-text, `#5C2308` brand-text-deep, `#F0834D` hover-top, hover gradient `#F0834D → #E8742A`
- **6-cat colorways** (retired V2-D15-3): `#B5588A` rose, `#E8A957` sunny, `#C77A5C` clay, `#88B89E` sage, `#D66547` coral-orange, `#A66E3D` camel, `#9B7BB8` plum (V2-D15-2 purple ban). 5th cat Makeup retired entirely.
- **Typography:** Plus Jakarta, Outfit, Phosphor, Anton, Bebas Neue, Bricolage Grotesque (V2 display — retired V2-D15-3), Inter Tight as PRIMARY (kept only as fallback), Instrument Serif italic, JetBrains Mono, DM Sans, Figtree, Fraunces, Peace Sans, Open Sauce Sans
- **Surfaces:** warm cream substrate `#FBF8F3` (V2-D15 reverted to white), V5 zone language, glass-everywhere, 3:2 cover photos, dark mode, blobs-in-every-section
- **Italic anywhere in UI** — period (V2-D15)
- **Locked V3 brand:** dark teal `#043338` + pale teal `#C2F0F1` + brand subtle `#E1F4F4`
- **Locked V3 categories (4):** Coiffeur=Z (cream+cherry), Barbershop=G (bone+black), Nails=A (pale ice blue+magenta), Spa & Wellness=I (forest+sandy beige). See `public/solen-v2-combos.html` for the 31-combo library reference.
- **Locked V3 typography:** Cooper BT (display) + ITC Avant Garde Gothic Std (body/UI). Free fallbacks: Sansita 900 + League Spartan.

Full V3 spec lives in `_tasks/SOLEN_LIVE_TRUTH.md` §1 brand, §2 categories, §5 typography, §5a pill rule, §5g atmosphere wash, §5h color philosophy, §5i combo library. Decision log: `_tasks/V2_REBUILD_LOG.md` V2-D15-3.

---

## 🚨 Surgical edits only

1. Never rewrite a whole file — change only the lines that cause the bug.
2. Match the exact scope of the request.
3. Read before editing.
4. Never `npm run build` unless asked.
5. `git diff` after each fix.
6. **Mass token sweeps are runtime-blocked.** A `PreToolUse` hook (`.claude/hooks/pre-sweep-check.sh`, registered in `.claude/settings.json`) BLOCKS any `Edit` with `replace_all: true` whose `old_string` contains a hex literal that exists in `public/solen-coral.html` or `_tasks/SOLEN_DESIGN.md`. Skipped paths: `tailwind.config.js`, `app/globals.css`, every `_tasks/_rules/_audits/_docs/_specs/_plans/_visual-qa/`, `CLAUDE.md`, `.claude/`, `messages/*.json`. To explicitly authorize a brand-pivot-style sweep (e.g. Q64), the user runs `touch .claude/sweep-approved.flag` — flag auto-expires in 10 minutes. This exists because L8 (SOLEN_BUILD_LEARNINGS.md) self-diagnosed that documentation alone didn't prevent sweep-without-grep failures.

---

## 🗣 Discuss-before-execute (design + structural)

Order: **PROPOSE → WAIT → EXECUTE → VERIFY**. For design tokens, components, layout, or `SOLEN_LIVE_TRUTH.md` / V3 preview HTML (`solen-v2-republik-teal.html`, `solen-v2-palette.html`, `solen-v2-combos.html`) edits, propose options first and wait for explicit "ok / lock / go".

**Skip protocol:** clear-repro bug fixes, terminal commands per §⚡, or user says "just do it / ship it".

---

## 🔍 Verify before asking

Try to answer yourself first. Use `grep` / `Read` / `git log` / `preview_eval` / existing docs (`SOLEN_DESIGN.md`, `_rules/*.md`, `_tasks/REDESIGN_INVENTORY.md`, `_tasks/BACKEND_NEEDS_UI.md`, `_tasks/GAP_AUDIT_V2.md`, `package.json`, `tailwind.config.js`).

**Only ask the user about:** preferences, taste, intent, business decisions, or info only they have.

---

## ⚡ Terminal autonomy

Run npm/npx, git status/add/commit/push/diff/log, tsc, file ops without asking.
**Ask before:** `git push --force`, `reset --hard`, DB data deletion, `.env.local` edits.

## 🚫 Vercel builds gated (locked 2026-05-02)

Preview only via `localhost:3000` (static server `npx serve public` for design preview, or `npm run dev` for app). GitHub push is OK and **does NOT trigger a Vercel build by default** — `vercel.json` has `ignoreCommand` that skips every build unless the commit message contains the literal token `[deploy]`.

**To trigger a Vercel build (only when user says so):**
- Make a commit (regular or empty) with `[deploy]` in the message: `git commit --allow-empty -m "deploy <reason> [deploy]"` then `git push`
- Or use Vercel dashboard "Redeploy" on a specific commit (overrides `ignoreCommand`)

**Default workflow:** commit + push freely; nothing reaches Vercel. Only deploy when user explicitly says "deploy to vercel" / "merge to main" / "ship it."

---

## ⚠️ INCOMPLETE_FEATURES is sacred

If a feature can't finish: append to `_tasks/INCOMPLETE_FEATURES.md` (Feature · File/Line · Blocker · Next Steps). Never delete or hide failures. File is never deleted.

---

## ❌ Error handling

Never `.catch(() => {})`. Always `console.error("[Component] desc:", err)`. Auth fetches → log + redirect. Payment flows → log + user-visible error with retry.

---

## ⭐ Design enforcement

Anything visual must come from `_tasks/SOLEN_LIVE_TRUTH.md` (V3 lock — V2-D15-3, 2026-05-07). New colors use existing tokens. To change the design itself: edit `SOLEN_LIVE_TRUTH.md` first, then update the V3 preview HTML files (`solen-v2-republik-teal.html` / `solen-v2-palette.html` / `solen-v2-combos.html`), then log decision as next `V2-D##` entry in `_tasks/V2_REBUILD_LOG.md`. Historical Q-locks in `SOLEN_DESIGN.md` §20 are context only — V3 supersedes any conflict.

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
| UI principles (skill) | `_rules/SOLEN_UI.md` |
| Agent coordination | `_rules/AGENT_COORDINATION.md` |
| Roadmap rules | `_rules/ROADMAP_RULES.md` |
| Systems map | `_rules/SYSTEMS.md` |
