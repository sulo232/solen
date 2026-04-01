# Roadmap 10 — Vouchers, Gift Cards & Promo Codes

> **Scope**: Gift voucher purchasing, promo code system, last-minute deals page
> **DB Status**: `promo_codes` table exists (migration 048). `last_minute_discount_percent` + `last_minute_window_hours` columns exist on `salons`. `get_last_minute_slots()` RPC function is already built (migration 014, lines 453-514). `price_offers` table exists (migration 037).
> **Effort**: 🟡 Medium (~15 audit points)

---

## Phase 1: Promo Code System (Wire Up Existing Backend)

### 1.1 Check existing promo_codes table

**WHY**: Promo codes are a standard customer acquisition and retention tool. "10% off your first booking" converts skeptical first-time users. "20% off for loyalty" retains existing customers. Migration 048 already created this table — we just need to verify the schema and build the frontend.

**BENCHMARK**:
- **Fresha**: Supports promo codes during checkout with instant validation and discount display
- **Airbnb**: "Have a coupon?" collapsible input during payment

**HOW**:
- **File**: Check `supabase/migrations/048_promo_codes.sql`
- **Expected schema** (verify):
  ```sql
  promo_codes (
    id UUID PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,        -- e.g. "WILLKOMMEN10"
    discount_type TEXT,               -- 'percent' or 'fixed'
    discount_value NUMERIC,           -- 10 (for 10%) or 5.00 (for CHF 5)
    salon_id UUID NULL,               -- NULL = platform-wide, otherwise salon-specific
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    min_booking_amount NUMERIC,       -- minimum order to apply code
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
  )
  ```
- **Validation API**: New `app/api/promo/validate/route.ts`
  - Input: `{ code: string, salon_id: string, booking_amount: number }`
  - Checks: code exists, `is_active = true`, not expired, `current_uses < max_uses`, either `salon_id IS NULL` (platform-wide) or matches booking salon, `booking_amount >= min_booking_amount`
  - Returns: `{ valid: true, discount_type: 'percent', discount_value: 10, savings: 12.50 }` or `{ valid: false, reason: 'Code abgelaufen' }`

**IMPACT**: Revenue impact from first-time conversion + retention. "WILLKOMMEN10" can be shared in marketing materials.

---

### 1.2 Add promo code input to booking checkout

**WHY**: The promo code input is the UI that connects the existing backend to the user. It needs to be frictionless — collapsible so it doesn't clutter checkout for users without codes, but discoverable for those who have one. Instant validation feedback (green checkmark or red error) prevents frustration.

**BENCHMARK**:
- **Fresha**: "Got a promo code?" collapsible link above payment. On input: instant validation, shows "-10%" discount on total.
- **Airbnb**: Similar collapsible "Enter coupon" field.

**HOW**:
- **Position**: In booking checkout (Roadmap 05, Step 6), above payment method selection
- **UI**:
  1. Collapsed state: `"Hast du einen Gutscheincode?"` — text link with gift icon
  2. Click → expands to: text input + "Einlösen" button
  3. On submit: API call to `/api/promo/validate`
  4. **Valid**: Green checkmark, code stays, discount line added to summary: `"Promo WILLKOMMEN10: −CHF 12.50"` in green text. Total updates.
  5. **Invalid**: Red text below input: "Dieser Code ist leider ungültig" or "Code abgelaufen" or "Mindestbestellwert: CHF 50"
  6. **Remove**: "×" button next to applied code to remove discount
- **Visual**: Applied code shows as pill: `🎫 WILLKOMMEN10 · −10%` with remove button

**IMPACT**: Users with promo codes convert at much higher rates. The delight of seeing a discount applied is a powerful positive reinforcement.

---

### 1.3 Admin: promo code management

**WHY**: Salon owners and platform admins need to create, manage, and track promo codes. Without a management UI, codes have to be created directly in the database — which is not sustainable for non-technical salon owners.

**HOW**:
- **Platform admin**: Add to admin dashboard (if exists): create/edit/deactivate codes, see usage stats
- **Salon owners**: Add to salon dashboard: create salon-specific codes for their own promotions
- **Features per code**:
  - Create: code text (auto-generate or custom), discount type/value, validity period, max uses
  - View: creation date, usage count, remaining uses, status (active/expired/maxed out)
  - Actions: deactivate, extend validity, copy code to clipboard
  - Stats: "23 uses, CHF 287 in discounts, 18 first-time customers"

**IMPACT**: Self-service promo management. Salon owners can run their own promotions without contacting Solen support.

---

## Phase 2: Gift Vouchers

### 2.1 Create vouchers table

**WHY**: Gift vouchers are pure incremental revenue — someone pays for a voucher, the recipient visits the salon (and often spends more than the voucher amount). Beauty services are the #3 most gifted experience behind dining and entertainment. Vouchers also bring NEW customers into salons (the buyer's friend who's never been). This is a revenue feature, not just a nice-to-have.

