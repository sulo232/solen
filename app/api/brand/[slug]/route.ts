export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = createAdminSupabaseClient();

  // Fetch group by slug
  const { data: group, error } = await supabase
    .from("salon_groups")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !group) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch salons in this group. avg_price is not a column, it's computed from
  // services(price), same pattern as app/api/profile/favorites/route.ts.
  const { data: salons } = await supabase
    .from("salons")
    .select("id, name, slug, cover_photo_url, categories, quartier, average_rating, review_count, last_minute_discount_percent, services(price)")
    .eq("group_id", group.id)
    .eq("is_active", true)
    .order("average_rating", { ascending: false });

  const salonsWithAvgPrice = (salons ?? []).map((salon: any) => {
    const services = salon.services as { price: number }[] | null;
    const prices = (services ?? []).map((s) => s.price).filter((p) => typeof p === "number" && p > 0);
    const avg_price = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
    const { services: _s, ...rest } = salon;
    return { ...rest, avg_price };
  });

  return NextResponse.json({ group, salons: salonsWithAvgPrice });
}
