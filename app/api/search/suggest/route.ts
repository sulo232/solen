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
  const category = req.nextUrl.searchParams.get("category");
  const citySlug = req.nextUrl.searchParams.get("city");

  const supabase = await createServerSupabaseClient();

  let cityId: string | null = null;
  if (citySlug) {
    const { data: cityRecord } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", citySlug)
      .single();
    if (cityRecord) cityId = cityRecord.id;
  }

  // Smart Search suggest (Phase 1): FTS + trigram (typo + as-you-type prefix) +
  // one-way synonyms (incl. fr/it), city/category scoped, gated, ranked. Returns
  // the same { services[≤5], salons[≤3] } shape (cover_image alias preserved).
  const { data, error } = await supabase.rpc("search_suggest", {
    p_q: query,
    p_city_id: cityId ?? undefined,
    p_category: category ?? undefined,
  });
  if (error) {
    console.error("[search/suggest] search_suggest failed:", error.message);
    return NextResponse.json({ services: [], salons: [] });
  }

  return NextResponse.json(data ?? { services: [], salons: [] });
}
