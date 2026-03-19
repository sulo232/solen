export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();

  // Get distinct cities from salon addresses (extract city from address)
  // In Basel area, quartier serves as the location identifier
  const { data: salons } = await supabase
    .from("salons")
    .select("quartier, categories")
    .eq("is_active", true);

  if (!salons || salons.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Build city-category matrix
  const cityMap = new Map<string, Set<string>>();
  for (const s of salons) {
    const city = "basel"; // All salons are in Basel area
    if (!cityMap.has(city)) cityMap.set(city, new Set());
    for (const cat of s.categories) {
      cityMap.get(city)!.add(cat);
    }
  }

  const items = Array.from(cityMap.entries()).map(([city, categories]) => ({
    city,
    categories: Array.from(categories),
    salon_count: salons.length,
  }));

  return NextResponse.json({ items });
}
