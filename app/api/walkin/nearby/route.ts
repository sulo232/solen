export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { checkFeatureEnabled } from "@/lib/feature-flags";
import { applyRateLimit, generalLimiter, getClientIp } from "@/lib/ratelimit";
import { getWalkinAvailability } from "@/lib/barber/walkin-availability";

export type WalkinNearbySalon = {
  id: string;
  slug: string;
  name: string;
  rating: number;
  reviewCount: number;
  address: string;
  waitMinutes: number;
  waitMinutesMax: number;
  queueLength: number;
};

// GET /api/walkin/nearby?city=<slug>&limit=<n> — Public.
// Top walk-in-enabled salons (by rating) WITH their live wait/queue, in one call.
// Powers the homepage Walk-in band. Returns { salons: [] } (band hides) when the
// barber feature is off or no walk-in salons exist. No geolocation: ordered by
// rating, not distance — the card meta shows the real street address, never a
// fabricated distance.
export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("barber_features");
  if (disabled) return NextResponse.json({ salons: [] });

  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const limitParam = parseInt(req.nextUrl.searchParams.get("limit") ?? "6", 10);
  const limit = Math.min(Math.max(isNaN(limitParam) ? 6 : limitParam, 1), 12);
  const citySlug = req.nextUrl.searchParams.get("city")?.trim().toLowerCase();

  const admin = createAdminSupabaseClient();

  let cityId: string | undefined;
  if (citySlug) {
    const { data: city } = await admin.from("cities").select("id").eq("slug", citySlug).single();
    if (city) cityId = city.id;
  }

  let query = admin
    .from("salons")
    .select("id, slug, name, address, average_rating, review_count")
    .eq("walkin_enabled", true)
    .eq("is_active", true)
    .eq("listed_on_marketplace", true)
    .order("average_rating", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(limit);
  if (cityId) query = query.eq("city_id", cityId);

  const { data: salons, error } = await query;
  if (error) {
    console.error("[walkin/nearby] salon query failed:", error);
    return NextResponse.json({ salons: [] });
  }
  if (!salons || salons.length === 0) return NextResponse.json({ salons: [] });

  const availability = await getWalkinAvailability(admin, salons.map((s) => s.id));

  // Only keep salons that resolved availability (i.e. still walk-in-enabled).
  const out: WalkinNearbySalon[] = [];
  for (const s of salons) {
    const a = availability[s.id];
    if (!a) continue;
    out.push({
      id: s.id,
      slug: s.slug,
      name: s.name,
      rating: s.average_rating ?? 0,
      reviewCount: s.review_count ?? 0,
      address: s.address ?? "",
      waitMinutes: a.waitMinutes,
      waitMinutesMax: a.waitMinutesMax,
      queueLength: a.queueLength,
    });
  }

  return NextResponse.json({ salons: out });
}
