# 🤖 Solen.ch Feature Mega-Build — CLAUDE CODE ROADMAP (Part 2: Phases 14-25)

> **Continues from Part 1.** All UI phases. Autonomous execution, no human input.

---

## Phase 14: UI — Booking Flow (BookingCalendar + Checkout)

### 14.1 Modify BookingCalendar.tsx for Prepaid Flow

#### [MODIFY] `components/BookingCalendar.tsx`

**Changes:**
1. After slot selection + confirm → show Stripe Elements card form (inline, NOT redirect)
2. Show service duration next to each slot: `"14:00 · 45 Min"`
3. Show `"Wie hast du von uns erfahren?"` dropdown at bottom (acquisition source)
4. If user is NOT logged in → show `GuestBookingForm` instead of redirecting to login
5. If user has active `package_purchases` for this service → show "Paket einlösen" banner
6. Add gift card code input + referral code input in checkout summary
7. Show cancellation policy: `"Kostenlose Stornierung bis {cancelWindowHours}h vorher. Danach werden {cancelFeePercent}% einbehalten."`

**Stripe Elements integration:**
```typescript
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
```

Install dependency if needed: `npm install @stripe/react-stripe-js @stripe/stripe-js`

#### ✅ DO:
```tsx
// Create payment intent FIRST, then show the form
const res = await fetch('/api/stripe/create-checkout', { method: 'POST', body: JSON.stringify({ slot_id, service_id }) });
const { client_secret } = await res.json();
// Then render <Elements stripe={stripePromise} options={{ clientSecret: client_secret }}>
```

#### ❌ DON'T:
```tsx
// DON'T confirm booking BEFORE payment
await fetch('/api/bookings', { method: 'POST', body: JSON.stringify({ slot_id }) }); // Creates booking without payment!
```

> ⚠️ **BE CAREFUL**: Read the existing `BookingCalendar.tsx` (465 lines) fully before editing. Keep ALL existing functionality (staff picker, date picker, slot groups, waitlist). ADD the Stripe checkout step as a new "state" after slot selection. Do NOT remove the existing `handleConfirm` — wrap it to include payment. If `@stripe/react-stripe-js` is not in `package.json`, install it first.

#### Verification:
```bash
npm run build
git add components/BookingCalendar.tsx package.json package-lock.json
git commit -m "phase 14.1: add Stripe checkout, duration display, guest form, acquisition source to BookingCalendar"
```

### 14.2 Guest Booking Form

#### [NEW] `components/booking/GuestBookingForm.tsx`

Inline form shown when user is unauthenticated:
- Name input (required)
- Phone input with `+41` prefix (required, Swiss format validation)
- Email input (optional)
- Styled with `rounded-card`, `border-s-ink/5`, matching existing BookingCalendar design

### 14.3 Service Cart

#### [NEW] `components/booking/ServiceCart.tsx`

Multi-service cart component shown in booking flow when user selects 2+ services:
- List of selected services with name, price, duration
- Add-on checkboxes per service (from `service_addons` table)
- Running total (CHF) and total duration
- Stylist name (same for all services)
- Gift card / referral code inputs
- "Bezahlen & Buchen" CTA button

### 14.4 Group Booking Modal

#### [NEW] `components/booking/GroupBookingModal.tsx`

Modal triggered from salon profile page "Gruppenbuching" button:
- Group size selector (2-20)
- Event type dropdown (Hochzeit, Geburtstag, Firma, Andere)
- Dynamic member rows: for each member → name + service dropdown + optional stylist
- Combined total price
- Single Stripe checkout for organizer

### 14.5 Package Redeem Banner

#### [NEW] `components/booking/PackageRedeemBanner.tsx`

Banner shown in BookingCalendar when user has active packages for the selected service:
- "Du hast noch 3 von 5 Terminen in deinem Paket «5x Haarschnitt»"
- "Jetzt einlösen" button → skips Stripe payment, calls `/api/packages/redeem`

> ⚠️ **BE CAREFUL**: All new components must use design system tokens from `UI_RULES.md`. No `bg-gray-*`, no `text-dark`, no `rounded-lg`. Use `rounded-card`, `text-s-ink`, `bg-s-bg-surface`, etc.

