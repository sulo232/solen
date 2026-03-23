# 🏗️ Solen.ch — Feature Mega-Build Unified Roadmap

> **Single source of truth.** Replaces `roadmap-megabuild-manual.md`, `roadmap-megabuild-code-part1.md`, `roadmap-megabuild-code-part2.md`.
> Execute phases in order. `npm run build` must pass before every commit. One commit per sub-phase.

---

## ⚠️ CRITICAL PRE-EXECUTION DECISIONS (Must resolve BEFORE Phase 1)

| # | Decision | Context | Resolution |
|---|---|---|---|
| D1 | **Column name**: `payment_intent_id` vs `stripe_payment_intent_id` | Existing webhook/routes use `payment_intent_id`. Roadmap originally used `stripe_payment_intent_id`. | **USE the existing `payment_intent_id` column.** Do NOT create `stripe_payment_intent_id`. All new code must use `payment_intent_id`. |
| D2 | **payment_status enum**: existing uses `deposit_held`, `none` | New CHECK constraint must include these. | **Enum = `pending`, `card_saved`, `deposit_held`, `paid`, `none`, `refunded`, `partially_refunded`, `disputed`** |
| D3 | **Commission rate**: existing 15% from `platform_settings` vs roadmap 1% | `create-payment-intent/route.ts` reads from `platform_settings.commission.rate_percent`. | **Keep reading from `platform_settings`.** Update the row to 1% rate. New routes MUST also read from `platform_settings`, NOT hardcode. |
| D4 | **Duplicate systems**: `price_disputes` (existing) vs `price_adjustments` (new) | Both handle post-booking price changes. | **Extend existing `price_disputes` table.** Add `expires_at`, `customer_responded_at` columns. Do NOT create `price_adjustments`. Update all roadmap references. |
| D5 | **Duplicate systems**: `referrals` (existing) vs `referral_codes` (new) | Both handle referral programs. | **Extend existing `referrals` table.** Add `code`, `max_uses` columns. Do NOT create `referral_codes`/`referral_redemptions`. |
| D6 | **Existing route**: `create-payment-intent` vs new `create-checkout` | Both create Stripe PaymentIntents with Connect. | **Modify existing `create-payment-intent`.** Add SetupIntent support for >7-day bookings. Do NOT create `create-checkout`. |
| D7 | **Edge Runtime on `bookings/route.ts`** | Current: `export const runtime = "edge"`. Stripe SDK needs Node.js. | **Change to `runtime = "nodejs"`** in Phase 6. |
| D8 | **`accepts_online_payment` column** | Already used by existing Stripe routes. Not in roadmap. | **Keep it.** Phase 6 must check this column before payment. |
| D9 | **EmailLocale**: existing = `de\|en\|fr`, roadmap says 4 | Italian (`it`) translations exist in `messages/` but not in email templates. | **Add `it` to EmailLocale type.** Add Italian variants to ALL new and existing email templates. |

---

## BREAKAGE RISK ASSESSMENT

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| Manual A-F | 🟢 SAFE | Nothing (config only) | Follow instructions exactly |
| P1-4 (DB) | 🔴 HIGH | **Existing webhook if enum wrong** | Use D1-D5 decisions. Always `IF NOT EXISTS`. |
| P5 (Types) | 🟡 MEDIUM | Must match BOTH old and new columns | Keep existing type fields, ADD new ones |
| P6 (Stripe) | 🔴 CRITICAL | **Entire booking + payment flow** | Modify existing routes (D6). Change runtime (D7). Read `platform_settings` (D3). |
| P7 (Cancel) | 🟡 MEDIUM | Existing cancel/dispute route | Extend `price_disputes` (D4), backwards-compatible |
| P8-9 (Staff/Sched) | 🟢 SAFE | Nothing (new routes) | — |
| P10 (Booking) | 🔴 HIGH | Guest booking breaks RLS | Add service-role insert for guests. Handle `user_id = NULL`. |
| P11-12 (CRM/Pay) | 🟡 MEDIUM | Existing referral system | Extend `referrals` table (D5) |
| P13 (Crons) | 🟡 MEDIUM | Money handling | Audit logging mandatory. Swiss timezone. |
| P14-24 (UI) | 🟡 MEDIUM | Large files (BookingCalendar 20KB, Settings 42KB) | Read fully before editing |
| P25 (CLAUDE.md) | 🟢 SAFE | Nothing | — |

---

## MANUAL STEPS (Complete ALL before code phases)

### Manual A: Stripe Connect Sandbox Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → ensure you're in **Test Mode** (toggle top-right)
2. **Developers → API Keys** → copy `pk_test_...` and `sk_test_...`
3. **Settings → Connect** (or search "Connect" in sidebar)
4. Select **Marketplace/Platform**, country **Switzerland**
5. Enable **Standard** connected accounts + **Destination charges**
6. **Developers → Webhooks → Add endpoint**:
   - URL: `https://www.solen.ch/api/stripe/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `account.updated`, `account.application.deauthorized`, `setup_intent.succeeded`
   - Copy signing secret → save as `STRIPE_WEBHOOK_SECRET`
7. Create a test connected account (fake salon) to verify flows
8. Install Stripe CLI locally: `brew install stripe/stripe-cli/stripe`
9. For local dev: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Manual B: Supabase Storage Buckets

Create in [Supabase Dashboard](https://supabase.com/dashboard) → Storage:
1. `client-photos` — Private, 5MB limit, image/* only
2. `service-photos` — Public, 5MB limit, image/* only
3. `gift-card-assets` — Public, 2MB limit, image/* only

Add RLS policies for each (salon owner + customer access).

### Manual C: seven.io Verification

Verify SMS sender ID for transactional messages (walk-in payments, reminders).

### Manual D: Vercel Environment Variables

Add to **ALL environments** (Production + Preview + Development):
```
STRIPE_WEBHOOK_SECRET=whsec_...
BOOKING_HMAC_SECRET=<openssl rand -hex 32>
GIFT_CARD_HMAC_SECRET=<openssl rand -hex 32>
PLATFORM_FEE_PERCENT=1
```
⚠️ These must exist BEFORE Phase 9 (walk-in uses HMAC) — not Phase 25.

### Manual E: Install nanoid dependency
```bash
npm install nanoid
```

### Manual F: Google Reserve Application (after Phase 13)
### Manual G: E2E Testing (after ALL phases)

---

## Phase 1: Database Migration — Foundation Tables

### [NEW] `supabase/migrations/XXX_megabuild_foundation.sql`

```sql
-- Salons enhancements (accepts_online_payment already exists — do NOT re-add)
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_fee_percent INTEGER DEFAULT 30;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_window_hours INTEGER DEFAULT 24;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS auto_assign_method TEXT DEFAULT 'least_booked_week'
  CHECK (auto_assign_method IN ('least_booked_week','least_booked_today','round_robin','manual_priority'));
ALTER TABLE salons ADD COLUMN IF NOT EXISTS auto_complete_enabled BOOLEAN DEFAULT true;

