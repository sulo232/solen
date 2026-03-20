import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { applyRateLimit, discoveryFeedLimiter, getClientIp } from "@/lib/ratelimit";
import { checkFeatureEnabled } from "@/lib/feature-flags";

export async function GET(req: NextRequest) {
  const disabled = await checkFeatureEnabled("discovery");
  if (disabled) return disabled;

  const rateLimited = await applyRateLimit(discoveryFeedLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const styleName = searchParams.get("style");

  if (!category) {
    return NextResponse.json({ error: "category required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Find salons that offer services in this category
  let query = supabase
    .from("salons")
    .select(`
      id, name, slug, average_rating, review_count, quartier,
      services!inner(id, name_de, name_en, category, price, duration_minutes)
    `)
    .eq("is_active", true)
    .eq("services.is_active", true)
    .eq("services.category", category)
    .order("average_rating", { ascending: false })
    .limit(10);

  const { data: salons, error } = await query;

  if (error) {
    console.error("[salons-for-style] Query error:", error);
    return NextResponse.json({ error: "Failed to find salons" }, { status: 500 });
  }

  // Extract price ranges per salon
  const results = (salons ?? []).map((salon) => {
    const services = (salon as Record<string, unknown>).services as { price: number; name_de: string; name_en: string; duration_minutes: number }[];
    const prices = services.map((s) => s.price).filter(Boolean);
    return {
      id: salon.id,
      name: salon.name,
      slug: salon.slug,
      average_rating: salon.average_rating,
      review_count: salon.review_count,
      quartier: salon.quartier,
      price_min: prices.length > 0 ? Math.min(...prices) : null,
      price_max: prices.length > 0 ? Math.max(...prices) : null,
      service_count: services.length,
    };
  });

  return NextResponse.json({ salons: results });
}
