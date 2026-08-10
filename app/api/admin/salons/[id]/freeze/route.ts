import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { cancelAndRefundSalonBookings } from "@/lib/bookings/suspend-salon";
import { logAuditEvent } from "@/lib/audit";
import { validateBody, adminSalonActionReasonSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const rawBody = await req.json().catch(() => ({}));
  const { data: validated, error: valError } = validateBody(adminSalonActionReasonSchema, rawBody);
  if (valError) {
    return NextResponse.json({ error: "Reason is required", message: valError.message }, { status: 400 });
  }
  const body = { reason: validated.reason };

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rateLimited = await applyRateLimit(adminLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const admin = createAdminSupabaseClient();

  const { data: salon, error: fetchErr } = await admin
    .from("salons").select("name").eq("id", id).single();
  if (fetchErr || !salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });

  const updateData = {
    frozen_at: new Date().toISOString(),
    frozen_reason: body.reason,
    // Freezing MUST take the salon dark. Before 2026-07-27 this route wrote only
    // frozen_at/frozen_reason, and frozen_at is read in exactly three places: an owner
    // banner on the settings page, the solen-score recalculation, and lib/salon-detail.ts
    // (which fetches it only to STRIP it for non-owners at :148). It gates nothing. The
    // customer-visibility gate is is_active (lib/salon-detail.ts:73 returns null without
    // it) plus listed_on_marketplace in the ~15 listing queries. So a "frozen" salon kept
    // its PDP live, kept appearing in search, and kept taking new bookings , this route
    // cancelled the bookings that existed at that instant and then let fresh ones arrive.
    is_active: false,
  };

  const { error } = await admin.from("salons").update(updateData).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Cancel + refund every live booking, via the shared helper so the third-strike
  // auto-freeze in warn/route.ts runs the identical path (council security lens,
  // 2026-07-27: warn deactivated the salon but skipped this, orphaning paid bookings).
  const suspendResult = await cancelAndRefundSalonBookings(admin, id, body.reason, "freeze");

  await admin.from("account_actions").insert({
    salon_id: id,
    action_type: 'suspension',
    reason: body.reason,
    admin_id: user.id,
  });

  await logAuditEvent(req, user.id, "salon.freeze", "salon", id, { salon_name: salon.name, ...suspendResult });

  return NextResponse.json({ ok: true });
}