-- Bookings enhancements (payment_intent_id already exists — do NOT re-add)
-- Drop existing CHECK on payment_status if it exists, then re-add with full enum
DO $$ BEGIN
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('pending','card_saved','deposit_held','paid','none','refunded','partially_refunded','disputed'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_setup_intent_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_amount INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refunded_amount INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_booking_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_via TEXT DEFAULT 'stripe'
  CHECK (paid_via IN ('stripe','package','gift_card','walk_in'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS acquisition_source TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Extend existing price_disputes table (Decision D4 — do NOT create price_adjustments)
ALTER TABLE price_disputes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE price_disputes ADD COLUMN IF NOT EXISTS customer_responded_at TIMESTAMPTZ;

-- Webhook idempotency (prevents replay attacks)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
```

> ⚠️ **BE CAREFUL**: Do NOT add `stripe_payment_intent_id` — use existing `payment_intent_id`. Do NOT add `stripe_account_id` — it already exists. Do NOT add `accepts_online_payment` — it already exists. The `payment_status` CHECK must include `deposit_held` and `none` (used by existing webhook).

#### Verification:
```bash
npm run build
git add supabase/migrations/
git commit -m "phase 1: extend salons, bookings, price_disputes + webhook idempotency table"
```

---

## Phase 2: Database Migration — Staff System

### [NEW] `supabase/migrations/XXX_megabuild_staff.sql`

```sql
CREATE TABLE IF NOT EXISTS staff_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  email TEXT NOT NULL,
  staff_name TEXT,
  invited_by UUID NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE staff_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_salon_owner" ON staff_invites FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);
CREATE POLICY "invites_by_token" ON staff_invites FOR SELECT USING (true);

ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS can_edit_schedule BOOLEAN DEFAULT true;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS can_view_own_bookings BOOLEAN DEFAULT true;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS can_manage_portfolio BOOLEAN DEFAULT true;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_salon_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;

CREATE TABLE IF NOT EXISTS staff_services (
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_member_id, service_id)
);
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_services_public_read" ON staff_services FOR SELECT USING (true);
CREATE POLICY "staff_services_salon_write" ON staff_services FOR ALL USING (
  staff_member_id IN (
    SELECT id FROM staff_members WHERE salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  )
);
```

```bash
npm run build
git add supabase/migrations/
git commit -m "phase 2: create staff_invites, staff_services, extend staff_members + profiles"
```

---

## Phase 3: Database Migration — Scheduling Tables

### [NEW] `supabase/migrations/XXX_megabuild_scheduling.sql`

```sql
CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL, end_time TIME NOT NULL,
  is_alternate_week BOOLEAN DEFAULT false,
  alternate_week_parity INTEGER DEFAULT 0 CHECK (alternate_week_parity IN (0, 1)),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(staff_member_id, day_of_week, alternate_week_parity)
);
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedules_salon_manage" ON staff_schedules FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  OR staff_member_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS salon_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL, reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE salon_closures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "closures_salon_manage" ON salon_closures FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "closures_public_read" ON salon_closures FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS staff_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date DATE,
  start_time TIME NOT NULL, end_time TIME NOT NULL,
  reason TEXT DEFAULT 'break', created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE staff_breaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "breaks_manage" ON staff_breaks FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  OR staff_member_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS staff_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID NOT NULL,
  start_date DATE NOT NULL, end_date DATE NOT NULL,
  reason TEXT, approved_by UUID,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE staff_time_off ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeoff_manage" ON staff_time_off FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  OR staff_member_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid()));
```

> ⚠️ `day_of_week` uses 0=Monday, 6=Sunday (ISO). Check existing `off_peak_slots.day_of_week` convention — if it uses JS convention (0=Sunday), convert in application code: `(jsDay + 6) % 7`.

```bash
npm run build
git add supabase/migrations/
git commit -m "phase 3: create staff_schedules, salon_closures, staff_breaks, staff_time_off"
```

---

## Phase 4: Database Migration — Booking, CRM, Payment Tables

### [NEW] `supabase/migrations/XXX_megabuild_booking_crm_payments.sql`

```sql
-- Services enhancements
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS processing_minutes INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS finishing_minutes INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';
ALTER TABLE services ADD COLUMN IF NOT EXISTS daily_limit_per_staff INTEGER;

-- Guest bookings
CREATE TABLE IF NOT EXISTS guest_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  guest_name TEXT NOT NULL, guest_phone TEXT NOT NULL, guest_email TEXT,
  account_created BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE guest_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guest_salon_read" ON guest_bookings FOR SELECT USING (
  booking_id IN (SELECT id FROM bookings WHERE salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())));

-- Group bookings
CREATE TABLE IF NOT EXISTS group_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_user_id UUID, organizer_name TEXT NOT NULL, organizer_phone TEXT,
  salon_id UUID REFERENCES salons(id) NOT NULL,
  group_size INTEGER NOT NULL,
  event_type TEXT CHECK (event_type IN ('bridal','birthday','corporate','other')),
  notes TEXT, stripe_payment_intent_id TEXT, total_amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_organizer_read" ON group_bookings FOR SELECT USING (
  organizer_user_id = auth.uid() OR salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- FK for group_booking_id (safe — table now exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_group_booking')
  THEN ALTER TABLE bookings ADD CONSTRAINT fk_group_booking FOREIGN KEY (group_booking_id) REFERENCES group_bookings(id);
  END IF;
END $$;

-- Service packages
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  name TEXT NOT NULL, total_sessions INTEGER NOT NULL, bonus_sessions INTEGER DEFAULT 0,
  price INTEGER NOT NULL, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages_public_read" ON service_packages FOR SELECT USING (is_active = true);
CREATE POLICY "packages_salon_manage" ON service_packages FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS package_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES service_packages(id) NOT NULL,
  user_id UUID NOT NULL, salon_id UUID NOT NULL,
  sessions_total INTEGER NOT NULL, sessions_used INTEGER DEFAULT 0,
  stripe_payment_intent_id TEXT, purchased_at TIMESTAMPTZ DEFAULT now(), expires_at TIMESTAMPTZ
);
ALTER TABLE package_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases_own_read" ON package_purchases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "purchases_salon_read" ON package_purchases FOR SELECT USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- CRM tables
CREATE TABLE IF NOT EXISTS client_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL, customer_id UUID NOT NULL, booking_id UUID REFERENCES bookings(id),
  brand TEXT, product_line TEXT, mix_formula TEXT NOT NULL, developer_volume TEXT,
  processing_minutes INTEGER, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE client_formulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "formulas_salon_manage" ON client_formulas FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS intake_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL, customer_id UUID NOT NULL, template_key TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}', ai_recommendation TEXT, filled_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE intake_form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intake_salon_manage" ON intake_form_responses FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "intake_customer_read" ON intake_form_responses FOR SELECT USING (customer_id = auth.uid());

CREATE TABLE IF NOT EXISTS client_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL, customer_id UUID NOT NULL, booking_id UUID REFERENCES bookings(id),
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('before','after','progress')),
  published_to_discovery BOOLEAN DEFAULT false, discovery_item_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE client_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_salon_manage" ON client_photos FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- Payment tables
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) NOT NULL,
  staff_member_id UUID REFERENCES staff_members(id),
  salon_id UUID NOT NULL, amount INTEGER NOT NULL,
  stripe_payment_intent_id TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tips_salon_read" ON tips FOR SELECT USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  code TEXT UNIQUE NOT NULL, original_amount INTEGER NOT NULL, remaining_amount INTEGER NOT NULL,
  purchaser_user_id UUID, purchaser_email TEXT,
  recipient_email TEXT, recipient_name TEXT, message TEXT,
  stripe_payment_intent_id TEXT, expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gc_public_check" ON gift_cards FOR SELECT USING (true);
CREATE POLICY "gc_salon_manage" ON gift_cards FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

-- Extend existing referrals table (Decision D5 — do NOT create referral_codes)
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT 10;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS reward_amount INTEGER DEFAULT 1000;

-- Group booking atomic RPC
CREATE OR REPLACE FUNCTION create_group_booking(
  p_organizer_name TEXT, p_salon_id UUID, p_group_size INTEGER,
  p_event_type TEXT, p_members JSONB
) RETURNS UUID AS $$
DECLARE v_group_id UUID; v_member JSONB; v_slot_status TEXT;
BEGIN
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members) LOOP
    SELECT status INTO v_slot_status FROM availability_slots
    WHERE id = (v_member->>'slot_id')::UUID FOR UPDATE;
    IF v_slot_status != 'available' THEN
      RAISE EXCEPTION 'Slot % is not available', v_member->>'slot_id';
    END IF;
  END LOOP;
  INSERT INTO group_bookings (organizer_name, salon_id, group_size, event_type)
  VALUES (p_organizer_name, p_salon_id, p_group_size, p_event_type)
  RETURNING id INTO v_group_id;
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members) LOOP
    INSERT INTO bookings (salon_id, slot_id, service_id, staff_member_id, group_booking_id, status, payment_status)
    VALUES (p_salon_id, (v_member->>'slot_id')::UUID, (v_member->>'service_id')::UUID,
            (v_member->>'staff_member_id')::UUID, v_group_id, 'pending', 'pending');
    UPDATE availability_slots SET status = 'booked' WHERE id = (v_member->>'slot_id')::UUID;
  END LOOP;
  RETURN v_group_id;
