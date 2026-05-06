# Solen.ch — Project Configuration

> **Every AI agent (Claude Code, Cursor, Claude Design, etc.) MUST read this file in full before making any changes.**

---

## 🎨 DESIGN SYSTEM — IN FLUX

The design system is being iterated. **Don't cite locked palette / fonts / patterns as authoritative** — ask before assuming a value, or read the current state from `_tasks/SOLEN_DESIGN.md` if it's been updated.

Previous locked spec (coral / Bebas Neue / Syne / DM Sans / 1:1 covers, etc.) is archived at `_tasks/completed/CLAUDE_md_design_system_2026-05-06.md` for reference. Restore (or replace with the new locked values) once the new system stabilizes.

---

## 🚨 SURGICAL EDITS ONLY

Previous AI sessions destroyed working code by rewriting files. Rules to prevent that:

1. **Never rewrite a whole file.** Change only the lines that cause the reported bug.
2. **Match the exact scope of the request.** Padding fix = padding class, nothing else.
3. **Read before editing.** Find the exact lines, confirm they match expectations, then change.
4. **Never `npm run build` unless asked.** Dev runs on port 3000.
5. **`git diff` after each fix** — verify only the intended thing changed.

---

## ⚡ TERMINAL COMMAND AUTONOMY

Execute standard dev commands **immediately without asking**.

- ✅ npm/npx, git (status/add/commit/push/diff/log), tsc checks, file ops
- ❌ Ask before: `git push --force`, `reset --hard`, DB data deletion, `.env.local` edits

---

## 1. Project Overview

**Solen.ch** = Swiss beauty & wellness booking marketplace. Launch market Basel, expanding to Zürich + Bern. Categories: Coiffeur, Barbershop, Nails, Spa, Makeup, Waxing.

Two sides:
1. **solen.ch** — consumer marketplace (discovery, salon profiles, booking, last-minute, favorites)
2. **Solen Dashboard** — B2B partner app (calendar, bookings, staff, analytics)

---

## 2. Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js App Router + React |
| Styling | Tailwind CSS + CSS variables (from `SOLEN_DESIGN.md`) |
| Language | TypeScript |
| Backend | Supabase — Postgres, Auth (Google + email), Storage |
| Payments | Stripe — Payment Intents, Connect, Webhooks |
| Rate limit | Upstash Redis (`@upstash/ratelimit`) |
| Validation | Zod (`lib/validations.ts`) |
| Icons | `lucide-react` |
| Fonts | Bebas Neue + Syne + DM Sans (Google Fonts) |
| Deploy | Vercel |
| PWA | `manifest.json` + `sw.js` |
| AI | Gemini (`@google/generative-ai`), fal.ai (`@fal-ai/client`) |
| Search | pgvector (Supabase) |
| Charts | `recharts` |
| Analytics | PostHog |

---

## 3. Architecture

```
solen/
├── CLAUDE.md                          # This file
├── _rules/                            # Functional rules (non-design)
│   ├── AGENT_COORDINATION.md
│   ├── CODE_SAFETY.md
│   ├── DB_SCHEMA.md
│   ├── I18N_ROUTING.md
│   ├── KEY_FEATURES.md
│   ├── LESSONS_LEARNED.md
│   ├── ROADMAP_RULES.md
│   ├── SECURITY_RULES.md
│   ├── STRUCTURAL_RULES.md
│   └── SYSTEMS.md
├── _tasks/
│   ├── SOLEN_DESIGN.md                # ⭐ DESIGN SYSTEM SOURCE OF TRUTH
│   ├── REDESIGN_INVENTORY.md          # Full codebase inventory (325+ API routes)
│   ├── BACKEND_NEEDS_UI.md            # Backend features awaiting UI
│   ├── INCOMPLETE_FEATURES.md         # NEVER DELETE — log blocked/partial features here
│   ├── AGENT-PROMPTS.md
│   ├── TODO-type-fixes.md
│   └── completed/
├── app/                               # Next.js App Router
│   └── api/                           # 325+ API routes (untouched during design port)
├── components/                        # React components (being ported to new design)
├── lib/                               # Utilities, validations, auth helpers
├── supabase/                          # Migrations + Edge Functions
├── messages/                          # i18n (de, en, fr, it)
└── public/
    ├── solen-coral.html               # ⭐ LIVING DESIGN PREVIEW
    └── offline.html                   # PWA offline page
```

---

## 4. Commands

```bash
npm install          # Install deps
npm run dev          # Start dev server (port 3000)
npm run build        # Production build (Vercel handles on deploy)
npm run lint         # Lint
```

**Preview URLs:**
- Design system preview: `http://localhost:3000/solen-coral.html`
- Current Next.js homepage: `http://localhost:3000/de/`

---

## 5. Deployment

- **Platform:** Vercel (auto-deploys from `main`)
- **Dev server:** port 3000

**After every `git push`:**
1. Confirm latest commit SHA matches what you pushed
2. Status "Ready" (not Error / stuck Building)
3. Build error → read log, fix, push again
4. Wrong deployment in production → promote correct via three-dot menu

---

## 6. Task Tracking

```
_tasks/
├── INCOMPLETE_FEATURES.md    # ⚠️ NEVER DELETE. Append blocked/partial features.
└── completed/                # Archive of finished tasks
```

If you cannot finish a feature:
1. **Do not** delete or hide the failure
2. **Append** to `_tasks/INCOMPLETE_FEATURES.md` with: Feature · File/Line · Blocker · Next Steps

---

## 7. Database — see `_rules/DB_SCHEMA.md`
## 8. Security — see `_rules/SECURITY_RULES.md` (Rate limit, RLS, feature flags, audit, Zod)
## 9. Code Safety — see `_rules/CODE_SAFETY.md` (Verify imports/routes before calling, commit per sub-phase, build before commit)
## 10. Structural — see `_rules/STRUCTURAL_RULES.md` (Feature checklist, naming, incomplete features)
## 11. I18N — see `_rules/I18N_ROUTING.md` (No hardcoded strings, locale-aware routing, fluid layouts)
## 12. Key Features — see `_rules/KEY_FEATURES.md` (Full feature list)
## 13. Lessons Learned — see `_rules/LESSONS_LEARNED.md` (Read before starting; append new bugs/fixes)

---

## 14. Error Handling

**Never** use `.catch(() => {})`. Always log with `console.error("[Component] description:", err)`.

```tsx
// ✅ CORRECT
.catch((err) => console.error("[DashboardBookings] Failed to load bookings:", err))

// ❌ BANNED
.catch(() => {})
```

Auth fetches → log + redirect to login. Payment flows → log + user-visible error with retry.

---

## 15. Design Enforcement

Anything visual **must** come from `_tasks/SOLEN_DESIGN.md`.

- New component → check the doc for the pattern
- New color → use existing tokens, never arbitrary hex
- New page → follow section patterns in doc §12
- Want to change the design itself → edit `SOLEN_DESIGN.md` + update `public/solen-coral.html` + log decision in §20
