# Roadmap: Payment System (Stripe Connect)

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Salon profile updates and creation | Ensure the migration adds fields with `IF NOT EXISTS` |
| Phase 2 | 🔴 HIGH | Booking cancellations | Test refund logic carefully; handle Stripe API errors gracefully |
| Phase 3 | 🟡 MEDIUM | Stripe webhooks and payouts | Use existing idempotency table (`processed_webhook_events`) |
| Phase 4 | 🟢 SAFE | Salon Dashboard | Isolate changes to new pages |
| Manual A | 🟢 SAFE | Operations | Test in Stripe Test Mode first |

## 🤖 CLAUDE CODE PHASES

### Phase 1: Database Schema (Stripe Connect Fields)
Add the missing Stripe account ID and configuration fields to the `salons` table.

- **[NEW]** `supabase/migrations/076_stripe_connect_salons.sql`
  - Add `stripe_account_id` (TEXT), `accepts_online_payment` (BOOLEAN DEFAULT false) to the `salons` table.

> ⚠️ **BE CAREFUL**: 
> - Using `IF NOT EXISTS` is mandatory to prevent migration crashes.
> - Do not drop or recreate the `salons` table.
> - Verify the fields match the API expectations in `app/api/stripe/create-payment-intent/route.ts`.

**✅ DO:**
```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS accepts_online_payment BOOLEAN DEFAULT false;
```

**❌ DON'T:**
```sql
-- Never do this, it will crash if the column exists or table has data
ALTER TABLE salons ADD COLUMN stripe_account_id TEXT NOT NULL;
```
**Verification:** Run `npm run build` locally. Confirm the migration runs successfully in Supabase.

---

### Phase 2: Booking Cancellation & Refund Logic
Implement the 24-hour cancellation refund rules to comply strictly with the Terms of Service.

- **[MODIFY]** `app/api/bookings/[id]/route.ts` (or `cancel` specific route)
  - When `status` is updated to `cancelled`, calculate the refund based on `starts_at`.
  - If `>24h`: 100% refund using `stripe.refunds.create({ payment_intent: pi_id })` and `reverse_transfer: true`.
  - If `<24h` (late): 50% refund (ToS §4.2 rule).
- **[MODIFY]** `app/api/cron/pending-timeout/route.ts` (No-show logic)
  - Ensure no-shows explicitly do NOT trigger a refund (100% charge to customer).

> ⚠️ **BE CAREFUL**: 
> - The prompt mentions 100% fee to salon for late cancellations, but **ToS §4.2 mandates a 50% fee**. The ToS is authoritative as per prompt rules.
> - Handing `stripe.refunds.create` requires proper try/catch blocks because the payment intent might not be captured yet.
> - Connect destination charges require `reverse_transfer: true` to pull funds back from the connected account.

**✅ DO:**
```typescript
if (hoursUntilAppointment < 24) {
  // Late cancellation: 50% refund to customer, 50% kept
  await stripe.refunds.create({ 
    payment_intent: booking.stripe_payment_intent_id, 
    amount: Math.round(depositAmount * 0.5),
    reverse_transfer: true 
  });
}
```

**❌ DON'T:**
```typescript
// Don't refund 100% for late cancellations, it violates ToS §4.2
await stripe.refunds.create({ payment_intent: pi_id });
```
**Verification:** Call the cancel API on a test booking >24h and <24h away and verify Stripe refund amounts in logs.

---

### Phase 3: Webhook Extensions & Invoices
Expand webhook handling and add a simple endpoint for invoice generation.

- **[MODIFY]** `app/api/stripe/webhook/route.ts`
  - Add handlers: `charge.refunded`, `payout.paid`, `payout.failed`, `transfer.created`.
  - Update `bookings` and `salon_payouts` tables based on these events.
- **[NEW]** `app/api/salon/invoices/[payoutId]/route.ts`
  - Generate a simple HTML-to-PDF or printable HTML view for payout invoices.

> ⚠️ **BE CAREFUL**: 
> - Webhooks retry on failure. You MUST use the `processed_webhook_events` table for idempotency for EVERY new event type.
> - `charge.refunded` must decrement the `net_amount` in `salon_payouts`.

**✅ DO:**
```typescript
case "payout.paid": {
   // Mark the payout as paid in our DB
   await admin.from("salon_payouts").update({ status: "paid" }).eq("stripe_payout_id", event.data.object.id);
   break;
}
```

**❌ DON'T:**
```typescript
// Don't process without checking idempotency
case "payout.paid": {
   await admin.from("salon_payouts").update(...);
}
```
**Verification:** Trigger mock webhooks via `stripe listen` and verify DB updates.

---

### Phase 4: Salon Earnings Dashboard
A salon-specific view to track revenues, payouts, and download invoices.

- **[NEW]** `app/[locale]/dashboard/earnings/page.tsx`
  - Build UI using Next.js components (e.g., `Card`, `Table`).
  - Show upcoming payouts, past payouts, and transaction breakdown.
- **[NEW]** `app/api/salon/earnings/route.ts`
  - Fetch from `salon_payouts` where `salon_id` matches the configured salon owner.

> ⚠️ **BE CAREFUL**: 
> - Do not confuse this with `app/[locale]/dashboard/revenue/page.tsx` which is the global platform admin view.
> - Ensure RLS or API auth strictly limits data to the currently logged-in salon owner.

**✅ DO:**
```tsx
const { data: payouts } = await supabase.from('salon_payouts').select('*').eq('salon_id', mySalonId);
```

**❌ DON'T:**
```tsx
// Missing auth filter! Let's salons see other salons' data.
const { data: payouts } = await supabase.from('salon_payouts').select('*');
```
**Verification:** Navigate to `/dashboard/earnings` as a salon owner and ensure only their data appears.

---

### Phase 5: Update CLAUDE.md
Document the new tables, fields, and API routes.

- **[MODIFY]** `CLAUDE.md`
  - Update Section 6 (Schema) with `salons.stripe_account_id` and the `salon_payouts` usage.
  - Document the `/dashboard/earnings` setup.

---

## 🧑 MANUAL PHASES

### Manual A: Stripe Dashboard Configuration
- **TWINT Integration:** Log into the Stripe Dashboard -> Settings -> Payment methods. Ensure TWINT is enabled for the platform and Connected Accounts.
- **Payout Schedule:** Settings -> Connect -> Settings. Set the default Payout Schedule for Connected Accounts to "Weekly, every Monday" with a "7-day delay".

---

## DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Database Schema (Stripe Connect fields) | Nothing |
| Phase 2 | 🤖 | Booking Cancellation & Refund Logic | Phase 1 |
| Phase 3 | 🤖 | Webhook Extensions & Invoices | Phase 2 |
| Phase 4 | 🤖 | Salon Earnings Dashboard | Phase 3 |
| Phase 5 | 🤖 | Update CLAUDE.md | Phase 4 |
| Manual A | 🧑 | Stripe Dashboard Configuration | Nothing |
