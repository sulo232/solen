export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, paymentLimiter } from "@/lib/ratelimit";
import { checkUserBanned } from "@/lib/feature-flags";
import { validateBody, purchaseRefundSchema } from "@/lib/validations";
import { issuePurchaseRefund, PurchaseRefundError } from "@/lib/purchases/issue-purchase-refund";
import { notifyPurchaseRefundProcessed } from "@/lib/purchases/notify-purchase-refund";

// POST /api/salon/retail/[id]/refund — Salon-triggered retail-purchase refund.
// Mirrors /api/bookings/[id]/refund auth. Retail is amount-only (full/partial);
// there is no sessions model, so `mode:"prorata"` is rejected.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: purchaseId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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

  // Ownership on the RLS request client; money write on the admin client inside the helper.
  const { data: purchase } = await supabase
    .from("retail_purchases")
    .select("id, salon_id, salons(owner_id)")
    .eq("id", purchaseId)
    .single();

  if (!purchase) return NextResponse.json({ error: "Purchase not found" }, { status: 404 });

  const salonOwner = (purchase.salons as unknown as { owner_id: string })?.owner_id;
  if (salonOwner !== user.id) {
    return NextResponse.json({ error: "Only salon owners can issue refunds" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
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
