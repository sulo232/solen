export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { checkUserBanned } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

// GET — list services for a salon (for dropdowns like package manager)
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const salonId = req.nextUrl.searchParams.get("salon_id");
  if (!salonId) {
    return NextResponse.json({ error: "salon_id is required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const banned = await checkUserBanned(user.id);
  if (banned) return banned;

  // Verify salon ownership (basic security for dashboard fetches)
  const { data: salon } = await supabase
    .from("salons")
    .select("id")
    .eq("id", salonId)
    .eq("owner_id", user.id)
    .single();

  if (!salon) {
    return NextResponse.json({ error: "Salon not found or not owned by user" }, { status: 403 });
  }

  const { data: services, error } = await supabase
    .from("services")
    .select("id, name, name_de, name_en, duration_minutes, price, is_active")
    .eq("salon_id", salonId)
    .eq("is_active", true)
    .order("name", { ascending: true });

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
