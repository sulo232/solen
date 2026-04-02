# Solen.ch — Project Configuration & Multi-Agent Protocol

> **Every AI agent (Claude Code, Cursor, Gemini, etc.) MUST read this file in full before making any changes.**

---

## 🚨 LESSONS LEARNED — READ AND MAINTAIN (MANDATORY)

**File: `_rules/LESSONS_LEARNED.md`**

This file contains a living log of every real bug, footgun, and non-obvious pattern discovered in this codebase. It is updated by every agent, every session.

**You MUST:**
1. **READ** `_rules/LESSONS_LEARNED.md` before starting any task — it will save you from repeating past mistakes
2. **APPEND** a new entry to `_rules/LESSONS_LEARNED.md` whenever you:
   - Cause a bug and fix it
   - Discover a surprising behavior (DB, CSS, Next.js, Supabase, i18n)
   - Fix a bug someone else caused
   - Notice a pattern that tripped up a previous agent
3. Use the exact format defined at the top of that file
4. Never delete existing entries — only append

**This is not optional.** If you break something and don't document it, the next agent will break it again.

---

## ⚡ TERMINAL COMMAND AUTONOMY (READ THIS FIRST)

**Execute all standard development commands IMMEDIATELY without asking for permission.**

- ✅ **DO immediately**: npm/npx commands, git operations (status/add/commit/push/diff/log), tsc checks, builds, file operations
- ❌ **ONLY ask before**: force push, reset --hard, deleting DB data, modifying .env.local

**Default behavior**: Execute → Report results. **NEVER** write "Should I run...?" or "May I execute...?" — just do it.

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
│   └── api/            # API Routes
│       ├── analytics/platform/route.ts # System-wide analytics (category counts)
│       ├── analytics/referrals/route.ts # Referral statistics for dashboard
│       ├── bookings/waitlist/route.ts   # Waitlist submission endpoint
│       ├── metrics/global/route.ts # Global platform metrics (cached 24h)
│       ├── partner/leads/route.ts  # B2B Partner lead capture endpoint
│       ├── referral/route.ts       # Profile page referral stats endpoint
│       ├── salons/trending/route.ts     # Dynamic trending salons endpoint
│       ├── search/detect-category/route.ts # AI Search category detection endpoint
│       └── salon/services/route.ts      # Salon services API
├── components/         # Shared React components (Dev 2 owns, Dev 3 imports)
│   ├── index.ts        # Barrel exports — Dev 3 depends on this
│   ├── dashboard/      # Dev 3's dashboard-specific components
│   │   └── nail/       # Nail CRM dashboard components (StationManager, RetailManager, etc.)
│   ├── nail/           # Nail category UI components (booking flow, portfolio, discovery)
│   ├── editor/         # Visual Editor (admin-only)
│   ├── layout/         # Header, Footer, BottomNav
│   └── ui/             # Shared UI primitives (Skeleton, SearchBar, ExpandableTabs, FilterBar, etc.)
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
│   ├── profile/        # Profile page subcomponents (ProfileHero, BeautyProfileCard, SalonHighlights, ProfileTabs, LooksGrid, BeautyProfileEditModal)
│   ├── barber/         # Barber category UI components (queue, rebook, loyalty, profiles)
│   └── dashboard/barber/ # Barber dashboard components (leaderboard, chairs, reminders, analytics)
├── public/             # Static assets
├── supabase/           # Migrations + Edge Functions (Dev 1 owns)
├── messages/           # i18n translation files
├── .env.local          # Environment variables (DO NOT COMMIT)
└── vercel.json         # Vercel deployment config
```

### 3.3 Design System (V5 — Fresha × Airbnb Overhaul)

> **Active Roadmap**: `V5_DESIGN_ROADMAP.md` in project root. Read it before making any UI changes.

#### Colors (unchanged — keep ALL brand colors)
- **Primary**: Terracotta Coral `#E8624A` (class: `s-coral`)
- **Accents**: Amber `#D4870A` (`s-amber`), Basel Blue `#6BA3C8` (`s-blue`)
- **Text**: Warm Ink `#1A1209` (`s-ink`)
- **Extended**: Yellow `#F2C144` (`s-yellow`), Plum `#4A1E3C` (`s-plum`), Sage `#7BA688` (`s-sage`), Sand `#C9A96E` (`s-sand`). Each has `DEFAULT`, `hover`, `subtle`, `text` variants.
- **Backgrounds**: Cream `#FAF6EF` (base), White `#FFFFFF` (cards/raised), `#EDE5D8` (sunken inputs)
- **Dark mode**: Warm dark base `#151009` (`s-dm-bg`), surface `#1E1710` (`s-dm-surface`), text `#F5EEE4` (`s-dm-text`). NEVER use cool grey or pure black.

#### Typography (unchanged)
- **Fonts**: Bebas Neue (display ≥40px), Syne (heading), DM Sans (body + data with `tabular-nums`)

#### V5 Radii (from `tailwind.config.js`)
| Token | Value | Usage |
|---|---|---|
| `rounded-card` | 16px | Salon cards, listing cards, content blocks |
| `rounded-card-lg` | 20px | Hero cards, feature cards, modals |
| `rounded-panel` | 16px | Inner panels within a card, review cards |
| `rounded-search` | 99px | Search bar outer container (fully rounded) |
| `rounded-pill` | 9999px | Availability pills, tags, nav pill |
| `rounded-btn` | 99px | CTA buttons, action buttons |
| `rounded-input` | 12px | Form inputs, dashboard cards |

