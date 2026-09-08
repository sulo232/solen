// exists-check: net-new vs lib/email.ts, lib/stripe.ts, lib/supabase.ts, lib/ratelimit.ts,
// lib/auth/require.ts because `npm run exists fee pay` and `npm run exists pay link` (run
// 2026-09-06) both returned 0 matches; no fee-payment-link route exists anywhere in the repo.
// This route imports the existing lib/stripe.ts, lib/supabase.ts, lib/ratelimit.ts helpers
// plus the new lib/bookings/settle-fee-payment.ts chokepoint, it does not duplicate any of them.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, paymentLimiter, getClientIp } from "@/lib/ratelimit";
import { verifyFeePayToken } from "@/lib/bookings/fee-pay-link";
import { getStripe } from "@/lib/stripe";
import { feeIntentKind } from "@/lib/bookings/charge-fee";
import { settleFeePayment } from "@/lib/bookings/settle-fee-payment";
import { validateBody, feePayConfirmSchema } from "@/lib/validations";

// POST /api/bookings/[id]/fee-pay-confirm - PUBLIC, token-gated (2026-09-06, owner-approved
// variant B). Called by the fee-pay page right after stripe.confirmPayment resolves, so the
// customer sees "paid" immediately without waiting on the async webhook delivery. Settles
// through the SAME idempotent chokepoint (lib/bookings/settle-fee-payment.ts) the webhook's
// payment_intent.succeeded handler also calls, so whichever arrives first wins.
//
// ownership-ok: no requireAuth/requireSalonOwner check on purpose, same discipline as
// fee-pay-intent/route.ts: verifyFeePayToken() below IS the authorization, and the
// PaymentIntent's own metadata.booking_id is checked against the route id before anything
// is trusted, so neither the id in the URL nor the payment_intent_id in the body is ever
// taken on faith alone.
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
  const { data: body, error: bodyError } = validateBody(feePayConfirmSchema, rawBody);
  if (bodyError) return NextResponse.json({ message: bodyError.message, code: "VALIDATION_ERROR" }, { status: 400 });

  const { bookingId, kind, valid } = verifyFeePayToken(body.token);
  if (!valid) return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  if (bookingId !== id) return NextResponse.json({ error: "Token mismatch" }, { status: 403 });

  const stripe = getStripe();
  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(body.payment_intent_id);
  } catch (err) {
    console.error(`[fee-pay-confirm] failed to retrieve PI ${body.payment_intent_id} for booking ${id}:`, err);
    return NextResponse.json({ error: "PaymentIntent not found" }, { status: 404 });
  }

  if (pi.metadata?.booking_id !== id || feeIntentKind(pi) !== kind) {
    return NextResponse.json({ error: "PaymentIntent does not match this booking" }, { status: 403 });
  }
  if (pi.status !== "succeeded") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 409 });
  }

  const admin = createAdminSupabaseClient();
  try { await settleFeePayment(admin, req, pi); }
  catch (err) {
    console.error(`[fee-pay-confirm] settlement failed for booking ${id}:`, err);
    return NextResponse.json({ error: "FEE_RECONCILIATION_REQUIRED" }, { status: 409 });
  }

  return NextResponse.json({ status: "charged" });
}
