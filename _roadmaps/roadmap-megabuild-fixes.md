# 🔧 Roadmap Fixes Addendum — Patches for All 51 Audit Issues

> **Apply these patches to `roadmap-megabuild-code-part1.md` and `roadmap-megabuild-code-part2.md` before execution.**
> Each fix references the original phase it patches.

---

## CRITICAL BUG FIXES

### Fix 1: Stripe 7-Day Capture Limit → New Pre-Charge Cron (Patches P6)

**Problem**: `capture_method: 'manual'` expires after 7 days. Bookings >7 days away lose payment.

**Solution**: Use **SetupIntent** for future bookings, **PaymentIntent** for bookings within 7 days.

#### [NEW] `app/api/stripe/save-card/route.ts`
For bookings >7 days away: create SetupIntent → save payment method → charge later.

```typescript
// When booking is >7 days away:
const setupIntent = await stripe.setupIntents.create({
  customer: stripeCustomerId,
  payment_method_types: ['card'],
  metadata: { booking_id, salon_id },
});
// Save booking with payment_status: 'card_saved', stripe_setup_intent_id
```

#### [NEW] `app/api/cron/pre-charge/route.ts`
Runs daily at midnight. Finds bookings where:
- `payment_status = 'card_saved'`
- `starts_at < now() + 5 days`

Creates PaymentIntent from saved payment method → charges card → updates `payment_status: 'paid'`.

```typescript
// Cron job logic:
const bookingsToCharge = await supabase
  .from('bookings')
  .select('*')
  .eq('payment_status', 'card_saved')
  .lt('starts_at', fiveDaysFromNow);

for (const booking of bookingsToCharge) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: booking.paid_amount,
    currency: 'chf',
    customer: booking.stripe_customer_id,
    payment_method: booking.stripe_payment_method_id,
    off_session: true,
    confirm: true,
    application_fee_amount: Math.round(booking.paid_amount * 0.01),
    transfer_data: { destination: salon.stripe_account_id },
    capture_method: 'manual',
  });
}
```

#### DB Change (add to Phase 1 migration):
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_setup_intent_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT;
```

#### Update `PaymentStatus` type (Phase 5):
```typescript
type PaymentStatus = 'pending' | 'card_saved' | 'paid' | 'refunded' | 'partially_refunded' | 'disputed';
```

> Also need: `[NEW] api/stripe/create-customer/route.ts` — creates Stripe Customer for the user if they don't have one yet (needed for SetupIntents).

---

### Fix 2: Group Booking FK Ordering (Patches P1 + P4)

**Problem**: Phase 1 adds `group_booking_id` column to bookings. Phase 4 creates `group_bookings` table + FK. FK can't reference a table that doesn't exist yet between Phase 1 and Phase 4.

**Solution**: Remove the FK from Phase 4. Add it as a deferred constraint:

```sql
-- In Phase 1: add column WITHOUT FK
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_booking_id UUID;
-- group_bookings FK will be added after table is created