**BENCHMARK**:
- **Fresha**: Full gift voucher system — buy vouchers for specific salons, choose amount, personalize with message. Recipient gets an email with voucher code and QR code.
- **Airbnb**: Gift cards available for any amount, redeemable against any booking.

**HOW** (create table if it doesn't exist):
```sql
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,  -- which salon it's for
  buyer_id UUID REFERENCES profiles(id),                           -- who bought it
  buyer_email TEXT,                                                 -- if bought without auth
  recipient_email TEXT,                                             -- who receives it
  recipient_name TEXT,                                              -- personalization
  amount NUMERIC(8,2) NOT NULL CHECK (amount > 0),                 -- voucher value in CHF
  code TEXT UNIQUE NOT NULL DEFAULT upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 8)),
  -- ^^ Generates 8-char hex code like "A3F7B2C1" — short enough to type, unique enough to be secure
  message TEXT,                                                     -- personal message: "Alles Gute zum Geburtstag!"
  redeemed_at TIMESTAMPTZ,                                          -- NULL = not yet used
  redeemed_by UUID REFERENCES profiles(id),                        -- who used it
  remaining_amount NUMERIC(8,2),                                   -- partial redemption support
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '1 year',        -- 1 year validity (Swiss consumer law minimum)
  created_at TIMESTAMPTZ DEFAULT now(),
  stripe_payment_intent_id TEXT                                     -- link to Stripe payment
);

-- Enable RLS
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Buyer can see their purchased vouchers
CREATE POLICY "buyers_see_own" ON vouchers FOR SELECT USING (buyer_id = auth.uid());
-- Salon owners can see vouchers for their salon
CREATE POLICY "salon_owners_see_own" ON vouchers FOR SELECT USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);
```

**IMPACT**: New revenue stream. CHF 50 voucher = CHF 50 guaranteed salon visit (often more with upsell).

---

### 2.2 Voucher purchase flow

**WHY**: The purchase flow needs to be smooth and gift-oriented — the buyer is often in "gift giving" mode and wants it to feel special. Amount selection, personalization, and instant delivery via email create a delightful gifting experience.

**BENCHMARK**:
- **Fresha**: Select salon → choose amount (preset or custom) → enter recipient details → pay → email sent with styled voucher card
- **Airbnb**: Select amount → enter recipient email → pay → branded email with gift card code

**HOW**:
- **Entry point**: Salon detail page → "🎁 Gutschein kaufen" button in voucher section (Roadmap 03, 7.5)
- **Flow (single page or multi-step)**:
  1. **Amount selection**: Preset pills: `CHF 25 | CHF 50 | CHF 100 | CHF 150 | Eigener Betrag`
     - Custom amount: input field, min CHF 10, max CHF 500
  2. **Personalization**:
     - "Für wen?" — recipient name + email
     - "Persönliche Nachricht" — text area (optional, max 200 chars), placeholder: "Alles Gute zum Geburtstag! 🎂"
     - Preview: Show a styled voucher card with the message
  3. **Payment**: Stripe Checkout session
     - Create: `stripe.checkout.sessions.create({ line_items: [{ price_data: { unit_amount: amountInCents, currency: 'chf' }, quantity: 1 }], mode: 'payment' })`
     - On success: Create voucher record in DB, send email
  4. **Confirmation**: "🎉 Gutschein wurde an [email] gesendet!" with voucher preview
- **Email to recipient**: Branded HTML email with:
  - Solen logo
  - "Du hast einen Gutschein erhalten!"
  - Amount: "CHF 50"
  - Salon name + photo
  - Personal message from buyer
  - Voucher code (large, prominent): `A3F7B2C1`
  - QR code (encode the code for easy scanning at salon)
  - "Jetzt auf solen.ch einlösen" CTA button
  - Expiry date: "Gültig bis 1. April 2027"

**IMPACT**: Complete gifting experience. Buyer feels good, recipient gets a real voucher, salon gets a guaranteed visit.

---

### 2.3 Voucher redemption

**WHY**: The voucher is worthless without a way to redeem it. Redemption needs to work both in the online booking flow (apply code at checkout) and at the salon (show code, salon scans/enters it). Partial redemption is important — a CHF 100 voucher used for a CHF 65 service should leave CHF 35 remaining credit.

**HOW**:
- **Online redemption** (in booking checkout):
  - Input field: "Gutschein einlösen" (separate from promo codes — different validation logic)
  - Validation: Check code exists, `redeemed_at IS NULL` (or `remaining_amount > 0` for partial), check salon matches, check not expired
  - Apply: Deduct voucher amount from booking total. If voucher > total, store remaining in `remaining_amount` column
  - Display: `"🎫 Gutschein A3F7B2C1: −CHF 50.00"` in booking summary
- **In-salon redemption**:
  - Salon dashboard: "Gutschein einlösen" page where salon enters/scans the code
  - Shows voucher details, remaining amount
  - "Einlösen" button marks as redeemed, records amount
- **Partial redemption tracking**: `remaining_amount = original_amount - sum_of_redemptions`

**IMPACT**: Complete voucher lifecycle — from purchase to redemption. Revenue is ultimately captured by the salon.

---

## Phase 3: Last-Minute Deals

### 3.1 The backend ALREADY EXISTS

**WHY**: Unfilled appointment slots are lost revenue — a salon chair sitting empty at 3pm today will never generate money for that hour. Last-minute deals incentivize users to book these empty slots at a discount. The salon gets revenue instead of nothing, the user gets a bargain. Win-win. This is Fresha's "Deals" feature and one of the most requested features by salon owners.

**IMPORTANT DISCOVERY**: The backend for this is already fully built in `supabase/migrations/014_new_schema.sql` (lines 453-514):
- RPC function `get_last_minute_slots()` already exists
- It queries `availability_slots` within the salon's `last_minute_window_hours` (default: 6 hours from now)
- It applies `last_minute_discount_percent` to the service price
- Both `last_minute_discount_percent` and `last_minute_window_hours` columns exist on `salons`
- This is 100% backend-ready, just needs frontend UI

**HOW THE EXISTING RPC WORKS**:
```sql
-- Simplified version of the existing function:
SELECT 
  s.name as salon_name,
  sv.name_de as service_name, 
  sv.price as original_price,
  (sv.price * (1 - s.last_minute_discount_percent / 100.0)) as discounted_price,
  s.last_minute_discount_percent as discount,
  a.starts_at
FROM availability_slots a
JOIN salons s ON s.id = a.salon_id
JOIN services sv ON sv.id = a.service_id
WHERE a.status = 'available'
AND a.starts_at BETWEEN NOW() AND NOW() + (s.last_minute_window_hours || ' hours')::INTERVAL
AND s.last_minute_discount_percent > 0
ORDER BY a.starts_at ASC;
```

---

### 3.2 Build Last-Minute deals page

**WHY**: The function exists but there's no UI for users to discover these deals. A dedicated "Last-Minute" page (and a homepage category tab) gives deal-hunting users a direct path to discounted appointments. This page has inherently high conversion because users visiting it have already decided they want to book something today — they're just comparing options.

**BENCHMARK**:
- **Fresha**: "Deals" section showing salons with active discounts. Each card shows service, original price strikethrough, discounted price, and time.
- **Airbnb**: No direct equivalent, but "Flexible dates" and "Last minute deals" are common in lodging platforms.

**HOW**:
- **File**: New `app/[locale]/last-minute/page.tsx`
- **Data**: Call `get_last_minute_slots()` RPC via Supabase client: `supabase.rpc('get_last_minute_slots')`
- **Page layout**:
  - H1: `"Last-Minute Angebote 🔥"` — `text-[28px] font-heading`
  - Subtitle: `"Spontan einen Termin buchen und bis zu 30% sparen"` — `text-[#6A6A6A]`
  - Deal cards sorted by time (soonest first)
- **Each deal card**:
  - Salon name + thumbnail photo (left)
  - Service name + duration: `"Gel Nägel · 60 Min."` 
  - Price: Original ~~CHF 65~~ → **CHF 46** (original strikethrough, discounted in bold green)
  - Discount badge: `"−30%"` red/orange pill, top-right
  - Time: `"Heute 14:00 · In 2 Stunden"` — proximity language creates urgency
  - **Countdown context**: If slot is within 1 hour, show: `"⚡ Läuft in 47 Min. ab"` in red text
  - "Buchen" coral button → starts booking with this slot pre-selected
- **Empty state**: "Momentan keine Last-Minute Angebote. Schau später nochmal vorbei! ⏰"
- **Link from homepage**: Add "🔥 Last-Minute" as a category in `CategoryStickyRow.tsx` (the file you have open)
- **Link from category pages**: "Last-Minute" chip in FilterBar

**IMPACT**: Fills empty salon slots (revenue for salons), gives users bargains (delight), and drives urgency-based bookings. One of the strongest conversion features possible because users are booking for TODAY.

---

### 3.3 Enable last-minute in salon dashboard

**WHY**: Salon owners need to opt-in and configure their last-minute deals. They need to set: what discount to offer, how many hours before the appointment to start showing deals, and which services are eligible. Without self-service configuration, the feature can't scale.

**HOW**:
- **File**: Salon dashboard settings page
- **Settings**:
  - Toggle: "Last-Minute Angebote aktivieren" (on/off)
  - Discount: Slider or number input, 5-50% (`last_minute_discount_percent`)
  - Window: Dropdown, 2h / 4h / 6h / 12h / 24h (`last_minute_window_hours`)
  - Services: Checkboxes for which services to include in deals (or "Alle Services")
- **Preview**: "Bei 30% Rabatt und 6h Fenster: Ein Haarschnitt (CHF 65) wird ab 12:00 für einen 18:00 Termin für CHF 45.50 angeboten"

**IMPACT**: Self-service configuration means salon owners can manage deals without contacting Solen. Feature scales automatically as more salons opt in.
