export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { validateBody, adminPurchaseRefundSchema } from "@/lib/validations";
import {
  issuePurchaseRefund,
  PurchaseRefundError,
  resolvePackageRefundAmount,
} from "@/lib/purchases/issue-purchase-refund";
import { notifyPurchaseRefundProcessed } from "@/lib/purchases/notify-purchase-refund";
import { logAuditEvent } from "@/lib/audit";
import { reportError } from "@/lib/error-report";

// POST /api/admin/purchase-refund — Admin-triggered package OR retail refund.
// Source-agnostic (body carries source + id). Mirrors the admin freeze route auth
// (profiles.role === 'admin' on the request client, adminLimiter); the money write
// runs through issuePurchaseRefund on the service-role client. Pro-rata is packages-only.
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminPurchaseRefundSchema, body);
  if (validationError) return NextResponse.json({ error: validationError.message }, { status: 400 });
  const { source, id, amount, mode, reason } = validated;

  if (source === "retail" && mode === "prorata") {
    return NextResponse.json({ error: "Retail purchases support full/partial refunds only", code: "INVALID_AMOUNT" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();

  // Resolve the Rappen amount. For packages this handles pro-rata via the shared
  // resolver (reads the persisted sessions + paid). For retail, amount is required.
  let amountCents: number;
  if (source === "package") {
    const { data: pkg } = await admin
      .from("package_purchases")
      .select("paid_amount, refunded_amount, sessions_total, sessions_used")
      .eq("id", id)
      .maybeSingle();
    if (!pkg) return NextResponse.json({ error: "Purchase not found", code: "PURCHASE_NOT_FOUND" }, { status: 404 });
    const resolved = resolvePackageRefundAmount({
      mode,
      amount,
      paid: (pkg.paid_amount as number | null) ?? 0,
      alreadyRefunded: (pkg.refunded_amount as number | null) ?? 0,
      sessionsTotal: (pkg.sessions_total as number | null) ?? 0,
      sessionsUsed: (pkg.sessions_used as number | null) ?? 0,
    });
    if (!resolved.ok) return NextResponse.json({ error: resolved.message, code: resolved.code }, { status: 400 });
    amountCents = resolved.amountCents;
  } else {
    if (typeof amount !== "number") {
      return NextResponse.json({ error: "amount is required", code: "INVALID_AMOUNT" }, { status: 400 });
    }
    amountCents = amount;
  }

  try {
    const result = await issuePurchaseRefund({
      db: admin,
      source,
      id,
      amountCents,
      actor: "admin",
      reason,
    });

    await notifyPurchaseRefundProcessed(
      admin,
      { userId: result.userId, salonId: result.salonId, amountCents, itemLabel: source === "package" ? "Paket" : "Produkt" },
      `admin-${source}-refund`,
    ).catch((err) => console.error(`[admin-${source}-refund] notification failed:`, err));

    await logAuditEvent(req, user.id, "purchase.refund", source, id, {
      amount_cents: amountCents,
      total_refunded: result.totalRefundedCents,
      status: result.status,
      reason,
    });

    return NextResponse.json({
      data: {
        source,
        purchase_id: id,
        refunded_amount: amountCents,
        total_refunded: result.totalRefundedCents,
        status: result.status,
      },
    });
  } catch (e) {
    console.error(`[admin-${source}-refund] issuePurchaseRefund failed:`, e);
    await reportError(`admin-${source}-refund`, e, { id, amountCents });
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
