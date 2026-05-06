# Session 2 Prompt — Booking + Payments (Phases 3, 5, 9, 14)

## Who You Are
You are Claude Code, Session 2 of 3. You build the BOOKING and PAYMENT systems.
- **Session 1 (ALREADY DONE):** Built treatment search, category tree, salon profile upgrades, SEO pages, legal pages, cookie banner. Those files are LIVE — DO NOT TOUCH THEM.
- **Session 2 (YOU):** Booking engine upgrades, promo codes, referrals, no-show protection, platform commission
- **Session 3 (AFTER YOU):** Reviews, SMS, i18n, multi-location, dashboard, PWA, polish

## What Session 1 Already Built — DO NOT BREAK THESE
These files were created/modified by Session 1. You may IMPORT from them but NEVER modify them:
- `components/ui/QuickPreviewSheet.tsx` — bottom sheet for salon preview
- `components/ui/CategoryTree.tsx` — 3-level category sidebar
- `components/ReviewBreakdown.tsx` — star distribution chart
- `components/NearbySalons.tsx` — nearby salons section
- `components/ui/CookieBanner.tsx` — cookie consent
- `app/[locale]/behandlungen/[...slug]/page.tsx` — treatment results
- `app/[locale]/[category]/[city]/page.tsx` — city category pages
- `app/[locale]/impressum/page.tsx`, `agb/page.tsx`, `datenschutz/page.tsx`
- `app/[locale]/partner/page.tsx` — partner CTA page
- `app/not-found.tsx`, `app/error.tsx`
- Migrations 044-046 (service_categories, booking_waitlist, salon info fields)
- Modified: `SalonCard.tsx` (now has minPrice, featuredServices props), `FilterBar.tsx` (now has rating/sort), `Footer.tsx` (now complete), salon page (now premium)

## Pre-Flight (DO THIS FIRST)
1. Read `CLAUDE.md` fully — especially Sections 3, 5, 6, 10, 12, 13
2. Read `UI_RULES.md` fully
3. Read `_tasks/roadmap-treatwell-v5.md` — ONLY Phases 3, 5, 9, 14
4. `git log --oneline -15` — see Session 1 commits, verify they're there
5. `npm run build` — MUST pass before you start
6. Check `_tasks/INCOMPLETE_FEATURES.md` — any Session 1 blockers?
7. Note the current commit hash — this is your ROLLBACK POINT

## 🚨 CRITICAL SAFETY RULES

1. NEVER rebuild, replace, or restructure existing components. Only ADD.
2. NEVER delete existing files or code. Only MODIFY or create NEW.
3. NEVER change the design system (colors, fonts, radii).
4. BEFORE EVERY git push: `npm run build` + `npx tsc --noEmit` + `git diff --stat`
5. AFTER EVERY git push: wait 60s, curl https://www.solen.ch/de/ → 200/307
6. ONE COMMIT PER SUB-PHASE.
7. If build fails 3x → stash, note in INCOMPLETE_FEATURES, move on.
8. ABSOLUTELY DO NOT: delete/overwrite homepage, header, bottom nav, modify CLAUDE.md, touch _archive/, modify applied migrations (001-046)

---

## Phase 3: Booking Engine Upgrade

### ⚠️ RISK: HIGH
This modifies the BOOKING FLOW — the core revenue path. A broken booking = lost customers.

