export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  // Rate limit (public route, IP-based)
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ services: [], salons: [] });
  }

  // Cap query length to prevent abuse
  const query = q.slice(0, 100);
  const pattern = `%${query}%`;

  const supabase = await createServerSupabaseClient();

  // Fetch matching services (limit 5)
  const { data: services } = await supabase
    .from("services")
    .select("id, name_de, name_en, category, price")
    .or(`name_de.ilike.${pattern},name_en.ilike.${pattern}`)
    .eq("is_active", true)
    .limit(5);

  // Fetch matching salons (limit 3)
  const { data: salons } = await supabase
    .from("salons")
    .select("id, name, slug, quartier, average_rating, cover_image")
    .ilike("name", pattern)
    .eq("is_active", true)
    .limit(3);

  return NextResponse.json({
    services: services ?? [],
    salons: salons ?? [],
  });
}