#### Verification:
```bash
npm run build
git add components/booking/
git commit -m "phase 14.2-5: GuestBookingForm, ServiceCart, GroupBookingModal, PackageRedeemBanner"
```

---

## Phase 15: UI — Dashboard Layout + Staff

### 15.1 Dashboard Sidebar Update

#### [MODIFY] `components/dashboard/DashboardLayout.tsx`

Add two new first-level sidebar items:
```
👤 Kunden    → /dashboard/clients
📣 Marketing → /dashboard/marketing
```

Add role-based visibility:
- If `profile.role === 'salon_owner'` or `profile.role === 'admin'` → show ALL items
- If `profile.staff_salon_id` is set (staff role) → show ONLY:
  - Mein Kalender (`/dashboard/calendar?staff=me`)
  - Meine Pausen (`/dashboard/calendar?tab=breaks`)
  - Mein Portfolio (`/dashboard/staff?tab=portfolio`)
  - Mein Profil (`/dashboard/settings?tab=profile`)

#### ✅ DO:
```tsx
const isStaff = profile?.staff_salon_id && profile?.role !== 'salon_owner';
const menuItems = isStaff ? STAFF_MENU_ITEMS : OWNER_MENU_ITEMS;
```

#### ❌ DON'T:
```tsx
// DON'T hide sidebar entirely for staff — they need navigation
if (isStaff) return null; // WRONG — staff can't navigate!
```

> ⚠️ **BE CAREFUL**: Read existing `DashboardLayout.tsx` (12KB) fully. It has animated sidebar, collapse behavior, active route highlighting. ADD items to the existing array, don't rebuild the sidebar. Match existing icon + text + link pattern exactly.

### 15.2 Staff Invite + Service Assignment + Permissions UI

#### [MODIFY] `app/[locale]/dashboard/staff/page.tsx`

Add:
- "Einladen" button at top → opens invite modal (email + name)
- "Ausstehende Einladungen" section showing pending invites with resend/revoke
- **"Services zuweisen" checkboxes in staff edit modal**: List all salon services with checkboxes → saves to `staff_services` junction table. Only checked services appear for this stylist in booking flow.
- **Permission toggles per staff member**:
  - ✅ Kalender bearbeiten (`can_edit_schedule`)
  - ✅ Buchungen sehen (`can_view_own_bookings`)
  - ✅ Portfolio verwalten (`can_manage_portfolio`)

### 15.3 Staff Accept Invite Page

#### [NEW] `app/[locale]/staff-invite/page.tsx`

Public page with token param. Shows salon name, role description. "Einladung annehmen" button → creates/links account.

#### Verification:
```bash
npm run build
git add components/dashboard/DashboardLayout.tsx app/[locale]/dashboard/staff/ app/[locale]/staff-invite/
git commit -m "phase 15: dashboard sidebar update, staff role permissions, invite UI"
```

---

## Phase 16: UI — Calendar & Scheduling

### 16.1 Calendar View Modes + Color Coding

#### [MODIFY] `app/[locale]/dashboard/calendar/page.tsx`

- Add toggle buttons at top: `Tag | Woche | Monat`
- Day view: Single column, hourly rows, all staff side-by-side
- Month view: Grid with dots/counts per day
- Color-coded event left borders by service category: hair=`#E8624A`, nails=`#6BA3C8`, spa=`#7BA688`, etc.
- Processing time shown as lighter-opacity band on calendar blocks

### 16.2 Walk-in Modal

#### [NEW] `components/dashboard/WalkInModal.tsx`

