export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, bookingConfirmation, type EmailLocale } from "@/lib/email";
import { paymentFailedNotification } from "@/lib/email-templates/booking-notifications";
import { trackServerEvent } from "@/lib/posthog-server";

export const runtime = "nodejs";

// POST /api/stripe/webhook
// Vercel webhook URL to add in Stripe Dashboard:
//   https://solen.ch/api/stripe/webhook
// Events to enable: payment_intent.succeeded, payment_intent.payment_failed,
//                   charge.dispute.created, account.updated
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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

  // Webhook idempotency — prevent replay attacks
  const existing = await admin.from("processed_webhook_events")
    .select("event_id").eq("event_id", event.id).single();
  if (existing.data) return NextResponse.json({ received: true });
  await admin.from("processed_webhook_events").insert({ event_id: event.id });

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;

      // Handle voucher purchases before booking handler
      const { handleVoucherPurchase } = await import("./voucher-handler");
      const wasVoucherPurchase = await handleVoucherPurchase(pi);
      if (wasVoucherPurchase) break;

      const bookingId = pi.metadata?.booking_id;
      if (bookingId) {
        await admin.from("bookings").update({
          payment_status: "deposit_held",
        }).eq("payment_intent_id", pi.id);

        // Record commission payout for Stripe-processed bookings
        const grossAmount = (pi.amount ?? 0) / 100; // Rappen → CHF
        if (grossAmount > 0 && pi.metadata?.salon_id) {
          // Fetch configurable commission rate from platform_settings
          const { data: commissionSetting } = await admin
            .from("platform_settings")
            .select("value")
            .eq("key", "commission")
            .single();
          const commissionPercent = commissionSetting?.value?.rate_percent ?? 15;
          const commissionAmount = Math.round(grossAmount * (commissionPercent / 100) * 100) / 100;
          const netAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;

          await admin.from("salon_payouts").insert({
            booking_id: bookingId,
            salon_id: pi.metadata.salon_id,
            stripe_payment_intent_id: pi.id,
            gross_amount: grossAmount,
            commission_percent: commissionPercent,
            commission_amount: commissionAmount,
            net_amount: netAmount,
            status: "recorded",
          });
        }

        // Send booking confirmation email to customer
        const { data: booking } = await admin
          .from("bookings")
          .select("user_id, starts_at, services(name_de), salons(name)")
          .eq("id", bookingId)
          .single();

        if (booking) {
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
            }).catch(() => {});
          }
        }
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

        if (booking) {
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
            await sendEmail(paymentFailedNotification(email, { service: serviceName, salon: salonName, date: dateStr }, locale)).catch(() => {});
          }
        }
      }
      break;
    }

    case "charge.dispute.created": {
      const dispute = event.data.object;
      console.warn("[stripe/webhook] Dispute created:", dispute.id, dispute.amount / 100, "CHF");
      const adminEmail = process.env.ADMIN_EMAIL ?? "admin@solen.ch";
      await sendEmail({
        to: adminEmail,
        subject: `[solen.ch] Stripe Dispute: CHF ${(dispute.amount / 100).toFixed(2)}`,
        html: `<p>A new Stripe dispute has been opened.</p><ul><li><strong>Dispute ID:</strong> ${dispute.id}</li><li><strong>Amount:</strong> CHF ${(dispute.amount / 100).toFixed(2)}</li><li><strong>Reason:</strong> ${dispute.reason}</li><li><strong>Status:</strong> ${dispute.status}</li></ul><p><a href="https://dashboard.stripe.com/disputes/${dispute.id}">View in Stripe →</a></p>`,
      }).catch(() => {});
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
      const adminEmail = process.env.ADMIN_EMAIL ?? "admin@solen.ch";
      await sendEmail({
        to: adminEmail,
        subject: `[solen.ch] Stripe Connect: Account deauthorized`,
        html: `<p>A salon has disconnected their Stripe account.</p><p><strong>Account ID:</strong> ${account.id}</p>`,
      }).catch(() => {});
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

  return NextResponse.json({ received: true });
}
