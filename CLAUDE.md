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

| Table | Key Columns | Notes |
|---|---|---|
| `salons` | `id`, `owner_id`, `name`, `slug`, `categories[]`, `quartier`, `address`, `latitude`, `longitude`, `is_active`, `average_rating`, `review_count`, `group_id`, `solen_score`, `solen_tier`, `score_details`, `cancellation_count` | **No `status` column.** `is_active` is the field. RLS enforces `is_active=true` for anon. `group_id` FK → `salon_groups`. `solen_score` 0-100, `solen_tier` gold/teal/grey/dark, computed nightly by cron. |
| `services` | `id`, `salon_id`, `name_de`, `name_en`, `category`, `duration_minutes`, `price`, `is_active` | |
| `staff_members` | `id`, `salon_id`, `name`, `avatar_url`, `specialties[]`, `is_active` | |
| `availability_slots` | `id`, `salon_id`, `service_id`, `staff_member_id`, `starts_at`, `ends_at`, `status` | status: available/booked/blocked |
| `bookings` | `id`, `user_id`, `salon_id`, `service_id`, `slot_id`, `starts_at`, `ends_at`, `price_paid`, `status`, `is_first_visit`, `is_recurring`, `sms_sent_24h`, `sms_sent_1h`, `review_prompt_sent` | SMS/review flags added in session 3. |
| `profiles` | `id`, `display_name`, `avatar_url`, `role`, `onboarding_completed`, `banned_at`, `ban_reason`, `no_show_count` | role: customer/salon_owner/admin. `banned_at` = user banned. |
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
| `feature_requests` | `id`, `admin_id`, `element_selector`, `element_tag`, `element_text`, `component_hint`, `page_url`, `description`, `priority`, `status`, `generated_roadmap`, `roadmap_version`, `claude_prompt`, `token_usage` | Admin visual editor requests. RLS: admin-only all ops. |
| `discovery_items` | `id`, `category`, `content_type`, `name_*`, `description_*`, `image_url`, `tiktok_url`, `tiktok_embed_html`, `tiktok_thumbnail_url`, `media_type`, `source`, `gender`, `texture`, `tags[]`, `salon_script_*`, `cut_guide`, `price_min`, `price_max`, `like_count`, `save_count`, `view_count`, `status`, `owner_user_id`, `owner_salon_id` | Discovery content. RLS: public read (published+active), owner manage. |
| `discovery_staging` | `id`, `source`, `source_id`, `source_url`, `image_url`, `title`, `author_name`, `category`, `gender`, `ai_result`, `status` | Import staging area. RLS: admin-only. |
| `discovery_likes` | `id`, `user_id`, `item_id`, `created_at` | UNIQUE(user_id, item_id). Toggle via `toggle_discovery_like` RPC. |
| `discovery_saves` | `id`, `user_id`, `item_id`, `collection_id`, `created_at` | UNIQUE(user_id, item_id). Toggle via `toggle_discovery_save` RPC. |
| `discovery_comments` | `id`, `item_id`, `user_id`, `text`, `is_flagged`, `created_at` | Max 500 chars. Auto-flagged via content-flags. |
| `discovery_interactions` | `id`, `item_id`, `user_id`, `interaction_type`, `duration_ms`, `created_at` | Fire-and-forget analytics logging. |
| `discovery_boards` | `id`, `name`, `slug`, `category`, `gender`, `cover_images[]`, `pin_count` | Curated collections. |
| `discovery_collections` | `id`, `user_id`, `name`, `is_public` | User save collections. |
| `discovery_products` | `id`, `name`, `brand`, `price`, `affiliate_url`, `image_url` | Product recommendations. |
| `staff_invites` | `id`, `salon_id`, `email`, `staff_name`, `invited_by`, `token`, `accepted_at` | Staff invite tokens. UNIQUE(salon_id, email). |
| `staff_services` | `staff_member_id`, `service_id` | Many-to-many staff↔service mapping. PK(staff_member_id, service_id). |
| `staff_breaks` | `id`, `staff_member_id`, `day_of_week`, `start_time`, `end_time`, `label` | Recurring break slots. |
| `staff_time_off` | `id`, `staff_member_id`, `start_date`, `end_date`, `reason`, `approved` | Time-off requests. |
| `salon_closures` | `id`, `salon_id`, `date`, `reason` | One-off closure days. UNIQUE(salon_id, date). |
| `recurring_rules` | `id`, `salon_id`, `staff_member_id`, `day_of_week`, `start_time`, `end_time`, `recurrence_type` | Recurring availability rules. |
| `tips` | `id`, `booking_id`, `tipper_id`, `staff_member_id`, `amount`, `payment_intent_id`, `paid_at` | Post-service tips. |
| `gift_cards` | `id`, `salon_id`, `code`, `original_amount`, `remaining_amount`, `purchaser_id`, `recipient_name`, `recipient_email`, `message`, `is_active`, `expires_at` | Digital gift cards. UNIQUE(code). |
| `service_packages` | `id`, `salon_id`, `name`, `service_id`, `sessions`, `bonus_sessions`, `price`, `is_active` | Multi-session punch cards. |
| `package_purchases` | `id`, `package_id`, `customer_id`, `sessions_used`, `payment_intent_id`, `purchased_at` | Package purchase tracking. |
| `client_formulas` | `id`, `salon_id`, `customer_id`, `brand`, `product_line`, `mix_formula`, `developer_volume`, `processing_minutes`, `notes` | Hair color formulas. |
| `client_photos` | `id`, `salon_id`, `customer_id`, `photo_url`, `photo_type`, `notes` | Before/after + progress photos. `photo_type`: before/after/progress. |
| `intake_forms` | `id`, `salon_id`, `customer_id`, `template_type`, `responses`, `ai_recommendation` | Consultation intake forms. `template_type`: hair/nail/waxing/makeup/spa. |
| `processed_webhook_events` | `event_id` (PK), `processed_at` | Stripe webhook idempotency. |
| `nail_design_history` | `id`, `salon_id`, `customer_id`, `staff_member_id`, `shape`, `length`, `material`, `style_tags[]`, `color_codes[]`, `photos[]`, `notes`, `service_id`, `booking_id` | Per-client nail design records. |
| `nail_preferences` | `id`, `customer_id`, `salon_id`, `preferred_shape`, `preferred_length`, `preferred_material`, `preferred_brand`, `skin_sensitivity` | Client nail preferences per salon. |
| `nail_allergies` | `id`, `customer_id`, `allergen`, `severity`, `notes`, `reported_at` | Client nail product allergies. Severity: mild/moderate/severe. |
| `nail_inspo_images` | `id`, `user_id`, `image_url`, `source`, `board_id`, `tags[]` | Client inspiration images. Source: upload/board/discovery. |
| `nail_inspo_boards` | `id`, `user_id`, `name`, `cover_url`, `is_public` | User-created inspiration boards. |
| `nail_dynamic_pricing_rules` | `id`, `salon_id`, `rule_type`, `day_of_week`, `start_time`, `end_time`, `modifier`, `is_active` | Dynamic price modifiers. Types: peak_hour/off_peak/weekend/last_minute/loyalty. |
| `nail_retail_products` | `id`, `salon_id`, `name`, `price`, `category`, `image_url`, `stock_count`, `is_active` | In-salon retail products. Categories: nail_care/tools/polish/accessories. |
| `barber_walkin_queue` | `id`, `salon_id`, `customer_id`, `customer_name`, `customer_phone`, `service_id`, `assigned_barber_id`, `preferred_barber_id`, `status`, `position`, `estimated_wait_minutes`, `tracking_token`, `joined_at`, `called_at`, `started_at`, `completed_at`, `join_method` | Walk-in queue. Status: waiting/in_chair/completed/no_show/cancelled. `tracking_token` UNIQUE for anonymous tracking. |
| `barber_cut_history` | `id`, `salon_id`, `customer_id`, `staff_member_id`, `service_id`, `booking_id`, `fade_type`, `top_style`, `guard_length`, `beard_style`, `lineup`, `products_used[]`, `photos[]`, `notes`, `cut_at` | Per-client cut records with spec badges. |
| `barber_loyalty_programs` | `id`, `salon_id`, `name`, `stamps_required`, `reward_type`, `reward_value`, `is_active` | Salon loyalty program config. reward_type: free_service/discount_chf/discount_pct. UNIQUE(salon_id). |
| `barber_loyalty_cards` | `id`, `program_id`, `customer_id`, `stamps_collected`, `status`, `redeemed_at` | Individual loyalty cards. Status: active/completed/redeemed. |
| `barber_loyalty_history` | `id`, `card_id`, `stamped_by`, `stamped_at`, `booking_id` | Stamp event log for audit trail. |
| `barber_chairs` | `id`, `salon_id`, `chair_count`, `buffer_minutes` | Chair configuration per salon. UNIQUE(salon_id). Upsert pattern. |
| `search_embeddings` | `id`, `entity_type`, `entity_id`, `category`, `text_content`, `embedding` (vector 768), `updated_at` | pgvector embeddings for AI-powered search. RLS: public read, admin write. |
| `notifications` | `id`, `user_id`, `type`, `title`, `body`, `read`, `data`, `created_at` | In-app notification center. RLS: own only. |

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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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
| `border-t-teal` | `border-t-s-coral` | Old branding (found in Spinner.tsx) |
| `bg-amber-*` / `border-amber-*` / `fill-amber-*` | `bg-s-amber-subtle` / `border-s-amber/20` / `fill-s-amber` | Generic Tailwind, use design tokens |
| `bg-yellow-*` / `text-yellow-*` / `ring-yellow-*` | `bg-s-yellow-subtle` / `text-s-yellow-text` | Generic Tailwind, use design tokens |
| `bg-emerald-*` / `text-emerald-*` | `bg-s-success` / `text-s-success` | Generic Tailwind, use semantic token |
| `bg-green-*` / `text-green-*` | `bg-s-sage` / `text-s-sage-text` | Generic Tailwind, use design tokens |
| `bg-purple-*` / `text-purple-*` | `bg-s-plum-subtle` / `text-s-plum-text` | Generic Tailwind, use design tokens |
| `bg-rose-*` / `text-rose-*` | `bg-s-coral-subtle` / `text-s-coral-text` | Generic Tailwind, use design tokens |
| `bg-blue-100/200/300` / `text-blue-*` | `bg-s-blue-subtle` / `text-s-blue-text` | Generic Tailwind, use design tokens |
| `bg-red-*` | `bg-s-error-bg` / `bg-s-error` | Generic Tailwind, use semantic token |
| `shadow-sm` / `shadow-md` / `shadow-lg` | `shadow-warm-sm` / `shadow-warm-md` / `shadow-warm-lg` | Cold shadows → warm design tokens |
| `shadow-xl` / `shadow-2xl` | `shadow-warm-lg` | Cold shadows → warm design tokens |
| `rounded-lg/xl/2xl/3xl` | `rounded-card` / `rounded-button` / `rounded-pill` | Use design token radii (see UI_RULES §10) |
| `rounded-full` | `rounded-pill` | Use design token (9999px) |
| Any emoji in JSX | Lucide React icon | UI_RULES §5: no emoji in UI |

