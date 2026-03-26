export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

import { CITY_SLUGS, CITIES } from "@/lib/cities";

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();

  const { data: salons } = await supabase
    .from("salons")
    .select("city_id, categories")
    .eq("is_active", true);

  const { data: citiesData } = await supabase.from("cities").select("id, slug");

  const items = CITY_SLUGS.map((slug) => {
    const c = CITIES[slug];
    const cId = citiesData?.find(cd => cd.slug === slug)?.id;
    const citySalons = salons?.filter((s) => s.city_id === cId) || [];
    const categories = new Set<string>();
    for (const s of citySalons) {
      if (Array.isArray(s.categories)) {
        s.categories.forEach((cat: string) => categories.add(cat));
      }
    }

    return {
      city: slug,
      name: c.name_de,
      categories: Array.from(categories),
      salon_count: citySalons.length,
    };
  });

  return NextResponse.json({ items });
}
