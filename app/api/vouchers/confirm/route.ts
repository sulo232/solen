export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Use Node runtime for Stripe
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase";

/**
 * POST /api/vouchers/confirm
 * Called from checkout success page to finalize voucher purchase.
 * This should be called AFTER Stripe payment succeeds.
 */
export async function POST(req: NextRequest) {
  // Initialize Stripe
  const stripe = getStripe();
  const { payment_intent_id, voucher_id } = await req.json();

  if (!payment_intent_id || !voucher_id) {
    return NextResponse.json(
      { error: "Missing payment_intent_id or voucher_id" },
      { status: 400 }
    );
  }

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
      .select("*, salons(name_de, name_en)")
      .eq("id", voucher_id)
      .single();

    if (voucherError || !voucher) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 });
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