**Enforcement**: After EVERY commit, run:
```bash
grep -Ern "text-dark[^M]|bg-dark[^M]|bg-black|bg-gray-|text-gray-|border-gray-|dark:bg-dm-|dark:text-dm-|shadow-teal|accent-teal|bg-mesh-teal|border-t-teal|bg-amber-|border-amber-|fill-amber-|bg-yellow-|text-yellow-|ring-yellow-|bg-emerald-|text-emerald-|bg-green-|text-green-|bg-purple-|text-purple-|bg-rose-|text-rose-|shadow-sm[^a]|shadow-md|shadow-lg|shadow-xl|shadow-2xl|rounded-lg|rounded-xl|rounded-2xl|rounded-3xl|rounded-full" components/ app/ --include="*.tsx" | grep -v "node_modules\|darkMode\|//\|s-dm\|s-ink\|s-amber\|s-yellow\|s-success\|shadow-warm\|shadow-card\|shadow-glass\|shadow-coral\|rounded-card\|rounded-button\|rounded-pill\|rounded-blob" | head -10
```
If this returns ANY results, fix them before pushing.

### Rule 21: DESIGN TOKEN VALIDATION — BEFORE EVERY COMMIT

Before committing ANY `.tsx` file change, you MUST verify:

1. **No banned tokens introduced** (Run the grep from Rule 20)
2. **Every `bg-white` has a `dark:bg-s-dm-*` pair** (unless on a coral button or toggle knob)
3. **Every `text-s-ink` has a `dark:text-s-dm-text` pair** (for primary text)
4. **No hardcoded hex colors** — all colors must use tailwind.config tokens (exception: SVG brand logos like Google)
5. **No hardcoded `CHF`** — use `formatCurrency()` from `lib/format-currency.ts`
6. **No new `style={{}}` for values achievable with Tailwind**

