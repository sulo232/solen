export const dynamic = "force-dynamic";
export const runtime = "edge";
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
  const category = req.nextUrl.searchParams.get("category");
  const citySlug = req.nextUrl.searchParams.get("city");

  const supabase = await createServerSupabaseClient();

  let cityId: string | undefined;
  if (citySlug) {
    const { data: cityRecord } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", citySlug)
      .single();
    if (cityRecord) {
      cityId = cityRecord.id;
    }
  }

  // Fetch matching services (limit 5), optionally scoped by category
  let servicesQuery = supabase
    .from("services")
    .select("id, name_de, name_en, category, price, salons!inner(city_id)")
    .or(`name_de.ilike.${pattern},name_en.ilike.${pattern}`)
    .eq("is_active", true);

  if (category) {
    servicesQuery = servicesQuery.eq("category", category);
  }
  if (cityId) {
    servicesQuery = servicesQuery.eq("salons.city_id", cityId);
  }

  const { data: rawServices } = await servicesQuery.limit(5);

  // Map out the nested salons relation if it exists
  const services = rawServices?.map((s) => {
    const { salons, ...rest } = s as any;
    return rest;
  }) ?? [];

  // Fetch matching salons (limit 3), optionally scoped by category
  let salonsQuery = supabase
    .from("salons")
    // V3-D413: column is cover_photo_url (cover_image never existed → this query silently errored and returned
    // zero salons). Fixed + aliased back to cover_image below so any existing consumer of this shape is unaffected.
    .select("id, name, slug, average_rating, cover_photo_url")
    .ilike("name", pattern)
    .eq("is_active", true);

  if (category) {
    salonsQuery = salonsQuery.contains("categories", [category]);
  }
  if (cityId) {
    salonsQuery = salonsQuery.eq("city_id", cityId);
  }

  const { data: salons, error: salonsErr } = await salonsQuery.limit(3);
  if (salonsErr) console.error("[search/suggest] salons query failed:", salonsErr);

  return NextResponse.json({
    services: services ?? [],
    // Alias cover_photo_url → cover_image to preserve this route's documented response shape.
    salons: (salons ?? []).map((s: Record<string, any>) => ({ ...s, cover_image: s.cover_photo_url ?? null })),
  });
}
