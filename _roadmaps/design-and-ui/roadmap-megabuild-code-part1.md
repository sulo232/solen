# 🤖 Solen.ch Feature Mega-Build — CLAUDE CODE ROADMAP (Part 1: Phases 1-13)

> **AUTONOMOUS EXECUTION — No human input required.**
> Prerequisite: ALL manual steps in `_tasks/roadmap-megabuild-manual.md` completed first.
> Execute phases in order. One commit per sub-phase. `npm run build` must pass before every commit.

---

## BREAKAGE RISK ASSESSMENT (R1)

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| P1-4 (DB Migrations) | 🟡 MEDIUM | Existing queries if column names conflict | Run migrations in order. Check existing columns first. |
| P5 (Types/Validations) | 🟢 SAFE | Nothing (additive only) | — |
| P6 (Stripe Prepaid) | 🔴 HIGH | **Entire booking flow** | Keep old booking flow working. New flow behind feature flag. |
| P7 (Cancel/Refund) | 🔴 HIGH | Existing cancel route | Backwards-compatible: check if payment exists before refunding. |
| P8 (Staff System) | 🟢 SAFE | Nothing (new routes only) | — |
| P9 (Scheduling) | 🟢 SAFE | Nothing (new routes only) | — |
| P10 (Booking Flow) | 🟡 MEDIUM | BookingCalendar.tsx | Keep existing flow, add cart as enhancement. |
| P11 (Reminders/CRM) | 🟢 SAFE | Nothing (new routes only) | — |
| P12 (Payments) | 🟡 MEDIUM | Stripe webhook handler | Add new events, don't remove existing handlers. |
| P13 (Crons) | 🟢 SAFE | Nothing (new crons only) | — |
| P14 (Analytics) | 🟢 SAFE | Nothing (additive) | — |
| P15-25 (UI) | 🟡 MEDIUM | BookingCalendar, DashboardLayout | Read existing code first. Modify, don't replace. |

---

## Phase 1: Database Migration — Foundation Tables

### 1.1 Modify `salons` table

#### [NEW] `supabase/migrations/XXX_megabuild_salons.sql`

```sql
-- Add Stripe Connect + policy columns to salons
ALTER TABLE salons ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_fee_percent INTEGER DEFAULT 30;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_window_hours INTEGER DEFAULT 24;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS auto_assign_method TEXT DEFAULT 'least_booked_week'
  CHECK (auto_assign_method IN ('least_booked_week','least_booked_today','round_robin','manual_priority'));
ALTER TABLE salons ADD COLUMN IF NOT EXISTS auto_complete_enabled BOOLEAN DEFAULT true;
```

### 1.2 Modify `bookings` table

#### [MODIFY] Same migration file

```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
  CHECK (payment_status IN ('pending','card_saved','paid','refunded','partially_refunded','disputed'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_setup_intent_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_amount INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refunded_amount INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_booking_id UUID;
-- NOTE: group_booking_id FK is added LATER in Phase 4 after group_bookings table exists
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_via TEXT DEFAULT 'stripe'
  CHECK (paid_via IN ('stripe','package','gift_card','walk_in'));
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS acquisition_source TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Webhook idempotency table (prevents replay attacks)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
```

### 1.3 Create `price_adjustments` table

```sql
CREATE TABLE IF NOT EXISTS price_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) NOT NULL,
  salon_id UUID NOT NULL,
  original_amount INTEGER NOT NULL,
  requested_amount INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','disputed','expired')),
  customer_responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE price_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_adj_salon_read" ON price_adjustments FOR SELECT USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  OR booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
);
CREATE POLICY "price_adj_salon_insert" ON price_adjustments FOR INSERT WITH CHECK (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);
CREATE POLICY "price_adj_customer_update" ON price_adjustments FOR UPDATE USING (
  booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
);
```

#### ✅ DO:
```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
```
#### ❌ DON'T:
```sql
ALTER TABLE salons ADD COLUMN stripe_account_id TEXT; -- Fails if column already exists!
```

