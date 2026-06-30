export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { stripe, toRappen } from "@/lib/stripe";
import { applyRateLimit, paymentLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";
import { resolveMemberDiscount, getCurrentTier, tierAtLeast } from "@/lib/loyalty/perks";
import { LOYALTY, type Tier } from "@/lib/loyalty/status";
import { createHash } from "crypto";

// POST /api/stripe/booking-pay-intent
// FULL PREPAY at booking (the Fresha model). Creates an automatic-capture
// PaymentIntent for the full service price, routed as a Stripe Connect
// destination charge to the salon's connected account with the Solen
// commission as application_fee_amount, AND saves the card off-session
// (setup_future_usage) so SP-AC (cancellation/no-show) and SP-3 (upcharge)
// can charge later without a fresh SCA prompt.
//
// Modeled on app/api/walkin/pay-intent/route.ts (server-trusted price,
// Connect destination, commission fee, guest-tolerant) but:
//   - capture_method "automatic" (full prepay, not a hold)
//   - customer + setup_future_usage:"off_session" (saved card)
//   - keyed off an existing booking row (Option B): the booking is created
//     first by POST /api/bookings with payment_method:"online" (status
//     "pending"), then the FE calls this with that booking_id. The webhook
//     payment_intent.succeeded → flips status "confirmed" + payment_status
//     "paid"; payment_intent.payment_failed → releases the slot.
//
// Works for BOTH a logged-in customer and a guest (booking.user_id IS NULL).
export async function POST(req: NextRequest) {
  const paymentsOff = await checkFeatureEnabled("payments");
  if (paymentsOff) return paymentsOff;

  // Who is acting: logged-in user (rate-limit by userId) or guest (by IP).
  // Mirrors walk-in/pay-intent's dual key. §10b#12 wants a dedicated
  // moneyLimiter; until SP-0/SP-2 adds it, reuse the 3/hour paymentLimiter.
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;

  const rateLimited = await applyRateLimit(
    paymentLimiter,
    userId ? { userId } : { ip: getClientIp(req) }
  );
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => null);
  const booking_id = String(body?.booking_id ?? "").trim();
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!booking_id || !UUID_RE.test(booking_id)) {
    return NextResponse.json({ error: "booking_id is required" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // 1. Load the booking (server-trusted anchor). It already carries salon,
  //    service, slot, time, staff, and — for guests — guest_email/name.
  const { data: booking } = await admin
    .from("bookings")
    .select("id, user_id, salon_id, service_id, slot_id, starts_at, staff_member_id, status, payment_status, guest_email, guest_name, extras_addons, promo_code")
    .eq("id", booking_id)
    .single();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Authorize: a logged-in user may only pay their OWN booking. A guest booking
  // (user_id IS NULL) is payable without a session — the booking row is the
  // authorization anchor here (SP-2's hashed-token resolveBookingActor is the
  // stronger gate and lands later). Reject a guest trying to pay a user's booking.
  if (booking.user_id) {
    if (!userId || userId !== booking.user_id) {
      return NextResponse.json({ error: "Not authorized for this booking" }, { status: 403 });
    }
  }

  // Don't re-charge an already-paid booking (idempotent at the booking level).
  if (booking.payment_status === "paid") {
    return NextResponse.json({ error: "Booking is already paid" }, { status: 409 });
  }
  // Only a live booking awaiting payment can be charged.
  if (!["pending", "pending_approval", "confirmed"].includes(booking.status ?? "")) {
    return NextResponse.json({ error: "Booking is not payable" }, { status: 409 });
  }

  // 2. Salon must accept online payment.
  const { data: salon } = await admin
    .from("salons")
    .select("name, stripe_account_id, accepts_online_payment, payment_mode, deposit_percent, member_commission_waiver_rate")
    .eq("id", booking.salon_id)
    .single();
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  if (!salon.accepts_online_payment) {
    return NextResponse.json({ error: "Salon does not accept online payments" }, { status: 400 });
  }
  // Connect guard (mirrors walk-in/pay-intent): without a connected account the PI below
  // would carry no transfer_data/application_fee, so the charge would land on the PLATFORM
  // instead of the salon — money the salon can't see. Reject so the booking falls back to
  // pay-in-person until the salon finishes Stripe Connect onboarding. (accepts_online_payment
  // is normally webhook-coupled to charges_enabled, but guard explicitly — never charge for
  // money we can't route.)
  if (!salon.stripe_account_id) {
    // DEV-ONLY fallback (2026-06-12, mirrors walkin/pay-intent): platform charge so
    // online pay is testable on seed salons locally; production keeps the hard block
    // (the transfer_data block below is already conditional on stripe_account_id).
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Dieser Salon hat die Online-Zahlung noch nicht abgeschlossen. Bitte vor Ort bezahlen.", code: "NOT_CONNECTED" },
        { status: 409 },
      );
    }
    console.warn("[booking-pay-intent] DEV fallback: platform charge, no Connect account");
  }

  // 3. Server-trusted price — from the service row, NEVER the client.
  //    (price_paid on the booking is server-set too, but the unit contract is
  //    explicit: derive CHF from services.price and convert via toRappen only.)
  const { data: service } = await admin
    .from("services")
    .select("price, salon_id, is_active, name_de")
    .eq("id", booking.service_id)
    .single();
  if (!service || service.salon_id !== booking.salon_id || service.is_active === false) {
    return NextResponse.json({ error: "Service not found for this salon" }, { status: 404 });
  }
  // Multi-service: add the booking's server-set extras_addons (resolved at booking time from the
  // services table — never the client) to the primary service price, so the charge = the full total.
  let extrasChf = 0;
  try {
    const ex = (booking as { extras_addons?: string | null }).extras_addons
      ? JSON.parse((booking as { extras_addons?: string }).extras_addons as string)
      : [];
    if (Array.isArray(ex)) extrasChf = ex.reduce((s: number, a: { price?: number }) => s + (Number(a?.price) || 0), 0);
  } catch (e) {
    console.error("[booking-pay-intent] failed to parse extras_addons:", e);
  }
  const priceChf = Number(service.price) + extrasChf;
  if (!Number.isFinite(priceChf) || priceChf < 0.5) {
    return NextResponse.json({ error: "Service has no valid price" }, { status: 400 });
  }
  // Charge per the salon's payment_mode (was: always the full price, ignoring the setting):
  //   prepay → full price now;  deposit → deposit_percent% now (rest paid at the salon);
  //   at_salon (and UNSET) → no online charge (book + pay in person) — reject the online pay step
  //   (fail-closed, so an at-salon / unconfigured shop never wrongly charges online; the booking
  //   flow offers only in-person). Unset defaults to at_salon to match the settings default,
  //   PayConfirmStep, and the bookings-route guard (the other 3 of 4 places all treat unset as at_salon).
  const paymentMode = String((salon as { payment_mode?: string }).payment_mode ?? "at_salon");
  // at_salon: online pay is the CUSTOMER's optional choice (mockup 24d, owner
  // 2026-06-12) — an intent request only ever comes from a customer who picked
  // "Jetzt online bezahlen", so charge the full price. The accepts_online_payment
  // + stripe_account_id gates above still fail-closed for unconfigured salons.
  const fullRappen = toRappen(priceChf);
  const depositPct = Math.min(100, Math.max(1, Number((salon as { deposit_percent?: number }).deposit_percent) || 20));
  const baseAmountRappen = paymentMode === "deposit"
    ? Math.max(50, Math.round((fullRappen * depositPct) / 100))   // >= CHF 0.50 (Stripe minimum)
    : fullRappen;                                                  // prepay AND at_salon-by-choice => full

  // 3b. PROMO CODE (fix 2026-06-30). The booking flow collected a promo code and
  //     /api/promo/validate told the customer "you save CHF X", but this charge step never
  //     applied it (the customer was billed full price). Apply it server-side here: RE-VALIDATE
  //     the persisted code against the LIVE promo_codes row + ALL constraints (active, valid_from,
  //     valid_until, max_uses, min_booking_amount, salon applicability, min_tier). The client
  //     value is NEVER trusted. Only a fully-valid promo reduces the gross; an invalid / expired /
  //     over-limit / min-tier-failing / min-spend-failing code is ignored (no discount), so it can
  //     never lower the charge. The discount is computed off the FULL service price (priceChf) the
  //     same way /api/promo/validate does, then capped so it can never exceed what is charged now
  //     and never push below the Stripe minimum. promoCodeApplied is carried in PI metadata so the
  //     webhook increments promo_codes.current_uses exactly once on payment success.
  //
  //     PRECEDENCE vs the Solen Plus member waiver (step 6b): INDEPENDENT, no double-discount.
  //     The PROMO is a price reduction the SALON bears (it lowers the gross, so it lowers the salon
  //     payout). The member waiver is a COMMISSION reduction SOLEN bears (it lowers Solen's
  //     application_fee; salon payout unchanged). Order: promo first (it defines the gross and the
  //     fee base), then the member waiver on the resulting commission.
  let promoDiscountRappen = 0;
  let promoCodeApplied: string | null = null;
  if (booking.promo_code) {
    try {
      const { data: promo } = await admin
        .from("promo_codes")
        .select("id, code, discount_type, discount_value, min_booking_amount, max_uses, current_uses, salon_id, valid_from, valid_until, is_active, min_tier")
        .eq("code", booking.promo_code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      const now = new Date();
      const fullPriceChf = priceChf;                  // promo % and min-spend are judged on the FULL price
      let promoOk = !!promo;
      if (promo) {
        if (promo.valid_from && new Date(promo.valid_from) > now) promoOk = false;
        if (promo.valid_until && new Date(promo.valid_until) < now) promoOk = false;
        if (promo.max_uses !== null && (promo.current_uses ?? 0) >= promo.max_uses) promoOk = false;
        if (fullPriceChf < (promo.min_booking_amount ?? 0)) promoOk = false;
        if (promo.salon_id && promo.salon_id !== booking.salon_id) promoOk = false;
        // min_tier gate (Solen Plus, LOYALTY_STRUCTURE.md §12.4): the server derives the LIVE tier;
        // a guest (no user_id) is base and fails any tier-gated promo. Mirrors /api/promo/validate.
        if (promo.min_tier === "gold" || promo.min_tier === "platinum") {
          const tier = await getCurrentTier(admin, booking.user_id);
          if (!tierAtLeast(tier, promo.min_tier as Tier)) promoOk = false;
        }
      }

      if (promo && promoOk) {
        // Discount CHF off the FULL price, identical formula to /api/promo/validate.
        const discountChf = promo.discount_type === "percent"
          ? Math.round(fullPriceChf * (promo.discount_value / 100) * 100) / 100
          : Math.min(promo.discount_value, fullPriceChf);
        const discountRappen = toRappen(discountChf);
        // Cap: never exceed what is charged now (baseAmountRappen), and never push the charge
        // below the Stripe minimum (50 Rappen). On the deposit path the promo can at most reduce
        // the deposit down to that floor.
        promoDiscountRappen = Math.max(0, Math.min(discountRappen, baseAmountRappen - 50));
        if (promoDiscountRappen > 0) {
          promoCodeApplied = promo.code;
        } else {
          promoDiscountRappen = 0;  // discount fully clamped away, treat as not applied
        }
      }
    } catch (err) {
      // Never let a promo lookup error block or under-charge: fail to NO discount (full charge).
      console.error("[booking-pay-intent] promo re-validation failed; charging without discount:", err);
      promoDiscountRappen = 0;
      promoCodeApplied = null;
    }
  }

  // The gross the customer pays NOW = base (full / deposit) minus the validated promo discount,
  // floored at the Stripe minimum by the cap above. The platform fee and member waiver below all
  // compute off THIS post-promo amount (instruction: subtract the discount BEFORE the fee).
  const amountRappen = baseAmountRappen - promoDiscountRappen;

  // 4. Re-verify the slot is still held by THIS booking (don't take a card for
  //    a slot that was released / re-booked under us).
  if (booking.slot_id) {
    const { data: slot } = await admin
      .from("availability_slots")
      .select("id, status, booking_id")
      .eq("id", booking.slot_id)
      .single();
    if (!slot || (slot.status !== "booked" && slot.status !== "available") || (slot.booking_id && slot.booking_id !== booking.id)) {
      return NextResponse.json({ error: "Slot no longer available" }, { status: 409 });
    }
  }

  // 5. Resolve the Stripe customer (the card is saved on it for off-session reuse).
  let customerId: string | null = null;
  const guestEmail = (booking.guest_email ?? "").trim();
  try {
    if (booking.user_id) {
      // Logged-in: one shared customer per user, persisted on profiles.
      const { data: profile } = await admin
        .from("profiles")
        .select("stripe_customer_id, display_name, email")
        .eq("id", booking.user_id)
        .single();
      customerId = profile?.stripe_customer_id ?? null;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: profile?.email ?? session?.user?.email ?? undefined,
          name: profile?.display_name ?? undefined,
          metadata: { solen_user_id: booking.user_id },
        });
        customerId = customer.id;
        await admin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", booking.user_id);
      }
    } else {
      // Guest: a fresh customer keyed off the guest booking (no profiles row).
      // The id is carried in PI metadata and persisted onto the booking by the
      // webhook (bookings.stripe_customer_id), so SP-AC/SP-3 can reuse it.
      const customer = await stripe.customers.create({
        email: guestEmail || undefined,
        name: (booking.guest_name ?? "").trim() || undefined,
        metadata: { guest: "1", booking_id: booking.id },
      });
      customerId = customer.id;
    }
  } catch (err) {
    console.error("[booking-pay-intent] Stripe customer create/resolve failed:", err);
    return NextResponse.json({ error: "Could not initialize payment" }, { status: 500 });
  }

  // 6. Platform commission (Connect destination charge).
  const { data: commissionSetting } = await admin
    .from("platform_settings").select("value").eq("key", "commission").single();
  const commissionRate = (commissionSetting?.value?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT) / 100;
  const platformFeeRappen = Math.round(amountRappen * commissionRate);

  // 6b. Solen Plus member discount (commission-waiver, LOYALTY_STRUCTURE.md §12.1).
  //     Logged-in members only, Connect path only (the waiver works by REDUCING
  //     application_fee; with no connected account there's no fee to waive). The salon
  //     payout is unchanged (charge and fee drop by the same amount); Solen's margin
  //     absorbs the discount, hard-capped at salons.member_commission_waiver_rate.
  //     resolveMemberDiscount reads the LIVE tier (current_user_tier on-read), the
  //     per-tier % (tier_perks) and the per-window use cap. Never throws (→ no discount).
  let chargeRappen = amountRappen;
  let appFeeRappen = platformFeeRappen;
  let appliedTier: string | null = null;
  let tierDiscountRappen = 0;
  if (salon.stripe_account_id && booking.user_id) {
    const waiverRate = Number(
      (salon as { member_commission_waiver_rate?: number }).member_commission_waiver_rate ?? 0.02
    );
    const md = await resolveMemberDiscount({
      db: admin,
      userId: booking.user_id,
      amountRappen,
      commissionRappen: platformFeeRappen,
      waiverRate,
      windowMonths: LOYALTY.windowMonths,
    });
    if (md.discountRappen > 0) {
      chargeRappen = md.customerChargeRappen;
      appFeeRappen = md.applicationFeeRappen;
      appliedTier = md.appliedTier;
      tierDiscountRappen = md.discountRappen;
    }
  }

  // 7. Build the PaymentIntent.
  const intentParams: Parameters<typeof stripe.paymentIntents.create>[0] = {
    amount: chargeRappen,                  // Rappen — full/deposit minus any member discount (§12.1)
    currency: "chf",
    capture_method: "automatic",           // FULL PREPAY (captured immediately on success), not a hold
    customer: customerId ?? undefined,
    setup_future_usage: "off_session",     // saves the PM for later off-session charges (SP-AC / SP-3)
    // Wallets (Apple/Google Pay) + Link surface via the Payment Element;
    // allow_redirects:"never" excludes redirect/BNPL (TWINT etc.) that can't
    // be saved off-session or don't fit prepay-then-recharge. Matches walk-in.
    // Apple Pay needs the domain registered in Stripe (HTTPS, never localhost) —
    // see _tasks/APPLE_PAY_SETUP.md.
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: {
      type: "booking",
      booking_id: booking.id,
      salon_id: booking.salon_id,
      salon_name: salon.name ?? "",
      service_id: booking.service_id,
      service_name: service.name_de ?? "",
      customer_id: booking.user_id ?? "",
      guest_email: guestEmail,
      slot_id: booking.slot_id ?? "",
      starts_at: booking.starts_at ?? "",
      staff_member_id: booking.staff_member_id ?? "",
      payment_mode: paymentMode,                                  // deposit | prepay
      full_price_chf: String(priceChf),                           // full service price (for the remainder)
      deposit_percent: paymentMode === "deposit" ? String(depositPct) : "",
      applied_tier: appliedTier ?? "",                            // Solen Plus tier that funded a member discount
      tier_discount_rappen: tierDiscountRappen ? String(tierDiscountRappen) : "",
      // Promo (fix 2026-06-30): the validated code + Rappen discount applied to the gross. The
      // webhook reads promo_code on payment success to increment promo_codes.current_uses ONCE
      // (idempotently). Empty string when no valid promo applied (so the webhook no-ops).
      promo_code: promoCodeApplied ?? "",
      promo_discount_rappen: promoDiscountRappen ? String(promoDiscountRappen) : "",
    },
    description: `Buchung: ${service.name_de ?? "Service"} @ ${salon.name ?? "Salon"}`,
  };
  // Connect destination charge: route funds to the salon, keep the commission.
  // on_behalf_of is implied by transfer_data.destination for destination charges
  // — Stripe forbids setting both, so we do NOT set on_behalf_of here.
  if (salon.stripe_account_id) {
    intentParams.application_fee_amount = appFeeRappen; // commission minus the member-discount waiver
    intentParams.transfer_data = { destination: salon.stripe_account_id };
  }

  // 8. Idempotency: a deterministic key per (booking, base amount) so a double-submit
  //    of the pay step reuses the SAME PaymentIntent (no double PI, no double
  //    charge). §10b#11. Stripe replays the original response for a matching key.
  // Key on baseAmountRappen, the PRE-DISCOUNT full/deposit amount (stable per booking), NOT
  // chargeRappen and NOT the post-promo amountRappen. BOTH the member discount (live tier + use
  // cap) AND the promo (a code can expire / hit its use cap between two pay attempts) can change
  // between attempts on the same booking; keying on a varying amount would fork the key and mint a
  // SECOND capturable PaymentIntent (orphan-PI: money captured, booking never marked paid because
  // the webhook keys paid-state on the PI id we overwrite). Both discounts are still applied via
  // intentParams.amount + application_fee_amount above; a replay returns the original PI's amounts.
  const idempotencyKey = createHash("sha256")
    .update(`booking-pay:${booking.id}:${baseAmountRappen}`)
    .digest("hex");

  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.create(intentParams, { idempotencyKey });
  } catch (err) {
    console.error("[booking-pay-intent] PaymentIntent create failed:", err);
    return NextResponse.json({ error: "Could not create payment" }, { status: 500 });
  }

  // 9. Stamp the PI id onto the booking now so the webhook's booking_id-keyed
  //    handlers (succeeded → paid; payment_failed → release slot) can also match
  //    by payment_intent_id, and a refund later has it. Also record the applied
  //    Solen Plus tier + discount (Rappen) for payout reconciliation + use-counting
  //    (§12.3). Written pre-payment; the use only counts once payment_status='paid'.
  // Derive the audit cols + response from the RETURNED PaymentIntent, not this request's
  // freshly-computed md: Stripe may have REPLAYED an earlier intent for this booking via
  // the stable idempotency key, in which case the real applied discount is whatever that
  // intent carried. platformFeeRappen is stable per booking (amountRappen×rate), so
  // actualDiscount = platformFee − the PI's real (possibly reduced) application_fee.
  const piChargeRappen = paymentIntent.amount ?? chargeRappen;
  const piFeeRappen = paymentIntent.application_fee_amount ?? platformFeeRappen;
  const actualDiscountRappen = Math.max(0, platformFeeRappen - piFeeRappen);
  const actualTier = (paymentIntent.metadata?.applied_tier as string) || null;
  // Promo: read back from the RETURNED PI (replay-safe, same rule as the member discount above).
  // A replayed idempotent intent carries whatever promo was applied originally.
  const actualPromoCode = (paymentIntent.metadata?.promo_code as string) || null;
  const actualPromoDiscountRappen = Number(paymentIntent.metadata?.promo_discount_rappen ?? 0) || 0;

  const bookingPatch: Record<string, unknown> = { payment_intent_id: paymentIntent.id };
  if (actualDiscountRappen > 0 && actualTier) {
    bookingPatch.applied_tier = actualTier;
    bookingPatch.tier_discount_amount = actualDiscountRappen; // Rappen, == the PI's application_fee reduction
  }
  await admin.from("bookings").update(bookingPatch).eq("id", booking.id);

  const piChargeChf = piChargeRappen / 100;
  return NextResponse.json({
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
    amount: piChargeChf,                                 // charged NOW (full or deposit, minus promo + member discount)
    full_price: priceChf,                                // full service price
    member_discount: actualDiscountRappen ? actualDiscountRappen / 100 : 0, // CHF off via Solen Plus (commission waiver)
    applied_tier: actualTier,                            // tier that funded the member discount (null when none)
    promo_code: actualPromoCode,                         // the validated promo code applied (null when none)
    promo_discount: actualPromoDiscountRappen ? actualPromoDiscountRappen / 100 : 0, // CHF off via the promo code
    payment_mode: paymentMode,                           // deposit | prepay
    deposit_percent: paymentMode === "deposit" ? depositPct : null,
    remaining_at_salon: paymentMode === "deposit" ? Math.round(((priceChf - (actualPromoDiscountRappen ? actualPromoDiscountRappen / 100 : 0)) - piChargeChf) * 100) / 100 : 0,
    service_name: service.name_de,
  });
}