#### V5 Shadows (Airbnb-inspired elevation)
| Token | Usage |
|---|---|
| `shadow-elevation-1` | Cards at rest, subtle UI |
| `shadow-elevation-2` | Active dropdowns, focused cards |
| `shadow-elevation-3` | Card hover, floating elements |
| `shadow-v5-card` | V5 layered card shadow (rest) |
| `shadow-v5-card-hover` | V5 card on hover |
| `shadow-v5-float` | Modals, search dropdown, floating overlays |
| `shadow-coral-glow` | Coral CTA glow |

#### V5 Glass System — Intentional, Not Universal
> **Rule**: Glass = floating UI **only** (header on scroll, search dropdown, modals, pills, CTAs in Zone 1+2). Cards = solid white. NEVER glass on content listing cards.

| Class | Where | What |
|---|---|---|
| `.glass-frost` | Header pill (scrolled), modals, dropdown overlays, bottom tab bar | `backdrop-blur(20px) saturate(1.4)`, `rgba(255,255,255,0.72)` |
| `.glass-search` | Search input container (always visible, not just hover) | `backdrop-blur(16px) saturate(1.3)`, coral focus ring |
| `.glass-toolbar` | Sticky filter bar below header | `backdrop-blur(16px) saturate(1.2)`, subtle bottom border |
| `.glass-pill` | **NEW** — interactive filter pills + cancel/tag buttons in Zone 1+2 | `backdrop-blur(12px)`, `rgba(255,255,255,0.55)`, `border rgba(26,18,9,0.08)` |
| `.card-v4` | Salon cards, listing cards | **Solid white** `#ffffff`, 16px radius, layered shadow, CSS hover lift |

- **Blobs are RETIRED**: No `<BlobBackground>`, no `.blob-interactive`, no decorative blob shapes.
- **Ambient background**: `.ambient-v5` — subtle warm radial gradients replacing blobs.

#### V5 Card Hover Pattern
```css
.card-v4:hover {
  box-shadow: 0 4px 12px rgba(26,18,9,.06), 0 16px 40px rgba(26,18,9,.08);
  transform: translateY(-4px);
}
```
- Easing: `cubic-bezier(0.23, 1, 0.32, 1)` — 400ms
- Image zoom: `.img-hover-zoom` → `scale(1.03)` over 500ms
- Tap feedback: Implemented via `active:scale-[0.98]` for tactile, native-app interaction feeling. (See `docs/superpowers/specs/2026-03-30-airbnb-micro-interactions.md`)

#### V5 Motion Philosophy
- **Easing**: Custom `cubic-bezier(0.23, 1, 0.32, 1)` for all card/reveal transitions
- **Stagger**: 60ms between children on grid + category row reveal (Airbnb-style load animation)
- **Section headings**: Slide-in from bottom, 0.5s, `cubic-bezier(0.23, 1, 0.32, 1)`
- **NO springs/bounce in layout transitions** — buttery deceleration only
- **Springs ALLOWED ONLY for**: category icon micro-animations, heart bounce on favorite, avatar pop. Use `stiffness: 400, damping: 25` max.
- **Page-load category animation**: When homepage first loads, category row items animate in from `y: 20, opacity: 0` with 60ms stagger (Airbnb pattern)
- **Icon hover/idle animation**: Category icons play 1-cycle animation on hover (desktop) and on page-load stagger (all devices)
- **prefers-reduced-motion**: MANDATORY global disable

#### Animation Pattern Reference (Phase 3.2 — Micro-Animations & A11y)

**Grid Stagger Animation** (Phase 1):
- Use `containerVariants` + `itemVariants` from `lib/animations.ts` (already exported).
- `staggerChildren: 0.06` (60ms per UI_RULES.md §4).
- Applied to: `CategoryPage.tsx`, `HomePage.tsx` salon grids.
- Zone 1+2 only. ZERO animation in Zone 3/4.

**Tab Sliding Underline** (Phase 2):
- Use framer-motion `layoutId="unique-name"` on `motion.div` for the indicator bar.
- Transition: `{ type: "tween", duration: 0.25, ease: [0.4, 0, 0.2, 1] }`.
- Applied to: `SalonTabBar.tsx`.
- Replace static `border-b-2` with animated `motion.div`.

**Toast Slide-In** (Phase 3):
- Already implemented: `Toast.tsx` uses `toastVariants` from `lib/animations.ts`.
- `initial: { opacity: 0, y: 10 }` → `animate: { opacity: 1, y: 0 }` (300ms max).
- Exit: `{ opacity: 0, y: -6, duration: 0.18 }`.
- Wrap in `<AnimatePresence mode="popLayout">`.

**ReviewBreakdown Bar Fill** (Phase 4):
- Use `useInView` hook from framer-motion with `once: true, margin: "-50px"`.
- Animate bars from `width: 0` to `width: ${percentage}%` on scroll-into-view.
- Duration: 0.6s, stagger: `index * 0.08` (80ms between bars).
- Applied to: `ReviewBreakdown.tsx` rating bars.

