import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { stripe, toRappen, PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";

// POST /api/stripe/confirm-price
// Called by salon owner after service to confirm final price.
// Body: { booking_id, final_price }
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { booking_id, final_price } = await req.json();
  if (!booking_id || final_price == null) {
    return NextResponse.json({ error: "Missing booking_id or final_price" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Fetch booking with salon ownership check
  const { data: booking } = await admin
    .from("bookings")
    .select("id, payment_intent_id, payment_status, estimated_price, deposit_amount, user_id, salon_id")
    .eq("id", booking_id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.payment_status !== "deposit_held") {
    return NextResponse.json({ error: "No deposit held for this booking" }, { status: 400 });
  }

  // Verify caller owns the salon
  const { data: salon } = await admin
    .from("salons")
    .select("id, name, owner_id")
    .eq("id", booking.salon_id)
    .single();
  if (salon?.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const platformFee = Math.round(toRappen(final_price) * PLATFORM_FEE_PERCENT);

  if (final_price <= (booking.estimated_price ?? 0)) {
    // ── Capture at final price ───────────────────────────────────────────
    const captureAmount = toRappen(final_price);
    await stripe.paymentIntents.capture(booking.payment_intent_id, {
      amount_to_capture: Math.min(captureAmount, toRappen(booking.deposit_amount)),
    });

    await admin.from("bookings").update({
      final_price,
      payment_status: "charged",
      price_confirmed_at: new Date().toISOString(),
      platform_fee: platformFee / 100,
    }).eq("id", booking_id);

    // Email receipt to customer
    const { data: customerAuth } = await admin.auth.admin.getUserById(booking.user_id);
    if (customerAuth?.user?.email) {
      await sendEmail({
        to: customerAuth.user.email,
        subject: `Rechnung: ${salon.name}`,
        html: `<p>Deine Zahlung für den Termin bei <strong>${salon.name}</strong> wurde abgeschlossen.</p><p><strong>Endpreis:</strong> CHF ${final_price.toFixed(2)}</p><p>Danke für deinen Besuch!</p>`,
      });
    }

    return NextResponse.json({ ok: true, action: "captured" });
  } else {
    // ── Price increased — notify customer ────────────────────────────────
    const approveUrl = `https://solen.ch/de/bookings/${booking_id}/approve-increase`;

    await admin.from("bookings").update({
      final_price,
      price_increase_requested_at: new Date().toISOString(),
    }).eq("id", booking_id);

    const { data: customerAuth } = await admin.auth.admin.getUserById(booking.user_id);
    if (customerAuth?.user?.email) {
      await sendEmail({
        to: customerAuth.user.email,
        subject: `Preisanpassung für deinen Termin bei ${salon.name}`,
        html: `
          <p>Der Salon <strong>${salon.name}</strong> hat den Endpreis deines Termins angepasst.</p>
          <p><strong>Ursprünglicher Preis:</strong> CHF ${booking.estimated_price?.toFixed(2)}</p>
          <p><strong>Neuer Preis:</strong> CHF ${final_price.toFixed(2)}</p>
          <p>Bitte bestätige die Anpassung innerhalb von 48 Stunden:</p>
          <p><a href="${approveUrl}" style="display:inline-block;padding:12px 24px;background:#4ECDC4;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Preiserhöhung bestätigen →</a></p>
          <p style="color:#888;font-size:12px">Wenn du nicht reagierst, wird die Zahlung nach 48 Stunden automatisch freigegeben.</p>
        `,
      });
    }

    return NextResponse.json({ ok: true, action: "increase_requested" });
  }
}
