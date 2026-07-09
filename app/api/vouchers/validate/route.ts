export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";

export async function POST(req: NextRequest) {
  // Feature flag
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  const body = await req.json();
  const { code, salon_id } = body;

  if (!code || !salon_id) {
    return NextResponse.json(
      { error: "Missing code or salon_id" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();

    // Look up voucher by code (case-insensitive)
    const { data: voucher, error: dbError } = await supabase
      .from("vouchers")
      .select("*")
      .ilike("code", code)
      .eq("salon_id", salon_id)
      .single();

    if (dbError || !voucher) {
      return NextResponse.json(
        { valid: false, message: "Ungültiger Gutscheincode" },
        { status: 404 }
      );
    }

    // Check the voucher was actually paid for. remaining_amount is written ONLY by the
    // Stripe webhook (handleSalonVoucherPaid) or the confirm route AFTER payment_intent.succeeded
    // (it is never set at insert time, see app/api/vouchers/route.ts) so NULL here means the
    // purchase never completed / was never paid, not proof of a valid full-value voucher.
    if (voucher.remaining_amount === null) {
      return NextResponse.json({
        valid: false,
        message: "Gutschein noch nicht bezahlt",
      });
    }

    // Check if already redeemed
    if (voucher.redeemed_at) {
      return NextResponse.json({
        valid: false,
        message: "Dieser Gutschein wurde bereits eingelöst",
      });
    }

    // Check if expired
    const now = new Date();
    if (voucher.expires_at && new Date(voucher.expires_at) < now) {
      return NextResponse.json({
        valid: false,
        message: "Dieser Gutschein ist abgelaufen",
      });
    }

    // Voucher is valid
    return NextResponse.json({
      valid: true,
      code: voucher.code,
      amount: voucher.amount,
      remaining_amount: voucher.remaining_amount ?? voucher.amount,
      message: voucher.message,
    });
  } catch (error) {
    console.error("[VoucherValidate] error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Validierung" },
      { status: 500 }
    );
  }
}