**EmptyState Zone-Aware Animation** (Phase 5):
- Accept `zone?: 1 | 2 | 3 | 4` prop (defaults to 1).
- If `zone <= 2`: wrap content in `motion.div` with `initial={{ opacity: 0, scale: 0.97 }}` → `animate={{ opacity: 1, scale: 1 }}` (250ms).
- If `zone > 2`: render static `<div>` (no animation).
- Applied to: `EmptyState.tsx`.

**Search Autocomplete Dropdown** (Phase 6):
- Wrap dropdown in `<AnimatePresence>` with `motion.div`.
- Transition: `initial={{ opacity: 0, y: -8 }}` → `animate={{ opacity: 1, y: 0 }}` (150ms, V5 easing).
- Applied to: `SearchAutocomplete.tsx` suggestions dropdown.

**Skip-to-Content Link** (Phase 7):
- Already implemented in `app/[locale]/layout.tsx`.
- Uses `sr-only focus:not-sr-only` to hide/show on focus.
- WCAG 2.1 AA requirement for keyboard navigation.

**ARIA Live Regions** (Phase 8):
- `<div aria-live="polite" aria-atomic="true">` for dynamic content changes.
- Applied to: `BookingCalendar.tsx` (slot count), `SearchAutocomplete.tsx` (result count), `ReviewForm.tsx` (star radiogroup).
- Star rating uses `role="radiogroup"` + `role="radio"` + `aria-checked`.

#### Component Standards
- **Icons**: `lucide-react` for ALL icons. No emoji icons.
- **Loading**: Use `<Skeleton variant="card" />` for full-page loading. Skeletons MUST have pixel-perfect dimensional parity (exact aspect ratios and border radii) with their populated counterparts to prevent CLS. (See `docs/superpowers/specs/2026-03-30-airbnb-skeleton-loaders.md`)
- **Image Ratios**: Strictly enforce `aspect-[20/19]` on mobile and `md:aspect-square` on desktop for all image cards. No arbitrary heights. (See `docs/superpowers/specs/2026-03-30-airbnb-image-aspect-ratio.md`)
- **Pagination**: Image carousels on cards must use scroll-snap with native pagination dots indicating the current index. (See `docs/superpowers/specs/2026-03-30-airbnb-pagination-dots.md`)
- **CTAs**: Use `<InteractiveHoverButton>` for all primary CTA buttons.
- **Mobile nav**: **V5 UPDATED** — Mobile uses a **frosted-glass bottom tab bar** with max 4 tabs (Discover, Search, Saved, Account). The hamburger menu is **deprecated on mobile**. Desktop keeps the top pill nav. The bottom tab bar is a NEW component: `components/layout/BottomTabBar.tsx`.
- **Empty states**: Use `<EmptyState>` with optional `illustration` prop.
- **Social proof**: `<SocialProofStrip>` between hero and content. `<TrustBadges>` in footer.
- **Dashboard sidebar**: Animated `<Sidebar>` from `sidebar.tsx` — collapses to 60px icons, expands on hover.
- **Date picker**: `<SolenDatePicker>` from `date-picker.tsx` — react-aria-components calendar with coral theme.
- **Filter System**: `<FilterBar>` + `<ScrollableFilterRow>` — zone-aware filter pills. Glass-frost when unselected, coral fill when active. Companion: `<FilterBottomSheet>` (mobile), `<FilterDrawer>` (desktop). Always pair with `<SearchAutocomplete>` in a sticky container.
- **Profile Page**: 6 subcomponents in `components/profile/`. Zone 3 (no glass). Avatar with gradient ring, beauty profile card, salon highlights, 4-tab system.
- **Beauty Icons**: Custom SVG icon library in `components/ui/beauty-icons.tsx` — 20+ icons for hair/nail/skin/style. NOT lucide.
- **Search Criteria Chips**: `<SearchCriteriaChips>` in `components/search/SearchCriteriaChips.tsx` — reads URL params (`category`, `q`, `date`, `time`) and renders removable pill chips. Used in `SplitView.tsx` and `CategoryPage.tsx` above `FilterBar`. Zone 3 only (no glass, no animations).
- **Inline Calendar**: `<SolenDatePicker inline>` renders an inline calendar without popover. Used inside the GuidedSearch bottom sheet (Step 3 / Wann). The `inline` prop skips the `<Popover>` and renders the `<Calendar>` directly.
- **CategoryStickyRow**: `<CategoryStickyRow>` in `components/layout/CategoryStickyRow.tsx` — Airbnb-style category icon row that appears in the header when the homepage category grid scrolls out of view. Listens for `CustomEvent("categoryGridVisibility")` dispatched by `HomePage.tsx` IntersectionObserver. On category pages (`/coiffeur`, `/nails`, etc.) it's always visible. Zone 1 only (glass + animation allowed).

### 3.4 Design System (Legacy — ARCHIVED, DO NOT USE)

> ⚠️ The old monolith design (wine-red `#9B1D30`, gold, DM Serif Display) is **retired**. It lives in `_archive/monolith-v1.html` for reference only. **ALL new code must use the Next.js design system (Section 3.3).**

### 3.5 Key Features

> **V5 HOMEPAGE HERO**: The homepage hero uses a **cinematic warm gradient background** (cream → coral blush → plum shadow) — NOT a flat white background. The search bar is ALWAYS visible as a floating glass pill (not hidden until hover). A photo/video background may be swapped in later once licensed assets are available.

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

