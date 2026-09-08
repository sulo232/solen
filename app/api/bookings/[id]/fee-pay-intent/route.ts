// exists-check: net-new vs lib/email.ts, lib/stripe.ts, lib/supabase.ts, lib/ratelimit.ts,
// lib/auth/require.ts because `npm run exists fee pay` and `npm run exists pay link` (run
// 2026-09-06) both returned 0 matches; no fee-payment-link route exists anywhere in the repo.
// This route imports the existing lib/stripe.ts, lib/supabase.ts, lib/ratelimit.ts helpers,
// it does not duplicate them.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, paymentLimiter, getClientIp } from "@/lib/ratelimit";
import { verifyFeePayToken } from "@/lib/bookings/fee-pay-link";
import { toRappen } from "@/lib/stripe";
import { calculateNoShowFee, calculateCancellationFee } from "@/lib/cancellation-policy";
import { prepareFeePayment, FeePaymentPending } from "@/lib/bookings/charge-fee";
import { settleFeePayment } from "@/lib/bookings/settle-fee-payment";
import { localizedField } from "@/lib/i18n/localized-field";
import { validateBody, feePayIntentSchema } from "@/lib/validations";

// POST /api/bookings/[id]/fee-pay-intent - PUBLIC, token-gated (2026-09-06, owner-approved
// variant B). Creates (or reuses) an ON-SESSION PaymentIntent for a policy fee (no-show /
// late-cancel) whose automated off-session attempt landed on 'failed' or 'requires_action',
// so the customer can pay it themselves from the emailed fee-pay link.
//
// ownership-ok: no requireAuth/requireSalonOwner check on purpose. verifyFeePayToken()
// below IS the authorization, same discipline as the existing public one-click link
// (app/api/bookings/[id]/quick-action/route.ts's verifyActionToken): a guest booking has
// no session to check against, so a signed, expiring, HMAC-verified, booking-scoped token
// is the only mechanism available, and the route id is compared against the token's own
// bookingId below (never trusted on its own).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await applyRateLimit(paymentLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { id } = await params;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { data: body, error: bodyError } = validateBody(feePayIntentSchema, rawBody);
  if (bodyError) return NextResponse.json({ message: bodyError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { bookingId, kind: tokenKind, valid } = verifyFeePayToken(body.token);
  if (!valid) return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  if (bookingId !== id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Token mismatch" }, { status: 403 });

  const admin = createAdminSupabaseClient();
  const { data: bookingData } = await admin
    .from("bookings")
    .select(
      "id, starts_at, cancelled_at, policy_accepted_at, fee_charge_claimed_at, paid_amount, price_paid, policy_snapshot, fee_charge_status, fee_charge_kind, fee_charge_intent_id, stripe_customer_id, salons(stripe_account_id, name, no_show_fee_type, no_show_fee_value, cancellation_fee_type, cancellation_fee_value, free_cancel_hours), services(name_de, name_en, name_fr, name_it)"
    )
    .eq("id", id)
    .single();

  if (!bookingData) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const booking = bookingData as any;

  if (booking.fee_charge_status === "charged") {
    return NextResponse.json({ error: "FEE_ALREADY_SETTLED" }, { status: 409 });
  }
  if (booking.fee_charge_status !== "failed" && booking.fee_charge_status !== "requires_action") {
    return NextResponse.json({ error: "FEE_NOT_DUE" }, { status: 409 });
  }

  // fee_charge_kind is the persisted source of truth (set by chargeFee at the failed
  // attempt); the token's kind is only a fallback for a legacy row without it.
  if (booking.fee_charge_kind && booking.fee_charge_kind !== tokenKind) return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  const kind: "no_show" | "cancellation" =
    (booking.fee_charge_kind as "no_show" | "cancellation" | null) ??
    (tokenKind === "cancellation" ? "cancellation" : "no_show");

  const salon = booking.salons as {
    stripe_account_id: string | null;
    name: string | null;
    no_show_fee_type: string | null;
    no_show_fee_value: number | null;
    cancellation_fee_type: string | null;
    cancellation_fee_value: number | null;
    free_cancel_hours: number | null;
  } | null;
  const snapshot = booking.policy_snapshot as Record<string, any> | null;
  const baseCents = (booking.paid_amount as number | null) ?? toRappen(Number(booking.price_paid ?? 0));

  // THE SAME helper the cron uses (app/api/cron/no-show/route.ts:60-100), never a new
  // formula. Cancellation kind mirrors that same snapshot-first / salon-fallback shape
  // via calculateCancellationFee (lib/cancellation-policy.ts), matching
  // lib/bookings/customer-cancel-money.ts's own resolution.
  let feeCents: number;
  if (kind === "no_show") {
    const feeType = snapshot?.no_show_fee_type ?? salon?.no_show_fee_type ?? null;
    const feeValueChf = snapshot?.no_show_fee_value ?? salon?.no_show_fee_value ?? 0;
    feeCents = calculateNoShowFee(feeType, feeValueChf, baseCents).feeCents;
  } else {
    const feeType = snapshot?.cancellation_fee_type ?? salon?.cancellation_fee_type ?? null;
    const feeValueChf = snapshot?.cancellation_fee_value ?? salon?.cancellation_fee_value ?? 0;
    feeCents = calculateCancellationFee(
      feeType,
      feeValueChf,
      snapshot?.free_cancel_hours ?? salon?.free_cancel_hours ?? 24,
      baseCents,
      new Date(booking.starts_at),
      booking.cancelled_at ? new Date(booking.cancelled_at).getTime() : NaN
    ).feeCents;
  }

  if (feeCents <= 0) {
    return NextResponse.json({ error: "FEE_NOT_DUE" }, { status: 409 });
  }

  let pi;
  try {
    pi = await prepareFeePayment(admin, booking, kind, feeCents);
    if (pi.status === "succeeded") {
      await settleFeePayment(admin, req, pi);
      return NextResponse.json({ error: "FEE_ALREADY_SETTLED" }, { status: 409 });
    }
    if (pi.status === "processing" || pi.status === "requires_capture") {
      return NextResponse.json({ error: "FEE_PAYMENT_PENDING" }, { status: 409 });
    }
    if (!pi.client_secret || !["requires_payment_method", "requires_confirmation", "requires_action"].includes(pi.status)) {
      return NextResponse.json({ error: "FEE_RECONCILIATION_REQUIRED" }, { status: 409 });
    }
  } catch (err) {
    console.error(`[fee-pay-intent] preparation failed for booking ${id}:`, err);
    if (err instanceof FeePaymentPending && !err.retryable) {
      const { alertAdmin } = await import("@/lib/alert-admin");
      await alertAdmin("fee payment requires reconciliation", { booking_id: id, reason: err.message });
    }
    return NextResponse.json({ error: err instanceof FeePaymentPending ? (err.retryable ? "FEE_PAYMENT_PENDING" : "FEE_RECONCILIATION_REQUIRED") : "FEE_PREPARATION_FAILED" }, { status: err instanceof FeePaymentPending ? 409 : 503 });
  }

  const locale = body.locale ?? new URL(req.url).searchParams.get("locale") ?? "de";
  const services = booking.services as Record<string, string | null> | null;
  const serviceName = localizedField(services, "name", locale) || "Service";

  return NextResponse.json({
    client_secret: pi.client_secret,
    amount_cents: pi.amount,
    currency: "chf",
    salon_name: salon?.name ?? "Salon",
    service_name: serviceName,
    starts_at: booking.starts_at,
    kind,
  });
}
