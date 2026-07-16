export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingConfirmation, type EmailLocale } from "@/lib/email";
import { paymentFailedNotification } from "@/lib/email-templates/booking-notifications";
import { trackServerEvent } from "@/lib/posthog-server";
import { getServerEnv } from "@/lib/env";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";
import { reportError } from "@/lib/error-report";
import { withRequestId } from "@/lib/request-id";

export const runtime = "nodejs";

// POST /api/stripe/webhook
// Webhook URL to add in Stripe Dashboard:
//   https://solen.ch/api/stripe/webhook
// Events to enable: payment_intent.succeeded, payment_intent.payment_failed,
//                   payment_intent.canceled, payment_intent.amount_capturable_updated
//                   (walk-in ticket backstop), charge.dispute.created,
//                   charge.dispute.closed, account.updated
// OBS-01: shared withRequestId (lib/request-id.ts, #8c) puts x-request-id on EVERY response
// this route returns, without touching each individual `return NextResponse.json(...)` inside
// the handler. handleWebhook is the original handler body, unchanged in control flow, with
// requestId threaded into its console.error/warn + sendEmail/reportError calls so one Stripe
// event delivery's log lines can be traced end to end (a real inbound x-request-id, e.g. a
// future proxy, is reused; Stripe itself sends none, so this normally mints a fresh id per
// delivery).
//
// A 500 on throw (the wrapper's own catch path) is also correct for Stripe specifically: it
// makes Stripe RETRY the event, which is what we want when our handler crashed, and the
// idempotency claim in processed_webhook_events is released on throw so the retry can re-run
// cleanly.
export const POST = withRequestId("stripe/webhook", handleWebhook);

