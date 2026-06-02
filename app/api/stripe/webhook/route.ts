export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingConfirmation, type EmailLocale } from "@/lib/email";
import { paymentFailedNotification } from "@/lib/email-templates/booking-notifications";
import { trackServerEvent } from "@/lib/posthog-server";
import { getServerEnv } from "@/lib/env";
import { DEFAULT_COMMISSION_RATE_PERCENT } from "@/lib/constants/billing";

export const runtime = "nodejs";

// POST /api/stripe/webhook
// Webhook URL to add in Stripe Dashboard:
//   https://solen.ch/api/stripe/webhook
// Events to enable: payment_intent.succeeded, payment_intent.payment_failed,
//                   payment_intent.amount_capturable_updated (walk-in ticket backstop),
//                   charge.dispute.created, account.updated
export async function POST(req: NextRequest) {
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
    console.error("[stripe/webhook] Signature verification failed:", err);
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
    console.error("[stripe/webhook] failed to claim event:", claimError, { event_id: event.id, type: event.type });
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

      // Handle voucher purchases before booking handler
      const { handleVoucherPurchase } = await import("./voucher-handler");
      const wasVoucherPurchase = await handleVoucherPurchase(pi);
      if (wasVoucherPurchase) break;

      const bookingId = pi.metadata?.booking_id;
      if (bookingId) {
        // SP-G2 full prepay: type:"booking" PIs are captured in full at booking
        // (not a hold). Persist the paid state + the saved-card ids (for SP-AC /
        // SP-3 off-session charges) and confirm the booking. Amounts are already
        // integer Rappen straight from Stripe (pi.amount / pi.application_fee_amount).
        if (pi.metadata?.type === "booking") {
          const pmId = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id ?? null;
          const custId = typeof pi.customer === "string" ? pi.customer : pi.customer?.id ?? null;
          await admin.from("bookings").update({
            status: "confirmed",
            payment_status: "paid",
            paid_amount: pi.amount ?? 0,                       // Rappen
            platform_fee: pi.application_fee_amount ?? 0,      // Rappen (the fee issueRefund later reverses)
            stripe_customer_id: custId,
            stripe_payment_method_id: pmId,
          }).eq("payment_intent_id", pi.id);
          // Confirm the held slot (booking-pay-intent re-verified it before charging).
          if (pi.metadata?.slot_id) {
            await admin.from("availability_slots")
              .update({ status: "booked", booking_id: bookingId })
              .eq("id", pi.metadata.slot_id);
          }
        } else {
          await admin.from("bookings").update({
            payment_status: "deposit_held",
          }).eq("payment_intent_id", pi.id);
        }

        // Record commission payout for Stripe-processed bookings
        const grossAmount = (pi.amount ?? 0) / 100; // Rappen → CHF
        if (grossAmount > 0 && pi.metadata?.salon_id) {
          // Fetch configurable commission rate from platform_settings
          const { data: commissionSetting } = await admin
            .from("platform_settings")
            .select("value")
            .eq("key", "commission")
            .single();
          const commissionPercent = commissionSetting?.value?.rate_percent ?? DEFAULT_COMMISSION_RATE_PERCENT;
          const commissionAmount = Math.round(grossAmount * (commissionPercent / 100) * 100) / 100;
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
          .select("user_id, starts_at, services(name_de), salons(name)")
          .eq("id", bookingId)
          .single();

        // Guest bookings (user_id IS NULL) skip the user-keyed notification +
        // analytics here — guest email/SMS is the owner's later piece (SP-2).
        // The auth.admin.getUserById / trackServerEvent calls below all require a
        // real user_id, so guarding on it keeps the webhook from throwing on guests.
        if (booking?.user_id) {
          trackServerEvent(booking.user_id, "payment_succeeded", {
            booking_id: bookingId,
            salon_id: pi.metadata?.salon_id,
            amount: (pi.amount ?? 0) / 100,
          });
          trackServerEvent(booking.user_id, "booking_completed", {
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
                vars: { service: serviceName, salon: salonName, date: dateStr, time: timeStr }
              }
            }).catch((err) => console.error("[StripeWebhook] failed to send booking confirmation notification:", err));
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
          // salon_id is not in the off-session PI metadata — resolve from the booking.
          let chargeSalonId = pi.metadata?.salon_id ?? null;
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
              { event_id: event.id, pi: pi.id, type: offSessionType, booking_id: chargeBookingId },
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
            { event_id: event.id, pi: pi.id, type: offSessionType },
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
      const bookingId = pi.metadata?.booking_id;
      if (bookingId) {
        // Release the booking slot
        await admin.from("bookings").update({
          status: "cancelled",
          payment_status: "none",
        }).eq("payment_intent_id", pi.id);
        // Free the slot
        await admin.from("availability_slots").update({ status: "available" })
          .eq("id", pi.metadata?.slot_id ?? "");

        // Notify customer about payment failure
        const { data: booking } = await admin
          .from("bookings")
          .select("user_id, starts_at, services(name_de), salons(name)")
          .eq("id", bookingId)
          .single();

        // Guest bookings skip the user-keyed failure notification (owner's later
        // piece); the slot/booking release above already ran for them.
        if (booking?.user_id) {
          trackServerEvent(booking.user_id, "payment_failed", {
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
            await sendEmail(paymentFailedNotification(email, { service: serviceName, salon: salonName, date: dateStr }, locale)).catch((err) => console.error("[StripeWebhook] failed to send payment failure notification:", err));
          }
        }
      }
      break;
    }

    case "charge.dispute.created": {
      const dispute = event.data.object;
      console.warn("[stripe/webhook] Dispute created:", dispute.id, dispute.amount / 100, "CHF");
      if (env.ADMIN_EMAIL) {
        await sendEmail({
          to: env.ADMIN_EMAIL,
          subject: `[solen.ch] Stripe Dispute: CHF ${(dispute.amount / 100).toFixed(2)}`,
          html: `<p>A new Stripe dispute has been opened.</p><ul><li><strong>Dispute ID:</strong> ${dispute.id}</li><li><strong>Amount:</strong> CHF ${(dispute.amount / 100).toFixed(2)}</li><li><strong>Reason:</strong> ${dispute.reason}</li><li><strong>Status:</strong> ${dispute.status}</li></ul><p><a href="https://dashboard.stripe.com/disputes/${dispute.id}">View in Stripe →</a></p>`,
        }).catch((err) => console.error("[StripeWebhook] failed to send dispute admin notification:", err));
      } else {
        console.warn("[stripe/webhook] ADMIN_EMAIL not set — skipping dispute notification");
      }
      break;
    }

    case "setup_intent.succeeded": {
      const si = event.data.object as any;
      const bookingId = si.metadata?.booking_id;
      if (bookingId && si.payment_method) {
        await admin.from("bookings").update({
          payment_status: "card_saved",
          stripe_setup_intent_id: si.id,
          stripe_customer_id: si.customer,
          stripe_payment_method_id: si.payment_method,
        }).eq("id", bookingId);
      }
      break;
    }

    case "account.application.deauthorized": {
      const account = event.data.object as any;
      console.warn("[stripe/webhook] Account deauthorized:", account.id);
      await admin.from("salons").update({
        accepts_online_payment: false,
      }).eq("stripe_account_id", account.id);
      if (env.ADMIN_EMAIL) {
        await sendEmail({
          to: env.ADMIN_EMAIL,
          subject: `[solen.ch] Stripe Connect: Account deauthorized`,
          html: `<p>A salon has disconnected their Stripe account.</p><p><strong>Account ID:</strong> ${account.id}</p>`,
        }).catch((err) => console.error("[StripeWebhook] failed to send account deauthorized admin notification:", err));
      } else {
        console.warn("[stripe/webhook] ADMIN_EMAIL not set — skipping deauthorization notification");
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object;
      if (account.charges_enabled) {
        await admin.from("salons").update({
          accepts_online_payment: true,
        }).eq("stripe_account_id", account.id);
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as any;
      if (charge.payment_intent) {
        const amountRefunded = charge.amount_refunded / 100;
        // Find corresponding salon payout and adjust it
        const { data: payout } = await admin.from("salon_payouts").select("*").eq("stripe_payment_intent_id", charge.payment_intent).single();
        if (payout) {
          const newGross = payout.gross_amount - amountRefunded;
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
      console.warn(`[stripe/webhook] Payout failed. Reason: ${payout.failure_reason}`);
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
    console.error("[stripe/webhook] handler failed, releasing claim:", handlerErr, { event_id: event.id, type: event.type });
    await admin.from("processed_webhook_events").delete().eq("event_id", event.id);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
