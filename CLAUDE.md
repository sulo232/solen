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
| **Frontend** | Next.js App Router (`app/`) + React components (`components/`) |
| **Styling** | Tailwind CSS (`tailwind.config.js`) + CSS Variables |
| **Language** | TypeScript (`tsconfig.json`) and JavaScript |
| **Backend/DB** | [Supabase](https://supabase.com/) — PostgreSQL, Auth (Google OAuth + Email), Storage |
| **Payments** | [Stripe](https://stripe.com/) — Payment Intents, Connect, Webhooks, `@stripe/react-stripe-js`, `@stripe/stripe-js` |
| **Rate Limiting** | [Upstash Redis](https://upstash.com/) via `@upstash/ratelimit` |
| **Validation** | [Zod](https://zod.dev/) — API input validation schemas in `lib/validations.ts` |
| **UI Components** | 21st.dev components (InteractiveHoverButton, ExpandableNavTabs, Sidebar, DatePicker) |
| **Date Picker** | `react-aria-components` + `@internationalized/date` |
| **Deployment** | Vercel (`vercel.json`) |
| **PWA** | `manifest.json` + `sw.js` (Service Worker) |
| **IDs** | `nanoid` — Unique code generation (gift cards, referral codes) |
| **AI** | `@google/generative-ai` (Gemini 2.0 Flash) — Intake form recommendations, discovery AI descriptions; `@fal-ai/client` — AI nail art image generation |
| **Search** | pgvector (Supabase extension) — vector similarity search for AI-powered service matching |
| **Charts** | `recharts` — Dashboard analytics visualizations |
| **Analytics**| [PostHog](https://posthog.com/) — `posthog-js` (client) + `posthog-node` (server) |

---

## 3. Architecture

### 3.1 Architecture

The app is a **Next.js App Router** application:

- **Homepage**: `app/[locale]/page.tsx` renders `<HomePage />` (React component in `components/HomePage.tsx`)
- **All pages**: Next.js App Router pages in `app/[locale]/`
- **Components**: React components in `components/`, exported from `components/index.ts`
- **API**: Next.js API routes in `app/api/`

> **Note**: The old monolith (`index.html`, 14k lines, wine-red design) has been archived to `_archive/monolith-v1.html`. It is NOT used anywhere. Do not reference it, do not try to restore it. The homepage is 100% Next.js now.

### 3.2 Key Directories

```
solen/
├── _archive/           # Archived old code (DO NOT USE)
│   └── monolith-v1.html # Old 14k-line monolith (wine-red design, retired 2026-03-17)
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
│   │   └── nail/       # Nail CRM dashboard components (StationManager, RetailManager, etc.)
│   ├── nail/           # Nail category UI components (booking flow, portfolio, discovery)
│   ├── editor/         # Visual Editor (admin-only)
│   ├── layout/         # Header, Footer, BottomNav
│   └── ui/             # Shared UI primitives (Skeleton, SearchBar, ExpandableTabs, etc.)
├── lib/                # Utility libraries (Dev 1 owns)
│   ├── supabase.ts     # Supabase client helpers (server + admin)
│   ├── posthog-server.ts # Server-side event tracking utility
│   ├── posthog-api.ts  # Fetch insights from PostHog REST API
│   ├── ratelimit.ts    # Upstash rate limiters (from security roadmap Phase 4)
│   ├── feature-flags.ts # Kill switch + ban check (from security roadmap Phase 5)
│   ├── validations.ts  # Zod schemas for all API inputs (from security roadmap Phase 6)
│   ├── audit.ts        # Admin action audit logging (from security roadmap Phase 9)
│   ├── nail/           # Nail category utilities
│   │   ├── ai-prompts.ts       # AI nail art generation prompt templates
│   │   ├── ai-budget.ts        # Redis monthly AI generation budget tracker
│   │   ├── infill-calculator.ts # Infill scheduling calculator
│   │   └── station-availability.ts # Nail station availability checker
│   └── barber/         # Barber category utilities
│       ├── loyalty-qr.ts       # HMAC-signed QR token generation/verification
│       └── visit-cycle.ts      # Smart visit-cycle reminder calculator
├── components/         # (continued)
│   ├── barber/         # Barber category UI components (queue, rebook, loyalty, profiles)
│   └── dashboard/barber/ # Barber dashboard components (leaderboard, chairs, reminders, analytics)
├── public/             # Static assets
├── supabase/           # Migrations + Edge Functions (Dev 1 owns)
├── messages/           # i18n translation files
├── .env.local          # Environment variables (DO NOT COMMIT)
└── vercel.json         # Vercel deployment config
```

### 3.3 Design System (New — Next.js)

- **Colors**: Terracotta Coral `#E8624A` (primary, class: `s-coral`), Amber `#D4870A` (accent, class: `s-amber`), Basel Blue `#6BA3C8` (accent, class: `s-blue`), Warm Ink `#1A1209` (text, class: `s-ink`)
- **Extended Colors**: Yellow `#F2C144` (`s-yellow`), Plum `#4A1E3C` (`s-plum`), Sage `#7BA688` (`s-sage`), Sand `#C9A96E` (`s-sand`). Each has `DEFAULT`, `hover` (where applicable), `subtle`, `text` variants.
- **Backgrounds**: Cream `#FAF6EF` (base), White `#FFFFFF` (cards/raised), `#EDE5D8` (sunken inputs), `#F3EDE2` (surface)
- **Dark mode**: Warm dark base `#151009` (`s-dm-bg`), surface `#1E1710` (`s-dm-surface`), text `#F5EEE4` (`s-dm-text`). NEVER use cool grey or pure black.
- **Fonts**: Bebas Neue (display ≥40px), Syne (heading), DM Sans (body + data with `tabular-nums`)
- **Radii**: card `12px`, pill `9999px`, button `8px`
- **Shadows**: card `0 4px 12px rgba(0,0,0,0.08)`, warm-md `0 4px 16px rgba(26,18,9,0.12)`
- **Glass nav**: `glass rounded-full shadow-warm-sm` (warm-tinted glassmorphism)
- **Icons**: `lucide-react` for ALL icons. No emoji icons.
- **Loading**: Use `<Skeleton variant="card" />` for full-page loading states. Use `<Spinner>` only for inline/button loading.
- **CTAs**: Use `<InteractiveHoverButton>` for all primary CTA buttons.
- **Mobile nav**: Bottom nav uses `<ExpandableNavTabs>` (from `expandable-tabs.tsx`). Hidden on desktop. Returns null on dashboard pages.
- **Empty states**: Use `<EmptyState>` with optional `illustration` prop (`"no-results"` or `"coming-soon"`).
- **Social proof**: `<SocialProofStrip>` between hero and content. `<TrustBadges>` in footer.
- **Dashboard sidebar**: Animated `<Sidebar>` from `sidebar.tsx` — collapses to 60px icons, expands on hover.
- **Date picker**: `<SolenDatePicker>` from `date-picker.tsx` — react-aria-components calendar with coral theme.
- **Background blobs**: `<BlobBackground>` from `BlobBackground.tsx` — accepts `zone={1}` (maximalist) or `zone={2}` (soft/subtle). Decorative gradient blobs for hero/section backgrounds.
- **Radii**: card 12px, pill 9999px, button 8px, blob-a/b/c/d/e organic % (see UI_RULES.md §10)
- **Blob physics**: `.blob-interactive` for 500ms spring border-radius morphing on hover

### 3.4 Design System (Legacy — ARCHIVED, DO NOT USE)

> ⚠️ The old monolith design (wine-red `#9B1D30`, gold, DM Serif Display) is **retired**. It lives in `_archive/monolith-v1.html` for reference only. **ALL new code must use the Next.js design system (Section 3.3).**

### 3.5 Key Features

1. **Discovery & Booking**: Salon cards + multi-step booking wizard with multi-service, add-ons, guest checkout.
2. **Direct Messaging**: In-app chat with media upload, price offers, and dispute resolution.
3. **Authentication**: Supabase-powered (Google OAuth, Email magic link).
4. **Last Minute Offers**: Salon owners expose canceled slots with category filters and price range filtering.
5. **Favorites & Retention**: Heart button on SalonCards, "Wieder buchen?" widget, top-rated badge auto-assign.
6. **Loyalty System**: Stamp cards with per-salon rewards and progress tracking.
7. **Client Notes (CRM)**: Salon owners can add permanent/booking notes for clients.
8. **Review Replies**: Salon owners can reply to reviews (public or private).
9. **Off-Peak Discounts**: Salons set discounted hours for specific days of the week.
10. **Help Center**: Public help articles with admin CMS, search, and category sections.
11. **Dark Mode**: System/manual toggle via `ThemeToggle` in Header. `darkMode: 'class'` in Tailwind.
12. **Dashboard Calendar**: Weekly grid with staff colors, slot detail modal, reschedule, and day blocking.
13. **Review Photos**: Customers can upload photos with reviews; stored in Supabase Storage `review-photos` bucket.
14. **Recently Viewed**: Horizontal scroll of last 5 viewed salons from localStorage. Shows on HomePage and ProfilePage.
15. **SMS Reminders**: Cron-based 24h/1h SMS reminders via seven.io. Configurable per salon in dashboard settings.
16. **Review Prompts**: Daily cron sends review email 24h after completed bookings via Resend.
17. **Internationalization**: 4 locales (de, en, fr, it) via next-intl. LanguageSwitcher in Header.
18. **Multi-Location Chains**: `salon_groups` table, brand pages at `/brand/[slug]`, "Teil von [Brand]" badge on SalonCard.
19. **PWA Install Prompt**: Shows after first booking. iOS: manual share instructions. Chrome: `beforeinstallprompt`.
20. **Accessibility**: Global focus-visible rings, aria-labels on all interactive elements, semantic nav roles.
21. **Chat Intelligence**: Quick-reply template chips (salon-side), AI reply suggestions via Gemini, photo-based price quoting, photo gallery tab in chat.
22. **Client CRM Tags**: Color-coded tags (allergy, preference, note) on client profiles. Red allergy warnings on booking cards.
23. **Visual Editor**: Admin-only element selector at `/dashboard/editor`. Click any element → describe change → Claude API generates roadmap in CLAUDE.md R1-R10 format. Supports device preview, request queue, and cost tracking.
24. **Discovery Platform**: Pinterest-style content discovery at `/discover`. Masonry grid with photo/TikTok cards, category/gender/texture filters, infinite scroll, like/save/comment social features, AI-powered descriptions (Gemini), stock photo import (Unsplash/Pexels/Pixabay), TikTok oEmbed import, admin content studio, user/salon posting with auto-flagging, recommendation algorithm, staff portfolio browsing, and booking bridge.
25. **Prepaid Booking**: Stripe Connect with configurable platform fee, hold-and-release payment flow, card-on-file save via SetupIntents.
26. **Staff Accounts**: Invite-based staff onboarding, role-limited dashboard (STAFF_NAV), per-staff service mapping, break/time-off management.
27. **Guest Booking**: No account required for booking. Email-only checkout with automatic profile creation on confirmation.
28. **Walk-in Mode**: SMS-based payment links for walk-in customers via seven.io. HMAC-signed tokenized payment pages.
29. **Service Packages**: Multi-session punch cards with bonus sessions. PackageManager in marketing dashboard. Purchase tracking.
30. **Digital Gift Cards**: Per-salon gift cards with custom amounts, recipient email delivery, code-based redemption, balance tracking.
31. **Tip System**: Post-service tipping via tokenized tip pages. Preset + custom amounts. Stripe PaymentIntents for tip processing.
32. **Group Bookings**: Multi-person bookings with shared `group_booking_id`. RPC function for atomic multi-slot booking.
33. **Client CRM**: Color formulas, intake forms (5 consultation types), before/after photos, AI-powered intake recommendations via Gemini.
34. **Referral Program**: Auto-generated referral codes, WhatsApp/SMS/copy sharing, reward tracking (CHF 10 per referral), salon-side referral dashboard.
35. **Advanced Analytics**: Booking heatmap (7x12 CSS grid), staff comparison (table/chart), acquisition source tracking, revenue commission breakdown, gift card + tip summaries.
36. **Nail Tech Portfolio**: Staff portfolio pages with masonry grid, filterable by style/shape/material. Tier badges (junior/senior/master). Public profile at `/nail-tech/[id]`.
37. **Nail Design History**: Per-client design timeline with photos, material/shape badges, color swatches, repeat-design action.
38. **Nail Inspo System**: Client image upload (drag-drop + camera), curated inspo boards, multi-select from boards during booking.
39. **Nail Material/Shape/Length Selector**: Visual shape picker (10 SVG icons), length bars, 7 material types with descriptions. Integrated in booking flow.
40. **Nail Station Management**: Configurable station count, UV lamp tracking, sterilization buffer. Utilization bar in dashboard.
41. **Nail Tier Pricing**: Staff-level pricing (junior/senior/master) displayed during booking. Dynamic pricing rules per day/time.
42. **Nail Infill Reminders**: Per-service reminder cycle (days). Cron sends email/SMS reminders when infill is due.
43. **Nail Discovery Feed**: Pinterest-style masonry grid at `/discover/nails`. Filter by style/shape/material. Infinite scroll.
44. **Nail Dynamic Pricing**: Rule-based price modifiers (peak/off-peak/weekend/last-minute/loyalty). Weekly heatmap visualization.
45. **Nail Retail POS**: In-salon product sales. RetailManager for inventory, RetailCheckout for POS cart + Stripe payment.
46. **Nail AI Art Generator**: Admin-only fal.ai image generation. Style/shape/color/skin tone selectors. Monthly budget tracking via Redis.
47. **Nail Allergy System**: Client allergy tracking with severity levels. Warning banners in booking flow. Alert emails to salon on booking.
48. **Walk-in Queue**: Real-time barbershop walk-in queue with Supabase Realtime. Remote join via name/phone/preferred barber. Status transitions (waiting→in_chair→completed/no_show). Public wait time display with 30s polling.
49. **Express Rebook**: 2-tap rebook flow for returning barber clients. Shows last cut specs, searches next available slot, confirms booking.
50. **Cut History Timeline**: Per-client chronological timeline of barbershop visits. Spec badges (fade, top, guard, beard, lineup), photos, "Wiederholen" repeat action.
51. **Barber Profiles**: Public barber profile pages at `/salon/[slug]/barber/[barberSlug]`. Portfolio grid with style filters, cover photo, share button, booking CTA.
52. **Barber Smart Reminders**: Visit-cycle detection via `barber_cut_history`. Cron identifies overdue clients. Dashboard shows due clients grouped by barber with send button.
53. **Barber Loyalty Cards**: HMAC-signed QR stamp cards. Configurable programs (name, stamps needed, reward type). Visual stamp grid, QR overlay, one-tap stamp verification at `/loyalty/stamp`.
54. **Barber Leaderboard**: Staff performance comparison table. Metrics: bookings, revenue, retention, avg tip, walk-in conversion, chair utilization. Week/month toggle + anonymize mode.
55. **Chair Management**: Configurable chair count and buffer minutes. Utilization bar in dashboard. Affects slot generation capacity.
56. **Walk-in Analytics**: Walk-in vs appointment ratio, avg wait time, conversion rate, abandonment rate, chair utilization. Week/month period toggle.
57. **Barber Discovery Signals**: Discovery algorithm barber branch — fade type, barber style, and hair texture scoring for barbershop category items.
58. **Barber Roster**: Salon page "Unsere Barber" grid section showing staff with portfolio links. Only visible for barbershop-category salons.
59. **Smart Search**: Unified search bar with date-based availability, category pills, and AI-powered embeddings search (pgvector). Category-scoped results with cross-category suggestions. Homepage 3-part search bar (date + category + AI search). Subpage FilterBar with date picker and availability badges.
60. **Admin Homepage Section Toggle**: Admin-controlled homepage section visibility via `platform_settings` key `homepage_sections`. Public GET at `/api/homepage-sections`, admin GET/PUT at `/api/admin/homepage-sections`. Sections default to all-visible on fetch failure.

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
3. **No Blind Deletions**: Understand code before deleting. Check git blame and grep for usages.
4. **Supabase Awareness**: Check table schema before modifying any Supabase JS. Key table: `salons` (not `stores` — migration 013 dropped the old table).
5. **Homepage is Next.js**: The homepage is `app/[locale]/page.tsx` → `<HomePage />` component. There is NO iframe, NO monolith. All homepage changes go in `components/HomePage.tsx`.
6. **Vercel Deployment Check (MANDATORY after every `git push`)**: After pushing to main or promoting a deployment, check `https://vercel.com/sulo232s-projects/solen/deployments` and verify:
   - The **latest deployment name/commit SHA** matches what you just pushed (confirm it's not serving a stale/old commit)
   - The **timestamp** matches — if the deployment is older than expected, the push may not have triggered correctly
   - The **status** is "Ready" (not "Error" or "Building" stuck)
   - If **build errors** → read the error log, fix the issue, and push again immediately without asking
   - If the **wrong deployment is in production** (e.g. a preview was promoted instead of main) → promote the correct one via the three-dot menu
   - If there is a **conflict between two agents' deployments** (e.g. two branches both promoted to production) → revert the wrong one and ask the user which branch should be live before proceeding
   - If fixing it requires a **major decision** (e.g. rolling back a whole feature, changing the deployment branch) → stop and ask the user
7. **Homepage Protection**: The homepage (`components/HomePage.tsx`) is the live production page. If building a replacement, build it on a **new test route** (e.g., `app/[locale]/new-home/page.tsx`) so the user can test it without causing a production crash. Also note any incomplete features in `_tasks/INCOMPLETE_FEATURES.md` so they are not forgotten.
8. **Knowledge Sync (MANDATORY)**: Before asking the user clarification questions or generating a new roadmap, **ALWAYS read the files in `_tasks/completed/`**. This prevents agents from repeatedly asking about configurations, integrations (e.g., Supabase Auth, Stripe), or UI decisions that have already been finalized in previous tasks.
9. **Category System Map (MANDATORY)**: Before building ANY category-specific feature (nails, spa, makeup, waxing, barbershop), **ALWAYS read `_docs/category-system-map.md`**. This documents how all 6 verticals share base infrastructure and where they diverge. Follow the extension pattern — category features are ADDITIVE layers on the shared base, never replacements. Use the naming conventions: `lib/{category}/`, `components/{category}/`, `{category}_` table prefixes.

----

## 6. Supabase Schema (New — Migration 014+)

> ➡️ **Moved to `_rules/DB_SCHEMA.md`**
> The full structured table containing all 50+ Supabase tables, views, key columns, and their business logic notes has been moved to its own file. Go read `_rules/DB_SCHEMA.md` whenever you need to modify or interact with the database schema.

---

## 7. Deployment

- **Platform**: Vercel (auto-deploys from `main` branch)
- **Build**: Vercel runs `npm run build` (Next.js + Tailwind)
- **Homepage**: `app/[locale]/page.tsx` renders `<HomePage />` (fully React, no iframe)
- **All pages**: `app/[locale]/*/page.tsx` are Next.js React pages

---

## 8. Task Tracking

### 8.1 The `_tasks/` Folder

```
_tasks/
├── INCOMPLETE_FEATURES.md              # ⚠️ NEVER DELETE. Append blocked/partially built features here.
├── roadmap-dev2-customer-frontend.md   # Dev 2 execution plan
├── roadmap-dev3-salon-dashboard.md     # Dev 3 execution plan
└── completed/                          # Archive of finished tasks
```

### 8.2 Task Lifecycle

```
START → Note intent in .agent-comms.md
DONE  → Move task file to _tasks/completed/ + note in .agent-comms.md
```

### 8.3 Incomplete Features Protocol (MANDATORY)

If you cannot finish a feature (e.g., missing API route, missing dependency, lack of context):
1. **DO NOT** delete the feature from the roadmap or hide the failure.
2. **DO NOT** delete or overwrite `_tasks/INCOMPLETE_FEATURES.md`.
3. **APPEND** an entry to `_tasks/INCOMPLETE_FEATURES.md` detailing:
   - **Feature**: What you were trying to build.
   - **File/Line**: Exactly where you stopped (e.g. `path/to/file.tsx:42`).
   - **Blocker**: Why you couldn't finish it (e.g., "Missing `POST /api/stuff` route from Dev 1").
   - **Next Steps**: What the next agent or user needs to do to unblock it.

---

## 9. Spec → Roadmap Fidelity Rules (MANDATORY)

> ➡️ **Moved to `_rules/ROADMAP_RULES.md`**
> All rules pertaining to converting specs to roadmaps and ensuring fidelity have been extracted. For Agent workflow generation policies, check `_rules/ROADMAP_RULES.md`.

---

## 10. 🚨 CODE SAFETY RULES (MANDATORY — ZERO EXCEPTIONS)

> **CONTEXT**: On 2026-03-17, an AI agent executed a roadmap and created a mega-commit that broke the entire production site. It imported 4 components that didn't exist, called 4 APIs that didn't exist, and deviated from the roadmap spec. This section exists to prevent that from EVER happening again.

### Rule 1: VERIFY IMPORTS EXIST BEFORE USING THEM
Before writing `import Foo from "@/components/Foo"`:
1. **Check** if `components/Foo.tsx` (or `Foo/index.tsx`) actually exists in the file system
2. If it does NOT exist → you MUST create it FIRST, or remove the import
3. **NEVER** import a component, hook, type, or utility that doesn't exist yet

**Verification command:**
```bash
# Before importing, check the file exists:
ls -la components/Foo.tsx  # Must return the file, not "No such file"
```

### Rule 2: VERIFY API ROUTES EXIST BEFORE CALLING THEM
Before writing `fetch("/api/some-endpoint")`:
1. **Check** if `app/api/some-endpoint/route.ts` exists
2. If it does NOT exist → you MUST create the API route FIRST, or remove the fetch call
3. **NEVER** call an API endpoint that doesn't exist — this causes 404/500 errors in production

**Verification command:**
```bash
# Before calling, check the route exists:
ls -la app/api/some-endpoint/route.ts
```

### Rule 3: ONE COMMIT PER SUB-PHASE
- If a roadmap has phases `1.1`, `1.2`, `1.3` → make **separate commits** for each
- **NEVER** combine multiple phases into one mega-commit
- Each commit message must reference the sub-phase: `"phase 1.1: fix layout overflow"`
- After EACH commit: `npm run build` must pass BEFORE pushing

### Rule 4: BUILD BEFORE COMMIT, PUSH AFTER BUILD — ALWAYS PUSH
```bash
# This exact sequence. Every time. No exceptions.
npm run build           # Step 1: MUST pass
git add -A              # Step 2: only after build passes
git commit -m "..."     # Step 3: descriptive message with phase number
git push origin main    # Step 4: ALWAYS push after commit — never ask, just push
# Step 5: Check Vercel deployment via MCP (list_deployments) — must show READY
# Step 6: If errors → fix and push again. If READY → done.
```
If `npm run build` fails → **DO NOT commit. DO NOT push. Fix the error first.**
**IMPORTANT**: After executing a roadmap or task, ALWAYS commit AND push without asking. Do not stop to ask "should I push?" — the answer is always yes. Then verify the Vercel deployment status and fix any errors.

### Rule 5: FOLLOW THE ROADMAP LITERALLY
When executing a roadmap from `_tasks/`:
- Build EXACTLY what the roadmap specifies — no more, no less
- If the roadmap says "use `lucide-react` Scissors icon" → use that exact icon, not a custom SVG
- If the roadmap says "6 category cards" → build exactly 6, not 8
- If the roadmap says "use existing `<SalonCard>` component" → import and use the existing one, do NOT build a new card component
- If the roadmap does NOT mention a component/feature → do NOT add it
- **NEVER** ad-lib features, components, or API calls that aren't in the roadmap

### Rule 6: CHECK VERCEL AFTER EVERY PUSH
After every `git push`:
```bash
sleep 30
npx vercel ls 2>&1 | head -5
# Must show "● Ready" with a recent timestamp
# If "● Error" → read logs, fix, and push again
```
Then check the live page:
```bash
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
# Must return 200 or 307
```

### Rule 7: IF UNSURE, STOP AND ASK
- If a roadmap step is ambiguous → STOP and ask the user
- If you need a component that doesn't exist → STOP and ask if you should create it or use something else
- If an API endpoint isn't available → STOP and note it in `_tasks/INCOMPLETE_FEATURES.md`
- **NEVER** guess or improvise — broken production is worse than a paused task

### Rule 8: NEVER REBUILD FROM SCRATCH
> **INCIDENT**: An AI agent was asked to modify existing pages but instead created entirely new pages/layouts, overwriting working UI with generic templates that didn't match the Solen design system.

- **ALWAYS** read the existing file content FIRST before editing
- **ALWAYS** use existing components (`DashboardLayout`, `SalonCard`, `Spinner`, etc.) — do NOT create replacements
- **ALWAYS** match the existing styling patterns (read `UI_RULES.md` + look at `dashboard/page.tsx` for reference)
- **NEVER** replace a working page with a new one built from scratch
- **NEVER** create a new layout component when `DashboardLayout` already exists
- **NEVER** create a new card component when `SalonCard` or the dashboard card pattern already exists
- If you think the existing component is wrong → STOP and ask the user before replacing it

### Rule 9: VERIFY PREVIEW ENVIRONMENTS
> **INCIDENT**: Preview deployments crashed because `NEXT_PUBLIC_SUPABASE_URL` was only set for Production in Vercel, not Preview. The middleware tried to init Supabase with `undefined` → instant `MIDDLEWARE_INVOCATION_FAILED`.

- When adding NEW environment variables, remind the user to set them for **ALL environments** (Production + Preview + Development) in Vercel
- If a build works locally but preview fails → check if the env vars are set for Preview in Vercel
- **NEVER** assume an env var is available — always use fallbacks or early-exit checks:
  ```typescript
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  ```

### Rule 10: TEST API ROUTES AFTER CREATING THEM
> **INCIDENT**: 41 API routes were built but never tested. They looked correct in code but failed at runtime because of missing env vars, wrong response formats, and broken function calls.

- After creating or modifying an API route, verify it works by checking:
  - All imported functions/modules exist
  - All env vars it depends on are set (or gracefully handled if not)
  - The response format matches what the frontend expects
- If you can't test a route, add it to `_tasks/INCOMPLETE_FEATURES.md` with a note like: "Route created but untested — needs manual verification"

### Rule 11: API RESPONSE FORMAT CONSISTENCY
> **INCIDENT**: DM Chat broke because one route returned `{ data: profile }` but the frontend expected `profile` directly. Another returned `{ items: [...] }` but the frontend expected `{ messages: [...] }`.

- **ALWAYS** check what the frontend expects before changing an API response format
- **ALWAYS** return data in the format the consumer expects — if changing the format, update ALL consumers
- When in doubt, return BOTH keys for backwards compatibility:
  ```typescript
  // ✅ SAFE — supports both old and new consumers
  return NextResponse.json({ messages: data, items: data, data });
  ```
- **NEVER** change an existing API's response structure without grepping for all `fetch("/api/that-route")` calls first

### Rule 12: SINGLE DESIGN SYSTEM
- There is only ONE design system: **Next.js** (Section 3.3)
- Colors: Terracotta Coral `#E8624A` (primary, `s-coral`), Amber `#D4870A` (accent, `s-amber`), Blue `#6BA3C8` (accent, `s-blue`), Warm Ink `#1A1209` (text, `s-ink`)
- Fonts: Bebas Neue (display ≥40px), Syne (headings), DM Sans (body + data with `data-text`)
- The old teal/coral design (`#38B2AC`, `#FF6B6B`) and the monolith wine-red design are **RETIRED**
- **NEVER** use teal, old coral `#FF6B6B`, wine red, gold, DM Serif Display, or Space Grotesk in any new code
- **NEVER** reference `index.html` or `public/home.html` — they no longer exist

---

## 11. 🔒 SECURITY RULES (MANDATORY — ALL API ROUTES)

> ➡️ **Moved to `_rules/SECURITY_RULES.md`**
> This codebase requires strict enforcement of Rate Limiting, Supabase RLS policies, feature flags, audit logging, and payload validation (Zod). All API routes must implement this middleware-like stack.
> Read `_rules/SECURITY_RULES.md` before making ANY route/API modification.

### Rule 13: VERIFY YOUR BRANCH NAME BEFORE WORKING

> **INCIDENT**: On 2026-03-18, a parallel session agent was told to create `moat/session2` but ended up on `moat/session3` (created by another agent running in parallel). All Session 2 commits landed on the wrong branch, causing confusion during merge.

- After running `git checkout -b <branch>`, **IMMEDIATELY verify** the branch name with `git branch --show-current`
- If the branch already exists (error: `fatal: A branch named 'X' already exists`), **DO NOT** silently switch to a different branch. STOP and ask the user.
- If `git branch --show-current` shows a DIFFERENT branch than what you intended, **DO NOT** continue working. Switch to the correct branch first.
- **NEVER** assume you're on the right branch — always verify after checkout.

### Rule 14: CODE REVIEW PROTOCOL

Before EVERY push:
1. `npm run build` — must pass
2. `npx tsc --noEmit` — zero type errors
3. `git diff --stat` — review changed files, ensure no unintended changes

After EVERY push:
1. Wait 60s for Vercel deploy
2. `curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/` — must be 200 or 307
3. Curl critical routes: /de, /de/coiffeur, /de/barbershop, /de/dashboard

After ALL phases complete:
1. Visual browser check on every new page
2. Lighthouse: performance > 70, accessibility > 90
3. Minor UI bugs → fix immediately
4. Major design issues → STOP and ask user

---

## 12. 📋 ROADMAP CREATION STANDARDS (MANDATORY FOR ALL ROADMAPS)

> ➡️ **Moved to `_rules/ROADMAP_RULES.md`**
> Every AI execution roadmap must contain specific sections (Breakage risks, code examples, Verification steps, etc.). Read `_rules/ROADMAP_RULES.md` before generating roadmaps.

---

## 13. 🎨 DESIGN TOKEN CONSISTENCY RULES (MANDATORY)

> ➡️ **Moved to `_rules/UI_RULES.md`**
> All legacy Tailwind color tokens (like `text-dark`, `bg-black`, standard shapes) are strictly banned. Everything related to visual frontend modifications must strictly obey the design tokens architecture (e.g., `s-ink`, `rounded-card`, `rounded-blob-a`).
> **Before writing ANY UI code, you MUST check `_rules/UI_RULES.md`.** It acts as the single source of truth for all frontend consistency logic.