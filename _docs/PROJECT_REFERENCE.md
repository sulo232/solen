# Solen.ch — Project Reference

> **Reference material moved out of `CLAUDE.md`** to keep the auto-loaded session prompt short. CLAUDE.md still holds operational protocols (surgical edits, discuss-before-execute, verify-before-asking, terminal autonomy, error handling, design enforcement) and the design system pointer + retired list.
>
> **Load this file when:** answering questions about tech stack, architecture, build/dev commands, deployment workflow, or task-tracking conventions. Otherwise CLAUDE.md is sufficient.

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
| Styling | Tailwind CSS + CSS variables (from `_tasks/SOLEN_DESIGN.md`) |
| Language | TypeScript |
| Backend | Supabase — Postgres, Auth (Google + email), Storage |
| Payments | Stripe — Payment Intents, Connect, Webhooks |
| Rate limit | Upstash Redis (`@upstash/ratelimit`) |
| Validation | Zod (`lib/validations.ts`) |
| Icons | `lucide-react` |
| Fonts | Anton (display) + Figtree (body) — Google Fonts. *(See SOLEN_DESIGN.md §20 for the lock — earlier values Bebas Neue / Syne / DM Sans are retired.)* |
| Deploy | Vercel |
| PWA | `manifest.json` + `sw.js` |
| AI | Gemini (`@google/generative-ai`), fal.ai (`@fal-ai/client`) |
| Search | pgvector (Supabase) |
| Charts | `recharts` |
| Analytics | PostHog |
| Email | Resend (transactional reminders, review prompts, welcome series) |
| SMS | seven.io (appointment reminders, walk-in payment links) |

---

## 3. Architecture

```
solen/
├── CLAUDE.md                          # Operational rules (auto-loaded)
├── _docs/
│   ├── PROJECT_REFERENCE.md           # This file (load on demand)
│   └── README.md                      # Other long-form docs
├── _rules/                            # Functional rules (non-design)
│   ├── AGENT_COORDINATION.md
│   ├── CODE_SAFETY.md
│   ├── DB_SCHEMA.md
│   ├── I18N_ROUTING.md
│   ├── KEY_FEATURES.md
│   ├── LESSONS_LEARNED.md
│   ├── ROADMAP_RULES.md
│   ├── SECURITY_RULES.md
│   ├── SOLEN_UI.md                    # Canonical UI principles skill
│   ├── STRUCTURAL_RULES.md
│   └── SYSTEMS.md
├── _tasks/
│   ├── SOLEN_DESIGN.md                # ⭐ DESIGN SYSTEM SOURCE OF TRUTH
│   ├── SOLEN_DESIGN_QUESTIONNAIRE_V3.md
│   ├── REDESIGN_INVENTORY.md          # Full codebase inventory (325+ API routes)
│   ├── BACKEND_NEEDS_UI.md            # Backend features awaiting UI
│   ├── INVENTORY_FULL.md              # Complete component & feature map
│   ├── MASTER_ROADMAP.md              # Forensic-synthesis roadmap
│   ├── DESIGN_AUDIT_MASTER.md         # Forensic design audit
│   ├── ROADMAP_AUDIT.md               # Forensic roadmap synthesis (planning docs)
│   ├── GAP_AUDIT_V2.md                # Current gap audit (V1 archived)
│   ├── INCOMPLETE_FEATURES.md         # NEVER DELETE — log blocked/partial features here
│   ├── AGENT-PROMPTS.md
│   ├── TODO-type-fixes.md
│   ├── archive/                       # Superseded versions (audits, V2 questionnaire, V1 dupes)
│   └── completed/
├── _audits/
│   ├── COMMIT_TIMELINE.md             # Per-commit forensic log
│   ├── CURRENT_STATE.md               # 339-component conformance scan
│   ├── LOST_DECISIONS.md              # What was tried and abandoned
│   └── STRUCTURE_AUDIT.md             # Folder/file hygiene audit
├── app/                               # Next.js App Router
│   └── api/                           # 325+ API routes (untouched during design port)
├── components/                        # React components (being ported to new design)
├── lib/                               # Utilities, validations, auth helpers
├── hooks/                             # Custom React hooks (useCityDetection, etc.)
├── supabase/                          # Migrations + Edge Functions
├── messages/                          # i18n (de, en, fr, it)
├── instrumentation.ts                 # Vercel OTel registration
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

**Per CLAUDE.md surgical-edits rule: never `npm run build` unless asked.**

---

## 5. Deployment

- **Platform:** Vercel (auto-deploys from `main`)
- **Dev server:** port 3000
- **Instrumentation:** `@vercel/otel` registers the OpenTelemetry service `solen` (see `instrumentation.ts`).

**After every `git push`:**
1. Confirm latest commit SHA matches what you pushed
2. Status "Ready" (not Error / stuck Building)
3. Build error → read log, fix, push again
4. Wrong deployment in production → promote correct via three-dot menu

---

## 6. Task Tracking Conventions

```
_tasks/
├── INCOMPLETE_FEATURES.md    # ⚠️ NEVER DELETE. Append blocked/partial features.
├── archive/                  # Superseded versions kept for grep/history
└── completed/                # Archive of finished tasks
```

**If you cannot finish a feature:**
1. **Do not** delete or hide the failure
2. **Append** to `_tasks/INCOMPLETE_FEATURES.md` with: Feature · File/Line · Blocker · Next Steps

This rule is operational and is also restated in CLAUDE.md.

---

## 7. Pointers to deeper rule files

| Topic | File |
|---|---|
| Database schema | `_rules/DB_SCHEMA.md` |
| Security (Rate limit, RLS, feature flags, audit, Zod) | `_rules/SECURITY_RULES.md` |
| Code safety (verify imports/routes before calling, commit per sub-phase, build before commit) | `_rules/CODE_SAFETY.md` |
| Structural (feature checklist, naming, incomplete features) | `_rules/STRUCTURAL_RULES.md` |
| I18N (no hardcoded strings, locale-aware routing, fluid layouts) | `_rules/I18N_ROUTING.md` |
| Key features (full feature list — 60 entries) | `_rules/KEY_FEATURES.md` |
| Lessons learned (read before starting; append new bugs/fixes) | `_rules/LESSONS_LEARNED.md` |
| Agent coordination | `_rules/AGENT_COORDINATION.md` |
| Roadmap rules | `_rules/ROADMAP_RULES.md` |
| Systems map | `_rules/SYSTEMS.md` |
| UI principles (canonical skill) | `_rules/SOLEN_UI.md` |

CLAUDE.md restates these pointers so they're always in scope without loading this file.