```bash
# Quick validation script — run after every commit:
echo "=== Banned tokens ===" && \
grep -Ercn "text-dark[^M]|bg-dark[^M]|bg-black|bg-gray-|text-gray-|border-t-teal|bg-amber-|border-amber-" components/ app/ --include="*.tsx" | grep -v "s-ink\|s-dm\|s-amber\|darkMode" | wc -l && \
echo "=== Dark mode pairs ===" && \
grep -rn "bg-white" components/ --include="*.tsx" | grep -v "dark:\\|toggle\\|CookieBanner\\|//\\|knob" | wc -l && \
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

### Rule 23: DOCUMENTATION-CODE CONSISTENCY CHECK

> **CONTEXT**: On 2026-03-19, `UI_RULES.md` documented dark mode colors (`#0F0F1A`) that didn't match `tailwind.config.js` (`#151009`). The docs and code were out of sync for months without anyone noticing.

Whenever you modify ANY of these files, you MUST cross-check ALL FOUR for consistency:
- `tailwind.config.js` (colors, shadows, radii)
- `globals.css` (CSS variables)
- `UI_RULES.md` (design tokens documentation)
- `CLAUDE.md` Section 13 (design rules)

Checks:
1. Every color hex in `tailwind.config.js` must match its documentation in `UI_RULES.md`
2. Every CSS variable in `globals.css` must correspond to a Tailwind token
3. Every banned token in `CLAUDE.md` Rule 20 must also appear in `UI_RULES.md` Section 16
4. The dark mode colors in all files must be identical

