export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, guestLookupLimiter, getClientIp } from "@/lib/ratelimit";
import { validateBody, voucherValidateSchema } from "@/lib/validations";

// Every failure branch below (not found, unpaid, redeemed, expired) returns this SAME
// generic message. Distinct messages per branch turned this public endpoint into an
// oracle: an attacker could tell "code doesn't exist" apart from "code exists but is
// unpaid/redeemed/expired" without ever seeing the code's real state. Collapsed to one
// message so every failure looks identical from the outside (ring 9 parked finding).
const GENERIC_INVALID_MESSAGE = "Gutscheincode ungültig oder nicht einlösbar";

export async function POST(req: NextRequest) {
  // Feature flag
  const disabled = await checkFeatureEnabled("bookings");
  if (disabled) return disabled;

  // Unauthenticated enumeration surface (voucher code, CHF balance), tight
  // IP-keyed limiter, same pattern as other guest lookup endpoints.
  const rateLimited = await applyRateLimit(guestLookupLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const rawBody = await req.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(voucherValidateSchema, rawBody);
  if (validationError) {
    return NextResponse.json(
      { error: "Missing code or salon_id", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }
  const { code, salon_id } = validated;

  try {
    const supabase = await createServerSupabaseClient();

    // Look up voucher by code. Codes are DB-generated fixed-format uppercase
    // hex (see supabase/migrations/20260401_gift_vouchers.sql), so this is an
    // EXACT match, not `.ilike` (`.ilike` treats `%`/`_` as wildcards, which
    // let an unauthenticated caller binary-search real codes and balances).
    // Explicit column list (not `.select("*")`) so only what the client needs
    // is ever returned.
    const { data: voucher, error: dbError } = await supabase
      .from("vouchers")
      .select("code, amount, remaining_amount, message, redeemed_at, expires_at")
      .eq("code", code.trim().toUpperCase())
      .eq("salon_id", salon_id)
      .single();

    if (dbError || !voucher) {
      return NextResponse.json(
        { valid: false, message: GENERIC_INVALID_MESSAGE },
        { status: 200 }
      );
    }

    // Check the voucher was actually paid for. remaining_amount is written ONLY by the
    // Stripe webhook (handleSalonVoucherPaid) or the confirm route AFTER payment_intent.succeeded
    // (it is never set at insert time, see app/api/vouchers/route.ts) so NULL here means the
    // purchase never completed / was never paid, not proof of a valid full-value voucher.
    if (voucher.remaining_amount === null) {
      return NextResponse.json({
        valid: false,
        message: GENERIC_INVALID_MESSAGE,
      });
    }

    // Check if already redeemed
    if (voucher.redeemed_at) {
      return NextResponse.json({
        valid: false,
        message: GENERIC_INVALID_MESSAGE,
      });
    }

    // Check if expired
    const now = new Date();
    if (voucher.expires_at && new Date(voucher.expires_at) < now) {
      return NextResponse.json({
        valid: false,
        message: GENERIC_INVALID_MESSAGE,
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
      { error: "Fehler bei der Validierung", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