### Rule 1b: THIRD-PARTY FALLBACKS (MANDATORY)
> **INCIDENT**: The Mapbox MapView broke production when the API key was missing or connection failed, leaving a blank gap.
- **ALWAYS** implement generic text/link fallback UI states for third-party widgets (e.g., Maps, Video players) in case of missing API keys, rate limits, or network failures. Never let a missing API token cause a blank screen or crash.

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

## 11a. 🚨 ERROR HANDLING RULES (MANDATORY)

- **NEVER** use `.catch(() => {})` — always log with `console.error("[ComponentName] description:", err)`
- For fire-and-forget calls (analytics, tracking, welcome emails): log silently with `console.error`
- For user-facing fetches (data loading): log + show error state
- For auth flows: log + redirect to login
- For payment flows: log + show user-visible error with retry option

```tsx
// ✅ CORRECT
.catch((err) => console.error("[DashboardBookings] Failed to load bookings:", err))

// ❌ BANNED — silent catch swallows errors forever
.catch(() => {})
```

---

## 11. 🔒 SECURITY RULES (MANDATORY — ALL API ROUTES)

> ➡️ **Moved to `_rules/SECURITY_RULES.md`**
> This codebase requires strict enforcement of Rate Limiting, Supabase RLS policies, feature flags, audit logging, and payload validation (Zod). All API routes must implement this middleware-like stack.
> Read `_rules/SECURITY_RULES.md` before making ANY route/API modification.

### Rule 12b: MANDATORY RLS INSERTS
> **INCIDENT**: Users couldn't submit new reviews because the RLS INSERT policy was missing on the table itself, even though the API route was authenticated.
- **ALWAYS** configure RLS `INSERT` policies when creating new tables that take user submissions (e.g., reviews).
- If building UI that displays averages (like rating), **always** establish a minimum data threshold (e.g. 5+ reviews) before calculating/displaying the average to avoid statistical insignificance pointing out 5-star ratings with 1 review.

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

### Rule 15: EMPTY STATES ALWAYS USE `<EmptyState>`

> **CONTEXT**: On 2026-03-25, an audit found raw oversized emojis used as empty states ("Noch keine Salons 🥲"), which violates the UI_RULES ban on functional emojis and looks unpolished.

**Rules:**
1. **NEVER** build custom empty states with raw text and emojis.
2. **ALWAYS** use the `<EmptyState>` component with an appropriate `illustration` or standard Lucide icon.
3. Empty state messaging must be human, empathetic, and professional (no giant smiley faces).

---

## 12. 📋 ROADMAP CREATION STANDARDS (MANDATORY FOR ALL ROADMAPS)

> ➡️ **Moved to `_rules/ROADMAP_RULES.md`**
> Every AI execution roadmap must contain specific sections (Breakage risks, code examples, Verification steps, etc.). Read `_rules/ROADMAP_RULES.md` before generating roadmaps.

---

## 13. 🎨 DESIGN TOKEN CONSISTENCY RULES (MANDATORY)

> ➡️ **Moved to `_rules/UI_RULES.md`**
> All legacy Tailwind color tokens (like `text-dark`, `bg-black`, standard shapes) are strictly banned. Everything related to visual frontend modifications must strictly obey the design tokens architecture (e.g., `s-ink`, `rounded-card`, `rounded-blob-a`).
> **Before writing ANY UI code, you MUST check `_rules/UI_RULES.md`.** It acts as the single source of truth for all frontend consistency logic.

---

## 14. 🗺️ ROUTING RULES (MANDATORY)

### Rule 32: ONE DISCOVERY PAGE — NO PARALLEL CATEGORY ROUTES

> **INCIDENT**: `/discover/nails` existed as a separate page with its own layout, fragmenting navigation. Users switching categories had to fully leave the page, breaking the editorial flow of the discovery experience.

- The discovery experience MUST live at a single route: `/[locale]/discover`.
- **NEVER** create `/[locale]/discover/[category-name]` as an independent page with its own layout.
- Category separation is handled via `?category=VALUE` query params + in-place tab switching via `CategoryTabBar.tsx`.
- If a category needs special content sections, extend `discover/page.tsx` WITHIN the same page — do not create a new route.
- Adding a new beauty vertical? Add a tab to `DISCOVERY_CATEGORIES` in `components/discovery/CategoryTabBar.tsx` — NOT a new route.
- Old category-specific discovery routes MUST redirect using `permanentRedirect()` → `/discover?category=X`.

```bash
# Verify no parallel category discovery routes exist:
ls app/[locale]/discover/
# Expected: page.tsx, error.tsx, [id]/ only.
# Any other named subdirectory (nails/, hair/, makeup/, etc.) = Rule 32 violation.
```

### Rule 33: ROUTER REFRESH FOR COOKIE PREFERENCES
> **INCIDENT**: The language toggle only pushed the URL but did not trigger server-side re-renders, leaving the user with mixed languages.
- When updating structural user preferences stored in cookies (like language or theme) that affect Server Components, you MUST call `router.refresh()` alongside `router.push(newPath)` to force Next.js to reconstruct the server UI with the new context.

---

## 15. 🌍 INTERNATIONALISATION (I18N) STANDARDS (MANDATORY)

> **CONTEXT**: On 2026-03-25, an audit revealed that 90% of the UI remained in German when switching to English, internal links reverted to `/de/`, and layouts broke because German words are longer than English words. These rules prevent i18n regressions.

