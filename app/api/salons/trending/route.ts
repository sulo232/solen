export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("v_trending_salons")
    .select("salon_id")
    .order("trending_score", { ascending: false })
    .limit(50); // Fetch more to filter post-fetch

  if (error || !data || data.length === 0) return NextResponse.json({ items: [] });

  
  const ids = data.map(r => r.salon_id);

  let sQuery = supabase
    .from("salons")
    .select("*, services(price)")
    .in("id", ids)
    .eq("is_active", true);
    
  if (city) {
    const { data: cData } = await supabase.from("cities").select("id").eq("slug", city).single();
    if (cData?.id) sQuery = sQuery.eq("city_id", cData.id);
  }

  const { data: salons, error: sErr } = await sQuery;

  if (sErr || !salons) return NextResponse.json({ items: [] });

  // Limit back to 8 max after filtering
  const items = salons.map((salon: any) => {
      const services = salon.services as { price: number }[] | null;
      const prices = (services ?? []).map((s) => s.price).filter((p) => typeof p === "number" && p > 0);
      const avg_price = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
      const { services: _s, ...rest } = salon;
      return { ...rest, avg_price };
  }).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    .slice(0, 8);

  return NextResponse.json({ items });
}
