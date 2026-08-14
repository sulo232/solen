// exists-check: net-new vs app/api/admin/salons/[id]/freeze/route.ts, app/api/admin/commission/route.ts
// (npm run exists "payment-mode" and "payment_mode_admin" both empty for a route). This route
// copies the freeze route's admin-auth shape and the commission route's validate+update+audit
// shape verbatim; no existing admin-salons sub-route covers payment_mode_admin/enforced.
export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { logAuditEvent } from "@/lib/audit";
import { validateBody, adminPaymentModeOverrideSchema } from "@/lib/validations";

// PATCH /api/admin/salons/[id]/payment-mode: admin override + enforce lock for a
// salon's payment mode. Owner model (2026-07-20): the salon chooses its own
// payment_mode; admin can override it via payment_mode_admin, and payment_mode_enforced
// decides whether that override actually wins (see lib/bookings/payment-mode.ts
// effectivePaymentMode, the one place that resolves the tuple).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ message: "Forbidden", code: "FORBIDDEN" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const body = await req.json();
  const { data: validated, error: validationError } = validateBody(adminPaymentModeOverrideSchema, body);
  if (validationError) {
    return NextResponse.json({ message: validationError.message, code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: salon, error: fetchErr } = await admin
    .from("salons")
    .select("id, name, payment_mode")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr || !salon) return NextResponse.json({ message: "Salon not found", code: "NOT_FOUND" }, { status: 404 });

  // Defensive: enforcing a lock with no admin-chosen mode AND no salon-chosen mode to
  // fall back to would leave effectivePaymentMode() with nothing real to resolve to.
  if (validated.payment_mode_enforced && !validated.payment_mode_admin && !salon.payment_mode) {
    return NextResponse.json({ message: "Cannot enforce without an admin payment mode or an existing salon payment mode to fall back to", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const { error } = await admin
    .from("salons")
    .update({
      payment_mode_admin: validated.payment_mode_admin,
      payment_mode_enforced: validated.payment_mode_enforced,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  await logAuditEvent(
    req,
    user.id,
    "salon.payment_mode_override",
    "salon",
    id,
    {
      salon_name: salon.name,
      payment_mode_admin: validated.payment_mode_admin,
      payment_mode_enforced: validated.payment_mode_enforced,
    }
  );

  return NextResponse.json({
    ok: true,
    payment_mode_admin: validated.payment_mode_admin,
    payment_mode_enforced: validated.payment_mode_enforced,
  });
}