### ✅ WHAT WE WANT
- Calendar shows greyed-out fully booked dates (disabled, can't click)
- Auto-selects the NEXT available date when calendar opens
- Small 📋 waitlist icon on greyed dates — tapping opens a "Benachrichtige mich" modal
- Cancellation policy banner shown prominently BEFORE the payment step: "Kostenlose Stornierung bis 24h vor dem Termin"
- 3 payment modes based on salon's setting: `prepay` (full Stripe), `deposit` (Stripe X%), `at_salon` (no payment)
- Payment method icons visible: Visa, Mastercard, TWINT, Apple Pay
- Booking confirmation email via Resend with: salon photo, service, date, time, price, .ics attachment, Google Maps link, cancel link, share button

### ❌ WHAT WE DON'T WANT
- Don't break the EXISTING booking flow — it must still work for salons that haven't set a payment preference
- Default `payment_mode` = `at_salon` — NO payment required. Don't force Stripe on existing salons.
- Don't change BookingCalendar's visual structure — only add to it
- Don't send confirmation email if Resend is not configured — check env var first, show ICS download as fallback
- Don't add a hard dependency on any external service — always have a fallback

### 🔧 BE CAREFUL
- `BookingCalendar.tsx` is complex. READ THE ENTIRE FILE before editing. Make SMALL targeted changes.
- The "fully booked dates" check needs a pre-fetch on month change — don't query per-date
- `app/api/availability/[salon_id]/route.ts` already exists — ADD the `fully_booked_dates[]` field to existing response, don't change the shape
- Stripe payment intents for deposits: use `capture_method: 'manual'` for auth-hold, then capture deposit amount
- The .ics attachment in email needs proper VTIMEZONE for Swiss time (Europe/Zurich)

### Steps
3.1. Create migration 047: `ALTER TABLE salons ADD payment_mode, deposit_percent, cancellation_hours, late_cancel_fee_percent`
3.2. Modify `app/api/availability/[salon_id]/route.ts` — ADD `fully_booked_dates[]` to response
3.3. Modify `components/BookingCalendar.tsx`:
   - Grey out fully booked dates
   - Auto-select next available
   - Add 📋 icon → WaitlistModal
   - Add cancellation policy banner
   - ⚠️ The calendar already has complex state — don't introduce conflicting state
3.4. Create `components/WaitlistModal.tsx` — email notification signup
3.5. Modify checkout flow — support 3 payment modes + show icons
   - ⚠️ Check which checkout component exists. Don't create a duplicate.
3.6. Create booking confirmation email template (Resend)
   - If `RESEND_API_KEY` is not set, skip email and just show confirmation page

→ `git add . && git commit -m "v5-phase3: booking engine upgrade" && git push`
→ Build + deploy check

---

## Phase 5: Promo Codes & Referrals

### ⚠️ RISK: HIGH
3 new tables, complex validation logic, Stripe credit integration.

### ✅ WHAT WE WANT
- `promo_codes` table with: code, discount_type (percent/fixed), discount_value, max_uses, salon_id (null = platform-wide), valid dates
- `referrals` table with: referrer_id, referral_code (unique per user, generated on signup), referred_user_id, status
- `user_credits` table with: user_id, amount, source (referral/promo/birthday), expiry
- Checkout: promo code input field + "Anwenden" button → validates server-side → shows discount
- Profile: "Guthaben: CHF X" display + "Freunde einladen" link
- Referral page: unique code, share via WhatsApp/copy link, stats (X friends invited, CHF X earned)
- Both-sided reward: referrer gets CHF 10, new user gets CHF 10 on first booking
- Salon owners can create their OWN promo codes in dashboard
- Auto-generated birthday promo code (need date_of_birth on profiles — optional field)

### ❌ WHAT WE DON'T WANT
- NEVER trust client-submitted discount amounts — validate 100% server-side
- Don't allow stacking promo + referral credit on same booking (pick higher one)
- Don't generate referral codes for unverified accounts
- Don't let a user refer themselves (check email domains)
- Don't make birthday field required — it's optional, the code only generates IF they provided DOB

### 🔧 BE CAREFUL
- Anti-abuse: rate limit referral completions (max 10/month per referrer). Use Upstash ratelimit.
- Promo code validation: check expiry, max_uses, salon match, minimum booking amount
- User credits: they must REDUCE the Stripe payment amount, not be a post-payment refund
- The referral code generation should happen in a DB trigger or on-register hook, not in every API call
- Check if `profiles.date_of_birth` column exists — if not, add it in a migration

### Steps
5.1. Create migration 048: `promo_codes` table
5.2. Create migration 049: `referrals` table + auto-generate code trigger
5.3. Create migration 050: `user_credits` table + optional `date_of_birth` on profiles
5.4. Create `app/api/promo/validate/route.ts` — POST: validate code, return discount
5.5. Create `app/api/promo/route.ts` — GET (list), POST (create) — admin + salon owners
5.6. Create `app/api/referral/route.ts` — GET user code + stats
5.7. Create `app/api/referral/complete/route.ts` — Credit both users on first booking
5.8. Create `components/dashboard/PromoManager.tsx` — CRUD for salon-specific codes
5.9. Create `app/[locale]/profile/referral/page.tsx` — share + stats page
5.10. Modify checkout — promo code input + credit display
5.11. Modify ProfilePage — "Guthaben" + "Freunde einladen" link

→ `git add . && git commit -m "v5-phase5: promo codes + referrals" && git push`
→ Build + deploy check

---

## Phase 9: No-Show Protection

### ⚠️ RISK: HIGH
Modifies the payment flow. Mistakes = customers charged wrong amounts.

### ✅ WHAT WE WANT
- Dashboard settings: salon picks payment mode (Vorauszahlung / Anzahlung X% / Zahlung im Salon)
- Checkout adapts: shows Stripe form for prepay/deposit, skips payment for at_salon
- For deposits: Stripe creates PaymentIntent with `capture_method: manual`, captures only deposit %
- Late cancel fee: if booking cancelled < cancellation_hours before start → charge fee %
- Booking confirmation shows: "Anzahlung: CHF 12 (20% von CHF 60)" for deposit bookings

### ❌ WHAT WE DON'T WANT
- Don't change the default payment mode — existing salons stay `at_salon`
- Don't auto-charge late cancel fees without notifying the customer first
- Don't create a separate checkout page — modify the existing flow
- Don't expose salon's payment mode in public API — it shows in the booking UI contextually

### 🔧 BE CAREFUL
- Stripe auth+capture: `capture_method: 'manual'` on PaymentIntent creation, then `paymentIntent.capture(depositAmount)` when confirmed
- The remaining amount (after deposit) is NOT charged via Stripe — customer pays at salon
- Late cancel cron: MUST check `cancellation_hours` per salon, not a global value
- Test with Stripe TEST MODE first. Use `pm_card_visa` test card.

### Steps
9.1. Modify dashboard settings — payment mode radio buttons + deposit % slider
9.2. Modify `app/api/bookings/route.ts` — handle 3 modes on booking creation
9.3. Modify `app/api/stripe/create-payment-intent/route.ts` — support partial capture
9.4. Create `app/api/cron/late-cancel/route.ts` — check cancellations, charge fees
   - ⚠️ Add to `vercel.json` crons: `{ "path": "/api/cron/late-cancel", "schedule": "*/30 * * * *" }`

→ `git add . && git commit -m "v5-phase9: no-show protection" && git push`
→ Build + deploy check

---

## Phase 14: Platform Commission

### ⚠️ RISK: HIGH
This is the BUSINESS MODEL. Mistakes = salons not getting paid.

### ✅ WHAT WE WANT
- `platform_settings` table with commission rate (default 15%)
- `salon_payouts` table tracking: gross, commission, net per booking
- On successful payment (Stripe webhook): calculate commission, record payout, transfer net to salon's Stripe Connect account
- Dashboard revenue page shows: gross / commission / net breakdown per booking + totals
- Admin page: configure commission rate

### ❌ WHAT WE DON'T WANT
- Don't apply commission to existing (pre-v5) bookings
- Don't apply commission to `at_salon` bookings (no Stripe involvement)
- Don't change the Stripe Connect onboarding flow — it already works
- Don't hardcode 15% — make it configurable from `platform_settings`
- Don't send real money if testing — use Stripe TEST mode exclusively until user confirms go-live

### 🔧 BE CAREFUL
- `application_fee_amount` in Stripe PaymentIntent is the simplest way to take commission
- The amount must be in CENTS (CHF 9.00 commission = 900)
- Stripe Connect must be in `transfers` mode for this to work — verify account type
- The webhook handler already exists — ADD commission logic to it, don't rewrite the handler
- Add commission ONLY on `payment_intent.succeeded` events, not on creation

### Steps
14.1. Create migration 055: `platform_settings` + `salon_payouts` tables
14.2. Modify `app/api/stripe/webhook/route.ts`:
   - On `payment_intent.succeeded`: compute commission, create payout record
   - ⚠️ READ the existing webhook handler fully. Don't break other event handlers.
14.3. Create `app/api/admin/commission/route.ts` — GET/PUT commission rate
14.4. Modify dashboard revenue page — show gross/commission/net columns

→ `git add . && git commit -m "v5-phase14: platform commission" && git push`
→ Build + deploy check

---

## Post-Session 2 Verification
```bash
npm run build && npx tsc --noEmit
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/coiffeur
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/dashboard
```

You are DONE after Phase 14. Do NOT start any other phases. Session 3 handles Phases 6, 7, 8, 10, 12, 13, 15.