-- In Phase 4: AFTER creating group_bookings table, add FK
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
```

---

### Fix 3: Double bookings/route.ts Modification (Patches P6 + P10)

**Solution**: In Phase 6, add ALL booking modifications at once. Add a clearly documented guest booking section:

```typescript
// In api/bookings/route.ts Phase 6 modification:
export async function POST(req: Request) {
  const body = await req.json();

  // --- MEGABUILD: Auth or Guest ---
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userId = user?.id;
  let guestData = null;

  if (!userId) {
    // Guest booking flow
    const guestParsed = guestBookingSchema.safeParse(body.guest);
    if (!guestParsed.success) return NextResponse.json({ error: 'Invalid guest data' }, { status: 400 });
    guestData = guestParsed.data;
    userId = null; // booking.user_id will be null for guests
  }

  // --- Create booking ---
  // ... existing booking logic ...

  // --- MEGABUILD: Guest record ---
  if (guestData) {
    await supabase.from('guest_bookings').insert({
      booking_id: booking.id,
      guest_name: guestData.guest_name,
      guest_phone: guestData.guest_phone,
      guest_email: guestData.guest_email,
    });
  }

  // --- MEGABUILD: Prepaid checkout ---
  // ... Stripe PaymentIntent logic ...
}
```

Phase 10 then only adds: group booking route (separate file) + package routes (separate files). No more conflict.

---

### Fix 4: Walk-in Pay is a Page, Not API (Patches P9)

**Change**: Move from `app/api/bookings/walk-in-pay/route.ts` to a proper page:

```
[DELETE] app/api/bookings/walk-in-pay/route.ts
[NEW] app/[locale]/walk-in-pay/page.tsx     ← Page with Stripe Elements form
[NEW] app/api/bookings/walk-in-verify/route.ts  ← API: validates token, returns booking data
```

Walk-in page flow: `page.tsx` reads `?token=xxx` → calls `walk-in-verify` API → shows payment form → on success, calls `api/stripe/create-checkout`.

---

### Fix 5: Services Page Path (Patches P21)

**Add pre-scan step**: Before executing Phase 21, run:
```bash
find app/[locale]/dashboard -name "*.tsx" | head -30
grep -r "services" app/\[locale\]/dashboard/ --include="*.tsx" -l
```
If no standalone services page exists, the service management is inside `settings/page.tsx` (which is 42KB). In that case, modify `settings/page.tsx` instead.

---

### Fix 6: Stripe Destination Charge Capture (Patches P13)

**Clarification**: With destination charges + `capture_method: 'manual'`:
- `stripe.paymentIntents.capture(pi_id)` captures to the PLATFORM
- Stripe automatically creates a transfer to the connected account based on `transfer_data.destination`
- The `application_fee_amount` is deducted from the transfer

This means `release-payments` cron just needs to call `stripe.paymentIntents.capture()` — the transfer happens automatically. **No manual transfer needed.**

Add this comment to the cron code:
```typescript
// Destination charges: capture triggers automatic transfer to connected account
// application_fee_amount is our 1% cut, kept on platform
await stripe.paymentIntents.capture(booking.stripe_payment_intent_id);
```

---

## HIGH-RISK BUG FIXES

### Fix 7: Group Booking Atomicity (Patches P10)

#### [NEW] `supabase/migrations/XXX_megabuild_group_booking_rpc.sql`

```sql
CREATE OR REPLACE FUNCTION create_group_booking(
  p_organizer_name TEXT,
  p_salon_id UUID,
  p_group_size INTEGER,
  p_event_type TEXT,
  p_members JSONB -- [{name, service_id, slot_id, staff_member_id}]
) RETURNS UUID AS $$
DECLARE
  v_group_id UUID;
  v_member JSONB;
  v_slot_status TEXT;
BEGIN
  -- Check all slots are available FIRST
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members) LOOP
    SELECT status INTO v_slot_status FROM availability_slots
    WHERE id = (v_member->>'slot_id')::UUID FOR UPDATE;

    IF v_slot_status != 'available' THEN
      RAISE EXCEPTION 'Slot % is not available', v_member->>'slot_id';
    END IF;
  END LOOP;

  -- Create group
  INSERT INTO group_bookings (organizer_name, salon_id, group_size, event_type)
  VALUES (p_organizer_name, p_salon_id, p_group_size, p_event_type)
  RETURNING id INTO v_group_id;

  -- Create each booking
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members) LOOP
    INSERT INTO bookings (salon_id, slot_id, service_id, staff_member_id, group_booking_id, status, payment_status)
    VALUES (p_salon_id, (v_member->>'slot_id')::UUID, (v_member->>'service_id')::UUID,
            (v_member->>'staff_member_id')::UUID, v_group_id, 'pending', 'pending');

    UPDATE availability_slots SET status = 'booked' WHERE id = (v_member->>'slot_id')::UUID;
  END LOOP;

  RETURN v_group_id;
END;
$$ LANGUAGE plpgsql;
```

---

### Fix 8-12: Quick Fixes

**Fix 8 (Gift card codes)**: Change from `nanoid(8)` to `nanoid(12)` uppercase. Add rate limit: max 5 balance checks per IP per minute.

**Fix 9 (Birthday timezone)**: In cron query:
```sql
WHERE EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM (now() AT TIME ZONE 'Europe/Zurich'))
  AND EXTRACT(DAY FROM birthday) = EXTRACT(DAY FROM (now() AT TIME ZONE 'Europe/Zurich'))