async function handleWebhook(req: NextRequest, requestId: string): Promise<NextResponse> {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const env = getServerEnv();
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err, { requestId });
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Atomic idempotency claim. The `processed_webhook_events` table has
  // event_id as PRIMARY KEY, so a duplicate insert returns Postgres error
  // code 23505 (unique_violation). This is the only safe way to claim an
  // event without a check-then-insert race.
  //
  // Pre-2026-05-16 this was check-then-insert: the claim was committed
  // BEFORE handlers ran, so a mid-handler throw would mark the event
  // "processed" and Stripe would never retry. AND the claim insert's
  // error was never checked, so the table-missing-in-prod bug went
  // undetected — every event ran every retry. Both fixed below.
  const { error: claimError } = await admin
    .from("processed_webhook_events")
    .insert({ event_id: event.id });

  if (claimError) {
    if (claimError.code === "23505") {
      // Already processed — duplicate Stripe delivery, no-op.
      return NextResponse.json({ received: true });
    }
    // Other DB error (e.g. connection blip). Return 5xx so Stripe retries.
    console.error("[stripe/webhook] failed to claim event:", claimError, { event_id: event.id, type: event.type, requestId });
    return NextResponse.json({ error: "Claim failed" }, { status: 500 });
  }

  // Handlers wrapped in try/catch — on failure we release the claim so
  // Stripe's retry will re-run the event. Without this, a transient error
  // mid-handler would leave the event marked done with partial state.
  try {
  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;

      // Walk-in payments run their own flow (ticket issued at authorization via
      // amount_capturable_updated); skip the scheduled-booking/payout path here.
      if (pi.metadata?.type === "walk_in") break;

      // Tips (booking or walk-in): recorded 'pending' at creation (app/api/tips,
      // /api/walkin/tip) → flip to 'paid' here. 100% to the salon, so NO payout-ledger /
      // commission row (tips aren't platform revenue). Idempotent on the PI id.
      if (pi.metadata?.type === "tip") {
        const { error: tipErr } = await admin
          .from("tips").update({ status: "paid" }).eq("stripe_payment_intent_id", pi.id);
        if (tipErr) console.error("[StripeWebhook] tip status update failed:", tipErr.message, { requestId });
        break;
      }

      // Handle voucher purchases before booking handler
      const { handleVoucherPurchase } = await import("./voucher-handler");
      const wasVoucherPurchase = await handleVoucherPurchase(pi);
      if (wasVoucherPurchase) break;

      // Salon GIFT vouchers (type:"voucher" from /api/vouchers) — finalize remaining_amount
      // + email the recipient the code. Reliable here regardless of 3DS/redirect, replacing
      // the dead client-side confirm path. Guard like the handlers around it.
      const { handleSalonVoucherPaid } = await import("./salon-voucher-handler");
      const wasSalonVoucher = await handleSalonVoucherPaid(pi);
      if (wasSalonVoucher) break;

      // Package + retail purchases: finalize the purchase row (paid_amount in
      // Rappen, status) + write a salon_payouts ledger row so the canonical
      // charge.refunded reconciler can adjust it when issuePurchaseRefund runs.
      // Each handler is an early-return guard like handleVoucherPurchase.
      const { handlePurchasePaid } = await import("./purchase-handler");
      const wasPurchase = await handlePurchasePaid(pi);
      if (wasPurchase) break;

      // Gift-card purchases: activate the card (is_active:true) + email the recipient
      // the redeemable code — both ONLY on real payment success (previously the email
      // was sent eagerly at PI creation and the card was never activated). Guard like
      // the handlers above.
      const { handleGiftCardPurchase } = await import("./gift-card-handler");
      const wasGiftCard = await handleGiftCardPurchase(pi);
      if (wasGiftCard) break;

      const bookingId = pi.metadata?.booking_id;
      if (bookingId) {
        // SP-G2 full prepay: type:"booking" PIs are captured in full at booking
        // (not a hold). Persist the paid state + the saved-card ids (for SP-AC /
        // SP-3 off-session charges) and confirm the booking. Amounts are already
        // integer Rappen straight from Stripe (pi.amount / pi.application_fee_amount).
        if (pi.metadata?.type === "booking") {
          const pmId = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id ?? null;
          const custId = typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null;
          const paidAmount = pi.amount ?? 0; // Rappen — the VAT-inclusive gross the customer paid.

          // VAT/MWST (per-salon, VAT-inclusive). Read the salon's registration
          // + rate; a registered salon's paid_amount is split into net + VAT by
          // subtraction (computeVat), a non-registered salon stores no VAT.
          // GRACEFUL: if the salon vat columns aren't present yet (migration not
          // applied) the select errors → default to not-registered, never crash.
          let vat = { netRappen: paidAmount, vatRappen: 0, ratePercent: 0 };
          if (pi.metadata?.salon_id) {
            const { data: vatSalon } = await admin
              .from("salons")
              .select("vat_registered, vat_rate")
              .eq("id", pi.metadata.salon_id)
              .maybeSingle();
            const { computeVat } = await import("@/lib/vat");
            vat = computeVat(paidAmount, {
              registered: (vatSalon as any)?.vat_registered ?? false,
              ratePercent: (vatSalon as any)?.vat_rate ?? 8.1,
            });
          }

          // ADVANCE-ONLY guard (Stripe does not guarantee event ordering), mirroring the
          // payment_failed / setup_intent.succeeded guards below. A late payment_intent.succeeded
          // (first delivery, so the processed_webhook_events claim above does not block it) must
          // not resurrect a booking that was already cancelled/completed/no_show after this PI was
          // created, only advance a booking still in a pre-payment/payable state (the same set
          // booking-pay-intent's own payability check gates on, app/api/stripe/booking-pay-intent/route.ts).
          const { data: confirmedRows } = await admin.from("bookings").update({
            status: "confirmed",
            payment_status: "paid",
            paid_amount: paidAmount,                           // Rappen
            platform_fee: pi.application_fee_amount ?? 0,      // Rappen (the fee issueRefund later reverses)
            vat_amount: vat.vatRappen,                         // Rappen, VAT portion of paid_amount.
            net_amount: vat.netRappen,                         // Rappen, paid_amount minus vat_amount.
            vat_rate: vat.ratePercent,                         // rate applied (0 if salon not registered).
            stripe_customer_id: custId,
            stripe_payment_method_id: pmId,
          }).eq("payment_intent_id", pi.id)
            .in("status", ["pending", "pending_approval", "confirmed"])
            .select("id, user_id, referral_code, promo_code");
          // Confirm the held slot ONLY if the booking update above actually advanced a still-live
          // booking, AND only the slot still held by THIS booking (.eq("booking_id", bookingId)):
          // a late event must never re-book a slot that was freed or reassigned after cancel.
          if (pi.metadata?.slot_id && confirmedRows?.length) {
            await admin.from("availability_slots")
              .update({ status: "booked", booking_id: bookingId })
              .eq("id", pi.metadata.slot_id)
              .eq("booking_id", bookingId);
          }

          // Referral fix: complete a pending referral here, now that payment has actually
          // succeeded, never at booking-create time (which could be abandoned before payment).
          // Gated on confirmedRows being non-empty so this only runs when THIS event genuinely
          // just advanced the booking to confirmed (not a late/duplicate delivery after the
          // booking was already confirmed or moved past it). The helper's own compare-and-swap
          // makes a second call (webhook retry) a safe no-op, never a double credit.
          const confirmedRow = confirmedRows?.[0] as { id: string; user_id: string | null; referral_code: string | null; promo_code: string | null } | undefined;
          if (confirmedRow?.user_id && confirmedRow.referral_code) {
            const { completeReferralForFirstBooking } = await import("@/lib/referral/complete-referral");
            await completeReferralForFirstBooking(admin, confirmedRow.user_id, confirmedRow.referral_code);
          }

          // Promo redemption: the use is now RESERVED atomically at checkout (booking-pay-intent's
          // reserve_promo_use call), not counted here on success. No increment on this path anymore
          // (incrementing again here would double-count on top of the checkout-time reservation).
          //
          // promo_counted_at (Ring 8, additive column, migration
          // 20260711150000_backend_loop_promo_counted_flag.sql) is NOT a second counter, it is a
          // CAS-claimed audit/reconcile marker, set once the first time this webhook observes a
          // promo-bearing booking as genuinely confirmed+paid (distinct from promo_use_reserved,
          // which is set earlier at checkout, before payment succeeds). Gated on confirmedRow the
          // same way the referral completion above is, so a late/duplicate delivery after the
          // booking already advanced never re-claims it. Never calls increment_promo_use or
          // reserve_promo_use again (both already ran/are idempotent at checkout), this is
          // observability only, so a schema-cache miss (column not migrated yet) is caught, logged,
          // and swallowed, never blocking the money-critical booking confirm above it.
          if (confirmedRow?.id && confirmedRow.promo_code) {
            try {
              const { error: promoClaimErr } = await admin
                .from("bookings")
                .update({ promo_counted_at: new Date().toISOString() })
                .eq("id", confirmedRow.id)
                .is("promo_counted_at", null);
              if (promoClaimErr) console.error("[StripeWebhook] promo_counted_at claim failed:", promoClaimErr.message, { requestId });
            } catch (promoClaimCatchErr) {
              console.error("[StripeWebhook] promo_counted_at claim threw:", promoClaimCatchErr, { requestId });
            }
          }
        } else if (pi.metadata?.type !== "pre_charge") {
          // A pre_charge PI (app/api/cron/pre-charge/route.ts) is CAPTURED IN FULL,
          // not a deposit hold, and the cron already set payment_status='paid'
          // synchronously when it captured. Without this guard, this async
          // success delivery (which only knows type !== 'booking') would
          // overwrite payment_status back to 'deposit_held', corrupting an
          // already fully-paid booking. Genuine deposit-hold PIs (no type or
          // any other non-'booking' type) still take the downgrade below.
          await admin.from("bookings").update({
            payment_status: "deposit_held",
          }).eq("payment_intent_id", pi.id);
        }

        // Record commission payout for Stripe-processed bookings
        const grossAmount = (pi.amount ?? 0) / 100; // Rappen → CHF
        if (grossAmount > 0 && pi.metadata?.salon_id) {
          // Commission = the ACTUAL application_fee on the PI, NOT a re-derived rate.
          // booking-pay-intent may have REDUCED application_fee_amount to fund a Solen
          // Plus member discount (LOYALTY_STRUCTURE.md §12.1); re-deriving rate×gross
          // here would over-report Solen's commission + under-report the salon's net on
          // every member booking, and disagree with bookings.platform_fee (written above
          // from the same pi.application_fee_amount). Mirrors the off-session branch
          // below. Falls back to the platform rate ONLY on the dev no-Connect
          // platform-charge path, where the PI carries no application_fee.
          let commissionAmount: number;
          let commissionPercent: number;
          if (pi.application_fee_amount != null) {
            commissionAmount = Math.round(pi.application_fee_amount) / 100; // Rappen → CHF (real, reduced)
            commissionPercent =
              grossAmount > 0 ? Math.round((commissionAmount / grossAmount) * 100 * 100) / 100 : 0;
          } else {
            const { data: commissionSetting } = await admin
              .from("platform_settings")
              .select("value")
              .eq("key", "commission")
              .single();
            const commissionSettingValue = commissionSetting?.value as { rate_percent?: number } | null;
            commissionPercent = commissionSettingValue?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT;
            commissionAmount = Math.round(grossAmount * (commissionPercent / 100) * 100) / 100;
          }
          const netAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;

          // Upsert on the unique stripe_payment_intent_id index so a webhook
          // re-delivery after a mid-handler failure (claim released) doesn't
          // create a second payout ledger row or 500 on the unique violation.
          await admin.from("salon_payouts").upsert({
            booking_id: bookingId,
            salon_id: pi.metadata.salon_id,
            stripe_payment_intent_id: pi.id,
            gross_amount: grossAmount,
            commission_percent: commissionPercent,
            commission_amount: commissionAmount,
            net_amount: netAmount,
            status: "recorded",
          }, { onConflict: "stripe_payment_intent_id" });
        }

        // Send booking confirmation email to customer
        const { data: booking } = await admin
          .from("bookings")
          .select("user_id, starts_at, paid_amount, vat_amount, net_amount, vat_rate, services(name_de), salons(name, vat_number)")
          .eq("id", bookingId)
          .single();

        // Guest bookings (user_id IS NULL) skip the user-keyed notification +
        // analytics here — guest email/SMS is the owner's later piece (SP-2).
        // The auth.admin.getUserById / trackServerEvent calls below all require a
        // real user_id, so guarding on it keeps the webhook from throwing on guests.
        if (booking?.user_id) {
          await trackServerEvent(booking.user_id, "payment_succeeded", {
            booking_id: bookingId,
            salon_id: pi.metadata?.salon_id,
            amount: (pi.amount ?? 0) / 100,
          });
          await trackServerEvent(booking.user_id, "booking_completed", {
            booking_id: bookingId,
            salon_id: pi.metadata?.salon_id,
          });

          const { data: profile } = await admin
            .from("profiles")
            .select("locale")
            .eq("id", booking.user_id)
            .single();
          const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
          const { data: authUser } = await admin.auth.admin.getUserById(booking.user_id);
          const email = authUser?.user?.email;
          if (email) {
            const localeMap: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };
            const bcp47 = localeMap[locale] ?? "de-CH";
            const dateStr = new Date(booking.starts_at).toLocaleDateString(bcp47, { weekday: "long", day: "numeric", month: "long" });
            const timeStr = new Date(booking.starts_at).toLocaleTimeString(bcp47, { hour: "2-digit", minute: "2-digit" });
            const serviceName = (booking.services as any)?.[`name_${locale}`] ?? (booking.services as any)?.name_de ?? "Service";
            const salonName = (booking.salons as any)?.name ?? "Salon";
            
            // Price + Swiss VAT breakdown, read back from the row this handler just wrote (cast —
            // the generated types don't yet include the new VAT columns). rate 0/null ⇒ the
            // template shows just the total (Kleinunternehmen / not registered).
            const b = booking as any;
            const bVatRate = Number(b.vat_rate ?? 0);
            const priceVars = {
              total: `CHF ${((b.paid_amount ?? 0) / 100).toFixed(2)}`,
              ...(bVatRate > 0 ? {
                net: `CHF ${((b.net_amount ?? 0) / 100).toFixed(2)}`,
                vat: `CHF ${((b.vat_amount ?? 0) / 100).toFixed(2)}`,
                rate: bVatRate % 1 === 0 ? String(bVatRate) : bVatRate.toFixed(1),
                vatNumber: (booking.salons as any)?.vat_number ?? undefined,
              } : {}),
            };
            const { sendNotification } = await import("@/lib/notifications");
            await sendNotification({
              userId: booking.user_id,
              type: "booking_confirmed",
              title: "Buchung bestätigt",
              body: `Deine Buchung für ${serviceName} bei ${salonName} wurde bestätigt.`,
              data: { bookingId },
              emailParams: {
                to: email,
                locale,
                vars: { service: serviceName, salon: salonName, date: dateStr, time: timeStr, ...priceVars }
              }
            }).catch((err) => console.error("[StripeWebhook] failed to send booking confirmation notification:", err, { requestId }));
          }
        }
      }

      // ── ADDITIVE (off-session charge payout ledger + async upcharge finalize) ──
      // Off-session UPCHARGE (type:'upcharge') and policy-FEE (type:'cancellation_fee' /
      // 'no_show_fee') PaymentIntents move real Connect money + accrue an
      // application_fee, but the booking branch above only writes a salon_payouts
      // row for type:'booking'. Without the row below, the salon earnings ledger +
      // generated invoices + the reconcile cron under-report these captures.
      //
      // These PIs are created by lib/bookings/off-session-charge.ts; their metadata
      // (lib/bookings/dispute-engine.ts chargeUpcharge / lib/bookings/charge-fee.ts)
      // carries type + booking_id (+ dispute_id for upcharge) but NOT salon_id, so
      // salon_id is resolved from the booking (salon_payouts.salon_id is NOT NULL).
      // Conservative: if we can't resolve the salon, write nothing.
      const offSessionType = pi.metadata?.type;
      const isUpchargeCharge = offSessionType === "upcharge";
      const isFeeCharge = offSessionType === "cancellation_fee" || offSessionType === "no_show_fee";
      if (isUpchargeCharge || isFeeCharge) {
        try {
          const chargeBookingId = pi.metadata?.booking_id ?? null;
          // salon_id is not in the off-session PI metadata, resolve from the booking.
          let chargeSalonId: string | null = pi.metadata?.salon_id ?? null;
          if (!chargeSalonId && chargeBookingId) {
            const { data: chargeBooking } = await admin
              .from("bookings")
              .select("salon_id")
              .eq("id", chargeBookingId)
              .maybeSingle();
            chargeSalonId = chargeBooking?.salon_id ?? null;
          }

          // Same idempotent ledger row as the booking branch, keyed on the PI. Amounts
          // come straight from the PI (real Rappen → CHF) — the upcharge/fee already
          // carry the real application_fee_amount; we never recompute from a rate.
          const grossCharge = (pi.amount ?? 0) / 100; // Rappen → CHF
          if (grossCharge > 0 && chargeSalonId) {
            const commissionCharge = Math.round((pi.application_fee_amount ?? 0)) / 100; // Rappen → CHF
            const netCharge = Math.round((grossCharge - commissionCharge) * 100) / 100;
            const commissionPercentCharge =
              grossCharge > 0 ? Math.round((commissionCharge / grossCharge) * 100 * 100) / 100 : 0;
            await admin.from("salon_payouts").upsert({
              booking_id: chargeBookingId,
              salon_id: chargeSalonId,
              stripe_payment_intent_id: pi.id,
              gross_amount: grossCharge,
              commission_percent: commissionPercentCharge,
              commission_amount: commissionCharge,
              net_amount: netCharge,
              status: "recorded",
            }, { onConflict: "stripe_payment_intent_id" });
          } else {
            console.error(
              "[stripe/webhook] off-session charge missing salon_id/amount, skipping payout row:",
              { event_id: event.id, pi: pi.id, type: offSessionType, booking_id: chargeBookingId, requestId },
            );
          }

          // N3 backend half — ASYNC upcharge finalize. chargeUpcharge advances
          // booking_disputes salon_approved → 'charged' synchronously, but when the
          // off-session charge needed 3-D Secure the PI was parked at 'salon_approved'
          // and only succeeds later via this webhook. CAS-advance it here, idempotent
          // (only flips a row still in 'salon_approved'); mirror chargeUpcharge's
          // case_events 'charged' row on the winning CAS.
          if (isUpchargeCharge) {
            const disputeId = pi.metadata?.dispute_id ?? null;
            if (disputeId) {
              const { data: casDispute, error: casDisputeErr } = await admin
                .from("booking_disputes")
                .update({ status: "charged", resolved_amount: pi.amount ?? 0 })
                .eq("id", disputeId)
                .eq("status", "salon_approved") // CAS — idempotent: no-op if already 'charged'
                .select("id")
                .maybeSingle();
              if (casDisputeErr) {
                console.error(
                  `[stripe/webhook] upcharge dispute CAS failed for dispute ${disputeId}:`,
                  casDisputeErr.message,
                  { requestId },
                );
              } else if (casDispute) {
                // Winning CAS only (the synchronous path lost the race or never ran).
                const { writeCaseEvent } = await import("@/lib/bookings/dispute-engine");
                await writeCaseEvent(admin, {
                  disputeId,
                  actorRole: "system",
                  action: "charged",
                  fromStatus: "salon_approved",
                  toStatus: "charged",
                  amount: pi.amount ?? 0,
                  note: "upcharge difference charged to saved card (async 3-D Secure completion)",
                });
              }
            }
          }
        } catch (chargeLedgerErr) {
          // Non-fatal: never break the rest of the handler over the ledger/finalize
          // write (mirrors the claim-release discipline — the money already moved).
          console.error(
            "[stripe/webhook] off-session charge ledger/finalize failed:",
            chargeLedgerErr,
            { event_id: event.id, pi: pi.id, type: offSessionType, requestId },
          );
        }
      }
      break;
    }

    case "payment_intent.amount_capturable_updated": {
      // Walk-in backstop: a manual-capture hold was just authorized. If the customer's
      // confirm request never landed (dropped connection), issue the ticket here so a paid
      // hold never strands without a number. Idempotent via the unique payment_intent index.
      const obj = event.data.object;
      if (obj.metadata?.type === "walk_in" && obj.metadata?.salon_id) {
        const pi = await stripe.paymentIntents.retrieve(obj.id, { expand: ["latest_charge.payment_method_details"] });
        const { createWalkinTicket } = await import("@/lib/barber/walkin-ticket");
        const result = await createWalkinTicket(admin, {
          pi,
          salonId: obj.metadata.salon_id,
          serviceId: obj.metadata?.service_id || null,
          preferredBarberId: obj.metadata?.preferred_barber_id || null,
        });
        console.log("[stripe/webhook] walk-in backstop ensured ticket", result.ticket_number, "for PI", obj.id);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object;

      // Tips (booking or walk-in): a tip PI can carry booking_id in metadata, so it
      // MUST be handled here first, before the booking-cancellation logic below
      // (which reads pi.metadata?.booking_id) misreads a failed tip as a failed
      // booking payment and cancels/frees the booking's slot. Flip to 'failed' so
      // the tips_one_pending_per_booking / tips_one_pending_per_walkin partial
      // unique indexes don't permanently block a retry tip. Idempotent (a repeat
      // delivery just re-sets 'failed'). Mirrors the succeeded-case tip branch above.
      if (pi.metadata?.type === "tip") {
        const { error: tipErr } = await admin
          .from("tips").update({ status: "failed" }).eq("stripe_payment_intent_id", pi.id).neq("status", "paid");
        if (tipErr) console.error("[StripeWebhook] tip status update (failed) failed:", tipErr.message, { requestId });
        break;
      }

      const bookingId = pi.metadata?.booking_id;
      if (bookingId) {
        // Release the booking slot.
        // ADVANCE-ONLY guard (Stripe does not guarantee event ordering). A late
        // payment_failed must not cancel a booking that an earlier-but-later-
        // delivered succeeded event already moved to 'paid' (or 'deposit_held') —
        // only cancel from a pre-payment state.
        const { data: cancelledRows } = await admin.from("bookings").update({
          status: "cancelled",
          payment_status: "none",
        }).eq("payment_intent_id", pi.id)
          .in("payment_status", ["pending", "none", "card_saved"])
          .select("id");
        // Free the slot ONLY if this event actually cancelled a (still pre-payment)
        // booking. A late payment_failed arriving after an earlier-but-later-delivered
        // succeeded event already flipped the booking to paid/confirmed must NOT free a
        // slot that belongs to a now-paid booking (fix D).
        if (cancelledRows?.length) {
          await admin.from("availability_slots").update({ status: "available" })
            .eq("id", pi.metadata?.slot_id ?? "");

          // Return the reserved promo use (if any) now that this booking is genuinely
          // abandoned/failed (only reached when the ADVANCE-ONLY guard above actually
          // cancelled it, never on a late event after the booking already paid).
          // Idempotent + never throws on a booking that never reserved.
          try {
            const { error: releasePromoErr } = await admin.rpc("release_promo_use", { p_booking: bookingId });
            if (releasePromoErr) console.error("[StripeWebhook] release_promo_use failed:", releasePromoErr.message, { requestId });
          } catch (releasePromoCatchErr) {
            console.error("[StripeWebhook] release_promo_use threw:", releasePromoCatchErr, { requestId });
          }

          // Credits + voucher spend (owner-approved 2026-07-11): booking-pay-intent may have
          // already redeemed against THIS PI (keyed on pi.id) before the customer's confirm
          // attempt failed. Restore now, mirroring release_promo_use above. Both RPCs are
          // idempotent (loop over matching ledger rows, no-op when there are none).
          try {
            const { error: restoreCreditsErr } = await admin.rpc("restore_user_credits", { p_pi: pi.id });
            if (restoreCreditsErr) console.error("[StripeWebhook] restore_user_credits failed:", restoreCreditsErr.message, { requestId });
          } catch (restoreCreditsCatchErr) {
            console.error("[StripeWebhook] restore_user_credits threw:", restoreCreditsCatchErr, { requestId });
          }
          try {
            const { error: restoreVoucherErr } = await admin.rpc("restore_voucher", { p_pi: pi.id });
            if (restoreVoucherErr) console.error("[StripeWebhook] restore_voucher failed:", restoreVoucherErr.message, { requestId });
          } catch (restoreVoucherCatchErr) {
            console.error("[StripeWebhook] restore_voucher threw:", restoreVoucherCatchErr, { requestId });
          }
        }

        // Notify customer about payment failure
        const { data: booking } = await admin
          .from("bookings")
          .select("user_id, starts_at, services(name_de), salons(name)")
          .eq("id", bookingId)
          .single();

        // Guest bookings skip the user-keyed failure notification (owner's later
        // piece); the slot/booking release above already ran for them.
        if (booking?.user_id) {
          await trackServerEvent(booking.user_id, "payment_failed", {
            booking_id: bookingId,
            salon_id: pi.metadata?.salon_id,
            amount: (pi.amount ?? 0) / 100,
          });

          const { data: profile } = await admin
            .from("profiles")
            .select("locale")
            .eq("id", booking.user_id)
            .single();
          const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
          const { data: authUser } = await admin.auth.admin.getUserById(booking.user_id);
          const email = authUser?.user?.email;
          if (email) {
            const dateStr = new Date(booking.starts_at).toLocaleDateString("de-CH", { weekday: "long", day: "numeric", month: "long" });
            const serviceName = (booking.services as any)?.name_de ?? "Service";
            const salonName = (booking.salons as any)?.name ?? "Salon";
            await sendEmail(paymentFailedNotification(email, { service: serviceName, salon: salonName, date: dateStr }, locale), requestId).catch((err) => console.error("[StripeWebhook] failed to send payment failure notification:", err, { requestId }));
          }
        }
      }
      break;
    }

    case "payment_intent.canceled": {
      const pi = event.data.object;

      // Tips (booking or walk-in): same guard as payment_intent.payment_failed
      // above, flip to 'failed' so a canceled tip PI doesn't stay 'pending' forever
      // and permanently block a future tip via the tips_one_pending_per_booking /
      // tips_one_pending_per_walkin partial unique indexes. Idempotent (a repeat
      // delivery just re-sets 'failed').
      if (pi.metadata?.type === "tip") {
        const { error: tipErr } = await admin
          .from("tips").update({ status: "failed" }).eq("stripe_payment_intent_id", pi.id).neq("status", "paid");
        if (tipErr) console.error("[StripeWebhook] tip status update (canceled) failed:", tipErr.message, { requestId });
        break;
      }

      // Non-tip canceled PIs: no existing booking-cancellation handling wired to
      // this event type (payment_intent.payment_failed above owns that logic), so
      // this is a safe no-op rather than guessing at cancellation semantics here.
      break;
    }

    case "charge.dispute.created": {
      const dispute = event.data.object;
      console.warn("[stripe/webhook] Dispute created:", dispute.id, dispute.amount / 100, "CHF", { requestId });
      if (env.ADMIN_EMAIL) {
        await sendEmail({
          to: env.ADMIN_EMAIL,
          subject: `[solen.ch] Stripe Dispute: CHF ${(dispute.amount / 100).toFixed(2)}`,
          html: `<p>A new Stripe dispute has been opened.</p><ul><li><strong>Dispute ID:</strong> ${dispute.id}</li><li><strong>Amount:</strong> CHF ${(dispute.amount / 100).toFixed(2)}</li><li><strong>Reason:</strong> ${dispute.reason}</li><li><strong>Status:</strong> ${dispute.status}</li></ul><p><a href="https://dashboard.stripe.com/disputes/${dispute.id}">View in Stripe →</a></p>`,
        }, requestId).catch((err) => console.error("[StripeWebhook] failed to send dispute admin notification:", err, { requestId }));
      } else {
        console.warn("[stripe/webhook] ADMIN_EMAIL not set, skipping dispute notification", { requestId });
      }

      // Link the chargeback to its booking + write an audit row. A card-network
      // chargeback is a separate external system from booking_disputes, so we do
      // NOT create a booking_disputes row — just an audit_log breadcrumb so the
      // dispute is traceable to the booking. dispute.payment_intent can arrive as
      // an expanded object, so normalize it the same way the booking branch does
      // for pi.payment_method / pi.customer. actor_id is null: the card network,
      // not a human, opened this (mirrors the cron audit-log inserts).
      try {
        const disputePiId =
          typeof dispute.payment_intent === "string"
            ? dispute.payment_intent
            : dispute.payment_intent?.id ?? null;
        let disputeBookingId: string | null = null;
        if (disputePiId) {
          const { data: disputeBooking } = await admin
            .from("bookings")
            .select("id")
            .eq("payment_intent_id", disputePiId)
            .maybeSingle();
          disputeBookingId = disputeBooking?.id ?? null;
        }
        await admin.from("audit_log").insert({
          actor_id: null,
          action: "chargeback_opened",
          target_type: "booking",
          target_id: disputeBookingId,
          metadata: {
            note: "chargeback opened",
            dispute_id: dispute.id,
            amount: dispute.amount / 100, // Rappen → CHF
            reason: dispute.reason,
            status: dispute.status,
            payment_intent: disputePiId,
            booking_id: disputeBookingId,
          },
        });
      } catch (chargebackAuditErr) {
        // Non-fatal: the admin email already fired; never break the handler over
        // the audit/link write (mirrors the off-session ledger discipline).
        console.error(
          "[stripe/webhook] chargeback created link/audit failed:",
          chargebackAuditErr,
          { event_id: event.id, dispute: dispute.id, requestId },
        );
      }
      break;
    }

    case "charge.dispute.closed": {
      // A card-network chargeback resolved. On `lost`, the funds were already
      // withdrawn from the salon's connected balance (destination charge), so
      // decrement that PI's salon_payouts row like a refund. UNLIKE charge.refunded,
      // Stripe does not hand this handler a cumulative "amount disputed" fact on
      // the charge (charge.refunded's amount_refunded trick has no dispute
      // equivalent without an extra Stripe API call, which this handler avoids), so
      // recomputing straight off the CURRENT row is not safe: decrementing
      // payout.gross_amount by dispute.amount is only correct on the FIRST
      // delivery. A claim-release retry (Stripe redelivery after a mid-flight
      // crash, once the write already committed once) would decrement AGAIN off
      // the already-lowered value, silently underpaying the salon (the ring 8 bug).
      // Fixed with the same CAS-marker idempotency shape this file already uses
      // for promo_counted_at (above) and the booking_disputes 'charged' transition
      // (below): a single UPDATE ... WHERE lost_dispute_id IS NULL claims the
      // decrement AND the marker atomically, so only the FIRST delivery for this
      // dispute.id ever mutates the row; every later delivery finds the marker
      // already set and no-ops. On `won` the funds were returned: since `created`
      // only logged (no ledger touch), there is nothing to restore, leave the
      // ledger as-is. Either way, write an audit row with the outcome.
      const dispute = event.data.object;
      console.warn("[stripe/webhook] Dispute closed:", dispute.id, dispute.status, dispute.amount / 100, "CHF", { requestId });
      const disputePiId =
        typeof dispute.payment_intent === "string"
          ? dispute.payment_intent
          : dispute.payment_intent?.id ?? null;

      let disputeBookingId: string | null = null;
      let ledgerAdjusted = false;
      if (disputePiId) {
        // Resolve the booking for the audit breadcrumb.
        const { data: disputeBooking } = await admin
          .from("bookings")
          .select("id")
          .eq("payment_intent_id", disputePiId)
          .maybeSingle();
        disputeBookingId = disputeBooking?.id ?? null;

        if (dispute.status === "lost") {
          // Guarded read (no payout row means nothing to adjust). Explicit column
          // list, never select("*") on this table (a table that also carries
          // salon_id/booking_id), only the fields this recompute actually needs.
          const { data: payout } = await admin
            .from("salon_payouts")
            .select("id, gross_amount, commission_percent")
            .eq("stripe_payment_intent_id", disputePiId)
            .maybeSingle();
          if (payout) {
            const newGross = Math.max(0, payout.gross_amount - dispute.amount / 100); // Rappen → CHF
            const newComm = Math.round(newGross * (payout.commission_percent / 100) * 100) / 100;
            const newNet = Math.round((newGross - newComm) * 100) / 100;
            // CAS: the decrement AND the lost_dispute_id marker are claimed in the
            // SAME update, gated on the marker still being unset. Only the delivery
            // that wins this WHERE clause actually mutates the row, a retry or
            // redelivery for the same dispute.id matches 0 rows and no-ops, so the
            // row converges on a single decrement no matter how many times this
            // event (or its retry) runs.
            const { data: claimedRow, error: claimErr } = await admin
              .from("salon_payouts")
              .update({
                gross_amount: newGross,
                commission_amount: newComm,
                net_amount: newNet,
                lost_dispute_id: dispute.id,
              })
              .eq("id", payout.id)
              .is("lost_dispute_id", null) // CAS guard: only the first delivery for THIS dispute wins.
              .select("id")
              .maybeSingle();
            if (claimErr) {
              // Column not migrated yet (PGRST204) or a genuine DB error: never apply
              // a decrement we can't mark as claimed, that would reopen the exact
              // double-decrement bug this CAS closes. Non-fatal, logged for the
              // reconcile cron (mirrors the promo_counted_at graceful-degrade above).
              console.error(
                "[stripe/webhook] dispute lost ledger CAS failed:",
                claimErr.message,
                { event_id: event.id, dispute: dispute.id, payout_id: payout.id, requestId },
              );
            } else {
              // claimedRow is null when an earlier delivery already set
              // lost_dispute_id (this is that no-op retry); non-null only on the
              // single delivery that actually won the CAS and mutated the row.
              ledgerAdjusted = !!claimedRow;
            }
          }
        }
      }

      try {
        await admin.from("audit_log").insert({
          actor_id: null,
          action: dispute.status === "lost" ? "chargeback_lost" : "chargeback_closed",
          target_type: "booking",
          target_id: disputeBookingId,
          metadata: {
            note:
              dispute.status === "lost"
                ? "chargeback lost — salon payout decremented"
                : dispute.status === "won"
                  ? "chargeback won — ledger unchanged"
                  : `chargeback closed (${dispute.status}) — ledger unchanged`,
            dispute_id: dispute.id,
            amount: dispute.amount / 100, // Rappen → CHF
            reason: dispute.reason,
            status: dispute.status,
            ledger_adjusted: ledgerAdjusted,
            payment_intent: disputePiId,
            booking_id: disputeBookingId,
          },
        });
      } catch (chargebackAuditErr) {
        // Non-fatal: the ledger adjustment (the money-bearing part) already ran;
        // never break the handler over the audit write.
        console.error(
          "[stripe/webhook] chargeback closed audit failed:",
          chargebackAuditErr,
          { event_id: event.id, dispute: dispute.id, status: dispute.status, requestId },
        );
      }
      break;
    }

    case "setup_intent.succeeded": {
      const si = event.data.object as any;
      const bookingId = si.metadata?.booking_id;
      if (bookingId && si.payment_method) {
        // ADVANCE-ONLY guard (Stripe does not guarantee event ordering). A late
        // setup_intent.succeeded must not downgrade a booking already advanced to
        // a money-bearing state by an earlier-but-later-delivered payment event —
        // only apply card_saved from a lower/none state.
        await admin.from("bookings").update({
          payment_status: "card_saved",
          stripe_setup_intent_id: si.id,
          stripe_customer_id: si.customer,
          stripe_payment_method_id: si.payment_method,
        }).eq("id", bookingId)
          .in("payment_status", ["pending", "none", "card_saved"]);
      }
      break;
    }

    case "account.application.deauthorized": {
      const account = event.data.object as any;
      console.warn("[stripe/webhook] Account deauthorized:", account.id, { requestId });
      await admin.from("salons").update({
        accepts_online_payment: false,
      }).eq("stripe_account_id", account.id);
      if (env.ADMIN_EMAIL) {
        await sendEmail({
          to: env.ADMIN_EMAIL,
          subject: `[solen.ch] Stripe Connect: Account deauthorized`,
          html: `<p>A salon has disconnected their Stripe account.</p><p><strong>Account ID:</strong> ${account.id}</p>`,
        }, requestId).catch((err) => console.error("[StripeWebhook] failed to send account deauthorized admin notification:", err, { requestId }));
      } else {
        console.warn("[stripe/webhook] ADMIN_EMAIL not set, skipping deauthorization notification", { requestId });
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object;
      if (account.charges_enabled) {
        await admin.from("salons").update({
          accepts_online_payment: true,
        }).eq("stripe_account_id", account.id);
      } else {
        // Stripe RESTRICTED the account (charges_enabled flipped false, e.g. an
        // overdue verification requirement). Without this branch, a salon stayed
        // routed for online payment forever once turned on, so a since-restricted
        // account would keep receiving bookings that Stripe then declines to charge.
        await admin.from("salons").update({
          accepts_online_payment: false,
        }).eq("stripe_account_id", account.id);
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as any;
      if (charge.payment_intent) {
        // Find corresponding salon payout and adjust it
        const { data: payout } = await admin.from("salon_payouts").select("*").eq("stripe_payment_intent_id", charge.payment_intent).maybeSingle();
        if (payout) {
          // Recompute from the CHARGE's OWN figures, never from the (already-
          // mutated) row. charge.amount = originally captured Rappen;
          // charge.amount_refunded = CUMULATIVE refunded Rappen. The old
          // `payout.gross_amount - amount_refunded` double-subtracted on the 2nd+
          // partial refund because gross_amount had already been decremented by
          // the prior one. Deriving the remaining gross straight from the charge
          // makes repeated/duplicate charge.refunded deliveries converge to the
          // same value (idempotent across partials).
          const newGross = (charge.amount - charge.amount_refunded) / 100; // Rappen → CHF
          const newComm = Math.round(newGross * (payout.commission_percent / 100) * 100) / 100;
          const newNet = Math.round((newGross - newComm) * 100) / 100;
          await admin.from("salon_payouts").update({
            gross_amount: newGross,
            commission_amount: newComm,
            net_amount: newNet,
          }).eq("id", payout.id);
        }
      }
      break;
    }

    case "payout.paid": {
      const payout = event.data.object as any;
      const accountId = event.account; 
      if (accountId) {
        const { data: salon } = await admin.from("salons").select("name, owner_id").eq("stripe_account_id", accountId).single();
        if (salon?.owner_id) {
          const { data: profile } = await admin.from("profiles").select("email, locale").eq("id", salon.owner_id).single();
          const { sendNotification } = await import("@/lib/notifications");
          await sendNotification({
            userId: salon.owner_id,
            type: "payout_completed",
            title: "Auszahlung erfolgreich",
            body: `Eine Auszahlung von ${(payout.amount / 100).toFixed(2)} CHF ist auf dem Weg zu deinem Bankkonto.`,
            data: { payoutId: payout.id },
            emailParams: profile?.email ? {
              to: profile.email,
              locale: (profile.locale as EmailLocale) ?? "de",
              vars: { salonName: salon.name, amount: (payout.amount / 100).toFixed(2) }
            } : undefined
          });
        }
      }
      break;
    }

    case "payout.failed": {
      const payout = event.data.object as any;
      console.warn(`[stripe/webhook] Payout failed. Reason: ${payout.failure_reason}`, { requestId });
      const accountId = event.account;
      if (accountId) {
        const { data: salon } = await admin.from("salons").select("name, owner_id").eq("stripe_account_id", accountId).single();
        if (salon?.owner_id) {
          const { data: profile } = await admin.from("profiles").select("email, locale").eq("id", salon.owner_id).single();
          const { sendNotification } = await import("@/lib/notifications");
          await sendNotification({
            userId: salon.owner_id,
            type: "payout_failed",
            title: "Auszahlung fehlgeschlagen",
            body: `Deine Auszahlung von ${(payout.amount / 100).toFixed(2)} CHF ist fehlgeschlagen. Bitte prüfe dein Stripe-Konto.`,
            data: { payoutId: payout.id, reason: payout.failure_reason },
            emailParams: profile?.email ? {
              to: profile.email,
              locale: (profile.locale as EmailLocale) ?? "de",
              vars: { salonName: salon.name, amount: (payout.amount / 100).toFixed(2) }
            } : undefined
          });
        }
      }
      break;
    }
  }
  } catch (handlerErr) {
    // Release the claim so Stripe's retry can re-run the event with a fresh
    // transactional context. Without this, the event_id stays "claimed" and
    // Stripe gives up after its retry schedule — partial state is permanent.
    console.error("[stripe/webhook] handler failed, releasing claim:", handlerErr, { event_id: event.id, type: event.type, requestId });
    await reportError("stripe-webhook", handlerErr, { eventType: event.type, requestId });
    await admin.from("processed_webhook_events").delete().eq("event_id", event.id);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
