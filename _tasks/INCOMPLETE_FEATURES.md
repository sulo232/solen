# Incomplete Features

> **DO NOT DELETE THIS FILE.**
> This file tracks partially implemented features that were blocked or deferred.
> Each entry documents what was built, what's missing, and how to complete it.

---

## Voucher System (Phases 4-5 Incomplete)

**Implemented (Phases 1-3):**
- ✅ Database schema: `voucher_purchases` table, extended `promo_codes` with Stripe fields
- ✅ Backend APIs:
  - `POST /api/vouchers/create` — Creates Stripe Promotion Code + PaymentIntent
  - `POST /api/vouchers/validate` — Validates promo codes with business rules
  - `app/api/stripe/webhook/voucher-handler.ts` — Webhook handler (awaiting manual integration)
- ✅ Purchase UI: `app/[locale]/vouchers/buy/page.tsx` (Zone 3 styled, Stripe Elements)

**Missing (Phases 4-5):**

### Phase 4: Redemption Flow UI in Checkout

**What's needed:**
1. **Locate existing checkout page(s)** — Search for booking checkout implementation:
   ```bash
   grep -r "checkout" app/[locale]/ --include="*.tsx"
   ```
2. **Add promo code input UI** above Stripe PaymentElement:
   - Input field (Zone 3: `rounded-[10px]`, warm border)
   - "Einlösen" button (`rounded-pill`, `bg-s-coral`)
   - Client-side validation via `POST /api/vouchers/validate`
   - Display discounted total dynamically (use `calculateDiscountedAmount` from `lib/vouchers/validate.ts`)
3. **Pass `stripe_promotion_code_id` to PaymentIntent creation**:
   - Modify checkout's `fetch("/api/stripe/create-payment-intent")` call
   - Include `promoCodeId` in request body
   - Backend should attach promotion code to Stripe PaymentIntent

**Files to modify:**
- Existing checkout page (TBD — depends on architecture)
- Checkout API route that creates PaymentIntents

**Blocker:** Unknown checkout page structure. Requires audit of booking flow.

---

### Phase 5: Salon/Platform Voucher Split Logic

**What's needed:**
1. **Platform vouchers** (`promo_codes.salon_id IS NULL`):
   - Platform absorbs discount
   - Adjust `application_fee_amount` in Stripe Connect PaymentIntent
   - Salon receives full standard payout
2. **Salon vouchers** (`promo_codes.salon_id IS NOT NULL`):
   - Salon absorbs discount (or funds were routed to them at voucher purchase time)
   - Standard commission calculation applies

**Files to modify:**
- Booking PaymentIntent creation endpoint (e.g., `app/api/bookings/create/route.ts` or similar)
- `salon_payouts` insert logic in webhook (may need adjustment for voucher discounts)

**Blocker:** Requires understanding of existing Stripe Connect integration and commission calculation logic.

---

### Manual Integration Required: Webhook Handler

**File:** `app/api/stripe/webhook/voucher-handler.ts`

**Action:** Integrate into `app/api/stripe/webhook/route.ts` at line ~42:

```typescript
case "payment_intent.succeeded": {
  const pi = event.data.object;

  // ADD THIS:
  const { handleVoucherPurchase } = await import("./voucher-handler");
  const wasVoucherPurchase = await handleVoucherPurchase(pi);
  if (wasVoucherPurchase) break;

  // EXISTING booking payment logic below:
  const bookingId = pi.metadata?.booking_id;
  // ...
}
```

**Blocker:** File auto-modified by formatter preventing automated merge. Requires manual copy-paste.

---

### Translation Keys Required

**File:** `messages/de.json`, `en.json`, `fr.json`, `it.json`

**Keys to add (vouchers namespace):**
```json
{
  "vouchers": {
    "title": "Gutschein kaufen",
    "subtitle": "Verschenke Schönheit — perfekt für jeden Anlass",
    "discountType": "Art des Gutscheins",
    "fixedAmount": "Fester Betrag",
    "percentage": "Prozent",
    "value": "Betrag in CHF",
    "giftToggle": "Als Geschenk versenden",
    "recipientEmail": "Empfänger E-Mail",
    "createButton": "Weiter zur Zahlung",
    "payButton": "Gutschein kaufen",
    "processing": "Wird verarbeitet...",
    "codeLabel": "Dein Gutschein-Code",
    "errors": {
      "invalidAmount": "Bitte gib einen gültigen Betrag ein",
      "authRequired": "Bitte melde dich an, um einen Gutschein zu kaufen"
    }
  }
}
```

