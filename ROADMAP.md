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
- [ ] **Convert Booking Modal to Page**: The booking process should be a dedicated 3-step page, not a modal. 
  - *Step 1*: Pick service(s). Allow **multi-selection** (e.g., Hair AND Nails).
  - *Step 2*: Date & Time. 
  - *Step 3*: Confirm & Notes. Add a checkbox: "First time here" OR "Already been here".
- [ ] **Staff Selection**:
  - Customer can choose a specific staff member.
  - OR "Anyone available" (no preference).
- [ ] **Recurring Bookings**:
  - Add option to book recurring appointments (e.g., "every week", "next 3 appointments").
- [ ] **Last-Minute Booking Tab**: 
  - A dedicated view/tab for "Last minute reserve now" showing immediate open slots nearby.
- [ ] **Cancellation Flow**:
  - Add an easy "Cancel Booking" button/popup for customers. 

### 2.2 Availability & Schedule Engine
- [ ] **Availability Solver**: Calculate true availability combining salon business hours, individual staff hours, closed days, and vacations.
- [ ] **Date Selection Logic**: Grey out / disable dates that are completely booked or closed.
- [ ] **Calendar Sync**: iCal feed export, plus two-way sync with Google Calendar and Microsoft Outlook so salons don't double-book.

---

## 🏪 3. Salon Dashboard & Setup
Features to make salons actually love and use the platform daily.

### 3.1 Setup Wizard (Route: `/salon/setup`)
- [ ] **Simplified 4-Step Onboarding**:
  - Basics -> Location (use Autocomplete) -> Services -> Review Preview.
  - Save progress via `localStorage`. Address bug: Mobile blank buttons on the opening times step.
- [ ] **Address Autocomplete**: 
  - Integrate Google Places API or Swisstopo. 
  - Typing an address auto-fills the postal code and city, and pins the location on a map.
- [ ] **Admin Approval Loop**: 
  - Salons DO NOT go live instantly. Admin must approve every salon request before publication.

### 3.2 Salon Dashboard Upgrades
- [ ] **Staff Management**: Calendar per stylist, commission tracking, ability to assign which staff can do which services.
- [ ] **Client CRM**: Secure notes per client (e.g., "allergic to ammonia") and past photos.
- [ ] **Marketing Blast Tool**: SMS/Email promos to past clients.
- [ ] **Social Media Links**: Allow adding TikTok, Facebook, not just Instagram.
- [ ] **Analytics**: Most profitable services, peak hours, no-show rate.
- [ ] **Inventory & SMS**: Product inventory tracking; automatic SMS reminders (via Swiss provider / Twilio).
- [ ] **Photo Upload**: Before/after gallery for salons to upload their work.

---

## 🔍 4. Search, Discovery & Geospatial
Making it incredibly easy for users to find what they want.

### 4.1 Advanced Search
- [ ] **Visual/Portfolio Search**: Users can search for specific haircuts/styles -> see salons/staff that do it well -> see specific photo posts from those salons.
- [ ] **Geospatial Radius Search**: Transition from string-based districts to true radius search (PostGIS `ST_DWithin` or similar). "Salons within X km".
- [ ] **Fix Full Google Maps Integration**: The current Google Maps integration doesn't fully work. Fix map rendering, pinning, and location fetching so the map view and address autocomplete are completely functional.

### 4.2 Empty States & Navigation
- [ ] **Full Page Conversions**: Move all modals to pages except for login/registrations/confirmations. 
- [ ] **Smart Empty States**: Friendly prompts when a search fails or no bookings exist. Do NOT use generic "Oops!" text or sad emojis.
- [ ] **Sticky Mobile Nav**: Home | Entdecken | Buchungen | Profil (Dynamic based on user role).

---

## 🛡️ 5. Trust, Reviews & Platform Integrity

### 5.1 Reviews System
- [ ] **Verified Reviews Only**: Customers can only leave a review *after* completing a booking. 
- [ ] **Photo Reviews**: Allow uploading photos with the review.
- [ ] **Automated Requests**: Auto-send email/SMS 2-24h after appointment asking for a review.
- [ ] **Review Management**: Salons can publicly reply to reviews. 
- [ ] **Google Reviews Integration**: Pull in existing Google ratings automatically for new salons.
- [ ] **Verified Badge**: Grant "Verified Salon" badge automatically after completing 10 successful platform bookings.

### 5.2 Quality Assurance & Security
- [ ] **Active Store Check Engine**: 
  - Every 6 months, an automated email goes to the salon. 
  - If no click/response: send 3 warnings over a few weeks. 
  - If still no response: Freeze the store (unbookable). Suspend existing future bookings and notify those customers.
- [ ] **Role-Based Access Control (RBAC)**: Ensure staff cannot access owner payouts. Secure routes properly.
- [ ] **Messaging & Chat**: Dedicated thread model per booking with read receipts and attachment support (for sharing inspiration pics). Add a tutorial/introduction on how to use standard platform features.

---

## 🚀 6. "Swiss & Cool Stuff" (Delighters & SEO)

### 6.1 Localization & PWA
- [ ] **Multi-Language Switcher**: Full DE / FR / EN support. Switcher in navbar.
- [ ] **Progressive Web App (PWA)**: Add manifest so users can "Add to Home Screen" like a native app. Implement Push Notifications for staff (so they don't miss bookings).

### 6.2 AI & Integrations
- [ ] **AI Assistant**: Natural language helper (e.g., "Find me a manicure under 80 CHF this week in Kleinbasel").
- [ ] **Weather Integration**: Smart promos (e.g., "Rainy day? Check out indoor spa deals").
- [ ] **Virtual Queue**: For walk-in customers to join a list remotely.

### 6.3 Performance & SEO
- [ ] **SEO Programmatic Pages**: Implement dynamic SSR/SSG pages so when a user Googles "Salon Name Basel", the Solen profile ranks #1 (like Booking.com for hotels).
- [ ] **Performance Diet**: Lazy load below-fold images, set image dimensions to prevent CLS, convert to WebP. (Target: LCP ≤ 2.5s).

---

## 🚦 Next Steps for the AI Developer (Claude):
1. Review `index.html` and existing JS/CSS files.
2. Cross-reference existing functionality with this ROADMAP. 
3. If a feature partially exists, complete it. If it doesn't, build it fresh. 
4. Always prioritize **Section 1 (UI/Design)** and **Section 2 (Booking Flow)** first.
5. Push changes directly to the codebase and test on mobile views!