END; $$ LANGUAGE plpgsql;
```

```bash
npm run build
git add supabase/migrations/
git commit -m "phase 4: booking/CRM/payment tables, extend referrals + price_disputes, group booking RPC"
```

---

## Phase 5: Types, Validations & Utilities

### [MODIFY] `lib/types.ts` — Append new types (do NOT remove existing)

Add interfaces: `StaffInvite`, `StaffSchedule`, `StaffBreak`, `StaffTimeOff`, `SalonClosure`, `StaffService`, `GuestBooking`, `GroupBooking`, `ServicePackage`, `PackagePurchase`, `ClientFormula`, `IntakeFormResponse`, `ClientPhoto`, `Tip`, `GiftCard`

Extend existing interfaces:
- `Booking`: add `payment_status?`, `paid_amount?`, `platform_fee?`, `refunded_amount?`, `completed_at?`, `group_booking_id?`, `paid_via?`, `acquisition_source?`, `stripe_setup_intent_id?`, `stripe_customer_id?`, `stripe_payment_method_id?`
- `Salon`: add `cancellation_fee_percent?`, `cancellation_window_hours?`, `auto_assign_method?`, `auto_complete_enabled?`
- `Service`: add `buffer_minutes?`, `processing_minutes?`, `finishing_minutes?`, `photo_urls?`, `daily_limit_per_staff?`
- `StaffMember`: add `user_id?`, `can_edit_schedule?`, `can_view_own_bookings?`, `can_manage_portfolio?`, `average_rating?`, `review_count?`
- `Profile`: add `staff_salon_id?`, `birthday?`

New types: `PaymentStatus`, `AutoAssignMethod`, `GroupEventType`, `PhotoType`, `IntakeTemplateKey`

```typescript
// PaymentStatus MUST include existing values + new ones
export type PaymentStatus = 'pending' | 'card_saved' | 'deposit_held' | 'paid' | 'none' | 'refunded' | 'partially_refunded' | 'disputed';
export type AutoAssignMethod = 'least_booked_week' | 'least_booked_today' | 'round_robin' | 'manual_priority';
export type AdjustmentStatus = 'pending' | 'accepted' | 'disputed' | 'expired';
export type GroupEventType = 'bridal' | 'birthday' | 'corporate' | 'other';
export type PhotoType = 'before' | 'after' | 'progress';
export type IntakeTemplateKey = 'hair_consultation' | 'nail_consultation' | 'waxing_consultation' | 'makeup_consultation' | 'spa_consultation';
export type PaidVia = 'stripe' | 'package' | 'gift_card' | 'walk_in';
```

### [MODIFY] `lib/validations.ts` — Append Zod schemas

```typescript
export const createCheckoutSchema = z.object({
  slot_id: z.string().uuid(),
  service_id: z.string().uuid(),
  staff_member_id: z.string().uuid().optional(),
  addon_ids: z.array(z.string().uuid()).optional(),
  is_first_visit: z.boolean().optional(),
  gift_card_code: z.string().max(20).optional(),
  referral_code: z.string().max(20).optional(),
  acquisition_source: z.string().max(50).optional(),
});

export const guestBookingSchema = z.object({
  guest_name: z.string().min(2).max(100),
  guest_phone: z.string().regex(/^\+41[0-9]{9}$/, "Swiss phone number required"),
  guest_email: z.string().email().optional(),
});

export const priceAdjustmentSchema = z.object({
  requested_amount: z.number().int().min(0).max(100000),
  reason: z.string().min(3).max(500),
});

export const staffInviteSchema = z.object({
  email: z.string().email(),
  staff_name: z.string().min(2).max(100).optional(),
});

export const walkInSchema = z.object({
  customer_name: z.string().min(2).max(100),
  customer_phone: z.string().regex(/^\+41[0-9]{9}$/),
  service_id: z.string().uuid(),
  staff_member_id: z.string().uuid().optional(),
});

export const groupBookingSchema = z.object({
  organizer_name: z.string().min(2).max(100),
  organizer_phone: z.string().optional(),
  group_size: z.number().int().min(2).max(20),
  event_type: z.enum(['bridal','birthday','corporate','other']),
  members: z.array(z.object({
    name: z.string().min(2),
    service_id: z.string().uuid(),
    staff_member_id: z.string().uuid().optional(),
  })).min(2).max(20),
});

export const giftCardPurchaseSchema = z.object({
  salon_id: z.string().uuid(),
  amount: z.number().int().min(1000).max(50000), // CHF 10-500 in cents
  recipient_email: z.string().email(),
  recipient_name: z.string().min(2).max(100),
  message: z.string().max(500).optional(),
});

export const tipSchema = z.object({
  booking_id: z.string().uuid(),
  amount: z.number().int().min(100).max(10000), // CHF 1-100
});

export const formulaSchema = z.object({
  brand: z.string().max(100).optional(),
  product_line: z.string().max(100).optional(),
  mix_formula: z.string().min(1).max(500),
  developer_volume: z.string().max(50).optional(),
  processing_minutes: z.number().int().min(1).max(120).optional(),
  notes: z.string().max(1000).optional(),
  booking_id: z.string().uuid().optional(),
});

export const closureSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(200).optional(),
});

export const scheduleSchema = z.object({
  staff_member_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  is_alternate_week: z.boolean().optional(),
  alternate_week_parity: z.number().int().min(0).max(1).optional(),
});