**Blocker:** Translation files locked by `ki-empfehlung-v3-agent` during execution.

---

**Next steps:**
1. User or next agent: Manually integrate webhook handler per instructions above
2. User or next agent: Add translation keys to messages/*.json
3. Next agent: Audit booking checkout flow and implement Phase 4 redemption UI
4. Next agent: Implement Phase 5 payout split logic based on existing Stripe Connect setup

**Date:** 2026-03-25
**Agent:** voucher-system-agent

---

## Gift Cards (API + Salon Page Exist, No Global Browse or Checkout Redemption)

**Implemented:**
- ✅ Database schema: `gift_cards` table with balance tracking, redemption history
- ✅ Backend APIs:
  - `POST /api/gift-cards/create` — Creates gift card with unique code (nanoid)
  - `POST /api/gift-cards/redeem` — Validates and applies balance to booking
  - `GET /api/gift-cards/balance` — Checks remaining balance
- ✅ Purchase UI: `app/[locale]/salon/[slug]/gift-card/page.tsx` (salon-specific page)
- ✅ Dashboard: Gift card management interface for salon owners

**Missing:**
1. **No global gift card browse page** — Users can only buy gift cards if they navigate to a specific salon's page first. No `/gift-cards` route with category filters.
2. **No checkout redemption flow** — Gift card codes cannot be applied during booking checkout. No input field, no balance validation UI.
3. **No gift card balance check page** — Users with codes have no standalone page to check remaining balance (`/gift-cards/check-balance`).
4. **No navigation entry point** — Gift cards are not linked from homepage, profile menu, or main navigation.

**Next Steps:**
1. Create `app/[locale]/gift-cards/page.tsx` — Browse page with category filters (by service type)
2. Add gift card code input field to booking checkout flow with real-time balance validation
3. Build `app/[locale]/gift-cards/check-balance/page.tsx` with code lookup form
4. Add navigation links: homepage "Give the Gift of Beauty" CTA, profile menu "Gift Cards" link

**Blocker:** None (fully unblocked, just needs implementation)

---

## Loyalty System (API + Pages Exist, No QR Scanning UI)

**Implemented:**
- ✅ Database schema: `loyalty_programs`, `loyalty_cards`, `loyalty_stamps` tables
- ✅ Backend APIs:
  - `POST /api/loyalty/create-program` — Creates loyalty program for salon
  - `POST /api/loyalty/verify-stamp` — HMAC-signed QR token verification
  - `GET /api/loyalty/card` — Fetches customer's stamp card
- ✅ QR token generation: `lib/barber/loyalty-qr.ts` with HMAC signatures
- ✅ Customer UI: `app/[locale]/loyalty/stamp/page.tsx` — Stamp card view with QR overlay
- ✅ Dashboard: `app/[locale]/dashboard/loyalty/page.tsx` — Loyalty program management

**Missing:**
1. **No QR scanning UI** — Salons have no in-dashboard interface to scan customer QR codes and add stamps
2. **No barber-side stamping flow** — The token verification endpoint exists but no UI calls it
3. **No customer notification** — Users don't get notified when they receive a stamp or complete a card

**Next Steps:**
1. Build salon dashboard QR scanner component using device camera API (via `react-qr-reader` or browser MediaDevices)
2. Wire scanner to `POST /api/loyalty/verify-stamp` with token validation
3. Add real-time stamp confirmation modal for both customer and salon (Supabase Realtime or polling)
4. Implement push notification or in-app alert when stamp is added (via browser Notification API or email)

**Blocker:** None (fully unblocked, just needs implementation)

---

## Referral Program (API + Profile Page Exist, No Social Sharing)

**Implemented:**
- ✅ Database schema: `referral_codes`, `referrals` tables with reward tracking
- ✅ Backend APIs:
  - `GET /api/referral/code` — Fetches user's referral code (auto-generated on first fetch)
  - `POST /api/referral/track` — Tracks referral conversions
  - `GET /api/referral/stats` — Returns referral count + earned rewards
- ✅ Profile page: `app/[locale]/profile/referral/page.tsx` — Shows user's code and referral count
- ✅ Dashboard: Salon-side referral analytics

**Missing:**
1. **No social sharing buttons** — Copy-to-clipboard works but no WhatsApp/SMS/Email share buttons
2. **No referral landing page** — No public `/referral/[code]` page to receive referrals (should store code in cookie and apply discount on first booking)
3. **No reward redemption UI** — Users earn CHF 10 per referral but cannot see or apply rewards during booking
4. **No referral discount auto-application** — Checkout flow doesn't check for referral code in cookie

**Next Steps:**
1. Add share buttons to `ReferralClient.tsx`:
   - WhatsApp: `https://wa.me/?text=...` with pre-filled message
   - SMS: `sms:?body=...`
   - Email: `mailto:?subject=...&body=...`
2. Create `app/[locale]/referral/[code]/page.tsx` — Landing page that stores code in cookie and redirects to homepage
3. Build reward balance display in profile with "Apply to Next Booking" CTA
4. Add referral discount auto-application logic to checkout flow (check cookie, validate code, apply CHF 10 discount)

**Blocker:** None (fully unblocked, just needs implementation)

---

## Salon Comparison (Components Built, No Route)

**Implemented:**
- ✅ Components:
  - `CompareBar.tsx` — Floating bottom bar showing selected salons (max 3-4)
  - `CompareDrawer.tsx` — Side-by-side comparison table component
- ✅ LocalStorage-based selection tracking

**Missing:**
1. **No `/compare` route** — Comparison components are built but never rendered on any page
2. **No "Add to Compare" buttons** — `SalonCard` doesn't have a compare action (icon button)
3. **No comparison entry point** — No navigation link or CTA leads to comparison feature (footer, profile menu, etc.)
4. **No data fetching** — Components are built but no page fetches selected salon data from Supabase

**Next Steps:**
1. Create `app/[locale]/compare/page.tsx` rendering `CompareDrawer` with selected salon data from localStorage + Supabase fetch
2. Add "Compare" icon button (scale icon from `lucide-react`) to `SalonCard.tsx` (persistent across scroll via `CompareBar`)
3. Add `/compare` link to footer under "Tools" section
4. Implement comparison limit UI (max 3 salons, show "Remove one to add more" message)

**Blocker:** None (fully unblocked, just needs implementation)

---

## Weather Suggestions (Component Built, Not Rendered)

**Implemented:**
- ✅ Component: `WeatherBanner.tsx` — Banner suggesting services based on weather (e.g., "Rainy day? Perfect for a spa treatment")
- ✅ Weather API integration placeholder (OpenWeatherMap or similar)

**Missing:**
1. **Not rendered on any page** — Component exists but no page imports it
2. **No weather data fetching** — Component structure exists but API call not wired
3. **No A/B test tracking** — No PostHog events for weather suggestion clicks
4. **No API key configuration** — `.env.local` doesn't have `OPENWEATHER_API_KEY` (or equivalent)

**Next Steps:**
1. Add `<WeatherBanner />` to homepage (`app/[locale]/page.tsx` or `components/HomePage.tsx`) below hero section (Zone 1)
2. Wire OpenWeatherMap API call in Server Component (fetch weather based on user's Basel location or IP geolocation), pass data to banner as prop
3. Add PostHog click tracking: `weather_suggestion_clicked` with `weather_condition` and `suggested_category`
4. Implement caching (24h) to avoid repeated API calls (use Next.js `fetch` cache or Redis)

**Blocker:** Requires OpenWeather API key (free tier available at https://openweathermap.org/api)

---

## Waitlist (API + Modal Exist, Modal Never Rendered)

**Implemented:**
- ✅ Database schema: `waitlist` table with salon_id, service_id, preferred_date, notification preferences
- ✅ Backend APIs:
  - `POST /api/waitlist/join` — Adds user to waitlist
  - `GET /api/waitlist/list` — Salon dashboard endpoint to view waitlist
  - `POST /api/waitlist/notify` — Sends notification to waitlist users
- ✅ Component: `WaitlistModal.tsx` — Modal allowing users to join waitlist when no slots available

**Missing:**
1. **Modal never rendered** — Component exists but no booking flow triggers it (no import, no conditional render)
2. **No salon-side waitlist dashboard tab** — Salons can't see who's on waitlist or notify them when slots open (API exists but no UI)
3. **No notification system** — Users join waitlist but never get alerted when availability changes (no email/SMS integration with Resend + seven.io)
4. **No trigger logic** — Booking flow doesn't detect `availableSlots.length === 0` and show waitlist modal

**Next Steps:**
1. Add waitlist trigger logic to booking flow:
   - When `availableSlots.length === 0`, render `<WaitlistModal isOpen={true} onClose={...} />`
   - Import modal in booking step component (likely `components/booking/DateTimeStep.tsx` or similar)
2. Build salon dashboard waitlist tab showing pending requests with "Notify Available" button
3. Implement email/SMS notification via Resend + seven.io when salon clicks notify (use templates from existing SMS reminder system)
4. Add PostHog event: `waitlist_joined` with `salon_id`, `service_id`, `preferred_date`

**Blocker:** Requires integration with Resend (email) and seven.io (SMS) — API keys already exist for reminders, just need to extend templates

---

## Tutorial Tour (Component Built, Not Rendered)

**Implemented:**
- ✅ Component: `TutorialTour.tsx` — First-time user onboarding tour (likely using `react-joyride` or similar)

**Missing:**
1. **Not rendered on any page** — Component exists but no page imports it
2. **No trigger logic** — No detection of first-time users vs returning users
3. **No completion tracking** — No way to mark tour as completed and never show again
4. **No tour steps defined** — Component may exist but steps/content not configured

**Next Steps:**
1. Add first-visit detection logic:
   - Check `localStorage.getItem('tutorial_completed')` or user profile flag
   - If not set, render `<TutorialTour />` in `HomePage.tsx`
2. Define tour steps (e.g., "Search for salons", "Book appointment", "Check favorites")
3. Add "Skip Tutorial" and "Mark Complete" actions that set `localStorage.setItem('tutorial_completed', 'true')`
4. Track completion with PostHog: `tutorial_completed`, `tutorial_skipped`

**Blocker:** None (fully unblocked, just needs implementation)

---

## i18n Phase 2 Dashboard Components (5/10 Complete)

**Completed:**
- ✅ ScheduleGrid.tsx — `dashboard.schedule` namespace
- ✅ PromoManager.tsx — `dashboard.promo` namespace
- ✅ PackageManager.tsx — `dashboard.packages` namespace
- ✅ PriceAdjustmentModal.tsx — `dashboard.pricing` namespace
- ✅ GoLiveGate.tsx — `dashboard.goLive` namespace

**Missing (components 6-10):**
- ❌ DisputeNotification.tsx — Needs `dashboard.disputes` namespace
- ❌ GiftCardManager.tsx — Needs `dashboard.giftCards` namespace
- ❌ OffPeakManager.tsx — Needs `dashboard.offPeak` namespace
- ❌ DiscoveryAdmin.tsx — Needs `discovery.admin` namespace
- ❌ ServiceCart.tsx — Needs `booking.cart` namespace

**Next Steps:**
1. Create translation namespaces for components 6-10 in messages/{de,en,fr,it}.json
2. Replace hardcoded German strings with `useTranslations()` calls
3. Test in all 4 languages (/de, /en, /fr, /it)
4. Complete Phase 3 (Tier 3 components) per roadmap

**Blocker:** None (fully unblocked, just needs completion)

**Date:** 2026-03-26
**Agent:** i18n-phase2-agent

---

---

## Salon Photo Gallery (Dashboard Upload)

- **Backend**: `salon.photos[]` column needed in DB (does not yet exist)
- **Frontend**: Photo carousel works in `SalonCard.tsx` once `photos[]` prop is populated; `photoIndex` state + dot indicators already implemented
- **Missing**: Dashboard upload UI for additional salon photos (after cover photo); DB migration to add `photos text[]` column to `salons` table
- **Priority**: MEDIUM

---

## Search Flow — Deferred Items (2026-03-30)

- **Swipe-to-close gesture** for bottom sheet — requires `@use-gesture/react`, separate task.
- **Autocomplete suggestions** in Was step while typing — requires `/api/search/suggest` endpoint, separate task.
- **Desktop popover variant** — bottom sheet is used on all screen sizes currently; a dedicated desktop dropdown experience is deferred.
- **Re-open with pre-filled context** — when landing on results page, clicking the header search pill should re-open the sheet with current URL params pre-filled. Requires reading `searchParams` and hydrating GuidedSearch state.

---

**Last Updated:** 2026-03-30
**Maintained By:** All AI agents (Dev 1, Dev 2, Dev 3, Bug Agent)
