# Solen.ch — Project Configuration & Multi-Agent Protocol

> **Every AI agent (Claude Code, Cursor, Gemini, etc.) MUST read this file in full before making any changes.**

---

## 1. Project Overview

**Solen.ch** is a beauty & wellness booking platform for the Basel area (Switzerland).
Users discover salons, browse services, and book appointments. Salon owners register their business, manage bookings, and push "Last Minute" offers.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Hybrid: Vanilla HTML/CSS/JS monolith (`index.html`, 14k+ lines) + Next.js App Router (`app/`) |
| **Styling** | CSS Variables (design tokens in `index.html` `<style>`) + Tailwind CSS (`tailwind.config.js`) |
| **Language** | TypeScript (`tsconfig.json`) and JavaScript |
| **Backend/DB** | [Supabase](https://supabase.com/) — PostgreSQL, Auth (Google OAuth + Email), Storage |
| **Deployment** | Vercel (`vercel.json`) |
| **PWA** | `manifest.json` + `sw.js` (Service Worker) |

---

## 3. Architecture

### 3.1 The Hybrid Monolith

The app has two parallel systems:

1. **Legacy Monolith** — `index.html` contains the entire SPA (HTML + embedded CSS + embedded JS). This is the **live production app** served by Vercel as `public/home.html` via a Next.js iframe. It handles: hero, salon cards, booking wizard, registration flow, admin dashboard, DM chat, profiles, and more.

2. **Next.js Layer** — The `app/` directory contains Next.js App Router pages. Currently being migrated from the monolith. React components in `components/` are exported from `components/index.ts`.

### 3.2 Key Directories

```
solen/
├── index.html          # ⚠️ THE MONOLITH — 14k lines, sync to public/home.html
├── public/home.html    # ⚠️ THE DEPLOYED FILE — served as /home.html by Next.js iframe
├── CLAUDE.md           # THIS FILE — master instructions
├── .agent-lock.json    # File locks for multi-agent coordination (gitignored)
├── .agent-comms.md     # Inter-agent communication log
├── _tasks/             # Task tracking + roadmaps
│   ├── roadmap-dev2-customer-frontend.md
│   ├── roadmap-dev3-salon-dashboard.md
│   └── completed/      # Archive of finished tasks
├── app/                # Next.js App Router pages
├── components/         # Shared React components (Dev 2 owns, Dev 3 imports)
│   ├── index.ts        # Barrel exports — Dev 3 depends on this
│   ├── dashboard/      # Dev 3's dashboard-specific components
│   └── ui/             # Shared UI primitives
├── lib/                # Utility libraries (Dev 1 owns)
├── public/             # Static assets
├── supabase/           # Migrations + Edge Functions (Dev 1 owns)
├── messages/           # i18n translation files
├── .env.local          # Environment variables (DO NOT COMMIT)
└── vercel.json         # Vercel deployment config
```

### 3.3 Design System (New — Next.js)

- **Colors**: teal `#4ECDC4` (primary), coral `#FF6B6B` (accent/urgency), dark `#1A1A2E`
- **Fonts**: Syne (heading), DM Sans (body), Space Grotesk (data/numbers/prices)
- **Radii**: card `12px`, pill `9999px`, button `8px`
- **Shadows**: card `0 4px 12px rgba(0,0,0,0.08)`, coral-glow `0 2px 8px rgba(255,107,107,0.15)`
- **Glass nav**: `bg-white/80 backdrop-blur-lg border-b border-gray-100`
- **Icons**: `lucide-react` for ALL icons. No emoji icons.

### 3.4 Design System (Legacy — Monolith)

- **Aesthetic**: "Quiet Luxury" + Glassmorphism
- **Colors**: accent `#9B1D30` (wine red), gold `#D4AF77`, teal `#4ECDC4`
- **Fonts**: `DM Serif Display` (headings), `DM Sans` (body), `JetBrains Mono` (prices)
- **Dark Mode**: Via `[data-theme="dark"]` data attributes

### 3.5 Key Features

1. **Discovery & Booking**: Salon cards + multi-step booking wizard.
2. **Direct Messaging**: In-app chat connecting users with salon owners.
3. **Authentication**: Supabase-powered (Google OAuth, Email magic link).
4. **Last Minute Offers**: Salon owners expose canceled slots to a prioritized feed.

### 3.6 Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Next.js dev server
npm run build        # Production build (Vercel does this on deploy)
npm run lint         # Lint codebase
```

> ⚠️ **macOS npm issues**: If `npm install` fails with `EPERM`/`EACCES` on `~/.npm`, use `npm install --cache ./.npm-cache` to bypass system root locks. Always let Vercel build TypeScript/Tailwind in the cloud rather than relying on a broken local pipeline.

---

## 4. ⚠️ MULTI-AGENT COORDINATION PROTOCOL

### 4.1 Why This Exists

Multiple AI agents work on this codebase simultaneously (Dev 1, Dev 2, Dev 3 + bug-agent). Without coordination, agents overwrite each other's changes — especially critical for `index.html` (14k lines) and database migrations.

### 4.2 Mandatory Steps (EVERY Agent, EVERY Session)

```
┌─────────────────────────────────────────────────┐
│  1. READ this file (CLAUDE.md) completely        │
│  2. READ .agent-lock.json — check locked files   │
│  3. READ .agent-comms.md — check recent messages │
│  4. CLAIM your files in .agent-lock.json         │
│  5. POST your intent in .agent-comms.md          │
│  6. WORK — only edit YOUR claimed files          │
│  7. RELEASE locks when done                      │
│  8. POST summary in .agent-comms.md              │
└─────────────────────────────────────────────────┘
```

### 4.3 File Lock Rules

**Before editing ANY file**, check `.agent-lock.json`:
- If **locked by another agent** → **DO NOT EDIT**. Work on something else or wait.
- If **unlocked** → Add your lock entry, then edit.
- When **done** → Remove your lock entry.
- **Stale locks** (3+ hours old with no recent git activity) may be cleared.

**Lock entry format:**
```json
{
  "agent": "your-agent-name",
  "files": ["index.html"],
  "reason": "Fixing hero section layout",
  "locked_at": "2026-03-16T09:00:00Z"
}
```

### 4.4 Communication Rules

Post in `.agent-comms.md` before starting AND after finishing work. Include: what you changed, which files, any side effects for other agents.

### 4.5 Danger Zones

| File | Risk | Why |
|---|---|---|
| `index.html` | 🔴 CRITICAL | 14k-line monolith. **Always lock before editing.** |
| `public/home.html` | 🔴 CRITICAL | Must stay in sync with `index.html`. Always `cp index.html public/home.html` after editing. |
| `supabase/migrations/*` | 🔴 CRITICAL | Conflicting migrations = broken DB. |
| `.env.local` | 🟡 HIGH | Secrets. Never commit, never overwrite. |
| `package.json` | 🟡 HIGH | Affects all agents. Lock before editing. |
| `vercel.json` | 🟡 HIGH | Breaking this = site goes down. |

### 4.6 Agent Roles

| Agent | Branch | Scope |
|---|---|---|
| `feature-agent` (Dev 2) | `feature/customer-frontend` | `components/`, `app/[locale]/` customer pages, Tailwind |
| `feature-agent` (Dev 3) | `feature/salon-dashboard` | `components/dashboard/`, `app/[locale]/dashboard/`, onboarding |
| `bug-agent` | `main` | Hotfixes, config, `package.json`, `vercel.json` |
| `infra-agent` | `main` | DevOps, migrations, Edge Functions |

---

## 5. Workflow Rules

1. **Plan First**: Generate an Implementation Plan artifact before writing code.
2. **Verify**: Never mark done without checking logs. Run `npm run build` if touching Next.js files.
3. **No Blind Deletions**: The monolith has 14k lines. Understand before deleting.
4. **Supabase Awareness**: Check table schema before modifying any Supabase JS. Key table: `salons` (not `stores` — migration 013 dropped the old table).
5. **index.html ↔ public/home.html sync**: After editing `index.html`, always `cp index.html public/home.html`. The Next.js page serves `public/home.html` via iframe — they MUST stay in sync.
6. **Vercel Deployment Check (MANDATORY after every `git push`)**: After pushing to main or promoting a deployment, check `https://vercel.com/sulo232s-projects/solen/deployments` and verify:
   - The **latest deployment name/commit SHA** matches what you just pushed (confirm it's not serving a stale/old commit)
   - The **timestamp** matches — if the deployment is older than expected, the push may not have triggered correctly
   - The **status** is "Ready" (not "Error" or "Building" stuck)
   - If **build errors** → read the error log, fix the issue, and push again immediately without asking
   - If the **wrong deployment is in production** (e.g. a preview was promoted instead of main) → promote the correct one via the three-dot menu
   - If there is a **conflict between two agents' deployments** (e.g. two branches both promoted to production) → revert the wrong one and ask the user which branch should be live before proceeding
   - If fixing it requires a **major decision** (e.g. rolling back a whole feature, changing the deployment branch) → stop and ask the user


---

## 6. Supabase Schema (New — Migration 014)

| Table | Key Columns | Notes |
|---|---|---|
| `salons` | `id`, `owner_id`, `name`, `slug`, `categories[]`, `quartier`, `address`, `latitude`, `longitude`, `is_active`, `average_rating`, `review_count` | **No `status` column.** `is_active` is the field. RLS enforces `is_active=true` for anon. |
| `services` | `id`, `salon_id`, `name_de`, `name_en`, `category`, `duration_minutes`, `price`, `is_active` | |
| `staff_members` | `id`, `salon_id`, `name`, `avatar_url`, `specialties[]`, `is_active` | |
| `availability_slots` | `id`, `salon_id`, `service_id`, `staff_member_id`, `starts_at`, `ends_at`, `status` | status: available/booked/blocked |
| `bookings` | `id`, `user_id`, `salon_id`, `service_id`, `slot_id`, `starts_at`, `ends_at`, `price_paid`, `status`, `is_first_visit`, `is_recurring` | |
| `profiles` | `id`, `display_name`, `avatar_url`, `role`, `onboarding_completed` | role: customer/salon_owner/admin |
| `conversations` | `id`, `customer_id`, `salon_id`, `unread_count_salon` | |
| `messages` | `id`, `conversation_id`, `sender_id`, `content`, `message_type` | |

---

## 7. Deployment

- **Platform**: Vercel (auto-deploys from `main` branch)
- **Build**: Vercel runs `npm run build` (Next.js + Tailwind)
- **Homepage**: `app/[locale]/page.tsx` serves `public/home.html` via `<iframe src="/home.html">`
- **New pages**: `app/[locale]/*/page.tsx` are proper Next.js React pages (no iframe)

---

## 8. Task Tracking

### 8.1 The `_tasks/` Folder

```
_tasks/
├── roadmap-dev2-customer-frontend.md   # Dev 2 execution plan
├── roadmap-dev3-salon-dashboard.md     # Dev 3 execution plan
└── completed/                          # Archive of finished tasks
```

### 8.2 Task Lifecycle

```
START → Note intent in .agent-comms.md
DONE  → Move task file to _tasks/completed/ + note in .agent-comms.md
```

---

## 9. Spec → Roadmap Fidelity Rules (MANDATORY)

When an AI agent converts a spec or prompt into a roadmap, plan, or task file, the following rules apply **without exception**:

### ✅ Must preserve verbatim
- Every named component and its exact props
- Every pixel/size spec (e.g. "~160px wide, ~100px tall")
- Every exact URL pattern
- Every conditional or trigger condition (e.g. "only shown if user has 2+ same-day bookings" — NOT simplified to "if slots exist")
- Every API endpoint, HTTP method, and query param
- Every edge case (e.g. "button disabled with tooltip past deadline")
- Every side effect (e.g. "slot freed, both parties emailed")
- Every constraint marked SACRED or critical (e.g. "SACRED — never vertical")
- Every specific example given (e.g. "Balayage" → Specialist badge)
- Every design token value

### ❌ Never allowed
- Paraphrasing a condition and changing its meaning
- Dropping a feature because it seems minor
- Merging two distinct features into one vague bullet
- Omitting a section because it was at the end of the spec (e.g. "Smart Features")

### How to verify
After writing a roadmap from a spec, do a keyword grep check for:
- Specific examples mentioned in the spec (e.g. "Balayage", "2+")
- Side effects (e.g. "emailed")
- Trigger conditions (e.g. "same-day")
- SACRED/never constraints
