# 🚀 Solen Platform Roadmap

This document serves as the master blueprint for the Solen platform. It is structured to help AI agents (like Claude) and developers understand exactly what needs to be built, fixed, and implemented, categorized by priority and domain.

***Note for Developer/Claude: Code changes should go directly into `index.html` (or the relevant source components) so they go live immediately. Check if any features below are already partially implemented in the codebase; if so, complete them fully according to this spec. Discard or refactor any existing features that conflict with these guidelines.***

---

## 🎨 1. UI, Design System & Accessibility (Immediate Implementation)
These changes fix the aesthetic and establish the "Gen Z, Basel-local, human-made" vibe.

### 1.1 Design Tokens & Aesthetics
- [x] **Color Palette Implementation**: Kept existing burgundy (#9B1D30) as primary. Added secondary accent tokens: `--c-trust:#0f766e` (deep teal) and `--c-mustard:#ca8a04` (mustard yellow) for wellness/trust elements and "Neu" tags.
- [x] **Typography**: DM Serif Display (headings), DM Sans (body), JetBrains Mono (prices). Added Caveat font (`--font-accent`) for testimonial quotes. `font-variant-numeric: tabular-nums` already applied to prices.
- [x] **Imagery & Layout**:
  - **Hero**: Redesigned to asymmetrical CSS Grid split (left: lifestyle photo, right: search + tagline). Stacks on mobile.
  - **Cards**: Converted to CSS masonry layout (`columns` property). Photo 3:2 ratio. Heart/favorite icons hidden on card view (CSS: `.store-card>.store-card-photo>.fav-btn{display:none}`).
  - **Filters**: Already scrollable horizontal pill-style chips.
- [x] **Dark Mode Toggle**: Already fully implemented with localStorage + cookie persistence.
- [x] **Icons**: Replaced 🎨 emoji with SVG palette icon, ✅ with SVG check-circle. Remaining ✓/✗ are unicode text symbols (not emoji), appropriate for UI.

### 1.2 Accessibility & Microcopy
- [x] **A11y Fixes**: Focus indicators (`*:focus-visible`), skip-to-content link, modal focus trapping (already existed), form `<label>` `for` attributes fixed (~35 labels), `role="alert"` on errors, `min-height: 44px` touch targets — all verified.
- [x] **Microcopy**: Hero badge updated to "Dein nächster Lieblingsort wartet." in all 4 languages. Auth copy already informal ("Du hast schon ein Konto?"). Emojis removed from UI text.

### 1.3 Priority Bug Fixes & Mobile Polish (CRITICAL)
- [x] **Language Switcher**: Infrastructure was working. Filled missing translation keys (`cancel_booking`, `booking_cancelled`, `empty_no_reviews`, `empty_search_no_results`) across EN/FR/TR.
- [x] **Login Flow**: Was already functional (connected to Supabase auth with Google OAuth, email/password, phone auth, password reset).
- [x] **Mobile Category Pills (Wrapping Bug)**: Fixed. Added `.service-icon-card,.sic-label,.chip,.cat-pill` to `hyphens:none` CSS rule.
- [x] **Quartier Cards Layout**: Already well-designed and properly aligned. No fixes needed.
- [x] **General Mobile UI Bugs**: Audited tap targets (44px min), button styling, bottom nav padding, salon registration form. All functional.


---

## 📅 2. Booking Engine & Core Availability
The booking flow is the most critical feature. It must be robust and intuitive.

### 2.1 The Booking Flow (Route: `/book/[salonId]`)
- [x] **Convert Booking Modal to Page**: 3-step page-based flow (`#pageBook`) with `renderBPStep()`. Step 1: multi-select services with checkbox UI. Step 2: date & time picker. Step 3: confirm with notes + "First time here" checkbox.
- [x] **Staff Selection**: Staff picker with avatars + "Anyone available" option. Queries `stylist_availability` table (migration 007).
- [x] **Recurring Bookings**: Dropdown for weekly/bi-weekly/monthly intervals, count selector (2-12). Generates date array client-side and batch-inserts via Supabase.
- [x] **Last-Minute Booking Tab**: Mustard-colored chip on discovery page. Filters salons with open 30-min slots in next 2-4 hours based on `business_hours` + existing bookings.
- [x] **Cancellation Flow**: Cancel button on booking cards with confirmation dialog. Updates status to 'cancelled' (not delete). Card updates in-place.

### 2.2 Availability & Schedule Engine
- [x] **Availability Solver**: Client-side JS combining `business_hours` + `stylist_availability` + existing bookings. Greys out fully-booked dates.
- [x] **Date Selection Logic**: Disabled dates in calendar based on solver output.
- [x] **Calendar Sync**: iCal feed (`/api/calendar-feed.js`), two-way Google Calendar sync (`/api/gcal-auth.js`, `/api/gcal-sync.js`), two-way Outlook sync (`/api/outlook-auth.js`, `/api/outlook-sync.js`). OAuth2 token management in `calendar_tokens` table (migration 008).

---

## 🏪 3. Salon Dashboard & Setup
Features to make salons actually love and use the platform daily.

### 3.1 Setup Wizard (Route: `/salon/setup`)
- [x] **Simplified 4-Step Onboarding**: 4-step registration wizard (Basics → Location → Services → Review Preview). Progress saved via localStorage. Added dynamic service rows in Step 3.
- [ ] **Address Autocomplete**: Requires Google Places API or Swisstopo API key. Infrastructure ready but not connected.
- [x] **Admin Approval Loop**: New salons default to `status:'pending'`. Admin panel has approve/reject buttons. RLS prevents unapproved salons from public queries.

### 3.2 Salon Dashboard Upgrades
- [x] **Staff Management**: Weekly calendar per stylist, commission tracking (`commission_rate` on `store_staff`), service-staff assignment UI.
- [x] **Client CRM**: Secure notes per client, past visit history, allergy/preference tracking.
- [x] **Marketing Blast Tool**: Compose message → select past clients → send via `/api/send-sms.js` and `/api/send-email.js`.
- [x] **Social Media Links**: TikTok, Facebook, Instagram URL fields on salon profile.
- [x] **Analytics**: Peak hours chart, most profitable services, revenue tracking, no-show rate from bookings data.
- [x] **Inventory & SMS**: SMS reminders via Seven.io (already configured). Product inventory tracking in dashboard.
- [x] **Photo Upload**: Before/after gallery with Supabase Storage. Upload UI in dashboard, display on salon detail page (migration 004).

---

## 🔍 4. Search, Discovery & Geospatial
Making it incredibly easy for users to find what they want.

### 4.1 Advanced Search
- [x] **Visual/Portfolio Search**: Search by style/photo tags. Depends on Phase 3 photo gallery with style tags (implemented).
- [x] **Geospatial Radius Search**: Client-side radius filter slider on discovery page. PostGIS-ready architecture. "Within X km" UI with `updateRadiusFilter()`.
- [ ] **Fix Full Google Maps Integration**: Requires Google Maps JS API key. Map rendering infrastructure exists but key not configured.

### 4.2 Empty States & Navigation
- [x] **Full Page Conversions**: Booking flow converted to page-based. Key flows are page-based except auth modals.
- [x] **Smart Empty States**: Contextual prompts for empty search results, no bookings, no reviews. No "Oops!" text.
- [x] **Sticky Mobile Nav**: Dynamic bottom nav showing dashboard link for salon owners, standard nav for customers.

---

## 🛡️ 5. Trust, Reviews & Platform Integrity

### 5.1 Reviews System
- [x] **Verified Reviews Only**: Supabase RLS policy (migration 009) requires confirmed/completed booking before review insert. Google-sourced reviews bypass.
- [x] **Photo Reviews**: Photo upload with review text via Supabase Storage.
- [x] **Automated Requests**: Vercel Cron job `/api/cron-review-requests` runs daily at 10:00. Sends review request email 24h after booking completion. Marks bookings as `review_requested`.
- [x] **Review Management**: Salon owners can publicly reply to reviews. RLS policy restricts replies to salon owner only.
- [x] **Google Reviews Integration**: `/api/fetch-google-reviews.js` exists. Called on salon page load when `google_place_id` is set.
- [x] **Verified Badge**: Counts completed bookings per salon. Badge displayed at >= 10 completed bookings.

### 5.2 Quality Assurance & Security
- [x] **Active Store Check Engine**: Vercel Cron job `/api/cron-store-check` runs monthly. Checks `last_active` on stores. Sends up to 3 warning emails, then freezes store and cancels future bookings.
- [x] **Role-Based Access Control (RBAC)**: Client-side route guards + Supabase RLS. Staff cannot access owner payouts.
- [x] **Messaging & Chat**: DM system already implemented with per-booking threads, read receipts, and attachment support.

---

## 🚀 6. "Swiss & Cool Stuff" (Delighters & SEO)

### 6.1 Localization & PWA
- [x] **Multi-Language Switcher**: Full DE/EN/FR/TR support. Switcher in navbar. ~150 keys per language.
- [x] **Progressive Web App (PWA)**: Manifest, service worker with tiered caching, push notification handlers in sw.js. Client-side `subscribeToPush()` + `/api/push-subscribe.js` endpoint + migration 010. Requires VAPID_PUBLIC_KEY env var to activate.

### 6.2 AI & Integrations
- [ ] **AI Assistant**: Requires LLM API key. Vercel edge function architecture planned.
- [x] **Weather Integration**: Open-Meteo integration exists for contextual weather-based promos.
- [x] **Virtual Queue**: Walk-in queue implemented with `walk_in_queue` table, join/leave/status UI, position estimation (~15 min/person). Modal shows queue position.

### 6.3 Performance & SEO
- [x] **SEO Structured Data**: JSON-LD schema markup and canonical URL added. (Full SSR/SSG not possible with monolith architecture — would require build pipeline.)
- [x] **Performance Diet**: `loading="lazy"` on non-hero images, explicit `width`/`height` set on detail images for CLS prevention.

---

## 🚦 Next Steps for the AI Developer (Claude):
1. Review `index.html` and existing JS/CSS files.
2. Cross-reference existing functionality with this ROADMAP. 
3. If a feature partially exists, complete it. If it doesn't, build it fresh. 
4. Always prioritize **Section 1 (UI/Design)** and **Section 2 (Booking Flow)** first.
5. Push changes directly to the codebase and test on mobile views!
