# Solen.ch — Concepts

> A single-page gathering of every concept that makes up Solen.ch. Sourced from `CLAUDE.md`, `_docs/category-system-map.md`, `SOLEN_HANDOFF.md`, and the codebase structure. This document is a concept index — not a how-to. For implementation rules see `_rules/`, for architecture see `_docs/category-system-map.md`.

---

## 1. Product Concept

**Solen.ch** is a beauty & wellness booking platform for the Basel area (Switzerland). It is a two-sided marketplace:

- **Customers** discover salons, browse services, and book appointments.
- **Salon owners** register their business, manage bookings, and publish last-minute offers.

**Design vision**: Fresha × Airbnb hybrid — Airbnb's discovery UX married to Fresha's booking efficiency. Swiss, premium, authentic — not a vibe-coded AI product.

**Supported locales**: German (default), English, French, Italian.

---

## 2. Technology Concept

| Layer | Technology |
|---|---|
| Framework | Next.js App Router + React |
| Styling | Tailwind CSS + CSS variables (V5 design tokens) |
| Language | TypeScript |
| DB / Auth / Storage | Supabase (Postgres, Google OAuth, Email magic link, Storage) |
| Payments | Stripe (Payment Intents, Connect, Webhooks, SetupIntents) |
| Rate Limiting | Upstash Redis via `@upstash/ratelimit` |
| Validation | Zod schemas in `lib/validations.ts` |
| Search | pgvector (Supabase extension) for AI service matching |
| AI | Gemini 2.0 Flash (intake/discovery), fal.ai (nail art generation) |
| Analytics | PostHog (client + server) |
| i18n | next-intl (4 locales) |
| PWA | manifest.json + Service Worker |
| Deployment | Vercel (auto from `main`) |

---

## 3. Architectural Concepts

### 3.1 Layout
- **Homepage**: `app/[locale]/page.tsx` → `<HomePage />` (100% Next.js — no iframe, no monolith).
- **Pages**: `app/[locale]/*/page.tsx`.
- **API**: Next.js Route Handlers at `app/api/*/route.ts`.
- **Shared components**: `components/` (barrel `components/index.ts`).
- **Domain libs**: `lib/`, with category-specific code under `lib/{category}/`.

### 3.2 Zones (UI intent model)
| Zone | Meaning | Glass | Motion |
|---|---|---|---|
| 1 | Hero / discovery | Floating UI only | V5 stagger reveals |
| 2 | Category sections | Dropdowns only | Card hover lift |
| 3 | Booking / functional | None | None |
| 4 | Dashboard | None | Minimal |

### 3.3 Multi-Agent Coordination
Several AI agents (Dev 1, Dev 2, Dev 3, bug-agent, infra-agent) work concurrently. Coordination via `.agent-lock.json` and `.agent-comms.md`.

---

## 4. Design System Concept (V5 — Fresha × Airbnb Overhaul)

### 4.1 Colors (design tokens only)
- **Primary**: Terracotta Coral `#E8624A` (`s-coral`)
- **Accents**: Amber `#D4870A` (`s-amber`), Basel Blue `#6BA3C8` (`s-blue`)
- **Text**: Warm Ink `#1A1209` (`s-ink`)
- **Extended**: Yellow, Plum, Sage, Sand
- **Backgrounds**: Cream `#FAF6EF`, White, Sunken `#EDE5D8`
- **Dark mode**: Warm dark (`#151009`) — never pure black/cool grey

### 4.2 Typography
- **Bebas Neue** (display ≥40px)
- **Syne** (headings)
- **DM Sans** (body + data with `tabular-nums`)

### 4.3 Radii, Shadows, Glass
- **Radii**: `rounded-card` 16px, `rounded-card-lg` 20px, `rounded-pill`, `rounded-btn` 99px, `rounded-input` 12px
- **Shadows**: `shadow-elevation-1/2/3`, `shadow-v5-card`, `shadow-v5-float`, `shadow-coral-glow`
- **Glass**: `.glass-frost`, `.glass-search`, `.glass-toolbar`, `.glass-pill` — floating UI only; cards stay solid (`.card-v4`)
- **Blobs are retired**: replaced by `.ambient-v5` gradients

### 4.4 Motion Philosophy
- Easing: `cubic-bezier(0.23, 1, 0.32, 1)`
- 60ms stagger between grid children
- All UI animations ≤300ms; elements enter from `scale(0.95+)` not `scale(0)`
- `prefers-reduced-motion` respected globally
- Springs only for icon micro-animations and heart bounce