```

**Fix 10 (Auto-complete + adjustment)**: Auto-complete cron adds check:
```sql
AND id NOT IN (SELECT booking_id FROM price_adjustments WHERE status = 'pending')
```
Price adjustments ARE allowed on `completed` bookings. Only `release-payments` blocks on pending adjustments.

**Fix 11 (Self-referral)**: In `api/referral/validate`:
```typescript
if (referralCode.user_id === currentUserId) {
  return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
}
```

**Fix 12 (Package expiry)**: In `api/packages/redeem`:
```typescript
const purchase = await supabase.from('package_purchases')
  .select()
  .eq('id', packagePurchaseId)
  .gt('sessions_used', 0) // has sessions remaining handled in app
  .or('expires_at.is.null,expires_at.gt.now()')
  .single();
```

---

## FEATURE CONFLICT FIXES

### Conflict 1: Prepaid vs Existing Stripe (Patches P6)

**Solution**: Keep existing `create-payment-intent` route working (don't delete). New `create-checkout` is the prepaid route with Connect. Add deprecation comment to old route. Migrate consumers gradually.

### Conflict 2: Guest Booking vs Auth Redirect (Patches P14)

In `BookingCalendar.tsx`, replace auth redirect with conditional:
```typescript
// OLD: if (!user) router.push('/login');
// NEW:
if (!user) {
  setShowGuestForm(true); // Show inline guest form instead of redirecting
}
```
Other features (favorites, chat) still redirect to login via their own auth checks.

### Conflict 3: Auto-Complete vs Manual (Patches P13)

Add a salon preference:
```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS auto_complete_enabled BOOLEAN DEFAULT true;
```
Cron checks: `AND salon.auto_complete_enabled = true`.

### Conflict 4: Package Redemption Bypasses Stripe (Patches P14)

In BookingCalendar checkout step:
```typescript
if (isPackageRedemption) {
  // Skip Stripe checkout entirely
  await fetch('/api/packages/redeem', { method: 'POST', body: ... });
  await fetch('/api/bookings', { method: 'POST', body: { ...bookingData, payment_status: 'paid', paid_via: 'package' } });
} else {
  // Normal Stripe checkout flow
}
```

Add to bookings table:
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS paid_via TEXT DEFAULT 'stripe'
  CHECK (paid_via IN ('stripe','package','gift_card','walk_in'));
```

### Conflict 5: Gift Card + Referral Stacking

```typescript
let amountToPay = servicePrice;

// 1. Apply referral discount first (percentage-based)
if (referralCode) {
  const discount = Math.round(amountToPay * 0.10); // 10% off
  amountToPay -= discount;
}

// 2. Apply gift card (reduces remaining amount)
if (giftCardCode) {
  const gc = await getGiftCard(giftCardCode);
  const gcDeduction = Math.min(gc.remaining_amount, amountToPay);
  amountToPay -= gcDeduction;
}

// 3. Floor at 0
amountToPay = Math.max(amountToPay, 0);

// 4. If amount is 0, skip Stripe entirely
if (amountToPay === 0) {
  // Free booking (fully covered by gift card + referral)
}
```

### Conflict 6: Walk-in + Prepaid Coexistence

Walk-in bookings have `paid_via: 'walk_in'` and `payment_status: 'pending'`.
Auto-complete cron: skip walk-ins still pending → show alert to salon "Walk-in nicht bezahlt".
Release-payments cron: skip walk-ins entirely (they pay outside the hold-and-release model).

### Conflict 7: Staff Schedules vs Slot System

#### [NEW] `app/api/cron/generate-slots/route.ts`

Runs nightly. For each salon:
1. Read `staff_schedules` → get working hours per staff per day
2. Read `salon_closures` → exclude closure dates
3. Read `staff_breaks` → exclude break times
4. Read `staff_time_off` → exclude vacation dates
5. Generate `availability_slots` for the next 30 days
6. Respect `services.buffer_minutes`, `processing_minutes`, `finishing_minutes`

This is the **bridge** between the schedule system and the slot system.

### Conflict 8: Multi-Service Consecutive Slots

When booking 2+ services for the same stylist:
1. Calculate total duration: `sum(service.duration_minutes + service.buffer_minutes + service.processing_minutes + service.finishing_minutes)`
2. Find a block of consecutive available slots that can fit the total duration
3. Book ALL slots in that block atomically

Add to `api/bookings/route.ts`:
```typescript
if (serviceIds.length > 1) {
  const totalMinutes = services.reduce((sum, s) =>
    sum + s.duration_minutes + (s.buffer_minutes || 0) + (s.processing_minutes || 0), 0);
  // Find consecutive slot block of totalMinutes
  // Book all slots
}
```

---

## BACKEND-NO-UI GAPS