> ⚠️ **BE CAREFUL**: Always use `IF NOT EXISTS` for ADD COLUMN. Check `lib/types.ts` Salon interface — it does NOT have these new fields yet (that's Phase 5). Do NOT update types.ts in this phase. Migration must be idempotent.

#### Verification:
```bash
# Apply migration via Supabase CLI or dashboard
# Then verify:
npm run build
git add supabase/migrations/
git commit -m "phase 1: add payment + policy columns to salons and bookings, create price_adjustments table"
```

---

## Phase 2: Database Migration — Staff System

### 2.1 Create `staff_invites` + modify `staff_members` and `profiles`

#### [NEW] `supabase/migrations/XXX_megabuild_staff.sql`

```sql
-- Staff invites
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

-- Staff member enhancements
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS can_edit_schedule BOOLEAN DEFAULT true;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS can_view_own_bookings BOOLEAN DEFAULT true;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS can_manage_portfolio BOOLEAN DEFAULT true;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Profile enhancements
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS staff_salon_id UUID;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birthday DATE;

-- Staff-service assignment junction table
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

> ⚠️ **BE CAREFUL**: `staff_members` already exists with `id, salon_id, name, avatar_url, specialties, is_active`. Do NOT recreate it. Only ADD columns. The `user_id` column does NOT reference `auth.users(id)` with a FK because Supabase auth schema isn't directly referenceable in all setups — store the UUID and validate in application code.

#### Verification:
```bash
npm run build
git add supabase/migrations/
git commit -m "phase 2: create staff_invites, staff_services tables, add staff/profile columns"
```

---

## Phase 3: Database Migration — Scheduling Tables

### 3.1 Staff schedules, closures, breaks, time off

#### [NEW] `supabase/migrations/XXX_megabuild_scheduling.sql`

```sql
CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
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
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE salon_closures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "closures_salon_manage" ON salon_closures FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);
CREATE POLICY "closures_public_read" ON salon_closures FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS staff_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID NOT NULL,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT DEFAULT 'break',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE staff_breaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "breaks_manage" ON staff_breaks FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  OR staff_member_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS staff_time_off (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  approved_by UUID,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE staff_time_off ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeoff_manage" ON staff_time_off FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  OR staff_member_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid())
);
```

> ⚠️ **BE CAREFUL**: `day_of_week` uses 0=Monday, 6=Sunday (ISO standard). JavaScript's `Date.getDay()` uses 0=Sunday. Convert in application code: `(jsDay + 6) % 7`.

#### Verification:
```bash
npm run build
git add supabase/migrations/
git commit -m "phase 3: create staff_schedules, salon_closures, staff_breaks, staff_time_off tables"
```

---

## Phase 4: Database Migration — Booking, CRM, Payment Tables

### 4.1 Booking flow tables

#### [NEW] `supabase/migrations/XXX_megabuild_booking_crm_payments.sql`

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
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  account_created BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE guest_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guest_salon_read" ON guest_bookings FOR SELECT USING (
  booking_id IN (SELECT id FROM bookings WHERE salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()))
);

-- Group bookings
CREATE TABLE IF NOT EXISTS group_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_user_id UUID,
  organizer_name TEXT NOT NULL,
  organizer_phone TEXT,
  salon_id UUID REFERENCES salons(id) NOT NULL,
  group_size INTEGER NOT NULL,
  event_type TEXT CHECK (event_type IN ('bridal','birthday','corporate','other')),
  notes TEXT,
  stripe_payment_intent_id TEXT,
  total_amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE group_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "group_organizer_read" ON group_bookings FOR SELECT USING (
  organizer_user_id = auth.uid()
  OR salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);

-- Add FK to bookings (deferred from Phase 1 — table didn't exist yet)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_group_booking'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT fk_group_booking
      FOREIGN KEY (group_booking_id) REFERENCES group_bookings(id);
  END IF;
END $$;

-- Service packages (punch cards)
CREATE TABLE IF NOT EXISTS service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  name TEXT NOT NULL,
  total_sessions INTEGER NOT NULL,
  bonus_sessions INTEGER DEFAULT 0,
  price INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages_public_read" ON service_packages FOR SELECT USING (is_active = true);
CREATE POLICY "packages_salon_manage" ON service_packages FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS package_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES service_packages(id) NOT NULL,
  user_id UUID NOT NULL,
  salon_id UUID NOT NULL,
  sessions_total INTEGER NOT NULL,
  sessions_used INTEGER DEFAULT 0,
  stripe_payment_intent_id TEXT,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
ALTER TABLE package_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases_own_read" ON package_purchases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "purchases_salon_read" ON package_purchases FOR SELECT USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);

-- CRM tables
CREATE TABLE IF NOT EXISTS client_formulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  brand TEXT,
  product_line TEXT,
  mix_formula TEXT NOT NULL,
  developer_volume TEXT,
  processing_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE client_formulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "formulas_salon_manage" ON client_formulas FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS intake_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  template_key TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  ai_recommendation TEXT,
  filled_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE intake_form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intake_salon_manage" ON intake_form_responses FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);
CREATE POLICY "intake_customer_read" ON intake_form_responses FOR SELECT USING (customer_id = auth.uid());

CREATE TABLE IF NOT EXISTS client_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  photo_url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('before','after','progress')),
  published_to_discovery BOOLEAN DEFAULT false,
  discovery_item_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE client_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_salon_manage" ON client_photos FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);

-- Payment tables
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) NOT NULL,
  staff_member_id UUID REFERENCES staff_members(id),
  salon_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tips_salon_read" ON tips FOR SELECT USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  code TEXT UNIQUE NOT NULL,
  original_amount INTEGER NOT NULL,
  remaining_amount INTEGER NOT NULL,
  purchaser_user_id UUID,
  purchaser_email TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  stripe_payment_intent_id TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gc_public_check" ON gift_cards FOR SELECT USING (true);
CREATE POLICY "gc_salon_manage" ON gift_cards FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
);

-- Referral tables
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT UNIQUE NOT NULL,
  reward_amount INTEGER DEFAULT 1000,
  uses INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_own" ON referral_codes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "referral_public_check" ON referral_codes FOR SELECT USING (is_active = true);

CREATE TABLE IF NOT EXISTS referral_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID REFERENCES referral_codes(id),
  referred_user_id UUID NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  reward_given BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE referral_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redemptions_own" ON referral_redemptions FOR SELECT USING (referred_user_id = auth.uid());
```

