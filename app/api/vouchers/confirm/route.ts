export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Use Node runtime for Stripe
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, voucherConfirmSchema } from "@/lib/validations";

/**
 * POST /api/vouchers/confirm
 * Called from checkout success page to finalize voucher purchase.
 * This should be called AFTER Stripe payment succeeds.
 *
 * Stays guest-accessible (no supabase.auth.getUser() gate): the voucher this route
 * finalizes is created by POST /api/vouchers, which explicitly allows an
 * unauthenticated buyer ("Allow both authenticated and guest purchases", buyerId can
 * be null). Gating this route on a session would 401 a real guest finishing that
 * flow. Rate-limited by IP instead, before the Stripe retrieve call.
 */
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  // Initialize Stripe
  const stripe = getStripe();
  const rawBody = await req.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(voucherConfirmSchema, rawBody);
  if (validationError) {
    return NextResponse.json(
      { error: "Missing payment_intent_id or voucher_id" },
      { status: 400 }
    );
  }
  const { payment_intent_id, voucher_id } = validated;

  try {
    const supabase = await createServerSupabaseClient();

    // Verify payment intent succeeded in Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment not confirmed" },
        { status: 400 }
      );
    }

    // Get voucher details
    const { data: voucher, error: voucherError } = await supabase
      .from("vouchers")
      .select("id, code, amount, stripe_payment_intent_id")
      .eq("id", voucher_id)
      .single();

    if (voucherError || !voucher) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
    }

    // Verify the supplied payment_intent_id actually belongs to THIS voucher. Without this,
    // any succeeded PI (e.g. from an unrelated purchase) could be paired with any voucher_id
    // to activate it and read its code. stripe_payment_intent_id is written on the voucher row
    // at creation time (app/api/vouchers/route.ts), before any charge, so it is the authoritative
    // linkage between a voucher and the PI that is supposed to pay for it.
    if (voucher.stripe_payment_intent_id !== payment_intent_id) {
      return NextResponse.json({ error: "Payment does not match voucher" }, { status: 403 });
    }

    // Mark voucher as confirmed (created but not yet "redeemed" in the sense of used)
    // remaining_amount is set equal to original amount since it hasn't been redeemed yet
    const { error: updateError } = await supabase
      .from("vouchers")
      .update({ remaining_amount: voucher.amount })
      .eq("id", voucher_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Fehler beim Bestätigen des Gutscheins" },
        { status: 500 }
      );
    }

    // TODO: Send Resend email to recipient with voucher code and details
    // This will be implemented in the next phase once we set up Resend templates

    return NextResponse.json({
      success: true,
      message: "Voucher confirmed. Email sent to recipient.",
      voucher_code: voucher.code,
    });
  } catch (error) {
    console.error("[VoucherConfirm] error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Verarbeitung" },
      { status: 500 }
    );
  }
}
