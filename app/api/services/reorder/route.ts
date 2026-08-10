export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter } from "@/lib/ratelimit";
import { validateBody, servicesReorderSchema } from "@/lib/validations";

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

  // Verify ownership
  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin.from("salons").select("id, owner_id").eq("id", salon_id).single();
  if (!salon) return NextResponse.json({ error: "Salon not found" }, { status: 404 });
  if (salon.owner_id !== user.id) {
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Batch update sort_order — throttled as a single RPC-style call
  const updates = order.map((item) =>
    admin.from("services").update({ sort_order: item.sort_order }).eq("id", item.id).eq("salon_id", salon_id)
  );

  await Promise.all(updates);
  return NextResponse.json({ success: true });
}
