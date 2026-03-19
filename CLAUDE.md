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
| **Payments** | [Stripe](https://stripe.com/) — Payment Intents, Connect, Webhooks |
| **Rate Limiting** | [Upstash Redis](https://upstash.com/) via `@upstash/ratelimit` |
| **Validation** | [Zod](https://zod.dev/) — API input validation schemas in `lib/validations.ts` |
| **UI Components** | 21st.dev components (InteractiveHoverButton, ExpandableNavTabs, Sidebar, DatePicker) |
| **Date Picker** | `react-aria-components` + `@internationalized/date` |
| **Deployment** | Vercel (`vercel.json`) |
| **PWA** | `manifest.json` + `sw.js` (Service Worker) |

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
│   ├── layout/         # Header, Footer, BottomNav
│   └── ui/             # Shared UI primitives (Skeleton, SearchBar, ExpandableTabs, etc.)
├── lib/                # Utility libraries (Dev 1 owns)
│   ├── supabase.ts     # Supabase client helpers (server + admin)
│   ├── ratelimit.ts    # Upstash rate limiters (from security roadmap Phase 4)
│   ├── feature-flags.ts # Kill switch + ban check (from security roadmap Phase 5)
│   ├── validations.ts  # Zod schemas for all API inputs (from security roadmap Phase 6)
│   └── audit.ts        # Admin action audit logging (from security roadmap Phase 9)
├── public/             # Static assets
├── supabase/           # Migrations + Edge Functions (Dev 1 owns)
├── messages/           # i18n translation files
├── .env.local          # Environment variables (DO NOT COMMIT)
└── vercel.json         # Vercel deployment config
```

### 3.3 Design System (New — Next.js)

- **Colors**: Terracotta Coral `#E8624A` (primary, class: `s-coral`), Amber `#D4870A` (accent, class: `s-amber`), Basel Blue `#6BA3C8` (accent, class: `s-blue`), Warm Ink `#1A1209` (text, class: `s-ink`)
- **Backgrounds**: Cream `#FAF6EF` (base), White `#FFFFFF` (cards/raised), `#EDE5D8` (sunken inputs), `#F3EDE2` (surface)
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
- **Background blobs**: `<BackgroundBlobs>` from `BackgroundBlobs.tsx` — decorative gradient blobs for hero/section backgrounds.

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

----

## 6. Supabase Schema (New — Migration 014+)

| Table | Key Columns | Notes |
|---|---|---|
| `salons` | `id`, `owner_id`, `name`, `slug`, `categories[]`, `quartier`, `address`, `latitude`, `longitude`, `is_active`, `average_rating`, `review_count`, `group_id`, `solen_score`, `solen_tier`, `score_details` | **No `status` column.** `is_active` is the field. RLS enforces `is_active=true` for anon. `group_id` FK → `salon_groups`. `solen_score` 0-100, `solen_tier` gold/teal/grey/dark, computed nightly by cron. |
| `services` | `id`, `salon_id`, `name_de`, `name_en`, `category`, `duration_minutes`, `price`, `is_active` | |
| `staff_members` | `id`, `salon_id`, `name`, `avatar_url`, `specialties[]`, `is_active` | |
| `availability_slots` | `id`, `salon_id`, `service_id`, `staff_member_id`, `starts_at`, `ends_at`, `status` | status: available/booked/blocked |
| `bookings` | `id`, `user_id`, `salon_id`, `service_id`, `slot_id`, `starts_at`, `ends_at`, `price_paid`, `status`, `is_first_visit`, `is_recurring`, `sms_sent_24h`, `sms_sent_1h`, `review_prompt_sent` | SMS/review flags added in session 3. |
| `profiles` | `id`, `display_name`, `avatar_url`, `role`, `onboarding_completed`, `banned_at`, `ban_reason` | role: customer/salon_owner/admin. `banned_at` = user banned. |
| `conversations` | `id`, `customer_id`, `salon_id`, `unread_count_salon` | |
| `messages` | `id`, `conversation_id`, `sender_id`, `content`, `message_type` | |
| `salon_directory` | `name`, `phone`, `email`, `address`, `google_place_id`, `claim_code` | RLS enabled (read-only for public, admin-only writes). |
| `feature_flags` | `key` (PK), `enabled`, `description`, `updated_by` | Kill switch. `maintenance_mode` = global off switch. |
| `audit_log` | `actor_id`, `action`, `target_type`, `target_id`, `metadata`, `ip_address` | Logs admin actions. Admin-only read. |
| `data_deletion_log` | `user_email`, `requested_at`, `completed_at`, `tables_cleared` | GDPR compliance. Admin-only read. |
| `staff_portfolio_images` | `id`, `staff_member_id`, `image_url`, `caption`, `sort_order` | Instagram-style staff gallery. RLS: public read, salon owner manage. |
| `service_addons` | `id`, `service_id`, `name`, `price`, `duration_minutes` | Add-on suggestions during booking. |
| `favorites` | `user_id`, `salon_id`, `created_at` | User favorites. RLS: own only. |
| `notification_preferences` | `user_id` (PK), `rebooking_enabled`, `messages_enabled`, `deals_enabled`, `new_salons_enabled` | User notification settings. Extended in migration 054. |
| `price_offers` | `id`, `conversation_id`, `salon_id`, `customer_id`, `amount_chf`, `status`, `stripe_payment_intent_id`, `expires_at` | In-chat price negotiation. |
| `price_disputes` | `id`, `booking_id` (UNIQUE), `original_amount`, `requested_amount`, `salon_reason`, `status`, `auto_approve_at` | Post-visit upcharge disputes. Max 50% upcharge. |
| `loyalty_cards` | `id`, `salon_id`, `stamps_needed`, `reward_text`, `is_active` | Salon stamp card definitions. |
| `loyalty_stamps` | `id`, `loyalty_card_id`, `customer_id`, `stamped_at` | Individual stamps collected. |
| `client_notes` | `id`, `salon_id`, `customer_id`, `note`, `note_type`, `booking_id`, `created_by` | CRM notes (permanent/booking). |
| `review_replies` | `id`, `review_id` (UNIQUE), `salon_id`, `reply_text`, `is_public` | Salon owner replies to reviews. |
| `off_peak_slots` | `id`, `salon_id`, `day_of_week`, `start_time`, `end_time`, `discount_percent`, `is_active` | Off-peak discount hours. |
| `help_articles` | `id`, `slug`, `title`, `content`, `category`, `locale`, `published`, `sort_order` | Help center articles. Admin CMS. |
| `review_photos` | `id`, `review_id`, `photo_url`, `sort_order` | Review photo attachments. Stored in `review-photos` Supabase bucket. RLS: public read, reviewer write. |
| `salon_groups` | `id`, `name`, `slug`, `logo_url`, `description`, `website` | Multi-location chains. RLS: public read, admin write. `salons.group_id` FK references this. |
| `chat_templates` | `id`, `salon_id`, `text`, `sort_order`, `created_at` | Quick-reply templates for salon chat. RLS: salon owner only. Max 10 per salon. |
| `client_tags` | `id`, `salon_id`, `customer_id`, `tag`, `color`, `created_at` | Color-coded client tags (allergy/preference). Colors: gray, red, orange, teal, blue, purple. UNIQUE(salon_id, customer_id, tag). RLS: salon owner only. |

| View | Columns | Notes |
|---|---|---|
| `public_profiles` | `id`, `display_name`, `avatar_url` | Safe public view. Use this (not `profiles`) when displaying OTHER users' names/avatars. |

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

- **UI & Design Rules:** Before writing ANY frontend code, you must read and strictly adhere to `UI_RULES.md`. Do NOT deviate from the light-mode, glassmorphic, Airbnb-style layout constraints defined there.

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

### Rule 4: BUILD BEFORE COMMIT, PUSH AFTER BUILD
```bash
# This exact sequence. Every time. No exceptions.
npm run build           # Step 1: MUST pass
git add -A              # Step 2: only after build passes
git commit -m "..."     # Step 3: descriptive message with phase number
git push origin main    # Step 4: only after commit
# Step 5: Wait 30s, then verify Vercel deployment status
```
If `npm run build` fails → **DO NOT commit. DO NOT push. Fix the error first.**

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

> **CONTEXT**: A full security audit on 2026-03-17 found zero rate limiting, zero input validation, exposed credentials in git, and disabled RLS on critical tables. These rules exist to prevent security regressions.
>
> **NOTE**: All security utility files are implemented and mandatory. See `lib/ratelimit.ts`, `lib/feature-flags.ts`, `lib/validations.ts`, `lib/audit.ts`. Every API route MUST include all security layers — no exceptions, no TODOs.

### Rule S1: EVERY NEW API ROUTE MUST HAVE THESE LAYERS

When creating or modifying ANY API route in `app/api/`, you MUST include these checks **in this exact order**:

```typescript
// ✅ CORRECT — Full security stack
export async function POST(req: NextRequest) {
  // 1. Feature flag check (is this feature enabled?)
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  // 2. Auth check
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 3. Ban check
  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // 4. Rate limit check
  const rateLimited = await applyRateLimit(bookingLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  // 5. Input validation (zod)
  const body = await req.json();
  const { data, error } = validateBody(createBookingSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: "VALIDATION_ERROR" }, { status: 400 });

  // 6. Business logic...
}
```

```typescript
// ❌ WRONG — No security layers
export async function POST(req: NextRequest) {
  const body = await req.json();  // No auth, no rate limit, no validation
  const { data } = await supabase.from("bookings").insert(body);
  return NextResponse.json({ data });
}
```

**For public (unauthenticated) GET routes**, use IP-based rate limiting:

```typescript
// ✅ CORRECT — Public route with IP rate limit
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;
  // ... query logic
}
```

### Rule S2: NEVER EXPOSE SECRETS

- **NEVER** hardcode API keys, tokens, or secrets in source code
- **NEVER** use `SUPABASE_SERVICE_ROLE_KEY` in client-side code or `NEXT_PUBLIC_` variables
- **NEVER** commit `.env`, `.env.local`, or files containing tokens to git
- **ALWAYS** use `process.env.VARIABLE_NAME` server-side only
- **ALWAYS** use `createAdminSupabaseClient()` (service role) ONLY in API routes, never in components

```typescript
// ✅ CORRECT — Server-side only, from env
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ❌ WRONG — Hardcoded secret
const stripe = new Stripe("sk_live_abc123...");

// ❌ WRONG — Service role key in a client component
const admin = createAdminSupabaseClient(); // This bypasses RLS!
```

### Rule S3: RLS IS NON-NEGOTIABLE

When creating new Supabase tables or modifying migrations:
- **ALWAYS** enable RLS: `ALTER TABLE public.tablename ENABLE ROW LEVEL SECURITY;`
- **ALWAYS** add explicit SELECT/INSERT/UPDATE/DELETE policies
- **NEVER** use `USING (true)` for write operations (INSERT/UPDATE/DELETE)
- **NEVER** grant `DELETE` or `TRUNCATE` to the `anon` role
- `USING (true)` for SELECT is acceptable ONLY for genuinely public read data (salons, reviews)

```sql
-- ✅ CORRECT — Scoped policies
CREATE POLICY "bookings_select_own" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

-- ❌ WRONG — Anyone can read/write anything
CREATE POLICY "bookings_yolo" ON public.bookings
  FOR ALL USING (true);
```

### Rule S4: VALIDATE ALL USER INPUT

- **ALWAYS** validate request bodies with zod schemas from `lib/validations.ts`
- **ALWAYS** validate UUID parameters (don't trust URL path params)
- **NEVER** pass raw user input directly into SQL or `.ilike()` without length limits
- **NEVER** trust `req.json()` without schema validation

### Rule S5: SECURITY UTILITIES — MANDATORY IMPORTS

When writing API routes, these utilities MUST be available (created in the security roadmap):

| Utility | Import | Purpose |
|---|---|---|
| Rate limiting | `import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit"` | Prevent abuse |
| Feature flags | `import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags"` | Kill switch |
| Validation | `import { validateBody, schemaName } from "@/lib/validations"` | Input validation |
| Audit logging | `import { logAuditEvent } from "@/lib/audit"` | Admin action tracking |

All four utility files exist and are mandatory in every API route. There are no exceptions.

### Rule S6: ADMIN ROUTES MUST DOUBLE-CHECK ROLE

Every route under `app/api/admin/` MUST verify the user's role from the database. Never trust client-provided role claims.

```typescript
// ✅ CORRECT — Check role from DB
const { data: profile } = await supabase
  .from("profiles").select("role").eq("id", user.id).single();
if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

// ❌ WRONG — Trusting client header or JWT claim alone
if (req.headers.get("x-role") !== "admin") return ...
```

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

> **CONTEXT**: Multiple roadmaps were created with varying quality — some had vague steps that broke production, others lacked risk warnings. This standard ensures EVERY roadmap is safe for Claude Code to execute.

When creating a NEW roadmap (stored in `_tasks/roadmap-*.md`), you MUST include ALL of these sections. Reference `_tasks/roadmap-security-hardening.md` as the gold standard.

### R1: BREAKAGE RISK ASSESSMENT (at the top)

**Every roadmap MUST start with a risk table** listing each phase's risk level:

```markdown
| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | — |
| Phase 2 | 🔴 HIGH | Salon card display | Must update X before Y |
| Phase 3 | 🟡 MEDIUM | Runtime crash if env var missing | Set env var first |
```

For any 🔴 HIGH or 🟡 MEDIUM phase: grep the codebase for affected patterns, list the **exact files** at risk, and explain how to avoid breakage.

### R2: SEPARATE MANUAL VS CODE PHASES

Split every roadmap into:
- **🤖 CLAUDE CODE PHASES** — Pure code/migration changes. No external accounts needed.
- **🧑 MANUAL PHASES** — Require dashboard access, API key creation, DNS config, or human verification. List these separately with step-by-step dashboard instructions.

### R3: ⚠️ BE CAREFUL BLOCK ON EVERY PHASE

Every phase MUST end with a `> ⚠️ **BE CAREFUL**:` block. Include:
- What could go wrong in this specific phase
- Common mistakes Claude Code might make
- Files/routes that should NOT be touched
- Edge cases and gotchas
- What to verify after completing the phase

### R4: ✅ DO / ❌ DON'T EXAMPLES

Every phase that involves writing code MUST include:
- A `✅ DO` code example showing the correct pattern
- A `❌ DON'T` code example showing what NOT to do
- If modifying existing code: show the BEFORE and AFTER diff

### R5: EXACT FILE PATHS AND TAGS

Every file mentioned in the roadmap must have:
- `[NEW]` tag for new files
- `[MODIFY]` tag for modified files
- `[DELETE]` tag for deleted files
- Full relative path from project root (e.g., `app/api/bookings/route.ts`, not just "the bookings route")

### R6: DEPENDENCY ORDERING TABLE

End the roadmap with an execution order summary:

```markdown
| Step | Type | What | Depends On |
|---|---|---|---|
| Manual A | 🧑 | Create Upstash Redis | Nothing |
| Phase 1 | 🤖 | Git cleanup | Nothing |
| Phase 2 | 🤖 | Rate limiting | Manual A |
```

### R7: VERIFICATION STEPS PER PHASE

Each phase must specify:
- The exact `git commit` command with a descriptive message
- What to verify after deployment (curl command, expected HTTP status, etc.)
- If the phase creates API routes: how to test them

### R8: FINAL PHASE UPDATES CLAUDE.md

If the roadmap introduces:
- New utility files (e.g., `lib/something.ts`)
- New tables or views in Supabase
- New environment variables
- New patterns that future code must follow

Then the LAST phase of the roadmap MUST update:
- `CLAUDE.md` Section 2 (Tech Stack) — if new dependencies
- `CLAUDE.md` Section 3.2 (Directory Tree) — if new lib files
- `CLAUDE.md` Section 6 (Schema Table) — if new tables/views
- `CLAUDE.md` Section 11 (Security Rules) — if new security patterns
- `.env.example` — if new env vars

### R9: ROADMAP FILE NAMING

Save all roadmaps in `_tasks/` with the naming pattern:
```
_tasks/roadmap-{topic}.md
```
Examples: `roadmap-security-hardening.md`, `roadmap-payment-system.md`, `roadmap-french-translation.md`

### R10: BEFORE WRITING THE ROADMAP — SCAN FIRST

Before writing ANY phase:
1. **Grep for affected patterns** — search the codebase for code that will be impacted
2. **List exact files** that need to change (don't say "update all routes" — list each one)
3. **Check existing `_tasks/INCOMPLETE_FEATURES.md`** for related unfinished work
4. **Read `_tasks/completed/`** for past decisions that affect the new feature
5. **Verify all imports/components/APIs** referenced in the roadmap actually exist

---

## 13. 🎨 DESIGN TOKEN CONSISTENCY RULES (MANDATORY)

> **CONTEXT**: A full codebase scan on 2026-03-19 revealed 1,008 refs of `text-dark` (legacy token) vs 9 refs of `text-s-ink` (design system token). Both resolved to the same hex, but the naming inconsistency made the codebase unmaintainable. These rules prevent this from happening again.

### Rule 20: BANNED TOKEN LIST — NEVER USE THESE

The following CSS classes are BANNED. If you write ANY of these, the code is wrong. No exceptions.

| ❌ BANNED | ✅ USE INSTEAD | Why |
|---|---|---|
| `text-dark` (any opacity) | `text-s-ink` / `text-s-ink/50` etc. | Legacy token, use design system |
| `bg-dark` (any opacity) | `bg-s-ink` / `bg-s-ink/40` etc. | Legacy token |
| `border-dark` | `border-s-ink/10` | Legacy token |
| `bg-black` | `bg-s-ink` | Violates warm palette rule |
| `bg-gray-*` | `bg-s-bg-surface` / `bg-s-sand` | Cold gray, use warm |
| `text-gray-*` | `text-s-ink/*` (opacity) | Cold gray, use warm |
| `border-gray-*` | `border-s-ink/*` (opacity) | Cold gray, use warm |
| `dark:bg-dm-*` | `dark:bg-s-dm-*` | Missing `s-` prefix |
| `dark:text-dm-*` | `dark:text-s-dm-*` | Missing `s-` prefix |
| `dark:border-dm-*` | `dark:border-s-dm-*` | Missing `s-` prefix |
| `dark:text-white` (on non-buttons) | `dark:text-s-dm-text` | Use warm off-white |
| `dark:bg-black` | `dark:bg-s-dm-bg` | Use warm dark |
| `shadow-teal-glow` | `shadow-warm-sm` | Old branding |
| `bg-mesh-teal` | `bg-s-bg-base` | Old branding |
| `accent-teal` | `accent-s-coral` | Old branding |
| Any emoji in JSX | Lucide React icon | UI_RULES: no emoji |

**Enforcement**: After EVERY commit, run:
```bash
grep -Ern "text-dark[^M]|bg-dark[^M]|bg-black|bg-gray-|text-gray-|border-gray-|dark:bg-dm-|dark:text-dm-|shadow-teal|accent-teal|bg-mesh-teal" components/ app/ --include="*.tsx" | grep -v "node_modules\|darkMode\|//\|s-dm\|s-ink" | head -5
```
If this returns ANY results, fix them before pushing.

### Rule 21: DESIGN TOKEN VALIDATION — BEFORE EVERY COMMIT

Before committing ANY `.tsx` file change, you MUST verify:

1. **No banned tokens introduced** (Run the grep from Rule 20)
2. **Every `bg-white` has a `dark:bg-s-dm-*` pair** (unless on a coral button)
3. **Every `text-s-ink` has a `dark:text-s-dm-text` pair** (for primary text)
4. **No hardcoded hex colors** — all colors must use tailwind.config tokens
5. **No hardcoded `CHF`** — use `formatCurrency()` from `lib/format-currency.ts`
6. **No new `style={{}}` for values achievable with Tailwind**

```bash
# Quick validation script — run after every commit:
echo "=== Banned tokens ===" && \
grep -Ercn "text-dark[^M]|bg-dark[^M]|bg-black|bg-gray-|text-gray-" components/ app/ --include="*.tsx" | grep -v "s-ink\|s-dm\|darkMode" | wc -l && \
echo "=== Hardcoded hex ===" && \
grep -Ern "#[0-9a-fA-F]{3,6}" components/ --include="*.tsx" | grep -v "//\|import\|svg" | wc -l && \
echo "=== All should be 0 ==="
```

### Rule 22: NEW TOKENS REQUIRE UI_RULES.md DOCUMENTATION

If you add ANY new:
- Color token to `tailwind.config.js`
- Custom utility class (like `rounded-card`, `shadow-glass`)
- Font family or typography class
- z-index value

You MUST also update `UI_RULES.md` with:
1. The token name, value, and purpose
2. Which components should use it
3. What it replaces (if deprecating an old token)

**Never introduce a parallel naming system.** Before creating a new token, check if an existing one serves the same purpose. If `s-ink` already means `#1A1209`, don't create `dark` with the same value.