### 4.5 Anti-Slop Rules (always in effect)
1. Elements never enter from nothing.
2. `ease-out` for entering UI — never `transition-all`.
3. UI interactions under 300ms.
4. Every pressable element has `active:scale-*` feedback.
5. Every new component declares a design intent before code.

---

## 5. Category System Concept

Solen runs 6 verticals on a shared base. Category code is **additive**, never a fork.

| Category | Icon | Color | Status |
|---|---|---|---|
| Coiffeur | Scissors | Coral | Live |
| Barbershop | Scissors | Coral | Live |
| Nails | Sparkles | Blue | Live |
| Spa & Wellness | Leaf | Sage | Planned |
| Makeup | Palette | Amber | Planned |
| Waxing | Zap | Yellow | Planned |

### Shared Base (all categories inherit)
- Booking engine (`bookings`, `availability_slots`, `services`, `service_addons`, `staff_members`)
- Payments & commerce (Stripe Connect, gift cards, tips, packages, walk-in SMS)
- Staff system (invites, schedules, permissions, portfolio)
- Client CRM (notes, tags, photos, intake forms, favorites, loyalty, referrals)
- Communications (SMS reminders, email templates, DM chat)
- Analytics & marketing (revenue, heatmap, staff comparison, off-peak)
- Discovery platform (`/discover`)
- Smart search (pgvector embeddings + date availability)

### Extension Points (per category)
Intake questionnaires, service templates, client preferences tables, design/visit history tables, discovery filters, portfolio metadata, booking flow steps, resource/station tables, tier pricing, automated reminders, dashboard tabs.

### Naming Conventions
- Libs: `lib/{category}/`
- Components: `components/{category}/` and `components/dashboard/{category}/`
- Tables: `{category}_*` prefix (e.g., `nail_design_history`, `barber_walkin_queue`)

---

## 6. Feature Concepts (60 features)

### 6.1 Discovery & Booking
1. **Discovery & Booking** — salon cards + multi-step booking wizard (multi-service, add-ons, guest checkout).
2. **Last Minute Offers** — salons expose canceled slots with category/price filters.
3. **Recently Viewed** — last 5 salons from localStorage (Homepage + Profile).
4. **Favorites & Retention** — heart button, "Wieder buchen?" widget, top-rated auto-badge.
5. **Smart Search** — date-aware + pgvector embeddings + category pills; homepage 3-part bar + subpage FilterBar.
6. **Admin Homepage Section Toggle** — `platform_settings.homepage_sections`.

### 6.2 Authentication & Identity
7. **Authentication** — Supabase (Google OAuth + Email magic link).
8. **Guest Booking** — email-only checkout, profile auto-created on confirm.
9. **Staff Accounts** — invite onboarding, role-limited STAFF_NAV, service mapping, break/time-off.

### 6.3 Commerce
10. **Prepaid Booking** — Stripe Connect, configurable platform fee, hold-and-release, card-on-file via SetupIntents.
11. **Walk-in Mode** — SMS-based payment links via seven.io with HMAC-signed tokens.
12. **Service Packages** — multi-session punch cards with bonus sessions.
13. **Digital Gift Cards** — per-salon, custom amounts, email delivery, code redemption.
14. **Tip System** — post-service tipping via tokenized tip pages (preset + custom, Stripe PaymentIntents).
15. **Group Bookings** — shared `group_booking_id` via atomic multi-slot RPC.

### 6.4 Communications
16. **Direct Messaging** — in-app chat with media, price offers, dispute resolution.
17. **SMS Reminders** — 24h/1h cron via seven.io, per-salon config.
18. **Review Prompts** — daily cron, 24h after completed bookings via Resend.
19. **Chat Intelligence** — quick-reply templates, Gemini AI replies, photo-based price quoting, chat gallery tab.

### 6.5 CRM & Salon Tools
20. **Client Notes (CRM)** — permanent/booking notes for clients.
21. **Client CRM Tags** — color-coded tags (allergy/preference/note), red allergy warnings on booking cards.
22. **Client CRM** — color formulas, 5 intake consultation types, before/after photos, Gemini intake recommendations.
23. **Review Replies** — public or private replies from salon owners.
24. **Off-Peak Discounts** — salon-configured discounted hours per weekday.
25. **Dashboard Calendar** — weekly grid, staff colors, slot modal, reschedule, day blocking.
26. **Review Photos** — customer photo upload to `review-photos` bucket.
27. **Visual Editor** — admin-only element selector at `/dashboard/editor` → Claude API generates R1-R10 roadmaps.

