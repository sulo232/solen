# 🎨 Solen.ch UI/UX Polish & Feature Roadmap (v2) — Final

> **⚠️ CAUTION FOR CLAUDE CODE ⚠️**
> - **Architecture:** Vanilla JS monolith (`index.html`) + Next.js App Router (`app/`). Do NOT break the monolith.
> - **Performance:** Each phase = one Claude Code prompt. Do not combine phases.
> - **Light Mode Only.** Match homepage colorways. No dark mode.
> - **No Glowing Effects.** Clean glassmorphism only (iPhone widget style).
> - **Before starting:** Read `_tasks/completed/` and `_tasks/manual-fixes-checklist.md`.

---

## 🎨 UI Decisions (User-Confirmed)

| Decision | Answer |
|---|---|
| Login layout | Centered single card, light mode, Google logo with full color |
| Salon card info | Cover photo + name + rating + category pills + location |
| Salon card hover | Lift up (subtle shadow + translateY) |
| Sort by dropdown | Yes — Airbnb-style (popular, price low→high, nearest, newest) |
| Category hero | Subtle mesh gradient background with text |
| Category page style | Airbnb/Booking.com hotel search — searchable, sortable grid |
| Booking flow (mobile) | Bottom sheet (like Airbnb) |
| Booking flow (desktop) | Sticky sidebar |
| Stats cards | Mini sparkline charts + count-up numbers |
| Last-Minute countdown | Urgency timer (time until appointment starts) |
| Payment method UI | Designer's choice — must look premium |
| Loading states | Current spinner (not skeleton cards) |
| Global nav header | Yes — consistent across all Next.js pages |
| Tab animations | Slide left/right (like pages) |
| Empty states | Simple lucide-react icon compositions + text |
| Review flow | Triple: banner on completed bookings + modal prompt + email link |
| Business register CTA | Button at registration step (customer vs salon choice) |
| Directory claiming | Via email (send 6-digit code to listed email) |
| SMS (Seven.io) | **REMOVED** — costs money |
| Calendar sync | **REMOVED** — costs money |
| Dark mode | **REMOVED** — light only |
| Tattoo category | **SKIPPED** — focus on existing 6 |
| Price increase approval | Requires login (more secure) |

---

## 📋 All 24 Pages + 36 API Routes Audited

```
app/[locale]/
├── page.tsx                     ← Homepage (iframe to monolith)
├── auth/login/page.tsx          ← REPLACE with glassmorphic card
├── auth/register/page.tsx       ← UI polish
├── checkout/page.tsx            ← UI polish + payment method UI
├── last-minute/page.tsx         ← UI polish + urgency countdown
├── barbershop/coiffeur/nails/makeup/spa/waxing → CategoryPage.tsx
├── salon/[slug]/page.tsx        ← UI polish + bottom sheet booking
├── onboarding/salon/page.tsx    ← UI polish + glass wizard
├── account/page.tsx             ← UI polish + review form + calendar button
├── account/messages/page.tsx    ← UI polish
└── dashboard/ (9 pages)         ← All need UI polish
    ├── 3 MISSING admin pages    ← BUILD: all-salons, all-users, revenue
    └── 1 MISSING page           ← BUILD: bookings/[id]/approve-increase
```

### 🔌 11 Backend Wiring Gaps (Corrected — #12 removed, trigger exists)

| # | Gap | Fix |
|---|---|---|
| 1 | No email on payment success | Add to webhook |
| 2 | No email on dispute | Add admin notification |
| 3 | No email when salon confirms booking | Add to confirm route |
| 4 | Price increase approval page missing | Build new page |
| 5 | Cancellation hardcodes `"de"` locale | Use profile.locale |
| 6 | 72h auto-release cron missing | Supabase Edge Function |
| 7 | Booking reminders never sent | Supabase Edge Function |
| 8 | No review UI for customers | Add to account bookings tab |
| 9 | No directory claiming UI | Add modal to DirectoryCard |
| 10 | Cancellation doesn't notify salon | Add salon email |
| 11 | SMS/Calendar dead code | Remove Seven.io + calendar routes |

---

## 📅 Phase 1: Design System & Reusable Components
**One prompt. Files: `components/ui/`, `lib/animations.ts`, `tailwind.config.js`**

