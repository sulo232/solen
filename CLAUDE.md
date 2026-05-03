# Solen.ch — Project Configuration

> Every AI agent must read this file before changes.

**Stack:** Next.js App Router · TS · Tailwind · Supabase · Stripe · Vercel.
**Reference (load on demand):** `_docs/PROJECT_REFERENCE.md` (full stack table, architecture, commands, deployment, task-tracking conventions).

---

## 🎨 Design system — single source of truth

- **Read:** `_tasks/SOLEN_DESIGN.md` (Q-locks live in §20)
- **Preview:** `public/solen-coral.html` → `localhost:3000/solen-coral.html`
- **If anything contradicts `SOLEN_DESIGN.md`, that doc wins. No exceptions.**

**Retired — do not reintroduce:** V2 green+peach palette (`#1B4D1C` / `#F5A962` / Plus Jakarta / Outfit / Phosphor) · V5 zone language · glass-everywhere · 3:2 cover photos · dark mode · blobs-in-every-section.

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

Order: **PROPOSE → WAIT → EXECUTE → VERIFY**. For design tokens, components, layout, or `SOLEN_DESIGN.md` / `solen-coral.html` edits, propose options first and wait for explicit "ok / lock / go".

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

Anything visual must come from `SOLEN_DESIGN.md`. New colors use existing tokens. To change the design itself: edit `SOLEN_DESIGN.md` + update `solen-coral.html` + log decision in §20.

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
