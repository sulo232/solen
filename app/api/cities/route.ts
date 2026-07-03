// PUBLIC city list , DB `cities WHERE is_active` is the single source of truth
// (2026-07-04 city-rollout refactor). This is what client nav (MobileMenu,
// DesktopCitySelector, CityTopBar, Header's MobileCityChip, SearchTemplate)
// must fetch instead of the old hardcoded CITY_SLUGS/CITIES constants, so the
// admin Staedte toggle (app/api/admin/cities) actually adds/removes a city
// everywhere without a rebuild. Response includes the localized name fields
// + display_order so nav can render without a second round-trip.
export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const supabase = await createServerSupabaseClient();

  const { data: citiesData, error } = await supabase
    .from("cities")
    .select("id, slug, name_de, name_en, name_fr, name_it, display_order, latitude, longitude, radius_km")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[api/cities] failed to load active cities:", error.message);
    return NextResponse.json({ items: [] }, { status: 500 });
  }

  const active = citiesData ?? [];

  const { data: salons } = await supabase
    .from("salons")
    .select("city_id, categories")
    .eq("is_active", true);

  const items = active.map((c) => {
    const citySalons = salons?.filter((s) => s.city_id === c.id) || [];
    const categories = new Set<string>();
    for (const s of citySalons) {
      if (Array.isArray(s.categories)) {
        s.categories.forEach((cat: string) => categories.add(cat));
      }
    }

    return {
      city: c.slug,
      slug: c.slug,
      name: c.name_de,
      name_de: c.name_de,
      name_en: c.name_en,
      name_fr: c.name_fr,
      name_it: c.name_it,
      display_order: c.display_order,
      latitude: c.latitude,
      longitude: c.longitude,
      radius_km: c.radius_km,
      categories: Array.from(categories),
      salon_count: citySalons.length,
    };
  });

  return NextResponse.json({ items });
}