### 1.1 Design Tokens
- [ ] Verify: teal `#4ECDC4`, coral `#FF6B6B`, dark `#1A1A2E`
- [ ] Add glass utilities to Tailwind config
- [ ] **Fonts:** Syne (headings), DM Sans (body), Space Grotesk (data) + **Instagram-style condensed/squeeze font** for playful accent text (e.g., section labels, category names, CTAs)
- [ ] Add playful typographic elements: mix font weights, use squeeze/condensed for impact headers

### 1.2 New UI Primitives
- [ ] `GlassCard.tsx` — glassmorphism container, rounded-3xl, backdrop-blur-xl
- [ ] `GlassModal.tsx` — modal with backdrop blur
- [ ] `AnimatedButton.tsx` — Framer Motion whileHover/whileTap
- [ ] `Toast.tsx` — animated success/error notification
- [ ] `EmptyState.tsx` — illustrated SVG wrapper component (takes icon + title + message)

### 1.3 Animation Presets → `lib/animations.ts`
- [ ] `containerVariants` + `itemVariants` — stagger children (200ms stagger)
- [ ] `slideSwitch` — smooth tab slide left/right (400ms ease-out)
- [ ] `exitFade` — for removed items
- [ ] All transitions: smooth & elegant (300-400ms)

### 1.4 Global Header Component
- [ ] Create `components/layout/Header.tsx` if not already shared across all pages
- [ ] Ensure it's consistent on all Next.js pages (transparent → solid on scroll with blur)

---

## 📅 Phase 2: Authentication UI Overhaul
**One prompt. Files: `auth/`, `components/auth/`**

### 2.1 Login → Centered Glassmorphic Card
- [ ] Centered single GlassCard on light background
- [ ] Google button with **full-color Google logo** (not monochrome)
- [ ] Email magic link button with mail icon
- [ ] Solen logo at top: `solen.ch`
- [ ] Auth errors via `Toast` component
- [ ] Wire to existing Supabase auth (no new backend)

### 2.2 Register → Animated Wizard
- [ ] **First screen: Customer vs Salon choice** — clear button for salon owners to register their business
- [ ] GlassCard wrappers per step
- [ ] Framer Motion `AnimatePresence` between steps
- [ ] Replace emoji icons (🧒, ♀️) with `lucide-react`
- [ ] Animated completion screen (not 🎉 emoji)

---

## 📅 Phase 3: Category Sub-sites — Airbnb-Style Discovery
**One prompt. Files: `CategoryPage.tsx`, `SalonCard.tsx`, `FilterBar.tsx`**

### 3.1 CategoryPage → Hotel Search Style
- [ ] **Subtle mesh gradient** hero section with category name
- [ ] **Sort by dropdown**: Popular, Price (low→high, high→low), Nearest, Newest
- [ ] Airbnb-style searchable grid — rounded cards, clean spacing
- [ ] Grid only — no map toggle (no map API)
- [ ] Framer Motion stagger on grid load
- [ ] Improve DirectoryCard — remove greyscale opacity, add "Mein Salon" claim button
- [ ] "Load more" with smooth animation
- [ ] Empty state: lucide-react icon + helpful text (not illustrated SVG)

### 3.2 SalonCard → Option B Layout
- [ ] Show: cover photo + name + rating + category pills + location
- [ ] **Hover: lift up** (subtle shadow increase + translateY -4px)
- [ ] Framer Motion pop-in animation
- [ ] Glass category pills

### 3.3 FilterBar → Glass Pills
- [ ] Glassmorphism on filter pills
- [ ] Smooth toggle animation

### 3.4 Last-Minute Page
- [ ] **Urgency countdown** — minutes until appointment starts
- [ ] Coral pulsing border on urgent cards (< 1 hour)
- [ ] Framer Motion exit animation when slot disappears
- [ ] Illustrated empty state

---

## 📅 Phase 4: Salon Detail + Booking Flow
**One prompt. Files: `salon/[slug]/page.tsx`**

- [ ] GlassCard sections for services, reviews, team, hours
- [ ] Replace `★` text with `Star` lucide-react icons
- [ ] Smooth photo gallery transitions
- [ ] **Desktop:** Sticky sidebar booking calendar (current behavior, polished)
- [ ] **Mobile:** Bottom sheet booking flow (like Airbnb "Check availability")
- [ ] Hover animations on service items + team cards
- [ ] Keep all data fetching intact

---