```bash
# Cross-check dark mode values:
grep -n "151009\|1E1710\|F5EEE4" tailwind.config.js UI_RULES.md CLAUDE.md
# All files should show the SAME hex values
```

### Rule 24: DUPLICATE CONSTANT DETECTION

> **CONTEXT**: On 2026-03-19, `LanguageSwitcher.tsx` had `LOCALE_FLAGS` and `LOCALE_LABELS` with identical values, causing the `DE DE` duplication bug. `ClientTags.tsx` had a key named `teal` that actually mapped to coral styles.

Before committing, check for:
1. Two `Record<string, string>` constants in the SAME file with identical keys → delete one
2. A constant key that doesn't match its actual meaning (e.g., `teal` mapping to coral) → rename it
3. If renaming a key that may be stored in the database → add backward compatibility mapping

```bash
# Check for files with multiple Record<string, string> constants:
grep -rn "Record<string, string>" components/ --include="*.tsx" | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -5
# If any file appears 2+ times, inspect for duplicates
```

### Rule 25: NEVER USE `getUser()` IN API ROUTES OR MIDDLEWARE

> **CONTEXT**: This bug has been fixed TWICE (2026-03-18 and 2026-03-19). `supabase.auth.getUser()` makes a **network call** from Vercel Edge → Supabase to validate the JWT. This call **times out** on Vercel's edge network, returning `user: null` even when the session cookie is valid. This kills ALL session persistence — users log in successfully but get bounced to the login page on every subsequent navigation.

