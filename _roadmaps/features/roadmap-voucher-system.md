# Gutschein (Voucher) System Roadmap

## Audit Summary
- **Database:** A `promo_codes` table currently exists in Supabase (`048_promo_codes.sql`) which handles standard fields (`discount_type`, `discount_value`, `min_booking_amount`, `max_uses`, `current_uses`, `salon_id`, `valid_until`). However, there is no `vouchers` table to track *purchases* of vouchers, nor is there any field bridging these codes to Stripe.
- **Stripe:** Not wired. There are no API wrappers or webhook listeners handling Stripe Coupons or Stripe Promotion Codes.
- **Rule Adherence:** The existing system does not strictly adhere to the CLAUDE.md requirement "30. Digital Gift Cards" which specifies "tracking balances". The user's new requirement simplifies this to "Single-use... marked as redeemed". This roadmap implements the simplified single-use Stripe Promotion Codes approach with our own custom validation layer on top.

## Architectural Approach
We will use **Stripe Promotion Codes** as the backend engine. 
Why? Because Stripe handles the mathematical discounting securely during the actual `PaymentIntent` or `CheckoutSession` creation, and it natively tracks code usage.
We will build a custom validation layer on top (via Supabase) to ensure codes are valid *before* they even hit Stripe (e.g., checking if the minimum booking value is met for a specific salon).

---

## Phase 1: Database Schema Expansion (Supabase)
**Goal:** Connect the internal voucher system to Stripe and track purchased vouchers.

1. **Modify `promo_codes` Table:**
   - Add `stripe_coupon_id` (text, nullable).
   - Add `stripe_promotion_code_id` (text, nullable).
   - Add `is_purchased_voucher` (boolean, default false).
2. **Create `voucher_purchases` Table:**
   - Columns: `id` (uuid), `customer_id` (uuid), `promo_code_id` (uuid - references `promo_codes`), `amount_paid` (numeric), `stripe_payment_intent_id` (text), `created_at`.
   - Setup RLS policies so customers can see their purchased vouchers.

## Phase 2: Stripe API Backend Services (Server Actions)
**Goal:** Wire the Stripe API to safely generate and validate promotion codes.

1. **Generation Endpoint (`app/api/vouchers/create/route.ts`):**
   - Create a Stripe Coupon (`percent_off` or `amount_off`).
   - Create a Stripe Promotion Code tied to that Coupon with `max_redemptions = 1` and a generated alphanumeric `code`.
   - Save the matching record in the Supabase `promo_codes` table.
2. **Validation Service (`lib/vouchers/validate.ts`):**
   - Take the user input code.
   - **Custom Validation:** Query Supabase `promo_codes` to check `is_active`, `min_booking_amount`, and `salon_id` match.
   - Return validated discount details to the frontend before applying it to the Stripe charge.
3. **Webhooks (`app/api/stripe/webhook/route.ts`):**
   - Listen for `payment_intent.succeeded` for voucher *purchases* to finalize the creation of the code and trigger the email.
   - Listen for code redemption to mark `current_uses` = 1 in Supabase to maintain state parity.

## Phase 3: Purchase Flow UI (Frontend)
**Goal:** Allow users to buy Gutscheine (Platform or Salon-Specific). Adhere to **Zone 3: Clean Functional** (No glass, coral CTAs, pure structured inputs).

1. **Voucher Purchase Page (`app/[locale]/vouchers/buy/page.tsx`):**
   - Inputs for Voucher Value (Fixed CHF or %) and optional Recipient Email.
   - Use `rounded-input` (12px) and `shadow-warm-md` for the main card.
   - Implement Stripe Elements wrapper for purchasing the voucher.
2. **Email Delivery:**
   - Trigger Resend email to the recipient with the uniquely generated alphanumeric code upon successful payment.

## Phase 4: Redemption Flow UI (Checkout)
**Goal:** Add a localized, seamless promo code input in the existing booking checkout.

1. **Checkout UI Modification:**
   - Add a "Gutschein / Promo Code" input field (using `rounded-input`) above the Stripe Payment Element.
   - Add an "Einlösen" (Apply) button (`bg-s-coral` / `rounded-pill`).
2. **Client-Side Validation:**
   - Call the Validation Service on click.
   - Provide immediate inline feedback (Success: `text-s-success`, Error: `text-s-error`) without refreshing.
   - If valid, update the checkout total calculation dynamically (via `formatCurrency()`) and pass the `stripe_promotion_code_id` to the final Stripe payment intent.

## Phase 5: Salon & Platform Split Logic (Payouts)
**Goal:** Handle the complex routing of funds when a voucher is redeemed.

1. **Checkout Backend Logic:**
   - If `promo_codes.salon_id` is set -> The discount must be covered by the Salon (or the funds were routed to them at purchase).
   - If `promo_codes.salon_id` is null (Platform Voucher) -> The platform absorbs the discount. Modify the Stripe Connect `application_fee_amount` calculated during the booking to deduct the platform's cut by the voucher amount, ensuring the salon receives their full standard payout.

---
## Summary of Rules Followed
- **UI Rules:** Purchase and Redemption flows will follow Zone 3 constraints (no glassmorphism, functional shadows, exact corner radiuses).
- **Internationalization (i18n):** No hardcoded text. All new UI strings will use `t("...")` and be added to JSON dictionaries.
- **Claude.md Integrity:** Using Stripe Promotion Codes as requested by the user, and utilizing server actions appropriately. None of the deprecated design tokens will be used.
