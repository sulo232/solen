export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ items: [], total: 0, page: 1, limit: 20 });
  }

  const supabase = await createServerSupabaseClient();

  // Full-text search across salon name + description
  const { data: salonResults, error } = await supabase
    .from("salons")
    .select("*")
    .eq("is_active", true)
    .or(`name.ilike.%${q}%,description_de.ilike.%${q}%,description_en.ilike.%${q}%`)
    .limit(20);

  if (error) return NextResponse.json({ message: error.message, code: "DB_ERROR" }, { status: 500 });

  // Also search services and staff specialties — get matching salon IDs
  const [serviceRes, staffRes] = await Promise.all([
    supabase
      .from("services")
      .select("salon_id")
      .eq("is_active", true)
      .or(`name_de.ilike.%${q}%,name_en.ilike.%${q}%`),
    supabase
      .from("staff_members")
      .select("salon_id")
      .eq("is_active", true)
      .ilike("name", `%${q}%`),
  ]);

  const extraSalonIds = [
    ...(serviceRes.data ?? []).map((r) => r.salon_id),
    ...(staffRes.data ?? []).map((r) => r.salon_id),
  ].filter((id) => !salonResults?.find((s) => s.id === id));

  let extraSalons: typeof salonResults = [];
  if (extraSalonIds.length > 0) {
    const { data } = await supabase
      .from("salons")
      .select("*")
      .eq("is_active", true)
      .in("id", [...new Set(extraSalonIds)]);
    extraSalons = data ?? [];
  }

  const results = [...(salonResults ?? []), ...extraSalons];
  return NextResponse.json({ items: results, total: results.length, page: 1, limit: 20 });
}