> ⚠️ **BE CAREFUL**: This is the largest migration. If it fails partway, some tables may exist and others may not. Use `IF NOT EXISTS` on everything. Test locally first via `supabase db push` if possible. Do NOT modify existing columns — only ADD new ones.

#### Verification:
```bash
npm run build
git add supabase/migrations/
git commit -m "phase 4: create all booking, CRM, payment, referral tables + modify services"
```

---

## Phase 5: Types, Validations & Utility Files

### 5.1 Update `lib/types.ts`

#### [MODIFY] `lib/types.ts`

Add all new interfaces and type unions. Do NOT remove any existing types. Append after existing content:

- `StaffInvite`, `StaffSchedule`, `StaffBreak`, `StaffTimeOff`
- `SalonClosure`, `StaffService`
- `GuestBooking`, `GroupBooking`
- `ServicePackage`, `PackagePurchase`
- `ClientFormula`, `IntakeFormResponse`, `ClientPhoto`
- `Tip`, `GiftCard`
- `ReferralCode`, `ReferralRedemption`
- `PriceAdjustment`
- Add `payment_status`, `stripe_payment_intent_id`, `paid_amount`, `platform_fee`, `refunded_amount`, `completed_at`, `group_booking_id`, `acquisition_source` to `Booking` interface
- Add `stripe_account_id`, `cancellation_fee_percent`, `cancellation_window_hours`, `auto_assign_method` to `Salon` interface
- Add `buffer_minutes`, `processing_minutes`, `finishing_minutes`, `photo_urls`, `daily_limit_per_staff` to `Service` interface
- Add `user_id`, `can_edit_schedule`, `can_view_own_bookings`, `can_manage_portfolio`, `average_rating`, `review_count` to `StaffMember` interface
- Add `staff_salon_id`, `birthday` to `Profile` interface
- New type: `PaymentStatus = 'pending' | 'paid' | 'refunded' | 'partially_refunded' | 'disputed'`
- New type: `AutoAssignMethod = 'least_booked_week' | 'least_booked_today' | 'round_robin' | 'manual_priority'`
- New type: `AdjustmentStatus = 'pending' | 'accepted' | 'disputed' | 'expired'`
- New type: `GroupEventType = 'bridal' | 'birthday' | 'corporate' | 'other'`
- New type: `PhotoType = 'before' | 'after' | 'progress'`
- New type: `IntakeTemplateKey = 'hair_consultation' | 'nail_consultation' | 'waxing_consultation' | 'makeup_consultation' | 'spa_consultation'`