### Add to Phase 15 (Dashboard Staff page):

```
[MODIFY] app/[locale]/dashboard/staff/page.tsx
- Add "Services zuweisen" checkboxes in staff edit modal (staff_services junction)
- Add permission toggles: Kalender bearbeiten | Buchungen sehen | Portfolio verwalten
```

### Add to Phase 21 (Settings):

```
[MODIFY] app/[locale]/dashboard/settings/page.tsx → Team tab
- Commission % per stylist (number input per staff member)
```

### Add to Phase 14 (BookingCalendar):

```
[MODIFY] components/BookingCalendar.tsx
- Auto-assign logic: if staff_member_id is null, call auto-assign algorithm
- Daily limit check: before confirming, verify staff hasn't hit daily limit
- Closure check: filter out dates that fall on salon_closures
- Break check: filter out slots during staff_breaks
```

### Add to Phase 20 (Profile):

```
[MODIFY] components/ProfilePage.tsx
- Auto-generate referral code on first view (if user doesn't have one)
```

### Add UTM middleware:

```
[NEW] middleware.ts (or modify existing)
- On salon profile page load: read utm_source, utm_medium, utm_campaign from URL params
- Store in session cookie: solen_utm={source,medium,campaign}
- BookingCalendar reads cookie → includes in booking request
```

---

## UI-NO-BACKEND GAPS

### Add these API changes:

```
[MODIFY] app/api/bookings/route.ts
- Add query param: view=monthly&month=2026-03 → returns {date: booking_count} for month view

[MODIFY] app/api/bookings/route.ts
- Add query param: view=daily&date=2026-03-21 → returns hourly breakdown for day view

[NEW] app/api/ai/intake-recommendation/route.ts
- POST: accepts { template_key, responses } → calls Gemini → returns recommendation text

[NEW] app/api/analytics/staff-comparison/route.ts
- GET: accepts salon_id → returns all staff stats in one response for comparison chart

[MODIFY] app/api/analytics/salon/[id]/route.ts
- Define heatmap response shape: { heatmap: { day: number, hour: number, count: number }[] }
```

---

## MISSING TRANSLATION PHASE

### [NEW] Phase 23.5: Translation Updates

Add to `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`.

Execute AFTER Phase 23 (email templates) and BEFORE Phase 24 (final UI polish).

```
git commit -m "phase 23.5: add all new translation keys for megabuild features (4 locales)"
```

---

## STRIPE RISK MITIGATIONS

### Add to Phase 6:

```typescript
// Before creating PaymentIntent, check salon has Stripe Connect:
if (!salon.stripe_account_id) {
  return NextResponse.json({
    error: 'Salon akzeptiert noch keine Online-Zahlungen',
    code: 'NO_STRIPE_CONNECT'
  }, { status: 400 });
}
```

### Add webhook idempotency (Phase 6):

```sql
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ DEFAULT now()
);
```

```typescript
// In webhook handler:
const existing = await supabase.from('processed_webhook_events')
  .select('event_id').eq('event_id', event.id).single();
if (existing.data) return NextResponse.json({ received: true }); // Already processed
await supabase.from('processed_webhook_events').insert({ event_id: event.id });
```

### Add to Manual Roadmap Step A:

Document that sandbox → live migration requires:
1. All salons re-connect their Stripe accounts in live mode
2. New live API keys in Vercel env vars
3. New live webhook endpoint + signing secret
4. Test one real payment with a real card before full launch

---

## UPDATED FILE MANIFEST (Additional Files from Fixes)

```
app/api/stripe/save-card/route.ts               [NEW] — Fix 1
app/api/stripe/create-customer/route.ts          [NEW] — Fix 1
app/api/cron/pre-charge/route.ts                 [NEW] — Fix 1
app/api/cron/generate-slots/route.ts             [NEW] — Conflict 7
app/api/ai/intake-recommendation/route.ts        [NEW] — UI gap 4
app/api/analytics/staff-comparison/route.ts      [NEW] — UI gap 5
app/api/bookings/walk-in-verify/route.ts         [NEW] — Fix 4
app/[locale]/walk-in-pay/page.tsx                [NEW] — Fix 4
supabase/migrations/XXX_group_booking_rpc.sql    [NEW] — Fix 7
supabase/migrations/XXX_webhook_events.sql       [NEW] — Stripe risk

Total additional files: 10
Grand total new files: ~65
Grand total modified files: ~20
```
