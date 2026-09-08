export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, purchaseRefundSchema } from "@/lib/validations";
import { issuePurchaseRefund, PurchaseRefundError } from "@/lib/purchases/issue-purchase-refund";
import { notifyPurchaseRefundProcessed } from "@/lib/purchases/notify-purchase-refund";
import { reportError } from "@/lib/error-report";
import { requireSalonAccess } from "@/lib/auth/require";

// POST /api/salon/retail/[id]/refund — Salon-triggered retail-purchase refund.
// Mirrors /api/bookings/[id]/refund auth. Retail is amount-only (full/partial);
// there is no sessions model, so `mode:"prorata"` is rejected.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: purchaseId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const rateLimited = await applyRateLimit(paymentLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(purchaseRefundSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { amount, mode, reason } = validated;

  if (mode === "prorata") {
    return NextResponse.json({ error: "Retail purchases support full/partial refunds only", code: "INVALID_AMOUNT" }, { status: 400 });
  }
  if (typeof amount !== "number") {
    return NextResponse.json({ error: "amount is required", code: "INVALID_AMOUNT" }, { status: 400 });
  }

  // P9-2 RLS fix: retail_purchases_salon_select is owner-only, so fetching
  // this row on the session client returned nothing for a granted staff
  // caller, 404ing before the gate below ever ran. The admin client fetches
  // the row first (bypassing that RLS gap), the gate then runs on its
  // salon_id, and only a genuinely missing row returns 404. Same admin
  // client is reused below for the money write.
  const admin = createAdminSupabaseClient();
  const { data: purchase } = await admin
    .from("retail_purchases")
    .select("id, salon_id, salons(owner_id)")
    .eq("id", purchaseId)
    .single();

  if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (finance, this touches money, not catalog) instead
  // of the old owner-only compare, gated after this row lookup with its
  // salon_id. The owner path is unchanged: same owner_id === user.id
  // comparison, just made inside the shared gate.
  const access = await requireSalonAccess(purchase.salon_id, "finance");
  if (access instanceof NextResponse) return access;

  try {
    const result = await issuePurchaseRefund({
      db: admin,
      source: "retail",
      id: purchaseId,
      amountCents: amount,
      actor: "salon",
      reason,
    });

    await notifyPurchaseRefundProcessed(
      admin,
      { userId: result.userId, salonId: result.salonId, amountCents: amount, itemLabel: "Produkt" },
      "retail-refund",
    ).catch((err) => console.error("[retail-refund] notification failed:", err));

    return NextResponse.json({
      data: {
        purchase_id: purchaseId,
        refunded_amount: amount,
        total_refunded: result.totalRefundedCents,
        status: result.status,
      },
    });
  } catch (e) {
    console.error("[retail-refund] issuePurchaseRefund failed:", e);
    await reportError("retail-refund", e, { purchaseId, amount });
    if (e instanceof PurchaseRefundError) {
      const status =
        e.code === "PURCHASE_NOT_FOUND" ? 404
        : e.code === "STRIPE_FAILED" || e.code === "CONCURRENT_RETRY" ? 500
        : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}
