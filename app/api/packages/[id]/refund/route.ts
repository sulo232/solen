export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, purchaseRefundSchema } from "@/lib/validations";
import { issuePurchaseRefund, PurchaseRefundError, resolvePackageRefundAmount } from "@/lib/purchases/issue-purchase-refund";
import { notifyPurchaseRefundProcessed } from "@/lib/purchases/notify-purchase-refund";

// POST /api/packages/[id]/refund — Salon-triggered package-purchase refund.
// Mirrors /api/bookings/[id]/refund: salon-owner auth on the RLS request client,
// the actual money write runs through issuePurchaseRefund on the admin client.
//
// Modes (purchaseRefundSchema):
//   - "amount"  → refund `amount` Rappen (full or partial), capped server-side.
//   - "prorata" → refund only UNUSED sessions:
//                 paid_amount * (sessions_total − sessions_used) / sessions_total.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: purchaseId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // Money surface → dedicated payment limiter (mirrors the booking refund route).
  const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(purchaseRefundSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { amount, mode, reason } = validated;

  // Ownership + amount inputs on the RLS-scoped request client. The CAS write
  // uses the admin client inside issuePurchaseRefund so it isn't fighting RLS.
  const { data: purchase } = await supabase
    .from("package_purchases")
    .select("id, salon_id, paid_amount, refunded_amount, sessions_total, sessions_used, salons(owner_id)")
    .eq("id", purchaseId)
    .single();

  if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

  const salonOwner = (purchase.salons as unknown as { owner_id: string })?.owner_id;
  if (salonOwner !== user.id) {
    return NextResponse.json({ error: "Only salon owners can issue refunds" }, { status: 403 });
  }

  // Resolve the refund amount (Rappen) via the shared resolver (handles pro-rata).
  // issuePurchaseRefund re-validates the cap atomically against the persisted row;
  // this is the request-shaping layer.
  const resolved = resolvePackageRefundAmount({
    mode,
    amount,
    paid: (purchase.paid_amount as number | null) ?? 0,
    alreadyRefunded: (purchase.refunded_amount as number | null) ?? 0,
    sessionsTotal: (purchase.sessions_total as number | null) ?? 0,
    sessionsUsed: (purchase.sessions_used as number | null) ?? 0,
  });
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.message, code: resolved.code }, { status: 400 });
  }
  const amountCents = resolved.amountCents;

  const admin = createAdminSupabaseClient();
  try {
    const result = await issuePurchaseRefund({
      db: admin,
      source: "package",
      id: purchaseId,
      amountCents,
      actor: "salon",
      reason,
      // refundApplicationFee omitted -> D7 config.
    });

    // Notify the buyer (this action's slice, Rappen). Never blocks/rolls back the money move.
    await notifyPurchaseRefundProcessed(
      admin,
      { userId: result.userId, salonId: result.salonId, amountCents, itemLabel: "Paket" },
      "package-refund",
    ).catch((err) => console.error("[package-refund] notification failed:", err));

    return NextResponse.json({
      data: {
        purchase_id: purchaseId,
        refunded_amount: amountCents,
        total_refunded: result.totalRefundedCents,
        status: result.status,
      },
    });
  } catch (e) {
    console.error("[package-refund] issuePurchaseRefund failed:", e);
    if (e instanceof PurchaseRefundError) {
      const status =
        e.code === "PURCHASE_NOT_FOUND" ? 404
        : e.code === "STRIPE_FAILED" || e.code === "CONCURRENT_RETRY" ? 500
        : 400; // INVALID_AMOUNT / NO_PAID_AMOUNT / EXCEEDS_REMAINING / NO_PAYMENT / UNSUPPORTED_SOURCE
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