### Rule 33: NO HARDCODED STRINGS IN UI
- **NEVER** hardcode user-facing text (e.g., `Startseite`, `Buchen`).
- **ALWAYS** use `next-intl`'s `useTranslations()` or `getTranslations()`.
- Untranslated strings should fail the build or trigger a linter warning.
- Ensure the Cookie Banner, 404 pages, and all Layout components use translation contexts.

### Rule 34: LOCALE-AWARE ROUTING ONLY
- **NEVER** construct URLs manually with hardcoded locales (e.g., `<a href="/de/partner">`).
- **ALWAYS** use the `<Link>` component from the `next-intl/navigation` routing configuration.
- **NEVER** use standard `next/link` or generic `<a>` tags for internal navigation.

### Rule 35: FLUID LAYOUTS FOR TEXT CONTAINERS
- **NEVER** use fixed-width text containers (e.g., `w-48`, `w-64`) that assume English or German word lengths.
- **ALWAYS** use padding (`p-4`, `px-6`) and allow containers to size fluidly, up to a `max-w-*`.
- **Reasoning**: German copy is typically 30% longer than English and features extensive compound words. Fixed widths clip translations.

### Rule 36: STYLED LOCALE-AWARE 404 PAGES
- The `not-found.tsx` component MUST adhere to the **Zone 1** or **Zone 3** rules in `UI_RULES.md`.
### Rule 37: FEATURE PROMPT COPY MUST BE TRANSLATED
- When a feature request includes specific German copy (e.g., "Teile deine Präferenzen"), **NEVER** hardcode it into the component.
- **ALWAYS** treat it as a placeholder for a translation key and add it to the `messages/de.json`, `en.json`, `fr.json`, and `it.json` files.
- Feature roadmaps must explicitly include a step to add these translation keys.

### Rule 38: FEATURE HIDING VIA FEATURE FLAGS
- When a feature (like a category or a popup) needs to be "removed for now" but the backend remains, **ALWAYS** use `lib/feature-flags.ts` (or equivalent boolean toggles) instead of deleting the code.
- This ensures the UI can be safely hidden without destroying the underlying infrastructure.

### Rule 38b: DASHBOARD AND ADMIN I18N
- Everything in `components/dashboard/` MUST be translated. Even if it is an "internal" admin tool or configuration component, we support multi-lingual salon owners and staff.
- Admin metrics, configuration labels, table headers, and placeholders must use `useTranslations("namespace")` and use translation keys rather than hardcoded German text.

### Rule 39: AI-GENERATED CONTENT LOCALIZATION & GROUNDING
- **Localization:** Whenever using Gemini or other LLMs to generate user-facing copy (e.g., AI recommendations, descriptions), you **MUST** pass the current `locale` to the prompt so the output matches the UI language. Do not assume German. Hardcoded copy (e.g., "✦ Für dich") generated by the AI must map to valid `next-intl` translation keys (`t('for-you')`) or be explicitly generated in the user's language.
- **Grounding (No Hallucinations):** For explainable AI features ("Warum?"), the LLM must be strictly prompted to *only* use provided user context (e.g., booking history) to generate reasons. Never allow the LLM to invent past interactions.

---

## 16. 🏗️ STRUCTURAL CONSISTENCY RULES (MANDATORY)

> **CONTEXT**: On 2026-03-25, a deep audit found 7 orphaned components never rendered anywhere, 3 features with backend APIs but no complete UI flow, 40+ files using a banned hover token, and a critical naming collision between an old and new `FilterBar.tsx`. These rules prevent structural chaos from recurring.

### Rule 40: FEATURE COMPLETENESS CHECKLIST (MANDATORY FOR ALL NEW FEATURES)

> **INCIDENT**: Gift Cards, Loyalty, Referral, and Salon Comparison all had backend APIs built but incomplete frontend flows. `WaitlistModal.tsx` was built but never rendered on any page. `WeatherBanner.tsx` existed with no page importing it.

Every new feature MUST have ALL of these layers completed before being considered "done". If any layer is missing, add the feature to `_tasks/INCOMPLETE_FEATURES.md`.

**Checklist — every feature needs:**

| Layer | What | Example |
|---|---|---|
| ① **Types** | Interface/type in `lib/types.ts` | `CustomerPreferences`, `PricingRule` |
| ② **DB** | Migration in `supabase/migrations/` | `add_customer_preferences.sql` |
| ③ **API** | Route(s) in `app/api/` | `app/api/preferences/route.ts` |
| ④ **Component** | UI in `components/` | `PreferencesForm.tsx` |
| ⑤ **Page** | Rendered in `app/[locale]/` | `app/[locale]/profile/preferences/page.tsx` |
| ⑥ **i18n** | Keys in ALL 4 locale files | `messages/{de,en,fr,it}.json` |
| ⑦ **Import** | Component imported + rendered in a page | `import PreferencesForm from "@/components/..."` |
| ⑧ **Navigation** | Entry point exists (link/button to reach the page) | Nav link, settings button, CTA on profile |

```bash
# Verification — find orphaned components (imported nowhere):
for f in components/*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(grep -rn "$name" app/ components/ --include="*.tsx" | grep -v "$name.tsx" | wc -l)
  if [ "$count" -eq 0 ]; then echo "⚠️ ORPHANED: $f"; fi
done
```