### 6.6 Platform
28. **Loyalty System** — stamp cards with per-salon rewards.
29. **Referral Program** — auto-generated codes, WhatsApp/SMS/copy, CHF 10 per referral.
30. **Advanced Analytics** — booking heatmap, staff comparison, acquisition tracking, revenue commission, gift card + tip summaries.
31. **Help Center** — public articles with admin CMS + search.
32. **Dark Mode** — system/manual toggle via `ThemeToggle`.
33. **Internationalization** — de/en/fr/it via next-intl.
34. **Multi-Location Chains** — `salon_groups`, `/brand/[slug]`, "Teil von [Brand]" badges.
35. **PWA Install Prompt** — shown after first booking (iOS manual / Chrome `beforeinstallprompt`).
36. **Accessibility** — global focus-visible rings, aria-labels, semantic nav roles.

### 6.7 Discovery Platform
37. **Discovery Platform** — Pinterest-style masonry at `/discover`. Photo/TikTok cards, filters (category/gender/texture), infinite scroll, likes/saves/comments, Gemini-powered AI descriptions, Unsplash/Pexels/Pixabay import, TikTok oEmbed, admin content studio, user/salon posting with auto-flagging, recommendation algorithm, staff portfolio browsing, booking bridge.

### 6.8 Nails Vertical
38. **Nail Tech Portfolio** — masonry portfolio, filters (style/shape/material), tier badges, public `/nail-tech/[id]`.
39. **Nail Design History** — per-client timeline with materials, shapes, colors, repeat action.
40. **Nail Inspo System** — drag-drop + camera upload, curated boards, multi-select in booking.
41. **Nail Material/Shape/Length Selector** — 10 SVG shapes, length bars, 7 material types.
42. **Nail Station Management** — station count, UV lamp tracking, sterilization buffer, utilization bar.
43. **Nail Tier Pricing** — junior/senior/master pricing + dynamic rules.
44. **Nail Infill Reminders** — per-service reminder cycle via email/SMS cron.
45. **Nail Discovery Feed** — Pinterest-style masonry at `/discover?category=nails`.
46. **Nail Dynamic Pricing** — rule-based modifiers (peak/off-peak/weekend/last-minute/loyalty) + weekly heatmap.
47. **Nail Retail POS** — in-salon product sales (RetailManager + RetailCheckout with Stripe).
48. **Nail AI Art Generator** — admin-only fal.ai generation, Redis monthly budget tracker.
49. **Nail Allergy System** — severity levels, warning banners, alert emails to salon.

### 6.9 Barbershop Vertical
50. **Walk-in Queue** — Supabase Realtime queue, remote join, status transitions, 30s public wait-time polling.
51. **Express Rebook** — 2-tap flow using last cut specs + next available slot.
52. **Cut History Timeline** — chronological cut records (fade, top, guard, beard, lineup) with repeat action.
53. **Barber Profiles** — public `/salon/[slug]/barber/[barberSlug]` with portfolio grid.
54. **Barber Smart Reminders** — visit-cycle detection via `barber_cut_history`, dashboard due-clients view.
55. **Barber Loyalty Cards** — HMAC-signed QR stamp cards, configurable programs, `/loyalty/stamp` one-tap verify.
56. **Barber Leaderboard** — staff performance table (bookings, revenue, retention, tip, conversion, utilization) + anonymize mode.
57. **Chair Management** — configurable chair count + buffer minutes, affects slot capacity.
58. **Walk-in Analytics** — walk-in vs appointment ratio, wait times, conversion, abandonment, chair utilization.
59. **Barber Discovery Signals** — fade type, style, hair texture scoring.
60. **Barber Roster** — "Unsere Barber" grid on barbershop-category salon pages.

---

## 7. Data Concept

Core tables (full list in `_rules/DB_SCHEMA.md`):

- **Users / Salons**: `profiles`, `salons`, `salon_groups`, `staff_members`, `staff_invites`, `staff_services`, `staff_schedules`, `staff_portfolio_images`
- **Booking**: `bookings`, `availability_slots`, `services`, `service_addons`, `off_peak_slots`
- **Commerce**: `gift_cards`, `tips`, `service_packages`, `platform_settings`
- **CRM**: `client_notes`, `client_tags`, `client_photos`, `intake_forms`, `client_formulas`, `favorites`
- **Communications**: messages, attachments, price offers
- **Discovery**: `discovery_items`, `discovery_likes`, `discovery_saves`, `discovery_comments`
- **Search**: `search_embeddings` (pgvector)
- **Category-scoped**: `nail_*`, `barber_*`, `hair_*`

Row-Level Security (RLS) is mandatory on every table that takes user submissions.

---

## 8. Safety & Security Concepts

