export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("v_trending_salons")
    .select("salon_id")
    .order("trending_score", { ascending: false })
    .limit(8);

  if (error || !data || data.length === 0) return NextResponse.json({ items: [] });
  
  const ids = data.map(r => r.salon_id);

  const { data: salons, error: sErr } = await supabase
    .from("salons")
    .select("*, services(price)")
    .in("id", ids)
    .eq("is_active", true);

  if (sErr || !salons) return NextResponse.json({ items: [] });

  const items = salons.map((salon: any) => {
      const services = salon.services as { price: number }[] | null;
      const prices = (services ?? []).map((s) => s.price).filter((p) => typeof p === "number" && p > 0);
      const avg_price = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { services: _s, ...rest } = salon;
      return { ...rest, avg_price };
  }).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));

  return NextResponse.json({ items });
}
