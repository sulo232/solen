export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Use Node runtime for Stripe
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled, checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody } from "@/lib/validations";
import { z } from "zod";

// Voucher purchase schema
const createVoucherSchema = z.object({
  salon_id: z.string().uuid(),
  amount: z.number().positive().max(999),
  recipient_email: z.string().email(),
  recipient_name: z.string().min(1).max(100),
  message: z.string().max(200).optional(),
});

export async function POST(req: NextRequest) {
  // Initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-11-20",
  });

  // Feature flag
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Allow both authenticated and guest purchases
  const buyerId = user?.id ?? null;

  // Ban check (only for authenticated users)
  if (buyerId) {
    const banned = await checkUserBanned(buyerId);
    if (banned) return banned;
  }

  // Rate limit (only for authenticated users)
  if (buyerId) {
    const rateLimited = await applyRateLimit(generalLimiter, { userId: buyerId });
    if (rateLimited) return rateLimited;
  }

  // Validate input
  const body = await req.json();
  const parsed = createVoucherSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid voucher data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { salon_id, amount, recipient_email, recipient_name, message } = parsed.data;

  try {
    // Verify salon exists and get name
    const { data: salon, error: salonError } = await supabase
      .from("salons")
      .select("id, name_de, name_en")
      .eq("id", salon_id)
      .single();

    if (salonError || !salon) {
      return NextResponse.json({ error: "Salon nicht gefunden" }, { status: 404 });
    }

    // Create Stripe payment intent
    const amountInCents = Math.round(amount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "chf",
      description: `Gift voucher for ${salon.name_de} · ${recipient_name}`,
      metadata: {
        type: "voucher",
        salon_id,
        recipient_email,
        recipient_name,
      },
    });

    // Create voucher record in DB (status: unpaid)
    const { data: voucher, error: voucherError } = await supabase
      .from("vouchers")
      .insert({
        salon_id,
        buyer_id: buyerId,
        buyer_email: user?.email ?? null,
        recipient_email,
        recipient_name,
        amount,
        message: message || null,
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select()
      .single();

    if (voucherError || !voucher) {
      return NextResponse.json(
        { error: "Fehler beim Erstellen des Gutscheins" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      voucher_id: voucher.id,
      client_secret: paymentIntent.client_secret,
      salon_name: salon.name_de,
      amount,
    });
  } catch (error) {
    console.error("[VoucherAPI] error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Zahlungsverarbeitung" },
      { status: 500 }
    );
  }
}