**If you build a component but its page/route isn't ready yet:**
1. Do NOT leave it in `components/` silently
2. Add it to `_tasks/INCOMPLETE_FEATURES.md` with a note: "Component built, page pending"
3. Move it to `components/_staging/` until it's wired

### Rule 41: COMPONENT LIFECYCLE — NO ORPHANS

> **INCIDENT**: 7 components (`CompareBar`, `CompareDrawer`, `WeatherBanner`, `WaitlistModal`, `TutorialTour`, `RecommendedSalons`, `QuartierTile`) existed for months without being imported by any page.

**Rules:**
1. **NEVER** create a component without simultaneously creating or modifying the page that renders it.
2. If a component must be created ahead of its page (infrastructure work), place it in `components/_staging/` — NOT in the main `components/` directory.
3. When removing a component's page or render, also move the component to `components/_archive/` and remove it from `components/index.ts`.
4. **Barrel exports** in `components/index.ts`: only include components that are actively imported by at least one page. Dead exports bloat the barrel.

```bash
# Post-push verification — no orphaned components:
grep -rn "export.*from" components/index.ts | while read line; do
  comp=$(echo "$line" | grep -oP '"\./\K[^"]+')
  hits=$(grep -rn "$comp" app/ --include="*.tsx" | wc -l)
  if [ "$hits" -eq 0 ]; then echo "⚠️ Exported but unused: $comp"; fi
done
```

### Rule 42: SUB-SITE / FEATURE PAGE TEMPLATE (MANDATORY STRUCTURE)

> **INCIDENT**: Different features used wildly different structures — some had API routes but no page, some had pages but no navigation entry point, some had components with hardcoded German.

When building a **new feature page** (e.g., `/profile/referral`, `/loyalty/stamp`, `/salon/[slug]/gift-card`), follow this exact structure:

```
Feature: [Name]
├── app/[locale]/[feature]/page.tsx          ← Server Component (data fetching)
│   └── imports FeatureClient.tsx            ← Client Component (interactivity)  
├── components/[feature]/FeatureClient.tsx   ← "use client", uses useTranslations()
├── app/api/[feature]/route.ts              ← API route with Zod validation
├── lib/types.ts                            ← Types/interfaces (append, don't replace)
├── messages/de.json                        ← German translation keys
├── messages/en.json                        ← English translation keys
├── messages/fr.json                        ← French translation keys
├── messages/it.json                        ← Italian translation keys
└── supabase/migrations/XXX_[feature].sql   ← DB migration (if new table/column)
```

**Mandatory rules for every new page:**
- Page component MUST determine its **zone** (1-4) and pass it to child components as `zone` prop
- All user-facing text MUST use `useTranslations()` — zero hardcoded strings
- All interactive elements MUST have `aria-label` props
- Navigation entry point (link/button) MUST exist to reach the page — no hidden pages
- API routes MUST use Zod validation (`lib/validations.ts`)

### Rule 43: INTERACTION STANDARD — HOVER, ACTIVE, FOCUS (SINGLE SOURCE OF TRUTH)

> **INCIDENT**: Cards used 5 different hover patterns (`hover:-translate-y-1`, `hover:-translate-y-[5px]`, `hover:scale-[1.03]`, `hover:opacity-80`, none). Buttons used `hover:bg-s-coral/90` everywhere (banned) instead of `hover:brightness-[1.06]`.

**Cards (SalonCard, CategoryTile, any clickable card):**
```tsx
className="hover:-translate-y-[5px] hover:shadow-[0_6px_20px_rgba(26,18,9,0.12)] transition-all duration-[250ms]"
// NEVER: hover:scale-*, hover:opacity-*, hover:-translate-y-1, shadow-md
```

**Primary CTA Buttons (coral background):**
```tsx
className="bg-s-coral text-white hover:brightness-[1.06] active:scale-[0.98] transition-all"
// NEVER: hover:bg-s-coral/90, hover:bg-s-coral-hover, hover:opacity-*
```

**Secondary/Ghost Buttons:**
```tsx
className="border border-s-ink/10 text-s-ink/70 hover:border-s-coral/40 hover:text-s-coral active:scale-[0.98] transition-all"
```

**Text Links ("Alle ansehen →"):**
```tsx
className="text-s-ink/60 hover:text-s-coral transition-colors duration-150"
```

**Category/Filter Pills:**
```tsx
// Active: bg-s-coral text-white + coral glow shadow
// Inactive: bg-s-ink/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09]
// NEVER: hover:brightness on pills (only on solid CTA buttons)
```

**Images inside cards:**
```tsx
className="object-cover transition-transform duration-500"
// NEVER: group-hover:scale-[1.03], group-hover:scale-[1.04]
// Card elevation handles the hover feedback — image doesn't need its own
```

```bash
# Verify no banned hover patterns:
grep -rn "hover:bg-s-coral/90\|hover:scale-\[1\.\|hover:opacity-\|hover:-translate-y-1[^[]" \
  components/ app/ --include="*.tsx"
# Expected: 0 results
```

### Rule 44: NAMING COLLISION PREVENTION

> **INCIDENT**: `components/FilterBar.tsx` (287 lines, old) existed when a roadmap tried to create a NEW `components/ui/FilterBar.tsx`. Import ambiguity and barrel export conflicts followed.

**Rules:**
1. Before creating a new component, **ALWAYS search** for an existing component with the same name:
   ```bash
   find components/ -name "YourComponentName*" -type f
   grep -rn "YourComponentName" components/index.ts
   ```