- **Rate limiting**, **RLS policies**, **feature flags** (kill switches), **audit logging**, **Zod payload validation** on every API route (see `_rules/SECURITY_RULES.md`).
- **Code Safety Rules (12 rules)**: verify imports/routes exist before use, one commit per sub-phase, build-before-commit, follow roadmaps literally, never rebuild from scratch, preview env checks, API response consistency, single design system.
- **Error handling**: never `.catch(() => {})` — always `console.error("[Component] ...")`.
- **Git hygiene**: verify branch before editing, never skip hooks, always push after commit.

---

## 9. Workflow Concepts

- **Figma-first UI workflow** — design in Figma → screenshot → approve → implement → validate.
- **Homepage tight-loop protocol** — one visible change at a time, screenshot every 3–4 changes, target `.superpowers/brainstorm/.../homepage-vision.html`.
- **Terminal autonomy** — standard dev commands run without asking; only force-push / reset --hard / DB deletes / `.env.local` need confirmation.
- **Task lifecycle** — `_tasks/` roadmaps; done ones archived in `_tasks/completed/`; incomplete features logged in `_tasks/INCOMPLETE_FEATURES.md`.
- **Lessons learned** — append-only log at `_rules/LESSONS_LEARNED.md`.
- **Vercel verification** — after every push, confirm the latest deployment is Ready and serving the right commit.

---

## 10. Established Patterns

- **Coming Soon pages** — `app/[locale]/coming-soon/page.tsx` via `middleware.ts` `COMING_SOON_ROUTES` + `?feature=…` cue.
- **Auth guard on profile fetches** — check `r.ok`, redirect to login, log errors.
- **Page transition crossfade** — `PageTransitionWrapper` (200ms opacity via Framer `AnimatePresence`).
- **Account deletion** — 30-day GDPR/nFADP soft delete, explicit confirmation text, cron hard-deletes after grace period.
- **Modal-based settings actions** — destructive profile actions live in dedicated modal components.
- **Feature hiding via flags** — use `lib/feature-flags.ts`, never delete working code to "hide" it.

---

## 11. Routing Concepts

- **Single discovery page** — `/[locale]/discover`; categories switched via `?category=` only.
- **Locale-aware routing** — `<Link>` from `next-intl/navigation`; never raw `/de/...` hrefs.
- **Router refresh for cookie-driven prefs** — call `router.refresh()` alongside `router.push()` when language/theme change so Server Components rebuild.
- **Styled, locale-aware 404** — zone-compliant `not-found.tsx`.

---

## 12. AI Concepts

- **Gemini 2.0 Flash** — intake-form recommendations, discovery AI descriptions, explainable "Warum?" recommendations (strictly grounded in user context — no hallucinations), AI chat replies.
- **fal.ai** — nail art image generation (admin-only, Redis budget).
- **pgvector embeddings** — smart search over services.
- **Localization rule** — every LLM prompt receives the current locale; output maps to translation keys, never hardcoded copy.

---

## 13. Terminology Glossary

| Term | Meaning |
|---|---|
| **Zone 1–4** | UI intent bands (Hero → Dashboard) that govern glass/motion allowance |
| **V5** | Current design system iteration (Fresha × Airbnb) |
| **Glass** | Frosted `backdrop-blur` surfaces reserved for floating UI |
| **.ambient-v5** | Warm radial gradient background replacing the retired blobs |
| **Tight loop** | One-change-at-a-time homepage polish protocol with screenshot checkpoints |
| **Extension point** | Where a category plugs additive logic into the shared base |
| **Orphan** | Component that exists but isn't imported anywhere — banned by Rule 41 |
| **Staging component** | Component not yet wired to a page, kept in `components/_staging/` |
| **Anti-slop** | Five interaction rules separating polished UI from AI generic output |

---

## 14. Source Files for Deeper Reading

| Topic | File |
|---|---|
| Master config + all rules | `CLAUDE.md` |
| Category architecture | `_docs/category-system-map.md` |
| DB schema | `_rules/DB_SCHEMA.md` |
| UI tokens & banned patterns | `_rules/UI_RULES.md` |
| API security stack | `_rules/SECURITY_RULES.md` |
| Roadmap standards | `_rules/ROADMAP_RULES.md` |
| Real-bug log | `_rules/LESSONS_LEARNED.md` |
| Asset generation | `_rules/GENERATION_TOOLS.md` |
| Search behaviour | `_rules/search-bar-rules.md` |
| Premium-polish vision | `SOLEN_HANDOFF.md` |
| Incomplete features registry | `_tasks/INCOMPLETE_FEATURES.md` |
| Homepage visual tracker | `_tasks/homepage-visual-tracker.md` |
