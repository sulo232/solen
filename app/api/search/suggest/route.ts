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

  const payload = (data ?? { services: [], salons: [] }) as { services?: { id: string }[]; salons?: unknown[] };

  // search_suggest only ever selects name_de/name_en for services
  // (supabase/migrations/20260701140000_search_suggest_treatment_from_price.sql:73-94), so a
  // fr/it customer got the German name from this endpoint. No migration needed: read the two
  // missing columns straight off `services` by id and merge them onto what the RPC returned.
  if (Array.isArray(payload.services) && payload.services.length > 0) {
    const serviceIds = payload.services.map((s) => s.id).filter(Boolean);
    if (serviceIds.length > 0) {
      const { data: labels } = await supabase
        .from("services")
        .select("id, name_fr, name_it")
        .in("id", serviceIds);
      const labelMap = new Map((labels ?? []).map((l) => [l.id, l]));
      payload.services = payload.services.map((s) => ({
        ...s,
        name_fr: labelMap.get(s.id)?.name_fr ?? null,
        name_it: labelMap.get(s.id)?.name_it ?? null,
      }));
    }
  }

  return NextResponse.json(payload);
}