**ALWAYS use `getSession()`** — it reads the JWT directly from cookies with **zero network calls**.

```typescript
// ✅ CORRECT — reads JWT from cookies, no network call:
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user ?? null;

// ❌ BANNED — makes network call that TIMES OUT on Vercel Edge:
const { data: { user } } = await supabase.auth.getUser();
```

**This applies to:**
- `middleware.ts` (runs on EVERY request)
- ALL files in `app/api/` (route handlers)
- `lib/supabase.ts` `getSessionUser()` helper

**Enforcement:**
```bash
grep -rn "auth.getUser()" middleware.ts app/api/ lib/supabase.ts --include="*.ts"
# Must return 0 results. If ANY results found, change to getSession().
```

### Rule 26: NO DEAD CODE — EVERY COMPONENT MUST BE IMPORTED AND RENDERED

> **CONTEXT**: On 2026-03-20, Claude Code executed the Discovery roadmap and created 15+ components (PostFromDiscover, FilterDrawer, FeaturedBoards, etc.) as standalone files but NEVER imported or rendered them on any page. The components were "built" but invisible to users — pure dead code.

When creating a new component:
1. **CREATING** the file is NOT enough. You MUST also import and render it on the target page.
2. After building each component, immediately `grep -rn "ComponentName" app/ components/` to verify it's imported somewhere.
3. If a component is conditionally rendered (e.g., floating button), it still MUST be imported and placed in the JSX tree with its condition.
4. At the END of each phase, run: `grep -rn "from.*discovery" app/ components/ | grep -c import` and compare against the number of files in the feature directory. If there are more files than imports → you have dead code.

```bash
# Verify no orphan components:
for f in components/discovery/*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(grep -rn "$name" app/ components/ --include="*.tsx" | grep -v "^$f" | wc -l)
  [ "$count" -eq 0 ] && echo "⚠️ DEAD CODE: $f is never imported"
done
```

**This rule applies to ALL new features, not just Discovery.**

### Rule 27: PAGES MUST NOT DUPLICATE ROOT LAYOUT ELEMENTS

> **CONTEXT**: On 2026-03-20, the Discovery page rendered its own `<Header />` and `<BottomNav />` on top of the ones already rendered by `app/[locale]/layout.tsx`. This caused a duplicate navigation bar, and the page-level Header had no `locale` prop, producing `/undefined/coiffeur` links.

**The root layout (`app/[locale]/layout.tsx`) already renders:**
- `<Header locale={locale} />`
- `<BottomNav />`
- `<CookieBanner />`
- `<PWAInstallPrompt />`

**Rules:**
1. **NEVER** import or render `Header`, `BottomNav`, `CookieBanner`, or `PWAInstallPrompt` inside any page component under `app/[locale]/`. They are already there.
2. Page components should render ONLY their content (e.g., `<main>...</main>`), not layout wrappers.
3. If a page needs to opt OUT of the header (like dashboard pages), use the existing `isHidden` check in `Header.tsx` — don't add/remove Header instances.

```typescript
// ❌ WRONG — page duplicates layout elements
export default function SomePage() {
  return (
    <>
      <Header />        {/* DUPLICATE — already in layout.tsx */}
      <main>...</main>
      <BottomNav />      {/* DUPLICATE — already in layout.tsx */}
    </>
  );
}

// ✅ CORRECT — page renders only its content
export default function SomePage() {
  return (
    <main className="min-h-screen ...">
      {/* page content only */}
    </main>
  );
}
```

### Rule 28: EVERY TYPE REFERENCED MUST EXIST IN `lib/types.ts`

> **CONTEXT**: On 2026-03-20, Claude Code created 15+ files referencing `DiscoveryItem`, `DiscoveryCategory`, `DiscoveryGender` from `@/lib/types`, but never added those types to the file. Every component had import errors. The types were silently missing across the entire feature.