export const packageSchema = z.object({
  service_id: z.string().uuid(),
  name: z.string().min(2).max(100),
  total_sessions: z.number().int().min(2).max(50),
  bonus_sessions: z.number().int().min(0).max(10),
  price: z.number().int().min(100),
});
```

### [NEW] `lib/cancellation-policy.ts`

```typescript
export function calculateRefund(
  paidAmount: number,
  cancellationFeePercent: number,
  cancellationWindowHours: number,
  appointmentStartsAt: Date
): { refundAmount: number; feeAmount: number; isWithinWindow: boolean } {
  const now = new Date();
  const hoursUntil = (appointmentStartsAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isWithinWindow = hoursUntil < cancellationWindowHours;

  if (isWithinWindow) {
    return { refundAmount: 0, feeAmount: paidAmount, isWithinWindow: true };
  }

  const feeAmount = Math.round(paidAmount * (cancellationFeePercent / 100));
  const refundAmount = paidAmount - feeAmount;
  return { refundAmount, feeAmount, isWithinWindow: false };
}
```

### [NEW] `lib/intake-templates.ts` — Predefined consultation form templates

Each template: array of `{ question_key, question_de, question_en, type: 'text'|'select'|'boolean', options?: string[] }`. Templates: hair, nails, waxing, makeup, spa.

### [NEW] `lib/commission-calculator.ts` — Commission calculation utility
### [NEW] `lib/ics-generator.ts` — Generate .ics calendar files for booking confirmations

> ⚠️ **BE CAREFUL**: Do NOT import any new types in existing files yet. Only add types to `lib/types.ts` and schemas to `lib/validations.ts`. Verify with `npm run build` that no circular imports are created.

```bash
npm run build && npx tsc --noEmit
git add lib/
git commit -m "phase 5: add all new types, Zod schemas, and utility files"
```

---

## Phases 6-13: API Routes

> All routes follow CLAUDE.md §11 security stack:
> 1. Feature flag → 2. Auth → 3. Ban check → 4. Rate limit → 5. Zod validation → 6. Business logic

### Phase 6: Stripe Prepaid Checkout (🔴 CRITICAL — modify existing routes)

> **Stripe 7-day capture limit**: `capture_method: 'manual'` holds expire after 7 days.
> - Booking ≤7 days: Create PaymentIntent (immediate hold)
> - Booking >7 days: Create SetupIntent (save card) → `pre-charge` cron creates PI 5 days before

**Step 1**: [MODIFY] `app/api/bookings/route.ts`
- Change `runtime` from `"edge"` to `"nodejs"` (Critical D7)
- Modify POST handler to handle ALL booking types:
  1. Auth OR guest (if no auth → validate with `guestBookingSchema`, create `guest_bookings` row using admin client)
  2. Check `accepts_online_payment` (D8) and `stripe_account_id`
  3. Check salon closures + staff breaks for requested slot
  4. Check `daily_limit_per_staff`
  5. Auto-assign staff if `staff_member_id` is null (read `salon.auto_assign_method`)
  6. If package redemption → skip Stripe, set `paid_via: 'package'`
  7. If booking ≤7 days → call existing `create-payment-intent` logic
  8. If booking >7 days → create SetupIntent via `save-card` logic

**Step 2**: [MODIFY] `app/api/stripe/create-payment-intent/route.ts`
- Read commission from `platform_settings` (NOT hardcode 1% — D3)
- Add `metadata: { booking_id, salon_id }` for webhook matching
- Support both immediate payment and card-save flows

**Step 3**: [NEW] `app/api/stripe/save-card/route.ts`
- Creates SetupIntent for bookings >7 days

**Step 4**: [NEW] `app/api/stripe/create-customer/route.ts`
- Creates Stripe Customer (needed for SetupIntents)

**Step 5**: [MODIFY] `app/api/stripe/webhook/route.ts`
- ADD new event handlers (don't replace existing switch):
  - `setup_intent.succeeded` → save payment method to booking
  - `account.application.deauthorized` → alert admin
- ADD webhook idempotency check (query `processed_webhook_events` before processing)
- Keep ALL existing handlers (`payment_intent.succeeded`, etc.)

> ⚠️ **BE CAREFUL**: Existing webhook writes `payment_status: 'deposit_held'` and queries `payment_intent_id`. Do NOT change these. ADD new cases alongside them.

#### ✅ DO (Phase 6 — modify existing `create-payment-intent`):
```typescript
// Read commission from platform_settings — do NOT hardcode
const { data: settings } = await admin.from("platform_settings")
  .select("value").eq("key", "commission").single();
const ratePercent = settings?.value?.rate_percent ?? 1;

const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmountCents,
  currency: 'chf',
  application_fee_amount: Math.round(totalAmountCents * (ratePercent / 100)),
  transfer_data: { destination: salon.stripe_account_id },
  capture_method: 'manual',
  metadata: { booking_id: booking.id, salon_id: salon.id },
});
```

#### ❌ DON'T:
```typescript
// DON'T hardcode commission rate
application_fee_amount: Math.round(totalAmountCents * 0.01), // Breaks if admin changes rate!
// DON'T auto-capture
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmountCents,
  currency: 'chf',
  // Missing application_fee_amount and capture_method: 'manual'!
});
```

#### Webhook idempotency pattern (add to top of webhook handler):
```typescript
const existing = await supabase.from('processed_webhook_events')
  .select('event_id').eq('event_id', event.id).single();
if (existing.data) return NextResponse.json({ received: true });
await supabase.from('processed_webhook_events').insert({ event_id: event.id });
```

```bash
npm run build
git add app/api/stripe/ app/api/bookings/route.ts
git commit -m "phase 6: Stripe prepaid checkout + SetupIntent + guest booking + webhook idempotency"
```

### Phase 7: Cancellation, Refund & Price Adjustment

[MODIFY] `app/api/bookings/[id]/cancel/route.ts` — Use `calculateRefund()`, call `stripe.refunds.create()`
[MODIFY] `app/api/bookings/[id]/dispute/route.ts` — Extend existing route to support new `expires_at` + `customer_responded_at` fields (D4)
[NEW] `app/api/bookings/[id]/refund/route.ts` — Salon-triggered manual refund
[NEW] `app/[locale]/bookings/[id]/respond-adjustment/page.tsx` — Customer price adjustment response PAGE (not just API)

> ⚠️ Keep existing `approve-increase` and `confirm-price` routes working. New adjustment flow is an extension, not replacement.

```bash
npm run build
git add app/api/bookings/ app/[locale]/bookings/
git commit -m "phase 7: cancellation refund + extend price disputes + manual refund"
```

### Phase 8: Staff System API

[NEW] `app/api/staff/invite/route.ts` — POST: Send invite email
[NEW] `app/api/staff/accept-invite/route.ts` — POST: Accept via token (handles both existing + new accounts)
[NEW] `app/api/staff/my-schedule/route.ts` — GET/PUT: Staff views/edits own schedule
[NEW] `app/api/staff/services/route.ts` — GET/POST: Staff-service assignment

> ⚠️ **BE CAREFUL**: The invite accept flow must handle both cases: (a) user already has a Solen account → link it, (b) user doesn't → redirect to signup with invite token in URL. After accepting, set `profiles.staff_salon_id` and `staff_members.user_id`.

```bash
npm run build
git add app/api/staff/
git commit -m "phase 8: staff invite, accept, schedule, service assignment API"
```

### Phase 9: Scheduling & Walk-in API

[NEW] `app/api/salon/closures/route.ts` — GET/POST/DELETE
[NEW] `app/api/staff/breaks/route.ts` — GET/POST/DELETE
[NEW] `app/api/staff/time-off/route.ts` — GET/POST/DELETE
[NEW] `app/api/bookings/walk-in/route.ts` — POST: Create walk-in + send SMS via seven.io
[NEW] `app/api/bookings/walk-in-verify/route.ts` — GET: Validates HMAC token, returns booking data
[NEW] `app/[locale]/walk-in-pay/page.tsx` — PUBLIC page with Stripe Elements (NOT an API route)

> ⚠️ **FIX**: Walk-in payment is a PAGE (shows Stripe card form), NOT an API route. Next.js API routes can't render React. The page reads `?token=xxx` → calls `walk-in-verify` API → shows payment form.

SMS message for walk-in: `"Dein Termin bei {salon}: {service} um {time}. Bezahle hier: https://www.solen.ch/walk-in-pay?token={token}"`

Walk-in bookings: `paid_via: 'walk_in'`, `payment_status: 'pending'`. Auto-complete cron skips walk-ins still pending. Release-payments cron skips walk-ins entirely.

> ⚠️ **BE CAREFUL**: `walk-in-pay` page is PUBLIC (no auth). `walk-in-verify` API uses HMAC token validation with `BOOKING_HMAC_SECRET`. Rate limit by IP. Token format: `HMAC(booking_id:expiry, secret)`. Validate token before showing payment form.

```bash
npm run build
git add app/api/salon/ app/api/staff/ app/api/bookings/walk-in* app/[locale]/walk-in-pay/
git commit -m "phase 9: closures, breaks, time-off, walk-in booking + payment page"
```

### Phase 10: Booking Flow API (Group, Packages)

> Guest booking already handled in Phase 6 `bookings/route.ts`.

[NEW] `app/api/bookings/group/route.ts` — POST: Uses `create_group_booking` RPC for atomicity
[NEW] `app/api/packages/route.ts` — GET (public for active)/POST (salon owner)
[NEW] `app/api/packages/purchase/route.ts` — POST: Buy package via Stripe
[NEW] `app/api/packages/redeem/route.ts` — POST: Redeem (check `expires_at`)
[NEW] `app/[locale]/salon/[slug]/packages/page.tsx` — Customer-facing package purchase page

Gift card + referral stacking rules: referral discount first (%) → gift card (CHF) → floor at 0.
Self-referral blocked: `referrals.user_id != currentUserId`.
Package expiry enforced: `.or('expires_at.is.null,expires_at.gt.now()')`.

```bash
npm run build
git add app/api/bookings/group/ app/api/packages/ app/[locale]/salon/
git commit -m "phase 10: group booking (atomic RPC), packages API + purchase page"
```

### Phase 11: Quick-Actions, CRM API

[NEW] `app/api/bookings/[id]/quick-action/route.ts` — GET: HMAC-tokenized one-click confirm/cancel
[NEW] `app/[locale]/booking-action/page.tsx` — Page that renders quick-action result (not just API)

> ⚠️ **BE CAREFUL**: Quick-action uses HMAC tokens with `BOOKING_HMAC_SECRET` env var. Token format: `HMAC(booking_id:action:expiry, secret)`. Verify env var exists before using.

[NEW] `app/api/clients/[id]/formulas/route.ts` — GET/POST
[NEW] `app/api/clients/[id]/photos/route.ts` — GET/POST (Supabase Storage `client-photos`)
[NEW] `app/api/clients/[id]/intake/route.ts` — GET/POST
[NEW] `app/api/intake/templates/route.ts` — GET: Returns templates from `lib/intake-templates.ts`
[NEW] `app/api/ai/intake-recommendation/route.ts` — POST: Gemini AI recommendation
[NEW] `app/api/services/[id]/photos/route.ts` — POST: Upload service photos to `service-photos` bucket

```bash
npm run build
git add app/api/bookings/ app/api/clients/ app/api/intake/ app/api/ai/ app/api/services/ app/[locale]/booking-action/
git commit -m "phase 11: quick-actions + CRM + AI intake + service photo upload API"
```

### Phase 12: Tips, Gift Cards, Referrals API

[NEW] `app/api/tips/route.ts` — POST: Tokenized tip payment (public)
[NEW] `app/api/gift-cards/purchase/route.ts` — POST: Buy + email delivery
[NEW] `app/api/gift-cards/redeem/route.ts` — POST: Deduct at checkout
[NEW] `app/api/gift-cards/balance/route.ts` — GET: Check balance (rate limited: 5/min/IP)
[MODIFY] `app/api/referral/route.ts` — Extend existing route to support code generation + max_uses (D5)
[NEW] `app/api/referral/validate/route.ts` — GET: Check code validity

**Gift card + referral stacking rules:**
1. Apply referral discount first (percentage-based, e.g. 10%)
2. Apply gift card (reduces remaining CHF amount)
3. Floor at CHF 0 — if fully covered, skip Stripe checkout

**Self-referral prevention:**
```typescript
if (referralCode.user_id === currentUserId) {
  return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
}
```

Gift cards: `nanoid(12)` uppercase alphanumeric (NOT 8 — too short for brute-force safety). Rate limit balance check: max 5 per IP per minute.

```bash
npm run build
git add app/api/tips/ app/api/gift-cards/ app/api/referral/
git commit -m "phase 12: tips, gift cards, extend referral system"
```

### Phase 13: Cron Jobs + Analytics API

[NEW] `app/api/cron/auto-complete/route.ts` — Every 15min.
```sql
-- Must exclude walk-ins still pending + bookings with pending disputes:
WHERE ends_at < now()
  AND status = 'confirmed'
  AND payment_status != 'pending'
  AND paid_via != 'walk_in'
  AND id NOT IN (SELECT booking_id FROM price_disputes WHERE status = 'pending')
  AND salon_id IN (SELECT id FROM salons WHERE auto_complete_enabled = true)
