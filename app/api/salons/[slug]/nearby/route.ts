export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Get the current salon to find nearby ones
  const { data: salon, error: salonErr } = await supabase
    .from("salons")
    .select("id, latitude, longitude, categories, quartier")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (salonErr || !salon) {
    return NextResponse.json({ items: [] });
  }

  // Find nearby salons with same category, ordered by distance
  // Using Euclidean approximation (good enough for city-level)
  const { data: nearby } = await supabase
    .from("salons")
    .select("id, name, slug, cover_photo_url, categories, quartier, average_rating, review_count, latitude, longitude, opening_hours, last_minute_discount_percent")
    .eq("is_active", true)
    .neq("id", salon.id)
    .overlaps("categories", salon.categories)
    .limit(4);

  if (!nearby || nearby.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // Calculate distance and add min_price
  const enriched = await Promise.all(
    nearby.map(async (s) => {
      // Euclidean distance approximation in km (Basel area ~ lat 47.5)
      const dLat = (s.latitude - salon.latitude) * 111.32;
      const dLon = (s.longitude - salon.longitude) * 111.32 * Math.cos(salon.latitude * Math.PI / 180);
      const distance_km = Math.round(Math.sqrt(dLat * dLat + dLon * dLon) * 10) / 10;

      // Get min price
      const { data: svcData } = await supabase
        .from("services")
        .select("price")
        .eq("salon_id", s.id)
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(1);

      return {
        ...s,
        distance_km,
        min_price: svcData?.[0]?.price ?? null,
      };
    })
  );

  // Sort by distance
  enriched.sort((a, b) => a.distance_km - b.distance_km);

  return NextResponse.json({ items: enriched });
}
