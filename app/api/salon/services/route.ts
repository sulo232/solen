export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { requireSalonAccess } from "@/lib/auth/require";

// GET: list services for a salon (for dropdowns like package manager)
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) {
    return NextResponse.json({ error: "salon_id is required" }, { status: 400 });
  }

  // P9-2: requireSalonAccess composes the owner check with the staff
  // area-permission check (catalog = services & pricing) instead of the old
  // owner-only compare, so a staff member granted "catalog" can reach this
  // route too. The owner path is unchanged: same owner_id === user.id
  // comparison, just made inside the shared gate.
  const accessResult = await requireSalonAccess(salonId, "catalog");
  if (accessResult instanceof NextResponse) return accessResult;
  const { user } = accessResult;

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  const management = req.nextUrl.searchParams.get("mode") === "management";
  let query = createAdminSupabaseClient()
    .from("services")
    .select("id, name:name_de, salon_id, name_de, name_en, name_fr, name_it, description_de, description_en, category, duration_minutes, price, is_active, buffer_minutes, processing_minutes, finishing_minutes, suitable_for, suitable_gender, photo_urls, sort_order, created_at")
    .eq("salon_id", salonId);
  if (!management) query = query.eq("is_active", true);
  const { data: services, error } = await query
    .order(management ? "sort_order" : "name_de", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return both formats for backward compatibility
  return NextResponse.json({
    services: services ?? [],
    items: services?.map(s => ({
      id: s.id,
      name_de: s.name_de,
      name_en: s.name_en,
      duration_minutes: s.duration_minutes,
      base_price: s.price
    })) ?? []
  });
}