## 📅 Phase 5: Dashboard — All Pages + 3 New Admin Pages
**One prompt. Files: everything in `dashboard/`**

### 5.1 Layout + Main
- [ ] Glassmorphic sidebar polish
- [ ] Stats cards with **mini sparkline charts** + count-up animation
- [ ] Smooth nav indicator

### 5.2 All 8 Sub-Pages → GlassCard + Animations
- [ ] Bookings, Calendar, Messages, Staff, Services, Analytics, Settings (6 tabs), Approvals

### 5.3 BUILD 3 Missing Admin Pages
- [ ] `dashboard/all-salons/page.tsx` — table with all salons, status pills, search
- [ ] `dashboard/all-users/page.tsx` — table with all users, role display
- [ ] `dashboard/revenue/page.tsx` — revenue overview with mini charts

### 5.4 Bookings — Add Price Confirm UI
- [ ] "Confirm Price" button for completed bookings → calls `POST /api/stripe/confirm-price`
- [ ] Final price input + confirmation modal

---

## 📅 Phase 6: Account + Checkout + Onboarding
**One prompt. Files: `account/`, `checkout/`, `onboarding/salon/`**

### 6.1 Account
- [ ] Glass tabs, Framer Motion **slide left/right** tab switch
- [ ] GlassModal for cancel
- [ ] **NEW:** Review system (triple approach):
  - Banner on each completed booking in Bookings tab → "Leave a review"
  - Modal prompt when user visits account after a completed booking
  - Email prompt after booking is marked completed → links to review page
- [ ] **REMOVE:** SMS toggle from notifications (we're not using SMS)
- [ ] **REMOVE:** Calendar connect references

### 6.2 Checkout — Premium Payment UI
- [ ] GlassCard for summary + payment
- [ ] Replace emoji trust badges with `lucide-react` Shield icons
- [ ] Card + TWINT + Apple Pay — premium selectable UI (designer's choice)
- [ ] Framer Motion entry animation

### 6.3 Onboarding Wizard (853 lines)
- [ ] GlassCard per step, AnimatePresence transitions
- [ ] Upgraded progress indicator
- [ ] Celebratory completion animation

---

## 📅 Phase 7: Backend Wiring — Connect Loose Ends
**One prompt. Mostly API routes, minimal UI.**

### 7.1 Email Gaps
- [ ] `stripe/webhook`: Send confirmation email on `payment_intent.succeeded`
- [ ] `stripe/webhook`: Send admin email on `charge.dispute.created`
- [ ] `bookings/[id]/confirm`: Send email to customer
- [ ] `bookings/[id]/cancel`: Send email to salon owner too
- [ ] `bookings/[id]/cancel`: Use profile.locale instead of hardcoded `"de"`

### 7.2 BUILD Price Increase Approval Page
- [ ] `app/[locale]/bookings/[id]/approve-increase/page.tsx`
- [ ] Shows old vs new price, "Approve" button → `POST /api/stripe/approve-increase`
- [ ] GlassCard styling

### 7.3 Cron Jobs (Supabase Edge Functions)
- [ ] **72h auto-release:** Release deposit if price increase not approved in 72h
- [ ] **24h booking reminder:** Query upcoming bookings, send `bookingReminder()` email

### 7.4 Directory Claiming UI
- [ ] Add "Mein Salon" claim button on DirectoryCard
- [ ] Claim modal: verify ownership via 6-digit code → calls `/api/directory/[id]/claim`

### 7.5 Dead Code Cleanup
- [ ] Remove Seven.io SMS code + `SEVEN_API_KEY` from `.env.example`
- [ ] Remove calendar sync routes (gcal-auth, outlook-auth, gcal-sync, outlook-sync)
- [ ] Remove calendar env vars from `.env.example`
- [ ] Remove SMS toggle from account notifications tab

---

## 📅 Phase 8: Final QA & Polish
**One prompt. Cross-page audit.**

- [ ] Nav header: transparent → solid with blur on scroll (all pages)
- [ ] Consistent focus rings + validation states
- [ ] Mobile audit: scroll, overlaps, touch targets (44×44px)
- [ ] Framer Motion performance (`will-change: transform`)
- [ ] Cross-browser (Chrome, Safari, Firefox)
- [ ] Verify admin pages load correctly
- [ ] End-to-end flow test: booking → confirmation → review
- [ ] Verify all email templates deliver
- [ ] Verify Apple Pay domain file exists