```

[NEW] `app/api/cron/release-payments/route.ts` — Every hour. Capture PaymentIntents 24h after completion.
```typescript
// Destination charges: capture triggers automatic transfer to connected account
// application_fee_amount is our cut, kept on platform
await stripe.paymentIntents.capture(booking.payment_intent_id);
// Log the action for audit trail
await supabase.from('audit_log').insert({ action: 'payment_released', target_id: booking.id, metadata: { amount } });
```

[NEW] `app/api/cron/pre-charge/route.ts` — Daily. Charge saved cards 5 days before appointment. Finds bookings where `payment_status = 'card_saved'` AND `starts_at < now() + 5 days`. Creates PaymentIntent from saved payment method → charges card → updates `payment_status: 'paid'`. Sends confirmation email. Must handle card decline gracefully and notify customer.

[NEW] `app/api/cron/birthday-messages/route.ts` — Daily 8am CET. **Must use Swiss timezone:**
```sql
WHERE EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM (now() AT TIME ZONE 'Europe/Zurich'))
  AND EXTRACT(DAY FROM birthday) = EXTRACT(DAY FROM (now() AT TIME ZONE 'Europe/Zurich'))
```

[NEW] `app/api/cron/generate-slots/route.ts` — Nightly. **Bridges `staff_schedules` → `availability_slots`** (critical — without this, schedule system is disconnected from booking):
1. Read `staff_schedules` → get working hours per staff per day
2. Read `salon_closures` → exclude closure dates
3. Read `staff_breaks` → exclude break windows
4. Read `staff_time_off` → exclude vacation dates
5. Generate `availability_slots` for the next 30 days
6. Respect `services.buffer_minutes`, `processing_minutes`, `finishing_minutes`

[MODIFY] `app/api/cron/review-prompt/route.ts` — 4-5 star → schedule Google review push.
[MODIFY] `app/api/analytics/salon/[id]/route.ts` — Add: `peak_hours_heatmap` (7×12 grid, shape: `{ day: number, hour: number, count: number }[]`), `cancellation_rate`, `no_show_rate`, `popular_services` (top 5), `retention_rate` (re-booking within 60 days), `new_vs_returning`, `acquisition_sources`.
[NEW] `app/api/analytics/staff/[id]/route.ts` — Per-stylist: bookings count, revenue, average rating, retention rate.
[NEW] `app/api/analytics/staff-comparison/route.ts` — All staff stats for comparison chart.
[NEW] `app/api/analytics/gift-card-revenue/route.ts` — Gift card + referral revenue aggregation.

All crons: `CRON_SECRET` header check (copy from `api/cron/reminders`).

> ⚠️ **BE CAREFUL**: The `release-payments` cron handles real money — log every action to `audit_log`. The `pre-charge` cron handles card-on-file — must handle `PaymentIntent` failures (card declined) gracefully and notify customer. The `generate-slots` cron is critical — if it doesn't run, the booking calendar shows no slots.

```bash
npm run build
git add app/api/cron/ app/api/analytics/
git commit -m "phase 13: crons (auto-complete, release, pre-charge, birthday, slots) + analytics"
```

---

## Phases 14-25: UI — Continued in next section below

> File continues with UI phases. This is a single file, not split.

---

## Phase 14: UI — Booking Flow

### 14.1 [MODIFY] `components/BookingCalendar.tsx` (20KB — read fully first)

- After slot selection → show Stripe Elements card form (inline, NOT redirect)
- Duration display: "14:00 · 45 Min" next to each slot
- Acquisition source dropdown at bottom: "Wie hast du von uns erfahren?"
- If unauthenticated → show `GuestBookingForm` (NOT redirect to login)
- If active package → show `PackageRedeemBanner`
- Gift card + referral code inputs in checkout summary
- Cancellation policy text: `"Kostenlose Stornierung bis {cancelWindowHours}h vorher. Danach werden {cancelFeePercent}% einbehalten."`
- If booking >7 days → show SetupIntent form ("Karte speichern")

**Stripe Elements integration:**
```typescript
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
```

Install: `npm install @stripe/react-stripe-js @stripe/stripe-js` (check if already in package.json first)

#### ✅ DO:
```tsx
// Create payment intent FIRST, then show the form
const res = await fetch('/api/stripe/create-payment-intent', { method: 'POST', body: JSON.stringify({ slot_id, service_id }) });
const { client_secret } = await res.json();
// Then render <Elements stripe={stripePromise} options={{ clientSecret: client_secret }}>
```

#### ❌ DON'T:
```tsx
// DON'T confirm booking BEFORE payment
await fetch('/api/bookings', { method: 'POST', body: JSON.stringify({ slot_id }) }); // Creates booking without payment!
```

> ⚠️ **BE CAREFUL**: Read the existing `BookingCalendar.tsx` fully before editing. Keep ALL existing functionality (staff picker, date picker, slot groups, waitlist). ADD the Stripe checkout step as a new "state" after slot selection. Do NOT remove the existing `handleConfirm` — wrap it to include payment.

### 14.2 [NEW] `components/booking/GuestBookingForm.tsx`

Inline form shown when user is unauthenticated:
- Name input (required)
- Phone input with `+41` prefix (required, Swiss format validation: `/^\+41[0-9]{9}$/`)
- Email input (optional)
- Styled with `rounded-card`, `border-s-ink/5`, matching existing BookingCalendar design
- Submit calls `bookings/route.ts` POST without auth → `guestBookingSchema` validation

### 14.3 [NEW] `components/booking/ServiceCart.tsx` — Multi-service cart

- List of selected services with name, price, duration
- Add-on checkboxes per service (from `service_addons` table)
- Running total (CHF) and total duration
- Stylist name (same stylist for all services)
- Gift card / referral code inputs
- "Bezahlen & Buchen" CTA button

### 14.4 [NEW] `components/booking/GroupBookingModal.tsx`

- Group size selector (2-20)
- Event type dropdown (Hochzeit, Geburtstag, Firma, Andere)
- Dynamic member rows: name + service dropdown + optional stylist
- Combined total price + single Stripe checkout for organizer

### 14.5 [NEW] `components/booking/PackageRedeemBanner.tsx`

- "Du hast noch 3 von 5 Terminen in deinem Paket «5x Haarschnitt»"
- "Jetzt einlösen" button → skips Stripe, calls `/api/packages/redeem`

### 14.6 [NEW] `components/dashboard/PriceAdjustmentModal.tsx`

- Shown in dashboard booking detail (salon owner only)
- New price input + reason textarea
- "Preisänderung anfragen" → calls `/api/bookings/[id]/dispute` (extended)
- Shows current status of pending adjustment

> ⚠️ **BE CAREFUL**: All new components must use design system tokens from `UI_RULES.md`. No `bg-gray-*`, no `text-dark`, no `rounded-lg`. Use `rounded-card`, `text-s-ink`, `bg-s-bg-surface`, etc.

```bash
npm run build
git add components/BookingCalendar.tsx components/booking/ components/dashboard/PriceAdjustmentModal.tsx package.json
git commit -m "phase 14: Stripe checkout, guest form, cart, group modal, package banner"
```

---

## Phase 15: UI — Dashboard Layout + Staff

### 15.1 [MODIFY] `components/dashboard/DashboardLayout.tsx` (12KB — read fully)
- Add sidebar items: 👤 Kunden → `/dashboard/clients`, 📣 Marketing → `/dashboard/marketing`
- Staff role-based visibility:

#### ✅ DO:
```tsx
const isStaff = profile?.staff_salon_id && profile?.role !== 'salon_owner';
const menuItems = isStaff ? STAFF_MENU_ITEMS : OWNER_MENU_ITEMS;
```
Staff sees ONLY: Mein Kalender, Meine Pausen, Mein Portfolio, Mein Profil.

#### ❌ DON'T:
```tsx
if (isStaff) return null; // WRONG — staff can't navigate!
```

> ⚠️ **BE CAREFUL**: Read existing `DashboardLayout.tsx` (12KB) fully. It has animated sidebar, collapse behavior, active route highlighting. ADD items to the existing array, don't rebuild the sidebar.

### 15.2 [MODIFY] `app/[locale]/dashboard/staff/page.tsx`
- "Einladen" button at top → opens invite modal (email + name)
- "Ausstehende Einladungen" section showing pending invites with resend/revoke
- **"Services zuweisen" checkboxes** in staff edit modal: List all salon services with checkboxes → saves to `staff_services` junction table
- **Permission toggles** per staff member:
  - ✅ Kalender bearbeiten (`can_edit_schedule`)
  - ✅ Buchungen sehen (`can_view_own_bookings`)
  - ✅ Portfolio verwalten (`can_manage_portfolio`)

### 15.3 [NEW] `app/[locale]/staff-invite/page.tsx` — Public invite accept page

Shows salon name, role description. "Einladung annehmen" button → creates/links account.

```bash
npm run build
git add components/dashboard/DashboardLayout.tsx app/[locale]/dashboard/staff/ app/[locale]/staff-invite/
git commit -m "phase 15: dashboard sidebar, staff permissions, invite UI"
```

---

## Phase 16: UI — Calendar & Scheduling

### 16.1 [MODIFY] `app/[locale]/dashboard/calendar/page.tsx` (28KB — read fully)
- Add toggle buttons at top: `Tag | Woche | Monat`
- Day view: Single column, hourly rows, all staff side-by-side
- Month view: Grid with dots/counts per day
- Color-coded event left borders by service category: hair=`#E8624A`, nails=`#6BA3C8`, spa=`#7BA688`
- Processing time shown as lighter-opacity band on calendar blocks

