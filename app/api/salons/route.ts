import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generalLimiter, applyRateLimit, getClientIp } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(request) });
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const quartier = searchParams.get("quartier");
  const min_price = searchParams.get("min_price");
  const max_price = searchParams.get("max_price");
  const min_rating = searchParams.get("min_rating");
  const accepts_payment = searchParams.get("accepts_payment");
  const sort = searchParams.get("sort") ?? "rating";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const offset = (page - 1) * limit;

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("salons")
    .select("*, services(price)", { count: "exact" })
    .eq("is_active", true);

  if (category) query = query.contains("categories", [category]);
  if (quartier) query = query.eq("quartier", quartier);
  if (min_rating) query = query.gte("average_rating", parseFloat(min_rating));
  if (accepts_payment === "true") query = query.eq("accepts_online_payment", true);

  // Price filtering requires joining services — use subquery via RPC or filter post-fetch
  // For V1, we skip price filter on the salons level (services are filtered client-side)

  if (sort === "rating") query = query.order("average_rating", { ascending: false });
  else if (sort === "price") query = query.order("created_at", { ascending: true });
  else query = query.order("average_rating", { ascending: false });

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    console.error("[api/salons]", error.message);
    return NextResponse.json({ items: [], total: 0, page, limit });
  }

  // Compute avg_price from joined services, then strip services from response
  const items = (data ?? []).map((salon: Record<string, unknown>) => {
    const services = salon.services as { price: number }[] | null;
    const prices = (services ?? []).map((s) => s.price).filter((p) => typeof p === "number" && p > 0);
    const avg_price = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { services: _services, ...rest } = salon;
    return { ...rest, avg_price };
  });

  return NextResponse.json({ items, total: count ?? 0, page, limit });
}