Modal from "Walk-in hinzufügen" button on calendar:
- Customer name + phone inputs
- Service dropdown (from salon's services)
- Stylist dropdown
- "Erstellen & SMS senden" button → calls `/api/bookings/walk-in`
- Shows "Bezahlung ausstehend" badge on calendar card

### 16.3 Schedule Grid

#### [NEW] `components/dashboard/ScheduleGrid.tsx`

Staff working hours configuration:
- Grid: Mon-Sat rows × Start/End time pickers per staff member
- Toggle per day (active/inactive)
- "Alternierend" checkbox → shows Week A / Week B
- Save button → calls `/api/staff/my-schedule`

### 16.4 Closure & Break Managers

#### [NEW] `components/dashboard/ClosureManager.tsx`

In Dashboard Settings → "Feiertage" tab:
- List of upcoming closures with date range + reason
- "Schliessung hinzufügen" → date range picker + reason input
- Delete button per closure

#### [NEW] `components/dashboard/BreakManager.tsx`

Staff break configuration:
- Per-staff member break blocks (day × time)
- Visual representation on calendar

> ⚠️ **BE CAREFUL**: The existing calendar page is 28KB. Read it fully to understand the weekly grid structure before adding day/month views. ADD view modes as new render paths, don't replace the weekly view.

#### Verification:
```bash
npm run build
git add app/[locale]/dashboard/calendar/ components/dashboard/WalkInModal.tsx components/dashboard/ScheduleGrid.tsx components/dashboard/ClosureManager.tsx components/dashboard/BreakManager.tsx
git commit -m "phase 16: calendar day/month views, color coding, walk-in modal, schedule grid, closures, breaks"
```

---

## Phase 17: UI — Client CRM Page

### 17.1 Client List + Profile

#### [NEW] `app/[locale]/dashboard/clients/page.tsx`

New dashboard page with:
- Search bar (by name, phone, email)
- Client list cards: avatar, name, last visit date, total bookings, tags
- Click → client detail view with tabs

### 17.2 Client Detail Tabs

Tabs within client profile:
- **Termine**: Booking history (from existing bookings data)
- **Formeln** → `[NEW] components/dashboard/FormulaTab.tsx`: Table of color formulas + "Neue Formel" form
- **Fotos** → `[NEW] components/dashboard/ClientPhotosTab.tsx`: Before/after photo pairs + "Auf Discovery veröffentlichen?" toggle
- **Notizen**: Existing `client_notes` already works
- **Tags**: Existing `client_tags` already works
- **Fragebogen** → `[NEW] components/dashboard/IntakeFormTab.tsx`: Predefined templates, fill out, Gemini "Empfehlung" generation

### 17.3 Intake Form with Gemini

#### [NEW] `components/dashboard/IntakeFormTab.tsx`

- Template selector dropdown (Hair/Nails/Waxing/Makeup/Spa)
- Dynamic form fields from `lib/intake-templates.ts`
- "Empfehlung generieren" button → sends responses to Gemini API → shows AI-generated recommendation text
- Save form + recommendation

> ⚠️ **BE CAREFUL**: Gemini integration already exists in the codebase (`lib/ai-vision.ts`). Use the same API key and pattern. Rate limit AI calls.

#### Verification:
```bash
npm run build
git add app/[locale]/dashboard/clients/ components/dashboard/FormulaTab.tsx components/dashboard/ClientPhotosTab.tsx components/dashboard/IntakeFormTab.tsx
git commit -m "phase 17: client CRM page with formula, photos, intake form tabs"
```

---

## Phase 18: UI — Tip Page + Gift Cards

### 18.1 Tip Page

#### [NEW] `app/[locale]/tip/[bookingId]/page.tsx`

Public tokenized page (no login required). Shows:
- Stylist photo + name
- Service that was done
- Preset tip buttons: CHF 5 | CHF 10 | CHF 15 | Eigener Betrag
- Stripe Elements for card payment
- Thank you animation after payment

### 18.2 Gift Card Purchase Page

#### [NEW] `app/[locale]/salon/[slug]/gift-card/page.tsx`

Within salon profile context:
- Amount selector: CHF 25 | 50 | 100 | 200 | Eigener Betrag
- Recipient name + email
- Personal message (optional)
- Preview of what the email will look like
- Stripe checkout

### 18.3 Gift Card Dashboard Manager

#### [NEW] `components/dashboard/GiftCardManager.tsx`

In Marketing dashboard:
- List of sold gift cards: code, amount, remaining balance, purchaser, recipient, status
- Total revenue from gift cards

#### Verification:
```bash
npm run build
git add app/[locale]/tip/ app/[locale]/salon/*/gift-card/ components/dashboard/GiftCardManager.tsx
git commit -m "phase 18: tip page, gift card purchase page, gift card dashboard manager"
```

---

## Phase 19: UI — Analytics Expansion

### 19.1 Heatmap + Analytics Tabs

#### [MODIFY] `app/[locale]/dashboard/analytics/page.tsx`

Add tabs: **Übersicht | Termine | Kunden | Services | Team**

#### [NEW] `components/dashboard/HeatmapChart.tsx`

7×12 grid (Mon-Sun × 8AM-8PM). Cell color intensity = booking density. Built with CSS grid + dynamic `bg-s-coral/[opacity]`.

#### [NEW] `components/dashboard/StaffComparison.tsx`

Table + bar chart combo. Columns: Stylist | Termine | Umsatz | Bewertung | Retention. Toggle between table and chart view.

### 19.2 Acquisition Source Display

In Kunden tab: Pie chart of "Wie hast du von uns erfahren?" responses. Bar chart of UTM sources.

### 19.3 Revenue Page Enhancement

#### [MODIFY] `app/[locale]/dashboard/revenue/page.tsx`

Add sections:
- Commission per stylist table (Stylist | Buchungen | Umsatz | Provision % | Provision CHF | Trinkgeld)
- Gift card revenue summary
- Tips received summary

#### Verification:
```bash
npm run build
git add app/[locale]/dashboard/analytics/ app/[locale]/dashboard/revenue/ components/dashboard/HeatmapChart.tsx components/dashboard/StaffComparison.tsx
git commit -m "phase 19: analytics heatmap, staff comparison, acquisition sources, revenue commissions"
```

---

## Phase 20: UI — Marketing Dashboard

### 20.1 Marketing Page

#### [NEW] `app/[locale]/dashboard/marketing/page.tsx`

Hub page with cards linking to sub-sections:
- Pakete (service packages)
- Geschenkkarten (gift cards)
- Empfehlungen (referral program)
- Aktionen (existing PromoManager)

### 20.2 Package Manager

#### [NEW] `components/dashboard/PackageManager.tsx`

- List of packages: name, service, sessions, price, active/inactive
- "Neues Paket" form: service selector, sessions count, bonus sessions, price
- Purchases overview: who bought, sessions used/remaining

### 20.3 Referral Section

#### [NEW] `components/dashboard/ReferralDashboard.tsx`

Salon-owner view: referral stats (total referrals, revenue from referrals).

#### [MODIFY] `components/ProfilePage.tsx`

Customer view: "Freunde einladen" section with personal referral code, share buttons (WhatsApp, SMS, Copy), reward tracking ("Du hast CHF 20 verdient"). **Auto-generate referral code on first view** if user doesn't have one (call `api/referral/create` automatically).

#### Verification:
```bash
npm run build
git add app/[locale]/dashboard/marketing/ components/dashboard/PackageManager.tsx components/dashboard/ReferralDashboard.tsx components/ProfilePage.tsx
git commit -m "phase 20: marketing dashboard, package manager, referral UI"
```

---

## Phase 21: UI — Services & Settings

### 21.1 Service Photos + Time Fields

#### [MODIFY] `app/[locale]/dashboard/services/page.tsx`

Add to service edit form:
- Photo upload (up to 3 per service) → Supabase Storage `service-photos`
- Buffer minutes input ("Aufbauzeit")
- Processing minutes input ("Einwirkzeit")
- Finishing minutes input ("Nachbereitung")
- Daily limit per staff input

### 21.2 Settings Expansion

#### [MODIFY] `app/[locale]/dashboard/settings/page.tsx`

Add tabs/sections:
- **Stornierung**: Cancellation fee percent slider + cancellation window hours input
- **Feiertage**: ClosureManager component
- **Terminvergabe**: Auto-assign method dropdown + "Tägliches Limit" toggle
- **Stripe**: Connect status + connect/disconnect button
- **Team / Provision**: Commission % input per stylist (flat %). Used by `lib/commission-calculator.ts` for revenue breakdown.

> ⚠️ **BE CAREFUL**: Settings page is already 42KB. Read completely before modifying. ADD new tabs to the existing tab system, don't restructure.

#### Verification:
```bash
npm run build
git add app/[locale]/dashboard/services/ app/[locale]/dashboard/settings/
git commit -m "phase 21: service photos, time fields, settings expansion (cancellation, closures, auto-assign)"
```

---

## Phase 22: UI — Salon Profile Enhancements

### 22.1 Salon Profile Page Sections

#### [MODIFY] Salon profile page (wherever it lives, likely `app/[locale]/salon/[slug]/page.tsx`)

Add sections:
- **Pakete**: Show available service packages with pricing + "Kaufen" button
- **Geschenkkarten**: "Geschenkkarte kaufen" card → links to gift card page
- **Service photos**: Service cards show photo carousel
- **Staff ratings**: Show ★ rating per stylist on staff cards
- **Duration display**: Show "45 Min" next to each service price

### 22.2 Per-Stylist Ratings Display

In staff picker (BookingCalendar) and salon profile staff section → show `★ 4.8 (23)` next to stylist name.

#### Verification:
```bash
npm run build
git add app/[locale]/salon/
git commit -m "phase 22: salon profile packages, gift cards, service photos, staff ratings"
```

---

## Phase 23: Email Template Updates

### 23.1 Update email templates

#### [MODIFY] `lib/email.ts`

Add new email templates:
- `walkInPaymentEmail(customerName, salonName, serviceName, paymentUrl, amount)`
- `tipPromptEmail(customerName, stylistName, stylistPhoto, tipUrl)`
- `birthdayEmail(customerName, salonName)`
- `giftCardDeliveryEmail(recipientName, senderName, amount, code, qrCodeUrl, message)`
- `priceAdjustmentEmail(customerName, salonName, originalAmount, newAmount, acceptUrl, disputeUrl)`
- `staffInviteEmail(staffName, salonName, acceptUrl)`

Modify existing:
- `bookingConfirmationEmail` → add payment receipt info (amount, cancellation policy)
- `reminderEmail` → add one-click action buttons (Bestätigen | Verschieben | Stornieren)
- `reviewPromptEmail` → add Google review push link for 4-5 star reviews

> ⚠️ **BE CAREFUL**: Existing email templates in `lib/email.ts` (21KB) are actively used. Do NOT change existing template signatures. Only ADD new functions. All emails must support 4 locales (de, en, fr, it) using translation keys from `messages/`.

#### Verification:
```bash
npm run build
git add lib/email.ts lib/email-templates/
git commit -m "phase 23: all new email templates (walk-in, tip, birthday, gift card, staff invite, price adjustment)"
```

---

## Phase 24: BookingSuccess + Profile Updates

### 24.1 BookingSuccess Enhancement

#### [MODIFY] `components/BookingSuccess.tsx`

Add:
- Payment receipt (amount paid, payment method last 4 digits)
- Cancellation policy reminder with specific date/time
- "Termin zum Kalender hinzufügen" button (generates `.ics` download)
- "Freunde einladen" referral CTA

### 24.2 Profile Page Updates

#### [MODIFY] `components/ProfilePage.tsx`

Add:
- Birthday input in account settings
- "Meine Fragebögen" section (filled intake forms, read-only)
- "Meine Pakete" section (active packages with sessions remaining)
- "Meine Geschenkkarten" section (cards with remaining balance)
- "Freunde einladen" referral section with code + share buttons

#### Verification:
```bash
npm run build
git add components/BookingSuccess.tsx components/ProfilePage.tsx
git commit -m "phase 24: BookingSuccess payment receipt + ProfilePage birthday, packages, gift cards, referrals"
```

---

## Phase 23.5: Translation Updates (All 4 Locales)

> **This was missing from the original roadmap.** All new UI requires translation keys.

#### [MODIFY] `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`

Add keys for:
- Booking checkout: `booking.pay_now`, `booking.cancellation_notice`, `booking.guest.*`, `booking.acquisition_source.*`
- Service cart: `cart.title`, `cart.total`, `cart.duration`, `cart.addons`, `cart.gift_card`, `cart.referral`
- Dashboard CRM: `dashboard.clients.*`, `dashboard.formulas.*`, `dashboard.intake.*`, `dashboard.photos.*`
- Dashboard Marketing: `dashboard.marketing.*`, `dashboard.packages.*`, `dashboard.gift_cards.*`, `dashboard.referrals.*`
- Tip page: `tip.title`, `tip.preset.*`, `tip.custom`, `tip.thank_you`
- Gift card page: `gift_card.purchase.*`, `gift_card.recipient.*`, `gift_card.preview`
- Walk-in: `walk_in.modal.*`, `walk_in.payment_pending`
- Calendar views: `calendar.day`, `calendar.week`, `calendar.month`, `calendar.walk_in_add`
- Settings expansion: `settings.cancellation.*`, `settings.closures.*`, `settings.auto_assign.*`, `settings.stripe.*`
- Staff: `staff.invite.*`, `staff.services_assign`, `staff.permissions.*`

> ⚠️ **BE CAREFUL**: German (de) is the primary locale. English (en) is secondary. French (fr) and Italian (it) can use machine-translated versions initially but must be reviewed. Keep existing keys exactly as they are — only ADD new ones.

#### Verification:
```bash
npm run build
git add messages/
git commit -m "phase 23.5: add all new translation keys for megabuild features (de, en, fr, it)"
```

---

## Phase 25: CLAUDE.md Final Update

### 25.1 Update CLAUDE.md

#### [MODIFY] `CLAUDE.md`

Update these sections:

**Section 2 (Tech Stack)**: Add `@stripe/react-stripe-js`, `@stripe/stripe-js`

**Section 3.5 (Key Features)**: Add items 25-35:
- 25. Prepaid Booking (Stripe Connect, 1% fee, hold-and-release)
- 26. Staff Accounts (invite-based, limited dashboard)
- 27. Guest Booking (no account required)
- 28. Walk-in Mode (SMS payment links)
- 29. Service Packages (punch cards)
- 30. Digital Gift Cards (per-salon)
- 31. Tip System (post-service)
- 32. Group Bookings
- 33. Client CRM (formulas, intake forms, photos)
- 34. Referral Program
- 35. Advanced Analytics (heatmap, staff comparison, acquisition tracking)

**Section 6 (Schema)**: Add all 17 new tables to the schema table.

**Section 11 (Security)**: Note that all new routes follow the security stack.

### 25.2 Update .env.example

#### [MODIFY] `.env.example`

Add:
```
STRIPE_WEBHOOK_SECRET=whsec_...
BOOKING_HMAC_SECRET=your-hmac-secret
GIFT_CARD_HMAC_SECRET=your-gc-hmac-secret
PLATFORM_FEE_PERCENT=1
```

#### Verification:
```bash
npm run build
npx tsc --noEmit
git add CLAUDE.md .env.example
git commit -m "phase 25: update CLAUDE.md with all new features, tables, and env vars"
```

---

## DEPENDENCY ORDERING TABLE (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Manual A | 🧑 | Stripe Connect configuration | Nothing |
| Manual B | 🧑 | Supabase storage buckets | Nothing |
| Manual C | 🧑 | seven.io verification | Nothing |
| Manual D | 🧑 | Vercel env vars | Manual A |
| Phase 1 | 🤖 | DB: salons + bookings + price_adjustments | Nothing |
| Phase 2 | 🤖 | DB: staff invites + staff_services | Nothing |
| Phase 3 | 🤖 | DB: scheduling tables | Nothing |
| Phase 4 | 🤖 | DB: booking, CRM, payment tables | Phase 1 (FK refs) |
| Phase 5 | 🤖 | Types + validations + utils | Phases 1-4 (types match schema) |
| Phase 6 | 🤖 | Stripe Connect + prepaid + guest booking API | Phase 1, 5, Manual A+D |
| Phase 7 | 🤖 | Cancel + refund + adjustment API | Phase 1, 5, 6 |
| Phase 8 | 🤖 | Staff system API | Phase 2, 5 |
| Phase 9 | 🤖 | Scheduling + walk-in (page + API) | Phase 3, 5, Manual C |
| Phase 10 | 🤖 | Group booking (RPC) + packages API | Phase 4, 5 |
| Phase 11 | 🤖 | Quick-actions + CRM API | Phase 4, 5 |
| Phase 12 | 🤖 | Tips, gift cards, referrals API | Phase 4, 5 |
| Phase 13 | 🤖 | Crons (5) + analytics (3) + AI intake | Phases 1-12 |
| Phase 14 | 🤖 | UI: BookingCalendar + checkout | Phase 6, 7 |
| Phase 15 | 🤖 | UI: Dashboard layout + staff | Phase 8 |
| Phase 16 | 🤖 | UI: Calendar + scheduling | Phase 9 |
| Phase 17 | 🤖 | UI: Client CRM | Phase 11 |
| Phase 18 | 🤖 | UI: Tips + gift cards | Phase 12 |
| Phase 19 | 🤖 | UI: Analytics | Phase 13 |
| Phase 20 | 🤖 | UI: Marketing dashboard | Phase 12 |
| Phase 21 | 🤖 | UI: Services + settings | Phase 3, 4 |
| Phase 22 | 🤖 | UI: Salon profile | Phases 14-21 |
| Phase 23 | 🤖 | Email templates | Phases 6-12 |
| Phase 24 | 🤖 | UI: BookingSuccess + profile | Phases 14, 20 |
| Phase 25 | 🤖 | CLAUDE.md update | ALL previous |
| Manual E | 🧑 | Google Reserve application | Phase 13 |
| Manual F | 🧑 | E2E testing | ALL phases |

---

## New Files Summary

### Components (~18 new files)
```
components/booking/GuestBookingForm.tsx        [NEW]
components/booking/ServiceCart.tsx              [NEW]
components/booking/GroupBookingModal.tsx        [NEW]
components/booking/PackageRedeemBanner.tsx      [NEW]
components/dashboard/WalkInModal.tsx            [NEW]
components/dashboard/ScheduleGrid.tsx           [NEW]
components/dashboard/ClosureManager.tsx         [NEW]
components/dashboard/BreakManager.tsx           [NEW]
components/dashboard/FormulaTab.tsx             [NEW]
components/dashboard/ClientPhotosTab.tsx        [NEW]
components/dashboard/IntakeFormTab.tsx          [NEW]
components/dashboard/GiftCardManager.tsx        [NEW]
components/dashboard/PackageManager.tsx         [NEW]
components/dashboard/ReferralDashboard.tsx      [NEW]
components/dashboard/HeatmapChart.tsx           [NEW]
components/dashboard/StaffComparison.tsx        [NEW]
components/dashboard/PriceAdjustmentModal.tsx   [NEW]
```

### Pages (~7 new pages)
```
app/[locale]/tip/[bookingId]/page.tsx           [NEW]
app/[locale]/salon/[slug]/gift-card/page.tsx    [NEW]
app/[locale]/dashboard/clients/page.tsx         [NEW]
app/[locale]/dashboard/marketing/page.tsx       [NEW]
app/[locale]/staff-invite/page.tsx              [NEW]
app/[locale]/walk-in-pay/page.tsx               [NEW]  ← Fixed: was incorrectly under /api/
```

### API Routes (~35 new routes)
```
app/api/stripe/create-checkout/route.ts         [NEW]
app/api/stripe/save-card/route.ts               [NEW]  ← NEW from audit fix 1
app/api/stripe/create-customer/route.ts         [NEW]  ← NEW from audit fix 1
app/api/bookings/[id]/adjust-price/route.ts     [NEW]
app/api/bookings/[id]/respond-adjustment/route.ts [NEW]
app/api/bookings/[id]/refund/route.ts           [NEW]
app/api/bookings/[id]/quick-action/route.ts     [NEW]
app/api/bookings/walk-in/route.ts               [NEW]
app/api/bookings/walk-in-verify/route.ts        [NEW]  ← Renamed from walk-in-pay API
app/api/bookings/group/route.ts                 [NEW]
app/api/staff/invite/route.ts                   [NEW]
app/api/staff/accept-invite/route.ts            [NEW]
app/api/staff/my-schedule/route.ts              [NEW]
app/api/staff/services/route.ts                 [NEW]
app/api/salon/closures/route.ts                 [NEW]
app/api/staff/breaks/route.ts                   [NEW]
app/api/staff/time-off/route.ts                 [NEW]
app/api/packages/route.ts                       [NEW]
app/api/packages/purchase/route.ts              [NEW]
app/api/packages/redeem/route.ts                [NEW]
app/api/clients/[id]/formulas/route.ts          [NEW]
app/api/clients/[id]/photos/route.ts            [NEW]
app/api/clients/[id]/intake/route.ts            [NEW]
app/api/intake/templates/route.ts               [NEW]
app/api/tips/route.ts                           [NEW]
app/api/gift-cards/purchase/route.ts            [NEW]
app/api/gift-cards/redeem/route.ts              [NEW]
app/api/gift-cards/balance/route.ts             [NEW]
app/api/referral/create/route.ts                [NEW]
app/api/referral/validate/route.ts              [NEW]
app/api/cron/auto-complete/route.ts             [NEW]
app/api/cron/release-payments/route.ts          [NEW]
app/api/cron/pre-charge/route.ts                [NEW]  ← NEW from audit fix 1
app/api/cron/birthday-messages/route.ts         [NEW]
app/api/cron/generate-slots/route.ts            [NEW]  ← NEW from audit conflict 7
app/api/analytics/staff/[id]/route.ts           [NEW]
app/api/analytics/staff-comparison/route.ts     [NEW]  ← NEW from audit UI gap 5
app/api/ai/intake-recommendation/route.ts       [NEW]  ← NEW from audit UI gap 4
```

### Migrations (~6 new files)
```
supabase/migrations/XXX_megabuild_salons.sql            [NEW]
supabase/migrations/XXX_megabuild_staff.sql             [NEW]
supabase/migrations/XXX_megabuild_scheduling.sql        [NEW]
supabase/migrations/XXX_megabuild_booking_crm_payments.sql [NEW]
supabase/migrations/XXX_megabuild_group_booking_rpc.sql [NEW]  ← NEW from audit fix 7
```

### Lib Files (~3 new)
```
lib/cancellation-policy.ts                      [NEW]
lib/commission-calculator.ts                    [NEW]
lib/intake-templates.ts                         [NEW]
```

### Modified Files (~20)
```
lib/types.ts                                    [MODIFY]
lib/validations.ts                              [MODIFY]
lib/email.ts                                    [MODIFY]
components/BookingCalendar.tsx                   [MODIFY]
components/BookingSuccess.tsx                    [MODIFY]
components/ProfilePage.tsx                      [MODIFY]
components/dashboard/DashboardLayout.tsx         [MODIFY]
app/[locale]/dashboard/page.tsx                 [MODIFY]
app/[locale]/dashboard/staff/page.tsx           [MODIFY]
app/[locale]/dashboard/services/page.tsx        [MODIFY]
app/[locale]/dashboard/settings/page.tsx        [MODIFY]
app/[locale]/dashboard/calendar/page.tsx        [MODIFY]
app/[locale]/dashboard/analytics/page.tsx       [MODIFY]
app/[locale]/dashboard/revenue/page.tsx         [MODIFY]
app/api/bookings/route.ts                       [MODIFY]
app/api/bookings/[id]/cancel/route.ts           [MODIFY]
app/api/stripe/webhook/route.ts                 [MODIFY]
app/api/cron/review-prompt/route.ts             [MODIFY]
app/api/analytics/salon/[id]/route.ts           [MODIFY]
messages/de.json                                [MODIFY]  ← NEW from audit
messages/en.json                                [MODIFY]  ← NEW from audit
messages/fr.json                                [MODIFY]  ← NEW from audit
messages/it.json                                [MODIFY]  ← NEW from audit
CLAUDE.md                                       [MODIFY]
.env.example                                    [MODIFY]
```

---

## Grand Totals (Post-Audit)

| Category | Count |
|---|---|
| New components | 18 |
| New pages | 7 |
| New API routes | 35 |
| New cron jobs | 5 |
| New migrations | 5 |
| New lib files | 3 |
| Modified files | 25 |
| **Total files touched** | **~98** |
| Phases (code) | 26 (1-25 + 23.5) |
| Manual steps | 6 (A-F) |