> ⚠️ **BE CAREFUL**: The existing calendar page is 28KB. Read it fully to understand the weekly grid structure before adding day/month views. ADD view modes as new render paths, don't replace the weekly view.

### 16.2 [NEW] `components/dashboard/WalkInModal.tsx`

Modal from "Walk-in hinzufügen" button on calendar:
- Customer name + phone inputs
- Service dropdown (from salon's services)
- Stylist dropdown
- "Erstellen & SMS senden" button → calls `/api/bookings/walk-in`
- Shows "Bezahlung ausstehend" badge on calendar card

### 16.3 [NEW] `components/dashboard/ScheduleGrid.tsx` — Staff-facing too (not just owner)

Grid: Mon-Sat rows × Start/End time pickers per staff member. Toggle per day (active/inactive). "Alternierend" checkbox → shows Week A / Week B. Save → calls `/api/staff/my-schedule`.

### 16.4 [NEW] `components/dashboard/ClosureManager.tsx`

In Dashboard Settings → "Feiertage" tab: List of upcoming closures with date range + reason. "Schliessung hinzufügen" → date range picker + reason input. Delete button per closure.

### 16.5 [NEW] `components/dashboard/BreakManager.tsx`

Per-staff member break blocks (day × time). Visual representation on calendar.

```bash
npm run build
git add app/[locale]/dashboard/calendar/ components/dashboard/
git commit -m "phase 16: calendar views, walk-in modal, schedule grid, closures, breaks"
```

---

## Phase 17: UI — Client CRM Page

### 17.1 [NEW] `app/[locale]/dashboard/clients/page.tsx`

- Search bar (by name, phone, email)
- Client list cards: avatar, name, last visit date, total bookings, tags
- Click → client detail view with tabs:
  - **Termine**: Booking history (from existing bookings data)
  - **Formeln** → FormulaTab: Table of color formulas + "Neue Formel" form
  - **Fotos** → ClientPhotosTab: Before/after photo pairs + "Auf Discovery veröffentlichen?" toggle
  - **Notizen**: Existing `client_notes` already works
  - **Tags**: Existing `client_tags` already works
  - **Fragebogen** → IntakeFormTab: Templates + Gemini recommendation

### 17.2 [NEW] `components/dashboard/FormulaTab.tsx`
### 17.3 [NEW] `components/dashboard/ClientPhotosTab.tsx` — Before/after + discovery publish toggle
### 17.4 [NEW] `components/dashboard/IntakeFormTab.tsx`

- Template selector dropdown (Hair/Nails/Waxing/Makeup/Spa)
- Dynamic form fields from `lib/intake-templates.ts`
- "Empfehlung generieren" button → sends responses to Gemini API → shows AI-generated recommendation
- Save form + recommendation

> ⚠️ **BE CAREFUL**: Gemini integration already exists in the codebase (`lib/ai-vision.ts`). Use the same API key and pattern. Rate limit AI calls.

```bash
npm run build
git add app/[locale]/dashboard/clients/ components/dashboard/
git commit -m "phase 17: client CRM page with formula, photos, intake form tabs"
```

---

## Phase 18: UI — Tip Page + Gift Cards

### 18.1 [NEW] `app/[locale]/tip/[bookingId]/page.tsx`

Public tokenized page (no login required). Shows:
- Stylist photo + name
- Service that was done
- Preset tip buttons: CHF 5 | CHF 10 | CHF 15 | Eigener Betrag
- Stripe Elements for card payment
- Thank you animation after payment

### 18.2 [NEW] `app/[locale]/salon/[slug]/gift-card/page.tsx`

Within salon profile context:
- Amount selector: CHF 25 | 50 | 100 | 200 | Eigener Betrag
- Recipient name + email
- Personal message (optional)
- Preview of what the email will look like
- Stripe checkout

### 18.3 [NEW] `components/dashboard/GiftCardManager.tsx`

In Marketing dashboard: List of sold gift cards (code, amount, remaining balance, purchaser, recipient, status). Total revenue from gift cards.

```bash
npm run build
git add app/[locale]/tip/ app/[locale]/salon/ components/dashboard/GiftCardManager.tsx
git commit -m "phase 18: tip page, gift card purchase, gift card dashboard"
```

---

## Phase 19: UI — Analytics Expansion

### 19.1 [MODIFY] `app/[locale]/dashboard/analytics/page.tsx` — Add tabs: Übersicht | Termine | Kunden | Services | Team
### 19.2 [NEW] `components/dashboard/HeatmapChart.tsx`

7×12 grid (Mon-Sun × 8AM-8PM). Cell color intensity = booking density. Built with CSS grid + dynamic `bg-s-coral/[opacity]`.

### 19.3 [NEW] `components/dashboard/StaffComparison.tsx`

Table + bar chart combo. Columns: Stylist | Termine | Umsatz | Bewertung | Retention. Toggle between table and chart view.

In Kunden tab: Pie chart of "Wie hast du von uns erfahren?" responses. Bar chart of UTM sources.

### 19.4 [MODIFY] `app/[locale]/dashboard/revenue/page.tsx`

Add sections:
- Commission per stylist table (Stylist | Buchungen | Umsatz | Provision % | Provision CHF | Trinkgeld)
- Gift card revenue summary
- Tips received summary

```bash
npm run build
git add app/[locale]/dashboard/analytics/ app/[locale]/dashboard/revenue/ components/dashboard/
git commit -m "phase 19: heatmap, staff comparison, acquisition sources, revenue commissions"
```

---

## Phase 20: UI — Marketing Dashboard

### 20.1 [NEW] `app/[locale]/dashboard/marketing/page.tsx`

Hub page with cards linking to sub-sections: Pakete, Geschenkkarten, Empfehlungen, Aktionen (existing PromoManager).

### 20.2 [NEW] `components/dashboard/PackageManager.tsx`

- List of packages: name, service, sessions, price, active/inactive
- "Neues Paket" form: service selector, sessions count, bonus sessions, price
- Purchases overview: who bought, sessions used/remaining

### 20.3 [NEW] `components/dashboard/ReferralDashboard.tsx` — Salon-owner referral stats (total referrals, revenue)
### 20.4 [MODIFY] `components/ProfilePage.tsx` (29KB — read fully, two phases edit this)

Customer view: "Freunde einladen" section with personal referral code, share buttons (WhatsApp, SMS, Copy), reward tracking ("Du hast CHF 20 verdient"). **Auto-generate referral code on first view** if user doesn't have one (call `api/referral` automatically).

```bash
npm run build
git add app/[locale]/dashboard/marketing/ components/dashboard/ components/ProfilePage.tsx
git commit -m "phase 20: marketing dashboard, package manager, referral UI"
```

---

## Phase 21: UI — Services & Settings

### 21.1 [MODIFY] Service edit form (find actual file path first: `grep -r "services" app/[locale]/dashboard/`)
- Photo upload (up to 3 per service) → Supabase Storage `service-photos`
- Buffer minutes input ("Aufbauzeit")
- Processing minutes input ("Einwirkzeit")
- Finishing minutes input ("Nachbereitung")
- Daily limit per staff input

### 21.2 [MODIFY] `app/[locale]/dashboard/settings/page.tsx` (42KB — read fully)

ADD tabs/sections:
- **Stornierung**: Cancellation fee percent slider + cancellation window hours input
- **Feiertage**: ClosureManager component
- **Terminvergabe**: Auto-assign method dropdown + "Tägliches Limit" toggle
- **Stripe**: Connect status + connect/disconnect button
- **Team / Provision**: Commission % input per stylist (flat %). Used by `lib/commission-calculator.ts`.

> ⚠️ **BE CAREFUL**: Settings page is already 42KB. Read completely before modifying. ADD new tabs to the existing tab system, don't restructure.

```bash
npm run build
git add app/[locale]/dashboard/services/ app/[locale]/dashboard/settings/
git commit -m "phase 21: service photos, time fields, settings expansion"
```

---

## Phase 22: UI — Salon Profile Enhancements

### 22.1 [MODIFY] Salon profile page (`app/[locale]/salon/[slug]/page.tsx`)
- Pakete section + "Kaufen" button
- Gift card card → link to gift card page
- Service photo carousel
- Staff ratings (★ 4.8 (23))
- Duration display next to prices

```bash
npm run build
git add app/[locale]/salon/
git commit -m "phase 22: salon profile packages, gift cards, photos, ratings"
```

---

## Phase 23: Email Templates

### [MODIFY] `lib/email.ts`

**Add `it` to EmailLocale** (D9): `export type EmailLocale = "de" | "en" | "fr" | "it";`

Add new templates (with full signatures):
- `walkInPaymentEmail(customerName, salonName, serviceName, paymentUrl, amount)`
- `tipPromptEmail(customerName, stylistName, stylistPhoto, tipUrl)`
- `birthdayEmail(customerName, salonName)`
- `giftCardDeliveryEmail(recipientName, senderName, amount, code, qrCodeUrl, message)`
- `priceAdjustmentEmail(customerName, salonName, originalAmount, newAmount, acceptUrl, disputeUrl)`
- `staffInviteEmail(staffName, salonName, acceptUrl)`
- `preChargeNotificationEmail(customerName, salonName, amount, appointmentDate)`

Modify existing:
- `bookingConfirmationEmail` (add payment receipt: amount, cancellation policy, last 4 digits)
- `reminderEmail` (add one-click action buttons: Bestätigen | Verschieben | Stornieren)
- `reviewPromptEmail` (Google review push link for 4-5 stars)

Add Italian variants to ALL templates (new + existing 14 templates).

> ⚠️ **BE CAREFUL**: Existing email templates in `lib/email.ts` (21KB) are actively used. Do NOT change existing template function signatures. Only ADD new functions. All emails must support 4 locales (de, en, fr, it) using translation keys from `messages/`.

```bash
npm run build
git add lib/email.ts
git commit -m "phase 23: email templates + Italian locale support"
```

---

## Phase 23.5: Translations

### [MODIFY] `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`

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

> ⚠️ **BE CAREFUL**: German (de) is the primary locale. English (en) is secondary. French (fr) and Italian (it) can use machine-translated versions initially. Keep existing keys exactly — only ADD new ones.

```bash
npm run build
git add messages/
git commit -m "phase 23.5: translation keys for all megabuild features (4 locales)"
```

---

## Phase 24: BookingSuccess + Profile Updates

### 24.1 [MODIFY] `components/BookingSuccess.tsx`
- Payment receipt (amount, last 4 digits)
- Cancellation policy reminder
- "Termin zum Kalender hinzufügen" (.ics download via `lib/ics-generator.ts`)
- Referral CTA

### 24.2 [MODIFY] `components/ProfilePage.tsx` (second edit — check Phase 20 changes first)
- Birthday input
- "Meine Fragebögen", "Meine Pakete", "Meine Geschenkkarten" sections

```bash
npm run build
git add components/BookingSuccess.tsx components/ProfilePage.tsx
git commit -m "phase 24: BookingSuccess receipt + ProfilePage packages, gift cards, birthday"
```

---

## Phase 25: CLAUDE.md + .env.example Update

### [MODIFY] `CLAUDE.md`
- §2: Add `@stripe/react-stripe-js`, `@stripe/stripe-js`, `nanoid`
- §3.5: Add features 25-35:
  - 25\. Prepaid Booking (Stripe Connect, configurable fee, hold-and-release)
  - 26\. Staff Accounts (invite-based, limited dashboard)
  - 27\. Guest Booking (no account required)
  - 28\. Walk-in Mode (SMS payment links)
  - 29\. Service Packages (punch cards)
  - 30\. Digital Gift Cards (per-salon)
  - 31\. Tip System (post-service)
  - 32\. Group Bookings
  - 33\. Client CRM (formulas, intake forms, photos)
  - 34\. Referral Program
  - 35\. Advanced Analytics (heatmap, staff comparison, acquisition tracking)
- §6: Add all new tables to the schema table
- §11: Note all new routes follow security stack

### [MODIFY] `.env.example`
- Verify all 4 new env vars are listed

```bash
npm run build && npx tsc --noEmit
git add CLAUDE.md .env.example
git commit -m "phase 25: update CLAUDE.md with all megabuild features + tables"
```

---

## DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Manual A | 🧑 | Stripe Connect config | Nothing |
| Manual B | 🧑 | Supabase storage buckets | Nothing |
| Manual C | 🧑 | seven.io verification | Nothing |
| Manual D | 🧑 | Vercel env vars | Manual A |
| Manual E | 🧑 | Install nanoid | Nothing |
| Phase 1 | 🤖 | DB: extend salons, bookings, disputes, webhook_events | Nothing |
| Phase 2 | 🤖 | DB: staff invites + staff_services | Nothing |
| Phase 3 | 🤖 | DB: scheduling tables | Nothing |
| Phase 4 | 🤖 | DB: booking/CRM/payment tables, extend referrals, group RPC | Phase 1 |
| Phase 5 | 🤖 | Types + validations + utils | Phases 1-4 |
| Phase 6 | 🤖 | Stripe prepaid + guest booking (modify existing) | Phase 1, 5, Manual A+D+E |
| Phase 7 | 🤖 | Cancel + refund + extend disputes | Phase 1, 5, 6 |
| Phase 8 | 🤖 | Staff system API | Phase 2, 5 |
| Phase 9 | 🤖 | Scheduling + walk-in (page + API) | Phase 3, 5, Manual C+D |
| Phase 10 | 🤖 | Group (RPC) + packages API + page | Phase 4, 5 |
| Phase 11 | 🤖 | Quick-actions + CRM + AI intake + service photos | Phase 4, 5, Manual B |
| Phase 12 | 🤖 | Tips, gift cards, extend referrals | Phase 4, 5, Manual E |
| Phase 13 | 🤖 | Crons (5) + analytics (4) | Phases 1-12 |
| Phase 14 | 🤖 | UI: BookingCalendar + checkout | Phase 6, 7 |
| Phase 15 | 🤖 | UI: Dashboard + staff permissions | Phase 8 |
| Phase 16 | 🤖 | UI: Calendar views + scheduling | Phase 9 |
| Phase 17 | 🤖 | UI: Client CRM | Phase 11 |
| Phase 18 | 🤖 | UI: Tips + gift cards | Phase 12 |
| Phase 19 | 🤖 | UI: Analytics + revenue | Phase 13 |
| Phase 20 | 🤖 | UI: Marketing + referral | Phase 12 |
| Phase 21 | 🤖 | UI: Services + settings | Phase 3, 4 |
| Phase 22 | 🤖 | UI: Salon profile | Phases 14-21 |
| Phase 23 | 🤖 | Email templates + Italian | Phases 6-12 |
| Phase 23.5 | 🤖 | Translations (4 locales) | Phases 14-22 |
| Phase 24 | 🤖 | UI: BookingSuccess + profile | Phases 14, 20 |
| Phase 25 | 🤖 | CLAUDE.md + .env.example | ALL |
| Manual F | 🧑 | Google Reserve application | Phase 13 |
| Manual G | 🧑 | E2E testing | ALL |

---

## FILE MANIFEST

**New files: ~75** | **Modified files: ~25** | **Total: ~100**

### New Pages (8)
- `app/[locale]/walk-in-pay/page.tsx`, `app/[locale]/tip/[bookingId]/page.tsx`
- `app/[locale]/salon/[slug]/gift-card/page.tsx`, `app/[locale]/salon/[slug]/packages/page.tsx`
- `app/[locale]/dashboard/clients/page.tsx`, `app/[locale]/dashboard/marketing/page.tsx`
- `app/[locale]/staff-invite/page.tsx`, `app/[locale]/booking-action/page.tsx`
- `app/[locale]/bookings/[id]/respond-adjustment/page.tsx`

### New Components (18)
- `components/booking/` — GuestBookingForm, ServiceCart, GroupBookingModal, PackageRedeemBanner
- `components/dashboard/` — WalkInModal, ScheduleGrid, ClosureManager, BreakManager, FormulaTab, ClientPhotosTab, IntakeFormTab, GiftCardManager, PackageManager, ReferralDashboard, HeatmapChart, StaffComparison, PriceAdjustmentModal

### New API Routes (~35)
- Stripe: `save-card`, `create-customer`
- Bookings: `walk-in`, `walk-in-verify`, `group`, `[id]/refund`, `[id]/quick-action`
- Staff: `invite`, `accept-invite`, `my-schedule`, `services`, `breaks`, `time-off`
- Salon: `closures`
- Packages: `route`, `purchase`, `redeem`
- Clients: `[id]/formulas`, `[id]/photos`, `[id]/intake`
- Intake: `templates`
- AI: `intake-recommendation`
- Services: `[id]/photos`
- Tips: `route`
- Gift Cards: `purchase`, `redeem`, `balance`
- Referral: `validate`
- Cron: `auto-complete`, `release-payments`, `pre-charge`, `birthday-messages`, `generate-slots`
- Analytics: `staff/[id]`, `staff-comparison`, `gift-card-revenue`

### New Lib Files (4)
- `lib/cancellation-policy.ts`, `lib/commission-calculator.ts`, `lib/intake-templates.ts`, `lib/ics-generator.ts`

### New Migrations (4)
- `XXX_megabuild_foundation.sql`, `XXX_megabuild_staff.sql`, `XXX_megabuild_scheduling.sql`, `XXX_megabuild_booking_crm_payments.sql`

### Modified Files (~25)
- `lib/types.ts`, `lib/validations.ts`, `lib/email.ts`
- `components/BookingCalendar.tsx`, `components/BookingSuccess.tsx`, `components/ProfilePage.tsx`
- `components/dashboard/DashboardLayout.tsx`
- Dashboard pages: `staff`, `services`, `settings`, `calendar`, `analytics`, `revenue`
- `app/api/bookings/route.ts`, `app/api/bookings/[id]/cancel/route.ts`, `app/api/bookings/[id]/dispute/route.ts`
- `app/api/stripe/create-payment-intent/route.ts`, `app/api/stripe/webhook/route.ts`
- `app/api/referral/route.ts`
- `app/api/cron/review-prompt/route.ts`, `app/api/analytics/salon/[id]/route.ts`
- `messages/de.json`, `en.json`, `fr.json`, `it.json`
- `CLAUDE.md`, `.env.example`