**Rules:**
1. Before writing `import type { Foo } from "@/lib/types"` in ANY file, verify `Foo` is actually exported from `lib/types.ts`.
2. If introducing a new type for a feature, define it in `lib/types.ts` FIRST (Phase 0 / infrastructure), then import it in later phases.
3. After creating all files for a feature, verify: `npx tsc --noEmit 2>&1 | grep "has no exported member" | head -10` — must return 0 results.
4. Type definitions should match the database schema exactly (column names, nullable fields, array types).

```bash
# Verify all type imports resolve:
npx tsc --noEmit 2>&1 | grep "has no exported member"
# Must return 0 results.
```


### Rule 29: POST-EXECUTION SMOKE TEST (MANDATORY)

> **CONTEXT**: On 2026-03-20, a 10-phase feature was "completed" but: the feed API returned 500 (table didn't exist), the admin page 404'd (middleware blocked it), types were missing (never defined), navigation showed wrong language (locale not passed), and 4 components were never imported anywhere. None of this was caught because there was no smoke test phase.

**After completing ALL phases of any feature roadmap, you MUST perform a smoke test:**

1. **Build passes**: `npm run build` with 0 errors
2. **Type check passes**: `npx tsc --noEmit` with 0 errors  
3. **No dead components**: Every new `.tsx` file is imported at least once
4. **No missing types**: No `has no exported member` errors
5. **No duplicate layout elements**: New pages don't import Header/BottomNav
6. **Feature flag exists**: If using `checkFeatureEnabled("x")`, verify `x` is in `feature_flags` table
7. **Middleware updated**: If creating admin-only pages, verify path is in `adminOnlyPaths` in `middleware.ts`
8. **Translations exist**: If using `t("key")`, verify key exists in ALL 4 locale files (de/en/fr/it)
9. **Migrations noted**: If SQL migrations are required, add a prominent `⚠️ RUN MIGRATION FIRST` section at the top of the roadmap

**A feature is NOT complete until all 9 checks pass.**

### Rule 30: PREMIUM DESIGN ENFORCEMENT (MANDATORY)

> **CONTEXT**: A design audit on 2026-03-23 found ~125 violations of the premium design system. Generic Tailwind classes were used instead of design tokens, breaking Apple-level consistency.

**Before writing ANY UI code, you MUST follow `UI_RULES.md` §19 (Premium Design Enforcement Rules):**

1. **8-Point Grid**: ALL spacing must be 8px multiples. NEVER use `gap-5`, `p-5`, `gap-7`, `p-7`, `gap-9`
2. **Design Token Shadows**: NEVER use `shadow-sm/md/lg/xl/2xl`. ALWAYS use `shadow-card`, `shadow-warm-sm/md/lg`, `shadow-warm-float`, `shadow-glass`
3. **Design Token Radii**: NEVER use `rounded-lg/xl/2xl/3xl/full`. ALWAYS use `rounded-card`, `rounded-button`, `rounded-pill`, `rounded-blob-*`
4. **Design Token Colors**: NEVER use raw Tailwind colors (`yellow-400`, `emerald-500`, `green-300`, `purple-300`, `rose-300`, `blue-200`). ALWAYS use `s-*` tokens.
5. **60-30-10 Color Rule**: 60% neutral base, 30% card surfaces, 10% accent colors
6. **Cheap vs Premium Matrix**: Check every new component against the audit matrix in `UI_RULES.md` §19e

```bash
# Quick premium audit — run before every push:
grep -Ern "shadow-sm[^a]|shadow-md|shadow-lg[^a]|shadow-xl|shadow-2xl|rounded-lg[^a]|rounded-xl|rounded-2xl|rounded-3xl|rounded-full|bg-yellow-|bg-emerald-|bg-green-|bg-purple-|bg-rose-|bg-blue-[0-3]|gap-5|gap-7|gap-9" components/ app/ --include="*.tsx" | grep -v "shadow-warm\|shadow-card\|shadow-glass\|shadow-coral\|rounded-card\|rounded-button\|rounded-pill\|rounded-blob\|s-dm\|//\|node_modules" | head -10
# Must return 0 results.
```