### 5.2 Update `lib/validations.ts`

#### [MODIFY] `lib/validations.ts`

Add Zod schemas (append to existing file, do not replace):

```typescript
// New schemas to add:
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

export const referralCodeSchema = z.object({
  code: z.string().min(4).max(20).regex(/^[A-Z0-9]+$/),
});

export const packageSchema = z.object({
  service_id: z.string().uuid(),
  name: z.string().min(2).max(100),
  total_sessions: z.number().int().min(2).max(50),
  bonus_sessions: z.number().int().min(0).max(10),
  price: z.number().int().min(100),
});
```

### 5.3 New utility files

#### [NEW] `lib/cancellation-policy.ts`

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

#### [NEW] `lib/intake-templates.ts`

Predefined consultation form templates for each category (hair, nails, waxing, makeup, spa). Each template: array of `{ question_key, question_de, question_en, type: 'text'|'select'|'boolean', options?: string[] }`.

#### [NEW] `lib/commission-calculator.ts`

Simple commission calculator: `(bookingRevenue, commissionPercent) => commissionAmount`.

> ⚠️ **BE CAREFUL**: Do NOT import any new types in existing files yet. Only add types to `lib/types.ts` and schemas to `lib/validations.ts`. The actual API routes and UI will import these in later phases. Verify with `npm run build` that no circular imports are created.

#### Verification:
```bash
npm run build
npx tsc --noEmit
git add lib/
git commit -m "phase 5: add all new types, Zod schemas, and utility files"
```

---

## Phases 6-13: API Routes

> All API routes follow the CLAUDE.md §11 security stack:
> 1. Feature flag check → 2. Auth check → 3. Ban check → 4. Rate limit → 5. Zod validation → 6. Business logic

### Phase 6: Stripe Connect + Prepaid Checkout API

> ⚠️ **CRITICAL DESIGN**: Stripe `capture_method: 'manual'` holds expire after 7 days. We handle this with TWO flows:
> - **Booking ≤7 days out**: Create PaymentIntent immediately → hold funds → capture 24h after service.
> - **Booking >7 days out**: Create SetupIntent to save card → create PaymentIntent 5 days before via `pre-charge` cron.

#### [NEW] `app/api/stripe/create-customer/route.ts`
Creates a Stripe Customer for the user if they don't have one (needed for SetupIntents to save cards).

#### [NEW] `app/api/stripe/save-card/route.ts`
For bookings >7 days away: creates SetupIntent → saves payment method. Booking gets `payment_status: 'card_saved'`.

