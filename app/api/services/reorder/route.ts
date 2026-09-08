export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, servicesReorderSchema } from "@/lib/validations";
import { requireSalonAccess } from "@/lib/auth/require";

// PATCH /api/services/reorder — Bulk update sort_order for services
export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await applyRateLimit(generalLimiter, { userId: user.id });
  if (rateLimited) return rateLimited;

  const rawBody = await req.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(servicesReorderSchema, rawBody);
  if (validationError) {
    return NextResponse.json({ error: "salon_id and order[] required" }, { status: 400 });
  }
  const { salon_id, order } = validated;

  // G22: requireSalonAccess composes the owner check with the staff
  // area-permission check (catalog) instead of the old owner-or-admin compare.
  const access = await requireSalonAccess(salon_id, "catalog");
  if (access instanceof NextResponse) return access;

  const admin = createAdminSupabaseClient();

  // Batch update sort_order — throttled as a single RPC-style call
  const updates = order.map((item) =>
    admin.from("services").update({ sort_order: item.sort_order }).eq("id", item.id).eq("salon_id", salon_id)
  );

  await Promise.all(updates);
  return NextResponse.json({ success: true });
}
