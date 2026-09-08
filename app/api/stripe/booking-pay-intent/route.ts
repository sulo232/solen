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
import { loadPricedBundle } from "@/lib/pricing/bundle";
import { capStoredValueRappen, getAvailableCreditRappen, isMoneySpendFlagEnabled } from "@/lib/credits/redeem";
import { bookingPayIntentSchema } from "@/lib/validations";
import { createHash } from "crypto";
import type { Database } from "@/lib/database.types";
import { localizedField, type AppLocale } from "@/lib/i18n/localized-field";

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
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const rateLimited = await applyRateLimit(
    paymentLimiter,
    userId ? { userId } : { ip: getClientIp(req) }
  );
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => null);
  const parsedBody = bookingPayIntentSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "booking_id is required", code: "VALIDATION_ERROR" }, { status: 400 });
  }
  const booking_id = parsedBody.data.booking_id;
  // Credits + voucher spend path: a voucher code offered fresh in THIS request's body (no
  // FE field reaches here today, see lib/validations.ts's bookingPayIntentSchema comment).
  // Re-validated live against the vouchers row by redeem_voucher itself below; never trusted.
  const requestedVoucherCode = parsedBody.data.voucher_code ?? null;

  const admin = createAdminSupabaseClient();

  // 1. Load the booking (server-trusted anchor). It already carries salon,
  //    service, slot, time, staff, and — for guests — guest_email/name.
  const { data: booking } = await admin
    .from("bookings")
    .select("id, user_id, salon_id, service_id, slot_id, starts_at, staff_member_id, status, payment_status, guest_email, guest_name, extras_addons, promo_code, bundle_id")
    .eq("id", booking_id)
    .single();
  if (!booking) return NextResponse.json({ error: "Booking not found", code: "NOT_FOUND" }, { status: 404 });

  // Authorize: a logged-in user may only pay their OWN booking. A guest booking
  // (user_id IS NULL) is payable without a session — the booking row is the
  // authorization anchor here (SP-2's hashed-token resolveBookingActor is the
  // stronger gate and lands later). Reject a guest trying to pay a user's booking.
  if (booking.user_id) {
    if (!userId || userId !== booking.user_id) {
      return NextResponse.json({ error: "Not authorized for this booking", code: "FORBIDDEN" }, { status: 403 });
    }
  }

  // Don't re-charge an already-paid booking (idempotent at the booking level).
  if (booking.payment_status === "paid") {
    return NextResponse.json({ error: "Booking is already paid", code: "ALREADY_PAID" }, { status: 409 });
  }
  // Only a live booking awaiting payment can be charged.
  if (!["pending", "pending_approval", "confirmed"].includes(booking.status ?? "")) {
    return NextResponse.json({ error: "Booking is not payable", code: "NOT_PAYABLE" }, { status: 409 });
  }

  // 2. Salon must accept online payment.
  const { data: salon } = await admin
    .from("salons")
    .select("name, stripe_account_id, accepts_online_payment, payment_mode, deposit_percent, member_commission_waiver_rate")
    .eq("id", booking.salon_id)
    .single();
  if (!salon) return NextResponse.json({ error: "Salon not found", code: "NOT_FOUND" }, { status: 404 });
  if (!salon.accepts_online_payment) {
    return NextResponse.json({ error: "Salon does not accept online payments", code: "ONLINE_PAYMENT_NOT_ACCEPTED" }, { status: 400 });
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
    .select("price, salon_id, is_active, name_de, name_en, name_fr, name_it")
    .eq("id", booking.service_id)
    .single();
  if (!service || service.salon_id !== booking.salon_id || service.is_active === false) {
    return NextResponse.json({ error: "Service not found for this salon", code: "NOT_FOUND" }, { status: 404 });
  }

  // Booking customer's own locale (A9-email-locale pattern, mirrors lib/bookings/notify-refund.ts):
  // the PI description/metadata service name shows on the card statement/receipt, so it must
  // match the paying customer's language, not German by default. A guest booking (user_id
  // null) has no profile and bookingPayIntentSchema carries no locale field, so it stays "de",
  // the same schema gap the guest branches in notify-refund.ts / notify-upcharge.ts report.
  let piLocale: AppLocale = "de";
  if (booking.user_id) {
    const { data: payerProfile } = await admin.from("profiles").select("locale").eq("id", booking.user_id).maybeSingle();
    piLocale = (payerProfile?.locale as AppLocale) ?? "de";
  }
  const serviceName = localizedField(service, "name", piLocale) || "Service";
  // Multi-service: add the booking's server-set extras_addons (resolved at booking time from the
  // services table, never the client) to the primary service price, so the charge = the full total.
  let extrasChf = 0;
  try {
    const ex = (booking as { extras_addons?: string | null }).extras_addons
      ? JSON.parse((booking as { extras_addons?: string }).extras_addons as string)
      : [];
    if (Array.isArray(ex)) extrasChf = ex.reduce((s: number, a: { price?: number }) => s + (Number(a?.price) || 0), 0);
  } catch (e) {
    console.error("[booking-pay-intent] failed to parse extras_addons:", e);
  }
  let priceChf = Number(service.price) + extrasChf;

  // A5 FIX-1 (critical, money): when this booking was priced against a bundle, the charge base
  // MUST be the recomputed BUNDLE price, not the undiscounted service+extras sum. Before this fix
  // booking.bundle_id was selected (line ~62) and never used, so an online-pay percent/custom
  // bundle would charge the FULL sum (seed: 440 charged vs 374 quoted). Recompute server-side via
  // the SAME shared util + guards the bookings route uses (is_active, salon match, >=2 items,
  // selected-set == item-set), BEFORE promo/member/tier discounts. A stale/inactive/mismatched
  // bundle 400s here , NEVER a full-sum fallback (a wrong charge is worse than a blocked one).
  if (booking.bundle_id) {
    const selectedIds = [
      booking.service_id,
      ...(() => {
        try {
          const ex = (booking as { extras_addons?: string | null }).extras_addons
            ? JSON.parse((booking as { extras_addons?: string }).extras_addons as string)
            : [];
          return Array.isArray(ex) ? ex.map((a: { id?: string }) => a?.id).filter(Boolean) as string[] : [];
        } catch {
          return [] as string[];
        }
      })(),
    ].filter(Boolean) as string[];
    const bundleResult = await loadPricedBundle(admin, {
      bundleId: booking.bundle_id as string,
      salonId: booking.salon_id as string,
      selectedServiceIds: [...new Set(selectedIds)],
    });
    if (!bundleResult.ok) {
      // Stale/inactive/mismatched bundle: refuse rather than charge the wrong (full-sum) amount.
      return NextResponse.json({ error: "Bundle no longer available", code: bundleResult.code }, { status: 400 });
    }
    priceChf = bundleResult.bundle.priceChf; // the bundle price becomes the charge base
  }

  if (!Number.isFinite(priceChf) || priceChf < 0.5) {
    return NextResponse.json({ error: "Service has no valid price", code: "INVALID_PRICE" }, { status: 400 });
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
  //     and never push below the Stripe minimum. The use is reserved atomically at checkout via
  //     reserve_promo_use (below), not incremented later by the webhook; promoCodeApplied is carried
  //     in PI metadata so the post-PI readback (below) can reconcile and release an orphaned
  //     reservation if Stripe replays an earlier, differently-discounted PaymentIntent.
  //
  //     PRECEDENCE vs the Solen Plus member waiver (step 6b): INDEPENDENT, no double-discount.
  //     The PROMO is a price reduction the SALON bears (it lowers the gross, so it lowers the salon
  //     payout). The member waiver is a COMMISSION reduction SOLEN bears (it lowers Solen's
  //     application_fee; salon payout unchanged). Order: promo first (it defines the gross and the
  //     fee base), then the member waiver on the resulting commission.
  let promoDiscountRappen = 0;
  let promoFullDiscountRappen = 0; // full intended discount off the FULL price (deposit path: NOT clamped to the deposit)
  let promoCodeApplied: string | null = null;
  let reserved = false; // lifted out of the promo block so the post-PI reconciliation (below) can read it
  if (booking.promo_code) {
    try {
      const { data: promo } = await admin
        .from("promo_codes")
        .select("id, code, discount_type, discount_value, min_booking_amount, max_uses, current_uses, salon_id, valid_from, valid_until, is_active, min_tier")
        .eq("code", booking.promo_code.toUpperCase())
        // is_active is the ONLY gate needed here (punch-list fix, 2026-07-10). A purchased
        // voucher (app/api/vouchers/create, is_purchased_voucher:true) is inserted
        // is_active:false and is flipped true ONLY by the Stripe webhook AFTER its
        // PaymentIntent actually succeeds (voucher-handler.ts's handleVoucherPurchase), so an
        // unpaid mint can never pass this filter , is_active alone already closes the
        // mint-without-paying exploit. A blanket exclusion of is_purchased_voucher rows was
        // tried here previously, but that left a genuinely PAID voucher with no working
        // redemption path at all: a purchased voucher is deliberately a Stripe
        // Promotion-Code-backed row that reuses this SAME promo_code checkout field (see
        // vouchers/create's own top-of-file comment) , there is no separate redemption
        // surface for it. So purchased vouchers are intentionally left in this lookup,
        // identical to how /api/promo/validate's preview lookup already treats them (it never
        // special-cased is_purchased_voucher), so the checkout preview and the real charge
        // never disagree.
        .eq("is_active", true)
        .maybeSingle();

      const now = new Date();
      const fullPriceChf = priceChf;                  // promo % and min-spend are judged on the FULL price
      let promoOk = !!promo;
      if (promo) {
        if (promo.valid_from && new Date(promo.valid_from) > now) promoOk = false;
        if (promo.valid_until && new Date(promo.valid_until) < now) promoOk = false;
        // max_uses is no longer pre-checked here (stale current_uses read → race under
        // concurrent checkouts). reserve_promo_use (below) enforces the cap atomically.
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
          // Atomically reserve ONE use for this booking now that a real (non-clamped) discount
          // is about to be applied. reserve_promo_use is a SECURITY DEFINER RPC that enforces
          // max_uses in one atomic statement (no read-then-write race across concurrent
          // checkouts) and is idempotent per booking (safe to call again on a retry/replay).
          // Only when it confirms a reservation do we keep the discount; if the promo is
          // exhausted, drop it rather than charge the reduced amount for an unreserved use.
          const { data: reservedResult } = await admin.rpc("reserve_promo_use", {
            p_booking: booking.id,
            p_code: promo.code,
          });
          reserved = reservedResult === true;
          if (reserved) {
            promoCodeApplied = promo.code;
            promoFullDiscountRappen = discountRappen; // customer gets the FULL discount off their total, even when it exceeds the deposit charged now
          } else {
            promoDiscountRappen = 0;
            promoCodeApplied = null;
          }
        } else {
          promoDiscountRappen = 0;  // discount fully clamped away, treat as not applied
        }
      }
    } catch (err) {
      // Never let a promo lookup error block or under-charge: fail to NO discount (full charge).
      console.error("[booking-pay-intent] promo re-validation failed; charging without discount:", err);
      promoDiscountRappen = 0;
      promoFullDiscountRappen = 0;
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
      return NextResponse.json({ error: "Slot no longer available", code: "SLOT_TAKEN" }, { status: 409 });
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
          email: profile?.email ?? user?.email ?? undefined,
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
    return NextResponse.json({ error: "Could not initialize payment", code: "PAYMENT_INIT_FAILED" }, { status: 500 });
  }

  // 6. Platform commission (Connect destination charge).
  const { data: commissionSetting } = await admin
    .from("platform_settings").select("value").eq("key", "commission").single();
  const commissionSettingValue = commissionSetting?.value as { rate_percent?: number } | null;
  const commissionRate = (commissionSettingValue?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT) / 100;
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
  let memberReserved = false; // lifted out so the post-PI reconciliation (below) can read it
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
      // bookingId routes resolveMemberDiscount's own cap check through the atomic
      // reserve_member_discount RPC (advisory-locked, idempotent per booking) instead of the
      // non-atomic count-then-insert fallback, so this caller no longer needs its own separate
      // reserve call: the reservation already happened inside resolveMemberDiscount when it
      // returns a positive discount.
      bookingId: booking.id,
    });
    if (md.discountRappen > 0 && md.appliedTier) {
      memberReserved = true;
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
      service_name: serviceName,
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
      promo_full_discount_rappen: promoFullDiscountRappen ? String(promoFullDiscountRappen) : "",
    },
    description: `Buchung: ${serviceName} @ ${salon.name ?? "Salon"}`,
  };
  // Connect destination charge: route funds to the salon, keep the commission.
  // on_behalf_of is implied by transfer_data.destination for destination charges
  // — Stripe forbids setting both, so we do NOT set on_behalf_of here.
  if (salon.stripe_account_id) {
    intentParams.application_fee_amount = appFeeRappen; // commission minus the member-discount waiver
    intentParams.transfer_data = { destination: salon.stripe_account_id };
  } else {
    // DEV-ONLY, NO LIVE-MONEY PATH: this is the else of the Connect guard at
    // step 2 above (`!salon.stripe_account_id`). Without a connected account
    // this PaymentIntent carries no application_fee_amount / transfer_data,
    // so the charge lands entirely on the platform account with ZERO
    // commission split, the shape cron-health SLICE stripe-refunds (d)
    // names. In production step 2 already returns 409 NOT_CONNECTED before
    // this line is ever reached; this is a SECOND, redundant guard so that
    // if that earlier check is ever loosened, reordered, or bypassed by a
    // future edit, creating a real commission-less PaymentIntent throws
    // instead of silently shipping.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "[booking-pay-intent] dev-only no-Connect fallback reached in production, refusing to create a commission-less PaymentIntent",
      );
    }
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
    // The PI was never created, so neither discount will ever be charged , release any
    // reservation THIS request made now, instead of leaking it until the abandon-sweep
    // cancels the booking (~15-45 min over-count on the promo pool / member-discount cap).
    if (reserved) {
      try {
        await admin.rpc("release_promo_use", { p_booking: booking.id });
      } catch (e) {
        console.error("[booking-pay-intent] promo release after PI-create failure failed:", e);
      }
    }
    if (memberReserved) {
      try {
        await admin.rpc("release_member_discount", { p_booking: booking.id });
      } catch (e) {
        console.error("[booking-pay-intent] member-discount release after PI-create failure failed:", e);
      }
    }
    return NextResponse.json({ error: "Could not create payment", code: "PAYMENT_INIT_FAILED" }, { status: 500 });
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

  // Reconcile the member-discount reservation against the ACTUALLY-charged PI. If this request
  // reserved a use (memberReserved === true) but Stripe replayed an earlier PI that carries NO
  // member discount (idempotency-key replay of a pre-reservation full-fee PI), the reservation is
  // orphaned , the discount will never be charged on this booking. Release it so the per-window
  // use count is not over-counted (mirrors the promo reconciliation below).
  if (memberReserved && actualDiscountRappen === 0) {
    try {
      const { error: relErr } = await admin.rpc("release_member_discount", { p_booking: booking.id });
      if (relErr) console.error("[booking-pay-intent] orphaned member-discount release returned error:", relErr.message);
    } catch (relErr) {
      console.error("[booking-pay-intent] orphaned member-discount release failed:", relErr);
    }
  }

  // Promo: read back from the RETURNED PI (replay-safe, same rule as the member discount above).
  // A replayed idempotent intent carries whatever promo was applied originally.
  const actualPromoCode = (paymentIntent.metadata?.promo_code as string) || null;

  // Reconcile the promo reservation against the ACTUALLY-charged PI. If this request reserved a use
  // (reserved === true) but Stripe replayed an earlier PI whose promo does NOT match what we reserved
  // (idempotency-key replay of a pre-reservation full-price PI), the reservation is orphaned , the
  // discount will never be charged on this booking. Release it so the promo pool is not over-counted.
  if (reserved === true && actualPromoCode !== promoCodeApplied) {
    try {
      const { error: relErr } = await admin.rpc("release_promo_use", { p_booking: booking.id });
      if (relErr) console.error("[booking-pay-intent] orphaned promo reservation release returned error:", relErr.message);
    } catch (relErr) {
      console.error("[booking-pay-intent] orphaned promo reservation release failed:", relErr);
    }
  }

  // Clamped = the discount actually taken off the ONLINE charge (>= Stripe 0.50 floor).
  const actualPromoDiscountRappen = Number(paymentIntent.metadata?.promo_discount_rappen ?? 0) || 0;
  // Deposit-path fix: the AT-SALON remainder (and the "you saved" figure on the deposit path) use the
  // FULL intended discount off the full price, NOT the deposit-clamped charge discount, so a promo bigger
  // than the deposit is not silently lost (the customer would otherwise overpay the leftover at the salon).
  // Falls back to the clamped value for PaymentIntents created before this field existed (Stripe replay).
  const actualPromoFullDiscountRappen = Number(paymentIntent.metadata?.promo_full_discount_rappen ?? paymentIntent.metadata?.promo_discount_rappen ?? 0) || 0;

  // 9b. CREDITS + VOUCHER SPEND (owner-approved 2026-07-11), applied AFTER promo + member
  //     discount, and AFTER the PaymentIntent itself exists. Unlike promo/member-discount
  //     (baked into intentParams before create), the credit/voucher ledger's restore
  //     functions are keyed on the REAL Stripe PaymentIntent id, matching every other place
  //     that restores against it later: issue-refund.ts (booking.payment_intent_id),
  //     issue-purchase-refund.ts (purchase.stripe_payment_intent_id), and the webhook's
  //     payment_intent.payment_failed handler (pi.id). That id does not exist until
  //     paymentIntents.create returns, so redeem happens here against the RECONCILED
  //     piChargeRappen/piFeeRappen (the real PI's actual amounts, replay-safe like the
  //     promo/tier reconciliation above), then the just-created PI is SHRUNK via
  //     paymentIntents.update (legal pre-confirmation, status requires_payment_method).
  //     A failed update restores the just-applied redemption immediately so the ledger never
  //     shows a spend that was never actually reflected in what is charged. This is the
  //     closest available mirror of the promo "reserve then release-on-create-failure"
  //     pattern given the ledger's real-PI-id keying (a considered, documented deviation:
  //     redeem-then-shrink instead of reserve-then-create, forced by Stripe only assigning
  //     the PI id at creation).
  let creditAppliedRappen = 0;
  let voucherAppliedRappen = 0;
  let voucherCodeApplied: string | null = null;
  let finalChargeRappen = piChargeRappen;
  let finalFeeRappen = piFeeRappen;
  const hasConnectFee = !!salon.stripe_account_id;

  if (paymentIntent.status === "requires_payment_method") {
    // Credits: logged-in customers only (referral credit is earned per-user), flag-gated.
    if (booking.user_id) {
      try {
        const creditsOn = await isMoneySpendFlagEnabled(admin, "credits");
        if (creditsOn) {
          const balanceRappen = await getAvailableCreditRappen(admin, booking.user_id);
          if (balanceRappen > 0) {
            const capRappen = capStoredValueRappen({
              desiredRappen: balanceRappen,
              chargeRappen: finalChargeRappen,
              appFeeRappen: finalFeeRappen,
              hasConnectFee,
            });
            if (capRappen > 0) {
              const { data: appliedChf, error: creditErr } = await admin.rpc("redeem_user_credits", {
                p_user: booking.user_id,
                p_amount: capRappen / 100,
                p_booking: booking.id,
                p_pi: paymentIntent.id,
              });
              if (creditErr) {
                console.error("[booking-pay-intent] redeem_user_credits failed:", creditErr.message);
              } else {
                creditAppliedRappen = toRappen(Number(appliedChf) || 0);
                finalChargeRappen -= creditAppliedRappen;
                if (hasConnectFee) finalFeeRappen -= creditAppliedRappen;
              }
            }
          }
        }
      } catch (err) {
        console.error("[booking-pay-intent] credit redemption failed; charging without credit:", err);
      }
    }

    // Voucher: guest-tolerant (a gift voucher is not tied to earning it), flag-gated. The
    // RPC's own least(remaining, p_amount) caps against the LIVE vouchers row under a row
    // lock, so requesting "everything left to spend" here is safe, it never over-applies.
    if (requestedVoucherCode) {
      try {
        const vouchersOn = await isMoneySpendFlagEnabled(admin, "vouchers");
        if (vouchersOn) {
          const requestRappen = capStoredValueRappen({
            desiredRappen: Number.MAX_SAFE_INTEGER,
            chargeRappen: finalChargeRappen,
            appFeeRappen: finalFeeRappen,
            hasConnectFee,
          });
          if (requestRappen > 0) {
            const { data: appliedChf, error: voucherErr } = await admin.rpc("redeem_voucher", {
              p_code: requestedVoucherCode,
              p_salon_id: booking.salon_id,
              p_amount: requestRappen / 100,
              // p_user is a plain nullable `uuid` param in the SQL function (no NOT NULL,
              // used as a nullable redeemed_by/user_id downstream) -- the generated Args
              // type is just non-optional (no SQL DEFAULT), it doesn't forbid null. Guest
              // bookings genuinely pass null here (this path is explicitly guest-tolerant).
              p_user: (booking.user_id ?? null) as string,
              p_booking: booking.id,
              p_pi: paymentIntent.id,
            });
            if (voucherErr) {
              console.error("[booking-pay-intent] redeem_voucher failed:", voucherErr.message);
            } else {
              voucherAppliedRappen = toRappen(Number(appliedChf) || 0);
              if (voucherAppliedRappen > 0) {
                voucherCodeApplied = requestedVoucherCode;
                finalChargeRappen -= voucherAppliedRappen;
                if (hasConnectFee) finalFeeRappen -= voucherAppliedRappen;
              }
            }
          }
        }
      } catch (err) {
        console.error("[booking-pay-intent] voucher redemption failed; charging without voucher:", err);
      }
    }

    // Only touch Stripe when something was actually applied, and only when the target
    // differs from the PI's current amount (a replay of an already-shrunk PI is then a
    // pure no-op, never a redundant Stripe call).
    if ((creditAppliedRappen > 0 || voucherAppliedRappen > 0) && finalChargeRappen !== piChargeRappen) {
      try {
        const updateParams: Parameters<typeof stripe.paymentIntents.update>[1] = {
          amount: finalChargeRappen,
        };
        if (hasConnectFee) updateParams.application_fee_amount = finalFeeRappen;
        await stripe.paymentIntents.update(paymentIntent.id, updateParams);
      } catch (updateErr) {
        console.error("[booking-pay-intent] PaymentIntent amount update for credit/voucher failed; restoring:", updateErr);
        if (creditAppliedRappen > 0) {
          try {
            await admin.rpc("restore_user_credits", { p_pi: paymentIntent.id });
          } catch (restoreErr) {
            console.error("[booking-pay-intent] credit restore after failed PI update failed:", restoreErr);
          }
        }
        if (voucherAppliedRappen > 0) {
          try {
            await admin.rpc("restore_voucher", { p_pi: paymentIntent.id });
          } catch (restoreErr) {
            console.error("[booking-pay-intent] voucher restore after failed PI update failed:", restoreErr);
          }
        }
        // The ORIGINAL (pre-credit/voucher) PI amount is what will actually be charged now,
        // so the in-memory figures and the response below must say so too.
        creditAppliedRappen = 0;
        voucherAppliedRappen = 0;
        voucherCodeApplied = null;
        finalChargeRappen = piChargeRappen;
        finalFeeRappen = piFeeRappen;
      }
    }
  }

  const bookingPatch: Database["public"]["Tables"]["bookings"]["Update"] = { payment_intent_id: paymentIntent.id };
  if (actualDiscountRappen > 0 && actualTier) {
    bookingPatch.applied_tier = actualTier;
    bookingPatch.tier_discount_amount = actualDiscountRappen; // Rappen, == the PI's application_fee reduction
  }
  if (voucherCodeApplied) {
    bookingPatch.voucher_code = voucherCodeApplied;
  }
  await admin.from("bookings").update(bookingPatch).eq("id", booking.id);

  const piChargeChf = finalChargeRappen / 100;
  const creditAppliedChf = creditAppliedRappen ? creditAppliedRappen / 100 : 0;
  const voucherAppliedChf = voucherAppliedRappen ? voucherAppliedRappen / 100 : 0;
  const remainingAtSalonChf = paymentMode === "deposit"
    ? Math.max(0, Math.round(((priceChf - (actualPromoFullDiscountRappen ? actualPromoFullDiscountRappen / 100 : 0) - creditAppliedChf - voucherAppliedChf) - piChargeChf) * 100) / 100)
    : 0;
  // Persist the discount-aware at-salon remainder so the confirmation screen can display it (deposit only).
  if (paymentMode === "deposit") {
    await admin.from("bookings").update({ remaining_at_salon: remainingAtSalonChf }).eq("id", booking.id);
  }
  return NextResponse.json({
    client_secret: paymentIntent.client_secret,
    payment_intent_id: paymentIntent.id,
    amount: piChargeChf,                                 // charged NOW (full or deposit, minus promo + member discount + credit + voucher)
    full_price: priceChf,                                // full service price
    member_discount: actualDiscountRappen ? actualDiscountRappen / 100 : 0, // CHF off via Solen Plus (commission waiver)
    applied_tier: actualTier,                            // tier that funded the member discount (null when none)
    promo_code: actualPromoCode,                         // the validated promo code applied (null when none)
    promo_discount: (paymentMode === "deposit" ? actualPromoFullDiscountRappen : actualPromoDiscountRappen) / 100, // CHF off via the promo code (deposit shows the full saving spread across deposit+at-salon; prepay shows what was actually charged)
    credit_applied: creditAppliedChf,                    // CHF off via the customer's referral credit balance
    voucher_code: voucherCodeApplied,                    // the redeemed voucher code (null when none / not applied)
    voucher_applied: voucherAppliedChf,                  // CHF off via the voucher
    payment_mode: paymentMode,                           // deposit | prepay
    deposit_percent: paymentMode === "deposit" ? depositPct : null,
    // Uses the FULL discount so the at-salon remainder absorbs any discount beyond the deposit. Floored
    // at 0: on a ~100%-off promo the online charge cannot go below Stripe's 0.50 minimum, so up to CHF 0.50
    // can remain uncredited , that residual is Stripe-mandated, not the discount-clamp bug (down from up to CHF 15.50).
    remaining_at_salon: remainingAtSalonChf,
    service_name: serviceName,
  });
}