#### [NEW] `app/api/stripe/create-checkout/route.ts`
For bookings ≤7 days away: creates PaymentIntent with `application_fee_amount` (1%) and `transfer_data.destination` (salon's Stripe Connect account). Returns `client_secret` for Stripe Elements.

**Must check salon has Connect before proceeding:**
```typescript
if (!salon.stripe_account_id) {
  return NextResponse.json({ error: 'Salon akzeptiert noch keine Online-Zahlungen', code: 'NO_STRIPE_CONNECT' }, { status: 400 });
}
```

#### ✅ DO:
```typescript
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmountCents,
  currency: 'chf',
  application_fee_amount: Math.round(totalAmountCents * 0.01), // 1%
  transfer_data: { destination: salon.stripe_account_id },
  capture_method: 'manual', // Hold, don't capture yet
  metadata: { booking_id: booking.id, salon_id: salon.id },
});
```

#### ❌ DON'T:
```typescript
// DON'T auto-capture — we need to hold funds and release 24h after service
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmountCents,
  currency: 'chf',
  // Missing application_fee_amount — Solen gets nothing!
  // Missing capture_method: 'manual' — captures immediately!
});
```

#### [MODIFY] `app/api/bookings/route.ts`

Modify the POST handler to handle ALL booking types in one place (prevents Phase 10 conflict):
1. Auth OR guest booking (if no auth → expect `guest_name`, `guest_phone` via `guestBookingSchema`)
2. Create booking row with `payment_status: 'pending'`
3. If guest → create `guest_bookings` row
4. If booking ≤7 days → create PaymentIntent → return `client_secret`
5. If booking >7 days → create SetupIntent → return `setup_client_secret`
6. If redeeming package → skip Stripe, set `payment_status: 'paid'`, `paid_via: 'package'`
7. Do NOT mark booking as confirmed until payment webhook fires
8. Check `daily_limit_per_staff` before creating booking
9. Auto-assign staff if `staff_member_id` is null (use `salon.auto_assign_method`)
10. Check `salon_closures` and `staff_breaks` — reject if slot falls on closure/break

#### [MODIFY] `app/api/stripe/webhook/route.ts`

Add handler for `payment_intent.succeeded`: Find booking by metadata → update `payment_status: 'paid'`, `paid_amount`, `platform_fee`. Send confirmation email.

**Must add webhook idempotency:**
```typescript
const existing = await supabase.from('processed_webhook_events')
  .select('event_id').eq('event_id', event.id).single();
if (existing.data) return NextResponse.json({ received: true });
await supabase.from('processed_webhook_events').insert({ event_id: event.id });
```

> ⚠️ **BE CAREFUL**: The existing Stripe webhook handler already processes events. ADD new cases, don't replace the switch/if block. Keep existing `create-payment-intent` route working alongside new `create-checkout` (gradual migration). Add deprecation comment to old route.

#### Verification:
```bash
npm run build
git add app/api/stripe/ app/api/bookings/route.ts
git commit -m "phase 6: Stripe Connect checkout + SetupIntent save-card + prepaid booking flow + webhook handler"
```

---

### Phase 7: Cancellation, Refund & Price Adjustment API

#### [MODIFY] `app/api/bookings/[id]/cancel/route.ts`
Use `calculateRefund()` from `lib/cancellation-policy.ts`. If refund > 0, call `stripe.refunds.create()`.

#### [NEW] `app/api/bookings/[id]/adjust-price/route.ts`
Salon submits new price. Creates `price_adjustments` row. Sends email to customer.

#### [NEW] `app/api/bookings/[id]/respond-adjustment/route.ts`
Customer accepts → capture adjusted amount. Customer disputes → keep hold, flag for admin.

#### [NEW] `app/api/bookings/[id]/refund/route.ts`
Salon-triggered manual refund (full or partial).

> ⚠️ **BE CAREFUL**: The existing cancel route may have consumers expecting the old response format. Check all `fetch('/api/bookings/*/cancel')` calls and ensure backwards compatibility.

#### Verification:
```bash
npm run build
git add app/api/bookings/
git commit -m "phase 7: cancellation refund engine + price adjustment + manual refund routes"
```

---

### Phase 8: Staff System API

#### [NEW] `app/api/staff/invite/route.ts` — POST: Send invite email
#### [NEW] `app/api/staff/accept-invite/route.ts` — POST: Accept via token
#### [NEW] `app/api/staff/my-schedule/route.ts` — GET/PUT: Own schedule
#### [NEW] `app/api/staff/services/route.ts` — GET/POST: Staff-service assignment

> ⚠️ **BE CAREFUL**: The invite accept flow must handle both cases: (a) user already has a Solen account → link it, (b) user doesn't → redirect to signup with invite token in URL. After accepting, set `profiles.staff_salon_id` and `staff_members.user_id`.

#### Verification:
```bash
npm run build
git add app/api/staff/
git commit -m "phase 8: staff invite, accept, schedule, and service assignment API routes"
```

---

### Phase 9: Scheduling & Walk-in API

#### [NEW] `app/api/salon/closures/route.ts` — GET/POST/DELETE
#### [NEW] `app/api/staff/breaks/route.ts` — GET/POST/DELETE
#### [NEW] `app/api/staff/time-off/route.ts` — GET/POST/DELETE
#### [NEW] `app/api/bookings/walk-in/route.ts` — POST: Create walk-in + send SMS payment link
#### [NEW] `app/api/bookings/walk-in-verify/route.ts` — GET: API validates HMAC token, returns booking data
#### [NEW] `app/[locale]/walk-in-pay/page.tsx` — Public PAGE (not API) with Stripe Elements form

> ⚠️ **FIX**: Walk-in payment is a PAGE (shows Stripe card form), NOT an API route. Next.js API routes can't render React. The page reads `?token=xxx` → calls `walk-in-verify` API → shows payment form.

SMS message for walk-in: `"Dein Termin bei {salon}: {service} um {time}. Bezahle hier: https://www.solen.ch/walk-in-pay?token={token}"`

Walk-in bookings have `paid_via: 'walk_in'` and `payment_status: 'pending'`. Auto-complete cron skips walk-ins still pending. Release-payments cron skips walk-ins entirely.

> ⚠️ **BE CAREFUL**: `walk-in-pay` page is PUBLIC (no auth). `walk-in-verify` API uses HMAC token validation with `BOOKING_HMAC_SECRET`. Rate limit by IP. Token format: `HMAC(booking_id:expiry, secret)`. Validate token before showing payment form.

#### Verification:
```bash
npm run build
git add app/api/salon/ app/api/staff/ app/api/bookings/walk-in* app/[locale]/walk-in-pay/
git commit -m "phase 9: closures, breaks, time-off, walk-in booking + payment page + SMS API"
```

---

### Phase 10: Booking Flow API (Group, Packages)

> **NOTE**: Guest booking logic is already in Phase 6's `api/bookings/route.ts` modification to prevent file conflicts.

#### [NEW] `app/api/bookings/group/route.ts` — POST: Create group booking using Supabase RPC for atomicity
#### [NEW] `supabase/migrations/XXX_megabuild_group_booking_rpc.sql` — Atomic group booking function
#### [NEW] `app/api/packages/route.ts` — GET/POST: List/create packages
#### [NEW] `app/api/packages/purchase/route.ts` — POST: Buy package via Stripe
#### [NEW] `app/api/packages/redeem/route.ts` — POST: Redeem session from package at booking

Package redemption must check expiry:
```typescript
.or('expires_at.is.null,expires_at.gt.now()')
```

> ⚠️ **BE CAREFUL**: Group booking uses a Supabase RPC function (`create_group_booking`) that locks all slots with `FOR UPDATE` and rolls back if ANY slot is taken. Do NOT create group bookings without this atomic function. Referral self-use must be blocked: `referral_codes.user_id != currentUserId`.

#### Verification:
```bash
npm run build
git add app/api/bookings/ app/api/packages/ supabase/migrations/
git commit -m "phase 10: group booking (atomic RPC), service packages API"
```

---

### Phase 11: Quick-Actions, CRM API

#### [NEW] `app/api/bookings/[id]/quick-action/route.ts` — GET: Tokenized one-click confirm/cancel
#### [NEW] `app/api/clients/[id]/formulas/route.ts` — GET/POST
#### [NEW] `app/api/clients/[id]/photos/route.ts` — GET/POST (upload to Supabase Storage `client-photos`)
#### [NEW] `app/api/clients/[id]/intake/route.ts` — GET/POST
#### [NEW] `app/api/intake/templates/route.ts` — GET: Return predefined templates from `lib/intake-templates.ts`

> ⚠️ **BE CAREFUL**: Quick-action uses HMAC tokens with `BOOKING_HMAC_SECRET` env var. Token format: `HMAC(booking_id:action:expiry, secret)`. Verify env var exists before using.

#### Verification:
```bash
npm run build
git add app/api/bookings/ app/api/clients/ app/api/intake/
git commit -m "phase 11: one-click reminder actions + CRM formulas, photos, intake API"
```

---

### Phase 12: Tips, Gift Cards, Referrals API

#### [NEW] `app/api/tips/route.ts` — POST: Create tip payment (public, tokenized)
#### [NEW] `app/api/gift-cards/purchase/route.ts` — POST: Buy + email delivery
#### [NEW] `app/api/gift-cards/redeem/route.ts` — POST: Deduct at checkout
#### [NEW] `app/api/gift-cards/balance/route.ts` — GET: Check balance by code
#### [NEW] `app/api/referral/create/route.ts` — POST: Generate user's referral code
#### [NEW] `app/api/referral/validate/route.ts` — GET: Check if code is valid + get reward amount

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

> ⚠️ **BE CAREFUL**: Gift card codes must be unique and not guessable. Use `nanoid(12)` uppercase alphanumeric (NOT 8 — too short for brute-force safety). Rate limit balance check: max 5 per IP per minute.

#### Verification:
```bash
npm run build
git add app/api/tips/ app/api/gift-cards/ app/api/referral/
git commit -m "phase 12: tips, gift cards, referral system API routes"
```

---

### Phase 13: Cron Jobs + Analytics API

#### [NEW] `app/api/cron/auto-complete/route.ts`
Every 15 min: bookings where `ends_at < now()` AND `status = 'confirmed'` AND salon has `auto_complete_enabled = true` AND booking has NO pending `price_adjustments`.

```sql
-- Must exclude walk-ins still pending + bookings with pending adjustments:
AND payment_status != 'pending'
AND paid_via != 'walk_in'
AND id NOT IN (SELECT booking_id FROM price_adjustments WHERE status = 'pending')
AND salon_id IN (SELECT id FROM salons WHERE auto_complete_enabled = true)
```

#### [NEW] `app/api/cron/release-payments/route.ts`
Every hour: bookings where `status = 'completed'` AND `completed_at < now() - 24h` AND no pending `price_adjustments` AND `payment_status = 'paid'` → capture Stripe PaymentIntent.

**With destination charges, `capture()` automatically transfers to connected account:**
```typescript
// Destination charges: capture triggers automatic transfer to connected account
// application_fee_amount is our 1% cut, kept on platform
await stripe.paymentIntents.capture(booking.stripe_payment_intent_id);
// Log the action for audit trail
await supabase.from('audit_log').insert({ action: 'payment_released', booking_id, amount });
```

#### [NEW] `app/api/cron/pre-charge/route.ts`
Runs daily at midnight. Finds bookings where `payment_status = 'card_saved'` AND `starts_at < now() + 5 days`. Creates PaymentIntent from saved payment method → charges card → updates `payment_status: 'paid'`. Sends payment confirmation email on success.

#### [NEW] `app/api/cron/birthday-messages/route.ts`
Daily at 8am CET: profiles where birthday matches today **in Swiss timezone**:
```sql
WHERE EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM (now() AT TIME ZONE 'Europe/Zurich'))
  AND EXTRACT(DAY FROM birthday) = EXTRACT(DAY FROM (now() AT TIME ZONE 'Europe/Zurich'))
```

#### [NEW] `app/api/cron/generate-slots/route.ts`
Runs nightly. **Bridges staff_schedules → availability_slots** (critical — without this, schedule system is disconnected from booking):
1. Read `staff_schedules` → get working hours per staff per day
2. Read `salon_closures` → exclude closure dates
3. Read `staff_breaks` → exclude break windows
4. Read `staff_time_off` → exclude vacation dates
5. Generate `availability_slots` for the next 30 days
6. Respect `services.buffer_minutes`, `processing_minutes`, `finishing_minutes`

#### [MODIFY] `app/api/cron/review-prompt/route.ts`
After sending review prompt, if review is 4-5 stars → schedule Google review push email 24h later.

#### [MODIFY] `app/api/analytics/salon/[id]/route.ts`
Add: `peak_hours_heatmap` (7×12 grid, shape: `{ day: number, hour: number, count: number }[]`), `cancellation_rate`, `no_show_rate`, `popular_services` (top 5), `retention_rate` (re-booking within 60 days), `new_vs_returning`, `acquisition_sources`.

#### [NEW] `app/api/analytics/staff/[id]/route.ts`
Per-stylist: bookings count, revenue, average rating, retention rate.

#### [NEW] `app/api/analytics/staff-comparison/route.ts`
Returns ALL staff stats for a salon in one response (for comparison chart UI).

#### [NEW] `app/api/ai/intake-recommendation/route.ts`
POST: accepts `{ template_key, responses }` → calls Gemini → returns AI recommendation text.

> ⚠️ **BE CAREFUL**: Cron routes must be protected with a `CRON_SECRET` header check (existing pattern in `api/cron/reminders`). Copy that auth pattern exactly. The `release-payments` cron handles real money — log every action. The `pre-charge` cron handles card-on-file — must handle `PaymentIntent` failures (card declined) gracefully and notify customer.

#### Verification:
```bash
npm run build
git add app/api/cron/ app/api/analytics/ app/api/ai/
git commit -m "phase 13: crons (auto-complete, release-payments, pre-charge, birthdays, generate-slots) + analytics + AI intake"
```

---

> **Phases 14-25 (UI) continue in Part 2: `_tasks/roadmap-megabuild-code-part2.md`**