2. If a component with the same name exists:
   - If it's **legacy/non-compliant** → rename it first (`LegacyFilterBar.tsx` or `SearchFilterBar.tsx`) and update all imports BEFORE creating the new one
   - If it's **active and working** → extend it instead of creating a duplicate (Rule 8: NEVER REBUILD)
3. **File naming**: Component names must be unique across ALL of `components/` (including subdirectories). Two files named `FilterBar.tsx` in different directories is a violation.
4. **Barrel exports**: `components/index.ts` must have ZERO duplicate export names. Run:
   ```bash
   grep "export" components/index.ts | awk '{print $NF}' | sort | uniq -d
   # Expected: 0 results
   ```

### Rule 45: INCOMPLETE FEATURES DOCUMENTATION

> **INCIDENT**: Gift Cards, Loyalty, Referral, Comparison, Weather, and Waitlist all had backend code built but no one documented what was done vs. what was missing.

**Rules:**
1. `_tasks/INCOMPLETE_FEATURES.md` is the **mandatory registry** for any feature that has been partially built.
2. When you build an API route without a complete UI flow → add it to this file immediately.
3. When you build a component that isn't rendered yet → add it to this file immediately.
4. Format:
   ```markdown
   ## [Feature Name]
   - **Backend**: [what exists — API routes, DB tables]
   - **Frontend**: [what exists — components, pages]
   - **Missing**: [specific gaps — "no checkout integration", "no navigation entry point"]
   - **Priority**: [HIGH/MEDIUM/LOW]
   ```
5. Before starting a NEW roadmap for a feature, **ALWAYS check `_tasks/INCOMPLETE_FEATURES.md` first** to avoid rebuilding what already exists.
6. When a feature becomes complete (all 8 layers from Rule 40 done), remove it from this file and add a `[x] Completed` note.

### Rule 46: NEW COMPONENT / SUB-SITE CREATION STANDARD (MANDATORY)

> **INCIDENT**: On 2026-03-26, a scan found ~145 components without `useTranslations()`, 45+ hardcoded white `rgba(255,255,255,...)` glass backgrounds that broke dark mode, and inconsistent hover/interaction patterns. This rule ensures every new component or page is born compliant.

**EVERY new `.tsx` component file MUST satisfy ALL of these requirements before committing. No exceptions.**

#### A. Internationalization (i18n) — ALL 4 LANGUAGES
```tsx
// 1. Import and use translations — NEVER hardcode text
import { useTranslations } from 'next-intl'; // Client Components
import { getTranslations } from 'next-intl/server'; // Server Components

const t = useTranslations('myNamespace');

// 2. Every visible string MUST be a translation call:
<h2>{t('sectionTitle')}</h2>           // ✅
<button aria-label={t('book')}>{t('bookNow')}</button>  // ✅
<h2>Beliebte in Basel</h2>             // ❌ BANNED

// 3. Add keys to ALL 4 locale files:
// messages/de.json, messages/en.json, messages/fr.json, messages/it.json
// Provide ACTUAL translations — not empty strings or German copies.
```

#### B. Dark Mode Support — USE CSS VARS FOR GLASS
```tsx
// ✅ DO — works in both light and dark mode:
style={{ background: "var(--glass-bg)", backdropFilter: "blur(24px)",
         border: "1px solid var(--glass-border)" }}

// ❌ DON'T — white glass breaks dark mode:
style={{ background: "rgba(255,255,255,.82)" }}

// Text colors — use design tokens with dark: variants:
className="text-s-ink dark:text-s-dm-text"         // ✅
className="bg-[--raised] dark:bg-s-dm-surface"     // ✅
className="text-black"                              // ❌ BANNED
className="bg-white"                                // ❌ use bg-[--raised] or bg-[--base]
```

#### C. Zone Compliance — DECLARE AND ENFORCE
```tsx
// Every component that renders visible UI must know its zone:
interface MyComponentProps {
  zone: 1 | 2 | 3 | 4;  // Receive from parent page
}

// Zone 1 (Hero/Discovery): Glass-frost on floating UI only, .ambient-v5 gradients, V5 stagger reveals
// Zone 2 (Category sections): Glass-frost on dropdowns only, card hover lift
// Zone 3 (Booking/Functional): NO glass, NO animations, clean and fast
// Zone 4 (Dashboard): Minimal, data-first

// Animation tokens per zone (V5):
const motionClass = (zone <= 2)
  ? 'transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]'
  : 'transition-none';
```

#### D. UI Rules Compliance — READ BEFORE WRITING
1. **Read `_rules/UI_RULES.md`** before writing ANY styling
2. Colors: ONLY use `s-coral`, `s-amber`, `s-blue`, `s-ink`, `s-plum`, `s-sage`, `s-sand`, `s-yellow` — NEVER raw hex or Tailwind defaults
3. Fonts: `font-display` (Bebas Neue ≥40px), `font-heading` (Syne), `font-body` (DM Sans)
4. Radii: `rounded-card` (16px), `rounded-card-lg` (20px), `rounded-pill` (9999px), `rounded-btn` (99px), `rounded-input` (12px)
5. Shadows: `shadow-elevation-1` (rest), `shadow-elevation-3` (hover), `shadow-v5-card`, `shadow-v5-float` — NEVER generic `shadow-md`
6. Glass: `.glass-frost` for floating UI ONLY, `.card-v4` for content cards — NEVER glass on listing cards
7. Icons: `lucide-react` ONLY — no emoji icons, no heroicons, no fontawesome

