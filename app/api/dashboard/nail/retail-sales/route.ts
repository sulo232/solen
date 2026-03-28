export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase";

// GET /api/dashboard/nail/retail-sales?salon_id=...
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const salonId = searchParams.get("salon_id");
  if (!salonId) return NextResponse.json({ error: "salon_id required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminSupabaseClient();
  const { data: salon } = await admin.from("salons").select("owner_id").eq("id", salonId).single();
  const { data: profile } = await admin.from("profiles").select("role").eq("id", session.user.id).single();
  if (salon?.owner_id !== session.user.id && profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch retail_sales joined with products for last 8 weeks
  const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const { data: sales } = await admin
    .from("retail_sales")
    .select("id, quantity, unit_price, sale_date, product_id")
    .eq("salon_id", salonId)
    .gte("sale_date", eightWeeksAgo);

  const allSales = sales ?? [];
  const totalRevenue = allSales.reduce((s, r) => s + (r.quantity * r.unit_price), 0);
  const totalUnits = allSales.reduce((s, r) => s + r.quantity, 0);
  const avgSale = allSales.length > 0 ? Math.round(totalRevenue / allSales.length) : 0;

  // Top products
  const productMap = new Map<string, { units: number; revenue: number }>();
  for (const s of allSales) {
    const existing = productMap.get(s.product_id) ?? { units: 0, revenue: 0 };
    productMap.set(s.product_id, {
      units: existing.units + s.quantity,
      revenue: existing.revenue + s.quantity * s.unit_price,
    });
  }
  const topProductIds = [...productMap.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([id]) => id);

  let topProducts: { name: string; units: number; revenue: number }[] = [];
  if (topProductIds.length > 0) {
    const { data: products } = await admin
      .from("nail_retail_products")
      .select("id, name")
      .in("id", topProductIds);
    topProducts = topProductIds.map((id) => ({
      name: products?.find((p) => p.id === id)?.name ?? "Product",
      ...(productMap.get(id) ?? { units: 0, revenue: 0 }),
    }));
  }

  // Weekly breakdown
  const now = new Date();
  const weeklyMap = new Map<string, number>();
  for (let w = 7; w >= 0; w--) {
    const d = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const key = `KW${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`;
    weeklyMap.set(key, 0);
  }
  for (const s of allSales) {
    const d = new Date(s.sale_date);
    const key = `KW${Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7)}`;
    if (weeklyMap.has(key)) {
      weeklyMap.set(key, (weeklyMap.get(key) ?? 0) + s.quantity * s.unit_price);
    }
  }
  const weekly = [...weeklyMap.entries()].map(([week, revenue]) => ({ week, revenue }));

  return NextResponse.json({
    kpis: {
      total_revenue: totalRevenue,
      total_units: totalUnits,
      avg_sale: avgSale,
      top_product: topProducts[0]?.name ?? null,
    },
    weekly,
    top_products: topProducts,
  });
}
