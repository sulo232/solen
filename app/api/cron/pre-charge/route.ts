export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getServerEnv } from "@/lib/env";

// Cron: Pre-charge saved cards 5 days before appointment. Daily.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // Find bookings with saved cards approaching in 5 days
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, user_id, salon_id, price_paid, stripe_customer_id, stripe_payment_method_id, starts_at, salons(name, stripe_account_id), services(name_de)")
    .eq("payment_status", "card_saved")
    .eq("status", "confirmed")
    .gt("starts_at", now)
    .lt("starts_at", fiveDaysFromNow)
    .not("stripe_customer_id", "is", null)
    .not("stripe_payment_method_id", "is", null)
    .limit(50);

  let charged = 0;
  let declined = 0;

  for (const booking of bookings ?? []) {
    const salonStripeId = (booking.salons as any)?.stripe_account_id;

    // Read commission rate
    const { data: settings } = await admin
      .from("platform_settings")
      .select("value")
      .eq("key", "commission")
      .single();
    const ratePercent = settings?.value?.rate_percent ?? 1;
    const platformFee = Math.round((booking.price_paid ?? 0) * (ratePercent / 100));

    try {
      const piParams: Stripe.PaymentIntentCreateParams = {
        amount: booking.price_paid ?? 0,
        currency: "chf",
        customer: booking.stripe_customer_id,
        payment_method: booking.stripe_payment_method_id,
        off_session: true,
        confirm: true,
        metadata: { type: "pre_charge", booking_id: booking.id },
      };

      if (salonStripeId) {
        piParams.application_fee_amount = platformFee;
        piParams.transfer_data = { destination: salonStripeId };
      }

      const pi = await getStripe().paymentIntents.create(piParams);

      await admin
        .from("bookings")
        .update({
          payment_status: "paid",
          payment_intent_id: pi.id,
          paid_amount: booking.price_paid,
          platform_fee: platformFee,
        })
        .eq("id", booking.id);

      charged++;
    } catch (err: any) {
      console.error(`[pre-charge] Card declined for booking ${booking.id}:`, err.message);
      declined++;

      // Notify customer about card decline
      const { data: userAuth } = await admin.auth.admin.getUserById(booking.user_id);
      if (userAuth?.user?.email) {
        try {
          await sendEmail({
            to: userAuth.user.email,
            subject: `Zahlung fehlgeschlagen — ${(booking.salons as any)?.name ?? "Salon"}`,
            html: `<p>Die Vorab-Belastung für deinen Termin am ${new Date(booking.starts_at).toLocaleDateString("de-CH")} konnte nicht durchgeführt werden.</p><p>Bitte aktualisiere deine Zahlungsmethode oder kontaktiere den Salon.</p>`,
          });
        } catch { /* email non-fatal */ }
      }
    }
  }

  return NextResponse.json({ charged, declined });
}