#### E. Interaction Standard — V5 COPY EXACTLY
```tsx
// Cards (V5 — use .card-v4 class or these utilities):
className="hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(26,18,9,.06),0_16px_40px_rgba(26,18,9,.08)] transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]"

// CTA Buttons:
className="bg-s-coral text-white hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] duration-150"

// BANNED interactions:
// transition-all, hover:bg-s-coral/90, hover:scale-[1.03], hover:opacity-80, shadow-md, duration-500+
```

#### F. Accessibility
```tsx
// Every interactive element needs:
<button aria-label={t('bookNow')} />
<input aria-label={t('searchPlaceholder')} />

// Focus visible rings (already global — don't override)
// Semantic HTML: use <nav>, <main>, <section>, <article>, <aside>
```

#### G. Pre-Commit Checklist

Before committing ANY new component, verify ALL of these:

```
□ Uses useTranslations() — ZERO hardcoded strings
□ Keys added to de.json, en.json, fr.json, it.json (all 4)
□ Translations are ACTUAL (not empty strings or German copies)
□ Has zone prop or inherits zone from parent
□ No rgba(255,255,255,...) inline styles — uses var(--glass-*) tokens
□ text-s-ink dark:text-s-dm-text on text elements
□ bg-[--raised] or bg-[--base] — never raw bg-white
□ Hover states follow Rule 43 exactly
□ Only lucide-react icons — no emoji, no other icon libraries
□ interactive elements have aria-label={t('...')}
□ No banned tokens (see UI_RULES.md §20)
□ npm run build passes
□ Component is actually imported + rendered by a page (Rule 41)
```

**If you cannot satisfy all items** (e.g., page isn't ready yet), move the component to `components/_staging/` and log it in `_tasks/INCOMPLETE_FEATURES.md`.

```bash
# Quick verification script after creating a new component:
FILE="components/MyNewComponent.tsx"
echo "=== Checking $FILE ==="
grep -c "useTranslations\|getTranslations" "$FILE"     # Must be ≥ 1
grep -c "rgba(255,255,255" "$FILE"                      # Must be 0
grep -c "text-black\|bg-white[^/]" "$FILE"              # Must be 0
grep -c "hover:bg-s-coral/90\|hover:scale-\[" "$FILE"   # Must be 0
grep -c "aria-label" "$FILE"                             # Must be ≥ 1
echo "=== Done ==="
```

### Rule 47: HOMEPAGE UI/UX OVERHAUL SPEC (V5) STRICT ENFORCEMENT

> **CONTEXT**: The Solen.ch homepage (`components/HomePage.tsx`) underwent a major redesign to adhere strictly to V5.

1. **Aesthetics:** Page background is Warm Beige (`#F5F0EB`). NO shadows on cards (use simple 1px borders). ALL interactive elements must be pill shapes (`rounded-pill` / `rounded-btn`). Blobs are RETIRED, use `.ambient-v5` gradients only.
2. **Hero:** Has a solid `#F5F0EB` background (no images/fade-ups). Features a horizontal scroll-snap featured salon carousel. Header is strictly Bebas Neue 42px.
3. **Header/Navigation:** Max height `56px`. Background is `#F5F0EB` glass frost. The header morphs its content: when the hero search bar is out of view, the header shows a compact Search Pill. `CategoryStickyRow` inside the header is deleted. `Zurück` button must never render on `/`.
4. **Icons:** Category SVG icons must render perfectly solid in Coral (`#E8735A`) without any opacity layers.
5. **Footer:** Background is strictly `#2C2825`. Leftover trust pills are removed. Instagram natively inside legal links.
6. **Mobile Tab Bar:** Background `#FFFFFF` glass frost, 1px top border (no shadow), active states Coral (`#E8735A`), `z-index: 50`.

---

## 16. 🔄 ESTABLISHED PATTERNS (MANDATORY)

### Pattern A: Coming Soon Page
`app/[locale]/coming-soon/page.tsx` is the standard template for features that exist in the codebase but are not yet ready for production.
- New features that aren't complete should redirect here via `middleware.ts` using the `COMING_SOON_ROUTES` array.
- Add `?feature=featureName` to the redirect URL so the page shows the correct icon, color, and description.
- Email capture POSTs to `/api/coming-soon-notify` (does NOT require auth — best-effort capture).

### Pattern B: Auth Guard on Profile Fetches
Always check `r.ok` BEFORE calling `r.json()` on any `/api/profile` fetch. Never `.catch(() => {})` silently on auth flows.

```tsx
// ✅ CORRECT — redirect immediately, log errors
fetch("/api/profile")
  .then((r) => {
    if (!r.ok) {
      if (!cancelled) router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
      return null;
    }
    return r.json();
  })
  .then((p) => { if (cancelled || !p) return; /* use p */ })
  .catch((err) => {
    console.error("[PageName] Auth fetch error:", err);
    if (!cancelled) router.push(`/${locale}/auth/login`);
  });

// ❌ WRONG — swallows errors silently
fetch("/api/profile")
  .then((r) => r.json())  // crashes on 401 HTML response
  .catch(() => {});        // hides the failure
```
