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
