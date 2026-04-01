# Solen Go-To-Market Master Task Map 🚀

> **Goal:** Take Solen from a functional codebase to a visually stunning, secure, well-populated, and actively advertised platform.

---

## 🎨 Phase 1: UI & Features (Design Polish)
*Status: 🟡 In Progress*
**Objective:** The app must look world-class. If a salon owner visits, they must instantly trust the platform because of its premium Airbnb-style aesthetic.

### 1.1 Homepage V6 Rebuild
- [ ] **Search-First Hero Area:** Ensure the main search block dominates the viewport and immediately draws the eye.
- [ ] **Category Row Polish:** Standardize the category navigation (Entdecken, Coiffeur, Nagel, Barbershop, Makeup, Waxing).
- [ ] **Featured Carousels:** Implement the new horizontal scroll carousels for premium salon discovery.
- [ ] **Skeleton Loaders:** Build exact-dimension skeleton states for the category feeds to eliminate Cumulative Layout Shift (CLS).

### 1.2 Search Flow Redesign (`GuidedSearch.tsx`)
- [ ] **3-Segment Pill:** Refactor the search bar into a sticky 3-part pill (Was · Wo · Wann).
- [ ] **Vertical Selection List:** Replace the icon grid with a clean, vertical list for selecting categories and services.
- [ ] **Bottom-Sheet Animation:** Ensure the search modal slides up smoothly on mobile like a native app (spring curve animations).

### 1.3 Airbnb-Style Salon Cards
- [ ] **Image Carousel:** Add `snap-mandatory` swiping on the salon card images with pagination dots.
- [ ] **Badges:** Overlay dynamic badges (Guest Favorite, Neu, Top Rated) perfectly positioned in the top-left.
- [ ] **Pricing Logic:** Implement the `$` / `$$` / `$$$` tier displays based on average service price.

### 1.4 Dynamic Ranking
- [ ] **LocalStorage Tracking:** Build `useRecentVisits.ts` to remember what categories/salons the user clicked.
- [ ] **Bubble-Up Logic:** Auto-sort the homepage so the user's most recently viewed category appears at the top.

> [!CAUTION]
> **Phase 1 Risks & Watch-outs:**
> 1. **Hydration Mismatches:** You cannot read `localStorage` during Server-Side Rendering (SSR). You must use `useEffect` (an `isMounted` flag) before reordering the UI, or React will crash.
> 2. **Z-Index Wars:** Adding sticky headers and bottom-sheets on mobile usually causes overlap glitches. Be very strict with z-index variables (e.g., `z-40` for headers, `z-50` for modals).

---

## 🔒 Phase 2: Security, Translations & Stability
*Status: ⚪ Pending*
**Objective:** Plug the holes. No money can be lost, no data can be corrupted, and no untranslated text can leak to users.

### 2.1 Critical Booking Safety
- [ ] **Payment Race Condition:** Fix the bug where Stripe charges the user *before* the booking is safely written to the database. (If the DB write fails, the customer loses money but gets no appointment).
- [ ] **Double Submissions:** Add a strict debounce/disable state to the "Confirm Booking" button so impatient users don't double-charge their credit card.

### 2.2 I18N (Translation) Lock-down
- [ ] **Booking Calendar:** Eradicate all hardcoded German from `BookingCalendar.tsx`. Every button, error, and status must pull from `useTranslations`.
- [ ] **Termine Page:** Translate the entire 473-line `TerminePage.tsx` so French and English users actually see their own language.

### 2.3 Data Integrity & Optimization
- [ ] **Loyalty Query Bug:** Fix the silent failure in `ProfilePage.tsx` where query selects columns that don't exist on the target table.
- [ ] **Middleware Speed:** Cache the Supabase role-check in `middleware.ts`. Right now it adds 300ms+ to every single page load on the dashboard.
- [ ] **Stripe Key Fallback:** Prevent the app from crashing silently if the Stripe Publishable Key environment variable fails to load.

---

## 🗺️ Phase 3: Market Seeding (Scraping)
*Status: ⚪ Pending*
**Objective:** Populate the platform so it doesn't look empty. Import real Basel salons so users have something to search for.

### 3.1 The Scraping Engine
- [ ] **Data Extraction:** Run Apify or a Playwright script to pull Basel salons from Google Maps (Targeting: Name, Address, Lat/Lng, Phone, Website, Opening Hours, Rating, Photos).
- [ ] **Data Sanitization:** Clean the scraped data (formatting phone numbers, mapping Maps categories to Solen categories).

### 3.2 Passive Profiles
- [ ] **Schema Extension:** Add a `source` column to the `salons` table (`scraped` vs `partner`).
- [ ] **UI Adaptation:** If a salon is `scraped`, **remove the booking button**. Replace it with text: *"This salon hasn't partnered with Solen yet."*
- [ ] **Claim Flow:** Add a "Do you own this salon? Claim it here" button that leads to the onboarding wizard.

### 3.3 SEO & Indexing
- [ ] **Dynamic Slugs:** Ensure every scraped salon gets a predictable, SEO-friendly URL (`/de/salons/hair-salon-basel-123`).
- [ ] **JSON-LD:** Inject structured local business data into the `<head>` of these pages so Google rich snippets pick them up.
- [ ] **Sitemap:** Auto-generate and submit the sitemap to Google Search Console.

> [!CAUTION]
> **Phase 3 Risks & Watch-outs:**
> 1. **Hotlinking Breakage:** Do not use Google Maps image URLs directly in the image `src`. Google rotates the keys and the images will 403 error after 24 hours. The scraper must download the images and upload them to Supabase Storage.
> 2. **False Booking Expectations:** It must be impossible for a customer to think they can book a passive profile. If they get confused, they will blame Solen.

---

## 📈 Phase 4: Partner Activation & Advertising
*Status: ⚪ Pending*
**Objective:** Turn passive profiles into paying partners, and turn on the money hose (Ad spend).

### 4.1 Partner Outreach & Onboarding
- [ ] **Direct Outreach:** Email and DM the scraped salons. Tell them their profile is already live and getting traffic, they just need to claim it.
- [ ] **Onboarding Polish:** Do a final QA pass on the salon onboarding wizard. Fixing bugs here is critical before sending paid traffic to it.
- [ ] **Profile Hijacking Prevention:** Build a verification step (e.g., verifying their business email domain) so random people can't claim a salon's profile.

### 4.2 Traffic & Growth Programs
- [ ] **B2C Customer Ads:** Launch Meta (Instagram) and Google Search ads targeting "Coiffeur Basel" and "Nails Basel".
- [ ] **Referral Loop:** Launch the "Give 10 CHF, Get 10 CHF" referral program in the user profile to incentivize word-of-mouth.

> [!CAUTION]
> **Phase 4 Risks & Watch-outs:**
> 1. **Wasted Ad Spend:** Do not run customer ads until you have at least 5-10 *highly bookable*, high-quality partners. Sending ad traffic to 'passive profiles' is throwing money in the fireplace limitation.
> 2. **Stripe KYC Churn:** Swiss Stripe Connect onboarding requires strict tax documentation. Salons that hit that step without documents will abandon the flow. Make the prerequisites very clear in the UI before they start onboarding.
